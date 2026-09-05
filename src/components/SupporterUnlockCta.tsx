import { monetization, supporterCheckoutUrl } from "../monetization/config";
import { withAttributionRef } from "../monetization/attribution";
import { isSupporter } from "../monetization/supporter";
import { useT } from "../i18n/useLanguage";
import { useLang } from "../i18n/useLanguage";
import { bucketSource, trackEvent } from "../analytics/eventLog";
import { getFirstTouch } from "../monetization/attribution";

interface Props {
  /**
   * Where this CTA is rendered, used only to tweak the tone of the
   * copy. `result` = post-win, more celebratory; `menu` = ambient,
   * quieter; `stats` = next to the supporter badge area.
   */
  context: "result" | "menu" | "stats";
}

/**
 * One-time supporter unlock — opens the configured hosted-checkout URL
 * in a new tab, then relies on the success-redirect flow handled in
 * `monetization/supporter.ts` to flip the local flag on return.
 *
 * Renders nothing if:
 *  - the checkout URL is not configured (fresh deploy), OR
 *  - the player is already a supporter (we don't double-pitch).
 */
export function SupporterUnlockCta({ context }: Props) {
  const t = useT();
  const lang = useLang();
  const url = supporterCheckoutUrl();
  if (!url) return null;
  if (isSupporter()) return null;

  const headline =
    context === "result"
      ? t.monetization.supporterHeadlineResult
      : context === "stats"
        ? t.monetization.supporterHeadlineStats
        : t.monetization.supporterHeadlineMenu;
  const subline =
    context === "result"
      ? t.monetization.supporterSublineResult(monetization.supporterPriceLabel)
      : t.monetization.supporterSublineAmbient(monetization.supporterPriceLabel);

  return (
    <div className="mt-3 rounded-lg bg-surface border border-line px-4 py-3 text-center">
      <div className="text-[10px] uppercase text-muted mb-1">{headline}</div>
      <p className="text-[12px] text-text mb-2 leading-snug">{subline}</p>
      <a
        href={withAttributionRef(url, "client_reference_id")}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent({
            name: "supporter_checkout_opened",
            props: {
              surface: context,
              channel: "supporter",
              source_bucket: bucketSource(getFirstTouch()),
              has_support_flag: "no",
              lang,
            },
          })
        }
        className="inline-block rounded-lg bg-accent text-bg font-semibold text-[13px] px-4 py-2 hover:opacity-90 transition-opacity"
      >
        {t.monetization.unlockFor(monetization.supporterPriceLabel)}
      </a>
    </div>
  );
}
