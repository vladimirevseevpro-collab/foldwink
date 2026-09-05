import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearSupporter,
  consumeSupporterReturnUrl,
  dismissSupporterThankYou,
  hasPendingSupporterThankYou,
  isSupporter,
  setSupporter,
} from "../supporter";

function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    key(i: number) {
      return Array.from(store.keys())[i] ?? null;
    },
    getItem(k: string) {
      return store.has(k) ? store.get(k)! : null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  } as Storage;
}

interface MockWindow {
  location: { href: string };
  history: { replaceState: (state: unknown, title: string, url: string) => void };
}

function installWindow(href: string): { replacedWith: () => string | null } {
  let replaced: string | null = null;
  (globalThis as { window?: MockWindow }).window = {
    location: { href },
    history: {
      replaceState: (_state, _title, url) => {
        replaced = url;
      },
    },
  };
  return { replacedWith: () => replaced };
}

afterEach(() => {
  delete (globalThis as { window?: MockWindow }).window;
});

describe("supporter flag", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("is off by default, sticks after setSupporter, clears after clearSupporter", () => {
    expect(isSupporter()).toBe(false);
    setSupporter();
    expect(isSupporter()).toBe(true);
    clearSupporter();
    expect(isSupporter()).toBe(false);
  });
});

describe("consumeSupporterReturnUrl", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("sets the flag and strips the param on ?supporter=success", () => {
    const w = installWindow("https://example.com/foldwink/?supporter=success");
    expect(consumeSupporterReturnUrl()).toBe(true);
    expect(isSupporter()).toBe(true);
    expect(hasPendingSupporterThankYou()).toBe(true);
    expect(w.replacedWith()).toBe("/foldwink/");
  });

  it("is case-insensitive on the value and preserves other params", () => {
    const w = installWindow(
      "https://example.com/foldwink/?utm_source=tiktok&supporter=SUCCESS",
    );
    expect(consumeSupporterReturnUrl()).toBe(true);
    expect(isSupporter()).toBe(true);
    expect(w.replacedWith()).toBe("/foldwink/?utm_source=tiktok");
  });

  it("does nothing without the param", () => {
    const w = installWindow("https://example.com/foldwink/");
    expect(consumeSupporterReturnUrl()).toBe(false);
    expect(isSupporter()).toBe(false);
    expect(w.replacedWith()).toBeNull();
  });

  it("does nothing on a wrong value", () => {
    installWindow("https://example.com/foldwink/?supporter=definitely");
    expect(consumeSupporterReturnUrl()).toBe(false);
    expect(isSupporter()).toBe(false);
  });

  it("dismisses the one-shot thank-you flag", () => {
    installWindow("https://example.com/foldwink/?supporter=success");
    expect(consumeSupporterReturnUrl()).toBe(true);
    dismissSupporterThankYou();
    expect(hasPendingSupporterThankYou()).toBe(false);
  });
});
