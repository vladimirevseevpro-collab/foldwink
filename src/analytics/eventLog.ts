import type { Lang } from "../i18n/strings";

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

export type FoldwinkAnalyticsEvent =
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

type CoarsePropertyValues = {
  surface: AnalyticsSurface;
  mode: AnalyticsMode;
  difficulty: AnalyticsDifficulty;
  outcome: AnalyticsOutcome;
  channel: AnalyticsChannel;
  source_bucket: AnalyticsSourceBucket;
  has_support_flag: SupportFlag;
  lang: Lang;
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
  mode: new Set(["daily", "standard"]),
  difficulty: new Set(["easy", "medium", "hard"]),
  outcome: new Set([
    "correct",
    "incorrect",
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
};

let scriptPromise: Promise<void> | null = null;

type EventCounts = Partial<Record<FoldwinkAnalyticsEvent, number>>;

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
    const raw = localStorage.getItem(EVENT_LOG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EventCounts;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteCounts(counts: EventCounts): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(EVENT_LOG_STORAGE_KEY, JSON.stringify(counts));
  } catch {
    /* ignore */
  }
}

function incrementLocalCount(eventName: FoldwinkAnalyticsEvent): void {
  const counts = safeReadCounts();
  counts[eventName] = (counts[eventName] ?? 0) + 1;
  safeWriteCounts(counts);
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

export function getConsentStatus(): ConsentStatus {
  return safeReadConsent().status;
}

export async function setConsentStatus(status: ConsentStatus): Promise<void> {
  safeWriteConsent(status);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("foldwink:privacy-consent-changed", { detail: status }),
    );
  }
  if (status === "granted" && isAnalyticsConfigured()) {
    await ensureUmamiScript();
  }
}

export async function bootstrapAnalytics(): Promise<void> {
  if (!isAnalyticsConfigured()) return;
  if (getConsentStatus() !== "granted") return;
  await ensureUmamiScript();
}

export function getEventCounts(): EventCounts {
  return safeReadCounts();
}

export function clearEventLog(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(EVENT_LOG_STORAGE_KEY);
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

  const payload = sanitizeProperties(props);
  try {
    window.umami?.track?.(name, payload);
  } catch {
    /* ignore */
  }
}
