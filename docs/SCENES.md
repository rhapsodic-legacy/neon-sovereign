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
| `@cmd exit_npc <npc>` | NPC walks off |
| `@fx violet eddar` | One-shot visual effect on a character (`violet`: Eddar's power leaking, a flash and sparks) |

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
