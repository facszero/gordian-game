extends RefCounted
const Logic = preload("res://scripts/advanced_boss.gd")
static func draw(c, b):
	if b.dead or (not b.active and b.kind != "dark"): return
	var cam = c.sim.camera
	var tint = Color(1.7,1.7,1.7) if b.flash > 0 else Color(0.7,1,0.8) if b.get("elite",false) else Color.WHITE
	if b.kind == "dark":
		if b.hidden:
			c.draw_circle(Vector2(b.get("destination",b.x)+b.w/2-cam,b.floor-20),60,Color("66baff44"))
		else:
			var frame = 3 if b.state == "attack" and b.attack != "ambush" else 1 if b.attack == "ambush" and b.state in ["warning","attack"] else 2 if b.state == "warning" else 0
			var tex = c.textures["dark-dellinger"][frame]
			var h = b.h*(0.87 if frame == 3 else 1)
			var w = tex.get_width()*h/tex.get_height()
			c.draw_set_transform(Vector2(b.x+b.w/2-cam,b.floor),0,Vector2(b.face,1))
			c.draw_texture_rect(tex,Rect2(-w/2,-h,w,h),false,tint)
			c.draw_set_transform(Vector2.ZERO)
	elif b.kind == "dokuma":
		draw_dokuma(c,b,tint)
	elif b.kind == "nucleus":
		var sway = sin(b.age*1.3)*2
		c.draw_texture_rect(c.textures["nucleus-parts"][0],Rect2(b.left+570-cam,170+sway,760,592),false,tint)
		c.draw_set_transform(Vector2(b.left+907-cam,294+sway),b.get("headAngle",0))
		var blend = b.get("rageBlend",0)
		c.draw_texture_rect(c.textures["nucleus-parts"][1],Rect2(-135,-228,245,240),false,Color(tint,1-blend))
		c.draw_texture_rect(c.textures["nucleus-rage"][0],Rect2(-135,-228,245,240),false,Color(tint,blend))
		c.draw_set_transform(Vector2.ZERO)
	else:
		var p = Logic.cryo_pose(b)
		var body = Transform2D(p.angle,Vector2(p.x-cam,p.y))
		c.draw_set_transform_matrix(body)
		c.draw_texture_rect(c.textures["cryo-parts"][0],Rect2(-230,-440,450,540),false,tint)
		var head = body*Transform2D(b.get("headAngle",0),Vector2(-65,-380))
		c.draw_set_transform_matrix(head*Transform2D(-b.get("jaw",0),Vector2(-25,-65)))
		c.draw_texture_rect(c.textures["cryo-parts"][2],Rect2(-285,-40,310,140),false,tint)
		c.draw_set_transform_matrix(head)
		c.draw_texture_rect(c.textures["cryo-parts"][1],Rect2(-300,-220,360,280),false,tint)
		c.draw_set_transform(Vector2.ZERO)
	if b.state == "warning":
		if b.kind in ["nucleus","cryodrax"]:
			var ports = Logic.ports(b)
			var origins = ports.shoulders if b.attack == "shoulders" else [ports[b.attack]]
			for origin in origins:
				c.draw_dashed_line(origin-Vector2(cam,0),Vector2(b.targetX-cam,b.targetY),Color("9beeff99"),2,12,true)
				c.draw_circle(origin-Vector2(cam,0),14+(1-clampf(b.timer/2.2,0,1))*30,Color("9beeff88"))
		elif b.kind == "dark" and b.attack == "ambush":
			c.draw_line(Vector2(b.x+b.w/2+b.face*95-cam,b.floor-245),Vector2(b.targetX-cam,b.targetY),Color("ffc29799"),2)
		elif b.attack != "drones":
			var y = b.floor-110 if b.attack == "eyes" else b.floor-5
			var x = b.left if b.attack == "eyes" else b.targetX-95
			c.draw_line(Vector2(x-cam,y),Vector2((b.right if b.attack == "eyes" else b.targetX+95)-cam,y),Color("ffbd8e99"),4)
	for h in b.hazards:
		if b.kind == "dark":
			var center = h.x+h.w/2-cam
			if b.attack == "cleave":
				curve(c,Vector2(center-18,h.y),Vector2(center+14,h.y+h.h*0.5),Vector2(center,h.y+h.h),Color("ffdeba"),12)
				for i in range(-2,3): c.draw_line(Vector2(center,b.floor),Vector2(center+i*18,b.floor-10-absi(i)*8),Color("ffb174"),2)
			else:
				var first = h.x-cam+(h.w if b.face < 0 else 0)
				var last = h.x-cam+(h.w if b.face > 0 else 0)
				curve(c,Vector2(first,h.y+15),Vector2((first+last)/2,h.y+h.h),Vector2(last,h.y+45),Color("ffdeba"),12)
		elif b.attack == "eyes":
			var cx = b.left+(850 if b.get("phase",1) == 1 else 1000)-cam
			for offset in [-12,12]: c.draw_line(Vector2(cx+offset,b.floor-(570 if b.get("phase",1) == 1 else 715)*0.7),Vector2(b.right-30-cam,b.floor-110),Color("ff8ca2"),4)
			c.draw_line(Vector2(h.x-cam,b.floor-110),Vector2(b.right-cam,b.floor-110),Color("ffcfdd"),12)
		elif b.attack == "fist": c.draw_line(Vector2(h.x-cam,b.floor-4),Vector2(h.x+h.w-cam,b.floor-4),Color("ddffb0"),9)
		elif b.attack == "tentacles":
			for i in 5:
				var x = h.x+i*h.w/4-cam
				curve(c,Vector2(x,b.floor),Vector2(x-30,b.floor-90),Vector2(x+25,b.floor-70),Color("76dca1"),12)

