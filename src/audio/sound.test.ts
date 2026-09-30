import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSoundSettings,
  playSound,
  resetSoundForTests,
  setSoundMuted,
  setSoundVolume,
  suspendSound,
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
  gainNodes: Array<MockAudioNode & { gain: MockAudioParam }> = [];
  decodedBuffer = { duration: 0.13 };
  decodeAudioData = vi.fn(async () => this.decodedBuffer as AudioBuffer);

  constructor() {
    MockAudioContext.instances.push(this);
  }

  createGain(): MockAudioNode & { gain: MockAudioParam } {
    const node = Object.assign(new MockAudioNode(), { gain: new MockAudioParam() });
    this.gainNodes.push(node);
    return node;
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

  suspend(): Promise<void> {
    this.state = "suspended";
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

    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledTimes(1));
    context.biquadCount = 0;
    playSound("select");

    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it("deduplicates a committed feedback event and rate-limits rapid taps", () => {
    installBrowserMocks(
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) })),
    );
    const now = vi.fn(() => 100);
    vi.stubGlobal("performance", { now });

    playSound("correct", { eventKey: "attempt-1:solve:g1" });
    const context = MockAudioContext.instances[0];
    const afterCommitted = context.bufferSources.length;
    playSound("correct", { eventKey: "attempt-1:solve:g1" });
    expect(context.bufferSources.length).toBe(afterCommitted);

    playSound("select");
    const afterTap = context.bufferSources.length;
    playSound("select");
    expect(context.bufferSources.length).toBe(afterTap);
  });

  it("mutes active tails, suspends in background, and contains resume rejection", async () => {
    installBrowserMocks(vi.fn(async () => Promise.reject(new Error("offline"))));
    playSound("submit");
    const context = MockAudioContext.instances[0];
    const master = context.gainNodes[0];

    setSoundMuted(true);
    expect(master.gain.value).toBe(0);
    setSoundMuted(false);
    expect(master.gain.value).toBe(0.75);

    suspendSound();
    expect(context.state).toBe("suspended");
    context.resume = vi.fn(() => Promise.reject(new Error("blocked")));
    expect(() => playSound("loss", { eventKey: "attempt-2:terminal:loss" })).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(context.resume).toHaveBeenCalledTimes(1);
  });
});
