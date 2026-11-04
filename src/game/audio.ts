/**
 * Placeholder procedural synthwave score + synthesized SFX (Web Audio).
 * The real score comes from the AI-music pipeline (DESIGN.md §9); cue ids stay the same,
 * so swapping in recorded tracks later is a data change.
 */

interface Preset {
  bpm: number;
  root: number; // MIDI note
  chords: number[][]; // semitone offsets per bar
  drums: 'none' | 'soft' | 'rock' | 'swagger' | 'heart' | 'shuffle';
  arp: boolean;
  lead?: number[]; // optional melody (semitones, -99 = rest), 8th notes
  bassStyle: 'pulse' | 'root' | 'walk';
  /** Rehearsal feel: play this many bars, then rest this many (a band stopping and starting). */
  gaps?: [play: number, rest: number];
}

const PRESETS: Record<string, Preset> = {
  title: { bpm: 96, root: 45, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [12, -99, 10, 12, 15, -99, 14, 12, 10, -99, 7, -99, 8, 7, 5, -99] },
  wyvern_soundcheck: { bpm: 84, root: 40, chords: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [2, 5, 9]], drums: 'soft', arp: false, bassStyle: 'root' },
  wyvern_live: { bpm: 124, root: 40, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [7, 7, 10, 12, -99, 12, 10, 7, 5, -99, 3, 5, 7, -99, -99, -99] },
  alley_rex: { bpm: 110, root: 43, chords: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]], drums: 'swagger', arp: false, bassStyle: 'walk',
    lead: [12, -99, 12, 14, 16, -99, 12, -99, 17, 16, 14, 12, 14, -99, -99, -99] },
  // Positional band layers (MapDef.sounds): Roxy's Wildfires on stage.
  band_rehearsal: { bpm: 124, root: 40, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], drums: 'rock', arp: false, bassStyle: 'pulse',
    lead: [7, 7, 10, 12, -99, 12, 10, 7, 5, -99, 3, 5, 7, -99, -99, -99], gaps: [3, 2] },
  band_live: { bpm: 124, root: 40, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [7, 7, 10, 12, -99, 12, 10, 7, 5, -99, 3, 5, 7, -99, -99, -99] },
  // Fights (THE SET). Placeholder until the Suno pass (DESIGN §9).
  battle_alley: { bpm: 150, root: 43, chords: [[0, 3, 7], [0, 3, 7], [-2, 2, 5], [1, 5, 8]], drums: 'rock', arp: true, bassStyle: 'walk',
    lead: [12, 15, 12, 10, 12, -99, 7, 10, 12, 15, 17, 15, 12, -99, 10, -99] },
  battle_bellshell: { bpm: 138, root: 38, chords: [[0, 3, 7], [1, 4, 8], [0, 3, 7], [-1, 3, 6]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [12, -99, 13, 12, -99, 8, 7, -99, 12, -99, 13, 15, 13, 12, 8, -99] },
  // "Burn Forever": the impossible song, two lead lines (Leagues' and Roxy's) answering each other.
  burn_forever: { bpm: 172, root: 40, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], drums: 'rock', arp: true, bassStyle: 'walk',
    lead: [19, 16, 14, 12, 11, 12, 14, 16, 23, -99, 21, 19, 16, 19, 21, 24] },
  // The monster-attack pulse that replaces the room tone after the screams.
  monster_pulse: { bpm: 66, root: 33, chords: [[0, 1, 6], [0, 1, 6], [-1, 0, 5], [-2, 1, 6]], drums: 'heart', arp: false, bassStyle: 'root' },
  // Jukebox (storyboard v2): five songs that change the room tone.
  juke_neon_heart: { bpm: 100, root: 45, chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], drums: 'rock', arp: true, bassStyle: 'pulse',
    lead: [7, -99, 7, 9, 11, -99, 9, 7, 4, -99, 4, 2, 4, -99, -99, -99] },
  juke_halcyon: { bpm: 72, root: 42, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]], drums: 'soft', arp: true, bassStyle: 'root',
    lead: [16, -99, -99, 14, 12, -99, 11, -99, 12, -99, -99, -99, -99, -99, -99, -99] },
  juke_dockside: { bpm: 118, root: 43, chords: [[0, 4, 7, 10], [0, 4, 7, 10], [5, 9, 12, 15], [0, 4, 7, 10]], drums: 'shuffle', arp: false, bassStyle: 'walk',
    lead: [12, 10, 7, -99, 10, 12, -99, 15, 12, -99, 10, 7, 5, -99, 7, -99] },
  juke_burn_slow: { bpm: 96, root: 40, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], drums: 'rock', arp: false, bassStyle: 'pulse',
    lead: [7, -99, 7, 10, 12, -99, 10, 7, 5, -99, 3, 5, 7, -99, -99, -99] },
  // Rex's demo: enthusiastic, and a quarter-tone wrong in all the important places.
  juke_valor: { bpm: 132, root: 41, chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]], drums: 'swagger', arp: false, bassStyle: 'walk',
    lead: [12, 12, 12, 13, 12, -99, 11, 12, 16, 16, 15.5, 14, 12, -99, 12.5, -99] },
  alley_night: { bpm: 78, root: 38, chords: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-5, -2, 2]], drums: 'soft', arp: true, bassStyle: 'root' },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** One sequenced music voice (the room bgm, or a positional layer such as the band) with its own gain and filter. */
