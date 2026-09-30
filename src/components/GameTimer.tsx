import { useEffect, useRef, useState } from "react";
import {
  addForegroundDelta,
  foregroundDelta,
  nonNegativeFinite,
} from "../game/timing/foreground";

interface Props {
  startedAt: number;
  endedAt?: number;
  /** New attempts use this persisted foreground accumulator. */
  elapsedActiveMs?: number;
  ariaLabel: (time: string) => string;
}

export function formatGameDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function monotonicNow(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : 0;
}

export function GameTimer({ startedAt, endedAt, elapsedActiveMs, ariaLabel }: Props) {
  const [tick, setTick] = useState(0);
  const baseElapsedRef = useRef(
    elapsedActiveMs === undefined ? 0 : nonNegativeFinite(elapsedActiveMs),
  );
  const startedMonotonicRef = useRef(monotonicNow());
  const hasForegroundAccumulator = elapsedActiveMs !== undefined;

  useEffect(() => {
    if (!hasForegroundAccumulator) return;
    baseElapsedRef.current = nonNegativeFinite(elapsedActiveMs);
    startedMonotonicRef.current = monotonicNow();
    setTick((value) => value + 1);
  }, [elapsedActiveMs, hasForegroundAccumulator]);

  useEffect(() => {
    if (endedAt) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const update = (): void => setTick((value) => value + 1);
    const start = (): void => {
      if (interval !== null || (typeof document !== "undefined" && document.hidden)) return;
      startedMonotonicRef.current = monotonicNow();
      interval = setInterval(update, 1000);
      update();
    };
    const stop = (): void => {
      if (interval !== null) clearInterval(interval);
      interval = null;
      update();
    };
    const visibility = (): void => {
      if (typeof document !== "undefined" && document.hidden) stop();
      else start();
    };
    start();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", visibility);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", visibility);
      }
    };
  }, [endedAt]);

  // `tick` is intentionally read so the display changes while the foreground
  // interval is live. It is not persisted and has no scoring effect.
  void tick;
  const elapsed = hasForegroundAccumulator
    ? addForegroundDelta(
        baseElapsedRef.current,
        endedAt ? 0 : foregroundDelta(startedMonotonicRef.current, monotonicNow()),
      )
    : Math.max(0, (endedAt ?? Date.now()) - startedAt);

  return (
    <span
      className="text-sm font-semibold tabular-nums text-text"
      aria-label={ariaLabel(formatGameDuration(elapsed))}
    >
      {formatGameDuration(elapsed)}
    </span>
  );
}
