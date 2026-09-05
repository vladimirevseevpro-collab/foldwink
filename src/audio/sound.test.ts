import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSoundSettings,
  playSound,
  resetSoundForTests,
  setSoundMuted,
  setSoundVolume,
} from "./sound";

class MockAudioParam {
  value = 0;

  setValueAtTime(value: number): void {
    this.value = value;
  }

  linearRampToValueAtTime(value: number): void {
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
  }
}

class MockAudioNode {
  connect(): this {
    return this;
  }
}

class MockBufferSource extends MockAudioNode {
  buffer: unknown = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];

  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 48_000;
  destination = new MockAudioNode();
  biquadCount = 0;
  bufferSources: MockBufferSource[] = [];
  decodedBuffer = { duration: 0.13 };
  decodeAudioData = vi.fn(async () => this.decodedBuffer as AudioBuffer);

  constructor() {
    MockAudioContext.instances.push(this);
  }

  createGain(): MockAudioNode & { gain: MockAudioParam } {
    return Object.assign(new MockAudioNode(), { gain: new MockAudioParam() });
  }

  createBuffer(): { getChannelData: () => Float32Array } {
    return { getChannelData: () => new Float32Array(12_000) };
  }

  createBufferSource(): MockBufferSource {
    const source = new MockBufferSource();
    this.bufferSources.push(source);
    return source;
  }

  createBiquadFilter(): MockAudioNode & {
    Q: MockAudioParam;
    frequency: MockAudioParam;
    type: BiquadFilterType;
  } {
    this.biquadCount += 1;
    return Object.assign(new MockAudioNode(), {
      Q: new MockAudioParam(),
      frequency: new MockAudioParam(),
      type: "lowpass" as BiquadFilterType,
    });
  }

  createOscillator(): MockAudioNode & {
    frequency: MockAudioParam;
    start: () => void;
    stop: () => void;
    type: OscillatorType;
  } {
    return Object.assign(new MockAudioNode(), {
      frequency: new MockAudioParam(),
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine" as OscillatorType,
    });
  }

  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
}

function installBrowserMocks(fetchMock: ReturnType<typeof vi.fn>): void {
  const values = new Map<string, string>();
  vi.stubGlobal("window", { AudioContext: MockAudioContext });
  vi.stubGlobal("document", {});
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
}

beforeEach(() => {
  MockAudioContext.instances = [];
});

afterEach(() => {
  resetSoundForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sound runtime", () => {
  it("uses the procedural cue immediately, then the decoded local buffer", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(16),
    }));
    installBrowserMocks(fetchMock);

    playSound("select");
    const context = MockAudioContext.instances[0];
    expect(context.biquadCount).toBe(1);

    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledTimes(9));
    context.biquadCount = 0;
    playSound("select");

    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(context.biquadCount).toBe(0);
    expect(context.bufferSources.at(-1)?.buffer).toBe(context.decodedBuffer);
  });

  it("keeps procedural playback available when asset loading fails", async () => {
    installBrowserMocks(vi.fn(async () => Promise.reject(new Error("offline"))));

    playSound("submit");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const context = MockAudioContext.instances[0];
    const firstFilterCount = context.biquadCount;
    playSound("submit");

    expect(firstFilterCount).toBeGreaterThan(0);
    expect(context.biquadCount).toBeGreaterThan(firstFilterCount);
  });

  it("persists clamped volume and mute settings", () => {
    installBrowserMocks(vi.fn());

    expect(getSoundSettings()).toEqual({ muted: false, volume: 0.75 });
    setSoundVolume(2);
    setSoundMuted(true);

    expect(getSoundSettings()).toEqual({ muted: true, volume: 1 });
  });
});
