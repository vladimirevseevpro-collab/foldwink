import { SOUND_EVENTS, getSoundCueUrl, type SoundEvent } from "./cues";

export type { SoundEvent } from "./cues";

/**
 * Foldwink sound system.
 *
 * Design notes
 * ------------
 * Foldwink needs a tactile, quiet, paper/card/wood/tile audio palette. The
 * primary path decodes a compact local WAV pack into reusable AudioBuffers.
 * The original Web Audio vocabulary remains as a first-tap and failure fallback:
 *
 *   - "tap"    — short band-limited noise burst (paper / card slide)
 *   - "knock"  — tap + low oscillator body (soft wood)
 *   - "chime"  — very short tile/bone-like tone (with a micro tap attack)
 *   - "thud"   — low oscillator + longer envelope (muted wood / fail)
 *
 * Shipping cues are generated deterministically by `scripts/build-sound-pack.mjs`.
 * Buffer playback and fallback synthesis share the same master gain, settings,
 * iOS unlock path, and `useSound` API.
 *
 * Gameplay never depends on sound being on — every cue is pure feedback.
 */

interface SoundSettings {
  muted: boolean;
  volume: number; // 0..1
}

const STORAGE_KEY = "foldwink:sound";
const DEFAULT_SETTINGS: SoundSettings = { muted: false, volume: 0.75 };

let cachedSettings: SoundSettings | null = null;
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const decodedCues = new Map<SoundEvent, AudioBuffer>();
const cueLoadPromises = new Map<SoundEvent, Promise<AudioBuffer | null>>();
const failedCueLoads = new Set<SoundEvent>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function loadSettings(): SoundSettings {
  if (cachedSettings) return cachedSettings;
  if (!isBrowser()) {
    cachedSettings = { ...DEFAULT_SETTINGS };
    return cachedSettings;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedSettings = { ...DEFAULT_SETTINGS };
      return cachedSettings;
    }
    const parsed = JSON.parse(raw) as Partial<SoundSettings>;
    cachedSettings = {
      muted: typeof parsed.muted === "boolean" ? parsed.muted : DEFAULT_SETTINGS.muted,
      volume:
        typeof parsed.volume === "number" && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULT_SETTINGS.volume,
    };
    return cachedSettings;
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
    return cachedSettings;
  }
}

function persistSettings(s: SoundSettings): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — silent */
  }
}

export function getSoundSettings(): SoundSettings {
  return { ...loadSettings() };
}

export function setSoundMuted(muted: boolean): void {
  const next = { ...loadSettings(), muted };
  cachedSettings = next;
  persistSettings(next);
  if (masterGain) {
    masterGain.gain.value = next.muted ? 0 : next.volume;
  }
}

export function setSoundVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  const next = { ...loadSettings(), volume: clamped };
  cachedSettings = next;
  persistSettings(next);
  if (masterGain && !next.muted) {
    masterGain.gain.value = clamped;
  }
}

function getOrCreateContext(): AudioContext | null {
  if (!isBrowser()) return null;
  if (audioCtx) return audioCtx;
  const AC =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    const s = loadSettings();
    masterGain.gain.value = s.muted ? 0 : s.volume;
    masterGain.connect(audioCtx.destination);
    preloadSoundPack(audioCtx);
    return audioCtx;
  } catch {
    return null;
  }
}

function loadCue(ctx: AudioContext, event: SoundEvent): Promise<AudioBuffer | null> {
  const decoded = decodedCues.get(event);
  if (decoded) return Promise.resolve(decoded);
  if (failedCueLoads.has(event)) return Promise.resolve(null);

  const existing = cueLoadPromises.get(event);
  if (existing) return existing;

  const promise = fetch(getSoundCueUrl(event), { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Sound asset returned ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data.slice(0)))
    .then((buffer) => {
      if (ctx === audioCtx) decodedCues.set(event, buffer);
      return buffer;
    })
    .catch(() => {
      failedCueLoads.add(event);
      return null;
    });

  cueLoadPromises.set(event, promise);
  return promise;
}

function preloadSoundPack(ctx: AudioContext): void {
  for (const event of SOUND_EVENTS) void loadCue(ctx, event);
}

export async function prepareSoundPack(): Promise<void> {
  const ctx = getOrCreateContext();
  if (!ctx) return;
  await Promise.all(SOUND_EVENTS.map((event) => loadCue(ctx, event)));
}

