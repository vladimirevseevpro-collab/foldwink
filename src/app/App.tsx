import { useEffect, useRef } from "react";
import { useGameStore } from "../game/state/appStore";
import { MenuScreen } from "../screens/MenuScreen";
import { GameScreen } from "../screens/GameScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { Onboarding } from "../components/Onboarding";
import { EmbeddedMobileLaunch } from "../components/EmbeddedMobileLaunch";
import { isSupporter } from "../monetization/supporter";
import { trackEvent, type AnalyticsOutcome, bucketSource } from "../analytics/eventLog";
import { useLang } from "../i18n/useLanguage";
import { getFirstTouch } from "../monetization/attribution";
import { SupporterThankYou } from "../components/SupporterThankYou";

import { prepareSoundPack } from "../audio/sound";
import { initStorageAdapter } from "../utils/storageAdapter";
import { extractSharedPuzzleFromLocation } from "../share/urlHashPuzzle";

export function App() {
  const screen = useGameStore((s) => s.screen);
  const onboarded = useGameStore((s) => s.onboarded);
  const howToPlayOpen = useGameStore((s) => s.howToPlayOpen);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const closeHowToPlay = useGameStore((s) => s.closeHowToPlay);
  const startDaily = useGameStore((s) => s.startDaily);
  const startDuel = useGameStore((s) => s.startDuel);
  const startCustomPuzzle = useGameStore((s) => s.startCustomPuzzle);
  const lang = useLang();

  const initialLang = useRef(lang);

  const handleOnboardingComplete = (): void => {
    completeOnboarding();
    // A restored game takes precedence over the normal first-run handoff.
    if (screen === "menu") startDaily();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const vs = params.get("vs");
      if (vs) {
        const m = Math.max(0, parseInt(params.get("m") ?? "0", 10) || 0);
        const t = Math.max(0, parseInt(params.get("t") ?? "0", 10) || 0);
        if (!onboarded) {
          completeOnboarding();
        }
        startDuel(vs, m, t);
        params.delete("vs");
        params.delete("m");
        params.delete("t");
        const remaining = params.toString();
        window.history.replaceState(
          {},
          "",
          remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname,
        );
      }
    } catch {
      /* ignore */
    }
  }, [onboarded, completeOnboarding, startDuel]);

  useEffect(() => {
    void initStorageAdapter();
    void extractSharedPuzzleFromLocation().then((shared) => {
      if (shared) {
        if (!onboarded) {
          completeOnboarding();
        }
        startCustomPuzzle(shared);
      }
    });
  }, [onboarded, completeOnboarding, startCustomPuzzle]);


  useEffect(() => {
    void prepareSoundPack();
    const handleFirstInteraction = (): void => {
      void prepareSoundPack();
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
    window.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true });

    trackEvent({
      name: "app_open",
      props: {
        surface: "app",
        source_bucket: bucketSource(getFirstTouch()),
        has_support_flag: isSupporter() ? "yes" : "no",
        lang: initialLang.current,
      },
    });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
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
    <div className="w-full flex justify-center">
      <EmbeddedMobileLaunch />
      <main
        className={`w-full ${shellClass} fw-safe-pb`}
        data-fw-screen={onboarded ? screen : "onboarding"}
      >
        <SupporterThankYou />
        {!onboarded ? (
          <Onboarding
            presentation="page"
            onDismiss={handleOnboardingComplete}
            onComplete={() => handleOnboardingEvent("complete")}
            onSkip={() => handleOnboardingEvent("skip")}
          />
        ) : (
          <>
            {screen === "menu" && <MenuScreen />}
            {screen === "game" && <GameScreen />}
            {screen === "result" && <ResultScreen />}
            {screen === "stats" && <StatsScreen />}
          </>
        )}
      </main>
      {onboarded && howToPlayOpen && (
        <Onboarding presentation="dialog" onDismiss={closeHowToPlay} />
      )}
    </div>
  );
}
