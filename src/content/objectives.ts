/**
 * The objective line is derived from flags, never set by individual scenes, so it always names what is
 * actually left to do no matter what order the player does things in. First matching rule wins.
 */
export const OBJECTIVES: { cond: string; text: string }[] = [
  // After the Bellshell (end of build 0.3)
  { cond: 'p.bellshell_done', text: 'The Wyvern is wrecked and the Bay is screaming. (The side room, the stairs and the Main Drag come next.)' },
  { cond: 'p.screams', text: 'Stop the Bellshell before it wrecks the Wyvern.' },
  { cond: 'p.dock_fight_won', text: 'Head back inside with Rex.' },
  // Alley
  { cond: 'p.letter_done', text: 'Hold the alley with Rex.' },
  { cond: 'p.trash_called', text: 'Take the trash out the back door (stage right, under the EXIT sign).' },
  // Wyvern, in any order
  { cond: 'p.amp_fixed', text: 'Mop the cola before doors open. ({puddles}/3)' },
  { cond: 'p.amp_hum_back', text: "The hum is back. Have another look at Roxy's amp." },
  { cond: 'p.amp_checked & puddles>=3', text: "Fix the hum in Roxy's amp." },
  { cond: 'p.amp_checked', text: "Fix the hum in Roxy's amp, and mop the cola. ({puddles}/3)" },
  { cond: 'puddles>=3', text: 'Find out why Roxy is yelling at her amp.' },
  { cond: 'p.intro', text: 'Mop the cola puddles before doors. ({puddles}/3)' },
];
