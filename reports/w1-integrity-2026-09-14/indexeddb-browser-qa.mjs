import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://127.0.0.1:5187/";
const dbName = `foldwink-w1-browser-qa-${Date.now()}`;
const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const pageA = await context.newPage();
const pageB = await context.newPage();

await Promise.all([pageA.goto(baseUrl), pageB.goto(baseUrl)]);

const initial = await pageA.evaluate(async ({ dbName }) => {
  const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
  const repository = new IndexedDbGameRepository({ dbName });
  await repository.clear();
  const result = await repository.commit({
    kind: "importReplace",
    commandId: "browser-import",
    expectedProfileRevision: 0,
    expectedActiveAttemptId: null,
    replacement: {
      schemaVersion: 2,
      profileRevision: 0,
      activeSession: null,
      terminalAttempts: {},
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        currentStreak: 0,
        bestStreak: 0,
        solvedPuzzleIds: [],
      },
      standardProgress: { cursor: 0 },
      dailyHistory: {},
      onboarded: true,
      archivistProfile: {
        version: 2,
        level: 1,
        xp: 0,
        ink: 25,
        wax: 3,
        prestige: 0,
        discipline: "scribe",
        sealId: "seal_raven",
        nibId: "nib_brass",
        titleId: "title_truths",
        collectedStampIds: [],
        contractsAttempted: 0,
        contractsWon: 0,
        activeContract: null,
        consumedRewardKeys: [],
        rewardReceipts: {},
        migrationReceipts: [],
      },
    },
  });
  repository.close();
  return result;
}, { dbName });

function startIn(page, attemptId) {
  return page.evaluate(
    async ({ dbName, attemptId }) => {
      const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
      const repository = new IndexedDbGameRepository({ dbName });
      const active = {
        attemptId,
        revision: 0,
        context: "practice",
        rules: {
          version: 1,
          maxIncorrectGuesses: 4,
          tabsEnabled: false,
          maxWinks: 0,
          timerPresentation: "optional",
        },
        startedLocalDate: "2026-09-14",
        puzzleId: "puzzle-0001",
        mode: "standard",
        order: ["a", "b", "c", "d"],
        selection: [],
        solvedGroupIds: [],
        mistakesUsed: 0,
        startedAt: 100,
        countsToStats: true,
        incorrectGuessSignatures: [],
        winkedGroupId: null,
      };
      const result = await repository.commit({
        kind: "startAttempt",
        commandId: `start-${attemptId}`,
        expectedProfileRevision: 1,
        expectedActiveAttemptId: null,
        session: { active, puzzleId: active.puzzleId, savedAt: 100 },
      });
      repository.close();
      return result;
    },
    { dbName, attemptId },
  );
}

const [startA, startB] = await Promise.all([
  startIn(pageA, "browser-attempt-a"),
  startIn(pageB, "browser-attempt-b"),
]);

const reloaded = await pageB.evaluate(async ({ dbName }) => {
  const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
  const repository = new IndexedDbGameRepository({ dbName });
  const state = await repository.load();
  repository.close();
  return state;
}, { dbName });

const outcomes = [startA, startB];
const committed = outcomes.filter((result) => result.ok);
const conflicted = outcomes.filter((result) => !result.ok && result.kind === "conflict");
const pass =
  initial.ok === true &&
  initial.state.profileRevision === 1 &&
  committed.length === 1 &&
  conflicted.length === 1 &&
  reloaded?.profileRevision === 2 &&
  reloaded?.activeSession?.active.attemptId === committed[0]?.state.activeSession?.active.attemptId;

const report = {
  generatedAt: new Date().toISOString(),
  dbName,
  pass,
  initial,
  competingStarts: { startA, startB },
  reloaded: {
    profileRevision: reloaded?.profileRevision,
    activeAttemptId: reloaded?.activeSession?.active.attemptId,
  },
};

await writeFile(path.join(here, "indexeddb-browser-evidence.json"), JSON.stringify(report, null, 2));
await context.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));
if (!pass) process.exitCode = 1;
