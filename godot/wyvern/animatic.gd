extends Node3D
## Grey-box animatic of the Pink Wyvern's first two minutes.
## Follows the shot list doc "Shot list: the first two minutes at the Pink Wyvern" (2026-11-04).
## Everything is built in code so the timing can be edited as text. Shapes are placeholders;
## the lights, haze, camera, mix and timing are the real thing being tested.
##
## Render to video:  godot --path godot --write-movie out/wyvern.avi --fixed-fps 30
## Preview a frame:  godot --path godot -- --frame=34.5   (saves out/frame_34.5.png and quits)

const BEAT := 0.5            # 120 bpm temp track
const SLAM := 3.0            # lights and band hit together
const BREAK_START := 41.0    # band stops for Roxy's pep talk
const BREAK_END := 59.0
const DOOR_AT := 108.0       # the stranger walks in
const END_AT := 126.0

const HOLDS := [             # [start, end, line]: the room goes quiet for Eddar only
	[34.0, 38.0, "Cola. Lime. Something that glows."],
	[73.0, 77.0, "This one looks like Rex. ...I'll take my time."],
	[100.0, 104.0, "A perfect spiral. On purpose."],
]

# Speech bubbles: [time, speaker id, text]. Lines from src/content/chatter/wyvern.ts.
const BUBBLES := [
	[20.5, "superfan", "WOOOOO! WILDFIRES!"],
	[23.5, "kings_fan", "Play 'Neon Nights'!"],
	[26.0, "roxy", "That's a STATIC KINGS song, pal."],
	[28.5, "kings_fan", "So? It's a good song!"],
	[30.7, "lulu", "It IS a good song..."],
	[32.4, "roxy", "LULU."],
	[41.6, "roxy", "Listen up, Wildfires! Tonight we don't PLAY Save the World. Tonight we ARE the world, and we are SAVING it."],
	[46.6, "roxy", "With music to light the heavens! With volume to awaken the dead! With FIRE hot enough to ignite an ocean with!"],
	[52.0, "gil", "*clap* ... *clap*"],
	[53.6, "superfan", "WOOOOO!"],
	[54.6, "spike", "Save the world? From what..."],
	[56.4, "roxy", "From being BORING! I'm lead vocals, Spike, not you, so shut F-sharp up!"],
	[61.5, "dwayne", "Take it OFF!"],
	[63.7, "roxy", "Take YOURSELF off, Dwayne! Off a PIER!"],
	[66.8, "tammy_dad", "Dedicate one to my daughter Tammy! She's... not here. But she'd love it!"],
	[70.4, "roxy", "This one's for Tammy! Wherever Tammy is!"],
	[79.0, "superfan", "Hey. Mop guy. You're in my sightline."],
	[82.4, "lulu", "Ooh, can we open with the new one? The one with no ending?"],
	[85.0, "roxy", "Not tonight, hon'. Soon, though."],
	[88.0, "dwayne", "Play something with a SAXOPHONE!"],
	[90.2, "spike", "We do not do saxophone."],
	[102.3, "roxy", "You're welcome!"],
	[104.6, "tammy_dad", "Is this the one for Tammy?"],
	[106.4, "roxy", "They're ALL for Tammy!"],
]

const NAMES := {
	"roxy": "ROXY", "lulu": "LULU", "spike": "SPIKE", "gil": "GIL",
	"superfan": "SUPERFAN", "kings_fan": "KINGS FAN", "dwayne": "DWAYNE", "tammy_dad": "TAMMY'S DAD",
}

# Eddar's route: [time, position, facing target, mopping?]
const EDDAR_PATH := [
	[0.0, Vector3(4.8, 0, 4.2), Vector3(4.4, 0, 3.4), true],
	[38.0, Vector3(4.8, 0, 4.2), Vector3(4.4, 0, 3.4), true],
	[44.0, Vector3(6.6, 0, 1.6), Vector3(6.2, 0, 0.8), true],
	[77.0, Vector3(6.6, 0, 1.6), Vector3(6.2, 0, 0.8), true],
	[84.0, Vector3(3.6, 0, 5.8), Vector3(3.2, 0, 5.0), true],
	[126.0, Vector3(3.6, 0, 5.8), Vector3(3.2, 0, 5.0), true],
]
const PUDDLES := [
	[Vector3(4.4, 0.01, 3.4), 12.0, 38.0, Color(0.2, 1.0, 0.4)],   # cola, lime, something that glows
	[Vector3(6.2, 0.01, 0.8), 44.0, 77.0, Color(0.6, 0.3, 0.1)],
	[Vector3(3.2, 0.01, 5.0), 84.0, 104.0, Color(0.5, 0.2, 0.6)],
]

const DOOR_POS := Vector3(-9.85, 0, 4.5)
const BOOTH_SEAT := Vector3(-8.6, 0, 7.6)

var t := 0.0
var preview_frame := -1.0
var cam: Camera3D
var env: Environment
var black: ColorRect
var chyron: Control
var dialogue: PanelContainer
var dialogue_label: Label
var ui: CanvasLayer
var bubbles: Array = []   # {node, at, life, speaker}
var bubble_i := 0
var people := {}          # speaker id -> head Node3D
var crowd: Array = []     # {node, phase, base, arms}
var band: Array = []
var heads: Array = []     # moving-head SpotLight3D
var mirror_light: OmniLight3D
var mirror_ball: Node3D
var eddar: Node3D
var mop: Node3D
var leagues: Node3D
var door: Node3D
var cup: Node3D
var puddle_nodes: Array = []
var passers: Array = []   # {node, from, to, t0, t1}
var sfx_queue: Array = [] # [time, stream path, bus, volume_db]
var sfx_i := 0
var music_bus := 0
var crowd_bus := 0
var sfx_bus := 0
var lowpass: AudioEffectLowPassFilter
var players: Array = []
var cam_pos := Vector3.ZERO
var cam_look := Vector3.ZERO
var rng := RandomNumberGenerator.new()


