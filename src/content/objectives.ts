/**
 * The objective line is derived from flags, never set by individual scenes, so it always names what is
 * actually left to do no matter what order the player does things in. First matching rule wins.
 */
export const OBJECTIVES: { cond: string; text: string }[] = [
  // After the Bellshell (end of build 0.3)
  { cond: 'p.bellshell_done', text: 'Go with Rex and Roxy to find Mama Dee. (The side room, the stairs and the Main Drag come next.)' },
  { cond: 'p.screams', text: 'Stop the Bellshell before it wrecks the Wyvern.' },
  { cond: 'p.dock_fight_won', text: 'Head back inside.' },
  // Alley
  { cond: 'p.letter_done', text: 'Hold the alley with Rex.' },
  { cond: 'p.trash_called', text: 'Take the trash out the back door (stage right, under the EXIT sign).' },
  // Wyvern (Jesse's draft 2: one thing after another, and the floor is never done)
  { cond: 'p.amp_fixed', text: 'Take the trash out the back door.' },
  { cond: 'p.amp_hum_back', text: "The hum is back. Have another look at Roxy's amp." },
  { cond: 'p.amp_checked', text: "Fix the hum in Roxy's amp." },
  { cond: 'p.lulu_mopped', text: 'Roxy is yelling for you. Go and see what she wants.' },
  { cond: 'p.lulu_spill', text: 'Lulu spilled her cola by the stage.' },
  { cond: 'p.leagues_in', text: 'Keep mopping.' },
  { cond: 'p.intro', text: 'Mop up the cola puddles. ({puddles}/3)' },
];
