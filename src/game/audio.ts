/**
 * Placeholder procedural synthwave score + synthesized SFX (Web Audio).
 * The real score comes from the AI-music pipeline (DESIGN.md §9); cue ids stay the same,
 * so swapping in recorded tracks later is a data change.
 */

interface Preset {
  bpm: number;
  root: number; // MIDI note
  chords: number[][]; // semitone offsets per bar
  drums: 'none' | 'soft' | 'rock' | 'swagger';
  arp: boolean;
  lead?: number[]; // optional melody (semitones, -99 = rest), 8th notes
  bassStyle: 'pulse' | 'root' | 'walk';
}

const PRESETS: Record<string, Preset> = {
  title: { bpm: 96, root: 45, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [12, -99, 10, 12, 15, -99, 14, 12, 10, -99, 7, -99, 8, 7, 5, -99] },
  wyvern_soundcheck: { bpm: 84, root: 40, chords: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [2, 5, 9]], drums: 'soft', arp: false, bassStyle: 'root' },
  wyvern_live: { bpm: 124, root: 40, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [7, 7, 10, 12, -99, 12, 10, 7, 5, -99, 3, 5, 7, -99, -99, -99] },
  alley_rex: { bpm: 110, root: 43, chords: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]], drums: 'swagger', arp: false, bassStyle: 'walk',
    lead: [12, -99, 12, 14, 16, -99, 12, -99, 17, 16, 14, 12, 14, -99, -99, -99] },
  alley_night: { bpm: 78, root: 38, chords: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-5, -2, 2]], drums: 'soft', arp: true, bassStyle: 'root' },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private preset: Preset | null = null;
  private step = 0;
  private nextTime = 0;
  private pendingBgm = '';
  muted = false;

  /** Must be called from a user gesture (browser autoplay rules). */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.42;
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.7;
    // cheap reverb: feedback delay
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.27;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.25;
    this.music.connect(this.master);
    this.music.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    this.sfx.connect(this.master);
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (this.pendingBgm) this.playBgm(this.pendingBgm);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  playBgm(id: string): void {
    this.pendingBgm = id;
    if (!this.ctx) return;
    const p = PRESETS[id];
    if (this.preset === p) return;
    this.preset = p ?? null;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule(): void {
    const ctx = this.ctx;
    const p = this.preset;
    if (!ctx || !p) return;
    const sixteenth = 60 / p.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(p, this.step, this.nextTime, sixteenth);
      this.step++;
      this.nextTime += sixteenth;
    }
  }

  private playStep(p: Preset, step: number, t: number, dur: number): void {
    const bar = Math.floor(step / 16) % p.chords.length;
    const s = step % 16;
    const chord = p.chords[bar];
    // pad on bar start
    if (s === 0) for (const n of chord) this.tone('sawtooth', mtof(p.root + 12 + n), t, dur * 16, 0.05, 900, 0.4, 6);
    // bass
    if (p.bassStyle === 'pulse' && s % 2 === 0) this.tone('sawtooth', mtof(p.root + chord[0] - 12), t, dur * 1.6, 0.16, 420, 0.005);
    if (p.bassStyle === 'root' && (s === 0 || s === 8)) this.tone('triangle', mtof(p.root + chord[0] - 12), t, dur * 7, 0.22, 600, 0.02);
    if (p.bassStyle === 'walk' && s % 4 === 0) this.tone('square', mtof(p.root + [0, 4, 7, 9][s / 4] + chord[0] - 12), t, dur * 3, 0.1, 700, 0.01);
    // arp
    if (p.arp && s % 2 === 1) this.tone('square', mtof(p.root + 24 + chord[(s >> 1) % chord.length]), t, dur * 0.9, 0.035, 2400, 0.002);
    // lead
    if (p.lead && s % 2 === 0) {
      const n = p.lead[(s / 2 + (bar % 2) * 8) % p.lead.length];
      if (n !== -99) this.tone('sawtooth', mtof(p.root + 12 + n), t, dur * 1.8, 0.06, 2600, 0.01, 4);
    }
    // drums
    if (p.drums === 'none') return;
    if (p.drums === 'soft') {
      if (s === 0) this.kick(t, 0.35);
      if (s % 4 === 2) this.hat(t, 0.04);
      return;
    }
    if (p.drums === 'rock') {
      if (s === 0 || s === 8 || s === 10) this.kick(t, 0.6);
      if (s === 4 || s === 12) this.snare(t, 0.35);
      if (s % 2 === 0) this.hat(t, 0.06);
      return;
    }
    if (p.drums === 'swagger') {
      if (s === 0 || s === 7 || s === 10) this.kick(t, 0.55);
      if (s === 4 || s === 12) this.snare(t, 0.3);
      if (s % 4 === 2) this.hat(t, 0.07);
    }
  }

  private tone(type: OscillatorType, freq: number, t: number, dur: number, vol: number, cutoff: number, attack: number, detune = 0, out?: AudioNode): void {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(out ?? this.music);
    const oscs = detune ? [-detune, detune] : [0];
    for (const dt of oscs) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = dt;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  private kick(t: number, vol: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.3);
  }

  private noiseHit(t: number, vol: number, dur: number, type: BiquadFilterType, freq: number, out?: AudioNode): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(out ?? this.music);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private snare(t: number, vol: number) {
    this.noiseHit(t, vol, 0.18, 'bandpass', 1800);
  }
  private hat(t: number, vol: number) {
    this.noiseHit(t, vol, 0.05, 'highpass', 7000);
  }

  /** Synthesized sound effects keyed by the ids used in scenes (@sfx). */
  playSfx(id: string): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const out = this.sfx;
    switch (id) {
      case 'mop':
        this.noiseHit(t, 0.4, 0.35, 'bandpass', 900, out);
        this.noiseHit(t + 0.3, 0.3, 0.3, 'bandpass', 700, out);
        break;
      case 'amp_buzz':
        this.tone('sawtooth', 60, t, 1.2, 0.18, 800, 0.02, 0, out);
        this.tone('sawtooth', 120, t, 1.2, 0.08, 1200, 0.02, 0, out);
        break;
      case 'switch':
        this.noiseHit(t, 0.5, 0.03, 'highpass', 3000, out);
        break;
      case 'clunk':
      case 'thump':
        this.tone('sine', 90, t, 0.25, 0.6, 400, 0.002, 0, out);
        this.noiseHit(t, 0.3, 0.12, 'lowpass', 600, out);
        break;
      case 'guitar_riff':
        [0, 7, 12].forEach((n, i) => this.tone('sawtooth', mtof(52 + n), t + i * 0.01, 1.6, 0.12, 2200, 0.005, 12, out));
        break;
      case 'coins':
        [0, 0.08, 0.16, 0.24].forEach((d, i) => this.tone('square', mtof(84 + i * 2), t + d, 0.12, 0.08, 6000, 0.002, 0, out));
        break;
      case 'barrel':
        this.tone('sine', 120, t, 0.5, 0.5, 500, 0.002, 0, out);
        this.noiseHit(t, 0.4, 0.4, 'bandpass', 400, out);
        break;
      case 'punch':
        this.noiseHit(t, 0.8, 0.12, 'lowpass', 900, out);
        this.tone('sine', 70, t, 0.2, 0.6, 300, 0.002, 0, out);
        break;
      case 'trash':
        this.noiseHit(t, 0.5, 0.5, 'bandpass', 1500, out);
        break;
      case 'engine': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(80, t);
        o.frequency.exponentialRampToValueAtTime(320, t + 1.0);
        o.frequency.exponentialRampToValueAtTime(60, t + 2.2);
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
        const f = ctx.createBiquadFilter();
        f.frequency.value = 900;
        o.connect(f).connect(g).connect(out);
        o.start(t);
        o.stop(t + 2.5);
        break;
      }
      case 'ledger':
        this.noiseHit(t, 0.15, 0.25, 'highpass', 4000, out);
        this.noiseHit(t + 0.25, 0.12, 0.2, 'highpass', 4500, out);
        break;
      case 'select':
        this.tone('square', 880, t, 0.06, 0.06, 5000, 0.002, 0, out);
        break;
      case 'confirm':
        this.tone('square', 660, t, 0.06, 0.06, 5000, 0.002, 0, out);
        this.tone('square', 990, t + 0.06, 0.08, 0.06, 5000, 0.002, 0, out);
        break;
      case 'card':
        this.tone('sawtooth', mtof(45), t, 2.5, 0.12, 1200, 0.3, 10, out);
        this.tone('sawtooth', mtof(52), t, 2.5, 0.1, 1200, 0.3, 10, out);
        break;
    }
  }

  /** Per-character "voice blip" while text types out. */
  blip(pitch: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.tone('square', pitch * (0.95 + Math.random() * 0.1), ctx.currentTime, 0.045, 0.025, 3000, 0.002, 0, this.sfx);
  }
}
