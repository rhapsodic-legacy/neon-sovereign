import type { Game } from '../core/game';
import type { Battle, LegalAction } from '../core/battle/engine';
import type { BattleEvent } from '../core/battle/types';
import { smartPolicy } from '../core/battle/policy';
import type { AudioEngine } from '../game/audio';

/** What the battle screen needs from the 3D stage. */
export interface BattleStage {
  animateBattle(e: BattleEvent): number;
  battleScreenPos(id: string, height?: number): { x: number; y: number } | null;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const UNIT_COLOR: Record<string, string> = {
  eddar: '#7fd8ff', rex: '#ffd24a', roxy: '#ff5a3c', vinnie: '#9aa5b1', brick: '#8a8f99', moss: '#7fa37a', bellshell: '#d39a4a',
};
const SPEAKER_COLOR: Record<string, string> = { EDDAR: '#7fd8ff', REX: '#ffd24a', ROXY: '#ff5a3c', VINNIE: '#9aa5b1' };

type Phase = 'title' | 'play' | 'bark' | 'command' | 'target' | 'result';

/**
 * THE SET's battle screen (DESIGN §6): the CTB timeline, party panel, command menu with timeline preview,
 * target picker, enemy labels (HP, Break, next move after Read), damage numbers, barks with tutorial hints,
 * an 80s movie-poster title card, and the victory / mercy / defeat banner.
 * Events from the core are played one at a time so every hit reads.
 */
export class BattleUI {
  private root = el('div', 'battle hidden');
  private timeline = el('div', 'b-timeline');
  private partyPanel = el('div', 'b-party');
  private menu = el('div', 'b-menu hidden');
  private help = el('div', 'b-help hidden');
  private labels = el('div', 'b-labels');
  private floaters = el('div', 'b-floaters');
  private bark = el('div', 'b-bark hidden');
  private card = el('div', 'b-card hidden');
  private banner = el('div', 'b-banner hidden');
  private autoTag = el('div', 'b-auto', 'AUTO: OFF · [A]');
  private speedTag = el('div', 'b-auto b-speed', 'SPEED 1× · [S]');
  /** Battle speed (DESIGN §6.6): 1×, 2× or 4×. */
  private speed = 1;

  private game: Game | null = null;
  private queue: BattleEvent[] = [];
  /** How many of the battle's events have been queued (the UI reads, never drains, so WIRE and the UI can share a battle). */
  private cursor = 0;
  private wait = 0;
  private phase: Phase = 'title';
  private sel = 0;
  private tsel = 0;
  private legal: LegalAction[] = [];
  private auto = false;
  private barkT = 0;
  /** Units revealed so far by a 'read' event (labels update when the read is shown, not before). */
  private shownHp = new Map<string, number>();
  active = false;

  constructor(
    host: HTMLElement,
    private stage: BattleStage,
    private audio: AudioEngine,
  ) {
    this.root.append(this.labels, this.floaters, this.timeline, this.partyPanel, this.menu, this.help, this.bark, this.card, this.banner, this.autoTag, this.speedTag);
    host.appendChild(this.root);
    this.autoTag.onclick = () => this.toggleAuto();
    this.speedTag.onclick = () => this.cycleSpeed();
    for (const e of [this.bark, this.banner, this.card]) e.onclick = () => this.key('enter');
  }

  private get b(): Battle {
    return this.game!.battle!;
  }

  /** A battle has started (or restarted after a defeat). */
  start(game: Game): void {
    this.game = game;
    this.active = true;
    this.queue = [];
    this.shownHp.clear();
    for (const u of this.b.units) this.shownHp.set(u.id, u.hp);
    this.root.classList.remove('hidden');
    this.banner.classList.add('hidden');
    this.bark.classList.add('hidden');
    this.menu.classList.add('hidden');
    this.help.classList.add('hidden');
    this.phase = 'title';
    this.card.classList.remove('hidden');
    this.card.innerHTML = `<div class="b-card-title">${esc(this.b.def.title)}</div><div class="b-card-tag">${esc(this.b.def.tagline)}</div>`;
    this.audio.playSfx('battle_sting');
    this.wait = 2.4;
    this.cursor = 0;
    this.pull();
    this.renderStatic();
  }

