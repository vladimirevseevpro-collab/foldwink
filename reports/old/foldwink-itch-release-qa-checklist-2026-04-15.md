# Foldwink — Itch.io Release QA Checklist

**Companion to:** `foldwink-final-itch-release-report-2026-04-15.md`
**Use:** tick through this once after uploading the `dist/` build to an
itch.io draft project. Stop and file a bug if any line fails.

## Pre-upload

- [ ] `npm run build` succeeds locally; `dist/` contains `index.html`,
      `assets/index-*.js`, `assets/index-*.css`, `favicon.svg`,
      `manifest.webmanifest`, `og.svg`.
- [ ] `dist/index.html` uses `./` relative paths for favicon, manifest,
      and the main asset bundle (no leading `/`).
- [ ] Zip the contents of `dist/` (not the folder itself) for itch.io.

## itch project setup

- [ ] itch project type: **HTML**, index file: `index.html`.
- [ ] Viewport size: 960 × 720 or "full screen" — not the tiny default.
- [ ] Mobile-friendly flag: **on**.
- [ ] Fullscreen button: **on** (optional; non-blocking).
- [ ] Status: **Draft / unlisted** for first test pass.

## Desktop browser (Chrome + Firefox)

- [ ] Loads in under 2 seconds on a warm connection.
- [ ] Onboarding modal appears on first visit; "Got it" dismisses and
      does not come back on refresh.
- [ ] Menu shows Daily / Easy / Medium / Hard; locked tiers read correct
      unlock copy.
- [ ] Easy puzzle playthrough: selection cap = 4, correct group flashes,
      incorrect group consumes a mistake, 4 mistakes → loss, all 4 →
      win. Grid does not shift or jank.
- [ ] Result screen: grade chip, share button, "Next puzzle" returns to
      game in one click with a fresh puzzle.
- [ ] Stats screen: "Best" cell matches the highest streak achieved.
- [ ] "new best" celebration: win one puzzle at streak=1 → no "new
      best" (threshold is ≥ 3). Build to streak=3 from zero → "new best"
      appears. Immediately play another (streak=4) → "new best" still
      appears. Lose, rebuild streak to 3 (tying old best) → "new best"
      does NOT appear. Rebuild to 4+ → "new best" appears.
- [ ] Daily mode: plays today's puzzle; replay after win shows "already
      played" copy and does not increment stats.
- [ ] About footer: expand → "Reset all local data" → tap once (arms) →
      tap again within 3 s → page reloads, onboarding shows again,
      stats are cleared.

## Mobile browser (iOS Safari + Android Chrome)

- [ ] No horizontal scroll at 320 px (iPhone SE portrait).
- [ ] Grid cards are tappable (min 44 px hit area effective).
- [ ] Safe area respected on notched phones (top bar not obscured).
- [ ] Haptics: a correct group fires a short buzz; settings toggle mutes
      both haptics and sound.
- [ ] Share button opens native share sheet if available; falls back to
      clipboard silently otherwise.
- [ ] Rotating portrait → landscape does not break the grid.

## Embed / iframe

- [ ] Game works inside the itch iframe on the public project page.
- [ ] Favicon + theme colour visible in the iframe's own chrome is not
      required; only the parent itch page matters here.
- [ ] Reload inside the iframe resumes mid-game session if one was
      active, or goes to menu otherwise.

## Console (devtools open)

- [ ] No `console.log` in production bundle (warn/error only allowed).
- [ ] No red errors on initial load, during gameplay, or on result.
- [ ] No 404s for assets.

## Record sanity (final check, one minute)

- [ ] Clear all data → play 3 wins in a row → "new best" appears on the
      3rd.
- [ ] Refresh → Stats → Best = 3.
- [ ] Play 1 win → "new best" does NOT appear (streak=1 < threshold).
- [ ] Play 2 more wins (streak=3, tied) → "new best" does NOT appear.
- [ ] Play 1 more win (streak=4) → "new best" appears.

## Ship

- [ ] All above green → flip itch project to **public**.
- [ ] Share the itch.io URL in the agreed channel.
- [ ] Capture one real-device screenshot for the records.

---

**Failure handling:** any failed line → do not publish. File a report in
`reports/` with the failing line, screenshot, device, and browser.
