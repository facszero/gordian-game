extends RefCounted
## Native rendering of dist/style.css and dist/interface.css.
## Fixed text artwork preserves the web's Windows typography on Android.
static var atlas: Texture2D = preload("res://ui/web-labels.png")
static var logo: Texture2D = preload("res://ui/web-logo.png")
static var regions = JSON.parse_string(FileAccess.get_file_as_string("res://ui/web-labels.json"))

static func text_texture(key: String) -> AtlasTexture:
	var result = AtlasTexture.new()
	result.atlas = atlas
	var r = regions[key]
	result.region = Rect2(r[0],r[1],r[2],r[3])
	return result

static func ink(c,key,point,scale = 1.0,center = false):
	var tex = text_texture(key)
	var size = tex.get_size()/3*scale
	c.draw_texture_rect(tex,Rect2(point-Vector2(size.x/2 if center else 0,0),size),false)

static func gradient(c,rect: Rect2,top: Color,bottom: Color):
	c.draw_polygon(PackedVector2Array([rect.position,rect.position+Vector2(rect.size.x,0),rect.end,rect.position+Vector2(0,rect.size.y)]),PackedColorArray([top,top,bottom,bottom]))

static func panel(c,rect: Rect2,accent: Color,cut = false):
	c.draw_rect(Rect2(rect.position+Vector2(0,4),rect.size),Color("00000055"))
	if cut:
		var p = rect.position
		var w = rect.size.x
		var h = rect.size.y
		var points = PackedVector2Array([p+Vector2(12,0),p+Vector2(w-12,0),p+Vector2(w,12),p+Vector2(w,h),p+Vector2(0,h),p+Vector2(0,12)])
		c.draw_polygon(points,PackedColorArray([Color("183249f5"),Color("183249f5"),Color("13283cf5"),Color("091321f5"),Color("091321f5"),Color("13283cf5")]))
		points.append(points[0])
		c.draw_polyline(points,Color("526d83"),1,true)
		c.draw_line(p+Vector2(12,0),p+Vector2(w-12,0),accent,2,true)
	else:
		gradient(c,rect,Color("183249f5"),Color("091321f5"))
		c.draw_rect(rect,Color("526d83"),false,1)
		c.draw_line(rect.position,rect.position+Vector2(0,rect.size.y),accent,3)
	c.draw_line(rect.position+Vector2(12,2),rect.position+Vector2(rect.size.x-12,2),Color("b9eaff30"),1)

static func meter(c,rect: Rect2,value: float,color: Color,segment = 16.0):
	c.draw_rect(rect,Color("030a16"))
	var fill = clampf(value,0,1)*rect.size.x
	var x = 0.0
	while x < fill:
		var width = minf(segment-3,fill-x)
		c.draw_colored_polygon(PackedVector2Array([rect.position+Vector2(x+2,1),rect.position+Vector2(x+width,1),rect.position+Vector2(x+maxf(0,width-2),rect.size.y-1),rect.position+Vector2(x,rect.size.y-1)]),color)
		x += segment
	c.draw_rect(rect,Color("69a0b3"),false,1)

static func hud(c):
	gradient(c,Rect2(0,0,1280,95),Color("132a3e"),Color("050b14"))
	panel(c,Rect2(16,9,250,77),Color("73ddec"))
	ink(c,"active",Vector2(32,17))
	ink(c,c.sim.robot.to_upper(),Vector2(32,32))
	meter(c,Rect2(32,57,218,10),c.sim.player.health/c.sim.spec.maxHealth,Color("40d8eb"))
	c.label_at("ENERGÍA %d%%" % c.sim.energy,Vector2(33,80),11,Color("b1d6de"))
	c.label_at("VIDAS %d / 4" % c.sim.lives,Vector2(166,80),11,Color("f8cd84"))
	var b = c.sim.boss
	for elite in c.sim.elites:
		if elite.active and not elite.dead: b = elite
	if not b.is_empty() and b.active and not b.dead:
		panel(c,Rect2(390,10,500,72),Color("ff6c69"),true)
		var name = b.name.to_upper()
		c.draw_string(c.font,Vector2(410,32),name,HORIZONTAL_ALIGNMENT_CENTER,460,17,Color("f4ecd9"))
		var phase = b.get("phase",2 if b.hp <= b.maxHp/2 else 1)
		c.draw_string(c.font,Vector2(410,49),"FASE %d" % phase,HORIZONTAL_ALIGNMENT_CENTER,460,11,Color("f6aa9d"))
		meter(c,Rect2(410,59,460,10),b.hp/b.maxHp,Color("f65458"),21)
	else:
		panel(c,Rect2(430,10,420,72),Color("f5bd67"),true)
		ink(c,"number%d" % int(c.sim.level.id),Vector2(640,22),1,true)
		ink(c,"level%d" % int(c.sim.level.id),Vector2(640,42),minf(1,380/(text_texture("level%d" % int(c.sim.level.id)).get_width()/3)),true)
		c.draw_rect(Rect2(444,67,392,2),Color("53606c"))
		c.draw_rect(Rect2(444,67,392*clampf(c.sim.player.x/c.sim.level.exit,0,1),2),Color("edb45d"))

