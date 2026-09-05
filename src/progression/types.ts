export type DisciplineId = "scribe" | "archivist" | "cryptographer" | "curator" | "cartographer";

export interface CollectibleStamp {
  id: string;
  nameEn: string;
  nameRu: string;
  nameDe: string;
  theme: string;
  rarity: "common" | "uncommon" | "rare" | "mythic";
  icon: string;
  color: string;
  provenanceEn: string;
  provenanceRu: string;
  provenanceDe: string;
}

export interface ArchivistProfile {
  version: 1;
  level: number;
  xp: number;
  ink: number;
  wax: number;
  prestige: number;
  discipline: DisciplineId;
  sealId: string;
  nibId: string;
  titleId: string;
  collectedStampIds: string[];
  contractsAttempted: number;
  contractsWon: number;
  activeContract: {
    active: boolean;
    wagerWax: number;
    rule: "sudden_death";
  } | null;
  playerSeed?: string;
}

export interface GuildRank {
  tier: number;
  titleEn: string;
  titleRu: string;
  titleDe: string;
  minLevel: number;
  icon: string;
}

export const GUILD_RANKS: readonly GuildRank[] = [
  { tier: 1, minLevel: 1, titleEn: "Novice Scribe", titleRu: "Ученик писца", titleDe: "Schreiber-Lehrling", icon: "📜" },
  { tier: 2, minLevel: 3, titleEn: "Desk Apprentice", titleRu: "Подмастерье стола", titleDe: "Tisch-Geselle", icon: "✒️" },
  { tier: 3, minLevel: 6, titleEn: "Junior Archivist", titleRu: "Младший архивариус", titleDe: "Junior-Archivar", icon: "📯" },
  { tier: 4, minLevel: 10, titleEn: "Guild Correspondent", titleRu: "Корреспондент гильдии", titleDe: "Gilden-Korrespondent", icon: "💌" },
  { tier: 5, minLevel: 15, titleEn: "Cipher Keeper", titleRu: "Хранитель шифров", titleDe: "Chiffren-Hüter", icon: "🗝️" },
  { tier: 6, minLevel: 22, titleEn: "Master Cryptographer", titleRu: "Мастер-криптограф", titleDe: "Meister-Kryptograph", icon: "🔮" },
  { tier: 7, minLevel: 30, titleEn: "Curator of Lost Things", titleRu: "Куратор утраченного", titleDe: "Kurator des Verborgenen", icon: "🏛️" },
  { tier: 8, minLevel: 40, titleEn: "Grand Archivist", titleRu: "Верховный архивариус", titleDe: "Großarchivar", icon: "👑" },
  { tier: 9, minLevel: 50, titleEn: "Keeper of the Black Seal", titleRu: "Хранитель Чёрной Печати", titleDe: "Hüter des Schwarzen Siegels", icon: "🖤" },
];
