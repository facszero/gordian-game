extends RefCounted
## Native counterparts of dark-boss.js, dokuma.js, nucleus.js and cryodrax.js.
static func shot(x, y, tx, ty, speed, damage = 24, w = 20, h = 16) -> Dictionary:
	var angle = atan2(ty-y,tx-x)
	return {"x":x,"y":y,"w":w,"h":h,"vx":cos(angle)*speed,"vy":sin(angle)*speed,"life":4.0,"friendly":false,"boss":true,"damage":damage}

static func phase(b):
	return 1 if b.hp > b.maxHp*2/3 else 2 if b.hp > b.maxHp/3 else 3

static func sword(b) -> Dictionary:
	return {"x":b.targetX-75,"y":b.floor-440,"w":150,"h":440} if b.attack == "cleave" else {"x":b.x+b.w/2-(440 if b.face < 0 else 0),"y":b.floor-95,"w":440,"h":95}

static func dark(b, dt, p, random: Callable) -> Array:
	b.flash = maxf(0,b.flash-dt)
	b.age += dt
	b.moving = false
	if not b.active:
		if p.x < b.trigger: return []
		b.active = true
		b.state = "recover"
		b.timer = 1.4
		b.face = -1
	b.timer -= dt
	if b.timer > 0: return []
	var fast = b.hp <= b.maxHp/2
	if b.state == "recover":
		if b.bag.is_empty(): b.bag = ["ambush","sword","cleave"]
		var pool = b.bag.filter(func(a): return a != b.attack)
		if pool.is_empty(): pool = b.bag
		b.attack = pool[floori(random.call()*pool.size())]
		b.bag.erase(b.attack)
		var center = p.x+p.w/2
		var dest = clampf(center-p.get("face",1)*(b.w/2+220)-b.w/2,b.left+30,b.right-b.w-30)
		if dest < p.x+p.w+110 and dest+b.w > p.x-110: dest = b.right-b.w-30 if center < (b.left+b.right)/2 else b.left+30
		b.destination = dest
		b.hidden = true
		b.hazards = []
		b.state = "vanish"
		b.timer = 0.45
		return []
	if b.state == "vanish":
		b.x = b.destination
		b.face = 1 if p.x+p.w/2 > b.x+b.w/2 else -1
		b.targetX = clampf(p.x+p.w/2,b.left+85,b.right-85)
		b.targetY = p.y+p.h*0.5
		b.hidden = false
		b.state = "warning"
		b.timer = 0.95 if fast else 1.25
		b.rounds = 4 if fast else 3
		return []
	if b.state == "warning":
		b.state = "attack"
		b.timer = 0.28 if b.attack == "ambush" else 0.4
		if b.attack != "ambush":
			b.hazards = [sword(b)]
			return []
	if b.state == "attack" and b.attack == "ambush" and b.rounds > 0:
		b.rounds -= 1
		b.timer = 0.24 if fast else 0.32
		return [shot(b.x+b.w/2+b.face*95,b.floor-245,b.targetX,b.targetY,480 if fast else 400)]
	b.hazards = []
	b.state = "recover"
	b.timer = (0.8 if fast else 1.15)+random.call()*0.45
	return []

