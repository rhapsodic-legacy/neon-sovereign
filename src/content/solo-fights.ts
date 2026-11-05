import { fighter, SoloBattle } from '../core/solo/engine';
import type { Fighter, FightHooks, PartyChoice, Policy, SimOptions } from '../core/solo/engine';

/**
 * Prologue fights in the Solo-bar model (DESIGN §6.5d alley tutorial, §6.5e Static Hound and Drain Rats).
 * Numbers are first guesses for the balance sim, not canon.
 */

// ---------- heroes ----------

export function heroes(ids: string[]): Fighter[] {
  const all: Record<string, () => Fighter> = {
    eddar: () => fighter({ id: 'eddar', name: 'Eddar', side: 'party', hp: 130, atk: 8, def: 4, spd: 11, chakra: 'black' }),
    rex: () => fighter({ id: 'rex', name: 'Rex', side: 'party', hp: 240, atk: 15, def: 9, spd: 9, chakra: 'gold', traits: ['big_brother'] }),
    roxy: () => fighter({ id: 'roxy', name: 'Roxy', side: 'party', hp: 160, atk: 13, def: 5, spd: 13, chakra: 'red' }),
  };
  return ids.map((id) => all[id]());
}

// ---------- policies ----------

function unleashChoice(b: SoloBattle, me: Fighter, combos: boolean): PartyChoice | null {
  if (me.energy < 100 || me.statuses.burnt_out) return null;
  const joiners = combos
    ? b.party().filter((p) => p.id !== me.id && (p.energy >= 100 || (p.id === 'rex' && p.hp > p.maxHp * 0.6 && p.energy >= 50))).map((p) => p.id)
    : [];
  return { action: 'unleash', joiners };
}

/** A careful player: unleashes (with combos), interrupts wind-ups, heals under 40%, reads, defends against a Static Bite aimed at them. */
export const smart: Policy = (b, me) => {
  const foes = b.enemies();
  const winding = foes.find((f) => f.meta.windup);
  if (me.id === 'eddar' && winding) return { action: 'null', target: winding.id };
  const u = unleashChoice(b, me, true);
  if (u) return u;
  if (me.id === 'eddar') {
    if (winding) return { action: 'null', target: winding.id };
    const hurt = b.party().filter((p) => p.hp < p.maxHp * 0.55).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
    if (hurt) return { action: 'patch', target: hurt.id };
    const unread = foes.find((f) => !f.analyzed);
    if (unread) return { action: 'read', target: unread.id };
    const split = foes.find((f) => f.meta.split && !(f.meta.revealedUntil > b.time));
    if (split) return { action: 'read', target: split.id };
  }
  const biter = foes.find((f) => f.analyzed && f.intent === 'static_bite' && f.intentTarget === me.id && me.id !== 'rex');
  if (biter) return { action: 'defend' };
  if (me.id === 'rex') {
    const eddar = b.get('eddar');
    if (me.hp < me.maxHp * 0.3 && eddar?.alive) return { action: 'defend' }; // hold on while Eddar patches him
    if (!me.statuses.charged) return { action: 'charge' };
  }
  return { action: 'attack' };
};

/** Sensible, but never reacts to a tell: no interrupts, no defending against a telegraphed bite. */
export const ignoreTells: Policy = (b, me) => {
  const u = unleashChoice(b, me, false);
  if (u) return u;
  if (me.id === 'eddar') {
    const hurt = b.party().filter((p) => p.hp < p.maxHp * 0.4)[0];
    if (hurt) return { action: 'patch', target: hurt.id };
  }
  if (me.id === 'rex' && !me.statuses.charged) return { action: 'charge' };
  return { action: 'attack' };
};

/** Regular attacks only: no abilities, no energy. */
export const attackOnly: Policy = () => ({ action: 'attack' });