static func curve(c,a,b,z,color,width):
	var points = PackedVector2Array()
	for i in 21:
		var t = i/20.0
		points.append((1-t)*(1-t)*a+2*(1-t)*t*b+t*t*z)
	c.draw_polyline(points,color,width,true)

static func blend_pose(c, atlas, keys, t, size, x, floor_y, anchors, tint):
	var first = 0
	var second = 0
	var blend = 0.0
	for i in range(1,keys.size()):
		if t < keys[i][0]:
			first = keys[i-1][1]
			second = keys[i][1]
			blend = clampf((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]),0,1)
			blend = maxf(0,1-(keys[i][0]-t)/0.08) if atlas == "dokuma-punch" else blend*blend*(3-2*blend)
			break
	for item in [[first,1-blend],[second,blend]]:
		c.draw_texture_rect(c.textures[atlas][item[0]],Rect2(x,floor_y-size*anchors[item[0]],size,size),false,Color(tint,item[1]))

static func draw_dokuma(c,b,tint):
	var phase = b.get("phase",1)
	var cx = b.left+(850 if phase == 1 else 1000)-c.sim.camera
	if phase == 1:
		var t = b.age-b.get("summonStart",b.age+10)
		blend_pose(c,"dokuma-summon",[[0,0],[0.3,1],[0.8,2],[1.5,3],[2.45,3],[2.8,1],[3.15,0]],t,820,cx-410,b.floor,[0.925,0.925,0.882,0.882],tint)
	else:
		var t = b.age-b.get("fistStart",b.age+10)
		var windup = b.get("fistWindup",1.25)
		var reach = 0.0
		if t >= 0 and t < windup+0.95:
			reach = c.Transition.smooth((t/windup-0.35)/0.65) if t < windup else 1.0 if t < windup+0.5 else 1-c.Transition.smooth((t-windup-0.5)/0.45)
		var home = cx-1020*0.65
		var x = lerpf(home,b.get("fistTargetX",cx)-c.sim.camera-1020*0.2,reach)
		blend_pose(c,"dokuma-punch",[[0,0],[windup*0.25,1],[windup*0.6,2],[windup*0.83,3],[windup,4],[windup+0.5,4],[windup+0.72,5],[windup+0.95,0]],t,1020,x,b.floor-12*sin(reach*PI),[0.865,0.865,0.865,0.815,0.815,0.815],tint)
	for d in b.drones:
		if not d.get("dead",false): c.draw_texture_rect(c.textures.dokuma[3],Rect2(d.x-8-c.sim.camera,d.y-8,80,80),false)

static func projectile(c,s):
	var origin = Vector2(s.x-c.sim.camera,s.y)
	if s.get("ice",false):
		c.draw_set_transform(origin,s.angle)
		var l = s.length/2
		var h = s.thickness/2
		c.draw_colored_polygon(PackedVector2Array([Vector2(l,0),Vector2(l-24,-h),Vector2(-l,-h*0.7),Vector2(-l-20,0),Vector2(-l,h*0.7),Vector2(l-24,h)]),Color("83dfff"))
		c.draw_line(Vector2(-l,0),Vector2(l,0),Color.WHITE,3)
		c.draw_set_transform(Vector2.ZERO)
	else:
		c.Visuals.oval(c,origin,Vector2(s.w/2,s.h/2),Color("ee7cff"))
		c.Visuals.oval(c,origin,Vector2(s.w/3,s.h/3),Color("ffe4ff"))
