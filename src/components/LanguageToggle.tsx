import { useState } from "react";
import { useLangStore, useT } from "../i18n/useLanguage";
import { SUPPORTED_LANGS, type Lang } from "../i18n/strings";
import { ensureLangLoaded } from "../puzzles/byLang";

const LABELS: Record<Lang, string> = { en: "EN", de: "DE", ru: "RU" };

export function LanguageToggle() {
  const { lang, setLang } = useLangStore();
  const t = useT();
  const [loading, setLoading] = useState<Lang | null>(null);

  const changeLanguage = async (nextLang: Lang): Promise<void> => {
    if (nextLang === lang || loading) return;
    setLoading(nextLang);
    try {
      // Do not switch the interface until its puzzle pool is ready. The old
      // path switched first, then temporarily fell back to English cards
      // without a render after the lazy RU/DE pool arrived.
      await ensureLangLoaded(nextLang);
      setLang(nextLang);
    } catch (error) {
      console.warn(`[lang] failed to load ${nextLang} pool:`, error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="inline-flex items-center rounded-full border border-line overflow-hidden"
      role="group"
      aria-label={t.menu.languageAria}
      aria-busy={loading ? "true" : undefined}
    >
      {SUPPORTED_LANGS.map((code, i) => (
        <button
          key={code}
          type="button"
          onClick={() => void changeLanguage(code)}
          disabled={loading !== null}
          aria-pressed={lang === code}
          className={[
            "px-2.5 py-1 text-[11px] leading-none transition-colors",
            i > 0 ? "border-l border-line" : "",
            lang === code ? "text-text bg-line" : "text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm",
            loading === code ? "text-accent" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
