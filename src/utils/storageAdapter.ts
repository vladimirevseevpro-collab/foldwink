/**
 * Foldwink Storage Adapter
 *
 * Provides a unified storage layer that seamlessly bridges between:
 * 1. Chrome Extension / Edge Sidebar environment (`chrome.storage.local`)
 * 2. Standard Web environment (`localStorage`)
 * 3. In-memory synchronous cache for instantaneous frame-budget access (<16ms)
 *
 * Fail-safe: Quota exceeded, sandboxed iframes, or disabled storage gracefully
 * fall back without throwing or interrupting gameplay.
 */

// Chrome extension storage interface definition without requiring heavy devDependencies
interface ChromeStorageArea {
  get(
    keys: string | string[] | Record<string, unknown> | null,
    callback?: (items: Record<string, unknown>) => void,
  ): Promise<Record<string, unknown>> | void;
  set(items: Record<string, unknown>, callback?: () => void): Promise<void> | void;
  remove(keys: string | string[], callback?: () => void): Promise<void> | void;
  clear(callback?: () => void): Promise<void> | void;
}

declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: ChromeStorageArea;
      };
    };
  }
}

const memoryCache = new Map<string, unknown>();

export type StorageAdapterFailure = "unavailable" | "denied" | "quota" | "unknown";
export type StorageAdapterResult = { ok: true } | { ok: false; reason: StorageAdapterFailure };

function failureReason(error: unknown): StorageAdapterFailure {
  const name =
    typeof DOMException !== "undefined" && error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") return "quota";
  if (name === "SecurityError" || name === "NotAllowedError") return "denied";
  return "unknown";
}

