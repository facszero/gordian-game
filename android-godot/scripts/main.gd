extends Node2D
const Simulation = preload("res://scripts/simulation.gd")
const Saves = preload("res://scripts/save_store.gd")
const Visuals = preload("res://scripts/visuals.gd")
var sim
var textures = {}
var fingers = {}
var controls = {"left":Rect2(28,508,84,84),"right":Rect2(204,508,84,84),"up":Rect2(116,420,84,84),"crouch":Rect2(116,596,84,84),"jump":Rect2(1160,588,92,92),"fire":Rect2(1160,484,92,92),"charge":Rect2(1168,396,76,76)}
var font = ThemeDB.fallback_font
var ui: Control
var panel: PanelContainer
var menu: VBoxContainer
var status: Label
var music: AudioStreamPlayer
var shot_audio: AudioStreamPlayer
var charge_audio: AudioStreamPlayer
var synth: AudioStreamPlayer
var sound_on = true
var last_mode = ""
var toast = ""
var toast_time = 0.0
var autosave = 0.0
var tones = {}
var skip_button: Button

func _ready():
	get_tree().auto_accept_quit = false
	get_tree().quit_on_go_back = false
	var data = JSON.parse_string(FileAccess.get_file_as_string("res://data/level1.json"))
	sim = Simulation.new(data)
	textures["platforms"] = []
	for i in sim.level.platforms.size(): textures["platforms"].append(load("res://assets/platform_%d.png" % i))
	for entry in [["protesser",8],["enemy-army",8],["stations",4],["industrial-props",8],["energy-atom",1],["coupling-front",12],["companion",8]]:
		var frames = []
		for i in entry[1]: frames.append(load("res://assets/%s_%d.png" % [entry[0],i]))
		textures[entry[0]] = frames
	for name in ["canyon","hangar-background"]: textures[name] = load("res://assets/"+name+".webp")
	setup_inputs()
	music = audio("IntroGordian",-14)
	shot_audio = audio("LivianaSimple1",-10)
	charge_audio = audio("PesadaSimple1",-10)
	synth = AudioStreamPlayer.new()
	add_child(synth)
	for kind in ["jump","pickup","checkpoint","hit","explosion"]:
		tones[kind] = make_tone(kind)
	var layer = CanvasLayer.new()
	add_child(layer)
	ui = Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(ui)
	panel = PanelContainer.new()
	panel.position = Vector2(380,160)
	panel.size = Vector2(520,400)
	ui.add_child(panel)
	menu = VBoxContainer.new()
	menu.add_theme_constant_override("separation",18)
	panel.add_child(menu)
	var pause_button = Button.new()
	pause_button.text = "PAUSA"
	pause_button.position = Vector2(1120,22)
	pause_button.size = Vector2(135,55)
	pause_button.pressed.connect(toggle_pause)
	ui.add_child(pause_button)
	var mute_button = Button.new()
	mute_button.text = "SONIDO ON"
	mute_button.position = Vector2(950,22)
	mute_button.size = Vector2(155,55)
	mute_button.pressed.connect(func():
		sound_on = not sound_on
		AudioServer.set_bus_mute(0,not sound_on)
		mute_button.text = "SONIDO ON" if sound_on else "SONIDO OFF")
	ui.add_child(mute_button)
	skip_button = Button.new()
	skip_button.text = "OMITIR ACOPLAMIENTO"
	skip_button.position = Vector2(940,620)
	skip_button.size = Vector2(310,60)
	skip_button.pressed.connect(func():
		if sim.mode == "transition":
			sim.mode = "complete"
			persist()
			refresh_menu())
	ui.add_child(skip_button)
	refresh_menu()
	if "--capture" in OS.get_cmdline_user_args():
		sim.reset()
		sim.mode = "play"
		refresh_menu()
		await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png("user://level1-preview.png")
		print("PREVIEW: ",ProjectSettings.globalize_path("user://level1-preview.png"))
		get_tree().quit()

func audio(name: String, volume: float) -> AudioStreamPlayer:
	var node = AudioStreamPlayer.new()
	node.stream = load("res://assets/"+name+".mp3")
	node.volume_db = volume
	add_child(node)
	return node

