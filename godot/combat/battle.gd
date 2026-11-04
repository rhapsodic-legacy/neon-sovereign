class_name Battle
extends RefCounted
## THE SET v2 battle core: turn-based choices plus Solo bars (Jesse's design, combat doc 4 Nov 2026).
## Pure logic: no nodes, no rendering. The sandbox UI and the headless tests both drive it.
##
## Time runs in seconds. Every unit has a turn gauge (ATB) and one or more Solo bars.
## When a hero's turn gauge fills, the battle pauses until a command is given (bars never run in menus).
## When a Solo bar fills, its owner performs that Solo action automatically, for free.
## Sandbox numbers only: balance is deferred until Jesse asks for it.

const DIFFICULTY := {
	# name: [friendly Solo bar speed, enemy Solo bar speed]
	"unplugged": [1.0, 0.85],    # easy: slower enemy bars (to be tuned)
	"guitar_solo": [1.0, 1.0],   # normal: no modifiers
	"headliner": [1.05, 1.10],   # hard (Jesse's numbers)
	"symphony": [1.10, 1.20],    # hardest (Jesse's numbers)
}
const FRIEND_TO_BLACK := 0.3
const ENEMY_TO_BLACK := 0.9
const BROKEN_SECONDS := 6.0
const PROTECT_COST := 0.12       # Rex's protect knocks this much off each of his Solo bars

var units: Array = []
var time := 0.0
var awaiting := ""               # id of the hero whose command we're waiting for
var over := ""                   # "", "win" or "lose"
var difficulty := "guitar_solo"
var story_act := 0               # 0 = prologue; Eddar's Still grows with the story
var focus := ""                  # the enemy the player last picked; Solo actions aim here
var events: Array = []           # drained by the UI: {t, kind, text, ...}
var rng := RandomNumberGenerator.new()


func setup(party: Array, foes: Array, diff := "guitar_solo", seed := 1, act := 0) -> void:
	rng.seed = seed
	difficulty = diff
	story_act = act
	units.clear()
	for d in party + foes:
		units.append(_make_unit(d))
	focus = foes[0]["id"]
	_log("start", "The fight begins.")


func _make_unit(d: Dictionary) -> Dictionary:
	var u := d.duplicate(true)
	u["max_hp"] = d["hp"]
	u["turn"] = rng.randf_range(0.0, 0.45)
	u["chakra"] = 0.0
	u["break"] = 0.0
	u["status"] = {}
	u["solo_i"] = 0
	for s in u["solos"]:
		s["value"] = rng.randf_range(0.0, 0.3)
	return u


# ------------------------------------------------------------------ queries

func unit(id: String) -> Dictionary:
	for u in units:
		if u["id"] == id:
			return u
	return {}


func alive(side: String) -> Array:
	return units.filter(func(u): return u["side"] == side and u["hp"] > 0)


func has(u: Dictionary, s: String) -> bool:
	return u["status"].has(s)


func is_broken(u: Dictionary) -> bool:
	return u["status"].has("broken")


func commands_for(id: String) -> Array:
	## The hero's turn menu: [command id, label, enabled]
	var u := unit(id)
	var muted := has(u, "mute")
	var out: Array = []
	for c in u["commands"]:
		var ok := true
		if c.get("special", false):
			ok = u["chakra"] >= 100.0 and not muted
		elif c.get("skill", false):
			ok = not muted
		out.append([c["id"], c["label"], ok])
	return out


func current_solo(u: Dictionary) -> Dictionary:
	return u["solo_options"][u["solo_i"]] if u.has("solo_options") else {}


# ------------------------------------------------------------------ time

func step(dt: float) -> void:
	if awaiting != "" or over != "":
		return
	time += dt
	for u in units:
		if u["hp"] <= 0:
			continue
		_tick_status(u, dt)
		if is_broken(u):
			continue
		var mods: Array = DIFFICULTY[difficulty]
		var solo_mod: float = mods[0] if u["side"] == "hero" else mods[1]
		if has(u, "burnt_out"):
			solo_mod *= 0.5
		if u["id"] == "rex" and u["chakra"] >= 100.0:
			solo_mod *= 1.25          # a hero at full gold gets louder
		if u["id"] == "roxy":
			solo_mod *= 1.0 + u["chakra"] / 200.0   # anger speeds her up
		for s in u["solos"]:
			s["value"] += dt / s["fill"] * solo_mod
			if s["value"] >= 1.0:
				s["value"] = 0.0
				_solo(u, s)
				if over != "":
					return
		u["turn"] += dt / u["turn_time"]
		if u["turn"] >= 1.0:
			u["turn"] = 0.0
			_turn_begins(u)
			if u["side"] == "hero":
				awaiting = u["id"]
				_log("ready", "%s is ready." % u["name"], {"unit": u["id"]})
				return
			_enemy_turn(u)
			if over != "":
				return


