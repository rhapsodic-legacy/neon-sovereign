import { describe, expect, it } from 'vitest';
import { SoloBattle } from '../src/core/solo/engine';
import type { Difficulty, SimOptions } from '../src/core/solo/engine';
import { POLICIES, SOLO_FIGHTS } from '../src/content/solo-fights';

function winRate(fightId: string, d: Difficulty, policy: string, presses = 2, n = 60): number {
  const f = SOLO_FIGHTS.find((x) => x.id === fightId)!;
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const opts: SimOptions = { difficulty: d, presses, resonance: f.resonance, hush: 0 };
    const b = new SoloBattle(f.fighters(), f.hooks(opts), opts, 900 + i, POLICIES[policy]);
    b.run();
    if (b.result === 'win') wins++;
  }
  return wins / n;
}

describe('Solo-bar sim (DESIGN §6.2c–g, §6.5d–e)', () => {
  it('alley tutorial: careful play survives even on Symphony', () => {
    for (const d of [1, 2, 3, 4] as Difficulty[]) expect(winRate('alley', d, 'smart')).toBeGreaterThanOrEqual(0.95);
  });
  it('Static Hound is easier inside the Pink Wyvern than out on the street', () => {
    expect(winRate('hound_wyvern', 2, 'smart', 0)).toBeGreaterThan(winRate('hound_street', 2, 'smart', 0));
  });
  it('musical monsters wipe regular-attack-only play', () => {
    expect(winRate('hound_wyvern', 2, 'attack')).toBe(0);
  });
  it('is deterministic for a seed', () => {
    const f = SOLO_FIGHTS[1];
    const opts: SimOptions = { difficulty: 2, presses: 1, resonance: true, hush: 0 };
    const run = () => {
      const b = new SoloBattle(f.fighters(), f.hooks(opts), opts, 42, POLICIES.smart);
      b.run();
      return `${b.result}:${b.time}`;
    };
    expect(run()).toBe(run());
  });
});
