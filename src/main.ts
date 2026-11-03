import './ui/styles.css';
import { loadContent } from './content';
import { Game, GameEvent, SaveData } from './core/game';
import { soundGains } from './core/map';
import * as wire from './core/wire';
import { AudioEngine } from './game/audio';
import { FieldRenderer } from './game/renderer';
import { UI } from './ui/ui';
import { BattleUI } from './ui/battle-ui';

const SAVE_KEY = 'neon-sovereign.save.1';
const content = loadContent();
const app = document.getElementById('app')!;
const audio = new AudioEngine();

let game = new Game(content);
let unsub: (() => void) | null = null;
const renderer = new FieldRenderer(app, game);
const battleUI = new BattleUI(app, renderer, audio);

const readSave = (): SaveData | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
};

const ui = new UI(app, null, audio, {
  newGame: () => begin(new Game(content)),
  hasSave: () => !!readSave(),
  save: () => {
    if (!game.canSave()) return 'Finish the conversation first.';
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game.save()));
      return 'Saved.';
    } catch {
      return 'Could not save (browser storage unavailable).';
    }
  },
  load: () => {
    const data = readSave();
    if (!data) return 'No save found.';
    ui.closeMenu();
    begin(Game.load(content, data));
    return 'Loaded.';
  },
  toggleMute: () => {
    audio.setMuted(!audio.muted);
    return audio.muted;
  },
});

function begin(g: Game): void {
  unsub?.();
  battleUI.stop();
  ui.setVision(false);
  game = g;
  renderer.bind(game);
  ui.bind(game);
  unsub = game.on(onEvent);
  if (ui.titleOpen) ui.hideTitle();
  game.start();
}

function onEvent(e: GameEvent): void {
  renderer.onEvent(e);
  switch (e.type) {
    case 'bgm':
      audio.playBgm(e.id);
      break;
    case 'sfx':
      audio.playSfx(e.id);
      break;
    case 'objective':
      ui.showObjective(e.text);
      break;
    case 'toast':
      ui.showToast(e.text);
      break;
    case 'map':
      ui.showToast(game.map.name);
      break;
    case 'fx':
      if (e.id === 'vision') ui.setVision(e.target === 'on');
      break;
    case 'battle_start':
      renderer.startBattle(game.battle!);
      battleUI.start(game);
      ui.setBattle(true);
      break;
    case 'battle_end':
      if (e.result !== 'defeat') {
        battleUI.stop();
        renderer.endBattle();
        ui.setBattle(false);
      }
      break;
  }
}

// ---------- input ----------
const held = new Set<string>();
window.addEventListener('keydown', (ev) => {
  audio.unlock();
  const k = ev.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) ev.preventDefault();
  if (ev.repeat && !['arrowup', 'arrowdown', 'w', 's'].includes(k)) return;
  if (k === 'backspace') ev.preventDefault();
  held.add(k);

  if (ui.titleOpen) {
    if (k === 'arrowup' || k === 'w') ui.titleMove(-1);
    if (k === 'arrowdown' || k === 's') ui.titleMove(1);
    if (k === 'enter' || k === ' ' || k === 'e') {
      audio.playBgm('wyvern_soundcheck');
      ui.titleConfirm();
    }
    return;
  }
  if (k === 'm') {
    audio.setMuted(!audio.muted);
    ui.showToast(audio.muted ? 'Sound off' : 'Sound on');
    return;
  }
  if ((k === 'escape' || k === 'tab') && !(game.mode === 'battle' && k === 'escape')) {
    ev.preventDefault();
    ui.toggleMenu();
    return;
  }
  if (ui.menuOpen) {
    if (k === 'arrowup' || k === 'w') ui.menuMove(-1);
    if (k === 'arrowdown' || k === 's') ui.menuMove(1);
    if (k === 'enter' || k === ' ' || k === 'e') ui.menuConfirm();
    return;
  }
  if (game.mode === 'battle') {
    battleUI.key(k);
    return;
  }
  const confirm = k === 'enter' || k === ' ' || k === 'e';
  if (game.mode === 'scene') {
    if (k === 'arrowup' || k === 'w') ui.moveSelection(-1);
    if (k === 'arrowdown' || k === 's') ui.moveSelection(1);
    if (/^[1-9]$/.test(k)) ui.chooseNumber(Number(k) - 1);
    if (confirm) ui.confirm();
    return;
  }
  if (confirm) game.interact();
});
window.addEventListener('keyup', (ev) => held.delete(ev.key.toLowerCase()));
window.addEventListener('blur', () => held.clear());
app.addEventListener('pointerdown', () => {
  audio.unlock();
  if (!ui.titleOpen && !ui.menuOpen && game.mode === 'scene' && game.view?.kind !== 'choice') ui.confirm();
});

function moveVector(): { x: number; z: number } {
  let x = 0;
  let z = 0;
  if (held.has('w') || held.has('arrowup')) z -= 1;
  if (held.has('s') || held.has('arrowdown')) z += 1;
  if (held.has('a') || held.has('arrowleft')) x -= 1;
  if (held.has('d') || held.has('arrowright')) x += 1;
  const l = Math.hypot(x, z);
  return l ? { x: x / l, z: z / l } : { x: 0, z: 0 };
}

// ---------- loop ----------
let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!ui.titleOpen && !ui.menuOpen) game.tick(dt, game.mode === 'field' ? moveVector() : undefined);
  renderer.frame(dt);
  battleUI.update(dt);
  if (!ui.titleOpen) audio.setLayers(soundGains(game.state, game.map));
  const f = !ui.titleOpen && game.mode === 'field' ? game.focus() : undefined;
  const pos = f ? renderer.project(f.pos.x, 2.3, f.pos.z) : null;
  const verb = f ? (f.kind === 'npc' ? 'Talk' : f.kind === 'exit' ? 'Go' : 'Examine') : '';
  ui.update(dt, pos, f ? `${verb} · ${f.name}` : '');
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- THE WIRE (AI player interface) ----------
declare global {
  interface Window {
    WIRE: {
      observe: () => unknown;
      act: (a: wire.WireAction) => wire.WireResult;
      describe: () => string;
      newGame: () => void;
    };
  }
}
window.WIRE = {
  observe: () => wire.observe(game),
  act: (a) => wire.act(game, a),
  describe: () => wire.describe(game),
  newGame: () => begin(new Game(content)),
};
