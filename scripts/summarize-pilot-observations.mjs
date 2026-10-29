import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const TARGETS = { en: 14, ru: 6, de: 6 };
const MAX_BYTES = 250_000;
const STUDY_CODE = /^P\d{3}$/u;
const DATE = /^\d{4}-\d{2}-\d{2}$/u;
const SAFE_TOKEN = /^[a-zA-Z0-9._:#-]{1,120}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const PII_KEY =
  /^(?:name|email|phone|ip|address|age|birthday|birthdate|location|advertisingid)$/iu;
const PII_VALUE =
  /(?:\b[^\s@]+@[^\s@]+\.[^\s@]+\b|\b(?:\d{1,3}\.){3}\d{1,3}\b|https?:\/\/|\+\d[\d ()-]{7,}\d|\b\d{2,4}[ ()]\d[\d ()-]{5,}\d\b|\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2})/iu;
// The frozen web pilot (pilot/0.8.5.manifest.json), not the moving main build;
// `npm run pilot:check-contract` proves these literals still match it.
const BUILD = {
  app: "0.8.5",
  content: "catalog-2026-09-v1",
  daily: "daily-2026-10-14-2026-12-12-v1+daily-2026-12-13-2027-02-10-v1",
  events: "ops-06-v1",
  privacy: "privacy-v1",
  balance: "balance-2026-09-v1",
  channel: "pages:pilot-0.8.5",
  treeSha256: "d91e97fe42d65532cb9a067bc6f851f2e9f1ef19db0b8810ade61f5850a47567",
};

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exact(file, value, keys, label) {
  if (!record(value)) fail(file, `${label} must be an object`);
  const actual = Object.keys(value).sort().join("\0");
  const expected = [...keys].sort().join("\0");
  if (actual !== expected) fail(file, `${label} keys differ`);
}

function oneOf(file, value, values, label) {
  if (!values.includes(value)) fail(file, `${label} must be one of ${values.join(", ")}`);
}

function boolean(file, value, label) {
  if (typeof value !== "boolean") fail(file, `${label} must be boolean`);
}

function nullableBoolean(file, value, label) {
  if (value !== null) boolean(file, value, label);
}

function boundedInteger(file, value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail(file, `${label} must be ${min}..${max}`);
}

function scanPii(file, value, key = "root", depth = 0) {
  if (depth > 12) fail(file, `${key} exceeds maximum nesting depth`);
  if (typeof value === "string") {
    if (value.length > 600) fail(file, `${key} exceeds maximum string length`);
    if (PII_VALUE.test(value)) fail(file, `${key} contains possible direct personal data`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 50) fail(file, `${key} has too many entries`);
    value.forEach((item, index) => scanPii(file, item, `${key}[${index}]`, depth + 1));
    return;
  }
  if (!record(value)) return;
  for (const [childKey, child] of Object.entries(value)) {
    if (PII_KEY.test(childKey))
      fail(file, `${key}.${childKey} is a forbidden personal-data field`);
    scanPii(file, child, `${key}.${childKey}`, depth + 1);
  }
}

function validateFlow(file, flow) {
  const keys = [
    "recruited",
    "consented",
    "appOpened",
    "firstSessionStarted",
    "usableObservation",
    "exportOffered",
    "exportProvided",
  ];
  exact(file, flow, keys, "flow");
  keys.forEach((key) => boolean(file, flow[key], `flow.${key}`));
  const ordered = [
    flow.recruited,
    flow.consented,
    flow.appOpened,
    flow.firstSessionStarted,
    flow.usableObservation,
  ];
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index] && !ordered[index - 1])
      fail(file, "flow must be monotonic through usableObservation");
  }
  if (flow.exportOffered && !flow.usableObservation)
    fail(file, "export cannot be offered before a usable observation");
  if (flow.exportProvided && !flow.exportOffered)
    fail(file, "export cannot be provided before it is offered");
}

