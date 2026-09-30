import { useState, useSyncExternalStore } from "react";
import { useLang } from "../i18n/useLanguage";
import { flushGamePersistence } from "../game/state/appStore";
import {
  dismissServiceWorkerUpdate,
  getServiceWorkerUpdateState,
  requestServiceWorkerUpdate,
  subscribeToServiceWorkerUpdate,
} from "../pwa/updateLifecycle";

export function PwaUpdateNotice() {
  const update = useSyncExternalStore(
    subscribeToServiceWorkerUpdate,
    getServiceWorkerUpdateState,
    getServiceWorkerUpdateState,
  );
  const lang = useLang();
  const [flushFailed, setFlushFailed] = useState(false);
  const [flushing, setFlushing] = useState(false);

  if (!update.available) return null;

  const copy =
    lang === "ru"
      ? {
          title: "Обновление готово",
          body: "Оно будет применено только после вашего выбора. Перед перезагрузкой Foldwink проверит сохранение.",
          now: "Обновить сейчас",
          later: "Позже",
          error:
            "Не удалось подтвердить сохранение. Оставьте вкладку открытой и попробуйте позже.",
        }
      : lang === "de"
        ? {
            title: "Update bereit",
            body: "Es wird erst nach deiner Auswahl angewendet. Foldwink prüft das Speichern vor dem Neuladen.",
            now: "Jetzt aktualisieren",
            later: "Später",
            error:
              "Das Speichern konnte nicht bestätigt werden. Lass den Tab geöffnet und versuche es später erneut.",
          }
        : {
            title: "Update ready",
            body: "It will apply only after your choice. Foldwink checks saved progress before reloading.",
            now: "Update now",
            later: "Later",
            error:
              "Saved progress could not be confirmed. Keep this tab open and try again later.",
          };

  return (
    <aside
      className="mb-3 rounded-lg border border-accent/60 bg-surface px-3 py-3 text-left shadow-sm"
      role="status"
      aria-live="polite"
      data-testid="pwa-update-notice"
    >
      <div className="text-sm font-bold text-text">{copy.title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{copy.body}</p>
      {flushFailed && (
        <p className="mt-2 text-xs font-semibold text-warning" role="alert">
          {copy.error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-2 text-xs font-bold text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentHi"
          onClick={() => {
            setFlushFailed(false);
            setFlushing(true);
            void flushGamePersistence()
              .then((saved) => {
                if (!saved) {
                  setFlushFailed(true);
                  return;
                }
                requestServiceWorkerUpdate();
              })
              .catch(() => setFlushFailed(true))
              .finally(() => setFlushing(false));
          }}
          disabled={update.activating || flushing}
        >
          {update.activating || flushing ? "…" : copy.now}
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 text-xs font-bold text-text hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={dismissServiceWorkerUpdate}
          disabled={update.activating || flushing}
        >
          {copy.later}
        </button>
      </div>
    </aside>
  );
}
