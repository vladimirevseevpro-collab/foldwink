#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const args = process.argv.slice(2);
const production = args.includes("--production");
const schemaOnly = args.includes("--schema-only");
const recordArg = args.find((arg) => !arg.startsWith("--"));
const recordPath = path.resolve(
  recordArg ?? "docs/release-evidence/W8_RELEASE_ACCEPTANCE.json",
);

const REQUIRED_GATES = [
  "IDN-01",
  "IDN-02",
  "IDN-03",
  "IDN-04",
  "IDN-05",
  "BLD-01",
  "BLD-02",
  "BLD-03",
  "BLD-04",
  "BLD-05",
  "BLD-06",
  "SCN-01",
  "SCN-02",
  "SCN-03",
  "SCN-04",
  "SCN-05",
  "SCN-06",
  "SCN-07",
  "SCN-08",
  "SCN-09",
  "SCN-10",
  "VIS-01",
  "VIS-02",
  "VIS-03",
  "VIS-04",
  "VIS-05",
  "VIS-06",
  "VIS-07",
  "HUM-01",
  "HUM-02",
  "HUM-03",
  "HUM-04",
  "HUM-05",
  "HUM-06",
  "HUM-07",
  "OPS-01",
  "OPS-02",
  "OPS-03",
  "OPS-04",
  "OPS-05",
  "OPS-06",
  "OPS-07",
  "OPS-08",
  "DEC-01",
  "DEC-02",
  "DEC-03",
  "DEC-04",
];

const PUBLICATION_GATE = "DEC-04";
const allowedStatuses = new Set(["pass", "fail", "pending", "deferred"]);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const EMPTY_SHA256 = sha256("");
const toPosix = (value) => value.split(path.sep).join("/");

let record;
try {
  record = JSON.parse(await readFile(recordPath, "utf8"));
} catch (error) {
  console.error("Foldwink W8 release acceptance: NO-GO");
  console.error(`- cannot read acceptance record ${recordPath}: ${error.message}`);
  console.error(
    "- copy docs/release-evidence/W8_RELEASE_ACCEPTANCE.template.json into a release-specific evidence directory",
  );
  process.exit(1);
}

check(record.schemaVersion === 1, "schemaVersion must be 1");
check(
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(record.releaseId ?? ""),
  "releaseId missing or unsafe",
);
check(record.gates && typeof record.gates === "object", "gates object missing");

