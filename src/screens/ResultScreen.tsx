import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/state/appStore";
import { useT } from "../i18n/useLanguage";
import { Button } from "../components/Button";
import { ResultSummary } from "../components/ResultSummary";
import { ShareButton } from "../components/ShareButton";
import { DailyCountdown } from "../components/DailyCountdown";
import { TipJarLink } from "../components/TipJarLink";
import { SupporterUnlockCta } from "../components/SupporterUnlockCta";
import { SoundToggle } from "../components/SoundToggle";
import { EnvelopeUnboxingModal } from "../components/EnvelopeUnboxingModal";
import {
  loadArchivistProfile,
  awardSolveRewards,
  type SolveRewards,
} from "../progression/archivistProfile";
import { buildShareString } from "../game/engine/share";
import { gradeResult } from "../game/engine/grading";
import { mediumReadiness } from "../game/engine/readiness";
import { seedFromString } from "../game/engine/shuffle";
import { todayLocal } from "../utils/date";
import { isSupporter } from "../monetization/supporter";
import { loadDailyHistory } from "../stats/persistence";
import { derivePersonalMoment, mergeDailyHistory } from "../stats/dailyRitual";
import { formatDuration, computePlayerArchetype } from "../game/engine/result";

// Deterministic picker: same puzzle id → same copy every replay, so we
// rotate without introducing variable-reward feel. Empty array safe-guard.
function pickVariant(variants: readonly string[], seed: string): string {
  if (variants.length === 0) return "";
  const h = seedFromString(seed);
  return variants[h % variants.length];
}

