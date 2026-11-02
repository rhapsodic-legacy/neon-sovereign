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
| `move_to` | `target` or `x`,`z` | Walk with simple steering |
| `walk` | `dx`,`dz`,`seconds` | Raw movement |
| `wait` | `seconds` | Let time pass |

## Observation (field mode)
`mode`, `map`, `objective`, `player {x,z}`, `party`, `tokens`, `inventory`, `ledger_latest`, `interactables[] {id, kind, name, x, z, distance, in_range}`, `legal[]`.
In scene mode, `scene` is one of `{kind:'line', speaker, text}`, `{kind:'card', text}` or `{kind:'choice', options[]}`.

The battle API (turn order, enemy Tells, legal skills with previews) arrives with the battle system (milestone M2).
