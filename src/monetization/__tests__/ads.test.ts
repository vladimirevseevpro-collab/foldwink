import { afterEach, describe, expect, it, vi } from "vitest";
import { isRewardedAdAvailable, showRewardedAd } from "../ads";

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
});

describe("rewarded ad boundary", () => {
  it("is inert for the empty default config even if a host leaks a binding", async () => {
    const hostAd = vi.fn(async () => true);
    (globalThis as unknown as { window: unknown }).window = {
      foldwinkShowRewardedAd: hostAd,
    };
    expect(isRewardedAdAvailable()).toBe(false);
    await expect(showRewardedAd()).resolves.toBe(false);
    expect(hostAd).not.toHaveBeenCalled();
  });

  it("is inert when no SDK binding exists", async () => {
    (globalThis as unknown as { window: unknown }).window = {};
    expect(isRewardedAdAvailable()).toBe(false);
    await expect(showRewardedAd()).resolves.toBe(false);
  });
});
