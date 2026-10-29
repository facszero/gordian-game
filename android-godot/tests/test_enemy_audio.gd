extends SceneTree
const EnemyAudio = preload("res://scripts/enemy_audio.gd")
var failures = 0
var checks = 0

func check(ok: bool, message: String):
	checks += 1
	if not ok:
		failures += 1
		push_error(message)

func _init(): call_deferred("run")

func run():
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.set_physics_process(false)
	var audio = game.enemy_audio
	audio.set_process(false)
	check(audio.samples.light.get_length()>0.21 and audio.samples.heavy.get_length()>0.27,"Both recordings contain the selected excerpts")
	check(EnemyAudio.distance_gain(1500,100,0)==0,"Offscreen enemies are silent")
	check(EnemyAudio.distance_gain(600,100,0)==0.5,"Distance attenuation")
	audio.play_cue("heavy",300,100,0)
	check(audio.voices[0].remaining>0 and audio.voices[0].player.stream==audio.samples.heavy,"Heavy cue selects heavy recording")
	audio.play_cue("light",300,100,0)
	check(audio.cursor==1,"Simultaneous volleys are throttled")
	audio._process(0.1)
	audio.play_cue("light",300,100,0)
	check(audio.voices[1].remaining>0 and audio.voices[1].player.pitch_scale>1,"Light cue has distinct pitch")
	audio._process(1)
	check(audio.voices.all(func(v): return not v.player.playing),"Excerpts stop at their duration")
	game.sim.reset()
	game.sim.mode="play"
	var enemy=game.sim.enemies.filter(func(e): return e.type=="turret")[0]
	game.sim.player.x=enemy.x-100
	for e in game.sim.enemies: e.timer=100
	enemy.timer=0
	game.sim.update(1.0/120,{})
	check(game.sim.enemy_cues.size()==1 and game.sim.enemy_cues[0].kind=="heavy","Actual ground shot emits one heavy cue")
	audio.play_cue("heavy",300,100,0)
	game.toggle_pause()
	check(audio.voices.all(func(v): return not v.player.playing),"Pause stops enemy voices")
	game.sim.update(1.0/120,{})
	check(game.sim.enemy_cues.is_empty(),"Pause does not repeat a previous shot cue")
	game.queue_free()
	await process_frame
	await create_timer(0.15).timeout
	print("Enemy audio: %d checks, %d failures" % [checks,failures])
	quit(1 if failures else 0)
