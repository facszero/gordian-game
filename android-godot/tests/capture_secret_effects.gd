extends SceneTree
func _init(): call_deferred("run")
func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	for id in [13,14]:
		game.start_level(id)
		game.sim.camera = game.sim.boss.left
		game.sim.player.x = game.sim.camera+180
		game.sim.player.y = game.sim.boss.floor-game.sim.player.h
		game.sim.invulnerable = 0
		for frame in 12:
			var shot = {"x":game.sim.camera+600,"y":330.0,"life":6.0-frame/12.0,"w":180.0,"h":160.0,"nucleus":id==13,"reactorBurst":id==13,"ice":id==14,"iceBeam":id==14,"length":200.0,"thickness":52.0,"angle":PI}
			game.sim.shots = [shot]
			game.queue_redraw()
			await process_frame
			await RenderingServer.frame_post_draw
			root.get_texture().get_image().save_png("user://secret-%d-%02d.png" % [id,frame])
	quit()

