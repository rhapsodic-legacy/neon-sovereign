/**
 * Solo-bar balance sim (DESIGN §6.2c–g, §6.5d–e): plays each prologue fight N times per difficulty, policy and
 * music-press count, and prints win rate, HP left, length and knockouts.
 * Usage: npm run sim:solo [-- --n 300 --tweak name]
 */
import { DIFFICULTY_NAMES, SoloBattle } from '../src/core/solo/engine';
import type { Difficulty, HeroTweaks, SimOptions } from '../src/core/solo/engine';
import { POLICIES, SOLO_FIGHTS } from '../src/content/solo-fights';

const args = process.argv.slice(2);
const argOf = (k: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const N = Number(argOf('n') ?? 300);
const only = argOf('fight');

export const TWEAKS: Record<string, HeroTweaks> = {
  base: {},
  patch35_all: { patchHeal: 0.35 },
  eddar_destiny_upgrade: { blackEnemyUpgrade: true },
  no_big_brother: { noBigBrother: true },
  rex_hp_80: { rexHpMul: 0.8 },
  charge_x3: { chargeMul: 3 },
  slow_solo: { soloMul: 1.8 },
};
const tweakName = argOf('tweak') ?? 'base';
const tweaks = TWEAKS[tweakName];

export function run(fightId: string, difficulty: Difficulty, policy: string, presses: number, tw: HeroTweaks, n: number) {
  const fight = SOLO_FIGHTS.find((f) => f.id === fightId)!;
  let wins = 0, hpLeft = 0, len = 0, kos = 0, combos = 0, interrupts = 0;
  for (let i = 0; i < n; i++) {
    const opts: SimOptions = { difficulty, presses: fight.presses ? presses : 0, tweaks: tw, resonance: fight.resonance, hush: 0 };
    const b = new SoloBattle(fight.fighters(), fight.hooks(opts), opts, 5000 + i, POLICIES[policy]);
    b.run();
    if (b.result === 'win') {
      wins++;
      const p = b.fighters.filter((f) => f.side === 'party');
      hpLeft += p.reduce((s, f) => s + (f.alive ? f.hp / f.maxHp : 0), 0) / p.length;
    }
    len += b.round;
    kos += b.koCount;
    combos += b.combos;
    interrupts += b.interrupts;
  }
  return { win: wins / n, hpLeft: wins ? hpLeft / wins : 0, rounds: len / n, kos: kos / n, combos: combos / n, interrupts: interrupts / n };
}

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
if (args.includes('--compare')) {
  console.log(`Hero tweak comparison, N=${N} per cell, presses 2. Cells: win% / HP left`);
  const fights = SOLO_FIGHTS.map((f) => f.id);
  console.log('tweak'.padEnd(16) + fights.flatMap((f) => [`${f} GS`, `${f} SYM`]).map((h) => h.padEnd(20)).join(''));
  for (const [name, tw] of Object.entries(TWEAKS)) {
    for (const p of ['smart', 'ignore_tells']) {
      const cells: string[] = [];
      for (const f of fights) for (const d of [2, 4] as Difficulty[]) {
        const r = run(f, d, p, 2, tw, N);
        cells.push(`${pct(r.win)} / ${pct(r.hpLeft)}`.padEnd(20));
      }
      console.log(`${name} ${p === 'smart' ? '(smart)' : '(no tells)'}`.padEnd(16).slice(0, 26) + cells.join(''));
    }
  }
  process.exit(0);
}
{
  console.log(`Solo-bar sim, N=${N} per row, hero tweak: ${tweakName}`);
  for (const f of SOLO_FIGHTS) {
    if (only && f.id !== only) continue;
    console.log(`\n## ${f.label}`);
    console.log('difficulty    policy        presses  win  hp-left  rounds  KOs  combos  interrupts');
    for (const d of [1, 2, 3, 4] as Difficulty[]) {
      for (const p of Object.keys(POLICIES)) {
        const pressList = f.presses && p === 'smart' ? [0, 1, 2, 3] : [f.presses ? 2 : 0];
        for (const k of pressList) {
          const r = run(f.id, d, p, k, tweaks, N);
          console.log(
            `${DIFFICULTY_NAMES[d].padEnd(13)} ${p.padEnd(13)} ${String(f.presses ? k : '-').padStart(7)} ${pct(r.win)}  ${pct(r.hpLeft).padStart(7)}  ${r.rounds.toFixed(1).padStart(6)}  ${r.kos.toFixed(2)}  ${r.combos.toFixed(2).padStart(6)}  ${r.interrupts.toFixed(2).padStart(10)}`,
          );
        }
      }
    }
  }
}
