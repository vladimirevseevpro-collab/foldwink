/**
 * Foldwink Procedural WebAudio Engine
 *
 * Lightweight, zero-asset, procedural synthesizer generating tactile audio in real-time.
 * Strictly adheres to 0-leak invariant: 100% cleanup of AudioContext upon teardown.
 *
 * Sound Palette:
 * 1. Card Click: 20ms bandpass filtered noise pulse (tactile dry card/wood tap).
 * 2. Harmonic Solve: 4-tier harmonic progression (Root -> Major 3rd -> Fifth -> Octave).
 * 3. Error Thud: Low pitch-drop sine dropping to 50Hz.
 * 4. Origami Fold: Paper crease friction sweep.
 * 5. Tension Wobble: Near-miss acoustic beat.
 */

export interface ProceduralSynthConfig {
  volume?: number;
  muted?: boolean;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let config: ProceduralSynthConfig = { volume: 0.75, muted: false };

function isAudioSupported(): boolean {
  if (typeof window === "undefined" && typeof globalThis === "undefined") return false;
  const root = typeof window !== "undefined" ? window : (globalThis as unknown as Window);
  return Boolean(
    (root as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (root as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

export function getProceduralAudioContext(): AudioContext | null {
  if (!isAudioSupported()) return null;
  if (audioCtx && audioCtx.state !== "closed") return audioCtx;

  try {
    const root = typeof window !== "undefined" ? window : (globalThis as unknown as Window);
    const AC =
      (root as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (root as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;

    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = config.muted ? 0 : (config.volume ?? 0.75);
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  } catch {
    return null;
  }
}

export function setProceduralVolume(volume: number): void {
  config.volume = Math.max(0, Math.min(1, volume));
  if (masterGain && !config.muted) {
    masterGain.gain.value = config.volume;
  }
}

export function setProceduralMuted(muted: boolean): void {
  config.muted = muted;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : (config.volume ?? 0.75);
  }
}

export function isProceduralMuted(): boolean {
  return Boolean(config.muted);
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.05); // 50ms buffer
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // Pink-ish filtered noise for wood/card friction
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }
  noiseBuffer = buf;
  return buf;
}

/**
 * 1. Card Click:
 * Bandpass-filtered noise pulse lasting exactly 20ms (0.02s).
 * Simulates the dry, tactile snap of high-density cardboard on a wooden table.
 */
export function playCardClick(pitchMultiplier: number = 1.0): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.02; // 20ms pulse

  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(Math.min(6000, 1900 * pitchMultiplier), now);
  filter.Q.setValueAtTime(3.2, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  src.start(now);
  src.stop(now + duration + 0.005);
}

/**
 * 2. Harmonic Solve Chord:
 * 4 harmonic tiers adding progressive intervals:
 * - Stage 1: Root (C4 = 261.63 Hz)
 * - Stage 2: Major Third (E4 = 329.63 Hz)
 * - Stage 3: Fifth (G4 = 392.00 Hz)
 * - Stage 4: Octave (C5 = 523.25 Hz)
 */
const HARMONIC_STAGES: Record<1 | 2 | 3 | 4, number[]> = {
  1: [261.63],
  2: [261.63, 329.63],
  3: [261.63, 329.63, 392.00],
  4: [261.63, 329.63, 392.00, 523.25],
};

export function playHarmonicSolve(stage: 1 | 2 | 3 | 4): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const freqs = HARMONIC_STAGES[stage] || HARMONIC_STAGES[1];
  const now = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const startOffset = idx * 0.035;
    const startTime = now + startOffset;
    const duration = stage === 4 ? 0.65 : 0.38;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12 / freqs.length, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  });
}

/**
 * 3. Error Thud:
 * Low pitch-drop sine dropping exponentially to 50Hz.
 * Gives immediate visceral tactile feedback for an incorrect guess without harshness.
 */
export function playErrorThud(): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.18;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(130, now);
  // Pitch drop to 50Hz
  osc.frequency.exponentialRampToValueAtTime(50, now + duration);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * 4. Origami Fold:
 * Subtle paper rustle and crisp mechanical crease.
 */
export function playOrigamiFold(): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.12;

  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(2600, now + duration);
  filter.Q.setValueAtTime(2.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  src.start(now);
  src.stop(now + duration + 0.01);
}

/**
 * 5. Tension Wobble:
 * Near-miss acoustic beat (two sine waves detuned by 6Hz) to create physical suspense.
 */
export function playTensionWobble(): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.35;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(110, now);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(116, now); // 6Hz beat frequency

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration + 0.02);
  osc2.stop(now + duration + 0.02);
}

/**
 * 6. Zen Bell:
 * Meditative bell with harmonic overtones for Zen mode.
 */
export function playZenBell(): void {
  if (config.muted) return;
  const ctx = getProceduralAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const harmonics = [440, 880, 1320];

  harmonics.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const amp = 0.12 / (idx + 1);
    const duration = 1.0 - idx * 0.2;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

/**
 * Teardown & Liveness Invariant:
 * 100% cleanup of AudioContext and node references to prevent memory leaks.
 */
export function disposeProceduralAudio(): void {
  if (audioCtx) {
    try {
      if (audioCtx.state !== "closed") {
        void audioCtx.close();
      }
    } catch {
      // Ignore
    }
  }
  audioCtx = null;
  masterGain = null;
  noiseBuffer = null;
}