func _tick_status(u: Dictionary, dt: float) -> void:
	var st: Dictionary = u["status"]
	for k in st.keys():
		var v = st[k]
		if v is Dictionary and v.has("left"):
			v["left"] -= dt
			if v["left"] <= 0.0:
				st.erase(k)
				_on_status_end(u, k, v)


func _on_status_end(u: Dictionary, k: String, v: Dictionary) -> void:
	match k:
		"broken":
			u["break"] = 0.0
			_log("recover", "%s recovers." % u["name"], {"unit": u["id"]})
		"charging":
			_hit(u, _target_enemy(u), 2.2, 35.0, "Charge")
		"rearing":
			_howl(u)


func _turn_begins(u: Dictionary) -> void:
	## "1 round" effects last until their caster's next turn.
	for o in units:
		for k in o["status"].keys():
			var v = o["status"][k]
			if v is Dictionary and v.get("until", "") == u["id"]:
				o["status"].erase(k)
	u["status"].erase("guard")
	u["status"].erase("taunt")


# ------------------------------------------------------------------ hero commands

func command(id: String, cmd: String, target := "") -> void:
	if awaiting != id:
		return
	var u := unit(id)
	if target != "" and not unit(target).is_empty():
		focus = target
	var t := _target_enemy(u)
	match cmd:
		"attack":
			_hit(u, t, u.get("attack_power", 1.0), 10.0, "Attack")
		"charge":
			u["status"]["charging"] = {"left": 1.5}
			_log("charge", "Rex winds up a Charge.", {"unit": id})
		"taunt":
			u["status"]["taunt"] = {"until": id}
			_log("taunt", "Rex: \"Hey! Over here, ugly!\" Enemies are taunted.", {"unit": id})
		"champions_call":
			u["chakra"] = 0.0
			_log("special", "CHAMPION'S CALL!", {"unit": id})
			for e in alive("enemy"):
				_hit(u, e, 1.0, 10.0, "Champion's Call", false)
			for h in alive("hero"):
				h["status"]["champion"] = {"until": id}
		"fire_riff":
			for e in alive("enemy"):
				_hit(u, e, 0.7, 6.0, "Fire Riff", false)
		"meltdown":
			u["chakra"] = 0.0
			_log("special", "MELTDOWN SOLO!", {"unit": id})
			for e in alive("enemy"):
				_hit(u, e, 2.4, 20.0, "Meltdown Solo", false)
			u["status"]["burnt_out"] = {"left": 10.0}
		"lift":
			if has(t, "rearing"):
				t["status"].erase("rearing")
				for s in t["solos"]:
					s["value"] = 0.0
				_log("lift", "Eddar LIFTS %s off its feet! The howl dies in its throat." % t["name"], {"unit": id, "target": t["id"]})
				_add_break(t, 60.0)
			else:
				for s in t["solos"]:
					s["value"] = max(0.0, s["value"] - 0.25)
				_log("lift", "Eddar shoves %s back a step." % t["name"], {"unit": id, "target": t["id"]})
				_add_break(t, 8.0)
		"guard":
			u["status"]["guard"] = {"until": id}
			_log("guard", "%s guards." % u["name"], {"unit": id})
		"final_rest":
			u["chakra"] = 0.0
			_log("special", "FINAL REST.", {"unit": id})
			for e in alive("enemy"):
				_hit(u, e, 2.6, 25.0, "Final Rest", false)
			for e in alive("enemy"):
				e["status"]["hollowed"] = {"until": id}
				e["status"].erase("rearing")
	awaiting = ""
	_check_end()


