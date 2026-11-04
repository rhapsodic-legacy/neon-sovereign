import type { Game } from './game';
import { act, describe } from './wire';

/** Picks a reply when a scene offers a choice. Default: the first option. */
export type Chooser = (g: Game, options: string[]) => number;

/**
 * Plays the game headlessly through WIRE: interacts with each target in `plan` in turn, auto-battles,
 * advances scenes, and waits whenever the next target isn't there yet (chatter, spills and entrances run
 * on the clock). Stops when `done` holds. Used by tests and by the test warps (content/checkpoints.ts).
 */
export function autoplay(g: Game, plan: string[], done: () => boolean, choose: Chooser = () => 0, maxSteps = 4000): void {
  const todo = [...plan];
  let waited = 0;
  for (let steps = 0; !done(); steps++) {
    if (steps > maxSteps) throw new Error(`autoplay: ran out of steps\n${describe(g)}`);
    if (g.mode === 'battle') {
      const r = act(g, { type: 'auto_battle' });
      if (!r.ok) throw new Error(`autoplay: ${r.message}`);
      continue;
    }
    if (g.mode === 'scene') {
      const v = g.view!;
      if (v.kind === 'choice') act(g, { type: 'choose', index: choose(g, v.options.map((o) => o.text)) });
      else act(g, { type: 'advance' });
      continue;
    }
    const target = todo[0];
    if (target === undefined) {
      // nothing left to do but let the room run (bubbles, spills, entrances)
      if (++waited > 120) throw new Error(`autoplay: stuck with an empty plan\n${describe(g)}`);
      act(g, { type: 'wait', seconds: 1 });
      continue;
    }
    if (!g.nearby().some((n) => n.id === target)) {
      if (++waited > 120) throw new Error(`autoplay: "${target}" never appeared\n${describe(g)}`);
      act(g, { type: 'wait', seconds: 1 });
      continue;
    }
    waited = 0;
    todo.shift();
    const r = act(g, { type: 'interact', target });
    if (!r.ok) throw new Error(`autoplay: ${target}: ${r.message}\n${describe(g)}`);
  }
  while (g.mode === 'scene' && g.view?.kind !== 'choice') g.advance();
}
