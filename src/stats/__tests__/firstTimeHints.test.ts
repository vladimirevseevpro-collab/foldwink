import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function installLocalStorage(): Map<string, string> {
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
  return store;
}

async function loadModule() {
  vi.resetModules();
  return await import("../firstTimeHints");
}

describe("firstTimeHints", () => {
  beforeEach(() => {
    installLocalStorage();
    vi.resetModules();
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    vi.resetModules();
  });

  it("shows once, then persists the seen flag", async () => {
    const hints = await loadModule();
    expect(hints.shouldShowMediumHint()).toBe(true);

    hints.markMediumHintSeen();
    expect(hints.shouldShowMediumHint()).toBe(false);
    expect(JSON.parse(localStorage.getItem(hints.MEDIUM_HINT_SEEN_KEY) ?? "null")).toBe(true);
  });

  it("does not reshow after a fresh load when the flag persisted", async () => {
    const first = await loadModule();
    first.markMediumHintSeen();

    const second = await loadModule();
    expect(second.shouldShowMediumHint()).toBe(false);
  });

  it("shows at most once per session when storage writes fail", async () => {
    installLocalStorage();
    localStorage.setItem = () => {
      throw new Error("storage denied");
    };

    const hints = await loadModule();
    expect(hints.shouldShowMediumHint()).toBe(true);

    hints.markMediumHintSeen();
    expect(hints.shouldShowMediumHint()).toBe(false);
  });
});
