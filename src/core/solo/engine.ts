import { Rng } from '../rng';

/**
 * THE SET, Solo-bar model (DESIGN §6.2c–g, §6.5d–e). A headless sim core for Jesse's 2026-11-05 combat rules:
 * turn-based choices on a speed timeline, plus a Solo bar per fighter that fires a free auto-action whenever it fills;
 * chakra energy for everyone, combo Unleash, Enhanced second halves, per-hero music presses, interrupts that don't
 * cost a turn. No DOM, no Three.js. Fight-specific behaviour lives in content as hooks.
 */

export type Difficulty = 1 | 2 | 3 | 4; // Unplugged, Guitar Solo, Headliner, Symphony
export const DIFFICULTY_NAMES = ['', 'Unplugged', 'Guitar Solo', 'Headliner', 'Symphony'];
export type Side = 'party' | 'enemy';
export type DmgType = 'phys' | 'fire' | 'sound' | 'silence';

export interface Fighter {
  id: string;
  name: string;
  side: Side;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  /** Solo bar period as a multiple of the turn period (lower = faster timer). */
  soloMul: number;
  alive: boolean;
  nextTurn: number;
  nextSolo: number;
  energy: number;
  chakra?: 'red' | 'gold' | 'black' | 'yellow';
  statuses: Record<string, number>;
  breakVal: number;
  breakMax: number;
  broken: boolean;
  analyzed: boolean;
  /** Enemy: what it will do on its next turn-based action. */
  intent?: string;
  intentTarget?: string;
  aiStep: number;
  traits: string[];
  /** Hound-style energy that the content manages. */
  meta: Record<string, number>;
}

export interface Attack {
  name: string;
  power: number;
  type?: DmgType;
  /** Damage as a fraction of the target's max HP instead of atk-based. */
  pctMax?: number;
  breakPower?: number;
  melee?: boolean;
}

export interface PartyChoice {
  action: 'attack' | 'read' | 'null' | 'patch' | 'defend' | 'charge' | 'showboat' | 'unleash';
  target?: string;
  /** For unleash: heroes joining the combo (ids), and whether Rex pays HP to fill. */
  joiners?: string[];
}

export interface FightHooks {
  /** Enemy turn-based action. */
  enemyTurn(b: SoloBattle, u: Fighter): void;
  /** Enemy auto-action. */
  enemySolo(b: SoloBattle, u: Fighter): void;
  /** Extra per-hit modifiers (Enhanced, gauge-full boosts) for enemy attackers. */
  enemyDamageMul?(b: SoloBattle, u: Fighter, solo: boolean): number;
  /** Called after any damage lands on an enemy (Enhanced triggers etc). */
  onEnemyHurt?(b: SoloBattle, u: Fighter): void;
  /** Called when a party attack targets an enemy: return false to make it miss (Signal Split). */
  partyHitLands?(b: SoloBattle, attacker: Fighter, target: Fighter, aoe: boolean): boolean;
  /** Called after an interrupt cancels a wind-up: the enemy picks a regular ability instead. */
  onInterrupted?(b: SoloBattle, u: Fighter): void;
  /** Time-based hooks (Enhanced at round N). */
  onTime?(b: SoloBattle): void;
  onEnemyKo?(b: SoloBattle, u: Fighter): void;
  /** Mercy: battle ends as a win when this enemy reaches this HP fraction. */
  mercy?: { unit: string; frac: number };
}

export interface HeroTweaks {
  patchHeal?: number; // default 0.35
  blackFeedMul?: number; // multiplies Eddar's black-chakra intake
  noBigBrother?: boolean;
  rexHpMul?: number;
  chargeMul?: number; // default 2
  soloMul?: number; // hero Solo period multiple, default 1.4
}

export interface SimOptions {
  difficulty: Difficulty;
  presses: number; // music presses used per window (0..3)
  tweaks?: HeroTweaks;
  resonance?: boolean;
  hush?: number; // 0..1, the Hush's spread
}

export type Policy = (b: SoloBattle, me: Fighter) => PartyChoice;

const BASE = 100;

export class SoloBattle {
  time = 0;
  result: 'win' | 'defeat' | null = null;
  readonly rng: Rng;
  readonly log: string[] = [];
  enhanced = false;
  presses = 0;
  /** Whether a music-press window is open for the attack being resolved. */
  private pressBuff: Record<string, number> = {};
  koCount = 0;
  pressesUsed = 0;
  interrupts = 0;
  combos = 0;

