import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  waitForMenu,
} from "./lib/harness.mjs";

const EVIDENCE_DIR = resolve("reports/w5-collection-share-transfer-2026-09-14");
await mkdir(EVIDENCE_DIR, { recursive: true });

const PUZZLE_REF = {
  language: "en",
  puzzleId: "puzzle-0004",
  lineageId: "puzzle-0004",
  contentVersion: "catalog-2026-09-v1",
};

function challengeToken(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function fnv1a(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash =
      (hash +
        ((hash << 1) +
          (hash << 4) +
          (hash << 7) +
          (hash << 8) +
          (hash << 24))) >>>
      0;
  }
  return hash >>> 0;
}

function legacySeal(payload) {
  const json = JSON.stringify(payload);
  const checksum = fnv1a(json).toString(16).padStart(8, "0");
  return `FWSEAL1:${checksum}-${Buffer.from(json, "utf8").toString("base64")}`;
}

function challengeUrl(overrides = {}) {
  const payload = {
    v: 2,
    kind: "official-challenge",
    puzzle: PUZZLE_REF,
    rulesVersion: 1,
    creatorResult: {
      result: "win",
      mistakesUsed: 1,
      winkUsed: false,
      durationBucket: "1-3m",
    },
    ...overrides,
  };
  return `${BASE_URL}#c=${challengeToken(payload)}`;
}

async function solvePuzzle0004(page) {
  const puzzle = JSON.parse(
    await readFile(resolve("puzzles/pool/puzzle-0004.json"), "utf8"),
  );
  for (const group of puzzle.groups) {
    for (const item of group.items) {
      await page.locator(`button[aria-label="${item}"]`).first().click();
    }
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.waitForTimeout(80);
  }
  await page.getByTestId("result-screen").waitFor({ timeout: 3_000 });
}

async function openPassportTransfer(page) {
  await page.getByRole("button", { name: /Passport/u }).first().click();
  await page.getByTestId("open-profile-transfer").click();
  await page.getByTestId("profile-transfer-dialog").waitFor();
}

async function openPalimpsest(page) {
  await page.getByTestId("menu-secondary-modes-toggle").click();
  await page.getByTestId("menu-palimpsest-button").click();
  await page.getByTestId("palimpsest-modal").waitFor();
}

async function solvePalimpsestGroup(page, items) {
  const modal = page.getByTestId("palimpsest-modal");
  for (const item of items) {
    await modal.getByRole("button", { name: item, exact: true }).click();
  }
  await modal.getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForTimeout(50);
}

async function readAggregateSlots(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolveOpen, rejectOpen) => {
      const request = globalThis.indexedDB.open("foldwink", 1);
      request.onsuccess = () => resolveOpen(request.result);
      request.onerror = () => rejectOpen(request.error);
    });
    const transaction = database.transaction("game-aggregate", "readonly");
    const store = transaction.objectStore("game-aggregate");
    const get = (key) =>
      new Promise((resolveGet, rejectGet) => {
        const request = store.get(key);
        request.onsuccess = () => resolveGet(request.result ?? null);
        request.onerror = () => rejectGet(request.error);
      });
    const [profile, recovery] = await Promise.all([
      get("profile"),
      get("profile:pre-import-recovery"),
    ]);
    database.close();
    return { profile, recovery };
  });
}