func _ready() -> void:
	rng.seed = 11
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--frame="):
			preview_frame = float(a.substr(8))
	_build_environment()
	_build_room()
	_build_lights()
	_build_band()
	_build_crowd()
	_build_eddar()
	_build_leagues()
	_build_ui()
	_build_audio()
	cam = Camera3D.new()
	cam.fov = 58
	add_child(cam)
	if preview_frame >= 0:
		# jump straight to the frame; bubbles that should be visible are spawned by _update_bubbles
		t = preview_frame
		_step(0.0)


func _process(delta: float) -> void:
	if preview_frame >= 0:
		_step(0.0)
		if Engine.get_process_frames() > 8:
			DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://out"))
			get_viewport().get_texture().get_image().save_png("res://out/frame_%s.png" % str(preview_frame))
			get_tree().quit()
		return
	t += delta
	_step(delta)
	if t >= END_AT:
		get_tree().quit()


func _step(delta: float) -> void:
	var music_on := t >= SLAM and not (t >= BREAK_START and t < BREAK_END)
	var beat_phase := fmod(max(t - SLAM, 0.0), BEAT) / BEAT
	var pulse: float = exp(-beat_phase * 5.0) if music_on else 0.0
	_update_lights(music_on, pulse)
	_update_people(music_on)
	_update_eddar()
	_update_story_props()
	_update_camera(delta)
	_update_bubbles()
	_update_overlays()
	_update_mix(delta)
	_update_sfx()


# ---------------------------------------------------------------- build

func _mat(color: Color, rough := 0.8, metal := 0.0, emit := Color.BLACK, emit_e := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = metal
	if emit_e > 0.0:
		m.emission_enabled = true
		m.emission = emit
		m.emission_energy_multiplier = emit_e
	return m


func _box(size: Vector3, pos: Vector3, mat: Material, parent: Node = self) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var b := BoxMesh.new()
	b.size = size
	mi.mesh = b
	mi.material_override = mat
	mi.position = pos
	parent.add_child(mi)
	return mi


func _build_environment() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.01, 0.0, 0.02)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.25, 0.18, 0.35)
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.1
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_bloom = 0.15
	env.glow_hdr_threshold = 0.9
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.035
	env.volumetric_fog_albedo = Color(0.9, 0.85, 1.0)
	env.volumetric_fog_length = 40.0
	env.ssr_enabled = true
	env.ssr_max_steps = 48
	we.environment = env
	add_child(we)


func _build_room() -> void:
	var floor_mat := _mat(Color(0.05, 0.04, 0.06), 0.12, 0.35)   # sticky, wet, reflective
	_box(Vector3(20, 0.2, 20), Vector3(0, -0.1, 0), floor_mat)
	var wall := _mat(Color(0.09, 0.06, 0.1), 0.9)
	_box(Vector3(20, 7, 0.3), Vector3(0, 3.5, -9), wall)
	_box(Vector3(0.3, 7, 20), Vector3(-10, 3.5, 0), wall)
	_box(Vector3(0.3, 7, 20), Vector3(10, 3.5, 0), wall)
	_box(Vector3(20, 7, 0.3), Vector3(0, 3.5, 10), wall)
	_box(Vector3(20, 0.3, 20), Vector3(0, 7, 0), _mat(Color(0.02, 0.02, 0.03)))
	# stage, with an emissive lip
	_box(Vector3(12, 0.8, 4.5), Vector3(0, 0.4, -6.8), _mat(Color(0.08, 0.07, 0.09), 0.5))
	_box(Vector3(12, 0.06, 0.06), Vector3(0, 0.82, -4.55), _mat(Color.BLACK, 0.5, 0, Color(1, 0.1, 0.6), 6.0))
	# speaker stacks
	for x in [-5.3, 5.3]:
		_box(Vector3(1.2, 2.2, 1.0), Vector3(x, 1.9, -6.0), _mat(Color(0.03, 0.03, 0.03), 0.6))
	# the bar along the right wall
	_box(Vector3(1.0, 1.1, 9.0), Vector3(8.6, 0.55, 2.5), _mat(Color(0.18, 0.08, 0.12), 0.35, 0.2))
	_box(Vector3(1.2, 0.06, 9.2), Vector3(8.6, 1.13, 2.5), _mat(Color(0.3, 0.3, 0.32), 0.15, 0.8))
	_box(Vector3(0.05, 0.04, 9.0), Vector3(8.05, 1.05, 2.5), _mat(Color.BLACK, 0.5, 0, Color(0, 0.9, 1), 4.0))
	for i in 8:   # bottles on the back shelf
		var c := Color.from_hsv(rng.randf(), 0.6, 0.8)
		_box(Vector3(0.12, 0.35, 0.12), Vector3(9.7, 1.7, -1.2 + i * 0.9), _mat(c, 0.1, 0, c, 0.6))
	# neon: the wyvern sign over the bar, EXIT over the door
	var sign := Label3D.new()
	sign.text = "PINK WYVERN"
	sign.font_size = 160
	sign.modulate = Color(3.0, 0.4, 2.0)
	sign.shaded = false
	sign.position = Vector3(9.75, 4.2, 2.5)
	sign.rotation_degrees = Vector3(0, -90, 0)
	add_child(sign)
	var sign_light := OmniLight3D.new()
	sign_light.light_color = Color(1, 0.2, 0.7)
	sign_light.light_energy = 2.0
	sign_light.omni_range = 6.0
	sign_light.position = Vector3(8.8, 4.0, 2.5)
	add_child(sign_light)
	var exit := Label3D.new()
	exit.text = "EXIT"
	exit.font_size = 64
	exit.modulate = Color(0.3, 2.5, 3.0)
	exit.shaded = false
	exit.position = Vector3(-9.8, 2.9, DOOR_POS.z)
	exit.rotation_degrees = Vector3(0, 90, 0)
	add_child(exit)
	var exit_spill := OmniLight3D.new()
	exit_spill.light_color = Color(0.2, 0.9, 1.0)
	exit_spill.light_energy = 0.7
	exit_spill.omni_range = 4.5
	exit_spill.position = Vector3(-9.3, 2.8, DOOR_POS.z)
	add_child(exit_spill)
	# the front door (hinged), locked
	door = Node3D.new()
	door.position = DOOR_POS + Vector3(0, 0, -0.6)
	add_child(door)
	_box(Vector3(0.12, 2.3, 1.2), Vector3(0, 1.15, 0.6), _mat(Color(0.12, 0.07, 0.05), 0.7), door)
	var outside := OmniLight3D.new()   # cold street light that only shows when the door opens
	outside.name = "Outside"
	outside.light_color = Color(0.7, 0.8, 1.0)
	outside.light_energy = 0.0
	outside.omni_range = 5.0
	outside.position = DOOR_POS + Vector3(-0.6, 1.5, 0)
	add_child(outside)
	# the corner booth, dark
	_box(Vector3(2.6, 0.5, 0.7), Vector3(-8.4, 0.25, 8.9), _mat(Color(0.25, 0.05, 0.1), 0.6))
	_box(Vector3(2.6, 1.2, 0.2), Vector3(-8.4, 0.6, 9.3), _mat(Color(0.25, 0.05, 0.1), 0.6))
	_box(Vector3(1.2, 0.75, 0.9), Vector3(-8.4, 0.375, 7.9), _mat(Color(0.1, 0.08, 0.06), 0.4))
	# Eddar's light: one bare bulb over the end of the bar, warm grey, never on the beat
	var bulb := OmniLight3D.new()
	bulb.light_color = Color(1.0, 0.88, 0.7)
	bulb.light_energy = 1.4
	bulb.omni_range = 6.5
	bulb.shadow_enabled = true
	bulb.position = Vector3(5.6, 3.3, 3.4)
	add_child(bulb)
	_box(Vector3(0.12, 0.16, 0.12), bulb.position, _mat(Color.WHITE, 0.5, 0, Color(1, 0.9, 0.7), 3.0))
	# puddles
	for p in PUDDLES:
		var mi := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.55
		cyl.bottom_radius = 0.55
		cyl.height = 0.01
		mi.mesh = cyl
		var c: Color = p[3]
		mi.material_override = _mat(Color(0.03, 0.03, 0.03).lerp(c, 0.12), 0.02, 0.2, c, 0.08)
		mi.position = p[0]
		mi.scale = Vector3(1, 1, 0.75)
		add_child(mi)
		puddle_nodes.append(mi)
	# the cup that spills in shot 3
	cup = _box(Vector3(0.09, 0.14, 0.09), Vector3(4.1, 1.35, 2.9), _mat(Color(1, 0.2, 0.3), 0.3))


