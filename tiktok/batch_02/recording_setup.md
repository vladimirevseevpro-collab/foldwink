# Foldwink — TikTok Batch 02 Recording Setup

**Goal:** capture native-portrait gameplay at 1080×1920 (or any 9:16-ish aspect — the compositor normalises). Real touch beats simulated cursor every time.

Two supported paths. Pick whichever you have at hand.

---

## Path A — iPhone Screen Recording (recommended)

Foldwink runs as a PWA from the `iOS Add-to-Home` tip (v0.6.3+). Touch interaction reads as authentic on TikTok and the recording is portrait by default.

### One-time setup

1. **Enable Screen Recording in Control Center**
   - Settings → Control Center → Customize Controls
   - Tap the green `+` next to **Screen Recording**
2. **Install Foldwink as a PWA**
   - Open Safari → navigate to the deployed Foldwink URL (or local dev URL via tunnel)
   - Tap **Share** → **Add to Home Screen** → Add
   - Open the resulting Foldwink icon — it launches full-screen, no Safari chrome
3. **Disable distractions**
   - Focus mode → Do Not Disturb on
   - Lock orientation to portrait (Control Center → padlock-arrow)
4. **Audio capture**
   - The iOS recorder always captures app audio — Foldwink's native SFX (`select` / `submit` / `correct` / `wrong` / `win`) will be on the track
   - Microphone OFF (long-press the Screen Recording button in Control Center → microphone toggle off)

### Per-recording

1. Open the Foldwink PWA from the home screen
2. Pull down Control Center → tap **Screen Recording** (3-second countdown)
3. Play the scenario (see `operator_runbook.md` §3 for per-scenario scripts)
4. When done: pull down Control Center again → tap the red recording icon → Stop
5. The recording lands in **Photos → Recents** as a `.mov`
6. AirDrop / iCloud / cable it to the Windows machine
7. Rename to match `raw` field in `manifests/batch_02_variants.json` (e.g., `scenario_a_easy_clean.mp4`) — `.mov` works too, but rename to `.mp4` so the compositor picks it up via the `.mp4` glob

### Output spec (typical iPhone)

- Resolution: 1170×2532 (iPhone 13/14/15) or 1290×2796 (Pro Max)
- Frame rate: 60 fps (default)
- Codec: HEVC (.mov) — ffmpeg handles it natively, the compositor will normalise to 1080×1920
- Aspect: 19.5:9 (taller than 9:16) → compositor crops the excess height during normalisation; the 16% top + 22% bottom safe-zone budget already accounts for this

---

## Path B — OBS desktop (fallback)

Use this if no phone is at hand. Foldwink in Chrome resized to a portrait window.

### Window setup

1. Chrome → open Foldwink (`http://localhost:5173` for dev, or deployed URL)
2. F12 → Device toolbar (Ctrl+Shift+M) → choose **iPhone 14 Pro** preset (393×852 logical, 1179×2556 physical at 3× DPR)
3. Set zoom to 100% — Foldwink scales to the viewport, you don't need DPR > 1
4. Resize the surrounding Chrome window so DevTools and address bar are out of frame (or use Chrome `--app=URL` mode to drop chrome entirely)

### OBS settings

| Setting | Value |
| --- | --- |
| Canvas (Base) Resolution | 1080×1920 |
| Output (Scaled) Resolution | 1080×1920 |
| Common FPS | 60 |
| Output Format | mp4 |
| Encoder | x264 (or NVENC H.264 if you have an NVIDIA GPU) |
| Rate Control | CBR |
| Bitrate | 8000 Kbps |
| Keyframe Interval | 2 |
| Profile | high |
| Tune | (none — `zerolatency` adds artefacts) |
| Audio bitrate | 160 Kbps |
| Audio sample rate | 44.1 kHz |
| Audio channels | Stereo |

### Source

- Single **Window Capture** of the Foldwink Chrome window
- Crop the source so only the game viewport is visible (no Chrome chrome, no DevTools panel)
- Position-fit the source so it fills the 1080×1920 canvas with no letterbox

### Audio

- Desktop Audio: ON (captures Foldwink's WebAudio SFX)
- Mic/Aux: OFF
- Verify in `Audio Mixer` that desktop audio shows movement when you play

### Per-recording

1. Hit **Start Recording**
2. Play the scenario
3. Hit **Stop Recording**
4. Output lands in your OBS-configured recordings folder as `.mp4`
5. Move/rename into `tiktok/batch_02/raw/<scenario>.mp4`

### Known OBS gotchas

- **Window Capture** can flicker on Windows 11 with Chrome's hardware acceleration on. If you see frame drops: Chrome → Settings → System → toggle off "Use graphics acceleration when available" → relaunch Chrome
- If frame timing looks off in the export, set **OBS Settings → Advanced → Process Priority** to `Above Normal`
- OBS will not capture WebAudio if Chrome is muted in the Windows volume mixer — verify `Volume Mixer` shows Chrome unmuted before recording

---

## Verification (both paths)

Before treating a clip as good for batch_02, check:

- [ ] Resolution is portrait (height > width). If landscape, re-record.
- [ ] Duration is at least the `durSec` value in `batch_02_variants.json` for that scenario, plus 0.5s headroom.
- [ ] Native game SFX are audible — open in any player, hear `select` / `correct` / `win` cues.
- [ ] No stray notifications, banners, OBS overlays, or Chrome address bar on screen.
- [ ] First second is gameplay, not a black frame or menu.

If all five pass, drop the file into `tiktok/batch_02/raw/` under the correct `raw` filename and move on.
