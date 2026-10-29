extends SceneTree
## Regression: nearly transparent WebP margins must not squeeze industrial parts.
func _init():
	var failures = 0
	for index in 8:
		var part = Image.load_from_file("res://assets/industrial-props_%d.png" % index)
		if part == null:
			failures += 1
			continue
		var edges = [false,false,false,false]
		for x in part.get_width():
			edges[0] = edges[0] or part.get_pixel(x,0).a > 150.0/255
			edges[1] = edges[1] or part.get_pixel(x,part.get_height()-1).a > 150.0/255
		for y in part.get_height():
			edges[2] = edges[2] or part.get_pixel(0,y).a > 150.0/255
			edges[3] = edges[3] or part.get_pixel(part.get_width()-1,y).a > 150.0/255
		if false in edges:
			push_error("Transparent margin remains in industrial part %d" % index)
			failures += 1
	var level = JSON.parse_string(FileAccess.get_file_as_string("res://data/level1.json"))
	for index in level.platforms.size():
		var p = level.platforms[index]
		var platform = Image.load_from_file("res://assets/platform_%d.png" % index)
		if platform == null or platform.get_size() != Vector2i(ceili(p.w),maxi(100,720-p.y+36)):
			push_error("Platform dimensions differ from web: %d" % index)
			failures += 1
	print("Platform assets: 48 checks, %d failures" % failures)
	quit(1 if failures else 0)
