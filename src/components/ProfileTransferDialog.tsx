import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { DialogShell } from "./DialogShell";
import {
  PROFILE_BACKUP_MAX_BYTES,
  ProfileBackupError,
  commitProfileImport,
  hasProfileImportRecovery,
  parseProfileBackup,
  previewProfileBackup,
  readCurrentProfileBackup,
  restoreLastProfileImport,
  type BaselineChoice,
  type BackupPreview,
  type ProfileBackupEnvelope,
  type ProfileImportMode,
} from "../persistence/profileBackup";
import type { PersistedLanguage } from "../persistence/gameRepository";

interface ProfileTransferDialogProps {
  language: PersistedLanguage;
  onClose: () => void;
}

type TransferCopy = {
  title: string;
  intro: string;
  export: string;
  exportHelp: string;
  import: string;
  paste: string;
  preview: string;
  merge: string;
  replace: string;
  current: string;
  imported: string;
  confirmReplace: string;
  close: string;
  fallback: string;
  copy: string;
  copied: string;
  reloading: string;
};

function copyFor(language: PersistedLanguage): TransferCopy {
  if (language === "ru") {
    return {
      title: "Полный backup / import",
      intro:
        "Переносит прогресс, решения, daily и коллекцию. Настройки, согласия и Supporter не переносятся.",
      export: "Скачать JSON backup",
      exportHelp: "Сохраните файл в надёжном месте — он содержит полный игровой прогресс.",
      import: "Выберите JSON backup",
      paste: "Или вставьте JSON backup",
      preview: "Проверить и показать предпросмотр",
      merge: "Объединить (рекомендуется)",
      replace: "Заменить текущий профиль",
      current: "Текущий",
      imported: "Импортируемый",
      confirmReplace: "Я понимаю: импорт заменит текущий прогресс.",
      close: "Закрыть",
      fallback: "Скачивание недоступно. Скопируйте JSON вручную:",
      copy: "Копировать JSON",
      copied: "JSON скопирован.",
      reloading: "Импорт сохранён. Перезагружаем игру…",
    };
  }
  if (language === "de") {
    return {
      title: "Vollständiges Backup / Import",
      intro:
        "Überträgt Fortschritt, Lösungen, Daily-Verlauf und Sammlung. Einstellungen, Einwilligungen und Supporter werden nicht übertragen.",
      export: "JSON-Backup herunterladen",
      exportHelp:
        "Bewahre die Datei sicher auf — sie enthält deinen gesamten Spielfortschritt.",
      import: "JSON-Backup auswählen",
      paste: "Oder JSON-Backup einfügen",
      preview: "Prüfen und Vorschau anzeigen",
      merge: "Zusammenführen (empfohlen)",
      replace: "Lokales Profil ersetzen",
      current: "Aktuell",
      imported: "Importiert",
      confirmReplace: "Ich verstehe: Der Import ersetzt meinen lokalen Fortschritt.",
      close: "Schließen",
      fallback: "Download nicht verfügbar. JSON manuell kopieren:",
      copy: "JSON kopieren",
      copied: "JSON wurde kopiert.",
      reloading: "Import gespeichert. Spiel wird neu geladen…",
    };
  }
  return {
    title: "Full backup / import",
    intro:
      "Transfers progress, solves, daily history, and collection. Settings, consent, and Supporter status are not transferred.",
    export: "Download JSON backup",
    exportHelp: "Keep the file safe — it contains your full game progress.",
    import: "Choose JSON backup",
    paste: "Or paste JSON backup",
    preview: "Validate & preview",
    merge: "Merge (recommended)",
    replace: "Replace local profile",
    current: "Current",
    imported: "Imported",
    confirmReplace: "I understand: importing replaces my local progress.",
    close: "Close",
    fallback: "Download is unavailable. Copy the JSON manually:",
    copy: "Copy JSON",
    copied: "JSON copied.",
    reloading: "Import saved. Reloading the game…",
  };
}