func set_solo(id: String, index: int) -> void:
	## Change a hero's Solo action. The bar keeps its fill (Jesse: no reset).
	var u := unit(id)
	if not u.has("solo_options"):
		return
	u["solo_i"] = posmod(index, u["solo_options"].size())
	var opt: Dictionary = u["solo_options"][u["solo_i"]]
	var bar: Dictionary = u["solos"][0]
	bar["action"] = opt["action"]
	bar["label"] = opt["label"]
	bar["fill"] = opt["fill"]


# ------------------------------------------------------------------ Solo actions

func _solo(u: Dictionary, s: Dictionary) -> void:
	var t := _target_enemy(u) if u["side"] == "hero" else {}
	match s["action"]:
		"attack":
			_hit(u, t, 0.8, 8.0, "Solo: Attack")
		"charge":
			_hit(u, t, 2.0, 30.0, "Solo: free Charge")
		"defend":
			for h in alive("hero"):
				if h["id"] in ["rex", "eddar"]:
					h["status"]["guard"] = {"left": 3.0}
			_log("solo", "Solo: Rex plants his feet in front of Eddar.", {"unit": u["id"]})
		"riff":
			_hit(u, t, 0.6, 6.0, "Solo: Riff")
		"feedback":
			t["turn"] = max(0.0, t["turn"] - 0.3)
			for b in t["solos"]:
				b["value"] = max(0.0, b["value"] - 0.2)
			_log("solo", "Solo: Feedback! %s staggers." % t["name"], {"unit": u["id"], "target": t["id"]})
		"hype":
			var low = null
			for h in alive("hero"):
				if h["id"] != u["id"] and (low == null or h["chakra"] < low["chakra"]):
					low = h
			if low != null:
				add_chakra(low, 12.0)
				_log("solo", "Solo: Roxy hypes up %s." % low["name"], {"unit": u["id"]})
		"still":
			# drains the fullest enemy Solo bar; grows with the story
			var power := 0.1 + 0.08 * story_act
			var best = null
			var best_unit = null
			for e in alive("enemy"):
				for b in e["solos"]:
					if best == null or b["value"] > best["value"]:
						best = b
						best_unit = e
			if best != null:
				best["value"] = max(0.0, best["value"] - power)
				_log("solo", "Solo: Still. %s's %s falters." % [best_unit["name"], best["label"]], {"unit": u["id"], "target": best_unit["id"]})
		# enemy Solo actions
		"jab":
			_enemy_hit(u, 0.6, "Jab")
		"snap":
			_enemy_hit(u, 0.8, "Snap")
		"rear":
			if has(u, "hollowed"):
				_log("solo", "%s tries to rear up, but its voice is gone." % u["name"], {"unit": u["id"]})
			else:
				u["status"]["rearing"] = {"left": 4.0}
				_log("tell", "%s REARS UP! A howl is building. (Lift it!)" % u["name"], {"unit": u["id"]})


# ------------------------------------------------------------------ enemies

func _enemy_turn(u: Dictionary) -> void:
	if has(u, "rearing"):
		return
	var moves: Array = u["moves"]
	var m: Dictionary = moves[rng.randi_range(0, moves.size() - 1)]
	_enemy_hit(u, m["power"], m["label"])


func _enemy_hit(u: Dictionary, power: float, label: String) -> void:
	var t := _pick_hero(u)
	if t.is_empty():
		return
	# Rex protects Eddar automatically, even at 0, at a cost to his Solo bars
	var rex := unit("rex")
	if t["id"] == "eddar" and not rex.is_empty() and rex["hp"] > 0 and not is_broken(rex):
		for b in rex["solos"]:
			b["value"] = max(0.0, b["value"] - PROTECT_COST)
		_log("protect", "Rex throws himself in front of Eddar!", {"unit": "rex"})
		t = rex
	_feed_black_from_enemy(u)
	_hit(u, t, power, 0.0, label)


func _pick_hero(u: Dictionary) -> Dictionary:
	var heroes := alive("hero")
	if heroes.is_empty():
		return {}
	for h in heroes:
		if has(h, "taunt"):
			return h
	return heroes[rng.randi_range(0, heroes.size() - 1)]


func _howl(u: Dictionary) -> void:
	if u["hp"] <= 0:
		return
	_log("special", "%s HOWLS. The whole party reels, voices gone." % u["name"], {"unit": u["id"]})
	_feed_black_from_enemy(u)
	for h in alive("hero"):
		_hit(u, h, 1.3, 0.0, "Howl", false)
		h["status"]["mute"] = {"left": 6.0}


