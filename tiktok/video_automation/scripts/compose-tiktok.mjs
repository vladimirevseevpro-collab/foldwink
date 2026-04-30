/**
 * Foldwink TikTok Batch 01 compositor.
 *
 * Builds 13 vertical 1080x1920 MP4s (10 main + 3 reserve) from the 5 raw
 * gameplay webms. Reuses lib/ffmpeg + lib/audio and the same crop/blur
 * template as compose.mjs, but with its own variant table + overlay copy.
 *
 * Output: tiktok/batch_01/exports/
 * Workfiles: tiktok/batch_01/workfiles/
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  readdirSync,
  renameSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { resolveFfmpeg, run, winFont } from "./lib/ffmpeg.mjs";
import { generateSfx, buildEventSchedule } from "./lib/audio.mjs";

const ROOT = resolve(process.cwd());
const RAW_DIR = resolve(ROOT, "reports/video_automation/raw");
const BATCH_DIR = resolve(ROOT, "tiktok/batch_01");
const EXPORT_DIR = resolve(BATCH_DIR, "exports");
const WORK_DIR = resolve(BATCH_DIR, "workfiles");
const MAN_DIR = resolve(BATCH_DIR, "manifests");

for (const d of [EXPORT_DIR, WORK_DIR, MAN_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

const FFMPEG = resolveFfmpeg();
const FONT = winFont();

const W = 1080;
const H = 1920;

// TikTok safe zone: a bit tighter than generic — TikTok UI takes ~15% top (timer,
// back) and ~22% bottom (caption, icons, progress bar).
const SAFE_TOP_PCT = 16;
const SAFE_BOTTOM_PCT = 22;
const SIDE_PCT = 7;
const SAFE_TOP = Math.round(H * (SAFE_TOP_PCT / 100));
const SAFE_BOTTOM = Math.round(H * (SAFE_BOTTOM_PCT / 100));
const SIDE = Math.round(W * (SIDE_PCT / 100));

function esc(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/,/g, "\\,");
}

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

function hookDrawtext({ text, position, hold }) {
  const txt = esc(wrapLines(text, 20));
  const y = position === "bottom" ? `h-${SAFE_BOTTOM}-text_h` : `${SAFE_TOP}`;
  return [
    `drawtext=fontfile='${FONT}'`,
    `text='${txt}'`,
    `fontcolor=white`,
    `fontsize=52`,
    `line_spacing=10`,
    `box=1`,
    `boxcolor=black@0.6`,
    `boxborderw=26`,
    `x=(w-text_w)/2`,
    `y=${y}`,
    `enable='between(t,0.1,${hold.toFixed(2)})'`,
  ].join(":");
}

function ctaDrawtext({ text }) {
  const txt = esc(wrapLines(text, 24));
  return [
    `drawtext=fontfile='${FONT}'`,
    `text='${txt}'`,
    `fontcolor=white`,
    `fontsize=42`,
    `line_spacing=6`,
    `box=1`,
    `boxcolor=black@0.55`,
    `boxborderw=16`,
    `x=(w-text_w)/2`,
    `y=h-${SAFE_BOTTOM}-text_h`,
    `enable='gte(t,${"{{cta_start}}"})'`,
  ].join(":");
}

function buildFilterGraph({ hookFilter, ctaFilter, totalSec, srcW, srcH }) {
  const ctaStart = Math.max(1.2, (totalSec ?? 12) - 3.0);
  const cta = ctaFilter ? ctaFilter.replace("{{cta_start}}", ctaStart.toFixed(2)) : null;
  const cropH = Math.round(srcH * 0.62);
  const fgSide = W;
  const chain = [
    `[0:v]crop=${srcW}:${cropH}:0:0,split=2[src1][src2]`,
    `[src1]scale=${fgSide}:${fgSide}:flags=lanczos,setsar=1[fg]`,
    `[src2]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=30[bg]`,
  ];
  const overlayFilters = [hookFilter];
  if (cta) overlayFilters.push(cta);
  chain.push(
    `[bg][fg]overlay=x=(W-w)/2:y=(H-h)/2:format=auto,format=yuv420p,${overlayFilters.join(",")}[outv]`,
  );
  return chain.join(";");
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
      res(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
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
  startSec,
  durSec,
  srcW,
  srcH,
}) {
  // Hook holds ~3.2s for short clips, 3.8s for longer; never past (dur - 3.2) to leave room for CTA.
  const hookHold = Math.min(durSec * 0.55, durSec - 3.2, 4.0);
  const fg = hookDrawtext({
    text: hook.text,
    position: hook.position || "top",
    hold: Math.max(2.4, hookHold),
  });
  const ctaF = cta ? ctaDrawtext({ text: cta.text }) : null;
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
  await run(FFMPEG, args);
}

async function renderAudioBed({ events, sfx, outPath, durSec }) {
  if (!events.length) {
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
    const gain =
      e.type === "select"
        ? 0.45
        : e.type === "submit"
          ? 0.7
          : e.type === "correct"
            ? 0.9
            : e.type === "wrong"
              ? 0.95
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
    `${labels.join("")}amix=inputs=${labels.length}:normalize=0,atrim=duration=${durSec.toFixed(3)},asetpts=N/SR/TB,volume=3.4,alimiter=limit=0.93,loudnorm=I=-18:LRA=11:tp=-1.5[mix]`,
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

// ──────────────────────────────────────────────────────────────────────────
// Hook / CTA copy
// ──────────────────────────────────────────────────────────────────────────
const HOOKS = {
  pause_solve: { text: "Pause and solve.", position: "top" },
  can_you: { text: "Can you solve this?", position: "top" },
  looks_easy: { text: "Looks easy. It isn’t.", position: "top" },
  escalated_fast: { text: "This escalated fast.", position: "top" },
  worse_later: { text: "It gets worse later.", position: "top" },
  tiny_big: { text: "Tiny puzzle, huge satisfaction.", position: "top" },
  clean_solve: { text: "Clean solve.", position: "top" },
  almost_ruined: { text: "I almost ruined it here.", position: "top" },
  watch_last: { text: "Watch the last move.", position: "top" },
  didnt_expect: { text: "Browser puzzle I didn’t expect to like.", position: "top" },
  one_move_left: { text: "One move left.", position: "top" },
};

const CTAS = {
  could_you_get: { text: "Could you get this?" },
  would_you_faster: { text: "Would you solve it faster?" },
  post_level_3: { text: "Should I post level 3?" },
  want_harder: { text: "Want harder ones?" },
  part_2: { text: "Part 2?" },
  worse_later_cta: { text: "This gets worse later." },
};

// ──────────────────────────────────────────────────────────────────────────
// Variant table — 10 main + 3 reserve
// ──────────────────────────────────────────────────────────────────────────
function variants() {
  return [
    // BUCKET 1 — Challenge hooks (3)
    {
      name: "tiktok_01_pause_and_solve.mp4",
      bucket: "challenge",
      raw: "clean_fast_solve.webm",
      hook: HOOKS.pause_solve,
      hookId: "pause_solve",
      cta: CTAS.could_you_get,
      ctaId: "could_you_get",
      start: 0.2,
      dur: 10,
      cadence: "fast",
      plannedMistakes: 0,
      reserve: false,
    },
    {
      name: "tiktok_02_can_you_solve.mp4",
      bucket: "challenge",
      raw: "escalating_difficulty.webm",
      hook: HOOKS.can_you,
      hookId: "can_you",
      cta: CTAS.would_you_faster,
      ctaId: "would_you_faster",
      start: 0.2,
      dur: 15,
      cadence: "medium",
      plannedMistakes: 1,
      reserve: false,
    },
    {
      name: "tiktok_03_looks_easy.mp4",
      bucket: "challenge",
      raw: "almost_fail_then_win.webm",
      hook: HOOKS.looks_easy,
      hookId: "looks_easy",
      cta: CTAS.post_level_3,
      ctaId: "post_level_3",
      start: 0,
      dur: 18,
      cadence: "medium",
      plannedMistakes: 2,
      reserve: false,
    },
    // BUCKET 2 — Escalation (2)
    {
      name: "tiktok_04_escalated_fast.mp4",
      bucket: "escalation",
      raw: "escalating_difficulty.webm",
      hook: HOOKS.escalated_fast,
      hookId: "escalated_fast",
      cta: CTAS.want_harder,
      ctaId: "want_harder",
      start: 0.3,
      dur: 15,
      cadence: "medium",
      plannedMistakes: 1,
      reserve: false,
    },
    {
      name: "tiktok_05_worse_later.mp4",
      bucket: "escalation",
      raw: "almost_fail_then_win.webm",
      hook: HOOKS.worse_later,
      hookId: "worse_later",
      cta: CTAS.part_2,
      ctaId: "part_2",
      start: 0.8,
      dur: 17,
      cadence: "medium",
      plannedMistakes: 2,
      reserve: false,
    },
    // BUCKET 3 — Satisfying solves (2)
    {
      name: "tiktok_06_tiny_big.mp4",
      bucket: "satisfying",
      raw: "clean_fast_solve.webm",
      hook: HOOKS.tiny_big,
      hookId: "tiny_big",
      cta: null,
      ctaId: null,
      start: 0.5,
      dur: 10,
      cadence: "fast",
      plannedMistakes: 0,
      reserve: false,
    },
    {
      name: "tiktok_07_clean_solve.mp4",
      bucket: "satisfying",
      raw: "challenge_rewatch.webm",
      hook: HOOKS.clean_solve,
      hookId: "clean_solve",
      cta: null,
      ctaId: null,
      start: 0.3,
      dur: 10,
      cadence: "snappy",
      plannedMistakes: 1,
      reserve: false,
    },
    // BUCKET 4 — Near-fail / replay bait (2)
    {
      name: "tiktok_08_almost_ruined.mp4",
      bucket: "near_fail",
      raw: "almost_fail_then_win.webm",
      hook: HOOKS.almost_ruined,
      hookId: "almost_ruined",
      cta: CTAS.worse_later_cta,
      ctaId: "worse_later_cta",
      start: 0,
      dur: 17,
      cadence: "medium",
      plannedMistakes: 2,
      reserve: false,
    },
    {
      name: "tiktok_09_watch_last.mp4",
      bucket: "near_fail",
      raw: "hard_mode_flex.webm",
      hook: HOOKS.watch_last,
      hookId: "watch_last",
      cta: null,
      ctaId: null,
      start: 0,
      dur: 12,
      cadence: "confident",
      plannedMistakes: 0,
      reserve: false,
    },
    // BUCKET 5 — Curiosity click (1)
    {
      name: "tiktok_10_didnt_expect.mp4",
      bucket: "curiosity",
      raw: "escalating_difficulty.webm",
      hook: HOOKS.didnt_expect,
      hookId: "didnt_expect",
      cta: CTAS.want_harder,
      ctaId: "want_harder",
      start: 0.4,
      dur: 14,
      cadence: "medium",
      plannedMistakes: 1,
      reserve: false,
    },
    // RESERVES (3)
    {
      name: "tiktok_r1_one_move.mp4",
      bucket: "reserve",
      raw: "challenge_rewatch.webm",
      hook: HOOKS.one_move_left,
      hookId: "one_move_left",
      cta: null,
      ctaId: null,
      start: 0.5,
      dur: 10,
      cadence: "snappy",
      plannedMistakes: 1,
      reserve: true,
    },
    {
      name: "tiktok_r2_looks_easy_alt.mp4",
      bucket: "reserve",
      raw: "escalating_difficulty.webm",
      hook: HOOKS.looks_easy,
      hookId: "looks_easy",
      cta: CTAS.could_you_get,
      ctaId: "could_you_get",
      start: 1.0,
      dur: 13,
      cadence: "medium",
      plannedMistakes: 1,
      reserve: true,
    },
    {
      name: "tiktok_r3_can_you_alt.mp4",
      bucket: "reserve",
      raw: "almost_fail_then_win.webm",
      hook: HOOKS.can_you,
      hookId: "can_you",
      cta: CTAS.part_2,
      ctaId: "part_2",
      start: 1.5,
      dur: 15,
      cadence: "medium",
      plannedMistakes: 2,
      reserve: true,
    },
  ];
}

function fallbackRawFor(target, rawDir) {
  const preferred = join(rawDir, target);
  if (existsSync(preferred)) return preferred;
  const available = readdirSync(rawDir).filter((f) => f.endsWith(".webm"));
  return available.length ? join(rawDir, available[0]) : null;
}

async function main() {
  const onlyArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const noAudio = process.argv.includes("--no-audio");

  const SFX_DIR = join(WORK_DIR, "sfx");
  console.log(`[tiktok] audio=${noAudio ? "off" : "on"}`);

  let sfx = null;
  if (!noAudio) {
    console.log(`[tiktok] generating SFX → ${SFX_DIR}`);
    sfx = await generateSfx(FFMPEG, SFX_DIR, { padSeconds: 24 });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    ffmpeg: FFMPEG,
    audio: !noAudio,
    videos: [],
  };

  for (const v of variants()) {
    if (onlyArg && !v.name.includes(onlyArg)) continue;
    const raw = fallbackRawFor(v.raw, RAW_DIR);
    if (!raw) {
      console.warn(`[skip] no raw for ${v.name}`);
      continue;
    }
    const finalPath = join(EXPORT_DIR, v.name);
    const silentPath = join(WORK_DIR, `silent_${v.name}`);
    const audioPath = join(WORK_DIR, `bed_${v.name.replace(/\.mp4$/, ".wav")}`);

    const rawDur = await probeDuration(raw);
    const rawSize = await probeSize(raw);
    const start = Math.min(v.start, Math.max(0, (rawDur ?? v.dur + v.start) - v.dur - 0.1));
    const dur = Math.min(v.dur, Math.max(4, (rawDur ?? v.dur) - start));
    console.log(
      `[tiktok] ${v.name} ← ${v.raw}  start=${start.toFixed(2)}s dur=${dur.toFixed(2)}s`,
    );
    try {
      await renderVideoOnly({
        rawPath: raw,
        outPath: silentPath,
        hook: v.hook,
        cta: v.cta,
        startSec: start,
        durSec: dur,
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
            events = raw0
              .map((e) => ({ ...e, t: Number((e.t - start).toFixed(3)) }))
              .filter((e) => e.t >= 0 && e.t < dur);
            eventsSource = "measured";
          } catch (err) {
            console.warn(`[${v.name}] events.json parse error:`, err.message);
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
        output: `tiktok/batch_01/exports/${v.name}`,
        rawSource: v.raw,
        bucket: v.bucket,
        hookId: v.hookId,
        hookText: v.hook.text,
        ctaId: v.ctaId,
        ctaText: v.cta?.text ?? null,
        reserve: v.reserve,
        cadence: v.cadence,
        plannedMistakes: v.plannedMistakes,
        startSec: Number(start.toFixed(2)),
        durationSec: Number(dur.toFixed(2)),
        audio: !noAudio ? { eventsSource, events } : null,
        bytes: outSize,
      });
    } catch (err) {
      console.error(`[fail] ${v.name}:`, err.message);
    }
  }

  writeFileSync(join(MAN_DIR, "tiktok_video_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[tiktok] wrote ${manifest.videos.length} videos → ${EXPORT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
