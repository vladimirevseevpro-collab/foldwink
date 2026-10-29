import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

const CHECKER = resolve("scripts/check-release-acceptance.mjs");
const TEMPLATE = resolve("docs/release-evidence/W8_RELEASE_ACCEPTANCE.template.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function run(args) {
  return new Promise((resolveRun) => {
    execFile(process.execPath, [CHECKER, ...args], { encoding: "utf8" }, (error, stdout, stderr) => {
      resolveRun({ exitCode: error?.code ?? 0, output: `${stdout}\n${stderr}` });
    });
  });
}

const schema = await run([TEMPLATE, "--schema-only"]);
if (schema.exitCode !== 0 || !schema.output.includes("47 required gates represented")) {
  throw new Error(`canonical W8 schema did not pass:\n${schema.output}`);
}

const noGo = await run([TEMPLATE]);
if (noGo.exitCode !== 1 || !noGo.output.includes("W8 release acceptance: NO-GO")) {
  throw new Error(`incomplete W8 record did not fail closed:\n${noGo.output}`);
}
if (!noGo.output.includes("HUM-02 is pending") || !noGo.output.includes("HUM-07 is pending")) {
  throw new Error(`human/mobile blockers were not named:\n${noGo.output}`);
}

const releaseEvidenceRoot = resolve("docs/release-evidence");
const scratch = await mkdtemp(join(releaseEvidenceRoot, "qa-w8-acceptance-"));
try {
  const record = JSON.parse(await readFile(TEMPLATE, "utf8"));
  delete record.gates["OPS-06"];
  const incomplete = join(scratch, "missing-gate.json");
  await writeFile(incomplete, `${JSON.stringify(record, null, 2)}\n`);
  const missing = await run([incomplete, "--schema-only"]);
  if (missing.exitCode !== 1 || !missing.output.includes("missing gate OPS-06")) {
    throw new Error(`missing rollback gate was not rejected:\n${missing.output}`);
  }

  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
  const packageAtCommit = JSON.parse(
    execFileSync("git", ["show", `${commit}:package.json`], { encoding: "utf8" }),
  );
  const lockAtCommit = execFileSync("git", ["show", `${commit}:package-lock.json`]);
  const lockHash = sha256(lockAtCommit);
  const artifactPath = join(scratch, "synthetic-artifact.zip");
  const distPayload = "synthetic index\n";
  const artifactFixture = join(scratch, "artifact-fixture");
  await mkdir(artifactFixture);
  await writeFile(join(artifactFixture, "index.html"), distPayload);
  execFileSync(
    "tar",
    ["-a", "-cf", artifactPath, "-C", artifactFixture, "index.html"],
    { stdio: "pipe" },
  );
  const artifactBytes = await readFile(artifactPath);
  const artifactHash = sha256(artifactBytes);
  const artifactStat = await stat(artifactPath);
  const distEntryHash = sha256(distPayload);
  const treeHash = sha256(`${distEntryHash}  index.html\n`);
  const manifestPath = join(scratch, "synthetic-manifest.json");
  const syntheticManifest = {
    schema: "foldwink-pilot-artifact-manifest-v1",
    versions: { app: packageAtCommit.version },
    artifact: {
      path: relative(resolve(), artifactPath).split(sep).join("/"),
      bytes: artifactStat.size,
      sha256: artifactHash,
    },
    dist: {
      files: 1,
      bytes: Buffer.byteLength(distPayload),
      treeSha256: treeHash,
      entries: [
        {
          path: "index.html",
          bytes: Buffer.byteLength(distPayload),
          sha256: distEntryHash,
        },
      ],
    },
    source: {
      clean: true,
      statusSha256: sha256(""),
      baseCommit: commit,
      branch,
      packageLockSha256: lockHash,
      packageLockAtCommitSha256: lockHash,
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(syntheticManifest, null, 2)}\n`);

  const accepted = JSON.parse(await readFile(TEMPLATE, "utf8"));
  accepted.releaseId = basename(scratch);
  const relativeManifest = relative(resolve(), manifestPath).split(sep).join("/");
  accepted.candidate = {
    appVersion: packageAtCommit.version,
    commit,
    branch,
    lockSha256: lockHash,
    lockAtCommitSha256: lockHash,
    artifactManifest: relativeManifest,
    artifactSha256: artifactHash,
    distTreeSha256: treeHash,
    stagingUrl: "https://example.invalid/foldwink",
    deployedAt: "2026-09-16T12:00:00Z",
  };
  accepted.decision = "GO";
  const fixtureOwner = "automated-fixture";
  const fixtureVerifiedAt = "2026-09-16T12:00:00Z";
  const acceptedPath = join(scratch, "accepted-record.json");
  const evidenceByGate = new Map();
  for (const id of Object.keys(accepted.gates)) {
    const gateEvidenceDirectory = join(scratch, id);
    await mkdir(gateEvidenceDirectory);
    let attachment;
    if (id === "BLD-01") {
      const rebuildLogPath = join(gateEvidenceDirectory, "exact-commit-rebuild.log");
      const rebuildLogPayload = "synthetic exact-commit rebuild log\n";
      await writeFile(rebuildLogPath, rebuildLogPayload);
      const rebuildReceiptPath = join(gateEvidenceDirectory, "exact-commit-rebuild.json");
      const rebuildReceiptPayload = `${JSON.stringify(
        {
          schema: "foldwink-exact-commit-rebuild-v1",
          outcome: "pass",
          releaseId: accepted.releaseId,
          candidate: {
            commit,
            branch,
            record: relative(resolve(), acceptedPath).split(sep).join("/"),
            artifactManifest: relativeManifest,
          },
          startedAt: "2026-09-16T11:55:00Z",
          finishedAt: fixtureVerifiedAt,
          commands: [
            "npm ci --no-audit --no-fund",
            "npm run build",
            "node scripts/pack-itch.mjs",
          ],
          expected: {
            appVersion: packageAtCommit.version,
            lockSha256: lockHash,
            distTreeSha256: treeHash,
            artifactSha256: artifactHash,
          },
          rebuilt: {
            appVersion: packageAtCommit.version,
            lockSha256: lockHash,
            dist: {
              files: 1,
              bytes: Buffer.byteLength(distPayload),
              treeSha256: treeHash,
            },
            artifact: {
              bytes: artifactStat.size,
              sha256: artifactHash,
            },
            environment: {
              platform: process.platform,
              arch: process.arch,
              node: process.version,
              // A conforming rebuild runs the exact pinned npm (engines.npm / packageManager).
              npm: packageAtCommit.engines?.npm ?? "fixture",
              declaredNode: packageAtCommit.engines?.node ?? null,
              declaredNpm: packageAtCommit.engines?.npm ?? null,
              packageManager: packageAtCommit.packageManager ?? null,
            },
          },
          source: {
            preBuildClean: true,
            preBuildStatusSha256: sha256(""),
            postBuildClean: true,
            postBuildStatusSha256: sha256(""),
          },
          exactMatch: true,
          temporaryWorktreeRemoved: true,
          log: {
            path: relative(resolve(), rebuildLogPath).split(sep).join("/"),
            sha256: sha256(rebuildLogPayload),
          },
          error: null,
        },
        null,
        2,
      )}\n`;
      await writeFile(rebuildReceiptPath, rebuildReceiptPayload);
      attachment = {
        path: relative(resolve(), rebuildReceiptPath).split(sep).join("/"),
        sha256: sha256(rebuildReceiptPayload),
      };
      accepted.candidate.exactCommitRebuild = attachment;
    } else {
      const attachmentPath = join(gateEvidenceDirectory, "automated-check.txt");
      const attachmentPayload = `synthetic automated release evidence for ${id}\n`;
      await writeFile(attachmentPath, attachmentPayload);
      attachment = {
        path: relative(resolve(), attachmentPath).split(sep).join("/"),
        sha256: sha256(attachmentPayload),
      };
    }
    const evidencePath = join(gateEvidenceDirectory, "attestation.json");
    const evidencePayload = `${JSON.stringify(
      {
        schema: "foldwink-release-evidence-v1",
        releaseId: accepted.releaseId,
        gateId: id,
        outcome: "pass",
        owner: fixtureOwner,
        verifiedAt: fixtureVerifiedAt,
        summary: `Automated acceptance fixture for ${id}`,
        attachments: [attachment],
      },
      null,
      2,
    )}\n`;
    await writeFile(evidencePath, evidencePayload);
    evidenceByGate.set(id, {
      path: relative(resolve(), evidencePath).split(sep).join("/"),
      sha256: sha256(evidencePayload),
    });
  }
  for (const [id, gate] of Object.entries(accepted.gates)) {
    if (id === "DEC-04") continue;
    gate.status = "pass";
    gate.evidence = [evidenceByGate.get(id)];
    gate.owner = fixtureOwner;
    gate.verifiedAt = fixtureVerifiedAt;
  }
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const go = await run([acceptedPath]);
  if (go.exitCode !== 0 || !go.output.includes("release-candidate acceptance: GO")) {
    throw new Error(`complete candidate record did not pass:\n${go.output}`);
  }

  const rebuildReceiptPath = resolve(accepted.candidate.exactCommitRebuild.path);
  const originalRebuildReceiptPayload = await readFile(rebuildReceiptPath, "utf8");
  const originalRebuildReceiptHash = sha256(originalRebuildReceiptPayload);
  const originalRebuildLogPayload = await readFile(
    resolve(JSON.parse(originalRebuildReceiptPayload).log.path),
    "utf8",
  );

  const captureOnlyReceipt = JSON.parse(originalRebuildReceiptPayload);
  captureOnlyReceipt.outcome = "capture-only";
  captureOnlyReceipt.exactMatch = null;
  const captureOnlyReceiptPayload = `${JSON.stringify(captureOnlyReceipt, null, 2)}\n`;
  await writeFile(rebuildReceiptPath, captureOnlyReceiptPayload);
  accepted.candidate.exactCommitRebuild.sha256 = sha256(captureOnlyReceiptPayload);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const captureOnly = await run([acceptedPath]);
  if (
    captureOnly.exitCode !== 1 ||
    !captureOnly.output.includes("exact-commit rebuild did not pass")
  ) {
    throw new Error(`capture-only rebuild receipt did not fail closed:\n${captureOnly.output}`);
  }
  await writeFile(rebuildReceiptPath, originalRebuildReceiptPayload);
  accepted.candidate.exactCommitRebuild.sha256 = originalRebuildReceiptHash;
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const rebuildLogPath = resolve(JSON.parse(originalRebuildReceiptPayload).log.path);
  await writeFile(rebuildLogPath, `${originalRebuildLogPayload}tampered\n`);
  const tamperedRebuildLog = await run([acceptedPath]);
  if (
    tamperedRebuildLog.exitCode !== 1 ||
    !tamperedRebuildLog.output.includes("exact-commit rebuild log SHA-256 mismatch")
  ) {
    throw new Error(`tampered exact-rebuild log did not fail closed:\n${tamperedRebuildLog.output}`);
  }
  await writeFile(rebuildLogPath, originalRebuildLogPayload);

  const invalidRebuildReceipt = JSON.parse(originalRebuildReceiptPayload);
  invalidRebuildReceipt.exactMatch = false;
  const invalidRebuildReceiptPayload = `${JSON.stringify(invalidRebuildReceipt, null, 2)}\n`;
  await writeFile(rebuildReceiptPath, invalidRebuildReceiptPayload);
  accepted.candidate.exactCommitRebuild.sha256 = sha256(invalidRebuildReceiptPayload);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const invalidRebuild = await run([acceptedPath]);
  if (
    invalidRebuild.exitCode !== 1 ||
    !invalidRebuild.output.includes("exact-commit rebuild exactMatch is not true")
  ) {
    throw new Error(`invalid exact-commit rebuild receipt did not fail closed:\n${invalidRebuild.output}`);
  }
  await writeFile(rebuildReceiptPath, originalRebuildReceiptPayload);
  accepted.candidate.exactCommitRebuild.sha256 = originalRebuildReceiptHash;
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const originalDistHash = syntheticManifest.dist.entries[0].sha256;
  const forgedDistHash = "d".repeat(64);
  const forgedTreeHash = sha256(`${forgedDistHash}  index.html\n`);
  syntheticManifest.dist.entries[0].sha256 = forgedDistHash;
  syntheticManifest.dist.treeSha256 = forgedTreeHash;
  accepted.candidate.distTreeSha256 = forgedTreeHash;
  await writeFile(manifestPath, `${JSON.stringify(syntheticManifest, null, 2)}\n`);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const forgedArchiveContents = await run([acceptedPath]);
  if (
    forgedArchiveContents.exitCode !== 1 ||
    !forgedArchiveContents.output.includes("candidate ZIP SHA-256 differs for index.html")
  ) {
    throw new Error(`forged ZIP/dist binding did not fail closed:\n${forgedArchiveContents.output}`);
  }
  syntheticManifest.dist.entries[0].sha256 = originalDistHash;
  syntheticManifest.dist.treeSha256 = treeHash;
  accepted.candidate.distTreeSha256 = treeHash;
  await writeFile(manifestPath, `${JSON.stringify(syntheticManifest, null, 2)}\n`);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const nonexistentBranch = "qa/w8-nonexistent-branch";
  syntheticManifest.source.branch = nonexistentBranch;
  accepted.candidate.branch = nonexistentBranch;
  await writeFile(manifestPath, `${JSON.stringify(syntheticManifest, null, 2)}\n`);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const missingBranch = await run([acceptedPath]);
  if (
    missingBranch.exitCode !== 1 ||
    !missingBranch.output.includes("candidate branch does not exist locally or contain the commit")
  ) {
    throw new Error(`missing candidate branch did not fail closed:\n${missingBranch.output}`);
  }
  syntheticManifest.source.branch = branch;
  accepted.candidate.branch = branch;
  await writeFile(manifestPath, `${JSON.stringify(syntheticManifest, null, 2)}\n`);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const originalEvidenceHash = accepted.gates["IDN-01"].evidence[0].sha256;
  accepted.gates["IDN-01"].evidence[0].sha256 = "c".repeat(64);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const tamperedEvidence = await run([acceptedPath]);
  if (
    tamperedEvidence.exitCode !== 1 ||
    !tamperedEvidence.output.includes("IDN-01 evidence 0 SHA-256 mismatch")
  ) {
    throw new Error(`tampered evidence did not fail closed:\n${tamperedEvidence.output}`);
  }
  accepted.gates["IDN-01"].evidence[0].sha256 = originalEvidenceHash;
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const idnEvidencePath = resolve(accepted.gates["IDN-01"].evidence[0].path);
  const originalAttestationPayload = await readFile(idnEvidencePath, "utf8");
  const mismatchedAttestation = JSON.parse(originalAttestationPayload);
  mismatchedAttestation.gateId = "OPS-01";
  const mismatchedAttestationPayload = `${JSON.stringify(mismatchedAttestation, null, 2)}\n`;
  await writeFile(idnEvidencePath, mismatchedAttestationPayload);
  accepted.gates["IDN-01"].evidence[0].sha256 = sha256(mismatchedAttestationPayload);
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const semanticMismatch = await run([acceptedPath]);
  if (
    semanticMismatch.exitCode !== 1 ||
    !semanticMismatch.output.includes("IDN-01 evidence 0 gateId mismatch")
  ) {
    throw new Error(`misbound gate evidence did not fail closed:\n${semanticMismatch.output}`);
  }
  await writeFile(idnEvidencePath, originalAttestationPayload);
  accepted.gates["IDN-01"].evidence[0].sha256 = originalEvidenceHash;
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);

  const unauthorized = await run([acceptedPath, "--production"]);
  if (
    unauthorized.exitCode !== 1 ||
    !unauthorized.output.includes("DEC-04 is pending") ||
    !unauthorized.output.includes("production publication is not authorized")
  ) {
    throw new Error(`production authorization did not fail closed:\n${unauthorized.output}`);
  }

  accepted.publicationAuthorized = true;
  accepted.gates["DEC-04"] = {
    ...accepted.gates["DEC-04"],
    status: "pass",
    evidence: [evidenceByGate.get("DEC-04")],
    owner: fixtureOwner,
    verifiedAt: fixtureVerifiedAt,
  };
  await writeFile(acceptedPath, `${JSON.stringify(accepted, null, 2)}\n`);
  const productionGo = await run([acceptedPath, "--production"]);
  if (
    productionGo.exitCode !== 0 ||
    !productionGo.output.includes("W8 production acceptance: GO")
  ) {
    throw new Error(`authorized production record did not pass:\n${productionGo.output}`);
  }

  console.log(
    "PASS w8-release-acceptance-qa: non-circular candidate/production GO and fail-closed evidence/auth gates",
  );
} finally {
  const safeRoot = releaseEvidenceRoot.toLowerCase();
  const resolvedScratch = resolve(scratch).toLowerCase();
  if (
    dirname(resolvedScratch) === safeRoot &&
    basename(resolvedScratch).startsWith("qa-w8-acceptance-")
  ) {
    await rm(scratch, { recursive: true, force: true });
  } else {
    process.stderr.write(`Refusing to remove unexpected scratch directory: ${scratch}\n`);
    process.exitCode = 1;
  }
}
