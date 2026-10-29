extends RefCounted
## Native equivalents of the Canvas drawing in dist/src/game.js and weapons.js.

static func robot(canvas: Node2D, texture: Texture2D, center: Vector2, height: float, face: int, aim_up: bool, alpha: float, standing_height = 90.0):
	var h = height * (1.21 if height < standing_height else 1.145)
	var w = texture.get_width()*h/texture.get_height()
	var size = texture.get_size()
	var color = Color(1,1,1,alpha)
	var base = Transform2D(0,Vector2(face,1),0,center)
	canvas.draw_set_transform_matrix(base)
	if aim_up:
		canvas.draw_texture_rect_region(texture,Rect2(-w/2,-h*0.66,w,h*0.66),Rect2(0,size.y*0.34,size.x,size.y*0.66),color)
		canvas.draw_texture_rect_region(texture,Rect2(-w/2,-h,w*0.54,h*0.34),Rect2(0,0,size.x*0.54,size.y*0.34),color)
		canvas.draw_set_transform_matrix(base * Transform2D(-PI/2,Vector2(w*0.04,-h*0.77)))
		canvas.draw_texture_rect_region(texture,Rect2(0,-h*0.23,w*0.46,h*0.34),Rect2(size.x*0.54,0,size.x*0.46,size.y*0.34),color)
	else:
		canvas.draw_texture_rect(texture,Rect2(-w/2,-h,w,h),false,color)
	canvas.draw_set_transform_matrix(Transform2D.IDENTITY)

static func oval(c: Node2D, center: Vector2, radius: Vector2, color: Color, outline = false, width = 1.5):
	var points = PackedVector2Array()
	for i in 33:
		var angle = TAU*i/32
		points.append(center+Vector2(cos(angle),sin(angle))*radius)
	if outline: c.draw_polyline(points,color,width,true)
	else: c.draw_colored_polygon(points,color)

static func shot(c: Node2D, s: Dictionary, camera: float):
	c.draw_set_transform(Vector2(s.x-camera,s.y),atan2(s.vy,s.vx))
	if s.friendly:
		var length = maxf(s.w,s.h)
		var radius = minf(s.w,s.h)/2
		var dellinger = s.get("robot","protesser") == "dellinger"
		var garbin = s.get("robot","") == "garbin"
		var color = Color("78cfff") if garbin else Color("ff564b") if dellinger else Color("54ff9e")
		var core = Color.WHITE if garbin else Color("fff0cb") if dellinger else Color("deffe9")
		c.draw_polygon(PackedVector2Array([Vector2(-length*1.6,0),Vector2(length*0.2,-radius*0.8),Vector2(length*0.45,0),Vector2(length*0.2,radius*0.8)]),PackedColorArray([Color(color,0),Color(color,0.55),color,Color(color,0.55)]))
		oval(c,Vector2.ZERO,Vector2(length*0.55,radius*1.8),Color(color,0.12))
		if garbin:
			c.draw_rect(Rect2(-length*0.45,-radius,length*0.8,radius*2),color)
			oval(c,Vector2(length*0.35,0),Vector2(length*0.15,radius),core)
			c.draw_line(Vector2(-length*0.4,0),Vector2(length*0.35,0),core,maxf(2,radius*0.8),true)
			if s.get("charged",false):
				for x in [-length*0.3,0,length*0.3]: oval(c,Vector2(x,0),Vector2(3,radius*1.25),color,true)
				c.draw_polyline(PackedVector2Array([Vector2(-length*0.8,0),Vector2(-length*0.5,-radius),Vector2(-length*0.1,radius),Vector2(length*0.3,0)]),Color("bdeaff"),1.5,true)
		elif dellinger:
			c.draw_colored_polygon(PackedVector2Array([Vector2(length*0.5,0),Vector2(length*0.12,-radius),Vector2(-length*0.5,-radius*0.6),Vector2(-length*0.3,0),Vector2(-length*0.5,radius*0.6),Vector2(length*0.12,radius)]),color)
			c.draw_line(Vector2(-length*0.25,0),Vector2(length*0.28,0),core,maxf(2,radius*0.6),true)
			if s.get("charged",false):
				for x in [-length*0.35,-length*0.7]: c.draw_polyline(PackedVector2Array([Vector2(x-radius*0.5,-radius*1.2),Vector2(x+radius*0.5,0),Vector2(x-radius*0.5,radius*1.2)]),Color("ffbd76"),2,true)
		else:
			oval(c,Vector2.ZERO,Vector2(length*0.5,radius),color)
			oval(c,Vector2(length*0.12,0),Vector2(length*0.3,radius*0.4),core)
		if s.get("charged",false) and not dellinger and not garbin:
			oval(c,Vector2.ZERO,Vector2(length*0.42,radius*1.3),core,true)
			c.draw_polyline(PackedVector2Array([Vector2(-length*0.45,-radius),Vector2(-length*0.65,-radius),Vector2(-length*0.85,0),Vector2(-length*0.65,radius),Vector2(-length*0.45,radius)]),color,2,true)
	else:
		c.draw_line(Vector2(-Vector2(s.vx,s.vy).length()*0.025,0),Vector2.ZERO,Color("fb5f50"),minf(s.w,s.h)*0.55,true)
		oval(c,Vector2.ZERO,Vector2(s.w/2,s.h/2),Color("ff9a68"))
	c.draw_set_transform(Vector2.ZERO)

