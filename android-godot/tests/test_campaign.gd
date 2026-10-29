extends SceneTree
const Sim = preload("res://scripts/simulation.gd")
const Saves = preload("res://scripts/save_store.gd")
const Transition = preload("res://scripts/transition.gd")
var checks = 0
var failures = 0

func check(ok: bool, message: String):
	checks += 1
	if not ok:
		failures += 1
		push_error(message)

func _init(): call_deferred("run")

func run():
	var level = JSON.parse_string(FileAccess.get_file_as_string("res://data/level2.json"))
	var s = Sim.new(level)
	s.reset()
	check(level.exit == 12140 and level.platforms.size() == 32 and level.enemies.size() == 26 and level.pickups.size() == 16 and level.checkpoints.size() == 5 and s.barriers.size() == 8,"Entire extended quarry route")
	check(s.player.w == 55 and s.player.h == 120 and s.player.health == 150,"Dellinger dimensions and health")
	check(s.mode == "play","Level 2 starts without level 1 introduction")
	s.enemies.clear()
	s.update(1.0/120,{"right":true})
	check(s.player.vx == 240,"Dellinger speed")
	s.player.grounded = true
	s.update(1.0/120,{"jump":true})
	check(absf(s.player.vy+level.robotSpec.jump-15)<0.01,"Dellinger jump height scales with robot")
	s.fire(false)
	check(s.shots.back().damage == 2 and s.cooldown == 0.24,"Dellinger normal weapon")
	s.fire(true)
	check(s.shots.back().damage == 8 and s.shots.back().robot == "dellinger","Dellinger charged weapon")
	s.reset()
	s.enemies.clear()
	var b = s.barriers[0]
	s.player.x = b.x-s.player.w-1
	s.player.y = 440
	s.player.grounded = true
	s.update(0.02,{"right":true})
	check(s.player.x+s.player.w <= b.x,"Crates block horizontal motion")
	s.fire(true)
	s.update(1.0/120,{})
	check(b.dead,"Charged shot destroys crate")
	s.checkpoint = 1
	s.lives = 2
	var path = "user://campaign-test.json"
	check(Saves.write_save(s.snapshot(),path)==OK,"Campaign save written")
	var loaded = Saves.read_save(level,path)
	check(not loaded.is_empty() and loaded.level_id == 2,"Level 2 save validates")
	s.reset(loaded)
	check(s.lives == 2 and s.checkpoint == 1 and s.barriers[0].dead,"Lives, checkpoint and broken crate restored")
	s.invulnerable = 0
	s.hurt(1000)
	s.update(1.3,{})
	check(s.lives == 1 and s.player.health == 150 and s.player.h == 120,"Respawn restores Dellinger")
	var floors = level.platforms.filter(func(p): return p.w >= 300)
	floors.sort_custom(func(a,b2): return a.x < b2.x)
	for i in floors.size()-1:
		s.reset()
		s.enemies.clear()
		s.barriers.clear()
		var a = floors[i]
		var next = floors[i+1]
		s.player.x = a.x+a.w-60
		s.player.y = a.y-120
		s.player.grounded = true
		var landed = false
		for frame in 300:
			s.update(1.0/120,{"right":true,"jump":true})
			if s.player.grounded and s.player.x+s.player.w>next.x and s.player.x<next.x+next.w and absf(s.player.y+s.player.h-next.y)<1:
				landed = true
				break
		check(landed,"Dellinger traverses main-route gap %d" % i)
	var reference = JSON.parse_string(FileAccess.get_file_as_string("res://data/coupling-reference.json"))
	var matches = true
	for expected in reference:
		var actual = Transition.state(expected.time)
		for key in ["pose","previous","label"]:
			if actual[key] != expected[key]: matches = false
		for key in ["blend","entry","fade"]:
			if absf(actual[key]-expected[key])>0.000001: matches = false
	check(matches,"All 1321 transition samples match web labels, poses and blends")
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	game.start_level(1)
	game.sim.lives = 3
	game.sim.mode = "transition"
	game.sim.timer = 5
	game.toggle_pause()
	game.sim.update(1,{})
	check(game.sim.timer == 5,"Transition pauses without advancing animation")
	game.toggle_pause()
	game.sim.timer = 10.99
	game._physics_process(0.02)
	check(game.sim.level.id == 2 and game.sim.lives == 3 and game.sim.mode == "play","Automatic transition preserves lives and starts quarry")
	check(game.read_campaign().level_id == 2,"Automatic transition persists new level immediately")
	game.sim.checkpoint = 3
	game.sim.barriers[2].dead = true
	game.sim.enemies.back().dead = true
	game.persist()
	game.restore_campaign()
	check(game.sim.level.id == 2 and game.sim.checkpoint == 3 and game.sim.barriers[2].dead,"Menu restores campaign progress")
	check(game.sim.enemies.back().dead,"Defeated enemies remain defeated after disk roundtrip")
	var old = Sim.new(game.levels[1]).snapshot()
	old.version = 1
	old.stage = "complete"
	old.lives = 2
	old.erase("destroyed")
	Saves.write_save(old)
	game.restore_campaign()
	check(game.sim.level.id == 2 and game.sim.lives == 2,"Completed 0.1.3 saves migrate into level 2")
	game.sim.mode = "transition"
	game.refresh_menu()
	game.skip_button.pressed.emit()
	check(game.sim.level.id == 3 and game.sim.mode == "play","Second transition now continues into tunnels")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	DirAccess.remove_absolute(path)
	print("Campaign: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
