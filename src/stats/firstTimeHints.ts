import { safeRead, safeWrite } from "./persistence";

/**
 * One-time onboarding note shown the first time a player opens a Medium
 * puzzle with Foldwink Tabs. Kept React-free so the show/seen decision can
 * be unit tested in isolation.
 */
export const MEDIUM_HINT_SEEN_KEY = "foldwink:mediumHintSeen";

/**
 * Session-scoped fallback. `safeWrite` swallows storage failures, and a
 * rejected write leaves no durable flag, so this guarantees the note is
 * shown at most once per session when storage is unavailable.
 */
let shownThisSession = false;

export function shouldShowMediumHint(): boolean {
  if (shownThisSession) return false;
  return safeRead<boolean>(MEDIUM_HINT_SEEN_KEY, false) !== true;
}

export function markMediumHintSeen(): void {
  shownThisSession = true;
  safeWrite(MEDIUM_HINT_SEEN_KEY, true);
}
