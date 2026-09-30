import { lazy, Suspense, useEffect, useState } from "react";
import { retryRuntimeContent, useGameStore } from "../game/state/appStore";
import { Button } from "../components/Button";
import { Wordmark } from "../components/Wordmark";
import { DailyCompleteCard } from "../components/DailyCompleteCard";
import { DailyFold } from "../components/DailyFold";
import { SoundToggle } from "../components/SoundToggle";
import { HapticsToggle } from "../components/HapticsToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { ThemeSelector } from "../components/ThemeSelector";
import { AboutFooter } from "../components/AboutFooter";
import { getConsentStatus, isAnalyticsConfigured, trackEvent } from "../analytics/eventLog";
import {
  mediumReadiness,
  hardReadiness,
  mediumReadinessDisplay,
  hardReadinessDisplay,
} from "../game/engine/readiness";
import { currentBundle, getRuntimeCatalogSize } from "../puzzles/byLang";
import { getDailyEntry } from "../puzzles/catalog";
import { isIosSafariInBrowser } from "../utils/platform";
import { useLang, useT } from "../i18n/useLanguage";
import { loadDailyHistory, checkAndProtectDailyStreakWithGraceWax } from "../stats/persistence";
import { todayLocal } from "../utils/date";
import { mergeDailyHistory, calculateDailyStreak } from "../stats/dailyRitual";
import { PrivacyPrompt } from "../components/PrivacyPrompt";
import { isSupporter } from "../monetization/supporter";
import { InstallFoldwink } from "../components/InstallFoldwink";
import { FoldwinkIcon } from "../components/FoldwinkIcon";

const ArchivistPassportModal = lazy(() =>
  import("../components/ArchivistPassportModal").then((module) => ({
    default: module.ArchivistPassportModal,
  })),
);
const IronContractModal = lazy(() =>
  import("../components/IronContractModal").then((module) => ({
    default: module.IronContractModal,
  })),
);
const PalimpsestModal = lazy(() =>
  import("../components/PalimpsestModal").then((module) => ({
    default: module.PalimpsestModal,
  })),
);