function playDecodedCue(
  ctx: AudioContext,
  event: SoundEvent,
  destination: AudioNode,
  playbackRate: number = 1,
  gainMultiplier: number = 1,
): boolean {
  const buffer = decodedCues.get(event);
  if (!buffer) return false;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (playbackRate !== 1) {
    source.playbackRate.value = playbackRate;
  }

  if (gainMultiplier !== 1) {
    const cueGain = ctx.createGain();
    cueGain.gain.value = gainMultiplier;
    source.connect(cueGain);
    cueGain.connect(destination);
  } else {
    source.connect(destination);
  }

  source.start();
  return true;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // Pink-ish noise: cheap averaging for a softer tactile feel than white.
    data[i] = (Math.random() * 2 - 1) * 0.9;
  }
  noiseBuffer = buf;
  return buf;
}

/**
 * Material palette
 * ----------------
 * The 0.4.1 refinement pass rewrites every recipe against one hard rule:
 * nothing in this palette should sound like a bright mobile-casino chime.
 *
 * All "bodies" (oscillator undertones) live in the 80–280 Hz range — wood,
 * bone, tile dropped on wood, paper rustle. Nothing reaches the bright
 * 500 Hz+ register where tactile material feedback starts to sound like a
 * notification alert.
 *
 * Taps use lowpass filtering (warm, mellow) rather than bandpass (bright,
 * hollow) and skew quiet. Bodies are shaped with fast attack + gentle
 * exponential decay so they feel like a settle, not a sustained tone.
 *
 * Overall headroom: individual cue peak ≤ 0.30, composite ≤ 0.45. Sounds
 * should fall below the level of a typewriter keystroke in a quiet room.
 */

interface TapSpec {
  duration: number;
  filterHz: number;
  /** "lp" (warm, default) | "bp" (brighter) — we use lp by default now. */
  filterType?: "lp" | "bp";
  filterQ?: number;
  gain: number;
  delay?: number;
}

interface BodySpec {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain: number;
  delay?: number;
  decay?: number;
}

function playTap(ctx: AudioContext, dest: AudioNode, spec: TapSpec): void {
  const start = ctx.currentTime + (spec.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = spec.filterType === "bp" ? "bandpass" : "lowpass";
  filter.frequency.value = spec.filterHz;
  filter.Q.value = spec.filterQ ?? 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(spec.gain, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
  src.connect(filter).connect(gain).connect(dest);
  src.start(start);
  src.stop(start + spec.duration + 0.02);
}

function playBody(ctx: AudioContext, dest: AudioNode, spec: BodySpec): void {
  const start = ctx.currentTime + (spec.delay ?? 0);
  const osc = ctx.createOscillator();
  osc.type = spec.type ?? "sine";
  osc.frequency.value = spec.freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(spec.gain, start + 0.004);
  const decay = spec.decay ?? spec.duration;
  gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + spec.duration + 0.02);
}

type Recipe = (ctx: AudioContext, dest: AudioNode) => void;

/**
 * Per-cue intent and material reference. Update comments first when a cue
 * is retuned — they are the contract, the numbers are the implementation.
 */
const RECIPES: Record<SoundEvent, Recipe> = {
  // PAPER — a finger sliding under a card edge. Soft, airy, quick.
  select: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.05, filterHz: 1800, gain: 0.2 });
  },
  // PAPER RETURN — the card drops back. A touch duller, shorter.
  deselect: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.045, filterHz: 1200, gain: 0.16 });
  },
  // WOOD KNUCKLE — firm tap on a wooden table. Warm, low, no overtones.
  submit: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.04, filterHz: 1200, gain: 0.22 });
    playBody(ctx, dest, {
      freq: 140,
      duration: 0.12,
      gain: 0.18,
      type: "sine",
      decay: 0.16,
    });
  },
  // WOOD KNOCK TWICE — the classic "nope" sound, muted and below pitch.
  // No high transients, no sharp attack.
  wrong: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.045, filterHz: 900, gain: 0.22 });
    playBody(ctx, dest, {
      freq: 120,
      duration: 0.14,
      gain: 0.2,
      type: "sine",
      decay: 0.2,
    });
    playTap(ctx, dest, { duration: 0.045, filterHz: 700, gain: 0.18, delay: 0.09 });
    playBody(ctx, dest, {
      freq: 95,
      duration: 0.16,
      gain: 0.18,
      type: "sine",
      delay: 0.09,
      decay: 0.22,
    });
  },
  // BONE ON WOOD — three tiles settling against each other. Low-mid range,
  // gently ascending, no bright chime register at all.
  correct: (ctx, dest) => {
    const delays = [0, 0.07, 0.15];
    const freqs = [180, 215, 250];
    const filterHz = [1400, 1500, 1600];
    for (let i = 0; i < 3; i++) {
      playTap(ctx, dest, {
        duration: 0.035,
        filterHz: filterHz[i],
        gain: 0.16,
        delay: delays[i],
      });
      playBody(ctx, dest, {
        freq: freqs[i],
        duration: 0.14,
        gain: 0.16,
        type: "sine",
        delay: delays[i],
        decay: 0.18,
      });
    }
  },
  // PAPER FLIP — tiny rustle as a letter turns over. Quietest cue in the set.
  tabReveal: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.035, filterHz: 1800, gain: 0.1 });
  },
  // TILE LIFT — a small bone piece lifted off the table. Warm mid, soft tap,
  // no high harmonic sparkle. This is the one reserved "character" cue.
  wink: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.04, filterHz: 1600, gain: 0.15 });
    playBody(ctx, dest, {
      freq: 280,
      duration: 0.24,
      gain: 0.15,
      type: "sine",
      decay: 0.3,
    });
    playBody(ctx, dest, {
      freq: 210,
      duration: 0.2,
      gain: 0.1,
      type: "sine",
      delay: 0.01,
      decay: 0.26,
    });
  },
  // CELEBRATION CHIME ARPEGGIO — joyful ascending pentatonic resonance with warm acoustic overtones
  win: (ctx, dest) => {
    const delays = [0, 0.1, 0.22, 0.36, 0.52, 0.7];
    const freqs = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    for (let i = 0; i < freqs.length; i++) {
      playTap(ctx, dest, {
        duration: 0.04,
        filterHz: Math.min(8000, freqs[i] * 2.5),
        gain: 0.14,
        delay: delays[i],
      });
      playBody(ctx, dest, {
        freq: freqs[i],
        duration: 0.5,
        gain: 0.22,
        type: "sine",
        delay: delays[i],
        decay: 0.35,
      });
    }
  },
  // LOW THUD — a wooden box closed too firmly. Deep, muted, single impact.
  loss: (ctx, dest) => {
    playTap(ctx, dest, { duration: 0.055, filterHz: 500, gain: 0.22 });
    playBody(ctx, dest, {
      freq: 95,
      duration: 0.4,
      gain: 0.22,
      type: "sine",
      decay: 0.5,
    });
  },
};