function validateReturn(file, value, label, acquisition, d0Qualified) {
  exact(
    file,
    value,
    ["targetDate", "windowComplete", "qualifiedReturn", "attribution", "exportReceived"],
    label,
  );
  if (d0Qualified ? !DATE.test(value.targetDate) : value.targetDate !== null) {
    fail(file, `${label}.targetDate must be a date only after qualified D0`);
  }
  boolean(file, value.windowComplete, `${label}.windowComplete`);
  nullableBoolean(file, value.qualifiedReturn, `${label}.qualifiedReturn`);
  oneOf(
    file,
    value.attribution,
    ["organic", "invited", "none", "unknown"],
    `${label}.attribution`,
  );
  boolean(file, value.exportReceived, `${label}.exportReceived`);
  if (
    !d0Qualified &&
    (value.windowComplete ||
      value.qualifiedReturn !== null ||
      value.attribution !== "unknown" ||
      value.exportReceived)
  ) {
    fail(file, `${label} must remain empty before qualified D0`);
  }
  if (!value.windowComplete && value.qualifiedReturn !== null)
    fail(file, `${label} cannot record a result before the window closes`);
  if (value.windowComplete && value.qualifiedReturn === null)
    fail(file, `${label} needs a yes/no result after the window closes`);
  if (value.qualifiedReturn === true && value.attribution === "none")
    fail(file, `${label} return needs attribution`);
  if (value.qualifiedReturn === false && value.attribution !== "none")
    fail(file, `${label} non-return attribution must be none`);
  if (value.qualifiedReturn === true && value.attribution !== acquisition) {
    fail(file, `${label} attribution must match the preassigned cohort stratum`);
  }
  if (value.windowComplete && value.targetDate >= currentLocalDate()) {
    fail(file, `${label} cannot close until its entire local calendar day has elapsed`);
  }
}

function validateIssue(file, issue, index) {
  const label = `issues[${index}]`;
  exact(
    file,
    issue,
    [
      "kind",
      "boardId",
      "contentVersion",
      "affectedGroup",
      "summary",
      "severity",
      "validatorStatus",
      "retestStatus",
    ],
    label,
  );
  oneOf(
    file,
    issue.kind,
    [
      "knowledge-gap",
      "wording-friction",
      "plausible-competing-answer",
      "confirmed-competing-answer",
      "rule-misunderstanding",
      "technical",
    ],
    `${label}.kind`,
  );
  for (const key of ["boardId", "contentVersion"])
    if (!SAFE_TOKEN.test(issue[key])) fail(file, `${label}.${key} is not a safe token`);
  if (typeof issue.affectedGroup !== "string" || issue.affectedGroup.length > 120)
    fail(file, `${label}.affectedGroup is invalid`);
  if (
    typeof issue.summary !== "string" ||
    issue.summary.length < 1 ||
    issue.summary.length > 400
  )
    fail(file, `${label}.summary is invalid`);
  oneOf(file, issue.severity, ["P0", "P1", "P2", "P3"], `${label}.severity`);
  oneOf(
    file,
    issue.validatorStatus,
    ["not-required", "pending", "confirmed", "rejected"],
    `${label}.validatorStatus`,
  );
  oneOf(
    file,
    issue.retestStatus,
    ["not-required", "pending", "passed", "failed"],
    `${label}.retestStatus`,
  );
}

