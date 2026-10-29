extends SceneTree
func _init(): call_deferred("run")
func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	game.start_level(1)
	game.sim.mode = "transition"
	game.refresh_menu()
	for t in [1.8,4.0,6.4,8.8,10.0]:
		game.sim.timer = t
		await capture(game,"transition-"+str(t))
	game.start_level(2)
	game.sim.invulnerable = 0
	game.sim.player.grounded = true
	await capture(game,"quarry-start")
	game.sim.camera = 500
	game.sim.player.x = 1050
	game.sim.player.y = 410
	game.sim.player.aim_up = true
	game.sim.fire(true)
	game.sim.shots.back().y -= 120
	await capture(game,"quarry-combat")
	game.sim.mode = "transition"
	game.sim.timer = 5.0
	game.refresh_menu()
	await capture(game,"decoupling")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	quit()

func capture(game, name: String):
	game.queue_redraw()
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("user://campaign-"+name+".png")
