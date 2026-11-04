import { Rng } from '../rng';
import type { BattleDef, BattleEvent, BattleResult, SkillDef, UnitDef, UnitState } from './types';

export interface BattleData {
  units: Record<string, UnitDef>;
  skills: Record<string, SkillDef>;
}

export interface LegalAction {
  skill: string;
  name: string;
  desc: string;
  targets: string[];
  /** Why it can't be used right now (shown greyed out), if so. */
  blocked?: string;
}

const BASE_DELAY = 100;

/**
 * One battle, as a deterministic state machine (DESIGN §6.1: CTB timeline, Break gauge, readable Tells).
 * Party turns wait for act(); enemy turns run automatically. Every change is pushed to `events`
 * so the presentation layer can animate it, and so tests and the AI player can read it.
 */
export class Battle {
  readonly units: UnitState[];
  readonly events: BattleEvent[] = [];
  result: BattleResult | null = null;
  /** Unit whose turn it is (a party member waiting for a command, while result is null). */
  current = '';
  private fired = new Set<string>();
  /** True once the fight's turning point (BattleDef.turn) has passed: barks prefer their `key+` variants. */
  turned = false;
  private readonly rng: Rng;

  constructor(
    readonly def: BattleDef,
    private readonly data: BattleData,
    seed: number,
  ) {
    this.rng = new Rng(seed);
    const ids = [...def.party, ...def.enemies];
    this.units = ids.map((id, i) => {
      const u = data.units[id];
      if (!u) throw new Error(`battle ${def.id}: unknown unit ${id}`);
      return {
        ...u,
        maxHp: u.hp,
        next: this.cost(BASE_DELAY, u.spd) * (0.6 + 0.02 * i),
        statuses: {},
        breakVal: 0,
        broken: 0,
        heat: 0,
        analyzed: false,
        aiStep: 0,
        alive: true,
      };
    });
    for (const e of this.enemies()) this.planIntent(e);
    this.trigger('start');
    this.advanceToParty();
  }

  // ---------- queries ----------

  unit(id: string): UnitState {
    const u = this.units.find((x) => x.id === id);
    if (!u) throw new Error(`no unit ${id}`);
    return u;
  }

  party(): UnitState[] {
    return this.units.filter((u) => u.side === 'party' && u.alive);
  }

  enemies(): UnitState[] {
    return this.units.filter((u) => u.side === 'enemy' && u.alive);
  }

  skill(id: string): SkillDef {
    const s = this.data.skills[id];
    if (!s) throw new Error(`no skill ${id}`);
    return s;
  }

  /** Upcoming turns, soonest first. With `ifSkill`, previews the order if the current unit used it. */
  order(count = 8, ifSkill?: string): { unit: string; preview: boolean }[] {
    const sim = this.units.filter((u) => u.alive).map((u) => ({ id: u.id, next: u.next, spd: u.spd }));
    if (ifSkill && this.current) {
      const me = sim.find((s) => s.id === this.current)!;
      me.next += this.cost(this.skill(ifSkill).delay, me.spd);
    }
    const out: { unit: string; preview: boolean }[] = [];
    if (!ifSkill && this.current) {
      out.push({ unit: this.current, preview: false });
      const me = sim.find((s) => s.id === this.current)!;
      me.next += this.cost(BASE_DELAY, me.spd);
    }
    while (out.length < count && sim.length) {
      sim.sort((a, b) => a.next - b.next);
      const s = sim[0];
      out.push({ unit: s.id, preview: !!ifSkill && s.id === this.current });
      s.next += this.cost(BASE_DELAY, s.spd);
    }
    return out;
  }

  /** What the current party member can do. */
  legal(): LegalAction[] {
    if (this.result || !this.current) return [];
    const me = this.unit(this.current);
    if (me.side !== 'party') return [];
    return me.skills.map((id) => {
      const s = this.skill(id);
      const a: LegalAction = { skill: id, name: s.name, desc: s.desc, targets: this.targetsFor(me, s) };
      if (s.resonance && me.statuses.mute) a.blocked = 'Muted';
      if (s.kind === 'meltdown' && me.heat < 100) a.blocked = `Needs 100 Heat (${me.heat})`;
      return a;
    });
  }

  // ---------- commands ----------