const releaseEvidenceRoot = path.resolve(root, "docs/release-evidence", record.releaseId ?? "");
const releaseEvidenceParent = path.resolve(root, "docs/release-evidence");
const isInside = (file, directory) => {
  const relative = path.relative(directory, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};

async function verifyContainedDirectory(directory, parent, label) {
  if (!isInside(directory, parent)) {
    failures.push(`${label} is outside ${parent}`);
    return false;
  }
  try {
    const directoryStat = await lstat(directory);
    check(!directoryStat.isSymbolicLink(), `${label} must not be a symbolic link`);
    check(directoryStat.isDirectory(), `${label} is not a directory`);
    const [resolvedDirectory, resolvedParent] = await Promise.all([
      realpath(directory),
      realpath(parent),
    ]);
    check(
      isInside(resolvedDirectory, resolvedParent),
      `${label} resolves outside its evidence parent`,
    );
    return (
      !directoryStat.isSymbolicLink() &&
      directoryStat.isDirectory() &&
      isInside(resolvedDirectory, resolvedParent)
    );
  } catch (error) {
    failures.push(`${label} cannot be verified: ${error.message}`);
    return false;
  }
}

async function readContainedRegularFile(file, directory, label) {
  if (!isInside(file, directory)) {
    failures.push(`${label} is outside ${directory}`);
    return null;
  }
  try {
    const fileStat = await lstat(file);
    check(!fileStat.isSymbolicLink(), `${label} must not be a symbolic link`);
    check(fileStat.isFile(), `${label} is not a regular file`);
    if (fileStat.isSymbolicLink() || !fileStat.isFile()) return null;
    const [resolvedFile, resolvedDirectory] = await Promise.all([
      realpath(file),
      realpath(directory),
    ]);
    if (!isInside(resolvedFile, resolvedDirectory)) {
      failures.push(`${label} resolves outside ${directory}`);
      return null;
    }
    return { bytes: await readFile(resolvedFile), path: resolvedFile };
  } catch (error) {
    failures.push(`${label} cannot be read: ${error.message}`);
    return null;
  }
}

function isSafeArchivePath(entry) {
  return (
    typeof entry === "string" &&
    entry.length > 0 &&
    !entry.startsWith("/") &&
    !/^[a-zA-Z]:/u.test(entry) &&
    !entry.includes("\\") &&
    !entry.endsWith("/") &&
    !entry.split("/").includes("..")
  );
}

if (!schemaOnly || Object.values(record.gates ?? {}).some((gate) => gate?.status === "pass")) {
  await verifyContainedDirectory(
    releaseEvidenceRoot,
    releaseEvidenceParent,
    "release evidence directory",
  );
}

async function verifyZipAgainstManifest(artifactPath, entries) {
  let zipPaths;
  try {
    const [{ stdout: pathOutput }, { stdout: detailOutput }] = await Promise.all([
      execFileAsync("tar", ["-tf", artifactPath], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
      execFileAsync("tar", ["-tvf", artifactPath], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
    ]);
    zipPaths = pathOutput.split(/\r?\n/u).filter(Boolean);
    const zipDetails = detailOutput.split(/\r?\n/u).filter(Boolean);
    check(
      zipDetails.length === zipPaths.length && zipDetails.every((entry) => entry.startsWith("-")),
      "candidate ZIP must contain regular files only",
    );
  } catch (error) {
    failures.push(`candidate artifact is not a readable ZIP: ${error.message}`);
    return;
  }
  check(zipPaths.every(isSafeArchivePath), "candidate ZIP contains an unsafe or non-file path");
  check(new Set(zipPaths).size === zipPaths.length, "candidate ZIP contains duplicate paths");
  check(zipPaths.includes("index.html"), "candidate ZIP does not contain index.html");

  const expectedPaths = entries.map((entry) => entry.path).sort();
  const actualPaths = [...zipPaths].sort();
  check(
    JSON.stringify(actualPaths) === JSON.stringify(expectedPaths),
    "candidate ZIP paths differ from manifest dist entries",
  );
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) return;

  for (const entry of entries) {
    try {
      const { stdout } = await execFileAsync(
        "tar",
        ["-xOf", artifactPath, "--", entry.path],
        { cwd: root, encoding: null, maxBuffer: 64 * 1024 * 1024 },
      );
      check(stdout.length === entry.bytes, `candidate ZIP byte count differs for ${entry.path}`);
      check(
        sha256(stdout) === entry.sha256,
        `candidate ZIP SHA-256 differs for ${entry.path}`,
      );
    } catch (error) {
      failures.push(`cannot read candidate ZIP entry ${entry.path}: ${error.message}`);
    }
  }
}

const gateIds = Object.keys(record.gates ?? {});
for (const id of REQUIRED_GATES) check(gateIds.includes(id), `missing gate ${id}`);
for (const id of gateIds) check(REQUIRED_GATES.includes(id), `unknown gate ${id}`);

for (const id of REQUIRED_GATES) {
  const gate = record.gates?.[id];
  if (!gate) continue;
  check(allowedStatuses.has(gate.status), `${id} has invalid status`);
  check(typeof gate.label === "string" && gate.label.length > 0, `${id} label missing`);
  check(Array.isArray(gate.evidence), `${id} evidence must be an array`);
  if (gate.status === "pass") {
    const gateEvidenceRoot = path.resolve(releaseEvidenceRoot, id);
    await verifyContainedDirectory(
      gateEvidenceRoot,
      releaseEvidenceRoot,
      `${id} evidence directory`,
    );
    check(gate.evidence.length > 0, `${id} pass has no evidence`);
    check(typeof gate.owner === "string" && gate.owner.length > 0, `${id} pass owner missing`);
    check(
      typeof gate.verifiedAt === "string" && !Number.isNaN(Date.parse(gate.verifiedAt)),
      `${id} pass verifiedAt missing or invalid`,
    );
    for (const [index, evidence] of gate.evidence.entries()) {
      check(
        evidence && typeof evidence === "object" && !Array.isArray(evidence),
        `${id} evidence ${index} must be an object`,
      );
      if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) continue;
      check(
        typeof evidence.path === "string" && evidence.path.length > 0,
        `${id} evidence ${index} path missing`,
      );
      check(
        /^[0-9a-f]{64}$/u.test(evidence.sha256 ?? ""),
        `${id} evidence ${index} SHA-256 missing or invalid`,
      );
      if (typeof evidence.path !== "string") continue;
      const evidencePath = path.resolve(root, evidence.path);
      const evidenceFile = await readContainedRegularFile(
        evidencePath,
        gateEvidenceRoot,
        `${id} evidence ${index}`,
      );
      if (!evidenceFile) continue;
      check(
        sha256(evidenceFile.bytes) === evidence.sha256,
        `${id} evidence ${index} SHA-256 mismatch`,
      );
      let attestation;
      try {
        attestation = JSON.parse(evidenceFile.bytes.toString("utf8"));
      } catch (error) {
        failures.push(`${id} evidence ${index} is not valid attestation JSON: ${error.message}`);
        continue;
      }
      check(
        attestation.schema === "foldwink-release-evidence-v1",
        `${id} evidence ${index} attestation schema is unsupported`,
      );
      check(
        attestation.releaseId === record.releaseId,
        `${id} evidence ${index} releaseId mismatch`,
      );
      check(attestation.gateId === id, `${id} evidence ${index} gateId mismatch`);
      check(attestation.outcome === "pass", `${id} evidence ${index} outcome is not pass`);
      check(attestation.owner === gate.owner, `${id} evidence ${index} owner mismatch`);
      check(
        attestation.verifiedAt === gate.verifiedAt,
        `${id} evidence ${index} verifiedAt mismatch`,
      );
      check(
        typeof attestation.summary === "string" && attestation.summary.trim().length > 0,
        `${id} evidence ${index} summary missing`,
      );
      check(
        Array.isArray(attestation.attachments) && attestation.attachments.length > 0,
        `${id} evidence ${index} attachments missing`,
      );
      for (const [attachmentIndex, attachment] of (
        Array.isArray(attestation.attachments) ? attestation.attachments : []
      ).entries()) {
        check(
          attachment && typeof attachment === "object" && !Array.isArray(attachment),
          `${id} evidence ${index} attachment ${attachmentIndex} must be an object`,
        );
        if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) continue;
        check(
          typeof attachment.path === "string" && attachment.path.length > 0,
          `${id} evidence ${index} attachment ${attachmentIndex} path missing`,
        );
        check(
          /^[0-9a-f]{64}$/u.test(attachment.sha256 ?? ""),
          `${id} evidence ${index} attachment ${attachmentIndex} SHA-256 missing or invalid`,
        );
        if (typeof attachment.path !== "string") continue;
        const attachmentPath = path.resolve(root, attachment.path);
        check(
          attachmentPath !== evidencePath,
          `${id} evidence ${index} attachment ${attachmentIndex} cannot be self-referential`,
        );
        const attachmentFile = await readContainedRegularFile(
          attachmentPath,
          gateEvidenceRoot,
          `${id} evidence ${index} attachment ${attachmentIndex}`,
        );
        if (attachmentFile) {
          check(
            sha256(attachmentFile.bytes) === attachment.sha256,
            `${id} evidence ${index} attachment ${attachmentIndex} SHA-256 mismatch`,
          );
        }
      }
    }
  }
}

