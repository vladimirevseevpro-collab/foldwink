/**
 * Generate the ASMR pad + per-event SFX wavs once into work/sfx/.
 *
 * All cues are rebuilt from the same material palette Foldwink synthesises
 * at runtime in src/audio/sound.ts — warm wood/paper/bone, nothing in the
 * bright casino register. We re-render them with ffmpeg filters so the
 * videos carry the game's actual sonic identity rather than a generic pad.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "./ffmpeg.mjs";

const SR = 44100;

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

// Short tap: band-limited noise burst shaped with a fast fade-in + exponential
// decay. Mirrors playTap() in src/audio/sound.ts.
function tapFilter({ dur, filterHz, gain }) {
  const outDur = Math.max(0.006, dur - 0.004);
  return (
    `anoisesrc=d=${dur.toFixed(3)}:color=brown:sample_rate=${SR}:amplitude=1,` +
    `lowpass=f=${filterHz},` +
    `afade=t=in:d=0.004,` +
    `afade=t=out:st=0.004:d=${outDur.toFixed(3)},` +
    `volume=${gain.toFixed(3)}`
  );
}

// Body tone: sine with fast attack + exponential decay. Matches playBody().
function bodyFilter({ freq, dur, gain, decay }) {
  const dec = decay ?? dur;
  const outDur = Math.max(0.006, dec - 0.004);
  return (
    `sine=frequency=${freq}:duration=${dur.toFixed(3)}:sample_rate=${SR},` +
    `afade=t=in:d=0.004,` +
    `afade=t=out:st=0.004:d=${outDur.toFixed(3)},` +
    `volume=${gain.toFixed(3)}`
  );
}

// Build a single SFX file from a list of layers, each with { filter, delay }.
async function buildLayeredSfx(ffmpeg, outPath, layers, totalSec) {
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  const graph = [];
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    args.push("-f", "lavfi", "-i", L.filter);
    const delayMs = Math.round((L.delay ?? 0) * 1000);
    if (delayMs > 0)
      graph.push(`[${i}:a]adelay=${delayMs}|${delayMs},apad=pad_dur=${totalSec}[l${i}]`);
    else graph.push(`[${i}:a]apad=pad_dur=${totalSec}[l${i}]`);
  }
  const mixTags = layers.map((_, i) => `[l${i}]`).join("");
  graph.push(`${mixTags}amix=inputs=${layers.length}:normalize=0[mix]`);
  graph.push(`[mix]atrim=end=${totalSec.toFixed(3)},asetpts=N/SR/TB[out]`);
  args.push("-filter_complex", graph.join(";"));
  args.push("-map", "[out]");
  args.push("-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le", outPath);
  await run(ffmpeg, args);
}

export async function generateSfx(ffmpeg, outDir, { padSeconds = 24 } = {}) {
  ensureDir(outDir);

  // ASMR pad: three low sine layers (A2 / A3 / E4) with slow fade-in / out.
  // Kept well below -18 dBFS so game SFX always dominate.
  const padPath = join(outDir, "pad.wav");
  {
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=55:duration=${padSeconds}:sample_rate=${SR}`,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=110:duration=${padSeconds}:sample_rate=${SR}`,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=165:duration=${padSeconds}:sample_rate=${SR}`,
      "-f",
      "lavfi",
      "-i",
      `anoisesrc=d=${padSeconds}:color=pink:sample_rate=${SR}:amplitude=0.6`,
      "-filter_complex",
      [
        `[0:a]volume=0.18[p1]`,
        `[1:a]volume=0.10[p2]`,
        `[2:a]volume=0.07[p3]`,
        `[3:a]highpass=f=60,lowpass=f=1400,volume=0.03[air]`,
        `[p1][p2][p3][air]amix=inputs=4:normalize=0[mix]`,
        `[mix]volume=0.55,afade=t=in:d=2,afade=t=out:st=${(padSeconds - 2).toFixed(2)}:d=2[out]`,
      ].join(";"),
      "-map",
      "[out]",
      "-ar",
      String(SR),
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      padPath,
    ];
    await run(ffmpeg, args);
  }

  // SELECT — paper slide, 50ms tap at 1800Hz.
  await buildLayeredSfx(
    ffmpeg,
    join(outDir, "select.wav"),
    [{ filter: tapFilter({ dur: 0.05, filterHz: 1800, gain: 0.24 }) }],
    0.12,
  );

  // SUBMIT — wood knuckle (tap 1200Hz + 140Hz body).
  await buildLayeredSfx(
    ffmpeg,
    join(outDir, "submit.wav"),
    [
      { filter: tapFilter({ dur: 0.04, filterHz: 1200, gain: 0.28 }) },
      { filter: bodyFilter({ freq: 140, dur: 0.12, gain: 0.22, decay: 0.16 }) },
    ],
    0.22,
  );

  // CORRECT — three bone-on-wood settles ascending (180/215/250Hz).
  const correctLayers = [];
  const correctDelays = [0, 0.07, 0.15];
  const correctFreqs = [180, 215, 250];
  const correctTapHz = [1400, 1500, 1600];
  for (let i = 0; i < 3; i++) {
    correctLayers.push({
      filter: tapFilter({ dur: 0.035, filterHz: correctTapHz[i], gain: 0.2 }),
      delay: correctDelays[i],
    });
    correctLayers.push({
      filter: bodyFilter({ freq: correctFreqs[i], dur: 0.14, gain: 0.2, decay: 0.18 }),
      delay: correctDelays[i],
    });
  }
  await buildLayeredSfx(ffmpeg, join(outDir, "correct.wav"), correctLayers, 0.42);

  // WRONG — two muted wood knocks at 120/95 Hz.
  const wrongLayers = [
    { filter: tapFilter({ dur: 0.045, filterHz: 900, gain: 0.26 }), delay: 0 },
    { filter: bodyFilter({ freq: 120, dur: 0.14, gain: 0.22, decay: 0.2 }), delay: 0 },
    { filter: tapFilter({ dur: 0.045, filterHz: 700, gain: 0.22 }), delay: 0.09 },
    { filter: bodyFilter({ freq: 95, dur: 0.16, gain: 0.22, decay: 0.22 }), delay: 0.09 },
  ];
  await buildLayeredSfx(ffmpeg, join(outDir, "wrong.wav"), wrongLayers, 0.34);

  // WIN — four evenly-paced bone settles (170/190/215/240 Hz).
  const winLayers = [];
  const winDelays = [0, 0.09, 0.18, 0.28];
  const winFreqs = [170, 190, 215, 240];
  const winTapHz = [1300, 1400, 1500, 1600];
  for (let i = 0; i < 4; i++) {
    winLayers.push({
      filter: tapFilter({ dur: 0.035, filterHz: winTapHz[i], gain: 0.2 }),
      delay: winDelays[i],
    });
    winLayers.push({
      filter: bodyFilter({ freq: winFreqs[i], dur: 0.2, gain: 0.18, decay: 0.26 }),
      delay: winDelays[i],
    });
  }
  await buildLayeredSfx(ffmpeg, join(outDir, "win.wav"), winLayers, 0.65);

  return {
    pad: padPath,
    select: join(outDir, "select.wav"),
    submit: join(outDir, "submit.wav"),
    correct: join(outDir, "correct.wav"),
    wrong: join(outDir, "wrong.wav"),
    win: join(outDir, "win.wav"),
  };
}

// Given cadence + solve count, produce an event schedule in seconds.
// The schedule is approximate and designed for ASMR feel, not 1:1 game sync.
export function buildEventSchedule({ durSec, cadence = "fast", plannedMistakes = 0 }) {
  const profiles = {
    snappy: { openGap: 0.6, selectGap: 0.2, roundGap: 1.9, winLead: 0.8 },
    fast: { openGap: 0.7, selectGap: 0.22, roundGap: 2.2, winLead: 0.9 },
    medium: { openGap: 0.9, selectGap: 0.28, roundGap: 2.8, winLead: 1.0 },
    confident: { openGap: 0.8, selectGap: 0.24, roundGap: 2.5, winLead: 1.0 },
  };
  const p = profiles[cadence] ?? profiles.fast;
  const events = [];
  let t = p.openGap;
  // Roughly 4 rounds, plus plannedMistakes intros that resolve to wrong.
  const rounds = 4;
  for (let r = 0; r < rounds; r++) {
    // 4 selects
    for (let s = 0; s < 4; s++) {
      if (t < durSec - 0.4) events.push({ t, type: "select" });
      t += p.selectGap;
    }
    // submit
    if (t < durSec - 0.3) events.push({ t, type: "submit" });
    t += 0.35;
    // outcome: first `plannedMistakes` rounds are wrong, rest are correct
    const outcome = r < plannedMistakes ? "wrong" : "correct";
    if (t < durSec - 0.3) events.push({ t, type: outcome });
    t += p.roundGap - 0.35;
    if (t > durSec) break;
  }
  // Win lands near the end.
  events.push({ t: Math.max(0.5, durSec - p.winLead), type: "win" });
  return events.filter((e) => e.t < durSec - 0.1);
}
