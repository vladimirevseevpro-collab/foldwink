# Foldwink — Itch.io page conversion update

**Version anchor:** Foldwink v0.8.1
**Date:** 2026-04-27
**Goal:** lift browser-play rate on `https://neural-void.itch.io/foldwink` from ~15 % (40/260) baseline after first paid TikTok test.

---

## 0. Funnel diagnosis (one paragraph)

The TikTok ad is doing its job — it sends 130 clicks and ~170 referral visits to Itch. The break point is on the Itch page itself: only ~40 visitors reach a browser play. Current page copy is descriptive and indie-honest, but it explains the mechanic at length **before** giving the visitor a reason to press play. For mobile / TikTok in-app browser traffic, the first viewport must shout three things only — *free*, *in browser*, *one tap to play*. Lore and depth (Wink, master challenge, 500 puzzles) belong below the fold.

Top fix: rewrite the **tagline + short description + first paragraph** to lead with utility (free + browser + 2–5 min), keep the play CTA in the first viewport, and push mechanic detail down.

---

## 1. Recommended primary copy (paste-ready, English)

This is the version to ship first. See §6 for why this variant over the other two.

> **How to paste into Itch.** Itch's game-page editor has two body modes:
>
> 1. **WYSIWYG** (default) — paste the *plain-text* version, then format manually with the toolbar. Only `▶`, line breaks, and the section headers need touching up.
> 2. **Edit HTML** — click the `</>` icon at the bottom of the body editor (or "Edit HTML" link, depending on theme), paste the *HTML* version, click Save. Itch's editor only accepts a small whitelist of tags: `<h1>`–`<h3>`, `<p>`, `<br>`, `<hr>`, `<ul>`/`<ol>`/`<li>`, `<strong>`, `<em>`, `<u>`, `<a href>`, `<blockquote>`, `<img>`. Inline `style=""`, `<div>`, `<table>`, `<style>`, `<script>` are silently stripped on save. The HTML below stays inside the whitelist.
>
> Use the HTML mode — it preserves headings and bold reliably, the WYSIWYG paste sometimes drops them.

### 1.1 Page title

```
Foldwink — A tiny daily browser puzzle
```

### 1.2 Tagline (Itch "short description" field, max 120 chars)

```
Find 4 hidden groups. Free in your browser. 2–5 minutes. New puzzle every day.
```