await runCases("w5-collection-share-transfer", [
  {
    name: "unknown challenge version shows a safe error and never starts a random board",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(challengeUrl({ v: 99 }));
      await page.getByTestId("shared-link-error").waitFor();
      if ((await page.locator('[data-fw-screen="game"]').count()) !== 0) {
        throw new Error("invalid challenge started a game");
      }
      await page.screenshot({ path: resolve(EVIDENCE_DIR, "challenge-error-mobile.png") });
    },
  },
  {
    name: "versioned official challenge resolves the exact catalogue ref and labels sent data unverified",
    viewport: { width: 1024, height: 768 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(challengeUrl());
      await page.locator('[data-fw-screen="game"]').waitFor({ timeout: 20_000 });
      if (page.url().includes("#c=")) throw new Error("successful challenge URL was not cleaned");
      await solvePuzzle0004(page);
      const banner = page.getByTestId("duel-verdict-banner");
      await banner.waitFor();
      if (!(await banner.textContent()).includes("not server-verified")) {
        throw new Error("creator result was presented as verified or without disclosure");
      }
    },
  },
  {
    name: "one share sheet respects AbortError and exposes manual fallback on real failure",
    viewport: { width: 1440, height: 900 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(challengeUrl());
      await page.locator('[data-fw-screen="game"]').waitFor({ timeout: 20_000 });
      await solvePuzzle0004(page);
      if ((await page.getByTestId("share-result-button").count()) !== 1) {
        throw new Error("Result does not expose exactly one share trigger");
      }

      await page.evaluate(() => {
        window.__fwClipboardWrites = 0;
        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async () => {
            throw new globalThis.DOMException("cancelled", "AbortError");
          },
        });
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              window.__fwClipboardWrites += 1;
            },
          },
        });
      });
      await page.getByTestId("share-result-button").click();
      await page.getByTestId("share-sheet-action-text").click();
      await page.getByTestId("share-sheet-dialog").waitFor({ state: "detached" });
      if ((await page.evaluate(() => window.__fwClipboardWrites)) !== 0) {
        throw new Error("native share cancellation cascaded into clipboard");
      }

      await page.evaluate(() => {
        Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async () => Promise.reject(new Error("denied")) },
        });
      });
      await page.getByTestId("share-result-button").click();
      await page.getByTestId("share-sheet-action-text").click();
      await page.getByTestId("share-sheet-manual-text").waitFor();
      await page.screenshot({ path: resolve(EVIDENCE_DIR, "share-sheet-desktop.png") });
    },
  },
  {
    name: "full JSON import previews, commits atomically, and preserves a pre-import recovery slot",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await openPassportTransfer(page);

      const downloadPromise = page.waitForEvent("download");
      await page.getByTestId("profile-transfer-export").click();
      const download = await downloadPromise;
      const path = await download.path();
      const backup = JSON.parse(await readFile(path, "utf8"));
      if (backup.kind !== "foldwink-profile-backup" || backup.version !== 1) {
        throw new Error("exported backup envelope is not versioned");
      }
      if (backup.aggregate.archivistProfile.playerSeed !== undefined) {
        throw new Error("portable backup leaked playerSeed");
      }
      backup.aggregate.stats.solvedPuzzleIds = [
        ...backup.aggregate.stats.solvedPuzzleIds,
        "synthetic-imported-marker",
      ];

      await page.getByTestId("profile-transfer-import-text").fill(JSON.stringify(backup));
      await page.getByTestId("profile-transfer-preview-action").click();
      await page.getByTestId("profile-transfer-preview").waitFor();
      await page.screenshot({ path: resolve(EVIDENCE_DIR, "profile-import-mobile.png") });
      await Promise.all([
        page.waitForEvent("load"),
        page.getByTestId("profile-transfer-commit").click(),
      ]);
      await waitForMenu(page);

      const slots = await readAggregateSlots(page);
      if (!slots.profile?.stats?.solvedPuzzleIds?.includes("synthetic-imported-marker")) {
        throw new Error("imported marker was not committed");
      }
      if (!slots.recovery || slots.recovery.stats.solvedPuzzleIds.includes("synthetic-imported-marker")) {
        throw new Error("pre-import recovery was not committed atomically");
      }
      await openPassportTransfer(page);
      await page.getByTestId("profile-transfer-restore").waitFor();
    },
  },
  {
    name: "legacy wax seal imports passport details but cannot overwrite XP or currencies",
    viewport: { width: 1024, height: 768 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const before = (await readAggregateSlots(page)).profile;
      await page.getByRole("button", { name: /Passport/u }).first().click();
      await page.getByTestId("legacy-passport-open-import").click();
      const longSeed = "s".repeat(128);
      const seal = legacySeal([
        1,
        999_999,
        999_999_999,
        888_888_888,
        777_777_777,
        666_666_666,
        "scribe",
        "seal_compass",
        "nib_obsidian",
        "title_connections",
        5,
        longSeed,
        555_555_555,
        444_444_444,
      ]);
      await page.getByTestId("legacy-passport-input").fill(seal);
      await page.getByTestId("legacy-passport-review").click();
      const preview = page.getByTestId("passport-diff-preview");
      await preview.waitFor();
      if (!(await preview.textContent()).includes("stay unchanged")) {
        throw new Error("legacy preview does not disclose ignored economy fields");
      }
      await page.getByTestId("legacy-passport-apply").click();
      await preview.waitFor({ state: "detached", timeout: 5_000 });
      await page.reload();
      await waitForMenu(page);
      const after = (await readAggregateSlots(page)).profile;
      for (const field of ["level", "xp", "ink", "wax", "prestige", "contractsAttempted", "contractsWon"]) {
        if (after.archivistProfile[field] !== before.archivistProfile[field]) {
          throw new Error(`legacy seal overwrote ${field}`);
        }
      }
      if (
        JSON.stringify(after.archivistProfile.rewardReceipts ?? {}) !==
          JSON.stringify(before.archivistProfile.rewardReceipts ?? {}) ||
        JSON.stringify(after.archivistProfile.consumedRewardKeys ?? []) !==
          JSON.stringify(before.archivistProfile.consumedRewardKeys ?? [])
      ) {
        throw new Error("legacy seal overwrote the reward ledger");
      }
      if (
        after.archivistProfile.sealId !== "seal_compass" ||
        after.archivistProfile.nibId !== "nib_obsidian" ||
        after.archivistProfile.titleId !== "title_connections" ||
        after.archivistProfile.playerSeed !== longSeed ||
        !after.archivistProfile.collectedStampIds.includes("stamp_midori_compass")
      ) {
        throw new Error("safe legacy passport details did not survive reload");
      }

      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.getByRole("button", { name: /Passport/u }).first().click();
      await page.getByTestId("legacy-passport-open-export").click();
      await page.getByTestId("legacy-passport-certificate").waitFor();
      await page.getByTestId("legacy-passport-qr-fallback").waitFor();
      if (pageErrors.length > 0) {
        throw new Error(`oversized legacy certificate crashed: ${pageErrors.join(" | ")}`);
      }
    },
  },
  {
    name: "Palimpsest resumes its exact layer after reload and awards one cosmetic stamp",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const before = (await readAggregateSlots(page)).profile;
      await openPalimpsest(page);
      await solvePalimpsestGroup(page, ["BANJO", "SAX", "CELLO", "MANDOLIN"]);
      await page.getByTestId("palimpsest-modal").getByRole("button", { name: "BLADE", exact: true }).click();
      await page.waitForTimeout(250);
      const midAttempt = (await readAggregateSlots(page)).profile.palimpsestSession;
      if (
        midAttempt?.stage !== "obverse" ||
        !midAttempt.solvedGroupIds.includes("en_obs_1") ||
        !midAttempt.selection.includes("BLADE")
      ) {
        throw new Error("Palimpsest snapshot was not committed before reload");
      }

      await page.reload();
      await waitForMenu(page);
      await openPalimpsest(page);
      const modal = page.getByTestId("palimpsest-modal");
      if (!(await modal.getByRole("button", { name: "BANJO", exact: true }).isDisabled())) {
        throw new Error("solved Palimpsest group did not restore");
      }
      if (
        (await modal.getByRole("button", { name: "BLADE", exact: true }).getAttribute("aria-pressed")) !==
        "true"
      ) {
        throw new Error("Palimpsest selection did not restore");
      }
      await modal.getByRole("button", { name: "Clear", exact: true }).click();
      await solvePalimpsestGroup(page, ["BLADE", "SWORD", "CANNON", "MACE"]);
      await solvePalimpsestGroup(page, ["BUZZARD", "SWAN", "CRANE", "MAGPIE"]);
      await solvePalimpsestGroup(page, ["BOOT", "SANDAL", "CLOG", "MOCCASIN"]);
      await page.getByTestId("palimpsest-flip-button").click();
      await page.waitForTimeout(800);
      await solvePalimpsestGroup(page, ["BANJO", "BLADE", "BUZZARD", "BOOT"]);
      await solvePalimpsestGroup(page, ["SAX", "SWORD", "SWAN", "SANDAL"]);
      await solvePalimpsestGroup(page, ["CELLO", "CANNON", "CRANE", "CLOG"]);
      await solvePalimpsestGroup(page, ["MANDOLIN", "MACE", "MAGPIE", "MOCCASIN"]);
      await page.getByTestId("palimpsest-completed-view").waitFor();
      await page.waitForTimeout(250);
      const after = (await readAggregateSlots(page)).profile;
      if (after.palimpsestSession !== null) {
        throw new Error("completed Palimpsest session was not cleared");
      }
      if (
        after.archivistProfile.collectedStampIds.filter((id) => id === "stamp_palimpsest").length !==
        1
      ) {
        throw new Error("Palimpsest collectible was not awarded exactly once");
      }
      for (const field of ["xp", "ink", "wax", "prestige"]) {
        if (after.archivistProfile[field] !== before.archivistProfile[field]) {
          throw new Error(`Palimpsest changed ${field}`);
        }
      }
    },
  },
]);
