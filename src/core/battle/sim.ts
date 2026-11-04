import { Rng } from '../rng';
import { Battle, BattleData } from './engine';
import { attackOnlyPolicy, ignoreTellsPolicy, randomPolicy, smartPolicy } from './policy';
import type { BattleDef } from './types';

export type SimPolicy = 'smart' | 'ignore_tells' | 'attack' | 'random';
export const SIM_POLICIES: SimPolicy[] = ['smart', 'ignore_tells', 'attack', 'random'];

/** Balance simulator (DESIGN §11.6): play a battle N times with one policy. */
export function simulate(def: BattleDef, data: BattleData, policy: SimPolicy, n: number) {
  let wins = 0;
  let turns = 0;
  let hpLeft = 0;
  for (let i = 0; i < n; i++) {
    const b = new Battle(def, data, 1000 + i);
    const r = new Rng(77 + i);
    let t = 0;
    while (!b.result && t++ < 400) {
      const c = policy === 'smart' ? smartPolicy(b) : policy === 'ignore_tells' ? ignoreTellsPolicy(b) : policy === 'attack' ? attackOnlyPolicy(b) : randomPolicy(b, () => r.next());
      b.act(c.skill, c.target);
    }
    if (b.result === 'win' || b.result === 'mercy') {
      wins++;
      hpLeft += b.def.party.reduce((s, id) => s + b.unit(id).hp / b.unit(id).maxHp, 0) / b.def.party.length;
    }
    turns += t;
  }
  return { winRate: wins / n, avgTurns: turns / n, avgHpLeft: wins ? hpLeft / wins : 0 };
}
