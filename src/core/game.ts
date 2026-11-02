import type { Content } from '../content/index';
import { evalCond, GameState, newGameState } from './state';
import { Interactable, interactables, INTERACT_RANGE, MapDef, movePlayer, resolveScene } from './map';
import { interpolate, SceneCommand, SceneRunner, SceneView } from './scene/runner';
import { Rng } from './rng';

export type Mode = 'field' | 'scene';

export const WALK_SPEED = 3.4; // metres per second

/** Events for the presentation layer (renderer, audio, UI). The core never touches the DOM. */
export type GameEvent =
  | { type: 'map'; mapId: string }
  | { type: 'bgm'; id: string }
  | { type: 'sfx'; id: string }
  | { type: 'cam'; args: string[] }
  | { type: 'emote'; who: string; what: string }
  | { type: 'fx'; id: string; target: string }
  | { type: 'npc_exit'; id: string }
  | { type: 'objective'; text: string }
  | { type: 'toast'; text: string }
  | { type: 'scene_start'; id: string }
  | { type: 'scene_end'; id: string };

export interface SaveData {
  state: GameState;
  savedAt: string;
}

/**
 * The whole game as a deterministic state machine. Renderer-agnostic: the browser drives it with
 * real input and frames; tests and the AI player (WIRE) drive it headlessly.
 */
export class Game {
  state: GameState;
  mode: Mode = 'field';
  runner: SceneRunner | null = null;
  readonly rng: Rng;
  private events: GameEvent[] = [];
  private listeners: ((e: GameEvent) => void)[] = [];

  constructor(
    readonly content: Content,
    state?: GameState,
  ) {
    this.state = state ?? newGameState();
    this.rng = new Rng(this.state.seed);
    this.rng.state = this.state.rngState;
  }

  // ---------- lifecycle ----------

  /** Begin play on the current map (after new game or load). */
  start(): void {
    this.emit({ type: 'map', mapId: this.state.mapId });
    this.emit({ type: 'bgm', id: this.state.bgm || this.map.bgm });
    this.refreshObjective(true);
    this.checkTriggers();
  }

  get map(): MapDef {
    const m = this.content.maps[this.state.mapId];
    if (!m) throw new Error(`unknown map ${this.state.mapId}`);
    return m;
  }

  on(fn: (e: GameEvent) => void): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  /** Drain queued events (for headless consumers). */
  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private emit(e: GameEvent): void {
    this.events.push(e);
    if (this.events.length > 500) this.events.shift();
    for (const l of this.listeners) l(e);
  }

  // ---------- per-frame ----------

  /** Advance time. `move` is a desired direction in world space (length ≤ 1). */
  tick(dt: number, move: { x: number; z: number } = { x: 0, z: 0 }): boolean {
    this.state.playtime += dt;
    if (this.mode !== 'field') return false;
    const len = Math.hypot(move.x, move.z);
    if (len < 0.05) return false;
    const k = (Math.min(1, len) * WALK_SPEED * dt) / len;
    return movePlayer(this.state, this.map, move.x * k, move.z * k);
  }

  // ---------- interaction ----------

  nearby(): Interactable[] {
    return interactables(this.state, this.map);
  }

  /** The interactable the player would use if they pressed the action button now. */
  focus(): Interactable | undefined {
    const n = this.nearby()[0];
    return n && n.distance <= INTERACT_RANGE ? n : undefined;
  }

  /** Interact with a target by id (must be in range), or the focused one. */
  interact(id?: string): boolean {
    if (this.mode !== 'field') return false;
    const target = id ? this.nearby().find((n) => n.id === id && n.distance <= INTERACT_RANGE) : this.focus();
    if (!target) return false;
    const map = this.map;
    if (target.kind === 'npc') {
      const npc = map.npcs.find((n) => n.id === target.id)!;
      this.state.player.facing = Math.atan2(npc.pos.x - this.state.player.pos.x, npc.pos.z - this.state.player.pos.z);
      const sc = resolveScene(this.state, npc.talk);
      if (sc) this.startScene(sc);
      return true;
    }
    if (target.kind === 'hotspot') {
      const hs = map.hotspots.find((h) => h.id === target.id)!;
      const sc = resolveScene(this.state, hs.examine);
      if (sc) this.startScene(sc);
      return true;
    }
    const ex = map.exits.find((e) => e.id === target.id)!;
    if (!evalCond(this.state, ex.cond)) {
      if (ex.locked) this.startScene(ex.locked);
      return true;
    }
    this.warp(ex.to, ex.spawn);
    return true;
  }

