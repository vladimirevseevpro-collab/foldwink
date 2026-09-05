import { useState } from "react";
import { clearEventLog } from "../analytics/eventLog";
import { clearAllLocalData } from "../stats/persistence";
import { useT } from "../i18n/useLanguage";
import { PrivacyControl } from "./PrivacyControl";

export function AboutFooter() {
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const t = useT();

  const handleClear = (): void => {
    clearEventLog();
    setCleared(true);
    setTimeout(() => setCleared(false), 1800);
  };

  const handleReset = (): void => {
    if (!resetArmed) {
      setResetArmed(true);
      setTimeout(() => setResetArmed(false), 3000);
      return;
    }
    clearAllLocalData();
    if (typeof window !== "undefined") window.location.reload();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] uppercase text-muted hover:text-text transition-colors"
      >
        {t.about.link}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg bg-surface border border-line px-5 py-4 text-left">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase text-muted">{t.about.title}</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-muted hover:text-text transition-colors"
          aria-label={t.about.closeAria}
        >
          {t.about.close}
        </button>
      </div>
      <p className="text-xs text-text leading-relaxed mb-3">
        {t.about.bylineBy}{" "}
        <a
          href="https://neural-void.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline underline-offset-2"
        >
          Neural Void
        </a>
        {t.about.bylineAfter}
      </p>
      <div className="text-[10px] uppercase text-muted mb-1">{t.about.privacy}</div>
      <p className="text-xs text-muted leading-relaxed mb-3">{t.about.privacyBody}</p>
      <div className="text-[10px] uppercase text-muted mb-1">{t.about.support}</div>
      <p className="text-xs text-muted leading-relaxed mb-3">
        {t.about.supportBody}{" "}
        <a
          href="mailto:foldwink@neural-void.com"
          className="text-text font-mono text-[11px] hover:text-accent transition-colors"
        >
          foldwink@neural-void.com
        </a>
      </p>
      <div className="flex flex-col gap-2">
        <div>
          <PrivacyControl />
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-muted hover:text-text transition-colors underline underline-offset-2 text-left"
        >
          {cleared ? t.about.eventLogCleared : t.about.clearEventLog}
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label={t.about.resetAria}
          className={`text-[11px] underline underline-offset-2 transition-colors text-left ${
            resetArmed ? "text-danger hover:text-danger" : "text-muted hover:text-text"
          }`}
        >
          {resetArmed ? t.about.resetArmed : t.about.resetAll}
        </button>
      </div>
    </div>
  );
}
