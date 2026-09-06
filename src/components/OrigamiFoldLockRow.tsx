import type { PuzzleGroup } from "../game/types/puzzle";
import {
  SOLVED_CARD_DEPTH_CLASSES,
  SOLVED_COLOR_CLASSES,
  SOLVED_GROUP_MARKERS,
} from "../game/solvedColors";

interface Props {
  group: PuzzleGroup;
  colorIndex: number;
  isNew?: boolean;
}

export function OrigamiFoldLockRow({ group, colorIndex, isNew }: Props) {
  const colorClass = SOLVED_COLOR_CLASSES[colorIndex % SOLVED_COLOR_CLASSES.length];
  const depthClass = SOLVED_CARD_DEPTH_CLASSES[colorIndex % SOLVED_CARD_DEPTH_CLASSES.length];
  const marker = SOLVED_GROUP_MARKERS[colorIndex % SOLVED_GROUP_MARKERS.length];

  return (
    <div
      className={`col-span-4 relative flex flex-col justify-center items-center px-3 py-2 rounded-xl text-center select-none will-change-transform overflow-hidden ${colorClass} ${depthClass} ${
        isNew ? "fw-origami-fold-enter" : ""
      } fw-origami-plate min-h-[58px] sm:min-h-[72px] shadow-sm`}
    >
      {/* Origami horizontal paper fold crease */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/20 shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
        aria-hidden="true"
      />

      {/* Category header with marker */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 font-extrabold text-xs sm:text-sm tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
        <span className="opacity-90">{marker}</span>
        <span>{group.label}</span>
      </div>

      {/* Solved items display */}
      <div className="relative z-10 mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] sm:text-[13px] font-medium opacity-95">
        {group.items.map((item, idx) => (
          <span key={item} className="inline-flex items-center">
            {/* Accessible button element to preserve e2e and keyboard focus invariants */}
            <button
              type="button"
              data-key={item}
              data-state="solved"
              aria-pressed="false"
              aria-label={`${item} - solved`}
              disabled
              tabIndex={-1}
              className="cursor-default bg-transparent border-none p-0 text-inherit font-inherit outline-none focus:outline-none"
            >
              {item}
            </button>
            {idx < group.items.length - 1 && (
              <span className="ml-2 opacity-50 select-none" aria-hidden="true">
                •
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
