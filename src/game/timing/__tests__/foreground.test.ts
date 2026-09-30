import { describe, expect, it } from "vitest";
import { addForegroundDelta, foregroundDelta, rawElapsedMs } from "../foreground";

describe("foreground timing", () => {
  it("adds only monotonic positive foreground deltas", () => {
    expect(foregroundDelta(100, 450)).toBe(350);
    expect(foregroundDelta(450, 100)).toBe(0);
    expect(addForegroundDelta(1_000, -500)).toBe(1_000);
  });

  it("clamps a wall-clock rollback without changing persisted thinking time", () => {
    expect(rawElapsedMs(10_000, 9_000)).toBe(0);
    expect(addForegroundDelta(2_500, 0)).toBe(2_500);
  });
});
