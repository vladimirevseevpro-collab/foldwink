# Foldwink — Face-to-Camera Hook Templates (Pack 3)

Eight hook formulas tuned for indie-game TikTok in 2026. Each is a complete shoot template: first-3-seconds storyboard, B-roll plan, target length, caption / first-comment, and the unknown each one tests.

These complement the screen-recording pipeline (`operator_runbook.md` §3) — face-to-camera typically converts harder, but it filters cold viewers faster and converts a higher % of the ones who stay.

---

## How to use this pack

- **Pick one, not all.** Shoot one template a week, post on a non-prime slot (Wed afternoon, Sun morning) so it doesn't cannibalise the batch_01/02 challenge clips on prime slots.
- **Don't perfect-take it.** The first take with one stumble outperforms the fifth take with no stumbles 8 out of 10 times on indie-game TikTok. Authentic > polished.
- **Phone-vertical, no ringlight.** Window light or overhead. No fancy mic — phone built-in is fine, just close to your face (~30 cm).
- **3-second rule:** the hook line must be delivered fully before t=3.0s. If the camera roll alone is silent for 3s viewers swipe.
- **B-roll = the screen recording.** All eight templates assume you cut to the matching gameplay clip from `tiktok/batch_02/exports/` after the hook.

For each template below: shoot the face cam, pick the matching B-roll, hand-edit in CapCut (free, mobile) — or if you want me to wire a programmatic A→B-roll cut into `compose-tiktok-batch02.mjs` later, that's a Pack 4 task.

---

## T1 — The Origin Confession

**Test question:** does an unpolished founder confession out-convert challenge framing for profile clicks?

**First 3 seconds:**
- Tight on your face, slightly off-centre, eyes on lens
- Line: *"I made a daily puzzle game in six months. Here's what it actually looks like."*
- Slight head shake or shrug at "actually" — micro-expression sells it

**B-roll (next 18–25s):**
- Cut to `tiktok02_01_60_seconds.mp4` or any clean batch_01 clip
- Optional VO over: *"Sixteen cards. Find four hidden groups. Four mistakes and you lose. That's it."*
- Hold the win frame for 1.5s

**Length target:** 22–28s

**Caption:** `six months for sixteen cards. yes really.`

**First comment:** `link in bio if you want to break it. it's free.`

**Hashtags:** `#indiegame #gamedev #devlog #puzzlegame #sololeveldev`

**Why it may work:** TikTok's gamedev sub-tag prefers "I built this in my kitchen" over "look how good my game is". Confession framing seeds save-rate; the B-roll closes the deal.

---

## T2 — The Comparison Tease

**Test question:** does name-checking a giant (NYT Connections) inherit traffic from that giant's audience?

**First 3 seconds:**
- Half-frame, walking-and-talking or mid-action (kitchen, desk, anywhere not a green-screen)
- Line: *"NYT Connections got too easy. So I built a meaner one."*
- Microbeat pause at "meaner"

**B-roll:**
- Cut to `tiktok02_04_two_left.mp4` (the near-fail clip — sells "meaner" instantly)
- 12–15s of the recovery arc
- Final beat: tap the "win" frame, smile

**Length target:** 18–22s

**Caption:** `if connections felt easy lately, try this`

**First comment:** `i lose this puzzle 1 in 3 times. drop your win/loss in the replies`

**Hashtags:** `#nytconnections #connectionsgame #puzzlegame #harderversion #braingame`

**Why it may work:** comparison hooks get pulled into the larger tag's For-You feed. Risky — if the comparison is unearned, you get ratioed. Foldwink earning it depends on your difficulty curve actually being meaner; the B-roll has to back it up.

---

## T3 — The Behind-the-scenes Reveal

**Test question:** does dev-process content earn follows that challenge content can't?

**First 3 seconds:**
- Cut between two screen captures: an early-version Foldwink (uglier UI, no Foldwink Tabs) and the current one
- VO line: *"Six months ago Foldwink looked like this. Today it looks like this."*
- The visual cut at "this. Today" is the hook — viewers stay for the contrast

