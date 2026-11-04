import type { Game } from '../core/game';
import type { SceneView } from '../core/scene/runner';
import type { AudioEngine } from '../game/audio';

const VOICE_PITCH: Record<string, number> = {
  EDDAR: 520, ROXY: 640, REX: 260, 'MAMA DEE': 330, SPIKE: 380, LULU: 700, GIL: 300, GRUBB: 450, VINNIE: 280, SABLE: 420, STRANGER: 220, LEAGUES: 220, BRICK: 200, MOSS: 360, VOICE: 480,
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface MenuActions {
  save(): string;
  load(): string;
  newGame(): void;
  hasSave(): boolean;
  toggleMute(): boolean;
}

/** HTML overlay UI: dialogue, Ledger notes, choices, cards, prompts, objective, menus, title. */
export class UI {
  private root: HTMLElement;
  private dialogue = el('div', 'dialogue hidden');
  private nameplate = el('div', 'nameplate');
  private portrait = el('div', 'portrait');
  private text = el('div', 'dtext');
  private more = el('div', 'more', '▼');
  private choices = el('div', 'choices hidden');
  private ledger = el('div', 'ledger hidden');
  private card = el('div', 'card hidden');
  private narrator = el('div', 'narrator hidden');
  private prompt = el('div', 'prompt hidden');
  private objective = el('div', 'objective hidden');
  private toast = el('div', 'toast hidden');
  private menu = el('div', 'menu hidden');
  private title = el('div', 'title');
  private help = el('div', 'help', 'WASD / Arrows: move · E / Enter / Space: talk & advance · Esc: menu · M: sound');
  private vision = el('div', 'vision hidden');

  private shownKey = '';
  private full = '';
  private typed = 0;
  private typeTimer = 0;
  private selected = 0;
  private toastT = 0;
  menuOpen = false;
  private menuItems: { label: string; run: () => void }[] = [];
  private menuSel = 0;
  titleOpen = true;
  private titleItems: { label: string; run: () => void }[] = [];
  private titleSel = 0;

  constructor(
    host: HTMLElement,
    private game: Game | null,
    private audio: AudioEngine,
    private actions: MenuActions,
  ) {
    this.root = el('div', 'ui');
    host.appendChild(this.root);
    const box = el('div', 'dbox');
    box.append(this.portrait, this.nameplate, this.text, this.more);
    this.dialogue.append(box);
    this.root.append(this.vision, this.objective, this.prompt, this.narrator, this.dialogue, this.choices, this.ledger, this.card, this.toast, this.menu, this.help, this.title);
    this.buildTitle();
  }

  bind(game: Game): void {
    this.game = game;
    this.shownKey = '';
  }

  // ---------- title ----------

  private buildTitle(): void {
    this.titleItems = [
      { label: 'NEW GAME', run: () => this.actions.newGame() },
      ...(this.actions.hasSave() ? [{ label: 'CONTINUE', run: () => { this.actions.load(); } }] : []),
    ];
    this.titleSel = this.titleItems.length > 1 ? 1 : 0;
    this.title.innerHTML = `
      <div class="sky"><div class="sun"></div><div class="grid"></div></div>
      <div class="logo"><div class="logo-top">NEON</div><div class="logo-bottom">Sovereign</div></div>
      <div class="tagline">The prophecy named a hero. It forgot to mention the guy who does all the work.</div>
      <div class="title-menu"></div>
      <div class="build">Build 0.3b · Prologue: the opening, inception to Bellshell · placeholder art &amp; music</div>`;
    this.renderTitleMenu();
  }

  private renderTitleMenu(): void {
    const m = this.title.querySelector('.title-menu')!;
    m.innerHTML = '';
    this.titleItems.forEach((it, i) => {
      const b = el('div', 'titem' + (i === this.titleSel ? ' sel' : ''), it.label);
      b.onclick = () => { this.titleSel = i; this.titleConfirm(); };
      m.append(b);
    });
  }

  titleMove(d: number): void {
    this.titleSel = (this.titleSel + d + this.titleItems.length) % this.titleItems.length;
    this.audio.playSfx('select');
    this.renderTitleMenu();
  }

  titleConfirm(): void {
    this.audio.playSfx('confirm');
    this.titleItems[this.titleSel].run();
  }

  hideTitle(): void {
    this.titleOpen = false;
    this.title.classList.add('fade');
    setTimeout(() => this.title.classList.add('hidden'), 900);
  }

  // ---------- events ----------

  showObjective(text: string): void {
    this.objective.classList.toggle('hidden', !text);
    this.objective.innerHTML = `<span class="otag">TO DO</span> ${escapeHtml(text)}`;
    this.objective.classList.remove('pulse');
    void this.objective.offsetWidth;
    this.objective.classList.add('pulse');
  }

  /** The Canticle vision overlay (`@fx vision on|off`). */
  setVision(on: boolean): void {
    this.vision.classList.toggle('hidden', !on);
  }

  /** Battles hide the field help and objective. */
  setBattle(on: boolean): void {
    this.help.classList.toggle('hidden', on);
    if (on) this.objective.classList.add('hidden');
    else if (this.game?.state.objective) this.objective.classList.remove('hidden');
  }

  showToast(text: string): void {
    this.toast.textContent = text;
    this.toast.classList.remove('hidden');
    this.toastT = 2.8;
  }

  // ---------- per-frame ----------

  update(dt: number, promptPos: { x: number; y: number } | null, promptText: string): void {
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toast.classList.add('hidden');
    }
    const g = this.game;
    if (!g || this.titleOpen) return;
    // prompt
    if (promptPos && g.mode === 'field' && !this.menuOpen) {
      this.prompt.classList.remove('hidden');
      this.prompt.style.left = `${promptPos.x}px`;
      this.prompt.style.top = `${promptPos.y}px`;
      this.prompt.innerHTML = `<span class="key">E</span> ${escapeHtml(promptText)}`;
    } else this.prompt.classList.add('hidden');

    const v = g.view;
    this.renderView(v, dt);
  }

  private renderView(v: SceneView | null, dt: number): void {
    const key = v ? viewKey(v) + '|' + (this.game!.runner?.snapshot.pc ?? '') : '';
    if (key !== this.shownKey) {
      this.shownKey = key;
      this.enterView(v);
    }
    if (v && (v.kind === 'line' || v.kind === 'card') && this.typed < this.full.length) {
      this.typeTimer += dt;
      const cps = v.kind === 'line' && v.speaker === 'LEDGER' ? 70 : 55;
      while (this.typeTimer > 1 / cps && this.typed < this.full.length) {
        this.typeTimer -= 1 / cps;
        this.typed++;
        if (v.kind === 'line' && this.typed % 3 === 0 && VOICE_PITCH[v.speaker] && this.full[this.typed - 1] !== ' ')
          this.audio.blip(VOICE_PITCH[v.speaker]);
      }
      this.paintTyped(v);
    }
  }

  private enterView(v: SceneView | null): void {
    for (const e of [this.dialogue, this.choices, this.ledger, this.card, this.narrator]) e.classList.add('hidden');
    this.typed = 0;
    this.typeTimer = 0;
    this.full = '';
    if (!v || v.kind === 'end') return;
    if (v.kind === 'choice') {
      this.selected = 0;
      this.choices.classList.remove('hidden');
      this.renderChoices(v);
      return;
    }
    if (v.kind === 'card') {
      this.card.classList.remove('hidden');
      this.full = v.text;
      this.audio.playSfx('card');
      this.card.innerHTML = `<div class="card-text"></div>`;
      return;
    }
    this.full = v.text;
    if (v.speaker === 'LEDGER') {
      this.ledger.classList.remove('hidden');
      this.ledger.innerHTML = `<div class="ledger-head">THE UNFAIRNESS LEDGER</div><div class="ledger-text"></div><div class="ledger-more">▼</div>`;
      this.audio.playSfx('ledger');
      return;
    }
    if (v.speaker === 'NARRATOR') {
      this.narrator.classList.remove('hidden');
      return;
    }
    const sp = this.game!.content.speakers[v.speaker] ?? { name: v.speaker, color: '#fff' };
    this.dialogue.classList.remove('hidden');
    this.dialogue.classList.toggle('vo', v.emotion === 'vo');
    this.nameplate.textContent = sp.name;
    this.nameplate.style.setProperty('--c', sp.color);
    this.portrait.style.setProperty('--c', sp.color);
    this.portrait.textContent = sp.name.slice(0, 1);
    this.portrait.dataset.emotion = v.emotion ?? '';
  }

  private paintTyped(v: SceneView): void {
    const shown = escapeHtml(this.full.slice(0, this.typed));
    const done = this.typed >= this.full.length;
    if (v.kind === 'card') {
      this.card.querySelector('.card-text')!.innerHTML = shown;
      return;
    }
    if (v.kind !== 'line') return;
    if (v.speaker === 'LEDGER') {
      this.ledger.querySelector('.ledger-text')!.innerHTML = shown;
      this.ledger.querySelector('.ledger-more')!.classList.toggle('on', done);
    } else if (v.speaker === 'NARRATOR') {
      this.narrator.innerHTML = shown + (done ? ' <span class="more on">▼</span>' : '');
    } else {
      this.text.innerHTML = shown;
      this.more.classList.toggle('on', done);
    }
  }

  private renderChoices(v: Extract<SceneView, { kind: 'choice' }>): void {
    this.choices.innerHTML = '';
    v.options.forEach((o, i) => {
      const c = el('div', 'choice' + (i === this.selected ? ' sel' : ''), `<span class="num">${i + 1}</span>${escapeHtml(o.text)}`);
      c.onclick = () => {
        this.selected = i;
        this.confirm();
      };
      c.onmouseenter = () => {
        this.selected = i;
        this.renderChoices(v);
      };
      this.choices.append(c);
    });
  }

  // ---------- input from main ----------

  /** Returns true if the UI consumed the confirm press. */
  confirm(): boolean {
    const g = this.game;
    if (!g) return false;
    const v = g.view;
    if (!v) return false;
    if ((v.kind === 'line' || v.kind === 'card') && this.typed < this.full.length) {
      this.typed = this.full.length;
      this.paintTyped(v);
      return true;
    }
    if (v.kind === 'choice') {
      this.audio.playSfx('confirm');
      g.choose(this.selected);
      return true;
    }
    g.advance();
    return true;
  }

  moveSelection(d: number): void {
    const v = this.game?.view;
    if (v?.kind !== 'choice') return;
    this.selected = (this.selected + d + v.options.length) % v.options.length;
    this.audio.playSfx('select');
    this.renderChoices(v);
  }

  chooseNumber(n: number): void {
    const v = this.game?.view;
    if (v?.kind !== 'choice' || n >= v.options.length) return;
    this.selected = n;
    this.confirm();
  }

  // ---------- pause menu ----------

  toggleMenu(): void {
    if (!this.game || this.titleOpen) return;
    this.menuOpen = !this.menuOpen;
    this.menu.classList.toggle('hidden', !this.menuOpen);
    if (this.menuOpen) this.renderMenu('main');
  }

  private renderMenu(page: 'main' | 'ledger' | 'controls', msg = ''): void {
    const g = this.game!;
    this.menu.innerHTML = '';
    const panel = el('div', 'mpanel');
    this.menu.append(panel);
    if (page === 'ledger') {
      panel.append(el('div', 'mtitle', 'THE UNFAIRNESS LEDGER'));
      const list = el('div', 'mledger');
      const entries = g.state.ledger.length ? g.state.ledger : [{ text: 'No entries yet. Give it ten minutes.', at: 0 }];
      for (const e of [...entries].reverse()) list.append(el('div', 'mentry', escapeHtml(e.text)));
      panel.append(list);
      this.menuItems = [{ label: 'BACK', run: () => this.renderMenu('main') }];
    } else if (page === 'controls') {
      panel.append(el('div', 'mtitle', 'CONTROLS'));
      panel.append(el('div', 'mtext', 'Move: WASD or arrow keys<br>Talk / examine / advance: E, Enter or Space<br>Pick a reply: arrows + Enter, number keys, or click<br>Battles: arrows + Enter to pick a command and a target, Esc to go back, A for Auto<br>Menu: Esc · Sound on/off: M<br><br>AI players: open the console and use <code>WIRE.describe()</code>, <code>WIRE.observe()</code> and <code>WIRE.act({...})</code>. See docs/WIRE.md.'));
      this.menuItems = [{ label: 'BACK', run: () => this.renderMenu('main') }];
    } else {
      panel.append(el('div', 'mtitle', 'PAUSED'));
      const hrs = Math.floor(g.state.playtime / 3600);
      const mins = Math.floor((g.state.playtime % 3600) / 60);
      panel.append(el('div', 'mstat', `${escapeHtml(g.map.name)} · ${hrs}h ${mins.toString().padStart(2, '0')}m · ${g.state.vars.tokens ?? 0} tokens`));
      this.menuItems = [
        { label: 'RESUME', run: () => this.toggleMenu() },
        { label: 'SAVE', run: () => this.renderMenu('main', this.actions.save()) },
        { label: 'LOAD', run: () => { const m = this.actions.load(); if (this.menuOpen) this.renderMenu('main', m); } },
        { label: 'LEDGER', run: () => this.renderMenu('ledger') },
        { label: 'CONTROLS', run: () => this.renderMenu('controls') },
        { label: this.audio.muted ? 'SOUND: OFF' : 'SOUND: ON', run: () => { this.actions.toggleMute(); this.renderMenu('main'); } },
      ];
    }
    this.menuSel = 0;
    const items = el('div', 'mitems');
    this.menuItems.forEach((it, i) => {
      const b = el('div', 'mitem' + (i === this.menuSel ? ' sel' : ''), it.label);
      b.onclick = () => it.run();
      items.append(b);
    });
    panel.append(items);
    if (msg) panel.append(el('div', 'mmsg', escapeHtml(msg)));
  }

  menuMove(d: number): void {
    this.menuSel = (this.menuSel + d + this.menuItems.length) % this.menuItems.length;
    this.menu.querySelectorAll('.mitem').forEach((e, i) => e.classList.toggle('sel', i === this.menuSel));
    this.audio.playSfx('select');
  }

  menuConfirm(): void {
    this.audio.playSfx('confirm');
    this.menuItems[this.menuSel]?.run();
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.menu.classList.add('hidden');
  }
}

function viewKey(v: SceneView): string {
  switch (v.kind) {
    case 'line':
      return `l:${v.speaker}:${v.text}`;
    case 'card':
      return `c:${v.text}`;
    case 'choice':
      return `q:${v.options.map((o) => o.text).join('|')}`;
    case 'end':
      return 'e';
  }
}
