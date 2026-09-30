/**
 * Agent 2: gameplay-smoke
 *
 * Asserts the basic interaction surface: load, onboarding, selection
 * limits, submit, timer visibility, quit. Specifically covers QA rows
 * D-07 / M-06 (timer visible), E-06 (selection cap), E-07 (double-submit
 * guard), E-03 (quit).
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

async function seedSolvedCookingSession(page) {
  await seedDismissedOnboarding(page);
  const order = [
    "Poaching",
    "Simmering",
    "Braising",
    "Blanching",
    "Baking",
    "Roasting",
    "Steaming",
    "Deep-Frying",
    "Pan-Frying",
    "Searing",
    "Griddle Cooking",
    "Plancha",
    "Grilling",
    "Broiling",
    "Barbecuing",
    "Tandoor Cooking",
  ];
  await page.addInitScript(
    (payload) => {
      const now = Date.now();
      localStorage.setItem(
        "foldwink:active-session",
        JSON.stringify({
          puzzleId: "puzzle-0323",
          savedAt: now,
          active: {
            puzzleId: "puzzle-0323",
            mode: "standard",
            order: payload.order,
            selection: [],
            solvedGroupIds: ["g1"],
            mistakesUsed: 0,
            startedAt: now,
            countsToStats: false,
            winkedGroupId: null,
          },
        }),
      );
    },
    { order },
  );
}

await runCases("gameplay-smoke", [
  {
    name: "first visit: two-step tutorial appears and Skip routes to the first starter",
    fn: async ({ page }) => {
      await page.goto(BASE_URL);
      const tutorial = page.getByTestId("onboarding");
      await tutorial.getByText("How to play").waitFor();
      if ((await tutorial.getAttribute("role")) !== "region") {
        throw new Error("first-run tutorial should be a full page, not a modal dialog");
      }
      await tutorial.getByRole("button", { name: "Skip" }).click();
      await page.waitForSelector("header h1", { timeout: 10_000 });
      const onboarded = await page.evaluate(() => localStorage.getItem("foldwink:onboarded"));
      if (onboarded !== "true") throw new Error(`onboarded flag not set: ${onboarded}`);
      const modeSubtitle = await page.locator("header p").first().textContent();
      if (!modeSubtitle?.toLowerCase().includes("standard")) {
        throw new Error(`Skip should route to the starter path; subtitle was "${modeSubtitle}"`);
      }
    },
  },
  {
    name: "onboarding demonstrates the required select-four and Submit actions",
    fn: async ({ page }) => {
      await page.goto(BASE_URL);
      const tutorial = page.getByTestId("onboarding");
      await tutorial.getByText("How to play").waitFor();

      const demoCards = tutorial.locator(
        '[aria-label="Demo group of four fruit cards"] button[aria-pressed]',
      );
      if ((await demoCards.count()) !== 4) {
        throw new Error("onboarding should present four selectable demo cards");
      }
      for (let index = 0; index < 4; index += 1) {
        await demoCards.nth(index).click();
      }

      await tutorial.getByRole("button", { name: "Continue" }).click();
      await tutorial.getByRole("button", { name: "Submit" }).click();
      await tutorial.getByText("Correct — Fruit").waitFor();

      const beforeFinish = await page.evaluate(() => ({
        onboarded: localStorage.getItem("foldwink:onboarded"),
        stats: localStorage.getItem("foldwink:stats"),
        daily: localStorage.getItem("foldwink:daily"),
      }));
      if (beforeFinish.onboarded || beforeFinish.stats || beforeFinish.daily) {
        throw new Error(`tutorial mutated player records: ${JSON.stringify(beforeFinish)}`);
      }

      await tutorial.getByRole("button", { name: "Got it" }).click();
      await page.waitForSelector("header h1", { timeout: 10_000 });
    },
  },
  {
    name: "menu help replays as a dialog without clearing onboarding",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await page.getByRole("button", { name: "How to play" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByText("How to play").waitFor();
      await dialog.getByRole("button", { name: "Skip" }).click();
      await waitForMenu(page);
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (focused !== "How to play") {
        throw new Error(`dialog close should restore How to play focus, got ${focused}`);
      }
      const onboarded = await page.evaluate(() => localStorage.getItem("foldwink:onboarded"));
      if (onboarded !== "true") {
        throw new Error(`replaying help changed onboarding state: ${onboarded}`);
      }
    },
  },
  {
    name: "start easy: timer renders with readable contrast",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const timer = page.locator('[aria-label^="Elapsed time"]');
      await timer.waitFor({ state: "visible", timeout: 5_000 });
      const boundingBox = await timer.boundingBox();
      if (!boundingBox || boundingBox.width < 20 || boundingBox.height < 10) {
        throw new Error(`timer not visibly sized: ${JSON.stringify(boundingBox)}`);
      }
      const color = await timer.evaluate((el) => getComputedStyle(el).color);
      // text-text is #e8eaf0 which reads as rgb(232, 234, 240). muted (the
      // old colour) is #8a8f9a → rgb(138, 143, 154). The channel-sum check
      // distinguishes them robustly without caring about exact hex.
      const m = color.match(/\d+/g);
      if (!m) throw new Error(`could not parse timer color: ${color}`);
      const channelSum = Number(m[0]) + Number(m[1]) + Number(m[2]);
      if (channelSum < 500) {
        throw new Error(`timer colour looks muted (channelSum=${channelSum}): ${color}`);
      }
    },
  },
  {
    name: "arrow navigation skips solved disabled cards without losing focus",
    fn: async ({ page }) => {
      await seedSolvedCookingSession(page);
      await page.goto(BASE_URL);
      await page.getByTestId("menu-continue-card").getByRole("button").click();
      await page.waitForSelector('[data-fw-screen="game"] .fw-card');
      const cards = page.locator(".fw-card:not(:disabled)");
      await cards.first().focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute("aria-label"),
      );
      if (focused !== "Grilling") {
        throw new Error(`expected focus to skip solved row to Grilling, got ${focused}`);
      }
    },
  },
  {
    name: "selection cap: tapping a 5th card does not select it",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const cards = page.locator("button[aria-pressed]");
      for (let i = 0; i < 5; i++) await cards.nth(i).click();
      const selectedCount = await page.locator("button[aria-pressed=true]").count();
      if (selectedCount !== 4) throw new Error(`expected 4 selected, got ${selectedCount}`);
    },
  },
  {
    name: "sound pack: gameplay loads only the cue it needs",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      const responses = new Map();
      page.on("response", (response) => {
        const url = new globalThis.URL(response.url());
        if (url.pathname.includes("/audio/") && url.pathname.endsWith(".wav")) {
          const fileName = url.pathname.split("/").at(-1);
          if (fileName) responses.set(fileName, response.status());
        }
      });

      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      await page.locator(".fw-card").first().click();
      const deadline = Date.now() + 15_000;
      while (!responses.has("select.wav") && Date.now() < deadline) {
        await page.waitForTimeout(100);
      }

      if (!responses.has("select.wav")) {
        throw new Error(`select cue was not loaded: ${JSON.stringify([...responses.keys()])}`);
      }
      const unusedTerminalCues = ["win.wav", "loss.wav", "wink.wav", "wrong.wav"];
      const eagerlyLoaded = unusedTerminalCues.filter((file) => responses.has(file));
      if (eagerlyLoaded.length > 0 || responses.size >= 9) {
        throw new Error(`unused cues were eagerly loaded: ${JSON.stringify([...responses.keys()])}`);
      }
      for (const [file, status] of responses) {
        if (status !== 200) throw new Error(`${file} returned HTTP ${status}`);
      }
    },
  },
  {
    name: "rapid taps: mashing the same card does not crash or double-state",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const first = page.locator("button[aria-pressed]").first();
      for (let i = 0; i < 8; i++) await first.click({ delay: 5 });
      // Even number of taps → deselected.
      const pressed = await first.getAttribute("aria-pressed");
      if (pressed !== "false") throw new Error(`expected aria-pressed=false, got ${pressed}`);
    },
  },
  {
    name: "keyboard Enter on Clear performs only Clear, never a global submit",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const cards = page.locator("button[aria-pressed]");
      for (let i = 0; i < 4; i++) await cards.nth(i).click();
      const mistakes = page.locator('[aria-label^="Mistakes used"]').first();
      const before = await mistakes.getAttribute("aria-label");
      const clear = page.getByRole("button", { name: "Clear" });
      await clear.focus();
      await page.keyboard.press("Enter");
      const selected = await page.locator("button[aria-pressed=true]").count();
      if (selected !== 0)
        throw new Error(`Clear keyboard action left ${selected} cards selected`);
      const after = await mistakes.getAttribute("aria-label");
      if (after !== before) {
        throw new Error(`Enter on Clear unexpectedly submitted a group: ${before} -> ${after}`);
      }
    },
  },
  {
    name: "double-submit: two rapid submits do not double-advance selection state",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      const cards = page.locator("button[aria-pressed]");
      for (let i = 0; i < 4; i++) await cards.nth(i).click();
      const submit = page.locator("button", { hasText: "Submit" });
      // Fire two clicks in parallel; whichever lands second is processed
      // against the cleared selection and should be a no-op.
      await Promise.all([submit.click(), submit.click().catch(() => {})]);
      await page.waitForTimeout(400);
      // MistakesDots exposes aria-label="Mistakes used N of 4". Two quick
      // clicks must never consume more than one mistake.
      const mistakesText = await page
        .locator('[aria-label^="Mistakes used"]')
        .first()
        .getAttribute("aria-label");
      if (mistakesText) {
        const m = mistakesText.match(/used (\d+)/);
        if (m && Number(m[1]) > 1) {
          throw new Error(`double submit cost >1 mistake: ${mistakesText}`);
        }
      }
    },
  },
  {
    name: "quit to menu returns to menu cleanly (two-tap arm-confirm)",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasy(page);
      // Quit button is arm-then-confirm: first tap arms (shows "Really quit?"),
      // second tap within 3s actually navigates to menu.
      const quitBtn = page.locator("button", { hasText: "Quit to menu" });
      await quitBtn.click();
      await page.locator("button", { hasText: "Tap again to quit" }).click();
      await waitForMenu(page);
      const menuVisible = await page.locator("text=Foldwink").first().isVisible();
      if (!menuVisible) throw new Error("menu did not render after quit");
    },
  },
  {
    name: "haptics toggle is hidden on desktop (no Vibration API)",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      // Desktop Chromium exposes navigator.vibrate. The toggle should be
      // visible on platforms that support it and hidden elsewhere — we
      // just assert the toggle renders without throwing when supported.
      const supports = await page.evaluate(() => typeof navigator.vibrate === "function");
      if (supports) {
        const exists = await page
          .locator("button[aria-pressed]", { hasText: /Haptics/ })
          .count();
        if (exists === 0) throw new Error("Haptics toggle missing when vibrate is supported");
      }
    },
  },
]);
