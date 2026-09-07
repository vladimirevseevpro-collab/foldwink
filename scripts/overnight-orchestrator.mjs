#!/usr/bin/env node
// Overnight orchestrator for the full Foldwink puzzle audit + ranking
// pipeline. Designed to run unattended: each step is idempotent, and the
// codex-dependent phases auto-retry on quota exhaustion.
//
// Sequence:
//   1. Phase B retry (any missing GPT audit batches)
//   2. Phase C (local verification)
//   3. Phase D (merge report + APPLY_QUEUE.json)
//   4. Phase E (GPT perceived-difficulty ratings)
//   5. Phase E blend (write meta.editorialRank)
//   6. Loader patch (standard-mode uses editorialRank > difficultyScore)
//   7. Gates: typecheck, vitest, validate, build
//   8. Version bump, commit, push
//   9. pack:itch + release:butler
//
// All output goes to logs/overnight/<UTC-ISO>.log plus mirrored to stdout.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  appendFileSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LOG_DIR = join(ROOT, "logs/overnight");
mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
const STATE_FILE = join(LOG_DIR, "state.json");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_FILE, line + "\n");
  } catch {}
}

function saveState(state) {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

function run(name, cmd, args, opts = {}) {
  log(`STEP ${name}: ${cmd} ${args.join(" ")}`);
  const t0 = Date.now();
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true,
    maxBuffer: 128 * 1024 * 1024,
    ...opts,
  });
  const elapsed = Math.round((Date.now() - t0) / 1000);
  if (res.stdout) {
    try {
      appendFileSync(LOG_FILE, `--- ${name} stdout ---\n${res.stdout}\n`);
    } catch {}
  }
  if (res.stderr) {
    try {
      appendFileSync(LOG_FILE, `--- ${name} stderr ---\n${res.stderr}\n`);
    } catch {}
  }
  log(`STEP ${name}: exit=${res.status} in ${elapsed}s`);
  return res;
}

function phaseBMissingBatches() {
  const need = [];
  const POOL_DIRS = {
    en: "puzzles/pool",
    de: "puzzles/de/pool",
    ru: "puzzles/ru/pool",
  };
  const TIERS = ["easy", "medium", "hard"];
  const MAX_PER_BATCH = 60;
  for (const [lang, dir] of Object.entries(POOL_DIRS)) {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    const puzzles = [];
    for (const f of files) {
      try {
        const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
        if (p.groups && p.groups.length === 4) puzzles.push(p);
      } catch {}
    }
    for (const tier of TIERS) {
      const t = puzzles.filter((p) => p.difficulty === tier);
      if (t.length === 0) continue;
      const batchCount = Math.ceil(t.length / MAX_PER_BATCH);
      for (let i = 0; i < batchCount; i++) {
        const outFile = `reports/puzzle_audit/phase_b_raw/${lang}-${tier}-b${String(i + 1).padStart(2, "0")}.json`;
        if (!existsSync(outFile)) need.push({ lang, tier, batch: i + 1, file: outFile });
      }
    }
  }
  return need;
}

const state = {
  startedAt: new Date().toISOString(),
  steps: [],
};