**B-roll:**
- Old screenshot ↔ current screenshot quick cuts (2× per second for 3 seconds)
- Then settle on a `tiktok02_02_watch_the_tabs.mp4` clip showing the Foldwink Tabs reveal
- VO over: *"This thing — the tabs — wasn't in v1. It earned the name."*

**Length target:** 24–30s

**Caption:** `from "what is this" to "okay i'd play this"`

**First comment:** `the tabs are the only twist. wink lets you reveal one for free, once.`

**Hashtags:** `#gamedev #devjourney #beforeandafter #indiegame #puzzlegame`

**Why it may work:** TikTok's algorithm rewards "transformation" content disproportionately. Dev-process posts also seed follower base for batch_03+ retention.

**Production note:** dig out an early-build screenshot from git history (`git log --all --oneline | head` to find a pre-tabs commit, check it out in a worktree, screenshot home + a puzzle, restore). Keep two screenshots for reuse in T6 and T7.

---

## T4 — The Direct Pitch (5-second variant)

**Test question:** can a 5-second face-cam pitch + 8s gameplay outperform a 25s narrative?

**First 3 seconds:**
- Static, looking dead-on at lens, very tight
- Line: *"Five seconds. Here's why my puzzle is different."*
- No movement, no smile — deadpan

**B-roll (next 8–10s):**
- Hard cut to `tiktok02_03_one_free_hint.mp4` (the Wink reveal — most differentiated mechanic)
- VO over the cut, fast: *"You get one free hint per puzzle. Tap any tab, see its category. The puzzle stays — but the floor moves."*
- Final beat: solve frame

**Length target:** 12–14s — short, dense, rewatchable

**Caption:** `one free hint. that's the whole thing.`

**First comment:** `i call it Wink. you get one. use it well.`

**Hashtags:** `#puzzlegame #gamemechanic #indiegame #braingame`

**Why it may work:** the shortest-viable post in the pack. If it pops, every future Foldwink post can shrink toward this length. If it flops, longer narrative is the answer.

---

## T5 — The Failure Story

**Test question:** does visible struggle (rejected drafts) build more trust than success showcasing?

**First 3 seconds:**
- Hold up a notebook / monitor showing a long crossed-out list (real or staged)
- Line: *"I threw out two hundred puzzles before these five made it in."*
- Tap the list at "two hundred"

**B-roll:**
- Cut to a contact-sheet view of the puzzle pool (you can screenshot `puzzles/pool/` browser view, or quick-cuts of 4–5 puzzles solving at 2× speed)
- VO: *"Most were unfair. Two had answers I couldn't defend. One had a typo nobody caught for three weeks. These five are the ones I'd put my name on."*

**Length target:** 28–35s — failure stories breathe slower

**Caption:** `200 cuts. 5 keepers. that's roughly the ratio.`

**First comment:** `if you find an unfair one, comment the puzzle id. i'll pull it.`

**Hashtags:** `#gamedev #indiegame #qualitycontrol #puzzlegame #devlog`

**Why it may work:** trust-builder. People who see the cuts believe the keepers are real. Less viral, higher follow-through to bio.

---

## T6 — The Day-in-Life Snippet

**Test question:** does a slice-of-life post (no hook, ambient) earn passive followers?

**First 3 seconds:**
- Camera-on-table, you're in mid-frame, working on the laptop, no acknowledgement of the lens
- Voiceover (recorded after, layered): *"8:14 AM. Writing four new puzzles for tomorrow's daily."*
- The voiceover is the hook — face cam is texture

**B-roll:**
- Stay on the laptop angle for ~5s (typing visible, code on screen)
- Cut to the resulting puzzles being playtested (any batch_02 clip works)
- Closing voiceover line: *"By 9 the puzzles are live. By 10 someone in Brazil has solved all four. That's the loop."*

**Length target:** 30–40s

**Caption:** `morning shift on the daily puzzle queue`