func _build_lights() -> void:
	for i in 6:
		var s := SpotLight3D.new()
		s.position = Vector3(-5.0 + i * 2.0, 6.6, -4.6)
		s.spot_range = 18.0
		s.spot_angle = 11.0
		s.spot_attenuation = 0.6
		s.light_energy = 0.0
		s.light_volumetric_fog_energy = 2.2
		s.shadow_enabled = false
		add_child(s)
		heads.append(s)
		_box(Vector3(0.3, 0.3, 0.3), s.position + Vector3(0, 0.2, 0), _mat(Color(0.05, 0.05, 0.05)))
	# mirror ball: a spinning projector of dots
	mirror_ball = Node3D.new()
	mirror_ball.position = Vector3(0, 6.2, -0.5)
	add_child(mirror_ball)
	var ball := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 0.35
	sph.height = 0.7
	ball.mesh = sph
	ball.material_override = _mat(Color(0.8, 0.8, 0.9), 0.05, 1.0)
	mirror_ball.add_child(ball)
	mirror_light = OmniLight3D.new()
	mirror_light.light_projector = _dots_texture()
	mirror_light.light_energy = 0.0
	mirror_light.omni_range = 20.0
	mirror_light.light_volumetric_fog_energy = 0.0
	mirror_ball.add_child(mirror_light)


func _dots_texture() -> ImageTexture:
	var img := Image.create(512, 256, false, Image.FORMAT_RGBA8)
	img.fill(Color.BLACK)
	for i in 260:
		var cx := rng.randi_range(0, 511)
		var cy := rng.randi_range(0, 255)
		for dx in range(-2, 3):
			for dy in range(-2, 3):
				if dx * dx + dy * dy <= 4:
					img.set_pixel(posmod(cx + dx, 512), clampi(cy + dy, 0, 255), Color(1, 1, 1))
	return ImageTexture.create_from_image(img)


func _person(pos: Vector3, body: Color, height := 1.7, hair := Color(0.1, 0.07, 0.05), arms_up := false) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	add_child(root)
	var torso := MeshInstance3D.new()
	var cap := CapsuleMesh.new()
	cap.radius = 0.22
	cap.height = height * 0.78
	torso.mesh = cap
	torso.material_override = _mat(body, 0.55)
	torso.position = Vector3(0, height * 0.39, 0)
	root.add_child(torso)
	var head := MeshInstance3D.new()
	var hs := SphereMesh.new()
	hs.radius = 0.13
	hs.height = 0.26
	head.mesh = hs
	head.material_override = _mat(Color(0.85, 0.66, 0.55), 0.7)
	head.position = Vector3(0, height * 0.86, 0)
	head.name = "Head"
	root.add_child(head)
	var hair_mi := MeshInstance3D.new()
	var hm := SphereMesh.new()
	hm.radius = 0.14
	hm.height = 0.18
	hair_mi.mesh = hm
	hair_mi.material_override = _mat(hair, 0.8)
	hair_mi.position = Vector3(0, height * 0.86 + 0.06, 0.02)
	root.add_child(hair_mi)
	if arms_up:
		for side in [-1, 1]:
			var arm := _box(Vector3(0.08, 0.6, 0.08), Vector3(0.2 * side, height * 0.95, 0), _mat(body, 0.55), root)
			arm.rotation_degrees = Vector3(0, 0, -18 * side)
	return root