function addUtcDays(date, days) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function currentLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validate(file, value) {
  exact(
    file,
    value,
    [
      "schema",
      "studyCode",
      "build",
      "locale",
      "cohort",
      "flow",
      "onboarding",
      "firstSession",
      "resultActions",
      "wink",
      "share",
      "export",
      "returns",
      "issues",
    ],
    "root",
  );
  scanPii(file, value);
  if (value.schema !== "foldwink-pilot-observation-v1") fail(file, "unsupported schema");
  if (!STUDY_CODE.test(value.studyCode)) fail(file, "studyCode must match P000");
  exact(file, value.build, Object.keys(BUILD), "build");
  for (const [key, expected] of Object.entries(BUILD)) {
    const actual = value.build[key];
    if ((key.endsWith("Sha256") && !SHA256.test(actual)) || actual !== expected)
      fail(file, `build.${key} does not match the frozen pilot`);
  }
  oneOf(file, value.locale, ["en", "ru", "de"], "locale");

  exact(
    file,
    value.cohort,
    [
      "acquisition",
      "deviceClass",
      "osFamily",
      "browserFamily",
      "launchMode",
      "input",
      "accessibility",
      "puzzleFrequency",
    ],
    "cohort",
  );
  oneOf(file, value.cohort.acquisition, ["organic", "invited"], "cohort.acquisition");
  oneOf(file, value.cohort.deviceClass, ["phone", "tablet", "desktop"], "cohort.deviceClass");
  oneOf(
    file,
    value.cohort.osFamily,
    ["ios", "android", "windows", "macos", "linux", "chromeos", "other"],
    "cohort.osFamily",
  );
  oneOf(
    file,
    value.cohort.browserFamily,
    ["safari", "chrome", "edge", "firefox", "other"],
    "cohort.browserFamily",
  );
  oneOf(file, value.cohort.launchMode, ["browser", "pwa"], "cohort.launchMode");
  oneOf(file, value.cohort.input, ["touch", "mouse", "keyboard", "mixed"], "cohort.input");
  oneOf(
    file,
    value.cohort.accessibility,
    ["none", "reduced-motion", "keyboard-only", "other"],
    "cohort.accessibility",
  );
  oneOf(
    file,
    value.cohort.puzzleFrequency,
    ["never", "monthly", "weekly", "several-weekly"],
    "cohort.puzzleFrequency",
  );
  validateFlow(file, value.flow);

  exact(
    file,
    value.onboarding,
    ["started", "outcome", "firstMeaningfulActionIndependent", "coreLoopExplanation"],
    "onboarding",
  );
  boolean(file, value.onboarding.started, "onboarding.started");
  oneOf(
    file,
    value.onboarding.outcome,
    ["completed", "skipped", "not-started"],
    "onboarding.outcome",
  );
  boolean(
    file,
    value.onboarding.firstMeaningfulActionIndependent,
    "onboarding.firstMeaningfulActionIndependent",
  );
  oneOf(
    file,
    value.onboarding.coreLoopExplanation,
    ["correct", "partial", "incorrect", "not-asked"],
    "onboarding.coreLoopExplanation",
  );
  if (value.onboarding.started !== (value.onboarding.outcome !== "not-started"))
    fail(file, "onboarding started/outcome mismatch");
  if (value.onboarding.firstMeaningfulActionIndependent && !value.flow.firstSessionStarted)
    fail(file, "independent gameplay action requires a started session");

  exact(
    file,
    value.firstSession,
    [
      "boardId",
      "contentVersion",
      "firstGroupIndependent",
      "timeToFirstGroupSeconds",
      "firstAttemptOutcome",
      "mistakesUsed",
      "resultReached",
      "interventions",
    ],
    "firstSession",
  );
  if (!SAFE_TOKEN.test(value.firstSession.boardId))
    fail(file, "firstSession.boardId is not a safe token");
  if (value.firstSession.contentVersion !== BUILD.content)
    fail(file, "firstSession.contentVersion does not match the frozen pilot");
  nullableBoolean(
    file,
    value.firstSession.firstGroupIndependent,
    "firstSession.firstGroupIndependent",
  );
  if (value.firstSession.timeToFirstGroupSeconds !== null)
    boundedInteger(
      file,
      value.firstSession.timeToFirstGroupSeconds,
      0,
      3600,
      "firstSession.timeToFirstGroupSeconds",
    );
  oneOf(
    file,
    value.firstSession.firstAttemptOutcome,
    ["win", "loss", "abandon", "not-started"],
    "firstSession.firstAttemptOutcome",
  );
  if (value.firstSession.mistakesUsed !== null)
    boundedInteger(file, value.firstSession.mistakesUsed, 0, 4, "firstSession.mistakesUsed");
  boolean(file, value.firstSession.resultReached, "firstSession.resultReached");
  exact(
    file,
    value.firstSession.interventions,
    ["navigation", "ruleClarification", "answerHelp", "technicalRecovery"],
    "firstSession.interventions",
  );
  Object.entries(value.firstSession.interventions).forEach(([key, count]) =>
    boundedInteger(file, count, 0, 20, `firstSession.interventions.${key}`),
  );
  if (
    (value.firstSession.firstGroupIndependent === true) !==
    (value.firstSession.timeToFirstGroupSeconds !== null)
  )
    fail(file, "only an independently solved first group may have a measured duration");
  if (
    value.firstSession.interventions.answerHelp > 0 &&
    value.firstSession.firstGroupIndependent === true
  )
    fail(file, "answer-level help excludes independent first-group success");
  if (
    ["win", "loss"].includes(value.firstSession.firstAttemptOutcome) !==
    value.firstSession.resultReached
  )
    fail(file, "first attempt outcome/resultReached mismatch");
  if (
    value.flow.firstSessionStarted ===
    (value.firstSession.firstAttemptOutcome === "not-started")
  )
    fail(file, "first-session flow/outcome mismatch");

  exact(
    file,
    value.resultActions,
    [
      "retryStartedAfterLoss",
      "retryOutcome",
      "differentBoardAvailable",
      "differentBoardStarted",
      "previousResult",
    ],
    "resultActions",
  );
  boolean(
    file,
    value.resultActions.retryStartedAfterLoss,
    "resultActions.retryStartedAfterLoss",
  );
  oneOf(
    file,
    value.resultActions.retryOutcome,
    ["win", "loss", "abandon", "not-started"],
    "resultActions.retryOutcome",
  );
  boolean(
    file,
    value.resultActions.differentBoardAvailable,
    "resultActions.differentBoardAvailable",
  );
  boolean(
    file,
    value.resultActions.differentBoardStarted,
    "resultActions.differentBoardStarted",
  );
  oneOf(
    file,
    value.resultActions.previousResult,
    ["win", "loss", "none"],
    "resultActions.previousResult",
  );
  if (value.resultActions.differentBoardStarted && !value.resultActions.differentBoardAvailable)
    fail(file, "different board cannot start when unavailable");
  if (
    value.resultActions.retryStartedAfterLoss ===
    (value.resultActions.retryOutcome === "not-started")
  )
    fail(file, "retry start/outcome mismatch");
  if (
    value.resultActions.retryStartedAfterLoss &&
    value.firstSession.firstAttemptOutcome !== "loss"
  )
    fail(file, "retry after loss requires a first-attempt loss");

  exact(file, value.wink, ["shown", "understanding", "used"], "wink");
  boolean(file, value.wink.shown, "wink.shown");
  oneOf(
    file,
    value.wink.understanding,
    ["correct", "partial", "incorrect", "not-asked"],
    "wink.understanding",
  );
  boolean(file, value.wink.used, "wink.used");
  if (!value.wink.shown && (value.wink.used || value.wink.understanding !== "not-asked"))
    fail(file, "unshown Wink cannot be used or assessed");

  exact(file, value.share, ["started", "outcome"], "share");
  boolean(file, value.share.started, "share.started");
  oneOf(
    file,
    value.share.outcome,
    ["completed", "cancelled", "failed", "not-started"],
    "share.outcome",
  );
  if (value.share.started !== (value.share.outcome !== "not-started"))
    fail(file, "share started/outcome mismatch");

  exact(file, value.export, ["status", "fieldsMatch", "privacyInspectionPassed"], "export");
  oneOf(
    file,
    value.export.status,
    ["declined", "provided-invalid", "provided-valid", "not-offered"],
    "export.status",
  );
  nullableBoolean(file, value.export.fieldsMatch, "export.fieldsMatch");
  nullableBoolean(file, value.export.privacyInspectionPassed, "export.privacyInspectionPassed");
  if (
    ["provided-valid", "provided-invalid"].includes(value.export.status) !==
    value.flow.exportProvided
  )
    fail(file, "provided export/flow mismatch");
  if ((value.export.status !== "not-offered") !== value.flow.exportOffered)
    fail(file, "export offered/status mismatch");
  if (
    value.export.status === "provided-valid" &&
    (value.export.fieldsMatch !== true || value.export.privacyInspectionPassed !== true)
  )
    fail(file, "valid export needs both inspections to pass");
  if (
    ["declined", "not-offered"].includes(value.export.status) &&
    (value.export.fieldsMatch !== null || value.export.privacyInspectionPassed !== null)
  )
    fail(file, "missing export cannot have inspection results");

  exact(file, value.returns, ["d0Qualified", "d0LocalDate", "d1", "d7"], "returns");
  boolean(file, value.returns.d0Qualified, "returns.d0Qualified");
  if (
    value.returns.d0Qualified
      ? !DATE.test(value.returns.d0LocalDate)
      : value.returns.d0LocalDate !== null
  ) {
    fail(file, "returns.d0LocalDate must exist only for qualified D0");
  }
  if (value.returns.d0Qualified && (!value.flow.consented || !value.flow.firstSessionStarted)) {
    fail(file, "qualified D0 requires consent and a started first session");
  }
  validateReturn(
    file,
    value.returns.d1,
    "returns.d1",
    value.cohort.acquisition,
    value.returns.d0Qualified,
  );
  validateReturn(
    file,
    value.returns.d7,
    "returns.d7",
    value.cohort.acquisition,
    value.returns.d0Qualified,
  );
  if (
    value.returns.d0Qualified &&
    value.returns.d1.targetDate !== addUtcDays(value.returns.d0LocalDate, 1)
  )
    fail(file, "returns.d1.targetDate must equal D0 + 1");
  if (
    value.returns.d0Qualified &&
    value.returns.d7.targetDate !== addUtcDays(value.returns.d0LocalDate, 7)
  )
    fail(file, "returns.d7.targetDate must equal D0 + 7");
  if (!Array.isArray(value.issues)) fail(file, "issues must be an array");
  value.issues.forEach((issue, index) => validateIssue(file, issue, index));
  return value;
}