func setup_inputs():
	var keys = {"left":[KEY_LEFT,KEY_A],"right":[KEY_RIGHT,KEY_D],"up":[KEY_UP,KEY_W],"crouch":[KEY_DOWN,KEY_S],"jump":[KEY_SPACE,KEY_Z],"fire":[KEY_X,KEY_J],"charge":[KEY_C,KEY_K],"pause_game":[KEY_ESCAPE]}
	for action in keys:
		InputMap.add_action(action)
		for key in keys[action]:
			var event = InputEventKey.new()
			event.physical_keycode = key
			InputMap.action_add_event(action,event)
	var buttons = {"jump":JOY_BUTTON_A,"fire":JOY_BUTTON_X,"charge":JOY_BUTTON_B,"pause_game":JOY_BUTTON_START,"left":JOY_BUTTON_DPAD_LEFT,"right":JOY_BUTTON_DPAD_RIGHT,"up":JOY_BUTTON_DPAD_UP,"crouch":JOY_BUTTON_DPAD_DOWN}
	for action in buttons:
		var event = InputEventJoypadButton.new()
		event.button_index = buttons[action]
		InputMap.action_add_event(action,event)
	for spec in [["left",JOY_AXIS_LEFT_X,-1.0],["right",JOY_AXIS_LEFT_X,1.0],["up",JOY_AXIS_LEFT_Y,-1.0],["crouch",JOY_AXIS_LEFT_Y,1.0]]:
		var event = InputEventJoypadMotion.new()
		event.axis = spec[1]
		event.axis_value = spec[2]
		InputMap.action_add_event(spec[0],event)

func _input(event):
	if event is InputEventScreenTouch:
		if event.pressed and sim.mode == "play": fingers[event.index] = event.position
		else: fingers.erase(event.index)
	elif event is InputEventScreenDrag and fingers.has(event.index):
		fingers[event.index] = event.position
	if event.is_action_pressed("pause_game"): toggle_pause()

func _notification(what):
	if sim == null: return
	if what in [NOTIFICATION_APPLICATION_PAUSED,NOTIFICATION_APPLICATION_FOCUS_OUT]:
		sim.pause()
		fingers.clear()
		persist()
		if music: music.stream_paused = true
		stop_effects()
		refresh_menu()
	elif what == NOTIFICATION_APPLICATION_FOCUS_IN:
		if music: music.stream_paused = false
	elif what == NOTIFICATION_WM_GO_BACK_REQUEST: toggle_pause()
	elif what == NOTIFICATION_WM_CLOSE_REQUEST:
		persist()
		get_tree().quit()

func persist():
	if sim.mode == "menu": return
	if Saves.write_save(sim.snapshot()) != OK:
		toast = "No se pudo guardar. Revisá el espacio disponible."
		toast_time = 8

func toggle_pause():
	if sim.mode == "pause": sim.resume()
	else: sim.pause()
	fingers.clear()
	stop_effects()
	persist()
	refresh_menu()

func refresh_menu():
	for child in menu.get_children():
		menu.remove_child(child)
		child.queue_free()
	last_mode = sim.mode
	skip_button.visible = sim.mode == "transition"
	panel.visible = sim.mode in ["menu","pause","complete","game_over"]
	if not panel.visible:
		music.stop()
		return
	var heading = Label.new()
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.add_theme_font_size_override("font_size",32)
	heading.text = {"menu":"GORDIAN · EL DESPERTAR","pause":"MISIÓN EN PAUSA","complete":"NIVEL 1 COMPLETADO","game_over":"MISIÓN TERMINADA"}[sim.mode]
	menu.add_child(heading)
	var subtitle = Label.new()
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.text = "VICTOR TOWN · PROTESSER\nPrototipo Android · Nivel 1 completo"
	menu.add_child(subtitle)
	if sim.mode == "pause": add_button("CONTINUAR",toggle_pause)
	if sim.mode == "menu" and not Saves.read_save(sim.level).is_empty():
		add_button("RECUPERAR PARTIDA",func():
			sim.reset(Saves.read_save(sim.level))
			refresh_menu())
	add_button("INICIAR MISIÓN" if sim.mode == "menu" else "REINICIAR NIVEL",func():
		sim.reset()
		persist()
		refresh_menu())
	if sim.mode != "menu":
		add_button("GUARDAR Y VOLVER AL MENÚ",func():
			persist()
			sim.mode = "menu"
			refresh_menu())
	var help = Label.new()
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	help.text = "← → / A D mover · Z / espacio saltar\nX disparar · C potente · ↑ apuntar · ↓ agacharse\nDoble salto: soltar y volver a pulsar salto"
	menu.add_child(help)
	if sim.mode == "complete": subtitle.text = "Llegaste al hangar y completaste el acoplamiento.\nLa campaña continúa en la versión web."
	if sim.mode == "menu" and not music.playing: music.play()
	var first = menu.find_children("*","Button",false,false)
	if not first.is_empty(): first[0].grab_focus()