func _build_band() -> void:
	var roxy := _person(Vector3(0, 0.8, -5.6), Color(0.9, 0.1, 0.15), 1.72, Color(1.0, 0.3, 0.1))
	people["roxy"] = roxy
	_box(Vector3(0.03, 1.5, 0.03), Vector3(0, 0.75, 0.35), _mat(Color(0.6, 0.6, 0.6), 0.3, 1.0), roxy)
	var spike := _person(Vector3(-3.0, 0.8, -6.2), Color(0.15, 0.15, 0.2), 1.8, Color(0.05, 0.05, 0.05))
	people["spike"] = spike
	var lulu := _person(Vector3(3.0, 0.8, -6.2), Color(0.95, 0.6, 0.85), 1.6, Color(0.95, 0.85, 0.4))
	people["lulu"] = lulu
	var gil := _person(Vector3(0, 0.8, -7.9), Color(0.2, 0.5, 0.3), 1.75, Color(0.4, 0.25, 0.1))   # the drummer, unnamed
	_box(Vector3(1.6, 0.7, 0.9), Vector3(0, 1.15, -7.2), _mat(Color(0.1, 0.1, 0.12), 0.3, 0.5))
	for p in [roxy, spike, lulu, gil]:
		band.append({"node": p, "base": p.position, "phase": rng.randf() * TAU})
	# a backlight wash on the band
	var wash := OmniLight3D.new()
	wash.light_color = Color(0.6, 0.1, 1.0)
	wash.light_energy = 0.0
	wash.omni_range = 8.0
	wash.position = Vector3(0, 3.5, -8.3)
	wash.name = "Wash"
	add_child(wash)
	var front := OmniLight3D.new()
	front.light_color = Color(1.0, 0.25, 0.75)
	front.light_energy = 0.0
	front.omni_range = 12.0
	front.position = Vector3(0, 5.5, -1.0)
	front.name = "Front"
	add_child(front)


func _build_crowd() -> void:
	var named := {
		"superfan": [Vector3(2.4, 0, -2.4), Color(1.0, 0.85, 0.1)],
		"kings_fan": [Vector3(-2.6, 0, -1.4), Color(0.1, 0.4, 1.0)],
		"dwayne": [Vector3(1.0, 0, 0.6), Color(0.95, 0.45, 0.1)],
		"tammy_dad": [Vector3(-1.2, 0, 1.8), Color(0.55, 0.5, 0.45)],
	}
	named["gil"] = [Vector3(7.6, 0.25, 5.6), Color(0.4, 0.38, 0.34)]
	for id in named:
		var p := _person(named[id][0], named[id][1], 1.78, Color(0.2, 0.15, 0.1), id == "superfan")
		people[id] = p
		crowd.append({"node": p, "base": p.position, "phase": rng.randf() * TAU, "amp": 1.0})
	for i in 28:
		var pos := Vector3(rng.randf_range(-6.0, 6.0), 0, rng.randf_range(-3.8, 2.2))
		if pos.distance_to(Vector3(4.4, 0, 3.4)) < 1.5:
			continue
		var c := Color.from_hsv(rng.randf(), rng.randf_range(0.5, 0.95), rng.randf_range(0.5, 0.95))
		var p := _person(pos, c, rng.randf_range(1.55, 1.9), Color.from_hsv(rng.randf(), 0.5, rng.randf_range(0.1, 0.9)), rng.randf() < 0.3)
		p.rotation.y = PI + rng.randf_range(-0.6, 0.6)
		crowd.append({"node": p, "base": p.position, "phase": rng.randf() * TAU, "amp": rng.randf_range(0.5, 1.3)})
	# a bartender and the cup-holder near the bar
	var holder := _person(Vector3(4.1, 0, 2.6), Color(0.2, 0.9, 0.8), 1.75)
	crowd.append({"node": holder, "base": holder.position, "phase": 0.0, "amp": 0.8})
	var barkeep := _person(Vector3(9.3, 0, 4.0), Color(0.1, 0.1, 0.1), 1.8)
	barkeep.rotation.y = -PI / 2
	# people who walk between the camera and Eddar
	for spec in [[24.0, 27.5, Vector3(2.0, 0, 6.5), Vector3(7.5, 0, 5.2)],
				 [49.0, 53.0, Vector3(4.0, 0, 3.8), Vector3(8.0, 0, 0.5)],
				 [87.0, 90.5, Vector3(1.5, 0, 7.0), Vector3(6.0, 0, 6.6)]]:
		var w := _person(spec[2], Color.from_hsv(rng.randf(), 0.8, 0.9), 1.8)
		passers.append({"node": w, "t0": spec[0], "t1": spec[1], "from": spec[2], "to": spec[3]})


func _build_eddar() -> void:
	eddar = _person(Vector3(4.8, 0, 4.2), Color(0.42, 0.42, 0.44), 1.7, Color(0.2, 0.16, 0.12))
	eddar.get_child(0).rotation_degrees.x = 8   # a little hunched
	_box(Vector3(0.42, 0.7, 0.05), Vector3(0, 0.75, -0.22), _mat(Color(0.55, 0.55, 0.55), 0.9), eddar)   # apron
	mop = Node3D.new()
	mop.position = Vector3(0.25, 1.05, -0.2)
	eddar.add_child(mop)
	var handle := _box(Vector3(0.035, 1.5, 0.035), Vector3(0, -0.35, -0.35), _mat(Color(0.5, 0.4, 0.3), 0.7), mop)
	handle.rotation_degrees.x = -32
	_box(Vector3(0.36, 0.08, 0.2), Vector3(0, -1.0, -0.75), _mat(Color(0.75, 0.75, 0.7), 1.0), mop)


