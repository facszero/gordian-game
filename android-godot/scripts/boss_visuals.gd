extends RefCounted
static func draw(c: Node2D):
	var b = c.sim.boss
	if b.is_empty() or b.dead or b.x > c.sim.camera+1380: return
	var frame = posmod(floori(-b.walkDistance/10),4)
	var tint = Color(1.8,1.8,1.8) if b.flash > 0 else Color.WHITE
	c.draw_texture_rect(c.textures["boss-walk"][frame],Rect2(b.x-c.sim.camera,b.floor-b.h,b.w,b.h),false,tint)
	if b.active: c.draw_line(Vector2(b.left-c.sim.camera,b.floor-200),Vector2(b.left-c.sim.camera,b.floor),Color("ee734c"),4,true)
	if b.state == "warning":
		var color = Color(1,0.41,0.31,0.35+sin(c.sim.clock*18)*0.15)
		if b.attack == "shell":
			c.draw_rect(Rect2(b.targetX-75-c.sim.camera,b.floor-8,150,8),color)
			c.draw_line(Vector2(b.targetX-c.sim.camera,b.floor-190),Vector2(b.targetX-c.sim.camera,b.floor),color,2,true)
		elif b.attack == "burst": c.draw_line(Vector2(b.x+100-c.sim.camera,b.floor-110),Vector2(b.targetX-c.sim.camera,b.targetY),color,2,true)
		else:
			var y = b.floor-(110 if b.attack == "beam" else 16)
			c.draw_line(Vector2(b.left-c.sim.camera,y),Vector2(b.x+140-c.sim.camera,y),color,3,true)
		c.draw_circle(Vector2(b.x+210-c.sim.camera,b.floor-265),9,Color("ff6d67"))
	for h in b.hazards:
		c.draw_rect(Rect2(h.x-c.sim.camera-5,h.y-5,h.w+10,h.h+10),Color(1,0.4,0.3,0.15))
		c.draw_rect(Rect2(h.x-c.sim.camera,h.y,h.w,h.h),Color(1,0.47,0.33,0.75))
