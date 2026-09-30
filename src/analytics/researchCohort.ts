import { BALANCE_POLICY } from "../game/config/balance";
import type { Lang } from "../i18n/strings";
import { getRuntimeContentVersion } from "../puzzles/byLang";
import { getFirstTouch } from "../monetization/attribution";
import { todayLocal } from "../utils/date";
import {
  ANALYTICS_EVENT_SCHEMA_VERSION,
  ANALYTICS_APP_VERSION,
  ANALYTICS_POLICY_VERSION,
  getConsentStatus,
  getEventCounts,
  type ConsentStatus,
  type EventCounts,
  type FoldwinkAnalyticsEvent,
} from "./eventLog";

/** Local-only, participant-free research ledger. Dates are deliberately day-level. */
export const RESEARCH_STORAGE_KEY = "foldwink:research:cohort:v1";
const RESEARCH_DAY_PREFIX = "foldwink:research:day:v1:";
const RESEARCH_FEEDBACK_PREFIX = "foldwink:research:feedback:v1:";
export const RESEARCH_VERSION = 1;
export const RESEARCH_EXPORT_SCHEMA = "foldwink-research-export-v1" as const;
export const RESEARCH_POLICY_VERSION = ANALYTICS_POLICY_VERSION;
export const FOLDWINK_APP_VERSION = ANALYTICS_APP_VERSION;

export type ResearchAcquisition = "organic" | "invited";
export type BoardFeedbackAnswer = "yes" | "no";

export interface StoredBoardFeedback {
  answer: BoardFeedbackAnswer;
  boardId?: string;
  contentVersion?: string;
  /** Local idempotency key only. It is never included in an export. */
  attemptKey?: string;
}

export interface ResearchState {
  version: 1;
  organicDays: string[];
  invitedDays: string[];
  completedDays: string[];
  firstQualifiedDay?: string;
  feedback: StoredBoardFeedback[];
}

export interface QualifiedDayRecord {
  state: ResearchState;
  isNewQualifiedDay: boolean;
  isReturnDay: boolean;
}

export interface BoardFeedbackRecord {
  state: ResearchState;
  recorded: boolean;
}

export interface ReturnObservation {
  eligible: boolean;
  observed: boolean;
  organic: boolean;
  invited: boolean;
}

const RESEARCH_EVENTS = [
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
] as const satisfies readonly FoldwinkAnalyticsEvent[];

type ResearchEventName = (typeof RESEARCH_EVENTS)[number];

const emptyState = (): ResearchState => ({
  version: RESEARCH_VERSION,
  organicDays: [],
  invitedDays: [],
  completedDays: [],
  feedback: [],
});

function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function safeToken(value: unknown, max = 120): string | undefined {
  return typeof value === "string" && value.length <= max && /^[a-zA-Z0-9._:-]+$/u.test(value)
    ? value
    : undefined;
}

function uniqueDays(values: unknown): string[] {
  return Array.isArray(values) ? [...new Set(values.filter(validDay))].sort() : [];
}

function dayNumber(day: string): number {
  return Date.UTC(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7)) - 1,
    Number(day.slice(8, 10)),
  );
}

function dayAtDistance(anchor: string, distance: number): string {
  return new Date(dayNumber(anchor) + distance * 86_400_000).toISOString().slice(0, 10);
}

export function migrateResearchState(input: unknown): ResearchState {
  if (!input || typeof input !== "object") return emptyState();
  const value = input as Partial<ResearchState> & {
    feedback?: Array<Partial<StoredBoardFeedback> & { unclear?: unknown }>;
  };
  const organicDays = uniqueDays(value.organicDays);
  const invitedDays = uniqueDays(value.invitedDays);
  const earliestQualifiedDay = [
    ...organicDays,
    ...invitedDays,
    ...(validDay(value.firstQualifiedDay) ? [value.firstQualifiedDay] : []),
  ].sort()[0];
  const feedback = Array.isArray(value.feedback)
    ? value.feedback
        .flatMap((item): StoredBoardFeedback[] => {
          if (!item || typeof item !== "object") return [];
          const legacyItem = item as Partial<StoredBoardFeedback> & { unclear?: unknown };
          const answer = legacyItem.answer ?? legacyItem.unclear;
          if (answer !== "yes" && answer !== "no") return [];
          const boardId = safeToken(legacyItem.boardId);
          const contentVersion = safeToken(legacyItem.contentVersion);
          const attemptKey = safeToken(legacyItem.attemptKey);
          return [
            {
              answer,
              ...(boardId ? { boardId } : {}),
              ...(contentVersion ? { contentVersion } : {}),
              ...(attemptKey ? { attemptKey } : {}),
            },
          ];
        })
        .slice(-100)
    : [];

  return {
    version: RESEARCH_VERSION,
    organicDays,
    invitedDays,
    completedDays: uniqueDays(value.completedDays),
    firstQualifiedDay: earliestQualifiedDay,
    feedback,
  };
}

