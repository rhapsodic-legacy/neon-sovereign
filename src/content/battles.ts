import type { BattleData } from '../core/battle/engine';
import type { BattleDef, SkillDef, UnitDef } from '../core/battle/types';

/**
 * Prologue battles (storyboard v2): the dock crew tutorial in the alley, and the Bellshell in the Wyvern.
 * Numbers are tuned by tests/battle.test.ts (balance bands, DESIGN §6.5).
 */

const skills: SkillDef[] = [
  // --- Eddar: clever, kind, weak hands, superb eyes ---
  { id: 'lid_bash', name: 'Lid Bash', desc: 'Swing the dented trash-can lid. Weak, but quick.', kind: 'attack', target: 'enemy', delay: 85, power: 0.9, breakPower: 10 },
  { id: 'read', name: 'Read', desc: "Study a foe: reveals HP, weakness and its next move.", kind: 'read', target: 'enemy', delay: 60 },
  { id: 'lift', name: 'Lift', desc: 'A shove from nowhere. Interrupts a foe that is winding up.', kind: 'lift', target: 'enemy', delay: 100, power: 0.6, breakPower: 25, resonance: true },
  { id: 'patch', name: 'Patch', desc: 'Field-fix an ally: heals 35% HP.', kind: 'heal', target: 'ally', delay: 100, heal: 0.35, resonance: true },
  { id: 'defend', name: 'Defend', desc: 'Brace. Halves damage until your next turn.', kind: 'defend', target: 'self', delay: 70 },
  // --- Rex: big hands, bigger ego ---
  { id: 'strike', name: 'Knuckle Sandwich', desc: 'A big, honest punch.', kind: 'attack', target: 'enemy', delay: 100, power: 1.25, breakPower: 20 },
  { id: 'charge', name: 'Charge', desc: 'Wind up a huge hit that lands on his next turn. Watch the timeline.', kind: 'charge', target: 'none', delay: 55 },
  { id: 'charge_strike', name: 'Charge!', desc: 'The Valor Express.', kind: 'attack', target: 'enemy', delay: 110, power: 3.0, breakPower: 60, prefer: 'weakest' },
  { id: 'showboat', name: 'Showboat', desc: 'Strike a pose. Enemies must target Rex for two turns.', kind: 'taunt', target: 'self', delay: 70 },
  // --- Roxy: speed and heat ---
  { id: 'axe_riff', name: 'Axe Riff', desc: 'A fast swing of the axe-headed flying-V. Builds Heat.', kind: 'attack', target: 'enemy', delay: 75, power: 0.95, breakPower: 15 },
  { id: 'meltdown', name: 'Meltdown Solo', desc: 'At 100 Heat: a solo that sets everything on fire.', kind: 'meltdown', target: 'all_enemies', delay: 120, power: 2.4, breakPower: 40 },
  // --- the dock crew ---
  { id: 'jab', name: 'Jab', desc: '', kind: 'attack', target: 'enemy', delay: 90, power: 0.85 },
  { id: 'wind_up', name: 'Winds Up…', desc: '', kind: 'windup', target: 'none', delay: 80, then: 'haymaker' },
  { id: 'haymaker', name: 'Haymaker', desc: '', kind: 'attack', target: 'enemy', delay: 110, power: 2.3 },
  { id: 'shove', name: 'Shove', desc: '', kind: 'attack', target: 'enemy', delay: 100, power: 1.0, prefer: 'eddar' },
  { id: 'hook_swipe', name: 'Hook Swipe', desc: '', kind: 'attack', target: 'enemy', delay: 90, power: 0.8 },
  // --- the Bellshell ---
  { id: 'pinch', name: 'Pinch', desc: '', kind: 'attack', target: 'enemy', delay: 100, power: 1.0 },
  { id: 'rear', name: 'Rears Up…', desc: '', kind: 'rear', target: 'none', delay: 80, then: 'toll' },
  { id: 'toll', name: 'TOLL', desc: '', kind: 'attack', target: 'all_party', delay: 120, power: 2.0, inflict: { id: 'mute', turns: 2 } },
  { id: 'shell_ram', name: 'Shell Ram', desc: '', kind: 'attack', target: 'enemy', delay: 110, power: 1.5, prefer: 'weakest' },
];

const units: UnitDef[] = [
  { id: 'eddar', name: 'Eddar', model: 'eddar', side: 'party', hp: 130, atk: 8, def: 4, spd: 11, skills: ['lid_bash', 'read', 'lift', 'patch', 'defend'] },
  { id: 'rex', name: 'Rex', model: 'rex', side: 'party', hp: 240, atk: 15, def: 9, spd: 9, skills: ['strike', 'charge', 'showboat', 'defend'], traits: ['big_brother'] },
  { id: 'roxy', name: 'Roxy', model: 'roxy', side: 'party', hp: 160, atk: 13, def: 5, spd: 13, skills: ['axe_riff', 'meltdown', 'defend'], traits: ['heat'] },
  { id: 'vinnie', name: 'Vinnie', model: 'vinnie', side: 'enemy', hp: 140, atk: 14, def: 4, spd: 10, skills: [], ai: ['jab', 'wind_up', 'jab'],
    breakMax: 60, weakness: 'Hates being interrupted', readNote: 'He breathes before he swings. When he winds up, the next blow is heavy. Lift him off his feet first.' },
  { id: 'brick', name: 'Brick', model: 'brick', side: 'enemy', hp: 180, atk: 14, def: 8, spd: 8, skills: [], ai: ['shove', 'shove', 'jab'],
    breakMax: 70, weakness: 'Slow. Big hits break him', readNote: 'A wall with opinions. He goes for whoever looks weakest, which is, regrettably, me.' },
  { id: 'moss', name: 'Moss', model: 'moss', side: 'enemy', hp: 100, atk: 13, def: 3, spd: 12, skills: [], ai: ['hook_swipe', 'hook_swipe', 'jab'],
    breakMax: 40, weakness: 'Fragile', readNote: 'Quick hands, glass jaw. The hook is for show; the show is for him.' },
  { id: 'bellshell', name: 'Bellshell', model: 'bellshell', side: 'enemy', hp: 1100, atk: 25, def: 10, spd: 9, skills: [], ai: ['pinch', 'rear', 'shell_ram', 'pinch', 'rear'],
    breakMax: 140, weakness: 'Soft underside while rearing',
    readNote: 'When it lifts to ring, its belly is bare: strike then, or lift it over. If it tolls, we lose our voices.' },
];