  /** The current party member uses a skill. */
  act(skillId: string, targetId?: string): void {
    if (this.result) throw new Error('battle is over');
    const me = this.unit(this.current);
    if (me.side !== 'party') throw new Error('not a party turn');
    const la = this.legal().find((l) => l.skill === skillId);
    if (!la) throw new Error(`${me.id} can't use ${skillId}`);
    if (la.blocked) throw new Error(`${la.name}: ${la.blocked}`);
    const s = this.skill(skillId);
    let targets = la.targets;
    if (s.target === 'enemy' || s.target === 'ally') {
      const t = targetId ?? la.targets[0];
      if (!la.targets.includes(t)) throw new Error(`bad target ${t}`);
      targets = [t];
    }
    this.perform(me, s, targets);
    this.endTurn(me, s);
    this.advanceToParty();
  }

  /** Drain queued events (presentation layer / tests). */
  drain(): BattleEvent[] {
    return this.events.splice(0);
  }

  // ---------- turn flow ----------

  private advanceToParty(): void {
    for (let guard = 0; guard < 200 && !this.result; guard++) {
      const u = this.units.filter((x) => x.alive).sort((a, b) => a.next - b.next)[0];
      this.current = u.id;
      this.emit({ type: 'turn', unit: u.id });
      this.tickStatuses(u);
      if (u.broken > 0) {
        // The lost turn was already paid when it broke (breakUnit pushed it back a full turn),
        // so it gets up now and acts. Every hit until then took +50%.
        u.broken--;
        if (u.broken === 0) {
          u.breakVal = 0;
          this.emit({ type: 'status', target: u.id, id: 'broken', on: false });
        }
      }
      if (u.statuses.charging) {
        // Rex's Charge lands on his next turn, automatically.
        delete u.statuses.charging;
        this.emit({ type: 'status', target: u.id, id: 'charging', on: false });
        const strike = this.skill('charge_strike');
        const target = this.pickTarget(u, strike);
        if (target) {
          this.perform(u, strike, [target]);
          this.trigger('charge_land');
        }
        this.endTurn(u, strike);
        continue;
      }
      if (u.side === 'party') {
        this.trigger(`turn:${u.id}`);
        return;
      }
      this.enemyTurn(u);
    }
    if (!this.result) throw new Error('battle runaway');
  }

  private enemyTurn(u: UnitState): void {
    const intent = u.intent ?? { skill: u.ai![0] };
    const s = this.skill(intent.skill);
    let targets: string[];
    if (s.target === 'all_party') targets = this.party().map((p) => p.id);
    else if (s.target === 'self' || s.target === 'none') targets = [u.id];
    else {
      const t = intent.target && this.unit(intent.target).alive ? intent.target : this.pickTarget(u, s);
      targets = t ? [t] : [];
    }
    if (s.kind === 'windup' || s.kind === 'rear') {
      this.emit({ type: 'action', actor: u.id, skill: s.id, name: s.name, targets: [] });
      if (s.kind === 'rear') this.setStatus(u, 'rearing', 1);
      this.trigger(`tell:${u.id}`);
      u.intent = { skill: s.then!, target: this.pickTarget(u, this.skill(s.then!)) };
      u.next += this.cost(s.delay, u.spd);
      return;
    }
    // Big Brother: Rex steps in front of single-target attacks aimed at Eddar.
    if (s.target === 'enemy' && targets[0] === 'eddar') {
      const rex = this.units.find((x) => x.alive && x.traits?.includes('big_brother') && !x.broken);
      if (rex) {
        targets = [rex.id];
        this.emit({ type: 'cover', by: rex.id, for: 'eddar' });
        this.trigger('cover');
      }
    }
    this.perform(u, s, targets);
    if (u.statuses.rearing) {
      delete u.statuses.rearing;
      this.emit({ type: 'status', target: u.id, id: 'rearing', on: false });
    }
    u.next += this.cost(s.delay, u.spd);
    this.planIntent(u);
  }

  private planIntent(u: UnitState): void {
    const ai = u.ai ?? [];
    if (!ai.length) return;
    const id = ai[u.aiStep % ai.length];
    u.aiStep++;
    const s = this.skill(id);
    u.intent = { skill: id, target: s.target === 'enemy' ? this.pickTarget(u, s) : undefined };
  }

  private endTurn(u: UnitState, s: SkillDef): void {
    if (s.kind === 'charge') return; // charge already scheduled its own short delay
    u.next += this.cost(s.delay, u.spd);
  }

  // ---------- resolution ----------

