import { describe, expect, it } from 'vitest';
import { parseScenes } from '../src/core/scene/parser';
import { SceneRunner } from '../src/core/scene/runner';
import { newGameState } from '../src/core/state';
import { Game } from '../src/core/game';
import { loadContent } from '../src/content';
import { act, observe } from '../src/core/wire';
import { autoplay } from '../src/core/autoplay';
import { Rng } from '../src/core/rng';

const inScene = (g: Game) => g.mode === 'scene';

const SRC = `
@scene t.one
# PLOT: test
A: hello
? left -> L {harmony:+2}
? right -> R {set:went_right}
? secret -> S {if:has_key}
* L
A [smile]: went left
@goto done
* R
A: went right
@goto done
* S
A: secret
* done
@if harmony>=2
A: harmonious
@else
A: not harmonious
@endif
@end
`;

describe('scene parser + runner', () => {
  it('parses labels, choices, conditions', () => {
    const [s] = parseScenes(SRC, 'test');
    expect(s.id).toBe('t.one');
    expect(s.notes[0]).toContain('PLOT');
    expect(Object.keys(s.labels)).toEqual(['L', 'R', 'S', 'done']);
  });

  it('runs a branch with effects and if/else', () => {
    const [s] = parseScenes(SRC, 'test');
    const st = newGameState();
    const r = new SceneRunner(s, st, () => {});
    expect(r.view).toMatchObject({ kind: 'line', text: 'hello' });
    r.advance();
    expect(r.view.kind).toBe('choice');
    if (r.view.kind === 'choice') expect(r.view.options.map((o) => o.text)).toEqual(['left', 'right']);
    r.choose(0);
    expect(st.vars.harmony).toBe(2);
    expect(r.view).toMatchObject({ text: 'went left', emotion: 'smile' });
    r.advance();
    expect(r.view).toMatchObject({ text: 'harmonious' });
    r.advance();
    expect(r.done).toBe(true);
  });

  it('takes the else branch and sets flags', () => {
    const [s] = parseScenes(SRC, 'test');
    const st = newGameState();
    const r = new SceneRunner(s, st, () => {});
    r.advance();
    r.choose(1);
    expect(st.flags.went_right).toBe(true);
    r.advance();
    expect(r.view).toMatchObject({ text: 'not harmonious' });
  });

  it('rejects unknown labels with file:line', () => {
    expect(() => parseScenes('@scene x\n? a -> nowhere\n', 'f.scene')).toThrow(/f\.scene:2/);
  });

  it('rng is deterministic', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
  });
});

describe('content', () => {
  it('all scenes parse and every referenced scene exists', () => {
    const c = loadContent();
    const refs: string[] = [];
    for (const m of Object.values(c.maps)) {
      for (const n of m.npcs) refs.push(...(typeof n.talk === 'string' ? [n.talk] : n.talk.map((t) => t.scene)));
      for (const h of m.hotspots) refs.push(...(typeof h.examine === 'string' ? [h.examine] : h.examine.map((t) => t.scene)));
      for (const e of m.exits) if (e.locked) refs.push(e.locked);
      for (const t of m.triggers) refs.push(t.scene);
    }
    for (const r of refs) expect(c.scenes[r], r).toBeDefined();
  });

  it('every speaker is registered', () => {
    const c = loadContent();
    for (const s of Object.values(c.scenes))
      for (const i of s.instrs) if (i.op === 'line') expect(c.speakers[i.speaker], `${s.id}: ${i.speaker}`).toBeDefined();
  });

  it('player spawns are walkable', () => {
    const c = loadContent();
    const g = new Game(c);
    for (const m of Object.values(c.maps)) {
      for (const [name, sp] of Object.entries(m.spawns)) {
        g.state.mapId = m.id;
        g.state.player.pos = { ...sp.pos };
        expect(g.tick(0.1, { x: 0.01, z: 0.01 }) || g.tick(0.1, { x: -1, z: 0 }) || g.tick(0.1, { x: 1, z: 0 }), `${m.id}.${name}`).toBe(true);
      }
    }
  });
});

