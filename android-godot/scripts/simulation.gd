extends RefCounted
const Boss = preload("res://scripts/boss.gd")
var boss: Dictionary = {}
var elites: Array = []
var robot = "protesser"
var victory_robot = ""
var ending_page = "victory"
var supply_cycle = 0
var bonus_end_timer = 0.0
## Coordinates and one-way platform collisions deliberately match the web game.
var level: Dictionary
var spec: Dictionary
var barriers: Array = []
var player: Dictionary
var enemies: Array = []
var pickups: Array = []
var shots: Array = []
var effects: Array = []
var events: Array = []
var enemy_cues: Array = []
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
	spec = level.robotSpec
	reset()
	mode = "menu"

func reset(saved: Dictionary = {}):
	robot = level.robot
	spec = level.robotSpec
	victory_robot = saved.get("victory_robot","")
	ending_page = saved.get("ending_page","victory")
	lives = int(saved.get("lives",4))
	checkpoint = int(saved.get("checkpoint",-1))
	kills = int(saved.get("kills",0))
	cells = int(saved.get("cells",0))
	elapsed = float(saved.get("elapsed",0))
	clock = 0
	boss = Boss.create(level.get("boss",{}),saved.get("boss_defeated",false))
	elites = []
	for i in level.get("elites",[]).size(): elites.append(Boss.create(level.elites[i],i in saved.get("elites_defeated",[])))
	enemies = level.enemies.duplicate(true)
	var spawn = level.checkpoints[checkpoint] if checkpoint >= 0 else level.spawn
	for e in enemies:
		e.id = int(e.id)
		e.dead = e.id in saved.get("defeated",[]) or (checkpoint >= 0 and e.x < spawn.x-120)
		e.y = e.y if e.type == "drone" else e.y-e.h
		e.base_y = e.y
		e.timer = 1.0+e.id*0.13
		e.flash = 0.0
		# Convert integral JSON values before modifying fractional positions.
		e.x = float(e.x)
		e.y = float(e.y)
	pickups = level.pickups.duplicate(true)
	barriers = level.get("barriers",[]).duplicate(true)
	for i in barriers.size():
		barriers[i].id = i
		barriers[i].hp = 6
		barriers[i].dead = i in saved.get("destroyed",[])
	for i in pickups.size():
		pickups[i].taken = i in saved.get("collected",[])
	companion = level.companion.duplicate(true)
	companion.active = not saved.has("level_id")
	respawn()
	camera = maxf(0,player.x-330)
	mode = ("intro" if level.id == 1 else "play") if saved.is_empty() else str(saved.get("stage","play"))
	timer = 0

func respawn():
	robot = level.robot
	spec = level.robotSpec
	supply_cycle = 0
	bonus_end_timer = 0
	pickups = pickups.filter(func(p): return not p.get("bossDrop",false))
	for i in elites.size():
		if not elites[i].dead: elites[i] = Boss.create(level.elites[i])
	if not boss.is_empty() and not boss.dead: boss = Boss.create(level.boss)
	var spawn = level.checkpoints[checkpoint] if checkpoint >= 0 else level.spawn
	player = {"x":float(spawn.x),"y":float(spawn.y),"w":float(spec.width),"h":float(spec.height),"vx":0.0,"vy":0.0,"health":float(spec.maxHealth),"grounded":false,"face":1,"crouching":false,"aim_up":false}
	energy = 100
	invulnerable = 2
	shots.clear()
	effects.clear()
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
	var destroyed = []
	for b in barriers:
		if b.dead: destroyed.append(b.id)
	for e in enemies:
		if e.dead: defeated.append(e.id)
	for i in pickups.size():
		if pickups[i].taken and not pickups[i].get("bossDrop",false): collected.append(i)
	var stage = before_pause if mode == "pause" else mode
	if stage not in ["transition","complete"]: stage = "play"
	var elite_ids = []
	for i in elites.size():
		if elites[i].dead: elite_ids.append(i)
	return {"elites_defeated":elite_ids,"victory_robot":victory_robot,"ending_page":ending_page,"version":2,"level_id":int(level.id),"lives":lives,"checkpoint":checkpoint,"kills":kills,"cells":cells,"elapsed":elapsed,"defeated":defeated,"collected":collected,"destroyed":destroyed,"boss_defeated":not boss.is_empty() and boss.dead,"stage":stage}

