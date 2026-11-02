import { evalCond, GameState } from '../state';
import { Scene } from './types';

/** What the player is being shown right now while a scene runs. */
export type SceneView =
  | { kind: 'line'; speaker: string; emotion?: string; text: string }
  | { kind: 'card'; text: string }
  | { kind: 'choice'; options: { index: number; text: string }[] }
  | { kind: 'end' };

/** Fire-and-forget engine commands emitted by scenes (@bgm, @cam, @sfx, @warp...). */
export interface SceneCommand {
  name: string;
  args: string[];
}

export interface RunnerSnapshot {
  sceneId: string;
  pc: number;
}

/**
 * Executes a compiled scene against game state. Pure logic: no DOM, no timers.
 * Blocks on lines, cards and choices; everything else runs immediately.
 */
export class SceneRunner {
  private pc = 0;
  private visibleOptions: number[] = [];
  view: SceneView = { kind: 'end' };

  constructor(
    readonly scene: Scene,
    private readonly state: GameState,
    private readonly onCommand: (cmd: SceneCommand) => void,
    startPc = 0,
  ) {
    this.pc = startPc;
    this.run();
  }

  get snapshot(): RunnerSnapshot {
    return { sceneId: this.scene.id, pc: this.pc };
  }

  get done(): boolean {
    return this.view.kind === 'end';
  }

  /** Continue past the current line or card. */
  advance(): void {
    if (this.view.kind === 'line' || this.view.kind === 'card') {
      this.pc++;
      this.run();
    }
  }

  /** Pick a visible choice by its index in view.options. */
  choose(index: number): void {
    if (this.view.kind !== 'choice') throw new Error('no choice pending');
    const optIdx = this.visibleOptions[index];
    if (optIdx === undefined) throw new Error(`invalid choice ${index}`);
    const ins = this.scene.instrs[this.pc];
    if (ins.op !== 'choice') throw new Error('runner out of sync');
    const opt = ins.options[optIdx];
    for (const [k, v] of Object.entries(opt.effects)) this.state.vars[k] = (this.state.vars[k] ?? 0) + v;
    for (const f of opt.sets) this.state.flags[f] = true;
    this.pc = opt.target;
    this.run();
  }

  private run(): void {
    const { instrs } = this.scene;
    for (let guard = 0; guard < 10000; guard++) {
      const ins = instrs[this.pc];
      if (!ins) {
        this.view = { kind: 'end' };
        return;
      }
      switch (ins.op) {
        case 'line':
          if (ins.speaker === 'LEDGER') this.state.ledger.push({ text: ins.text, at: this.state.playtime });
          this.view = { kind: 'line', speaker: ins.speaker, emotion: ins.emotion, text: interpolate(ins.text, this.state) };
          return;
        case 'card':
          this.view = { kind: 'card', text: ins.text };
          return;
        case 'choice': {
          this.visibleOptions = [];
          ins.options.forEach((o, i) => {
            if (evalCond(this.state, o.cond)) this.visibleOptions.push(i);
          });
          this.view = {
            kind: 'choice',
            options: this.visibleOptions.map((oi, i) => ({ index: i, text: ins.options[oi].text })),
          };
          return;
        }
        case 'set': {
          const cur = this.state.vars[ins.key] ?? 0;
          this.state.vars[ins.key] = ins.mode === '=' ? ins.value : ins.mode === '+=' ? cur + ins.value : cur - ins.value;
          this.pc++;
          break;
        }
        case 'flag':
          this.state.flags[ins.key] = ins.value;
          this.pc++;
          break;
        case 'jump':
          this.pc = ins.target;
          break;
        case 'jumpUnless':
          this.pc = evalCond(this.state, ins.cond) ? this.pc + 1 : ins.target;
          break;
        case 'cmd':
          this.onCommand({ name: ins.name, args: ins.args });
          this.pc++;
          break;
        case 'end':
          this.view = { kind: 'end' };
          return;
      }
    }
    throw new Error(`scene ${this.scene.id}: runaway loop`);
  }
}

/** Replace {var} with numeric state vars (e.g. "{tokens} tokens"). */
export function interpolate(text: string, state: GameState): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(state.vars[k] ?? 0));
}
