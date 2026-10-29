extends SceneTree
const Sim = preload("res://scripts/simulation.gd")
const Boss = preload("res://scripts/boss.gd")
const Saves = preload("res://scripts/save_store.gd")
var checks = 0
var failures = 0
func check(ok, message):
	checks += 1
	if not ok:
		failures += 1
		push_error(message)
func _init(): call_deferred("run")
func run():
	var levels = {}
	for id in range(1,15): levels[id] = JSON.parse_string(FileAccess.get_file_as_string("res://data/level%d.json" % id))
	for id in range(5,13):
		var s = Sim.new(levels[id])
		var floors = s.level.platforms.filter(func(p): return p.w >= 300)
		floors.sort_custom(func(a,b): return a.x < b.x)
		for i in floors.size()-1:
			s.reset()
			s.boss = {}
			s.elites.clear()
			s.enemies.clear()
			s.barriers.clear()
			var a = floors[i]
			var b = floors[i+1]
			s.player.x = a.x+a.w-60
			s.player.y = a.y-s.spec.height
			s.player.grounded = true
			var landed = false
			for frame in 360:
				s.update(1.0/120,{"right":true,"jump":true})
				if s.player.grounded and s.player.x+s.player.w>b.x and s.player.x<b.x+b.w and absf(s.player.y+s.player.h-b.y)<1:
					landed = true
					break
			check(landed,"Level %d gap %d reachable" % [id,i])
	var reference = JSON.parse_string(FileAccess.get_file_as_string("res://data/advanced-reference.json"))
	for entry in reference:
		var b = Boss.create(entry.config)
		var cursor = 0
		var matches = true
		var attacks = {}
		for frame in 5400:
			if frame == 1800: b.hp = b.maxHp*0.5
			if frame == 3600: b.hp = b.maxHp*0.2
			var shots = Boss.update(b,1.0/60,entry.player,func(): return 0.37)
			attacks[b.attack] = true
			if cursor >= entry.samples.size() or entry.samples[cursor].frame != frame: continue
			var e = entry.samples[cursor]
			cursor += 1
			var good = b.state == e.state and b.attack == e.attack and b.hidden == e.hidden and b.hazards.size() == e.hazards.size() and shots.size() == e.shots.size() and b.drones.size() == e.drones and b.get("phase",0) == e.phase
			for field in ["x","timer","targetX","targetY"]: good = good and absf(b[field]-e[field]) < 0.001
			var bounds = Boss.bounds(b)
			good = good and absf(bounds.position.x-e.bounds.x)<0.001 and absf(bounds.position.y-e.bounds.y)<0.001 and absf(bounds.size.x-e.bounds.w)<0.001 and absf(bounds.size.y-e.bounds.h)<0.001
			for i in mini(shots.size(),e.shots.size()):
				for field in ["x","y","vx","vy","w","h","damage","life"]: good = good and absf(shots[i].get(field,12)-e.shots[i].get(field,12)) < 0.001
			for i in mini(b.hazards.size(),e.hazards.size()):
				for field in ["x","y","w","h"]: good = good and absf(b.hazards[i][field]-e.hazards[i][field]) < 0.001
			if matches and not good: print("Reference mismatch ",b.name," frame ",frame," state ",b.state,"/",e.state," attack ",b.attack,"/",e.attack," bounds ",bounds," expected ",e.bounds," shots ",shots," expected ",e.shots)
			matches = matches and good
		check(matches and cursor == entry.samples.size(),entry.config.name+" matches 90 seconds of web behavior")
		check(attacks.size() >= 3,entry.config.name+" exercises attack variety")
		b.active = true
		b.hidden = true
		var hp = b.hp
		Boss.hit(b,999)
		check(b.hp == hp,"Hidden boss cannot be damaged")
		b.hidden = false
		check(Boss.hit(b,999) and b.drones.is_empty() and b.hazards.is_empty(),"Boss death clears attacks and summons")
	for id in [12,13,14]:
		var s = Sim.new(levels[id])
		s.reset()
		s.boss.active = true
		s.player.x = s.boss.left+100
		s.invulnerable = 0
		s.hurt(999)
		check(s.robot == "dellinger" and s.lives == 4 and s.player.health == 150,"First armor release in level %d" % id)
		s.invulnerable = 0
		s.hurt(999)
		check(s.robot == "protesser" and s.lives == 4 and s.player.health == 100,"Second armor release in level %d" % id)
		s.invulnerable = 0
		s.hurt(999)
		check(s.mode == "dead" and s.lives == 3,"Protesser loses a life in level %d" % id)
		s.update(1.3,{})
		check(s.robot == "garbin" and s.boss.hp == s.boss.maxHp,"Respawn restores armor and boss")
		for robot in ["garbin","dellinger","protesser"]:
			s.reset()
			s.robot = robot
			s.boss.active = true
			s.player.x = s.boss.left+120
			s.player.y = s.boss.floor-160
			s.boss.hp = 1
			Boss.update(s.boss,0.0001,s.player)
			s.fire(true)
			var r = Boss.bounds(s.boss)
			s.shots.back().x = r.get_center().x
			s.shots.back().y = r.get_center().y
			s.update(0.0001,{})
			check(s.boss.dead and s.victory_robot == robot,"Victory records surviving robot")
			s.update(2.01,{})
			check(s.mode == "complete","Final boss auto-completes without exit traversal")
	for id in [10,11]:
		var s = Sim.new(levels[id])
		s.reset()
		check(s.elites.size() == 2 and s.elites[0].hp == (60 if id == 10 else 110),"Elite stats")
		s.player.x = s.level.exit+1
		s.update(0.001,{})
		check(s.mode == "play","Unbeaten elites block completion")
		for b in s.elites:
			b.active = true
			b.hidden = false
			Boss.hit(b,999)
		var path = "user://full-test.json"
		Saves.write_save(s.snapshot(),path)
		s.reset(Saves.read_save(levels[id],path))
		check(s.elites.all(func(b): return b.dead),"Elite defeat survives disk restore")
		DirAccess.remove_absolute(path)
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	check(game.music.playing,"Theme starts on main menu")
	game._notification(Node.NOTIFICATION_APPLICATION_PAUSED)
	check(game.music.stream_paused,"Menu theme suspends in background")
	game._notification(Node.NOTIFICATION_APPLICATION_FOCUS_IN)
	check(not game.music.stream_paused,"Menu theme resumes on foreground")
	for key in game.enemy_audio.SPECS:
		var spec = game.enemy_audio.SPECS[key]
		check(game.enemy_audio.samples[key].get_length() >= spec[1]+spec[2],"Complete audio excerpt: "+key)
	for id in range(1,12):
		game.start_level(id)
		game.sim.lives = 2
		game.sim.mode = "complete"
		game.finish_transition()
		check(game.sim.level.id == id+1,"Campaign advances from level %d" % id)
		check(game.sim.lives == (4 if id in [4,8] else 2),"Campaign life policy at %d" % id)
	check(not game.music.playing,"Theme stops during gameplay")
	for robot in ["garbin","dellinger","protesser"]:
		game.start_level(12)
		game.sim.boss.dead = true
		game.sim.victory_robot = robot
		game.sim.mode = "complete"
		game.refresh_menu()
		game.continue_ending()
		check(game.sim.level.id == (13 if robot == "dellinger" else 14 if robot == "protesser" else 12),"Ending route for "+robot)
		if robot == "garbin": check(game.sim.ending_page == "epilogue","Garbin goes directly to epilogue")
		else:
			game.sim.boss.dead = true
			game.sim.mode = "complete"
			game.continue_ending()
			check(game.sim.ending_page == "epilogue","Secret level leads to epilogue")
		game.persist()
		game.restore_campaign()
		check(game.sim.ending_page == "epilogue" and game.sim.mode == "complete","Completed ending survives save/restore")
		game.continue_ending()
		check(game.sim.mode == "menu" and game.music.playing,"Epilogue returns to menu with theme")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	print("Full campaign: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
