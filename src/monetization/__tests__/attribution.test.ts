import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attributionRef, captureUtm, getFirstTouch, withAttributionRef } from "../attribution";

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
}

function installWindow(href: string): void {
  (globalThis as { window?: MockWindow }).window = { location: { href } };
}

afterEach(() => {
  delete (globalThis as { window?: MockWindow }).window;
});

describe("captureUtm", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("stores first-touch utm params from the boot URL", () => {
    installWindow(
      "https://example.com/foldwink/?utm_source=tiktok&utm_medium=social&utm_campaign=batch_01&utm_content=tiktok_03",
    );
    captureUtm();
    const t = getFirstTouch();
    expect(t?.source).toBe("tiktok");
    expect(t?.campaign).toBe("batch_01");
    expect(t?.content).toBe("tiktok_03");
  });

  it("does not overwrite an existing first touch", () => {
    installWindow("https://example.com/?utm_source=tiktok&utm_campaign=batch_01");
    captureUtm();
    installWindow("https://example.com/?utm_source=reddit&utm_campaign=later");
    captureUtm();
    expect(getFirstTouch()?.source).toBe("tiktok");
  });

  it("stores nothing without utm params", () => {
    installWindow("https://example.com/foldwink/");
    captureUtm();
    expect(getFirstTouch()).toBeNull();
    expect(attributionRef()).toBeNull();
  });
});

describe("attributionRef / withAttributionRef", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("builds a compact url-safe ref and appends it to outbound links", () => {
    installWindow("https://example.com/?utm_source=tiktok&utm_campaign=batch 01&utm_content=tiktok_03");
    captureUtm();
    expect(attributionRef()).toBe("tiktok.batch_01.tiktok_03");
    expect(withAttributionRef("https://ko-fi.com/neuralvoid")).toBe(
      "https://ko-fi.com/neuralvoid?ref=tiktok.batch_01.tiktok_03",
    );
    expect(withAttributionRef("https://buy.stripe.com/abc", "client_reference_id")).toBe(
      "https://buy.stripe.com/abc?client_reference_id=tiktok.batch_01.tiktok_03",
    );
  });

  it("returns the url untouched when there is no first touch", () => {
    expect(withAttributionRef("https://ko-fi.com/neuralvoid")).toBe("https://ko-fi.com/neuralvoid");
  });
});
