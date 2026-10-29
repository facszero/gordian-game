extends RefCounted
const CUES = [0.0,3.0,3.8,4.6,5.4,6.2,6.9,7.6,8.1,8.6,9.1]
const LABELS = ["DELLINGER · ARMADURA ABIERTA","ALINEANDO PROTESSER","ENCAJE CONFIRMADO","SELLANDO PIERNAS","SELLANDO BRAZOS","CERRANDO TORSO Y CASCO","ACOPLAMIENTO COMPLETO","POSICIÓN DE COMBATE","DELLINGER · LISTO PARA AVANZAR"]

static func smooth(value: float) -> float:
	var p = clampf(value,0,1)
	return p*p*(3-2*p)

static func sound() -> AudioStreamWAV:
	# Motor sweep and three mechanical latches, following audio.js coupling cue.
	var sample = AudioStreamWAV.new()
	sample.format = AudioStreamWAV.FORMAT_16_BITS
	sample.mix_rate = 22050
	var bytes = PackedByteArray()
	bytes.resize(22050*2)
	var random = RandomNumberGenerator.new()
	random.seed = 42
	var phase = 0.0
	var filtered = 0.0
	for i in 22050:
		var t = i/22050.0
		phase += TAU*90*pow(280.0/90,minf(1,t/0.7))/22050
		var motor = (fposmod(phase/TAU,1)*2-1)*0.065*envelope(t,0.7)
		var mixed = motor
		for delay in [0.0,0.24,0.55]:
			var local = t-delay
			if local >= 0 and local < 0.16:
				mixed += random.randf_range(-1,1)*0.12*envelope(local,0.12)
				mixed += (2/PI)*asin(sin(TAU*180*0.16/log(0.25)*(pow(0.25,local/0.16)-1)))*0.09*envelope(local,0.16)
		filtered += 0.25*(mixed-filtered)
		bytes.encode_s16(i*2,int(clampf(filtered,-1,1)*32767))
	sample.data = bytes
	return sample

static func envelope(t: float, duration: float) -> float:
	if t < 0 or t >= duration: return 0
	return minf(1,t/0.006)*pow(0.001,t/duration)

static func state(time: float) -> Dictionary:
	var t = maxf(0,time)
	var pose = 0
	for i in range(1,CUES.size()):
		if t >= CUES[i]: pose = i
	var label = 0 if t < 0.9 else 1 if t < 3 else 2 if t < 3.8 else 3 if t < 4.6 else 4 if t < 5.4 else 5 if t < 6.2 else 6 if t < 7.6 else 7 if t < 9.1 else 8
	return {"pose":pose,"previous":maxi(0,pose-1),"blend":smooth((t-CUES[pose])/0.22) if pose else 1.0,"entry":smooth((t-0.9)/2.1),"fade":smooth((t-10.5)/0.5),"label":LABELS[label]}

static func pose(c: Node2D, index: int, x = 810.0, feet = 604.0, size = 490.0, alpha = 1.0):
	c.draw_texture_rect(c.textures["coupling-front"][index],Rect2(x-size/2,feet-size,size,size),false,Color(1,1,1,alpha))

