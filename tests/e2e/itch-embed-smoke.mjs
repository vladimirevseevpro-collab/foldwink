/**
 * Agent 4: itch-embed-smoke
 *
 * Approximates the itch.io HTML5 embed environment. itch serves the
 * uploaded zip from a sub-path inside an iframe with a restrictive CSP;
 * we can't reproduce that fully without uploading, but we can reproduce
 * the two properties that actually matter:
 *
 *   1. The bundle boots with relative asset paths and no 404s. Vite is
 *      configured `base: "./"` for exactly this use case.
 *   2. The share flow degrades gracefully when `navigator.share` is
 *      stripped by the host (some itch iframe CSPs do this).
 *
 * Running the app in a real `file://` context breaks because Chromium
 * blocks ES module imports across `file://` URLs; the preview server is
 * the nearest honest approximation.
 *
 * Covers QA rows I-01 through I-06.
 */

import { BASE_URL, runCases, seedDismissedOnboarding, waitForMenu } from "./lib/harness.mjs";

await runCases("itch-embed-smoke", [
  {
    name: "bundle boots with no failing asset requests",
    fn: async ({ page, consoleErrors }) => {
      const failures = [];
      page.on("response", (r) => {
        if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
      });
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      if (failures.length > 0) throw new Error(`asset failures: ${failures.join(", ")}`);
      const realErrors = consoleErrors.filter((e) => !/favicon|Manifest/i.test(e));
      if (realErrors.length > 0) throw new Error(`console errors: ${realErrors.join(", ")}`);
    },
  },
  {
    name: "every <script> and <link> uses a relative URL (itch.io subpath-safe)",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const urls = await page.evaluate(() => {
        const out = [];
        document
          .querySelectorAll("script[src]")
          .forEach((el) => out.push(el.getAttribute("src")));
        document
          .querySelectorAll('link[rel="stylesheet"]')
          .forEach((el) => out.push(el.getAttribute("href")));
        document
          .querySelectorAll('link[rel="icon"]')
          .forEach((el) => out.push(el.getAttribute("href")));
        return out;
      });
      const absolute = urls.filter((u) => u && (/^https?:\/\//.test(u) || u.startsWith("/")));
      if (absolute.length > 0) {
        throw new Error(
          `non-relative asset URLs (breaks itch.io subpath embed): ${absolute.join(", ")}`,
        );
      }
    },
  },
  {
    name: "localStorage survives reload (itch HTML5 embeds isolate storage per game, so basic persistence must work)",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await page.evaluate(() => {
        localStorage.setItem(
          "foldwink:stats",
          JSON.stringify({ gamesPlayed: 2, wins: 2, losses: 0 }),
        );
      });
      await page.reload();
      await waitForMenu(page);
      const stats = await page.evaluate(() => localStorage.getItem("foldwink:stats"));
      if (!stats) throw new Error("localStorage did not survive reload");
      const parsed = JSON.parse(stats);
      if (parsed.wins !== 2) throw new Error(`wins not restored: ${stats}`);
    },
  },
  {
    name: "share flow survives a host that strips navigator.share",
    fn: async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
          configurable: true,
          get: () => undefined,
        });
      });
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const shareExposed = await page.evaluate(() => typeof navigator.share);
      if (shareExposed !== "undefined") {
        throw new Error(`navigator.share override failed, got: ${shareExposed}`);
      }
      // App must still render — no error boundary, no white screen.
      const stillHasMenu = await page.getByTestId("menu-today-card").isVisible();
      if (!stillHasMenu) throw new Error("menu disappeared with navigator.share stripped");
    },
  },
  {
    name: "bundle does not reach out to localhost or dev-only hosts at runtime",
    fn: async ({ page }) => {
      const responses = [];
      page.on("response", (r) => responses.push(r.url()));
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const suspicious = responses.filter(
        (u) => /127\.0\.0\.1|:3000|:5173|ws:\/\//.test(u) && !u.includes("localhost:4175"),
      );
      if (suspicious.length > 0) {
        throw new Error(`bundle reached out to dev hosts: ${suspicious.join(", ")}`);
      }
    },
  },
]);
