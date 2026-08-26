export type DeskTheme = "walnut" | "matcha" | "midnight" | "manila";

export interface ThemeInfo {
  id: DeskTheme;
  labelEn: string;
  labelRu: string;
  labelDe: string;
  icon: string;
  paletteColor: string;
  unlockSolvedCount: number;
}

export const THEMES: readonly ThemeInfo[] = [
  {
    id: "walnut",
    labelEn: "Evening Walnut",
    labelRu: "Вечерний орех",
    labelDe: "Abend-Walnuss",
    icon: "🌰",
    paletteColor: "#e27a5b",
    unlockSolvedCount: 0,
  },
  {
    id: "matcha",
    labelEn: "Matcha Studio",
    labelRu: "Чайная студия",
    labelDe: "Matcha-Studio",
    icon: "🍵",
    paletteColor: "#60b278",
    unlockSolvedCount: 3,
  },
  {
    id: "midnight",
    labelEn: "Midnight Kyoto",
    labelRu: "Ночной Киото",
    labelDe: "Mitternacht-Kyoto",
    icon: "🌌",
    paletteColor: "#a58ded",
    unlockSolvedCount: 10,
  },
  {
    id: "manila",
    labelEn: "Manila Archive",
    labelRu: "Винтажный архив",
    labelDe: "Manila-Archiv",
    icon: "📜",
    paletteColor: "#df9f43",
    unlockSolvedCount: 20,
  },
];

const THEME_STORAGE_KEY = "foldwink:theme";

export function loadTheme(): DeskTheme {
  if (typeof localStorage === "undefined") {
    return "walnut";
  }
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "matcha" || raw === "midnight" || raw === "manila" || raw === "walnut") {
      return raw;
    }
    return "walnut";
  } catch {
    return "walnut";
  }
}

export function saveTheme(theme: DeskTheme): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch {
    /* storage unavailable */
  }
}

export function applyInitialTheme(): void {
  if (typeof document === "undefined") return;
  const theme = loadTheme();
  document.documentElement.setAttribute("data-theme", theme);
}
