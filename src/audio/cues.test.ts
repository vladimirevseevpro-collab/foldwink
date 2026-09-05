import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SOUND_CUE_FILES, SOUND_EVENTS, getSoundCueUrl } from "./cues";

interface SoundManifest {
  channels: number;
  sampleRate: number;
  totalBytes: number;
  cues: Record<string, { bytes: number; durationMs: number; file: string; sha256: string }>;
}

const audioDir = fileURLToPath(new URL("../../public/audio/", import.meta.url));

describe("sound cue manifest", () => {
  it("maps every semantic event to one unique WAV", () => {
    expect(SOUND_EVENTS).toHaveLength(9);
    expect(new Set(SOUND_EVENTS).size).toBe(SOUND_EVENTS.length);
    expect(Object.keys(SOUND_CUE_FILES)).toEqual([...SOUND_EVENTS]);
    expect(new Set(Object.values(SOUND_CUE_FILES)).size).toBe(SOUND_EVENTS.length);
  });

  it("resolves deployment-relative asset URLs", () => {
    expect(getSoundCueUrl("wink", "./")).toBe("./audio/wink.wav");
    expect(getSoundCueUrl("win", "/foldwink")).toBe("/foldwink/audio/win.wav");
  });

  it("ships a compact valid asset for every event", async () => {
    const manifest = JSON.parse(
      await readFile(`${audioDir}manifest.json`, "utf8"),
    ) as SoundManifest;

    expect(manifest.sampleRate).toBe(48_000);
    expect(manifest.channels).toBe(1);
    expect(manifest.totalBytes).toBeLessThan(2_000_000);
    expect(Object.keys(manifest.cues)).toEqual([...SOUND_EVENTS]);

    for (const event of SOUND_EVENTS) {
      const cue = manifest.cues[event];
      expect(cue.file).toBe(SOUND_CUE_FILES[event]);
      expect(cue.durationMs).toBeGreaterThanOrEqual(100);
      expect(cue.durationMs).toBeLessThanOrEqual(13000);
      expect(cue.sha256).toMatch(/^[a-f0-9]{64}$/);

      const filePath = `${audioDir}${cue.file}`;
      const [header, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
      expect(header.toString("ascii", 0, 4)).toBe("RIFF");
      expect(header.toString("ascii", 8, 12)).toBe("WAVE");
      expect(fileStats.size).toBe(cue.bytes);
    }
  });
});