  private pull(): void {
    const ev = this.b.events;
    if (ev.length > this.cursor) this.queue.push(...ev.slice(this.cursor));
    this.cursor = ev.length;
  }

  stop(): void {
    this.active = false;
    this.root.classList.add('hidden');
    this.labels.innerHTML = '';
    this.floaters.innerHTML = '';
  }

  toggleAuto(): void {
    this.auto = !this.auto;
    this.autoTag.textContent = `AUTO: ${this.auto ? 'ON' : 'OFF'} · [A]`;
    this.autoTag.classList.toggle('on', this.auto);
    if (this.auto && (this.phase === 'command' || this.phase === 'target')) this.autoAct();
  }

  cycleSpeed(): void {
    this.speed = this.speed >= 4 ? 1 : this.speed * 2;
    this.speedTag.textContent = `SPEED ${this.speed}× · [S]`;
    this.speedTag.classList.toggle('on', this.speed > 1);
  }

  // ---------- per frame ----------

  update(realDt: number): void {
    const dt = realDt * this.speed;
    if (!this.active || !this.game?.battle) return;
    this.renderLabels();
    // Someone else (an AI player through WIRE) acted while we were waiting for a command.
    if ((this.phase === 'command' || this.phase === 'target') && this.b.events.length > this.cursor) {
      this.menu.classList.add('hidden');
      this.help.classList.add('hidden');
      this.pull();
      this.phase = 'play';
    }
    if (this.phase === 'bark') {
      this.barkT -= dt;
      if (this.auto && this.barkT <= 0) this.dismissBark();
      return;
    }
    if (this.phase === 'title') {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.card.classList.add('hidden');
        this.phase = 'play';
      }
      return;
    }
    if (this.phase !== 'play') return;
    this.wait -= dt;
    while (this.wait <= 0 && this.phase === 'play') {
      const e = this.queue.shift();
      if (!e) {
        this.onQueueEmpty();
        return;
      }
      this.wait = this.play(e);
    }
  }

  private onQueueEmpty(): void {
    const b = this.b;
    if (b.result) {
      this.showResult();
      return;
    }
    this.legal = b.legal();
    if (this.auto) {
      this.wait = 0.35;
      this.autoAct();
      return;
    }
    this.phase = 'command';
    this.sel = Math.max(0, this.legal.findIndex((l) => !l.blocked));
    this.renderMenu();
  }

  private autoAct(): void {
    const c = smartPolicy(this.b);
    this.commit(c.skill, c.target);
  }

  /** Show one event; return seconds before the next. */
  private play(e: BattleEvent): number {
    const anim = this.stage.animateBattle(e);
    switch (e.type) {
      case 'turn':
        this.renderTimeline();
        return 0.05;
      case 'action': {
        const u = this.b.unit(e.actor);
        if (!['lid_bash', 'strike', 'axe_riff', 'jab', 'shove', 'pinch', 'hook_swipe'].includes(e.skill)) this.flashName(u.id, e.name);
        this.audio.playSfx(e.skill === 'toll' ? 'toll' : e.skill === 'rear' ? 'crab_clang' : e.skill === 'meltdown' ? 'big_chord' : 'swing');
        return Math.max(0.35, anim);
      }
      case 'damage':
        this.shownHp.set(e.target, Math.max(0, (this.shownHp.get(e.target) ?? 0) - e.amount));
        this.floatText(e.target, String(e.amount), e.exposed ? 'crit' : this.b.unit(e.target).side === 'party' ? 'hurt' : 'dmg');
        this.audio.playSfx('hit');
        this.renderParty();
        return Math.max(0.3, anim);
      case 'heal':
        this.shownHp.set(e.target, (this.shownHp.get(e.target) ?? 0) + e.amount);
        this.floatText(e.target, `+${e.amount}`, 'heal');
        this.audio.playSfx('heal');
        this.renderParty();
        return 0.45;
      case 'interrupt':
        this.floatText(e.target, e.text.toUpperCase(), 'tag');
        this.audio.playSfx('lift');
        return Math.max(0.5, anim);
      case 'break':
        this.floatText(e.target, 'BREAK!', 'break');
        this.audio.playSfx('break');
        return 0.55;
      case 'cover':
        this.floatText(e.by, 'BIG BROTHER', 'tag');
        return 0.45;
      case 'read':
        this.floatText(e.target, 'READ', 'tag');
        this.audio.playSfx('read');
        return 0.5;
      case 'status':
        if (e.on && e.id !== 'guard' && e.id !== 'charging') this.floatText(e.target, e.id.toUpperCase(), 'tag');
        if (e.on && e.id === 'charging') this.floatText(e.target, 'CHARGING', 'tag');
        this.renderParty();
        return e.on ? 0.25 : 0;
      case 'heat':
        this.renderParty();
        return 0;
      case 'ko':
        this.floatText(e.unit, 'KO', 'hurt');
        this.audio.playSfx('ko');
        return 0.6;
      case 'bark':
        this.showBark(e.who, e.text, e.hint);
        return 0;
      case 'end':
        return 0.6;
    }
  }