/** A button-masher. */
export const random: Policy = (b, me) => {
  const opts: PartyChoice[] = [{ action: 'attack' }, { action: 'defend' }];
  if (me.id === 'eddar') opts.push({ action: 'read' }, { action: 'null', target: b.enemies()[0]?.id }, { action: 'patch', target: b.party()[Math.floor(b.rng.next() * b.party().length)].id });
  if (me.id === 'rex') opts.push({ action: 'charge' }, { action: 'showboat' });
  if (me.energy >= 100) opts.push({ action: 'unleash', joiners: [] });
  return opts[Math.floor(b.rng.next() * opts.length)];
};

export const POLICIES: Record<string, Policy> = { smart, ignore_tells: ignoreTells, attack: attackOnly, random };

// ---------- the alley: three dockworkers (DESIGN §6.5d) ----------

function thugs(): Fighter[] {
  return [
    fighter({ id: 'vinnie', name: 'Vinnie', side: 'enemy', hp: 300, atk: 12, def: 4, spd: 10, soloMul: 1.8, breakMax: 60, meta: { ai: 0 } }),
    fighter({ id: 'moss', name: 'Moss (the hook)', side: 'enemy', hp: 220, atk: 11, def: 3, spd: 12, soloMul: 1.8, breakMax: 40, meta: { ai: 1 } }),
    fighter({ id: 'brick', name: 'Brick (the wall)', side: 'enemy', hp: 400, atk: 12, def: 8, spd: 8, soloMul: 1.8, breakMax: 70, meta: { ai: 2 } }),
  ];
}

const THUG_AI: Record<string, string[]> = {
  vinnie: ['jab', 'wind_up', 'jab'],
  moss: ['hook_swipe', 'hook_swipe', 'jab'],
  brick: ['shove', 'shove', 'jab'],
};
const THUG_AI_ENHANCED: Record<string, string[]> = {
  vinnie: ['jab', 'wind_up'],
  moss: ['hook_rake', 'hook_swipe'],
  brick: ['body_check', 'shove'],
};
const THUG_MOVES: Record<string, { power: number; prefer?: 'eddar' }> = {
  jab: { power: 0.85 },
  haymaker: { power: 2.3 },
  shove: { power: 1.0, prefer: 'eddar' },
  hook_swipe: { power: 0.8 },
  hook_rake: { power: 1.2 },
  body_check: { power: 1.5 },
};

function randomHero(b: SoloBattle): string | undefined {
  const p = b.party();
  return p[Math.floor(b.rng.next() * p.length)]?.id;
}

function thugEnergy(b: SoloBattle, u: Fighter): void {
  b.addEnergy(u, 12);
  if (u.energy < 100) return;
  u.energy = 0;
  // The crew's energy attack: one free attack by Vinnie (or the hook, or the wall) at 1.5x.
  const order = ['vinnie', 'moss', 'brick'].map((id) => b.get(id)).filter((f): f is Fighter => !!f && f.alive);
  const hitter = order[0];
  if (hitter) b.enemyAttack(hitter, randomHero(b), { name: 'Crew rush', power: 0.85 * 1.5 }, false);
}

export function alleyHooks(): FightHooks {
  return {
    onTime(b) {
      if (!b.enhanced && b.round >= 4) b.enhanced = true; // Enhanced from the 4th round
    },
    enemyDamageMul(b) {
      return b.enhanced ? 1.25 : 1;
    },
    enemyTurn(b, u) {
      let move: string;
      if (u.meta.windup) {
        u.meta.windup = 0;
        move = 'haymaker';
      } else if (u.meta.interrupted) {
        u.meta.interrupted = 0;
        move = 'jab';
      } else {
        const ai = (b.enhanced ? THUG_AI_ENHANCED : THUG_AI)[u.id];
        move = ai[(u.aiStep + u.meta.ai) % ai.length];
        u.aiStep++;
        if (move === 'wind_up') {
          u.meta.windup = 1;
          return;
        }
      }
      const m = THUG_MOVES[move];
      b.enemyAttack(u, m.prefer === 'eddar' ? 'eddar' : randomHero(b), { name: move, power: m.power }, false);
      thugEnergy(b, u);
    },
    enemySolo(b, u) {
      b.enemyAttack(u, randomHero(b), { name: 'jab', power: 0.85 }, true);
      thugEnergy(b, u);
    },
    onInterrupted(_b, u) {
      u.meta.interrupted = 1;
    },
  };
}

