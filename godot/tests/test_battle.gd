extends SceneTree
## Headless checks for the battle core.  godot --headless --path godot --script res://tests/test_battle.gd

var fails := 0


func _init() -> void:
	test_bars_pause_while_waiting()
	test_solo_change_keeps_fill()
	test_stacking_multiplies()
	test_protect_costs_rex()
	test_hollowed_stops_rear()
	test_whole_fights_end()
	print("FAILED: %d" % fails if fails > 0 else "ALL PASSED")
	quit(1 if fails > 0 else 0)


func check(cond: bool, what: String) -> void:
	if not cond:
		fails += 1
		print("  FAIL ", what)
	else:
		print("  ok   ", what)


func fresh(enc := "beast", diff := "guitar_solo") -> Battle:
	var b := Battle.new()
	b.setup(CombatContent.party(), CombatContent.encounter(enc), diff, 7)
	return b


func run_until_ready(b: Battle) -> void:
	var guard := 0
	while b.awaiting == "" and b.over == "" and guard < 100000:
		b.step(1.0 / 30.0)
		guard += 1


func test_bars_pause_while_waiting() -> void:
	print("Bars pause while a menu is open")
	var b := fresh()
	run_until_ready(b)
	var snap: Array = []
	for u in b.units:
		for s in u["solos"]:
			snap.append(s["value"])
	for i in 300:
		b.step(1.0 / 30.0)
	var same := true
	var i2 := 0
	for u in b.units:
		for s in u["solos"]:
			same = same and is_equal_approx(s["value"], snap[i2])
			i2 += 1
	check(same, "no Solo bar moved during 10 s of waiting")


func test_solo_change_keeps_fill() -> void:
	print("Changing a Solo action keeps the fill")
	var b := fresh()
	var rex := b.unit("rex")
	rex["solos"][0]["value"] = 0.6
	b.set_solo("rex", 1)
	check(is_equal_approx(rex["solos"][0]["value"], 0.6) and rex["solos"][0]["action"] == "charge", "Rex switched to Charge at 60%")


func test_stacking_multiplies() -> void:
	print("Champion x Broken multiplies")
	var b := fresh()
	var rex := b.unit("rex")
	var beast := b.unit("beast")
	beast["def"] = 0
	var base := _avg_hit(b, rex, beast)
	beast["status"]["broken"] = {"left": 99.0}
	rex["status"]["champion"] = {"until": "rex"}
	var both := _avg_hit(b, rex, beast)
	check(abs(both / base - 2.25) < 0.08, "ratio %.2f is about 2.25" % (both / base))


func _avg_hit(b: Battle, src: Dictionary, dst: Dictionary) -> float:
	var total := 0.0
	for i in 200:
		dst["hp"] = 100000
		b._hit(src, dst, 1.0, 0.0, "test")
		total += 100000 - dst["hp"]
	return total / 200.0


func test_protect_costs_rex() -> void:
	print("Rex protects Eddar, even at 0, and it costs his bar")
	var b := fresh()
	var rex := b.unit("rex")
	var eddar := b.unit("eddar")
	rex["solos"][0]["value"] = 0.5
	b.rng.seed = 3
	var hits_on_eddar := 0
	for i in 40:
		var hp: int = eddar["hp"]
		b._enemy_hit(b.unit("beast"), 0.1, "test")
		if eddar["hp"] < hp:
			hits_on_eddar += 1
	check(hits_on_eddar == 0, "Eddar was never hit while Rex stood")
	check(rex["solos"][0]["value"] < 0.5, "Rex's Solo bar dropped")


func test_hollowed_stops_rear() -> void:
	print("Hollowed stops the Beast's howl")
	var b := fresh()
	var beast := b.unit("beast")
	beast["status"]["hollowed"] = {"until": "eddar"}
	b._solo(beast, beast["solos"][1])
	check(not beast["status"].has("rearing"), "no rearing while Hollowed")


func test_whole_fights_end() -> void:
	print("Whole fights finish on every difficulty (simple autopilot)")
	for diff in Battle.DIFFICULTY.keys():
		for enc in ["beast", "dock_thugs"]:
			var wins := 0
			for seed in 20:
				var b := Battle.new()
				b.setup(CombatContent.party(), CombatContent.encounter(enc), diff, seed + 1)
				var steps := 0
				while b.over == "" and steps < 30 * 600:
					b.step(1.0 / 30.0)
					if b.awaiting != "":
						autopilot(b)
					steps += 1
				if b.over == "win":
					wins += 1
				check(b.over != "", "%s / %s / seed %d ended (%s at %.0fs)" % [diff, enc, seed + 1, b.over, b.time]) if b.over == "" else null
			print("    %-12s %-11s %2d/20 wins" % [diff, enc, wins])


func autopilot(b: Battle) -> void:
	var id := b.awaiting
	var u := b.unit(id)
	var foes := b.alive("enemy")
	var rearing = foes.filter(func(e): return e["status"].has("rearing"))
	var cmds := {}
	for c in b.commands_for(id):
		cmds[c[0]] = c[2]
	if cmds.get("champions_call", false) or cmds.get("meltdown", false) or cmds.get("final_rest", false):
		for k in ["champions_call", "meltdown", "final_rest"]:
			if cmds.get(k, false):
				b.command(id, k)
				return
	if id == "eddar" and not rearing.is_empty() and cmds.get("lift", false):
		b.command(id, "lift", rearing[0]["id"])
		return
	if id == "rex" and cmds.get("charge", false) and foes.any(func(e): return e["status"].has("broken")):
		b.command(id, "charge")
		return
	b.command(id, "attack")