export function loadResearchState(): ResearchState {
  if (typeof localStorage === "undefined") return emptyState();
  try {
    const legacy = migrateResearchState(
      JSON.parse(localStorage.getItem(RESEARCH_STORAGE_KEY) ?? "null"),
    );
    const organicDays = new Set(legacy.organicDays);
    const invitedDays = new Set(legacy.invitedDays);
    const completedDays = new Set(legacy.completedDays);
    const feedback = new Map<string, StoredBoardFeedback>();
    legacy.feedback.forEach((item) => {
      feedback.set(`${item.boardId ?? ""}|${item.attemptKey ?? ""}`, item);
    });

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key.startsWith(RESEARCH_DAY_PREFIX)) {
        const suffix = key.slice(RESEARCH_DAY_PREFIX.length);
        const match = /^(\d{4}-\d{2}-\d{2}):(organic|invited)$/u.exec(suffix);
        if (!match || !validDay(match[1])) continue;
        (match[2] === "organic" ? organicDays : invitedDays).add(match[1]);
        if (localStorage.getItem(key) === "completed") completedDays.add(match[1]);
      } else if (key.startsWith(RESEARCH_FEEDBACK_PREFIX)) {
        let item: StoredBoardFeedback | undefined;
        try {
          item = migrateResearchState({
            feedback: [JSON.parse(localStorage.getItem(key) ?? "null")],
          }).feedback[0];
        } catch {
          continue;
        }
        if (!item) continue;
        feedback.set(`${item.boardId ?? ""}|${item.attemptKey ?? ""}`, item);
      }
    }

    return migrateResearchState({
      organicDays: [...organicDays],
      invitedDays: [...invitedDays],
      completedDays: [...completedDays],
      firstQualifiedDay: legacy.firstQualifiedDay,
      feedback: [...feedback.values()],
    });
  } catch {
    return emptyState();
  }
}

export function saveResearchState(state: ResearchState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(migrateResearchState(state)));
  } catch {
    /* Local research data is optional; private browsing/quota must not affect play. */
  }
}

export function recordQualifiedDay(
  date: string,
  acquisition: ResearchAcquisition,
  completed = false,
): QualifiedDayRecord {
  const stateBefore = loadResearchState();
  if (!validDay(date))
    return { state: stateBefore, isNewQualifiedDay: false, isReturnDay: false };

  const allDaysBefore = new Set([...stateBefore.organicDays, ...stateBefore.invitedDays]);
  if (typeof localStorage !== "undefined") {
    try {
      const key = `${RESEARCH_DAY_PREFIX}${date}:${acquisition}`;
      localStorage.setItem(
        key,
        completed || localStorage.getItem(key) === "completed" ? "completed" : "qualified",
      );
    } catch {
      /* Optional research state must not affect play. */
    }
  }
  const state = loadResearchState();

  const isNewQualifiedDay = !allDaysBefore.has(date);
  return {
    state,
    isNewQualifiedDay,
    isReturnDay:
      isNewQualifiedDay && Boolean(state.firstQualifiedDay) && date !== state.firstQualifiedDay,
  };
}

export function recordBoardFeedback(
  answer: BoardFeedbackAnswer,
  boardId?: string,
  contentVersion?: string,
  attemptKey?: string,
): BoardFeedbackRecord {
  const state = loadResearchState();
  const safeBoard = safeToken(boardId);
  const safeContentVersion = safeToken(contentVersion);
  const safeAttempt = safeToken(attemptKey);
  const existing = state.feedback.find(
    (item) => item.boardId === safeBoard && item.attemptKey === safeAttempt,
  );
  if (existing) return { state, recorded: false };
  const item: StoredBoardFeedback = {
    answer,
    ...(safeBoard ? { boardId: safeBoard } : {}),
    ...(safeContentVersion ? { contentVersion: safeContentVersion } : {}),
    ...(safeAttempt ? { attemptKey: safeAttempt } : {}),
  };
  if (typeof localStorage !== "undefined") {
    try {
      const identity = encodeURIComponent(
        `${safeBoard ?? "board"}|${safeAttempt ?? "attempt"}`,
      );
      localStorage.setItem(`${RESEARCH_FEEDBACK_PREFIX}${identity}`, JSON.stringify(item));
    } catch {
      return { state, recorded: false };
    }
  }
  return { state: loadResearchState(), recorded: true };
}

/** Only an explicit pilot invite marker counts as invited acquisition. */
export function getResearchAcquisition(): ResearchAcquisition {
  const touch = getFirstTouch();
  const medium = typeof touch?.medium === "string" ? touch.medium.trim().toLowerCase() : "";
  return medium === "research_invite" ? "invited" : "organic";
}

