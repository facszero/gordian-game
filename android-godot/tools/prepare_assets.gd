extends SceneTree

func _init():
	var specs = JSON.parse_string(FileAccess.get_file_as_string("res://data/atlas-spec.json"))
	DirAccess.make_dir_recursive_absolute("res://assets")
	DirAccess.copy_absolute("res://../dist/icons/icon-512.png","res://assets/icon.png")
	for key in specs:
		var spec = specs[key]
		var img = Image.load_from_file(ProjectSettings.globalize_path("res://../dist/assets/" + key + ".webp"))
		if img == null:
			push_error("Missing image: " + key)
			quit(1)
			return
		img.convert(Image.FORMAT_RGBA8)
		for y in img.get_height():
			for x in img.get_width():
				var c = img.get_pixel(x,y)
				var remove = c.g > 100.0/255 and c.g > c.r*1.35 and c.g > c.b*1.35 if spec.key == "green" else c.r > 100.0/255 and c.b > 100.0/255 and c.r > c.g*1.5 and c.b > c.g*1.5
				if remove:
					c.a = 0
					img.set_pixel(x,y,c)
		var index = 0
		for region in spec.regions:
			var rect = Rect2i(roundi(region[0]*img.get_width()),roundi(region[1]*img.get_height()),roundi(region[2]*img.get_width()),roundi(region[3]*img.get_height()))
			rect = rect.intersection(Rect2i(0,0,img.get_width(),img.get_height()))
			var frame = img.get_region(rect)
			if not spec.get("preserve",false):
				frame = frame.get_region(frame.get_used_rect())
			if frame.save_png("res://assets/%s_%d.png" % [key,index]) != OK:
				quit(1)
				return
			index += 1
	for key in ["canyon","hangar-background"]:
		DirAccess.copy_absolute("res://../dist/assets/"+key+".webp","res://assets/"+key+".webp")
	for key in ["IntroGordian","LivianaSimple1","PesadaSimple1"]:
		DirAccess.copy_absolute("res://../dist/audio/"+key+".mp3","res://assets/"+key+".mp3")
	prepare_platforms()
	print("Assets prepared offline; no chroma processing during gameplay.")
	quit()

func stamp(canvas: Image, part: Image, x: float, y: float, w: float, h: float):
	var scaled = part.duplicate()
	scaled.resize(maxi(1,roundi(w)),maxi(1,roundi(h)),Image.INTERPOLATE_BILINEAR)
	canvas.blend_rect(scaled,Rect2i(0,0,scaled.get_width(),scaled.get_height()),Vector2i(roundi(x),roundi(y)))

func prepare_platforms():
	# Same layers, clipping and dimensions as environment.js buildPlatform().
	var level = JSON.parse_string(FileAccess.get_file_as_string("res://data/level1.json"))
	var parts = []
	for i in 8: parts.append(Image.load_from_file("res://assets/industrial-props_%d.png" % i))
	for index in level.platforms.size():
		var p = level.platforms[index]
		var canvas = Image.create(ceili(p.w),maxi(100,720-p.y+36),false,Image.FORMAT_RGBA8)
		var depth = canvas.get_height()-68
		if p.w > 300:
			for x in range(28,int(p.w)-40,180):
				stamp(canvas,parts[3],x+9,69,132,maxi(140,depth))
				stamp(canvas,parts[2],x,65,23,maxi(160,depth))
			stamp(canvas,parts[6],30,94,minf(220,p.w-60),24)
			if floori(p.x/100)%2 == 0: stamp(canvas,parts[5],p.w-62,84,25,maxi(110,depth))
			for x in range(18,int(p.w)-20,160):
				stamp(canvas,parts[4],x,5,minf(148,p.w-x-8),32)
		var count = ceili(p.w/210)
		for i in count:
			var x = roundi(i*p.w/count)
			var end = roundi((i+1)*p.w/count)
			stamp(canvas,parts[0],x,36,end-x,45)
		canvas.fill_rect(Rect2i(0,37,canvas.get_width(),1),Color("d7b18a"))
		if p.w > 300:
			stamp(canvas,parts[7],10,54,14,23)
			stamp(canvas,parts[7],p.w-25,54,14,23)
		if canvas.save_png("res://assets/platform_%d.png" % index) != OK:
			push_error("Could not generate platform " + str(index))
			quit(1)
			return