async function collect(inputs) {
  const files = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    const info = await stat(resolved);
    if (info.isDirectory()) {
      const names = await readdir(resolved);
      files.push(
        ...names
          .filter((name) => name.toLowerCase().endsWith(".json"))
          .map((name) => path.join(resolved, name)),
      );
    } else if (info.isFile()) files.push(resolved);
  }
  return [...new Set(files)].sort();
}

function ratio(numerator, denominator) {
  return {
    numerator,
    denominator,
    percent: denominator === 0 ? null : Number(((numerator / denominator) * 100).toFixed(1)),
  };
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(fraction * sorted.length) - 1];
}

function countBy(values, getter) {
  const result = {};
  for (const value of values) {
    const key = getter(value);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function summarizeWindow(values, window) {
  const cohort = values.filter((value) => value.returns.d0Qualified);
  const eligible = cohort.filter((value) => value.returns[window].windowComplete);
  const returned = eligible.filter((value) => value.returns[window].qualifiedReturn === true);
  return {
    overall: ratio(returned.length, eligible.length),
    byLocale: Object.fromEntries(
      Object.keys(TARGETS).map((locale) => {
        const group = eligible.filter((value) => value.locale === locale);
        return [
          locale,
          ratio(
            group.filter((value) => value.returns[window].qualifiedReturn === true).length,
            group.length,
          ),
        ];
      }),
    ),
    byAcquisition: Object.fromEntries(
      ["organic", "invited"].map((acquisition) => {
        const group = eligible.filter((value) => value.cohort.acquisition === acquisition);
        return [
          acquisition,
          ratio(
            group.filter((value) => value.returns[window].qualifiedReturn === true).length,
            group.length,
          ),
        ];
      }),
    ),
    cohort: cohort.length,
    incompleteWindows: cohort.length - eligible.length,
  };
}

function summarizeBehavior(values) {
  const terminal = values.filter((value) =>
    ["win", "loss"].includes(value.firstSession.firstAttemptOutcome),
  );
  const nextAvailable = values.filter((value) => value.resultActions.differentBoardAvailable);
  const winkShown = values.filter((value) => value.wink.shown);
  const shareStarted = values.filter((value) => value.share.started);
  return {
    n: values.length,
    onboardingCompletion: ratio(
      values.filter((value) => value.onboarding.outcome === "completed").length,
      values.filter((value) => value.onboarding.started).length,
    ),
    firstGroupSuccess: ratio(
      values.filter((value) => value.firstSession.firstGroupIndependent === true).length,
      values.filter((value) => value.flow.firstSessionStarted).length,
    ),
    firstBoardWin: ratio(
      terminal.filter((value) => value.firstSession.firstAttemptOutcome === "win").length,
      terminal.length,
    ),
    voluntaryNext: ratio(
      nextAvailable.filter((value) => value.resultActions.differentBoardStarted).length,
      nextAvailable.length,
    ),
    winkUnderstanding: ratio(
      winkShown.filter((value) => value.wink.understanding === "correct").length,
      winkShown.length,
    ),
    shareCompletion: ratio(
      shareStarted.filter((value) => value.share.outcome === "completed").length,
      shareStarted.length,
    ),
  };
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error(
    "Usage: npm run pilot:summarize-observations -- <observation.json|directory> [...]",
  );
  process.exitCode = 2;
} else {
  const files = await collect(inputs);
  const accepted = [];
  const rejected = [];
  const codes = new Set();
  for (const [index, file] of files.entries()) {
    try {
      const info = await stat(file);
      if (info.size > MAX_BYTES) fail(file, `file exceeds ${MAX_BYTES} bytes`);
      const value = validate(file, JSON.parse(await readFile(file, "utf8")));
      if (codes.has(value.studyCode)) fail(file, `duplicate studyCode ${value.studyCode}`);
      codes.add(value.studyCode);
      accepted.push(value);
    } catch (error) {
      rejected.push({
        source: path.basename(file),
        ordinal: index + 1,
        error: error?.message ?? String(error),
      });
    }
  }

  const flowKeys = [
    "recruited",
    "consented",
    "appOpened",
    "firstSessionStarted",
    "usableObservation",
    "exportOffered",
    "exportProvided",
  ];
  const usable = accepted.filter((value) => value.flow.usableObservation);
  const d0Cohort = accepted.filter((value) => value.returns.d0Qualified);
  const terminal = usable.filter((value) =>
    ["win", "loss"].includes(value.firstSession.firstAttemptOutcome),
  );
  const firstGroupTimes = usable
    .map((value) => value.firstSession.timeToFirstGroupSeconds)
    .filter(Number.isFinite);
  const retryStarted = usable.filter((value) => value.resultActions.retryStartedAfterLoss);
  const nextAvailable = usable.filter((value) => value.resultActions.differentBoardAvailable);
  const winkShown = usable.filter((value) => value.wink.shown);
  const shareStarted = usable.filter((value) => value.share.started);
  const unresolvedCritical = accepted
    .flatMap((value) => value.issues.map((issue) => ({ studyCode: value.studyCode, ...issue })))
    .filter(
      (issue) => ["P0", "P1"].includes(issue.severity) && issue.retestStatus !== "passed",
    );
  const localeUsable = countBy(usable, (value) => value.locale);

  const summary = {
    schema: "foldwink-pilot-observation-summary-v1",
    files: files.length,
    accepted: accepted.length,
    rejected: rejected.length,
    rejections: rejected,
    flow: {
      ...Object.fromEntries(
        flowKeys.map((key) => [key, accepted.filter((value) => value.flow[key]).length]),
      ),
      d0Qualified: d0Cohort.length,
    },
    recruitmentTarget: {
      total: { actual: usable.length, target: 26, remaining: Math.max(0, 26 - usable.length) },
      byLocale: Object.fromEntries(
        Object.entries(TARGETS).map(([locale, target]) => [
          locale,
          {
            actual: localeUsable[locale] ?? 0,
            target,
            remaining: Math.max(0, target - (localeUsable[locale] ?? 0)),
          },
        ]),
      ),
    },
    coverage: {
      deviceClass: countBy(usable, (value) => value.cohort.deviceClass),
      osFamily: countBy(usable, (value) => value.cohort.osFamily),
      launchMode: countBy(usable, (value) => value.cohort.launchMode),
      accessibilityRequested: usable.filter((value) => value.cohort.accessibility !== "none")
        .length,
      boardExposure: countBy(
        usable,
        (value) => `${value.firstSession.boardId}|${value.firstSession.contentVersion}`,
      ),
    },
    metrics: {
      onboardingCompletion: ratio(
        usable.filter((value) => value.onboarding.outcome === "completed").length,
        usable.filter((value) => value.onboarding.started).length,
      ),
      firstGroupSuccess: ratio(
        usable.filter((value) => value.firstSession.firstGroupIndependent === true).length,
        usable.filter((value) => value.flow.firstSessionStarted).length,
      ),
      firstGroupTimeSeconds: {
        n: firstGroupTimes.length,
        median: percentile(firstGroupTimes, 0.5),
        p75: percentile(firstGroupTimes, 0.75),
      },
      firstBoardWin: {
        ...ratio(
          terminal.filter((value) => value.firstSession.firstAttemptOutcome === "win").length,
          terminal.length,
        ),
        starts: usable.filter((value) => value.flow.firstSessionStarted).length,
        abandons: usable.filter((value) => value.firstSession.firstAttemptOutcome === "abandon")
          .length,
      },
      retryRecovery: ratio(
        retryStarted.filter((value) => value.resultActions.retryOutcome === "win").length,
        retryStarted.length,
      ),
      voluntaryNext: ratio(
        nextAvailable.filter((value) => value.resultActions.differentBoardStarted).length,
        nextAvailable.length,
      ),
      winkUnderstanding: {
        ...ratio(
          winkShown.filter((value) => value.wink.understanding === "correct").length,
          winkShown.length,
        ),
        used: winkShown.filter((value) => value.wink.used).length,
      },
      shareCompletion: {
        ...ratio(
          shareStarted.filter((value) => value.share.outcome === "completed").length,
          shareStarted.length,
        ),
        cancelled: shareStarted.filter((value) => value.share.outcome === "cancelled").length,
        failed: shareStarted.filter((value) => value.share.outcome === "failed").length,
      },
      d1: summarizeWindow(accepted, "d1"),
      d7: summarizeWindow(accepted, "d7"),
    },
    behaviorBreakdown: {
      byLocale: Object.fromEntries(
        Object.keys(TARGETS).map((locale) => [
          locale,
          summarizeBehavior(usable.filter((value) => value.locale === locale)),
        ]),
      ),
      byAcquisition: Object.fromEntries(
        ["organic", "invited"].map((acquisition) => [
          acquisition,
          summarizeBehavior(usable.filter((value) => value.cohort.acquisition === acquisition)),
        ]),
      ),
    },
    issues: {
      total: accepted.reduce((sum, value) => sum + value.issues.length, 0),
      bySeverity: countBy(
        accepted.flatMap((value) => value.issues),
        (issue) => issue.severity,
      ),
      unresolvedP0P1: unresolvedCritical,
    },
    releaseGate: {
      physicalMobileEvidenceRequired: true,
      participantTargetMet: usable.length >= 20 && usable.length <= 30,
      localeTargetsMet: Object.entries(TARGETS).every(
        ([locale, target]) => (localeUsable[locale] ?? 0) >= target,
      ),
      accessibilityTargetMet:
        usable.filter((value) => value.cohort.accessibility !== "none").length >= 2,
      d1Complete:
        d0Cohort.length >= 20 && d0Cohort.every((value) => value.returns.d1.windowComplete),
      d7Complete:
        d0Cohort.length >= 20 && d0Cohort.every((value) => value.returns.d7.windowComplete),
      noUnresolvedP0P1: unresolvedCritical.length === 0,
    },
  };
  console.log(JSON.stringify(summary, null, 2));
  if (rejected.length > 0) process.exitCode = 1;
}