func add_button(title: String, callback: Callable):
	var b = Button.new()
	b.text = title
	b.custom_minimum_size.y = 50
	b.pressed.connect(callback)
	menu.add_child(b)

func _physics_process(dt):
	if sim == null: return
	var actions = {}
	for action in controls:
		actions[action] = Input.is_action_pressed(action)
		for point in fingers.values():
			if controls[action].has_point(point): actions[action] = true
	sim.update(dt,actions)
	for event in sim.events:
		if event == "save": persist()
		elif event == "shot": shot_audio.play()
		elif event == "charge": charge_audio.play()
		elif event in ["jump","pickup","checkpoint","hit","explosion"]: tone(event)
		if event == "checkpoint":
			toast = "PUNTO DE CONTROL · SISTEMAS RESTAURADOS"
			toast_time = 3
	autosave += dt
	if autosave >= 10 and sim.mode == "play":
		persist()
		autosave = 0
	toast_time = maxf(0,toast_time-dt)
	if last_mode != sim.mode:
		fingers.clear()
		refresh_menu()
	queue_redraw()

func stop_effects():
	for node in [shot_audio,charge_audio,synth]:
		if node: node.stop()

func _exit_tree():
	stop_effects()
	if music: music.stop()

func tone(kind: String):
	synth.stream = tones[kind]
	synth.play()

func make_tone(kind: String) -> AudioStreamWAV:
	var sample = AudioStreamWAV.new()
	sample.format = AudioStreamWAV.FORMAT_16_BITS
	sample.mix_rate = 22050
	var count = 4410
	var bytes = PackedByteArray()
	bytes.resize(count*2)
	var frequency = 660.0 if kind in ["pickup","checkpoint"] else 220.0 if kind == "jump" else 80.0
	for i in count:
		var wave = sin(TAU*frequency*i/22050.0)*0.2*(1.0-float(i)/count)
		bytes.encode_s16(i*2,int(wave*32767))
	sample.data = bytes
	return sample

func label_at(text: String, pos: Vector2, size = 20, color = Color.WHITE):
	draw_string(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,color)

func picture(texture: Texture2D, rect: Rect2, flip = false, alpha = 1.0):
	if flip:
		draw_set_transform(Vector2(rect.end.x,rect.position.y),0,Vector2(-1,1))
		draw_texture_rect(texture,Rect2(Vector2.ZERO,rect.size),false,Color(1,1,1,alpha))
		draw_set_transform(Vector2.ZERO)
	else: draw_texture_rect(texture,rect,false,Color(1,1,1,alpha))

func sprite_at(key: String, index: int, center: float, feet: float, height: float, flip = false, alpha = 1.0):
	var texture = textures[key][index]
	var width = texture.get_width()*height/texture.get_height()
	picture(texture,Rect2(center-width/2,feet-height,width,height),flip,alpha)

