import { useEffect, useMemo, useRef, useState } from "react";
import { DialogShell } from "./DialogShell";
import { Button } from "./Button";
import { renderShareCard, type ShareCardOptions } from "../share/shareCard";
import type { Lang } from "../i18n/strings";
import { trackEvent } from "../analytics/eventLog";

type ShareAction = "text" | "challenge" | "square" | "story";
type ShareOutcome = "shared" | "unsupported" | "failed" | "cancelled";
type Fallback =
  | { kind: "text"; text: string; label: string }
  | { kind: "image"; blob: Blob; filename: string; label: string };

interface Copy {
  title: string;
  close: string;
  text: string;
  challenge: string;
  challengeUnavailable: string;
  square: string;
  story: string;
  preparing: string;
  copied: string;
  downloaded: string;
  failed: string;
  copy: string;
  copyImage: string;
  download: string;
  preview: string;
}

const COPY: Record<Lang, Copy> = {
  en: {
    title: "Share Foldwink",
    close: "Close share options",
    text: "Result text",
    challenge: "Official challenge link",
    challengeUnavailable: "Official challenge is unavailable for this legacy puzzle.",
    square: "Square image (1:1)",
    story: "Story image (9:16)",
    preparing: "Preparing image…",
    copied: "Copied.",
    downloaded: "Image downloaded.",
    failed: "Sharing is unavailable. Use the action below instead.",
    copy: "Copy",
    copyImage: "Copy image",
    download: "Download image",
    preview: "Share image preview",
  },
  ru: {
    title: "Поделиться Foldwink",
    close: "Закрыть варианты публикации",
    text: "Текст результата",
    challenge: "Официальная ссылка-вызов",
    challengeUnavailable: "Официальная ссылка недоступна для этой старой задачи.",
    square: "Квадратное изображение (1:1)",
    story: "Изображение для Stories (9:16)",
    preparing: "Готовим изображение…",
    copied: "Скопировано.",
    downloaded: "Изображение скачано.",
    failed: "Поделиться не удалось. Используйте действие ниже.",
    copy: "Копировать",
    copyImage: "Копировать изображение",
    download: "Скачать изображение",
    preview: "Предпросмотр изображения",
  },
  de: {
    title: "Foldwink teilen",
    close: "Teilen-Optionen schließen",
    text: "Ergebnistext",
    challenge: "Offizieller Challenge-Link",
    challengeUnavailable:
      "Die offizielle Challenge ist für dieses ältere Rätsel nicht verfügbar.",
    square: "Quadratisches Bild (1:1)",
    story: "Story-Bild (9:16)",
    preparing: "Bild wird vorbereitet…",
    copied: "Kopiert.",
    downloaded: "Bild heruntergeladen.",
    failed: "Teilen ist nicht verfügbar. Nutze stattdessen die Aktion unten.",
    copy: "Kopieren",
    copyImage: "Bild kopieren",
    download: "Bild herunterladen",
    preview: "Vorschau des Share-Bildes",
  },
};

function isUserCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: unknown; message?: unknown };
  return (
    value.name === "AbortError" ||
    (typeof value.message === "string" && /cancel|abort/i.test(value.message))
  );
}

async function shareText(text: string, url?: string): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  try {
    await navigator.share({ text, url });
    return "shared";
  } catch (error) {
    return isUserCancellation(error) ? "cancelled" : "failed";
  }
}

