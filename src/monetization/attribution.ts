/**
 * First-touch campaign attribution — local only.
 *
 * If the game is opened with `utm_*` params (TikTok → itch/standalone
 * links carry them), we remember the first ones we ever saw in
 * localStorage. Nothing is sent anywhere by itself; the only use is
 * decorating *outbound* monetization links the player explicitly
 * clicks (tip jar, supporter checkout) with a compact `ref`, so the
 * payment provider's own dashboard can answer "which campaign did this
 * purchase come from". See docs/MONETIZATION.md.
 *
 * Known limitation: inside the itch.io embed the iframe src does not
 * carry the page URL's query string, so attribution effectively works
 * on the standalone deploy and direct links only.
 */

const KEY = "foldwink:utm-first";

export interface UtmTouch {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  ts: number;
}

/** Read `utm_*` from the current URL and store them as the first-touch
 *  record — only if no record exists yet. Call once at boot. */
export function captureUtm(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(KEY)) return;
    const params = new URL(window.location.href).searchParams;
    const touch: UtmTouch = { ts: Date.now() };
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    const content = params.get("utm_content");
    if (!source && !medium && !campaign && !content) return;
    if (source) touch.source = source;
    if (medium) touch.medium = medium;
    if (campaign) touch.campaign = campaign;
    if (content) touch.content = content;
    localStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    // private mode / malformed URL — attribution is best-effort
  }
}

export function getFirstTouch(): UtmTouch | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UtmTouch;
  } catch {
    return null;
  }
}

/** Compact campaign tag like "tiktok.batch_01.tiktok_03", or null when
 *  the player arrived with no UTM at all. */
export function attributionRef(): string | null {
  const t = getFirstTouch();
  if (!t) return null;
  const parts = [t.source, t.campaign, t.content].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  if (parts.length === 0) return null;
  // keep it short and URL-safe; providers show this verbatim
  return parts.join(".").replace(/[^\w.-]+/g, "_").slice(0, 64);
}

/** Append the attribution ref to an outbound monetization URL.
 *  `paramName` defaults to `ref` (ignored harmlessly by Ko-fi); for
 *  Stripe Payment Links pass "client_reference_id", which Stripe
 *  surfaces on the payment in the dashboard. */
export function withAttributionRef(url: string, paramName = "ref"): string {
  const ref = attributionRef();
  if (!ref) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has(paramName)) u.searchParams.set(paramName, ref);
    return u.toString();
  } catch {
    return url;
  }
}
