import type { DailyRecord } from "../game/types/stats";

export type DailyCellState = "won" | "lost" | "empty" | "cracked" | "restored";

export interface DailyFoldCell {
  date: string;
  isToday: boolean;
  state: DailyCellState;
  record: DailyRecord | null;
}

export interface DailyFoldSummary {
  solved: number;
  recorded: number;
}

export type PersonalMomentKind =
  | "first-daily"
  | "fastest-win"
  | "flawless-win"
  | "today-logged";

export interface PersonalMoment {
  kind: PersonalMomentKind;
  record: DailyRecord;
  comparedTo?: DailyRecord;
  recent: DailyFoldSummary;
}

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function mergeDailyHistory(
  history: Record<string, DailyRecord>,
  record: DailyRecord | null | undefined,
): Record<string, DailyRecord> {
  const merged = normalizeDailyHistory(history);
  if (!record) return merged;
  const normalized = normalizeDailyRecord(record.date, record);
  if (!normalized) return merged;
  return { ...merged, [normalized.date]: normalized };
}

export function parseLocalDate(date: string): Date | null {
  if (!LOCAL_DATE_RE.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addLocalDays(date: string, offset: number): string {
  const parsed = parseLocalDate(date);
  if (!parsed) return date;
  const next = new Date(parsed);
  next.setDate(next.getDate() + offset);
  return formatLocalDate(next);
}

export function normalizeDailyRecord(
  fallbackDate: string,
  record: DailyRecord | null | undefined,
): DailyRecord | null {
  if (!record) return null;
  const date = parseLocalDate(record.date) ? record.date : fallbackDate;
  if (!parseLocalDate(date)) return null;
  return {
    date,
    puzzleId: typeof record.puzzleId === "string" ? record.puzzleId : "",
    result: record.result === "win" ? "win" : "loss",
    mistakesUsed: isFiniteNumber(record.mistakesUsed) ? Math.max(0, record.mistakesUsed) : 0,
    durationMs: isFiniteNumber(record.durationMs) ? Math.max(0, record.durationMs) : 0,
    graceWaxUsed: record.graceWaxUsed === true ? true : undefined,
  };
}

export function normalizeDailyHistory(
  history: Record<string, DailyRecord>,
): Record<string, DailyRecord> {
  const normalized: Record<string, DailyRecord> = {};
  for (const [date, record] of Object.entries(history)) {
    const next = normalizeDailyRecord(date, record);
    if (!next) continue;
    normalized[next.date] = next;
  }
  return normalized;
}

function compareDatesAsc(a: DailyRecord, b: DailyRecord): number {
  return a.date.localeCompare(b.date);
}

function compareDatesDesc(a: DailyRecord, b: DailyRecord): number {
  return b.date.localeCompare(a.date);
}

export function listDailyRecords(history: Record<string, DailyRecord>): DailyRecord[] {
  return Object.values(normalizeDailyHistory(history)).sort(compareDatesAsc);
}

export function deriveSevenDayFold(
  history: Record<string, DailyRecord>,
  today: string,
): DailyFoldCell[] {
  const normalized = normalizeDailyHistory(history);
  const cells: DailyFoldCell[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = addLocalDays(today, offset);
    const record = normalized[date] ?? null;
    cells.push({
      date,
      isToday: date === today,
      state: !record
        ? "empty"
        : record.graceWaxUsed
          ? "restored"
          : record.result === "win"
            ? "won"
            : "lost",
      record,
    });
  }
  return cells;
}

export function deriveRecentDailySummary(records: DailyRecord[], max = 7): DailyFoldSummary {
  const recent = [...records]
    .filter((record) => parseLocalDate(record.date))
    .sort(compareDatesDesc)
    .slice(0, max);
  return {
    solved: recent.filter((record) => record.result === "win").length,
    recorded: recent.length,
  };
}

export function derivePersonalMoment(
  history: Record<string, DailyRecord>,
  today: string,
): PersonalMoment | null {
  const records = listDailyRecords(history);
  const todayRecord = normalizeDailyHistory(history)[today];
  if (!todayRecord) return null;

  const recent = deriveRecentDailySummary(records);
  if (records.length === 1) {
    return { kind: "first-daily", record: todayRecord, recent };
  }

  const previousRecords = records.filter((record) => record.date < today);
  const previousWins = previousRecords.filter((record) => record.result === "win");

  if (todayRecord.result === "win") {
    const comparableWins = previousWins.filter(
      (record) => record.mistakesUsed === todayRecord.mistakesUsed,
    );
    const bestComparable = [...comparableWins].sort(
      (a, b) => a.durationMs - b.durationMs || a.date.localeCompare(b.date),
    )[0];

    if (bestComparable && todayRecord.durationMs < bestComparable.durationMs) {
      return {
        kind: "fastest-win",
        record: todayRecord,
        comparedTo: bestComparable,
        recent,
      };
    }

    const previousFlawless = previousWins.some((record) => record.mistakesUsed === 0);
    if (todayRecord.mistakesUsed === 0 && !previousFlawless) {
      return { kind: "flawless-win", record: todayRecord, recent };
    }
  }

  return { kind: "today-logged", record: todayRecord, recent };
}

export function calculateDailyStreak(
  history: Record<string, DailyRecord>,
  today: string,
): number {
  const normalized = normalizeDailyHistory(history);
  let streak = 0;
  const todayRecord = normalized[today];
  let checkDate =
    todayRecord && todayRecord.result === "win" ? today : addLocalDays(today, -1);

  while (true) {
    const record = normalized[checkDate];
    if (record && record.result === "win") {
      streak += 1;
      checkDate = addLocalDays(checkDate, -1);
    } else {
      break;
    }
  }
  return streak;
}

export interface GraceWaxResult {
  applied: boolean;
  protectedDate?: string;
  waxRemaining?: number;
}

export function applyGraceWaxProtection(
  history: Record<string, DailyRecord>,
  today: string,
  profile: { wax: number },
): {
  history: Record<string, DailyRecord>;
  waxRemaining: number;
  result: GraceWaxResult;
} {
  const normalized = normalizeDailyHistory(history);
  const yesterday = addLocalDays(today, -1);
  const twoDaysAgo = addLocalDays(today, -2);

  // Check if yesterday is missing and player missed a day
  if (!normalized[yesterday]) {
    // Check if player had an active streak ending two days ago
    const hadStreakTwoDaysAgo = normalized[twoDaysAgo]?.result === "win";
    if (hadStreakTwoDaysAgo && profile.wax >= 1) {
      const updatedWax = profile.wax - 1;
      const graceRecord: DailyRecord = {
        date: yesterday,
        puzzleId: "grace_wax",
        result: "win",
        mistakesUsed: 0,
        durationMs: 0,
        graceWaxUsed: true,
      };
      const nextHistory = { ...normalized, [yesterday]: graceRecord };
      return {
        history: nextHistory,
        waxRemaining: updatedWax,
        result: {
          applied: true,
          protectedDate: yesterday,
          waxRemaining: updatedWax,
        },
      };
    }
  }

  return {
    history: normalized,
    waxRemaining: profile.wax,
    result: { applied: false },
  };
}

