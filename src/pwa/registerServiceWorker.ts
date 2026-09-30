import {
  isServiceWorkerUpdateActivationRequested,
  setWaitingServiceWorker,
} from "./updateLifecycle";

type BootManifest = { boot?: { path?: unknown } };

function isTopLevelWindow(): boolean {
  try {
    return window.top === window;
  } catch {
    return false;
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;

  // Purge only while Vite is serving the mutable development graph. A
  // production preview on localhost must exercise the exact shipping PWA
  // lifecycle; otherwise offline acceptance can never test the built app.
  const isLocalhost = import.meta.env.DEV;

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

  const cacheSelectedBootContent = (registration: ServiceWorkerRegistration): void => {
    const language = document.documentElement.lang || "en";
    if (!/^(en|ru|de)$/u.test(language)) return;
    const manifestUrl = new URL(
      `runtime-content/v1/manifest.${language}.json`,
      registration.scope,
    );
    void fetch(manifestUrl)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("manifest unavailable")),
      )
      .then((manifest: BootManifest) => {
        if (typeof manifest.boot?.path !== "string") return;
        const bootUrl = new URL(manifest.boot.path, manifestUrl);
        registration.active?.postMessage({
          type: "FOLDWINK_CACHE_URLS",
          urls: [manifestUrl.href, bootUrl.href],
        });
      })
      .catch(() => {
        // Offline first launch has no boot manifest to save yet; the menu stays
        // honest through its content availability rules.
      });
  };

  const register = (): void => {
    const base = import.meta.env.BASE_URL;
    void navigator.serviceWorker
      .register(base + "sw.js", { scope: base })
      .then((registration) => {
        // `active` is null on a first install until install/activate finish.
        // Wait for readiness so the selected boot manifest is not lost in
        // that narrow first-load window.
        void navigator.serviceWorker.ready.then(cacheSelectedBootContent);
        // A waiting worker is an available update, not permission to disrupt
        // a player. The Menu/Result prompt owns the explicit activation.
        if (registration.waiting) {
          setWaitingServiceWorker(registration.waiting);
        }

        // Detect a freshly installed update but leave it waiting.
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingServiceWorker(installing);
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

    // An activation message is emitted by the worker only after the explicit
    // Update now action. There is intentionally no controllerchange reload:
    // a background update can never interrupt an active puzzle.
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (
        event.data?.type === "FOLDWINK_UPDATE_ACTIVATED" &&
        isServiceWorkerUpdateActivationRequested()
      ) {
        window.location.reload();
      }
    });
  };

  // Module evaluation can finish after `load` when locale/content chunks are
  // cold. Register immediately in that case instead of silently missing the
  // only event we were waiting for.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