interface Layer {
  preset: Preset;
  presetId: string;
  step: number;
  nextTime: number;
  gain: GainNode;
  filter: BiquadFilterNode;
}

export interface LayerMix {
  id: string;
  preset: string;
  gain: number;
  muffled: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private layers = new Map<string, Layer>();
  private pendingBgm = '';
  private pendingMix: LayerMix[] = [];
  /** 0..1: how much the room bgm is ducked under positional layers. */
  private duck = 0;
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
    if (this.pendingMix.length) this.setLayers(this.pendingMix);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  playBgm(id: string): void {
    this.pendingBgm = id;
    if (!this.ctx) return;
    this.ensureLayer('bgm', id, 1, false);
  }

  /**
   * Positional layers for this frame (from core soundGains). Missing layers fade out; the room bgm ducks a
   * little under the loudest layer so the band reads as "over there" rather than a second soundtrack.
   */
  setLayers(mix: LayerMix[]): void {
    this.pendingMix = mix;
    if (!this.ctx) return;
    const keep = new Set(['bgm']);
    let loudest = 0;
    for (const m of mix) {
      keep.add(m.id);
      this.ensureLayer(m.id, m.preset, m.gain, m.muffled);
      if (!m.muffled) loudest = Math.max(loudest, m.gain);
    }
    for (const [id, layer] of this.layers) {
      if (keep.has(id)) continue;
      layer.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      const l = layer;
      window.setTimeout(() => {
        if (this.layers.get(id) === l) {
          this.layers.delete(id);
          l.gain.disconnect();
        }
      }, 1500);
    }
    const duck = Math.min(0.6, loudest * 0.6);
    if (Math.abs(duck - this.duck) > 0.01) {
      this.duck = duck;
      this.layers.get('bgm')?.gain.gain.setTargetAtTime(1 - duck, this.ctx.currentTime, 0.2);
    }
  }

