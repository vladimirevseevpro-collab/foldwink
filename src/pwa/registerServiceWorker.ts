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
      void navigator.serviceWorker
        .register(base + "sw.js", { scope: base })
        .then((registration) => {
          // If a worker is already waiting, trigger immediate activation
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          // Detect newly installed service workers and tell them to skip waiting
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                installing.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });

          // Check for fresh bundles whenever the user switches back to the tab
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              void registration.update();
            }
          });
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });

      // Reload smoothly when new controller replaces an existing one,
      // so active players don't stay trapped on stale JS bundles.
      // Guard against first-load activation: do NOT reload if there was no prior controller.
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadController && !refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    },
    { once: true },
  );
}