  private perform(me: UnitState, s: SkillDef, targets: string[]): void {
    this.emit({ type: 'action', actor: me.id, skill: s.id, name: s.name, targets });
    switch (s.kind) {
      case 'attack':
      case 'meltdown':
        for (const t of targets) this.hit(me, this.unit(t), s);
        if (s.kind === 'meltdown') {
          me.heat = 0;
          this.emit({ type: 'heat', unit: me.id, value: 0 });
          this.trigger('meltdown');
        } else if (me.traits?.includes('heat')) this.addHeat(me, 10);
        break;
      case 'read':
        for (const t of targets) {
          const u = this.unit(t);
          u.analyzed = true;
          this.emit({ type: 'read', target: t });
          this.trigger(`read:${t}`);
          this.trigger('read');
        }
        break;
      case 'lift':
        for (const t of targets) this.lift(me, this.unit(t), s);
        break;
      case 'heal':
        for (const t of targets) {
          const u = this.unit(t);
          const amt = Math.min(u.maxHp - u.hp, Math.round(u.maxHp * (s.heal ?? 0.3)));
          u.hp += amt;
          this.emit({ type: 'heal', target: t, amount: amt });
        }
        break;
      case 'charge':
        this.setStatus(me, 'charging', 99);
        me.next += this.cost(s.delay, me.spd);
        this.trigger('charge');
        break;
      case 'defend':
        this.setStatus(me, 'guard', 1);
        break;
      case 'taunt':
        this.setStatus(me, 'taunt', 2);
        break;
      default:
        break;
    }
    this.checkEnd();
  }

  private hit(me: UnitState, t: UnitState, s: SkillDef): void {
    if (!t.alive) return;
    const variance = 0.9 + this.rng.next() * 0.2;
    let dmg = (s.power ?? 1) * me.atk * 3 * (20 / (20 + t.def)) * variance;
    const exposed = !!t.statuses.rearing;
    if (exposed) dmg *= 1.5;
    const broken = t.broken > 0;
    if (broken) dmg *= 1.5;
    if (t.statuses.guard) dmg *= 0.5;
    if (me.side === 'enemy' && t.traits?.includes('big_brother') && this.def.party.includes('eddar')) dmg *= 0.85;
    const amount = Math.max(1, Math.round(dmg));
    t.hp = Math.max(0, t.hp - amount);
    this.emit({ type: 'damage', target: t.id, amount, exposed, broken });
    if (s.inflict) this.setStatus(t, s.inflict.id, s.inflict.turns);
    if (t.side === 'party') {
      if (t.hp > 0 && t.hp < t.maxHp * 0.5) this.trigger(`hurt:${t.id}`);
      const roxy = this.units.find((u) => u.alive && u.traits?.includes('heat'));
      if (roxy) {
        if (roxy.id === t.id) this.addHeat(roxy, 20);
        else if (t.id === 'rex') {
          this.addHeat(roxy, 25);
          this.trigger('roxy_rex_hit');
        } else this.addHeat(roxy, 12);
      }
    } else if (s.breakPower && !t.broken && t.breakMax) {
      t.breakVal += s.breakPower;
      if (t.breakVal >= t.breakMax) this.breakUnit(t);
    }
    if (t.hp <= 0) {
      t.alive = false;
      this.emit({ type: 'ko', unit: t.id });
    }
    this.checkTurn(t);
    this.checkMercy(t);
  }

  private lift(me: UnitState, t: UnitState, s: SkillDef): void {
    const settingUp = !!t.intent && this.wasSetUp(t);
    if (t.statuses.rearing) {
      delete t.statuses.rearing;
      this.emit({ type: 'interrupt', target: t.id, text: 'Flipped!' });
      this.trigger(`lift_rear:${t.id}`);
      this.planIntent(t);
      this.breakUnit(t);
      return;
    }
    if (settingUp) {
      this.emit({ type: 'interrupt', target: t.id, text: 'Interrupted!' });
      this.trigger('interrupt');
      t.next += this.cost(40, t.spd);
      this.planIntent(t);
      if (t.breakMax && !t.broken) {
        t.breakVal += (s.breakPower ?? 0) * 2;
        if (t.breakVal >= t.breakMax) this.breakUnit(t);
      }
      this.hit(me, t, { ...s, power: (s.power ?? 0.5) * 1.2, breakPower: 0 });
      return;
    }
    // Not winding up: a modest shove that pushes them back on the timeline.
    t.next += this.cost(15, t.spd);
    this.hit(me, t, s);
  }