func _build_leagues() -> void:
	leagues = Node3D.new()
	leagues.position = DOOR_POS + Vector3(-0.8, 0, 0)
	leagues.visible = false
	add_child(leagues)
	var robe := MeshInstance3D.new()
	var cone := CylinderMesh.new()
	cone.top_radius = 0.2
	cone.bottom_radius = 0.45
	cone.height = 1.75
	robe.mesh = cone
	robe.material_override = _mat(Color(0.03, 0.03, 0.035), 0.95)
	robe.position = Vector3(0, 0.875, 0)
	leagues.add_child(robe)
	var head := MeshInstance3D.new()
	var hs := SphereMesh.new()
	hs.radius = 0.14
	hs.height = 0.28
	head.mesh = hs
	head.material_override = _mat(Color(0.25, 0.16, 0.1), 0.6)
	head.position = Vector3(0, 1.92, 0)
	head.name = "Head"
	leagues.add_child(head)
	for side in [-1, 1]:
		var eye := MeshInstance3D.new()
		var es := SphereMesh.new()
		es.radius = 0.022
		es.height = 0.044
		eye.mesh = es
		eye.material_override = _mat(Color.WHITE, 0.5, 0, Color(1, 1, 1), 16.0)
		eye.position = Vector3(0.05 * side, 1.95, -0.12)
		leagues.add_child(eye)
	var eye_light := OmniLight3D.new()
	eye_light.light_color = Color(0.85, 0.9, 1.0)
	eye_light.light_energy = 2.5
	eye_light.omni_range = 2.2
	eye_light.position = Vector3(0, 1.95, -0.3)
	leagues.add_child(eye_light)
	people["leagues"] = leagues


func _build_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	black = ColorRect.new()
	black.color = Color.BLACK
	black.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui.add_child(black)
	# chyron
	chyron = VBoxContainer.new()
	chyron.position = Vector2(64, 566)
	var c1 := Label.new()
	c1.text = "PROLOGUE"
	c1.add_theme_font_size_override("font_size", 40)
	c1.add_theme_color_override("font_color", Color(1, 1, 1))
	var c2 := Label.new()
	c2.text = "Soundcheck"
	c2.add_theme_font_size_override("font_size", 24)
	c2.add_theme_color_override("font_color", Color(1, 0.55, 0.85))
	chyron.add_child(c1)
	chyron.add_child(c2)
	chyron.modulate.a = 0.0
	ui.add_child(chyron)
	# Eddar's line box
	dialogue = PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.02, 0.02, 0.03, 0.82)
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 12
	sb.content_margin_bottom = 14
	sb.border_width_top = 1
	sb.border_color = Color(0.6, 0.6, 0.6, 0.6)
	dialogue.add_theme_stylebox_override("panel", sb)
	dialogue.position = Vector2(240, 590)
	dialogue.custom_minimum_size = Vector2(800, 0)
	var v := VBoxContainer.new()
	var nm := Label.new()
	nm.text = "EDDAR"
	nm.add_theme_font_size_override("font_size", 15)
	nm.add_theme_color_override("font_color", Color(0.65, 0.65, 0.68))
	dialogue_label = Label.new()
	dialogue_label.add_theme_font_size_override("font_size", 22)
	dialogue_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	v.add_child(nm)
	v.add_child(dialogue_label)
	dialogue.add_child(v)
	dialogue.visible = false
	ui.add_child(dialogue)


func _make_bubble(speaker: String, text: String) -> PanelContainer:
	var p := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 1, 1, 0.94)
	sb.set_corner_radius_all(14)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 6
	sb.content_margin_bottom = 8
	p.add_theme_stylebox_override("panel", sb)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 0)
	var nm := Label.new()
	nm.text = NAMES.get(speaker, speaker.to_upper())
	nm.add_theme_font_size_override("font_size", 12)
	nm.add_theme_color_override("font_color", Color(0.85, 0.1, 0.5) if speaker in ["roxy", "lulu", "spike"] else Color(0.3, 0.3, 0.4))
	var tx := Label.new()
	tx.text = text
	tx.add_theme_font_size_override("font_size", 17)
	tx.add_theme_color_override("font_color", Color(0.05, 0.05, 0.08))
	tx.autowrap_mode = TextServer.AUTOWRAP_WORD
	tx.custom_minimum_size = Vector2(min(300, 40 + text.length() * 9), 0)
	v.add_child(nm)
	v.add_child(tx)
	p.add_child(v)
	p.pivot_offset = Vector2(60, 40)
	ui.add_child(p)
	ui.move_child(p, 0)
	return p


func _build_audio() -> void:
	for n in ["Music", "Crowd", "SFX"]:
		AudioServer.add_bus()
		var i := AudioServer.bus_count - 1
		AudioServer.set_bus_name(i, n)
		AudioServer.set_bus_send(i, "Master")
	music_bus = AudioServer.get_bus_index("Music")
	crowd_bus = AudioServer.get_bus_index("Crowd")
	sfx_bus = AudioServer.get_bus_index("SFX")
	lowpass = AudioEffectLowPassFilter.new()
	lowpass.cutoff_hz = 20000
	AudioServer.add_bus_effect(music_bus, lowpass)
	var rev := AudioEffectReverb.new()
	rev.room_size = 0.6
	rev.wet = 0.12
	AudioServer.add_bus_effect(music_bus, rev)
	_play("music_temp.wav", "Music", 0.0)
	_play("crowd_temp.wav", "Crowd", -2.0)
	for k in 4:
		sfx_queue.append([1.0 + k * 0.5, "click.wav", "SFX", -6.0])
	sfx_queue.append([11.2, "spill.wav", "SFX", -4.0])
	sfx_queue.append([52.0, "clap.wav", "SFX", -2.0])
	sfx_queue.append([53.1, "clap.wav", "SFX", -2.0])
	sfx_queue.append([DOOR_AT, "door.wav", "SFX", -3.0])
	sfx_queue.append([DOOR_AT + 0.4, "low_note.wav", "SFX", -8.0])
	# mop slaps: every ~0.9 s while he's mopping, louder inside a hold
	var mt := 12.4
	while mt < 106.0:
		if _mopping_at(mt):
			sfx_queue.append([mt, "mop.wav", "SFX", -12.0 if not _in_hold(mt) else -3.0])
		mt += 0.93
	sfx_queue.sort_custom(func(a, b): return a[0] < b[0])