export function alleyFighters(): Fighter[] {
  return [...heroes(['eddar', 'rex']), ...thugs()];
}

// ---------- the Static Hound (DESIGN §6.5e) ----------

export const HOUND_STATS = { hp: 900, atk: 22, def: 8, spd: 14, bite: 0.8 };

export function houndFighters(): Fighter[] {
  return [
    ...heroes(['eddar', 'rex', 'roxy']),
    fighter({ id: 'hound', name: 'Static Hound', side: 'enemy', hp: HOUND_STATS.hp, atk: HOUND_STATS.atk, def: HOUND_STATS.def, spd: HOUND_STATS.spd, soloMul: 0.6, breakMax: 120 }),
  ];
}

const HOUND_AI = ['static_bite', 'channel_flip', 'howl', 'static_bite', 'broadcast'];

export function houndHooks(opts: SimOptions): FightHooks {
  const fill = [0, 10, 15, 20, 25][opts.difficulty] - (opts.resonance ? 5 : 0);
  const fullBoost = 1 + (10 + 2 * opts.difficulty) / 100;
  const bite = (b: SoloBattle, u: Fighter, target: string | undefined, solo: boolean) => {
    const dmg = b.enemyAttack(u, target, { name: solo ? 'Auto bite' : 'Static Bite', power: HOUND_STATS.bite }, solo);
    if (solo) b.heal(u, Math.round(dmg * 0.25));
    else {
      const t = b.party().find((p) => p.statuses.taunt) ?? (target ? b.get(target) : undefined);
      if (t && t.alive && !t.statuses.guard) t.statuses.static = 1;
    }
  };
  const planNext = (b: SoloBattle, u: Fighter) => {
    u.intent = HOUND_AI[u.aiStep % HOUND_AI.length];
    u.intentTarget = randomHero(b);
  };
  return {
    mercy: { unit: 'hound', frac: 0.1 },
    enemyDamageMul(_b, u, solo) {
      return solo && u.energy >= 100 ? fullBoost : 1;
    },
    onEnemyHurt(_b, u) {
      if (!u.meta.split && u.hp < u.maxHp * 0.5) u.meta.split = 1; // Enhanced: Signal Split
    },
    partyHitLands(b, _a, t, aoe) {
      if (aoe || !t.meta.split || t.meta.revealedUntil > b.time) return true;
      return b.rng.next() >= 0.5;
    },
    onInterrupted(b, u) {
      u.meta.pressEddar = 0; // nothing lands, so nothing to reflect
      u.intent = 'static_bite'; // picks a regular ability instead of the howl
      u.intentTarget = randomHero(b);
      u.meta.interrupted = 1;
    },
    enemyTurn(b, u) {
      if (!u.intent) planNext(b, u);
      if (u.energy >= 100) {
        // Interference: halts musical boons, strips music buffs, 5% DoT for 5 turns on every hero.
        for (const p of b.party()) p.statuses.dot = 5;
        u.energy = 0;
        return;
      }
      if (u.meta.windup) {
        u.meta.windup = 0;
        b.enemyAoe(u, { name: 'White Noise Howl', power: 0, pctMax: 0.25, type: 'sound' });
        if (!u.statuses.hollowed) u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.25));
      } else {
        let move = u.intent!;
        u.aiStep++;
        if (u.meta.interrupted) {
          u.meta.interrupted = 0;
          move = 'static_bite';
        }
        if (move === 'broadcast' && opts.resonance) move = 'static_bite';
        if (move === 'static_bite') bite(b, u, u.intentTarget, false);
        else if (move === 'channel_flip') {
          for (const k of ['hollowed', 'dot']) delete u.statuses[k];
          u.meta.revealedUntil = 0;
        } else if (move === 'howl') {
          u.meta.windup = 1;
          b.announce(u); // the press window opens on the announcement

        } else if (move === 'broadcast') {
          b.announce(u);
          b.enemyAoe(u, { name: 'Broadcast', power: 1.6, type: 'sound' });
          for (const p of b.party()) if (!p.statuses.guard) p.statuses.static = 1;
        }
      }
      b.addEnergy(u, fill);
      planNext(b, u);
    },
    enemySolo(b, u) {
      bite(b, u, randomHero(b), true);
    },
  };
}