static func dokuma(b, dt, p, random: Callable) -> Array:
	b.age += dt
	b.flash = maxf(0,b.flash-dt)
	if not b.active:
		if p.x < b.trigger: return []
		b.active = true
		b.state = "recover"
		b.timer = 1.5
		b.phase = 1
	var current = phase(b)
	if current != b.get("phase",1):
		b.phase = current
		b.state = "shift"
		b.timer = 1.8
		b.hazards = []
		b.drones = []
		b.erase("summonStart")
		b.erase("fistStart")
		return []
	var shots = []
	for d in b.drones:
		if d.get("dead",false): continue
		if d.entry < 1:
			d.entry = minf(1,d.entry+dt/1.1)
			var t = d.entry*d.entry*(3-2*d.entry)
			d.x = lerpf(d.originX,d.destinationX,t)
			d.y = lerpf(d.originY,d.baseY,t)
			continue
		d.age += dt
		d.x += d.vx*dt
		d.y = d.baseY+sin(d.age*3)*28
		d.timer -= dt
		if d.x < b.left+30: d.vx = absf(d.vx)
		if d.x > b.right-80: d.vx = -absf(d.vx)
		if d.timer <= 0:
			d.timer = 2
			var s = shot(d.x,d.y,p.x+p.w/2,p.y+p.h*0.5,270,14,14,14)
			s.life = 5
			shots.append(s)
	b.drones = b.drones.filter(func(d): return not d.get("dead",false))
	b.timer -= dt
	if b.timer > 0: return shots
	if b.state == "shift":
		b.state = "recover"
		b.timer = 1
		return shots
	if b.state == "recover":
		var attacks = ["drones","eyes"] if current == 1 else ["fist","eyes"] if current == 2 else ["tentacles","eyes","fist"]
		var pool = attacks.filter(func(a): return a != b.attack)
		b.attack = pool[floori(random.call()*pool.size())]
		b.targetX = clampf(p.x+p.w/2,b.left+100,b.right-150)
		b.targetY = p.y+p.h*0.5
		b.state = "warning"
		b.timer = 1.8 if b.attack == "drones" else 0.95 if current == 3 else 1.25
		if b.attack == "drones": b.summonStart = b.age
		if b.attack == "fist":
			b.fistStart = b.age
			b.fistWindup = b.timer
			b.fistTargetX = b.targetX
		return shots
	if b.state == "warning":
		b.state = "attack"
		b.timer = 0.65 if b.attack in ["eyes","drones"] else 0.5
		if b.attack == "drones":
			for i in 3:
				if b.drones.size() >= 6: break
				var x = b.left+850+(270 if i%2 else -270)-32
				b.drones.append({"x":x,"y":b.floor-592,"originX":x,"originY":b.floor-592,"destinationX":b.left+350+i*180,"entry":0.0,"baseY":b.floor-260-i*35,"w":64,"h":64,"hp":5,"age":float(i),"timer":1+i*0.3,"vx":-90-i*15})
		elif b.attack == "eyes": b.hazards = [{"x":b.left,"y":b.floor-120,"w":b.right-b.left,"h":20}]
		elif b.attack == "fist": b.hazards = [{"x":b.targetX-95,"y":b.floor-300,"w":190,"h":300}]
		else: b.hazards = [{"x":b.targetX-190,"y":b.floor-75,"w":380,"h":75}]
		return shots
	b.hazards = []
	b.state = "recover"
	b.timer = 1.2 if current == 3 else 1.6
	return shots

static func cryo_pose(b) -> Dictionary:
	return {"x":b.left+1040+b.get("lean",0)*12+b.get("recoil",0)*10,"y":660+sin(b.age*1.3)*3,"angle":b.get("headAngle",0)*0.16+b.get("lean",0)*0.025+b.get("recoil",0)*0.018}

static func body_point(b, x, y) -> Vector2:
	var p = cryo_pose(b)
	return Vector2(p.x,p.y)+Vector2(x,y).rotated(p.angle)

static func ports(b) -> Dictionary:
	if b.kind == "cryodrax":
		var mouth = Vector2(-250,-90).rotated(b.get("headAngle",0))+Vector2(-65,-380)
		var eyes = Vector2(-152,-112).rotated(b.get("headAngle",0))+Vector2(-65,-380)
		return {"chest":body_point(b,-68,-195),"mouth":body_point(b,mouth.x,mouth.y),"eyes":body_point(b,eyes.x,eyes.y)}
	var sway = sin(b.age*1.3)*2
	var a = b.get("headAngle",0)
	return {"chest":Vector2(b.left+890,505+sway),"eyes":Vector2(b.left+907-25*cos(a)+80*sin(a),294+sway-25*sin(a)-80*cos(a)),"shoulders":[Vector2(b.left+690,330+sway),Vector2(b.left+1130,300+sway)]}

