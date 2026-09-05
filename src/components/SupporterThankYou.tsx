import { useState } from "react";
import { useLang } from "../i18n/useLanguage";
import { privacyStrings } from "../i18n/privacyStrings";
import {
  dismissSupporterThankYou,
  hasPendingSupporterThankYou,
} from "../monetization/supporter";

export function SupporterThankYou() {
  const lang = useLang();
  const copy = privacyStrings[lang];
  const [visible, setVisible] = useState(() => hasPendingSupporterThankYou());

  if (!visible) return null;

  return (
    <div
      data-testid="supporter-thank-you"
      className="mb-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text leading-relaxed">{copy.thankYou}</p>
        <button
          type="button"
          onClick={() => {
            dismissSupporterThankYou();
            setVisible(false);
          }}
          className="text-sm text-muted hover:text-text transition-colors"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
}
