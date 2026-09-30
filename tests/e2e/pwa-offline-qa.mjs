import { BASE_URL, runCases, seedDismissedOnboarding, waitForMenu } from "./lib/harness.mjs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

await runCases("pwa-offline-qa", [
  {
    name: "TEST-36: standalone top-level app caches core plus selected boot content, then cold-reopens offline",
    viewport: { width: 390, height: 844 },
    fn: async ({ page, context }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);

      await page.evaluate(async () => {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) =>
            window.setTimeout(() => reject(new Error("service worker readiness timed out")), 15_000),
          ),
        ]);
      });
      await page.reload();
      await waitForMenu(page);

      const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
      if (!controlled) throw new Error("service worker did not control the reloaded app");

      const cachedBoot = await page.evaluate(async () => {
        const until = Date.now() + 15_000;
        while (Date.now() < until) {
          const keys = await globalThis.caches.keys();
          for (const key of keys) {
            const cache = await globalThis.caches.open(key);
            const urls = (await cache.keys()).map((request) => request.url);
            const hasCore = urls.some((url) => /\/assets\//u.test(url));
            const hasManifest = urls.some((url) => /runtime-content\/v1\/manifest\.en\.json$/u.test(url));
            const hasBoot = urls.some((url) => /runtime-content\/v1\/boot\.en\.[a-f0-9]{12}\.json$/u.test(url));
            if (hasCore && hasManifest && hasBoot) return true;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 100));
        }
        return false;
      });
      if (!cachedBoot) throw new Error("core or selected EN boot content was not cached after install");

      await context.setOffline(true);
      try {
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForMenu(page);
      } finally {
        await context.setOffline(false);
      }
    },
  },
  {
    name: "TEST-37 fixture: an active puzzle has no update prompt or automatic navigation",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);

      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload();
      await waitForMenu(page);

      const fixture = resolve("dist/sw-test37.js");
      const workerSource = await readFile(resolve("dist/sw.js"), "utf8");
      await writeFile(
        fixture,
        `${workerSource.replace(/foldwink-precache-[a-f0-9]{12}/u, "foldwink-precache-test37new")}\n// TEST-37 newer worker`,
        "utf8",
      );
      try {
        const controllerBefore = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
        await page.evaluate(async () => {
          await navigator.serviceWorker.register("./sw-test37.js", { scope: "./" });
        });
        await page.getByTestId("pwa-update-notice").waitFor({ timeout: 15_000 });

        await page.getByTestId("menu-practice-toggle").click();
        await page.getByTestId("menu-practice-easy").click();
        await page.waitForSelector('[data-fw-screen="game"]');

        const urlBefore = page.url();
        await page.waitForTimeout(750);
        if (page.url() !== urlBefore) throw new Error("active game navigated without a player update action");
        if (await page.getByTestId("pwa-update-notice").count()) {
          throw new Error("update prompt appeared during an active game");
        }
        const controllerAfter = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
        if (controllerAfter !== controllerBefore) {
          throw new Error("new worker took control while the player was in an active game");
        }
      } finally {
        await rm(fixture, { force: true });
      }
    },
  },
  {
    name: "eligible browsers expose a player-initiated PWA install action and record only its coarse outcome",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);

      await page.evaluate(() => {
        const event = new window.Event("beforeinstallprompt", { cancelable: true });
        Object.assign(event, {
          prompt: async () => undefined,
          userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
        });
        window.dispatchEvent(event);
      });

      const install = page.getByRole("button", { name: "Install Foldwink" });
      await install.waitFor();
      await install.click();
      await install.waitFor({ state: "detached" });

      const count = await page.evaluate(() => {
        let total = 0;
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (key !== "foldwink:analytics:events:v2" && !key?.startsWith("foldwink:analytics:event-bucket:v2:")) continue;
          const counts = JSON.parse(localStorage.getItem(key) ?? "{}");
          total += Number.isSafeInteger(counts.pwa_install_choice) ? counts.pwa_install_choice : 0;
        }
        return total;
      });
      if (count !== 1) throw new Error(`expected one install choice event, got ${count}`);
    },
  },
]);
