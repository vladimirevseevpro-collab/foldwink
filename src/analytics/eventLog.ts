import type { Lang } from "../i18n/strings";
import { getRuntimeContentVersion } from "../puzzles/byLang";
import { APP_VERSION } from "../appVersion";

declare global {
  interface Window {
    __FOLDWINK_CONFIG__?: {
      umamiWebsiteId?: string;
      umamiScriptUrl?: string;
      koFiHandle?: string;
      supporterCheckoutUrl?: string;
    };
    umami?: {
      track?: (eventName: string, payload?: Record<string, string>) => void;
    };
  }
}

export type ConsentStatus = "unknown" | "granted" | "denied";
export type AnalyticsSurface =
  | "app"
  | "menu"
  | "stats"
  | "onboarding"
  | "game"
  | "result"
  | "privacy_prompt"
  | "privacy_dialog";
export type AnalyticsMode = "daily" | "standard" | "zen";
export type AnalyticsDifficulty = "easy" | "medium" | "hard";
export type AnalyticsOutcome =
  | "correct"
  | "incorrect"
  | "repeat"
  | "one_away"
  | "win"
  | "loss"
  | "complete"
  | "skip"
  | "granted"
  | "denied"
  | "accepted"
  | "dismissed";
export type AnalyticsChannel = "tip_jar" | "supporter";
export type AnalyticsSourceBucket =
  | "direct"
  | "social"
  | "video"
  | "embed"
  | "search"
  | "campaign"
  | "other";
export type SupportFlag = "yes" | "no";
export const ANALYTICS_EVENT_SCHEMA_VERSION = "ops-06-v1" as const;
export const ANALYTICS_APP_VERSION = APP_VERSION;
export const ANALYTICS_POLICY_VERSION = "privacy-v1" as const;
export const ANALYTICS_BALANCE_VERSION = "balance-2026-09-v1" as const;

export type FoldwinkAnalyticsEvent =
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_skipped"
  | "attempt_started"
  | "first_group_solved"
  | "attempt_completed"
  | "attempt_abandoned"
  | "next_puzzle_started"
  | "reward_presented"
  | "share_started"
  | "share_completed"
  | "share_cancelled"
  | "board_feedback_recorded"
  | "return_observed"
  | "app_open"
  | "menu_view"
  | "stats_view"
  | "onboarding_complete"
  | "onboarding_skip"
  | "mode_start"
  | "round_submit"
  | "round_finish"
  | "wink_used"
  | "share_clicked"
  | "tip_opened"
  | "supporter_checkout_opened"
  | "supporter_return_success"
  | "privacy_choice"
  | "pwa_install_choice";

const ALL_EVENT_NAMES = [
  "onboarding_started",
  "onboarding_step_completed",
  "onboarding_skipped",
  "attempt_started",
  "first_group_solved",
  "attempt_completed",
  "attempt_abandoned",
  "next_puzzle_started",
  "reward_presented",
  "share_started",
  "share_completed",
  "share_cancelled",
  "board_feedback_recorded",
  "return_observed",
  "app_open",
  "menu_view",
  "stats_view",
  "onboarding_complete",
  "onboarding_skip",
  "mode_start",
  "round_submit",
  "round_finish",
  "wink_used",
  "share_clicked",
  "tip_opened",
  "supporter_checkout_opened",
  "supporter_return_success",
  "privacy_choice",
  "pwa_install_choice",
] as const satisfies readonly FoldwinkAnalyticsEvent[];
const EVENT_NAME_SET = new Set<FoldwinkAnalyticsEvent>(ALL_EVENT_NAMES);