static func bonus(b, dt, p) -> Array:
	var ice = b.kind == "cryodrax"
	b.active = true
	b.age += dt
	b.flash = maxf(0,b.flash-dt)
	b.hazards = []
	b.phase = phase(b)
	if b.state == "idle":
		b.state = "recover"
		b.timer = 2
	var warning = b.state == "warning"
	if ice:
		b.jaw = lerpf(b.get("jaw",0),0.35 if b.attack == "mouth" and (warning or b.state == "firing") else 0,minf(1,dt*5))
		b.lean = lerpf(b.get("lean",0),1 if warning else 0,minf(1,dt*3))
		b.kick = maxf(0,b.get("kick",0)-dt*3)
		b.recoil = lerpf(b.get("recoil",0),b.kick,minf(1,dt*12))
	else:
		b.rageTimer = maxf(0,b.get("rageTimer",0)-dt)
		var furious = (b.get("mega",false) and b.state in ["warning","firing"]) or b.rageTimer > 0
		b.rageBlend = clampf(b.get("rageBlend",0)+(dt*5 if furious else -dt*3),0,1)
	if b.state == "recover" or (warning and b.timer > (0.65 if ice else 0.9 if b.get("mega",false) else 0.35)):
		b.targetX = p.x+p.w/2
		b.targetY = p.y+p.h*0.45
		var m = ports(b).eyes if ice else Vector2(907,214)
		var a = clampf(-atan2(b.targetY-m.y,m.x-b.targetX)*(0.45 if ice else 0.6),-0.25 if ice else -0.3,0.22 if ice else 0.28)
		b.headAngle = lerpf(b.get("headAngle",0),a,minf(1,dt*(3 if ice else 4)))
	b.timer -= dt
	if b.timer > 0: return []
	if b.state == "recover":
		b.attack = (["chest","mouth","eyes"] if ice else ["chest","eyes","shoulders"])[b.cycle%3]
		b.cycle += 1
		b.mega = not ice and b.attack == "chest" and b.cycle%6 == 4
		b.state = "warning"
		b.timer = (2.2 if b.attack == "chest" else 1.5) if ice else (2.2 if b.mega else 1.4)
		b.rounds = 3 if b.attack == "eyes" else 2 if b.attack in ["mouth","shoulders"] else 1
		return []
	var shots = []
	var muzzles = ports(b)
	var origins = muzzles.shoulders if b.attack == "shoulders" else [muzzles[b.attack]]
	var spread = [-0.28,-0.14,0,0.14,0.28] if ice and b.phase == 3 else [-0.18,0,0.18] if ice else [-0.32,-0.16,0,0.16,0.32] if b.phase == 3 else [-0.2,0,0.2]
	if not ((ice and b.attack == "mouth") or (not ice and b.attack == "chest" and not b.mega)): spread = [0]
	for m in origins:
		for offset in spread:
			var beam = ice and b.attack == "chest"
			var speed = (300 if beam else 340 if b.attack == "eyes" else 240) if ice else (260 if b.mega else 240 if b.attack == "chest" else 340 if b.attack == "eyes" else 210)
			var angle = atan2(b.targetY-m.y,b.targetX-m.x)+offset
			var s = shot(m.x,m.y,m.x+cos(angle),m.y+sin(angle),speed,26 if beam else 14 if ice else 28 if b.mega else 16,18,18)
			s.life = 6
			if ice:
				s.merge({"ice":true,"iceBeam":beam,"angle":angle,"length":200 if beam else 46,"thickness":52 if beam else 13})
				s.w = absf(cos(angle))*s.length+absf(sin(angle))*s.thickness
				s.h = absf(sin(angle))*s.length+absf(cos(angle))*s.thickness
			else:
				s.nucleus = true
				if b.mega:
					s.w = 180
					s.h = 160
					s.reactorBurst = true
					b.rageTimer = 0.8
			shots.append(s)
	b.kick = 1 if b.attack == "chest" else 0.5
	b.rounds -= 1
	b.state = "firing" if b.rounds > 0 else "recover"
	b.timer = (0.36 if ice else 0.3) if b.rounds > 0 else ((1.9 if b.phase == 3 else 2.5) if ice else (1.7 if b.phase == 3 else 2.3))
	return shots

static func dokuma_bounds(b) -> Rect2:
	var x = b.left+(760 if b.get("phase",1) == 1 else 900)
	if b.has("fistStart"):
		var t = b.age-b.fistStart
		var w = b.fistWindup
		if t >= 0 and t < w+0.95:
			var reach = smooth((t/w-0.35)/0.65) if t < w else 1.0 if t < w+0.5 else 1-smooth((t-w-0.5)/0.45)
			var home = b.left+1000-1020*0.65
			x = home+(b.fistTargetX-1020*0.2-home)*reach+1020*0.65-110
	return Rect2(x,b.floor-280,220,270)

static func smooth(value):
	var t = clampf(value,0,1)
	return t*t*(3-2*t)