  /** True when the unit's current intent was set up by a wind-up/rear tell. */
  private wasSetUp(t: UnitState): boolean {
    if (!t.intent) return false;
    return Object.values(this.data.skills).some((s) => (s.kind === 'windup' || s.kind === 'rear') && s.then === t.intent!.skill);
  }

  private breakUnit(t: UnitState): void {
    t.broken = 1;
    // Broken: it loses a whole turn, and the party gets that time to pile on.
    t.next += this.cost(BASE_DELAY, t.spd);
    t.breakVal = t.breakMax ?? 0;
    this.emit({ type: 'break', target: t.id });
    this.emit({ type: 'status', target: t.id, id: 'broken', on: true });
    this.trigger('break');
  }

  private addHeat(u: UnitState, n: number): void {
    const before = u.heat;
    u.heat = Math.min(100, u.heat + n);
    if (u.heat !== before) this.emit({ type: 'heat', unit: u.id, value: u.heat });
    if (u.heat >= 100 && before < 100) this.trigger('heat_max');
  }

  private setStatus(u: UnitState, id: string, turns: number): void {
    const had = !!u.statuses[id];
    u.statuses[id] = turns;
    if (!had) this.emit({ type: 'status', target: u.id, id, on: true });
    if (id === 'mute') this.trigger('mute');
  }

  private tickStatuses(u: UnitState): void {
    for (const id of Object.keys(u.statuses)) {
      if (id === 'charging' || id === 'rearing') continue;
      u.statuses[id]--;
      if (u.statuses[id] <= 0) {
        delete u.statuses[id];
        this.emit({ type: 'status', target: u.id, id, on: false });
      }
    }
  }

  /** The fight's turning point: once the named enemy drops below the threshold, the party's fear turns to flair. */
  private checkTurn(t: UnitState): void {
    const tp = this.def.turn;
    if (!tp || this.turned || t.id !== tp.unit || this.result) return;
    if (t.hp < t.maxHp * tp.hpFraction) {
      this.turned = true;
      this.trigger('turned');
    }
  }

  private checkMercy(t: UnitState): void {
    const m = this.def.mercy;
    if (!m || this.result || t.id !== m.unit) return;
    if (t.hp <= t.maxHp * m.hpFraction) {
      t.hp = Math.max(1, t.hp);
      t.alive = true;
      this.finish('mercy');
    }
  }

  private checkEnd(): void {
    if (this.result) return;
    if (!this.enemies().length) this.finish('win');
    else if (!this.party().length) this.finish('defeat');
  }

  private finish(r: BattleResult): void {
    this.result = r;
    this.current = '';
    this.trigger(r);
    this.emit({ type: 'end', result: r });
  }

  // ---------- helpers ----------

  private targetsFor(me: UnitState, s: SkillDef): string[] {
    switch (s.target) {
      case 'enemy':
      case 'all_enemies':
        return this.units.filter((u) => u.alive && u.side !== me.side).map((u) => u.id);
      case 'ally':
        return this.units.filter((u) => u.alive && u.side === me.side).map((u) => u.id);
      case 'all_party':
        return this.units.filter((u) => u.alive && u.side === me.side).map((u) => u.id);
      default:
        return [me.id];
    }
  }

  private pickTarget(me: UnitState, s: SkillDef): string | undefined {
    const foes = this.units.filter((u) => u.alive && u.side !== me.side);
    if (!foes.length) return undefined;
    const taunter = foes.find((f) => f.statuses.taunt);
    if (taunter) return taunter.id;
    if (s.prefer === 'eddar') {
      const e = foes.find((f) => f.id === 'eddar');
      if (e) return e.id;
    }
    if (s.prefer === 'weakest') return foes.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0].id;
    return foes[Math.floor(this.rng.next() * foes.length)].id;
  }

  private cost(delay: number, spd: number): number {
    return (delay * 10) / spd;
  }

  /** Fire a bark once per battle, if the content defines one for this trigger (or its `+` variant after the turn). */
  private trigger(base: string): void {
    // After the turning point, a `key+` variant (the cocky line) replaces the frightened one.
    const key = this.turned && this.def.barks[`${base}+`] ? `${base}+` : base;
    if (this.fired.has(key)) return;
    const b = this.def.barks[key];
    if (!b) return;
    this.fired.add(key);
    this.emit({ type: 'bark', who: b.who, text: b.text, hint: b.hint });
  }

  private emit(e: BattleEvent): void {
    this.events.push(e);
  }
}