  constructor(
    readonly fighters: Fighter[],
    readonly hooks: FightHooks,
    readonly opts: SimOptions,
    seed: number,
    readonly policy: Policy,
    readonly autoChoice: (b: SoloBattle, me: Fighter) => 'attack' | 'defend' = () => 'attack',
  ) {
    this.rng = new Rng(seed);
    const t = opts.tweaks ?? {};
    fighters.forEach((f, i) => {
      if (f.id === 'rex' && t.rexHpMul) f.hp = f.maxHp = Math.round(f.maxHp * t.rexHpMul);
      if (f.side === 'party' && t.soloMul) f.soloMul = t.soloMul;
      f.nextTurn = this.turnPeriod(f) * (0.6 + 0.03 * i);
      f.nextSolo = this.soloPeriod(f) * (0.8 + 0.05 * i);
    });
    this.presses = opts.presses;
  }

  get d(): Difficulty {
    return this.opts.difficulty;
  }
  party(): Fighter[] {
    return this.fighters.filter((f) => f.side === 'party' && f.alive);
  }
  enemies(): Fighter[] {
    return this.fighters.filter((f) => f.side === 'enemy' && f.alive);
  }
  get(id: string): Fighter | undefined {
    return this.fighters.find((f) => f.id === id);
  }
  get round(): number {
    return Math.floor(this.time / BASE) + 1;
  }

  turnPeriod(f: Fighter): number {
    return (BASE * 10) / f.spd;
  }
  soloPeriod(f: Fighter): number {
    // Difficulty (combat doc): Headliner +5% friends / +10% enemies; Symphony +10% / +20%.
    const bonus = this.d === 3 ? (f.side === 'party' ? 0.05 : 0.1) : this.d === 4 ? (f.side === 'party' ? 0.1 : 0.2) : 0;
    const hushFast = f.side === 'enemy' ? 1 + (this.opts.hush ?? 0) * 0.1 * this.d : 1;
    return (this.turnPeriod(f) * f.soloMul) / (1 + bonus) / hushFast;
  }

  run(maxTime = 6000): void {
    while (!this.result && this.time < maxTime) this.step();
    if (!this.result) this.result = 'defeat';
  }

  private step(): void {
    let best: { f: Fighter; solo: boolean; t: number } | null = null;
    for (const f of this.fighters) {
      if (!f.alive) continue;
      if (!best || f.nextTurn < best.t) best = { f, solo: false, t: f.nextTurn };
      if (f.nextSolo < best.t) best = { f, solo: true, t: f.nextSolo };
    }
    if (!best) return;
    this.time = best.t;
    this.hooks.onTime?.(this);
    const f = best.f;
    if (best.solo) {
      f.nextSolo += this.soloPeriod(f);
      if (f.statuses.burnt_out) return;
      if (f.statuses.static) {
        delete f.statuses.static; // Static: the next auto-action fizzles
        return;
      }
      if (f.side === 'party') this.heroSolo(f);
      else this.hooks.enemySolo(this, f);
    } else {
      this.tickStatuses(f);
      if (!f.alive || this.result) return;
      if (f.broken) {
        f.broken = false;
        f.breakVal = 0;
      }
      if (f.side === 'party') {
        const c = this.policy(this, f);
        this.doParty(f, c);
        f.nextTurn += this.turnPeriod(f) * (c.action === 'read' ? 0.6 : c.action === 'defend' || c.action === 'showboat' ? 0.7 : c.action === 'charge' ? 0.55 : 1);
      } else {
        this.hooks.enemyTurn(this, f);
        f.nextTurn += this.turnPeriod(f);
      }
    }
    this.checkEnd();
  }

  // ---------- party ----------

  private heroSolo(f: Fighter): void {
    const choice = this.autoChoice(this, f);
    if (choice === 'defend') {
      f.statuses.guard = Math.max(f.statuses.guard ?? 0, 1);
      return;
    }
    const t = this.lowestFoe();
    if (t) this.partyAttack(f, t, { name: 'Auto', power: f.id === 'rex' ? 1.0 : 0.85, breakPower: 8, melee: true }, false);
  }

