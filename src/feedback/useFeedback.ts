import { useCallback } from "react";
import { useSound, type PlaySoundOptions } from "../audio/useSound";
import { useHaptics } from "../haptics/useHaptics";
import type { HapticEvent } from "../haptics/haptics";
import type { SoundEvent } from "../audio/sound";

/** Shared intent routing for UI feedback. A single call keeps sound and
 * haptics paired, while allowing legacy intents to share the same cue. */
export type FeedbackEvent =
  | "select"
  | "deselect"
  | "submit"
  | "wrong"
  | "oneAway"
  | "correct"
  | "wink"
  | "win"
  | "loss"
  | "tabReveal"
  | "sealBreak";

const ROUTES: Record<FeedbackEvent, { sound: SoundEvent; haptic: HapticEvent | null }> = {
  select: { sound: "select", haptic: "select" },
  deselect: { sound: "deselect", haptic: "deselect" },
  submit: { sound: "submit", haptic: "submit" },
  wrong: { sound: "wrong", haptic: "wrong" },
  oneAway: { sound: "wrong", haptic: "oneAway" },
  correct: { sound: "correct", haptic: "correct" },
  wink: { sound: "wink", haptic: "wink" },
  win: { sound: "win", haptic: "win" },
  loss: { sound: "loss", haptic: "loss" },
  tabReveal: { sound: "tabReveal", haptic: null },
  sealBreak: { sound: "tabReveal", haptic: "sealBreak" },
};

export function useFeedback(): (event: FeedbackEvent, options?: PlaySoundOptions) => void {
  const play = useSound();
  const haptic = useHaptics();
  return useCallback(
    (event: FeedbackEvent, options?: PlaySoundOptions) => {
      const route = ROUTES[event];
      play(route.sound, options);
      if (route.haptic) haptic(route.haptic);
    },
    [play, haptic],
  );
}
