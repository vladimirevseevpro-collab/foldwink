import type { Lang } from "./strings";

/**
 * Grade and archetype copy is produced by pure engine functions in English
 * (they are also used by tests and the share string). The Result screen
 * localizes it here so RU/DE players no longer see "Clean solve · 1 mistake"
 * or "Speed Demon" in English.
 */
const RESULT_LABELS: Record<string, { ru: string; de: string }> = {
  // grades
  "Close call": { ru: "Совсем рядом", de: "Knapp daneben" },
  "Flawless · No Wink": { ru: "Без ошибок и без Wink", de: "Fehlerfrei ohne Wink" },
  "Medium solved clean": { ru: "Средний решён чисто", de: "Mittel sauber gelöst" },
  "No-Wink Medium": { ru: "Средний без Wink", de: "Mittel ohne Wink" },
  Flawless: { ru: "Без ошибок", de: "Fehlerfrei" },
  "Clean solve": { ru: "Чистое решение", de: "Sauber gelöst" },
  "Steady solve": { ru: "Уверенное решение", de: "Solide gelöst" },
  Clutch: { ru: "На волоске", de: "Auf den letzten Drücker" },
  "0 mistakes": { ru: "0 ошибок", de: "0 Fehler" },
  "1 mistake": { ru: "1 ошибка", de: "1 Fehler" },
  "2 mistakes": { ru: "2 ошибки", de: "2 Fehler" },
  "One away": { ru: "Одна ошибка в запасе", de: "Ein Fehler übrig" },
  // archetypes (title + share badge)
  "The Persistent": { ru: "Упорство", de: "Hartnäckig" },
  PERSISTENT: { ru: "УПОРСТВО", de: "HARTNÄCKIG" },
  "Speed Demon": { ru: "Молния", de: "Blitzschnell" },
  "SPEED DEMON": { ru: "МОЛНИЯ", de: "BLITZSCHNELL" },
  "The Sniper": { ru: "Снайпер", de: "Scharfschütze" },
  "THE SNIPER": { ru: "СНАЙПЕР", de: "SCHARFSCHÜTZE" },
  "The Gambler": { ru: "Ва-банк", de: "Zocker" },
  "THE GAMBLER": { ru: "ВА-БАНК", de: "ZOCKER" },
  "The Purist": { ru: "Без подсказок", de: "Purist" },
  "THE PURIST": { ru: "БЕЗ ПОДСКАЗОК", de: "PURIST" },
  "The Detective": { ru: "Сыщик", de: "Detektiv" },
  "THE DETECTIVE": { ru: "СЫЩИК", de: "DETEKTIV" },
  "The Strategist": { ru: "Стратег", de: "Stratege" },
  "THE STRATEGIST": { ru: "СТРАТЕГ", de: "STRATEGE" },
};

export function localizeResultLabel<T extends string | null>(text: T, lang: Lang): T {
  if (text === null || lang === "en") return text;
  const entry = RESULT_LABELS[text];
  return (entry ? entry[lang] : text) as T;
}
