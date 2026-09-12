"use client";

/**
 * Amber Hours noise engine.
 *
 * All four ambient layers are synthesized entirely with the Web Audio API —
 * no external audio files. Each layer is a looping noise buffer routed
 * through a small filter chain that gives it its character, then into its
 * own gain node so volume/mute is per-layer.
 */

export type LayerId = "rain" | "vinyl" | "cafe" | "hiss";

interface Layer {
  id: LayerId;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  playing: boolean;
  volume: number;
}

const BUFFER_SECONDS = 4;

function createWhiteNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const frameCount = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Sparse random impulses shaped like vinyl surface crackle/pops. */
function createCrackleBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const frameCount = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    // low-level continuous surface hiss
    let sample = (Math.random() * 2 - 1) * 0.04;
    // occasional sharper pop
    if (Math.random() < 0.0018) {
      sample += (Math.random() * 2 - 1) * 0.9;
    }
    data[i] = sample;
  }
  return buffer;
}

function makeLoopingSource(ctx: AudioContext, buffer: AudioBuffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export class NoiseEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: Map<LayerId, Layer> = new Map();

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Must be called from a user gesture to satisfy autoplay policies. */
  async resume() {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  private buildChain(ctx: AudioContext, id: LayerId): Layer {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master!);

    let buffer: AudioBuffer;
    let source: AudioBufferSourceNode;

    switch (id) {
      case "rain": {
        buffer = createWhiteNoiseBuffer(ctx, BUFFER_SECONDS);
        source = makeLoopingSource(ctx, buffer);
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 1400;
        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 300;
        // gentle LFO on the lowpass cutoff for a "shifting shower" feel
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.07;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(lfoGain);
        lfoGain.connect(lowpass.frequency);
        lfo.start();

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(gain);

        return { id, source, gain, lfo, lfoGain, playing: false, volume: 0.6 };
      }

      case "vinyl": {
        buffer = createCrackleBuffer(ctx, BUFFER_SECONDS);
        source = makeLoopingSource(ctx, buffer);
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 2200;
        bandpass.Q.value = 0.6;

        source.connect(bandpass);
        bandpass.connect(gain);

        return { id, source, gain, playing: false, volume: 0.4 };
      }

      case "cafe": {
        buffer = createWhiteNoiseBuffer(ctx, BUFFER_SECONDS);
        source = makeLoopingSource(ctx, buffer);
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 550;
        bandpass.Q.value = 0.5;
        const bandpass2 = ctx.createBiquadFilter();
        bandpass2.type = "bandpass";
        bandpass2.frequency.value = 1200;
        bandpass2.Q.value = 0.4;
        // slow random murmur swell via LFO-driven gain
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.18;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.15;
        const murmurGain = ctx.createGain();
        murmurGain.gain.value = 0.85;
        lfo.connect(lfoGain);
        lfoGain.connect(murmurGain.gain);
        lfo.start();

        source.connect(bandpass);
        bandpass.connect(bandpass2);
        bandpass2.connect(murmurGain);
        murmurGain.connect(gain);

        return { id, source, gain, lfo, lfoGain, playing: false, volume: 0.35 };
      }

      case "hiss":
      default: {
        buffer = createWhiteNoiseBuffer(ctx, BUFFER_SECONDS);
        source = makeLoopingSource(ctx, buffer);
        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 4500;

        source.connect(highpass);
        highpass.connect(gain);

        return { id, source, gain, playing: false, volume: 0.25 };
      }
    }
  }

  async toggle(id: LayerId, on: boolean) {
    const ctx = this.ensureContext();
    await this.resume();

    let layer = this.layers.get(id);
    if (!layer) {
      layer = this.buildChain(ctx, id);
      this.layers.set(id, layer);
    }

    if (on && !layer.playing) {
      if (!layer.source) {
        // rebuild source (sources are single-use once stopped)
        const fresh = this.buildChain(ctx, id);
        layer.source = fresh.source;
        layer.gain.disconnect();
        this.layers.set(id, { ...fresh, gain: layer.gain, volume: layer.volume });
        layer = this.layers.get(id)!;
        layer.source!.connect(layer.gain);
      }
      layer.source!.start();
      layer.gain.gain.setTargetAtTime(layer.volume, ctx.currentTime, 0.4);
      layer.playing = true;
    } else if (!on && layer.playing) {
      layer.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      const src = layer.source;
      layer.playing = false;
      setTimeout(() => {
        try {
          src?.stop();
        } catch {
          /* already stopped */
        }
      }, 400);
      layer.source = null;
    }
  }

  setVolume(id: LayerId, volume: number) {
    const layer = this.layers.get(id);
    if (!layer) return;
    layer.volume = volume;
    if (layer.playing && this.ctx) {
      layer.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  isPlaying(id: LayerId) {
    return this.layers.get(id)?.playing ?? false;
  }

  /** Short synthesized bell for timer completion — no external file. */
  async playChime() {
    const ctx = this.ensureContext();
    await this.resume();
    const now = ctx.currentTime;
    [880, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.value = 0;
      osc.connect(g);
      g.connect(this.master!);
      const start = now + i * 0.12;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.start(start);
      osc.stop(start + 1.2);
    });
  }
}

let engineInstance: NoiseEngine | null = null;

export function getNoiseEngine(): NoiseEngine {
  if (!engineInstance) {
    engineInstance = new NoiseEngine();
  }
  return engineInstance;
}
