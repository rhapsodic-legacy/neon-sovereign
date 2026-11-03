import { evalCond, GameState, Vec2 } from './state';

/** A scene choice that depends on state: the first entry whose cond holds wins. */
export type SceneRef = string | { cond?: string; scene: string }[];

export interface NpcDef {
  id: string;
  /** Visual model key (see game/characters.ts). */
  model: string;
  name: string;
  pos: Vec2;
  facing: number;
  talk: SceneRef;
  /** NPC only present while this holds. */
  cond?: string;
  radius?: number;
  /** Extra talk range, e.g. for someone behind a counter. */
  reach?: number;
}

export interface HotspotDef {
  id: string;
  name: string;
  pos: Vec2;
  examine: SceneRef;
  cond?: string;
  /** Visual hint shown by the renderer (e.g. 'puddle', 'sparkle'). */
  marker?: string;
  /** Extra examine range, e.g. for something behind a counter or high on a wall. */
  reach?: number;
}

export interface ExitDef {
  id: string;
  name: string;
  pos: Vec2;
  to: string;
  spawn: string;
  /** Exit usable only while cond holds; otherwise `locked` scene plays. */
  cond?: string;
  locked?: string;
}

export interface RectBlocker {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface MapDef {
  id: string;
  name: string;
  bgm: string;
  /** Renderer set-piece to build. */
  view: string;
  /** Walkable area: simple polygon (x,z), counter-clockwise or clockwise. */
  walk: Vec2[];
  blockers: RectBlocker[];
  spawns: Record<string, { pos: Vec2; facing: number }>;
  npcs: NpcDef[];
  hotspots: HotspotDef[];
  exits: ExitDef[];
  /** Positional music/ambience layers (DESIGN §9.4): louder near `pos`, optionally muffled. */
  sounds?: SoundDef[];
  /** Scenes auto-played on entry (or after any scene) when cond holds. Each should set a flag so it plays once. */
  triggers: { cond: string; scene: string }[];
}

export interface SoundDef {
  id: string;
  /** Audio preset key (game/audio.ts). */
  preset: string;
  pos: Vec2;
  /** Layer only plays while cond holds. */
  cond?: string;
  /** Distance (m) at which the layer reaches its minimum gain. */
  radius: number;
  /** Gain when standing on top of the source. */
  maxGain: number;
  /** Gain floor anywhere on the map (heard through the whole room). */
  minGain?: number;
  /** Heard through a wall: low-pass filtered. */
  muffled?: boolean;
}

/** Gain for each active positional sound at the player's position (pure, so tests and the renderer share it). */
export function soundGains(state: GameState, map: MapDef): { id: string; preset: string; gain: number; muffled: boolean }[] {
  const out: { id: string; preset: string; gain: number; muffled: boolean }[] = [];
  for (const s of map.sounds ?? []) {
    if (!evalCond(state, s.cond)) continue;
    const d = Math.hypot(state.player.pos.x - s.pos.x, state.player.pos.z - s.pos.z);
    const t = Math.max(0, 1 - d / s.radius);
    const min = s.minGain ?? 0;
    out.push({ id: s.id, preset: s.preset, gain: min + (s.maxGain - min) * t * t, muffled: !!s.muffled });
  }
  return out;
}

export const PLAYER_RADIUS = 0.35;
export const INTERACT_RANGE = 1.9;

export function resolveScene(state: GameState, ref: SceneRef): string | undefined {
  if (typeof ref === 'string') return ref;
  return ref.find((r) => evalCond(state, r.cond))?.scene;
}

/** Where an NPC stands now: its map position, unless a scene has moved it. */
export function npcPosition(state: GameState, mapId: string, n: NpcDef): Vec2 {
  return state.npcPos?.[`${mapId}:${n.id}`] ?? n.pos;
}

export interface Interactable {
  id: string;
  kind: 'npc' | 'hotspot' | 'exit';
  name: string;
  pos: Vec2;
  /** Distance to the target, less its reach. */
  distance: number;
  reach: number;
}

export function interactables(state: GameState, map: MapDef): Interactable[] {
  const p = state.player.pos;
  const out: Interactable[] = [];
  const add = (id: string, kind: Interactable['kind'], name: string, pos: Vec2, reach = 0) =>
    out.push({ id, kind, name, pos, reach, distance: Math.max(0, Math.hypot(pos.x - p.x, pos.z - p.z) - reach) });
  for (const n of map.npcs) if (evalCond(state, n.cond)) add(n.id, 'npc', n.name, npcPosition(state, map.id, n), n.reach);
  for (const h of map.hotspots) if (evalCond(state, h.cond)) add(h.id, 'hotspot', h.name, h.pos, h.reach);
  for (const e of map.exits) add(e.id, 'exit', e.name, e.pos);
  return out.sort((a, b) => a.distance - b.distance);
}

// ---------- collision ----------

function pointInPolygon(pt: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.z > pt.z !== b.z > pt.z && pt.x < ((b.x - a.x) * (pt.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

export function isWalkable(state: GameState, map: MapDef, pt: Vec2, r = PLAYER_RADIUS): boolean {
  if (!pointInPolygon(pt, map.walk)) return false;
  for (let i = 0, j = map.walk.length - 1; i < map.walk.length; j = i++) {
    if (distToSegment(pt, map.walk[j], map.walk[i]) < r) return false;
  }
  for (const b of map.blockers) {
    const cx = Math.max(b.x - b.w / 2, Math.min(pt.x, b.x + b.w / 2));
    const cz = Math.max(b.z - b.d / 2, Math.min(pt.z, b.z + b.d / 2));
    if (Math.hypot(pt.x - cx, pt.z - cz) < r) return false;
  }
  for (const n of map.npcs) {
    if (!evalCond(state, n.cond)) continue;
    const np = npcPosition(state, map.id, n);
    if (Math.hypot(pt.x - np.x, pt.z - np.z) < r + (n.radius ?? 0.35)) return false;
  }
  return true;
}

/** Move the player by (dx,dz), sliding along walls. Returns true if any movement happened. */
export function movePlayer(state: GameState, map: MapDef, dx: number, dz: number): boolean {
  if (dx === 0 && dz === 0) return false;
  const p = state.player.pos;
  state.player.facing = Math.atan2(dx, dz);
  const tries: Vec2[] = [
    { x: p.x + dx, z: p.z + dz },
    { x: p.x + dx, z: p.z },
    { x: p.x, z: p.z + dz },
  ];
  for (const t of tries) {
    if ((t.x !== p.x || t.z !== p.z) && isWalkable(state, map, t)) {
      p.x = t.x;
      p.z = t.z;
      return true;
    }
  }
  return false;
}

/**
 * Grid path-finder over walkable space (0.25 m cells, 8-way). Returns waypoints from `from` to the nearest
 * walkable cell within `stopDist` of `to`, or null when unreachable. Used by THE WIRE's auto-walk.
 */
export function findPath(state: GameState, map: MapDef, from: Vec2, to: Vec2, stopDist: number): Vec2[] | null {
  const CELL = 0.25;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const v of map.walk) {
    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
    minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
  }
  const W = Math.ceil((maxX - minX) / CELL) + 1;
  const H = Math.ceil((maxZ - minZ) / CELL) + 1;
  const pt = (i: number): Vec2 => ({ x: minX + (i % W) * CELL, z: minZ + Math.floor(i / W) * CELL });
  const walk = new Int8Array(W * H).fill(-1);
  const cx = Math.round((from.x - minX) / CELL);
  const cz = Math.round((from.z - minZ) / CELL);
  if (cx < 0 || cz < 0 || cx >= W || cz >= H) return null;
  const start = cz * W + cx;
  // Path cells keep a little clearance, so a walker never hugs a corner it can't slide past.
  const ok = (i: number) => {
    if (walk[i] < 0) walk[i] = isWalkable(state, map, pt(i), PLAYER_RADIUS + 0.06) || i === start ? 1 : 0;
    return walk[i] === 1;
  };
  const prev = new Int32Array(W * H).fill(-2);
  prev[start] = -1;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const p = pt(i);
    if (Math.hypot(p.x - to.x, p.z - to.z) <= stopDist) {
      const path: Vec2[] = [];
      for (let k = i; k !== start && k >= 0; k = prev[k]) path.push(pt(k));
      return path.reverse();
    }
    const x = i % W, z = Math.floor(i / W);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue;
      const n = nz * W + nx;
      if (prev[n] !== -2 || !ok(n)) continue;
      if (dx && dz && (!ok(z * W + nx) || !ok(nz * W + x))) continue; // no corner cutting
      prev[n] = i;
      queue.push(n);
    }
  }
  return null;
}
