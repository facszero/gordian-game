extends RefCounted
## Coordinates and one-way platform collisions deliberately match the web game.
var level: Dictionary
var player: Dictionary
var enemies: Array = []
var pickups: Array = []
var shots: Array = []
var events: Array = []
var mode = "menu"
var before_pause = "play"
var lives = 4
var checkpoint = -1
var kills = 0
var cells = 0
var elapsed = 0.0
var clock = 0.0
var energy = 100.0
var invulnerable = 2.0
var camera = 0.0
var cooldown = 0.0
var charge_cooldown = 0.0
var previous_jump = false
var charge_latch = false
var air_jumps = 1
var jump_buffer = 0.0
var coyote = 0.0
var timer = 0.0
var companion: Dictionary = {}

func _init(data: Dictionary):
	level = data
	reset()
	mode = "menu"

func reset(saved: Dictionary = {}):
	lives = int(saved.get("lives",4))
	checkpoint = int(saved.get("checkpoint",-1))
	kills = int(saved.get("kills",0))
	cells = int(saved.get("cells",0))
	elapsed = float(saved.get("elapsed",0))
	clock = 0
	enemies = level.enemies.duplicate(true)
	var spawn = level.checkpoints[checkpoint] if checkpoint >= 0 else level.spawn
	for e in enemies:
		e.dead = e.id in saved.get("defeated",[]) or (checkpoint >= 0 and e.x < spawn.x-120)
		e.y = e.y if e.type == "drone" else e.y-e.h
		e.base_y = e.y
		e.timer = 1.0+e.id*0.13
		e.flash = 0.0
		# Convert integral JSON values before modifying fractional positions.
		e.x = float(e.x)
		e.y = float(e.y)
	pickups = level.pickups.duplicate(true)
	for i in pickups.size():
		pickups[i].taken = i in saved.get("collected",[])
	companion = level.companion.duplicate(true)
	companion.active = saved.is_empty()
	respawn()
	camera = maxf(0,player.x-330)
	mode = "intro" if saved.is_empty() else str(saved.get("stage","play"))
	timer = 0

func respawn():
	var spawn = level.checkpoints[checkpoint] if checkpoint >= 0 else level.spawn
	player = {"x":float(spawn.x),"y":float(spawn.y),"w":38.0,"h":90.0,"vx":0.0,"vy":0.0,"health":100.0,"grounded":false,"face":1,"crouching":false,"aim_up":false}
	energy = 100
	invulnerable = 2
	shots.clear()
	air_jumps = 1
	previous_jump = false
	charge_latch = false
	jump_buffer = 0
	coyote = 0
	cooldown = 0
	charge_cooldown = 0
	mode = "play"

func snapshot() -> Dictionary:
	var defeated = []
	var collected = []
	for e in enemies:
		if e.dead: defeated.append(e.id)
	for i in pickups.size():
		if pickups[i].taken: collected.append(i)
	var stage = before_pause if mode == "pause" else mode
	if stage not in ["transition","complete"]: stage = "play"
	return {"version":1,"level_id":1,"lives":lives,"checkpoint":checkpoint,"kills":kills,"cells":cells,"elapsed":elapsed,"defeated":defeated,"collected":collected,"stage":stage}

func pause():
	if mode in ["play","intro","transition","dead"]:
		before_pause = mode
		mode = "pause"

func resume():
	if mode == "pause": mode = before_pause

static func bounds(b: Dictionary) -> Rect2:
	return Rect2(b.x,b.y,b.w,b.h)

func stance(crouch: bool):
	var height = 48.0 if crouch and player.grounded else 90.0
	player.y += player.h-height
	player.h = height
	player.crouching = height < 90

func hurt(amount: float, projectile = false):
	if invulnerable > 0 or mode != "play": return
	if projectile and player.crouching: amount *= 0.25
	player.health = maxf(0,player.health-amount)
	invulnerable = 1.3
	events.append("hit")
	if player.health <= 0: lose_life()

func lose_life():
	if mode != "play": return
	lives = maxi(0,lives-1)
	mode = "dead"
	timer = 0
	events.append("save")

func fire(charged: bool):
	var up = player.aim_up
	var speed = 900.0 if charged else 780.0
	var length = 55.0 if charged else 24.0
	var thickness = 20.0 if charged else 7.0
	shots.append({"x":player.x+19+(0 if up else player.face*30),"y":player.y+(-10 if up else player.h/3 if player.crouching else player.h*28/90),"w":thickness if up else length,"h":length if up else thickness,"vx":0.0 if up else player.face*speed,"vy":-speed if up else 0.0,"friendly":true,"damage":4 if charged else 1,"life":1.2})
	cooldown = 0.17
	if charged:
		energy -= 35
		charge_cooldown = 0.65
	events.append("charge" if charged else "shot")