**First comment:** `the cards in the clip are tomorrow's daily. don't spoil it`

**Hashtags:** `#gamedev #dayinlife #indiegame #devlog #puzzlegame`

**Why it may work:** these posts under-perform on views but over-perform on save-rate and follower-conversion. TikTok 2026 weights save-rate aggressively. Use as a follower-builder, not a view-driver.

---

## T7 — The Counter-Take

**Test question:** does a stance-piece (a take other devs disagree with) drive comment-rate above all other formats?

**First 3 seconds:**
- Sitting still, slightly leaned-in
- Line: *"A daily puzzle should be playable in 60 seconds. Anything longer is a different game."*
- Slight nod at the period

**B-roll:**
- Quick montage of long puzzle games (you can use placeholder text cards if you don't want to call out specific games)
- VO: *"Wordle: 60 seconds. Connections: 90. Foldwink: aiming for 60 on easy, 2 minutes on hard. If your daily takes ten minutes, it's a Sunday paper, not a daily."*
- Cut to clean fast solve from `tiktok02_01_60_seconds.mp4`

**Length target:** 22–28s

**Caption:** `60 second daily. anything longer is a sunday paper.`

**First comment:** `disagree? tell me which daily takes you longer than 90 seconds.`

**Hashtags:** `#puzzlegame #gamedesign #dailygame #indiegame #braingame`

**Why it may work:** counter-takes drive comment volume harder than any other format. Be ready to engage in the replies — this is a 1-hour-of-replies post, not a fire-and-forget.

**Risk:** comment-rate is great, but watch-time can dip if the take is mid. Don't post counter-takes back-to-back.

---

## T8 — The Save-Bait Tip

**Test question:** can a how-to-play tip stay-saved enough to drive next-day return-views?

**First 3 seconds:**
- Phone in hand, mid-action — already playing Foldwink
- Line: *"If you're stuck on a Foldwink puzzle, do this."*
- Slight gesture at "this"

**B-roll:**
- Real screen-share of you using the Wink mechanic to break a stuck puzzle
- VO: *"Tap any tab — the one that confuses you most. You get one free reveal per puzzle. It doesn't solve the group, just tells you what you're looking for. Then build out from there."*
- Final beat: the resulting solve

**Length target:** 18–24s

**Caption:** `if you get stuck, the wink saves you once`

**First comment:** `i wink the science group every time. medium is mean about chemistry.`

**Hashtags:** `#puzzletip #howtoplay #puzzlegame #braingame #foldwink`

**Why it may work:** tip-format posts save at 2–3× the rate of entertainment posts. High-save posts get re-fed to the same viewer the next day, which is exactly the daily-puzzle return-loop you want.

---

## Picking your first 2 templates

If you've never shot face-to-camera content, start here:

1. **T1 (Origin Confession)** — lowest risk, highest follower-conversion, and the hardest part is just saying the line.
2. **T8 (Save-Bait Tip)** — designed to be saved. Lower views but the save signal is what TikTok uses to feed the next batch_02 post into the same viewers' feeds.

Then if T1 lands, run T3 (behind-the-scenes — same tone, deepens the brand). If T1 flops on you-on-camera reasons (audio, framing, comfort), drop it and run T4 (Direct Pitch, 12 seconds — minimal face-cam exposure).

Skip T2 (comparison) until you have at least 2k followers — it draws scrutiny.

Skip T7 (counter-take) until you have time to sit on the comment thread for an hour after posting.

---

## What this pack does NOT include

- A programmatic A-roll → B-roll cutter — face cam editing stays in CapCut for now. If face cam content earns its slot in batch_03, we wire it into the compositor (a small `--face-roll <path>` flag on `compose-tiktok-batch02.mjs` would do it).
- A teleprompter / VO-script generator — the lines above are short by design; if you need a teleprompter you're over-scripting.
- Anything localised — these are English-only templates. Russian / German variants are a deliberate Batch 03+ deferral until the EN audience is sized.