func pause():
	if mode in ["play","intro","transition","dead"]:
		before_pause = mode
		mode = "pause"

func resume():
	if mode == "pause": mode = before_pause

static func bounds(b: Dictionary) -> Rect2:
	return Rect2(b.x,b.y,b.w,b.h)

func stance(crouch: bool):
	var height = float(roundi(spec.height*48.0/90)) if crouch and player.grounded else float(spec.height)
	player.y += player.h-height
	player.h = height
	player.crouching = height < spec.height

func hurt(amount: float, projectile = false):
	if invulnerable > 0 or mode != "play": return
	if projectile and player.crouching: amount *= 0.25
	player.health = maxf(0,player.health-amount)
	invulnerable = 1.3
	events.append("hit")
	if player.health <= 0 and not release_inner_robot(): lose_life()

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
	shots.append({"robot":robot,"x":player.x+player.w/2+(0 if up else player.face*(player.w/2+11)),"y":player.y+(-10 if up else player.h/3 if player.crouching else player.h*28/90),"w":thickness if up else length,"h":length if up else thickness,"vx":0.0 if up else player.face*speed,"vy":-speed if up else 0.0,"friendly":true,"damage":(4 if charged else 1)*(2 if robot == "dellinger" else 1),"life":1.2})
	if robot == "garbin":
		shots.back().damage = 12 if charged else 3
		if up: shots.back().y = player.y+player.h-player.h*(1.21/0.79 if player.crouching else 1.145/0.84)
	shots.back()["charged"] = charged
	add_effect(shots.back(),"muzzle")
	cooldown = 0.3 if robot == "garbin" else 0.24 if robot == "dellinger" else 0.17
	if charged:
		energy -= 35
		charge_cooldown = 0.65
	events.append("charge" if charged else "shot")