  warp(mapId: string, spawn: string): void {
    const m = this.content.maps[mapId];
    if (!m) throw new Error(`unknown map ${mapId}`);
    const sp = m.spawns[spawn] ?? Object.values(m.spawns)[0];
    this.state.mapId = mapId;
    this.state.player.pos = { ...sp.pos };
    this.state.player.facing = sp.facing;
    this.emit({ type: 'map', mapId });
    this.setBgm(m.bgm);
    if (this.mode === 'field') this.checkTriggers();
  }

  // ---------- scenes ----------

  startScene(id: string): void {
    const scene = this.content.scenes[id];
    if (!scene) throw new Error(`unknown scene ${id}`);
    this.mode = 'scene';
    this.emit({ type: 'scene_start', id });
    this.runner = new SceneRunner(scene, this.state, (c) => this.onCommand(c));
    this.afterStep();
  }

  get view(): SceneView | null {
    return this.mode === 'scene' && this.runner ? this.runner.view : null;
  }

  advance(): void {
    if (!this.runner) return;
    this.runner.advance();
    this.afterStep();
  }

  choose(index: number): void {
    if (!this.runner) return;
    this.runner.choose(index);
    this.afterStep();
  }

  private afterStep(): void {
    if (this.runner && this.runner.done) {
      const id = this.runner.scene.id;
      this.runner = null;
      this.mode = 'field';
      // Times each scene has finished: lets follow-up talks branch on `seen.<scene id>>=1` (DESIGN §4 rule 7).
      const key = `seen.${id}`;
      this.state.vars[key] = (this.state.vars[key] ?? 0) + 1;
      this.emit({ type: 'scene_end', id });
      this.refreshObjective();
      this.checkTriggers();
    }
  }

  /**
   * Objectives are derived from state by content rules (first match wins), so the player can do
   * chores in any order and the objective always names what is actually left to do.
   */
  refreshObjective(force = false): void {
    const rules = this.content.objectives;
    if (!rules) {
      if (force && this.state.objective) this.emit({ type: 'objective', text: this.state.objective });
      return;
    }
    const rule = rules.find((r) => evalCond(this.state, r.cond));
    const text = rule ? interpolate(rule.text, this.state) : '';
    if (force || text !== this.state.objective) {
      this.state.objective = text;
      this.emit({ type: 'objective', text });
    }
  }

  private checkTriggers(): void {
    if (this.mode !== 'field') return;
    const t = this.map.triggers.find((tr) => evalCond(this.state, tr.cond));
    if (t) this.startScene(t.scene);
  }

  private setBgm(id: string): void {
    if (this.state.bgm === id) return;
    this.state.bgm = id;
    this.emit({ type: 'bgm', id });
  }

  private onCommand(c: SceneCommand): void {
    switch (c.name) {
      case 'bgm':
        this.setBgm(c.args[0]);
        break;
      case 'sfx':
        this.emit({ type: 'sfx', id: c.args[0] });
        break;
      case 'objective':
        // Content with objective rules derives the objective from state; @objective is for content without rules.
        if (this.content.objectives) break;
        this.state.objective = c.args[0];
        this.emit({ type: 'objective', text: c.args[0] });
        break;
      case 'toast':
        this.emit({ type: 'toast', text: c.args[0] });
        break;
      case 'cam':
        this.emit({ type: 'cam', args: c.args });
        break;
      case 'emote':
        this.emit({ type: 'emote', who: c.args[0], what: c.args[1] });
        break;
      case 'fx':
        this.emit({ type: 'fx', id: c.args[0], target: c.args[1] ?? 'eddar' });
        break;
      case 'cmd':
        if (c.args[0] === 'exit_npc') this.emit({ type: 'npc_exit', id: c.args[1] });
        break;
      case 'join':
        if (!this.state.party.includes(c.args[0])) this.state.party.push(c.args[0]);
        break;
      case 'leave':
        this.state.party = this.state.party.filter((p) => p !== c.args[0]);
        break;
      case 'give':
        this.state.inventory[c.args[0]] = (this.state.inventory[c.args[0]] ?? 0) + Number(c.args[1] ?? 1);
        break;
      case 'warp':
        this.warp(c.args[0], c.args[1]);
        break;
      default:
        // Unknown presentation-only commands are ignored by the core.
        break;
    }
  }

  // ---------- save / load ----------

  canSave(): boolean {
    return this.mode === 'field';
  }

  save(): SaveData {
    if (!this.canSave()) throw new Error('can only save in the field');
    this.state.rngState = this.rng.state;
    return { state: structuredClone(this.state), savedAt: new Date().toISOString() };
  }

  static load(content: Content, data: SaveData): Game {
    if (data.state.version !== 1) throw new Error('unsupported save version');
    return new Game(content, structuredClone(data.state));
  }
}
