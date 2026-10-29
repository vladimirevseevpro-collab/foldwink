/**
 * Foldwink TikTok Batch 02 compositor.
 *
 * Unlike compose-tiktok.mjs (which crops + blurs 720x1280 Playwright webms
 * into 9:16), this script consumes already-portrait recordings — OBS desktop
 * captures or phone screen-recordings — and lays the hook/CTA overlays on top.
 *
 * Inputs:
 *   tiktok/batch_02/raw/<scenario>.mp4         (native portrait, any 9:16-ish aspect)
 *   tiktok/batch_02/manifests/batch_02_variants.json   (variant table)
 *
 * Outputs:
 *   tiktok/batch_02/exports/<name>.mp4
 *   tiktok/batch_02/workfiles/silent_<name>.mp4
 *   tiktok/batch_02/manifests/tiktok_batch_02_video_manifest.json
 *
 * Audio modes (per-variant, override via --audio=<mode>):
 *   passthrough  copy native audio from the source (default — recommended for
 *                live recordings where Foldwink's own SFX play through)
 *   synth        synthesize an SFX bed from cadence + plannedMistakes (use when
 *                the source was recorded silent)
 *   silent       strip audio entirely
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  renameSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { resolveFfmpeg, run, winFont } from "./lib/ffmpeg.mjs";
import { generateSfx, buildEventSchedule } from "./lib/audio.mjs";

const ROOT = resolve(process.cwd());
const BATCH_DIR = resolve(ROOT, "tiktok/batch_02");
const RAW_DIR = resolve(BATCH_DIR, "raw");
const EXPORT_DIR = resolve(BATCH_DIR, "exports");
const WORK_DIR = resolve(BATCH_DIR, "workfiles");
const MAN_DIR = resolve(BATCH_DIR, "manifests");
const VARIANTS_PATH = resolve(MAN_DIR, "batch_02_variants.json");

for (const d of [RAW_DIR, EXPORT_DIR, WORK_DIR, MAN_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

const FFMPEG = resolveFfmpeg();
const FONT = winFont();

const W = 1080;
const H = 1920;

// Same safe-zone budget as batch_01 — TikTok UI eats ~16% top, ~22% bottom.
const SAFE_TOP_PCT = 16;
const SAFE_BOTTOM_PCT = 22;
const SAFE_TOP = Math.round(H * (SAFE_TOP_PCT / 100));
const SAFE_BOTTOM = Math.round(H * (SAFE_BOTTOM_PCT / 100));

function esc(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
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

// Build the per-frame normalisation: scale source to 1080-wide and crop the
// excess height (or vice-versa for too-tall sources). For landscape inputs the
// caller is expected to fail upstream — this script targets portrait raw only.
function buildNormaliseAndOverlay({ srcW, srcH, hookFilter, ctaFilter, totalSec }) {
  const ctaStart = Math.max(1.2, (totalSec ?? 12) - 3.0);
  const cta = ctaFilter ? ctaFilter.replace("{{cta_start}}", ctaStart.toFixed(2)) : null;
  const overlays = [hookFilter];
  if (cta) overlays.push(cta);

  const srcAspect = srcW / srcH;
  const targetAspect = W / H;

  let normalise;
  if (Math.abs(srcAspect - targetAspect) < 0.01) {
    normalise = `scale=${W}:${H}:flags=lanczos,setsar=1`;
  } else if (srcAspect < targetAspect) {
    // Source taller than 9:16 (e.g. iPhone 19.5:9) — fit width, crop height.
    normalise = `scale=${W}:-2:flags=lanczos,setsar=1,crop=${W}:${H}`;
  } else {
    // Source wider than 9:16 (rare for portrait recordings, but tolerate it
    // gracefully by fitting height and cropping the sides).
    normalise = `scale=-2:${H}:flags=lanczos,setsar=1,crop=${W}:${H}`;
  }

  return `[0:v]${normalise},format=yuv420p,${overlays.join(",")}[outv]`;
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

async function probeHasAudio(inputPath) {
  const { spawn } = await import("node:child_process");
  return await new Promise((res) => {
    const p = spawn(FFMPEG, ["-i", inputPath], { stdio: ["ignore", "ignore", "pipe"] });
    let buf = "";
    p.stderr.on("data", (d) => (buf += d.toString()));
    p.on("exit", () => res(/Stream.*Audio/.test(buf)));
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
  const hookHold = Math.min(durSec * 0.55, durSec - 3.2, 4.0);
  const fg = hookDrawtext({
    text: hook.text,
    position: hook.position || "top",
    hold: Math.max(2.4, hookHold),
  });
  const ctaF = cta ? ctaDrawtext({ text: cta.text }) : null;
  const filter = buildNormaliseAndOverlay({
    srcW,
    srcH,
    hookFilter: fg,
    ctaFilter: ctaF,
    totalSec: durSec,
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

async function renderSynthBed({ events, sfx, outPath, durSec }) {
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

async function muxWithSyntheticBed({ videoPath, audioPath, outPath }) {
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

async function muxWithPassthroughAudio({ videoPath, rawPath, startSec, durSec, outPath }) {
  // We re-cut the original audio by the same -ss/-t window, normalise, and
  // mux against the already-rendered overlay video.
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    videoPath,
    "-ss",
    String(startSec),
    "-t",
    String(durSec),
    "-i",
    rawPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0?",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-af",
    "loudnorm=I=-16:LRA=11:tp=-1.5",
    "-movflags",
    "+faststart",
    "-shortest",
    outPath,
  ];
  await run(FFMPEG, args);
}

function loadVariants() {
  if (!existsSync(VARIANTS_PATH)) {
    throw new Error(
      `variants config missing: ${VARIANTS_PATH}\nCreate it (see batch_02 operator runbook §2).`,
    );
  }
  const raw = JSON.parse(readFileSync(VARIANTS_PATH, "utf-8"));
  if (!raw || !Array.isArray(raw.variants))
    throw new Error("variants config malformed — expected { variants: [...] }");
  return raw.variants;
}

function parseFlags() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith("--"));
  const flags = Object.fromEntries(
    args
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [k, v = "true"] = a.replace(/^--/, "").split("=");
        return [k, v];
      }),
  );
  return { only: positional[0], flags };
}

async function main() {
  const { only, flags } = parseFlags();
  const audioOverride = flags.audio || null; // passthrough | synth | silent | null
  const noAudio = flags["no-audio"] === "true" || audioOverride === "silent";
  const variants = loadVariants();
  console.log(`[batch02] loaded ${variants.length} variants from ${VARIANTS_PATH}`);

  let sfx = null;
  const needsSynth = variants.some(
    (v) => (audioOverride ?? v.audioMode ?? "passthrough") === "synth",
  );
  if (needsSynth && !noAudio) {
    const SFX_DIR = join(WORK_DIR, "sfx");
    console.log(`[batch02] generating SFX → ${SFX_DIR}`);
    sfx = await generateSfx(FFMPEG, SFX_DIR, { padSeconds: 30 });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    ffmpeg: FFMPEG,
    pipeline: "batch_02 native portrait",
    videos: [],
    skipped: [],
  };

  for (const v of variants) {
    if (only && !v.name.includes(only) && !v.id?.includes(only)) continue;

    const rawPath = join(RAW_DIR, v.raw);
    if (!existsSync(rawPath)) {
      console.warn(`[skip] raw missing: ${v.raw}`);
      manifest.skipped.push({ id: v.id, name: v.name, reason: "raw missing", raw: v.raw });
      continue;
    }

    const finalPath = join(EXPORT_DIR, v.name);
    const silentPath = join(WORK_DIR, `silent_${v.name}`);

    const rawDur = await probeDuration(rawPath);
    const rawSize = await probeSize(rawPath);
    if (!rawSize) {
      console.warn(`[skip] could not probe size: ${v.raw}`);
      manifest.skipped.push({ id: v.id, name: v.name, reason: "probe failed", raw: v.raw });
      continue;
    }
    if (rawSize.w > rawSize.h) {
      console.warn(
        `[warn] ${v.raw} is landscape (${rawSize.w}x${rawSize.h}). Crop will lose horizontal detail. Re-record in portrait if possible.`,
      );
    }

    const requestedStart = Number(v.startSec ?? 0);
    const requestedDur = Number(v.durSec ?? 12);
    const start = Math.min(
      requestedStart,
      Math.max(0, (rawDur ?? requestedDur + requestedStart) - requestedDur - 0.1),
    );
    const dur = Math.min(requestedDur, Math.max(4, (rawDur ?? requestedDur) - start));
    const audioMode = audioOverride ?? v.audioMode ?? "passthrough";

    console.log(
      `[batch02] ${v.name} ← ${v.raw}  ${rawSize.w}x${rawSize.h} start=${start.toFixed(
        2,
      )}s dur=${dur.toFixed(2)}s audio=${noAudio ? "off" : audioMode}`,
    );

    try {
      const hook = { text: v.hookText, position: v.hookPosition || "top" };
      const cta = v.ctaText ? { text: v.ctaText } : null;
      await renderVideoOnly({
        rawPath,
        outPath: silentPath,
        hook,
        cta,
        startSec: start,
        durSec: dur,
        srcW: rawSize.w,
        srcH: rawSize.h,
      });

      let outcome = { mode: noAudio ? "silent" : audioMode, events: null };

      if (noAudio) {
        renameSync(silentPath, finalPath);
      } else if (audioMode === "passthrough") {
        const hasAudio = await probeHasAudio(rawPath);
        if (!hasAudio) {
          console.warn(
            `[warn] ${v.raw} has no audio track — falling back to silent. Set audioMode="synth" in variants if you need a bed.`,
          );
          renameSync(silentPath, finalPath);
          outcome = { mode: "silent (forced; raw had no audio)", events: null };
        } else {
          await muxWithPassthroughAudio({
            videoPath: silentPath,
            rawPath,
            startSec: start,
            durSec: dur,
            outPath: finalPath,
          });
        }
      } else if (audioMode === "synth") {
        const events = buildEventSchedule({
          durSec: dur,
          cadence: v.cadence || "medium",
          plannedMistakes: v.plannedMistakes || 0,
        });
        const audioPath = join(WORK_DIR, `bed_${v.name.replace(/\.mp4$/, ".wav")}`);
        await renderSynthBed({ events, sfx, outPath: audioPath, durSec: dur });
        await muxWithSyntheticBed({ videoPath: silentPath, audioPath, outPath: finalPath });
        outcome = { mode: "synth", events };
      } else {
        throw new Error(`unknown audioMode: ${audioMode}`);
      }

      const outSize = statSync(finalPath).size;
      manifest.videos.push({
        id: v.id,
        output: `tiktok/batch_02/exports/${v.name}`,
        rawSource: v.raw,
        rawSize,
        bucket: v.bucket,
        hookText: v.hookText,
        ctaText: v.ctaText ?? null,
        startSec: Number(start.toFixed(2)),
        durationSec: Number(dur.toFixed(2)),
        audio: outcome,
        bytes: outSize,
      });
    } catch (err) {
      console.error(`[fail] ${v.name}:`, err.message);
      manifest.skipped.push({ id: v.id, name: v.name, reason: err.message, raw: v.raw });
    }
  }

  writeFileSync(
    join(MAN_DIR, "tiktok_batch_02_video_manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `[batch02] wrote ${manifest.videos.length} video(s), skipped ${manifest.skipped.length} → ${EXPORT_DIR}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
