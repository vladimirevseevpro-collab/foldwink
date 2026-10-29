# Foldwink — TikTok Batch 01 Manifest

**Generated:** 2026-04-17
**Game version at capture:** 0.6.3 (compact daily card + iOS Add-to-Home tip + mobile polish)
**Account:** Neural Void → Foldwink
**Target:** English-speaking TikTok audience — puzzle / brain / browser-game viewers
**Strategy:** interface-first hook testing. No actors, no UGC, no logo-first intros.
**Format:** 9:16 vertical, 1080×1920, H.264 + AAC, real gameplay footage with blurred background padding and tight safe-zone overlays.

---

## Bucket distribution

| Bucket | Count | Clips |
| --- | --- | --- |
| 1 · Challenge hooks | 3 | 01, 02, 03 |
| 2 · Escalation | 2 | 04, 05 |
| 3 · Satisfying solves | 2 | 06, 07 |
| 4 · Near-fail / replay bait | 2 | 08, 09 |
| 5 · Curiosity click | 1 | 10 |
| Reserves | 3 | r1, r2, r3 |
| **Total** | **13** | — |

## Length mix (actual)

| Range | Target | Actual clips |
| --- | --- | --- |
| 8–12 s | 4 | 01 (8.9), 06 (8.6), 07 (9.2), 09 (10.1), r1 (9.0) |
| 13–18 s | 4 | 02 (13.8), 03 (16.2), 04 (13.7), 10 (13.6), r2 (13.0), r3 (14.7) |
| 18–24 s | 2 | 05 (15.4), 08 (16.2) — *clamped; source webm max ≈ 18s, see QA report* |

Real durations come in 1–2 s below target because ffmpeg `-ss` keyframe-seek lands slightly past the requested start. The 18–24 s bucket was capped by source-clip length (longest raw = 18.08 s). This is noted as an accepted compromise for Batch 01; Batch 02 should record a dedicated long scenario (~24 s, 5 rounds hard mode) to hit that bucket cleanly.

---

## Clip index — 10 main + 3 reserve

Each entry below has the full required metadata. Exports live in `tiktok/batch_01/exports/`. Covers are single frames at t ≈ 2.5 s, in `tiktok/batch_01/covers/`. A 5×3 contact sheet is at `tiktok/batch_01/previews/contact_sheet.jpg`.

---

### 01 · tiktok_01_pause_and_solve.mp4 — **main**

- **Working title:** Pause and Solve (Direct Challenge)
- **Bucket:** 1 · Challenge hook
- **Duration:** 8.94 s
- **Hook type:** direct challenge · pause-bait
- **Source scenario:** clean_fast_solve (easy, 0 mistakes, fast cadence)
- **On-screen text:** `Pause and solve.`
- **CTA overlay:** `Could you get this?`
- **Caption:** `pause it. solve it. no cheating.`
- **Suggested first comment:** `be honest — how long did it take?`
- **Hashtags:** `#puzzlegame #braingame #logicpuzzle #pausegame #browsergame`
- **Ending type:** resolved (clean win)
- **Cover text suggestion:** `PAUSE AND SOLVE`
- **Music/SFX version:** clean tactile SFX (select / submit / correct), no music
- **What this clip is testing:** whether a pause-bait opener (zero explanation, direct imperative) pulls TikTok viewers into the game loop inside the first second
- **Why it may work:** TikTok viewers respond to imperative hooks. The clip lands on a visible 4×4 board immediately — no UI navigation, no menu
- **Recommended posting slot:** Day 1 · 7:30 PM local (evening primetime)
- **Reserve or main:** main

### 02 · tiktok_02_can_you_solve.mp4 — **main** · strongest-hook candidate