(118 characters, Latin-only, fits Itch's listing strip.)

### 1.3 Short version — top of page body

**Plain text (for the WYSIWYG editor — paste, then format manually):**

```
A tiny daily browser puzzle.
Find 4 hidden groups in 16 cards.

▶ Play today's puzzle — free, in your browser. No install. 2–5 minutes.

Make 4 mistakes and you're out. Solve all four groups and you win.
That's the whole game.
```

**HTML (paste into Itch editor's HTML mode — preserves bold, headings, hr):**

```html
<p><strong>A tiny daily browser puzzle.</strong><br>
Find 4 hidden groups in 16 cards.</p>

<p><strong>▶ Play today's puzzle — free, in your browser. No install. 2–5 minutes.</strong></p>

<p>Make 4 mistakes and you're out. Solve all four groups and you win.<br>
That's the whole game.</p>
```

### 1.4 Long version — full page body

**Plain-text reference:**

```
## A tiny daily browser puzzle

Foldwink is a short daily puzzle. You see 16 cards. Four of them
share a hidden category. So do four others. And four more. And
four more. Find every group. You have four mistakes.

▶ Play today's puzzle — free, in your browser. No install.
2–5 minutes. New puzzle every day.

## Why play

· Free in browser. No install, no account, no sign-up.
· 2–5 minutes. A coffee-break puzzle, not a time sink.
· Daily. One fresh puzzle every day, the same for everyone.
· Three difficulties. Easy to warm up. Medium for the bite.
  Master Challenge for the people who finish too fast.
· Quiet by design. No ads, no tracking, no streaks pushing
  you to come back. Stats live in your browser only.

## How to play

1. Look at 16 cards.
2. Pick the 4 that share a hidden category.
3. Submit. Right → group locks in. Wrong → -1 mistake.
4. Four mistakes and the game ends.
5. Solve all four groups and you win.

On Medium puzzles, four small Foldwink Tabs sit above the
grid. They reveal the four hidden categories one letter at a
time as you solve. Once per puzzle you can tap a tab to Wink
it — fully reveal that category instantly. Use the Wink wisely.

On Master Challenge, tabs reveal slower and the Wink is gone.

## Built by

Neural Void. A small indie lab. Foldwink is the first release.
500 hand-curated puzzles in English. German and Russian content
in beta.

## Support

If you enjoy Foldwink, consider supporting development.
Donations fund new puzzle packs, weekly themes, and quality-of-
life work. Free play stays free — forever.

Pay what you want from the page above ↑.

## Privacy

No accounts. No network tracking. No ads. Your stats and
preferences live in your browser's localStorage and never
leave your device.
```

**HTML (Itch editor → "Edit HTML" mode → paste this, save):**

> Itch's editor strips `<style>`, `<script>`, `<table>`, `<div>`, and inline styles. Use only `<h1>`–`<h3>`, `<p>`, `<br>`, `<hr>`, `<ul>`/`<ol>`/`<li>`, `<strong>`, `<em>`, `<a href>`. Anything else is silently dropped on save.

```html
<h2>A tiny daily browser puzzle</h2>

<p>Foldwink is a short daily puzzle. You see 16 cards. Four of them share a hidden category. So do four others. And four more. And four more. Find every group. You have four mistakes.</p>

<p><strong>▶ Play today's puzzle — free, in your browser. No install. 2–5 minutes. New puzzle every day.</strong></p>

<hr>

<h2>Why play</h2>

<ul>
  <li><strong>Free in browser.</strong> No install, no account, no sign-up.</li>
  <li><strong>2–5 minutes.</strong> A coffee-break puzzle, not a time sink.</li>
  <li><strong>Daily.</strong> One fresh puzzle every day, the same for everyone.</li>
  <li><strong>Three difficulties.</strong> Easy to warm up. Medium for the bite. Master Challenge for the people who finish too fast.</li>
  <li><strong>Quiet by design.</strong> No ads, no tracking, no streaks pushing you to come back. Stats live in your browser only.</li>
</ul>

<hr>

<h2>How to play</h2>

<ol>
  <li>Look at 16 cards.</li>
  <li>Pick the 4 that share a hidden category.</li>
  <li>Submit. Right → group locks in. Wrong → −1 mistake.</li>
  <li>Four mistakes and the game ends.</li>
  <li>Solve all four groups and you win.</li>
</ol>

<p>On Medium puzzles, four small <strong>Foldwink Tabs</strong> sit above the grid. They reveal the four hidden categories one letter at a time as you solve. Once per puzzle you can tap a tab to <strong>Wink</strong> it — fully reveal that category instantly. Use the Wink wisely.</p>

<p>On Master Challenge, tabs reveal slower and the Wink is gone.</p>

<hr>

<h2>Built by</h2>

<p>Neural Void. A small indie lab. Foldwink is the first release. 500 hand-curated puzzles in English. German and Russian content in beta.</p>

<hr>

<h2>Support</h2>

<p>If you enjoy Foldwink, consider supporting development. Donations fund new puzzle packs, weekly themes, and quality-of-life work. Free play stays free — forever.</p>

<p>Pay what you want from the page above ↑.</p>

<hr>

<h2>Privacy</h2>

<p>No accounts. No network tracking. No ads. Your stats and preferences live in your browser's localStorage and never leave your device.</p>
```

### 1.5 CTA button text on Itch

Itch's "Run game" / "Play in browser" button label is fixed by the platform, but the **page-body CTA** above it should read:

```
▶ Play today's puzzle — free, in your browser
```

Place this CTA as a Markdown line **just above** the embedded `<iframe>` / Run-game button, so it sits in the first scroll.

### 1.6 Support / donation message

```
If you enjoy Foldwink, support development and help fund new
puzzle packs. Pay what you want — free play stays free.
```

### 1.7 Tags / categories suggestion

Itch lets up to 10 tags. Order matters for search.

```
puzzle, daily, browser, html5, casual, minimalist, word, grouping,
short, indie
```

Genre: **Puzzle**
Made with: **HTML5**
Average session: **A few minutes**
Languages: **English** (mark German + Russian as "in beta" in body, do not list yet — listing them attracts users who'll bounce on incomplete coverage)
Inputs: **Mouse, Touchscreen**
Accessibility: **One button**, **Color-blind friendly** (verify before ticking)

### 1.8 Optional devlog post (publish alongside the update)

```
Title: Cleaner page, same game

Foldwink's page just got a tighter top-of-page copy. The game
hasn't changed. The reasoning: too many first-time visitors
were closing the page before realising it runs free in the
browser, in 2–5 minutes, with no install. So the page now
leads with that, and the mechanic detail moved below.

Short version up top. Long version still there for the
curious. Press Play.
```

---

## 2. German variant (Deutsch)

For DE traffic, when ads later target DACH. Keep tone direct, not literary.

### Headline

```
Foldwink — Ein winziges tägliches Browser-Puzzle
```

### Sub-headline

```
Finde 4 versteckte Gruppen. Kostenlos im Browser. 2–5 Minuten.
```

### Short description (listing strip)

```
Finde 4 versteckte Gruppen in 16 Karten. Kostenlos im Browser. 2–5 Minuten. Jeden Tag ein neues Rätsel.
```

### Page body (short top block) — plain text

```
## Ein winziges tägliches Browser-Puzzle

Du siehst 16 Karten. Vier davon teilen eine versteckte Kategorie.
Genauso vier weitere. Und nochmal vier. Und nochmal vier. Finde
alle Gruppen. Du hast vier Fehler.

▶ Spiele das heutige Rätsel — kostenlos, im Browser. Keine
Installation. 2–5 Minuten. Jeden Tag neu.
```

### Page body (short top block) — HTML

```html
<h2>Ein winziges tägliches Browser-Puzzle</h2>

<p>Du siehst 16 Karten. Vier davon teilen eine versteckte Kategorie. Genauso vier weitere. Und nochmal vier. Und nochmal vier. Finde alle Gruppen. Du hast vier Fehler.</p>

<p><strong>▶ Spiele das heutige Rätsel — kostenlos, im Browser. Keine Installation. 2–5 Minuten. Jeden Tag neu.</strong></p>
```

### Support text

```
Wenn dir Foldwink gefällt, unterstütze die Entwicklung.
Spenden finanzieren neue Rätsel-Pakete und wöchentliche Themen.
Das kostenlose Spiel bleibt kostenlos.
```

```html
<p>Wenn dir Foldwink gefällt, unterstütze die Entwicklung. Spenden finanzieren neue Rätsel-Pakete und wöchentliche Themen. Das kostenlose Spiel bleibt kostenlos.</p>
```

### Tags

```
rätsel, browser, kostenlos, täglich, html5, casual, minimalistisch, indie
```

(Note: Itch tags are global — keep English tags as primary; use German only if Itch lets you set per-locale.)

---

## 3. Russian variant (Русский)

### Headline

```
Foldwink — крошечная ежедневная головоломка в браузере
```

### Sub-headline

```
Найди 4 скрытые группы. Бесплатно в браузере. 2–5 минут.
```

### Short description (listing strip)

```
Найди 4 скрытые группы в 16 карточках. Бесплатно в браузере. 2–5 минут. Новая головоломка каждый день.
```

### Page body (short top block) — plain text

```
## Крошечная ежедневная головоломка в браузере

Перед тобой 16 карточек. Четыре из них объединяет скрытая
категория. И ещё четыре. И ещё. И ещё. Найди все группы.
У тебя четыре ошибки.

▶ Сыграй сегодняшнюю головоломку — бесплатно, в браузере.
Без установки. 2–5 минут. Каждый день новая.
```

### Page body (short top block) — HTML

```html
<h2>Крошечная ежедневная головоломка в браузере</h2>

<p>Перед тобой 16 карточек. Четыре из них объединяет скрытая категория. И ещё четыре. И ещё. И ещё. Найди все группы. У тебя четыре ошибки.</p>

<p><strong>▶ Сыграй сегодняшнюю головоломку — бесплатно, в браузере. Без установки. 2–5 минут. Каждый день новая.</strong></p>
```

### Support text

```
Если Foldwink нравится — поддержи разработку. Донаты идут
на новые пакеты головоломок и недельные темы. Бесплатная игра
остаётся бесплатной.
```

```html
<p>Если Foldwink нравится — поддержи разработку. Донаты идут на новые пакеты головоломок и недельные темы. Бесплатная игра остаётся бесплатной.</p>
```

### Tags

```
головоломка, браузер, бесплатно, ежедневно, html5, казуальная, минимализм, инди
```

(Same caveat as DE — Itch tags are global; primary tag set stays English.)

---

## 4. Recommended Itch page layout

Exact block order, top to bottom, on the page body:

1. **One-sentence hook** — `A tiny daily browser puzzle.`
2. **Immediate "play in browser" message** — `▶ Play today's puzzle — free, in your browser. No install. 2–5 minutes.`
3. **Very short rules** — three lines: 16 cards, 4 hidden groups of 4, 4 mistakes max.
4. **Why play** — five bullets (§1.4 "Why play").
5. **How to play** — numbered list (§1.4 "How to play"), with Foldwink Tabs / Wink as a single short paragraph at the end.
6. **Support message** — §1.6.
7. **Changelog / new puzzle packs note** — short devlog teaser, e.g. `Recent: 500 curated puzzles. Next: weekly themed packs.`
8. **Privacy** — last block. One short paragraph.

Cover image and screenshots stay above this body, set by Itch's standard fields. Verify cover doesn't show stale "v0.x" or scrappy debug overlay.

---

## 5. A/B copy variants

Three variants, each fully usable. All keep the same constraints (no fake stats, no SaaS tone).

### Variant A — Clear utility

> **Headline:** A tiny daily browser puzzle. Free.
> **Sub-headline:** No install. 2–5 minutes. Play today's puzzle in your browser.
> **CTA:** ▶ Play now — free in browser
> **Support:** Free play stays free. If you enjoy Foldwink, pay what you want to fund new puzzle packs.
>
> Foldwink runs in your browser. No install, no account, no sign-up. You see 16 cards, you find 4 hidden groups of 4. You have 4 mistakes. A new puzzle ships every day. Two to five minutes. That's the whole thing.

### Variant B — Challenge

> **Headline:** Find 4 hidden groups. You have 4 mistakes.
> **Sub-headline:** A daily 4×4 grouping puzzle. Free in your browser.
> **CTA:** ▶ Try today's puzzle
> **Support:** If today's puzzle bit you, support new packs. Pay what you want.
>
> Sixteen cards. Four hidden categories. Four mistakes. The first group looks easy. The second tries to trick you. By the third, you'll question what you saw. Solve all four to win — fail four times and the daily is locked till tomorrow. Free, browser, 2–5 minutes.

### Variant C — Indie creator

> **Headline:** I made a tiny daily puzzle. Try it free.
> **Sub-headline:** Foldwink — 16 cards, 4 hidden groups, 4 mistakes. In your browser. 2–5 minutes.
> **CTA:** ▶ Play in browser — no install
> **Support:** Built by one person at Neural Void. Pay what you want to help fund weekly puzzle packs.
>
> Foldwink is a small daily puzzle I built solo. Browser-only, ad-free, no account needed. If you like it, pay what you want — donations directly fund new puzzle packs. If you don't, no hard feelings; the game stays free either way.

---

## 6. Recommended primary variant

**Ship Variant A first.** Reasons, in order of weight:

1. **The funnel data points to clarity, not curiosity.** The visitor already clicked a TikTok ad — they have curiosity. What they lack is reassurance that pressing Play is *low-cost* (free, no install, short). Variant A leads with exactly those reassurances. Variant B (challenge) and C (indie creator) sell a feeling, which the TikTok creative already did.
2. **Mobile / in-app browser tolerance is the bottleneck.** TikTok in-app browser is small, sluggish, and cuts off long copy. Variant A's first viewport contains the full value prop in three lines. Variants B and C need at least a short paragraph to land.
3. **A/B properly later.** Once Variant A establishes a baseline, run B against A on a second TikTok cohort (same creative, different page top). Reserve C for an indie-platform audience (e.g. an upcoming devlog push), where the "made by one person" hook converts harder.

So: publish Variant A now. Hold B and C as tested follow-ups.

---

## 7. Measurement plan after update

Wait at least 48 hours of comparable traffic before scoring (Itch analytics aggregate daily; TikTok pixels vary by hour).

Track on Itch dashboard → Analytics:

| Metric | Where | What to look for |
|---|---|---|
| Total page views | Itch Analytics → Views | Should hold or rise (no SEO loss from copy change) |
| Browser plays | Itch Analytics → Plays | Primary success metric |
| TikTok referrals | Itch Analytics → Referrers | Should still match TikTok-side click count, ±15 % |
| Browser play rate | `plays / views` | Primary lift to watch |
| Payments / donations | Itch Analytics → Payments | Secondary, tiny volume |
| Comments / ratings | Itch page comments | Qualitative signal — read the words |

### Thresholds for `browser play rate`

| Rate | Interpretation | Action |
|---|---|---|
| < 15 % | Page still weak or traffic mismatch | Audit cover image + first viewport; check TikTok creative-to-page promise alignment |
| 15–25 % | Acceptable baseline | Hold copy; iterate creative side |
| 25–35 % | Good improvement | Lock copy, scale ad spend cautiously |
| 35 %+ | Strong landing fit | Lock copy, increase budget, start preparing Variant B test |

### Secondary signals to flag

- TikTok referral-to-Itch-view ratio drops > 30 %: tracking issue, not copy issue.
- Bounce-style pattern (views ≈ TikTok referrals, plays near zero): cover image or first paragraph is the killer.
- Plays roughly = current rate but session length on TikTok side rises: creative is working harder; widen ad audience.

---

## 8. Manual update checklist

Apply directly on `https://itch.io/dashboard/`:

- [ ] Open Itch dashboard → Foldwink → **Edit game**.
- [ ] **Title:** confirm `Foldwink — A tiny daily browser puzzle` (or just `Foldwink` if you keep the strap line in tagline only).
- [ ] **Short description (tagline field):** paste §1.2.
- [ ] **Description (body):** replace top block with §1.3, full body with §1.4. Preserve existing screenshots block.
- [ ] **Genre:** Puzzle.
- [ ] **Tags:** confirm against §1.7. Remove stale tags if more than 10.
- [ ] **Average session:** A few minutes.
- [ ] **Inputs:** Mouse, Touchscreen.
- [ ] **Languages:** English (do not list DE/RU until those pools are confirmed in prod).
- [ ] **Pricing:** "No or minimum price — pay what you want, suggested price as currently set." Free play unchanged.
- [ ] **Embed options:** confirm the iframe is set to *autostart* off, *fullscreen button* on, *manually start* on (Itch default for browser games is fine; verify the "Run game" button is visible above the fold on mobile).
- [ ] **Cover image:** verify nothing in the cover says "v0.x" or "early access" — that wording kills mobile clicks.
- [ ] **Screenshots:** at least one screenshot shows the **medium-puzzle Wink moment** (tabs visible) and one shows a **solved-board win**. If missing, take fresh ones at 1080×1920 mobile and 1280×800 desktop.
- [ ] **Save** at the top.
- [ ] **Open the live page in incognito** on desktop — first viewport readable, Run-game button visible without scrolling on a 1366×768 laptop.
- [ ] **Open on phone** in Safari/Chrome incognito — Run-game button reachable in first scroll.
- [ ] **TikTok in-app browser test:** open `tiktok.com/@yourhandle`, tap your profile link / pinned-comment link, confirm Itch page renders cleanly inside the in-app browser (this is where most ad traffic lands).
- [ ] **Post a short devlog** (§1.8) so RSS/email subscribers see a reason to revisit.

---

## 9. Local repository scope

**No game code or build files were touched by this update.**

The Itch page lives outside this repository — it is edited via the Itch dashboard. The `itch.io/texts/page-copy.md` and `docs/ITCH_PAGE_COPY.md` files in this repo are the *source of truth* for what should be pasted; both still describe the v0.6.3-era long-form copy and should be updated by hand to match this report **after** the new Itch page goes live and the lift is confirmed. Doing it after — not before — keeps the repo files honest about what's actually on the public page.

The Foldwink section on the public landing page at `https://neural-void.com/foldwink/` lives in a **separate repository** (`sunlike78/neural-void.com`, locally `C:\AI\neural-void.com\site\`) and was already rewritten to a tight itch.io-redirect lander on 2026-04-26. No further change needed there for this conversion fix.

---

## 10. Out of scope (intentional)

- No paywall, no premium pack, no "remove ads" upsell — free play stays free, per task constraints.
- No new game features, no UI changes, no new puzzles.
- No localisation push — DE / RU copy is provided for later use; English is what ships first.
- No fake social proof ("1 % can solve it", "viral on TikTok", "thousands of players") — copy stays factual.
- No SEO meta-tag tuning beyond Itch's own fields.
