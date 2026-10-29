# Foldwink — TikTok Batch 01 Operator Runbook

This is the step-by-step document the human operator follows for every single post. Print it or keep it in a second window. The entire batch is under an hour of active work across 8 days.

---

## Prerequisites

- `channel_setup.md` steps 1–9 done (account is **Business**)
- TikTok Studio open at <https://www.tiktok.com/tiktokstudio/>, logged in as the Foldwink account (desktop, used for **upload + schedule**)
- **TikTok mobile app installed and logged in as Foldwink on a phone that stays with the operator** — this is non-optional. Pin-comment and pin-to-profile do **not** work on TikTok desktop as of April 2026; both require the mobile app.
- Terminal open at `C:\AI\neural-void.com\foldwink`
- File explorer open at `tiktok\batch_01\exports\` and `tiktok\batch_01\covers\`

---

## Per-post flow (6 min per post)

Repeat once for each `id` in `publish_queue.json`. Use the **scheduled slot** from the queue — do not publish immediately unless it's within 15 min of the scheduled slot.

### 1. Pre-flight on the clip (30 s)

Open the MP4 in a phone-sized window and watch it once. Reject and swap in a reserve if:

- First second is black, a logo, or a menu
- Text overlay cut off by the 140 px TikTok UI safe zone (top or bottom)
- Audio is broken or silent where SFX is expected
- Cover frame text is unreadable on a phone-size thumbnail

If rejected, pick a reserve from `publish_queue.json` (the `"reserve": true` entries) and restart this flow with that clip.

### 2. Copy caption to clipboard (5 s)

In the terminal:

```bash
npm run tiktok:prep -- <N>
```

Where `<N>` is `1` for `post-01`, `10` for `post-10`, `r2` for `post-r2`, etc. The script prints the caption+hashtags and copies them to the clipboard.

### 3. Upload in TikTok Studio (2 min)

1. TikTok Studio → **Upload** → pick the MP4 from `tiktok\batch_01\exports\`.
2. In the caption box: Ctrl+V. The caption and hashtags land as one block.
3. Open "More options" → scroll to **Cover** → click **Edit cover**.
4. Upload the matching JPG from `tiktok\batch_01\covers\` (same filename stem as the MP4). Do **not** let TikTok auto-pick a cover.
5. Disclosure: leave **Disclose video contents** unchecked unless TikTok's rules say otherwise.
6. Comments / duet / stitch: leave all three ON. Turning comments off on Batch 01 kills the test.
7. Allow AI-generated label: OFF.

### 4. Schedule (30 s)

1. Scroll to **Schedule video** and toggle it ON.
2. Date + time: copy the `scheduled_slot_human` from the queue (e.g. "Mon 2026-04-27 · 7:30 PM ET").
3. Confirm the time zone TikTok Studio shows matches ET. If TikTok shows your local CET, convert the ET time to CET first (ET + 6h during DST) and enter the CET value.
4. Click **Schedule**. The clip now sits in Scheduled posts.

### 5. Prepare pinned reply for publish time (30 s)

Leave this terminal window open for the scheduled slot:

```bash
npm run tiktok:prep -- <N> --field=pinned
```

Don't run it yet — just have the command ready. You'll fire it at the exact publish time.

### 6. At the scheduled slot — publish pinned comment (1 min, LIVE, **mobile app required**)

TikTok publishes the video automatically at the slot. The pinned author comment is done by hand — **and must be done from the TikTok mobile app**, not from TikTok Studio / desktop. As of April 2026, comment pinning is not exposed on desktop; only the mobile app supports it.

1. On the desktop: refresh the published post in the Foldwink account. Confirm it is live.
2. Run the prepped command (step 5). Pinned reply is now in the desktop clipboard.
3. Paste the pinned reply into the comment box on the desktop post and submit it. (It posts fine from desktop — only pinning needs mobile.)
4. On the **phone**, open the Foldwink TikTok app → open the same post → tap the comment icon → scroll to your own just-posted comment → **press and hold** it for ~1 second → in the pop-up menu tap **Pin comment**.
5. Still on the phone: like your own pinned comment once (seeds the comment block as active).

**Limits and gotchas:**

- Only **one** pinned comment per post is allowed. Pinning a new comment automatically unpins the previous one — this is the documented behaviour and is what `pinned_comment_alt` uses as a swap mechanism (§7).
- Only the video creator can pin on their own videos — no delegate pinning.
- Deadline: within **2 min** of publish. Later pins lose most of the algorithmic benefit.

### 7. First-hour follow-up (5 min active, spread across 60 min)

- Reply to 3–5 earliest genuine comments within 15 min (desktop or mobile, whichever is at hand).
- Never copy-paste the same reply. Each reply visibly different.
- If a viewer posts a time in a "drop your time" thread, reply with your own time, not just `❤️`.
- If nobody comments in 30 min, swap the pinned comment to the `pinned_comment_alt` from the queue:
  1. On desktop, run `node scripts/tiktok-prep.mjs <N> --no-copy --field=pinned` and manually copy the `pinned_comment_alt` value from `publish_queue.json` (the helper currently copies the primary comment; for the alt, open the JSON and grab the alt string).
  2. On the **phone**, post the alt as a new comment and pin it. Pinning the new comment automatically unpins the previous one.

Do not reply to trolls. Do not hide them either. Let them sit.

---

## Daily monitoring (5 min per day)

Each morning, open **TikTok Studio → Analytics** and note, for each live post:

- `watch_time_sec_avg`
- `completion_rate`
- `comments`
- `shares`
- `profile_visits`
- `bio_link_clicks` (visible under the post-specific analytics tab)

Log these to a simple spreadsheet or just jot in `tiktok/batch_01/reports/day_N_numbers.md`. Don't over-engineer — we only need enough data to pick Batch 02 winners.

---

## Decision gates (fire one of these, not all)

### Gate A — Day 2 morning: opener health

Check post-01 and post-10 (both live overnight). If **either** has:

- completion_rate < 35 %, **and**
- comments < 3,

then consider swapping the afternoon slot's main clip (currently `post-02`) for a reserve. The most likely healthy replacement: `post-r3` (alt of post-02, different puzzle).

### Gate B — Day 3: format signal

By end of Day 2, you have 4 posts live. Rank them by watch-time. If the top 2 are from the **same bucket** (e.g., both near-fail), skip clips from other buckets that are scheduled to land within 24 h and bring forward the reserve from that winning bucket.

### Gate C — Day 5: curiosity-click convert

Check post-10's `bio_link_clicks / profile_visits` ratio. If >15 %, that's the Batch 02 north star — model more curiosity-click clips. If <5 %, the bio link itself is the bottleneck (likely itch.io load time on mobile) — fix the funnel, not the videos.

### Gate D — Day 8 evening: final call

After post-09 publishes and gets 12 h of signal:

1. Pick the top 3 clips by a weighted score: `watch_time * 0.4 + (completion * 0.3) + (comments/views * 0.2) + (profile_visits/views * 0.1)`.
2. Pin those 3 on the profile (per `channel_setup.md` §7).
3. Write a one-page debrief: `tiktok/batch_01/reports/batch_01_debrief.md` with winner hypotheses and Batch 02 brief.

---

## Emergency stops

Stop publishing and do **not** continue the batch if any of these fires:

- TikTok flags a post for community guidelines — pause and read the flag before posting the next clip.
- The account gets an "unusual activity" warning — stop for 48 h, nothing more.
- A clip gets 100K+ views in under 2 h — **do not** add more posts that day. Over-posting on a hot clip is the #1 cause of virality self-sabotage. Let it breathe.
- itch.io page 404s or is down — kill the bio link before the next post; host-locally fallback is out of scope for Batch 01.

---

## Files you touch during the batch

Read-only (do not edit during batch):

- `tiktok/batch_01/exports/*.mp4`
- `tiktok/batch_01/covers/*.jpg`
- `tiktok/batch_01/manifests/tiktok_batch_01_manifest.md`
- `tiktok/batch_01/manifests/publish_queue.json` (edit only to swap reserves)

Create as you go:

- `tiktok/batch_01/reports/day_1_numbers.md` … `day_8_numbers.md`
- `tiktok/batch_01/reports/batch_01_debrief.md` (Day 8 evening)

Helper:

- `scripts/tiktok-prep.mjs` → `npm run tiktok:prep -- <id> [--field=…]`

---

## Quick reference — every post in one line

| ID | Slot (ET) | Slot (CET) | Clip | Bucket |
| --- | --- | --- | --- | --- |
| post-01 | Mon 04-27 · 7:30 PM | 01:30 Tue | Pause and Solve | challenge |
| post-10 | Mon 04-27 · 9:30 PM | 03:30 Tue | Hidden Gem | curiosity |
| post-02 | Tue 04-28 · 12:30 PM | 18:30 | Can You Solve This? | challenge |
| post-03 | Tue 04-28 · 7:00 PM | 01:00 Wed | Looks Easy. It Isn't. | challenge |
| post-04 | Wed 04-29 · 8:00 PM | 02:00 Thu | Escalated Fast | escalation |
| post-05 | Thu 04-30 · 7:00 PM | 01:00 Fri | Gets Worse | escalation |
| post-06 | Fri 05-01 · 12:30 PM | 18:30 | So Clean | satisfying |
| post-07 | Sat 05-02 · 11:30 AM | 17:30 | Clean | satisfying |
| post-08 | Sun 05-03 · 9:30 PM | 03:30 Mon | Almost Ruined It | near-fail |
| post-09 | Mon 05-04 · 10:00 PM | 04:00 Tue | Watch the Last Move | near-fail |
| post-r2 | — | — | Looks Easy (Alt) — A/B alt for clip 03, same hook on a different puzzle |
| post-r1 | — | — | One Move Left — general reserve |
| post-r3 | — | — | Can You? (Alt) — A/B alt for clip 02 |

---

## When to stop using this runbook

After `batch_01_debrief.md` is written, this runbook is retired. Batch 02 will have its own runbook.