- **Working title:** Can You Solve This? (Medium + Foldwink Tabs)
- **Bucket:** 1 · Challenge hook
- **Duration:** 13.75 s
- **Hook type:** direct challenge · ego-bait
- **Source scenario:** escalating_difficulty (medium, 1 mistake, Foldwink Tabs visible)
- **On-screen text:** `Can you solve this?`
- **CTA overlay:** `Would you solve it faster?`
- **Caption:** `be honest, how long would this take you`
- **Suggested first comment:** `no cheating. drop your time.`
- **Hashtags:** `#puzzlegame #braingame #canyousolveit #logicpuzzle`
- **Ending type:** resolved with recovery (mistake → correct path)
- **Cover text suggestion:** `CAN YOU SOLVE THIS?`
- **Music/SFX version:** tactile SFX; medium cadence emphasises tabs reveal on correct solves
- **What this clip is testing:** whether direct “can you” challenge + visible Foldwink Tabs reveal stops scrollers
- **Why it may work:** pairs ego-challenge copy with the game’s signature tab-reveal mechanic, which is unique visual material
- **Recommended posting slot:** Day 1 · 9:00 PM local (night primetime — pairs well with clip 10)
- **Reserve or main:** main

### 03 · tiktok_03_looks_easy.mp4 — **main**

- **Working title:** Looks Easy. It Isn’t. (Medium with 2 mistakes)
- **Bucket:** 1 · Challenge hook
- **Duration:** 16.22 s
- **Hook type:** expectation-subversion
- **Source scenario:** almost_fail_then_win (medium, 2 mistakes)
- **On-screen text:** `Looks easy. It isn’t.`
- **CTA overlay:** `Could you get this?`
- **Caption:** `this is meaner than it looks`
- **Suggested first comment:** `two mistakes before i got this clean`
- **Hashtags:** `#puzzlegame #braingame #looksimple #harderthanitlooks`
- **Ending type:** resolved-with-tension
- **Cover text suggestion:** `LOOKS EASY`
- **Music/SFX version:** tactile SFX; 2 `wrong` hits land sharp → recovery
- **What this clip is testing:** whether “looks easy / isn’t” contrast + visible two mistakes + a direct `Could you get this?` CTA drives comments
- **Why it may work:** mistake visibility builds trust (not a flawless demo) + a direct challenge CTA turns the contrast into a solve-it invitation, not an ad
- **Recommended posting slot:** Day 2 · 7:00 PM local
- **Reserve or main:** main

### 04 · tiktok_04_escalated_fast.mp4 — **main** · strongest-hook candidate

- **Working title:** This Escalated Fast (Escalation)
- **Bucket:** 2 · Escalation
- **Duration:** 13.65 s
- **Hook type:** difficulty-curve reveal
- **Source scenario:** escalating_difficulty (medium, 1 mistake)
- **On-screen text:** `This escalated fast.`
- **CTA overlay:** `Want harder ones?`
- **Caption:** `was fine and then it wasn’t`
- **Suggested first comment:** `i got wrecked on the third row ngl`
- **Hashtags:** `#puzzlegame #difficultyspike #braingame #logicpuzzle`
- **Ending type:** resolved but narrow
- **Cover text suggestion:** `ESCALATED FAST`
- **Music/SFX version:** tactile SFX; tempo shift midway
- **What this clip is testing:** whether “escalated fast” framing reads when the visible tabs reveal in stages
- **Why it may work:** pairs a relatable hook line with the actual game mechanic doing the escalation
- **Recommended posting slot:** Day 3 · 8:00 PM local
- **Reserve or main:** main

### 05 · tiktok_05_worse_later.mp4 — **main**

