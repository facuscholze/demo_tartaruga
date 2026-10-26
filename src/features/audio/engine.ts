"use client";
import { withBase } from "@/lib/base";

/**
 * Audio ambiente 100% OPT-IN, sintetizado con Web Audio API nativa.
 *
 * Por qué síntesis y no mp3: 0 KB bajados, 0 riesgo de licencia, loop perfecto
 * (no se nota el corte) y el analizador puede gobernar el fuego y las luces.
 * Si preferís grabaciones propias: ponele `olas.mp3` / `fuego.mp3` /
 * `brisa.mp3` a `public/audio/` y el motor las usa en vez del sintetizador.
 *
 * Nunca hay autoplay: `start()` solo se llama desde un gesto del usuario.
 */
export type AmbienceLayer = "olas" | "fuego" | "brisa";

type LayerNode = {
  gain: GainNode;
  stop: () => void;
  target: number;
};

const LAYER_LEVEL: Record<AmbienceLayer, number> = { olas: 0.55, fuego: 0.34, brisa: 0.2 };

function makeNoiseBuffer(ctx: AudioContext, seconds: number, color: "white" | "brown" | "pink") {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (color === "white") data[i] = white;
    else if (color === "brown") {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.2;
    } else {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
    }
  }
  // Crossfade de los bordes para que el loop no se escuche.
  const fade = Math.floor(ctx.sampleRate * 0.25);
  for (let i = 0; i < fade; i += 1) {
    const t = i / fade;
    data[i] = (data[i] ?? 0) * t;
    data[length - 1 - i] = (data[length - 1 - i] ?? 0) * t;
  }
  return buffer;
}