# ------------------------------------------------------------------ damage

func _target_enemy(u: Dictionary) -> Dictionary:
	var f := unit(focus)
	if not f.is_empty() and f["hp"] > 0 and f["side"] == "enemy":
		return f
	var foes := alive("enemy")
	return foes[0] if not foes.is_empty() else {}


func _hit(src: Dictionary, dst: Dictionary, power: float, brk: float, label: String, log_it := true) -> void:
	if dst.is_empty() or dst["hp"] <= 0 or src["hp"] <= 0:
		return
	var mult := 1.0
	var tags: Array = []
	if is_broken(dst):
		mult *= 1.5
		tags.append("BROKEN")
	if has(src, "champion"):
		mult *= 1.5
		tags.append("CHAMPION")
	if has(dst, "champion"):
		mult *= 0.5
	if has(src, "hollowed"):
		mult *= 0.5
	if has(dst, "guard"):
		mult *= 0.5
	if has(dst, "rearing"):
		mult *= 1.25
		brk *= 2.0
	var raw: float = src["atk"] * power * rng.randf_range(0.92, 1.08) - dst["def"] * 0.5
	var dmg := int(max(1.0, round(raw * mult)))
	dst["hp"] = max(0, dst["hp"] - dmg)
	var tag_s := (" [" + " x ".join(tags) + "]") if not tags.is_empty() else ""
	_log("hit", "%s: %s hits %s for %d%s" % [label, src["name"], dst["name"], dmg, tag_s],
		{"unit": src["id"], "target": dst["id"], "amount": dmg, "tags": tags})
	# chakra
	if src["side"] == "hero" and src.get("chakra_kind", "") == "gold":
		add_chakra(src, clamp(round(dmg * 0.3), 4.0, 30.0))
	if src["side"] == "hero" and src.get("chakra_kind", "") == "red":
		add_chakra(src, 3.0)
	if dst["side"] == "hero":
		for h in alive("hero"):
			if h.get("chakra_kind", "") == "red":
				var amt: float = max(4.0, dmg * 0.25)
				if dst["id"] == "rex":
					amt *= 1.5
				add_chakra(h, amt)
	if dst["side"] == "enemy" and brk > 0.0:
		_add_break(dst, brk)
	if dst["hp"] <= 0:
		_log("down", "%s goes down." % dst["name"], {"unit": dst["id"]})
	_check_end()


func _add_break(e: Dictionary, amount: float) -> void:
	if is_broken(e) or e["hp"] <= 0:
		return
	e["break"] += amount
	if e["break"] >= e["break_max"]:
		e["break"] = e["break_max"]
		e["status"]["broken"] = {"left": BROKEN_SECONDS}
		e["status"].erase("rearing")
		for s in e["solos"]:
			s["value"] = 0.0
		_log("broken", "%s is BROKEN! (+50%% damage, Solo bars frozen)" % e["name"], {"unit": e["id"]})


func add_chakra(u: Dictionary, amount: float) -> void:
	if u.get("chakra_kind", "") == "" or u["hp"] <= 0:
		return
	u["chakra"] = min(100.0, u["chakra"] + amount)
	if u["chakra_kind"] != "black":
		for h in alive("hero"):
			if h.get("chakra_kind", "") == "black" and h["id"] != u["id"]:
				h["chakra"] = min(100.0, h["chakra"] + amount * FRIEND_TO_BLACK)


func _feed_black_from_enemy(e: Dictionary) -> void:
	for h in alive("hero"):
		if h.get("chakra_kind", "") == "black":
			h["chakra"] = min(100.0, h["chakra"] + e.get("chakra_gain", 0.0) * ENEMY_TO_BLACK)


func _check_end() -> void:
	if over != "":
		return
	if alive("enemy").is_empty():
		over = "win"
		awaiting = ""
		_log("end", "Victory.")
	elif alive("hero").is_empty():
		over = "lose"
		awaiting = ""
		_log("end", "The party falls.")


func _log(kind: String, text: String, extra := {}) -> void:
	var e := {"t": time, "kind": kind, "text": text}
	e.merge(extra)
	events.append(e)
