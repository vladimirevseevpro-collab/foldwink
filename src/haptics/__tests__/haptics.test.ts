import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  triggerHaptic,
  getHapticSettings,
  setHapticEnabled,
  isHapticsSupported,
  resetHapticsForTests,
} from "../haptics";

describe("haptics system", () => {
  beforeEach(() => {
    resetHapticsForTests();
  });

  it("handles settings toggle correctly", () => {
    setHapticEnabled(false);
    expect(getHapticSettings().enabled).toBe(false);
    setHapticEnabled(true);
    expect(getHapticSettings().enabled).toBe(true);
  });

  it("triggers haptic events without crashing when vibrate is available", () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("navigator", { vibrate: vibrateMock });

    expect(isHapticsSupported()).toBe(true);

    triggerHaptic("select");
    expect(vibrateMock).toHaveBeenCalledWith(5);

    triggerHaptic("sealBreak");
    expect(vibrateMock).toHaveBeenCalledWith([10, 10, 25]);

    triggerHaptic("correct");
    expect(vibrateMock).toHaveBeenCalledWith([15, 30, 15]);

    triggerHaptic("wrong");
    expect(vibrateMock).toHaveBeenCalledWith(40);

    vi.unstubAllGlobals();
  });
});
