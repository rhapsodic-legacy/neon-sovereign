# THE WIRE: AI-player interface

Neon Sovereign can be played start to finish by an AI agent, like an LLM playing Pokémon Red.

## In the browser
Open the game, start a new game, then use the dev console:

```js
WIRE.describe()                                // plain-English situation + legal actions
WIRE.observe()                                 // the same as structured JSON
WIRE.act({ type: 'interact', target: 'roxy' }) // walks there automatically, then talks
WIRE.act({ type: 'advance' })                  // next line of dialogue
WIRE.act({ type: 'choose', index: 0 })         // pick a reply
WIRE.newGame()
```

## Headless (Node)
`npm run play:headless` plays the current build through the same API and prints every observation and action.

```ts
import { loadContent } from './src/content';
import { Game } from './src/core/game';
import { act, describe, observe } from './src/core/wire';
const g = new Game(loadContent()); g.start();
```

## Actions
| Action | Fields | Notes |
|---|---|---|
| `advance` | none | Continue past a line or card |
| `choose` | `index` | Pick from `observe().scene.options` |
| `interact` | `target?` | Interactable id from `observe().interactables`; auto-walks into range |
| `move_to` | `target` or `x`,`z` | Walk there along a grid path around furniture and people |
| `walk` | `dx`,`dz`,`seconds` | Raw movement |
| `wait` | `seconds` | Let time pass |
| `battle` | `skill`, `target?` | In a battle: the current party member uses a skill from `observe().battle.legal` |
| `auto_battle` | none | In a battle: let the built-in tactician (the same one as the in-game Auto) pick this turn |

## Observation (field mode)
`mode`, `map`, `objective`, `player {x,z}`, `party`, `tokens`, `inventory`, `ledger_latest`, `interactables[] {id, kind, name, x, z, distance, in_range}` (distance already allows for reach, e.g. Mama Dee talks across the bar), `legal[]`.
In scene mode, `scene` is one of `{kind:'line', speaker, text}`, `{kind:'card', text}` or `{kind:'choice', options[]}`.

## Observation (battle mode)
`battle {id, title, current, result, timeline[], units[], legal[]}`.
- `timeline`: the next six turns, soonest first (CTB, so fast actions come round sooner).
- `units[]`: `{id, name, side, alive, hp, max_hp, hp_pct, statuses[], heat, next_move, weakness}`. A foe's `hp`, `next_move` and `weakness` stay hidden until Eddar uses **Read** on it; `hp_pct` is always shown.
- `legal[]`: `{skill, name, desc, targets[], blocked?}`. A blocked skill says why (for example `Muted`, or `Needs 100 Heat (40)`).

What a careful player does: Read each foe; when a foe's `next_move` is a heavy set-up (a wind-up, or the Bellshell rearing to Toll), Lift it; Patch anyone under 40%; let Roxy's Heat reach 100 for Meltdown. A loss restarts the fight. Fights end with `battle over: win` (or `mercy`), and the after-scene starts at once.