export class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private layers = new Map<AmbienceLayer, LayerNode>();
  private data: Uint8Array<ArrayBuffer> | null = null;
  private level = 1;
  running = false;
  mode: "synth" | "files" = "synth";

  get supported() {
    if (typeof window === "undefined") return false;
    const withWebkit = window as unknown as {
      AudioContext?: unknown;
      webkitAudioContext?: unknown;
    };
    return Boolean(withWebkit.AudioContext ?? withWebkit.webkitAudioContext);
  }

  async start(volume = 0.5) {
    if (!this.supported) return false;
    this.level = Math.max(0, Math.min(1, volume));
    if (this.running) {
      await this.ctx?.resume();
      this.fadeMaster(1);
      return true;
    }

    const WithWebkit = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = WithWebkit.AudioContext ?? WithWebkit.webkitAudioContext;
    if (!Ctor) return false;
    const ctx = new Ctor();
    this.ctx = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;
    master.connect(analyser);
    analyser.connect(ctx.destination);
    this.data = new Uint8Array(analyser.frequencyBinCount);
    this.master = master;
    this.analyser = analyser;

    const usedFiles = await this.tryFiles(ctx, master);
    if (!usedFiles) {
      this.buildOcean(ctx, master);
      this.buildFire(ctx, master);
      this.buildBreeze(ctx, master);
    }

    this.running = true;
    this.fadeMaster(1, 2.6);
    return true;
  }

  private fadeMaster(target: number, seconds = 0.9) {
    const master = this.master;
    const ctx = this.ctx;
    if (!master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target * this.level * 0.5, now + seconds);
  }

  /** Nivel RMS 0..1 para que el fuego y las luces latan con el sonido. */
  readLevel(): number {
    const analyser = this.analyser;
    const data = this.data;
    if (!analyser || !data) return 0;
    analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const value = ((data[i] ?? 128) - 128) / 128;
      sum += value * value;
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 3.4);
  }

  setLayer(layer: AmbienceLayer, on: boolean) {
    const node = this.layers.get(layer);
    const ctx = this.ctx;
    if (!node || !ctx) return;
    node.target = on ? LAYER_LEVEL[layer] : 0;
    node.gain.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.gain.setTargetAtTime(node.target, ctx.currentTime, 0.8);
  }

  setVolume(value: number) {
    this.level = Math.max(0, Math.min(1, value));
    this.fadeMaster(this.running ? 1 : 0, 0.35);
  }

  suspend() {
    if (!this.running) return;
    this.fadeMaster(0, 0.5);
    window.setTimeout(() => {
      if (!this.running) void this.ctx?.suspend();
    }, 520);
  }

  stop() {
    this.running = false;
    this.fadeMaster(0, 0.45);
    const ctx = this.ctx;
    window.setTimeout(() => {
      for (const layer of this.layers.values()) layer.stop();
      this.layers.clear();
      void ctx?.close();
      this.ctx = null;
      this.master = null;
      this.analyser = null;
    }, 520);
  }

  private register(layer: AmbienceLayer, gain: GainNode, stop: () => void) {
    gain.gain.value = LAYER_LEVEL[layer];
    this.layers.set(layer, { gain, stop, target: LAYER_LEVEL[layer] });
  }

  private noiseSource(ctx: AudioContext, color: "white" | "brown" | "pink", seconds: number) {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, seconds, color);
    source.loop = true;
    source.start();
    return source;
  }

  private buildOcean(ctx: AudioContext, master: GainNode) {
    const source = this.noiseSource(ctx, "brown", 6);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();

    // Rompiente: LFO lento de amplitud + filtro que abre y cierra.
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.09;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.34;
    swell.connect(swellGain).connect(gain.gain);
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.06;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 150;
    breath.connect(breathGain).connect(filter.frequency);
    gain.gain.value = 0.5;

    source.connect(filter).connect(gain).connect(master);
    swell.start();
    breath.start();
    this.register("olas", gain, () => {
      source.stop();
      swell.stop();
      breath.stop();
    });
  }

  private buildFire(ctx: AudioContext, master: GainNode) {
    const body = this.noiseSource(ctx, "pink", 4);
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = "bandpass";
    bodyFilter.frequency.value = 620;
    bodyFilter.Q.value = 0.7;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.55;

    // Crepitar: ruidos cortos de alta frecuencia en ráfagas pseudoaleatorias.
    const crackle = this.noiseSource(ctx, "white", 3);
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = "highpass";
    crackleFilter.frequency.value = 2400;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.0;
    const schedule = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      const burst = 0.004 + Math.random() * 0.02;
      crackleGain.gain.cancelScheduledValues(now);
      crackleGain.gain.setValueAtTime(0.16 + Math.random() * 0.2, now);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + burst);
      this.timers.push(window.setTimeout(schedule, 25 + Math.random() * 190));
    };
    schedule();

    const gain = ctx.createGain();
    gain.gain.value = LAYER_LEVEL.fuego;
    body.connect(bodyFilter).connect(bodyGain).connect(gain);
    crackle.connect(crackleFilter).connect(crackleGain).connect(gain);
    gain.connect(master);
    this.register("fuego", gain, () => {
      body.stop();
      crackle.stop();
    });
  }

  private buildBreeze(ctx: AudioContext, master: GainNode) {
    const source = this.noiseSource(ctx, "pink", 5);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.9;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.09;
    const gain = ctx.createGain();
    gain.gain.value = LAYER_LEVEL.brisa;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    source.connect(filter).connect(gain).connect(master);
    this.register("brisa", gain, () => {
      source.stop();
      lfo.stop();
    });
  }

  /** Usa `public/audio/*.mp3` si existen (HEAD ok y decodificable). */
  private async tryFiles(ctx: AudioContext, master: GainNode): Promise<boolean> {
    // `withBase`: en project pages el audio vive en /<repo>/audio/…
    const dir = withBase(process.env.NEXT_PUBLIC_AUDIO_DIR ?? "/audio");
    let built = 0;
    for (const layer of ["olas", "fuego", "brisa"] as AmbienceLayer[]) {
      try {
        const response = await fetch(`${dir}/${layer}.mp3`, {
          method: "GET",
          cache: "force-cache",
        });
        if (!response.ok) continue;
        const buffer = await response.arrayBuffer();
        const audio = await ctx.decodeAudioData(buffer);
        const source = ctx.createBufferSource();
        source.buffer = audio;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = LAYER_LEVEL[layer];
        source.connect(gain).connect(master);
        source.start();
        this.register(layer, gain, () => source.stop());
        built += 1;
      } catch {
        // sin archivo o formato no soportado: sigue el sintetizador
      }
    }
    if (built > 0) this.mode = "files";
    return built === 3;
  }

  private timers: number[] = [];
}

export const ambience = new AmbienceEngine();