export function ResultScreen() {
  const summary = useGameStore((s) => s.summary);
  const puzzle = useGameStore((s) => s.puzzle);
  const active = useGameStore((s) => s.active);
  const stats = useGameStore((s) => s.stats);
  const progress = useGameStore((s) => s.progress);
  const streakDelta = useGameStore((s) => s.streakDelta);
  const newBest = useGameStore((s) => s.newBest);
  const todayDailyRecord = useGameStore((s) => s.todayDailyRecord);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const showStats = useGameStore((s) => s.showStats);
  const startNextSame = useGameStore((s) => s.startNextSame);
  const startMedium = useGameStore((s) => s.startMedium);
  const t = useT();
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  // The terminal win/loss sound used to play from this screen's mount.
  // After v0.7's 600 ms board-hold (store.ts RESULT_HOLD_MS), it plays
  // from GameScreen the instant the board finalises so the cue lands on
  // the fully-painted grid, not here.

  if (!summary || !puzzle) {
    return (
      <div className="text-center text-muted p-8">
        {t.result.noResult}
        <div className="mt-4">
          <Button onClick={goToMenu}>{t.result.backToMenu}</Button>
        </div>
      </div>
    );
  }

  const isDaily = active?.mode === "daily";
  const today = todayLocal();
  const isWin = summary.result === "win";
  const grade = gradeResult(summary, puzzle, active);
  const shareText = buildShareString(summary, puzzle, {
    mode: isDaily ? "daily" : "standard",
    dayLabel: isDaily ? today : undefined,
    index: isDaily ? undefined : Math.max(1, progress.cursor),
    strings: t,
    grade,
  });

  const subtitle = isDaily
    ? t.result.subtitleDaily(today)
    : t.result.subtitleStandard(Math.max(1, progress.cursor));
  const mergedDailyHistory = mergeDailyHistory(loadDailyHistory(), todayDailyRecord);
  const dailyMoment = isDaily ? derivePersonalMoment(mergedDailyHistory, today) : null;

  const archetype = computePlayerArchetype(summary, puzzle.difficulty, active?.winkedGroupId);

  const cardOptions = {
    mode: (isDaily ? "daily" : "standard") as "daily" | "standard",
    title: puzzle.title,
    subtitle,
    result: summary.result,
    mistakesUsed: summary.mistakesUsed,
    durationMs: summary.durationMs,
    difficulty: puzzle.difficulty,
    groupOrder: puzzle.groups.map((g) => g.id),
    solvedGroupIds: summary.solvedGroupIds,
    winkUsed: active?.winkedGroupId !== null && active?.winkedGroupId !== undefined,
    winkAvailable: puzzle.difficulty === "medium",
    winkedGroupId: active?.winkedGroupId,
    difficultyLabel: t.difficulty[puzzle.difficulty],
    supporter: isSupporter(),
    archetype: `${archetype.icon} ${archetype.badge}`,
    labels: {
      solved: t.resultSummary.solved,
      closeCall: t.resultSummary.outOfMistakes,
      time: t.resultSummary.time,
      mistakes: t.resultSummary.mistakes,
      winkUsed: t.tabs.winkUsed,
      noWink: t.tabs.winkShort,
      supporter: t.monetization.badgeLabel,
    },
  };

  // The streak-celebration card was redundant with the Streak value that
  // already appears in the stats strip at the top of the result. Its only
  // irreplaceable signal was the "new best" accent — we fold that into
  // the Grade caption instead so nothing is lost.
  const showNewBest = isWin && streakDelta > 0 && newBest && stats.bestStreak >= 3;

  const [unboxingRewards, setUnboxingRewards] = useState<SolveRewards | null>(() => {
    if (!summary || !puzzle || summary.result !== "win") return null;
    const profile = loadArchivistProfile();
    const { rewards } = awardSolveRewards(profile, {
      result: summary.result,
      mistakesUsed: summary.mistakesUsed,
      isDaily: active?.mode === "daily",
      difficulty: puzzle.difficulty,
    });
    return rewards;
  });

  return (
    <div
      ref={focusRef}
      className="max-w-md mx-auto relative"
      data-testid="result-screen"
      role="region"
      aria-labelledby="result-heading"
      tabIndex={-1}
    >
      {unboxingRewards && (
        <EnvelopeUnboxingModal
          rewards={unboxingRewards}
          onClose={() => setUnboxingRewards(null)}
        />
      )}

      <ResultSummary summary={summary} puzzle={puzzle} currentStreak={stats.currentStreak} />

      {isWin && (
        <div
          className={`mt-3 rounded-lg px-4 py-2.5 text-center border ${
            grade.noWinkMedium || showNewBest
              ? "bg-surface border-accent/60"
              : "bg-surface border-line"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase text-muted">{t.result.grade}</span>
            <span
              className={`text-base font-bold ${
                grade.noWinkMedium || showNewBest ? "text-accent" : "text-text"
              }`}
            >
              {grade.label}
            </span>
          </div>
          {(grade.caption || showNewBest) && (
            <div className="text-[11px] text-muted mt-0.5">
              {showNewBest ? (
                <>
                  <span className="text-accent">{t.result.newBest(stats.bestStreak)}</span>
                  {grade.caption && <span className="opacity-70"> · {grade.caption}</span>}
                </>
              ) : (
                grade.caption
              )}
            </div>
          )}
          {/* Seeded win affirmation — deterministic per puzzle id, keeps
              repeat sessions feeling fresh without introducing variable-
              ratio randomness. */}
          <div className="text-[11px] text-muted mt-1 italic opacity-80">
            {pickVariant(t.result.winAffirmations, puzzle.id)}
          </div>
        </div>
      )}

      {!isWin && (
        <div className="mt-3 rounded-lg bg-surface border border-line px-4 py-3 text-center">
          <div className="text-[10px] uppercase text-muted mb-1">{t.result.closeOne}</div>
          <p className="text-sm text-text">
            {pickVariant(t.result.missedVariants, puzzle.id)}{" "}
            {isDaily ? t.result.nextDaily : t.result.tryFresh}
          </p>
        </div>
      )}

      {isDaily && (
        <div className="mt-3 text-center text-[11px] text-muted">
          <DailyCountdown />
        </div>
      )}

      {isDaily && dailyMoment && (
        <div
          className="mt-3 rounded-lg border border-line bg-surface px-4 py-3 text-center"
          data-testid="daily-personal-moment"
        >
          <div className="text-[10px] uppercase text-muted">{t.daily.momentLabel}</div>
          <div className="mt-1 text-sm text-text">
            {dailyMoment.kind === "first-daily" && t.daily.momentFirst}
            {dailyMoment.kind === "fastest-win" &&
              t.daily.momentFastest(formatDuration(dailyMoment.record.durationMs))}
            {dailyMoment.kind === "flawless-win" && t.daily.momentFlawless}
            {dailyMoment.kind === "today-logged" && t.daily.momentLogged}
          </div>
          {dailyMoment.kind === "fastest-win" && dailyMoment.comparedTo && (
            <div className="mt-1 text-[11px] text-muted">
              {t.daily.momentFastestCompared(
                formatDuration(dailyMoment.comparedTo.durationMs),
                dailyMoment.comparedTo.date,
              )}
            </div>
          )}
          <div className="mt-1 text-[11px] text-muted">
            {t.daily.recentSummary(dailyMoment.recent.solved, dailyMoment.recent.recorded)}
          </div>
        </div>
      )}

      <div className="mt-3">
        <ShareButton text={shareText} card={cardOptions} />
      </div>

      <div className="mt-3 flex flex-col gap-2" data-testid="result-cta-stack">
        {!isDaily && (
          <Button onClick={startNextSame} data-testid="result-next-puzzle">
            {t.result.nextPuzzle}
          </Button>
        )}
        {!isDaily &&
          isWin &&
          puzzle.difficulty === "easy" &&
          mediumReadiness(stats).unlocked && (
            <Button variant="secondary" onClick={startMedium} data-testid="result-try-medium">
              {t.result.tryMedium}
            </Button>
          )}
        <Button variant="secondary" onClick={showStats}>
          {t.result.showStats}
        </Button>
        <Button variant="ghost" onClick={goToMenu}>
          {t.result.backToMenu}
        </Button>
      </div>

      {/* Monetization rail — only renders if configured. Tip jar is the
          low-friction default; the supporter CTA appears once per
          finished-game session for non-supporters. Both are hidden
          entirely on a fresh deploy (no Ko-fi handle, no checkout URL),
          so there is no clutter until the dev opts in. */}
      {isWin && <TipJarLink />}
      {isWin && <SupporterUnlockCta context="result" />}

      <div className="mt-4 flex items-center justify-center">
        <SoundToggle compact />
      </div>
    </div>
  );
}
