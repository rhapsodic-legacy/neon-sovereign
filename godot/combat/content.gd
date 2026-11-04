class_name CombatContent
extends RefCounted
## Sandbox units. Placeholder numbers; balance waits for Jesse.


static func party() -> Array:
	return [
		{
			"id": "rex", "name": "Rex", "side": "hero", "hp": 420, "atk": 30, "def": 12,
			"turn_time": 4.2, "chakra_kind": "gold", "attack_power": 1.0,
			"commands": [
				{"id": "attack", "label": "Attack"},
				{"id": "charge", "label": "Charge", "skill": true},
				{"id": "taunt", "label": "Taunt", "skill": true},
				{"id": "champions_call", "label": "Champion's Call", "special": true},
			],
			"solo_options": [
				{"action": "attack", "label": "Attack", "fill": 6.0},
				{"action": "charge", "label": "Charge", "fill": 9.0},
				{"action": "defend", "label": "Defend", "fill": 6.0},
			],
			"solos": [{"action": "attack", "label": "Attack", "fill": 6.0}],
		},
		{
			"id": "roxy", "name": "Roxy", "side": "hero", "hp": 300, "atk": 26, "def": 8,
			"turn_time": 3.6, "chakra_kind": "red", "attack_power": 0.9,
			"commands": [
				{"id": "attack", "label": "Attack"},
				{"id": "fire_riff", "label": "Fire Riff", "skill": true},
				{"id": "guard", "label": "Guard"},
				{"id": "meltdown", "label": "Meltdown Solo", "special": true},
			],
			"solo_options": [
				{"action": "riff", "label": "Riff", "fill": 5.0},
				{"action": "feedback", "label": "Feedback", "fill": 8.0},
				{"action": "hype", "label": "Hype", "fill": 7.0},
			],
			"solos": [{"action": "riff", "label": "Riff", "fill": 5.0}],
		},
		{
			"id": "eddar", "name": "Eddar", "side": "hero", "hp": 220, "atk": 14, "def": 6,
			"turn_time": 4.8, "chakra_kind": "black", "attack_power": 0.6,
			"commands": [
				{"id": "attack", "label": "Attack"},
				{"id": "lift", "label": "Lift", "skill": true},
				{"id": "guard", "label": "Guard"},
				{"id": "final_rest", "label": "Final Rest", "special": true},
			],
			"solo_options": [
				{"action": "still", "label": "Still", "fill": 9.0},
			],
			"solos": [{"action": "still", "label": "Still", "fill": 9.0}],
		},
	]


static func encounter(id: String) -> Array:
	match id:
		"dock_thugs":
			return [_thug("vinnie", "Vinnie"), _thug("brick", "Brick")]
		_:
			return [{
				"id": "beast", "name": "The Beast", "side": "enemy", "hp": 1500, "atk": 26, "def": 8,
				"turn_time": 5.0, "chakra_gain": 16.0, "break_max": 150.0,
				"moves": [{"label": "Claw", "power": 1.2}, {"label": "Lunge", "power": 1.6}],
				"solos": [
					{"action": "snap", "label": "Snap", "fill": 7.0},
					{"action": "rear", "label": "Rear up", "fill": 16.0},
				],
			}]


static func encounters() -> Array:
	return [["beast", "The Beast in the window (boss)"], ["dock_thugs", "Dock thugs (two)"]]


static func _thug(id: String, name: String) -> Dictionary:
	return {
		"id": id, "name": name, "side": "enemy", "hp": 300, "atk": 15, "def": 4,
		"turn_time": 4.5, "chakra_gain": 8.0, "break_max": 60.0,
		"moves": [{"label": "Haymaker", "power": 1.0}, {"label": "Shove", "power": 0.7}],
		"solos": [{"action": "jab", "label": "Jab", "fill": 5.0}],
	}
