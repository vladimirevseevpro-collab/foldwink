import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_VERSION } from "../../appVersion";
vi.mock("../../puzzles/byLang", () => ({
  getRuntimeContentVersion: () => "catalog-test-v1",
}));

import {
  bootstrapAnalytics,
  bucketSource,
  clearEventLog,
  getConsentStatus,
  getEventCounts,
  isAnalyticsConfigured,
  resolveAnalyticsConfig,
  setConsentStatus,
  trackEvent,
} from "../eventLog";

function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    key(i: number) {
      return Array.from(store.keys())[i] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  } as Storage;
}

function installDom(): void {
  const appended: Array<Record<string, string>> = [];
  const head = {
    appendChild(node: {
      setAttribute: (key: string, value: string) => void;
      addEventListener: (name: string, cb: () => void) => void;
      src?: string;
    }) {
      appended.push({
        src: node.src ?? "",
      });
      node.addEventListener("load", () => undefined);
      return node;
    },
  };

  const documentStub = {
    head,
    querySelector: vi.fn(() => null),
    createElement: vi.fn(() => {
      const attrs: Record<string, string> = {};
      const listeners = new Map<string, () => void>();
      return {
        async: false,
        defer: false,
        src: "",
        setAttribute(key: string, value: string) {
          attrs[key] = value;
        },
        addEventListener(name: string, cb: () => void) {
          listeners.set(name, cb);
          if (name === "load") queueMicrotask(cb);
        },
      };
    }),
  };

  (globalThis as unknown as { document?: typeof documentStub }).document = documentStub;
}

beforeEach(() => {
  installLocalStorage();
  installDom();
  (globalThis as { window?: Window & typeof globalThis }).window = {
    __FOLDWINK_CONFIG__: {
      umamiWebsiteId: "site-123",
      umamiScriptUrl: "https://analytics.example/script.js",
    },
    umami: {
      track: vi.fn(),
    },
    dispatchEvent: vi.fn(() => true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window & typeof globalThis;
});

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
  delete (globalThis as { document?: Document }).document;
  delete (globalThis as { localStorage?: Storage }).localStorage;
  vi.restoreAllMocks();
});

describe("analytics config", () => {
  it("is disabled when website id is missing", () => {
    const config = resolveAnalyticsConfig({}, {});
    expect(config.websiteId).toBeNull();
    expect(isAnalyticsConfigured(config)).toBe(false);
  });

  it("prefers runtime override and validates https script urls", () => {
    const config = resolveAnalyticsConfig(
      {
        VITE_UMAMI_WEBSITE_ID: "env-id",
        VITE_UMAMI_SCRIPT_URL: "http://bad.example/script.js",
      },
      {
        umamiWebsiteId: "runtime-id",
        umamiScriptUrl: "https://good.example/script.js",
      },
    );
    expect(config.websiteId).toBe("runtime-id");
    expect(config.scriptUrl).toBe("https://good.example/script.js");
  });
});