func update(dt: float, actions: Dictionary):
	events.clear()
	if mode in ["menu","pause","complete","game_over"]: return
	clock += dt
	if mode == "dead":
		timer += dt
		if timer >= 1.2:
			if lives > 0: respawn()
			else: mode = "game_over"
			events.append("save")
		return
	if mode == "transition":
		timer += dt
		if timer >= 11:
			mode = "complete"
			events.append("save")
		return
	update_companion(dt)
	if mode == "intro":
		timer += dt
		if timer >= 4: mode = "play"
		return
	elapsed += dt
	energy = minf(100,energy+dt*7)
	invulnerable = maxf(0,invulnerable-dt)
	cooldown -= dt
	charge_cooldown -= dt
	var jump = actions.get("jump",false)
	player.aim_up = actions.get("up",false)
	stance(actions.get("crouch",false))
	if player.grounded: air_jumps = 1
	if jump and not previous_jump: jump_buffer = 0.13
	previous_jump = jump
	jump_buffer -= dt
	coyote = 0.1 if player.grounded else coyote-dt
	player.vx = (int(actions.get("right",false))-int(actions.get("left",false)))*310.0*(0.4 if player.crouching else 1.0)
	if player.vx != 0: player.face = 1 if player.vx > 0 else -1
	if jump_buffer > 0 and (coyote > 0 or (air_jumps > 0 and player.vy != 0)):
		if coyote <= 0: air_jumps -= 1
		stance(false)
		player.vy = -740.0
		jump_buffer = 0
		coyote = 0
		player.grounded = false
		events.append("jump")
	if not jump and player.vy < -250: player.vy += level.gravity*dt*0.85
	player.vy = minf(1000,player.vy+level.gravity*dt)
	var previous_bottom = player.y+player.h
	player.x += player.vx*dt
	player.y += player.vy*dt
	player.grounded = false
	for p in level.platforms:
		if player.vy >= 0 and previous_bottom <= p.y+1 and player.y+player.h >= p.y and player.x+player.w > p.x and player.x < p.x+p.w:
			player.y = p.y-player.h
			player.vy = 0.0
			player.grounded = true
	player.x = clampf(player.x,0,level.width-player.w)
	if player.y > 810:
		lose_life()
		return
	if actions.get("fire",false) and cooldown <= 0: fire(false)
	var charge = actions.get("charge",false)
	if charge and not charge_latch and energy >= 35 and charge_cooldown <= 0: fire(true)
	charge_latch = charge
	for i in level.checkpoints.size():
		if player.x > level.checkpoints[i].x and checkpoint < i:
			checkpoint = i
			player.health = 100
			events.append("checkpoint")
			events.append("save")
	for p in pickups:
		if not p.taken and bounds(player).intersects(Rect2(p.x,p.y,24,24)):
			p.taken = true
			cells += 1
			player.health = minf(100,player.health+25)
			energy = minf(100,energy+25)
			events.append("pickup")
			events.append("save")
	for e in enemies:
		if e.dead or absf(e.x-player.x) > 850: continue
		e.timer -= dt
		e.flash = maxf(0,e.flash-dt)
		if e.type == "drone":
			e.y = e.base_y+sin(clock*2+e.id)*24
			e.x += sin(clock+e.id)*dt*28
		if e.timer <= 0:
			e.timer = 1.9 if e.type == "turret" else 2.6
			e.flash = 0.14
			var face = -1 if player.x+19 < e.x+e.w/2 else 1
			var muzzle = Vector2(e.x+e.w/2+face*(e.w/2+9),e.y+e.h*e.muzzleY)
			var velocity = (Vector2(player.x+19,player.y+player.h*0.45)-muzzle).normalized()*220
			shots.append({"x":muzzle.x,"y":muzzle.y,"w":13,"h":10,"vx":velocity.x,"vy":velocity.y,"friendly":false,"damage":12,"life":4.0})
		if bounds(player).intersects(bounds(e)): hurt(18)
	for s in shots:
		s.x += s.vx*dt
		s.y += s.vy*dt
		s.life -= dt
		var rect = Rect2(s.x-s.w/2,s.y-s.h/2,s.w,s.h)
		if s.friendly:
			for e in enemies:
				if not e.dead and rect.intersects(bounds(e)):
					e.hp -= s.damage
					s.life = 0
					if e.hp <= 0:
						e.dead = true
						kills += 1
						events.append("explosion")
						events.append("save")
					break
		elif rect.intersects(bounds(player)):
			hurt(12,true)
			s.life = 0
	shots = shots.filter(func(s): return s.life > 0)
	camera += (clampf(player.x-1280*0.32,0,level.width-1280)-camera)*minf(1,dt*5)
	if mode == "play" and player.x > level.exit:
		mode = "transition"
		timer = 0
		shots.clear()
		events.append("save")

func update_companion(dt: float):
	if not companion.get("active",false): return
	companion.time += dt
	if companion.time < 0.35: return
	companion.x += 620*dt
	var found = false
	for j in companion.jumps:
		if companion.x >= j.start and companion.x <= j.end:
			var t = (companion.x-j.start)/(j.end-j.start)
			companion.feet = lerpf(j.from,j.to,t)-4*j.height*t*(1-t)
			companion.frame = 4 if t < 0.2 else 5 if t < 0.6 else 6 if t < 0.88 else 7
			found = true
			break
	if not found:
		for p in companion.floors:
			if companion.x >= p.x and companion.x <= p.x+p.w:
				companion.feet = p.y
				companion.frame = int(companion.time*14)%4
				found = true
				break
	companion.active = found and companion.x-70 <= camera+1360
