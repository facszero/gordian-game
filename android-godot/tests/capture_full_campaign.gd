extends SceneTree
const Boss = preload("res://scripts/boss.gd")
func _init(): call_deferred("run")
func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	await capture(game,"menu")
	game.start_level(3)
	game.sim.player.x = 990
	game.sim.player.y = 410
	game.sim.camera = 550
	game.sim.invulnerable = 0
	game.sim.player.grounded = true
	await capture(game,"grounded-sentry")
	for id in range(5,15):
		game.start_level(id)
		game.sim.invulnerable = 0
		game.sim.player.grounded = true
		if not game.sim.boss.is_empty():
			game.sim.player.x = game.sim.boss.left+180
			game.sim.player.y = game.sim.boss.floor-game.sim.player.h
			game.sim.camera = game.sim.boss.left
			Boss.update(game.sim.boss,0.01,game.sim.player)
		if id in [10,11]:
			game.sim.player.x = game.sim.elites[0].left+180
			game.sim.player.y = game.sim.elites[0].floor-game.sim.player.h
			game.sim.camera = game.sim.elites[0].left-100
			Boss.update(game.sim.elites[0],0.01,game.sim.player)
		await capture(game,"level-%02d" % id)
		if id == 12:
			for phase in [1,2,3]:
				var b = game.sim.boss
				b.hp = b.maxHp*(1 if phase == 1 else 0.5 if phase == 2 else 0.2)
				Boss.update(b,0.01,game.sim.player)
				b.state = "recover"
				b.timer = 0
				b.attack = "eyes"
				Boss.update(b,0.01,game.sim.player,func(): return 0.1)
				Boss.update(b,0.9,game.sim.player)
				await capture(game,"dokuma-phase-%d" % phase)
			game.sim.boss.dead = true
			game.sim.victory_robot = "protesser"
			game.sim.mode = "complete"
			game.refresh_menu()
			await capture(game,"ending")
		if id < 12:
			game.sim.mode = "transition"
			game.sim.timer = 6
			game.refresh_menu()
			await capture(game,"transition-%02d" % id)
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	quit()
func capture(game,name):
	game.queue_redraw()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("user://full-"+name+".png")
