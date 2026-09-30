import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "../i18n/useLanguage";
import { useLang } from "../i18n/useLanguage";
import { trackEvent } from "../analytics/eventLog";

interface Props {
  onDismiss: () => void;
  presentation?: "page" | "dialog";
  onComplete?: () => void;
  onSkip?: () => void;
}
type TutorialStep = 1 | 2;

/** Two-action first-run lesson: choose four cards, then submit the group. */
export function Onboarding({ onDismiss, presentation = "dialog", onComplete, onSkip }: Props) {
  const t = useT();
  const lang = useLang();
  const isDialog = presentation === "dialog";
  const [step, setStep] = useState<TutorialStep>(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const startedTrackedRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (isDialog && typeof document !== "undefined")
      returnFocusRef.current = document.activeElement as HTMLElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
        return;
      }
      if (!isDialog || event.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
      if (!focusable.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (isDialog) returnFocusRef.current?.focus();
    };
    // Escape uses the stable dismissal contract; the callback is intentionally local to this dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialog, onDismiss, onSkip]);
  useEffect(() => {
    (step === 1 ? firstCardRef : actionRef).current?.focus();
  }, [step]);
  useEffect(() => {
    if (startedTrackedRef.current) return;
    startedTrackedRef.current = true;
    trackEvent({
      name: "onboarding_started",
      props: { surface: "onboarding", context: "onboarding", lang },
    });
  }, [lang]);
  const cards = t.onboarding.demoCards;
  const toggle = (index: number) =>
    setSelected((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  const completeSelectionStep = () => {
    trackEvent({
      name: "onboarding_step_completed",
      props: { surface: "onboarding", context: "onboarding", lang },
    });
    setStep(2);
  };
  const submitDemoGroup = () => {
    trackEvent({
      name: "onboarding_step_completed",
      props: { surface: "onboarding", context: "onboarding", lang },
    });
    setSubmitted(true);
  };
  const finish = () => {
    onComplete?.();
    onDismiss();
  };
  const skip = () => {
    trackEvent({
      name: "onboarding_skipped",
      props: { surface: "onboarding", context: "onboarding", outcome: "skip", lang },
    });
    onSkip?.();
    onDismiss();
  };
  return (
    <div
      ref={rootRef}
      data-testid="onboarding"
      className={
        isDialog
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3"
          : "w-full min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center"
      }
      role={isDialog ? "dialog" : "region"}
      aria-modal={isDialog ? "true" : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className={
          isDialog
            ? "w-full max-w-lg rounded-lg bg-surface border border-line p-4 sm:p-6 shadow-2xl"
            : "w-full max-w-lg py-4"
        }
      >
        <div className="flex items-center justify-between mb-4">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => {
              skip();
            }}
            className="min-h-11 px-3 rounded-lg text-sm font-semibold text-muted hover:text-text"
          >
            {t.onboarding.skip}
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 text-center mb-3">
          <BrandMark size={34} />
          <div className="text-left">
            <div className="text-sm font-bold text-text">Foldwink</div>
            <h2 id={titleId} className="text-xl font-extrabold">
              {t.onboarding.howToPlay}
            </h2>
          </div>
        </div>
        <div
          className="flex items-center justify-between mb-4"
          aria-label={t.onboarding.progressAria}
        >
          <span className="text-sm font-semibold text-muted">
            {t.onboarding.stepLabel(step, 2)}
          </span>
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2].map((item) => (
              <span
                key={item}
                className={`h-2 w-8 rounded-full ${item <= step ? "bg-accent" : "bg-line"}`}
              />
            ))}
          </div>
        </div>
        {step === 1 ? (
          <section aria-labelledby={`${titleId}-step-1`}>
            <h3 id={`${titleId}-step-1`} className="text-lg font-bold text-text">
              {t.onboarding.selectTitle}
            </h3>
            <p id={descriptionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.selectBody}
            </p>
            <div className="grid grid-cols-2 gap-2" aria-label={t.onboarding.demoGroupAria}>
              {cards.map((card, index) => (
                <button
                  key={card}
                  ref={index === 0 ? firstCardRef : undefined}
                  type="button"
                  aria-pressed={selected.includes(index)}
                  onClick={() => toggle(index)}
                  className={`min-h-14 rounded-lg border-2 px-2 py-3 text-center text-base font-bold ${selected.includes(index) ? "border-accent bg-paperHi text-ink" : "border-paperBorder bg-paper text-ink"}`}
                >
                  {card}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-center text-muted" aria-live="polite">
              {t.onboarding.selectedCount(selected.length, cards.length)}
            </p>
            <Button
              ref={actionRef}
              className="w-full min-h-12 mt-3"
              disabled={selected.length !== cards.length}
              onClick={completeSelectionStep}
            >
              {t.onboarding.continueAction}
            </Button>
          </section>
        ) : (
          <section aria-labelledby={`${titleId}-step-2`}>
            <h3 id={`${titleId}-step-2`} className="text-lg font-bold text-text">
              {t.onboarding.submitTitle}
            </h3>
            <p id={descriptionId} className="mt-1 mb-4 text-base leading-relaxed text-muted">
              {t.onboarding.submitBody}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cards.map((card) => (
                <div
                  key={card}
                  className={`min-h-14 rounded-lg border-2 px-2 py-3 flex items-center justify-center text-center text-base font-bold ${submitted ? "border-solved2Border bg-solved2 text-ink" : "border-accent bg-paperHi text-ink"}`}
                >
                  {card}
                </div>
              ))}
            </div>
            <div className="min-h-12 mt-3" aria-live="polite">
              {submitted && (
                <div className="rounded-lg border border-solved2Border bg-solved2 px-4 py-3 text-center font-extrabold text-ink">
                  {t.onboarding.correctGroup}
                </div>
              )}
            </div>
            <Button
              ref={actionRef}
              className="w-full min-h-12 mt-3"
              onClick={() => (submitted ? finish() : submitDemoGroup())}
            >
              {submitted ? t.onboarding.gotIt : t.game.submit}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
