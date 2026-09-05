import { useEffect, useState } from "react";
import { useGameStore } from "../game/state/appStore";
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
import { currentBundle } from "../puzzles/byLang";
import { isIosSafariInBrowser } from "../utils/platform";
import { useLang, useT } from "../i18n/useLanguage";
import { loadDailyHistory, checkAndProtectDailyStreakWithGraceWax } from "../stats/persistence";
import { todayLocal } from "../utils/date";
import { mergeDailyHistory, calculateDailyStreak } from "../stats/dailyRitual";
import { PrivacyPrompt } from "../components/PrivacyPrompt";
import { isSupporter } from "../monetization/supporter";
import { InstallFoldwink } from "../components/InstallFoldwink";
import { ArchivistPassportModal } from "../components/ArchivistPassportModal";
import { IronContractModal } from "../components/IronContractModal";
import { PalimpsestModal } from "../components/PalimpsestModal";

export function MenuScreen() {
  const startEasy = useGameStore((s) => s.startEasy);
  const startMedium = useGameStore((s) => s.startMedium);
  const startHard = useGameStore((s) => s.startHard);
  const startDaily = useGameStore((s) => s.startDaily);
  const showStats = useGameStore((s) => s.showStats);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);
  const lang = useLang();
  // Subscribe to `lang` so that a language switch re-renders the menu with
  // the matching pool. The bundle itself is read each render via currentBundle().
  void lang;
  const bundle = currentBundle();
  const poolSize = bundle.pool.length;
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

  const empty = poolSize === 0;
  const dailyDone = !!todayDailyRecord;
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
          <div className="text-[10px] uppercase text-muted mb-2">{t.menu.emptyPool}</div>
          <p className="text-sm text-text">{t.menu.emptyPoolDetail}</p>
        </div>
      ) : (
        <>
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

          <div className="flex flex-col gap-3 w-full max-w-60">
            {dailyDone ? (
              <Button variant="secondary" onClick={startDaily}>
                {t.menu.replayDaily}
              </Button>
            ) : (
              <Button onClick={startDaily}>{t.menu.playDaily}</Button>
            )}
            <Button variant={dailyDone ? "primary" : "secondary"} onClick={startEasy}>
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
            <div className="flex gap-2 w-full">
              <Button variant="ghost" className="flex-1" onClick={showStats}>
                {t.menu.stats}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsPassportOpen(true)}
              >
                📜 {lang === "ru" ? "Паспорт" : lang === "de" ? "Pass" : "Passport"}
              </Button>
            </div>

            <Button
              variant="secondary"
              className="text-xs border-red-900/40 text-red-300 hover:bg-red-950/20"
              onClick={() => setIsContractOpen(true)}
            >
              ⚔️ {lang === "ru" ? "Железный Контракт" : lang === "de" ? "Eiserner Vertrag" : "Iron Contract"}
            </Button>

            <Button
              variant="secondary"
              className="text-xs border-amber-500/50 bg-amber-950/20 text-amber-200 hover:bg-amber-950/40"
              onClick={() => setIsPalimpsestOpen(true)}
              data-testid="menu-palimpsest-button"
            >
              <span>📜✨</span>
              <span>{t.palimpsest.menuButton}</span>
            </Button>
          </div>

          {isPassportOpen && (
            <ArchivistPassportModal
              onClose={() => setIsPassportOpen(false)}
              onOpenContract={() => setIsContractOpen(true)}
            />
          )}

          {isContractOpen && (
            <IronContractModal onClose={() => setIsContractOpen(false)} />
          )}

          {isPalimpsestOpen && (
            <PalimpsestModal
              onClose={() => setIsPalimpsestOpen(false)}
              onOpenPassport={() => {
                setIsPalimpsestOpen(false);
                setIsPassportOpen(true);
              }}
            />
          )}

          {/* Show readiness caption from game 1 — disclosure of the existing
              unlock rule is anti-dark-pattern. Hidden before v0.6.6. */}
          <div className="text-[11px] text-muted text-center max-w-xs space-y-1">
            <div>
              <span className={mediumLabelClass}>{mDisplay.label}</span> · {mDisplay.caption}
            </div>
            {hReadiness.level !== "hidden" && (
              <div className="text-muted">
                {hDisplay.label} · {hDisplay.caption}
              </div>
            )}
          </div>

          {(mDisplay.fallback || hDisplay.fallback) && (
            <div className="text-[11px] text-muted text-center max-w-xs border-t border-line pt-3 space-y-1">
              {mDisplay.fallback && <div>{mDisplay.fallback}</div>}
              {hDisplay.fallback && <div>{hDisplay.fallback}</div>}
            </div>
          )}
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
