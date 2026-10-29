extends SceneTree
const Sim = preload("res://scripts/simulation.gd")
const Saves = preload("res://scripts/save_store.gd")
var failures = 0
var checks = 0

func check(condition: bool, description: String):
	checks += 1
	if not condition:
		failures += 1
		push_error(description)

func _init():
	var level = JSON.parse_string(FileAccess.get_file_as_string("res://data/level1.json"))
	check(level.exit == 11730 and level.platforms.size() == 40,"Full extended level geometry")
	check(level.enemies.size() == 26 and level.checkpoints.size() == 5 and level.pickups.size() == 18,"Full level population")
	var s = Sim.new(level)
	s.reset()
	s.mode = "play"
	for i in 120: s.update(1.0/120,{"right":true})
	check(absf(s.player.x-460)<0.01,"Original 310 units/sec movement")
	check(s.player.grounded,"Landed on first platform")
	s.update(1.0/120,{"jump":true})
	check(s.player.vy < -700,"First jump")
	s.update(1.0/120,{})
	s.update(1.0/120,{"jump":true})
	check(s.air_jumps == 0 and s.player.vy < -700,"Second jump after release")
	s.update(1.0/120,{})
	s.update(1.0/120,{"jump":true})
	check(s.air_jumps == 0 and s.player.vy > -730,"No third jump")
	s.pause()
	var x = s.player.x
	var clock = s.clock
	s.update(1.0,{"right":true})
	check(s.player.x == x and s.clock == clock,"Pause freezes simulation")
	s.resume()
	s.player.grounded = true
	s.player.y = 470
	s.stance(true)
	check(s.player.h == 48 and s.player.y+48 == 560,"Crouch preserves feet")
	s.stance(false)
	s.player.aim_up = true
	s.shots.clear()
	s.fire(true)
	check(s.shots[0].vy == -900 and s.shots[0].vx == 0 and s.energy == 65,"Vertical charged shot")
	s.player.aim_up = false
	s.enemies[0].hp = 1
	s.player.x = s.enemies[0].x-40
	s.player.y = s.enemies[0].y
	s.fire(false)
	for i in 20: s.update(1.0/120,{})
	check(s.enemies[0].dead,"Enemy can be defeated by projectile")
	s.reset()
	s.mode = "play"
	s.player.x = level.pickups[0].x
	s.player.y = level.pickups[0].y
	s.update(1.0/120,{})
	check(s.cells == 1 and s.pickups[0].taken,"Pickup collected")
	# Every checkpoint and persistence state is exercised independently.
	for cp in range(level.checkpoints.size()):
		s.player.x = level.checkpoints[cp].x+1
		s.player.y = level.checkpoints[cp].y
		s.player.vy = 0
		s.update(1.0/120,{})
		check(s.checkpoint == cp,"Checkpoint %d" % cp)
	var path = "user://test-save.json"
	check(Saves.write_save(s.snapshot(),path) == OK,"First save")
	s.cells = 2
	check(Saves.write_save(s.snapshot(),path) == OK,"Atomic replacement of existing save")
	var saved = Saves.read_save(level,path)
	check(not saved.is_empty() and saved.checkpoint == 4 and saved.cells == 2,"Saved state read back")
	var resumed = Sim.new(level)
	resumed.reset(saved)
	check(resumed.player.x == level.checkpoints[4].x and resumed.pickups[0].taken,"Checkpoint and collected IDs restored")
	resumed.lose_life()
	for i in 150: resumed.update(1.0/120,{})
	check(resumed.lives == 3 and resumed.player.x == level.checkpoints[4].x,"Death respawns at checkpoint")
	resumed.lives = 1
	resumed.lose_life()
	for i in 150: resumed.update(1.0/120,{})
	check(resumed.mode == "game_over","Four-life game over")
	Saves.write_save(resumed.snapshot(),path)
	check(Saves.read_save(level,path).is_empty(),"Exhausted save cannot continue")
	var file = FileAccess.open(path,FileAccess.WRITE)
	file.store_string("{invalid")
	file.close()
	check(Saves.read_save(level,path).is_empty(),"Corrupt save handled")
	s.reset()
	s.mode = "play"
	s.player.x = level.exit+1
	s.player.y = 400
	s.update(1.0/120,{})
	check(s.mode == "transition","Exit at end of FULL route triggers coupling")
	for i in 1330: s.update(1.0/120,{})
	check(s.mode == "complete","Coupling reaches level-complete screen")
	# Replay every main-route gap with original movement and held jump.
	var floors = level.platforms.filter(func(p): return p.w>=300)
	floors.sort_custom(func(a,b): return a.x<b.x)
	for i in range(floors.size()-1):
		var a = floors[i]
		var b = floors[i+1]
		s.reset()
		s.mode = "play"
		s.enemies.clear()
		s.player.x = a.x+a.w-70
		s.player.y = a.y-90
		s.player.grounded = true
		var landed = false
		for frame in 240:
			s.update(1.0/120,{"right":true,"jump":true})
			if s.player.grounded and s.player.x+38>b.x and s.player.x<b.x+b.w and absf(s.player.y+90-b.y)<1:
				landed = true
				break
		check(landed,"Reachable main-route gap %d" % i)
	s.reset()
	s.mode = "play"
	s.enemies.clear()
	s.fire(true)
	check(s.shots.back().charged and s.effects.back().kind == "muzzle","Charged shot has matching muzzle effect")
	s.pause()
	s.update(1.0,{})
	check(s.effects.back().age == 0,"Pause freezes visual effects")
	s.resume()
	s.update(0.2,{})
	check(s.effects.is_empty(),"Muzzle effects expire")
	s.add_effect({"x":0,"y":0,"vx":0,"vy":-1,"charged":true},"impact")
	check(s.effects.back().duration == 0.32,"Charged impact effect duration")
	s.respawn()
	check(s.effects.is_empty(),"Respawn clears effects")
	DirAccess.remove_absolute(path)
	print("Godot level 1: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