// ---------- Drain Rats (DESIGN §6.5e): the small first group outside the bar ----------

export function ratFighters(n = 3): Fighter[] {
  const rats = Array.from({ length: n }, (_, i) =>
    fighter({ id: `rat${i + 1}`, name: `Drain Rat ${i + 1}`, side: 'enemy', hp: 110, atk: 11, def: 3, spd: 15, soloMul: 0.8, breakMax: 30, meta: { ai: i } }),
  );
  return [...heroes(['eddar', 'rex', 'roxy']), ...rats];
}

const RAT_AI = ['pile_on', 'bristle', 'pile_on'];

export function ratHooks(): FightHooks {
  const weakestLooking = (b: SoloBattle) => b.party().slice().sort((a, c) => a.maxHp - c.maxHp)[0]?.id;
  const mostWounded = (b: SoloBattle) => b.party().slice().sort((a, c) => a.hp - c.hp)[0]?.id;
  const ratEnergy = (b: SoloBattle, u: Fighter, dmg: number) => {
    b.addEnergy(u, dmg * 0.5);
    if (u.energy >= 100 && u.alive) {
      u.energy = 0;
      pileOn(b, u, mostWounded(b));
    }
  };
  const pileOn = (b: SoloBattle, u: Fighter, target: string | undefined) => {
    const others = b.enemies().length - 1;
    return b.enemyAttack(u, target, { name: 'Pile On', power: 0.6 + 0.3 * others }, false);
  };
  return {
    enemyTurn(b, u) {
      const move = RAT_AI[(u.aiStep + u.meta.ai) % RAT_AI.length];
      u.aiStep++;
      if (move === 'pile_on') ratEnergy(b, u, pileOn(b, u, weakestLooking(b)));
      else {
        u.statuses.bristle = 1;
        ratEnergy(b, u, b.enemyAttack(u, randomHero(b), { name: 'Quills', power: 0.6 }, false));
      }
    },
    enemySolo(b, u) {
      ratEnergy(b, u, b.enemyAttack(u, randomHero(b), { name: 'Nip', power: 0.6 }, true));
    },
    onEnemyKo(b) {
      for (const r of b.enemies()) {
        r.nextTurn -= 20; // Scatter
        r.nextSolo -= 20;
      }
    },
  };
}

// ---------- registry ----------

export interface SoloFight {
  id: string;
  label: string;
  fighters: () => Fighter[];
  hooks: (o: SimOptions) => FightHooks;
  resonance?: boolean;
  presses: boolean;
}

export const SOLO_FIGHTS: SoloFight[] = [
  { id: 'alley', label: 'Alley: three dockworkers', fighters: alleyFighters, hooks: () => alleyHooks(), presses: false },
  { id: 'hound_wyvern', label: 'Static Hound, inside the Pink Wyvern (resonance)', fighters: houndFighters, hooks: houndHooks, resonance: true, presses: true },
  { id: 'hound_street', label: 'Static Hound, out on the street (no resonance)', fighters: houndFighters, hooks: houndHooks, resonance: false, presses: true },
  { id: 'rats', label: 'Drain Rats: three, outside the bar', fighters: () => ratFighters(3), hooks: () => ratHooks(), presses: false },
  { id: 'rats_swarm', label: 'Drain Rats: a later swarm of six', fighters: () => ratFighters(6), hooks: () => ratHooks(), presses: false },
];
