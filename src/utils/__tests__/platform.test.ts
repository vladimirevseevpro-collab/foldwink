import { afterEach, describe, expect, it, vi } from "vitest";
import { isIosSafariInBrowser, isNativePlatform, shouldOfferEmbeddedFullSize } from "../platform";

describe("shouldOfferEmbeddedFullSize", () => {
  it("offers a full-size launch only for an undismissed touch embed", () => {
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: true, dismissed: false }),
    ).toBe(true);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: false, coarsePointer: true, dismissed: false }),
    ).toBe(false);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: false, dismissed: false }),
    ).toBe(false);
    expect(
      shouldOfferEmbeddedFullSize({ embedded: true, coarsePointer: true, dismissed: true }),
    ).toBe(false);
  });
});

describe("platform detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("identifies native Capacitor platform", () => {
    expect(isNativePlatform()).toBe(false);

    vi.stubGlobal("window", {
      Capacitor: { isNativePlatform: () => true },
    });
    expect(isNativePlatform()).toBe(true);
  });

  it("detects iOS Safari in browser vs standalone / native / other browsers", () => {
    // Desktop Chrome
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
    });
    expect(isIosSafariInBrowser()).toBe(false);

    // Native Capacitor on iOS: should NOT be treated as browser Safari
    vi.stubGlobal("window", {
      Capacitor: { isNativePlatform: () => true },
    });
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    });
    expect(isIosSafariInBrowser()).toBe(false);

    // Mobile Safari in browser tab
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    });
    expect(isIosSafariInBrowser()).toBe(true);

    // Standalone PWA on iOS
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      standalone: true,
    });
    expect(isIosSafariInBrowser()).toBe(false);

    // Chrome on iOS (CriOS)
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1",
    });
    expect(isIosSafariInBrowser()).toBe(false);
  });
});
