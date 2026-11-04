# Scene script format (`*.scene`)

Scenes live in `src/content/scenes/`. A file can hold many scenes. Lines are trimmed; blank lines are ignored.

| Syntax | Meaning |
|---|---|
| `@scene prologue.the_letter` | Start a scene with this id |
| `# PLOT: … CHARACTER: …` | Header notes (required on story scenes) |
| `REX [smug]: Text` | Dialogue line; `[emotion]` is optional |
| `NARRATOR: Text` | Stage direction, shown centred in italics |
| `LEDGER: Entry #2,205: …` | Eddar's Unfairness Ledger note; also recorded in the Ledger menu |
| `@card TEXT` | Full-screen title card |
| `? Reply text -> label {harmony:+1, bond_rex:-1, set:flag, if:cond}` | A choice; consecutive `?` lines form one menu |
| `* label` | Jump target |
| `@goto label` / `@end` | Jump / end the scene |
| `@if cond` … `@else` … `@endif` | Conditional block |
| `@flag name` / `@unflag name` | Set or clear a flag |
| `@set var += 2` | Numeric variable (`=`, `+=`, `-=`) |
| `@objective Text` | Update the TO DO line (ignored when the content has objective rules; see below) |
| `@bgm id` / `@sfx id` | Music cue / sound effect |
| `@cam focus <npc>` / `@cam shake` | Camera |
| `@emote <npc> <what>` | Character emote (e.g. `roxy fire`) |
| `@join id` / `@leave id` / `@give item n` / `@warp map spawn` | Party, items, map change |
| `@cmd exit_npc <npc> [front\|back\|left\|right]` | NPC walks off that way (set the flag that hides them right after) |
| `@cmd enter_npc <npc> [front\|back\|window]` | NPC walks in from that entrance to their map position (set the flag that shows them first) |
| `@cmd move_npc <npc> <x> <z>` | NPC walks to a point; several in a row make a path, and the last one sticks (saved in state) |
| `@cmd move_player <x> <z>` | Eddar walks to a point during a cutscene (the core moves him at once; the renderer animates the walk) |
| `@fx violet eddar` | Eddar's power leaking: a violet flash and sparks nobody notices |
| `@fx gold_threads <npc>` / `@fx gold_threads off` | Leagues' music pouring into the band as gold threads, until turned off |
| `@fx eye_flash <npc\|band>` | A white flash in someone's eyes |
| `@fx vision on\|off` | The Canticle vision overlay (red ink, sepia) for cutscenes |
| `@fx shatter window` | The Wyvern's front window bursts inward |
| `@battle <id>` | Queue a battle from `src/content/battles.ts`; it starts when this scene ends, and its `after` scene plays when it's won (or ends in mercy) |
| `SPEAKER [vo]: Text` | Voice-over: the dialogue box turns gold and italic |

Conditions: `flag`, `!flag`, `var>=3` (`>= <= > < == !=`), combined with `&`.
Text can include `{var}` to print a variable.

## Repeat talks (never repeat a line verbatim)
The engine counts every finished scene in `seen.<scene id>` (times played *before* this one). Branch on it so
a second and third talk say something new, and react to what changed:

```
@if seen.prologue.gil>=1
GIL: Still thinking about that rider?
@end
@endif
GIL: Saw a woman ride in on a black light-cycle this afternoon.
```

For state-specific follow-ups (e.g. after the amp is fixed) keep your own counter with `@set talk.<name> += 1`.

## Objectives
`src/content/objectives.ts` holds ordered rules `{cond, text}`; the first that holds is the TO DO line, re-checked
after every scene. Chores can be done in any order and the line always names what's left. `{var}` works here too.

Run `npm run lint:scenes` after editing.

## Battles
Battles live in `src/content/battles.ts`: units, skills, a title card (`title`, `tagline`), barks keyed by engine
triggers (`start`, `turn:<unit>`, `read`, `tell:<unit>`, `interrupt`, `cover`, `charge_land`, `hurt:<unit>`, `break`,
`mute`, `heat_max`, `meltdown`, `lift_rear:<unit>`, `roxy_rex_hit`, `win`, `mercy`, `defeat`), each firing once with an
optional tutorial `hint`, and balance `bands` per sim policy that the tests enforce. Run `npm run sim` to see them.
