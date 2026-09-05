import { useState } from "react";
import { BrandMark } from "./BrandMark";
import {
  embeddedPlayUrl,
  isCoarsePointer,
  isEmbedded,
  shouldOfferEmbeddedFullSize,
} from "../utils/platform";
import { useT } from "../i18n/useLanguage";

const DISMISS_KEY = "foldwink:embedded-full-size-dismissed";

function wasDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export function EmbeddedMobileLaunch() {
  const t = useT();
  const [visible, setVisible] = useState(() =>
    shouldOfferEmbeddedFullSize({
      embedded: isEmbedded(),
      coarsePointer: isCoarsePointer(),
      dismissed: wasDismissed(),
    }),
  );
  const href = embeddedPlayUrl();

  if (!visible || !href) return null;

  const continueEmbedded = (): void => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Session storage is optional in private or restricted embeds.
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-bg px-5 py-8 text-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="embedded-mobile-title"
      aria-describedby="embedded-mobile-description"
      data-testid="embedded-mobile-launch"
    >
      <div className="w-full max-w-xl">
        <div className="mb-5 flex justify-center">
          <BrandMark size={52} />
        </div>
        <div className="mb-2 text-lg font-bold text-text">Foldwink</div>
        <h2
          id="embedded-mobile-title"
          className="text-[clamp(28px,6vw,48px)] font-extrabold leading-tight text-text"
        >
          {t.embed.fullSizeTitle}
        </h2>
        <p
          id="embedded-mobile-description"
          className="mx-auto mt-4 max-w-lg text-[clamp(18px,3.5vw,24px)] leading-relaxed text-muted"
        >
          {t.embed.fullSizeBody}
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 flex min-h-20 w-full items-center justify-center rounded-lg bg-accent px-6 py-4 text-xl font-extrabold text-bg transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
        >
          {t.embed.openFullSize}
        </a>
        <button
          type="button"
          onClick={continueEmbedded}
          className="mt-3 min-h-14 w-full px-5 py-3 text-base font-semibold text-muted underline-offset-4 hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t.embed.continueHere}
        </button>
      </div>
    </div>
  );
}
