import type { MapDef } from '../../core/map';

/**
 * The Pink Wyvern — Solace Bay's rock club, before doors on Proclamation Night.
 * Coordinates in metres; +z is toward the camera (front door), -z is the stage.
 */
export const wyvern: MapDef = {
  id: 'wyvern',
  name: 'The Pink Wyvern',
  bgm: 'wyvern_soundcheck',
  view: 'wyvern',
  walk: [
    { x: -7.6, z: -3.4 },
    { x: 7.6, z: -3.4 },
    { x: 7.6, z: 5.6 },
    { x: -7.6, z: 5.6 },
  ],
  blockers: [
    { x: -6.6, z: 1.2, w: 2.2, d: 6.4 }, // bar counter
    { x: 6.4, z: 4.2, w: 2.4, d: 1.6 }, // booth
    { x: 6.4, z: 0.6, w: 2.4, d: 1.6 }, // booth
    { x: -2.2, z: 2.2, w: 0.9, d: 0.9 }, // table
    { x: 2.6, z: 3.4, w: 0.9, d: 0.9 }, // table
  ],
  spawns: {
    start: { pos: { x: 0, z: 3.6 }, facing: Math.PI },
    from_alley: { pos: { x: 6.6, z: -2.4 }, facing: -Math.PI / 2 },
  },
  npcs: [
    {
      id: 'roxy',
      model: 'roxy',
      name: 'Roxy',
      pos: { x: 0, z: -3.9 },
      facing: 0,
      talk: 'prologue.roxy',
      radius: 0.4,
    },
    { id: 'spike', model: 'spike', name: 'Spike', pos: { x: -3.2, z: -4.4 }, facing: 0.3, talk: 'prologue.spike' },
    { id: 'lulu', model: 'lulu', name: 'Lulu', pos: { x: 3.4, z: -4.6 }, facing: -0.3, talk: 'prologue.lulu' },
    {
      id: 'mama_dee',
      model: 'mama_dee',
      name: 'Mama Dee',
      pos: { x: -7.2, z: 2.4 },
      facing: Math.PI / 2,
      talk: 'prologue.mama_dee',
      reach: 0.9, // talks across the bar counter
    },
    { id: 'gil', model: 'gil', name: 'Old Gil', pos: { x: -5.0, z: 3.9 }, facing: Math.PI / 2, talk: 'prologue.gil' },
  ],
  hotspots: [
    { id: 'puddle_1', name: 'Cola puddle', pos: { x: 2.4, z: 1.2 }, examine: 'prologue.puddle_1', cond: 'p.intro & !p.puddle_1', marker: 'puddle' },
    { id: 'puddle_2', name: 'Cola puddle', pos: { x: -3.4, z: -1.6 }, examine: 'prologue.puddle_2', cond: 'p.intro & !p.puddle_2', marker: 'puddle' },
    { id: 'puddle_3', name: 'Cola puddle', pos: { x: 4.6, z: 2.6 }, examine: 'prologue.puddle_3', cond: 'p.intro & !p.puddle_3', marker: 'puddle' },
    { id: 'amp', name: "Roxy's amp", pos: { x: 4.6, z: -3.6 }, examine: 'prologue.amp', marker: 'sparkle' },
    { id: 'jukebox', name: 'Jukebox', pos: { x: 7.3, z: 2.4 }, examine: 'prologue.jukebox' },
  ],
  exits: [
    { id: 'front_door', name: 'Front door', pos: { x: 0, z: 5.9 }, to: 'wyvern', spawn: 'start', cond: 'never', locked: 'prologue.front_door' },
    { id: 'back_door', name: 'Back door', pos: { x: 7.7, z: -2.6 }, to: 'alley', spawn: 'from_wyvern', cond: 'p.amp_fixed & puddles>=3', locked: 'prologue.back_door_locked' },
  ],
  sounds: [
    // Roxy's band rehearsing on stage: faint from the door, full in front of the stage.
    { id: 'band', preset: 'band_rehearsal', pos: { x: 0, z: -4.5 }, cond: '!p.amp_fixed', radius: 11, maxGain: 0.9, minGain: 0.12 },
    { id: 'band', preset: 'band_live', pos: { x: 0, z: -4.5 }, cond: 'p.amp_fixed', radius: 12, maxGain: 1.0, minGain: 0.2 },
  ],
  triggers: [{ cond: '!p.intro', scene: 'prologue.intro' }],
};

/** The alley behind the Wyvern: brick, fryer steam, a pink EXIT sign, and Rex. */
export const alley: MapDef = {
  id: 'alley',
  name: 'Wyvern Alley',
  bgm: 'alley_night',
  view: 'alley',
  walk: [
    { x: -2.6, z: -9.5 },
    { x: 2.6, z: -9.5 },
    { x: 2.6, z: 5.5 },
    { x: -2.6, z: 5.5 },
  ],
  blockers: [
    { x: -2.0, z: -1.5, w: 1.2, d: 2.6 }, // dumpster
  ],
  spawns: {
    from_wyvern: { pos: { x: 1.6, z: 4.4 }, facing: Math.PI },
  },
  npcs: [
    { id: 'rex', model: 'rex', name: 'Rex', pos: { x: -0.6, z: 0.6 }, facing: Math.PI / 4, talk: 'prologue.the_letter', cond: '!p.letter_done', radius: 0.5 },
    { id: 'grubb', model: 'grubb', name: 'Grubb', pos: { x: -1.6, z: 1.6 }, facing: Math.PI / 3, talk: 'prologue.the_letter', cond: '!p.letter_done' },
    { id: 'vinnie', model: 'vinnie', name: 'Vinnie', pos: { x: 1.4, z: -6.2 }, facing: 0, talk: 'prologue.vinnie', cond: 'p.letter_done' },
  ],
  hotspots: [
    { id: 'dumpster', name: 'Dumpster', pos: { x: -1.2, z: -1.5 }, examine: 'prologue.dumpster', cond: 'p.letter_done', marker: 'sparkle' },
    { id: 'barrel', name: 'Trash barrel', pos: { x: 1.9, z: 1.4 }, examine: 'prologue.barrel' },
    { id: 'cat', name: 'Alley cat', pos: { x: 2.1, z: -3.2 }, examine: 'prologue.cat' },
    { id: 'exit_sign', name: 'EXIT sign', pos: { x: 2.3, z: 4.6 }, examine: 'prologue.exit_sign' },
  ],
  exits: [
    { id: 'back_door', name: 'Back door', pos: { x: 2.7, z: 4.8 }, to: 'wyvern', spawn: 'from_alley' },
    { id: 'alley_mouth', name: 'Alley mouth', pos: { x: 0, z: -9.7 }, to: 'alley', spawn: 'from_wyvern', cond: 'never', locked: 'prologue.alley_mouth' },
  ],
  sounds: [
    // The band through the Wyvern's back door: muffled, and louder by the door.
    { id: 'band', preset: 'band_live', pos: { x: 2.7, z: 5.2 }, radius: 10, maxGain: 0.55, minGain: 0.08, muffled: true },
  ],
  triggers: [{ cond: '!p.letter_done', scene: 'prologue.the_letter' }],
};
