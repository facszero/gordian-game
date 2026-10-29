extends SceneTree
var failures = 0

func expect(condition: bool, message: String):
	if not condition:
		failures += 1
		push_error(message)

func _init():
	call_deferred("run")

func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	expect(game.sim.mode == "menu" and game.panel.visible,"Main menu visible")
	game.sim.reset()
	game.sim.mode = "play"
	game.refresh_menu()
	var start_x = game.sim.player.x
	var touch = InputEventScreenTouch.new()
	touch.index = 0
	touch.position = game.controls.right.get_center()
	touch.pressed = true
	game._input(touch)
	touch = InputEventScreenTouch.new()
	touch.index = 1
	touch.position = game.controls.fire.get_center()
	touch.pressed = true
	game._input(touch)
	for i in 20: await physics_frame
	expect(game.sim.player.x > start_x and game.sim.shots.size()>0,"Simultaneous touch movement + fire")
	var drag = InputEventScreenDrag.new()
	drag.index = 0
	drag.position = game.controls.up.get_center()
	game._input(drag)
	for i in 25: await physics_frame
	expect(game.sim.player.aim_up and game.sim.shots.any(func(s): return s.friendly and s.vy < 0),"Slide from right to up while firing")
	drag.position = game.controls.crouch.get_center()
	game._input(drag)
	for i in 4: await physics_frame
	expect(game.sim.player.crouching and not game.sim.player.aim_up,"Slide down changes stance without a stuck up input")
	game.toggle_pause()
	expect(game.sim.mode == "pause" and game.fingers.is_empty(),"Pause clears all touches")
	expect(game.panel.visible,"Pause UI visible")
	game.toggle_pause()
	expect(game.sim.mode == "play","Resume works")
	game._notification(Node.NOTIFICATION_APPLICATION_PAUSED)
	expect(game.sim.mode == "pause","Android background pauses safely")
	expect(not game.Saves.read_save(game.sim.level).is_empty(),"Background saved progress")
	game.sim.resume()
	game.sim.player.x = game.sim.level.exit+1
	game.sim.player.y = 400
	await physics_frame
	await physics_frame
	expect(game.sim.mode == "transition" and game.skip_button.visible,"Coupling UI")
	game.skip_button.pressed.emit()
	expect(game.sim.mode == "complete" and game.panel.visible,"Skip reaches completed level")
	game.queue_free()
	await process_frame
	print("Godot runtime: 11 checks, %d failures" % failures)
	await create_timer(0.15).timeout
	quit(1 if failures else 0)
