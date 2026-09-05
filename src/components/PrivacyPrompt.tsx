import { useLang } from "../i18n/useLanguage";
import { privacyStrings } from "../i18n/privacyStrings";
import { PrivacyControl } from "./PrivacyControl";

export function PrivacyPrompt() {
  const lang = useLang();
  const copy = privacyStrings[lang];

  return (
    <div className="w-full max-w-sm rounded-lg border border-line bg-surface px-4 py-3 text-left">
      <p className="text-sm text-text leading-relaxed">{copy.menuPrompt}</p>
      <div className="mt-2">
        <PrivacyControl />
      </div>
    </div>
  );
}
