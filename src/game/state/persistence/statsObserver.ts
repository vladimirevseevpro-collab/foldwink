import type { StoreApi } from "zustand";
import type { StoreState } from "../store";
import {
  saveStats,
  saveProgress,
  loadDailyHistory,
  saveDailyHistory,
  saveOnboarded,
} from "../../../stats/persistence";

// Writes long-lived player data — stats, progression cursor, daily history,
// onboarding flag — to localStorage on change. Narrow selector: only reads
// the four slices it writes, so unrelated store updates never trigger IO.
export function statsPersistenceObserver(store: StoreApi<StoreState>): () => void {
  let prevStats = store.getState().stats;
  let prevProgress = store.getState().progress;
  let prevTodayDailyRecord = store.getState().todayDailyRecord;
  let prevOnboarded = store.getState().onboarded;

  return store.subscribe((state: StoreState) => {
    if (state.stats !== prevStats) {
      prevStats = state.stats;
      saveStats(state.stats);
    }
    if (state.progress !== prevProgress) {
      prevProgress = state.progress;
      saveProgress(state.progress);
    }
    if (state.todayDailyRecord !== prevTodayDailyRecord) {
      prevTodayDailyRecord = state.todayDailyRecord;
      if (state.todayDailyRecord) {
        const history = loadDailyHistory();
        history[state.todayDailyRecord.date] = state.todayDailyRecord;
        saveDailyHistory(history);
      }
    }
    if (state.onboarded !== prevOnboarded) {
      prevOnboarded = state.onboarded;
      saveOnboarded(state.onboarded);
    }
  });
}
