/**
 * Balance simulator (DESIGN §11.6): plays each battle N times per policy and prints win rates.
 * Usage: npm run sim
 */
import { BATTLE_DATA, BATTLES } from '../src/content/battles';
import { SIM_POLICIES, simulate } from '../src/core/battle/sim';

for (const def of Object.values(BATTLES)) {
  for (const p of SIM_POLICIES) {
    const r = simulate(def, BATTLE_DATA, p, 400);
    const band = def.bands?.[p];
    const ok = !band ? '' : r.winRate >= band[0] && r.winRate <= band[1] ? '  in band' : `  OUT OF BAND ${band.map((x) => `${x * 100}%`).join('-')}`;
    console.log(`${def.id.padEnd(10)} ${p.padEnd(12)} win ${(r.winRate * 100).toFixed(0).padStart(3)}%  turns ${r.avgTurns.toFixed(1)}  hp left ${(r.avgHpLeft * 100).toFixed(0)}%${ok}`);
  }
}