func _draw():
	if sim == null or textures.is_empty(): return
	var transition = sim.mode == "transition" or (sim.mode == "pause" and sim.before_pause == "transition") or sim.mode == "complete"
	if transition:
		draw_texture_rect(textures["hangar-background"],Rect2(0,0,1280,720),false)
		var cues = [0,3,3.8,4.6,5.4,6.2,6.9,7.6,8.1,8.6,9.1]
		var pose = 0
		for i in cues.size():
			if sim.timer >= cues[i]: pose = i
		sprite_at("coupling-front",pose,810,604,490)
		if sim.timer > 0.9 and sim.timer < 3:
			var t = smoothstep(0,1,(sim.timer-0.9)/2.1)
			sprite_at("coupling-front",11,420+390*t,636-32*t,330+100*t)
		label_at("ACOPLAMIENTO · PROTESSER + DELLINGER",Vector2(50,250),24)
		label_at("VICTOR TOWN · MISIÓN COMPLETADA",Vector2(50,290),20)
		return
	var bg = textures.canyon
	var scale_bg = maxf(1280.0/bg.get_width(),720.0/bg.get_height())*1.22
	var size_bg = bg.get_size()*scale_bg
	draw_texture_rect(bg,Rect2(-sim.camera/(sim.level.width-1280)*(size_bg.x-1280),-(size_bg.y-720)*0.35,size_bg.x,size_bg.y),false)
	draw_rect(Rect2(0,0,1280,720),Color(0.03,0.07,0.12,0.18))
	for platform_index in sim.level.platforms.size():
		var p = sim.level.platforms[platform_index]
		if p.x+p.w < sim.camera or p.x > sim.camera+1280: continue
		var x = p.x-sim.camera
		draw_texture(textures["platforms"][platform_index],Vector2(x,p.y-36))
	sprite_at("stations",0,170-sim.camera,560,205)
	var exit_floor = 560.0
	for p in sim.level.platforms:
		if sim.level.exit >= p.x and sim.level.exit < p.x+p.w: exit_floor = p.y
	sprite_at("stations",1,sim.level.exit-sim.camera,exit_floor,205)
	for i in sim.level.checkpoints.size():
		var cp = sim.level.checkpoints[i]
		var feet = cp.y+90
		for p in sim.level.platforms:
			if cp.x >= p.x and cp.x < p.x+p.w and p.y >= cp.y+88:
				feet = p.y
				break
		sprite_at("stations",3 if i <= sim.checkpoint else 2,cp.x+24-sim.camera,feet,80)
		label_at("CP "+str(i+1),Vector2(cp.x-sim.camera,feet-90),16,Color.CYAN)
	for p in sim.pickups:
		if not p.taken: sprite_at("energy-atom",0,p.x+12-sim.camera,p.y+24,32)
	for e in sim.enemies:
		if e.dead or absf(e.x-sim.camera-640)>800: continue
		var tex = textures["enemy-army"][int(e.frame)+(1 if e.flash>0 else 0)]
		picture(tex,Rect2(e.x-10-sim.camera,e.y-3,e.w+20,e.h+3),sim.player.x+19 < e.x+e.w/2)
		if e.timer < 0.4: draw_circle(Vector2(e.x+e.w/2-sim.camera,e.y-10),5,Color.ORANGE)
	if sim.companion.active:
		var cat = sim.companion
		var tex = textures.companion[int(cat.frame)]
		sprite_at("companion",int(cat.frame),cat.x-sim.camera,cat.feet,112.0*tex.get_height()/tex.get_width())
	if sim.mode != "dead":
		var p = sim.player
		var frame = 7 if p.crouching else 4 if p.aim_up else 6 if not p.grounded else int(sim.clock*11)%4 if absf(p.vx)>10 else 5 if sim.cooldown>0.08 else 4
		Visuals.robot(self,textures["protesser"][frame],Vector2(p.x+19-sim.camera,p.y+p.h),p.h,p.face,p.aim_up,0.45 if sim.invulnerable>0 and int(sim.clock*12)%2 else 1.0)
	for s in sim.shots:
		Visuals.shot(self,s,sim.camera)
	for effect in sim.effects: Visuals.effect(self,effect,sim.camera)
	draw_rect(Rect2(0,0,1280,95),Color(0.02,0.05,0.09,0.92))
	label_at("PROTESSER",Vector2(25,30),24,Color("efc983"))
	draw_rect(Rect2(25,43,240,13),Color("344455"))
	draw_rect(Rect2(25,43,240*sim.player.health/100,13),Color("60dfbb"))
	label_at("ENERGÍA %d%% · VIDAS %d / 4" % [sim.energy,sim.lives],Vector2(25,80),18)
	label_at("NIVEL 01 · VICTOR TOWN",Vector2(380,32),22)
	label_at("CÉLULAS %d / %d · ENEMIGOS %d" % [sim.cells,sim.pickups.size(),sim.kills],Vector2(380,62),18)
	draw_rect(Rect2(380,76,480*clampf(sim.player.x/sim.level.exit,0,1),4),Color.CYAN)
	if sim.mode == "play":
		for action in controls:
			var rect = controls[action]
			var active = Input.is_action_pressed(action)
			for point in fingers.values(): active = active or rect.has_point(point)
			Visuals.control(self,action,rect,active)
	if toast_time>0: label_at(toast,Vector2(380,130),20,Color.CYAN)
