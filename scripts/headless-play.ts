/**
 * Plays the current build end to end with no browser, through THE WIRE, printing what an AI player sees.
 * Usage: npm run play:headless            (scripted policy)
 * This is the same interface an LLM agent uses (see docs/WIRE.md).
 */
import { loadContent } from '../src/content';
import { Game } from '../src/core/game';
import { act, describe } from '../src/core/wire';

const game = new Game(loadContent());
game.start();

// A tiny "policy": the order an attentive player would tackle the objectives in.
const goals = ['puddle_1', 'puddle_2', 'puddle_3', 'roxy', 'amp', 'back_door', 'dumpster'];
let turns = 0;
while (!game.state.flags['p.sable_seen'] || game.mode === 'scene') {
  if (++turns > 3000) throw new Error('policy got stuck');
  console.log('\n' + describe(game));
  if (game.mode === 'scene') {
    const v = game.view!;
    // Prefer the first option: it's usually the kindest, which suits Eddar.
    const r = v.kind === 'choice' ? act(game, { type: 'choose', index: 0 }) : act(game, { type: 'advance' });
    console.log(`> ${v.kind === 'choice' ? 'choose 0' : 'advance'} (${r.message})`);
    continue;
  }
  const target = goals.shift();
  if (!target) break;
  const r = act(game, { type: 'interact', target });
  console.log(`> interact ${target} (${r.message})`);
}
console.log(`\n=== Build 0.1 finished in ${turns} WIRE actions. Ledger entries: ${game.state.ledger.length}. Harmony: ${game.state.vars.harmony}. ===`);
