import { useMemo, useState } from "react";
import {
  getConsentStatus,
  isAnalyticsConfigured,
  setConsentStatus,
  trackEvent,
} from "../analytics/eventLog";
import { useLang } from "../i18n/useLanguage";
import { privacyStrings } from "../i18n/privacyStrings";

interface Props {
  compact?: boolean;
}

export function PrivacyControl({ compact = false }: Props) {
  const lang = useLang();
  const copy = privacyStrings[lang];
  const configured = isAnalyticsConfigured();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(() => getConsentStatus());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const providerText = useMemo(
    () => (configured ? copy.providerLabel(copy.providerName) : copy.noProvider),
    [configured, copy],
  );

  async function choose(statusNext: "granted" | "denied"): Promise<void> {
    await setConsentStatus(statusNext);
    setStatus(statusNext);
    setSavedMessage(
      statusNext === "granted" ? copy.choiceSavedGranted : copy.choiceSavedDenied,
    );
    trackEvent({
      name: "privacy_choice",
      props: {
        surface: "privacy_dialog",
        outcome: statusNext,
        lang,
      },
    });
  }

  return (
    <>
      <button
        type="button"
        data-testid="privacy-control"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "text-[10px] uppercase text-muted hover:text-text transition-colors"
            : "text-sm text-muted hover:text-text underline underline-offset-2 transition-colors"
        }
      >
        {copy.control}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-dialog-title"
            className="w-full max-w-lg rounded-lg border border-line bg-surface p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="privacy-dialog-title" className="text-base font-bold text-text">
                  {copy.title}
                </h2>
                <p className="mt-1 text-sm text-muted leading-relaxed">{copy.intro}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-text transition-colors"
              >
                {copy.close}
              </button>
            </div>

            <div className="mt-4 space-y-3 text-left">
              <div className="rounded-lg border border-line bg-surfaceHi px-3 py-3">
                <div className="text-[11px] uppercase text-muted">{copy.localOnlyTitle}</div>
                <p className="mt-1 text-sm text-text leading-relaxed">{copy.localOnlyBody}</p>
              </div>
              <div className="rounded-lg border border-line bg-surfaceHi px-3 py-3">
                <div className="text-[11px] uppercase text-muted">{copy.analyticsTitle}</div>
                <p className="mt-1 text-sm text-text leading-relaxed">{copy.analyticsBody}</p>
                <p className="mt-2 text-[12px] text-muted">{providerText}</p>
                <a
                  href="./privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-accent underline underline-offset-2"
                >
                  {copy.policyLink}
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {configured && (
                <button
                  type="button"
                  onClick={() => void choose("granted")}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
                >
                  {copy.grant}
                </button>
              )}
              <button
                type="button"
                onClick={() => void choose("denied")}
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-text"
              >
                {copy.deny}
              </button>
            </div>

            <div className="mt-3 text-[12px] text-muted" aria-live="polite">
              {savedMessage ??
                (status === "granted"
                  ? copy.choiceSavedGranted
                  : status === "denied"
                    ? copy.choiceSavedDenied
                    : "")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
