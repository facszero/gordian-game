extends RefCounted
## Centinela state machine ported from dist/src/boss.js; random is injectable.
static func create(config: Dictionary, defeated = false) -> Dictionary:
	if config.is_empty(): return {}
	var b = config.duplicate(true)
	b.merge({"homeX":b.x,"direction":-1,"moving":false,"walkDistance":0.0,"hp":0 if defeated else 180,"maxHp":180,"active":false,"dead":defeated,"state":"idle","timer":1.0,"cycle":0,"attack":"beam","targetX":0.0,"targetY":0.0,"hazards":[],"flash":0.0,"age":0.0,"bag":[],"rounds":0})
	return b

static func bounds(b: Dictionary) -> Rect2:
	return Rect2(b.x+100,b.floor-175,b.w-150,175)

static func hit(b: Dictionary, amount: float) -> bool:
	if b.is_empty() or not b.active or b.dead: return false
	b.hp = maxf(0,b.hp-amount)
	b.flash = 0.12
	if b.hp > 0: return false
	b.dead = true
	b.active = false
	b.moving = false
	b.rounds = 0
	b.hazards = []
	return true

static func volley(b: Dictionary) -> Dictionary:
	# Scalar floats retain the web's double precision for locked volley targets.
	var x = b.x+100
	var y = b.floor-110
	var dx = b.targetX-x
	var dy = b.targetY-y
	var length = sqrt(dx*dx+dy*dy)
	if length == 0: length = 1
	var speed = 420 if b.hp <= b.maxHp/2 else 350
	b.rounds -= 1
	return {"x":x,"y":y,"w":20,"h":16,"vx":dx/length*speed,"vy":dy/length*speed,"life":4.0,"friendly":false,"boss":true,"damage":20}

static func update(b: Dictionary, dt: float, player: Dictionary, random: Callable = randf) -> Array:
	if b.is_empty() or b.dead: return []
	b.flash = maxf(0,b.flash-dt)
	b.age += dt
	if not b.active:
		if player.x < b.trigger: return []
		b.active = true
		b.state = "recover"
		b.timer = 1.2
	var fast = b.hp <= b.maxHp/2
	b.moving = b.state != "attack"
	var previous_x = b.x
	if b.moving:
		var min_x = maxf(b.homeX-210,player.x+player.w+110)
		var max_x = b.homeX+50
		var next_x = b.x+b.direction*(90 if fast else 60)*dt
		if next_x < min_x:
			b.direction = 1
			b.x = maxf(b.x,minf(max_x,next_x))
		elif next_x > max_x:
			b.x = max_x
			b.direction = -1
		else: b.x = next_x
	b.walkDistance += b.x-previous_x
	b.moving = absf(b.x-previous_x)>0.001
	b.timer -= dt
	if b.timer > 0: return []
	if b.state == "recover":
		if b.bag.is_empty(): b.bag = ["beam","shell","wave","burst"]
		var choices = b.bag.filter(func(a): return a != b.attack)
		var pool = b.bag if choices.is_empty() else choices
		b.attack = pool[mini(pool.size()-1,floori(random.call()*pool.size()))]
		b.bag.erase(b.attack)
		b.cycle += 1
		b.state = "warning"
		b.timer = (0.75 if fast else 1.05)+random.call()*0.3
		b.targetX = clampf(player.x+player.w/2,b.left+85,b.x-100)
		b.targetY = player.y+player.h*0.5
		b.rounds = (3 if random.call()<0.5 else 4) if b.attack == "burst" else 0
		return []
	if b.state == "warning":
		b.state = "attack"
		b.timer = 0.55
		if b.attack == "beam": b.hazards = [{"x":b.left,"y":b.floor-118,"w":b.x-b.left+140,"h":16}]
		if b.attack == "shell": b.hazards = [{"x":b.targetX-75,"y":b.floor-210,"w":150,"h":210}]
		if b.attack == "wave": return [{"x":b.x+50,"y":b.floor-15,"w":46,"h":26,"vx":-340 if fast else -260,"vy":0,"life":5.0,"friendly":false,"boss":true,"damage":12}]
		if b.attack == "burst":
			b.timer = (0.2 if fast else 0.28)+random.call()*0.1
			return [volley(b)]
		return []
	if b.attack == "burst" and b.rounds > 0:
		b.timer = (0.2 if fast else 0.28)+random.call()*0.1
		return [volley(b)]
	b.hazards = []
	b.state = "recover"
	b.timer = (0.45 if fast else 0.7)+random.call()*0.75
	return []