  lowestFoe(): Fighter | undefined {
    const foes = this.enemies();
    return foes.find((x) => x.broken) ?? foes.slice().sort((a, b) => a.hp - b.hp)[0];
  }

  private doParty(me: Fighter, c: PartyChoice): void {
    const tw = this.opts.tweaks ?? {};
    const tgt = c.target ? this.get(c.target) : this.lowestFoe();
    switch (c.action) {
      case 'attack':
        if (tgt) this.partyAttack(me, tgt, { name: 'Attack', power: me.id === 'rex' ? 1.25 : me.id === 'roxy' ? 0.95 : 0.9, breakPower: 15, melee: true }, false);
        if (me.id === 'roxy') this.addEnergy(me, 10);
        break;
      case 'read':
        if (tgt) {
          tgt.analyzed = true;
          tgt.meta.revealedUntil = this.time + this.turnPeriod(tgt);
        }
        break;
      case 'null': {
        if (!tgt) break;
        if (tgt.meta.windup) {
          this.interrupts++;
          tgt.meta.windup = 0;
          tgt.breakVal += 50;
          if (tgt.breakVal >= tgt.breakMax) this.breakUnit(tgt);
          else this.hooks.onInterrupted?.(this, tgt); // DESIGN §6.2g: it just picks a regular ability instead
          this.partyAttack(me, tgt, { name: 'Null', power: 0.7, breakPower: 0 }, false);
        } else {
          tgt.nextTurn += 15;
          this.partyAttack(me, tgt, { name: 'Null', power: 0.6, breakPower: 25 }, false);
        }
        break;
      }
      case 'patch': {
        const ally = c.target ? this.get(c.target) : undefined;
        if (ally && ally.alive) this.heal(ally, Math.round(ally.maxHp * (tw.patchHeal ?? 0.35)));
        break;
      }
      case 'defend':
        me.statuses.guard = 1;
        break;
      case 'charge':
        me.statuses.charged = 2; // lasts through his next turn: his attacks (turn and auto) deal double
        break;
      case 'showboat':
        me.statuses.taunt = 2;
        me.statuses.guard = 1; // Taunt also grants Guard (DESIGN §6.5b)
        break;
      case 'unleash':
        this.unleash(me, c.joiners ?? []);
        break;
    }
  }

  /** DESIGN §6.2e combo Unleash. */
  private unleash(me: Fighter, joiners: string[]): void {
    const crew = [me, ...joiners.map((j) => this.get(j)!).filter((j) => j && j.alive && j.id !== me.id)];
    for (const h of crew) {
      if (h.energy < 100 && h.id === 'rex') {
        const missing = 100 - h.energy;
        h.hp = Math.max(1, h.hp - Math.round((missing / 100) * 0.3 * h.maxHp)); // blood gives life
        h.energy = 100;
      }
    }
    const team = crew.filter((h) => h.energy >= 100);
    const combo = team.length >= 2;
    if (combo) this.combos++;
    const chakras = new Set(team.map((h) => h.chakra));
    const buffTurns = combo && chakras.has('gold') ? 2 : 1;
    const debuffTurns = combo && chakras.has('black') ? 2 : 1;
    for (const h of team) {
      h.energy = 0;
      if (h.id === 'eddar') {
        for (const e of this.enemies()) {
          this.partyAttack(h, e, { name: 'Final Rest', power: 2.0, breakPower: 30 }, true);
          if (e.alive) e.statuses.hollowed = debuffTurns + 1;
        }
      } else if (h.id === 'rex') {
        for (const e of this.enemies()) this.partyAttack(h, e, { name: "Champion's Call", power: 1.0, breakPower: 20 }, true);
        for (const p of this.party()) p.statuses.champion = buffTurns + 1;
      } else if (h.id === 'roxy') {
        for (const e of this.enemies()) this.partyAttack(h, e, { name: 'Meltdown Solo', power: 2.4, type: 'fire', breakPower: 40 }, true);
        h.statuses.burnt_out = 2;
      }
    }
    if (combo && chakras.has('red')) {
      const roxy = team.find((h) => h.chakra === 'red')!;
      for (const e of this.enemies()) this.partyAttack(roxy, e, { name: 'Combo Fire', power: 1.0, type: 'fire' }, true);
    }
  }