func update(dt: float, actions: Dictionary):
	events.clear()
	enemy_cues.clear()
	if mode in ["menu","pause","complete","game_over"]: return
	clock += dt
	for effect in effects: effect.age += dt
	effects = effects.filter(func(e): return e.age < e.duration)
	if mode == "dead":
		timer += dt
		if timer >= 1.2:
			if lives > 0: respawn()
			else: mode = "game_over"
			events.append("save")
		return
	if mode == "transition":
		timer += dt
		if timer >= transition_duration():
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
	player.vx = (int(actions.get("right",false))-int(actions.get("left",false)))*spec.speed*(0.4 if player.crouching else 1.0)
	if player.vx != 0: player.face = 1 if player.vx > 0 else -1
	if jump_buffer > 0 and (coyote > 0 or (air_jumps > 0 and player.vy != 0)):
		if coyote <= 0: air_jumps -= 1
		stance(false)
		player.vy = -float(spec.jump)
		jump_buffer = 0
		coyote = 0
		player.grounded = false
		events.append("jump")
	if not jump and player.vy < -250: player.vy += level.gravity*dt*0.85
	player.vy = minf(1000,player.vy+level.gravity*dt)
	var previous_bottom = player.y+player.h
	var previous_x = player.x
	player.x += player.vx*dt
	player.y += player.vy*dt
	player.grounded = false
	for p in level.platforms+barriers.filter(func(b): return not b.dead):
		if player.vy >= 0 and previous_bottom <= p.y+1 and player.y+player.h >= p.y and player.x+player.w > p.x and player.x < p.x+p.w:
			player.y = p.y-player.h
			player.vy = 0.0
			player.grounded = true
	for b in barriers:
		if b.dead or player.y+player.h <= b.y or player.y >= b.y+b.h: continue
		if previous_x+player.w <= b.x and player.x+player.w > b.x:
			player.x = b.x-player.w
			player.vx = 0
		elif previous_x >= b.x+b.w and player.x < b.x+b.w:
			player.x = b.x+b.w
			player.vx = 0
	player.x = clampf(player.x,0,level.width-player.w)
	if player.y > 810:
		if release_inner_robot(true): return
		lose_life()
		return
	if actions.get("fire",false) and cooldown <= 0: fire(false)
	var charge = actions.get("charge",false)
	if charge and not charge_latch and energy >= 35 and charge_cooldown <= 0: fire(true)
	charge_latch = charge
	for i in level.checkpoints.size():
		if player.x > level.checkpoints[i].x and checkpoint < i:
			checkpoint = i
			player.health = spec.maxHealth
			events.append("checkpoint")
			events.append("save")
	for p in pickups:
		if p.get("bossDrop",false) and not p.taken:
			p.vy = minf(340,p.get("vy",0)+650*dt)
			p.y = minf(p.floor-32,p.y+p.vy*dt)
		if not p.taken and bounds(player).intersects(Rect2(p.x,p.y,24,24)):
			p.taken = true
			cells += 1
			player.health = minf(spec.maxHealth,player.health+25)
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
			e.timer = 1.6 if e.type == "armor" else 1.9 if e.type == "turret" else 2.6
			e.flash = 0.14
			var face = -1 if player.x+player.w/2 < e.x+e.w/2 else 1
			var muzzle = Vector2(e.x+e.w/2+face*(e.w/2+9),e.y+e.h*e.muzzleY)
			var velocity = (Vector2(player.x+player.w/2,player.y+player.h*0.45)-muzzle).normalized()*220
			shots.append({"x":muzzle.x,"y":muzzle.y,"w":13,"h":10,"vx":velocity.x,"vy":velocity.y,"friendly":false,"damage":12,"life":4.0})
			enemy_cues.append({"kind":"light" if e.type == "drone" else "heavy","x":muzzle.x})
		if bounds(player).intersects(bounds(e)): hurt(18)
	for elite in elites: update_encounter(elite,dt)
	update_encounter(boss,dt)
	if level.get("extra",false) and not boss.dead and boss.state == "recover" and boss.cycle > 0 and boss.cycle%3 == 0 and boss.cycle != supply_cycle:
		supply_cycle = boss.cycle
		pickups = pickups.filter(func(p): return not p.get("bossDrop",false) or not p.taken)
		if pickups.filter(func(p): return p.get("bossDrop",false) and not p.taken).size() < 3: add_drop(170,400,680)
	for s in shots:
		if s.life <= 0: continue
		s.x += s.vx*dt
		s.y += s.vy*dt
		s.life -= dt
		var rect = Rect2(s.x-s.w/2,s.y-s.h/2,s.w,s.h)
		if s.friendly:
			if hit_drone(rect,s): continue
			var encounters = elites.duplicate()
			if not boss.is_empty(): encounters.append(boss)
			for encounter in encounters:
				if encounter.active and not encounter.dead and not encounter.hidden and rect.intersects(Boss.bounds(encounter)):
					s.life = 0
					add_effect(s,"impact")
					if Boss.hit(encounter,s.damage):
						if not encounter.get("elite",false): victory_robot = robot
						kills += 1
						for other in shots:
							if not other.friendly: other.life = 0
						events.append_array(["boss_defeated","explosion","save"])
					break
			if s.life <= 0: continue
			for b in barriers:
				if not b.dead and rect.intersects(bounds(b)):
					b.hp -= s.damage
					s.life = 0
					add_effect(s,"impact")
					if b.hp <= 0:
						b.dead = true
						events.append("explosion")
						events.append("save")
					break
			if s.life <= 0: continue
			for e in enemies:
				if not e.dead and rect.intersects(bounds(e)):
					e.hp -= s.damage
					add_effect(s,"impact")
					s.life = 0
					if e.hp <= 0:
						e.dead = true
						kills += 1
						events.append("explosion")
						events.append("save")
					break
		elif rect.intersects(bounds(player)):
			hurt(s.get("damage",12),true)
			s.life = 0
	shots = shots.filter(func(s): return s.life > 0)
	var camera_target = boss.left if not boss.is_empty() and boss.active else clampf(player.x-1280*0.32,0,level.width-1280)
	camera += (camera_target-camera)*minf(1,dt*5)
	if not boss.is_empty() and boss.dead and level.id >= 12: bonus_end_timer += dt
	if mode == "play" and (player.x > level.exit or bonus_end_timer > 2) and (boss.is_empty() or boss.dead) and elites.all(func(b): return b.dead):
		mode = "complete" if level.id >= 12 else "transition"
		timer = 0
		shots.clear()
		events.append("save")

