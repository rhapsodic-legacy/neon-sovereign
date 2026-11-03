import { describe, expect, it } from 'vitest';
import { BATTLE_DATA, BATTLES } from '../src/content/battles';
import { Battle } from '../src/core/battle/engine';
import { SIM_POLICIES, simulate } from '../src/core/battle/sim';
import type { BattleEvent } from '../src/core/battle/types';

const N = 200;

/** Advance a battle with plain attacks until `pred` holds for the current state. */
function until(b: Battle, pred: () => boolean, guard = 60) {
  while (!pred() && !b.result && guard-- > 0) {
    const l = b.legal().find((x) => !x.blocked && ['lid_bash', 'strike', 'axe_riff'].includes(x.skill)) ?? b.legal().find((x) => !x.blocked)!;
    b.act(l.skill, l.targets[0]);
  }
}

describe('THE SET: balance bands (DESIGN §6.5)', () => {
  for (const def of Object.values(BATTLES)) {
    for (const p of SIM_POLICIES) {
      const band = def.bands?.[p];
      if (!band) continue;
      it(`${def.id} vs ${p} wins ${band[0] * 100}-${band[1] * 100}%`, () => {
        const r = simulate(def, BATTLE_DATA, p, N);
        expect(r.winRate).toBeGreaterThanOrEqual(band[0]);
        expect(r.winRate).toBeLessThanOrEqual(band[1]);
      });
    }
  }
  it('every battle has a title card, barks and a band', () => {
    for (const def of Object.values(BATTLES)) {
      expect(def.title && def.tagline, def.id).toBeTruthy();
      expect(Object.keys(def.barks).length, def.id).toBeGreaterThan(3);
      expect(def.bands && Object.keys(def.bands).length, def.id).toBeTruthy();
    }
  });
});

describe('THE SET: mechanics', () => {
  it('is deterministic for a seed', () => {
    const run = () => {
      const b = new Battle(BATTLES.dock_crew, BATTLE_DATA, 42);
      until(b, () => false, 200);
      return [b.result, b.units.map((u) => u.hp).join(',')];
    };
    expect(run()).toEqual(run());
  });

  it('Read reveals the next move; Lift interrupts a wind-up', () => {
    const b = new Battle(BATTLES.dock_crew, BATTLE_DATA, 3);
    const vinnie = b.unit('vinnie');
    until(b, () => b.current === 'eddar');
    b.act('read', 'vinnie');
    expect(vinnie.analyzed).toBe(true);
    // wait for the tell
    until(b, () => b.current === 'eddar' && vinnie.intent?.skill === 'haymaker');
    expect(vinnie.intent?.skill).toBe('haymaker');
    b.drain();
    b.act('lift', 'vinnie');
    const ev = b.drain();
    expect(ev.some((e) => e.type === 'interrupt' && e.target === 'vinnie')).toBe(true);
    expect(vinnie.intent?.skill).not.toBe('haymaker');
  });

  it('Big Brother: Rex steps in front of hits aimed at Eddar', () => {
    const b = new Battle(BATTLES.dock_crew, BATTLE_DATA, 5);
    const all: BattleEvent[] = [];
    for (let i = 0; i < 12 && !b.result; i++) {
      b.act('defend');
      all.push(...b.drain());
    }
    const covers = all.filter((e) => e.type === 'cover');
    expect(covers.length).toBeGreaterThan(0);
    // Brick's Shove prefers Eddar, and every one of them lands on Rex instead
    const eddarHits = all.filter((e) => e.type === 'damage' && e.target === 'eddar');
    const tolls = all.filter((e) => e.type === 'action' && e.targets.length > 1);
    expect(eddarHits.length).toBe(tolls.length);
  });

  it('Lift flips a rearing Bellshell and Breaks it; Mute blocks Lift and Patch', () => {
    const b = new Battle(BATTLES.bellshell, BATTLE_DATA, 9);
    const shell = b.unit('bellshell');
    until(b, () => b.current === 'eddar' && !!shell.statuses.rearing, 80);
    expect(shell.statuses.rearing).toBeTruthy();
    b.act('lift', 'bellshell');
    expect(shell.broken).toBeGreaterThan(0);
    expect(shell.statuses.rearing).toBeFalsy();

    // let it toll: everyone is muted, and Eddar's resonance skills are blocked
    const b2 = new Battle(BATTLES.bellshell, BATTLE_DATA, 9);
    until(b2, () => !!b2.unit('eddar').statuses.mute, 80);
    if (b2.current === 'eddar') {
      const legal = b2.legal();
      expect(legal.find((l) => l.skill === 'lift')?.blocked).toBe('Muted');
      expect(legal.find((l) => l.skill === 'patch')?.blocked).toBe('Muted');
    } else expect(b2.unit('eddar').statuses.mute).toBeGreaterThan(0);
  });

  it('Roxy builds Heat when Rex is hit, and Meltdown needs 100', () => {
    const b = new Battle(BATTLES.bellshell, BATTLE_DATA, 11);
    const roxy = b.unit('roxy');
    until(b, () => b.current === 'roxy');
    expect(b.legal().find((l) => l.skill === 'meltdown')?.blocked).toMatch(/Needs 100 Heat/);
    until(b, () => roxy.heat >= 100 && b.current === 'roxy', 120);
    if (!b.result) {
      expect(b.legal().find((l) => l.skill === 'meltdown')?.blocked).toBeUndefined();
      b.act('meltdown');
      expect(roxy.heat).toBe(0);
    }
  });

  it('the Bellshell ends in mercy, never a kill', () => {
    for (let seed = 0; seed < 20; seed++) {
      const b = new Battle(BATTLES.bellshell, BATTLE_DATA, seed);
      until(b, () => false, 400);
      if (b.result === 'defeat') continue;
      expect(b.result).toBe('mercy');
      expect(b.unit('bellshell').hp).toBeGreaterThan(0);
    }
  });

  it('each tutorial bark fires at most once', () => {
    const b = new Battle(BATTLES.dock_crew, BATTLE_DATA, 1);
    const all: BattleEvent[] = [...b.drain()];
    until(b, () => false, 200);
    all.push(...b.drain());
    const barks = all.filter((e): e is Extract<BattleEvent, { type: 'bark' }> => e.type === 'bark').map((e) => e.text);
    expect(new Set(barks).size).toBe(barks.length);
    expect(barks[0]).toMatch(/Every blow has its hour/);
  });
});