type CoarsePropertyValues = {
  surface: AnalyticsSurface;
  mode: AnalyticsMode;
  difficulty: AnalyticsDifficulty;
  outcome: AnalyticsOutcome;
  channel: AnalyticsChannel;
  source_bucket: AnalyticsSourceBucket;
  has_support_flag: SupportFlag;
  lang: Lang;
  context: "menu" | "game" | "result" | "onboarding" | "about";
  tier: "easy" | "medium" | "hard";
  duration_bucket: "under-1m" | "1-3m" | "3-5m" | "over-5m";
  first_attempt: "yes" | "no";
  event_schema: typeof ANALYTICS_EVENT_SCHEMA_VERSION;
  app_version: typeof ANALYTICS_APP_VERSION;
  policy_version: typeof ANALYTICS_POLICY_VERSION;
  balance_version: typeof ANALYTICS_BALANCE_VERSION;
  content_version: string;
};

export type AnalyticsProperties = Partial<CoarsePropertyValues>;

type EventProperties = {
  app_open: Pick<
    AnalyticsProperties,
    "surface" | "source_bucket" | "has_support_flag" | "lang"
  >;
  menu_view: Pick<AnalyticsProperties, "surface" | "has_support_flag" | "lang">;
  stats_view: Pick<AnalyticsProperties, "surface" | "has_support_flag" | "lang">;
  onboarding_complete: Pick<AnalyticsProperties, "surface" | "lang" | "outcome">;
  onboarding_skip: Pick<AnalyticsProperties, "surface" | "lang" | "outcome">;
  mode_start: Pick<AnalyticsProperties, "surface" | "mode" | "difficulty" | "lang">;
  round_submit: Pick<
    AnalyticsProperties,
    "surface" | "mode" | "difficulty" | "outcome" | "lang"
  >;
  round_finish: Pick<
    AnalyticsProperties,
    "surface" | "mode" | "difficulty" | "outcome" | "has_support_flag" | "lang"
  >;
  wink_used: Pick<AnalyticsProperties, "surface" | "mode" | "difficulty" | "lang">;
  share_clicked: Pick<AnalyticsProperties, "surface" | "mode" | "difficulty" | "lang">;
  tip_opened: Pick<
    AnalyticsProperties,
    "surface" | "channel" | "source_bucket" | "has_support_flag" | "lang"
  >;
  supporter_checkout_opened: Pick<
    AnalyticsProperties,
    "surface" | "channel" | "source_bucket" | "has_support_flag" | "lang"
  >;
  supporter_return_success: Pick<
    AnalyticsProperties,
    "surface" | "channel" | "has_support_flag" | "lang"
  >;
  privacy_choice: Pick<AnalyticsProperties, "surface" | "outcome" | "lang">;
  pwa_install_choice: Pick<AnalyticsProperties, "surface" | "outcome" | "lang">;
  onboarding_started: Pick<AnalyticsProperties, "surface" | "context" | "lang">;
  onboarding_step_completed: Pick<AnalyticsProperties, "surface" | "context" | "lang">;
  onboarding_skipped: Pick<AnalyticsProperties, "surface" | "context" | "outcome" | "lang">;
  attempt_started: Pick<
    AnalyticsProperties,
    "surface" | "context" | "mode" | "tier" | "difficulty" | "first_attempt" | "lang"
  >;
  first_group_solved: Pick<
    AnalyticsProperties,
    | "surface"
    | "context"
    | "mode"
    | "tier"
    | "difficulty"
    | "duration_bucket"
    | "first_attempt"
    | "lang"
  >;
  attempt_completed: Pick<
    AnalyticsProperties,
    | "surface"
    | "context"
    | "mode"
    | "tier"
    | "difficulty"
    | "duration_bucket"
    | "first_attempt"
    | "outcome"
    | "lang"
  >;
  attempt_abandoned: Pick<
    AnalyticsProperties,
    | "surface"
    | "context"
    | "mode"
    | "tier"
    | "difficulty"
    | "duration_bucket"
    | "first_attempt"
    | "lang"
  >;
  next_puzzle_started: Pick<
    AnalyticsProperties,
    "surface" | "context" | "mode" | "tier" | "difficulty" | "outcome" | "lang"
  >;
  reward_presented: Pick<
    AnalyticsProperties,
    "surface" | "context" | "mode" | "tier" | "difficulty" | "lang"
  >;
  share_started: Pick<AnalyticsProperties, "surface" | "context" | "lang">;
  share_completed: Pick<AnalyticsProperties, "surface" | "context" | "lang">;
  share_cancelled: Pick<AnalyticsProperties, "surface" | "context" | "lang">;
  board_feedback_recorded: Pick<AnalyticsProperties, "surface" | "outcome" | "lang">;
  return_observed: Pick<AnalyticsProperties, "surface" | "context" | "source_bucket" | "lang">;
};

