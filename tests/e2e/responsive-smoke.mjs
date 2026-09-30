/**
 * Agent 3: responsive-smoke
 *
 * Confirms the app works at desktop + narrow-mobile widths. Specifically
 * guards QA rows M-06 (timer visible on mobile) and D-21 / M-08 (no
 * horizontal overflow).
 */

import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

async function startEasy(page) {
  await startEasyPractice(page);
}

async function assertNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `horizontal overflow: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`,
    );
  }
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 }, // iPhone 14 portrait
  mobileLarge: { width: 430, height: 932 }, // current Pro Max class
  narrow: { width: 320, height: 568 }, // iPhone SE 1st gen, smallest we care about
};

await runCases("responsive-smoke", [
  {
    name: "desktop: menu renders without horizontal scroll",
    viewport: VIEWPORTS.desktop,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await page.getByText("1,000 puzzles", { exact: true }).waitFor({ state: "visible" });
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "desktop: game screen renders timer and grid",
    viewport: VIEWPORTS.desktop,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      await page.waitForSelector('[aria-label^="Elapsed time"]');
      const cards = await page.locator("button[aria-pressed]").count();
      if (cards < 16) throw new Error(`expected 16 cards, got ${cards}`);
      const gridBox = await page.getByRole("grid", { name: "Puzzle grid" }).boundingBox();
      if (!gridBox || gridBox.width < 600) {
        throw new Error(`desktop puzzle grid is still undersized: ${JSON.stringify(gridBox)}`);
      }
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "mobile (390): menu renders without horizontal scroll",
    viewport: VIEWPORTS.mobile,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "mobile (390): game screen — timer visible, cards tappable",
    viewport: VIEWPORTS.mobile,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const timer = page.locator('[aria-label^="Elapsed time"]');
      await timer.waitFor({ state: "visible" });
      const tb = await timer.boundingBox();
      if (!tb || tb.width < 20)
        throw new Error(`timer too small on mobile: ${JSON.stringify(tb)}`);
      // Assert the ordinary-size tier, not whichever randomly shuffled card happens
      // to be first (long labels deliberately use a smaller fit tier).
      const cards = page.locator("button[aria-pressed]");
      const labels = await cards.evaluateAll((elements) =>
        elements.map((element) => element.textContent?.trim() ?? ""),
      );
      const ordinaryIndex = labels.findIndex((label) => Array.from(label).length <= 13);
      if (ordinaryIndex === -1) throw new Error("test board has no ordinary-size card label");
      const ordinaryCard = cards.nth(ordinaryIndex);
      const gridBox = await page.getByRole("grid", { name: "Puzzle grid" }).boundingBox();
      const cardBox = await ordinaryCard.boundingBox();
      if (!gridBox || gridBox.width < VIEWPORTS.mobile.width - 48) {
        throw new Error(`mobile grid does not use the viewport: ${JSON.stringify(gridBox)}`);
      }
      if (!cardBox || cardBox.height < 44) {
        throw new Error(`mobile card misses touch target: ${JSON.stringify(cardBox)}`);
      }
      const fontSize = await ordinaryCard.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
      if (fontSize < 13)
        throw new Error(`ordinary mobile card text is too small: ${fontSize}px`);
      await ordinaryCard.click();
      const pressed = await ordinaryCard.getAttribute("aria-pressed");
      if (pressed !== "true")
        throw new Error("ordinary card did not register selection on mobile");
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "narrow (320): first-run tutorial is readable and not a modal",
    viewport: VIEWPORTS.narrow,
    fn: async ({ page }) => {
      await page.goto(BASE_URL);
      const tutorial = page.getByTestId("onboarding");
      await tutorial.getByText("How to play").waitFor();
      if ((await tutorial.getAttribute("role")) !== "region") {
        throw new Error("first-run tutorial regressed to a modal");
      }
      const demoCards = tutorial.locator(
        '[aria-label="Demo group of four fruit cards"] button[aria-pressed]',
      );
      const demoCardCount = await demoCards.count();
      if (demoCardCount !== 4) throw new Error(`expected 4 demo cards, got ${demoCardCount}`);
      const firstCard = demoCards.first();
      const cardBox = await firstCard.boundingBox();
      if (!cardBox || cardBox.height < 44) {
        throw new Error(`tutorial card is too small: ${JSON.stringify(cardBox)}`);
      }
      if (!(await tutorial.getByRole("button", { name: "Skip" }).isVisible())) {
        throw new Error("Skip is not reachable on the first tutorial screen");
      }
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "mobile (430): board remains full-width and controls stay stable",
    viewport: VIEWPORTS.mobileLarge,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const gridBox = await page.getByRole("grid", { name: "Puzzle grid" }).boundingBox();
      if (!gridBox || gridBox.width < VIEWPORTS.mobileLarge.width - 48) {
        throw new Error(`large-mobile grid is undersized: ${JSON.stringify(gridBox)}`);
      }
      const submit = page.getByRole("button", { name: "Submit" });
      await submit.scrollIntoViewIfNeeded();
      if (!(await submit.isVisible())) throw new Error("Submit is not reachable at 430x932");
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "narrow (320): game controls remain reachable",
    viewport: VIEWPORTS.narrow,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const first = page.locator("button[aria-pressed]").first();
      const cardBox = await first.boundingBox();
      if (!cardBox || cardBox.height < 44) {
        throw new Error(`narrow card is too small: ${JSON.stringify(cardBox)}`);
      }
      const submit = page.getByRole("button", { name: "Submit" });
      await submit.scrollIntoViewIfNeeded();
      if (!(await submit.isVisible())) throw new Error("Submit is not reachable at 320x568");
      await assertNoHorizontalScroll(page);
    },
  },
  {
    name: "mobile embed: offers a direct full-size launch",
    viewport: VIEWPORTS.mobile,
    contextOptions: { hasTouch: true, isMobile: true },
    fn: async ({ page }) => {
      await page.setContent(
        `<iframe title="Foldwink embed" src="${BASE_URL}" style="width:100%;height:760px;border:0"></iframe>`,
      );
      const frame = page.frameLocator('iframe[title="Foldwink embed"]');
      const launch = frame.getByTestId("embedded-mobile-launch");
      await launch.waitFor({ state: "visible" });
      const directLink = launch.getByRole("link", { name: "Open full-size game" });
      const href = await directLink.getAttribute("href");
      if (!href?.startsWith(BASE_URL)) {
        throw new Error(`full-size action points to the wrong build: ${href}`);
      }
      await launch.getByRole("button", { name: "Continue in the small frame" }).click();
      await launch.waitFor({ state: "hidden" });
    },
  },
]);
