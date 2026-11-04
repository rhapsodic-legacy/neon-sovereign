extends Control
## Combat sandbox: feel the Solo bars, free Charges, Break, stacking and the specials.
## godot --path godot res://combat/sandbox.tscn

const COL_BG := Color(0.05, 0.03, 0.08)
const COL_PANEL := Color(0.1, 0.07, 0.14)
const CHAKRA_COL := {"gold": Color(1.0, 0.85, 0.35), "red": Color(1.0, 0.25, 0.2), "black": Color(0.55, 0.3, 0.9)}

var battle: Battle
var speed := 1.0
var enc_pick: OptionButton
var diff_pick: OptionButton
var act_pick: SpinBox
var speed_btn: Button
var clock: Label
var banner: Label
var banner_t := 0.0
var log_box: RichTextLabel
var enemy_row: HBoxContainer
var party_row: HBoxContainer
var cmd_box: VBoxContainer
var cmd_title: Label
var widgets := {}   # unit id -> {panel, hp, hp_l, turn, brk, chakra, solos:[[label, bar]], status, solo_btn}
var log_lines: Array = []
var shown_for := ""


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = COL_BG
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var root := VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 16
	root.offset_right = -16
	root.offset_top = 12
	root.offset_bottom = -12
	root.add_theme_constant_override("separation", 10)
	add_child(root)
	root.add_child(_top_bar())
	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 14)
	root.add_child(body)
	var field := VBoxContainer.new()
	field.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	field.add_theme_constant_override("separation", 10)
	body.add_child(field)
	enemy_row = HBoxContainer.new()
	enemy_row.alignment = BoxContainer.ALIGNMENT_CENTER
	enemy_row.add_theme_constant_override("separation", 12)
	field.add_child(enemy_row)
	banner = Label.new()
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.add_theme_font_size_override("font_size", 30)
	banner.custom_minimum_size = Vector2(0, 44)
	field.add_child(banner)
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	field.add_child(spacer)
	cmd_title = Label.new()
	cmd_title.add_theme_font_size_override("font_size", 18)
	cmd_title.add_theme_color_override("font_color", Color(1, 0.85, 0.4))
	field.add_child(cmd_title)
	cmd_box = VBoxContainer.new()
	field.add_child(cmd_box)
	party_row = HBoxContainer.new()
	party_row.add_theme_constant_override("separation", 12)
	field.add_child(party_row)
	log_box = RichTextLabel.new()
	log_box.custom_minimum_size = Vector2(380, 0)
	log_box.bbcode_enabled = true
	log_box.scroll_following = true
	log_box.add_theme_font_size_override("normal_font_size", 13)
	body.add_child(log_box)
	_restart()


func _top_bar() -> Control:
	var bar := HBoxContainer.new()
	bar.add_theme_constant_override("separation", 10)
	var title := Label.new()
	title.text = "THE SET v2  ·  combat sandbox"
	title.add_theme_font_size_override("font_size", 18)
	title.add_theme_color_override("font_color", Color(1, 0.4, 0.8))
	bar.add_child(title)
	enc_pick = OptionButton.new()
	for e in CombatContent.encounters():
		enc_pick.add_item(e[1])
		enc_pick.set_item_metadata(enc_pick.item_count - 1, e[0])
	bar.add_child(enc_pick)
	diff_pick = OptionButton.new()
	for d in [["unplugged", "Unplugged"], ["guitar_solo", "Guitar Solo"], ["headliner", "Headliner"], ["symphony", "Symphony"]]:
		diff_pick.add_item(d[1])
		diff_pick.set_item_metadata(diff_pick.item_count - 1, d[0])
	diff_pick.select(1)
	bar.add_child(diff_pick)
	var al := Label.new()
	al.text = "Story act"
	bar.add_child(al)
	act_pick = SpinBox.new()
	act_pick.min_value = 0
	act_pick.max_value = 5
	act_pick.tooltip_text = "How far into the story Eddar is: his Still drains more each act"
	bar.add_child(act_pick)
	var rb := Button.new()
	rb.text = "Restart"
	rb.pressed.connect(_restart)
	bar.add_child(rb)
	speed_btn = Button.new()
	speed_btn.text = "Speed 1x"
	speed_btn.pressed.connect(func():
		speed = 2.0 if speed == 1.0 else (0.5 if speed == 2.0 else 1.0)
		speed_btn.text = "Speed %sx" % str(speed))
	bar.add_child(speed_btn)
	clock = Label.new()
	clock.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	bar.add_child(clock)
	return bar