async function shareImage(blob: Blob, filename: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const data: ShareData = { files: [file], text };
  if (typeof nav.canShare === "function" && !nav.canShare(data)) return "unsupported";
  try {
    await nav.share(data);
    return "shared";
  } catch (error) {
    return isUserCancellation(error) ? "cancelled" : "failed";
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function copyImage(blob: Blob): Promise<boolean> {
  const clipboard = navigator.clipboard as Clipboard & {
    write?: (items: ClipboardItem[]) => Promise<void>;
  };
  const ClipboardItemConstructor = (
    window as unknown as { ClipboardItem?: typeof ClipboardItem }
  ).ClipboardItem;
  if (!clipboard?.write || !ClipboardItemConstructor) return false;
  try {
    await clipboard.write([new ClipboardItemConstructor({ [blob.type || "image/png"]: blob })]);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface ShareSheetProps {
  card: ShareCardOptions;
  challengeUrl?: string;
  lang: Lang;
  onClose: () => void;
  text: string;
}

export function ShareSheet({ card, challengeUrl, lang, onClose, text }: ShareSheetProps) {
  const [busyAction, setBusyAction] = useState<ShareAction | null>(null);
  const [fallback, setFallback] = useState<Fallback | null>(null);
  const [status, setStatus] = useState<string>("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const outcomeTrackedRef = useRef(false);
  const copy = COPY[lang];
  const previewUrl = useMemo(
    () => (fallback?.kind === "image" ? URL.createObjectURL(fallback.blob) : null),
    [fallback],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetActionState(): void {
    setFallback(null);
    setStatus("");
  }

  function trackShareOutcome(name: "share_completed" | "share_cancelled"): void {
    if (outcomeTrackedRef.current) return;
    outcomeTrackedRef.current = true;
    trackEvent({ name, props: { surface: "result", context: "result", lang } });
  }

  function closeShareSheet(): void {
    trackShareOutcome("share_cancelled");
    resetActionState();
    onClose();
  }

  function reportOutcome(outcome: ShareOutcome, nextFallback: Fallback): void {
    if (outcome === "shared") {
      trackShareOutcome("share_completed");
      resetActionState();
      onClose();
      return;
    }
    if (outcome === "cancelled") {
      trackShareOutcome("share_cancelled");
      resetActionState();
      onClose();
      return;
    }
    setFallback(nextFallback);
    setStatus(copy.failed);
  }

  async function handleText(): Promise<void> {
    resetActionState();
    setBusyAction("text");
    const outcome = await shareText(text);
    reportOutcome(outcome, { kind: "text", text, label: copy.copy });
    setBusyAction(null);
  }

  async function handleChallenge(): Promise<void> {
    if (!challengeUrl) return;
    resetActionState();
    setBusyAction("challenge");
    const challengeText = `${text}\n${challengeUrl}`;
    const outcome = await shareText(challengeText, challengeUrl);
    reportOutcome(outcome, { kind: "text", text: challengeUrl, label: copy.copy });
    setBusyAction(null);
  }

  async function handleImage(format: "square" | "story"): Promise<void> {
    resetActionState();
    setBusyAction(format);
    const filename = format === "story" ? "foldwink-story.png" : "foldwink.png";
    const blob = await renderShareCard({ ...card, format });
    if (!blob) {
      setStatus(copy.failed);
      setBusyAction(null);
      return;
    }
    const outcome = await shareImage(blob, filename, text);
    reportOutcome(outcome, { kind: "image", blob, filename, label: copy.download });
    setBusyAction(null);
  }

  async function handleCopy(): Promise<void> {
    if (!fallback) return;
    const copied =
      fallback.kind === "text" ? await copyText(fallback.text) : await copyImage(fallback.blob);
    if (copied) trackShareOutcome("share_completed");
    setStatus(copied ? copy.copied : copy.failed);
  }

  function handleDownload(): void {
    if (fallback?.kind !== "image") return;
    try {
      downloadBlob(fallback.blob, fallback.filename);
      trackShareOutcome("share_completed");
      setStatus(copy.downloaded);
    } catch {
      setStatus(copy.failed);
    }
  }

  const isBusy = busyAction !== null;
  const actionLabel = (action: ShareAction, label: string): string =>
    busyAction === action ? copy.preparing : label;

  return (
    <DialogShell
      onClose={closeShareSheet}
      titleId="share-sheet-title"
      initialFocusRef={closeRef}
      panelClassName="max-w-md p-4 sm:p-5"
      testId="share-sheet-dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="share-sheet-title" className="text-lg font-bold text-text">
          {copy.title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={closeShareSheet}
          aria-label={copy.close}
          className="min-h-10 min-w-10 rounded-lg border border-line text-text hover:bg-surfaceHi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          data-testid="share-sheet-close"
        >
          ×
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        <Button
          variant="secondary"
          onClick={handleText}
          disabled={isBusy}
          data-testid="share-sheet-action-text"
        >
          {actionLabel("text", copy.text)}
        </Button>
        <Button
          variant="secondary"
          onClick={handleChallenge}
          disabled={isBusy || !challengeUrl}
          data-testid="share-sheet-action-challenge"
        >
          {actionLabel("challenge", copy.challenge)}
        </Button>
        {!challengeUrl && (
          <p className="text-xs text-muted" data-testid="share-sheet-challenge-unavailable">
            {copy.challengeUnavailable}
          </p>
        )}
        <Button
          variant="secondary"
          onClick={() => handleImage("square")}
          disabled={isBusy}
          data-testid="share-sheet-action-square"
        >
          {actionLabel("square", copy.square)}
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleImage("story")}
          disabled={isBusy}
          data-testid="share-sheet-action-story"
        >
          {actionLabel("story", copy.story)}
        </Button>
      </div>

      <div className="mt-3" aria-live="polite" data-testid="share-sheet-status">
        {status && <p className="text-sm text-muted">{status}</p>}
        {fallback?.kind === "text" && (
          <div className="mt-2 space-y-2">
            <textarea
              readOnly
              value={fallback.text}
              rows={4}
              aria-label={fallback.label}
              className="w-full rounded-lg border border-line bg-surface p-2 text-xs text-text"
              data-testid="share-sheet-manual-text"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCopy}
              data-testid="share-sheet-copy-fallback"
            >
              {fallback.label}
            </Button>
          </div>
        )}
        {fallback?.kind === "image" && previewUrl && (
          <div className="mt-2 space-y-2">
            <img
              src={previewUrl}
              alt={copy.preview}
              className="mx-auto max-h-44 rounded-lg border border-line"
              data-testid="share-sheet-image-preview"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={handleCopy}
                data-testid="share-sheet-copy-fallback"
              >
                {copy.copyImage}
              </Button>
              <Button onClick={handleDownload} data-testid="share-sheet-download-fallback">
                {copy.download}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}
