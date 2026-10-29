extends SceneTree
const Sim = preload("res://scripts/simulation.gd")
const Boss = preload("res://scripts/boss.gd")
const Saves = preload("res://scripts/save_store.gd")
var checks = 0
var failures = 0
func check(ok: bool, label: String):
	checks += 1
	if not ok:
		failures += 1
		push_error(label)
func _init(): call_deferred("run")
func run():
	var levels = {}
	for id in [3,4]:
		levels[id] = JSON.parse_string(FileAccess.get_file_as_string("res://data/level%d.json" % id))
		var s = Sim.new(levels[id])
		var floors = s.level.platforms.filter(func(p): return p.w >= 300)
		floors.sort_custom(func(a,b): return a.x < b.x)
		for i in floors.size()-1:
			s.reset()
			s.boss = {}
			s.enemies.clear()
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
			check(landed,"Level %d gap %d" % [id,i])
	check(levels[3].exit==11750 and levels[3].enemies.size()==24,"Full extended tunnels")
	check(levels[4].platforms.size()==13 and levels[4].enemies.size()==10,"Full fortress and original boss arena")
	var s = Sim.new(levels[4])
	s.reset()
	check(s.player.health==220 and s.player.w==80 and s.player.h==160 and s.spec.speed==190,"Garbin stats")
	s.fire(true)
	check(s.shots.back().damage==12 and s.cooldown==0.3,"Garbin weapon strength and cadence")
	s.player.grounded = true
	s.stance(true)
	s.player.aim_up = true
	s.fire(false)
	check(s.shots.back().y<s.player.y and s.player.h==85,"Garbin crouched upward muzzle")
	var b = Boss.create(levels[4].boss)
	var player = {"x":5600.0,"y":400.0,"w":80.0,"h":160.0}
	var trace = JSON.parse_string(FileAccess.get_file_as_string("res://data/boss-reference.json"))
	var next_sample = 0
	var equivalent = true
	var attacks = {}
	for frame in 3600:
		if frame == 1800: b.hp = 80
		var emitted = Boss.update(b,1.0/60,player,func(): return 0.37)
		attacks[b.attack] = true
		if next_sample >= trace.size() or trace[next_sample].frame != frame: continue
		var expected = trace[next_sample]
		next_sample += 1
		for field in ["x","timer","walkDistance","targetX","targetY","rounds"]:
			if absf(b[field]-expected[field])>0.00001:
				if equivalent: print("First boss mismatch: ",frame," ",field," actual ",b[field]," expected ",expected[field])
				equivalent = false
		if b.state!=expected.state or b.attack!=expected.attack or b.hazards.size()!=expected.hazards or emitted.size()!=expected.shots.size():
			if equivalent: print("First boss state mismatch: ",frame," ",b.state," ",expected.state," ",b.attack," ",expected.attack," shots ",emitted.size()," ",expected.shots.size())
			equivalent = false
		for i in mini(emitted.size(),expected.shots.size()):
			for field in ["x","y","vx","vy"]:
				if absf(emitted[i][field]-expected.shots[i][field])>0.00001:
					if equivalent: print("First projectile mismatch: ",frame," ",field," ",emitted[i][field]," ",expected.shots[i][field])
					equivalent = false
	check(equivalent and next_sample==trace.size(),"60 seconds of both boss phases match web reference")
	check(attacks.size()==4,"All four boss attack patterns exercised")
	check(Boss.hit(b,500) and b.hazards.is_empty() and not b.active,"Boss defeat clears attacks")
	s.reset()
	s.enemies.clear()
	s.player.x = s.level.exit+1
	s.update(0.01,{})
	check(s.mode=="play" and s.boss.active and s.player.x<s.level.exit,"Living boss gates exit and locks arena")
	s.boss.hp = 12
	s.fire(true)
	s.shots.back().x = s.boss.x+150
	s.shots.back().y = s.boss.floor-100
	s.update(0.001,{})
	check(s.boss.dead and s.kills==1,"Player projectiles defeat boss")
	var path = "user://chapter4-test.json"
	Saves.write_save(s.snapshot(),path)
	s.reset(Saves.read_save(levels[4],path))
	check(s.boss.dead,"Defeated boss persists through disk restore")
	s.player.x = s.level.exit+1
	s.player.y = 400
	s.update(0.01,{})
	check(s.mode=="transition","Exit opens only after boss defeat")
	s.reset()
	s.boss.active = true
	s.boss.hp = 5
	s.invulnerable = 0
	s.hurt(1000)
	s.update(1.3,{})
	check(s.lives==3 and s.boss.hp==180 and not s.boss.active,"Death resets undefeated boss and restores Garbin")
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	game.start_level(2)
	game.sim.lives = 2
	game.sim.mode = "complete"
	game.persist()
	game.restore_campaign()
	check(game.sim.level.id==3 and game.sim.lives==2,"0.2.0 completed save migrates into tunnels")
	game.sim.mode = "transition"
	game.sim.timer = 14.99
	game._physics_process(0.02)
	check(game.sim.level.id==4 and game.sim.lives==2,"15-second double coupling enters fortress")
	game.sim.boss.dead = true
	game.sim.mode = "transition"
	game.sim.timer = 10.99
	game._physics_process(0.02)
	check(game.sim.level.id==5 and game.sim.lives==4,"Level 4 restores lives and continues to foundry")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	DirAccess.remove_absolute(path)
	print("Chapter 4: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
