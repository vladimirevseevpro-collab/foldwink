import { useState } from "react";
import { Button } from "./Button";
import { renderShareCard, type ShareCardOptions } from "../share/shareCard";
import { useT } from "../i18n/useLanguage";
import { trackEvent } from "../analytics/eventLog";
import { useGameStore } from "../game/state/appStore";
import { useLang } from "../i18n/useLanguage";

interface Props {
  text: string;
  card?: ShareCardOptions;
  filename?: string;
}

type Status = "idle" | "sharing" | "copied" | "downloaded" | "failed";

type ShareOutcome = "shared" | "unsupported" | "failed" | "cancelled";

function isUserCancellation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; message?: unknown };
  if (e.name === "AbortError") return true;
  if (typeof e.message === "string" && /cancel|abort/i.test(e.message)) return true;
  return false;
}

async function tryShareFile(file: File, text: string): Promise<ShareOutcome> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share !== "function") return "unsupported";
  const data: ShareData = { files: [file], text };
  if (typeof nav.canShare === "function" && !nav.canShare(data)) return "unsupported";
  try {
    await nav.share(data);
    return "shared";
  } catch (err) {
    return isUserCancellation(err) ? "cancelled" : "failed";
  }
}

async function tryShareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  try {
    await navigator.share({ text });
    return "shared";
  } catch (err) {
    return isUserCancellation(err) ? "cancelled" : "failed";
  }
}

async function tryCopyImage(blob: Blob): Promise<boolean> {
  const clip = navigator.clipboard as Clipboard & {
    write?: (items: ClipboardItem[]) => Promise<void>;
  };
  const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (!clip || typeof clip.write !== "function" || !CI) return false;
  try {
    await clip.write([new CI({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function tryCopyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareButton({ text, card, filename = "foldwink.png" }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const t = useT();
  const lang = useLang();
  const active = useGameStore((s) => s.active);
  const puzzle = useGameStore((s) => s.puzzle);

  async function handleShare(isStory: boolean = false): Promise<void> {
    trackEvent({
      name: "share_clicked",
      props: {
        surface: "result",
        mode: active?.mode === "daily" ? "daily" : "standard",
        difficulty: puzzle?.difficulty ?? "easy",
        lang,
      },
    });
    setStatus("sharing");

    const targetCard: ShareCardOptions | undefined = card
      ? { ...card, format: isStory ? "story" : "square" }
      : undefined;
    const targetFilename = isStory ? "foldwink-story.png" : filename;

    // Path A: we have a card — render it and try the image-first pipeline.
    if (targetCard) {
      const blob = await renderShareCard(targetCard);
      if (blob) {
        const file = new File([blob], targetFilename, { type: "image/png" });
        const outcome = await tryShareFile(file, text);
        if (outcome === "shared") {
          setStatus("idle");
          return;
        }
        // User explicitly cancelled the native share sheet — respect that
        // and do not cascade into clipboard or download.
        if (outcome === "cancelled") {
          setStatus("idle");
          return;
        }
        if (await tryCopyImage(blob)) {
          setStatus("copied");
          setTimeout(() => setStatus("idle"), 1800);
          return;
        }
        try {
          downloadBlob(blob, targetFilename);
          setStatus("downloaded");
          setTimeout(() => setStatus("idle"), 1800);
          return;
        } catch {
          // fall through to text
        }
      }
    }

    // Path B: text-only — navigator.share, then clipboard text.
    const textOutcome = await tryShareText(text);
    if (textOutcome === "shared" || textOutcome === "cancelled") {
      setStatus("idle");
      return;
    }
    if (await tryCopyText(text)) {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1800);
      return;
    }
    setStatus("failed");
    setTimeout(() => setStatus("idle"), 2400);
  }

  let label = t.share.shareResult;
  if (status === "sharing") label = t.share.preparing;
  if (status === "copied") label = t.share.copied;
  if (status === "downloaded") label = t.share.savedImage;
  if (status === "failed") label = t.share.unavailable;

  const storyLabel =
    lang === "ru"
      ? "Поделиться в Stories (9:16)"
      : lang === "de"
        ? "In Story teilen (9:16)"
        : "Share to Story (9:16)";

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        onClick={() => handleShare(false)}
        className="w-full"
        disabled={status === "sharing"}
        data-testid="share-result-button"
      >
        {label}
      </Button>
      {card && (
        <button
          type="button"
          onClick={() => handleShare(true)}
          disabled={status === "sharing"}
          className="text-[11px] font-semibold text-accent hover:text-accentHi transition-colors text-center py-0.5"
        >
          📱 {storyLabel}
        </button>
      )}
    </div>
  );
}
