/**
 * Run every e2e agent in sequence against a throwaway `vite preview`
 * server. Exits non-zero if any agent fails.
 *
 * Usage:
 *   npm run build
 *   node tests/e2e/run-all.mjs
 *
 * Assumes `dist/` is already built. The runner does not rebuild so the
 * feedback loop stays fast when iterating on tests.
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath, URL } from "node:url";

const PORT = Number(process.env.FOLDWINK_E2E_PORT ?? 4175);
const HOST = "127.0.0.1";
const BASE = `http://localhost:${PORT}/`;
const VITE_CLI = fileURLToPath(new URL("../../node_modules/vite/bin/vite.js", import.meta.url));
const diagnosticBuild = process.argv.includes("--diagnostic-build");

const allAgents = [
  "tests/e2e/progression-validator.mjs",
  "tests/e2e/gameplay-smoke.mjs",
  "tests/e2e/responsive-smoke.mjs",
  "tests/e2e/foldwink-tabs-layout.mjs",
  "tests/e2e/itch-embed-smoke.mjs",
  "tests/e2e/results-next-flow.mjs",
  "tests/e2e/r4-retention-qa.mjs",
  "tests/e2e/r5-monetization-qa.mjs",
  "tests/e2e/pwa-offline-qa.mjs",
  "tests/e2e/localization-qa.mjs",
  "tests/e2e/w4-feedback-motion-qa.mjs",
  "tests/e2e/w5-collection-share-transfer-qa.mjs",
  "tests/e2e/w7-research-qa.mjs",
  "tests/e2e/w7-pilot-export-ops-qa.mjs",
  "tests/e2e/w7-pilot-observation-ops-qa.mjs",
  "tests/e2e/w7-pilot-contract-qa.mjs",
  "tests/e2e/w8-release-acceptance-qa.mjs",
];
const agents = diagnosticBuild
  ? allAgents.filter((agent) => agent !== "tests/e2e/w7-pilot-contract-qa.mjs")
  : allAgents;

if (!existsSync("dist/index.html")) {
  console.error("dist/index.html is missing - run `npm run build` first.");
  process.exit(2);
}

// Spawn Node directly instead of `npx` through a Windows shell. Killing the
// shell wrapper leaves the Vite child alive and lets later runs test stale code.
const preview = spawn(
  process.execPath,
  [VITE_CLI, "preview", "--host", HOST, "--port", String(PORT), "--strictPort"],
  {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  },
);

const previewReady = new Promise((resolve, reject) => {
  let settled = false;
  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    callback(value);
  };
  const timeout = setTimeout(
    () => finish(reject, new Error(`owned preview process did not start at ${BASE} within 10s`)),
    10_000,
  );
  preview.stdout.on("data", (chunk) => {
    // Vite styles the label (`\x1b[1mLocal\x1b[22m:`) and picocolors always
    // colours output on Windows, even when piped, so strip ANSI codes first.
    // eslint-disable-next-line no-control-regex
    const text = String(chunk).replace(/\x1b\[[0-9;]*m/gu, "");
    if (/Local:/iu.test(text)) finish(resolve);
  });
  preview.once("error", (error) => finish(reject, error));
  preview.once("exit", (code) => {
    finish(reject, new Error(`owned preview process exited before readiness with code ${code}`));
  });
});

preview.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

process.on("exit", () => {
  if (preview.exitCode === null) preview.kill();
});
process.on("SIGINT", () => {
  if (preview.exitCode === null) preview.kill();
  process.exit(130);
});

async function stopPreview() {
  if (preview.exitCode !== null) return;
  preview.kill();
  await Promise.race([once(preview, "exit"), sleep(2000)]);
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await sleep(200);
  }
  throw new Error(`preview server at ${BASE} did not come up within 10s`);
}

let failed = false;
try {
  await previewReady;
  await waitForServer();
  console.log(`[run-all] preview server ready at ${BASE}`);
  if (diagnosticBuild) {
    console.log(
      "[run-all] diagnostic build mode: frozen W7 identity contract intentionally skipped",
    );
  }

  for (const agent of agents) {
    console.log(`\n[run-all] > ${agent}`);
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [agent], {
        stdio: "inherit",
        env: { ...process.env, FOLDWINK_E2E_URL: BASE },
        shell: false,
      });
      child.on("exit", (exitCode) => resolve(exitCode ?? 1));
    });
    if (code !== 0) {
      console.error(`[run-all] ${agent} exited with code ${code}`);
      failed = true;
    }
  }
} finally {
  await stopPreview();
}

process.exitCode = failed ? 1 : 0;
