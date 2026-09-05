export const SOUND_EVENTS = [
  "select",
  "deselect",
  "submit",
  "wrong",
  "correct",
  "tabReveal",
  "wink",
  "win",
  "loss",
] as const;

export type SoundEvent = (typeof SOUND_EVENTS)[number];

export const SOUND_CUE_FILES: Record<SoundEvent, string> = {
  select: "select.wav",
  deselect: "deselect.wav",
  submit: "submit.wav",
  wrong: "wrong.wav",
  correct: "correct.wav",
  tabReveal: "tabReveal.wav",
  wink: "wink.wav",
  win: "win.wav",
  loss: "loss.wav",
};

export function getSoundCueUrl(
  event: SoundEvent,
  baseUrl: string = import.meta.env.BASE_URL,
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}audio/${SOUND_CUE_FILES[event]}`;
}
