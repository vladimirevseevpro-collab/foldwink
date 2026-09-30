import type { StoreApi } from "zustand";
import type { StoreState } from "./store";
import { msUntilNextLocalMidnight } from "../../utils/countdown";

export interface LifecycleEnvironment {
  document: Pick<Document, "hidden" | "addEventListener" | "removeEventListener">;
  window: Pick<
    Window,
    "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout"
  >;
  nextMidnightDelayMs: () => number;
}

function browserLifecycleEnvironment(): LifecycleEnvironment | null {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  return {
    document,
    window,
    nextMidnightDelayMs: () => msUntilNextLocalMidnight(),
  };
}

/**
 * A single lifecycle owner keeps foreground timing honest.  It deliberately
 * does not use wall-clock deltas: a sleep, crash, reload, or clock rollback
 * cannot become player thinking time.
 */
export function installGameLifecycle(
  store: StoreApi<StoreState>,
  env: LifecycleEnvironment | null = browserLifecycleEnvironment(),
): () => void {
  if (!env) return () => undefined;

  let midnightTimer: number | null = null;
  const syncVisibility = (): void => {
    if (env.document.hidden) {
      store.getState().pauseActiveTiming();
      return;
    }
    store.getState().refreshDaily();
    store.getState().resumeActiveTiming();
  };
  const pagehide = (): void => store.getState().pauseActiveTiming();
  const scheduleMidnightRefresh = (): void => {
    if (midnightTimer !== null) env.window.clearTimeout(midnightTimer);
    // A minimum prevents a mocked zero-delay clock from creating a tight loop.
    const delay = Math.max(250, env.nextMidnightDelayMs() + 25);
    midnightTimer = env.window.setTimeout(() => {
      store.getState().refreshDaily();
      scheduleMidnightRefresh();
    }, delay);
  };

  env.document.addEventListener("visibilitychange", syncVisibility);
  env.window.addEventListener("focus", syncVisibility);
  env.window.addEventListener("pagehide", pagehide);
  syncVisibility();
  scheduleMidnightRefresh();

  return () => {
    if (midnightTimer !== null) env.window.clearTimeout(midnightTimer);
    env.document.removeEventListener("visibilitychange", syncVisibility);
    env.window.removeEventListener("focus", syncVisibility);
    env.window.removeEventListener("pagehide", pagehide);
  };
}
