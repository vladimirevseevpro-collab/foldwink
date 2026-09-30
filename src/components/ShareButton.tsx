import { lazy, Suspense, useState } from "react";
import { Button } from "./Button";
import type { ShareCardOptions } from "../share/shareCard";
import { useT } from "../i18n/useLanguage";
import { trackEvent } from "../analytics/eventLog";
import { useGameStore } from "../game/state/appStore";
import { useLang } from "../i18n/useLanguage";
import { FoldwinkIcon } from "./FoldwinkIcon";

const ShareSheet = lazy(() =>
  import("./ShareSheet").then((module) => ({ default: module.ShareSheet })),
);

interface Props {
  text: string;
  card: ShareCardOptions;
  challengeUrl?: string;
}

export function ShareButton({ text, card, challengeUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useT();
  const lang = useLang();
  const active = useGameStore((s) => s.active);
  const puzzle = useGameStore((s) => s.puzzle);

  function openShareSheet(): void {
    trackEvent({
      name: "share_clicked",
      props: {
        surface: "result",
        mode: active?.mode === "daily" ? "daily" : "standard",
        difficulty: puzzle?.difficulty ?? "easy",
        lang,
      },
    });
    trackEvent({
      name: "share_started",
      props: { surface: "result", context: "result", lang },
    });
    setIsOpen(true);
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={openShareSheet}
        className="w-full"
        data-testid="share-result-button"
      >
        <FoldwinkIcon name="share" size={17} className="mr-2" />
        {t.share.shareResult}
      </Button>
      {isOpen && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/80 text-sm text-text"
              role="status"
            >
              {lang === "ru" ? "Загрузка…" : lang === "de" ? "Wird geladen…" : "Loading…"}
            </div>
          }
        >
          <ShareSheet
            card={card}
            challengeUrl={challengeUrl}
            lang={lang}
            onClose={() => setIsOpen(false)}
            text={text}
          />
        </Suspense>
      )}
    </>
  );
}