func _restart() -> void:
	battle = Battle.new()
	var enc: String = enc_pick.get_item_metadata(enc_pick.selected)
	var diff: String = diff_pick.get_item_metadata(diff_pick.selected)
	battle.setup(CombatContent.party(), CombatContent.encounter(enc), diff, randi(), int(act_pick.value))
	for c in enemy_row.get_children():
		c.queue_free()
	for c in party_row.get_children():
		c.queue_free()
	widgets.clear()
	log_lines.clear()
	for u in battle.units:
		var w := _unit_panel(u)
		(enemy_row if u["side"] == "enemy" else party_row).add_child(w["panel"])
		widgets[u["id"]] = w
	shown_for = "-"
	_drain()


func _bar(color: Color, h := 10.0) -> ProgressBar:
	var p := ProgressBar.new()
	p.show_percentage = false
	p.custom_minimum_size = Vector2(0, h)
	p.max_value = 1.0
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	fill.set_corner_radius_all(3)
	var back := StyleBoxFlat.new()
	back.bg_color = Color(0, 0, 0, 0.5)
	back.set_corner_radius_all(3)
	p.add_theme_stylebox_override("fill", fill)
	p.add_theme_stylebox_override("background", back)
	return p


func _small(text: String, col := Color(0.75, 0.72, 0.8)) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", 12)
	l.add_theme_color_override("font_color", col)
	return l


func _unit_panel(u: Dictionary) -> Dictionary:
	var panel := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = COL_PANEL
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(10)
	sb.border_color = Color(0.3, 0.25, 0.4)
	sb.set_border_width_all(1)
	panel.add_theme_stylebox_override("panel", sb)
	panel.custom_minimum_size = Vector2(250 if u["side"] == "hero" else 280, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 3)
	panel.add_child(v)
	var name := Label.new()
	name.text = u["name"]
	name.add_theme_font_size_override("font_size", 18)
	v.add_child(name)
	var w := {"panel": panel, "style": sb, "solos": []}
	w["hp_l"] = _small("")
	v.add_child(w["hp_l"])
	w["hp"] = _bar(Color(0.3, 0.9, 0.45), 12)
	v.add_child(w["hp"])
	if u["side"] == "enemy":
		v.add_child(_small("Break"))
		w["brk"] = _bar(Color(1.0, 0.55, 0.1), 8)
		v.add_child(w["brk"])
		panel.mouse_filter = Control.MOUSE_FILTER_STOP
		panel.gui_input.connect(func(ev):
			if ev is InputEventMouseButton and ev.pressed:
				battle.focus = u["id"])
	else:
		v.add_child(_small("Turn"))
		w["turn"] = _bar(Color(0.4, 0.75, 1.0), 8)
		v.add_child(w["turn"])
		var ck: String = u["chakra_kind"]
		w["chakra_l"] = _small("", CHAKRA_COL[ck])
		v.add_child(w["chakra_l"])
		w["chakra"] = _bar(CHAKRA_COL[ck], 8)
		v.add_child(w["chakra"])
	for s in u["solos"]:
		var l := _small("", Color(1, 0.6, 0.9))
		var b := _bar(Color(1, 0.35, 0.8), 8)
		v.add_child(l)
		v.add_child(b)
		w["solos"].append([l, b])
	if u.has("solo_options") and u["solo_options"].size() > 1:
		var btn := Button.new()
		btn.add_theme_font_size_override("font_size", 12)
		btn.pressed.connect(func(): battle.set_solo(u["id"], battle.unit(u["id"])["solo_i"] + 1))
		v.add_child(btn)
		w["solo_btn"] = btn
	w["status"] = _small("", Color(0.95, 0.9, 0.6))
	v.add_child(w["status"])
	return w


func _process(delta: float) -> void:
	var left := delta * speed
	while left > 0.0 and battle.awaiting == "" and battle.over == "":
		var dt: float = min(left, 1.0 / 60.0)
		battle.step(dt)
		left -= dt
	_drain()
	_refresh()
	banner_t -= delta
	banner.modulate.a = clamp(banner_t, 0.0, 1.0)


func _unhandled_input(ev: InputEvent) -> void:
	if ev is InputEventKey and ev.pressed and battle.awaiting != "":
		var n: int = ev.keycode - KEY_1
		var cmds := battle.commands_for(battle.awaiting)
		if n >= 0 and n < cmds.size() and cmds[n][2]:
			battle.command(battle.awaiting, cmds[n][0])


