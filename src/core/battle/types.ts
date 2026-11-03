/**
 * THE SET (DESIGN.md §6): data types for the CTB battle system. Headless: no DOM, no Three.js.
 */

export type Side = 'party' | 'enemy';
export type TargetKind = 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_party' | 'none';

export type SkillKind =
  | 'attack' // plain damage
  | 'read' // analyse: reveals HP, weakness, next move
  | 'lift' // Eddar's telekinetic shove: interrupts wind-ups, flips rearing beasts
  | 'heal'
  | 'charge' // Rex: delayed huge hit on his next turn
  | 'defend'
  | 'taunt' // enemies must target the user for a while
  | 'windup' // enemy tell: sets up `then` for its next turn
  | 'rear' // enemy tell: rears up (exposed) and sets up `then`
  | 'meltdown'; // Roxy: needs 100 Heat, hits everything

export interface SkillDef {
  id: string;
  name: string;
  /** One-line description shown in the command menu. */
  desc: string;
  kind: SkillKind;
  target: TargetKind;
  /** Time cost; 100 is a normal action. Lower acts again sooner. */
  delay: number;
  /** Damage multiplier (attack, charge strike, meltdown). */
  power?: number;
  /** Heal amount as a fraction of the target's max HP. */
  heal?: number;
  /** Break gauge damage. */
  breakPower?: number;
  /** Blocked while the user is Muted (Resonance skills, songs). */
  resonance?: boolean;
  /** Status applied to each target on hit. */
  inflict?: { id: string; turns: number };
  /** For windup/rear: the skill this sets up for the user's next turn. */
  then?: string;
  /** Enemy targeting preference. */
  prefer?: 'eddar' | 'weakest' | 'random';
}

export interface UnitDef {
  id: string;
  name: string;
  /** Visual model key (game/characters.ts or a monster builder). */
  model: string;
  side: Side;
  hp: number;
  atk: number;
  def: number;
  /** Speed: 10 is average; turn cost scales with 10/spd. */
  spd: number;
  skills: string[];
  /** Enemy behaviour: skill ids used in order, looping. */
  ai?: string[];
  /** Break gauge size; enemies only. */
  breakMax?: number;
  /** Shown after Read. */
  weakness?: string;
  /** Read text: what this enemy does, in the reader's voice. */
  readNote?: string;
  /** Passive traits: 'big_brother' (covers Eddar), 'heat' (Roxy's resource). */
  traits?: string[];
}

export interface BarkDef {
  who: string;
  text: string;
  /** Optional tutorial hint shown with the bark. */
  hint?: string;
}

export interface BattleDef {
  id: string;
  /** 80s movie-poster title card. */
  title: string;
  tagline: string;
  bgm: string;
  party: string[];
  enemies: string[];
  /** End early (in mercy) when this enemy drops to this fraction of HP. */
  mercy?: { unit: string; hpFraction: number };
  /** Lines fired once, on engine triggers (see Battle.trigger). */
  barks: Record<string, BarkDef>;
  /** Balance-sim bands (DESIGN §6.5): win-rate [min, max] per sim policy. Tests fail when a fight leaves its band. */
  bands?: Partial<Record<'smart' | 'ignore_tells' | 'attack' | 'random', [number, number]>>;
  /** Flag set when won; scene played after the battle. */
  flag: string;
  after?: string;
}

export interface UnitState extends UnitDef {
  maxHp: number;
  /** Time of this unit's next turn. Lowest acts first. */
  next: number;
  statuses: Record<string, number>;
  breakVal: number;
  /** Turns of Broken left (skip turn, +50% damage taken). */
  broken: number;
  heat: number;
  analyzed: boolean;
  /** What this unit will do on its next turn (enemies; visible after Read). */
  intent?: { skill: string; target?: string };
  aiStep: number;
  alive: boolean;
}

export type BattleResult = 'win' | 'mercy' | 'defeat';

export type BattleEvent =
  | { type: 'turn'; unit: string }
  | { type: 'action'; actor: string; skill: string; name: string; targets: string[] }
  | { type: 'damage'; target: string; amount: number; weak?: boolean; exposed?: boolean }
  | { type: 'heal'; target: string; amount: number }
  | { type: 'status'; target: string; id: string; on: boolean }
  | { type: 'break'; target: string }
  | { type: 'interrupt'; target: string; text: string }
  | { type: 'cover'; by: string; for: string }
  | { type: 'read'; target: string }
  | { type: 'heat'; unit: string; value: number }
  | { type: 'ko'; unit: string }
  | { type: 'bark'; who: string; text: string; hint?: string }
  | { type: 'end'; result: BattleResult };
