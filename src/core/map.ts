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
}

export interface HotspotDef {
  id: string;
  name: string;
  pos: Vec2;
  examine: SceneRef;
  cond?: string;
  /** Visual hint shown by the renderer (e.g. 'puddle', 'sparkle'). */
  marker?: string;
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
  /** Scenes auto-played on entry (or after any scene) when cond holds. Each should set a flag so it plays once. */
  triggers: { cond: string; scene: string }[];
}

export const PLAYER_RADIUS = 0.35;
export const INTERACT_RANGE = 1.9;

export function resolveScene(state: GameState, ref: SceneRef): string | undefined {
  if (typeof ref === 'string') return ref;
  return ref.find((r) => evalCond(state, r.cond))?.scene;
}

export interface Interactable {
  id: string;
  kind: 'npc' | 'hotspot' | 'exit';
  name: string;
  pos: Vec2;
  distance: number;
}

export function interactables(state: GameState, map: MapDef): Interactable[] {
  const p = state.player.pos;
  const out: Interactable[] = [];
  const add = (id: string, kind: Interactable['kind'], name: string, pos: Vec2) =>
    out.push({ id, kind, name, pos, distance: Math.hypot(pos.x - p.x, pos.z - p.z) });
  for (const n of map.npcs) if (evalCond(state, n.cond)) add(n.id, 'npc', n.name, n.pos);
  for (const h of map.hotspots) if (evalCond(state, h.cond)) add(h.id, 'hotspot', h.name, h.pos);
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
    if (Math.hypot(pt.x - n.pos.x, pt.z - n.pos.z) < r + (n.radius ?? 0.35)) return false;
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
