import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SUMMARIZER = resolve("scripts/summarize-pilot-observations.mjs");
const TEMPLATE = resolve("docs/research/templates/foldwink-w7-observation.example.json");
const clone = (value) => JSON.parse(JSON.stringify(value));
const localIso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function run(input) {
  return new Promise((resolveRun, rejectRun) => {
    execFile(
      process.execPath,
      [SUMMARIZER, input],
      { encoding: "utf8" },
      (error, stdout, stderr) => {
        if (!stdout.trim()) {
          rejectRun(new Error(`observation summarizer produced no JSON; stderr=${stderr}`));
          return;
        }
        resolveRun({ exitCode: error?.code ?? 0, summary: JSON.parse(stdout) });
      },
    );
  });
}

const template = JSON.parse(await readFile(TEMPLATE, "utf8"));
const scratch = await mkdtemp(join(tmpdir(), "foldwink-pilot-observation-ops-"));
try {
  const input = join(scratch, "input");
  await mkdir(input);
  await writeFile(join(input, "01-p001.json"), JSON.stringify(template));

  const returning = clone(template);
  returning.studyCode = "P002";
  returning.locale = "ru";
  returning.cohort.acquisition = "invited";
  returning.cohort.osFamily = "android";
  returning.cohort.browserFamily = "chrome";
  returning.returns.d0LocalDate = "2026-09-01";
  returning.returns.d1.targetDate = "2026-09-02";
  returning.returns.d7.targetDate = "2026-09-08";
  returning.returns.d1.windowComplete = true;
  returning.returns.d1.qualifiedReturn = true;
  returning.returns.d1.attribution = "invited";
  returning.returns.d1.exportReceived = true;
  await writeFile(join(input, "02-p002.json"), JSON.stringify(returning));

  const duplicateCode = clone(template);
  duplicateCode.locale = "de";
  await writeFile(join(input, "03-duplicate-code.json"), JSON.stringify(duplicateCode));

  const privateNote = clone(template);
  privateNote.studyCode = "P003";
  privateNote.issues = [
    {
      kind: "wording-friction",
      boardId: "puzzle-0001",
      contentVersion: "catalog-2026-09-v1",
      affectedGroup: "sample",
      summary: "Contact tester@example.com for the full note",
      severity: "P2",
      validatorStatus: "pending",
      retestStatus: "pending",
    },
  ];
  await writeFile(join(input, "04-private-note.json"), JSON.stringify(privateNote));

  const nonStarter = clone(template);
  nonStarter.studyCode = "P004";
  nonStarter.flow = {
    recruited: true,
    consented: false,
    appOpened: false,
    firstSessionStarted: false,
    usableObservation: false,
    exportOffered: false,
    exportProvided: false,
  };
  nonStarter.onboarding = {
    started: false,
    outcome: "not-started",
    firstMeaningfulActionIndependent: false,
    coreLoopExplanation: "not-asked",
  };
  nonStarter.firstSession = {
    ...nonStarter.firstSession,
    firstGroupIndependent: null,
    timeToFirstGroupSeconds: null,
    firstAttemptOutcome: "not-started",
    mistakesUsed: null,
    resultReached: false,
  };
  nonStarter.resultActions = {
    retryStartedAfterLoss: false,
    retryOutcome: "not-started",
    differentBoardAvailable: false,
    differentBoardStarted: false,
    previousResult: "none",
  };
  nonStarter.wink = { shown: false, understanding: "not-asked", used: false };
  nonStarter.share = { started: false, outcome: "not-started" };
  nonStarter.export = {
    status: "not-offered",
    fieldsMatch: null,
    privacyInspectionPassed: null,
  };
  nonStarter.returns = {
    d0Qualified: false,
    d0LocalDate: null,
    d1: {
      targetDate: null,
      windowComplete: false,
      qualifiedReturn: null,
      attribution: "unknown",
      exportReceived: false,
    },
    d7: {
      targetDate: null,
      windowComplete: false,
      qualifiedReturn: null,
      attribution: "unknown",
      exportReceived: false,
    },
  };
  await writeFile(join(input, "05-nonstarter.json"), JSON.stringify(nonStarter));

  const premature = clone(template);
  premature.studyCode = "P005";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const plusSix = new Date(today);
  plusSix.setDate(plusSix.getDate() + 6);
  premature.returns.d0LocalDate = localIso(yesterday);
  premature.returns.d1.targetDate = localIso(today);
  premature.returns.d7.targetDate = localIso(plusSix);
  premature.returns.d1.windowComplete = true;
  premature.returns.d1.qualifiedReturn = false;
  premature.returns.d1.attribution = "none";
  await writeFile(join(input, "06-premature-window.json"), JSON.stringify(premature));

  const result = await run(input);
  if (result.exitCode !== 1)
    throw new Error(`mixed observation batch exited ${result.exitCode}, expected 1`);
  if (
    result.summary.files !== 6 ||
    result.summary.accepted !== 3 ||
    result.summary.rejected !== 3
  ) {
    throw new Error(
      `observation isolation counts are wrong: ${JSON.stringify(result.summary)}`,
    );
  }
  if (
    result.summary.metrics.d1.overall.denominator !== 1 ||
    result.summary.metrics.d1.overall.numerator !== 1
  ) {
    throw new Error("D1 did not use only closed windows as its denominator");
  }
  if (
    result.summary.metrics.d1.incompleteWindows !== 1 ||
    result.summary.metrics.d7.incompleteWindows !== 2
  ) {
    throw new Error("missing return windows were not reported explicitly");
  }
  if (
    result.summary.recruitmentTarget.byLocale.en.actual !== 1 ||
    result.summary.recruitmentTarget.byLocale.ru.actual !== 1
  ) {
    throw new Error("locale recruitment counts are wrong");
  }
  if (
    result.summary.flow.recruited !== 3 ||
    result.summary.flow.d0Qualified !== 2 ||
    result.summary.metrics.d1.cohort !== 2
  ) {
    throw new Error("recruited non-starter leaked into the qualified D1/D7 cohort");
  }
  if (
    !result.summary.rejections.some((item) => item.error.includes("duplicate studyCode P001"))
  ) {
    throw new Error("duplicate external study code was not rejected");
  }
  if (!result.summary.rejections.some((item) => item.error.includes("personal data"))) {
    throw new Error("direct personal data in an observation note was not rejected");
  }
  if (
    !result.summary.rejections.some((item) => item.error.includes("entire local calendar day"))
  ) {
    throw new Error("a D1 window was allowed to close before its local day elapsed");
  }

  console.log(
    "PASS w7-pilot-observation-ops-qa: strict roster, privacy and D1/D7 denominators",
  );
} finally {
  const safePrefix = resolve(tmpdir()).toLowerCase();
  const resolvedScratch = resolve(scratch).toLowerCase();
  if (
    resolvedScratch.startsWith(`${safePrefix}\\`) &&
    resolvedScratch.includes("foldwink-pilot-observation-ops-")
  ) {
    await rm(scratch, { recursive: true, force: true });
  } else {
    process.stderr.write(`Refusing to remove unexpected scratch directory: ${scratch}\n`);
    process.exitCode = 1;
  }
}
