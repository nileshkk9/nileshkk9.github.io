import type { WorldId } from "@/worlds/registry";

type Pad = { nodes: AudioScheduledSourceNode[]; out: GainNode };

/** Root frequency (Hz) and chord intervals (semitones) for each world's ambient pad. */
const CHORDS: Record<WorldId | "intro", { root: number; notes: number[]; cutoff: number }> = {
  intro: { root: 55, notes: [0, 7, 12], cutoff: 420 },
  origin: { root: 110, notes: [0, 7, 12, 16, 23], cutoff: 900 },
  legacy: { root: 87.31, notes: [0, 3, 7, 10], cutoff: 520 },
  logistics: { root: 73.42, notes: [0, 7, 14, 19], cutoff: 760 },
  nexus: { root: 65.41, notes: [0, 7, 12, 14, 19], cutoff: 820 },
  routeverse: { root: 82.41, notes: [0, 5, 7, 12, 17], cutoff: 700 },
  forge: { root: 49, notes: [0, 7, 10, 15], cutoff: 560 },
  archive: { root: 61.74, notes: [0, 7, 11, 14, 18], cutoff: 880 },
  future: { root: 55, notes: [0, 7, 12, 19, 24], cutoff: 1100 },
};

const semis = (root: number, n: number) => root * Math.pow(2, n / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padBus!: GainNode;
  private fxBus!: GainNode;
  private noise!: AudioBuffer;
  private pad: Pad | null = null;
  private padKey: string | null = null;
  private muted = false;
  private lastHover = 0;
  private lastKey = 0;

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  /** Must be called from a user gesture; safe to call repeatedly. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 3;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(comp).connect(ctx.destination);
      this.padBus = ctx.createGain();
      this.padBus.gain.value = 0.5;
      this.padBus.connect(this.master);
      this.fxBus = ctx.createGain();
      this.fxBus.gain.value = 0.6;
      this.fxBus.connect(this.master);
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (this.padKey) {
        const key = this.padKey;
        this.padKey = null;
        this.setWorld(key as WorldId);
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.applyMute();
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyMute();
  }

  private applyMute() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.25);
  }

  /** Crossfade to the ambient pad for a world. */
  setWorld(id: WorldId | "intro") {
    if (this.padKey === id) return;
    this.padKey = id;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (this.pad) {
      const old = this.pad;
      old.out.gain.cancelScheduledValues(now);
      old.out.gain.setTargetAtTime(0, now, 0.9);
      old.nodes.forEach((n) => n.stop(now + 5));
    }
    const chord = CHORDS[id];
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(1, now + 0.2, 1.4);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = chord.cutoff;
    filter.Q.value = 0.6;
    filter.connect(out).connect(this.padBus);
    const nodes: AudioScheduledSourceNode[] = [];

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = chord.cutoff * 0.35;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    nodes.push(lfo);

    chord.notes.forEach((n, i) => {
      const f = semis(chord.root, n);
      [-6, 6].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "triangle" : "sawtooth";
        o.frequency.value = f;
        o.detune.value = cents + (Math.random() - 0.5) * 4;
        const g = ctx.createGain();
        g.gain.value = (i === 0 ? 0.05 : 0.018) / Math.sqrt(chord.notes.length);
        o.connect(g).connect(filter);
        o.start(now);
        nodes.push(o);
      });
    });

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = chord.root / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.05;
    sub.connect(subGain).connect(out);
    sub.start(now);
    nodes.push(sub);

    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.8;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.018;
    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.09;
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.value = 260;
    windLfo.connect(windLfoGain).connect(bp.frequency);
    wind.connect(bp).connect(windGain).connect(out);
    wind.start(now);
    windLfo.start(now);
    nodes.push(wind, windLfo);

    this.pad = { nodes, out };
  }

  /** Warp jump: rising noise sweep, then a low arrival thump. */
  warp(arriveIn = 1.15) {
    const ctx = this.ctx;
    if (!ctx || !this.ready) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(180, now);
    bp.frequency.exponentialRampToValueAtTime(4200, now + arriveIn);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + arriveIn * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, now + arriveIn + 0.5);
    src.connect(bp).connect(g).connect(this.fxBus);
    src.start(now);
    src.stop(now + arriveIn + 0.6);

    const riser = ctx.createOscillator();
    riser.type = "sine";
    riser.frequency.setValueAtTime(70, now);
    riser.frequency.exponentialRampToValueAtTime(520, now + arriveIn);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, now);
    rg.gain.exponentialRampToValueAtTime(0.08, now + arriveIn * 0.85);
    rg.gain.exponentialRampToValueAtTime(0.0001, now + arriveIn + 0.1);
    riser.connect(rg).connect(this.fxBus);
    riser.start(now);
    riser.stop(now + arriveIn + 0.2);

    const t = now + arriveIn;
    const boom = ctx.createOscillator();
    boom.type = "sine";
    boom.frequency.setValueAtTime(110, t);
    boom.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    boom.connect(bg).connect(this.fxBus);
    boom.start(t);
    boom.stop(t + 1.5);
  }

  private tone(freq: number, at: number, dur: number, peak: number, type: OscillatorType = "sine") {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.fxBus);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  /** Objective complete: a bright two-note chime. */
  chime() {
    if (!this.ready) return;
    const t = this.ctx!.currentTime;
    this.tone(880, t, 0.9, 0.09);
    this.tone(1318.5, t + 0.09, 1.2, 0.07);
    this.tone(1760, t + 0.18, 1.4, 0.035);
  }

  /** Bigger flourish for finishing a world. */
  fanfare() {
    if (!this.ready) return;
    const t = this.ctx!.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.11, 1.8, 0.06, "triangle"));
  }

  click() {
    if (!this.ready) return;
    const t = this.ctx!.currentTime;
    this.tone(1400, t, 0.06, 0.035, "triangle");
  }

  hover() {
    if (!this.ready) return;
    const now = performance.now();
    if (now - this.lastHover < 90) return;
    this.lastHover = now;
    this.tone(2200, this.ctx!.currentTime, 0.04, 0.012);
  }

  /** Mechanical key press: a filtered noise click over a short low thock, varied per key. */
  key(kind: "char" | "space" | "heavy" = "char") {
    if (!this.ready) return;
    const now = performance.now();
    if (now - this.lastKey < 26) return;
    this.lastKey = now;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const loud = kind === "heavy" ? 1.3 : kind === "space" ? 0.7 : 1;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = (kind === "space" ? 1500 : 2600) + Math.random() * 1600;
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11 * loud * (0.75 + Math.random() * 0.5), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(bp).connect(g).connect(this.fxBus);
    src.start(t, Math.random() * 1.8, 0.04);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime((kind === "heavy" ? 150 : 210) + Math.random() * 40, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.04);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.06 * loud, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(og).connect(this.fxBus);
    o.start(t);
    o.stop(t + 0.07);
  }

  /** Terminal confirmation blip when a boot line reports OK. */
  ok() {
    if (!this.ready) return;
    const t = this.ctx!.currentTime;
    this.tone(1046.5, t, 0.08, 0.03, "square");
    this.tone(1568, t + 0.06, 0.12, 0.022, "square");
  }

  panel() {
    if (!this.ready) return;
    const t = this.ctx!.currentTime;
    this.tone(660, t, 0.18, 0.04);
    this.tone(990, t + 0.05, 0.22, 0.03);
  }
}

export const audio = new AudioEngine();