function returnObservation(
  state: ResearchState,
  asOf: string,
  distance: 1 | 7,
): ReturnObservation {
  const d0 = state.firstQualifiedDay;
  if (!d0 || !validDay(asOf)) {
    return { eligible: false, observed: false, organic: false, invited: false };
  }
  // A participant enters the denominator only after the whole target local day has elapsed.
  const eligible = dayNumber(asOf) >= dayNumber(d0) + (distance + 1) * 86_400_000;
  const targetDay = dayAtDistance(d0, distance);
  const organic = eligible && state.organicDays.includes(targetDay);
  const invited = eligible && state.invitedDays.includes(targetDay);
  return { eligible, observed: organic || invited, organic, invited };
}

export interface ResearchExport {
  schema: typeof RESEARCH_EXPORT_SCHEMA;
  app: "foldwink";
  exported: "local-day-only";
  locale: Lang;
  consent: ConsentStatus;
  versions: {
    schema: 1;
    eventSchema: typeof ANALYTICS_EVENT_SCHEMA_VERSION;
    app: string;
    content: string;
    policy: typeof RESEARCH_POLICY_VERSION;
    balance: string;
  };
  acquisition: { organicDays: number; invitedDays: number };
  qualified: {
    d0Recorded: boolean;
    totalDays: number;
    completedDays: number;
    d1: ReturnObservation;
    d7: ReturnObservation;
  };
  events: Record<ResearchEventName, number>;
  boardFeedback: {
    yes: number;
    no: number;
    total: number;
    entries: Array<{ boardId?: string; contentVersion?: string; answer: BoardFeedbackAnswer }>;
  };
  unavailable: ["wink_understanding", "interview_notes", "facilitator_interventions"];
}

function researchEventCounts(counts: EventCounts): Record<ResearchEventName, number> {
  return Object.fromEntries(RESEARCH_EVENTS.map((name) => [name, counts[name] ?? 0])) as Record<
    ResearchEventName,
    number
  >;
}

export function buildResearchExport(
  state = loadResearchState(),
  options: {
    asOf?: string;
    counts?: EventCounts;
    contentVersion?: string;
    locale?: Lang;
    consent?: ConsentStatus;
  } = {},
): ResearchExport {
  const safe = migrateResearchState(state);
  const days = [...new Set([...safe.organicDays, ...safe.invitedDays])];
  const asOf = options.asOf ?? todayLocal();
  const counts = options.counts ?? getEventCounts();
  const safeContentVersion = safeToken(options.contentVersion) ?? "unknown";
  const events = researchEventCounts(counts);
  // The deduplicated feedback ledger is the authoritative denominator.
  events.board_feedback_recorded = safe.feedback.length;
  return {
    schema: RESEARCH_EXPORT_SCHEMA,
    app: "foldwink",
    exported: "local-day-only",
    locale: options.locale === "ru" || options.locale === "de" ? options.locale : "en",
    consent:
      options.consent === "granted" || options.consent === "denied"
        ? options.consent
        : "unknown",
    versions: {
      schema: RESEARCH_VERSION,
      eventSchema: ANALYTICS_EVENT_SCHEMA_VERSION,
      app: FOLDWINK_APP_VERSION,
      content: safeContentVersion,
      policy: RESEARCH_POLICY_VERSION,
      balance: BALANCE_POLICY.version,
    },
    acquisition: {
      organicDays: safe.organicDays.length,
      invitedDays: safe.invitedDays.length,
    },
    qualified: {
      d0Recorded: Boolean(safe.firstQualifiedDay),
      totalDays: days.length,
      completedDays: safe.completedDays.length,
      d1: returnObservation(safe, asOf, 1),
      d7: returnObservation(safe, asOf, 7),
    },
    events,
    boardFeedback: {
      yes: safe.feedback.filter((item) => item.answer === "yes").length,
      no: safe.feedback.filter((item) => item.answer === "no").length,
      total: safe.feedback.length,
      entries: safe.feedback.map(({ boardId, contentVersion: version, answer }) => ({
        ...(boardId ? { boardId } : {}),
        ...(version ? { contentVersion: version } : {}),
        answer,
      })),
    },
    unavailable: ["wink_understanding", "interview_notes", "facilitator_interventions"],
  };
}

export function downloadResearchExport(lang: Lang): void {
  if (typeof document === "undefined") return;
  const contentVersion = getRuntimeContentVersion(lang) ?? "unknown";
  const blob = new Blob(
    [
      JSON.stringify(
        buildResearchExport(loadResearchState(), {
          asOf: todayLocal(),
          counts: getEventCounts(),
          contentVersion,
          locale: lang,
          consent: getConsentStatus(),
        }),
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `foldwink-research-${lang}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
