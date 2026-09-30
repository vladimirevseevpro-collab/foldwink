import { beforeEach, describe, expect, it } from "vitest";
import { APP_VERSION } from "../../appVersion";
import {
  buildResearchExport,
  loadResearchState,
  migrateResearchState,
  getResearchAcquisition,
  recordBoardFeedback,
  recordQualifiedDay,
} from "../researchCohort";

beforeEach(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return data.size;
      },
      key: (index: number) => Array.from(data.keys())[index] ?? null,
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
      clear: () => data.clear(),
    },
  });
});

describe("local research cohort", () => {
  it("migrates corrupt input, validates real calendar days and derives D0", () => {
    const state = migrateResearchState({
      organicDays: ["2026-01-03", "bad", "2026-99-99", "2026-01-03"],
      invitedDays: ["2026-01-01"],
      feedback: [
        { answer: "yes", boardId: "seed words" },
        { unclear: "no", boardId: "board:1", contentVersion: "catalog-v1" },
      ],
    });

    expect(state.organicDays).toEqual(["2026-01-03"]);
    expect(state.invitedDays).toEqual(["2026-01-01"]);
    expect(state.firstQualifiedDay).toBe("2026-01-01");
    expect(state.feedback).toEqual([
      { answer: "yes" },
      { answer: "no", boardId: "board:1", contentVersion: "catalog-v1" },
    ]);
  });

  it("deduplicates qualified days and separates exact D1/D7 observation from eligibility", () => {
    expect(recordQualifiedDay("2026-01-01", "organic").isReturnDay).toBe(false);
    expect(recordQualifiedDay("2026-01-01", "organic").isNewQualifiedDay).toBe(false);
    expect(recordQualifiedDay("2026-01-02", "invited", true).isReturnDay).toBe(true);
    recordQualifiedDay("2026-01-08", "organic", true);

    const beforeD1Closes = buildResearchExport(loadResearchState(), {
      asOf: "2026-01-02",
      contentVersion: "catalog-v1",
      locale: "de",
      consent: "denied",
    });
    expect(beforeD1Closes.qualified.d1).toEqual({
      eligible: false,
      observed: false,
      organic: false,
      invited: false,
    });

    const afterD1Closes = buildResearchExport(loadResearchState(), {
      asOf: "2026-01-03",
      contentVersion: "catalog-v1",
    });
    expect(afterD1Closes.qualified.d1).toEqual({
      eligible: true,
      observed: true,
      organic: false,
      invited: true,
    });
    expect(afterD1Closes.qualified.d7.eligible).toBe(false);

    const afterD7Closes = buildResearchExport(loadResearchState(), {
      asOf: "2026-01-09",
      contentVersion: "catalog-v1",
    });
    expect(afterD7Closes.qualified.d7).toEqual({
      eligible: true,
      observed: true,
      organic: true,
      invited: false,
    });
    expect(afterD7Closes.qualified.totalDays).toBe(3);
    expect(afterD7Closes.qualified.completedDays).toBe(2);
  });

  it("keeps one feedback answer per attempt and exports only safe board/version fields", () => {
    expect(
      recordBoardFeedback("yes", "board:abc", "catalog-v1", "attempt:secret").recorded,
    ).toBe(true);
    expect(
      recordBoardFeedback("no", "board:abc", "catalog-v1", "attempt:secret").recorded,
    ).toBe(false);
    recordBoardFeedback("no", "board:def", "catalog-v1", "attempt:other");
    const result = buildResearchExport(loadResearchState(), {
      asOf: "2026-01-01",
      counts: { attempt_started: 2, attempt_completed: 1 },
      contentVersion: "catalog-v1",
      locale: "ru",
      consent: "granted",
    });

    expect(result.boardFeedback).toEqual({
      yes: 1,
      no: 1,
      total: 2,
      entries: [
        { boardId: "board:abc", contentVersion: "catalog-v1", answer: "yes" },
        { boardId: "board:def", contentVersion: "catalog-v1", answer: "no" },
      ],
    });
    expect(result.events.attempt_started).toBe(2);
    expect(result.events.attempt_completed).toBe(1);
    expect(result.versions.balance).toBe("balance-2026-09-v1");
    expect(result.versions.app).toBe(APP_VERSION);
    expect(result.versions.content).toBe("catalog-v1");
    expect(result.versions.eventSchema).toBe("ops-06-v1");
    expect(result.locale).toBe("ru");
    expect(result.consent).toBe("granted");
    expect(JSON.stringify(result)).not.toMatch(
      /attempt:secret|attempt:other|timestamp|seed|words/i,
    );
    const localPayloads = Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.getItem(localStorage.key(index) ?? ""),
    ).join("\n");
    expect(localPayloads).toContain("attempt:secret");
  });

  it("uses only an explicit study marker for invited acquisition", () => {
    expect(getResearchAcquisition()).toBe("organic");
    localStorage.setItem(
      "foldwink:utm-first",
      JSON.stringify({ source: "email", medium: "research_invite", ts: 1 }),
    );
    expect(getResearchAcquisition()).toBe("invited");
    localStorage.setItem(
      "foldwink:utm-first",
      JSON.stringify({ source: "tiktok", medium: "social", campaign: "launch", ts: 1 }),
    );
    expect(getResearchAcquisition()).toBe("organic");
    localStorage.setItem("foldwink:utm-first", JSON.stringify({ medium: 12, ts: 1 }));
    expect(getResearchAcquisition()).toBe("organic");
    localStorage.setItem(
      "foldwink:utm-first",
      JSON.stringify({ medium: "social", campaign: "foldwink-w7-pilot-extra", ts: 1 }),
    );
    expect(getResearchAcquisition()).toBe("organic");
  });

  it("ignores a corrupt per-board record without dropping valid cohort days", () => {
    recordQualifiedDay("2026-02-01", "organic");
    localStorage.setItem("foldwink:research:feedback:v1:broken", "{not-json");
    expect(loadResearchState().organicDays).toEqual(["2026-02-01"]);
  });
});
