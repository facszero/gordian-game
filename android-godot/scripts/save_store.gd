extends RefCounted
const PATH = "user://level1.json"

static func read_save(level: Dictionary, path = PATH) -> Dictionary:
	if not FileAccess.file_exists(path): return {}
	var parser = JSON.new()
	if parser.parse(FileAccess.get_file_as_string(path)) != OK: return {}
	var data = parser.data
	if not data is Dictionary: return {}
	if (data.get("version") != 1 and data.get("version") != 2) or data.get("level_id") != level.id: return {}
	if data.version == 1 and level.id != 1: return {}
	if not data.has("destroyed"): data.destroyed = []
	for field in ["lives","checkpoint","kills","cells","elapsed"]:
		if not (data.get(field) is float or data.get(field) is int): return {}
		if not is_finite(float(data[field])): return {}
	if data.lives < 1 or data.lives > 4: return {}
	if data.checkpoint < -1 or data.checkpoint >= level.checkpoints.size(): return {}
	data.checkpoint = int(data.checkpoint)
	for spec in [["defeated",level.enemies.size()],["collected",level.pickups.size()],["destroyed",level.get("barriers",[]).size()]]:
		if not data.get(spec[0]) is Array: return {}
		var clean = []
		for id in data[spec[0]]:
			if (id is int or id is float) and is_finite(float(id)) and id == floor(id) and id >= 0 and id < spec[1] and int(id) not in clean:
				clean.append(int(id))
		data[spec[0]] = clean
	if data.get("stage") not in ["play","transition","complete"]: data.stage = "play"
	data.kills = maxi(0,int(data.kills))
	data.cells = maxi(0,int(data.cells))
	data.elapsed = maxf(0,data.elapsed)
	return data

static func write_save(data: Dictionary, path = PATH) -> Error:
	var temp = path+".tmp"
	var file = FileAccess.open(temp,FileAccess.WRITE)
	if file == null: return FileAccess.get_open_error()
	file.store_string(JSON.stringify(data))
	file.flush()
	file.close()
	# Retain last known good save if replacement fails.
	return DirAccess.rename_absolute(temp,path)