- **Working title:** It Gets Worse Later (Escalation + tease)
- **Bucket:** 2 · Escalation
- **Duration:** 15.42 s (target 17 s; source-bounded)
- **Hook type:** forward-promise · part-2 bait
- **Source scenario:** almost_fail_then_win (medium, 2 mistakes)
- **On-screen text:** `It gets worse later.`
- **CTA overlay:** `Part 2?`
- **Caption:** `it gets worse later. i swear.`
- **Suggested first comment:** `part 2 if this gets 50 saves`
- **Hashtags:** `#puzzlegame #logicpuzzle #part2 #braingame`
- **Ending type:** harder-next-level tease
- **Cover text suggestion:** `GETS WORSE`
- **Music/SFX version:** tactile SFX; ends unresolved-forward
- **What this clip is testing:** whether promising escalation beyond the visible clip triggers saves + part-2 requests
- **Why it may work:** “part 2?” is one of TikTok’s highest-yielding comment hooks and maps cleanly to the multi-difficulty structure
- **Recommended posting slot:** Day 4 · 7:00 PM local
- **Reserve or main:** main

### 06 · tiktok_06_tiny_big.mp4 — **main** · strongest-hook candidate

- **Working title:** Tiny Puzzle, Huge Satisfaction
- **Bucket:** 3 · Satisfying solves
- **Duration:** 8.64 s
- **Hook type:** satisfying payoff
- **Source scenario:** clean_fast_solve (easy, 0 mistakes)
- **On-screen text:** `Tiny puzzle, huge satisfaction.`
- **CTA overlay:** *(none — satisfying clips should land without CTA)*
- **Caption:** `that little click though`
- **Suggested first comment:** `this one’s so clean i keep rewatching`
- **Hashtags:** `#satisfying #puzzlegame #braingame #oddlysatisfying`
- **Ending type:** resolved · clean
- **Cover text suggestion:** `SO CLEAN`
- **Music/SFX version:** tactile SFX; each correct solve gets a distinct `correct` tone
- **What this clip is testing:** whether pure-ASMR framing (no CTA) earns rewatches and `#oddlysatisfying` discovery
- **Why it may work:** short, loopable, friction-free. The four-correct rhythm is inherently rewatchable
- **Recommended posting slot:** Day 5 · 12:30 PM local (midday scroll session)
- **Reserve or main:** main

### 07 · tiktok_07_clean_solve.mp4 — **main**

- **Working title:** Clean Solve (Short Satisfying)
- **Bucket:** 3 · Satisfying solves
- **Duration:** 9.24 s
- **Hook type:** short satisfying flex
- **Source scenario:** challenge_rewatch (easy, 1 mistake, snappy cadence)
- **On-screen text:** `Clean solve.`
- **CTA overlay:** *(none)*
- **Caption:** `clean`
- **Suggested first comment:** `no notes. no mistakes.`
- **Hashtags:** `#satisfying #cleanrun #puzzlegame`
- **Ending type:** resolved · punctuated
- **Cover text suggestion:** `CLEAN`
- **Music/SFX version:** tactile SFX; snappy cadence keeps tempo tight
- **What this clip is testing:** the shortest possible viable post — does a 9 s no-text-wall clip retain viewers?
- **Why it may work:** minimum viable rewatch unit; the one `wrong` near the start adds texture without breaking the clean arc
- **Recommended posting slot:** Day 6 · 11:30 AM local
- **Reserve or main:** main

### 08 · tiktok_08_almost_ruined.mp4 — **main** · strongest-hook candidate

- **Working title:** I Almost Ruined It Here (Near-fail)
- **Bucket:** 4 · Near-fail / replay bait
- **Duration:** 16.22 s (target 17 s)
- **Hook type:** near-fail / clutch recovery
- **Source scenario:** almost_fail_then_win (medium, 2 mistakes)
- **On-screen text:** `I almost ruined it here.`
- **CTA overlay:** `This gets worse later.`
- **Caption:** `came back from this`
- **Suggested first comment:** `wasn’t sure i was getting out of that`
- **Hashtags:** `#puzzlegame #clutch #almostlost #braingame`
- **Ending type:** resolved after tension
- **Cover text suggestion:** `ALMOST RUINED IT`
- **Music/SFX version:** tactile SFX; 2 `wrong` moments land as tension beats
- **What this clip is testing:** whether POV confession-style hook + visible recovery generates rewatches and comment empathy
- **Why it may work:** near-fail arcs convert better than flawless runs; viewers want to see the save, not the flex
- **Recommended posting slot:** Day 7 · 9:30 PM local
- **Reserve or main:** main