export type TrackableEvent<E extends FoldwinkAnalyticsEvent = FoldwinkAnalyticsEvent> = {
  name: E;
  props?: EventProperties[E];
};

interface AnalyticsConfig {
  websiteId: string | null;
  scriptUrl: string | null;
}

interface StoredConsentState {
  version: number;
  status: ConsentStatus;
}

const EVENT_LOG_STORAGE_KEY = "foldwink:analytics:events:v2";
const EVENT_LOG_BUCKET_PREFIX = "foldwink:analytics:event-bucket:v2:";
const CONSENT_STORAGE_KEY = "foldwink:analytics:consent:v1";
const CONSENT_VERSION = 1;
const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

const allowedProperties: {
  [K in keyof CoarsePropertyValues]: ReadonlySet<CoarsePropertyValues[K]>;
} = {
  surface: new Set([
    "app",
    "menu",
    "stats",
    "onboarding",
    "game",
    "result",
    "privacy_prompt",
    "privacy_dialog",
  ]),
  mode: new Set(["daily", "standard", "zen"]),
  difficulty: new Set(["easy", "medium", "hard"]),
  outcome: new Set([
    "correct",
    "incorrect",
    "repeat",
    "one_away",
    "win",
    "loss",
    "complete",
    "skip",
    "granted",
    "denied",
    "accepted",
    "dismissed",
  ]),
  channel: new Set(["tip_jar", "supporter"]),
  source_bucket: new Set(["direct", "social", "video", "embed", "search", "campaign", "other"]),
  has_support_flag: new Set(["yes", "no"]),
  lang: new Set(["en", "de", "ru"]),
  context: new Set(["menu", "game", "result", "onboarding", "about"]),
  tier: new Set(["easy", "medium", "hard"]),
  duration_bucket: new Set(["under-1m", "1-3m", "3-5m", "over-5m"]),
  first_attempt: new Set(["yes", "no"]),
  event_schema: new Set([ANALYTICS_EVENT_SCHEMA_VERSION]),
  app_version: new Set([ANALYTICS_APP_VERSION]),
  policy_version: new Set([ANALYTICS_POLICY_VERSION]),
  balance_version: new Set([ANALYTICS_BALANCE_VERSION]),
  content_version: new Set<string>(),
};

const OPS_06_EVENTS = new Set<FoldwinkAnalyticsEvent>([
  "onboarding_started",
  "onboarding_step_completed",
  "onboarding_skipped",
  "attempt_started",
  "first_group_solved",
  "attempt_completed",
  "attempt_abandoned",
  "next_puzzle_started",
  "reward_presented",
  "share_started",
  "share_completed",
  "share_cancelled",
  "board_feedback_recorded",
  "return_observed",
  "onboarding_complete",
]);

let scriptPromise: Promise<void> | null = null;

export type EventCounts = Partial<Record<FoldwinkAnalyticsEvent, number>>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveAnalyticsConfig(
  env: Record<string, string | undefined> = import.meta.env,
  runtime: Window["__FOLDWINK_CONFIG__"] | undefined = typeof window !== "undefined"
    ? window.__FOLDWINK_CONFIG__
    : undefined,
): AnalyticsConfig {
  const websiteId = cleanText(runtime?.umamiWebsiteId) ?? cleanText(env.VITE_UMAMI_WEBSITE_ID);
  const runtimeScript = cleanText(runtime?.umamiScriptUrl);
  const envScript = cleanText(env.VITE_UMAMI_SCRIPT_URL);
  const scriptCandidate = runtimeScript ?? envScript ?? DEFAULT_UMAMI_SCRIPT_URL;

  return {
    websiteId,
    scriptUrl: websiteId && isHttpsUrl(scriptCandidate) ? scriptCandidate : null,
  };
}