(async () => {
  log("=== Overnight orchestrator START ===");

  // --- Step 1: Phase B retry ---
  {
    const missing = phaseBMissingBatches();
    log(`Phase B missing batches: ${missing.length}`);
    if (missing.length > 0) {
      const res = run("phase-b", "node", ["scripts/phase-b-gpt-audit.mjs"]);
      const stillMissing = phaseBMissingBatches();
      state.steps.push({
        step: "phase-b",
        exit: res.status,
        missingBefore: missing.length,
        missingAfter: stillMissing.length,
      });
      if (stillMissing.length > 0) {
        log(
          `Phase B still has ${stillMissing.length} missing batches after retry; continuing with partial data.`,
        );
      }
    } else {
      log("Phase B already complete.");
      state.steps.push({ step: "phase-b", skipped: true });
    }
    saveState(state);
  }

  // --- Step 2: Phase C ---
  {
    const res = run("phase-c", "node", ["scripts/phase-c-claude-verify.mjs"]);
    state.steps.push({ step: "phase-c", exit: res.status });
    if (res.status !== 0) {
      log("Phase C failed; aborting orchestration.");
      saveState({ ...state, finishedAt: new Date().toISOString(), aborted: "phase-c" });
      process.exit(1);
    }
    saveState(state);
  }

  // --- Step 3: Phase D merge ---
  {
    const res = run("phase-d", "node", ["scripts/phase-d-merge.mjs"]);
    state.steps.push({ step: "phase-d", exit: res.status });
    if (res.status !== 0) {
      log("Phase D failed; aborting orchestration.");
      saveState({ ...state, finishedAt: new Date().toISOString(), aborted: "phase-d" });
      process.exit(1);
    }
    saveState(state);
  }

  // --- Step 4: Phase E ranking ---
  {
    const res = run("phase-e-ranking", "node", ["scripts/phase-e-gpt-ranking.mjs"]);
    state.steps.push({ step: "phase-e-ranking", exit: res.status });
    saveState(state);
    // Non-fatal: even partial ratings are useful (fallback to S1).
  }

  // --- Step 5: Phase E blend ---
  {
    const res = run("phase-e-blend", "node", ["scripts/phase-e-blend.mjs"]);
    state.steps.push({ step: "phase-e-blend", exit: res.status });
    if (res.status !== 0) {
      log(
        "Phase E blend failed; continuing — loader will still work off existing difficultyScore.",
      );
    }
    saveState(state);
  }

  // --- Step 6: patch loaders to prefer editorialRank ---
  {
    const res = run("loader-patch", "node", ["scripts/patch-loaders-for-editorial.mjs"]);
    state.steps.push({ step: "loader-patch", exit: res.status });
    saveState(state);
  }

  // --- Step 7: gates ---
  {
    const typecheck = run("typecheck", "npm", ["run", "typecheck"]);
    const tests = run("tests", "npm", ["run", "test"]);
    const validate = run("validate", "npm", ["run", "validate"]);
    const build = run("build", "npm", ["run", "build"]);
    state.steps.push({
      step: "gates",
      typecheck: typecheck.status,
      tests: tests.status,
      validate: validate.status,
      build: build.status,
    });
    saveState(state);
    if (typecheck.status !== 0 || tests.status !== 0 || build.status !== 0) {
      log("Gates failed; halting before any commit/push/release.");
      saveState({ ...state, finishedAt: new Date().toISOString(), aborted: "gates" });
      process.exit(1);
    }
  }

  // --- Step 8: version bump + commit + push ---
  {
    const bumpRes = run("version-bump", "node", ["scripts/bump-version-patch.mjs"]);
    if (bumpRes.status !== 0) {
      log("Version bump failed; halting.");
      saveState({ ...state, finishedAt: new Date().toISOString(), aborted: "version-bump" });
      process.exit(1);
    }
    run("git-status", "git", ["status", "--short"]);
    run("git-add-staged", "git", [
      "add",
      "package.json",
      "package-lock.json",
      "puzzles/pool/",
      "puzzles/de/pool/",
      "puzzles/ru/pool/",
      "src/",
      "scripts/",
      "reports/puzzle_audit/",
    ]);
    run("git-commit", "node", ["scripts/overnight-commit.mjs"]);
    const pushRes = run("git-push", "git", ["push", "origin", "main"]);
    state.steps.push({ step: "git-push", exit: pushRes.status });
    saveState(state);
    if (pushRes.status !== 0) {
      log("Git push failed; halting before itch release.");
      saveState({ ...state, finishedAt: new Date().toISOString(), aborted: "git-push" });
      process.exit(1);
    }
  }

  // --- Step 9: itch release ---
  {
    const releaseRes = run("release-butler", "npm", ["run", "release:butler"]);
    state.steps.push({ step: "release-butler", exit: releaseRes.status });
    saveState(state);
    if (releaseRes.status !== 0) {
      log("Itch release failed; check butler output in log file.");
    }
  }

  state.finishedAt = new Date().toISOString();
  saveState(state);
  log("=== Overnight orchestrator DONE ===");
})();
