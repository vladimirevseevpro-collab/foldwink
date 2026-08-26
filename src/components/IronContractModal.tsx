import { useState } from "react";
import { loadArchivistProfile, startIronContract } from "../progression/archivistProfile";
import { useGameStore } from "../game/state/appStore";
import { useLang } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";

interface IronContractModalProps {
  onClose: () => void;
}

export function IronContractModal({ onClose }: IronContractModalProps) {
  const [profile, setProfile] = useState(loadArchivistProfile);
  const startMedium = useGameStore((s) => s.startMedium);
  const lang = useLang();
  const playSound = useSound();
  const wager = 2;
  const canAfford = profile.wax >= wager;

  const handleSignContract = () => {
    if (!canAfford) return;
    const updated = startIronContract(profile, wager);
    if (!updated) return;
    setProfile(updated);
    playSound("submit");
    onClose();
    // Launch game into high-stakes medium puzzle
    startMedium();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl border-2 border-red-900/60 bg-[#141010] p-6 shadow-2xl space-y-4 text-center">
        {/* Black Seal Crest */}
        <div className="w-14 h-14 mx-auto rounded-full bg-red-950 border-2 border-red-600/50 flex items-center justify-center text-2xl shadow-inner">
          ⚔️
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-red-400">
            {lang === "ru" ? "Тайная Комиссия Гильдии" : "Guild Secret Commission"}
          </div>
          <h3 className="text-base font-extrabold text-white">
            {lang === "ru" ? "Железный Контракт" : "The Iron Contract"}
          </h3>
        </div>

        {/* Contract Conditions */}
        <div className="rounded-xl border border-red-950 bg-black/40 p-3.5 text-left text-xs space-y-2 text-red-100/90">
          <div className="flex items-center justify-between font-bold text-red-300">
            <span>{lang === "ru" ? "Условие:" : "Condition:"}</span>
            <span className="uppercase text-[10px] tracking-wider bg-red-900/40 px-2 py-0.5 rounded text-red-200">
              Sudden Death
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {lang === "ru"
              ? "Расшифруйте депешу уровня Medium. Допустима только 1 ошибка. В случае поражения ставка сгорает."
              : "Solve a Medium dispatch with max 1 mistake. If failed, the staked wax is lost."}
          </p>

          <div className="pt-2 border-t border-red-950/60 flex items-center justify-between text-xs">
            <span className="text-muted">{lang === "ru" ? "Ставка:" : "Stake:"}</span>
            <span className="font-bold text-amber-400">🕯️ {wager} {lang === "ru" ? "Сургуча" : "Wax"}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-yellow-300">
            <span>{lang === "ru" ? "Награда за победу:" : "Win Reward:"}</span>
            <span>👑 1 Prestige + 🕯️ {wager * 2} Wax + Gold Stamp</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={!canAfford}
            onClick={handleSignContract}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
              canAfford
                ? "bg-red-700 hover:bg-red-600 text-white cursor-pointer"
                : "bg-red-950/40 text-red-400/40 cursor-not-allowed border border-red-950"
            }`}
          >
            {canAfford
              ? (lang === "ru" ? "Скрепить печатью и начать" : "Seal & Accept Contract")
              : (lang === "ru" ? `Недостаточно сургуча (нужно ${wager})` : `Need ${wager} Wax to Enter`)}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs text-muted hover:text-text transition-colors"
          >
            {lang === "ru" ? "Отклонить" : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}
