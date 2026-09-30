import { useState } from "react";
import { useLang } from "../i18n/useLanguage";
import {
  clearCorruptAggregate,
  downloadCorruptAggregateSnapshot,
} from "../persistence/corruptRecovery";

export function PersistenceRecoveryBanner() {
  const lang = useLang();
  const [clearing, setClearing] = useState(false);
  const [clearFailed, setClearFailed] = useState(false);

  const text =
    lang === "ru"
      ? {
          title: "Сохранение повреждено",
          body: "Foldwink не перезаписал исходные данные. Скачайте локальную диагностическую копию, затем повторите чтение или очистите только повреждённую запись.",
          download: "Скачать копию",
          retry: "Повторить",
          clear: "Очистить запись",
          confirm:
            "Удалить повреждённую запись Foldwink из IndexedDB? Диагностическая копия останется в загрузках, если вы её скачали.",
          changed:
            "Запись уже изменилась в другой вкладке или не очистилась. Обновите страницу.",
        }
      : lang === "de"
        ? {
            title: "Speicherstand beschädigt",
            body: "Foldwink hat die Quelldaten nicht überschrieben. Lade zuerst eine lokale Diagnosekopie herunter; danach kannst du erneut lesen oder nur den beschädigten Eintrag löschen.",
            download: "Kopie laden",
            retry: "Erneut versuchen",
            clear: "Eintrag löschen",
            confirm:
              "Den beschädigten Foldwink-Eintrag aus IndexedDB löschen? Eine bereits heruntergeladene Diagnosekopie bleibt erhalten.",
            changed:
              "Der Eintrag wurde in einem anderen Tab geändert oder konnte nicht gelöscht werden. Lade die Seite neu.",
          }
        : {
            title: "Save data is damaged",
            body: "Foldwink did not overwrite the source data. Download a local diagnostic copy first, then retry or clear only the damaged record.",
            download: "Download copy",
            retry: "Retry",
            clear: "Clear record",
            confirm:
              "Delete the damaged Foldwink record from IndexedDB? A diagnostic copy remains available if you downloaded it.",
            changed:
              "The record changed in another tab or could not be cleared. Reload this page.",
          };

  const handleClear = async () => {
    if (typeof window === "undefined" || !window.confirm(text.confirm)) return;
    setClearing(true);
    setClearFailed(false);
    try {
      await clearCorruptAggregate();
      window.location.reload();
    } catch {
      setClearing(false);
      setClearFailed(true);
    }
  };

  return (
    <div
      className="mb-3 rounded-lg border border-warning/70 bg-surface px-3 py-3 text-xs text-text"
      role="alert"
      data-testid="persistence-recovery"
    >
      <div className="font-semibold">{text.title}</div>
      <p className="mt-1 leading-relaxed text-muted">{text.body}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-line px-2.5 py-1.5 font-semibold hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={downloadCorruptAggregateSnapshot}
        >
          {text.download}
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-2.5 py-1.5 font-semibold hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => window.location.reload()}
        >
          {text.retry}
        </button>
        <button
          type="button"
          className="rounded-md border border-warning/70 px-2.5 py-1.5 font-semibold hover:border-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
          onClick={() => void handleClear()}
          disabled={clearing}
        >
          {text.clear}
        </button>
      </div>
      {clearFailed && (
        <p className="mt-2 text-warning" role="status">
          {text.changed}
        </p>
      )}
    </div>
  );
}