if (schemaOnly) {
  if (failures.length > 0) {
    console.error("Foldwink W8 acceptance schema: FAIL");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log("Foldwink W8 acceptance schema: PASS (schema only, not release readiness)");
  console.log(`- ${REQUIRED_GATES.length} required gates represented`);
  process.exit(0);
}

const candidate = record.candidate ?? {};
check(
  path.dirname(recordPath) === releaseEvidenceRoot,
  "acceptance record must live directly inside its release evidence directory",
);
await readContainedRegularFile(recordPath, releaseEvidenceRoot, "acceptance record");
check(/^[0-9a-f]{40}$/u.test(candidate.commit ?? ""), "candidate commit must be a full SHA");
check(typeof candidate.branch === "string" && candidate.branch.length > 0, "candidate branch missing");
check(
  typeof candidate.appVersion === "string" && candidate.appVersion.length > 0,
  "candidate app version missing",
);
check(/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/u.test(candidate.appVersion ?? ""), "candidate app version is not semver");
check(/^[0-9a-f]{64}$/u.test(candidate.lockSha256 ?? ""), "candidate lock SHA-256 missing");
check(
  /^[0-9a-f]{64}$/u.test(candidate.lockAtCommitSha256 ?? ""),
  "candidate lock-at-commit SHA-256 missing",
);
check(
  /^[0-9a-f]{64}$/u.test(candidate.artifactSha256 ?? ""),
  "candidate artifact SHA-256 missing",
);
check(
  /^[0-9a-f]{64}$/u.test(candidate.distTreeSha256 ?? ""),
  "candidate dist-tree SHA-256 missing",
);
check(
  candidate.exactCommitRebuild &&
    typeof candidate.exactCommitRebuild === "object" &&
    !Array.isArray(candidate.exactCommitRebuild),
  "candidate exact-commit rebuild receipt missing",
);
try {
  const stagingUrl = new URL(candidate.stagingUrl);
  check(stagingUrl.protocol === "https:", "candidate staging URL must use HTTPS");
  check(!/^(?:localhost|127\.0\.0\.1|\[::1\])$/u.test(stagingUrl.hostname), "candidate staging URL cannot be local");
} catch {
  failures.push("candidate staging URL missing or invalid");
}
check(
  typeof candidate.deployedAt === "string" && !Number.isNaN(Date.parse(candidate.deployedAt)),
  "candidate deployment time missing or invalid",
);
check(typeof candidate.artifactManifest === "string", "candidate artifact manifest path missing");

let verifiedManifest = null;
if (typeof candidate.artifactManifest === "string") {
  try {
    const resolvedManifest = path.resolve(root, candidate.artifactManifest);
    const manifestFile = await readContainedRegularFile(
      resolvedManifest,
      releaseEvidenceRoot,
      "candidate artifact manifest",
    );
    if (!manifestFile) throw new Error("candidate artifact manifest is unavailable");
    const manifest = JSON.parse(manifestFile.bytes.toString("utf8"));
    verifiedManifest = manifest;
    check(
      manifest.schema === "foldwink-pilot-artifact-manifest-v1",
      "candidate artifact manifest schema is unsupported",
    );
    check(manifest.versions?.app === candidate.appVersion, "manifest app differs from candidate");
    check(
      manifest.artifact?.sha256 === candidate.artifactSha256,
      "manifest artifact SHA-256 differs from candidate",
    );
    check(
      manifest.dist?.treeSha256 === candidate.distTreeSha256,
      "manifest dist tree differs from candidate",
    );
    check(manifest.source?.clean === true, "artifact manifest source worktree was not clean");
    check(
      manifest.source?.statusSha256 === EMPTY_SHA256,
      "artifact manifest source status does not prove an empty worktree",
    );
    check(
      manifest.source?.baseCommit === candidate.commit,
      "artifact manifest source commit differs from candidate",
    );
    check(
      manifest.source?.branch === candidate.branch,
      "artifact manifest source branch differs from candidate",
    );
    check(
      manifest.source?.packageLockSha256 === candidate.lockSha256,
      "artifact manifest lock SHA-256 differs from candidate",
    );
    check(
      manifest.source?.packageLockAtCommitSha256 === candidate.lockAtCommitSha256,
      "artifact manifest lock-at-commit SHA-256 differs from candidate",
    );

    const artifactPath = path.resolve(root, manifest.artifact?.path ?? "");
    const artifactFile = await readContainedRegularFile(
      artifactPath,
      root,
      "candidate artifact",
    );
    if (artifactFile) {
      const artifactBytes = artifactFile.bytes;
      const zipSignature = artifactBytes.subarray(0, 4).toString("hex");
      check(path.extname(artifactFile.path).toLowerCase() === ".zip", "candidate artifact is not a .zip file");
      check(
        ["504b0304", "504b0506", "504b0708"].includes(zipSignature),
        "candidate artifact does not have a ZIP signature",
      );
      check(
        artifactBytes.length === manifest.artifact?.bytes,
        "artifact byte count differs from manifest",
      );
      check(
        sha256(artifactBytes) === manifest.artifact?.sha256,
        "artifact SHA-256 differs from manifest",
      );
    }

    const distEntries = manifest.dist?.entries;
    check(Array.isArray(distEntries), "artifact manifest dist entries missing");
    if (Array.isArray(distEntries)) {
      const entriesValid = distEntries.every(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          isSafeArchivePath(entry.path) &&
          Number.isSafeInteger(entry.bytes) &&
          entry.bytes >= 0 &&
          /^[0-9a-f]{64}$/u.test(entry.sha256 ?? ""),
      );
      check(entriesValid, "manifest dist entry metadata is invalid");
      if (!entriesValid) throw new Error("cannot safely process invalid dist entries");
      const sortedEntries = [...distEntries].sort((left, right) =>
        left.path.localeCompare(right.path),
      );
      const treeMaterial = sortedEntries
        .map((entry) => `${entry.sha256}  ${entry.path}\n`)
        .join("");
      const uniquePaths = new Set(sortedEntries.map((entry) => entry.path)).size === sortedEntries.length;
      check(
        uniquePaths,
        "manifest dist entries contain duplicate paths",
      );
      check(sortedEntries.length === manifest.dist?.files, "manifest dist file count is inconsistent");
      check(
        sortedEntries.reduce((sum, entry) => sum + entry.bytes, 0) === manifest.dist?.bytes,
        "manifest dist byte count is inconsistent",
      );
      check(
        sha256(treeMaterial) === manifest.dist?.treeSha256,
        "manifest dist tree SHA-256 is inconsistent",
      );
      if (artifactFile && uniquePaths) {
        await verifyZipAgainstManifest(artifactFile.path, sortedEntries);
      }
    }
  } catch (error) {
    failures.push(`cannot verify candidate artifact manifest: ${error.message}`);
  }
}

let rebuildReceipt = null;
if (
  candidate.exactCommitRebuild &&
  typeof candidate.exactCommitRebuild === "object" &&
  !Array.isArray(candidate.exactCommitRebuild)
) {
  const rebuildRef = candidate.exactCommitRebuild;
  check(
    typeof rebuildRef.path === "string" && rebuildRef.path.length > 0,
    "candidate exact-commit rebuild receipt path missing",
  );
  check(
    /^[0-9a-f]{64}$/u.test(rebuildRef.sha256 ?? ""),
    "candidate exact-commit rebuild receipt SHA-256 missing or invalid",
  );
  if (typeof rebuildRef.path === "string") {
    const rebuildDirectory = path.resolve(releaseEvidenceRoot, "BLD-01");
    const rebuildPath = path.resolve(root, rebuildRef.path);
    const rebuildFile = await readContainedRegularFile(
      rebuildPath,
      rebuildDirectory,
      "candidate exact-commit rebuild receipt",
    );
    if (rebuildFile) {
      check(
        sha256(rebuildFile.bytes) === rebuildRef.sha256,
        "candidate exact-commit rebuild receipt SHA-256 mismatch",
      );
      try {
        rebuildReceipt = JSON.parse(rebuildFile.bytes.toString("utf8"));
        check(
          rebuildReceipt.schema === "foldwink-exact-commit-rebuild-v1",
          "candidate exact-commit rebuild receipt schema is unsupported",
        );
        check(rebuildReceipt.outcome === "pass", "candidate exact-commit rebuild did not pass");
        check(
          rebuildReceipt.releaseId === record.releaseId,
          "exact-commit rebuild releaseId differs from candidate",
        );
        check(
          rebuildReceipt.candidate?.commit === candidate.commit,
          "exact-commit rebuild commit differs from candidate",
        );
        check(
          rebuildReceipt.candidate?.branch === candidate.branch,
          "exact-commit rebuild branch differs from candidate",
        );
        check(
          rebuildReceipt.candidate?.record === toPosix(path.relative(root, recordPath)),
          "exact-commit rebuild record path differs from candidate",
        );
        check(
          rebuildReceipt.candidate?.artifactManifest === candidate.artifactManifest,
          "exact-commit rebuild manifest path differs from candidate",
        );
        check(
          rebuildReceipt.expected?.appVersion === candidate.appVersion &&
            rebuildReceipt.rebuilt?.appVersion === candidate.appVersion,
          "exact-commit rebuild app version differs from candidate",
        );
        check(
          rebuildReceipt.expected?.lockSha256 === candidate.lockAtCommitSha256 &&
            rebuildReceipt.rebuilt?.lockSha256 === candidate.lockAtCommitSha256,
          "exact-commit rebuild lock differs from candidate",
        );
        check(
          rebuildReceipt.expected?.distTreeSha256 === candidate.distTreeSha256 &&
            rebuildReceipt.rebuilt?.dist?.treeSha256 === candidate.distTreeSha256,
          "exact-commit rebuild dist tree differs from candidate",
        );
        check(
          rebuildReceipt.expected?.artifactSha256 === candidate.artifactSha256 &&
            rebuildReceipt.rebuilt?.artifact?.sha256 === candidate.artifactSha256,
          "exact-commit rebuild artifact differs from candidate",
        );
        check(rebuildReceipt.exactMatch === true, "exact-commit rebuild exactMatch is not true");
        check(
          rebuildReceipt.temporaryWorktreeRemoved === true,
          "exact-commit rebuild temporary worktree was not removed",
        );
        check(
          rebuildReceipt.source?.preBuildClean === true &&
            rebuildReceipt.source?.postBuildClean === true &&
            rebuildReceipt.source?.preBuildStatusSha256 === EMPTY_SHA256 &&
            rebuildReceipt.source?.postBuildStatusSha256 === EMPTY_SHA256,
          "exact-commit rebuild source was not clean before and after build",
        );
        check(
          Array.isArray(rebuildReceipt.commands) &&
            JSON.stringify(rebuildReceipt.commands) ===
              JSON.stringify([
                "npm ci --no-audit --no-fund",
                "npm run build",
                "node scripts/pack-itch.mjs",
              ]),
          "exact-commit rebuild command sequence is unsupported",
        );
        check(
          typeof rebuildReceipt.startedAt === "string" &&
            typeof rebuildReceipt.finishedAt === "string" &&
            !Number.isNaN(Date.parse(rebuildReceipt.startedAt)) &&
            !Number.isNaN(Date.parse(rebuildReceipt.finishedAt)) &&
            Date.parse(rebuildReceipt.finishedAt) >= Date.parse(rebuildReceipt.startedAt),
          "exact-commit rebuild timestamps are invalid",
        );
        check(
          rebuildReceipt.rebuilt?.dist?.files === verifiedManifest?.dist?.files &&
            rebuildReceipt.rebuilt?.dist?.bytes === verifiedManifest?.dist?.bytes,
          "exact-commit rebuild dist totals differ from manifest",
        );
        check(
          typeof rebuildReceipt.rebuilt?.environment?.node === "string" &&
            typeof rebuildReceipt.rebuilt?.environment?.npm === "string",
          "exact-commit rebuild runtime identity missing",
        );

        const rebuildLogPath = path.resolve(root, rebuildReceipt.log?.path ?? "");
        const rebuildLogFile = await readContainedRegularFile(
          rebuildLogPath,
          rebuildDirectory,
          "candidate exact-commit rebuild log",
        );
        if (rebuildLogFile) {
          check(
            sha256(rebuildLogFile.bytes) === rebuildReceipt.log?.sha256,
            "candidate exact-commit rebuild log SHA-256 mismatch",
          );
        }
      } catch (error) {
        failures.push(`cannot verify exact-commit rebuild receipt: ${error.message}`);
      }
    }
  }
}

if (/^[0-9a-f]{40}$/u.test(candidate.commit ?? "")) {
  try {
    const [{ stdout: packageJsonAtCommit }, { stdout: lockAtCommit }] = await Promise.all([
      execFileAsync("git", ["show", `${candidate.commit}:package.json`], {
        cwd: root,
        encoding: "utf8",
      }),
      execFileAsync("git", ["show", `${candidate.commit}:package-lock.json`], {
        cwd: root,
        encoding: null,
      }),
      execFileAsync("git", ["cat-file", "-e", `${candidate.commit}^{commit}`], {
        cwd: root,
      }),
    ]);
    const packageAtCommit = JSON.parse(packageJsonAtCommit);
    check(
      packageAtCommit.version === candidate.appVersion,
      "candidate app version differs from recorded commit",
    );
    check(
      sha256(lockAtCommit) === candidate.lockAtCommitSha256,
      "candidate lock-at-commit SHA-256 differs from recorded commit",
    );
    if (rebuildReceipt) {
      const declaredNode = packageAtCommit.engines?.node ?? null;
      const declaredNpm = packageAtCommit.engines?.npm ?? null;
      const packageManager = packageAtCommit.packageManager ?? null;
      check(
        rebuildReceipt.rebuilt?.environment?.declaredNode === declaredNode &&
          rebuildReceipt.rebuilt?.environment?.declaredNpm === declaredNpm &&
          rebuildReceipt.rebuilt?.environment?.packageManager === packageManager,
        "exact-commit rebuild declared runtime differs from recorded commit",
      );
      if (declaredNode) {
        check(
          rebuildReceipt.rebuilt?.environment?.node === `v${declaredNode}`,
          "exact-commit rebuild Node version differs from exact pin",
        );
      }
      if (declaredNpm) {
        check(
          rebuildReceipt.rebuilt?.environment?.npm === declaredNpm,
          "exact-commit rebuild npm version differs from exact pin",
        );
      }
      if (packageManager) {
        check(
          packageManager === `npm@${rebuildReceipt.rebuilt?.environment?.npm}`,
          "exact-commit rebuild packageManager differs from npm runtime",
        );
      }
    }
  } catch (error) {
    failures.push(`cannot verify recorded source commit: ${error.message}`);
  }
}

if (
  /^[0-9a-f]{40}$/u.test(candidate.commit ?? "") &&
  typeof candidate.branch === "string" &&
  candidate.branch.length > 0
) {
  try {
    await execFileAsync("git", ["check-ref-format", "--branch", candidate.branch], {
      cwd: root,
      encoding: "utf8",
    });
    const branchRef = `refs/heads/${candidate.branch}`;
    await execFileAsync("git", ["show-ref", "--verify", branchRef], {
      cwd: root,
      encoding: "utf8",
    });
    await execFileAsync("git", ["merge-base", "--is-ancestor", candidate.commit, branchRef], {
      cwd: root,
      encoding: "utf8",
    });
  } catch (error) {
    failures.push(`candidate branch does not exist locally or contain the commit: ${error.message}`);
  }
}

for (const id of REQUIRED_GATES) {
  if (!production && id === PUBLICATION_GATE) continue;
  const status = record.gates?.[id]?.status;
  check(status === "pass", `${id} is ${status ?? "missing"}, expected pass`);
}
check(record.decision === "GO", "decision must be GO");
if (production) {
  check(record.publicationAuthorized === true, "production publication is not authorized");
}

if (failures.length > 0) {
  console.error("Foldwink W8 release acceptance: NO-GO");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  production
    ? "Foldwink W8 production acceptance: GO"
    : "Foldwink W8 release-candidate acceptance: GO",
);
console.log(`- release: ${record.releaseId}`);
console.log(`- commit: ${candidate.commit}`);
console.log(`- app: ${candidate.appVersion}`);
if (!production) console.log("- production publication authorization was not evaluated");