  // ---------- barks ----------

  private showBark(who: string, text: string, hint?: string): void {
    this.phase = 'bark';
    this.barkT = 3.2;
    const name = who.charAt(0) + who.slice(1).toLowerCase();
    this.bark.classList.remove('hidden');
    this.bark.style.setProperty('--c', SPEAKER_COLOR[who] ?? '#fff');
    this.bark.innerHTML = `<div class="b-bark-name">${esc(name)}</div><div class="b-bark-text">${esc(text)}</div>${
      hint ? `<div class="b-hint"><span>TIP</span> ${esc(hint)}</div>` : ''
    }<div class="more on">▼</div>`;
  }

  private dismissBark(): void {
    this.bark.classList.add('hidden');
    this.phase = 'play';
    this.wait = 0.1;
  }

  // ---------- input ----------

  key(k: string): void {
    if (!this.active) return;
    if (k === 'a') {
      this.toggleAuto();
      return;
    }
    if (k === 's' && this.phase !== 'command' && this.phase !== 'target') {
      this.cycleSpeed();
      return;
    }
    if (k === 'tab') return;
    const confirm = k === 'enter' || k === ' ' || k === 'e';
    const back = k === 'escape' || k === 'backspace' || k === 'q';
    const up = k === 'arrowup' || k === 'w';
    const down = k === 'arrowdown' || k === 's';
    const left = k === 'arrowleft';
    const right = k === 'arrowright' || k === 'd';
    if (this.phase === 'bark' && confirm) this.dismissBark();
    else if (this.phase === 'title' && confirm) this.wait = 0;
    else if (this.phase === 'result' && confirm) this.closeResult();
    else if (this.phase === 'command') {
      if (up || down) this.moveSel(up ? -1 : 1);
      if (/^[1-9]$/.test(k)) {
        this.sel = Math.min(this.legal.length - 1, Number(k) - 1);
        this.pick();
      } else if (confirm) this.pick();
    } else if (this.phase === 'target') {
      const n = this.legal[this.sel].targets.length;
      if (up || left) this.tsel = (this.tsel - 1 + n) % n;
      if (down || right) this.tsel = (this.tsel + 1) % n;
      if (up || down || left || right) this.audio.playSfx('select');
      if (confirm) this.commit(this.legal[this.sel].skill, this.legal[this.sel].targets[this.tsel]);
      if (back) {
        this.phase = 'command';
        this.renderMenu();
      }
    }
  }

  private moveSel(d: number): void {
    this.sel = (this.sel + d + this.legal.length) % this.legal.length;
    this.audio.playSfx('select');
    this.renderMenu();
  }

