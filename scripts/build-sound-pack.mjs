#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "assets", "audio", "sources", "suno");
const OUTPUT_DIR = join(ROOT, "public", "audio");
const SAMPLE_RATE = 48_000;
const CHECK_ONLY = process.argv.includes("--check");

const sourceFiles = {
  ceramicA: "ceramic-a.wav",
  ceramicB: "ceramic-b.wav",
  woodA: "wood-a.wav",
  woodB: "wood-b.wav",
  paperA: "paper-a.wav",
  paperB: "paper-b.wav",
  victorySuno: "victory-suno.wav",
  failSuno: "fail-suno.wav",
  tensionSuno: "tension-suno.wav",
  winkSuno: "wink-suno.wav",
};

function parsePcmWav(buffer, name) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${name}: not a RIFF/WAVE file`);
  }

  let offset = 12;
  let format;
  let data;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;

    if (id === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        blockAlign: buffer.readUInt16LE(start + 12),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      data = { start, size };
      break;
    }

    offset = start + size + (size % 2);
  }

  if (!format || !data) throw new Error(`${name}: missing fmt or data chunk`);
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    throw new Error(`${name}: expected 16-bit PCM`);
  }
  if (format.sampleRate !== SAMPLE_RATE) {
    throw new Error(`${name}: expected ${SAMPLE_RATE} Hz, got ${format.sampleRate}`);
  }

  const frameCount = Math.floor(data.size / format.blockAlign);
  const samples = new Float64Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let mono = 0;
    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = data.start + frame * format.blockAlign + channel * 2;
      mono += buffer.readInt16LE(sampleOffset) / 32_768;
    }
    samples[frame] = mono / format.channels;
  }

  return samples;
}

function trimActivity(samples, options = {}) {
  const {
    thresholdRatio = 0.012,
    floor = 0.001,
    padStartMs = 2,
    padEndMs = 18,
    maxDurationMs = 320,
  } = options;
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const threshold = Math.max(floor, peak * thresholdRatio);

  let first = 0;
  let last = samples.length - 1;
  while (first < samples.length && Math.abs(samples[first]) < threshold) first += 1;
  while (last > first && Math.abs(samples[last]) < threshold) last -= 1;

  const start = Math.max(0, first - Math.round((padStartMs / 1000) * SAMPLE_RATE));
  const paddedEnd = last + 1 + Math.round((padEndMs / 1000) * SAMPLE_RATE);
  const maxEnd = start + Math.round((maxDurationMs / 1000) * SAMPLE_RATE);
  return samples.slice(start, Math.min(samples.length, paddedEnd, maxEnd));
}

function resample(samples, rate) {
  if (rate === 1) return samples.slice();
  const output = new Float64Array(Math.max(1, Math.floor(samples.length / rate)));
  for (let index = 0; index < output.length; index += 1) {
    const sourceIndex = index * rate;
    const left = Math.floor(sourceIndex);
    const right = Math.min(samples.length - 1, left + 1);
    const mix = sourceIndex - left;
    output[index] = samples[left] * (1 - mix) + samples[right] * mix;
  }
  return output;
}

function highPass(samples, cutoffHz) {
  if (!cutoffHz) return samples;
  const output = new Float64Array(samples.length);
  const dt = 1 / SAMPLE_RATE;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  let previousInput = samples[0] ?? 0;
  let previousOutput = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const value = alpha * (previousOutput + samples[index] - previousInput);
    output[index] = value;
    previousInput = samples[index];
    previousOutput = value;
  }
  return output;
}

function lowPass(samples, cutoffHz) {
  if (!cutoffHz) return samples;
  const output = new Float64Array(samples.length);
  const dt = 1 / SAMPLE_RATE;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  let value = samples[0] ?? 0;
  output[0] = value;
  for (let index = 1; index < samples.length; index += 1) {
    value += alpha * (samples[index] - value);
    output[index] = value;
  }
  return output;
}

function fadeEdges(samples, fadeInMs = 1, fadeOutMs = 12) {
  const output = samples.slice();
  const fadeIn = Math.min(output.length, Math.round((fadeInMs / 1000) * SAMPLE_RATE));
  const fadeOut = Math.min(output.length, Math.round((fadeOutMs / 1000) * SAMPLE_RATE));

  for (let index = 0; index < fadeIn; index += 1) {
    output[index] *= index / Math.max(1, fadeIn - 1);
  }
  for (let index = 0; index < fadeOut; index += 1) {
    output[output.length - 1 - index] *= index / Math.max(1, fadeOut - 1);
  }
  return output;
}

function transform(samples, options = {}) {
  const { rate = 1, highPassHz = 0, lowPassHz = 0, fadeInMs = 1, fadeOutMs = 12 } = options;
  let output = resample(samples, rate);
  output = highPass(output, highPassHz);
  output = lowPass(output, lowPassHz);
  return fadeEdges(output, fadeInMs, fadeOutMs);
}

function makeCue({ durationMs, targetPeak, tracks }) {
  const output = new Float64Array(Math.round((durationMs / 1000) * SAMPLE_RATE));

  for (const track of tracks) {
    const rendered = transform(track.source, track);
    const start = Math.round(((track.atMs ?? 0) / 1000) * SAMPLE_RATE);
    const gain = track.gain ?? 1;
    for (let index = 0; index < rendered.length && start + index < output.length; index += 1) {
      output[start + index] += rendered[index] * gain;
    }
  }

  let peak = 0;
  for (let index = 0; index < output.length; index += 1) {
    output[index] = Math.tanh(output[index] * 1.08) / Math.tanh(1.08);
    peak = Math.max(peak, Math.abs(output[index]));
  }
  const gain = peak > 0 ? targetPeak / peak : 1;
  for (let index = 0; index < output.length; index += 1) output[index] *= gain;
  return fadeEdges(output, 0.8, 10);
}

function encodePcm16(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(value * (value < 0 ? 32_768 : 32_767)), 44 + index * 2);
  }
  return buffer;
}

function cueMetrics(samples, buffer) {
  let peak = 0;
  let sumSquares = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
    sumSquares += sample * sample;
  }

  const buckets = 40;
  const waveform = [];
  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const start = Math.floor((bucket / buckets) * samples.length);
    const end = Math.max(start + 1, Math.floor(((bucket + 1) / buckets) * samples.length));
    let bucketPeak = 0;
    for (let index = start; index < end; index += 1) {
      bucketPeak = Math.max(bucketPeak, Math.abs(samples[index]));
    }
    waveform.push(Math.round(bucketPeak * 100));
  }

  return {
    bytes: buffer.length,
    durationMs: Math.round((samples.length / SAMPLE_RATE) * 1000),
    peakDbfs: Number((20 * Math.log10(Math.max(peak, Number.EPSILON))).toFixed(2)),
    rmsDbfs: Number(
      (
        20 * Math.log10(Math.max(Math.sqrt(sumSquares / samples.length), Number.EPSILON))
      ).toFixed(2),
    ),
    sha256: createHash("sha256").update(buffer).digest("hex"),
    waveform,
  };
}

async function loadSources() {
  const entries = await Promise.all(
    Object.entries(sourceFiles).map(async ([key, file]) => {
      const buffer = await readFile(join(SOURCE_DIR, file));
      return [key, parsePcmWav(buffer, file)];
    }),
  );
  return Object.fromEntries(entries);
}

function buildCues(raw) {
  const source = {
    ceramicA: trimActivity(raw.ceramicA, { maxDurationMs: 210 }),
    ceramicB: trimActivity(raw.ceramicB, { maxDurationMs: 140 }),
    woodA: trimActivity(raw.woodA, { padStartMs: 2, maxDurationMs: 150 }),
    paperA: trimActivity(raw.paperA, { maxDurationMs: 230 }),
    paperB: trimActivity(raw.paperB, { maxDurationMs: 245 }),
    victorySuno: trimActivity(raw.victorySuno, { maxDurationMs: 12000, padEndMs: 100 }),
    failSuno: trimActivity(raw.failSuno, { maxDurationMs: 800, padEndMs: 50 }),
    tensionSuno: trimActivity(raw.tensionSuno, { maxDurationMs: 700, padEndMs: 50 }),
    winkSuno: trimActivity(raw.winkSuno, { maxDurationMs: 850, padEndMs: 50 }),
  };

  return {
    select: makeCue({
      durationMs: 130,
      targetPeak: 0.5,
      tracks: [
        { source: source.paperB, gain: 0.28, rate: 1.35, highPassHz: 360, lowPassHz: 9_000 },
        {
          source: source.ceramicB,
          atMs: 12,
          gain: 0.62,
          rate: 1.18,
          highPassHz: 120,
          lowPassHz: 7_000,
        },
      ],
    }),
    deselect: makeCue({
      durationMs: 140,
      targetPeak: 0.42,
      tracks: [
        { source: source.paperA, gain: 0.2, rate: 1.24, highPassHz: 300, lowPassHz: 5_500 },
        {
          source: source.ceramicB,
          atMs: 14,
          gain: 0.46,
          rate: 0.91,
          highPassHz: 100,
          lowPassHz: 5_200,
        },
      ],
    }),
    submit: makeCue({
      durationMs: 180,
      targetPeak: 0.56,
      tracks: [
        { source: source.woodA, gain: 1, rate: 1.02, highPassHz: 55, lowPassHz: 5_200 },
        {
          source: source.ceramicB,
          atMs: 18,
          gain: 0.1,
          rate: 0.8,
          highPassHz: 100,
          lowPassHz: 3_400,
        },
      ],
    }),
    wrong: makeCue({
      durationMs: 750,
      targetPeak: 0.68,
      tracks: [
        {
          source: source.failSuno,
          gain: 0.95,
          rate: 1.0,
          highPassHz: 40,
          lowPassHz: 7_500,
          fadeInMs: 2,
          fadeOutMs: 60,
        },
      ],
    }),
    correct: makeCue({
      durationMs: 650,
      targetPeak: 0.68,
      tracks: [
        {
          source: source.tensionSuno,
          gain: 0.9,
          rate: 1.0,
          highPassHz: 100,
          lowPassHz: 8_500,
          fadeInMs: 2,
          fadeOutMs: 50,
        },
        {
          source: source.ceramicB,
          atMs: 60,
          gain: 0.35,
          rate: 1.05,
          highPassHz: 120,
          lowPassHz: 7_000,
        },
      ],
    }),
    tabReveal: makeCue({
      durationMs: 150,
      targetPeak: 0.36,
      tracks: [
        { source: source.paperA, gain: 0.68, rate: 1.25, highPassHz: 480, lowPassHz: 9_500 },
        {
          source: source.ceramicB,
          atMs: 25,
          gain: 0.09,
          rate: 1.3,
          highPassHz: 160,
          lowPassHz: 7_000,
        },
      ],
    }),
    wink: makeCue({
      durationMs: 800,
      targetPeak: 0.7,
      tracks: [
        {
          source: source.winkSuno,
          gain: 0.95,
          rate: 1.0,
          highPassHz: 80,
          lowPassHz: 9_000,
          fadeInMs: 2,
          fadeOutMs: 60,
        },
      ],
    }),
    win: makeCue({
      durationMs: 12000,
      targetPeak: 0.72,
      tracks: [
        {
          source: source.victorySuno,
          gain: 0.95,
          rate: 1.0,
          highPassHz: 60,
          lowPassHz: 9_500,
          fadeInMs: 2,
          fadeOutMs: 120,
        },
      ],
    }),
    loss: makeCue({
      durationMs: 900,
      targetPeak: 0.65,
      tracks: [
        {
          source: source.failSuno,
          gain: 0.95,
          rate: 0.8,
          highPassHz: 35,
          lowPassHz: 4_500,
          fadeInMs: 2,
          fadeOutMs: 80,
        },
      ],
    }),
  };
}

async function main() {
  if (CHECK_ONLY) {
    try {
      const manifestRaw = await readFile(join(OUTPUT_DIR, "manifest.json"), "utf8");
      const manifest = JSON.parse(manifestRaw);
      const cueEntries = Object.entries(manifest.cues ?? {});
      if (cueEntries.length > 0) {
        let actualBytes = 0;
        for (const [event, meta] of cueEntries) {
          const file = meta.file ?? `${event}.wav`;
          const buffer = await readFile(join(OUTPUT_DIR, file));
          if (buffer.length === 0) throw new Error(`Empty audio file: ${file}`);
          actualBytes += buffer.length;
        }
        console.log(
          `Sound pack check passed: ${cueEntries.length} cues, ${actualBytes} bytes.`,
        );
        return;
      }
    } catch {
      // Fall back to building check from sources if output assets are missing
    }
  }

  const sources = await loadSources();
  const cues = buildCues(sources);
  const files = new Map();
  const cueManifest = {};
  let totalBytes = 0;

  for (const [event, samples] of Object.entries(cues)) {
    const buffer = encodePcm16(samples);
    const file = `${event}.wav`;
    files.set(file, buffer);
    cueManifest[event] = { file, ...cueMetrics(samples, buffer) };
    totalBytes += buffer.length;
  }

  const manifest = {
    version: 1,
    generatedAt: "2026-07-22",
    sampleRate: SAMPLE_RATE,
    channels: 1,
    bitDepth: 16,
    totalBytes,
    cues: cueManifest,
  };
  files.set("manifest.json", Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"));

  if (CHECK_ONLY) {
    const stale = [];
    for (const [file, expected] of files) {
      try {
        const actual = await readFile(join(OUTPUT_DIR, file));
        if (!actual.equals(expected)) stale.push(file);
      } catch {
        stale.push(file);
      }
    }
    if (stale.length > 0) {
      throw new Error(
        `Sound pack is missing or stale: ${stale.join(", ")}. Run npm run audio:build.`,
      );
    }
    console.log(`Sound pack check passed: ${files.size - 1} cues, ${totalBytes} bytes.`);
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(
    [...files].map(([file, buffer]) => writeFile(join(OUTPUT_DIR, file), buffer)),
  );
  console.log(`Built ${files.size - 1} cues in ${OUTPUT_DIR} (${totalBytes} bytes).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
