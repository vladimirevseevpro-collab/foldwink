# Foldwink — Itch.io Upload Guide

## Package

**File:** `dist/foldwink-itch.zip` (~110 KB)

Regenerate after any code change:

```bash
npm run build
cd dist && powershell -Command "Compress-Archive -Path * -DestinationPath foldwink-itch.zip -Force"
```

On macOS/Linux:

```bash
npm run build
cd dist && zip -r foldwink-itch.zip . -x "foldwink-itch.zip"
```

## Itch.io Project Setup

### Kind of project

HTML

### Upload

1. Upload `dist/foldwink-itch.zip`
2. Check **"This file will be played in the browser"**

### Embed options

| Setting                          | Value                                |
| -------------------------------- | ------------------------------------ |
| Viewport dimensions              | **400 × 720** (portrait, mobile-first) |
| Orientation                      | **Portrait**                         |
| Mobile friendly                  | **Yes** ← critical                   |
| Automatically start on page load | **Yes**                              |
| Fullscreen button                | **Enabled**                          |
| Click to launch in fullscreen    | **Yes**                              |

**Why portrait + Mobile friendly is critical.** Foldwink's layout is fully
responsive — the bug is itch.io's iframe wrapper, not our CSS. With
landscape dimensions (e.g. 800 × 600) and `Mobile friendly = No`, itch
renders an inline iframe locked to that aspect ratio. On an iPhone (≈390
CSS px wide) the iframe gets shrunk to ~390 × 293 — about a quarter of
the screen. With `Mobile friendly = Yes`, itch on mobile replaces the
inline iframe with a **▶ Run game** button that opens the game
fullscreen on tap. Both settings together (portrait viewport + Mobile
friendly) are what produces a usable phone experience.

### Pricing

| Phase            | Setting                                  |
| ---------------- | ---------------------------------------- |
| Friend test      | **Restricted** (password-protected page) |
| Public free test | **$0 — No payments**                     |
| PWYW (later)     | **$0 or above — Name your own price**    |

### Page metadata

| Field             | Value                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| Title             | Foldwink                                                                   |
| Short description | A short daily grouping puzzle with a twist.                                |
| Classification    | Games                                                                      |
| Kind of project   | HTML                                                                       |
| Genre             | Puzzle                                                                     |
| Tags              | puzzle, word, daily, grouping, browser, html5, mobile-friendly, minimalist |
| Community         | Disabled (for now)                                                         |

### Page body

Use the content from `docs/ITCH_PAGE_COPY.md`. Copy the Long Description section.

### Cover image

Until a raster cover is produced: use a 630×500 screenshot of the menu screen or a share card output. The share card preview (`scripts/preview-share-cards.html`) can generate a usable 1080×1080 card.

## Pre-Upload Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` clean
- [ ] `npm run test` all pass
- [ ] `npm run lint` clean
- [ ] `npm run validate` clean
- [ ] Zip created from fresh `dist/`
- [ ] Page copy reviewed (`docs/ITCH_PAGE_COPY.md`)
- [ ] Human QA checklist completed (`docs/ITCH_QA_CHECKLIST.md`)

## Post-Upload Verification

- [ ] Game loads in itch.io player
- [ ] Sound works after first click
- [ ] localStorage persists between sessions
- [ ] No asset 404s in browser console
- [ ] Mobile layout works in itch.io mobile view
- [ ] Share button works (clipboard/download fallback in iframe)

## Known Itch.io Limitations

- `navigator.share()` may not work inside the itch.io iframe; the share pipeline falls back to clipboard or download automatically.
- The OG image path `/og.svg` won't work from itch.io — this only matters for social previews of the standalone deploy, not the embedded game.
- localStorage is scoped to the itch.io domain, so stats won't sync with the GitHub Pages deploy.