func _drain() -> void:
	for e in battle.events:
		var col := "#cccccc"
		match e["kind"]:
			"special": col = "#ffd166"
			"broken": col = "#ff8c1a"
			"tell": col = "#ff4d6d"
			"protect": col = "#7fd1ff"
			"solo": col = "#ff9ad5"
			"lift": col = "#b48cff"
			"end": col = "#ffffff"
		if e["kind"] == "hit" and e.get("text", "").begins_with("Solo"):
			col = "#ff9ad5"
		log_lines.append("[color=#666]%5.1f[/color]  [color=%s]%s[/color]" % [e["t"], col, e["text"]])
		if e["kind"] in ["special", "broken", "tell", "end"]:
			banner.text = e["text"]
			banner.add_theme_color_override("font_color", Color(col))
			banner_t = 2.2
		if e.has("target") and widgets.has(e["target"]) and e["kind"] == "hit":
			var p: PanelContainer = widgets[e["target"]]["panel"]
			p.modulate = Color(1.6, 1.2, 1.2)
			create_tween().tween_property(p, "modulate", Color.WHITE, 0.25)
	battle.events.clear()
	if log_lines.size() > 200:
		log_lines = log_lines.slice(log_lines.size() - 200)
	log_box.text = "\n".join(log_lines)


func _refresh() -> void:
	clock.text = "%.1f s   %s" % [battle.time, "PAUSED" if battle.awaiting != "" else ""]
	for u in battle.units:
		var w: Dictionary = widgets.get(u["id"], {})
		if w.is_empty():
			continue
		w["hp"].value = float(u["hp"]) / u["max_hp"]
		w["hp_l"].text = "HP %d / %d" % [u["hp"], u["max_hp"]]
		if u["side"] == "enemy":
			w["brk"].value = u["break"] / u["break_max"]
			w["style"].border_color = Color(1, 0.4, 0.8) if battle.focus == u["id"] else Color(0.3, 0.25, 0.4)
		else:
			w["turn"].value = u["turn"]
			w["chakra"].value = u["chakra"] / 100.0
			w["chakra_l"].text = "%s chakra %d%s" % [u["chakra_kind"].capitalize(), int(u["chakra"]), "  READY" if u["chakra"] >= 100.0 else ""]
			w["style"].border_color = Color(1, 0.85, 0.4) if battle.awaiting == u["id"] else Color(0.3, 0.25, 0.4)
		for i in u["solos"].size():
			var s: Dictionary = u["solos"][i]
			var pair: Array = w["solos"][i]
			pair[1].value = s["value"]
			var mods: Array = Battle.DIFFICULTY[battle.difficulty]
			var secs: float = (1.0 - s["value"]) * s["fill"] / (mods[0] if u["side"] == "hero" else mods[1])
			pair[0].text = "Solo: %s  (%.1fs)" % [s["label"], secs] if not battle.is_broken(u) else "Solo: %s  (frozen)" % s["label"]
		if w.has("solo_btn"):
			w["solo_btn"].text = "Solo action: %s  (change)" % battle.current_solo(u)["label"]
		var st: Array = []
		for k in u["status"].keys():
			var v = u["status"][k]
			var nice: String = k.capitalize()
			if v is Dictionary and v.has("left"):
				nice += " %.1fs" % v["left"]
			st.append(nice)
		w["status"].text = ", ".join(st) if u["hp"] > 0 else "DOWN"
		w["panel"].self_modulate = Color(0.5, 0.5, 0.5) if u["hp"] <= 0 else Color.WHITE
	if shown_for != battle.awaiting:
		shown_for = battle.awaiting
		for c in cmd_box.get_children():
			c.queue_free()
		if battle.awaiting == "":
			cmd_title.text = "" if battle.over == "" else ("VICTORY. Press Restart to go again." if battle.over == "win" else "DEFEAT. Press Restart to try again.")
		else:
			var u := battle.unit(battle.awaiting)
			cmd_title.text = "%s's turn. Everything is paused. Click an enemy to target it, then pick (or press 1-4):" % u["name"]
			var row := HBoxContainer.new()
			row.add_theme_constant_override("separation", 8)
			cmd_box.add_child(row)
			var i := 1
			for c in battle.commands_for(u["id"]):
				var b := Button.new()
				b.text = "%d  %s" % [i, c[1]]
				b.disabled = not c[2]
				b.custom_minimum_size = Vector2(150, 36)
				var cid: String = c[0]
				var uid: String = u["id"]
				b.pressed.connect(func(): battle.command(uid, cid))
				row.add_child(b)
				i += 1
