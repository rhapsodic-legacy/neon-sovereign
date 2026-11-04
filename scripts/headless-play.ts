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
// Deliberately out of order: pester the stranger, talk, fix the amp (twice: the first fix doesn't hold), then mop.
// Fights are played by the WIRE's built-in tactician (auto_battle); an LLM would send {type:'battle', skill, target}.
const goals = ['leagues', 'leagues', 'leagues', 'roxy', 'spike', 'amp', 'amp', 'spike', 'back_door', 'puddle_1', 'puddle_2', 'puddle_3', 'mama_dee', 'back_door'];
const tried = new Map<string, number>();
let turns = 0;
while (!game.state.flags['p.bellshell_done'] || game.mode !== 'field') {
  if (++turns > 3000) throw new Error('policy got stuck');
  console.log('\n' + describe(game));
  if (game.mode === 'battle') {
    const r = act(game, { type: 'auto_battle' });
    console.log(`> auto_battle (${r.message})`);
    continue;
  }
  if (game.mode === 'scene') {
    const v = game.view!;
    // Prefer the first option (usually the kindest, which suits Eddar); if we come back to the same choice, try the next.
    let idx = 0;
    if (v.kind === 'choice') {
      const key = v.options.map((o) => o.text).join('|');
      idx = (tried.get(key) ?? 0) % v.options.length;
      tried.set(key, idx + 1);
    }
    const r = v.kind === 'choice' ? act(game, { type: 'choose', index: idx }) : act(game, { type: 'advance' });
    console.log(`> ${v.kind === 'choice' ? `choose ${idx}` : 'advance'} (${r.message})`);
    continue;
  }
  const target = goals.shift();
  if (!target) break;
  const r = act(game, { type: 'interact', target });
  console.log(`> interact ${target} (${r.message})`);
}
console.log(`\n=== Build 0.3b (the opening, inception to Bellshell) finished in ${turns} WIRE actions. Ledger entries: ${game.state.ledger.length}. Harmony: ${game.state.vars.harmony}. ===`);
