# Neon Sovereign: notes for Claude sessions

Read `docs/DESIGN.md` §0, §13 and §15 before doing anything. Story canon is `docs/STORY.md` and its beats come from Jesse's own outline: follow them faithfully. The shared copies in `/mnt/project-files/neon-sovereign/` are the same documents; keep them in sync when you change one.

## Hard rules
- Tone is PG-13: no gore, no crude sexual language, no slurs. Innuendo and sharp insults are fine.
- Eddar must stay likeable and competent from minute one, never pathetic.
- Never ship placeholder dialogue. Every scene starts with a `# PLOT:` / `# CHARACTER:` header.
- `src/core/` must stay free of DOM and Three.js. It runs headless in tests, the balance sim and the AI player.
- Every boss gets a title card, a lead-in scene, a mechanic, and a balance-sim band (DESIGN.md §6.5).

## Before pushing
`npm test && npm run typecheck && npm run lint:scenes && npm run build`

## Layout
- `src/core`: game state machine, scene DSL parser/runner, field collision, save/load, THE WIRE (AI API)
- `src/content`: maps (TS data) and scenes (`*.scene`, see docs/SCENES.md)
- `src/game`: Three.js renderer, procedural sets, placeholder characters, synth audio
- `src/ui`: HTML/CSS overlay (dialogue, Ledger notes, choices, menus, title)
- `tests`, `scripts`: Vitest suites, headless playthrough, scene linter
