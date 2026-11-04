import type { ChatterTrack } from '../../core/map';

/**
 * The Pink Wyvern's speech bubbles (Jesse's 0.3b notes): the cold open plays out over everyone's heads
 * while the player mops. The band and the patrons go back and forth; Eddar, the mop boy, is ignored.
 * Waits are seconds after the previous line, and time only passes while the player has control.
 */
export const WYVERN_CHATTER: ChatterTrack[] = [
  {
    id: 'cold_open',
    cond: 'p.intro & !p.screams',
    lines: [
      { who: 'roxy', wait: 1.2, text: "Listen up, Wildfires! Tonight we don't PLAY Save the World. Tonight we ARE the world, and we are SAVING it." },
      { who: 'roxy', wait: 5, text: 'With music to light the heavens! With volume to awaken the dead! With FIRE hot enough to ignite an ocean with!' },
      { who: 'gil', wait: 5.5, text: '*clap* ... *clap*', sfx: 'cheer' },
      { who: 'superfan', wait: 1, text: 'WOOOOO! WILDFIRES!' },
      { who: 'spike', wait: 2.5, text: 'Save the world? From what...' },
      { who: 'roxy', wait: 2.5, text: "From being BORING! I'm lead vocals, Spike, not you, so shut F-sharp up!" },
      { who: 'kings_fan', wait: 4.5, text: "Play 'Neon Nights'!" },
      { who: 'roxy', wait: 2.5, text: "That's a STATIC KINGS song, pal." },
      { who: 'kings_fan', wait: 2.5, text: "So? It's a good song!" },
      { who: 'lulu', wait: 2.2, text: 'It IS a good song...' },
      { who: 'roxy', wait: 1.8, text: 'LULU.' },
      { who: 'dwayne', wait: 4, text: 'Take it OFF!' },
      { who: 'roxy', wait: 2.2, text: 'Take YOURSELF off, Dwayne! Off a PIER!' },
      { who: 'tammy_dad', wait: 4, text: "Dedicate one to my daughter Tammy! She's... not here. But she'd love it!" },
      { who: 'roxy', wait: 3, text: "This one's for Tammy! Wherever Tammy is!" },
      { who: 'lulu', wait: 4, text: 'Ooh, can we open with the new one? The one with no ending?' },
      { who: 'roxy', wait: 2.5, text: "Not tonight, hon'. Soon, though.", flag: 'p.cold_open_done' },
    ],
  },
  {
    // The room keeps going after the cold open, and none of it is for Eddar.
    id: 'heckles',
    cond: 'p.cold_open_done & !p.trash_called',
    loop: true,
    lines: [
      { who: 'superfan', wait: 9, text: 'You guys RULE!' },
      { who: 'superfan', wait: 10, text: "Hey. Mop guy. You're in my sightline." },
      { who: 'kings_fan', wait: 10, text: "Play 'Neon Nights'!" },
      { who: 'roxy', wait: 1.8, text: 'NO.' },
      { who: 'dwayne', wait: 10, text: 'Play something with a SAXOPHONE!' },
      { who: 'spike', wait: 2.2, text: 'We do not do saxophone.' },
      { who: 'tammy_dad', wait: 10, text: 'Is this the one for Tammy?' },
      { who: 'roxy', wait: 2.2, text: "They're ALL for Tammy!" },
    ],
  },
  {
    // Lulu's cola: once the stranger is in, a puddle by the stage draws Eddar over.
    id: 'lulu_spill',
    cond: 'p.leagues_in & !p.lulu_spill',
    lines: [{ who: 'lulu', wait: 4, text: 'Whoops!', flag: 'p.lulu_spill' }],
  },
  {
    // Then Roxy finally notices him, because she needs something.
    id: 'roxy_calls',
    cond: 'p.lulu_mopped & !p.amp_checked',
    loop: true,
    lines: [
      { who: 'roxy', wait: 1, text: 'EDDAR! Come HERE!' },
      { who: 'roxy', wait: 9, text: 'EDDAR! Today!' },
    ],
  },
  {
    // The floor is never done. Mopping these changes nothing; somebody always spills again.
    id: 'spills',
    cond: 'p.leagues_in & !p.trash_called',
    loop: true,
    lines: [
      { who: 'dwayne', wait: 12, cond: '!p.spill_a', flag: 'p.spill_a', text: 'Sorry... my bad. *belch*' },
      { who: 'tammy_dad', wait: 14, cond: '!p.spill_b', flag: 'p.spill_b', text: 'Sorry...' },
      { who: 'kings_fan', wait: 14, cond: '!p.spill_c', flag: 'p.spill_c', text: "Where's that little squirt with the mop? I spilled my drink!" },
    ],
  },
];
