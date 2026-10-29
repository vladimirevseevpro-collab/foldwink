import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { currentPilotManifestPath } from "../../scripts/lib/web-pilot.mjs";

const CHECKER = resolve("scripts/check-pilot-contract.mjs");
const MANIFEST = await currentPilotManifestPath();

async function runChecker(manifestPath = MANIFEST) {
  return new Promise((resolveRun) => {
    execFile(
      process.execPath,
      [CHECKER],
      {
        encoding: "utf8",
        env: { ...process.env, FOLDWINK_PILOT_MANIFEST: manifestPath },
      },
      (error, stdout, stderr) => {
        resolveRun({
          exitCode: error?.code ?? 0,
          output: `${stdout}\n${stderr}`,
        });
      },
    );
  });
}

const scratch = await mkdtemp(join(tmpdir(), "foldwink-pilot-contract-"));
try {
  const baseline = await runChecker();
  if (baseline.exitCode !== 0 || !baseline.output.includes("pilot identity contract: PASS")) {
    throw new Error(`frozen pilot contract did not pass:\n${baseline.output}`);
  }

  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  manifest.versions.app = "9.9.9";
  const tamperedManifest = join(scratch, "tampered-manifest.json");
  await writeFile(tamperedManifest, `${JSON.stringify(manifest, null, 2)}\n`);

  const tampered = await runChecker(tamperedManifest);
  if (tampered.exitCode !== 1) {
    throw new Error(`tampered pilot contract exited ${tampered.exitCode}, expected 1`);
  }
  if (!tampered.output.includes("live export version differs from manifest")) {
    throw new Error(`tampered manifest failure was not diagnosed:\n${tampered.output}`);
  }

  console.log(
    "PASS w7-pilot-contract-qa: frozen identity passes and version drift fails closed",
  );
} finally {
  const safeRoot = resolve(tmpdir()).toLowerCase();
  const resolvedScratch = resolve(scratch).toLowerCase();
  if (
    resolvedScratch.startsWith(`${safeRoot}\\`) &&
    resolvedScratch.includes("foldwink-pilot-contract-")
  ) {
    await rm(scratch, { recursive: true, force: true });
  } else {
    process.stderr.write(`Refusing to remove unexpected scratch directory: ${scratch}\n`);
    process.exitCode = 1;
  }
}
