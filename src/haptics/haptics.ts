/**
 * Foldwink haptics system.
 *
 * Design notes
 * ------------
 * Foldwink is a pure static web app (React + Vite, no PWA/hybrid shell). The
 * only cross-browser haptic primitive available here is `navigator.vibrate`,
 * which is supported on most Android browsers and silently absent on iOS
 * Safari and desktop. This module treats that surface as a best-effort
 * improvement: if the API is missing, every call is a silent no-op and the
 * game plays identically.
 *
 * Architecture mirrors `src/audio/sound.ts` on purpose — one intent-driven
 * event vocabulary, one settings store, one set of patterns. UI code never
 * calls `navigator.vibrate` directly; it always routes through `triggerHaptic`.
 *
 * Patterns are subtle-first — single short pulses for taps, a short double
 * buzz for errors, a three-step settle for completion. Nothing longer than
 * ~130 ms total so rapid input never feels like a buzzing device.
 */

export type HapticEvent =
  | "select"
  | "deselect"
  | "submit"
  | "wrong"
  | "oneAway"
  | "correct"
  | "wink"
  | "win"
  | "loss"
  | "sealBreak";

interface HapticSettings {
  enabled: boolean;
}

const STORAGE_KEY = "foldwink:haptics";
const DEFAULT_SETTINGS: HapticSettings = { enabled: true };

// Per-event minimum gap. select/deselect are the spam-prone events, so they
// get a tighter floor. Longer patterns can fire at their own cadence.
const MIN_GAP_MS: Record<HapticEvent, number> = {
  select: 35,
  deselect: 35,
  submit: 120,
  wrong: 200,
  oneAway: 200,
  correct: 200,
  wink: 200,
  win: 500,
  loss: 500,
  sealBreak: 200,
};

// Intent-driven patterns in ms. Single numbers fire one pulse; arrays are
// alternating on/off pulses per the Vibration API spec.
const PATTERNS: Record<HapticEvent, number | number[]> = {
  select: 5,
  deselect: 5,
  submit: 12,
  correct: [15, 30, 15],
  wrong: 40,
  oneAway: [14, 30, 14, 30, 20],
  wink: 10,
  win: [16, 40, 16, 40, 22],
  loss: 30,
  sealBreak: [10, 10, 25],
};

let cachedSettings: HapticSettings | null = null;
const lastFiredAt: Partial<Record<HapticEvent, number>> = {};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function loadSettings(): HapticSettings {
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
    const parsed = JSON.parse(raw) as Partial<HapticSettings>;
    cachedSettings = {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SETTINGS.enabled,
    };
    return cachedSettings;
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
    return cachedSettings;
  }
}

function persistSettings(s: HapticSettings): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — silent */
  }
}

export function getHapticSettings(): HapticSettings {
  return { ...loadSettings() };
}

export function setHapticEnabled(enabled: boolean): void {
  const next: HapticSettings = { enabled };
  cachedSettings = next;
  persistSettings(next);
}

/**
 * True when the platform exposes the Vibration API at all. Absence is the
 * norm on iOS Safari and desktop — we treat it as "no haptics available".
 */
export function isHapticsSupported(): boolean {
  return isBrowser() && typeof navigator.vibrate === "function";
}

function prefersReducedMotion(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function triggerHaptic(event: HapticEvent): void {
  if (!isHapticsSupported()) return;
  if (!loadSettings().enabled) return;
  if (prefersReducedMotion()) return;

  const now =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const last = lastFiredAt[event] ?? 0;
  if (now - last < MIN_GAP_MS[event]) return;
  lastFiredAt[event] = now;

  try {
    navigator.vibrate(PATTERNS[event]);
  } catch {
    /* ignore vibration failures — gameplay is unaffected */
  }
}

export function resetHapticsForTests(): void {
  cachedSettings = null;
  for (const k of Object.keys(lastFiredAt) as HapticEvent[]) delete lastFiredAt[k];
}
