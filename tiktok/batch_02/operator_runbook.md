# Foldwink — TikTok Batch 02 Operator Runbook

Batch 02 is a content-format upgrade from batch_01: instead of compositing
720×1280 Playwright recordings into 9:16, you record real native-portrait
gameplay (touchscreen on iPhone, or OBS desktop in portrait window) and the
compositor only normalises + overlays.

This runbook covers the **pre-publishing** flow: recording, composing, QA.
Publishing (caption / cover / pinned comment / scheduling) reuses the
batch_01 runbook unchanged — only the source clips are different.

---

## 1. Prerequisites

- batch_01 is published or in flight (do not run batch_02 until you have at least 7 days of batch_01 signal — Day 8 debrief from batch_01 informs batch_02 picks)
- Recording setup picked and tested per `recording_setup.md` (Path A iPhone or Path B OBS)
- ffmpeg available (project already bundles `ffmpeg-static` via npm)
- Terminal at `C:\AI\neural-void.com\foldwink`
- Foldwink playable build available (deployed or `npm run dev` + tunnel for the phone)

---

## 2. The variant table

`tiktok/batch_02/manifests/batch_02_variants.json` is the single source of
truth for what gets composed. Each variant has:

| Field | What it does |
| --- | --- |
| `id` | Stable identifier — used in the manifest output and CLI filtering |
| `name` | Output filename in `tiktok/batch_02/exports/` |
| `raw` | Input filename in `tiktok/batch_02/raw/` (must exist before composing) |
| `bucket` | Editorial bucket — mirrors batch_01 vocabulary |
| `hookText` | First-second on-screen text |
| `hookPosition` | `top` (default) or `bottom` |
| `ctaText` | Lower-third overlay shown in the last ~3s. `null` for no CTA |
| `startSec` / `durSec` | Trim window inside the raw clip |
| `cadence` | `snappy` / `fast` / `medium` / `confident` — used by synth audio mode only |
| `plannedMistakes` | 0–3 — used by synth audio mode only |
| `audioMode` | `passthrough` / `synth` / `silent` — see §4 |

Edit this JSON freely between recording sessions. The compositor reads it
fresh each run — no rebuild needed.

---

## 3. Per-scenario recording scripts

Five scenarios. Each maps to one variant in the table. Open the matching
puzzle in Foldwink before pressing Record.

### Scenario A — `scenario_a_easy_clean.mp4` → `batch02_01_60_seconds`

- **Difficulty:** easy
- **Target duration in raw:** ≥ 13s
- **Mistakes:** 0 (clean run)
- **Cadence:** fast — 1.0–1.6s between selects, no hesitation
- **What to do:**
  1. From the home screen, tap **Easy puzzle**
  2. Wait ~0.4s for the grid to settle (do not start tapping during the entrance animation)
  3. Solve the four groups in confident order — easy → harder. Press Submit cleanly between groups
  4. Hold the final win frame for ~1.5s
- **Frame requirement:** the 4×4 grid must be fully visible inside the first second. No header/menu transition.

### Scenario B — `scenario_b_medium_tabs.mp4` → `batch02_02_watch_the_tabs`

- **Difficulty:** medium
- **Target duration in raw:** ≥ 18s
- **Mistakes:** 1 (planned — submit a wrong group on round 2)
- **Cadence:** medium — pause briefly before each Submit so the Foldwink Tabs reveal lands cleanly
- **What to do:**
  1. Tap **Medium puzzle**
  2. Confirm the row of four Foldwink Tabs is visible above the grid (single-letter hints at start)
  3. Solve the easiest group first → Submit cleanly. **Watch the tab letters tick from 1 → 2 across all unsolved tabs.** This is the unique visual.
  4. On round 2, deliberately pick one wrong card, Submit. The wrong feedback is the tension beat.
  5. Recover, Submit correct group → tabs tick to 3
  6. Solve the remaining two groups
- **Frame requirement:** The four Foldwink Tabs must be visible at the top of frame from the first second through the win.

### Scenario C — `scenario_c_wink_showcase.mp4` → `batch02_03_one_free_hint`

- **Difficulty:** medium
- **Target duration in raw:** ≥ 24s
- **Mistakes:** 1
- **Cadence:** medium-deliberate
- **What to do:**
  1. Tap **Medium puzzle**
  2. Solve one easy group cleanly (round 1) → tabs reveal one letter
  3. **Tap the hardest-looking unsolved tab to Wink it.** The full category text appears in the solved colour. Hold for ~1.0s — this is the hero beat.
  4. Solve the just-winked group (now you know the category)
  5. Make one mistake on round 3 (planned), recover
  6. Solve the final group → win
- **Frame requirement:** the Wink reveal must happen between t=4s and t=10s of the raw clip — the on-screen hook copy "One free hint. That's it." holds for ~4s and needs to be off-frame before the Wink moment.

### Scenario D — `scenario_d_near_fail.mp4` → `batch02_04_two_left`

- **Difficulty:** medium
- **Target duration in raw:** ≥ 22s
- **Mistakes:** 2 (the tension hook is the mistake counter ticking down)
- **Cadence:** medium → snappy at the end
- **What to do:**
  1. Tap **Medium puzzle**
  2. Round 1: deliberate wrong group → "3 mistakes left"
  3. Round 2: solve one group cleanly
  4. Round 3: deliberate wrong group → "2 mistakes left" — hold this beat for ~1s, this is the hook moment
  5. Rounds 4 & 5: clean recoveries → win
