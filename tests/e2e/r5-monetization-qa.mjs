import { BASE_URL, runCases, seedDismissedOnboarding, waitForMenu } from "./lib/harness.mjs";

const MOBILE = { width: 390, height: 844 };
const ANALYTICS_ORIGIN = "https://analytics.foldwink.test";

async function installAnalyticsRoute(page) {
  const requests = [];
  await page.route(ANALYTICS_ORIGIN + "/**", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      contentType: "application/javascript",
      body: "window.umami = { events: [], track: function (name, payload) { this.events.push({ name: name, payload: payload }); } };",
    });
  });
  return requests;
}

await runCases("r5-monetization-qa", [
  {
    name: "default build has no consent prompt or analytics request",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      const requests = await installAnalyticsRoute(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      if (await page.getByTestId("privacy-control").count()) {
        throw new Error("default build exposed a consent control without configured analytics");
      }
      if (requests.length !== 0) throw new Error("default build requested analytics");
    },
  },
  {
    name: "configured analytics stays dormant until explicit consent, then sends only the choice event",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await page.addInitScript(() => {
        window.__FOLDWINK_CONFIG__ = {
          umamiWebsiteId: "foldwink-e2e",
          umamiScriptUrl: "https://analytics.foldwink.test/script.js",
        };
      });
      await seedDismissedOnboarding(page);
      const requests = await installAnalyticsRoute(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);

      if (!(await page.getByTestId("privacy-control").isVisible())) {
        throw new Error("configured analytics did not expose the privacy control");
      }
      if (requests.length !== 0) {
        throw new Error("analytics loaded before explicit consent");
      }

      await page.getByTestId("privacy-control").click();
      await page.getByRole("button", { name: "Allow anonymous measurement" }).click();
      await page.waitForFunction(
        () =>
          Array.isArray(window.umami?.events) &&
          window.umami.events.some((event) => event.name === "privacy_choice"),
      );

      const state = await page.evaluate(() => ({
        consent: localStorage.getItem("foldwink:analytics:consent:v1"),
        events: window.umami?.events ?? [],
      }));
      if (requests.length !== 1) {
        throw new Error(
          "expected one analytics script request after consent, got " + requests.length,
        );
      }
      if (state.consent !== '{"version":1,"status":"granted"}') {
        throw new Error("consent was not persisted: " + state.consent);
      }
      const choice = state.events.find((event) => event.name === "privacy_choice");
      if (
        !choice ||
        choice.payload?.surface !== "privacy_dialog" ||
        choice.payload?.outcome !== "granted" ||
        choice.payload?.lang !== "en"
      ) {
        throw new Error(
          "privacy choice payload was not coarse and complete: " + JSON.stringify(choice),
        );
      }
    },
  },
  {
    name: "supporter return keeps unrelated query data, marks the cosmetic flag, and shows one-shot thanks",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL + "?utm_source=tiktok&supporter=success");
      await waitForMenu(page);
      await page.getByTestId("supporter-thank-you").waitFor();
      const state = await page.evaluate(() => ({
        supporter: localStorage.getItem("foldwink:supporter"),
        url: window.location.href,
      }));
      if (state.supporter !== "1") throw new Error("supporter flag was not set on return");
      if (state.url.includes("supporter=success") || !state.url.includes("utm_source=tiktok")) {
        throw new Error("return URL was not cleaned correctly: " + state.url);
      }
    },
  },
]);