function getChromeStorage(): ChromeStorageArea | null {
  try {
    const root = typeof window !== "undefined" ? window : (globalThis as unknown as Window);
    if (
      root?.chrome?.storage?.local &&
      typeof root.chrome.storage.local.get === "function" &&
      typeof root.chrome.storage.local.set === "function"
    ) {
      return root.chrome.storage.local;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function isChromeStorageAvailable(): boolean {
  return getChromeStorage() !== null;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      return (globalThis as { localStorage?: Storage }).localStorage ?? null;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function isLocalStorageAvailable(): boolean {
  const s = getLocalStorage();
  if (!s) return false;
  try {
    const testKey = "__fw_test__";
    s.setItem(testKey, "1");
    s.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronous read. Checks memory cache first, then localStorage.
 * Ideal for store initializations and tight 16ms animation frames.
 */
export function safeRead<T>(key: string, fallback: T): T {
  const s = getLocalStorage();
  if (s) {
    try {
      const raw = s.getItem(key);
      if (raw != null) {
        try {
          const parsed = JSON.parse(raw) as T;
          memoryCache.set(key, parsed);
          return parsed;
        } catch {
          // If fallback is string, tolerate raw unquoted string in storage
          if (typeof fallback === "string") {
            memoryCache.set(key, raw);
            return raw as unknown as T;
          }
          memoryCache.delete(key);
          return fallback;
        }
      }
      if (!isChromeStorageAvailable()) {
        memoryCache.delete(key);
        return fallback;
      }
    } catch {
      // Access denied
    }
  }

  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  return fallback;
}

/**
 * Synchronous write. Updates memory cache immediately, writes to localStorage,
 * and if running inside a Chrome Extension/Edge Sidebar, triggers an async
 * persistence to chrome.storage.local.
 */
export function safeWrite(key: string, value: unknown): void {
  memoryCache.set(key, value);

  const s = getLocalStorage();
  if (s) {
    try {
      s.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota exceeded or storage disabled
    }
  }

  const cs = getChromeStorage();
  if (cs) {
    try {
      void cs.set({ [key]: value });
    } catch {
      // Ignore extension storage error
    }
  }
}

/**
 * Explicit write result for recovery surfaces.  Existing synchronous callers
 * remain best-effort for compatibility; atomic game terminal writes never use
 * this adapter and remain in IndexedDB transactions.
 */
export async function storageSetChecked(
  key: string,
  value: unknown,
): Promise<StorageAdapterResult> {
  memoryCache.set(key, value);
  let localResult: StorageAdapterResult = { ok: false, reason: "unavailable" };
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(key, JSON.stringify(value));
      localResult = { ok: true };
    } catch (error) {
      localResult = { ok: false, reason: failureReason(error) };
    }
  }

  const chrome = getChromeStorage();
  if (chrome) {
    try {
      await chromeSet(chrome, { [key]: value });
      return { ok: true };
    } catch (error) {
      return localResult.ok ? localResult : { ok: false, reason: failureReason(error) };
    }
  }
  return localResult;
}

/**
 * Synchronous remove. Deletes from cache, localStorage, and chrome.storage.local.
 */
export function safeRemove(key: string): void {
  memoryCache.delete(key);

  const s = getLocalStorage();
  if (s) {
    try {
      s.removeItem(key);
    } catch {
      // Ignore
    }
  }

  const cs = getChromeStorage();
  if (cs) {
    try {
      void cs.remove(key);
    } catch {
      // Ignore
    }
  }
}

/**
 * Asynchronous read with explicit chrome.storage.local pre-fetch.
 */
export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  const cs = getChromeStorage();
  if (cs) {
    try {
      const res = await new Promise<Record<string, unknown>>((resolve) => {
        const p = cs.get(key, (items) => resolve(items || {}));
        if (p && typeof (p as Promise<Record<string, unknown>>).then === "function") {
          (p as Promise<Record<string, unknown>>).then(resolve).catch(() => resolve({}));
        }
      });
      if (res && key in res && res[key] !== undefined) {
        const val = res[key] as T;
        memoryCache.set(key, val);
        return val;
      }
    } catch {
      // fallback to localStorage
    }
  }

  return safeRead<T>(key, fallback);
}

/**
 * Asynchronous write with guaranteed chrome.storage.local settlement.
 */
export async function storageSet(key: string, value: unknown): Promise<void> {
  safeWrite(key, value);

  const cs = getChromeStorage();
  if (cs) {
    try {
      await new Promise<void>((resolve) => {
        const p = cs.set({ [key]: value }, () => resolve());
        if (p && typeof (p as Promise<void>).then === "function") {
          (p as Promise<void>).then(resolve).catch(() => resolve());
        }
      });
    } catch {
      // Ignore
    }
  }
}

function chromeSet(storage: ChromeStorageArea, items: Record<string, unknown>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const result = storage.set(items, () => resolve());
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function chromeGetAll(storage: ChromeStorageArea): Promise<Record<string, unknown>> {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    try {
      const result = storage.get(null, (items) => resolve(items ?? {}));
      if (result && typeof (result as Promise<Record<string, unknown>>).then === "function") {
        (result as Promise<Record<string, unknown>>).then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function chromeRemove(storage: ChromeStorageArea, keys: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const result = storage.remove(keys, () => resolve());
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/** Removes Foldwink data from every adapter layer and awaits extension I/O. */
export async function clearFoldwinkNamespace(
  prefix = "foldwink:",
): Promise<StorageAdapterResult> {
  let failed: StorageAdapterResult | null = null;
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }

  const local = getLocalStorage();
  if (local) {
    try {
      const keys: string[] = [];
      for (let index = 0; index < local.length; index += 1) {
        const key = local.key(index);
        if (key?.startsWith(prefix)) keys.push(key);
      }
      for (const key of keys) local.removeItem(key);
    } catch (error) {
      failed = { ok: false, reason: failureReason(error) };
    }
  }

  const chrome = getChromeStorage();
  if (chrome) {
    try {
      const all = await chromeGetAll(chrome);
      const keys = Object.keys(all).filter((key) => key.startsWith(prefix));
      if (keys.length > 0) await chromeRemove(chrome, keys);
    } catch (error) {
      failed = { ok: false, reason: failureReason(error) };
    }
  }

  // Caches are user data as well: leaving a Foldwink-named cache behind
  // after an explicit full reset can resurrect old shell/content on reload.
  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith("foldwink-")).map((name) => caches.delete(name)),
      );
    } catch (error) {
      failed = { ok: false, reason: failureReason(error) };
    }
  }
  return failed ?? { ok: true };
}

/**
 * Initialize adapter: pre-populates memoryCache from chrome.storage.local if available.
 */
export async function initStorageAdapter(): Promise<void> {
  const cs = getChromeStorage();
  if (!cs) return;

  try {
    const all = await new Promise<Record<string, unknown>>((resolve) => {
      const p = cs.get(null, (items) => resolve(items || {}));
      if (p && typeof (p as Promise<Record<string, unknown>>).then === "function") {
        (p as Promise<Record<string, unknown>>).then(resolve).catch(() => resolve({}));
      }
    });

    if (all && Object.keys(all).length > 0) {
      const s = getLocalStorage();
      for (const [k, v] of Object.entries(all)) {
        if (k.startsWith("foldwink:")) {
          memoryCache.set(k, v);
          if (s) {
            try {
              s.setItem(k, JSON.stringify(v));
            } catch {
              // Ignore
            }
          }
        }
      }
    } else {
      // Fallback: sync from localStorage into chrome.storage.local if extension storage is empty
      const s = getLocalStorage();
      if (s) {
        const exportPayload: Record<string, unknown> = {};
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k && k.startsWith("foldwink:")) {
            try {
              const raw = s.getItem(k);
              if (raw != null) {
                const val = JSON.parse(raw);
                memoryCache.set(k, val);
                exportPayload[k] = val;
              }
            } catch {
              // Ignore
            }
          }
        }
        if (Object.keys(exportPayload).length > 0) {
          void cs.set(exportPayload);
        }
      }
    }
  } catch {
    // Ignore init failure
  }
}

/**
 * Test utility to reset cache and state.
 */
export function resetStorageAdapterForTests(): void {
  memoryCache.clear();
}