  private pick(): void {
    const la = this.legal[this.sel];
    if (!la) return;
    if (la.blocked) {
      this.audio.playSfx('buzz');
      return;
    }
    this.audio.playSfx('confirm');
    const s = this.b.skill(la.skill);
    if ((s.target === 'enemy' || s.target === 'ally') && la.targets.length > 1) {
      this.phase = 'target';
      // default: an exposed or set-up foe, else the first
      const foes = la.targets.map((t) => this.b.unit(t));
      const exposed = foes.findIndex((f) => f.statuses.rearing || f.broken || (f.analyzed && f.intent && this.b.skill(f.intent.skill).power! >= 2));
      this.tsel = s.target === 'ally' ? foes.indexOf(foes.slice().sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0]) : Math.max(0, exposed);
      this.renderMenu();
      return;
    }
    this.commit(la.skill, la.targets[0]);
  }

  private commit(skill: string, target?: string): void {
    this.menu.classList.add('hidden');
    this.help.classList.add('hidden');
    this.game!.battleAct(skill, target);
    this.pull();
    this.phase = 'play';
    this.wait = Math.max(this.wait, 0.05);
  }

  /** Clicks on the menu. */
  private clickSkill(i: number): void {
    if (this.phase !== 'command' && this.phase !== 'target') return;
    this.sel = i;
    this.phase = 'command';
    this.pick();
  }

  // ---------- result ----------

  private showResult(): void {
    this.phase = 'result';
    const r = this.b.result!;
    const text = r === 'win' ? 'VICTORY' : r === 'mercy' ? 'MERCY' : 'DEFEATED';
    const sub =
      r === 'win' ? 'The alley is yours. For tonight.' : r === 'mercy' ? 'Not every fight ends in a kill.' : 'Press Enter to try again. The tips will help.';
    this.banner.className = `b-banner ${r}`;
    this.banner.innerHTML = `<div class="b-banner-text">${text}</div><div class="b-banner-sub">${esc(sub)}</div><div class="more on">▼</div>`;
    this.audio.playSfx(r === 'defeat' ? 'ko' : 'victory');
  }

  private closeResult(): void {
    const g = this.game!;
    this.banner.classList.add('hidden');
    const r = this.b.result;
    if (r !== 'defeat') this.stop();
    g.finishBattle();
  }

  // ---------- rendering ----------

  private renderStatic(): void {
    this.renderTimeline();
    this.renderParty();
  }

  private chip(id: string, preview = false, current = false): string {
    const u = this.b.unit(id);
    return `<div class="b-chip ${u.side}${preview ? ' preview' : ''}${current ? ' now' : ''}" style="--c:${UNIT_COLOR[id] ?? '#ccc'}"><span>${esc(u.name.slice(0, 1))}</span><em>${esc(u.name)}</em></div>`;
  }

  private renderTimeline(previewSkill?: string): void {
    const order = this.b.order(8, previewSkill);
    this.timeline.innerHTML = `<div class="b-tl-label">NEXT</div>${order.map((o, i) => this.chip(o.unit, o.preview, i === 0 && !previewSkill)).join('')}`;
  }

  private renderParty(): void {
    const b = this.b;
    this.partyPanel.innerHTML = b.def.party
      .map((id) => {
        const u = b.unit(id);
        const hp = Math.min(u.maxHp, this.shownHp.get(id) ?? u.hp);
        const pct = (hp / u.maxHp) * 100;
        const sts = Object.keys(u.statuses)
          .filter((s) => s !== 'charging' || true)
          .map((s) => `<i class="st ${s}">${s.toUpperCase()}</i>`)
          .join('');
        const heat = u.traits?.includes('heat')
          ? `<div class="b-heat"><div style="width:${u.heat}%"></div><b>HEAT ${u.heat}</b></div>`
          : '';
        return `<div class="b-member${b.current === id && this.phase !== 'play' ? ' now' : ''}${hp <= 0 ? ' ko' : ''}" style="--c:${UNIT_COLOR[id]}">
          <div class="b-mname">${esc(u.name)} ${sts}</div>
          <div class="b-hp"><div class="${pct < 35 ? 'low' : ''}" style="width:${pct}%"></div></div>
          <div class="b-hpnum">${hp} / ${u.maxHp}</div>${heat}</div>`;
      })
      .join('');
  }

  private renderMenu(): void {
    const b = this.b;
    const me = b.unit(b.current);
    this.menu.classList.remove('hidden');
    this.menu.innerHTML = `<div class="b-menu-head" style="--c:${UNIT_COLOR[me.id]}">${esc(me.name)}</div>`;
    this.legal.forEach((l, i) => {
      const row = el(
        'div',
        `b-cmd${i === this.sel ? ' sel' : ''}${l.blocked ? ' blocked' : ''}`,
        `<span class="num">${i + 1}</span>${esc(l.name)}${l.blocked ? `<small>${esc(l.blocked)}</small>` : ''}`,
      );
      row.onclick = () => this.clickSkill(i);
      row.onmouseenter = () => {
        if (this.phase !== 'command') return;
        this.sel = i;
        this.renderMenu();
      };
      this.menu.append(row);
    });
    const la = this.legal[this.sel];
    this.help.classList.remove('hidden');
    let helpText = la ? esc(la.desc) : '';
    if (this.phase === 'target' && la) {
      const t = b.unit(la.targets[this.tsel]);
      helpText = `Target: <b>${esc(t.name)}</b> · ←/→ to change · Enter to confirm · Esc to go back`;
    }
    this.help.innerHTML = helpText;
    this.renderTimeline(la && !la.blocked ? la.skill : undefined);
    this.renderParty();
  }

  /** Floating labels over each foe: name, HP (after Read), Break gauge, statuses and next move (after Read). */
  private renderLabels(): void {
    const b = this.b;
    const targeting = this.phase === 'target' ? this.legal[this.sel]?.targets[this.tsel] : undefined;
    const html: string[] = [];
    for (const u of b.units) {
      const pos = this.stage.battleScreenPos(u.id, u.id === 'bellshell' ? 2.4 : 2.5);
      if (!pos) continue;
      const shownHp = Math.min(u.maxHp, this.shownHp.get(u.id) ?? u.hp);
      if (shownHp <= 0 && u.side === 'enemy') continue;
      const mark = targeting === u.id ? '<div class="b-target">▼</div>' : '';
      if (u.side === 'party') {
        if (mark) html.push(`<div class="b-label party" style="left:${pos.x}px;top:${pos.y}px">${mark}</div>`);
        continue;
      }
      const pct = (shownHp / u.maxHp) * 100;
      const hp = u.analyzed ? `<div class="b-ehp"><div style="width:${pct}%"></div></div><div class="b-ehpnum">${shownHp}/${u.maxHp}</div>` : `<div class="b-ehp unknown"><div style="width:${pct}%"></div></div>`;
      const brk = u.breakMax ? `<div class="b-break${u.broken ? ' on' : ''}"><div style="width:${Math.min(100, (u.breakVal / u.breakMax) * 100)}%"></div></div>` : '';
      const tags = [u.statuses.rearing ? '<i class="st rearing">REARING</i>' : '', u.broken ? '<i class="st broken">BROKEN</i>' : ''].join('');
      let intent = '';
      if (u.analyzed && u.intent) {
        const s = b.skill(u.intent.skill);
        const tgt = u.intent.target ? ` → ${esc(b.unit(u.intent.target).name)}` : s.target === 'all_party' ? ' → everyone' : '';
        const heavy = (s.power ?? 0) >= 2 || s.target === 'all_party';
        intent = `<div class="b-intent${heavy ? ' heavy' : ''}">NEXT: ${esc(s.name)}${tgt}</div>`;
      }
      html.push(
        `<div class="b-label" style="left:${pos.x}px;top:${pos.y}px">${mark}<div class="b-ename">${esc(u.name)} ${tags}</div>${hp}${brk}${intent}</div>`,
      );
    }
    this.labels.innerHTML = html.join('');
  }

  private floatText(id: string, text: string, kind: string): void {
    const pos = this.stage.battleScreenPos(id, 1.6);
    if (!pos) return;
    const f = el('div', `b-float ${kind}`, esc(text));
    f.style.left = `${pos.x + (Math.random() - 0.5) * 30}px`;
    f.style.top = `${pos.y}px`;
    this.floaters.append(f);
    setTimeout(() => f.remove(), 1300);
  }

  private flashName(id: string, name: string): void {
    this.floatText(id, name, 'skill');
  }
}
