import { useEffect, useRef, useState } from "react";
import type { Puzzle } from "../game/types/puzzle";
import { buildFoldwinkTabs } from "../game/engine/foldwinkTabs";
import { colorIndexForGroup, SOLVED_COLOR_CLASSES } from "../game/solvedColors";
import { MOTION_CLASS } from "../styles/motion";
import { useT } from "../i18n/useLanguage";
import { FoldedCorner } from "./FoldedCorner";
import { WinkSparkles } from "./WinkSparkles";

// Split the revealed label into per-character spans so the Wink CSS
// keyframe can stagger each letter's fade-in via an index CSS var.
// The stagger is purely cosmetic; aria-label still carries the full word.
function renderWinkedLabel(text: string): React.ReactNode {
  let letterIndex = 0;
  return text.split(/(\s+)/).map((part, partIndex) => {
    if (/^\s+$/.test(part)) return part;
    return (
      <span key={partIndex} className="fw-wink-word">
        {Array.from(part).map((ch) => {
          const index = letterIndex++;
          return (
            <span
              key={index}
              className="fw-wink-letter"
              style={{ ["--i" as string]: index } as React.CSSProperties}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  });
}

function tabTextClass(label: string): string {
  if (label.length > 32) return "text-[10px] leading-3";
  if (label.length > 18) return "text-xs leading-3.5";
  return "text-sm leading-tight";
}

interface Props {
  puzzle: Puzzle;
  solvedGroupIds: readonly string[];
  winkedGroupId: string | null;
  onWink: (groupId: string) => void;
  gameEnded: boolean;
}

const TAB_ROTATIONS = ["-rotate-[0.5deg]", "rotate-[0.4deg]", "-rotate-[0.3deg]", "rotate-[0.5deg]"];

export function FoldwinkTabs({
  puzzle,
  solvedGroupIds,
  winkedGroupId,
  onWink,
  gameEnded,
}: Props) {
  const t = useT();
  const [armedGroupId, setArmedGroupId] = useState<string | null>(null);
  const armTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current);
    };
  }, []);

  const handleTabClick = (groupId: string): void => {
    if (armedGroupId === groupId) {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current);
      setArmedGroupId(null);
      onWink(groupId);
      return;
    }
    if (armTimer.current !== null) window.clearTimeout(armTimer.current);
    setArmedGroupId(groupId);
    armTimer.current = window.setTimeout(() => setArmedGroupId(null), 3000);
  };

  const tabs = buildFoldwinkTabs(puzzle, solvedGroupIds, winkedGroupId);
  if (tabs.length === 0) return null;

  const winkAvailable = puzzle.difficulty === "medium" && winkedGroupId === null && !gameEnded;
  const stageKey = solvedGroupIds.length;

  return (
    <div className="mb-2.5 sm:mb-3 max-w-[760px] mx-auto" role="group" aria-label={t.tabs.label}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] uppercase tracking-wider text-muted font-bold">
          {t.tabs.label}
        </span>
        <span className="text-[11px] text-muted flex items-center gap-2 font-medium">
          <span>{t.tabs.solvedCount(solvedGroupIds.length, 4)}</span>
          {puzzle.difficulty === "medium" && (
            <>
              <span className="text-muted">·</span>
              {winkAvailable ? (
                <span className="text-accent font-bold">{t.tabs.winkReady}</span>
              ) : winkedGroupId ? (
                <span className="text-muted">{t.tabs.winkUsed}</span>
              ) : (
                <span className="text-muted">{t.tabs.winkShort}</span>
              )}
            </>
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab, idx) => {
          const colorIdx = colorIndexForGroup(puzzle, tab.groupId);
          const rot = TAB_ROTATIONS[idx % TAB_ROTATIONS.length];
          const base = `relative h-14 overflow-hidden rounded-t-xl rounded-b-[4px] border border-b-2 px-2 py-1.5 font-bold text-center whitespace-normal break-words flex items-center justify-center shadow-tab3D ${rot} before:absolute before:inset-x-2 before:top-1 before:h-[1px] before:bg-white/35 ${tabTextClass(tab.display)} ${MOTION_CLASS.baseTransition} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface`;
          const clickable = winkAvailable && !tab.solved;

          const showWinkMark = tab.winked || (tab.solved && winkedGroupId === tab.groupId);

          const isArmed = clickable && armedGroupId === tab.groupId;
          let cls: string;
          if (tab.solved) {
            cls = `${base} ${SOLVED_COLOR_CLASSES[colorIdx]}`;
          } else if (tab.winked) {
            cls = `${base} bg-paper border-accent text-ink ${MOTION_CLASS.tabFlap}`;
          } else if (isArmed) {
            cls = `${base} bg-paperHi border-2 border-accent text-ink cursor-pointer -translate-y-px shadow-paperSelected`;
          } else if (clickable) {
            cls = `${base} bg-paper text-ink border-paperEdge tabular-nums hover:border-accent hover:-translate-y-0.5 cursor-pointer`;
          } else {
            cls = `${base} bg-surfaceHi border-line text-text tabular-nums`;
          }

          const ariaLabel = tab.solved
            ? t.tabs.solvedAria(tab.display)
            : tab.winked
              ? t.tabs.winkedAria(tab.display)
              : clickable
                ? t.tabs.clickAria
                : t.tabs.concealedAria;

          const revealCls = tab.solved ? "" : `${MOTION_CLASS.tabReveal} ${MOTION_CLASS.tabFlap}`;

          if (clickable) {
            return (
              <button
                key={`${tab.groupId}:${stageKey}`}
                type="button"
                className={`${cls} ${revealCls} ${MOTION_CLASS.press}`}
                aria-label={ariaLabel}
                onClick={() => handleTabClick(tab.groupId)}
              >
                {isArmed && <FoldedCorner />}
                {isArmed ? `✦ ${t.tabs.winkConfirm}` : tab.display}
              </button>
            );
          }

          // Celebrate the Wink payoff: when a tab is winked (and not yet
          // solved), render the label letter-by-letter with a staggered
          // fade so the reveal feels like something the player chose,
          // not a silent text swap.
          const content =
            tab.winked && !tab.solved ? renderWinkedLabel(tab.display) : tab.display;
          return (
            <div
              key={`${tab.groupId}:${stageKey}`}
              className={`${cls} ${revealCls}`}
              aria-label={ariaLabel}
            >
              {tab.winked && !tab.solved && <WinkSparkles />}
              {tab.winked && !tab.solved && <FoldedCorner />}
              {showWinkMark && (
                <span className="mr-1" aria-hidden="true">
                  ✦
                </span>
              )}
              {content}
            </div>
          );
        })}
      </div>
      <div className="mx-2 h-[3px] rounded-b bg-line" aria-hidden="true" />
    </div>
  );
}