export function isAnalyticsConfigured(config = resolveAnalyticsConfig()): boolean {
  return !!config.websiteId;
}

function safeReadCounts(): EventCounts {
  if (!isBrowser()) return {};
  try {
    const merged = sanitizeCountRecord(localStorage.getItem(EVENT_LOG_STORAGE_KEY));
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(EVENT_LOG_BUCKET_PREFIX)) continue;
      const bucket = sanitizeCountRecord(localStorage.getItem(key));
      for (const [name, count] of Object.entries(bucket) as Array<
        [FoldwinkAnalyticsEvent, number]
      >) {
        merged[name] = (merged[name] ?? 0) + count;
      }
    }
    return merged;
  } catch {
    return {};
  }
}

function sanitizeCountRecord(raw: string | null): EventCounts {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: EventCounts = {};
    for (const [name, count] of Object.entries(parsed)) {
      if (!EVENT_NAME_SET.has(name as FoldwinkAnalyticsEvent)) continue;
      if (!Number.isSafeInteger(count) || (count as number) < 0) continue;
      result[name as FoldwinkAnalyticsEvent] = count as number;
    }
    return result;
  } catch {
    return {};
  }
}

let eventBucketKey: string | null = null;

function currentEventBucketKey(): string {
  if (eventBucketKey) return eventBucketKey;
  const token = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  eventBucketKey = `${EVENT_LOG_BUCKET_PREFIX}${token}`;
  return eventBucketKey;
}

function incrementLocalCount(eventName: FoldwinkAnalyticsEvent): void {
  if (!isBrowser()) return;
  try {
    // Each page instance owns one bucket, so simultaneous tabs never perform
    // a read-modify-write against the same localStorage value.
    const key = currentEventBucketKey();
    const bucket = sanitizeCountRecord(localStorage.getItem(key));
    bucket[eventName] = (bucket[eventName] ?? 0) + 1;
    localStorage.setItem(key, JSON.stringify(bucket));
  } catch {
    /* Coarse research counts are optional and must never affect play. */
  }
}

function sanitizeProperties(
  props: AnalyticsProperties | undefined,
): Record<string, string> | undefined {
  if (!props) return undefined;
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(props) as Array<
    [keyof CoarsePropertyValues, CoarsePropertyValues[keyof CoarsePropertyValues] | undefined]
  >) {
    if (!value) continue;
    if (!(key in allowedProperties)) continue;
    if (key === "content_version") {
      if (/^[a-zA-Z0-9._:-]{1,120}$/u.test(value)) sanitized[key] = value;
      continue;
    }
    const allowed = allowedProperties[key] as ReadonlySet<string>;
    if (allowed.has(value)) sanitized[key] = value;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function safeReadConsent(): StoredConsentState {
  if (!isBrowser()) return { version: CONSENT_VERSION, status: "unknown" };
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return { version: CONSENT_VERSION, status: "unknown" };
    const parsed = JSON.parse(raw) as Partial<StoredConsentState>;
    if (parsed?.version !== CONSENT_VERSION)
      return { version: CONSENT_VERSION, status: "unknown" };
    if (
      parsed.status === "granted" ||
      parsed.status === "denied" ||
      parsed.status === "unknown"
    ) {
      return { version: CONSENT_VERSION, status: parsed.status };
    }
  } catch {
    /* ignore */
  }
  return { version: CONSENT_VERSION, status: "unknown" };
}