describe("consent and local counts", () => {
  it("keeps local counters even before consent and sends nothing", () => {
    trackEvent({
      name: "menu_view",
      props: { surface: "menu", lang: "en", has_support_flag: "no" },
    });
    expect(getEventCounts().menu_view).toBe(1);
    expect(window.umami?.track as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    expect(getConsentStatus()).toBe("unknown");
  });

  it("stores granted consent and allows manual event sending", async () => {
    await setConsentStatus("granted");
    trackEvent({
      name: "round_finish",
      props: {
        surface: "game",
        mode: "daily",
        difficulty: "medium",
        outcome: "win",
        has_support_flag: "yes",
        lang: "en",
      },
    });
    expect(window.umami?.track as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      "round_finish",
      expect.objectContaining({
        surface: "game",
        mode: "daily",
        difficulty: "medium",
        outcome: "win",
        has_support_flag: "yes",
        lang: "en",
      }),
    );
  });

  it("adds the complete OPS-06 version tuple to consented research events", async () => {
    await setConsentStatus("granted");
    trackEvent({
      name: "attempt_started",
      props: {
        surface: "game",
        context: "game",
        mode: "standard",
        tier: "easy",
        difficulty: "easy",
        first_attempt: "yes",
        lang: "en",
      },
    });
    expect(window.umami?.track as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      "attempt_started",
      expect.objectContaining({
        event_schema: "ops-06-v1",
        app_version: APP_VERSION,
        content_version: "catalog-test-v1",
        policy_version: "privacy-v1",
        balance_version: "balance-2026-09-v1",
      }),
    );
  });

  it("never replays a denied or revoked event after a later grant", async () => {
    const providerTrack = window.umami?.track as ReturnType<typeof vi.fn>;
    trackEvent({
      name: "menu_view",
      props: { surface: "menu", lang: "en", has_support_flag: "no" },
    });
    await setConsentStatus("granted");
    expect(window.umami?.track as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();

    trackEvent({
      name: "menu_view",
      props: { surface: "menu", lang: "en", has_support_flag: "no" },
    });
    await setConsentStatus("denied");
    expect(window.umami).toBeUndefined();
    trackEvent({
      name: "menu_view",
      props: { surface: "menu", lang: "en", has_support_flag: "no" },
    });
    expect(providerTrack).toHaveBeenCalledTimes(1);
    await setConsentStatus("granted");
    expect(providerTrack).toHaveBeenCalledTimes(1);
  });

  it("does not hand events to a provider while offline", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });
    await setConsentStatus("granted");
    trackEvent({
      name: "menu_view",
      props: { surface: "menu", lang: "en", has_support_flag: "no" },
    });
    expect(window.umami?.track as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    delete (globalThis as { navigator?: Navigator }).navigator;
  });

  it("sanitizes unknown properties out of the network payload", async () => {
    await setConsentStatus("granted");
    trackEvent({
      name: "tip_opened",
      props: {
        surface: "result",
        channel: "tip_jar",
        source_bucket: "campaign",
        has_support_flag: "no",
        lang: "en",
        // @ts-expect-error test runtime sanitizer
        referrer: "https://evil.example",
      },
    });
    expect(window.umami?.track as ReturnType<typeof vi.fn>).toHaveBeenCalledWith("tip_opened", {
      surface: "result",
      channel: "tip_jar",
      source_bucket: "campaign",
      has_support_flag: "no",
      lang: "en",
    });
  });

  it("clears only the local event log", () => {
    trackEvent({
      name: "app_open",
      props: { surface: "app", source_bucket: "direct", has_support_flag: "no", lang: "en" },
    });
    clearEventLog();
    expect(getEventCounts().app_open).toBeUndefined();
  });

  it("drops corrupt legacy counters and merges independent page buckets", () => {
    localStorage.setItem(
      "foldwink:analytics:events:v2",
      JSON.stringify({ attempt_started: "x", attempt_completed: -5, menu_view: 2 }),
    );
    localStorage.setItem(
      "foldwink:analytics:event-bucket:v2:other-tab",
      JSON.stringify({ attempt_started: 3, unknown_event: 99 }),
    );
    trackEvent({
      name: "attempt_started",
      props: {
        surface: "game",
        context: "game",
        mode: "standard",
        tier: "easy",
        difficulty: "easy",
        first_attempt: "yes",
        lang: "en",
      },
    });

    expect(getEventCounts()).toMatchObject({ menu_view: 2, attempt_started: 4 });
    expect(getEventCounts().attempt_completed).toBeUndefined();
  });
});

describe("bootstrapAnalytics", () => {
  it("does not inject before grant and injects once after grant", async () => {
    // Module state survives test files; an explicit revoke resets a prior
    // injected loader just as a real privacy choice would.
    await setConsentStatus("denied");
    vi.mocked(document.querySelector).mockClear();
    await bootstrapAnalytics();
    expect(document.querySelector).not.toHaveBeenCalled();

    delete (window as Partial<Window>).umami;
    await setConsentStatus("granted");
    await bootstrapAnalytics();
    expect(document.querySelector).toHaveBeenCalled();
  });
});

describe("bucketSource", () => {
  it("maps known traffic into coarse buckets", () => {
    expect(bucketSource({ source: "tiktok", medium: "social" })).toBe("video");
    expect(bucketSource({ source: "itch", medium: "embed" })).toBe("embed");
    expect(bucketSource({ source: "google", medium: "search" })).toBe("search");
    expect(bucketSource(undefined)).toBe("direct");
  });
});
