# Foldwink — Itch.io page update · summary

**Date:** 2026-04-27
**Anchor version:** v0.8.1
**Funnel before:** ~28 760 TikTok impressions → ~130 clicks → ~260 Itch views → 40 browser plays (≈ 15 %).
**Goal:** lift browser-play rate above 25 %.

## Diagnosis in one line

The Itch page explains the mechanic before it gives the visitor a reason to press play. For TikTok / mobile traffic, the first viewport must say **free / browser / 2–5 min** before anything else.

## What's in the full report

`reports/foldwink_itch_page_update.md` contains:

1. Paste-ready English copy — title, tagline, short top block, full body, devlog. **Both plain-text and HTML versions** of every body block, so the HTML can be pasted directly into Itch's "Edit HTML" mode and headings/bold survive Save.
2. German + Russian variants (headline, sub-headline, short description, support text, tags) — also with HTML versions of body blocks.
3. Recommended Itch page layout (8-block order).
4. Three A/B variants — Utility / Challenge / Indie creator.
5. Recommendation: ship **Variant A (Utility)** first.
6. Measurement plan + thresholds for browser-play rate.
7. 14-step manual update checklist for the Itch dashboard.

**Itch HTML editor whitelist** — only these tags survive Save: `<h1>`–`<h3>`, `<p>`, `<br>`, `<hr>`, `<ul>`/`<ol>`/`<li>`, `<strong>`, `<em>`, `<u>`, `<a href>`, `<blockquote>`, `<img>`. Inline `style`, `<div>`, `<table>`, `<style>`, `<script>` are stripped. The HTML in the report stays inside this whitelist.

## Single most important paste (top of Itch page body)

```
A tiny daily browser puzzle.
Find 4 hidden groups in 16 cards.

▶ Play today's puzzle — free, in your browser. No install. 2–5 minutes.

Make 4 mistakes and you're out. Solve all four groups and you win.
That's the whole game.
```

## Itch tagline (listing strip, ≤120 chars)

```
Find 4 hidden groups. Free in your browser. 2–5 minutes. New puzzle every day.
```

## Was code changed?

No. This is a copy-only update. No build / test / deploy needed.
The repo files `itch.io/texts/page-copy.md` and `docs/ITCH_PAGE_COPY.md` will be updated to match **after** the Itch page goes live and the lift is observed (so the repo doesn't lie about what's on the public page).

## Next action

1. Open Itch dashboard → Foldwink → Edit game.
2. Paste §1.2 into Short description, §1.4 into Description body.
3. Keep cover + screenshots as is unless they look stale per checklist §8.
4. Save → verify in incognito + mobile + TikTok in-app browser.
5. Wait 48 h of comparable traffic before scoring — see §7 thresholds.