static func title(c):
	# Same three-stop horizontal overlay as the web menu.
	for strip in [[0.0,588.8,Color("030b17f5"),Color("081725d9")],[588.8,1280.0,Color("081725d9"),Color("08172533")]]:
		c.draw_polygon(PackedVector2Array([Vector2(strip[0],0),Vector2(strip[1],0),Vector2(strip[1],720),Vector2(strip[0],720)]),PackedColorArray([strip[2],strip[3],strip[3],strip[2]]))
	ink(c,"eyebrow",Vector2(77,122))
	c.draw_texture_rect(logo,Rect2(Vector2(73,151),logo.get_size()/3),false)
	ink(c,"subtitle",Vector2(77,265))
	c.draw_rect(Rect2(77,302,100,2),Color("ffc774"))
	ink(c,"intro1",Vector2(77,326))
	ink(c,"intro2",Vector2(77,349))
	ink(c,c.input_hint+"1",Vector2(77,534))
	ink(c,c.input_hint+"2",Vector2(77,556))
	ink(c,c.input_hint+"3",Vector2(77,578))
	ink(c,"edition",Vector2(77,618))
	c.draw_string_outline(c.font,Vector2(1010,552),"01",HORIZONTAL_ALIGNMENT_RIGHT,180,120,1,Color("91c5dd55"))
	ink(c,"side",Vector2(1056,581))
	ink(c,"side-small",Vector2(989,618))

static func button_style(primary = false,hover = false) -> StyleBoxTexture:
	var style = StyleBoxTexture.new()
	var texture = GradientTexture2D.new()
	texture.width = 32
	texture.height = 32
	texture.fill_from = Vector2(0,0)
	texture.fill_to = Vector2(1,0.65)
	texture.gradient = Gradient.new()
	texture.gradient.colors = PackedColorArray([Color("ffe3a8"),Color("ffd180")]) if primary and hover else PackedColorArray([Color("ffe2a1"),Color("edab48")]) if primary else PackedColorArray([Color("23445c"),Color("193247")]) if hover else PackedColorArray([Color("193247eb"),Color("0a1728eb")])
	style.texture = texture
	return style

static func menu_button(c,key,callback):
	var button = Button.new()
	button.name = "StartMission" if key == "start" else "ContinueMission"
	button.tooltip_text = "Iniciar misión" if key == "start" else "Continuar misión"
	button.custom_minimum_size = Vector2(280,50)
	button.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	button.add_theme_stylebox_override("normal",button_style(key == "start"))
	button.add_theme_stylebox_override("hover",button_style(key == "start",true))
	button.add_theme_stylebox_override("pressed",button_style(key == "start",true))
	var focus = StyleBoxFlat.new()
	focus.bg_color = Color.TRANSPARENT
	focus.border_color = Color("73ddec")
	focus.set_border_width_all(2)
	focus.set_expand_margin_all(3)
	button.add_theme_stylebox_override("focus",focus)
	button.pressed.connect(callback)
	var label = TextureRect.new()
	label.texture = text_texture(key)
	label.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	label.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.offset_left = 30
	label.offset_right = -30
	label.offset_top = 18
	label.offset_bottom = -18
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	button.add_child(label)
	c.menu.add_child(button)
	return button
