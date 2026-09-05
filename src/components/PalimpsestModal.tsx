import { useState, useEffect, useRef } from "react";
import {
  getPalimpsestPuzzle,
  findMatchingPalimpsestGroup,
  isPalimpsestOneAway,
  type PalimpsestPuzzle,
} from "../puzzles/palimpsest";
import { useLang, useT } from "../i18n/useLanguage";
import { useSound } from "../audio/useSound";
import { triggerHaptic } from "../haptics/haptics";
import {
  loadArchivistProfile,
  awardPalimpsestCompletion,
} from "../progression/archivistProfile";
import { MistakesDots } from "./MistakesDots";

interface PalimpsestModalProps {
  onClose: () => void;
  onOpenPassport?: () => void;
}

const LAYER_COLORS = [
  "border-amber-500/80 bg-amber-950/40 text-amber-200",
  "border-emerald-500/80 bg-emerald-950/40 text-emerald-200",
  "border-sky-500/80 bg-sky-950/40 text-sky-200",
  "border-purple-500/80 bg-purple-950/40 text-purple-200",
];

function shuffleArray<T>(arr: readonly T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function PalimpsestModal({ onClose, onOpenPassport }: PalimpsestModalProps) {
  const lang = useLang();
  const t = useT();
  const play = useSound();

  const [puzzle] = useState<PalimpsestPuzzle>(() => getPalimpsestPuzzle(lang));
  const [stage, setStage] = useState<"obverse" | "obverse_done" | "reverse" | "completed">("obverse");
  const [isFlipping, setIsFlipping] = useState(false);

  // Active layer cards & gameplay state
  const activeLayer = stage === "reverse" ? puzzle.reverse : puzzle.obverse;
  const [order, setOrder] = useState<string[]>(() => shuffleArray(puzzle.allWords));
  const [selection, setSelection] = useState<string[]>([]);
  const [solvedGroupIds, setSolvedGroupIds] = useState<string[]>([]);
  const [mistakesUsed, setMistakesUsed] = useState(0);
  const [flash, setFlash] = useState<"correct" | "incorrect" | "one-away" | null>(null);
  const [rewardGranted, setRewardGranted] = useState(false);

  // Focus lock
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Map of solved items to their group color
  const solvedColorByItem = new Map<string, string>();
  activeLayer.groups.forEach((g, idx) => {
    if (solvedGroupIds.includes(g.id)) {
      for (const it of g.items) {
        solvedColorByItem.set(it, LAYER_COLORS[idx % LAYER_COLORS.length]);
      }
    }
  });

  const toggleSelect = (word: string) => {
    if (solvedColorByItem.has(word) || stage === "obverse_done" || stage === "completed") return;

    if (selection.includes(word)) {
      setSelection(selection.filter((w) => w !== word));
      play("deselect");
      triggerHaptic("deselect");
    } else {
      if (selection.length >= 4) return;
      setSelection([...selection, word]);
      play("select");
      triggerHaptic("select");
    }
  };

  const handleShuffle = () => {
    const unsolved = order.filter((w) => !solvedColorByItem.has(w));
    const solved = order.filter((w) => solvedColorByItem.has(w));
    const shuffledUnsolved = shuffleArray(unsolved);
    setOrder([...solved, ...shuffledUnsolved]);
    play("deselect");
    triggerHaptic("select");
  };

  const handleClear = () => {
    setSelection([]);
    play("deselect");
  };

  const handleSubmit = () => {
    if (selection.length !== 4) return;

    const matched = findMatchingPalimpsestGroup(selection, activeLayer);
    if (matched) {
      const nextSolved = [...solvedGroupIds, matched.id];
      setSolvedGroupIds(nextSolved);
      setSelection([]);
      setFlash("correct");
      play("correct");
      triggerHaptic("correct");

      setTimeout(() => setFlash(null), 800);

      // Check if all 4 groups of this layer are solved
      if (nextSolved.length === 4) {
        if (stage === "obverse") {
          setTimeout(() => {
            setStage("obverse_done");
            play("win");
            triggerHaptic("win");
          }, 600);
        } else if (stage === "reverse") {
          setTimeout(() => {
            setStage("completed");
            play("win");
            triggerHaptic("win");
            // Award rewards
            awardPalimpsestCompletion(loadArchivistProfile());
            setRewardGranted(true);
          }, 600);
        }
      }
    } else {
      const isOne = isPalimpsestOneAway(selection, activeLayer);
      setMistakesUsed((m) => Math.min(4, m + 1));
      setFlash(isOne ? "one-away" : "incorrect");
      play("wrong");
      triggerHaptic("wrong");
      setTimeout(() => setFlash(null), isOne ? 1200 : 500);
    }
  };

  const handleFlipParchment = () => {
    setIsFlipping(true);
    play("tabReveal");
    triggerHaptic("select");

    setTimeout(() => {
      // Transition to reverse side
      setStage("reverse");
      setSolvedGroupIds([]);
      setSelection([]);
      setMistakesUsed(0);
      setOrder(shuffleArray(puzzle.allWords));
      setIsFlipping(false);
      play("submit");
      triggerHaptic("correct");
    }, 700);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      tabIndex={-1}
      data-testid="palimpsest-modal"
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl border-2 border-[#38433a] bg-[#121713] p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-center transition-transform duration-700 ${
          isFlipping ? "[transform:rotateY(180deg)_scale(0.95)] opacity-40" : ""
        }`}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#252c26] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-sm tracking-wider">
              📜✨ {t.palimpsest.title}
            </span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-200">
              {stage === "reverse" ? t.palimpsest.reverseBadge : t.palimpsest.obverseBadge}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1 text-sm rounded-lg hover:bg-surfaceHi transition-colors"
            data-testid="palimpsest-close"
          >
            ✕
          </button>
        </div>

        {/* Victory Completion Screen */}
        {stage === "completed" ? (
          <div className="py-4 space-y-4 animate-in zoom-in-95 duration-200" data-testid="palimpsest-completed-view">
            {/* Double Archival Wax Seal */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-[#871f1f] border-2 border-[#b53e3e] shadow-xl flex items-center justify-center text-3xl shadow-red-950/80">
                🦅
              </div>
              <div className="text-xl font-black text-[#d4af37]">⚔️</div>
              <div className="w-16 h-16 rounded-full bg-[#871f1f] border-2 border-[#d4af37] shadow-xl flex items-center justify-center text-3xl shadow-amber-950/80 relative">
                📜
                <span className="absolute -bottom-1 text-[8px] font-extrabold tracking-tighter text-[#ffd700] uppercase bg-black/80 px-1 rounded">
                  Dual
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-text">{t.palimpsest.completedTitle}</h2>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                {t.palimpsest.completedDetail}
              </p>
            </div>

            {/* Archival Reward Banner */}
            <div className="p-3.5 rounded-xl border border-amber-500/60 bg-amber-950/30 text-xs text-amber-200 font-semibold space-y-1 shadow-inner">
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                👑 {t.palimpsest.doubleSealBadge}
              </div>
              <div>{t.palimpsest.archivalReward}</div>
              {rewardGranted && (
                <div className="text-[10px] text-amber-300/80 font-normal pt-1">
                  ✓ {lang === "ru" ? "Занесено в Паспорт архивариуса" : lang === "de" ? "Im Archivars-Pass vermerkt" : "Recorded in Archivist Passport"}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {onOpenPassport && (
                <button
                  type="button"
                  onClick={onOpenPassport}
                  className="flex-1 py-2.5 rounded-xl border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  📜 {lang === "ru" ? "Открыть Паспорт" : "Open Passport"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-line bg-surface hover:bg-surfaceHi text-text text-xs font-bold uppercase tracking-wider transition-all"
              >
                {t.palimpsest.backToMenu}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Layer Hint & Description */}
            <div className="text-left bg-surface/50 border border-line rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>{activeLayer.title}</span>
                <MistakesDots used={mistakesUsed} oneAwayLast={flash === "one-away"} />
              </div>
              <p className="text-muted text-[11px] leading-relaxed">{activeLayer.description}</p>
            </div>

            {/* Foldwink Category Tabs for this layer */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {activeLayer.groups.map((g, idx) => {
                const isSolved = solvedGroupIds.includes(g.id);
                const color = LAYER_COLORS[idx % LAYER_COLORS.length];
                const revealLen = Math.min(g.revealHint.length, isSolved ? g.revealHint.length : 1 + solvedGroupIds.length);
                const displayHint = isSolved ? g.label : g.revealHint.slice(0, revealLen) + "·".repeat(Math.max(0, g.revealHint.length - revealLen));

                return (
                  <div
                    key={g.id}
                    className={`rounded-lg border p-1.5 text-center text-[10px] font-bold truncate transition-all ${
                      isSolved
                        ? color
                        : "border-line bg-surfaceHi/50 text-muted"
                    }`}
                    title={isSolved ? g.label : displayHint}
                  >
                    <span className="block truncate">{isSolved ? `✓ ${g.label}` : displayHint}</span>
                  </div>
                );
              })}
            </div>

            {/* 4x4 Interactive Board */}
            <div className="grid grid-cols-4 gap-2 py-1">
              {order.map((word) => {
                const isSolved = solvedColorByItem.has(word);
                const isSelected = selection.includes(word);
                const colorClass = solvedColorByItem.get(word);

                return (
                  <button
                    key={word}
                    type="button"
                    disabled={isSolved || stage === "obverse_done"}
                    onClick={() => toggleSelect(word)}
                    className={`relative min-h-12 rounded-xl border-2 p-2 text-xs font-bold leading-tight uppercase transition-all shadow-sm flex items-center justify-center text-center ${
                      isSolved
                        ? `${colorClass} cursor-default opacity-90`
                        : isSelected
                          ? "border-accent bg-accent/20 text-text shadow-md -translate-y-0.5 scale-[1.02]"
                          : "border-line bg-surface hover:bg-surfaceHi text-text hover:-translate-y-0.5"
                    }`}
                  >
                    <span>{word}</span>
                  </button>
                );
              })}
            </div>

            {/* Status flash message */}
            <div className="h-4 flex items-center justify-center text-[11px] font-bold text-amber-300">
              {flash === "one-away" && <span>✦ {t.game.oneAway}</span>}
              {flash === "incorrect" && <span className="text-red-400">✗ {t.game.incorrectGroup}</span>}
              {flash === "correct" && <span className="text-green-400">✓ {t.game.correctGroup}</span>}
            </div>

            {/* Obverse Solved → Flip Parchment CTA */}
            {stage === "obverse_done" ? (
              <div className="p-4 rounded-xl border border-amber-500/70 bg-amber-950/40 space-y-3 animate-in zoom-in-95 duration-200">
                <div>
                  <div className="text-sm font-extrabold text-amber-200">
                    {t.palimpsest.obverseCompleteTitle}
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {t.palimpsest.obverseCompleteDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFlipParchment}
                  className="w-full py-3 px-4 rounded-xl border-2 border-amber-400 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  data-testid="palimpsest-flip-button"
                >
                  <span>📜</span>
                  <span>{t.palimpsest.flipButton}</span>
                </button>
              </div>
            ) : (
              /* Standard Controls */
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-line">
                <div className="text-xs font-bold text-muted tabular-nums">
                  {selection.length}/4
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="p-2 rounded-xl border border-line bg-surface hover:bg-surfaceHi text-muted hover:text-text text-xs"
                    title={t.game.shuffle}
                  >
                    ⇄
                  </button>

                  <button
                    type="button"
                    disabled={selection.length === 0}
                    onClick={handleClear}
                    className="px-3 py-2 rounded-xl border border-line bg-surface hover:bg-surfaceHi text-muted hover:text-text text-xs font-bold disabled:opacity-40"
                  >
                    {t.game.clear}
                  </button>

                  <button
                    type="button"
                    disabled={selection.length !== 4}
                    onClick={handleSubmit}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      selection.length === 4
                        ? "border-accent bg-accent text-white hover:opacity-90 shadow-md"
                        : "border-line bg-surfaceHi text-muted opacity-40 cursor-not-allowed"
                    }`}
                  >
                    {t.game.submit}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
