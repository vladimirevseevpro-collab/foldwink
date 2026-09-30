import "@fontsource-variable/manrope/wght.css";
import { SOUND_EVENTS, type SoundEvent } from "../../src/audio/cues";
import {
  getSoundSettings,
  playSound,
  prepareSoundPack,
  setSoundMuted,
  setSoundVolume,
} from "../../src/audio/sound";

interface CueManifestEntry {
  bytes: number;
  durationMs: number;
  file: string;
  peakDbfs: number;
  rmsDbfs: number;
  waveform: number[];
}

interface SoundManifest {
  bitDepth: number;
  channels: number;
  sampleRate: number;
  totalBytes: number;
  cues: Record<SoundEvent, CueManifestEntry>;
}

const cueCopy: Record<SoundEvent, { label: string; material: string; outcome?: boolean }> = {
  select: { label: "Select", material: "paper lift + ceramic" },
  deselect: { label: "Deselect", material: "soft ceramic return" },
  submit: { label: "Submit", material: "walnut knuckle" },
  wrong: { label: "Wrong", material: "double walnut knock" },
  correct: { label: "Correct", material: "three ceramic settles" },
  tabReveal: { label: "Tab reveal", material: "folded paper flick" },
  wink: { label: "Wink", material: "signature folded tile" },
  win: { label: "Win", material: "four-piece ritual", outcome: true },
  loss: { label: "Loss", material: "low walnut close", outcome: true },
};

const status = document.querySelector<HTMLElement>("#status");
const actionCues = document.querySelector<HTMLElement>("#action-cues");
const outcomeCues = document.querySelector<HTMLElement>("#outcome-cues");
const specs = document.querySelector<HTMLElement>("#specs");
const sequenceButton = document.querySelector<HTMLButtonElement>("#play-sequence");
const muteButton = document.querySelector<HTMLButtonElement>("#toggle-mute");
const volumeInput = document.querySelector<HTMLInputElement>("#volume");
const activeTimers = new Map<SoundEvent, number>();

function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}audio/${file}`;
}

function updateSettingsControls(): void {
  const settings = getSoundSettings();
  if (volumeInput) volumeInput.value = String(settings.volume);
  if (muteButton) {
    muteButton.textContent = settings.muted ? "U" : "M";
    muteButton.title = settings.muted ? "Unmute" : "Mute";
    muteButton.setAttribute("aria-label", muteButton.title);
  }
}

function markPlaying(event: SoundEvent, durationMs: number): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-event="${event}"]`);
  if (!button) return;
  const previous = activeTimers.get(event);
  if (previous) window.clearTimeout(previous);
  button.dataset.playing = "true";
  activeTimers.set(
    event,
    window.setTimeout(() => {
      button.dataset.playing = "false";
      activeTimers.delete(event);
    }, durationMs + 70),
  );
}

function playCue(event: SoundEvent, durationMs: number): void {
  playSound(event);
  markPlaying(event, durationMs);
}

function renderCue(
  event: SoundEvent,
  index: number,
  entry: CueManifestEntry,
): HTMLButtonElement {
  const copy = cueCopy[event];
  const button = document.createElement("button");
  button.className = "cue";
  button.type = "button";
  button.dataset.event = event;
  button.dataset.playing = "false";
  button.setAttribute("aria-label", `Play ${copy.label}`);

  const number = document.createElement("span");
  number.className = "cue-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const text = document.createElement("span");
  text.className = "cue-copy";
  text.innerHTML = `<strong>${copy.label}</strong><span>${copy.material}</span>`;

  const waveform = document.createElement("span");
  waveform.className = "waveform";
  waveform.setAttribute("aria-hidden", "true");
  for (const value of entry.waveform) {
    const bar = document.createElement("i");
    bar.style.height = `${Math.max(8, value)}%`;
    waveform.appendChild(bar);
  }

  const duration = document.createElement("span");
  duration.className = "duration";
  duration.textContent = `${entry.durationMs} ms`;

  button.append(number, text, waveform, duration);
  button.addEventListener("click", () => playCue(event, entry.durationMs));
  return button;
}

async function loadManifest(): Promise<SoundManifest> {
  const response = await fetch(assetUrl("manifest.json"));
  if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
  return (await response.json()) as SoundManifest;
}

async function initialize(): Promise<void> {
  try {
    const [manifest] = await Promise.all([loadManifest(), prepareSoundPack()]);

    SOUND_EVENTS.forEach((event, index) => {
      const target = cueCopy[event].outcome ? outcomeCues : actionCues;
      target?.appendChild(renderCue(event, index, manifest.cues[event]));
    });

    if (specs) {
      specs.innerHTML = [
        `<span><strong>${SOUND_EVENTS.length}</strong> local cues</span>`,
        `<span><strong>${Math.round(manifest.totalBytes / 1024)} KB</strong> total</span>`,
        `<span><strong>${manifest.sampleRate / 1000} kHz</strong> mono PCM</span>`,
        `<span><strong>${manifest.bitDepth}-bit</strong> deterministic master</span>`,
      ].join("");
    }

    if (status) {
      status.textContent = "Local pack decoded / ready";
      status.dataset.ready = "true";
    }

    sequenceButton?.addEventListener("click", () => {
      if (!sequenceButton || sequenceButton.disabled) return;
      sequenceButton.disabled = true;
      let delay = 0;
      SOUND_EVENTS.forEach((event) => {
        const duration = manifest.cues[event].durationMs;
        window.setTimeout(() => playCue(event, duration), delay);
        delay += duration + 180;
      });
      window.setTimeout(() => {
        sequenceButton.disabled = false;
      }, delay);
    });
  } catch {
    if (status) {
      status.textContent = "Pack failed / fallback remains active";
      status.dataset.ready = "false";
    }
  }
}

muteButton?.addEventListener("click", () => {
  setSoundMuted(!getSoundSettings().muted);
  updateSettingsControls();
});

volumeInput?.addEventListener("input", () => {
  setSoundVolume(Number(volumeInput.value));
  updateSettingsControls();
});

updateSettingsControls();
void initialize();
