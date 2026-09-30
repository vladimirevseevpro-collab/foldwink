import {
  BASE_URL,
  openPracticePicker,
  runCases,
  seedDismissedOnboarding,
  waitForMenu,
} from "./lib/harness.mjs";

await runCases("localization-qa", [
  {
    name: "switching to RU waits for the Russian pool and opens Russian puzzle content",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);

      await page.getByRole("button", { name: "RU" }).click();
      await page.waitForFunction(() => document.documentElement.lang === "ru", null, {
        timeout: 30_000,
      });

      await openPracticePicker(page);
      const easy = page.getByRole("button", { name: "Лёгкий пазл" });
      await easy.waitFor({ state: "visible" });
      await easy.click();
      const title = page.locator("header h1");
      await title.waitFor({ state: "visible" });
      const titleText = await title.textContent();
      if (!titleText || !/[А-Яа-яЁё]/.test(titleText)) {
        throw new Error(`expected a Russian puzzle title, got ${JSON.stringify(titleText)}`);
      }

      const cardTexts = await page.locator("button[aria-pressed]").allTextContents();
      if (!cardTexts.some((value) => /[А-Яа-яЁё]/.test(value))) {
        throw new Error(
          `expected Russian puzzle cards, got ${JSON.stringify(cardTexts.slice(0, 4))}`,
        );
      }
    },
  },
]);
