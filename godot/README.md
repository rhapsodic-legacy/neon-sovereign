# Neon Sovereign: Godot 4 project

The game is moving to Godot 4 (desktop builds for Steam). This folder starts with the
grey-box animatic of the Pink Wyvern's first two minutes, built from the shot list doc.

Requires Godot 4.5.

```bash
# temp audio (placeholder song, crowd and effects), generated, not committed
python3 tools/temp_audio.py godot/wyvern/audio

# watch it in a window
godot --path godot

# render it to video (fixed 30 fps, offline, any machine)
godot --path godot --write-movie godot/out/wyvern.avi --fixed-fps 30

# one still frame at a given second, saved to godot/out/
godot --path godot -- --frame=34.5
```

`wyvern/animatic.gd` holds the whole thing as text: shot timings, speech bubbles,
Eddar's route, the lights and the mix. The TypeScript build in `src/` is untouched.

## Combat sandbox (THE SET v2)

Jesse's Solo bar design from the combat doc: turn-based commands, plus Solo bars that act
automatically and pause whenever a menu is open. Pick an encounter, a difficulty and how far into
the story Eddar is, then fight. Numbers are placeholders; balance comes later.

```bash
godot --path godot res://combat/sandbox.tscn
godot --headless --path godot --script res://tests/test_battle.gd   # core checks
```

- `combat/battle.gd`: the battle core (no nodes), used by the sandbox and the tests
- `combat/content.gd`: the party, the dock thugs and the Beast
- `combat/sandbox.gd`: the sandbox screen
