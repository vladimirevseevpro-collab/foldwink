import { useState } from "react";
import {
  loadArchivistProfile,
  saveArchivistProfile,
  getGuildRank,
  getXpForLevel,
} from "../progression/archivistProfile";
import { STAMP_COLLECTION, SEALS, NIBS, TITLES } from "../progression/stamps";
import { useLang } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";

interface ArchivistPassportModalProps {
  onClose: () => void;
  onOpenContract?: () => void;
}

export function ArchivistPassportModal({ onClose, onOpenContract }: ArchivistPassportModalProps) {
  const [profile, setProfile] = useState(loadArchivistProfile);
  const [activeTab, setActiveTab] = useState<"passport" | "stamps">("passport");
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const lang = useLang();
  const playSound = useSound();

  const rank = getGuildRank(profile.level);
  const curLevelXp = getXpForLevel(profile.level);
  const nextLevelXp = getXpForLevel(profile.level + 1);
  const xpProgress = Math.min(
    100,
    Math.max(0, ((profile.xp - curLevelXp) / Math.max(1, nextLevelXp - curLevelXp)) * 100),
  );

  const handleUpdateField = (key: "sealId" | "nibId" | "titleId", val: string) => {
    const next = { ...profile, [key]: val };
    setProfile(next);
    saveArchivistProfile(next);
    playSound("select");
  };

  const getRankTitle = () => {
    if (lang === "ru") return rank.titleRu;
    if (lang === "de") return rank.titleDe;
    return rank.titleEn;
  };

  const getTitleLabel = (tId: string) => {
    const item = TITLES.find((t) => t.id === tId) ?? TITLES[0];
    if (lang === "ru") return item.labelRu;
    if (lang === "de") return item.labelDe;
    return item.labelEn;
  };

  const selectedStamp = STAMP_COLLECTION.find((s) => s.id === selectedStampId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("passport")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "passport" ? "bg-accent text-white" : "text-muted hover:text-text"
              }`}
            >
              📜 {lang === "ru" ? "Паспорт" : lang === "de" ? "Pass" : "Passport"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stamps")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "stamps" ? "bg-accent text-white" : "text-muted hover:text-text"
              }`}
            >
              💌 {lang === "ru" ? "Альбом Марок" : lang === "de" ? "Marken-Album" : "Stamp Album"} ({profile.collectedStampIds.length}/{STAMP_COLLECTION.length})
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text text-sm p-1"
          >
            ✕
          </button>
        </div>

        {activeTab === "passport" ? (
          <div className="space-y-4">
            {/* Vintage Guild Passport Card */}
            <div className="rounded-xl border-2 border-line bg-surfaceHi/60 p-4 relative overflow-hidden shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted">
                    Guild of Archivists
                  </div>
                  <div className="text-base font-extrabold text-text flex items-center gap-1.5">
                    <span>{rank.icon}</span>
                    <span>{getRankTitle()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-accent">Lv. {profile.level}</div>
                  <div className="text-[10px] text-muted">{profile.xp} XP</div>
                </div>
              </div>

              {/* XP Progress bar */}
              <div className="w-full bg-line/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>

              {/* Balances */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-blue-400">💧 {profile.ink}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Чернила" : "Ink"}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-amber-400">🕯️ {profile.wax}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Сургуч" : "Wax"}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-yellow-300">👑 {profile.prestige}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">Prestige</div>
                </div>
                <div className="p-1.5 rounded-lg bg-surface/80 border border-line">
                  <div className="text-xs font-bold text-red-400">⚔️ {profile.contractsWon}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">{lang === "ru" ? "Контракты" : "Trials"}</div>
                </div>
              </div>
            </div>

            {/* Customization: Title, Seal, Nib */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                  {lang === "ru" ? "Официальный Титул" : "Official Guild Title"}
                </label>
                <select
                  value={profile.titleId}
                  onChange={(e) => handleUpdateField("titleId", e.target.value)}
                  className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                >
                  {TITLES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {getTitleLabel(t.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "ru" ? "Личная Печать" : "Wax Seal"}
                  </label>
                  <select
                    value={profile.sealId}
                    onChange={(e) => handleUpdateField("sealId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {SEALS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                    {lang === "ru" ? "Перо Мастера" : "Scribe Nib"}
                  </label>
                  <select
                    value={profile.nibId}
                    onChange={(e) => handleUpdateField("nibId", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surfaceHi p-2 text-xs text-text font-medium"
                  >
                    {NIBS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Iron Contract CTA */}
            {onOpenContract && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContract();
                }}
                className="w-full py-2.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-950/50 text-red-200 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>⚔️</span>
                <span>{lang === "ru" ? "Железный Контракт (Высокие Ставки)" : "The Iron Contract (High Stakes)"}</span>
              </button>
            )}
          </div>
        ) : (
          /* Stamp Album Tab */
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {STAMP_COLLECTION.map((stamp) => {
                const isCollected = profile.collectedStampIds.includes(stamp.id);
                return (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => setSelectedStampId(stamp.id)}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all ${
                      isCollected
                        ? "border-accent/60 bg-surfaceHi/80 hover:scale-105 shadow-sm"
                        : "border-line/40 opacity-30 bg-surfaceHi/20 cursor-default"
                    }`}
                  >
                    <span className="text-2xl">{isCollected ? stamp.icon : "🔒"}</span>
                    <span className="text-[9px] text-muted font-bold truncate max-w-full mt-1">
                      {isCollected ? stamp.theme : "???"}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedStamp && (
              <div className="p-3 rounded-xl border border-line bg-surfaceHi text-left space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-text flex items-center gap-1.5">
                    <span>{selectedStamp.icon}</span>
                    <span>
                      {lang === "ru"
                        ? selectedStamp.nameRu
                        : lang === "de"
                          ? selectedStamp.nameDe
                          : selectedStamp.nameEn}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-accent/20 text-accent">
                    {selectedStamp.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-muted italic">
                  "{lang === "ru"
                    ? selectedStamp.provenanceRu
                    : lang === "de"
                      ? selectedStamp.provenanceDe
                      : selectedStamp.provenanceEn}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
