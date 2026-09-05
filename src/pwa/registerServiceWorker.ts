function isTopLevelWindow(): boolean {
  try {
    return window.top === window;
  } catch {
    return false;
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;

  // On localhost / development, completely purge any stale service workers and caches from previous projects
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    import.meta.env.DEV;

  if (isLocalhost) {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          void reg.unregister();
        }
      });
    }
    if ("caches" in window) {
      void caches.keys().then((keys) => {
        for (const key of keys) {
          void caches.delete(key);
        }
      });
    }
    return;
  }

  if (!("serviceWorker" in navigator) || !isTopLevelWindow()) return;

  window.addEventListener(
    "load",
    () => {
      const base = import.meta.env.BASE_URL;
      void navigator.serviceWorker.register(base + "sw.js", { scope: base });
    },
    { once: true },
  );
}