func add_effect(shot: Dictionary, kind: String):
	var charged = shot.get("charged",false)
	effects.append({"robot":shot.get("robot",robot),"x":shot.x,"y":shot.y,"angle":atan2(shot.vy,shot.vx),"charged":charged,"kind":kind,"age":0.0,"duration":0.13 if kind == "muzzle" else 0.32 if charged else 0.19})
	if effects.size() > 48: effects.pop_front()

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

func transition_duration() -> float:
	return 20.8 if level.id == 8 else 10.0 if level.id == 11 else 15.0 if level.id == 3 else 11.0

func release_inner_robot(fell = false) -> bool:
	if boss.is_empty() or not boss.active or boss.dead or boss.get("kind","") not in ["dokuma","nucleus","cryodrax"] or robot == "protesser": return false
	robot = "dellinger" if robot == "garbin" else "protesser"
	spec = level.robots[robot]
	var feet = boss.floor if fell else player.y+player.h
	var center = player.x+player.w/2
	player.merge({"w":float(spec.width),"h":float(spec.height),"x":clampf(center-spec.width/2,boss.left+20,boss.right-spec.width-20),"y":feet-spec.height,"health":float(spec.maxHealth),"vx":0.0,"vy":0.0,"crouching":false,"aim_up":false,"grounded":false},true)
	energy = 100
	invulnerable = 2.5
	air_jumps = 1
	previous_jump = false
	jump_buffer = 0
	coyote = 0
	charge_latch = false
	cooldown = 0.25
	charge_cooldown = 0.25
	shots = shots.filter(func(s): return s.friendly)
	events.append("armor_lost")
	return true

func update_encounter(b: Dictionary, dt: float):
	if b.is_empty() or b.dead: return
	var was_active = b.active
	var old_state = b.state
	var emitted = Boss.update(b,dt,player)
	for s in emitted: s.damage *= b.get("damageScale",1)
	shots.append_array(emitted)
	if not was_active and b.active:
		shots = shots.filter(func(s): return s.friendly or s.get("boss",false))
		events.append("boss_active")
	if b.state == "warning" and old_state != "warning": events.append("boss_warning")
	if b.state == "vanish" and old_state != "vanish": enemy_cues.append({"kind":"teleport","x":b.x})
	if not emitted.is_empty():
		var kind = "reactorBurst" if emitted.any(func(s): return s.get("reactorBurst",false)) else "iceBeam" if emitted.any(func(s): return s.get("iceBeam",false)) else "iceShard" if b.get("kind","") == "cryodrax" else "light" if b.get("kind","") == "dokuma" else "bossPulse" if b.get("kind","") == "nucleus" else "darkShot" if b.get("kind","") == "dark" else "bossShot"
		enemy_cues.append({"kind":kind,"x":b.x})
	if b.state == "attack" and old_state != "attack":
		if b.get("kind","") == "dark" and b.attack != "ambush": enemy_cues.append({"kind":"sword","x":b.x})
		elif b.get("kind","") == "dokuma": enemy_cues.append({"kind":"dokumaBeam" if b.attack == "eyes" else "summon" if b.attack == "drones" else "impact","x":b.x})
		elif b.attack in ["beam","shell"]: enemy_cues.append({"kind":"beam" if b.attack == "beam" else "impact","x":b.x})
	if b.active:
		player.x = clampf(player.x,b.left+12,(b.right-12 if b.has("kind") else b.x)-player.w)
		for h in b.hazards:
			if bounds(player).intersects(bounds(h)): hurt(26*b.get("damageScale",1))

func add_drop(x, y, floor_y):
	pickups.append({"bossDrop":true,"taken":false,"x":x,"y":y,"vy":0.0,"floor":floor_y})

func hit_drone(rect: Rect2, s: Dictionary) -> bool:
	if boss.is_empty() or boss.dead: return false
	for d in boss.drones:
		if not d.get("dead",false) and rect.intersects(bounds(d)):
			s.life = 0
			add_effect(s,"impact")
			d.hp -= s.damage
			if d.hp <= 0:
				d.dead = true
				add_drop(clampf(d.x,boss.left+55,boss.right-100),clampf(d.y,110,boss.floor-32),boss.floor)
			return true
	return false
