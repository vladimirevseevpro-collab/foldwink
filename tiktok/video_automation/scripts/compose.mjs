/**
 * Foldwink video pipeline — compositor.
 *
 * Takes raw scenario webm recordings and produces vertical 1080x1920 MP4s
 * with blurred background, centered gameplay, and a short hook overlay.
 *
 * Output lives in reports/video_automation/final/. A manifest pairs each
 * MP4 with its raw source, template, overlays, and duration.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  readdirSync,
  unlinkSync,
  renameSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { resolveFfmpeg, run, winFont } from "./lib/ffmpeg.mjs";
import { generateSfx, buildEventSchedule } from "./lib/audio.mjs";

const ROOT = resolve(process.cwd());
const RAW_DIR = resolve(ROOT, "reports/video_automation/raw");
const WORK_DIR = resolve(ROOT, "reports/video_automation/work");
const FINAL_DIR = resolve(ROOT, "reports/video_automation/final");
const CONFIG_DIR = resolve(ROOT, "reports/video_automation/configs");

if (!existsSync(FINAL_DIR)) mkdirSync(FINAL_DIR, { recursive: true });
if (!existsSync(WORK_DIR)) mkdirSync(WORK_DIR, { recursive: true });

const overlays = JSON.parse(readFileSync(join(CONFIG_DIR, "overlay_presets.json"), "utf-8"));

const FFMPEG = resolveFfmpeg();
const FONT = winFont();

const W = 1080;
const H = 1920;

// drawtext-safe escaper: colons, single quotes, commas, backslashes. Preserves
// real newlines so wrapLines() can split long hooks into two stacked lines.
function esc(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/,/g, "\\,");
}

// Wrap a single-line hook into 1 or 2 visual lines at the nearest space so
// drawtext fits inside the 1080-wide safe zone.
function wrapLines(text, maxCharsPerLine = 22) {
  const raw = String(text).trim();
  if (raw.length <= maxCharsPerLine) return raw;
  const mid = Math.floor(raw.length / 2);
  let splitAt = -1;
  for (let d = 0; d < raw.length; d++) {
    const L = mid - d,
      R = mid + d;
    if (L > 0 && raw[L] === " ") {
      splitAt = L;
      break;
    }
    if (R < raw.length && raw[R] === " ") {
      splitAt = R;
      break;
    }
  }
  if (splitAt < 0) return raw;
  const a = raw.slice(0, splitAt).trim();
  const b = raw.slice(splitAt + 1).trim();
  return `${a}\n${b}`;
}

// Safe-zone margins in pixels.
const SAFE_TOP = Math.round(H * (overlays.safeZone.topPct / 100));
const SAFE_BOTTOM = Math.round(H * (overlays.safeZone.bottomPct / 100));
const SIDE = Math.round(W * (overlays.safeZone.sidePct / 100));

function hookDrawtext(hook, lang) {
  const raw = hook[`text_${lang}`] ?? hook.text_en;
  const txt = esc(wrapLines(raw, 22));
  const y = hook.position === "bottom" ? `h-${SAFE_BOTTOM}-text_h` : `${SAFE_TOP}`;
  return [
    `drawtext=fontfile='${FONT}'`,
    `text='${txt}'`,
    `fontcolor=white`,
    `fontsize=46`,
    `line_spacing=8`,
    `box=1`,
    `boxcolor=${overlays.fontStack.fallbackBoxColor}`,
    `boxborderw=22`,
    `x=(w-text_w)/2`,
    `y=${y}`,
    `enable='between(t,0.15,3.4)'`,
  ].join(":");
}

function ctaDrawtext(text) {
  const txt = esc(wrapLines(text, 26));
  return [
    `drawtext=fontfile='${FONT}'`,
    `text='${txt}'`,
    `fontcolor=white`,
    `fontsize=40`,
    `line_spacing=6`,
    `box=1`,
    `boxcolor=black@0.55`,
    `boxborderw=14`,
    `x=(w-text_w)/2`,
    `y=h-${SAFE_BOTTOM}-text_h`,
    `enable='gte(t,${"{{cta_start}}"})'`,
  ].join(":");
}

// Build an ffmpeg filter graph that:
//   - crops the source webm to the gameplay square (top ~55% of viewport),
//   - scales that to 1080x1080 centered as foreground,
//   - derives a blurred 1080x1920 background from the same crop,
//   - overlays fg on bg so the blurred padding is visible above and below.
//   - applies drawtext hook for the first ~3.2s and a CTA near the end.
function buildFilterGraph({ hookFilter, ctaFilter, totalSec, srcW, srcH }) {
  const ctaStart = Math.max(0.5, (totalSec ?? 12) - 3.2);
  const cta = ctaFilter.replace("{{cta_start}}", ctaStart.toFixed(2));
  // Crop the gameplay region: top of source is the playfield; the bottom
  // ~35% is unused chrome so we drop it. Keep full width.
  const cropH = Math.round(srcH * 0.62);
  const fgSide = W; // 1080 square foreground
  return [
    `[0:v]crop=${srcW}:${cropH}:0:0,split=2[src1][src2]`,
    `[src1]scale=${fgSide}:${fgSide}:flags=lanczos,setsar=1[fg]`,
    `[src2]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=28[bg]`,
    `[bg][fg]overlay=x=(W-w)/2:y=(H-h)/2:format=auto,format=yuv420p,${hookFilter},${cta}[outv]`,
  ].join(";");
}

async function probeDuration(inputPath) {
  const { spawn } = await import("node:child_process");
  return await new Promise((res) => {
    const p = spawn(FFMPEG, ["-i", inputPath], { stdio: ["ignore", "ignore", "pipe"] });
    let buf = "";
    p.stderr.on("data", (d) => (buf += d.toString()));
    p.on("exit", () => {
      const m = buf.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      if (!m) return res(null);
      const secs = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      res(secs);
    });
  });
}

async function probeSize(inputPath) {
  const { spawn } = await import("node:child_process");
  return await new Promise((res) => {
    const p = spawn(FFMPEG, ["-i", inputPath], { stdio: ["ignore", "ignore", "pipe"] });
    let buf = "";
    p.stderr.on("data", (d) => (buf += d.toString()));
    p.on("exit", () => {
      const m = buf.match(/Stream.*Video.*?, (\d+)x(\d+)/);
      if (!m) return res(null);
      res({ w: Number(m[1]), h: Number(m[2]) });
    });
  });
}

async function renderVideoOnly({
  rawPath,
  outPath,
  hook,
  cta,
  lang,
  startSec = 0,
  durSec = 12,
  template = "blurred_bg",
  srcW,
  srcH,
}) {
  const fg = hookDrawtext(hook, lang);
  const ctaF = ctaDrawtext(cta[`text_${lang}`] ?? cta.text_en);
  const filter = buildFilterGraph({
    hookFilter: fg,
    ctaFilter: ctaF,
    totalSec: durSec,
    srcW,
    srcH,
  });
  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-ss",
    String(startSec),
    "-t",
    String(durSec),
    "-i",
    rawPath,
    "-filter_complex",
    filter,
    "-map",
    "[outv]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    outPath,
  ];
  await run(FFMPEG, args, { silent: false });
}

// Build the per-video audio bed from timed SFX events (no pad hum). Output
// is a WAV with the exact duration of the video.
async function renderAudioBed({ events, sfx, outPath, durSec }) {
  if (!events.length) {
    // Silent bed fallback.
    await run(FFMPEG, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=44100:cl=stereo:d=${durSec.toFixed(3)}`,
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "pcm_s16le",
      outPath,
    ]);
    return;
  }
  const sfxInputs = [];
  const graph = [];
  const labels = [];
  let idx = 0;
  for (const e of events) {
    const sfxPath = sfx[e.type];
    if (!sfxPath) continue;
    if (e.t < 0 || e.t >= durSec) continue;
    sfxInputs.push(["-i", sfxPath]);
    const delayMs = Math.max(0, Math.round(e.t * 1000));
    // Per-event gain: select softer, correct/win prominent.
    const gain =
      e.type === "select"
        ? 0.45
        : e.type === "submit"
          ? 0.7
          : e.type === "correct"
            ? 0.9
            : e.type === "wrong"
              ? 0.95
              : e.type === "win"
                ? 1.0
                : 0.7;
    graph.push(`[${idx}:a]adelay=${delayMs}|${delayMs},volume=${gain}[e${idx}]`);
    labels.push(`[e${idx}]`);
    idx++;
  }
  if (!labels.length) {
    await run(FFMPEG, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=44100:cl=stereo:d=${durSec.toFixed(3)}`,
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "pcm_s16le",
      outPath,
    ]);
    return;
  }
  graph.push(
    `${labels.join("")}amix=inputs=${labels.length}:normalize=0,atrim=duration=${durSec.toFixed(3)},asetpts=N/SR/TB,volume=3.6,alimiter=limit=0.93,loudnorm=I=-18:LRA=11:tp=-1.5[mix]`,
  );
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    ...sfxInputs.flat(),
    "-filter_complex",
    graph.join(";"),
    "-map",
    "[mix]",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-c:a",
    "pcm_s16le",
    outPath,
  ];
  await run(FFMPEG, args);
}

async function muxVideoAudio({ videoPath, audioPath, outPath }) {
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    "-shortest",
    outPath,
  ];
  await run(FFMPEG, args);
}

function variants() {
  const H = overlays.hooks;
  const cta = H.cta_footer[0];
  return [
    {
      name: "satisfying_v1.mp4",
      raw: "clean_fast_solve.webm",
      hook: H.satisfying[0],
      cta,
      start: 0.6,
      dur: 12,
      template: "blurred_bg",
      cadence: "fast",
      plannedMistakes: 0,
    },
    {
      name: "satisfying_v2.mp4",
      raw: "clean_fast_solve.webm",
      hook: H.satisfying[2],
      cta: H.cta_footer[1],
      start: 1.2,
      dur: 11,
      template: "blurred_bg",
      cadence: "fast",
      plannedMistakes: 0,
    },
    {
      name: "satisfying_v3.mp4",
      raw: "escalating_difficulty.webm",
      hook: H.satisfying[4],
      cta,
      start: 0.8,
      dur: 14,
      template: "blurred_bg",
      cadence: "medium",
      plannedMistakes: 1,
    },
    {
      name: "challenge_v1.mp4",
      raw: "almost_fail_then_win.webm",
      hook: H.challenge[0],
      cta: H.cta_footer[1],
      start: 0.4,
      dur: 14,
      template: "blurred_bg",
      cadence: "medium",
      plannedMistakes: 2,
    },
    {
      name: "challenge_v2.mp4",
      raw: "almost_fail_then_win.webm",
      hook: H.challenge[2],
      cta,
      start: 1.6,
      dur: 12,
      template: "blurred_bg",
      cadence: "medium",
      plannedMistakes: 2,
    },
    {
      name: "challenge_v3.mp4",
      raw: "challenge_rewatch.webm",
      hook: H.challenge[4],
      cta: H.cta_footer[1],
      start: 0.4,
      dur: 11,
      template: "blurred_bg",
      cadence: "snappy",
      plannedMistakes: 1,
    },
  ];
}

function fallbackRawFor(target, rawDir) {
  const preferred = join(rawDir, target);
  if (existsSync(preferred)) return preferred;
  const available = readdirSync(rawDir).filter((f) => f.endsWith(".webm"));
  if (!available.length) return null;
  return join(rawDir, available[0]);
}

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const lang = (process.argv.find((a) => a.startsWith("--lang=")) || "--lang=en").split("=")[1];
  const noAudio = process.argv.includes("--no-audio");

  const SFX_DIR = join(WORK_DIR, "sfx");
  console.log(`[compose] lang=${lang} audio=${noAudio ? "off" : "on"}`);

  // Generate SFX + pad once.
  let sfx = null;
  if (!noAudio) {
    console.log(`[compose] generating SFX → ${SFX_DIR}`);
    sfx = await generateSfx(FFMPEG, SFX_DIR, { padSeconds: 24 });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    ffmpeg: FFMPEG,
    lang,
    audio: !noAudio,
    videos: [],
  };

  for (const v of variants()) {
    if (only && !v.name.includes(only)) continue;
    const raw = fallbackRawFor(v.raw, RAW_DIR);
    if (!raw) {
      console.warn(`[skip] no raw available for ${v.name} (wanted ${v.raw})`);
      continue;
    }
    const finalPath = join(FINAL_DIR, v.name);
    const silentPath = join(WORK_DIR, `silent_${v.name}`);
    const audioPath = join(WORK_DIR, `bed_${v.name.replace(/\.mp4$/, ".wav")}`);

    const rawDur = await probeDuration(raw);
    const rawSize = await probeSize(raw);
    const start = Math.min(v.start, Math.max(0, (rawDur ?? v.dur + v.start) - v.dur - 0.1));
    const dur = Math.min(v.dur, Math.max(4, (rawDur ?? v.dur) - start));
    console.log(
      `[compose] ${v.name} ← ${raw}  start=${start.toFixed(2)}s dur=${dur.toFixed(2)}s size=${rawSize?.w}x${rawSize?.h}`,
    );
    try {
      await renderVideoOnly({
        rawPath: raw,
        outPath: silentPath,
        hook: v.hook,
        cta: v.cta,
        lang,
        startSec: start,
        durSec: dur,
        template: v.template,
        srcW: rawSize?.w ?? 720,
        srcH: rawSize?.h ?? 1280,
      });

      let events = [];
      let eventsSource = "schedule";
      if (!noAudio) {
        const eventsPath = raw.replace(/\.webm$/, ".events.json");
        if (existsSync(eventsPath)) {
          try {
            const parsed = JSON.parse(readFileSync(eventsPath, "utf-8"));
            const raw0 = Array.isArray(parsed?.events) ? parsed.events : [];
            // Compensate for the compose window start: events are timestamped
            // from recordVideo t=0, so subtract startSec to align with the
            // trimmed MP4 clock.
            events = raw0
              .map((e) => ({ ...e, t: Number((e.t - start).toFixed(3)) }))
              .filter((e) => e.t >= 0 && e.t < dur);
            eventsSource = "measured";
          } catch (err) {
            console.warn(`[${v.name}] could not parse events.json:`, err.message);
          }
        }
        if (!events.length) {
          events = buildEventSchedule({
            durSec: dur,
            cadence: v.cadence,
            plannedMistakes: v.plannedMistakes,
          });
          eventsSource = "schedule";
        }
        await renderAudioBed({ events, sfx, outPath: audioPath, durSec: dur });
        await muxVideoAudio({ videoPath: silentPath, audioPath, outPath: finalPath });
      } else {
        renameSync(silentPath, finalPath);
      }

      const outSize = statSync(finalPath).size;
      manifest.videos.push({
        output: `reports/video_automation/final/${v.name}`,
        rawSource: raw.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
        template: v.template,
        hook: v.hook.id,
        cta: v.cta.id,
        lang,
        cadence: v.cadence,
        plannedMistakes: v.plannedMistakes,
        startSec: Number(start.toFixed(2)),
        durationSec: Number(dur.toFixed(2)),
        audio: !noAudio ? { pad: null, eventsSource, events } : null,
        bytes: outSize,
      });
    } catch (err) {
      console.error(`[fail] ${v.name}:`, err.message);
    }
  }

  writeFileSync(join(FINAL_DIR, "video_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[compose] wrote ${manifest.videos.length} videos → ${FINAL_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
