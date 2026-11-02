import { ChoiceOption, Effects, Instr, Scene, SceneParseError } from './types';

/**
 * Scene DSL — see docs/SCENES.md for the full reference.
 *
 *   @scene prologue.the_letter
 *   # PLOT: ...  CHARACTER: ...
 *   REX [smug]: Okay, Adder. Write this down.
 *   LEDGER: Entry #2,205: ...
 *   ? Write it beautifully -> beautiful {harmony:+2}
 *   * beautiful
 *   @flag prologue.letter_written
 *   @end
 */

const SPEAKER_RE = /^([A-Z][A-Z0-9_ .'-]*?)(?:\s*\[([a-z_]+)\])?\s*:\s*(.*)$/;
const CHOICE_RE = /^\?\s*(.+?)\s*->\s*([\w.]+)\s*(\{.*\})?\s*$/;

interface PendingJump {
  instrIndex: number;
  label: string;
  line: number;
  optionIndex?: number;
}

export function parseScenes(source: string, file = '<scene>'): Scene[] {
  const scenes: Scene[] = [];
  let cur: Scene | null = null;
  let pending: PendingJump[] = [];
  const ifStack: { jumpUnlessIdx: number; elseJumpIdx?: number; line: number }[] = [];

  const finish = (line: number) => {
    if (!cur) return;
    if (ifStack.length) throw new SceneParseError(`unclosed @if in scene ${cur.id}`, file, ifStack[0].line);
    const last = cur.instrs[cur.instrs.length - 1];
    if (!last || last.op !== 'end') cur.instrs.push({ op: 'end', src: line });
    for (const p of pending) {
      const target = cur.labels[p.label];
      if (target === undefined) throw new SceneParseError(`unknown label "${p.label}"`, file, p.line);
      const ins = cur.instrs[p.instrIndex];
      if (ins.op === 'choice' && p.optionIndex !== undefined) ins.options[p.optionIndex].target = target;
      else if (ins.op === 'jump') ins.target = target;
    }
    scenes.push(cur);
    cur = null;
    pending = [];
  };

  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('@scene ')) {
      finish(lineNo);
      cur = { id: line.slice(7).trim(), notes: [], instrs: [], labels: {} };
      continue;
    }
    if (!cur) {
      if (line.startsWith('#')) continue;
      throw new SceneParseError('content before first @scene', file, lineNo);
    }
    const s: Scene = cur;

    if (line.startsWith('#')) {
      s.notes.push(line.replace(/^#\s?/, ''));
      continue;
    }
    if (line.startsWith('* ')) {
      const label = line.slice(2).trim();
      if (s.labels[label] !== undefined) throw new SceneParseError(`duplicate label "${label}"`, file, lineNo);
      s.labels[label] = s.instrs.length;
      continue;
    }
    if (line.startsWith('?')) {
      const m = CHOICE_RE.exec(line);
      if (!m) throw new SceneParseError('bad choice syntax; expected "? text -> label {effects}"', file, lineNo);
      const opt = parseChoiceOption(m[1], m[3], file, lineNo);
      const prev = s.instrs[s.instrs.length - 1];
      const prevIsChoice = prev && prev.op === 'choice' && lines[i - 1]?.trim().startsWith('?');
      let instrIndex: number;
      let optionIndex: number;
      if (prevIsChoice && prev.op === 'choice') {
        prev.options.push(opt);
        instrIndex = s.instrs.length - 1;
        optionIndex = prev.options.length - 1;
      } else {
        s.instrs.push({ op: 'choice', options: [opt], src: lineNo });
        instrIndex = s.instrs.length - 1;
        optionIndex = 0;
      }
      pending.push({ instrIndex, label: m[2], line: lineNo, optionIndex });
      continue;
    }
    if (line.startsWith('@')) {
      const [cmd, ...rest] = line.slice(1).split(/\s+/);
      const restStr = line.slice(1 + cmd.length).trim();
      switch (cmd) {
        case 'end':
          s.instrs.push({ op: 'end', src: lineNo });
          break;
        case 'goto':
          pending.push({ instrIndex: s.instrs.length, label: rest[0], line: lineNo });
          s.instrs.push({ op: 'jump', target: -1, src: lineNo });
          break;
        case 'flag':
          s.instrs.push({ op: 'flag', key: req(rest[0], 'flag name'), value: true, src: lineNo });
          break;
        case 'unflag':
          s.instrs.push({ op: 'flag', key: req(rest[0], 'flag name'), value: false, src: lineNo });
          break;
        case 'set': {
          const m = /^([\w.]+)\s*(\+=|-=|=)\s*(-?\d+(?:\.\d+)?)$/.exec(restStr);
          if (!m) throw new SceneParseError('bad @set; expected "@set var += 2"', file, lineNo);
          s.instrs.push({ op: 'set', key: m[1], mode: m[2] as '=' | '+=' | '-=', value: Number(m[3]), src: lineNo });
          break;
        }
        case 'card':
          s.instrs.push({ op: 'card', text: restStr, src: lineNo });
          break;
        case 'if':
          ifStack.push({ jumpUnlessIdx: s.instrs.length, line: lineNo });
          s.instrs.push({ op: 'jumpUnless', cond: req(restStr, 'condition'), target: -1, src: lineNo });
          break;
        case 'else': {
          const top = ifStack[ifStack.length - 1];
          if (!top) throw new SceneParseError('@else without @if', file, lineNo);
          top.elseJumpIdx = s.instrs.length;
          s.instrs.push({ op: 'jump', target: -1, src: lineNo });
          (s.instrs[top.jumpUnlessIdx] as Extract<Instr, { op: 'jumpUnless' }>).target = s.instrs.length;
          break;
        }
        case 'endif': {
          const top = ifStack.pop();
          if (!top) throw new SceneParseError('@endif without @if', file, lineNo);
          if (top.elseJumpIdx !== undefined) {
            (s.instrs[top.elseJumpIdx] as Extract<Instr, { op: 'jump' }>).target = s.instrs.length;
          } else {
            (s.instrs[top.jumpUnlessIdx] as Extract<Instr, { op: 'jumpUnless' }>).target = s.instrs.length;
          }
          break;
        }
        default:
          // Engine commands: @bgm, @location, @join, @leave, @objective, @cam, @emote, @sfx, @move, @give, @warp ...
          s.instrs.push({ op: 'cmd', name: cmd, args: cmd === 'objective' || cmd === 'toast' ? [restStr] : rest, src: lineNo });
      }
      continue;
    }
    const m = SPEAKER_RE.exec(line);
    if (m) {
      s.instrs.push({ op: 'line', speaker: m[1].trim(), emotion: m[2], text: m[3], src: lineNo });
      continue;
    }
    throw new SceneParseError(`unrecognised line: ${raw}`, file, lineNo);
  }
  finish(lines.length);
  return scenes;

  function req(v: string | undefined, what: string): string {
    if (!v) throw new SceneParseError(`missing ${what}`, file, 0);
    return v;
  }
}

function parseChoiceOption(text: string, braces: string | undefined, file: string, line: number): ChoiceOption {
  const effects: Effects = {};
  const sets: string[] = [];
  let cond: string | undefined;
  if (braces) {
    const body = braces.slice(1, -1).trim();
    if (body) {
      for (const part of body.split(',')) {
        const idx = part.indexOf(':');
        if (idx < 0) throw new SceneParseError(`bad effect "${part}"`, file, line);
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k === 'if') cond = v;
        else if (k === 'set') sets.push(v);
        else {
          const n = Number(v);
          if (Number.isNaN(n)) throw new SceneParseError(`effect "${k}" needs a number`, file, line);
          effects[k] = n;
        }
      }
    }
  }
  return { text, target: -1, effects, sets, cond };
}
