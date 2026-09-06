import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getProceduralAudioContext,
  setProceduralVolume,
  setProceduralMuted,
  isProceduralMuted,
  playCardClick,
  playHarmonicSolve,
  playErrorThud,
  playOrigamiFold,
  playTensionWobble,
  playZenBell,
  disposeProceduralAudio,
} from "../proceduralSynth";

interface MockAudioParam {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
}

function createMockAudioParam(initial: number = 0): MockAudioParam {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class MockAudioNode {
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer: unknown = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode extends MockAudioNode {
  type = "lowpass";
  frequency = createMockAudioParam(1000);
  Q = createMockAudioParam(1);
}

class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = createMockAudioParam(440);
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = createMockAudioParam(1);
}

class MockAudioContext {
  state: "running" | "suspended" | "closed" = "running";
  currentTime = 0.5;
  sampleRate = 44100;
  destination = new MockAudioNode();

  createdSources: MockAudioBufferSourceNode[] = [];
  createdFilters: MockBiquadFilterNode[] = [];
  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];

  createBufferSource() {
    const node = new MockAudioBufferSourceNode();
    this.createdSources.push(node);
    return node;
  }

  createBiquadFilter() {
    const node = new MockBiquadFilterNode();
    this.createdFilters.push(node);
    return node;
  }

  createOscillator() {
    const node = new MockOscillatorNode();
    this.createdOscillators.push(node);
    return node;
  }

  createGain() {
    const node = new MockGainNode();
    this.createdGains.push(node);
    return node;
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockImplementation(() => {
    this.state = "closed";
    return Promise.resolve();
  });
}

describe("ProceduralSynth WebAudio Engine", () => {
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    disposeProceduralAudio();
    mockCtx = new MockAudioContext();
    (globalThis as unknown as { AudioContext?: unknown }).AudioContext = vi.fn(() => mockCtx);
  });

  afterEach(() => {
    disposeProceduralAudio();
    delete (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it("lazily initializes and configures audio context and master gain", () => {
    const ctx = getProceduralAudioContext();
    expect(ctx).toBe(mockCtx);
    expect(mockCtx.createdGains.length).toBeGreaterThanOrEqual(1);

    setProceduralVolume(0.5);
    expect(mockCtx.createdGains[0].gain.value).toBe(0.5);

    setProceduralMuted(true);
    expect(isProceduralMuted()).toBe(true);
    expect(mockCtx.createdGains[0].gain.value).toBe(0);

    setProceduralMuted(false);
    expect(isProceduralMuted()).toBe(false);
    expect(mockCtx.createdGains[0].gain.value).toBe(0.5);
  });

  it("plays card click with 20ms bandpass-filtered noise pulse", () => {
    playCardClick(1.2);
    expect(mockCtx.createdSources.length).toBe(1);
    expect(mockCtx.createdFilters.length).toBe(1);

    const filter = mockCtx.createdFilters[0];
    expect(filter.type).toBe("bandpass");
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1900 * 1.2, 0.5);
    expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(3.2, 0.5);

    const source = mockCtx.createdSources[0];
    expect(source.start).toHaveBeenCalledWith(0.5);
    expect(source.stop).toHaveBeenCalledWith(0.5 + 0.02 + 0.005);
  });

  it("plays 4-stage harmonic progression for solved colors", () => {
    // Stage 1: Root only
    playHarmonicSolve(1);
    expect(mockCtx.createdOscillators.length).toBe(1);
    expect(mockCtx.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(261.63, 0.5);

    mockCtx.createdOscillators.length = 0;

    // Stage 2: Root + Major 3rd (329.63Hz)
    playHarmonicSolve(2);
    expect(mockCtx.createdOscillators.length).toBe(2);
    expect(mockCtx.createdOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(329.63, 0.5);

    mockCtx.createdOscillators.length = 0;

    // Stage 3: Triad with Fifth (392.00Hz)
    playHarmonicSolve(3);
    expect(mockCtx.createdOscillators.length).toBe(3);
    expect(mockCtx.createdOscillators[2].frequency.setValueAtTime).toHaveBeenCalledWith(392.00, 0.5);

    mockCtx.createdOscillators.length = 0;

    // Stage 4: Full Octave (523.25Hz)
    playHarmonicSolve(4);
    expect(mockCtx.createdOscillators.length).toBe(4);
    expect(mockCtx.createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0.5);
  });

  it("plays error thud with pitch dropping to 50Hz", () => {
    playErrorThud();
    expect(mockCtx.createdOscillators.length).toBe(1);
    const osc = mockCtx.createdOscillators[0];
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(130, 0.5);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(50, 0.5 + 0.18);
  });

  it("plays origami fold, tension wobble, and zen bell", () => {
    playOrigamiFold();
    expect(mockCtx.createdFilters.length).toBeGreaterThan(0);

    playTensionWobble();
    expect(mockCtx.createdOscillators.some((o) => o.frequency.setValueAtTime.mock.calls.some(([freq]) => freq === 110))).toBe(true);
    expect(mockCtx.createdOscillators.some((o) => o.frequency.setValueAtTime.mock.calls.some(([freq]) => freq === 116))).toBe(true);

    playZenBell();
    expect(mockCtx.createdOscillators.some((o) => o.frequency.setValueAtTime.mock.calls.some(([freq]) => freq === 440))).toBe(true);
  });

  it("enforces 100% liveness teardown: closes context and frees references", () => {
    getProceduralAudioContext();
    expect(mockCtx.close).not.toHaveBeenCalled();

    disposeProceduralAudio();
    expect(mockCtx.close).toHaveBeenCalled();
    expect(mockCtx.state).toBe("closed");

    // Calling again creates a fresh context
    const nextCtx = new MockAudioContext();
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = vi.fn(() => nextCtx);
    const reinitialized = getProceduralAudioContext();
    expect(reinitialized).toBe(nextCtx);
  });
});
