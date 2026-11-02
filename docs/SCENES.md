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
| `@objective Text` | Update the TO DO line |
| `@bgm id` / `@sfx id` | Music cue / sound effect |
| `@cam focus <npc>` / `@cam shake` | Camera |
| `@emote <npc> <what>` | Character emote (e.g. `roxy fire`) |
| `@join id` / `@leave id` / `@give item n` / `@warp map spawn` | Party, items, map change |
| `@cmd exit_npc <npc>` | NPC walks off |

Conditions: `flag`, `!flag`, `var>=3` (`>= <= > < == !=`), combined with `&`.
Text can include `{var}` to print a variable.

Run `npm run lint:scenes` after editing.
