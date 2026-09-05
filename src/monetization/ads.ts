/**
 * Opt-in rewarded ad hook — SDK-agnostic.
 *
 * Foldwink does not bundle any specific ad-network SDK. Instead, the
 * UI calls `showRewardedAd()`, which delegates to a function the host
 * page exposes on `window.foldwinkShowRewardedAd`. The host page (an
 * inline script in index.html or a network's loader script) is
 * responsible for wiring whatever SDK the developer signed up for —
 * GameMonetize, AdinPlay, CrazyGames, CPMStar, etc.
 *
 * This keeps the bundle clean (no third-party tracker shipped by
 * default), keeps the choice of ad network out of source control, and
 * lets a privacy-conscious deploy ship with rewarded ads disabled
 * simply by not including the SDK script.
 *
 * Contract for the host-page function:
 *
 *   window.foldwinkShowRewardedAd: () => Promise<boolean>
 *     Resolves `true`  → ad finished, grant the bonus.
 *     Resolves `false` → ad skipped/failed/unavailable; do not grant.
 *     Rejects          → treated as `false`.
 *
 * See docs/MONETIZATION.md for example wirings.
 */

import { monetization } from "./config";

interface AdHostBindings {
  foldwinkShowRewardedAd?: () => Promise<boolean>;
  foldwinkRewardedAdReady?: () => boolean;
}

function host(): AdHostBindings {
  if (typeof window === "undefined") return {};
  return window as unknown as AdHostBindings;
}

export function isRewardedAdAvailable(): boolean {
  if (!monetization.rewardedAdsEnabled) return false;
  const h = host();
  if (typeof h.foldwinkShowRewardedAd !== "function") return false;
  if (typeof h.foldwinkRewardedAdReady === "function") {
    try {
      return !!h.foldwinkRewardedAdReady();
    } catch {
      return false;
    }
  }
  return true;
}

export async function showRewardedAd(): Promise<boolean> {
  if (!isRewardedAdAvailable()) return false;
  const fn = host().foldwinkShowRewardedAd;
  if (!fn) return false;
  try {
    const ok = await fn();
    return !!ok;
  } catch {
    return false;
  }
}
