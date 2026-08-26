import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { BrandMark } from "./BrandMark";
import { FoldedCorner } from "./FoldedCorner";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "../i18n/useLanguage";

interface Props {
  onDismiss: () => void;
  presentation?: "page" | "dialog";
  onComplete?: () => void;
  onSkip?: () => void;
}

type TutorialStep = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 4;

export function Onboarding({ onDismiss, presentation = "dialog", onComplete, onSkip }: Props) {
  const t = useT();
  const isDialog = presentation === "dialog";
  const [step, setStep] = useState<TutorialStep>(1);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [winked, setWinked] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLButtonElement | null>(null);
  const stepActionRef = useRef<HTMLButtonElement | null>(null);
  const winkRef = useRef<HTMLButtonElement | null>(null);
  const dismissRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const stepRef = useRef<TutorialStep>(step);
  const titleId = useId();
  const instructionId = useId();

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (isDialog && typeof document !== "undefined") {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    }

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (stepRef.current < 3) onSkip?.();
        onDismiss();
        return;
      }
      if (!isDialog || e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (isDialog) returnFocusRef.current?.focus();
    };
  }, [isDialog, onDismiss, onSkip]);

  useEffect(() => {
    if (step === 1) firstCardRef.current?.focus();
    if (step === 2) stepActionRef.current?.focus();
    if (step === 3) winkRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step === 3 && winked) dismissRef.current?.focus();
  }, [step, winked]);

  const toggleDemoCard = (index: number): void => {
    setSelectedCards((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  };

  const renderDemoCards = (solved: boolean) => (
    <div className="grid grid-cols-2 gap-2" aria-label={t.onboarding.demoGroupAria}>
      {t.onboarding.demoCards.map((card, index) => {
        const selected = selectedCards.includes(index);
        const interactive = step === 1;
        const stateClass = solved
          ? "border-solved2Border bg-solved2 text-ink shadow-solved2"
          : selected || !interactive
            ? "border-accent bg-paperHi text-ink shadow-paperSelected -translate-y-px"
            : "border-paperBorder bg-paper text-ink shadow-paper hover:-translate-y-px hover:bg-paperHi";
        const showCorner = !solved && (selected || !interactive);

        if (!interactive) {
          return (
            <div
              key={card}
              className={`relative min-h-14 overflow-hidden rounded-lg border-2 px-2 py-3 flex items-center justify-center text-center text-base font-bold leading-tight ${stateClass}`}
            >
              {showCorner && <FoldedCorner />}
              <span className="relative">{card}</span>
            </div>
          );
        }

        return (
          <button
            key={card}
            ref={index === 0 ? firstCardRef : undefined}
            type="button"
            aria-pressed={selected}
            onClick={() => toggleDemoCard(index)}
            className={`relative min-h-14 overflow-hidden rounded-lg border-2 px-2 py-3 text-center text-base font-bold leading-tight transition-[transform,box-shadow,background-color,border-color,color] motion-reduce:transition-none ${stateClass}`}
          >
            {showCorner && <FoldedCorner />}
            <span className="relative">{card}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={dialogRef}
      data-testid="onboarding"
      className={
        isDialog
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4"
          : "w-full min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-start pt-2 sm:justify-center sm:pt-0"
      }
      role={isDialog ? "dialog" : "region"}
      aria-modal={isDialog ? "true" : undefined}
      aria-labelledby={titleId}
      aria-describedby={instructionId}
    >
      <div
        className={
          isDialog
            ? "w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-lg bg-surface border border-line p-4 sm:p-6 shadow-2xl"
            : "w-full max-w-lg py-2 sm:py-4"
        }
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="[&_button]:min-h-11 [&_button]:min-w-11 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm">
            <LanguageToggle />
          </div>
          {step < 4 && (
            <button
              type="button"
              onClick={() => {
                onSkip?.();
                onDismiss();
              }}
              className="min-h-11 px-3 rounded-lg text-sm font-semibold text-muted hover:text-text hover:bg-surfaceHi transition-colors motion-reduce:transition-none"
            >
              {t.onboarding.skip}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 text-center mb-3">
          <BrandMark size={34} />
          <div className="text-left">
            <div className="text-sm font-bold text-text">Foldwink</div>
            <h2 id={titleId} className="text-xl font-extrabold leading-tight">
              {t.onboarding.howToPlay}
            </h2>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 mb-4"
          aria-label={t.onboarding.progressAria}
        >
          <span className="text-sm font-semibold text-muted">
            {t.onboarding.stepLabel(step, TOTAL_STEPS)}
          </span>
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`h-2 w-8 rounded-full transition-colors motion-reduce:transition-none ${
                  item <= step ? "bg-accent" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <section aria-labelledby={`${titleId}-step-1`}>
            <h3 id={`${titleId}-step-1`} className="text-lg font-bold text-text">
              {t.onboarding.selectTitle}
            </h3>
            <p id={instructionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.selectBody}
            </p>
            {renderDemoCards(false)}
            <p className="mt-3 text-sm font-semibold text-center text-muted" aria-live="polite">
              {t.onboarding.selectedCount(selectedCards.length, t.onboarding.demoCards.length)}
            </p>
            <Button
              ref={stepActionRef}
              className="w-full min-h-12 mt-3 motion-reduce:transition-none"
              disabled={selectedCards.length !== t.onboarding.demoCards.length}
              onClick={() => setStep(2)}
            >
              {t.onboarding.continueAction}
            </Button>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby={`${titleId}-step-2`}>
            <h3 id={`${titleId}-step-2`} className="text-lg font-bold text-text">
              {t.onboarding.submitTitle}
            </h3>
            <p id={instructionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.submitBody}
            </p>
            {renderDemoCards(submitted)}
            <div className="min-h-12 mt-3" aria-live="polite">
              {submitted && (
                <div className="min-h-12 rounded-lg border border-solved2Border bg-solved2 px-4 py-3 flex items-center justify-center text-center text-base font-extrabold text-ink shadow-solved2">
                  {t.onboarding.correctGroup}
                </div>
              )}
            </div>
            <Button
              ref={stepActionRef}
              className="w-full min-h-12 mt-3 motion-reduce:transition-none"
              onClick={() => (submitted ? setStep(3) : setSubmitted(true))}
            >
              {submitted ? t.onboarding.continueAction : t.game.submit}
            </Button>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby={`${titleId}-step-3`}>
            <h3 id={`${titleId}-step-3`} className="text-lg font-bold text-text">
              {t.onboarding.tabsTitle}
            </h3>
            <p id={instructionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.tabsBody}
            </p>
            <div className="mb-2 text-sm font-semibold text-muted">{t.onboarding.tabsHint}</div>
            <div className="grid grid-cols-2 gap-2">
              {t.onboarding.demoTabs.map((tab, index) => {
                if (index === 0 && !winked) {
                  return (
                    <button
                      key={tab}
                      ref={winkRef}
                      type="button"
                      aria-label={t.onboarding.winkAria}
                      onClick={() => setWinked(true)}
                      className="relative min-h-14 overflow-hidden rounded-t-lg rounded-b-[4px] border-2 border-accent bg-paperHi px-3 py-3 text-base font-bold text-ink shadow-tab hover:-translate-y-px transition-[transform,background-color,border-color] motion-reduce:transition-none"
                    >
                      <FoldedCorner />
                      <span className="relative block text-xs mb-0.5 text-accent">
                        {t.onboarding.wink}
                      </span>
                      <span className="relative">{tab}</span>
                    </button>
                  );
                }

                return (
                  <div
                    key={tab}
                    className={`relative min-h-14 overflow-hidden rounded-t-lg rounded-b-[4px] border border-b-2 px-3 py-3 flex items-center justify-center text-center text-base font-bold shadow-tab ${
                      index === 0
                        ? "border-accent bg-paper text-ink"
                        : "border-line bg-surfaceHi text-text"
                    }`}
                  >
                    {index === 0 && winked && <FoldedCorner />}
                    {index === 0 && winked ? `✦ ${t.onboarding.demoCategory}` : tab}
                  </div>
                );
              })}
            </div>
            <p
              className={`min-h-14 mt-3 rounded-lg border px-4 py-3 text-base leading-relaxed ${
                winked
                  ? "border-accent/50 bg-accent/10 text-text"
                  : "border-line bg-surface text-muted"
              }`}
              aria-live="polite"
            >
              {winked ? t.onboarding.winkResult : t.onboarding.winkPrompt}
            </p>
            <Button
              ref={dismissRef}
              variant={winked ? "primary" : "secondary"}
              onClick={() => setStep(4)}
              className="w-full min-h-12 mt-3 motion-reduce:transition-none"
            >
              {t.onboarding.continueAction}
            </Button>
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby={`${titleId}-step-4`}>
            <h3 id={`${titleId}-step-4`} className="text-lg font-bold text-text">
              {t.onboarding.guildTitle}
            </h3>
            <p id={instructionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.guildBody}
            </p>

            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-3 rounded-xl border border-line bg-surfaceHi/60 space-y-1">
                <span className="text-2xl">📯</span>
                <div className="text-xs font-bold text-text">Loot Dispatch</div>
                <div className="text-[10px] text-muted">Ink, Wax & XP</div>
              </div>
              <div className="p-3 rounded-xl border border-line bg-surfaceHi/60 space-y-1">
                <span className="text-2xl">📜</span>
                <div className="text-xs font-bold text-text">Scribe Pass</div>
                <div className="text-[10px] text-muted">Ranks & Stamps</div>
              </div>
              <div className="p-3 rounded-xl border border-line bg-surfaceHi/60 space-y-1">
                <span className="text-2xl">⚔️</span>
                <div className="text-xs font-bold text-text">Iron Contract</div>
                <div className="text-[10px] text-muted">High Stakes</div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                onComplete?.();
                onDismiss();
              }}
              className="w-full min-h-12 mt-4 motion-reduce:transition-none"
            >
              {t.onboarding.gotIt}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
