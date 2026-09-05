import { useHapticSettings } from "../haptics/useHaptics";
import { useT } from "../i18n/useLanguage";

interface Props {
  compact?: boolean;
}

export function HapticsToggle({ compact }: Props) {
  const { enabled, supported, toggle } = useHapticSettings();
  const t = useT();
  if (!supported) return null;
  const label = enabled ? t.settings.hapticsOn : t.settings.hapticsOff;
  const icon = enabled ? "≋" : "✕";
  const classes = compact
    ? "inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm transition-colors"
    : "inline-flex items-center gap-1.5 text-xs text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm transition-colors px-3 py-1.5 rounded-full border border-line";
  return (
    <button type="button" onClick={toggle} aria-pressed={enabled} className={classes}>
      <span aria-hidden="true" className="tabular-nums">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
