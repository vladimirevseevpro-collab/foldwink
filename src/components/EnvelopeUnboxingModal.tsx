import { useState } from "react";
import type { SolveRewards } from "../progression/archivistProfile";
import { getGuildRank } from "../progression/archivistProfile";
import { useLang } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";
import { triggerHaptic } from "../haptics/haptics";

interface EnvelopeUnboxingModalProps {
  rewards: SolveRewards;
  onClose: () => void;
}

export function EnvelopeUnboxingModal({ rewards, onClose }: EnvelopeUnboxingModalProps) {
  const [isOpened, setIsOpened] = useState(false);
  const lang = useLang();
  const playSound = useSound();
  const rank = getGuildRank(rewards.newLevel);

  const handleCrackSeal = () => {
    setIsOpened(true);
    playSound("tabReveal");
    triggerHaptic("sealBreak");
  };

  const getStampName = () => {
    if (!rewards.droppedStamp) return "";
    if (lang === "ru") return rewards.droppedStamp.nameRu;
    if (lang === "de") return rewards.droppedStamp.nameDe;
    return rewards.droppedStamp.nameEn;
  };

  const getStampLore = () => {
    if (!rewards.droppedStamp) return "";
    if (lang === "ru") return rewards.droppedStamp.provenanceRu;
    if (lang === "de") return rewards.droppedStamp.provenanceDe;
    return rewards.droppedStamp.provenanceEn;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl text-center">
        {!isOpened ? (
          <div className="space-y-5 py-4">
            <div className="text-xs uppercase tracking-widest font-bold text-muted">
              {lang === "ru"
                ? "📯 Депеша Гильдии Архивариусов"
                : lang === "de"
                  ? "📯 Depesche der Archivarsgilde"
                  : "📯 Archivist Guild Dispatch"}
            </div>

            {/* Tactile Envelope Container */}
            <div
              onClick={handleCrackSeal}
              className="group relative cursor-pointer mx-auto w-56 h-36 rounded-xl border-2 border-dashed border-line bg-surfaceHi/80 hover:bg-surfaceHi transition-all hover:scale-105 shadow-lg flex flex-col items-center justify-center gap-2"
            >
              {/* Wax Seal Button */}
              <div className="w-14 h-14 rounded-full bg-danger border-2 border-dangerHi/60 shadow-md flex items-center justify-center text-2xl animate-pulse group-hover:scale-110 transition-transform">
                🕯️
              </div>
              <span className="text-[11px] font-bold text-accent tracking-wider uppercase">
                {lang === "ru" ? "Сорвать печать" : lang === "de" ? "Siegel brechen" : "Break Wax Seal"}
              </span>
            </div>

            <p className="text-xs text-muted">
              {lang === "ru"
                ? "Нажмите на сургуч, чтобы вскрыть конверт с наградой"
                : lang === "de"
                  ? "Tippe auf das Siegel, um den Umschlag zu öffnen"
                  : "Tap the seal to unbox your solve dispatch"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="text-xs uppercase tracking-widest font-bold text-accent">
              {rewards.contractResult === "won"
                ? (lang === "ru" ? "⚔️ Железный Контракт Выполнен!" : "⚔️ Iron Contract Complete!")
                : (lang === "ru" ? "📜 Награды Архивариуса" : "📜 Dispatch Unboxed")}
            </div>

            {/* Currency rewards */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-2.5 rounded-xl border border-line bg-surfaceHi/50">
                <div className="text-lg font-extrabold text-accent">+{rewards.xpGained}</div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">XP</div>
              </div>
              <div className="p-2.5 rounded-xl border border-line bg-surfaceHi/50">
                <div className="text-lg font-extrabold text-blue-400">+{rewards.inkGained}</div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                  {lang === "ru" ? "Чернила" : "Ink"}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-line bg-surfaceHi/50">
                <div className="text-lg font-extrabold text-amber-400">+{rewards.waxGained}</div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                  {lang === "ru" ? "Сургуч" : "Wax"}
                </div>
              </div>
            </div>

            {/* Level up banner if applicable */}
            {rewards.leveledUp && (
              <div className="p-2.5 rounded-xl border border-accent/60 bg-accent/15 text-xs text-text font-bold animate-bounce">
                🎉 {lang === "ru" ? "Новый Ранг:" : "Rank Up:"} {rank.icon} {lang === "ru" ? rank.titleRu : rank.titleEn} (Lv. {rewards.newLevel})
              </div>
            )}

            {/* Rare Collectible Stamp Card */}
            {rewards.droppedStamp && (
              <div className="p-3 rounded-xl border border-line bg-surfaceHi/70 text-left space-y-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                    <span className="text-base">{rewards.droppedStamp.icon}</span>
                    <span>{getStampName()}</span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider bg-accent/20 text-accent">
                    {rewards.droppedStamp.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-snug italic">
                  "{getStampLore()}"
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent hover:bg-accentHi text-white shadow-md transition-colors cursor-pointer mt-2"
            >
              {lang === "ru" ? "Принять и продолжить" : lang === "de" ? "Weiter" : "Claim & Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