  private ensureLayer(id: string, presetId: string, gain: number, muffled: boolean): void {
    const ctx = this.ctx!;
    const p = PRESETS[presetId];
    let layer = this.layers.get(id);
    if (layer && layer.presetId !== presetId) {
      // Preset change: fade the old voice out and start fresh.
      const old = layer;
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      window.setTimeout(() => old.gain.disconnect(), 1000);
      this.layers.delete(id);
      layer = undefined;
    }
    if (!p) return;
    if (!layer) {
      const g = ctx.createGain();
      g.gain.value = 0;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 18000;
      f.connect(g).connect(this.music);
      layer = { preset: p, presetId, step: 0, nextTime: ctx.currentTime + 0.1, gain: g, filter: f };
      this.layers.set(id, layer);
    }
    const target = id === 'bgm' ? 1 - this.duck : gain;
    layer.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.12);
    layer.filter.frequency.setTargetAtTime(muffled ? 650 : 18000, ctx.currentTime, 0.1);
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    for (const layer of this.layers.values()) {
      const p = layer.preset;
      const sixteenth = 60 / p.bpm / 4;
      if (layer.nextTime < ctx.currentTime - 0.5) layer.nextTime = ctx.currentTime + 0.05; // tab was asleep
      while (layer.nextTime < ctx.currentTime + 0.12) {
        const bar = Math.floor(layer.step / 16);
        const resting = p.gaps && bar % (p.gaps[0] + p.gaps[1]) >= p.gaps[0];
        if (!resting) this.playStep(p, layer.step, layer.nextTime, sixteenth, layer.filter);
        layer.step++;
        layer.nextTime += sixteenth;
      }
    }
  }

  private playStep(p: Preset, step: number, t: number, dur: number, out: AudioNode): void {
    const bar = Math.floor(step / 16) % p.chords.length;
    const s = step % 16;
    const chord = p.chords[bar];
    // pad on bar start
    if (s === 0) for (const n of chord) this.tone('sawtooth', mtof(p.root + 12 + n), t, dur * 16, 0.05, 900, 0.4, 6, out);
    // bass
    if (p.bassStyle === 'pulse' && s % 2 === 0) this.tone('sawtooth', mtof(p.root + chord[0] - 12), t, dur * 1.6, 0.16, 420, 0.005, 0, out);
    if (p.bassStyle === 'root' && (s === 0 || s === 8)) this.tone('triangle', mtof(p.root + chord[0] - 12), t, dur * 7, 0.22, 600, 0.02, 0, out);
    if (p.bassStyle === 'walk' && s % 4 === 0) this.tone('square', mtof(p.root + [0, 4, 7, 9][s / 4] + chord[0] - 12), t, dur * 3, 0.1, 700, 0.01, 0, out);
    // arp
    if (p.arp && s % 2 === 1) this.tone('square', mtof(p.root + 24 + chord[(s >> 1) % chord.length]), t, dur * 0.9, 0.035, 2400, 0.002, 0, out);
    // lead
    if (p.lead && s % 2 === 0) {
      const n = p.lead[(s / 2 + (bar % 2) * 8) % p.lead.length];
      if (n !== -99) this.tone('sawtooth', mtof(p.root + 12 + n), t, dur * 1.8, 0.06, 2600, 0.01, 4, out);
    }
    // drums
    if (p.drums === 'none') return;
    if (p.drums === 'soft') {
      if (s === 0) this.kick(t, 0.35, out);
      if (s % 4 === 2) this.hat(t, 0.04, out);
      return;
    }
    if (p.drums === 'rock') {
      if (s === 0 || s === 8 || s === 10) this.kick(t, 0.6, out);
      if (s === 4 || s === 12) this.snare(t, 0.35, out);
      if (s % 2 === 0) this.hat(t, 0.06, out);
      return;
    }
    if (p.drums === 'heart') {
      if (s === 0 || s === 3) this.kick(t, s === 0 ? 0.55 : 0.35, out);
      return;
    }
    if (p.drums === 'shuffle') {
      if (s === 0 || s === 8) this.kick(t, 0.5, out);
      if (s === 4 || s === 12) this.snare(t, 0.25, out);
      if (s % 4 === 0 || s % 4 === 3) this.hat(t, 0.05, out);
      return;
    }
    if (p.drums === 'swagger') {
      if (s === 0 || s === 7 || s === 10) this.kick(t, 0.55, out);
      if (s === 4 || s === 12) this.snare(t, 0.3, out);
      if (s % 4 === 2) this.hat(t, 0.07, out);
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

  private kick(t: number, vol: number, out: AudioNode = this.music): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(out);
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

  private snare(t: number, vol: number, out?: AudioNode) {
    this.noiseHit(t, vol, 0.18, 'bandpass', 1800, out);
  }
  private hat(t: number, vol: number, out?: AudioNode) {
    this.noiseHit(t, vol, 0.05, 'highpass', 7000, out);
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
      case 'door':
        this.noiseHit(t, 0.25, 0.4, 'lowpass', 500, out);
        this.tone('sine', 140, t + 0.05, 0.6, 0.15, 400, 0.01, 0, out);
        break;
      case 'organ':
        for (const n of [28, 40, 47, 52]) this.tone('sine', mtof(n), t, 3.2, 0.12, 2000, 0.2, 4, out);
        break;
      case 'big_chord':
        for (const n of [40, 47, 52, 56, 59, 64]) this.tone('sawtooth', mtof(n), t, 2.6, 0.07, 2800, 0.004, 14, out);
        this.noiseHit(t, 0.4, 0.3, 'bandpass', 2000, out);
        break;
      case 'cheer':
        for (let i = 0; i < 6; i++) this.noiseHit(t + i * 0.12, 0.18, 1.2, 'bandpass', 900 + i * 220, out);
        break;
      case 'scream':
        for (const [d, f] of [[0, 900], [0.25, 1150], [0.5, 780]]) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, t + d);
          o.frequency.exponentialRampToValueAtTime(f * 0.55, t + d + 0.9);
          g.gain.setValueAtTime(0.0001, t + d);
          g.gain.exponentialRampToValueAtTime(0.07, t + d + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.95);
          const fl = ctx.createBiquadFilter();
          fl.type = 'bandpass';
          fl.frequency.value = 1400;
          o.connect(fl).connect(g).connect(out);
          o.start(t + d);
          o.stop(t + d + 1);
        }
        break;
      case 'crab_clang':
        // a cracked bell: two partials a hair apart, beating
        this.tone('triangle', 196, t, 1.6, 0.22, 3000, 0.002, 0, out);
        this.tone('triangle', 203, t, 1.6, 0.18, 3000, 0.002, 0, out);
        this.tone('sine', 471, t, 0.9, 0.08, 3000, 0.002, 0, out);
        break;
      case 'bell_true':
        this.tone('sine', 196, t, 4, 0.25, 4000, 0.003, 0, out);
        this.tone('sine', 392, t, 3, 0.1, 4000, 0.003, 0, out);
        this.tone('sine', 588, t, 2.2, 0.06, 4000, 0.003, 0, out);
        break;
      case 'glass':
        for (let i = 0; i < 10; i++) this.tone('sine', 2200 + Math.random() * 2600, t + i * 0.03, 0.25, 0.05, 9000, 0.001, 0, out);
        this.noiseHit(t, 0.5, 0.4, 'highpass', 3000, out);
        break;
      case 'battle_sting':
        for (const [i, n] of [45, 52, 57, 60].entries()) this.tone('sawtooth', mtof(n), t + i * 0.07, 1.4, 0.08, 2400, 0.004, 10, out);
        this.kick(t, 0.8, out);
        break;
      case 'swing':
        this.noiseHit(t, 0.25, 0.14, 'bandpass', 2400, out);
        break;
      case 'hit':
        this.noiseHit(t, 0.6, 0.1, 'lowpass', 1200, out);
        this.tone('sine', 85, t, 0.15, 0.4, 300, 0.002, 0, out);
        break;
      case 'heal':
        [0, 4, 7, 12].forEach((n, i) => this.tone('triangle', mtof(76 + n), t + i * 0.06, 0.4, 0.06, 6000, 0.005, 0, out));
        break;
      case 'lift':
        this.tone('sine', 220, t, 0.5, 0.15, 1800, 0.01, 30, out);
        this.noiseHit(t, 0.3, 0.2, 'bandpass', 600, out);
        break;
      case 'break':
        this.noiseHit(t, 0.7, 0.3, 'bandpass', 1600, out);
        this.tone('square', 110, t, 0.3, 0.2, 800, 0.002, 0, out);
        break;
      case 'read':
        [0, 7].forEach((n, i) => this.tone('square', mtof(84 + n), t + i * 0.08, 0.1, 0.05, 6000, 0.002, 0, out));
        break;
      case 'toll':
        this.tone('triangle', 98, t, 2.4, 0.35, 2000, 0.002, 0, out);
        this.tone('triangle', 102, t, 2.4, 0.3, 2000, 0.002, 0, out);
        this.noiseHit(t, 0.4, 0.6, 'lowpass', 400, out);
        break;
      case 'ko':
        this.tone('sawtooth', 220, t, 0.6, 0.12, 900, 0.005, 0, out);
        this.tone('sawtooth', 110, t + 0.15, 0.7, 0.12, 700, 0.005, 0, out);
        break;
      case 'victory':
        [0, 4, 7, 12, 7, 12].forEach((n, i) => this.tone('square', mtof(72 + n), t + i * 0.11, 0.3, 0.07, 5000, 0.003, 0, out));
        break;
      case 'buzz':
        this.tone('square', 90, t, 0.18, 0.08, 900, 0.002, 0, out);
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
