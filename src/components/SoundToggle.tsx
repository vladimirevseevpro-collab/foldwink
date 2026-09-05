import { useSoundSettings } from "../audio/useSound";
import { useT } from "../i18n/useLanguage";

interface Props {
  compact?: boolean;
}

export function SoundToggle({ compact }: Props) {
  const { muted, toggleMute } = useSoundSettings();
  const t = useT();
  const label = muted ? t.settings.soundOff : t.settings.soundOn;
  const icon = muted ? "✕" : "♪";
  const classes = compact
    ? "inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
    : "inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors px-3 py-1.5 rounded-full border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
  return (
    <button type="button" onClick={toggleMute} aria-pressed={!muted} className={classes}>
      <span aria-hidden="true" className="tabular-nums">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
