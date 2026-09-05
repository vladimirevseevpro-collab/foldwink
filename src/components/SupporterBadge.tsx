import { isSupporter } from "../monetization/supporter";
import { useT } from "../i18n/useLanguage";

/**
 * Cosmetic "Supporter ★" badge shown on the stats screen for players
 * who completed the supporter unlock. Renders nothing for non-
 * supporters (and for fresh deploys where the CTA is not configured —
 * those players never see the unlock to begin with).
 *
 * Intentionally subtle: this is a thank-you, not a flex.
 */
export function SupporterBadge() {
  const t = useT();
  if (!isSupporter()) return null;
  return (
    <div className="mt-2 flex justify-center">
      <div
        className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/40 px-3 py-1 text-[11px] uppercase text-accent"
        title={t.monetization.badgeTitle}
      >
        <span aria-hidden="true">★</span>
        <span>{t.monetization.badgeLabel}</span>
      </div>
    </div>
  );
}
