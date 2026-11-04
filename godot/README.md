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
