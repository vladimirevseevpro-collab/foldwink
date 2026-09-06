import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/state/appStore";
import { Header } from "../components/Header";
import { Grid } from "../components/Grid";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { MistakesDots } from "../components/MistakesDots";
import { FoldwinkTabs } from "../components/FoldwinkTabs";
import { OrigamiFoldLockRow } from "../components/OrigamiFoldLockRow";
import { OrigamiConfetti } from "../components/OrigamiConfetti";
import { SELECTION_SIZE } from "../game/types/game";
import { canSubmit } from "../game/engine/submit";
import { colorIndexForGroup } from "../game/solvedColors";
import { useSound } from "../audio/useSound";
import { useHaptics } from "../haptics/useHaptics";
import {
  playCardClick,
  playHarmonicSolve,
  playErrorThud,
  playOrigamiFold,
  playTensionWobble,
} from "../audio/proceduralSynth";
import { GameTimer } from "../components/GameTimer";
import { useT } from "../i18n/useLanguage";


export function GameScreen() {
  const active = useGameStore((s) => s.active);
  const puzzle = useGameStore((s) => s.puzzle);
  const flash = useGameStore((s) => s.flash);
  const toggleSelection = useGameStore((s) => s.toggleSelection);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const reshuffleActive = useGameStore((s) => s.reshuffleActive);
  const submit = useGameStore((s) => s.submit);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const clearFlash = useGameStore((s) => s.clearFlash);
  const winkTab = useGameStore((s) => s.winkTab);
  const play = useSound();
  const haptic = useHaptics();
  const t = useT();
  const prevSolvedCount = useRef(0);
  const prevWinkedId = useRef<string | null>(null);
  const [quitArmed, setQuitArmed] = useState(false);
  const quitArmTimer = useRef<number | null>(null);

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [latestSolvedColor, setLatestSolvedColor] = useState(0);
  const [newlySolvedGroupId, setNewlySolvedGroupId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (quitArmTimer.current !== null) {
        window.clearTimeout(quitArmTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!active || active.result) return;
    const handler = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "Enter") {
        if (canSubmit(active.selection)) {
          e.preventDefault();
          play("submit");
          haptic("submit");
          submit();
        }
      } else if (e.key === "Escape") {
        if (active.selection.length > 0) {
          e.preventDefault();
          clearSelection();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, submit, clearSelection, play, haptic]);

  const handleQuit = (): void => {
    if (!quitArmed) {
      setQuitArmed(true);
      if (quitArmTimer.current !== null) window.clearTimeout(quitArmTimer.current);
      quitArmTimer.current = window.setTimeout(() => setQuitArmed(false), 3000);
      return;
    }
    if (quitArmTimer.current !== null) window.clearTimeout(quitArmTimer.current);
    goToMenu();
  };

  useEffect(() => {
    if (!flash) return;
    // On a terminal submit the store now holds the board for ~600 ms
    // before flipping to ResultScreen. During that hold both `flash` and
    // `active.result` are set. The win/loss cue below supersedes the
    // generic correct/wrong flash cue, so skip it here to avoid double-
    // playing sound + haptics in the same 600 ms window.
    const terminal = active?.result != null;
    if (flash === "correct" && !terminal) {
      // 2026 ASMR Megatrend: Harmonic Chord Progression on row solves
      // Row 1 = 1.0 (Root C3), Row 2 = 1.25 (Major 3rd E3), Row 3 = 1.5 (Fifth G3)
      const solvedCount = active?.solvedGroupIds.length ?? 1;
      const pitchRatios = [1.0, 1.25, 1.5, 2.0];
      const rate = pitchRatios[Math.min(Math.max(0, solvedCount - 1), pitchRatios.length - 1)] ?? 1.0;
      playHarmonicSolve(Math.min(4, Math.max(1, solvedCount)) as 1 | 2 | 3 | 4);
      playOrigamiFold();
      play("correct", { playbackRate: rate });
      haptic("correct");
    }
    if (flash === "one-away" && !terminal) {
      play("wrong");
      playTensionWobble();
      haptic("oneAway");
    } else if (flash === "incorrect" && !terminal) {
      play("wrong");
      playErrorThud();
      haptic("wrong");
    }
    const id = setTimeout(() => clearFlash(), flash === "one-away" ? 1400 : 450);
    return () => clearTimeout(id);
  }, [flash, active, clearFlash, play, haptic]);

  // Terminal cue — the store now holds the board visible for ~600 ms
  // after a win/loss before flipping to ResultScreen (see RESULT_HOLD_MS
  // in store.ts). Play the win/loss sound at the moment the board
  // finalises so the climax lands on the grid the player was looking at,
  // not on the Result panel.
  const terminalResultPlayed = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !active.result) return;
    const key = `${active.puzzleId}:${active.result}`;
    if (terminalResultPlayed.current === key) return;
    terminalResultPlayed.current = key;
    play(active.result === "win" ? "win" : "loss");
    haptic(active.result === "win" ? "win" : "loss");
  }, [active, play, haptic]);

  useEffect(() => {
    if (!active || !puzzle) {
      prevSolvedCount.current = 0;
      prevWinkedId.current = null;
      return;
    }
    if (active.solvedGroupIds.length > prevSolvedCount.current) {
      const latestId = active.solvedGroupIds[active.solvedGroupIds.length - 1];
      if (latestId) {
        setNewlySolvedGroupId(latestId);
        setLatestSolvedColor(colorIndexForGroup(puzzle, latestId));
        setConfettiTrigger((prev) => prev + 1);
      }
      if (puzzle.difficulty === "medium") {
        play("tabReveal");
      }
    }
    prevSolvedCount.current = active.solvedGroupIds.length;
    if (active.winkedGroupId && active.winkedGroupId !== prevWinkedId.current) {
      play("wink");
      haptic("wink");
    }
    prevWinkedId.current = active.winkedGroupId;
  }, [active, puzzle, play, haptic]);


  if (!active || !puzzle) {
    return (
      <div className="text-center text-muted p-8">
        {t.game.noActiveGame}
        <div className="mt-4">
          <Button onClick={goToMenu}>{t.game.backToMenu}</Button>
        </div>
      </div>
    );
  }

  const solvedItems = new Set<string>();
  const groupColorByItem = new Map<string, number>();
  puzzle.groups.forEach((g) => {
    if (active.solvedGroupIds.includes(g.id)) {
      for (const it of g.items) {
        solvedItems.add(it);
        groupColorByItem.set(it, colorIndexForGroup(puzzle, g.id));
      }
    }
  });

  const selectedSet = new Set(active.selection);

  const handleToggle = (value: string): void => {
    if (active.result) return;
    if (solvedItems.has(value)) return;
    const already = selectedSet.has(value);
    if (!already && active.selection.length >= SELECTION_SIZE) return;

    // Organic pitch variance & dry procedural card click
    const basePitch = already ? 0.94 : [1.0, 1.05, 1.1, 1.15][active.selection.length] ?? 1.0;
    playCardClick(basePitch);
    play(already ? "deselect" : "select", { playbackRate: basePitch * (0.98 + Math.random() * 0.04) });

    haptic(already ? "deselect" : "select");
    toggleSelection(value);
  };

  const handleSubmit = (): void => {
    if (!canSubmit(active.selection)) return;
    play("submit");
    haptic("submit");
    submit();
  };

  const flashRingClass =
    flash === "correct"
      ? "ring-2 ring-solved2"
      : flash === "incorrect"
        ? "ring-2 ring-danger"
        : flash === "one-away"
          ? "ring-2 ring-[#e0b25e]"
          : "";

  return (
    <>
      {flash === "one-away" && !active.result && (
        <div
          className="pointer-events-none fixed inset-0 z-[100] animate-pulse bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-danger/15"
          aria-hidden="true"
        />
      )}
      <div className={`transition-shadow rounded-2xl ${flashRingClass}`}>
        <Header
        title={puzzle.title}
        subtitle={
          `${t.difficulty[puzzle.difficulty].toUpperCase()} · ${
            active.mode === "daily"
              ? t.mode.daily
              : active.mode === "zen"
                ? "ZEN STREAK 🧘"
                : t.mode.standard
          }` +
          (active.mode === "daily" && !active.countsToStats ? ` · ${t.mode.replay}` : "")
        }
        right={
          <div className="flex items-center gap-3">
            <GameTimer startedAt={active.startedAt} endedAt={active.endedAt} ariaLabel={t.game.elapsedAria} />
            <MistakesDots used={active.mistakesUsed} oneAwayLast={flash === "one-away"} />
          </div>
        }
      />
      <FoldwinkTabs
        puzzle={puzzle}
        solvedGroupIds={active.solvedGroupIds}
        winkedGroupId={active.winkedGroupId}
        onWink={winkTab}
        gameEnded={!!active.result}
      />
      <div className="relative">
        <OrigamiConfetti triggerKey={confettiTrigger} colorIndex={latestSolvedColor} />
        <Grid
          label={t.game.gridAria}
          shake={flash === "incorrect" || flash === "one-away"}
        >
          {/* Solved groups displayed as compact origami fold-lock horizontal category bars */}
          {active.solvedGroupIds.map((gId) => {
            const g = puzzle.groups.find((x) => x.id === gId);
            if (!g) return null;
            return (
              <OrigamiFoldLockRow
                key={g.id}
                group={g}
                colorIndex={colorIndexForGroup(puzzle, g.id)}
                isNew={g.id === newlySolvedGroupId}
              />
            );
          })}

          {/* Active unsolved cards */}
          {active.order
            .filter((val) => !solvedItems.has(val))
            .map((value, index) => {
              const isSelected = selectedSet.has(value);
              const state = isSelected ? "selected" : "idle";
              return (
                <Card
                  key={value}
                  value={value}
                  state={state}
                  dealIndex={index}
                  isWobbling={flash === "one-away" && isSelected}
                  wobblePhase={active.selection.indexOf(value)}
                  disabled={!!active.result}
                  onClick={() => handleToggle(value)}
                />
              );
            })}
        </Grid>
      </div>

      <div
        className="mt-2 h-5 flex items-center justify-center text-[11px] uppercase tracking-[0.14em]"
        role="status"
        aria-live="polite"
      >
        {flash === "one-away" && (
          <span className="text-[#e0b25e] font-semibold">✦ {t.game.oneAway}</span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2" aria-live="polite">
          <div
            className="flex gap-1"
            role="img"
            aria-label={t.game.selectedAria(active.selection.length, SELECTION_SIZE)}
          >
            {Array.from({ length: SELECTION_SIZE }).map((_, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${
                  i < active.selection.length ? "bg-accent" : "bg-[#2e343f]"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-text tabular-nums">
            {active.selection.length}/{SELECTION_SIZE}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reshuffleActive} aria-label={t.game.shuffle}>
            <span aria-hidden="true">⇄</span>
          </Button>
          <Button
            variant="secondary"
            onClick={clearSelection}
            disabled={active.selection.length === 0}
          >
            {t.game.clear}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit(active.selection)}
            className={
              canSubmit(active.selection)
                ? "ring-2 ring-accent/40 shadow-[0_0_0_4px_rgba(124,196,255,0.12)]"
                : ""
            }
          >
            {t.game.submit}
          </Button>
        </div>
      </div>
      <div className="mt-6 text-center">
        <button
          className={`text-sm underline underline-offset-2 transition-colors ${
            quitArmed ? "text-danger" : "text-muted hover:text-text"
          }`}
          onClick={handleQuit}
        >
          {quitArmed ? t.game.quitConfirm : t.game.quitToMenu}
        </button>
      </div>
    </div>
    </>
  );
}
