import { monetization, tipJarUrl } from "../monetization/config";
import { withAttributionRef } from "../monetization/attribution";
import { useT } from "../i18n/useLanguage";
import { useLang } from "../i18n/useLanguage";
import { bucketSource, trackEvent } from "../analytics/eventLog";
import { getFirstTouch } from "../monetization/attribution";
import { isSupporter } from "../monetization/supporter";

/**
 * Discreet "Support Foldwink — €X" link rendered after a daily/standard
 * win. Hidden when `monetization.koFiHandle` is empty so blank deploys
 * stay free of monetization clutter.
 *
 * Uses a plain anchor with `target="_blank" rel="noopener"` so it
 * works inside the itch.io iframe (where it would top-navigate the
 * iframe by default and lose the game) and on the standalone deploy.
 */
export function TipJarLink() {
  const t = useT();
  const lang = useLang();
  const url = tipJarUrl();
  if (!url) return null;
  return (
    <div className="mt-3 text-center text-[12px]">
      <a
        href={withAttributionRef(url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent({
            name: "tip_opened",
            props: {
              surface: "result",
              channel: "tip_jar",
              source_bucket: bucketSource(getFirstTouch()),
              has_support_flag: isSupporter() ? "yes" : "no",
              lang,
            },
          })
        }
        className="text-muted hover:text-accent underline-offset-2 hover:underline transition-colors"
      >
        {t.monetization.tipCta(monetization.tipAmountEur)}
      </a>
    </div>
  );
}
