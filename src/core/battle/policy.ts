import type { Battle } from './engine';

export interface BattleChoice {
  skill: string;
  target?: string;
}

/**
 * The tactics a careful player uses (DESIGN §6.6 autoplay; also the balance sim's "mechanic-aware" policy).
 * Reads foes first, interrupts wind-ups, flips rearing beasts, heals under 40%, saves Roxy's Meltdown for 100 Heat.
 */
export function smartPolicy(b: Battle, opts: { tells?: boolean } = {}): BattleChoice {
  const tells = opts.tells ?? true;
  const me = b.unit(b.current);
  const legal = b.legal().filter((l) => !l.blocked);
  const can = (id: string) => legal.find((l) => l.skill === id);
  const foes = b.enemies();
  const allies = b.party();
  const setUp = tells ? foes.find((f) => f.statuses.rearing || (f.analyzed && f.intent && (b.skill(f.intent.skill).power ?? 0) >= 2)) : undefined;

  if (can('meltdown')) return { skill: 'meltdown' };
  if (me.id === 'eddar') {
    if (setUp && can('lift')) return { skill: 'lift', target: setUp.id };
    const hurt = allies.filter((a) => a.hp < a.maxHp * 0.4).sort((a, b2) => a.hp / a.maxHp - b2.hp / b2.maxHp)[0];
    if (hurt && can('patch')) return { skill: 'patch', target: hurt.id };
    const unread = foes.find((f) => !f.analyzed);
    if (unread && can('read')) return { skill: 'read', target: unread.id };
  }
  if (me.id === 'rex' && can('charge') && foes.some((f) => f.hp > 60)) {
    // Charge when nobody is about to flatten Eddar; otherwise punch.
    if (!setUp || setUp.statuses.rearing) return { skill: 'charge' };
  }
  const attack = legal.find((l) => ['lid_bash', 'strike', 'axe_riff'].includes(l.skill)) ?? legal[0];
  const exposed = tells ? foes.find((f) => f.statuses.rearing || f.broken) : undefined;
  const target = exposed ?? foes.slice().sort((a, c) => a.hp - c.hp)[0];
  return { skill: attack.skill, target: target?.id };
}

/** A sensible player who heals, reads and uses Heat, but never reacts to a Tell (no Lift on a wind-up, no punishing a rear). */
export function ignoreTellsPolicy(b: Battle): BattleChoice {
  return smartPolicy(b, { tells: false });
}

/** A button-masher: random legal action, random target. The balance floor. */
export function randomPolicy(b: Battle, rnd: () => number): BattleChoice {
  const legal = b.legal().filter((l) => !l.blocked);
  const l = legal[Math.floor(rnd() * legal.length)];
  return { skill: l.skill, target: l.targets[Math.floor(rnd() * l.targets.length)] };
}

/** "Attack only": what a player does who ignores every mechanic. */
export function attackOnlyPolicy(b: Battle): BattleChoice {
  const legal = b.legal().filter((l) => !l.blocked);
  const attack = legal.find((l) => ['lid_bash', 'strike', 'axe_riff'].includes(l.skill)) ?? legal[0];
  const target = b.enemies().slice().sort((a, c) => a.hp - c.hp)[0];
  return { skill: attack.skill, target: target?.id };
}
