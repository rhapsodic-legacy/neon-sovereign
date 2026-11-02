import { Game, WALK_SPEED } from './game';
import { findPath, INTERACT_RANGE } from './map';

/**
 * THE WIRE — the AI-player interface. An LLM (or any bot) can play the whole game through
 * observe() / act() / describe(), in the browser (window.WIRE) or headless in Node.
 * Reference: docs/WIRE.md
 */

export type WireAction =
  | { type: 'move_to'; target: string }
  | { type: 'move_to'; x: number; z: number }
  | { type: 'walk'; dx: number; dz: number; seconds: number }
  | { type: 'interact'; target?: string }
  | { type: 'advance' }
  | { type: 'choose'; index: number }
  | { type: 'wait'; seconds: number };

export interface WireResult {
  ok: boolean;
  message: string;
}

export function observe(game: Game) {
  const s = game.state;
  const base = {
    mode: game.mode,
    map: { id: s.mapId, name: game.map.name },
    objective: s.objective,
    player: { x: round(s.player.pos.x), z: round(s.player.pos.z) },
    party: s.party,
    tokens: s.vars.tokens ?? 0,
    inventory: s.inventory,
    ledger_latest: s.ledger.slice(-3).map((l) => l.text),
  };
  if (game.mode === 'scene') {
    const v = game.view!;
    const speakers = game.content.speakers;
    return {
      ...base,
      scene:
        v.kind === 'line'
          ? { kind: 'line', speaker: speakers[v.speaker]?.name ?? v.speaker, text: v.text, legal: ['advance'] }
          : v.kind === 'card'
            ? { kind: 'card', text: v.text, legal: ['advance'] }
            : v.kind === 'choice'
              ? { kind: 'choice', options: v.options, legal: ['choose'] }
              : { kind: 'end' },
    };
  }
  return {
    ...base,
    interactables: game.nearby().map((n) => ({
      id: n.id,
      kind: n.kind,
      name: n.name,
      x: round(n.pos.x),
      z: round(n.pos.z),
      distance: round(n.distance),
      in_range: n.distance <= INTERACT_RANGE,
    })),
    legal: ['move_to', 'walk', 'interact', 'wait'],
  };
}

export function act(game: Game, a: WireAction): WireResult {
  switch (a.type) {
    case 'advance':
      if (game.mode !== 'scene') return fail('not in a scene');
      game.advance();
      return ok('advanced');
    case 'choose':
      if (game.view?.kind !== 'choice') return fail('no choice pending');
      try {
        game.choose(a.index);
        return ok(`chose ${a.index}`);
      } catch (e) {
        return fail(String(e));
      }
    case 'interact': {
      if (game.mode !== 'field') return fail('not in the field');
      if (a.target) {
        const t = game.nearby().find((n) => n.id === a.target);
        if (!t) return fail(`no interactable "${a.target}" here`);
        if (t.distance > INTERACT_RANGE) {
          const r = walkTo(game, t.pos.x, t.pos.z, INTERACT_RANGE * 0.95 + t.reach);
          if (!r.ok) return r;
        }
      }
      return game.interact(a.target) ? ok('interacted') : fail('nothing in range');
    }
    case 'move_to': {
      if (game.mode !== 'field') return fail('not in the field');
      if ('target' in a) {
        const t = game.nearby().find((n) => n.id === a.target);
        if (!t) return fail(`no interactable "${a.target}" here`);
        return walkTo(game, t.pos.x, t.pos.z, INTERACT_RANGE * 0.95 + t.reach);
      }
      return walkTo(game, a.x, a.z, 0.2);
    }
    case 'walk': {
      if (game.mode !== 'field') return fail('not in the field');
      const steps = Math.ceil(a.seconds * 30);
      for (let i = 0; i < steps && game.mode === 'field'; i++) game.tick(1 / 30, { x: a.dx, z: a.dz });
      return ok('walked');
    }
    case 'wait': {
      const steps = Math.ceil(a.seconds * 30);
      for (let i = 0; i < steps; i++) game.tick(1 / 30);
      return ok('waited');
    }
  }
}

/** Walk to within stopDist of a point, following a grid path around obstacles. Headless-friendly. */
function walkTo(game: Game, tx: number, tz: number, stopDist: number): WireResult {
  const dt = 1 / 30;
  const start = game.state.player.pos;
  if (Math.hypot(tx - start.x, tz - start.z) <= stopDist) return ok('arrived');
  const path = findPath(game.state, game.map, start, { x: tx, z: tz }, stopDist);
  if (!path) return fail(`no path to (${round(tx)}, ${round(tz)})`);
  let stuck = 0;
  for (const wp of path) {
    for (let i = 0; i < 120; i++) {
      if (game.mode !== 'field') return ok('interrupted by a scene');
      const p = game.state.player.pos;
      const dx = wp.x - p.x;
      const dz = wp.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.08) break;
      const k = Math.min(1, d / (WALK_SPEED * dt));
      const moved = game.tick(dt, { x: (dx / d) * k, z: (dz / d) * k });
      stuck = moved ? 0 : stuck + 1;
      if (stuck > 10) return fail(`blocked at (${round(p.x)}, ${round(p.z)})`);
    }
    const p = game.state.player.pos;
    if (Math.hypot(tx - p.x, tz - p.z) <= stopDist) return ok('arrived');
  }
  return ok('arrived');
}

/** A plain-English description of the current situation, for LLM players. */
export function describe(game: Game): string {
  const o = observe(game) as ReturnType<typeof observe> & Record<string, unknown>;
  const lines: string[] = [];
  lines.push(`You are Eddar, in ${o.map.name}.`);
  if (o.objective) lines.push(`Objective: ${o.objective}`);
  if (game.mode === 'scene') {
    const sc = o.scene as { kind: string; speaker?: string; text?: string; options?: { index: number; text: string }[] };
    if (sc.kind === 'line') lines.push(sc.speaker ? `${sc.speaker} says: "${sc.text}"` : `(${sc.text})`, 'Action: advance.');
    else if (sc.kind === 'card') lines.push(`[${sc.text}]`, 'Action: advance.');
    else if (sc.kind === 'choice') {
      lines.push('Choose a response:');
      for (const op of sc.options!) lines.push(`  ${op.index}: ${op.text}`);
      lines.push('Action: choose <index>.');
    }
  } else {
    const items = o.interactables as { id: string; name: string; kind: string; distance: number }[];
    lines.push('Nearby: ' + items.map((i) => `${i.name} [${i.id}, ${i.kind}, ${i.distance}m]`).join('; '));
    lines.push('Actions: interact <id> (walks there automatically), move_to <id>, walk, wait.');
  }
  lines.push(`(Walk speed ${WALK_SPEED} m/s.)`);
  return lines.join('\n');
}

const round = (n: number) => Math.round(n * 100) / 100;
const ok = (message: string): WireResult => ({ ok: true, message });
const fail = (message: string): WireResult => ({ ok: false, message });