  partyAttack(me: Fighter, t: Fighter, a: Attack, aoe: boolean): void {
    if (!t.alive) return;
    if (this.hooks.partyHitLands && !this.hooks.partyHitLands(this, me, t, aoe)) return;
    let mul = 1;
    if (me.statuses.charged && me.id === 'rex') mul *= this.opts.tweaks?.chargeMul ?? 2;
    if (me.statuses.champion) mul *= 1.5;
    if (t.broken) mul *= 1.5;
    const dmg = this.dealDamage(me, t, a, mul);
    if (me.chakra === 'gold') this.addEnergy(me, Math.min(30, Math.max(4, Math.round(dmg * 0.3))));
    if (a.melee && t.statuses.bristle) this.rawDamage(me, Math.round(t.atk * 0.8));
    if (a.breakPower && !t.broken) {
      t.breakVal += a.breakPower;
      if (t.breakVal >= t.breakMax) this.breakUnit(t);
    }
    if (t.alive) this.hooks.onEnemyHurt?.(this, t);
  }

  // ---------- enemies (called by content hooks) ----------

  /** An enemy attack on one hero (Big Brother, taunt, guard, resist, presses applied). Returns damage dealt. */
  enemyAttack(u: Fighter, targetId: string | undefined, a: Attack, solo: boolean): number {
    let t = targetId ? this.get(targetId) : undefined;
    const taunter = this.party().find((p) => p.statuses.taunt);
    if (taunter) t = taunter;
    if (!t || !t.alive) t = this.party()[0];
    if (!t) return 0;
    // Big Brother: off-cooldown, Rex steps in front of single-target attacks aimed at Eddar.
    if (t.id === 'eddar' && !this.opts.tweaks?.noBigBrother) {
      const rex = this.get('rex');
      if (rex && rex.alive && !rex.broken) t = rex;
    }
    let mul = this.enemyMul(u, solo);
    const dmg = this.dealDamage(u, t, a, mul);
    this.afterHeroHit(t);
    return dmg;
  }

  /** AoE on the whole party, opening a music-press window (DESIGN §6.2g) when `press` is set. */
  enemyAoe(u: Fighter, a: Attack, press: boolean): number {
    if (press) this.openPresses(u);
    let total = 0;
    const mul = this.enemyMul(u, false);
    let firstDmg = 0;
    for (const t of this.party()) {
      const d = this.dealDamage(u, t, a, mul);
      if (!firstDmg) firstDmg = d;
      total += d;
      this.afterHeroHit(t);
    }
    if (press) this.closePresses(u, firstDmg);
    return total;
  }

  private enemyMul(u: Fighter, solo: boolean): number {
    let mul = this.hooks.enemyDamageMul?.(this, u, solo) ?? 1;
    if (u.statuses.hollowed) mul *= 0.5;
    // Unplugged (assumption, not canon): enemies hit 25% softer.
    if (this.d === 1) mul *= 0.75;
    return mul;
  }

  private openPresses(_u: Fighter): void {
    this.pressBuff = {};
    const order = ['eddar', 'rex', 'roxy'].filter((id) => this.get(id)?.alive);
    const used = order.slice(0, this.presses);
    this.pressesUsed += used.length;
    for (const id of used) {
      if (id === 'eddar') {
        const rex = this.get('rex');
        if (rex && rex.alive) this.pressBuff.rex = 0.5;
        else this.pressBuff.eddar = 0.5;
      }
    }
    this.pressBuff.__used = used.length;
    (this.pressBuff as Record<string, number>).__mask = (used.includes('eddar') ? 1 : 0) | (used.includes('rex') ? 2 : 0) | (used.includes('roxy') ? 4 : 0);
  }

  private closePresses(u: Fighter, firstDmg: number): void {
    const mask = this.pressBuff.__mask ?? 0;
    this.pressBuff = {};
    if (mask & 1 && firstDmg > 0) {
      const foes = this.enemies();
      if (foes.length) this.rawDamage(foes[Math.floor(this.rng.next() * foes.length)], firstDmg);
    }
    if (mask & 2) {
      const rex = this.get('rex');
      if (rex && rex.alive && u.alive) {
        rex.statuses.taunt = Math.max(rex.statuses.taunt ?? 0, 1);
        this.addEnergy(rex, 10);
        this.partyAttack(rex, u, { name: 'Press: Rex', power: 1.0, breakPower: 10 }, false);
      }
    }
    if (mask & 4) {
      const roxy = this.get('roxy');
      if (roxy && roxy.alive && u.alive) {
        this.partyAttack(roxy, u, { name: 'Press: Roxy fire', power: 0.95, type: 'fire' }, false);
        this.partyAttack(roxy, u, { name: 'Press: Roxy sound', power: 0.95, type: 'sound' }, false);
      }
    }
  }