### 09 · tiktok_09_watch_last.mp4 — **main**

- **Working title:** Watch the Last Move (Hard Mode Flex)
- **Bucket:** 4 · Near-fail / replay bait
- **Duration:** 10.12 s
- **Hook type:** final-move focus
- **Source scenario:** hard_mode_flex (hard, 0 mistakes, confident cadence)
- **On-screen text:** `Watch the last move.`
- **CTA overlay:** *(none)*
- **Caption:** `watch the last move`
- **Suggested first comment:** `🫣 comment if you’d have picked the wrong one`
- **Hashtags:** `#puzzlegame #lastmove #braingame #logicpuzzle`
- **Ending type:** resolved on final beat (freeze-worthy)
- **Cover text suggestion:** `LAST MOVE`
- **Music/SFX version:** tactile SFX; final `correct` is the payoff
- **What this clip is testing:** whether hard-mode showcase + “watch to the end” pattern retains viewers through the full 10 s
- **Why it may work:** hard-mode content filters for the enthusiast subset most likely to try the game
- **Recommended posting slot:** Day 8 · 10:00 PM local
- **Reserve or main:** main

### 10 · tiktok_10_didnt_expect.mp4 — **main** · strongest-hook candidate (curiosity)

- **Working title:** Browser Puzzle I Didn’t Expect to Like
- **Bucket:** 5 · Curiosity click
- **Duration:** 13.55 s
- **Hook type:** hidden-gem / creator recommendation tone
- **Source scenario:** escalating_difficulty (medium, 1 mistake)
- **On-screen text:** `Browser puzzle I didn’t expect to like.`
- **CTA overlay:** `Want harder ones?`
- **Caption:** `browser games aren’t supposed to be this good`
- **Suggested first comment:** `it’s free in the browser if you want to try it (link in bio)`
- **Hashtags:** `#browsergame #indiegame #puzzlegame #hiddengem #logicpuzzle`
- **Ending type:** resolved · recommend tone
- **Cover text suggestion:** `HIDDEN GEM`
- **Music/SFX version:** tactile SFX; medium cadence carries the “casual discovery” vibe
- **What this clip is testing:** whether creator-recommendation framing (as opposed to challenge framing) drives different profile-click rates
- **Why it may work:** positions Foldwink as a discovery, not an ad. The caption and first comment hand the viewer permission to try
- **Recommended posting slot:** Day 1 · 9:30 PM local (co-launch with clip 02)
- **Reserve or main:** main

### r1 · tiktok_r1_one_move.mp4 — **reserve**

- **Working title:** One Move Left (Short Tension)
- **Bucket:** Reserve (challenge)
- **Duration:** 9.04 s
- **Hook type:** final-move tension
- **Source scenario:** challenge_rewatch (easy, 1 mistake, snappy cadence)
- **On-screen text:** `One move left.`
- **CTA overlay:** *(none)*
- **Caption:** `one move. that’s it.`
- **Suggested first comment:** `did you see the move?`
- **Hashtags:** `#puzzlegame #onemovewin #braingame`
- **Ending type:** resolved on the final beat
- **Cover text suggestion:** `ONE MOVE LEFT`
- **Music/SFX version:** tactile SFX
- **What this clip is testing:** holds in reserve to replace any main clip under-performing on the first 24 h
- **Why it may work:** minimal text, highest pause-fraction of the set
- **Recommended posting slot:** *(on demand — replacement only)*
- **Reserve or main:** reserve

### r2 · tiktok_r2_looks_easy_alt.mp4 — **reserve**

