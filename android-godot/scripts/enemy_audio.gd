extends Node
## Enemy recordings and cue parameters from dist/src/weapon-audio.js.
const SPECS = {"light":["LivianaSimple1",0.05,0.16,1.05,2300,0.11],"heavy":["LivianaSimple2",0.03,0.24,0.85,1700,0.14],"bossShot":["PesadaSimple1",0,0.32,0.85,2100,0.23],"beam":["Jefes1",0,1,0.95,2300,0.34],"impact":["PesadaSimple1",0,0.55,0.7,1600,0.3]}
var voices: Array = []
var samples = {}
var cooldown = 0.0
var cursor = 0
var boss_cursor = 3
var boss_cooldown = 0.0
var bus_by_kind = {}
var buses: Array[String] = []

func _ready():
	for kind in SPECS:
		var spec = SPECS[kind]
		samples[kind] = load("res://assets/"+spec[0]+".mp3")
		var bus_name = "Enemy_"+kind+"_"+str(get_instance_id())
		AudioServer.add_bus()
		var index = AudioServer.bus_count-1
		AudioServer.set_bus_name(index,bus_name)
		var filter = AudioEffectLowPassFilter.new()
		filter.cutoff_hz = spec[4]
		AudioServer.add_bus_effect(index,filter)
		buses.append(bus_name)
		bus_by_kind[kind] = bus_name
	for i in 6:
		var player = AudioStreamPlayer.new()
		add_child(player)
		voices.append({"player":player,"remaining":0.0})

static func distance_gain(x: float, player_x: float, camera: float) -> float:
	if x < camera-80 or x > camera+1280+80: return 0
	return maxf(0.2,1-absf(x-player_x)/1000)

func play_cue(kind: String, x: float, player_x: float, camera: float):
	var gain = distance_gain(x,player_x,camera)
	var is_boss = kind not in ["light","heavy"]
	if is_boss: gain = 1.0
	if gain <= 0 or (boss_cooldown > 0 if is_boss else cooldown > 0): return
	var spec = SPECS[kind]
	var voice = voices[boss_cursor if is_boss else cursor]
	if is_boss: boss_cursor = 3+(boss_cursor-2)%3
	else: cursor = (cursor+1)%3
	voice.player.stop()
	voice.player.stream = samples[kind]
	voice.player.bus = bus_by_kind[kind]
	voice.player.pitch_scale = spec[3]
	voice.player.volume_db = linear_to_db(gain*spec[5])
	voice.player.play(spec[1])
	voice.remaining = spec[2]/spec[3]
	if is_boss: boss_cooldown = 0.06
	else: cooldown = 0.09

func _process(dt: float):
	cooldown = maxf(0,cooldown-dt)
	boss_cooldown = maxf(0,boss_cooldown-dt)
	for voice in voices:
		if voice.remaining <= 0: continue
		voice.remaining -= dt
		if voice.remaining <= 0: voice.player.stop()

func stop():
	cooldown = 0
	boss_cooldown = 0
	for voice in voices:
		voice.player.stop()
		voice.remaining = 0

func _exit_tree():
	stop()
	for bus_name in buses:
		var index = AudioServer.get_bus_index(bus_name)
		if index > 0: AudioServer.remove_bus(index)
