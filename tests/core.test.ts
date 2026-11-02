import { describe, expect, it } from 'vitest';
import { parseScenes } from '../src/core/scene/parser';
import { SceneRunner } from '../src/core/scene/runner';
import { newGameState } from '../src/core/state';
import { Game } from '../src/core/game';
import { loadContent } from '../src/content';
import { act, describe as wireDescribe, observe } from '../src/core/wire';
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
  /** Drive a Game through WIRE: a plan of targets to interact with, and a choice policy that never repeats a dead end. */
  function play(g: Game, plan: string[], done: () => boolean) {
    const tried = new Map<string, number>();
    let steps = 0;
    while (!done() && steps++ < 3000) {
      if (g.mode === 'scene') {
        const v = g.view!;
        if (v.kind === 'choice') {
          const key = `${g.runner!.scene.id}:${v.options.map((o) => o.text).join('|')}`;
          const n = tried.get(key) ?? 0;
          tried.set(key, n + 1);
          act(g, { type: 'choose', index: v.options.length - 1 - (n % v.options.length) });
        } else act(g, { type: 'advance' });
        continue;
      }
      const target = plan.shift();
      expect(target, `stuck: ${wireDescribe(g)}`).toBeDefined();
      const r = act(g, { type: 'interact', target: target! });
      expect(r.ok, `${target}: ${r.message}\n${wireDescribe(g)}`).toBe(true);
    }
    while (inScene(g)) g.advance();
  }

  it('an AI policy can finish build 0.2 end to end', () => {
    const g = new Game(loadContent());
    g.start();
    play(g, ['puddle_1', 'puddle_2', 'puddle_3', 'roxy', 'amp', 'amp', 'back_door', 'dumpster'], () => !!g.state.flags['p.sable_seen']);
    expect(g.state.flags['p.amp_fixed']).toBe(true);
    expect(g.state.flags['p.letter_done']).toBe(true);
    expect(g.state.flags['p.sable_seen']).toBe(true);
    expect(g.state.ledger.length).toBeGreaterThanOrEqual(7);
    expect(observe(g).mode).toBe('field');
  });

  it('chores work in any order, and the back door waits for both', () => {
    const g = new Game(loadContent());
    g.start();
    play(g, ['amp', 'roxy', 'amp', 'amp'], () => !!g.state.flags['p.amp_fixed']);
    expect(g.state.flags['p.amp_fixed']).toBe(true);
    expect(g.state.objective).toContain('0/3');
    // Floor not mopped: the back door is still locked and says why.
    act(g, { type: 'interact', target: 'back_door' });
    expect(inScene(g)).toBe(true);
    expect(g.view).toMatchObject({ speaker: 'MAMA DEE' });
    while (inScene(g)) g.advance();
    expect(g.state.mapId).toBe('wyvern');
    play(g, ['puddle_1', 'puddle_2', 'puddle_3'], () => (g.state.vars.puddles ?? 0) >= 3);
    expect(g.state.objective).toContain('back door');
    play(g, ['back_door'], () => !!g.state.flags['p.letter_done']);
    expect(g.state.mapId).toBe('alley');
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
