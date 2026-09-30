import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

const puzzleFiles = (await readdir(resolve("puzzles/pool"))).filter((name) =>
  name.endsWith(".json"),
);
const execFileAsync = promisify(execFile);
const packageMetadata = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const englishPuzzles = await Promise.all(
  puzzleFiles.map(async (name) =>
    JSON.parse(await readFile(resolve("puzzles/pool", name), "utf8")),
  ),
);

async function solveGroup(page, items) {
  for (const item of items) await page.locator(`button[aria-label="${item}"]`).first().click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForTimeout(80);
}

async function currentPuzzle(page) {
  const values = await page
    .locator('[role="grid"] button[data-key]')
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("data-key")).filter(Boolean),
    );
  const signature = [...values].sort().join("\u0000");
  const puzzle = englishPuzzles.find(
    (candidate) =>
      [...candidate.groups.flatMap((group) => group.items)].sort().join("\u0000") === signature,
  );
  if (!puzzle)
    throw new Error(`could not resolve active puzzle from ${values.length} rendered cards`);
  return puzzle;
}

async function localCounts(page) {
  return page.evaluate(() => {
    const totals = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (
        key !== "foldwink:analytics:events:v2" &&
        !key?.startsWith("foldwink:analytics:event-bucket:v2:")
      )
        continue;
      const counts = JSON.parse(localStorage.getItem(key) ?? "{}");
      for (const [name, count] of Object.entries(counts))
        totals[name] = (totals[name] ?? 0) + count;
    }
    return totals;
  });
}

await runCases("w7-research-qa", [
  {
    name: "FW-032 canonical onboarding events remain local before consent",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByTestId("onboarding").waitFor({ timeout: 20_000 });
      const started = await localCounts(page);
      if (started.onboarding_started !== 1)
        throw new Error(
          `onboarding_started count was ${started.onboarding_started ?? 0}, expected 1`,
        );
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await page.waitForSelector("header h1", { timeout: 20_000 });
      const skipped = await localCounts(page);
      if (skipped.onboarding_skipped !== 1)
        throw new Error("onboarding_skipped was not recorded");
      const analyticsRequests = await page.evaluate(
        () =>
          globalThis.performance
            .getEntriesByType("resource")
            .filter((entry) => /umami|analytics/iu.test(entry.name)).length,
      );
      if (analyticsRequests !== 0)
        throw new Error("research events caused analytics traffic before consent");
    },
  },
  {
    name: "FW-032 voluntary export contains coarse events and safe board feedback only",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async () => undefined,
        });
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);

      const puzzle = await currentPuzzle(page);
      for (const group of puzzle.groups) await solveGroup(page, group.items);
      await page.getByTestId("result-screen").waitFor({ timeout: 5_000 });
      await page.getByTestId("board-feedback-yes").click();
      await page.getByText("Saved only on this device", { exact: false }).waitFor();

      await page.getByTestId("share-result-button").click();
      await page.getByRole("button", { name: "Result text", exact: true }).click();
      await page.getByTestId("share-sheet-dialog").waitFor({ state: "detached" });
      await page.getByTestId("share-result-button").click();
      await page.getByTestId("share-sheet-close").click();

      await page.getByRole("button", { name: "Back to menu", exact: true }).click();
      await waitForMenu(page);
      await page.getByRole("button", { name: "About · Privacy", exact: true }).click();
      const downloadPromise = page.waitForEvent("download");
      await page.getByTestId("research-export").click();
      const download = await downloadPromise;
      const downloadedPath = await download.path();
      if (!downloadedPath) throw new Error("research export download has no local path");
      const raw = await readFile(downloadedPath, "utf8");
      const exported = JSON.parse(raw);

      if (exported.schema !== "foldwink-research-export-v1")
        throw new Error("wrong export schema");
      if (exported.versions.app !== packageMetadata.version) {
        throw new Error(
          `research export app version ${exported.versions.app} does not match package ${packageMetadata.version}`,
        );
      }
      if (exported.versions.content !== "catalog-2026-09-v1")
        throw new Error("content version missing");
      if (exported.locale !== "en") throw new Error("locale split missing from export");
      if (exported.consent !== "unknown") throw new Error("consent split missing from export");
      if (exported.events.attempt_started !== 1)
        throw new Error("attempt start denominator missing");
      if (exported.events.first_group_solved !== 1)
        throw new Error("first-group event missing");
      if (exported.events.attempt_completed !== 1)
        throw new Error("attempt completion missing");
      if (exported.events.share_started !== 2) throw new Error("share starts missing");
      if (exported.events.share_completed !== 1 || exported.events.share_cancelled !== 1) {
        throw new Error("share completion/cancellation split is wrong");
      }
      if (
        exported.boardFeedback.total !== 1 ||
        exported.boardFeedback.entries[0]?.boardId !== puzzle.id
      ) {
        throw new Error("safe board feedback was not included in explicit export");
      }
      if (/"(?:attemptId|attemptKey|seed|timestamp|words)"\s*:/iu.test(raw)) {
        throw new Error("forbidden identifier/content field leaked into research export");
      }
      if (/\d{4}-\d{2}-\d{2}T\d{2}:/u.test(raw)) {
        throw new Error("precise timestamp leaked into research export");
      }
      const { stdout } = await execFileAsync(process.execPath, [
        resolve("scripts/summarize-pilot-exports.mjs"),
        downloadedPath,
      ]);
      const summary = JSON.parse(stdout);
      if (
        summary.files !== 1 ||
        summary.accepted !== 1 ||
        summary.rejected !== 0 ||
        summary.groups[0]?.locale !== "en"
      ) {
        throw new Error(
          "pilot export validator/aggregator did not preserve the locale denominator",
        );
      }
      if (summary.groups[0]?.d1?.eligible !== 0 || summary.groups[0]?.d7?.eligible !== 0) {
        throw new Error("pilot aggregator counted an incomplete return window");
      }
    },
  },
]);