func _play(file: String, bus: String, db: float) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = AudioStreamWAV.load_from_file(ProjectSettings.globalize_path("res://wyvern/audio/" + file))
	p.bus = bus
	p.volume_db = db
	add_child(p)
	if preview_frame < 0:
		p.play()
	players.append(p)
	return p


# ---------------------------------------------------------------- update

func _in_hold(at: float) -> bool:
	for h in HOLDS:
		if at >= h[0] and at < h[1]:
			return true
	return false


func _mopping_at(at: float) -> bool:
	for i in range(EDDAR_PATH.size() - 1):
		var a = EDDAR_PATH[i]
		var b = EDDAR_PATH[i + 1]
		if at >= a[0] and at < b[0]:
			return a[1] == b[1] and at >= 12.4
	return false


func _update_lights(music_on: bool, pulse: float) -> void:
	var lit := t >= SLAM
	var palette := [Color(1, 0.1, 0.7), Color(0.1, 0.9, 1), Color(0.6, 0.2, 1), Color(1, 0.5, 0.1)]
	var stutter := t >= DOOR_AT and t < DOOR_AT + 0.25
	for i in heads.size():
		var s: SpotLight3D = heads[i]
		if not lit or stutter:
			s.light_energy = 0.0
			continue
		var bar := int(max(t - SLAM, 0.0) / (4 * BEAT))
		if music_on:
			var sweep := sin(t * 1.3 + i * 0.9) * 0.7
			var tilt := -1.05 + sin(t * 0.9 + i * 1.7) * 0.35
			s.rotation = Vector3(tilt, sweep, 0)
			s.light_color = palette[(i + bar) % palette.size()]
			s.light_energy = 30.0 + 60.0 * pulse
		else:
			# the break: two spots hold on Roxy, the rest go dim
			s.light_color = Color(1, 0.95, 0.9) if i in [2, 3] else Color(0.5, 0.2, 1)
			var target: Vector3 = people["roxy"].global_position + Vector3(0, 1.2, 0)
			s.look_at(target, Vector3.UP)
			s.light_energy = 30.0 if i in [2, 3] else 3.0
	var wash: OmniLight3D = get_node("Wash")
	wash.light_energy = (2.0 + 4.0 * pulse) if lit and not stutter else 0.0
	var front: OmniLight3D = get_node("Front")
	front.light_energy = (0.8 + 1.6 * pulse) if music_on and not stutter else (0.4 if lit and not stutter else 0.0)
	mirror_ball.rotation.y = t * 0.6
	mirror_light.light_energy = 3.0 if t >= 20.0 and music_on and not stutter else 0.0


func _update_people(music_on: bool) -> void:
	var beat_t: float = max(t - SLAM, 0.0) / BEAT
	var lit := t >= SLAM
	for c in crowd:
		var n: Node3D = c["node"]
		var amp: float = c["amp"] if music_on else 0.15 * c["amp"]
		var bob: float = abs(sin(beat_t * PI + c["phase"])) * 0.09 * amp if lit else 0.0
		n.position = c["base"] + Vector3(0, bob, 0)
		n.rotation.z = sin(beat_t * PI * 0.5 + c["phase"]) * 0.06 * amp if lit else 0.0
	for b in band:
		var n: Node3D = b["node"]
		var bob2: float = abs(sin(beat_t * PI + b["phase"])) * 0.07 if music_on else 0.0
		n.position = b["base"] + Vector3(0, bob2, 0)
	# Roxy leans into the mic on the hook, paces during the pep talk
	var roxy: Node3D = people["roxy"]
	if t >= BREAK_START and t < BREAK_END:
		roxy.position.x = sin((t - BREAK_START) * 0.7) * 1.4
	# passers-by
	for p in passers:
		var k: float = clamp((t - p["t0"]) / (p["t1"] - p["t0"]), 0.0, 1.0)
		var n2: Node3D = p["node"]
		n2.visible = t >= p["t0"] - 0.2 and t <= p["t1"] + 0.2
		n2.position = (p["from"] as Vector3).lerp(p["to"], k) + Vector3(0, abs(sin(t * 7.0)) * 0.04, 0)
		n2.look_at(n2.position + ((p["to"] as Vector3) - (p["from"] as Vector3)), Vector3.UP)


func _update_eddar() -> void:
	var pos := Vector3.ZERO
	var face := Vector3.ZERO
	var walking := false
	for i in range(EDDAR_PATH.size() - 1):
		var a = EDDAR_PATH[i]
		var b = EDDAR_PATH[i + 1]
		if t >= a[0] and t < b[0]:
			var k: float = (t - a[0]) / (b[0] - a[0])
			k = k * k * (3.0 - 2.0 * k)
			pos = (a[1] as Vector3).lerp(b[1], k)
			walking = a[1] != b[1]
			face = b[1] if walking else a[2]
			break
	if t >= EDDAR_PATH[-1][0]:
		pos = EDDAR_PATH[-1][1]
		face = EDDAR_PATH[-1][2]
	# the bump: a passer-by knocks him and doesn't look back
	if t > 50.6 and t < 51.4:
		pos += Vector3(0.18, 0, 0.1) * sin((t - 50.6) / 0.8 * PI)
	eddar.position = pos + Vector3(0, abs(sin(t * 6.0)) * 0.03 if walking else 0.0, 0)
	var flat := Vector3(face.x, 0, face.z)
	if flat.distance_to(Vector3(pos.x, 0, pos.z)) > 0.05:
		eddar.look_at(flat, Vector3.UP)
	# mopping: small slow figure-eights, never on the beat
	var mopping := _mopping_at(t) and not walking
	var still := _in_hold(t)
	var mt := t * 1.07
	if mopping and not still:
		mop.position = Vector3(0.25 + sin(mt * 2.0) * 0.18, 1.05, -0.2 + sin(mt) * 0.12)
		eddar.rotation.y += sin(mt * 2.0) * 0.05
	elif t < 12.0:
		mop.position = Vector3(0.25, 1.5, -0.2)   # not yet down
	else:
		mop.position = Vector3(0.25, 1.05, -0.2)
	# puddles shrink while he works on them, then stay faintly there; the floor is never done
	for i in PUDDLES.size():
		var p = PUDDLES[i]
		var k2: float = clamp((t - p[1]) / (p[2] - p[1]), 0.0, 1.0)
		var s: float = lerp(1.0, 0.35, k2)
		puddle_nodes[i].scale = Vector3(s, 1, s * 0.75)
	puddle_nodes[0].visible = t >= 11.2


