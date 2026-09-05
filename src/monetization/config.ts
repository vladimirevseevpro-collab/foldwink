export interface MonetizationConfig {
  koFiHandle: string;
  tipAmountEur: number;
  supporterCheckoutUrl: string;
  supporterPriceLabel: string;
  rewardedAdsEnabled: boolean;
}

const KO_FI_HANDLE_RE = /^[a-z0-9](?:[a-z0-9-_]{0,62}[a-z0-9])?$/i;
const SUPPORTER_PRICE_LABEL = "EUR 3";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeKoFiHandle(value: string): string {
  return KO_FI_HANDLE_RE.test(value) ? value : "";
}

function sanitizeCheckoutUrl(value: string): string {
  return isHttpsUrl(value) ? value : "";
}

export function resolveMonetizationConfig(
  env: Record<string, string | undefined> = import.meta.env,
  runtime: Window["__FOLDWINK_CONFIG__"] | undefined = typeof window !== "undefined"
    ? window.__FOLDWINK_CONFIG__
    : undefined,
): MonetizationConfig {
  const koFiHandle = sanitizeKoFiHandle(
    cleanText(runtime?.koFiHandle) || cleanText(env.VITE_KOFI_HANDLE),
  );
  const supporterCheckoutUrl = sanitizeCheckoutUrl(
    cleanText(runtime?.supporterCheckoutUrl) || cleanText(env.VITE_SUPPORTER_CHECKOUT_URL),
  );

  return {
    koFiHandle,
    tipAmountEur: 2,
    supporterCheckoutUrl,
    supporterPriceLabel: SUPPORTER_PRICE_LABEL,
    rewardedAdsEnabled: false,
  };
}

export const monetization = resolveMonetizationConfig();

export function tipJarUrl(config: MonetizationConfig = monetization): string | null {
  if (!config.koFiHandle) return null;
  return `https://ko-fi.com/${encodeURIComponent(config.koFiHandle)}`;
}

export function supporterCheckoutUrl(config: MonetizationConfig = monetization): string | null {
  return config.supporterCheckoutUrl || null;
}
