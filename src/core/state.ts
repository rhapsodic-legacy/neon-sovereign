/** The complete, serializable game state. Everything needed to save, load, replay or hand to an AI player. */

export interface Vec2 {
  x: number;
  z: number;
}

export interface LedgerEntry {
  text: string;
  /** Playtime in seconds when written. */
  at: number;
}

export interface GameState {
  version: 1;
  seed: number;
  rngState: number;
  /** Seconds of play. */
  playtime: number;
  mapId: string;
  player: { pos: Vec2; facing: number };
  party: string[];
  flags: Record<string, boolean>;
  /** Numeric variables: alignment (harmony), bonds (bond_rex...), tokens, etc. */
  vars: Record<string, number>;
  inventory: Record<string, number>;
  objective: string;
  ledger: LedgerEntry[];
  bgm: string;
  /** NPCs a scene has moved (`@cmd move_npc`), keyed "<map>:<npc>". Optional so older saves still load. */
  npcPos?: Record<string, Vec2>;
  /** Chatter track progress: next line index and seconds waited. Optional so older saves still load. */
  chatter?: Record<string, { i: number; t: number }>;
}

export function newGameState(seed = 1985): GameState {
  return {
    version: 1,
    seed,
    rngState: seed,
    playtime: 0,
    mapId: 'wyvern',
    player: { pos: { x: 0, z: 3 }, facing: Math.PI },
    party: ['eddar'],
    flags: {},
    vars: { harmony: 0, tokens: 12 },
    inventory: { mop: 1 },
    objective: '',
    ledger: [],
    bgm: '',
  };
}

/**
 * Evaluate a scene/map condition against state.
 *   "flagname"      flag is set
 *   "!flagname"     flag is not set
 *   "var>=3"        numeric comparison (>=, <=, >, <, ==, !=)
 *   "a & b"         all must hold
 */
export function evalCond(state: GameState, cond: string | undefined): boolean {
  if (!cond) return true;
  return cond.split('&').every((partRaw) => {
    const part = partRaw.trim();
    const m = /^([\w.]+)\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)$/.exec(part);
    if (m) {
      const v = state.vars[m[1]] ?? 0;
      const n = Number(m[3]);
      switch (m[2]) {
        case '>=': return v >= n;
        case '<=': return v <= n;
        case '>': return v > n;
        case '<': return v < n;
        case '==': return v === n;
        case '!=': return v !== n;
      }
    }
    if (part.startsWith('!')) return !state.flags[part.slice(1)];
    return !!state.flags[part];
  });
}
