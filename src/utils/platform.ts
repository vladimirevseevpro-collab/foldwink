/**
 * Detect iOS Safari running in a regular browser tab (not standalone /
 * Add-to-Home-Screen mode, not Chrome-on-iOS).
 *
 * Used to surface an "Add to Home Screen for full-screen play" hint on
 * the menu, because iOS Safari forbids the JS Fullscreen API for iframes
 * and only standalone-launched Safari sheds the URL / toolbar chrome.
 */
export function isIosSafariInBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  if (!isIos) return false;
  // Exclude non-Safari iOS browsers — Chrome (CriOS), Firefox (FxiOS),
  // Edge (EdgiOS) render differently and the Add-to-Home trick is
  // Safari-specific.
  if (/CriOS|FxiOS|EdgiOS/.test(ua)) return false;
  // Already launched as a PWA from the home screen — no hint needed.
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return false;
  if (typeof window !== "undefined") {
    const mm = window.matchMedia?.("(display-mode: standalone)");
    if (mm?.matches) return false;
  }
  return true;
}

export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  const coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const touch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  return coarse || touch;
}

interface EmbeddedFullSizeConditions {
  embedded: boolean;
  coarsePointer: boolean;
  dismissed: boolean;
}

export function shouldOfferEmbeddedFullSize({
  embedded,
  coarsePointer,
  dismissed,
}: EmbeddedFullSizeConditions): boolean {
  return embedded && coarsePointer && !dismissed;
}

/**
 * The iframe URL is the only full-size target guaranteed to exist for
 * every distribution build, including itch drafts and local QA embeds.
 */
export function embeddedPlayUrl(): string | null {
  if (!isEmbedded() || typeof window === "undefined") return null;
  return window.location.href;
}
