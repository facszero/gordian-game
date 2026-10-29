extends SceneTree

func _init():
	call_deferred("run")

func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	game.sim.reset()
	game.sim.mode = "play"
	game.sim.invulnerable = 0
	game.sim.player.grounded = true
	game.sim.player.x = 370
	game.sim.player.y = 470
	game.refresh_menu()
	for pose in ["controls","up-right","up-left-crouched"]:
		game.sim.player.aim_up = pose != "controls"
		game.sim.player.face = -1 if pose == "up-left-crouched" else 1
		game.sim.stance(pose == "up-left-crouched")
		game.sim.shots.clear()
		game.sim.effects.clear()
		game.sim.energy = 100
		game.sim.fire(true)
		game.sim.shots.back().x += 140 if pose == "controls" else 0
		game.sim.shots.back().y -= 0 if pose == "controls" else 100
		game.queue_redraw()
		await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("user://revision2-"+pose+".png")
	game.sim.reset()
	game.sim.mode = "play"
	var enemy = game.sim.enemies.filter(func(e): return e.type == "turret")[0]
	game.sim.camera = maxf(0,enemy.x-700)
	game.sim.player.x = enemy.x-180
	game.sim.player.y = enemy.y+enemy.h-90
	game.sim.invulnerable = 0
	for flash in [false,true]:
		enemy.flash = 0.1 if flash else 0
		game.queue_redraw()
		await process_frame
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("user://enemy-grounding-%s.png" % str(flash))
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	quit()
