import { describe, expect, it, beforeEach } from "vitest";
import { THEMES, loadTheme, saveTheme } from "../themes";

function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage?: Storage }).localStorage = {
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

  (globalThis as unknown as { document?: { documentElement: { setAttribute: (k: string, v: string) => void; getAttribute: (k: string) => string | null; removeAttribute: (k: string) => void } } }).document = {
    documentElement: {
      setAttribute(k: string, v: string) {
        store.set(`__dom_${k}`, v);
      },
      getAttribute(k: string) {
        return store.get(`__dom_${k}`) ?? null;
      },
      removeAttribute(k: string) {
        store.delete(`__dom_${k}`);
      },
    },
  };
}

describe("themes system", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("defaults to walnut theme", () => {
    expect(loadTheme()).toBe("walnut");
  });

  it("persists selected theme in localStorage and updates html attribute", () => {
    saveTheme("matcha");
    expect(loadTheme()).toBe("matcha");
    expect(document.documentElement.getAttribute("data-theme")).toBe("matcha");
  });

  it("defines 4 distinctive desk themes with unlock tiers", () => {
    expect(THEMES.length).toBe(4);
    expect(THEMES.map((t) => t.id)).toEqual(["walnut", "matcha", "midnight", "manila"]);
  });
});