func _update_story_props() -> void:
	# the cup: held, tipped at 10.4, falls, splashes at 11.2
	if t < 10.4:
		cup.position = Vector3(4.1, 1.35, 2.9)
		cup.rotation = Vector3.ZERO
	elif t < 11.2:
		var k := (t - 10.4) / 0.8
		cup.position = Vector3(4.1, 1.35, 2.9).lerp(Vector3(4.35, 0.05, 3.3), k * k)
		cup.rotation = Vector3(k * 4.0, 0, k * 2.0)
	else:
		cup.position = Vector3(4.6, 0.05, 3.6)
		cup.rotation = Vector3(PI / 2, 0, 0.4)
	# door and the stranger
	var outside: OmniLight3D = get_node("Outside")
	var open_k := 0.0
	if t >= DOOR_AT and t < DOOR_AT + 4.5:
		open_k = clamp((t - DOOR_AT) / 1.0, 0.0, 1.0) * clamp((DOOR_AT + 4.5 - t) / 1.0, 0.0, 1.0)
	door.rotation.y = -open_k * 1.6
	outside.light_energy = open_k * 6.0
	leagues.visible = t >= DOOR_AT + 0.6
	if leagues.visible:
		var walk_t := t - (DOOR_AT + 0.6)
		var path := [DOOR_POS + Vector3(-0.6, 0, 0), DOOR_POS + Vector3(1.2, 0, 0.6), BOOTH_SEAT + Vector3(0.9, 0, -0.6), BOOTH_SEAT]
		var seg_time := 2.6
		var seg := int(walk_t / seg_time)
		if seg >= path.size() - 1:
			leagues.position = BOOTH_SEAT + Vector3(0, -0.35, 0)   # seated
			leagues.rotation.y = 0.0
		else:
			var k3 := fmod(walk_t, seg_time) / seg_time
			leagues.position = (path[seg] as Vector3).lerp(path[seg + 1], k3)
			var dir: Vector3 = path[seg + 1] - path[seg]
			leagues.look_at(leagues.position + dir, Vector3.UP)


func _over_shoulder() -> Array:
	# about 3 feet off Eddar's right shoulder, at waist-to-chest height, looking past him toward the stage
	var basis := eddar.global_transform.basis
	var right := basis.x.normalized()
	var back := basis.z.normalized()
	var p := eddar.global_position + right * 0.8 + back * 1.15 + Vector3(0, 1.05, 0)
	var stage := Vector3(0, 1.8, -6.0)
	var look := eddar.global_position + right * 0.9 + Vector3(0, 1.3, 0) + (stage - eddar.global_position).normalized() * 4.0
	return [p, look]


func _update_camera(delta: float) -> void:
	var p := Vector3.ZERO
	var look := Vector3.ZERO
	var fov := 58.0
	var cut := false
	if t < 8.0:
		# shot 2: wide from the back, high, slow push in
		var k: float = clamp((t - SLAM) / 5.0, 0.0, 1.0)
		p = Vector3(-1.0, 6.2, 9.4).lerp(Vector3(-0.5, 5.2, 6.8), k)
		look = Vector3(0, 1.6, -5.5)
		fov = 62.0
		cut = true
	elif t < 12.0:
		# shot 3: crane down through the crowd to the cup
		var k := (t - 8.0) / 4.0
		k = k * k * (3.0 - 2.0 * k)
		p = Vector3(1.5, 4.8, 1.0).lerp(Vector3(2.7, 1.55, 3.7), k)
		look = Vector3(0, 1.8, -5.5).lerp(Vector3(4.3, 0.6, 3.1), clamp((t - 9.6) / 1.4, 0.0, 1.0))
		fov = 55.0
		cut = true
	elif t < 15.0:
		# shot 4: low and tight on the floor as the mop lands
		p = Vector3(3.6, 0.35, 4.6)
		look = Vector3(4.45, 0.05, 3.45)
		fov = 50.0
		cut = true
	elif t < 20.0:
		# shot 5: tilt up the handle to his face, then settle over his shoulder
		var k: float = clamp((t - 15.0) / 3.2, 0.0, 1.0)
		k = k * k * (3.0 - 2.0 * k)
		var eb := eddar.global_transform.basis
		var fwd := -eb.z.normalized()
		var rgt := eb.x.normalized()
		var face_p := eddar.global_position + fwd * 1.3 + rgt * 0.35 + Vector3(0, 0.35, 0)
		var face_look := eddar.global_position + fwd * 0.75 + Vector3(0, 0.05, 0)
		var face_look2 := eddar.global_position + Vector3(0, 1.45, 0)
		var os := _over_shoulder()
		if t < 17.2:
			p = face_p.lerp(face_p + Vector3(0, 0.25, 0), k)
			look = face_look.lerp(face_look2, clamp((t - 15.0) / 2.0, 0.0, 1.0))
		else:
			var k2: float = clamp((t - 17.2) / 2.8, 0.0, 1.0)
			k2 = k2 * k2 * (3.0 - 2.0 * k2)
			p = (face_p + Vector3(0, 0.25, 0)).lerp(os[0], k2)
			look = face_look2.lerp(os[1], k2)
		fov = 50.0
		cut = true
	elif t < DOOR_AT + 0.3:
		# shot 6 onward: gameplay camera, close over the shoulder; holds freeze it
		var os2 := _over_shoulder()
		p = os2[0]
		look = os2[1]
		fov = 52.0
		if _in_hold(t):
			fov = 46.0   # a slight push in for his line
	else:
		# shot 12: for the first time the camera leaves him, panning to the door, then the booth
		var os3 := _over_shoulder()
		var k: float = clamp((t - DOOR_AT - 0.3) / 3.5, 0.0, 1.0)
		k = k * k * (3.0 - 2.0 * k)
		var target := leagues.global_position + Vector3(0, 1.6, 0) if leagues.visible else DOOR_POS + Vector3(0, 1.5, 0)
		p = os3[0]
		look = os3[1].lerp(target, k)
		fov = lerp(52.0, 16.0, clamp((t - DOOR_AT - 3.0) / 8.0, 0.0, 1.0))
	if cut or delta == 0.0:
		cam_pos = p
		cam_look = look
	else:
		var s := 1.0 - exp(-delta * (2.0 if not _in_hold(t) else 6.0))
		cam_pos = cam_pos.lerp(p, s)
		cam_look = cam_look.lerp(look, s)
	cam.fov = fov if cut else lerp(cam.fov, fov, 1.0 - exp(-delta * 3.0)) if delta > 0.0 else fov
	cam.global_position = cam_pos
	cam.look_at(cam_look, Vector3.UP)