- **Frame requirement:** the mistake counter (top-right area depending on layout) must be readable in the first 5s.

### Scenario E — `scenario_e_hard_flex.mp4` → `batch02_05_hard_mode`

- **Difficulty:** hard (Master Challenge — must be unlocked; the recording device's local progress must have unlocked it)
- **Target duration in raw:** ≥ 14s
- **Mistakes:** 0
- **Cadence:** confident — no second-guessing
- **What to do:**
  1. Tap **Master Challenge**
  2. Solve all four groups cleanly without hesitation
  3. Hold the win frame for 1s
- **Frame requirement:** "Master Challenge" / hard-mode label must be readable at clip start.

---

## 4. Audio mode picker

Choose **per variant** in `batch_02_variants.json` via `audioMode`:

- **`passthrough`** (default, recommended): the compositor copies the native audio track from the raw recording. This includes Foldwink's real WebAudio SFX (`select`/`submit`/`correct`/`wrong`/`win`). Use whenever your recording captured app audio (iOS Screen Recording with mic off, OBS with Desktop Audio on).
- **`synth`**: the compositor builds an SFX bed from cadence + `plannedMistakes` using the same generator batch_01 used. Use when raw was recorded silent (rare — only fallback).
- **`silent`**: strips audio entirely. Use only for muted-by-design clips.

You can also override across the whole run with `--audio=<mode>`.

---

## 5. Compose flow

Once raw clips are in `tiktok/batch_02/raw/`:

```bash
# Compose all variants (default audio mode = passthrough or per-variant override)
npm run tiktok:compose:batch02

# Compose a single variant by id or name fragment
npm run tiktok:compose:batch02 -- 60_seconds

# Force synthesised SFX bed for everything (e.g. raws were captured silent)
npm run tiktok:compose:batch02 -- --audio=synth

# No-audio export (for thumbnail extraction, never for posting)
npm run tiktok:compose:batch02 -- --no-audio
```

The compositor:

1. Reads `batch_02_variants.json`
2. For each variant, checks `tiktok/batch_02/raw/<raw>` exists — skips if not
3. Probes the raw size + duration with ffprobe (via ffmpeg `-i` parsing)
4. Normalises to 1080×1920 (scale + center crop)
5. Overlays the hook (first ~3s) + CTA (last ~3s)
6. Resolves audio per `audioMode`
7. Writes final to `tiktok/batch_02/exports/<name>.mp4`
8. Writes a per-run record to `tiktok/batch_02/manifests/tiktok_batch_02_video_manifest.json`

Skipped variants are listed under `manifest.skipped` with a reason — useful when you record incrementally.

---

## 6. QA gate (before any of these go to TikTok Studio)

Open each export in a phone-sized window and confirm:

- [ ] First second is gameplay, not a black frame or transition
- [ ] Hook text is fully inside the safe zone (no top-edge cutoff)
- [ ] CTA text (if present) is fully inside the safe zone (no bottom-edge cutoff under TikTok's own UI)
- [ ] Audio plays — `select` / `correct` / `win` cues are audible at typical phone volume
- [ ] No motion-blur smear, no frame drops, no stutter
- [ ] Final frame is win state (or controlled tension hold for clip 04), not a transition

If a clip fails any of these, re-record that scenario only — don't re-shoot the batch.

---

## 7. After QA — produce the publishing manifest

Batch 02 reuses the batch_01 publishing flow. To wire it up:

1. Copy `tiktok/batch_01/manifests/publish_queue.json` to `tiktok/batch_02/manifests/publish_queue.json`
2. Replace each entry's `file`, `cover`, `caption`, `pinned_comment`, `scheduled_slot_iso/_human`, `bucket` to match the new clips
3. Add `--batch=02` when calling `npm run tiktok:prep`:
   ```bash
   npm run tiktok:prep -- 1 --batch=02
   ```
4. Per-post flow from `tiktok/batch_01/operator_runbook.md` §1–§7 still applies — just point at the batch_02 exports folder

Captions, hashtags, first comments, scheduling cadence: copy the format from
batch_01 manifests, swap the copy. Don't re-derive the publishing process —
the batch_01 runbook already paid that cost.

---

## 8. Files this batch creates

```
tiktok/batch_02/
├── raw/                          # native-portrait recordings (input — you create these)
│   ├── scenario_a_easy_clean.mp4
│   ├── scenario_b_medium_tabs.mp4
│   ├── scenario_c_wink_showcase.mp4
│   ├── scenario_d_near_fail.mp4
│   └── scenario_e_hard_flex.mp4
├── exports/                      # 5× 1080×1920 MP4 (output — compositor creates)
├── workfiles/                    # silent intermediates + synth SFX (created)
└── manifests/
    ├── batch_02_variants.json                 # source of truth for compose
    ├── tiktok_batch_02_video_manifest.json    # per-run output (created by compose)
    └── publish_queue.json                     # copy from batch_01 + edit (Step 7)
```

---

## 9. When to stop using this runbook

After batch_02 publishes and you write `tiktok/batch_02/reports/batch_02_debrief.md`. Batch 03 will have its own — and may switch back to Playwright recordings, or to face-to-camera, depending on what batches 01 and 02 say converts.