export const dockCrew: BattleDef = {
  id: 'dock_crew',
  title: 'THE DOCK CREW',
  tagline: 'They lift crates. They hold grudges.',
  bgm: 'battle_alley',
  party: ['eddar', 'rex'],
  enemies: ['vinnie', 'brick', 'moss'],
  // The tutorial must be winnable by mashing; reading and lifting should make it clean.
  bands: { smart: [0.95, 1], attack: [0.85, 1], random: [0, 0.4] },
  flag: 'p.dock_fight_won',
  after: 'prologue.after_dock_fight',
  barks: {
    start: { who: 'EDDAR', text: 'Watch the order of things, Rex. Every blow has its hour.', hint: 'The timeline at the top shows who acts next. Faster actions come round again sooner.' },
    'turn:eddar': { who: 'EDDAR', text: "He breathes before he swings. He's winding up for something heavy.", hint: 'Try READ on Vinnie: it shows his HP, weakness and next move.' },
    read: { who: 'EDDAR', text: "Next turn, he'll throw everything at you. Unless he can't.", hint: "A foe's next move now shows above it. Wind-ups can be interrupted with LIFT." },
    'tell:vinnie': { who: 'VINNIE', text: 'Hold still, mop boy...', hint: 'Vinnie is winding up a Haymaker. LIFT him now to interrupt it.' },
    interrupt: { who: 'EDDAR', text: 'Gravity, Vinnie, is only a suggestion.' },
    cover: { who: 'REX', text: "Hey! What'd I JUST say? Nobody pushes Adder around but me!", hint: "BIG BROTHER: Rex steps in front of attacks aimed at Eddar." },
    'turn:rex': { who: 'REX', text: 'Stand back, Adder. This is gonna be beautiful.', hint: 'CHARGE winds up a huge hit that lands on Rex\'s next turn. The timeline previews it.' },
    charge_land: { who: 'REX', text: "And THAT'S how the Valor does it!" },
    'hurt:rex': { who: 'EDDAR', text: "Hold still. This will sting, and then you'll be insufferable again.", hint: 'PATCH heals an ally.' },
    'hurt:eddar': { who: 'REX', text: 'Adder! Defend, ya dweeb!', hint: 'DEFEND halves damage until your next turn.' },
    break: { who: 'EDDAR', text: "He's broken. Strike now, while he can't answer.", hint: 'BREAK: a broken foe loses its turn and takes 50% more damage.' },
    defeat: { who: 'EDDAR', text: 'A tactical retreat into unconsciousness. Again, then.' },
  },
};

export const bellshellFight: BattleDef = {
  id: 'bellshell',
  title: 'BELLSHELL',
  tagline: 'It used to ring the tide in.',
  bgm: 'battle_bellshell',
  party: ['eddar', 'rex', 'roxy'],
  enemies: ['bellshell'],
  mercy: { unit: 'bellshell', hpFraction: 0.1 },
  // Storyboard v2: a player who ignores the Toll should lose about one run in ten; mashing should mostly lose.
  // (A prologue mini-boss, so mechanic-aware play sits above the usual boss band of 80-95%.)
  bands: { smart: [0.95, 1], ignore_tells: [0.8, 0.97], attack: [0, 0.4], random: [0, 0.5] },
  flag: 'p.bellshell_done',
  after: 'prologue.bellshell_mercy',
  barks: {
    start: { who: 'ROXY', text: "Stand back, boys. I'm gonna play this thing like a SOLO." },
    read: { who: 'EDDAR', text: "When it lifts to ring, its belly's bare. Strike then, or suffer its song.", hint: 'Hits on a REARING foe deal 50% more. LIFT flips it over and BREAKS it.' },
    'tell:bellshell': { who: 'EDDAR', text: "It's rearing! Now, before it rings!" },
    'lift_rear:bellshell': { who: 'EDDAR', text: 'Over you go, old bell. Gently, now.' },
    mute: { who: 'EDDAR', text: "My voice... I can't find the note.", hint: 'MUTE: Resonance skills (Lift, Patch) are blocked for two turns.' },
    roxy_rex_hit: { who: 'ROXY', text: 'HEY. Only I get to hit Rex!', hint: "HEAT: Roxy's Heat climbs when she or her friends get hurt." },
    heat_max: { who: 'ROXY', text: 'Oh, I am ON FIRE now.', hint: 'At 100 Heat, MELTDOWN SOLO is ready.' },
    meltdown: { who: 'ROXY', text: 'SWEET. SCREAMING. AMPLIFIERS!' },
    break: { who: 'REX', text: "It's on its back! Pile on!" },
    defeat: { who: 'ROXY', text: 'Not. Like. THIS. Again!' },
  },
};

export const BATTLES: Record<string, BattleDef> = { dock_crew: dockCrew, bellshell: bellshellFight };

export const BATTLE_DATA: BattleData = {
  units: Object.fromEntries(units.map((u) => [u.id, u])),
  skills: Object.fromEntries(skills.map((s) => [s.id, s])),
};
