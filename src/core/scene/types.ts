/** Compiled scene instructions. Produced by the parser, executed by the runner. */

export type Effects = Record<string, number>;

export interface ChoiceOption {
  text: string;
  /** Instruction index to jump to (resolved from a label). */
  target: number;
  /** Var deltas applied when chosen, e.g. { harmony: 2, bond_rex: -1 }. */
  effects: Effects;
  /** Flags set when chosen. */
  sets: string[];
  /** Option only shown if this condition holds. */
  cond?: string;
}

export type Instr =
  | { op: 'line'; speaker: string; emotion?: string; text: string; src: number }
  | { op: 'card'; text: string; src: number }
  | { op: 'choice'; options: ChoiceOption[]; src: number }
  | { op: 'set'; key: string; mode: '=' | '+=' | '-='; value: number; src: number }
  | { op: 'flag'; key: string; value: boolean; src: number }
  | { op: 'jump'; target: number; src: number }
  | { op: 'jumpUnless'; cond: string; target: number; src: number }
  | { op: 'cmd'; name: string; args: string[]; src: number }
  | { op: 'end'; src: number };

export interface Scene {
  id: string;
  /** Header comments (PLOT / CHARACTER purpose). */
  notes: string[];
  instrs: Instr[];
  labels: Record<string, number>;
}

export class SceneParseError extends Error {
  constructor(
    message: string,
    public readonly file: string,
    public readonly line: number,
  ) {
    super(`${file}:${line}: ${message}`);
  }
}
