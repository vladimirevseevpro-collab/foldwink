import { useCallback, useSyncExternalStore } from "react";
import {
  getSoundSettings,
  playSound,
  setSoundMuted,
  setSoundVolume,
  type SoundEvent,
} from "./sound";

/**
 * Thin React layer over `sound.ts`. Components never instantiate Audio or
 * AudioContext directly — they always go through `playSound` here.
 */

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify(): void {
  for (const l of listeners) l();
}

interface SettingsSnapshot {
  muted: boolean;
  volume: number;
}

let snapshot: SettingsSnapshot = getSoundSettings();

function getSnapshot(): SettingsSnapshot {
  return snapshot;
}

function refresh(): void {
  snapshot = getSoundSettings();
  notify();
}

export function useSoundSettings(): {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
} {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const toggleMute = useCallback(() => {
    setSoundMuted(!s.muted);
    refresh();
  }, [s.muted]);
  const setVolume = useCallback((v: number) => {
    setSoundVolume(v);
    refresh();
  }, []);
  return { muted: s.muted, volume: s.volume, toggleMute, setVolume };
}

import type { PlaySoundOptions } from "./sound";

export type { PlaySoundOptions };

export function useSound(): (event: SoundEvent, options?: PlaySoundOptions) => void {
  return useCallback((event: SoundEvent, options?: PlaySoundOptions) => {
    playSound(event, options);
  }, []);
}