func _update_bubbles() -> void:
	while bubble_i < BUBBLES.size() and t >= BUBBLES[bubble_i][0]:
		var b = BUBBLES[bubble_i]
		var life: float = max(2.6, 1.2 + (b[2] as String).length() * 0.045)
		if t < b[0] + life:
			bubbles.append({"node": _make_bubble(b[1], b[2]), "at": b[0], "life": life, "speaker": b[1]})
		bubble_i += 1
	var keep: Array = []
	for b in bubbles:
		var node: PanelContainer = b["node"]
		var age: float = t - b["at"]
		if age > b["life"]:
			node.queue_free()
			continue
		keep.append(b)
		var head: Node3D = people[b["speaker"]]
		var world := head.global_position + Vector3(0, 2.1, 0)
		if cam.is_position_behind(world):
			node.visible = false
			continue
		node.visible = true
		var sp := cam.unproject_position(world)
		var size := node.size
		var vp := get_viewport().get_visible_rect().size
		var pos := sp - Vector2(size.x * 0.5, size.y)
		pos.x = clamp(pos.x, 12.0, vp.x - size.x - 12.0)
		pos.y = clamp(pos.y, 12.0, vp.y - size.y - 150.0)
		node.position = pos
		var pop: float = clamp(age / 0.12, 0.0, 1.0)
		node.scale = Vector2.ONE * lerp(0.7, 1.0, pop)
		node.modulate.a = clamp((b["life"] - age) / 0.3, 0.0, 1.0) * (0.35 if _in_hold(t) else 1.0)
	bubbles = keep


func _update_overlays() -> void:
	# shot 1: black until the slam; fade to black at the end
	if t < SLAM:
		black.color.a = 1.0
	elif t > END_AT - 2.5:
		black.color.a = clamp((t - (END_AT - 2.5)) / 2.0, 0.0, 1.0)
	else:
		black.color.a = 0.0
	chyron.modulate.a = clamp((t - 12.4) / 0.6, 0.0, 1.0) * clamp((17.0 - t) / 0.8, 0.0, 1.0)
	dialogue.visible = false
	for h in HOLDS:
		if t >= h[0] + 0.3 and t < h[1]:
			dialogue.visible = true
			var full: String = h[2]
			var n := int(clamp((t - h[0] - 0.3) * 38.0, 0.0, full.length()))
			dialogue_label.text = full.substr(0, n)


func _update_mix(delta: float) -> void:
	# targets: [music dB, lowpass Hz, crowd dB]
	var music_db := 0.0
	var cutoff := 20000.0
	var crowd_db := -2.0
	if t >= 12.3 and t < 15.4:
		music_db = -5.0      # shot 4: as if through a wall
		cutoff = 380.0
		crowd_db = -16.0
	elif t >= 15.4 and t < 17.5:
		var k: float = clamp((t - 15.4) / 2.1, 0.0, 1.0)
		cutoff = lerp(380.0, 20000.0, k * k)
		music_db = lerp(-5.0, 0.0, k)
		crowd_db = lerp(-16.0, -2.0, k)
	if _in_hold(t):
		music_db = -13.0
		cutoff = 900.0
		crowd_db = -28.0
	var s := 1.0 if delta == 0.0 else 1.0 - exp(-delta * 9.0)
	AudioServer.set_bus_volume_db(music_bus, lerp(AudioServer.get_bus_volume_db(music_bus), music_db, s))
	AudioServer.set_bus_volume_db(crowd_bus, lerp(AudioServer.get_bus_volume_db(crowd_bus), crowd_db, s))
	lowpass.cutoff_hz = lerp(lowpass.cutoff_hz, cutoff, s)


func _update_sfx() -> void:
	if preview_frame >= 0:
		return
	while sfx_i < sfx_queue.size() and t >= sfx_queue[sfx_i][0]:
		var q = sfx_queue[sfx_i]
		var p := AudioStreamPlayer.new()
		p.stream = AudioStreamWAV.load_from_file(ProjectSettings.globalize_path("res://wyvern/audio/" + q[1]))
		p.bus = q[2]
		p.volume_db = q[3]
		add_child(p)
		p.play()
		p.finished.connect(p.queue_free)
		sfx_i += 1
