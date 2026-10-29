# Foldwink — TikTok Channel Setup (Batch 01)

Short, actionable handoff. Do this **before** loading any video into TikTok Studio. Order matters.

---

## 1. Account type

**Business**, not Personal.

**Important context (verified vs TikTok support docs, April 2026):** TikTok no longer offers a separate *Creator* account type. Current TikTok account types are Personal, Business, and Organization. Earlier drafts of this doc said "switch to Creator" — that option does not exist anymore. Use Business.

**Why Business and not Personal for Foldwink:**

1. **Clickable link in bio works immediately.** Personal accounts need 1,000 followers before the clickable website field unlocks. Business accounts bypass the threshold entirely. Waiting for 1,000 followers before the itch.io funnel is live would waste the entire Batch 01 signal.
2. **The Business music limitation doesn't hurt us.** Business accounts are restricted to TikTok's Commercial Music Library — they cannot use the full general music library. For Batch 01 this is a non-issue because every clip ships with tactile SFX and no licensed music (by design, see schedule audio note).

The honest tradeoff: if a later batch wants to layer trending sounds on top of gameplay, Business blocks that. At that point the choice becomes: stay Business for link access, or switch to Personal and accept the 1,000-follower wait. Default for Batch 01 is Business.

**How to switch** (mobile app, not desktop):

Profile → Menu ☰ (top-right) → Settings and privacy → Account → Switch to Business Account → follow prompts.

If the account was created as Personal and you want to flip: same path, the toggle says "Switch to Business Account."

---

## 2. Handle & display name

| Field | Primary | Fallbacks |
| --- | --- | --- |
| Handle (username) | `@foldwink` | `@playfoldwink` → `@foldwinkgame` → `@foldwink.game` |
| Display name | `Foldwink` | — |
| Profile category | Gaming | — |

Keep the display name to a single word so it reads correctly under a profile avatar. Do **not** put emojis in the display name — TikTok profile-picker truncates them.

---

## 3. Bio (one line only)

Copy-paste:

```
foldwink · small browser puzzle i made. new one every day.
```

Rules:

- One line. TikTok bio has ~80 characters visible; stay under 80.
- Native voice, not ad voice. No "download now," no "play free."
- Do **not** put the link in the bio text itself — put it in the dedicated link field (next step). TikTok algorithm weighs bio text separately from the link slot.

---

## 4. Link in bio

Paste into the dedicated link field (Profile → Edit profile → Website):

```
https://neural-void.itch.io/foldwink?utm_source=tiktok&utm_medium=social&utm_campaign=batch_01
```

Per-post `utm_content` variants live in `tiktok/batch_01/manifests/publish_queue.json`. For the bio link use the campaign-level URL without `utm_content` — that lets itch.io analytics distinguish generic-bio traffic from per-post traffic (which gets its own utm_content from the pinned replies in posts 10 and, if needed, r2).

On a Business account (see §1) the link field is available immediately — no 1,000-follower gate. If for any reason you are on Personal and have <1,000 followers, the clickable field will not exist; in that case put the same URL as the last line of the bio text as a text-only fallback until you either switch to Business or cross 1,000 followers.

---

## 5. Avatar

Готовые файлы лежат в `tiktok/batch_01/profile_assets/`. Оба — 400×400 PNG, читаемы при 40×40 thumbnail TikTok-feed:

| Файл | Описание | Когда выбирать |
| --- | --- | --- |
| `avatar_v1_solved_f.png` | Solved-зелёная плашка с чёрным `F`. Жёсткий контраст, моментально читается на 40×40. | **Primary.** Связывает аватар с `@foldwink` и брендовым цветом solved-tab. |
| `avatar_v2_tabs.png` | 2×2 цветных плашки на тёмном фоне (палитра favicon). | Альтернатива, если хочется avatar = direct visual quote из gameplay-палитры (без буквы). |

SVG-исходники (`avatar_v1_solved_f.svg`, `avatar_v2_tabs.svg`) рядом — править палитру/радиусы там, потом ререндерить:

```bash
npx --yes svgexport avatar_v1_solved_f.svg avatar_v1_solved_f.png 400:400
```

