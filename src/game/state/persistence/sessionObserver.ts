import type { StoreApi } from "zustand";
import type { StoreState } from "../store";
import { saveActiveSession, clearActiveSession } from "../../../stats/persistence";

// Writes the mid-game session blob to localStorage so a refresh mid-round
// restores the same puzzle. Clears the session on any transition away from
// an in-progress game. Narrow selector: only reads {screen, active,
// puzzle.id}, so ordinary stats/onboarding updates don't touch storage.
export function sessionPersistenceObserver(store: StoreApi<StoreState>): () => void {
  let prevActive = store.getState().active;
  let prevScreen = store.getState().screen;
  let prevPuzzleId = store.getState().puzzle?.id ?? null;

  return store.subscribe((state: StoreState) => {
    const currentPuzzleId = state.puzzle?.id ?? null;
    if (state.screen === "game" && state.active && !state.active.result && state.puzzle) {
      if (state.active !== prevActive || currentPuzzleId !== prevPuzzleId) {
        saveActiveSession({
          active: state.active,
          puzzleId: state.puzzle.id,
          savedAt: Date.now(),
        });
      }
    } else if (
      state.screen !== prevScreen ||
      state.active !== prevActive ||
      !!state.active?.result
    ) {
      // Any transition away from an active game screen clears the session.
      clearActiveSession();
    }
    prevActive = state.active;
    prevScreen = state.screen;
    prevPuzzleId = currentPuzzleId;
  });
}
