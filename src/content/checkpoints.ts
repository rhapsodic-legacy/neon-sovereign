import { autoplay } from '../core/autoplay';
import { Game } from '../core/game';
import type { Content } from './index';

/**
 * Test warps (Jesse's 0.3b notes): jump straight to a section of the opening. Each one plays the game
 * headlessly up to a point (the same autoplay the tests use, so a warp is a real playthrough, not a
 * hand-made save), then hands over a fresh game at that state and runs its `then` step live.
 */
export interface Checkpoint {
  id: string;
  label: string;
  plan: string[];
  until: (g: Game) => boolean;
  then?: (g: Game) => void;
}

const field = (g: Game) => g.mode === 'field';
const flag = (g: Game, f: string) => !!g.state.flags[f];
const inBattle = (g: Game, id: string) => g.mode === 'battle' && g.battle?.def.id === id;
const TO_LULU = ['puddle_1', 'puddle_2', 'puddle_3', 'lulu_puddle'];
const TO_ALLEY = [...TO_LULU, 'roxy', 'amp', 'amp'];

export const CHECKPOINTS: Checkpoint[] = [
  { id: 'cold_open', label: 'Cold open (new game)', plan: [], until: () => true },
  { id: 'stranger', label: 'The stranger walks in', plan: ['puddle_1', 'puddle_2'], until: (g) => field(g) && (g.state.vars.puddles ?? 0) >= 2, then: (g) => g.startScene('prologue.puddle_3') },
  { id: 'lulu', label: "Lulu's spill", plan: ['puddle_1', 'puddle_2', 'puddle_3'], until: (g) => field(g) && flag(g, 'p.lulu_spill') },
  { id: 'roxy_amp', label: "Roxy's amp", plan: TO_LULU, until: (g) => field(g) && flag(g, 'p.lulu_mopped') },
  { id: 'alley', label: 'Out back: the letter', plan: TO_ALLEY, until: (g) => field(g) && flag(g, 'p.trash_called'), then: (g) => g.warp('alley', 'from_wyvern') },
  { id: 'dock_fight', label: 'The alley fight', plan: [...TO_ALLEY, 'back_door'], until: (g) => inBattle(g, 'dock_crew'), then: (g) => g.startBattle('dock_crew') },
  { id: 'after_alley', label: 'After the alley fight (walk back in)', plan: [...TO_ALLEY, 'back_door'], until: (g) => field(g) && flag(g, 'p.crew_fled') },
  { id: 'champion', label: 'The Champion', plan: [...TO_ALLEY, 'back_door'], until: (g) => field(g) && flag(g, 'p.crew_fled'), then: (g) => g.warp('wyvern', 'from_alley') },
  { id: 'screams', label: 'The screams and the masked woman', plan: [...TO_ALLEY, 'back_door', 'back_door'], until: (g) => g.runner?.scene.id === 'prologue.screams' },
  { id: 'bellshell', label: 'The Bellshell fight', plan: [...TO_ALLEY, 'back_door', 'back_door'], until: (g) => inBattle(g, 'bellshell'), then: (g) => g.startBattle('bellshell') },
  { id: 'after_bellshell', label: 'After the Bellshell', plan: [...TO_ALLEY, 'back_door', 'back_door'], until: (g) => field(g) && flag(g, 'p.bellshell_done') },
];

/** Play headlessly to the checkpoint and return a fresh Game at that state. Call `then` once it's bound. */
export function buildCheckpoint(content: Content, id: string): { game: Game; then?: (g: Game) => void } {
  const cp = CHECKPOINTS.find((c) => c.id === id);
  if (!cp) throw new Error(`unknown checkpoint ${id}`);
  const g = new Game(content);
  g.start();
  if (cp.plan.length || !cp.until(g)) autoplay(g, cp.plan, () => cp.until(g));
  // a clean game at that state: scenes and battles in flight are dropped and replayed by `then` (or a trigger)
  return { game: new Game(content, structuredClone(g.state)), then: cp.then };
}