Оба файла используют единую брендовую палитру:
- background dark `#0f1115`
- solved green `#8cd28e`
- yellow `#f5c86b`, red `#ef9e9e`, purple `#b49cf0` (4 категории)

Загружай **тот же файл** на TikTok, itch.io, и любой другой канал — не разные изображения в разных местах.

---

## 6. First-9 grid strategy

TikTok profile grid shows 3 columns, newest-first. New visitors see a 3×3 block. Cover text on those 9 tiles decides whether they scroll to more or leave.

With the Batch 01 schedule, after Day 7 the top 9 tiles will read (newest first, left to right):

```
Row 1 (most recent):  ALMOST RUINED IT   CLEAN             SO CLEAN
Row 2:                GETS WORSE         ESCALATED FAST    LOOKS EASY
Row 3:                CAN YOU SOLVE THIS? HIDDEN GEM       PAUSE AND SOLVE
```

This is intentional: emotional range (near-fail → satisfying → escalation → challenge → curiosity) in a single glance. Do **not** disrupt this order by re-pinning a clip before Day 8.

Cover-text readability check: open the contact sheet at `tiktok/batch_01/previews/contact_sheet.jpg` on a phone. If any cover text is illegible at thumb-size, flag the clip in QA and consider swapping its reserve before publishing.

---

## 7. Pinned posts (after Batch 01 closes)

TikTok allows up to **3** pinned videos on a profile (confirmed against TikTok support, April 2026). **Do not pin during Batch 01.** Pinning redistributes views away from new uploads and biases the algorithm read.

**Pinning is a mobile-app-only action.** TikTok Studio on desktop does not expose the Pin-to-profile control. Do it from the Foldwink phone:

- Open your profile in the mobile TikTok app
- Tap the video you want to pin
- Tap the "···" (three dots) → **Pin**
- Repeat for up to 3 videos

After Day 8 (or whenever the batch has 72h of analytics per clip), pin this combination:

1. **Highest watch-time clip** (top-left pin — most eyes)
2. **Highest comment-rate clip** (second pin — seeds the comment culture)
3. **Post-10 "Hidden Gem"** (third pin — curiosity click converts to bio click)

If any of the three overlap (e.g., post-10 is also the highest watch-time), replace the overlap with the next-best ranked clip.

---

## 8. First-48h hygiene

Do **not** do any of these in the first 48h of the account:

- Follow random accounts (signals bot-like behavior)
- Repost or duet from the brand account
- Buy followers or engagement
- Cross-post identical videos to multiple TikTok accounts
- Use paid Promote on cold clips
- Change the handle, display name, or bio mid-batch

Do **yes** do these:

- Reply to comments from the brand account in the first 30–60 min
- Pin the author first-comment within 2 min of publish (see runbook)
- Watch 5–10 puzzle-adjacent TikToks from this account each day so the algorithm gets a clean "this account watches puzzles" signal
- Like 2–3 comments on your own clips (seeds the comment block as active)

---

## 9. Pre-launch checklist (90 seconds)

- [ ] Account switched to **Business** (not Personal)
- [ ] Handle = `@foldwink` or approved fallback
- [ ] Display name = `Foldwink`
- [ ] Category = Gaming
- [ ] Bio text pasted, under 80 chars
- [ ] Link in bio field = campaign URL with `utm_campaign=batch_01` — verify it accepts the URL (Business = no follower gate)
- [ ] Avatar uploaded — `tiktok/batch_01/profile_assets/avatar_v1_solved_f.png` (primary) или `avatar_v2_tabs.png` (alt)
- [ ] TikTok Studio opens without errors on the desktop browser you'll use to publish
- [ ] **TikTok mobile app installed and logged in as Foldwink** on the operator's phone (required for pinning first comments and, later, pinning videos to the profile)
- [ ] `tiktok/batch_01/manifests/publish_queue.json` opens and lists 13 entries
- [ ] `npm run tiktok:prep -- 1 --field=caption` copies the post-01 caption to clipboard

Only after all 11 checkboxes are green, open `operator_runbook.md` and start the Day 1 publish.
