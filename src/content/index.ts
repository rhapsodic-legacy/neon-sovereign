import type { MapDef } from '../core/map';
import { parseScenes } from '../core/scene/parser';
import type { Scene } from '../core/scene/types';
import { alley, wyvern } from './maps/prologue';

export interface Content {
  maps: Record<string, MapDef>;
  scenes: Record<string, Scene>;
  /** Display info per speaker key used in scenes. */
  speakers: Record<string, { name: string; color: string }>;
}

const sceneFiles = import.meta.glob('./scenes/*.scene', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

export function loadContent(): Content {
  const scenes: Record<string, Scene> = {};
  for (const [file, text] of Object.entries(sceneFiles)) {
    for (const s of parseScenes(text, file)) {
      if (scenes[s.id]) throw new Error(`duplicate scene id ${s.id} in ${file}`);
      scenes[s.id] = s;
    }
  }
  return {
    maps: { wyvern, alley },
    scenes,
    speakers: SPEAKERS,
  };
}

export const SPEAKERS: Record<string, { name: string; color: string }> = {
  EDDAR: { name: 'Eddar', color: '#7fd8ff' },
  ROXY: { name: 'Roxy', color: '#ff5a3c' },
  REX: { name: 'Rex', color: '#ffd24a' },
  SABLE: { name: 'Sable', color: '#b18cff' },
  'MAMA DEE': { name: 'Mama Dee', color: '#ff8fd0' },
  SPIKE: { name: 'Spike', color: '#9dff8a' },
  LULU: { name: 'Lulu', color: '#ffb36b' },
  GIL: { name: 'Old Gil', color: '#c9c3b5' },
  GRUBB: { name: 'Grubb', color: '#c7a36b' },
  VINNIE: { name: 'Vinnie', color: '#9aa5b1' },
  NARRATOR: { name: '', color: '#ffffff' },
  LEDGER: { name: 'The Ledger', color: '#2b2b2b' },
};