export function MenuScreen() {
  const startEasy = useGameStore((s) => s.startEasy);
  const startMedium = useGameStore((s) => s.startMedium);
  const startHard = useGameStore((s) => s.startHard);
  const startDaily = useGameStore((s) => s.startDaily);
  const startZen = useGameStore((s) => s.startZen);
  const active = useGameStore((s) => s.active);
  const puzzle = useGameStore((s) => s.puzzle);
  const resumeActive = useGameStore((s) => s.resumeActive);
  const showStats = useGameStore((s) => s.showStats);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);
  const lang = useLang();
  const contentIssue = useGameStore((s) => s.contentIssue);

  // Subscribe to `lang` so that a language switch re-renders the menu with
  // the matching pool. The bundle itself is read each render via currentBundle().
  void lang;
  const bundle = currentBundle();
  const loadedPoolSize = bundle.pool.length;
  const poolSize = getRuntimeCatalogSize(lang) ?? loadedPoolSize;
  const langHardPool = bundle.hard;
  const stats = useGameStore((s) => s.stats);
  const todayDailyRecord = useGameStore((s) => s.todayDailyRecord);
  const t = useT();
  const dailyHistory = mergeDailyHistory(loadDailyHistory(), todayDailyRecord);
  const [consentStatus, setConsent] = useState(() => getConsentStatus());
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isPalimpsestOpen, setIsPalimpsestOpen] = useState(false);
  const [graceWaxNotice, setGraceWaxNotice] = useState<string | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [retryingContent, setRetryingContent] = useState(false);

  useEffect(() => {
    const res = checkAndProtectDailyStreakWithGraceWax(todayLocal());
    if (res.applied) {
      setGraceWaxNotice(t.daily.graceWaxApplied);
    }
  }, [t.daily.graceWaxApplied]);

  useEffect(() => {
    trackEvent({
      name: "menu_view",
      props: {
        surface: "menu",
        has_support_flag: isSupporter() ? "yes" : "no",
        lang,
      },
    });
  }, [lang]);

  useEffect(() => {
    const handler = (event: Event): void => {
      const next = (event as CustomEvent<ReturnType<typeof getConsentStatus>>).detail;
      if (next) setConsent(next);
    };
    window.addEventListener("foldwink:privacy-consent-changed", handler);
    return () => window.removeEventListener("foldwink:privacy-consent-changed", handler);
  }, []);

  // A persisted snapshot remains playable offline even when the current
  // language manifest cannot be fetched. Do not hide its Continue affordance
  // behind the runtime-content unavailable state.
  const hasResumableSnapshot = Boolean(active && puzzle && !active.result);
  const empty = loadedPoolSize === 0 && !hasResumableSnapshot;
  const dailyDone = !!todayDailyRecord;
  const dailyAvailable = Boolean(getDailyEntry(lang, todayLocal()));
  const mReadiness = mediumReadiness(stats);
  const mDisplay = mediumReadinessDisplay(mReadiness, t);

  const hReadiness = hardReadiness(stats, langHardPool.length);
  const hDisplay = hardReadinessDisplay(hReadiness, t);

  const mediumLabelClass =
    mReadiness.level === "strong"
      ? "text-accent font-semibold"
      : mReadiness.level === "recommended"
        ? "text-text font-semibold"
        : "text-muted font-semibold";

  const mediumButtonLabel = mReadiness.level === "locked" ? t.menu.mediumLocked : t.menu.medium;
  const mediumButtonVariant = "secondary" as const;
  const mediumButtonClass =
    mReadiness.level === "strong" || mReadiness.level === "recommended"
      ? "border-accent text-accent"
      : "";

  const handleMediumClick = () => {
    if (!mReadiness.unlocked) return;
    startMedium();
  };

  const handleHardClick = () => {
    if (!hReadiness.unlocked || !hReadiness.hasContent) return;
    startHard();
  };

  const hardDisabled = !hReadiness.unlocked || !hReadiness.hasContent;
  const hardButtonLabel =
    hReadiness.level === "coming-soon"
      ? t.menu.masterSoon
      : hReadiness.level === "locked"
        ? t.menu.masterLocked
        : t.menu.masterChallenge;
  const hardButtonVariant = "secondary" as const;
  const hardButtonClass =
    hReadiness.unlocked && hReadiness.hasContent ? "border-warning text-warning" : "";

  return (
    <div className="flex flex-col items-center text-center gap-3 pt-1 sm:pt-3">
      <Wordmark size="lg" animated showSublabel={false} subtitle={t.menu.subtitle} />

      {isAnalyticsConfigured() && consentStatus === "unknown" && <PrivacyPrompt />}

      {empty ? (
        <div className="w-full max-w-xs rounded-lg bg-surface border border-line px-5 py-6 text-center">
          <div className="text-[10px] uppercase text-muted mb-2">
            {contentIssue ? t.menu.contentUnavailable : t.menu.emptyPool}
          </div>
          <p className="text-sm text-text">
            {contentIssue ? t.menu.contentUnavailableDetail : t.menu.emptyPoolDetail}
          </p>
          {contentIssue && (
            <Button
              variant="secondary"
              className="mt-4"
              disabled={retryingContent}
              onClick={() => {
                setRetryingContent(true);
                void retryRuntimeContent().finally(() => setRetryingContent(false));
              }}
            >
              {t.menu.retryContent}
            </Button>
          )}
        </div>
      ) : (
        <>
          {active && puzzle && !active.result && (
            <section
              className="w-full max-w-[20rem] rounded-xl border border-accent bg-surfaceHi p-4 text-left shadow-ready"
              aria-labelledby="continue-puzzle-title"
              data-testid="menu-continue-card"
            >
              <div className="fw-kicker text-accent">{t.menu.continueGame}</div>
              <h2 id="continue-puzzle-title" className="mt-1 text-lg font-extrabold text-text">
                {puzzle.title}
              </h2>
              <p className="mt-1 fw-body-copy text-muted">{t.menu.continueGameDetail}</p>
              <Button className="mt-3 w-full" onClick={resumeActive}>
                {t.menu.continueGame}
              </Button>
            </section>
          )}

          <section
            className="w-full max-w-[20rem] rounded-xl border border-accent/60 bg-surfaceHi/70 p-4 text-left shadow-sm"
            aria-labelledby="today-puzzle-title"
            data-testid="menu-today-card"
          >
            <div className="fw-kicker flex items-center gap-1.5 text-accent">
              <FoldwinkIcon name="today" size={14} />
              {t.daily.todayMarker}
            </div>
            <h2 id="today-puzzle-title" className="mt-1 fw-screen-title text-text">
              {t.daily.label}
            </h2>
            <p className="mt-1 fw-body-copy text-muted">
              {dailyDone ? t.menu.replayDaily : t.menu.subtitle}
            </p>
            <Button
              variant={dailyDone ? "secondary" : "primary"}
              className="mt-3 w-full"
              onClick={startDaily}
              disabled={!dailyAvailable}
              data-testid="menu-daily-action"
            >
              {dailyAvailable
                ? dailyDone
                  ? t.menu.replayDaily
                  : t.menu.playDaily
                : t.menu.dailyUnavailable}
            </Button>
            {!dailyAvailable && (
              <p className="mt-2 text-xs leading-relaxed text-muted" role="status">
                {t.menu.dailyUnavailableDetail}
              </p>
            )}
          </section>

          {dailyDone && todayDailyRecord && (
            <DailyCompleteCard
              record={todayDailyRecord}
              currentStreak={calculateDailyStreak(dailyHistory, todayLocal())}
            />
          )}

          {graceWaxNotice && (
            <div className="w-full max-w-[20rem] p-2.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
              <span className="font-medium">{graceWaxNotice}</span>
              <button
                type="button"
                onClick={() => setGraceWaxNotice(null)}
                className="text-muted hover:text-text p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <DailyFold history={dailyHistory} className="w-full max-w-[20rem]" />

          <div className="flex w-full max-w-[20rem] flex-col gap-3">
            <section
              className="w-full rounded-xl border border-line bg-surface/60 p-3 text-left"
              aria-labelledby="practice-title"
            >
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="practice-title"
                  className="flex items-center gap-2 text-sm font-bold text-text"
                >
                  <FoldwinkIcon name="practice" size={17} className="text-accent" />
                  {t.menu.practice}
                </h2>
                <button
                  type="button"
                  className="min-h-11 min-w-11 rounded-md px-2 text-sm font-bold text-accent hover:bg-surfaceHi"
                  aria-expanded={practiceOpen}
                  aria-controls="practice-options"
                  aria-label={practiceOpen ? t.menu.collapse : t.menu.practice}
                  data-testid="menu-practice-toggle"
                  onClick={() => setPracticeOpen((open) => !open)}
                >
                  {practiceOpen ? "−" : "+"}
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t.menu.practiceHint}</p>
              {practiceOpen && (
                <div id="practice-options" className="mt-3 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    onClick={startEasy}
                    data-testid="menu-practice-easy"
                  >
                    {t.menu.easy}
                  </Button>
                  <Button
                    variant={mediumButtonVariant}
                    className={mediumButtonClass}
                    onClick={handleMediumClick}
                    disabled={!mReadiness.unlocked}
                    aria-disabled={!mReadiness.unlocked}
                  >
                    {mediumButtonLabel}
                  </Button>
                  {hReadiness.hasContent && (
                    <Button
                      variant={hardButtonVariant}
                      className={hardButtonClass}
                      onClick={handleHardClick}
                      disabled={hardDisabled}
                      aria-disabled={hardDisabled}
                    >
                      {hardButtonLabel}
                    </Button>
                  )}
                  <div className="space-y-1 border-t border-line pt-2 text-center text-[11px] text-muted">
                    <div>
                      <span className={mediumLabelClass}>{mDisplay.label}</span> ·{" "}
                      {mDisplay.caption}
                    </div>
                    {hReadiness.level !== "hidden" && (
                      <div>
                        {hDisplay.label} · {hDisplay.caption}
                      </div>
                    )}
                    {mDisplay.fallback && <div>{mDisplay.fallback}</div>}
                    {hDisplay.fallback && <div>{hDisplay.fallback}</div>}
                  </div>
                </div>
              )}
            </section>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" className="flex-1" onClick={showStats}>
                <FoldwinkIcon name="stats" size={17} className="mr-2 text-accent" />
                {t.menu.stats}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsPassportOpen(true)}
              >
                <FoldwinkIcon name="passport" size={17} className="mr-2 text-accent" />
                {t.passport.tabPassport}
              </Button>
            </div>

            <section className="rounded-xl border border-line bg-surface/40 p-3 text-left">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 text-sm font-semibold text-muted hover:text-text"
                aria-expanded={moreOpen}
                aria-controls="secondary-modes"
                data-testid="menu-secondary-modes-toggle"
                onClick={() => setMoreOpen((open) => !open)}
              >
                <span>{t.menu.moreWays}</span>
                <span aria-hidden="true">{moreOpen ? "−" : "+"}</span>
              </button>
              {moreOpen && (
                <div id="secondary-modes" className="mt-2 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs border-emerald-600/40 text-emerald-300 hover:bg-emerald-950/20"
                    onClick={startZen}
                    data-testid="menu-zen-button"
                  >
                    🧘{" "}
                    {lang === "ru" ? "Режим Дзен" : lang === "de" ? "Zen-Modus" : "Zen Streak"}
                    {stats.zenStreak ? ` (${stats.zenStreak})` : ""}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs border-red-900/40 text-red-300 hover:bg-red-950/20"
                    onClick={() => setIsContractOpen(true)}
                    data-testid="menu-mastery-button"
                  >
                    ⚔️{" "}
                    {lang === "ru"
                      ? "Проверка мастерства"
                      : lang === "de"
                        ? "Meisterprüfung"
                        : "Mastery Challenge"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs border-amber-500/50 bg-amber-950/20 text-amber-200 hover:bg-amber-950/40"
                    onClick={() => setIsPalimpsestOpen(true)}
                    data-testid="menu-palimpsest-button"
                  >
                    📜✨ {t.palimpsest.menuButton}
                  </Button>
                </div>
              )}
            </section>
          </div>

          <Suspense
            fallback={
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-black/80 text-sm text-text"
                role="status"
              >
                {lang === "ru" ? "Загрузка…" : lang === "de" ? "Wird geladen…" : "Loading…"}
              </div>
            }
          >
            {isPassportOpen && (
              <ArchivistPassportModal
                onClose={() => setIsPassportOpen(false)}
                onOpenContract={() => setIsContractOpen(true)}
              />
            )}

            {isContractOpen && <IronContractModal onClose={() => setIsContractOpen(false)} />}

            {isPalimpsestOpen && (
              <PalimpsestModal
                onClose={() => setIsPalimpsestOpen(false)}
                onOpenPassport={() => {
                  setIsPalimpsestOpen(false);
                  setIsPassportOpen(true);
                }}
              />
            )}
          </Suspense>
        </>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center text-[11px] text-muted">
        <SoundToggle />
        <HapticsToggle />
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <LanguageToggle />
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <ThemeSelector />
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <button
          type="button"
          onClick={openHowToPlay}
          className="text-muted hover:text-text underline-offset-2 hover:underline transition-colors"
        >
          {t.onboarding.menuLink}
        </button>
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <AboutFooter />
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <InstallFoldwink />
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
        <span className="tabular-nums">{t.menu.poolSize(poolSize)}</span>
      </div>

      {isIosSafariInBrowser() && (
        <p className="text-[10px] text-muted text-center max-w-xs leading-relaxed mt-1">
          <span className="text-accent">{t.menu.iphoneTip}</span> — {t.menu.iphoneTipBody}
        </p>
      )}
    </div>
  );
}
