/**
 * Pure helpers for the two clocks an attempt keeps.
 *
 * Wall-clock timestamps establish local-date identity and a diagnostic raw
 * elapsed value.  Thinking time is intentionally an accumulator: runtime
 * code adds only monotonic foreground deltas, never persists a
 * `performance.now()` origin that would be meaningless after a reload.
 */
export function nonNegativeFinite(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function foregroundDelta(startedMonotonicMs: number, nowMonotonicMs: number): number {
  if (!Number.isFinite(startedMonotonicMs) || !Number.isFinite(nowMonotonicMs)) return 0;
  return Math.max(0, nowMonotonicMs - startedMonotonicMs);
}

export function addForegroundDelta(accumulatedMs: number | undefined, deltaMs: number): number {
  return nonNegativeFinite(accumulatedMs) + nonNegativeFinite(deltaMs);
}

/** System-clock rollback must not create a negative raw duration. */
export function rawElapsedMs(startedAtUtcMs: number, endedAtUtcMs: number): number {
  return Math.max(0, nonNegativeFinite(endedAtUtcMs) - nonNegativeFinite(startedAtUtcMs));
}
