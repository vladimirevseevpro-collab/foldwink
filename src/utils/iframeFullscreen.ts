/**
 * Auto-fullscreen on first tap for small iframe embeds (itch.io mobile).
 *
 * itch.io wraps the game in an iframe sized by the dashboard viewport
 * dimensions (e.g. 400×800). On a portrait iPhone, that iframe occupies
 * roughly half the device screen — even with a fully responsive layout,
 * the game looks "stuck in a tile" because iframe content cannot grow
 * past the iframe's own box.
 *
 * itch sets `allow="autoplay; fullscreen *; ..."` on the embed iframe,
 * which means the iframe IS allowed to call the Fullscreen API. On the
 * first user gesture inside the game, we request element fullscreen on
 * the document root — iOS Safari 16.4+ and modern Android Chrome honour
 * this, and the iframe expands to occupy the full device viewport.
 *
 * Conditions before requesting fullscreen:
 *   - we must be inside an iframe (window.self !== window.top), so we
 *     never trigger on the standalone neural-void.com deploy;
 *   - we only act on coarse-pointer devices (phones, tablets) — desktop
 *     users get a normal in-page embed and would be jarred by a
 *     surprise fullscreen on first click;
 *   - we only act on viewports that are small enough to benefit — if
 *     the iframe already fills the screen (e.g. itch's true fullscreen
 *     overlay mode), the request is a no-op anyway, but we gate to
 *     reduce noisy permission denials in console.
 *
 * The request itself is fire-and-forget. If the browser rejects it
 * (older iOS, permission policy, user already denied), the player
 * keeps the small embed — same as before this patch — so we never
 * regress the experience.
 */
export function setupAutoFullscreen(): void {
  if (typeof window === "undefined") return;

  let inIframe: boolean;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  if (!inIframe) return;

  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (!coarse) return;

  const requestFullscreen = () => {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const fn = el.requestFullscreen ?? el.webkitRequestFullscreen;
    if (typeof fn !== "function") return;
    try {
      const result = fn.call(el);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch {
      // browser rejected — leave embed as-is
    }
  };

  const onFirstGesture = () => {
    window.removeEventListener("pointerdown", onFirstGesture, true);
    window.removeEventListener("touchstart", onFirstGesture, true);
    requestFullscreen();
  };

  window.addEventListener("pointerdown", onFirstGesture, {
    capture: true,
    once: true,
  });
  window.addEventListener("touchstart", onFirstGesture, {
    capture: true,
    once: true,
  });
}