export interface PlaySoundOptions {
  playbackRate?: number;
  /** Micro-pitch variation (e.g. 0.025 for +/- 2.5%) for organic physical feel */
  rateJitter?: number;
  /** Micro-gain variation (e.g. 0.04 for +/- 4%) for subtle dynamics */
  gainJitter?: number;
}

export function playSound(event: SoundEvent, options?: PlaySoundOptions): void {
  const ctx = getOrCreateContext();
  if (!ctx || !masterGain) return;
  if (loadSettings().muted) return;

  const baseRate = options?.playbackRate ?? 1;
  // Apply organic jitter for physical interactions (select, deselect, wrong) if not explicitly overridden
  const jitterRate =
    options?.rateJitter !== undefined
      ? options.rateJitter
      : event === "select" || event === "deselect" || event === "wrong"
        ? 0.025
        : 0;
  const rate = jitterRate > 0 ? baseRate * (1 + (Math.random() * 2 - 1) * jitterRate) : baseRate;

  const jitterGain =
    options?.gainJitter !== undefined
      ? options.gainJitter
      : event === "select" || event === "deselect"
        ? 0.03
        : 0;
  const gainMult = jitterGain > 0 ? 1 + (Math.random() * 2 - 1) * jitterGain : 1;

  const runCue = (): void => {
    try {
      if (!masterGain) return;
      if (!playDecodedCue(ctx, event, masterGain, rate, gainMult)) {
        RECIPES[event](ctx, masterGain);
        void loadCue(ctx, event);
      }
    } catch {
      /* ignore audio failures — gameplay is unaffected */
    }
  };

  // iOS Safari ships the AudioContext in "suspended" state until a user
  // gesture explicitly resumes it. `ctx.resume()` is async — scheduling a
  // cue before it settles loses the first sound. We therefore chain playback
  // onto the resume promise when the context is not yet running,
  // and play synchronously otherwise.
  if (ctx.state === "running") {
    runCue();
    return;
  }

  ctx
    .resume()
    .then(runCue)
    .catch(() => {
      /* resume rejected — gameplay is unaffected */
    });
}

export function resetSoundForTests(): void {
  cachedSettings = null;
  if (audioCtx) {
    try {
      void audioCtx.close();
    } catch {
      /* ignore */
    }
  }
  audioCtx = null;
  masterGain = null;
  noiseBuffer = null;
  decodedCues.clear();
  cueLoadPromises.clear();
  failedCueLoads.clear();
}
