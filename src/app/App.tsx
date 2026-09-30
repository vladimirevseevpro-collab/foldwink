import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/state/appStore";
import { MenuScreen } from "../screens/MenuScreen";
import { GameScreen } from "../screens/GameScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { Onboarding } from "../components/Onboarding";
import { EmbeddedMobileLaunch } from "../components/EmbeddedMobileLaunch";
import { isSupporter } from "../monetization/supporter";
import { trackEvent, type AnalyticsOutcome, bucketSource } from "../analytics/eventLog";
import { useLang, useLangStore } from "../i18n/useLanguage";
import { getFirstTouch } from "../monetization/attribution";
import { SupporterThankYou } from "../components/SupporterThankYou";
import { PersistenceRecoveryBanner } from "../components/PersistenceRecoveryBanner";

import { disposeSound, suspendSound } from "../audio/sound";
import {
  decodeSharedPuzzleFromHash,
  validateAndBuildSharedPuzzle,
} from "../share/urlHashPuzzle";
import { decodeChallengeToken } from "../share/challengeLink";
import { ensurePuzzleLoaded, langGetPuzzleByIdStrict } from "../puzzles/byLang";
import { getEditorialRecord } from "../puzzles/catalog";
import { getHostPresentation } from "../utils/platform";

const StatsScreen = lazy(() =>
  import("../screens/StatsScreen").then((module) => ({ default: module.StatsScreen })),
);
const PwaUpdateNotice = lazy(() =>
  import("../components/PwaUpdateNotice").then((module) => ({
    default: module.PwaUpdateNotice,
  })),
);

