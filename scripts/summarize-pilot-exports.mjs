import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const EVENT_NAMES = [
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

const ROOT_KEYS = new Set([
  "schema",
  "app",
  "exported",
  "locale",
  "consent",
  "versions",
  "acquisition",
  "qualified",
  "events",
  "boardFeedback",
  "unavailable",
]);
const FORBIDDEN_KEYS = new Set([
  "name",
  "email",
  "phone",
  "ip",
  "ipaddress",
  "studycode",
  "participantcode",
  "participantid",
  "playerid",
  "attemptid",
  "attemptkey",
  "seed",
  "words",
  "timestamp",
  "profile",
  "freetext",
]);
const SAFE_TOKEN = /^[a-zA-Z0-9._:-]{1,120}$/u;
const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/u;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/u;
const URL = /\b(?:https?:\/\/|www\.)\S+/iu;
const PRECISE_TIME = /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/u;
const EPOCH = /\b\d{10,13}\b/u;
const STUDY_CODE = /\bP\d{3}\b/u;
const MAX_BYTES = 1_000_000;
const MAX_DEPTH = 10;
const MAX_ARRAY_ITEMS = 500;
const MAX_STRING_LENGTH = 240;

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(file, value, expected, label) {
  if (!isRecord(value)) fail(file, `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) {
    fail(file, `${label} keys differ; got ${actual.join(", ")}`);
  }
}

function assertCount(file, value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail(file, `${label} must be a non-negative integer`);
}

function scanPrivacy(file, value, key = "root", depth = 0) {
  if (depth > MAX_DEPTH) fail(file, `${key} exceeds maximum nesting depth`);
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) fail(file, `${key} exceeds safe string length`);
    if (EMAIL.test(value)) fail(file, `${key} contains an email address`);
    if (IPV4.test(value)) fail(file, `${key} contains an IP address`);
    if (URL.test(value)) fail(file, `${key} contains a URL`);
    if (PRECISE_TIME.test(value) || EPOCH.test(value)) fail(file, `${key} contains precise time data`);
    if (STUDY_CODE.test(value)) fail(file, `${key} contains an external study code`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) fail(file, `${key} exceeds safe array length`);
    value.forEach((item, index) => scanPrivacy(file, item, `${key}[${index}]`, depth + 1));
    return;
  }
  if (!isRecord(value)) return;
  for (const [childKey, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(childKey.toLowerCase())) fail(file, `forbidden field ${key}.${childKey}`);
    scanPrivacy(file, child, `${key}.${childKey}`, depth + 1);
  }
}

function validateReturn(file, value, label) {
  assertExactKeys(file, value, ["eligible", "observed", "organic", "invited"], label);
  for (const key of ["eligible", "observed", "organic", "invited"]) {
    if (typeof value[key] !== "boolean") fail(file, `${label}.${key} must be boolean`);
  }
  if (value.organic && value.invited) fail(file, `${label} cannot be both organic and invited`);
  if (value.observed !== (value.organic || value.invited)) fail(file, `${label}.observed is inconsistent`);
  if (!value.eligible && (value.observed || value.organic || value.invited)) {
    fail(file, `${label} cannot observe a return before eligibility`);
  }
}

function validateExport(file, value) {
  assertExactKeys(file, value, ROOT_KEYS, "root");
  scanPrivacy(file, value);
  if (value.schema !== "foldwink-research-export-v1") fail(file, "unsupported schema");
  if (value.app !== "foldwink" || value.exported !== "local-day-only") fail(file, "wrong app/export mode");
  if (!["en", "ru", "de"].includes(value.locale)) fail(file, "locale must be en, ru or de");
  if (!["unknown", "granted", "denied"].includes(value.consent)) fail(file, "invalid consent state");
  assertExactKeys(
    file,
    value.versions,
    ["schema", "eventSchema", "app", "content", "policy", "balance"],
    "versions",
  );
  if (value.versions.schema !== 1 || value.versions.eventSchema !== "ops-06-v1") fail(file, "unsupported event schema");
  for (const key of ["app", "content", "policy", "balance"]) {
    if (!SAFE_TOKEN.test(value.versions[key])) fail(file, `versions.${key} is not a safe token`);
  }
  assertExactKeys(file, value.acquisition, ["organicDays", "invitedDays"], "acquisition");
  assertCount(file, value.acquisition.organicDays, "acquisition.organicDays");
  assertCount(file, value.acquisition.invitedDays, "acquisition.invitedDays");
  assertExactKeys(
    file,
    value.qualified,
    ["d0Recorded", "totalDays", "completedDays", "d1", "d7"],
    "qualified",
  );
  if (typeof value.qualified.d0Recorded !== "boolean") fail(file, "qualified.d0Recorded must be boolean");
  assertCount(file, value.qualified.totalDays, "qualified.totalDays");
  assertCount(file, value.qualified.completedDays, "qualified.completedDays");
  if (value.qualified.completedDays > value.qualified.totalDays) {
    fail(file, "qualified.completedDays cannot exceed qualified.totalDays");
  }
  if (value.qualified.d0Recorded !== (value.qualified.totalDays > 0)) {
    fail(file, "qualified.d0Recorded is inconsistent with qualified.totalDays");
  }
  if (
    value.acquisition.organicDays > value.qualified.totalDays ||
    value.acquisition.invitedDays > value.qualified.totalDays ||
    value.acquisition.organicDays + value.acquisition.invitedDays !== value.qualified.totalDays
  ) {
    fail(file, "acquisition day counts must partition qualified.totalDays");
  }
  validateReturn(file, value.qualified.d1, "qualified.d1");
  validateReturn(file, value.qualified.d7, "qualified.d7");
  if (!value.qualified.d0Recorded && (value.qualified.d1.eligible || value.qualified.d7.eligible)) {
    fail(file, "return window cannot be eligible without D0");
  }
  assertExactKeys(file, value.events, EVENT_NAMES, "events");
  EVENT_NAMES.forEach((name) => assertCount(file, value.events[name], `events.${name}`));
  const observedWindows = Number(value.qualified.d1.observed) + Number(value.qualified.d7.observed);
  if (value.events.return_observed < observedWindows) {
    fail(file, "events.return_observed is below the observed D1/D7 count");
  }
  assertExactKeys(file, value.boardFeedback, ["yes", "no", "total", "entries"], "boardFeedback");
  for (const key of ["yes", "no", "total"]) assertCount(file, value.boardFeedback[key], `boardFeedback.${key}`);
  if (!Array.isArray(value.boardFeedback.entries)) fail(file, "boardFeedback.entries must be an array");
  if (value.boardFeedback.yes + value.boardFeedback.no !== value.boardFeedback.total) fail(file, "feedback totals are inconsistent");
  if (value.boardFeedback.entries.length !== value.boardFeedback.total) fail(file, "feedback entry count is inconsistent");
  for (const entry of value.boardFeedback.entries) {
    if (!isRecord(entry) || !["yes", "no"].includes(entry.answer)) fail(file, "invalid feedback entry");
    const keys = Object.keys(entry);
    if (keys.some((key) => !["answer", "boardId", "contentVersion"].includes(key))) fail(file, "unexpected feedback field");
    if (entry.boardId !== undefined && !SAFE_TOKEN.test(entry.boardId)) fail(file, "unsafe feedback boardId");
    if (entry.contentVersion !== undefined && !SAFE_TOKEN.test(entry.contentVersion)) fail(file, "unsafe feedback contentVersion");
  }
  if (!Array.isArray(value.unavailable) || value.unavailable.join("|") !== "wink_understanding|interview_notes|facilitator_interventions") {
    fail(file, "unavailable evidence declaration differs");
  }
  return value;
}

async function collectFiles(inputs) {
  const files = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    const info = await stat(resolved);
    if (info.isDirectory()) {
      const names = await readdir(resolved);
      files.push(...names.filter((name) => name.toLowerCase().endsWith(".json")).map((name) => path.join(resolved, name)));
    } else if (info.isFile()) {
      files.push(resolved);
    }
  }
  return [...new Set(files)].sort();
}

function emptyAggregate(sample) {
  return {
    locale: sample.locale,
    consent: sample.consent,
    versions: sample.versions,
    exports: 0,
    d0Recorded: 0,
    d1: { eligible: 0, observed: 0, organic: 0, invited: 0 },
    d7: { eligible: 0, observed: 0, organic: 0, invited: 0 },
    events: Object.fromEntries(EVENT_NAMES.map((name) => [name, 0])),
    boardFeedback: { yes: 0, no: 0, total: 0 },
  };
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function addAggregate(target, value) {
  target.exports += 1;
  target.d0Recorded += value.qualified.d0Recorded ? 1 : 0;
  for (const window of ["d1", "d7"]) {
    for (const key of ["eligible", "observed", "organic", "invited"]) {
      target[window][key] += value.qualified[window][key] ? 1 : 0;
    }
  }
  EVENT_NAMES.forEach((name) => { target.events[name] += value.events[name]; });
  for (const key of ["yes", "no", "total"]) target.boardFeedback[key] += value.boardFeedback[key];
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: npm run pilot:summarize -- <export.json|directory> [...]");
  process.exitCode = 2;
} else {
  const files = await collectFiles(inputs);
  if (files.length === 0) throw new Error("No JSON exports found");
  const hashes = new Map();
  const warnings = [];
  const rejections = [];
  const duplicates = [];
  const groups = new Map();
  let accepted = 0;
  for (const [index, file] of files.entries()) {
    const source = path.basename(file);
    try {
      const info = await stat(file);
      if (info.size > MAX_BYTES) fail(file, `file exceeds ${MAX_BYTES} bytes`);
      const raw = await readFile(file, "utf8");
      if (PRECISE_TIME.test(raw) || EPOCH.test(raw)) fail(file, "precise timestamp found");
      const parsed = JSON.parse(raw);
      const value = validateExport(file, parsed);
      const hash = createHash("sha256").update(canonicalJson(parsed)).digest("hex");
      const matchingFile = hashes.get(hash);
      if (matchingFile) {
        duplicates.push({ source, matches: matchingFile, payloadSha256: hash });
        warnings.push(
          `Identical minimized payload quarantined: ${matchingFile} and ${source}; resolve it against the external roster before interpreting N.`,
        );
        continue;
      }
      hashes.set(hash, source);
      const key = [
        value.locale,
        value.consent,
        value.versions.app,
        value.versions.content,
        value.versions.policy,
        value.versions.balance,
      ].join("|");
      const aggregate = groups.get(key) ?? emptyAggregate(value);
      addAggregate(aggregate, value);
      groups.set(key, aggregate);
      accepted += 1;
    } catch (error) {
      rejections.push({ source, ordinal: index + 1, error: error?.message ?? String(error) });
    }
  }
  console.log(
    JSON.stringify(
      {
        schema: "foldwink-pilot-summary-v1",
        files: files.length,
        accepted,
        rejected: rejections.length,
        quarantinedDuplicates: duplicates.length,
        warnings,
        rejections,
        duplicates,
        groups: [...groups.values()],
      },
      null,
      2,
    ),
  );
  if (rejections.length > 0 || duplicates.length > 0) process.exitCode = 1;
}
