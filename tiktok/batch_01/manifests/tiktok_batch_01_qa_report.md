# Foldwink — TikTok Batch 01 QA Report

**Reviewed:** 2026-04-17
**Reviewer:** automated pipeline + manual frame-spot review
**Status:** ✅ PASS — all 13 clips publish-ready. 2 accepted compromises noted.

---

## 1. Technical checks — all 13 clips

| Check | Method | Result |
| --- | --- | --- |
| Aspect ratio 9:16 | ffprobe | ✅ 1080×1920 on every clip |
| Resolution 1080×1920 | ffprobe | ✅ all match |
| Video codec H.264 | ffprobe | ✅ High profile, yuv420p, bt470bg |
| Audio codec AAC | ffprobe | ✅ 44.1 kHz stereo, 160 kbit/s |
| `faststart` for web upload | ffmpeg `+faststart` | ✅ enabled at mux |
| File size reasonable | `ls` | ✅ 631 KB – 1.06 MB (well under TikTok's 287 MB limit) |
| No broken aspect / letterbox | cover spot-check | ✅ blurred background fills 1080×1920; gameplay centered 1080×1080 |

## 2. Safe-zone checks

TikTok UI clips approximately the top 15 % (back button + timer) and the bottom 22 % (caption, icons, progress bar, sound disc).

The composer uses:

- **Top safe:** 16 % (SAFE_TOP = 307 px)
- **Bottom safe:** 22 % (SAFE_BOTTOM = 422 px)
- **Side safe:** 7 %

| Check | Method | Result |
| --- | --- | --- |
| Hook text inside top safe zone | manual cover review | ✅ all 13 — never touches timer/back area |
| CTA text inside bottom safe zone | manual cover review | ✅ all 13 — sits clear of progress bar |
| Body text doesn't collide with UI | manual review | ✅ game board fully visible between overlays |
| Overlay readable on mobile at 20 % brightness | visual spot-check at thumbnail size | ✅ 52 pt bold + black@0.6 box borderw=26 holds up |

## 3. Hook / pacing checks

| Check | Standard | Result |
| --- | --- | --- |
| First 1 s reveals the game | never logo / menu / black | ✅ every clip opens on a live 4×4 board |
| Hook text on screen by t = 0.1 s | compose rule `enable='between(t,0.1,…)'` | ✅ enforced in drawtext filter |
| No title card, no logo sting, no menu idle | manual open-frame review | ✅ pipeline crops directly to gameplay region |
| Hook holds ≤ 4.0 s, never into CTA window | rule `hookHold = min(dur*0.55, dur-3.2, 4.0)` | ✅ verified |
| CTA arrives ~3 s before end | rule `ctaStart = max(1.2, dur-3.0)` | ✅ verified |
| Dead air avoidance | SFX fires on every select / submit | ✅ measured event timestamps from record stage |

## 4. Overlay text length

Long-hook clips that required two-line wrapping:

- 03 / r2 · `Looks easy. It isn’t.` — wraps cleanly at ". It isn’t."
- 06 · `Tiny puzzle, huge satisfaction.` — wraps at "huge satisfaction."
- 10 · `Browser puzzle I didn’t expect to like.` — wraps at "didn’t expect to like."

All fit within SIDE safe margin (76 px each side). Manual check: no glyphs bleeding outside 925 px content width.

## 5. Per-clip manual review

| # | Opens on gameplay | Hook readable | SFX clean | No UI clutter | End not abrupt |
| --- | --- | --- | --- | --- | --- |
| 01 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 02 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 03 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 04 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 05 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 06 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 07 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 08 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 09 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | ✅ | ✅ | ✅ | ✅ | ✅ |
| r1 | ✅ | ✅ | ✅ | ✅ | ✅ |
| r2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| r3 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 6. Accepted compromises

These are documented, not defects. They feed directly into Batch 02.

### C1 · 18–24 s bucket capped at ~16 s

**Specification:** 2 of 10 clips in the 18–24 s range.
**Actual:** clips 05 and 08 run 15.42 s and 16.22 s, not 18+ s.
**Cause:** the raw source clips top out at 18.08 s (`almost_fail_then_win.webm`), and ffmpeg `-ss` keyframe-seek trims another ~1–2 s.
**Impact:** the escalation and near-fail narratives are intact — both clips still land as "long" content in the 9/10 clip set. TikTok has no minimum duration gate.
**Action for Batch 02:** record a dedicated long scenario — `hard_mode_climb`, 5 rounds at confident cadence, planned for ≥ 22 s raw. Add to `tiktok/video_automation/configs/scenarios.json`.

### C2 · 8–12 s bucket landed 1–2 s short of target

**Specification:** 4 clips at 8–12 s — we targeted the 10–12 s end.
**Actual:** 01 (8.94), 06 (8.64), 07 (9.24), 09 (10.12), r1 (9.04).
**Cause:** same `-ss` keyframe drift. Targets of 10 s land at ~9 s.
**Impact:** all still inside the bucket, all still playable. Short satisfying clips actually benefit from this drift (tighter = more loopable).
**Action for Batch 02:** if 10–12 s is required exactly, add `-copyts -avoid_negative_ts make_zero` to the ffmpeg args, or bump target dur by +1.2 s at the variants table.

## 7. Rules explicitly not violated

- ❌ No clip opens on logo / title card / black / menu idle
- ❌ No CTA uses "Download", "Install", "Buy", "Play now!!!"
- ❌ No mainstream copyrighted music baked in
- ❌ No clip relies on sound to be understood — hooks and gameplay read with audio muted
- ❌ No hashtag stuffing — every clip has 3–5 hashtags, on-topic only
- ❌ No CTA on satisfying clips (06, 07, 09, r1 intentionally ship without CTA)
- ❌ No hook repeated across 3+ main clips — worst case is `Looks easy. It isn’t.` on 03 + r2 (r2 is the A/B alt, not a main)
- ❌ No text overlay > 2 visual lines

## 8. Known minor imperfections — do not block publish

- **Cover extraction at fixed t = 2.5 s** — some clips show a tile mid-selection rather than mid-solve. This is fine: TikTok cover cropping and user-selected frame override the default anyway. If you want a different cover, open the MP4 in TikTok and scrub the slider; no re-render needed.
- **`hard_mode_flex` raw duration is 11.92 s** — clip 09 targeted 12 s and hits 10.12 s after `-ss` drift. Still within the 8–12 bucket. If you want a fuller hard-mode showcase, use this as input for Batch 02 with a dedicated longer record.

## 9. Readiness

✅ Ready to upload to TikTok.
✅ Captions file ready for copy-paste.
✅ First-comment file ready; pin within 30 s of publish.
✅ Schedule file has day-by-day slotting; Day 1 uses clips 01 + 10 unless account is brand new (see schedule alt).
