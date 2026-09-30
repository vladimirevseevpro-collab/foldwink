import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SUMMARIZER = resolve("scripts/summarize-pilot-exports.mjs");
const packageMetadata = JSON.parse(await readFile(resolve("package.json"), "utf8"));

function makeReturn(overrides = {}) {
  return {
    eligible: false,
    observed: false,
    organic: false,
    invited: false,
    ...overrides,
  };
}

function makeExport(overrides = {}) {
  const eventNames = [
    "onboarding_started",
    "onboarding_step_completed",
    "onboarding_skipped",
    "onboarding_complete",
    "attempt_started",
    "first_group_solved",
    "attempt_completed",
    "attempt_abandoned",
    "next_puzzle_started",
    "wink_used",
    "reward_presented",
    "share_started",
    "share_completed",
    "share_cancelled",
    "board_feedback_recorded",
    "return_observed",
  ];
  const base = {
    schema: "foldwink-research-export-v1",
    app: "foldwink",
    exported: "local-day-only",
    locale: "en",
    consent: "unknown",
    versions: {
      schema: 1,
      eventSchema: "ops-06-v1",
      app: packageMetadata.version,
      content: "catalog-2026-09-v1",
      policy: "policy-v1",
      balance: "balance-v1",
    },
    acquisition: { organicDays: 1, invitedDays: 0 },
    qualified: {
      d0Recorded: true,
      totalDays: 1,
      completedDays: 1,
      d1: makeReturn(),
      d7: makeReturn(),
    },
    events: Object.fromEntries(eventNames.map((name) => [name, 0])),
    boardFeedback: { yes: 0, no: 0, total: 0, entries: [] },
    unavailable: ["wink_understanding", "interview_notes", "facilitator_interventions"],
  };
  return {
    ...base,
    ...overrides,
    versions: { ...base.versions, ...overrides.versions },
    acquisition: { ...base.acquisition, ...overrides.acquisition },
    qualified: { ...base.qualified, ...overrides.qualified },
    events: { ...base.events, ...overrides.events },
    boardFeedback: { ...base.boardFeedback, ...overrides.boardFeedback },
  };
}

async function runSummarizer(input) {
  return new Promise((resolveRun, rejectRun) => {
    execFile(
      process.execPath,
      [SUMMARIZER, input],
      { encoding: "utf8" },
      (error, stdout, stderr) => {
        if (!stdout.trim()) {
          rejectRun(new Error(`summarizer produced no JSON; stderr=${stderr}`));
          return;
        }
        resolveRun({ exitCode: error?.code ?? 0, summary: JSON.parse(stdout) });
      },
    );
  });
}

const scratch = await mkdtemp(join(tmpdir(), "foldwink-pilot-export-ops-"));
try {
  const mixed = join(scratch, "mixed");
  await mkdir(mixed);
  await writeFile(join(mixed, "01-valid.json"), JSON.stringify(makeExport()));
  await writeFile(join(mixed, "02-malformed.json"), "{not-json");
  await writeFile(
    join(mixed, "03-private.json"),
    JSON.stringify(makeExport({ versions: { app: "tester@example.com" } })),
  );
  await writeFile(
    join(mixed, "04-invalid-denominator.json"),
    JSON.stringify(makeExport({ acquisition: { organicDays: 0, invitedDays: 0 } })),
  );

  const mixedRun = await runSummarizer(mixed);
  if (mixedRun.exitCode !== 1)
    throw new Error(`mixed batch exited ${mixedRun.exitCode}, expected 1`);
  if (
    mixedRun.summary.files !== 4 ||
    mixedRun.summary.accepted !== 1 ||
    mixedRun.summary.rejected !== 3
  ) {
    throw new Error(`mixed batch counts are wrong: ${JSON.stringify(mixedRun.summary)}`);
  }
  if (mixedRun.summary.groups[0]?.exports !== 1) {
    throw new Error("valid participant export was lost when neighbouring files were rejected");
  }
  if (!mixedRun.summary.rejections.some((item) => item.source === "03-private.json")) {
    throw new Error("privacy rejection was not reported with its source file");
  }

  const duplicates = join(scratch, "duplicates");
  await mkdir(duplicates);
  const duplicatePayload = JSON.stringify(makeExport({ locale: "de" }));
  await writeFile(join(duplicates, "01-first.json"), duplicatePayload);
  await writeFile(join(duplicates, "02-copy.json"), duplicatePayload);

  const duplicateRun = await runSummarizer(duplicates);
  if (duplicateRun.exitCode !== 1)
    throw new Error(`duplicate batch exited ${duplicateRun.exitCode}, expected 1`);
  if (
    duplicateRun.summary.accepted !== 1 ||
    duplicateRun.summary.quarantinedDuplicates !== 1 ||
    duplicateRun.summary.groups[0]?.exports !== 1
  ) {
    throw new Error(
      `duplicate quarantine counts are wrong: ${JSON.stringify(duplicateRun.summary)}`,
    );
  }
  if (duplicateRun.summary.duplicates[0]?.matches !== "01-first.json") {
    throw new Error("duplicate report does not identify the canonical first payload");
  }

  console.log(
    "PASS w7-pilot-export-ops-qa: isolation, privacy rejection and duplicate quarantine",
  );
} finally {
  const safePrefix = resolve(tmpdir()).toLowerCase();
  const resolvedScratch = resolve(scratch).toLowerCase();
  if (
    resolvedScratch.startsWith(`${safePrefix}\\`) &&
    resolvedScratch.includes("foldwink-pilot-export-ops-")
  ) {
    await rm(scratch, { recursive: true, force: true });
  } else {
    process.stderr.write(`Refusing to remove unexpected scratch directory: ${scratch}\n`);
    process.exitCode = 1;
  }
}
