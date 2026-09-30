import { useRef } from "react";
import { useGameStore } from "../game/state/appStore";
import { useLang } from "../i18n/useLanguage";
import { useFeedback } from "../feedback/useFeedback";
import { DialogShell } from "./DialogShell";

interface IronContractModalProps {
  onClose: () => void;
}

/**
 * Compatibility name for the existing surface. The wager-based contract is
 * retired: this now launches an attempt-bound, no-penalty mastery challenge.
 */
export function IronContractModal({ onClose }: IronContractModalProps) {
  const startMastery = useGameStore((s) => s.startMastery);
  const lang = useLang();
  const feedback = useFeedback();
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const handleStart = () => {
    feedback("submit");
    onClose();
    startMastery();
  };

  const copy =
    lang === "ru"
      ? {
          eyebrow: "Испытание гильдии",
          title: "Проверка мастерства",
          badge: "Одна ошибка разрешена",
          condition:
            "Решите задачу Medium. Первая ошибка допускается; вторая неверная четвёрка завершит попытку. Wink остаётся бесплатным.",
          reward:
            "Без ставки и штрафа. Победа отмечает мастерство; базовый XP выдаётся только один раз за новую задачу.",
          start: "Начать испытание",
          cancel: "Не сейчас",
        }
      : lang === "de"
        ? {
            eyebrow: "Prüfung der Gilde",
            title: "Meisterprüfung",
            badge: "Ein Fehler erlaubt",
            condition:
              "Löse ein Medium-Rätsel. Der erste Fehler ist erlaubt; der zweite beendet den Versuch. Wink bleibt kostenlos.",
            reward:
              "Kein Einsatz und keine Strafe. Der Sieg markiert Meisterschaft; Basis-XP gibt es nur einmal pro neuem Rätsel.",
            start: "Prüfung starten",
            cancel: "Nicht jetzt",
          }
        : {
            eyebrow: "Guild challenge",
            title: "Mastery Challenge",
            badge: "One mistake allowed",
            condition:
              "Solve a Medium puzzle. The first mistake is allowed; the second ends the attempt. Wink remains free.",
            reward:
              "No stake and no penalty. A win records mastery; base XP is awarded only once for a new puzzle.",
            start: "Start challenge",
            cancel: "Not now",
          };

  return (
    <DialogShell
      onClose={onClose}
      titleId="mastery-dialog-title"
      descriptionId="mastery-dialog-description"
      initialFocusRef={startButtonRef}
      panelClassName="relative max-w-sm border-2 border-red-900/60 bg-[#141010] p-6 space-y-4 text-center"
      testId="mastery-dialog"
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-red-950 border-2 border-red-600/50 flex items-center justify-center text-2xl shadow-inner">
        ⚔️
      </div>

      <div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-red-400">
          {copy.eyebrow}
        </div>
        <h3 id="mastery-dialog-title" className="text-base font-extrabold text-white">
          {copy.title}
        </h3>
      </div>

      <div className="rounded-xl border border-red-950 bg-black/40 p-3.5 text-left text-xs space-y-3 text-red-100/90">
        <div className="flex items-center justify-between font-bold text-red-300">
          <span>{lang === "ru" ? "Условие:" : lang === "de" ? "Regel:" : "Rule:"}</span>
          <span className="uppercase text-[10px] tracking-wider bg-red-900/40 px-2 py-0.5 rounded text-red-200">
            {copy.badge}
          </span>
        </div>
        <p id="mastery-dialog-description" className="text-[11px] text-muted leading-relaxed">
          {copy.condition}
        </p>
        <p className="pt-2 border-t border-red-950/60 text-[11px] text-muted leading-relaxed">
          {copy.reward}
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <button
          ref={startButtonRef}
          type="button"
          onClick={handleStart}
          className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md bg-red-700 hover:bg-red-600 text-white cursor-pointer"
        >
          {copy.start}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 text-xs text-muted hover:text-text transition-colors"
        >
          {copy.cancel}
        </button>
      </div>
    </DialogShell>
  );
}