export function App() {
  const hostPresentation = getHostPresentation();
  const screen = useGameStore((s) => s.screen);
  const onboarded = useGameStore((s) => s.onboarded);
  const howToPlayOpen = useGameStore((s) => s.howToPlayOpen);
  const persistenceIssue = useGameStore((s) => s.persistenceIssue);
  const openUnsavedResult = useGameStore((s) => s.openUnsavedResult);
  const active = useGameStore((s) => s.active);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const closeHowToPlay = useGameStore((s) => s.closeHowToPlay);
  const startStandard = useGameStore((s) => s.startStandard);
  const resumeActive = useGameStore((s) => s.resumeActive);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startDuel = useGameStore((s) => s.startDuel);
  const startCustomPuzzle = useGameStore((s) => s.startCustomPuzzle);
  const lang = useLang();

  const initialLang = useRef(lang);
  const customPuzzleLoaded = useRef(false);
  const inboundChallengeHandled = useRef(false);
  const [sharedLinkError, setSharedLinkError] = useState<
    "invalid" | "unsupported" | "unavailable" | null
  >(null);

  // One audio context owns both decoded cues and procedural fallback recipes.
  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === "hidden") suspendSound();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      disposeSound();
    };
  }, []);

  const handleOnboardingComplete = (): void => {
    completeOnboarding();
    // A restored game takes precedence over the normal first-run handoff.
    if (screen === "menu") {
      if (active && !active.result) resumeActive();
      else startStandard();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || inboundChallengeHandled.current) return;
    const hasV2Challenge = /(?:^#|[&#])c=/u.test(window.location.hash);
    const query = new URLSearchParams(window.location.search);
    const hasLegacyChallenge = query.has("vs");
    if (!hasV2Challenge && !hasLegacyChallenge) return;
    inboundChallengeHandled.current = true;

    void (async () => {
      if (hasV2Challenge) {
        const decoded = decodeChallengeToken(window.location.hash);
        if (!decoded.ok) {
          setSharedLinkError(
            decoded.code === "unsupported-version" ? "unsupported" : "invalid",
          );
          return;
        }

        const { puzzle: ref, creatorResult } = decoded.payload;
        useLangStore.getState().setLang(ref.language);
        try {
          await ensurePuzzleLoaded(ref.language, ref.puzzleId);
        } catch {
          setSharedLinkError("unavailable");
          return;
        }
        const puzzle = langGetPuzzleByIdStrict(ref.puzzleId);
        const editorial = getEditorialRecord(ref.language, ref.puzzleId);
        if (
          !puzzle ||
          !editorial ||
          editorial.puzzleRef.lineageId !== ref.lineageId ||
          editorial.puzzleRef.contentVersion !== ref.contentVersion
        ) {
          setSharedLinkError("unavailable");
          return;
        }
        if (!onboarded) completeOnboarding();
        startDuel(ref.puzzleId, creatorResult?.mistakesUsed ?? 0, 0, {
          source: "challenge-v2",
          creatorResult,
        });
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        return;
      }

      const puzzleId = query.get("vs") ?? "";
      const mistakesRaw = Number(query.get("m") ?? "0");
      const timeRaw = Number(query.get("t") ?? "0");
      const validId = puzzleId.length <= 128 && /^[a-z0-9._:-]+$/iu.test(puzzleId);
      const validMistakes =
        Number.isInteger(mistakesRaw) && mistakesRaw >= 0 && mistakesRaw <= 4;
      const validTime = Number.isInteger(timeRaw) && timeRaw >= 0 && timeRaw <= 86_400;
      if (!validId || !validMistakes || !validTime || !langGetPuzzleByIdStrict(puzzleId)) {
        setSharedLinkError(validId ? "unavailable" : "invalid");
        return;
      }
      if (!onboarded) completeOnboarding();
      startDuel(puzzleId, mistakesRaw, timeRaw, { source: "legacy" });
      query.delete("vs");
      query.delete("m");
      query.delete("t");
      const remaining = query.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname,
      );
    })();
  }, [onboarded, completeOnboarding, startDuel]);

  const dismissSharedLinkError = (): void => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("vs");
      params.delete("m");
      params.delete("t");
      params.delete("p");
      const remaining = params.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname,
      );
    }
    setSharedLinkError(null);
    if (!onboarded) completeOnboarding();
    goToMenu();
  };

  useEffect(() => {
    if (customPuzzleLoaded.current || typeof window === "undefined") return;
    const hashHasPuzzle = /(?:^#|[&#])p=/u.test(window.location.hash);
    const searchHasPuzzle = new URLSearchParams(window.location.search).has("p");
    if (!hashHasPuzzle && !searchHasPuzzle) return;
    customPuzzleLoaded.current = true;
    const source = hashHasPuzzle ? window.location.hash : window.location.search;
    void decodeSharedPuzzleFromHash(source).then((decoded) => {
      if (!decoded.ok) {
        setSharedLinkError(decoded.code === "unsupported-version" ? "unsupported" : "invalid");
        return;
      }
      const shared = validateAndBuildSharedPuzzle(decoded.payload);
      if (!shared) {
        setSharedLinkError("invalid");
        return;
      }
      if (!onboarded) completeOnboarding();
      startCustomPuzzle(shared);

      try {
        if (hashHasPuzzle) {
          window.history.replaceState(
            {},
            "",
            window.location.pathname + window.location.search,
          );
        } else {
          const params = new URLSearchParams(window.location.search);
          params.delete("p");
          const remaining = params.toString();
          window.history.replaceState(
            {},
            "",
            remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname,
          );
        }
      } catch {
        // History cleanup is cosmetic; the one-shot ref still prevents a replay.
      }
    });
  }, [onboarded, completeOnboarding, startCustomPuzzle]);

  useEffect(() => {
    trackEvent({
      name: "app_open",
      props: {
        surface: "app",
        source_bucket: bucketSource(getFirstTouch()),
        has_support_flag: isSupporter() ? "yes" : "no",
        lang: initialLang.current,
      },
    });
  }, []);

  const handleOnboardingEvent = (outcome: AnalyticsOutcome): void => {
    trackEvent({
      name: outcome === "complete" ? "onboarding_complete" : "onboarding_skip",
      props: {
        surface: "onboarding",
        outcome,
        lang,
      },
    });
  };

  // Reset document scroll on every screen change. Without this, opening a
  // taller result screen after several next-puzzle rounds leaves the user
  // scrolled mid-page and the "Next puzzle" CTA appears to drift further
  // down the viewport with each puzzle (browser scrollY preserved across
  // unmount/mount, content now longer). Always bring the player to the
  // top of the new screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Use instant scroll — the default smooth scroll fights the layout
    // settle on mobile and looks like a late jump.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  const shellClass =
    !onboarded || screen === "game"
      ? "max-w-[800px] px-3 sm:px-5 fw-safe-pt"
      : "max-w-xl px-4 fw-safe-pt-screen";

  return (
    <div className="w-full flex justify-center" data-fw-host={hostPresentation}>
      <EmbeddedMobileLaunch />
      <main
        className={`w-full ${shellClass} fw-safe-pb`}
        data-fw-screen={onboarded ? screen : "onboarding"}
      >
        <SupporterThankYou />
        {persistenceIssue === "corrupt" && <PersistenceRecoveryBanner />}
        {persistenceIssue && persistenceIssue !== "corrupt" && (
          <div
            className="mb-3 rounded-lg border border-warning/70 bg-surface px-3 py-2 text-xs text-text"
            role="alert"
            data-testid="persistence-warning"
          >
            <div className="flex items-center justify-between gap-3">
              <span>
                {persistenceIssue === "conflict"
                  ? lang === "ru"
                    ? "Игра изменена в другой вкладке. Перезагрузите страницу, чтобы открыть последнее сохранение."
                    : lang === "de"
                      ? "Das Spiel wurde in einem anderen Tab geändert. Lade neu, um den letzten Stand zu öffnen."
                      : "This game changed in another tab. Reload to open the latest saved attempt."
                  : lang === "ru"
                    ? "Прогресс этой сессии нельзя надёжно сохранить. Не закрывайте вкладку."
                    : lang === "de"
                      ? "Der Fortschritt dieser Sitzung kann nicht zuverlässig gespeichert werden. Lass den Tab offen."
                      : "This session cannot save progress reliably. Keep this tab open."}
              </span>
              {persistenceIssue === "conflict" && (
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold hover:border-accent"
                  onClick={() => window.location.reload()}
                >
                  {lang === "ru" ? "Обновить" : lang === "de" ? "Neu laden" : "Reload"}
                </button>
              )}
              {(persistenceIssue === "unavailable" || persistenceIssue === "storage-error") &&
                active?.result &&
                screen === "game" && (
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={openUnsavedResult}
                  >
                    {lang === "ru"
                      ? "Показать несохранённый итог"
                      : lang === "de"
                        ? "Ungespeichertes Ergebnis"
                        : "View unsaved result"}
                  </button>
                )}
            </div>
          </div>
        )}
        {sharedLinkError ? (
          <section
            className="mx-auto mt-10 max-w-md rounded-xl border border-warning/70 bg-surface p-5 text-center shadow-xl"
            role="alert"
            data-testid="shared-link-error"
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-warning">
              {lang === "ru"
                ? "Ссылка Foldwink"
                : lang === "de"
                  ? "Foldwink-Link"
                  : "Foldwink link"}
            </div>
            <h1 className="mt-2 text-xl font-bold text-text">
              {sharedLinkError === "unsupported"
                ? lang === "ru"
                  ? "Эта версия ссылки пока не поддерживается"
                  : lang === "de"
                    ? "Diese Link-Version wird noch nicht unterstützt"
                    : "This link version is not supported yet"
                : sharedLinkError === "unavailable"
                  ? lang === "ru"
                    ? "Эта задача недоступна в текущем каталоге"
                    : lang === "de"
                      ? "Dieses Rätsel ist im aktuellen Katalog nicht verfügbar"
                      : "This puzzle is unavailable in the current catalog"
                  : lang === "ru"
                    ? "Ссылка повреждена или слишком велика"
                    : lang === "de"
                      ? "Der Link ist beschädigt oder zu groß"
                      : "The link is damaged or too large"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {lang === "ru"
                ? "Мы не подменили её случайной задачей и не изменили ваш прогресс."
                : lang === "de"
                  ? "Wir haben sie nicht durch ein zufälliges Rätsel ersetzt und deinen Fortschritt nicht verändert."
                  : "We did not replace it with a random puzzle or change your progress."}
            </p>
            <button
              type="button"
              onClick={dismissSharedLinkError}
              className="mt-5 w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentHi"
            >
              {lang === "ru"
                ? "Перейти к обычной игре"
                : lang === "de"
                  ? "Zum normalen Spiel"
                  : "Go to the regular game"}
            </button>
          </section>
        ) : !onboarded ? (
          <Onboarding
            presentation="page"
            onDismiss={handleOnboardingComplete}
            onComplete={() => handleOnboardingEvent("complete")}
            onSkip={() => handleOnboardingEvent("skip")}
          />
        ) : (
          <>
            {(screen === "menu" || screen === "result") && (
              <Suspense fallback={null}>
                <PwaUpdateNotice />
              </Suspense>
            )}
            {screen === "menu" && <MenuScreen />}
            {screen === "game" && <GameScreen />}
            {screen === "result" && <ResultScreen />}
            {screen === "stats" && (
              <Suspense fallback={null}>
                <StatsScreen />
              </Suspense>
            )}
          </>
        )}
      </main>
      {onboarded && howToPlayOpen && (
        <Onboarding presentation="dialog" onDismiss={closeHowToPlay} />
      )}
    </div>
  );
}