  private afterHeroHit(t: Fighter): void {
    const roxy = this.get('roxy');
    if (roxy && roxy.alive) this.addEnergy(roxy, roxy.id === t.id ? 20 : t.id === 'rex' ? 25 : 12);
  }

  dealDamage(src: Fighter, t: Fighter, a: Attack, mul: number): number {
    const variance = 0.9 + this.rng.next() * 0.2;
    let dmg = a.pctMax ? a.pctMax * t.maxHp : a.power * src.atk * 3 * (20 / (20 + t.def));
    dmg *= variance * mul;
    if (t.statuses.guard) dmg *= 0.5;
    if (t.statuses.champion && t.side === 'party') dmg *= 0.5;
    if (t.side === 'party' && this.pressBuff[t.id]) dmg *= this.pressBuff[t.id];
    if (t.side === 'party' && t.id === 'rex' && this.get('eddar')?.alive) dmg *= 0.85;
    return this.rawDamage(t, Math.max(1, Math.round(dmg)));
  }

  rawDamage(t: Fighter, amount: number): number {
    if (!t.alive) return 0;
    t.hp = Math.max(0, t.hp - amount);
    if (t.side === 'enemy' && this.hooks.mercy && t.id === this.hooks.mercy.unit && t.hp <= t.maxHp * this.hooks.mercy.frac) {
      t.hp = Math.max(1, t.hp);
      this.result = 'win';
      return amount;
    }
    if (t.hp <= 0) {
      t.alive = false;
      if (t.side === 'party') this.koCount++;
      else this.hooks.onEnemyKo?.(this, t);
    }
    return amount;
  }

  heal(t: Fighter, amount: number): void {
    if (!t.alive || t.statuses.hollowed) return;
    t.hp = Math.min(t.maxHp, t.hp + amount);
  }

  breakUnit(t: Fighter): void {
    t.broken = true;
    t.breakVal = t.breakMax;
    t.nextTurn += this.turnPeriod(t);
    t.meta.windup = 0;
  }

  /** Chakra energy. Every gain by someone else feeds Eddar's black chakra (30% from friends, 90% from enemies). */
  addEnergy(u: Fighter, n: number): void {
    const before = u.energy;
    u.energy = Math.min(100, u.energy + n);
    const gained = u.energy - before;
    if (gained <= 0 || u.chakra === 'black') return;
    const share = (u.side === 'party' ? 0.3 : 0.9) * (this.opts.tweaks?.blackFeedMul ?? 1);
    for (const e of this.fighters) if (e.alive && e.chakra === 'black' && e.energy < 100) e.energy = Math.min(100, e.energy + gained * share);
  }

  private tickStatuses(f: Fighter): void {
    if (f.statuses.dot && f.side === 'party') this.rawDamage(f, Math.round(f.maxHp * 0.05));
    for (const k of Object.keys(f.statuses)) {
      if (k === 'static') continue;
      f.statuses[k]--;
      if (f.statuses[k] <= 0) delete f.statuses[k];
    }
  }

  private checkEnd(): void {
    if (this.result) return;
    if (!this.enemies().length) this.result = 'win';
    else if (!this.party().length) this.result = 'defeat';
  }
}

export function fighter(p: Partial<Fighter> & Pick<Fighter, 'id' | 'name' | 'side' | 'hp' | 'atk' | 'def' | 'spd'>): Fighter {
  return {
    maxHp: p.hp,
    soloMul: 1.4,
    alive: true,
    nextTurn: 0,
    nextSolo: 0,
    energy: 0,
    statuses: {},
    breakVal: 0,
    breakMax: 999,
    broken: false,
    analyzed: false,
    aiStep: 0,
    traits: [],
    meta: {},
    ...p,
  };
}