static func effect(c: Node2D, e: Dictionary, camera: float):
	var p = e.age/e.duration
	var r = (26 if e.charged else 13)*((1-p) if e.kind == "muzzle" else (0.4+p))
	var dellinger = e.get("robot","protesser") == "dellinger"
	var garbin = e.get("robot","") == "garbin"
	var color = Color("78cfff") if garbin else Color("ff564b") if dellinger else Color("54ff9e")
	var core = Color.WHITE if garbin else Color("fff0cb") if dellinger else Color("deffe9")
	color.a = (1-p)*0.85
	core.a = color.a
	c.draw_set_transform(Vector2(e.x-camera,e.y),e.angle)
	if e.kind == "muzzle":
		oval(c,Vector2(3,0),Vector2(r*0.65,r*0.28),core)
		c.draw_line(Vector2(0,-r*0.65),Vector2(0,r*0.65),color,2,true)
		c.draw_line(Vector2(-r*0.35,0),Vector2(r,0),color,2,true)
	else:
		oval(c,Vector2.ZERO,Vector2(r*0.65 if dellinger else r,r),color,true,3 if e.charged else 2)
		var rays = 8 if garbin else 6
		for i in rays:
			var direction = Vector2.from_angle(i*TAU/rays)
			c.draw_line(direction*r*0.65,direction*r*1.35,color if i%2 else core,1.5,true)
		oval(c,Vector2.ZERO,Vector2.ONE*maxf(1,r*(1-p)*0.3),core)
	c.draw_set_transform(Vector2.ZERO)

static func control(c: Node2D, action: String, rect: Rect2, active: bool):
	var center = rect.get_center()
	var color = Color(1.0,0.88,0.66,0.95 if active else 0.68) if action in ["fire","charge"] else Color(0.84,0.93,0.96,0.95 if active else 0.68)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.12,0.32,0.42,0.26 if active else 0.07)
	style.border_color = Color(color,0.65 if active else 0.24)
	style.set_border_width_all(2)
	style.set_corner_radius_all(12 if action in ["left","right","up","crouch"] else 48)
	c.draw_style_box(style,rect)
	c.draw_set_transform(center)
	if action in ["left","right","up","crouch"]:
		var direction = {"left":Vector2.LEFT,"right":Vector2.RIGHT,"up":Vector2.UP,"crouch":Vector2.DOWN}[action]
		var normal = Vector2(-direction.y,direction.x)
		c.draw_colored_polygon(PackedVector2Array([direction*19,-direction*10+normal*15,-direction*10-normal*15]),color)
	elif action == "fire":
		c.draw_arc(Vector2.ZERO,12,0,TAU,32,color,2,true)
		c.draw_line(Vector2(-23,0),Vector2(23,0),color,2,true)
		c.draw_line(Vector2(0,-23),Vector2(0,23),color,2,true)
	elif action == "charge":
		c.draw_colored_polygon(PackedVector2Array([Vector2(10,-23),Vector2(-15,3),Vector2(-2,3),Vector2(-10,23),Vector2(17,-5),Vector2(3,-5)]),color)
	elif action == "jump":
		c.draw_line(Vector2(0,19),Vector2(0,-19),color,3,true)
		c.draw_polyline(PackedVector2Array([Vector2(-13,-5),Vector2(0,-19),Vector2(13,-5)]),color,3,true)
		c.draw_line(Vector2(-17,21),Vector2(17,21),color,3,true)
	c.draw_set_transform(Vector2.ZERO)