function errorMessage(error: unknown, language: PersistedLanguage): string {
  const detail = error instanceof ProfileBackupError ? error.message : "";
  if (language === "ru") return detail || "Не удалось обработать backup. Попробуйте ещё раз.";
  if (language === "de")
    return detail || "Backup konnte nicht verarbeitet werden. Bitte erneut versuchen.";
  return detail || "The backup could not be processed. Please try again.";
}

function limitMessage(language: PersistedLanguage): string {
  if (language === "ru") return "Backup превышает лимит 2 МиБ.";
  if (language === "de") return "Das Backup überschreitet das Limit von 2 MiB.";
  return "Backup exceeds the 2 MiB limit.";
}

function safeFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `foldwink-profile-backup-${date}.json`;
}

function triggerDownload(content: string): boolean {
  try {
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename();
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function ProfileTransferDialog({ language, onClose }: ProfileTransferDialogProps) {
  const copy = copyFor(language);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [exportText, setExportText] = useState("");
  const [showExportFallback, setShowExportFallback] = useState(false);
  const [rawImport, setRawImport] = useState("");
  const [envelope, setEnvelope] = useState<ProfileBackupEnvelope | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [mode, setMode] = useState<ProfileImportMode>("merge");
  const [baselineChoice, setBaselineChoice] = useState<BaselineChoice | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    void hasProfileImportRecovery().then(setHasRecovery);
  }, []);

  const resetPreview = () => {
    setEnvelope(null);
    setPreview(null);
    setBaselineChoice(null);
    setReplaceConfirmed(false);
    setNotice(null);
  };

  const setImportText = (value: string) => {
    setRawImport(value);
    resetPreview();
    setError(null);
  };

  const handleExport = async () => {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const backup = await readCurrentProfileBackup(language);
      setExportText(backup);
      setShowExportFallback(!triggerDownload(backup));
    } catch (caught) {
      setError(errorMessage(caught, language));
    } finally {
      setWorking(false);
    }
  };

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setNotice(copy.copied);
    } catch (caught) {
      setError(errorMessage(caught, language));
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > PROFILE_BACKUP_MAX_BYTES) {
      setError(limitMessage(language));
      return;
    }
    try {
      setImportText(await file.text());
    } catch (caught) {
      setError(errorMessage(caught, language));
    }
  };

  const handlePreview = async () => {
    setError(null);
    setNotice(null);
    if (bytes(rawImport) > PROFILE_BACKUP_MAX_BYTES) {
      setError(limitMessage(language));
      return;
    }
    try {
      const parsed = parseProfileBackup(rawImport);
      // Preview is deliberately read-only; commit only happens below.
      setWorking(true);
      const current = parseProfileBackup(await readCurrentProfileBackup(language));
      setEnvelope(parsed);
      setPreview(previewProfileBackup(current.aggregate, parsed));
    } catch (caught) {
      setError(errorMessage(caught, language));
    } finally {
      setWorking(false);
    }
  };

  const handleCommit = async () => {
    if (!envelope || !preview) return;
    if (mode === "replace" && !replaceConfirmed) return;
    if (mode === "merge" && preview.requiresBaselineSelection && !baselineChoice) return;
    setWorking(true);
    setError(null);
    try {
      await commitProfileImport(envelope, mode, baselineChoice ?? undefined);
      setNotice(copy.reloading);
      window.setTimeout(() => window.location.reload(), 350);
    } catch (caught) {
      setError(errorMessage(caught, language));
    } finally {
      setWorking(false);
    }
  };

  const handleRestore = async () => {
    setWorking(true);
    setError(null);
    try {
      await restoreLastProfileImport(language);
      setNotice(copy.reloading);
      window.setTimeout(() => window.location.reload(), 350);
    } catch (caught) {
      setError(errorMessage(caught, language));
    } finally {
      setWorking(false);
    }
  };

  const canCommit =
    !!envelope &&
    !!preview &&
    !working &&
    (mode !== "replace" || replaceConfirmed) &&
    (mode !== "merge" || !preview.requiresBaselineSelection || !!baselineChoice);

  return (
    <DialogShell
      onClose={onClose}
      titleId="profile-transfer-title"
      descriptionId="profile-transfer-description"
      initialFocusRef={firstInputRef}
      panelClassName="max-w-lg p-4 sm:p-6"
      testId="profile-transfer-dialog"
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="profile-transfer-title" className="text-base font-bold text-text">
              {copy.title}
            </h2>
            <p
              id="profile-transfer-description"
              className="mt-1 text-xs leading-relaxed text-muted"
            >
              {copy.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-muted hover:text-text"
            aria-label={copy.close}
          >
            ✕
          </button>
        </div>

        <section className="rounded-xl border border-line bg-surfaceHi/40 p-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text">
            1. {copy.export}
          </h3>
          <p className="text-[11px] text-muted">{copy.exportHelp}</p>
          <button
            type="button"
            onClick={handleExport}
            disabled={working}
            className="w-full rounded-lg border border-accent bg-accent px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            data-testid="profile-transfer-export"
          >
            {copy.export}
          </button>
          {showExportFallback && exportText && (
            <div className="space-y-2">
              <label className="block text-[11px] text-amber-200" htmlFor="profile-export-text">
                {copy.fallback}
              </label>
              <textarea
                id="profile-export-text"
                readOnly
                value={exportText}
                rows={5}
                className="w-full rounded-lg border border-line bg-surface p-2 font-mono text-[10px] text-text"
              />
              <button
                type="button"
                onClick={handleCopyExport}
                className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-text"
              >
                {copy.copy}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surfaceHi/40 p-3 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text">
            2.{" "}
            {language === "ru"
              ? "Импорт JSON backup"
              : language === "de"
                ? "JSON-Backup importieren"
                : "Import JSON backup"}
          </h3>
          <label className="block text-xs font-medium text-text" htmlFor="profile-import-file">
            {copy.import}
          </label>
          <input
            ref={firstInputRef}
            id="profile-import-file"
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surfaceHi file:px-3 file:py-2 file:text-xs file:font-bold file:text-text"
          />
          <label className="block text-xs font-medium text-text" htmlFor="profile-import-text">
            {copy.paste}
          </label>
          <textarea
            id="profile-import-text"
            value={rawImport}
            onChange={(event) => setImportText(event.target.value)}
            rows={5}
            className="w-full rounded-lg border border-line bg-surface p-2 font-mono text-[10px] text-text focus:border-accent focus:outline-none"
            data-testid="profile-transfer-import-text"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={!rawImport.trim() || working}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-xs font-bold text-text disabled:opacity-50"
            data-testid="profile-transfer-preview-action"
          >
            {copy.preview}
          </button>
        </section>

        {hasRecovery && (
          <section className="rounded-xl border border-amber-500/45 bg-amber-950/20 p-3">
            <p className="text-[11px] leading-relaxed text-amber-100">
              {language === "ru"
                ? "Есть атомарный снимок профиля до последнего импорта. Его можно восстановить без сложения XP."
                : language === "de"
                  ? "Ein atomarer Stand vor dem letzten Import ist verfügbar. Er kann ohne Addition von XP wiederhergestellt werden."
                  : "An atomic snapshot from before the last import is available. It can be restored without adding XP."}
            </p>
            <button
              type="button"
              onClick={handleRestore}
              disabled={working}
              className="mt-2 w-full rounded-lg border border-amber-500/60 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-50"
              data-testid="profile-transfer-restore"
            >
              {language === "ru"
                ? "Отменить последний импорт"
                : language === "de"
                  ? "Letzten Import rückgängig machen"
                  : "Undo last import"}
            </button>
          </section>
        )}

        {preview && envelope && (
          <section
            className="rounded-xl border border-accent/60 bg-accent/10 p-3 space-y-3"
            data-testid="profile-transfer-preview"
          >
            <h3 className="text-xs font-bold text-accent">✓ {copy.preview}</h3>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
              <dt>Version</dt>
              <dd className="text-right text-text">{envelope.version}</dd>
              <dt>Language</dt>
              <dd className="text-right text-text">{preview.language.toUpperCase()}</dd>
              <dt>Date</dt>
              <dd className="text-right text-text">
                {new Date(preview.createdAt).toLocaleString()}
              </dd>
              <dt>Solved</dt>
              <dd className="text-right text-text">{preview.solvedMarkers}</dd>
              <dt>Daily records</dt>
              <dd className="text-right text-text">{preview.dailyRecords}</dd>
              <dt>Collection</dt>
              <dd className="text-right text-text">{preview.collectionRecords}</dd>
              <dt>Attempts</dt>
              <dd className="text-right text-text">{preview.terminalAttempts}</dd>
              <dt>Daily conflicts</dt>
              <dd className="text-right text-text">{preview.conflictingDailySlots.length}</dd>
              <dt>Legacy XP baseline</dt>
              <dd className="text-right text-text">
                {copy.current}: {preview.currentLegacyBaseline} · {copy.imported}:{" "}
                {preview.importedLegacyBaseline}
              </dd>
            </dl>
            {preview.conflictingDailySlots.length > 0 && (
              <p className="text-[11px] text-amber-200">
                {preview.conflictingDailySlots.join(", ")}
              </p>
            )}

            <fieldset className="space-y-2 border-t border-accent/30 pt-3">
              <legend className="text-xs font-bold text-text">
                {language === "ru"
                  ? "Режим импорта"
                  : language === "de"
                    ? "Importmodus"
                    : "Import mode"}
              </legend>
              <label className="flex items-center gap-2 text-xs text-text">
                <input
                  type="radio"
                  name="profile-import-mode"
                  checked={mode === "merge"}
                  onChange={() => {
                    setMode("merge");
                    setReplaceConfirmed(false);
                  }}
                />{" "}
                {copy.merge}
              </label>
              <label className="flex items-center gap-2 text-xs text-text">
                <input
                  type="radio"
                  name="profile-import-mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />{" "}
                {copy.replace}
              </label>
            </fieldset>

            {mode === "merge" && preview.requiresBaselineSelection && (
              <fieldset className="space-y-2 rounded-lg border border-amber-500/50 p-2">
                <legend className="px-1 text-[11px] font-bold text-amber-200">
                  {language === "ru"
                    ? "Выберите сохраняемую legacy XP базу"
                    : language === "de"
                      ? "Zu behaltende Legacy-XP-Basis wählen"
                      : "Choose the legacy XP baseline to retain"}
                </legend>
                <label className="flex items-center gap-2 text-xs text-text">
                  <input
                    type="radio"
                    name="profile-baseline"
                    checked={baselineChoice === "current"}
                    onChange={() => setBaselineChoice("current")}
                  />{" "}
                  {copy.current}: {preview.currentLegacyBaseline}
                </label>
                <label className="flex items-center gap-2 text-xs text-text">
                  <input
                    type="radio"
                    name="profile-baseline"
                    checked={baselineChoice === "imported"}
                    onChange={() => setBaselineChoice("imported")}
                  />{" "}
                  {copy.imported}: {preview.importedLegacyBaseline}
                </label>
              </fieldset>
            )}

            {mode === "replace" && (
              <label className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-950/20 p-2 text-xs text-red-100">
                <input
                  type="checkbox"
                  checked={replaceConfirmed}
                  onChange={(event) => setReplaceConfirmed(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{copy.confirmReplace}</span>
              </label>
            )}

            <button
              type="button"
              onClick={handleCommit}
              disabled={!canCommit}
              className="w-full rounded-lg border border-accent bg-accent px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              data-testid="profile-transfer-commit"
            >
              {mode === "merge" ? copy.merge : copy.replace}
            </button>
          </section>
        )}

        {(error || notice) && (
          <p
            role="status"
            aria-live="polite"
            className={`rounded-lg border p-2 text-xs ${error ? "border-red-500/50 bg-red-950/30 text-red-200" : "border-green-500/50 bg-green-950/30 text-green-200"}`}
          >
            {error ?? notice}
          </p>
        )}
      </div>
    </DialogShell>
  );
}