describe('field + WIRE headless playthrough', () => {
  /** Drive a Game through WIRE (core/autoplay): a plan of targets, and a choice policy that never repeats a dead end. */
  function play(g: Game, plan: string[], done: () => boolean) {
    const tried = new Map<string, number>();
    autoplay(g, plan, done, (gm, options) => {
      const key = `${gm.runner!.scene.id}:${options.join('|')}`;
      const n = tried.get(key) ?? 0;
      tried.set(key, n + 1);
      return options.length - 1 - (n % options.length);
    });
    while (inScene(g)) g.advance();
  }

  const TO_THE_ALLEY = ['puddle_1', 'puddle_2', 'puddle_3', 'lulu_puddle', 'roxy', 'amp', 'amp', 'back_door'];

  it('an AI policy can play the whole opening, inception to Bellshell, through both fights', () => {
    const g = new Game(loadContent());
    g.start();
    const seen = new Set<string>();
    g.on((e) => {
      if (e.type === 'scene_start') seen.add(e.id);
      if (e.type === 'battle_start') seen.add(`battle:${e.id}`);
    });
    play(g, ['puddle_1', 'puddle_2', 'puddle_3', 'lulu_puddle', 'leagues', 'leagues', 'leagues', 'roxy', 'amp', 'amp', 'back_door', 'back_door'], () => !!g.state.flags['p.bellshell_done'] && g.mode === 'field');
    for (const id of ['prologue.trash_call', 'prologue.the_letter', 'battle:dock_crew', 'prologue.after_dock_fight', 'prologue.champion', 'prologue.screams', 'battle:bellshell', 'prologue.bellshell_mercy'])
      expect(seen.has(id), id).toBe(true);
    expect(g.state.flags['p.dock_fight_won']).toBe(true);
    expect(g.state.mapId).toBe('wyvern');
    // Ledger #2,204 to #2,208, in order. No entry after the Bellshell: nobody journals right after nearly dying.
    const nums = g.state.ledger.map((l) => /#2,(\d+)/.exec(l.text)?.[1]);
    expect(nums).toEqual(['204', '205', '206', '207', '208']);
    // talked to the stranger three times: he said it twice, and the Ledger noticed
    expect(g.state.ledger.length).toBe(5);
    expect(observe(g).mode).toBe('field');
    expect(g.state.objective).toMatch(/Main Drag/);
  });

  it('after the alley fight Rex goes in first, and the player walks back in (no warp)', () => {
    const g = new Game(loadContent());
    g.start();
    play(g, TO_THE_ALLEY, () => !!g.state.flags['p.crew_fled'] && g.mode === 'field');
    expect(g.state.mapId).toBe('alley');
    expect(g.state.flags['p.rex_went_in']).toBe(true);
    expect(g.nearby().map((n) => n.id)).not.toContain('rex');
    expect(g.nearby().map((n) => n.id)).toEqual(expect.arrayContaining(['cat', 'box_home', 'dumpster']));
    expect(g.state.objective).toBe('Head back inside.');
    const r = act(g, { type: 'interact', target: 'back_door' });
    expect(r.ok, r.message).toBe(true);
    expect(g.state.mapId).toBe('wyvern');
    expect(g.runner?.scene.id).toBe('prologue.champion');
  });

  it('nobody in the prologue mentions the Hush or Nocturne', () => {
    const c = loadContent();
    for (const s of Object.values(c.scenes))
      for (const i of s.instrs) if (i.op === 'line') expect(i.text, s.id).not.toMatch(/\bHush\b|Nocturne/);
  });

  it('the opening runs in order: puddles, the stranger, Lulu\'s spill, then Roxy and her amp', () => {
    const g = new Game(loadContent());
    g.start();
    while (inScene(g)) g.advance();
    // The cold open is speech bubbles, played while the player has control.
    const bubbles: string[] = [];
    g.on((e) => e.type === 'bubble' && bubbles.push(`${e.who}: ${e.text}`));
    act(g, { type: 'wait', seconds: 12 });
    expect(bubbles[0]).toMatch(/^roxy: Listen up, Wildfires/);
    expect(g.mode).toBe('field');
    // Roxy has no time for Eddar yet, and the back door stays locked.
    act(g, { type: 'interact', target: 'roxy' });
    expect(g.view).toMatchObject({ speaker: 'ROXY', text: expect.stringMatching(/VISUALISING/) });
    while (inScene(g)) g.advance();
    act(g, { type: 'interact', target: 'back_door' });
    expect(g.state.mapId).toBe('wyvern');
    while (inScene(g)) g.advance();
    // Mopping the main puddles brings in the stranger.
    expect(g.state.flags['p.leagues_in']).toBeFalsy();
    play(g, ['puddle_1', 'puddle_2', 'puddle_3'], () => !!g.state.flags['p.leagues_in'] && g.mode === 'field');
    expect(g.state.objective).toBe('Keep mopping.');
    // Then Lulu spills by the stage; mopping it gets the "saint" line and Roxy calls him over.
    play(g, ['lulu_puddle'], () => !!g.state.flags['p.lulu_mopped'] && g.mode === 'field');
    expect(g.state.ledger.map((l) => l.text)).toEqual([expect.stringMatching(/^Entry #2,204/)]);
    act(g, { type: 'wait', seconds: 3 });
    expect(bubbles).toContain('roxy: EDDAR! Come HERE!');
    // The floor is never done: patrons keep spilling, and mopping changes nothing.
    act(g, { type: 'wait', seconds: 45 });
    expect(g.nearby().map((n) => n.id)).toEqual(expect.arrayContaining(['spill_a', 'spill_b', 'spill_c']));
    const before = JSON.stringify({ o: g.state.objective, p: g.state.vars.puddles });
    play(g, ['spill_a'], () => !g.state.flags['p.spill_a']);
    expect(JSON.stringify({ o: g.state.objective, p: g.state.vars.puddles })).toBe(before);
    play(g, ['roxy', 'amp', 'amp'], () => !!g.state.flags['p.trash_called'] && g.mode === 'field');
    expect(g.nearby().some((n) => n.id.startsWith('spill_'))).toBe(false);
  });

  it('Q-style focus cycling reaches everything in reach (the alley back door under the EXIT sign)', () => {
    const g = new Game(loadContent());
    g.start();
    play(g, TO_THE_ALLEY, () => !!g.state.flags['p.crew_fled'] && g.mode === 'field');
    act(g, { type: 'move_to', target: 'exit_sign' });
    const near = g.inRange().map((n) => n.id);
    expect(near).toEqual(expect.arrayContaining(['exit_sign', 'back_door']));
    const seen = new Set<string>();
    for (let i = 0; i < near.length; i++) seen.add(g.cycleFocus()!.id);
    expect([...seen].sort()).toEqual([...near].sort());
    while (g.focus()!.id !== 'back_door') g.cycleFocus();
    g.interact();
    expect(g.state.mapId).toBe('wyvern');
  });

  it('NPCs remember earlier conversations and never repeat on the next talk', () => {
    const g = new Game(loadContent());
    g.start();
    while (inScene(g)) g.advance();
    for (const npc of ['spike', 'lulu', 'gil', 'mama_dee']) {
      const firsts: string[] = [];
      for (let k = 0; k < 3; k++) {
        act(g, { type: 'interact', target: npc });
        const v = g.view!;
        firsts.push(v.kind === 'line' ? v.text : v.kind);
        while (inScene(g)) g.advance();
      }
      expect(new Set(firsts).size, `${npc}: ${firsts.join(' / ')}`).toBe(3);
      expect(g.state.vars[`seen.prologue.${npc}`]).toBe(3);
    }
  });

  it('save/load round-trips state', () => {
    const c = loadContent();
    const g = new Game(c);
    g.start();
    while (inScene(g)) g.advance();
    act(g, { type: 'interact', target: 'puddle_1' });
    while (inScene(g)) g.advance();
    const data = JSON.parse(JSON.stringify(g.save()));
    const g2 = Game.load(c, data);
    expect(g2.state.flags['p.puddle_1']).toBe(true);
    expect(g2.state.player.pos).toEqual(g.state.player.pos);
  });

  it('locked exits play their scene instead of warping', () => {
    const g = new Game(loadContent());
    g.start();
    while (inScene(g)) g.advance();
    const r = act(g, { type: 'interact', target: 'back_door' });
    expect(r.ok).toBe(true);
    expect(inScene(g)).toBe(true);
    while (inScene(g)) g.advance();
    expect(g.state.mapId).toBe('wyvern');
  });
});

describe('test warps', () => {
  it('every checkpoint builds, and lands where it says', async () => {
    const { CHECKPOINTS, buildCheckpoint } = await import('../src/content/checkpoints');
    const c = loadContent();
    for (const cp of CHECKPOINTS) {
      const { game, then } = buildCheckpoint(c, cp.id);
      game.start();
      then?.(game);
      expect(['field', 'scene', 'battle'], cp.id).toContain(game.mode);
    }
    const alley = buildCheckpoint(c, 'after_alley').game;
    expect(alley.state.mapId).toBe('alley');
    expect(alley.state.flags['p.crew_fled']).toBe(true);
    const crab = buildCheckpoint(c, 'bellshell');
    crab.game.start();
    crab.then!(crab.game);
    expect(crab.game.battle?.def.id).toBe('bellshell');
    expect(crab.game.state.party).toContain('roxy');
  });
});
