import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  safeRead,
  safeWrite,
  safeRemove,
  storageGet,
  storageSet,
  storageSetChecked,
  clearFoldwinkNamespace,
  initStorageAdapter,
  isChromeStorageAvailable,
  resetStorageAdapterForTests,
} from "../storageAdapter";

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

describe("StorageAdapter", () => {
  beforeEach(() => {
    installLocalStorage();
    resetStorageAdapterForTests();
    delete (globalThis as unknown as { chrome?: unknown }).chrome;
  });

  afterEach(() => {
    resetStorageAdapterForTests();
    globalThis.localStorage?.clear();
    delete (globalThis as unknown as { chrome?: unknown }).chrome;
  });

  it("reads and writes synchronously with localStorage fallback", () => {
    expect(safeRead("foldwink:testKey", "defaultVal")).toBe("defaultVal");

    safeWrite("foldwink:testKey", { score: 42 });
    expect(safeRead("foldwink:testKey", null)).toEqual({ score: 42 });
    expect(JSON.parse(localStorage.getItem("foldwink:testKey") || "{}")).toEqual({ score: 42 });

    safeRemove("foldwink:testKey");
    expect(safeRead("foldwink:testKey", "cleared")).toBe("cleared");
    expect(localStorage.getItem("foldwink:testKey")).toBeNull();
  });

  it("returns fallback on malformed JSON without crashing", () => {
    localStorage.setItem("foldwink:corrupt", "{invalid json");
    expect(safeRead("foldwink:corrupt", { fallback: true })).toEqual({ fallback: true });
  });

  it("detects chrome.storage.local when present and bridges operations", async () => {
    expect(isChromeStorageAvailable()).toBe(false);

    const mockStorage: Record<string, unknown> = {};
    const mockChrome = {
      storage: {
        local: {
          get: vi.fn((key: string | null, cb?: (res: Record<string, unknown>) => void) => {
            const res =
              key === null
                ? { ...mockStorage }
                : typeof key === "string"
                  ? { [key]: mockStorage[key] }
                  : {};
            if (cb) cb(res);
            return Promise.resolve(res);
          }),
          set: vi.fn((items: Record<string, unknown>, cb?: () => void) => {
            Object.assign(mockStorage, items);
            if (cb) cb();
            return Promise.resolve();
          }),
          remove: vi.fn((keys: string | string[], cb?: () => void) => {
            const arr = Array.isArray(keys) ? keys : [keys];
            for (const k of arr) delete mockStorage[k];
            if (cb) cb();
            return Promise.resolve();
          }),
          clear: vi.fn((cb?: () => void) => {
            for (const k of Object.keys(mockStorage)) delete mockStorage[k];
            if (cb) cb();
            return Promise.resolve();
          }),
        },
      },
    };

    (globalThis as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;
    expect(isChromeStorageAvailable()).toBe(true);

    await storageSet("foldwink:extKey", { ext: true });
    expect(mockChrome.storage.local.set).toHaveBeenCalled();
    expect(mockStorage["foldwink:extKey"]).toEqual({ ext: true });

    const fetched = await storageGet("foldwink:extKey", null);
    expect(fetched).toEqual({ ext: true });

    safeRemove("foldwink:extKey");
    expect(mockChrome.storage.local.remove).toHaveBeenCalledWith("foldwink:extKey");
  });

  it("hydrates memoryCache and localStorage on initStorageAdapter", async () => {
    const mockStorage: Record<string, unknown> = {
      "foldwink:stats": { wins: 5 },
      "unrelated:key": "ignore",
    };

    const mockChrome = {
      storage: {
        local: {
          get: vi.fn((_key: unknown, cb?: (res: Record<string, unknown>) => void) => {
            if (cb) cb(mockStorage);
            return Promise.resolve(mockStorage);
          }),
          set: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn(),
        },
      },
    };

    (globalThis as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

    await initStorageAdapter();
    expect(safeRead("foldwink:stats", null)).toEqual({ wins: 5 });
    expect(localStorage.getItem("foldwink:stats")).toBe(JSON.stringify({ wins: 5 }));
  });

  it("reports quota and denied writes instead of mistaking them for persistence", async () => {
    (globalThis as { localStorage?: Storage }).localStorage = {
      ...globalThis.localStorage,
      setItem() {
        throw new DOMException("full", "QuotaExceededError");
      },
    } as Storage;
    await expect(storageSetChecked("foldwink:quota", { value: 1 })).resolves.toEqual({
      ok: false,
      reason: "quota",
    });
  });

  it("awaits removal from local, extension, memory and Foldwink CacheStorage", async () => {
    safeWrite("foldwink:local", 1);
    safeWrite("unrelated:local", 2);
    const extensionData: Record<string, unknown> = { "foldwink:extension": 1, other: 2 };
    const chrome = {
      storage: {
        local: {
          get: vi.fn((_keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
            callback?.({ ...extensionData });
            return Promise.resolve({ ...extensionData });
          }),
          set: vi.fn(),
          remove: vi.fn((keys: string[]) => {
            for (const key of keys) delete extensionData[key];
            return Promise.resolve();
          }),
          clear: vi.fn(),
        },
      },
    };
    (globalThis as unknown as { chrome: typeof chrome }).chrome = chrome;
    const deleted: string[] = [];
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        keys: vi.fn(async () => ["foldwink-v1", "other-v1"]),
        delete: vi.fn(async (name: string) => {
          deleted.push(name);
          return true;
        }),
      },
    });

    await expect(clearFoldwinkNamespace()).resolves.toEqual({ ok: true });
    expect(localStorage.getItem("foldwink:local")).toBeNull();
    expect(localStorage.getItem("unrelated:local")).not.toBeNull();
    expect(extensionData["foldwink:extension"]).toBeUndefined();
    expect(extensionData.other).toBe(2);
    expect(deleted).toEqual(["foldwink-v1"]);
    delete (globalThis as { caches?: CacheStorage }).caches;
  });
});