static func draw(c: Node2D):
	var t = c.sim.timer
	var s = state(t)
	c.draw_texture_rect(c.textures["hangar-background"],Rect2(0,0,1280,720),false)
	for strip in [[0.0,614.4,0.867,0.251],[614.4,1280.0,0.251,0.0]]:
		c.draw_polygon(PackedVector2Array([Vector2(strip[0],0),Vector2(strip[1],0),Vector2(strip[1],720),Vector2(strip[0],720)]),PackedColorArray([Color(0.012,0.043,0.086,strip[2]),Color(0.012,0.043,0.086,strip[3]),Color(0.012,0.043,0.086,strip[3]),Color(0.012,0.043,0.086,strip[2])]))
	c.Visuals.oval(c,Vector2(810,606),Vector2(190,18),Color("69d9ec28"))
	c.Visuals.oval(c,Vector2(810,606),Vector2(130,9),Color("91e9ed20"))
	if c.sim.level.id == 1:
		if s.pose == 0:
			pose(c,0)
			if t > 0.9: pose(c,11,420+390*s.entry,636-32*s.entry,330+100*s.entry,minf(1,(t-0.9)*3))
		else:
			if s.blend < 1: pose(c,s.previous)
			pose(c,s.pose,810,604,490,s.blend)
		if s.pose >= 2 and s.pose <= 4 and s.blend < 1:
			c.Visuals.oval(c,Vector2(810,505 if s.pose == 2 else 290 if s.pose == 3 else 255),Vector2(90,5),Color(0.569,0.933,1,(1-s.blend)*0.65))
		c.label_at("SANTORE / ACOPLAMIENTO 01 → 02",Vector2(64,192),14,Color("e8b76d"))
		c.label_at(s.label,Vector2(64,232),19,Color("b9efff"))
		c.label_at("PROTESSER + DELLINGER",Vector2(64,264),13,Color("9eb3c2"))
		var steps = ["ALINEACIÓN","ENCAJE","CIERRE","GIRO"]
		var active = 0 if t < 3 else 1 if t < 3.8 else 2 if t < 7.6 else 3
		for i in steps.size():
			c.draw_circle(Vector2(72,340+i*31),4,Color("81e4eb") if i <= active else Color("344d60"))
			c.label_at(steps[i],Vector2(88,345+i*31),12,Color("f2d093") if i == active else Color("91a8b8"))
	elif c.sim.level.id == 2:
		if t < 8.5: pose(c,state(maxf(0,10.4-t*1.22)).pose)
		else:
			pose(c,0)
			var p = smooth((t-8.5)/2)
			pose(c,11,810-360*p,604,430-100*p)
		c.label_at("SANTORE / TRANSICIÓN 02 → 03",Vector2(64,192),14,Color("e8b76d"))
		c.label_at("DESACOPLAMIENTO",Vector2(64,232),19,Color("b9efff"))
		c.label_at("DELLINGER → PROTESSER",Vector2(64,264),15,Color("e8c483"))
		c.label_at("DESTINO: "+c.sim.level.nextTitle.to_upper(),Vector2(64,340),12,Color("a3bac8"))
	else:
		if c.sim.level.id == 3 and t < 8:
			var local_state = state(t*10.4/8)
			pose(c,local_state.pose)
			if local_state.pose == 0 and t > 0.7: pose(c,11,420+390*local_state.entry,604,330+100*local_state.entry)
		else:
			var phase = 11-t if c.sim.level.id == 4 else t-8
			var frame = (8 if phase < 4.4 else 9 if phase < 5.8 else 10 if phase < 7.2 else 11 if phase < 8.8 else 4) if c.sim.level.id == 4 else (8 if t < 11.2 else 9 if t < 12.1 else 10 if t < 13 else 11 if t < 13.8 else 4)
			c.sprite_at("garbin",frame,810,604,460)
			if (c.sim.level.id == 3 and t < 11.2) or (c.sim.level.id == 4 and phase < 4.4):
				var p = smooth(phase/(3.8 if c.sim.level.id == 4 else 2.8))
				pose(c,8,440+370*p,604,320-90*p,clampf((4.4-phase)*2 if c.sim.level.id == 4 else (11.2-t)*3,0,1))
		c.label_at("SANTORE / TRANSICIÓN %02d → %02d" % [c.sim.level.id,c.sim.level.id+1],Vector2(64,192),14,Color("e8b76d"))
		c.label_at("ACOPLAMIENTO DOBLE" if c.sim.level.id == 3 else "DESACOPLAMIENTO",Vector2(64,232),19,Color("b9efff"))
		c.label_at(("PROTESSER → DELLINGER" if t < 8 else "DELLINGER → GARBIN") if c.sim.level.id == 3 else "GARBIN → DELLINGER",Vector2(64,264),15,Color("e8c483"))
		c.label_at("DESTINO: "+c.sim.level.nextTitle.to_upper(),Vector2(64,340),12,Color("a3bac8"))
	c.draw_rect(Rect2(64,290,330,4),Color("233d4e"))
	var duration = 15.0 if c.sim.level.id == 3 else 11.0
	c.draw_rect(Rect2(64,290,330*minf(1,t/(10.4 if c.sim.level.id == 1 else duration)),4),Color("79e5ef"))
	var fade = s.fade if c.sim.level.id == 1 else clampf((t-duration+0.5)*2,0,1)
	if fade > 0: c.draw_rect(Rect2(0,0,1280,720),Color(0.027,0.067,0.122,fade))
	c.draw_rect(Rect2(48,465,380,210),Color("061323ed"))
	c.draw_rect(Rect2(48,465,3,210),Color("e8b76d"))
	c.label_at(c.sim.level.story[0],Vector2(64,492),13,Color("efc983"))
	var line = ""
	var y = 522
	for word in c.sim.level.story[1].split(" "):
		var next = line+" "+word if line != "" else word
		if c.font.get_string_size(next,HORIZONTAL_ALIGNMENT_LEFT,-1,17).x > 342 and line != "":
			c.label_at(line,Vector2(64,y),17,Color("dfebf2"))
			y += 23
			line = word
		else: line = next
	c.label_at(line,Vector2(64,y),17,Color("dfebf2"))
	if t < 3:
		c.label_at("ACOPLAMIENTO AUTORIZADO" if int(c.sim.level.id)%2 else "DESACOPLAMIENTO AUTORIZADO",Vector2(430,140),20,Color("ffd18b"))