- **Working title:** Looks Easy (Alt Pacing)
- **Bucket:** Reserve (challenge — alt source)
- **Duration:** 12.95 s
- **Hook type:** expectation-subversion · alt cadence
- **Source scenario:** escalating_difficulty (medium, 1 mistake) — alt start offset
- **On-screen text:** `Looks easy. It isn’t.`
- **CTA overlay:** `Could you get this?`
- **Caption:** `it looks easier than it is`
- **Suggested first comment:** `bet you miss the first row`
- **Hashtags:** `#puzzlegame #logicpuzzle #harderthanitlooks`
- **Ending type:** resolved-with-tension
- **Cover text suggestion:** `LOOKS EASY`
- **Music/SFX version:** tactile SFX
- **What this clip is testing:** same hook as clip 03 on a different puzzle — A/B sanity check
- **Why it may work:** alt source lets us isolate whether clip 03’s performance was hook-driven or puzzle-driven
- **Recommended posting slot:** *(on demand)*
- **Reserve or main:** reserve

### r3 · tiktok_r3_can_you_alt.mp4 — **reserve**

- **Working title:** Can You Solve This? (Alt / Longer)
- **Bucket:** Reserve (challenge — alt source)
- **Duration:** 14.72 s
- **Hook type:** direct challenge · alt puzzle
- **Source scenario:** almost_fail_then_win (medium, 2 mistakes) — alt start
- **On-screen text:** `Can you solve this?`
- **CTA overlay:** `Part 2?`
- **Caption:** `could you?`
- **Suggested first comment:** `would love to see someone speedrun this one`
- **Hashtags:** `#puzzlegame #canyousolveit #braingame`
- **Ending type:** resolved after visible mistakes
- **Cover text suggestion:** `CAN YOU?`
- **Music/SFX version:** tactile SFX
- **What this clip is testing:** same hook as clip 02 on a harder puzzle — isolates hook vs. difficulty
- **Why it may work:** if clip 02 pops but r3 does not, we know the difficulty is gating conversion, not the hook
- **Recommended posting slot:** *(on demand)*
- **Reserve or main:** reserve

---

## A/B hook notes — what Batch 01 is testing

The 10 main clips run 5 live A/B questions. Each answers a specific unknown about TikTok-native puzzle-game content:

| # | Test question | Controlling clips | Signal to watch |
| --- | --- | --- | --- |
| A1 | Does a pause-bait imperative (`Pause and solve.`) out-pull a direct ego-challenge (`Can you solve this?`)? | 01 vs 02 | 3-second hold rate + completion rate |
| A2 | Does visible failure (2 mistakes shown) build trust vs flawless demo? | 03 (2 mistakes) vs 06 (0 mistakes) | save rate + follow rate |
| A3 | Does the “gets worse later / part 2?” promise beat a one-shot challenge CTA? | 05 vs 04 | comment rate + save rate |
| A4 | Does hard-mode content filter well (lower views, higher install intent)? | 09 vs any easy-mode clip | profile clicks + bio clicks |
| A5 | Does curiosity/hidden-gem framing out-convert direct challenge framing for profile-click? | 10 vs 02 | profile visit rate, comment replies about trying it |

Reserves **r2** and **r3** are matched alt-puzzle versions of the strongest-performing challenge hooks (03 and 02), so if either pops we can isolate hook-vs-puzzle effects in a follow-up.

---

## Files in this batch

```
tiktok/batch_01/
├── exports/                        # 13× 1080×1920 MP4 (H.264 + AAC, faststart)
├── covers/                         # 13× JPG cover frames (one per clip)
├── previews/contact_sheet.jpg      # 5×3 grid preview
├── workfiles/                      # silent intermediates + audio beds + SFX (not for publishing)
└── manifests/
    ├── tiktok_batch_01_manifest.md       (this file)
    ├── tiktok_batch_01_manifest.csv
    ├── tiktok_batch_01_schedule.md
    ├── tiktok_batch_01_captions.md
    ├── tiktok_batch_01_first_comments.md
    ├── tiktok_batch_01_qa_report.md
    └── tiktok_video_manifest.json        (machine-readable per-clip record)
```

Ready to upload.
