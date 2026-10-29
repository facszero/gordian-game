extends SceneTree
func _init(): call_deferred("run")
func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	game.start_level(3)
	game.sim.invulnerable = 0
	game.sim.player.grounded = true
	await capture(game,"tunnels")
	game.sim.mode = "transition"
	game.refresh_menu()
	for t in [4.0,9.5,12.5,14.2]:
		game.sim.timer = t
		await capture(game,"coupling-"+str(t))
	game.start_level(4)
	game.sim.invulnerable = 0
	game.sim.player.grounded = true
	await capture(game,"fortress")
	game.sim.player.aim_up = true
	game.sim.fire(true)
	game.sim.shots.back().y -= 80
	await capture(game,"garbin-up")
	game.sim.stance(true)
	game.sim.player.face = -1
	await capture(game,"garbin-crouch-up")
	game.sim.reset()
	game.sim.player.x = 5750
	game.sim.player.y = 400
	game.sim.player.grounded = true
	game.sim.camera = 5520
	game.sim.boss.active = true
	game.sim.boss.state = "warning"
	game.sim.boss.attack = "beam"
	game.sim.invulnerable = 0
	await capture(game,"boss-warning")
	game.sim.boss.state = "attack"
	game.sim.boss.hazards = [{"x":5520,"y":442,"w":780,"h":16}]
	await capture(game,"boss-beam")
	game.sim.boss.dead = true
	game.sim.boss.active = false
	game.sim.mode = "transition"
	game.sim.timer = 6
	game.refresh_menu()
	await capture(game,"ending")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	quit()
func capture(game, name: String):
	game.queue_redraw()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("user://chapter4-"+name+".png")