function safeWriteConsent(status: ConsentStatus): void {
  if (!isBrowser()) return;
  try {
    const state: StoredConsentState = { version: CONSENT_VERSION, status };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function ensureUmamiScript(config = resolveAnalyticsConfig()): Promise<void> {
  if (!config.websiteId || !config.scriptUrl || typeof document === "undefined") {
    return Promise.resolve();
  }
  const websiteId = config.websiteId;
  const scriptUrl = config.scriptUrl;
  if (typeof window !== "undefined" && window.umami?.track) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-foldwink-analytics="umami"]',
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = scriptUrl;
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute("data-auto-track", "false");
    script.setAttribute("data-do-not-track", "true");
    script.setAttribute("data-exclude-search", "true");
    script.setAttribute("data-exclude-hash", "true");
    script.setAttribute("data-foldwink-analytics", "umami");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function removeAnalyticsScript(): void {
  if (typeof document === "undefined") return;
  try {
    document
      .querySelector<HTMLScriptElement>('script[data-foldwink-analytics="umami"]')
      ?.remove();
  } catch {
    /* best effort; the event gate below remains authoritative */
  }
  if (typeof window !== "undefined") {
    try {
      delete window.umami;
    } catch {
      // The explicit consent/online gate remains the no-send authority even
      // in hosts where a global property cannot be deleted.
      window.umami = undefined;
    }
  }
  scriptPromise = null;
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function getConsentStatus(): ConsentStatus {
  return safeReadConsent().status;
}

export async function setConsentStatus(status: ConsentStatus): Promise<void> {
  safeWriteConsent(status);
  if (status !== "granted") {
    // We never maintain a network queue. Removing our loader also avoids
    // leaving a third-party SDK around to buffer a later replay after revoke.
    removeAnalyticsScript();
  }
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("foldwink:privacy-consent-changed", { detail: status }),
    );
  }
  if (status === "granted" && isAnalyticsConfigured() && isOnline()) {
    await ensureUmamiScript();
  }
}

export async function bootstrapAnalytics(): Promise<void> {
  if (!isAnalyticsConfigured()) return;
  if (getConsentStatus() !== "granted") return;
  if (!isOnline()) return;
  await ensureUmamiScript();
}

export function getEventCounts(): EventCounts {
  return safeReadCounts();
}

export function clearEventLog(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(EVENT_LOG_STORAGE_KEY);
    const bucketKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(EVENT_LOG_BUCKET_PREFIX)) bucketKeys.push(key);
    }
    bucketKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export function bucketSource(
  input:
    | {
        source?: string | null;
        medium?: string | null;
      }
    | null
    | undefined,
): AnalyticsSourceBucket {
  const source = cleanText(input?.source)?.toLowerCase() ?? "";
  const medium = cleanText(input?.medium)?.toLowerCase() ?? "";
  const combined = `${source} ${medium}`.trim();
  if (!combined) return "direct";
  if (/\b(itch|embed|iframe)\b/.test(combined)) return "embed";
  if (/\b(tiktok|youtube|instagram|reels|shorts)\b/.test(combined)) return "video";
  if (/\b(facebook|reddit|x|twitter|social)\b/.test(combined)) return "social";
  if (/\b(google|bing|duckduckgo|search)\b/.test(combined)) return "search";
  if (source || medium) return "campaign";
  return "other";
}

export function trackEvent<E extends FoldwinkAnalyticsEvent>({
  name,
  props,
}: TrackableEvent<E>): void {
  incrementLocalCount(name);

  if (!isAnalyticsConfigured()) return;
  if (getConsentStatus() !== "granted") return;
  // Do not hand an event to a third-party SDK while offline: some SDKs queue
  // their own retries, which would turn an offline action into hidden replay.
  if (!isOnline()) return;

  const payload = sanitizeProperties(
    OPS_06_EVENTS.has(name)
      ? {
          ...props,
          event_schema: ANALYTICS_EVENT_SCHEMA_VERSION,
          app_version: ANALYTICS_APP_VERSION,
          policy_version: ANALYTICS_POLICY_VERSION,
          balance_version: ANALYTICS_BALANCE_VERSION,
          content_version: props?.lang ? getRuntimeContentVersion(props.lang) : undefined,
        }
      : props,
  );
  try {
    window.umami?.track?.(name, payload);
  } catch {
    /* ignore */
  }
}
