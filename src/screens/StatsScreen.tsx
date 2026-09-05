import { useGameStore } from "../game/state/appStore";
import { Button } from "../components/Button";
import { Wordmark } from "../components/Wordmark";
import { StatStrip } from "../components/StatStrip";
import { DailyArchive } from "../components/DailyArchive";
import { DailyFold } from "../components/DailyFold";
import { SupporterBadge } from "../components/SupporterBadge";
import { useT } from "../i18n/useLanguage";
import { loadDailyHistory } from "../stats/persistence";
import { mergeDailyHistory } from "../stats/dailyRitual";
import { useEffect } from "react";
import { useLang } from "../i18n/useLanguage";
import { trackEvent } from "../analytics/eventLog";
import { isSupporter } from "../monetization/supporter";

export function StatsScreen() {
  const stats = useGameStore((s) => s.stats);
  const todayDailyRecord = useGameStore((s) => s.todayDailyRecord);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const t = useT();
  const lang = useLang();
  const dailyHistory = mergeDailyHistory(loadDailyHistory(), todayDailyRecord);
  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const solvedCount = stats.solvedPuzzleIds.length;
  const mediumWins = stats.mediumWins ?? 0;
  const mediumLosses = stats.mediumLosses ?? 0;
  const mediumPlayed = mediumWins + mediumLosses;
  const mediumWinRate = mediumPlayed > 0 ? Math.round((mediumWins / mediumPlayed) * 100) : 0;
  const winkUses = stats.winkUses ?? 0;
  const totalMistakes = stats.totalMistakes ?? 0;
  const avgMistakes = stats.gamesPlayed > 0 ? totalMistakes / stats.gamesPlayed : 0;
  const flawlessWins = stats.flawlessWins ?? 0;

  useEffect(() => {
    trackEvent({
      name: "stats_view",
      props: {
        surface: "stats",
        has_support_flag: isSupporter() ? "yes" : "no",
        lang,
      },
    });
  }, [lang]);

  return (
    <div className="max-w-md mx-auto">
      <Wordmark size="sm" subtitle={t.stats.subtitle} />
      <SupporterBadge />

      <div className="mt-4">
        <StatStrip
          cells={[
            {
              label: t.stats.solved,
              value: solvedCount,
              tone: solvedCount > 0 ? "accent" : "default",
            },
            { label: t.stats.played, value: stats.gamesPlayed },
            {
              label: t.stats.winRate,
              value: `${winRate}%`,
            },
          ]}
        />
      </div>

      <div className="mt-2">
        <StatStrip
          cells={[
            { label: t.stats.wins, value: stats.wins },
            { label: t.stats.losses, value: stats.losses },
            { label: t.stats.streak, value: stats.currentStreak },
            { label: t.stats.best, value: stats.bestStreak },
          ]}
        />
      </div>

      {stats.gamesPlayed > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase text-muted text-center mb-1.5">
            {t.stats.depth}
          </div>
          <StatStrip
            cells={[
              { label: t.stats.flawless, value: flawlessWins },
              { label: t.stats.avgMiss, value: avgMistakes.toFixed(1) },
              { label: t.stats.medWinRate, value: `${mediumWinRate}%` },
              { label: t.stats.winks, value: winkUses },
            ]}
          />
        </div>
      )}

      <div className="mt-4">
        <div className="text-[10px] uppercase text-muted text-center mb-1.5">
          {t.stats.dailyHistory}
        </div>
        <DailyFold history={dailyHistory} className="mb-3" />
        <DailyArchive history={dailyHistory} />
      </div>

      {stats.gamesPlayed === 0 && (
        <div className="mt-4 rounded-lg bg-surface border border-line px-4 py-3 text-center">
          <div className="text-[10px] uppercase text-muted mb-1">{t.stats.emptyRecord}</div>
          <p className="text-sm text-text">{t.stats.emptyRecordDetail}</p>
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" onClick={goToMenu} className="w-full">
          {t.stats.backToMenu}
        </Button>
      </div>
    </div>
  );
}
