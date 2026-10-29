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
	print("Assets prepared offline; no chroma processing during gameplay.")
	quit()
