import { useState, useEffect } from "react";
import { THEMES, loadTheme, saveTheme, type DeskTheme } from "../styles/themes";
import { useGameStore } from "../game/state/appStore";
import { useLang } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";
import { isSupporter } from "../monetization/supporter";

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<DeskTheme>(loadTheme);
  const [isOpen, setIsOpen] = useState(false);
  const stats = useGameStore((s) => s.stats);
  const lang = useLang();
  const playSound = useSound();
  const supporter = isSupporter();
  const solvedCount = stats.solvedPuzzleIds.length;

  useEffect(() => {
    saveTheme(currentTheme);
  }, [currentTheme]);

  const handleSelect = (themeId: DeskTheme, isLocked: boolean) => {
    if (isLocked) return;
    setCurrentTheme(themeId);
    saveTheme(themeId);
    playSound("select");
  };

  const getLabel = (theme: (typeof THEMES)[number]) => {
    if (lang === "ru") return theme.labelRu;
    if (lang === "de") return theme.labelDe;
    return theme.labelEn;
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-surfaceHi text-xs font-semibold text-text shadow-sm transition-colors"
        aria-label="Select Desk Theme"
      >
        <span>🎨</span>
        <span className="hidden sm:inline">
          {getLabel(THEMES.find((t) => t.id === currentTheme) ?? THEMES[0])}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[11px] uppercase tracking-wider font-bold text-muted mb-2 px-1">
              {lang === "ru"
                ? "Атмосфера стола"
                : lang === "de"
                  ? "Schreibtisch-Atmosphäre"
                  : "Desk Atmosphere"}
            </div>
            <div className="space-y-1.5">
              {THEMES.map((theme) => {
                const isLocked = !supporter && solvedCount < theme.unlockSolvedCount;
                const isSelected = currentTheme === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleSelect(theme.id, isLocked)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? "border-accent bg-surfaceHi text-text shadow-sm"
                        : isLocked
                          ? "border-transparent opacity-50 cursor-not-allowed text-muted"
                          : "border-transparent hover:bg-surfaceHi/60 text-text cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: theme.paletteColor }}
                      />
                      <span>
                        {theme.icon} {getLabel(theme)}
                      </span>
                    </div>

                    {isLocked ? (
                      <span className="text-[10px] text-muted font-normal">
                        🔒 {theme.unlockSolvedCount}
                      </span>
                    ) : isSelected ? (
                      <span className="text-accent font-bold">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
