# Foldwink Master Mega Prompt for Claude Code

> **Historical MVP bootstrap prompt — not the active product specification.**
> Its English-only, no-monetization, small-pool and generic dependency-installation instructions do not govern the current EN/RU/DE Foldwink product. The active execution contract is `docs/FOLDWINK_IMPLEMENTATION_SPEC_2026-09-12.md` together with `docs/decisions/ADR-001-product-baseline.md` and `docs/decisions/ADR-002-persistence.md`. The historical body below is preserved as provenance.

Paste the full block below into Claude Code at the repository root.

This prompt combines the bootstrap, one-shot, and bypass-permissions execution variants into a single high-autonomy build prompt for the Foldwink MVP.

```text
You are the principal builder for this repository.
Treat this run as a focused build sprint for one objective: ship the smallest correct Foldwink MVP.

Operate as a disciplined product+engineering lead, not as a brainstorming partner.
Your job is to execute, not brainstorm.
Make the smallest correct decisions, document them, implement them, test them, and keep moving.
Do not ask for approval on routine implementation choices.
Do not pause for low-risk permission confirmations.
Do not widen scope.
Do not re-litigate product decisions already captured in the repo docs.

# Mission
Build a clean, playable, web-first Foldwink MVP in this repository.
The MVP must include:
- 16-card grid
- 4 hidden groups of 4
- select/deselect cards
- submit validation
- solved groups lock in
- max 4 mistakes
- win/loss states
- standard puzzle mode
- deterministic daily puzzle mode
- local stats only
- mobile-friendly UI

No backend. No auth. No analytics SDK. No ads. No monetization logic. No cloud sync. No leaderboard. No overengineering.

# Repository instructions to obey first
Read these files first and treat them as source of truth:
- CLAUDE.md
- docs/PROJECT_SPEC.md
- docs/ARCHITECTURE.md
- docs/PUZZLE_SCHEMA.md
- docs/CONTENT_GUIDELINES.md
- docs/MVP_TASK_GRAPH.md
- docs/STYLE_SYSTEM.md
- docs/QA_CHECKLIST.md
- docs/RELEASE_CHECKLIST.md
- docs/PROMPTS.md

Also inspect:
- puzzles/examples/
- scripts/

# Operating contract for this run
Assume you are allowed to:
- read and write files inside this repository
- scaffold and modify app code
- install ordinary project dependencies if needed
- run local project commands such as install, typecheck, test, lint, build, and local validation scripts

Do NOT do any of the following unless they are already explicitly part of the repository workflow:
- touch files outside the repository
- delete large parts of the repo unless replacement is immediate and clearly necessary
- add secrets
- call external paid APIs
- create backend infrastructure
- introduce hosted services
- add tracking or monetization code
- perform risky shell actions unrelated to the MVP

# Operating mode
Act with high autonomy.
Move forward continuously.
Do not stop for non-critical questions.
If a choice is small and reversible, choose the simplest option, document it, and proceed.
If a blocker is material, present exactly 2 options, choose 1, and continue with the chosen option unless prevented by a hard failure.
Keep changes small and reviewable, but do not wait for approval between milestones.

Use subagents proactively where useful, especially:
- scope-keeper
- frontend-implementer
- puzzle-designer
- puzzle-validator
- qa-edge-tester
- release-manager

# Mandatory execution sequence
Follow this exact order.

## Phase 1 — Discovery and freeze
Before app code changes, create or update:
- docs/MVP_DECISIONS.md
- docs/TODO.md
- docs/BUILD_PLAN.md

`docs/MVP_DECISIONS.md` must include:
- stack confirmation
- assumptions
- unresolved non-blocking ambiguities
- recommended defaults
- defaults chosen without user input
- risk register
- milestone plan

`docs/TODO.md` must include sections:
- current phase
- in progress
- next
- blocked
- done

`docs/BUILD_PLAN.md` must include:
- exact build order
- test checkpoints
- definition of MVP completion

Do not write app code before these files exist.

## Phase 2 — Minimal scaffold
Scaffold or refine a minimal web app setup.
Preferred stack:
- React + TypeScript + Vite
- lightweight styling path only
- minimal dependencies

Rules:
- do not introduce unnecessary routing complexity
- do not introduce heavy state libraries unless clearly justified
- use Tailwind only if it meaningfully speeds implementation; otherwise choose the simpler styling path and document it
- prefer CSS modules or simple CSS if faster than Tailwind
- keep structure aligned with repo docs

Ensure startup instructions are correct.
Add or update a clear local startup section in README.md.

## Phase 3 — Core domain and engine
Implement the game domain as testable pure logic wherever possible.
Create or refine modules for:
- puzzle types/schema
- puzzle normalization
- game session state
- select/deselect logic
- submit validation
- solved group extraction
- mistake tracking
- win/loss detection
- deterministic daily puzzle selection by date/seed
- local stats persistence

The core game logic must be separable from rendering.
The pure game logic must be unit-testable without rendering.

## Phase 4 — UI MVP only
Build only the screens needed to finish MVP:
- main menu
- puzzle screen
- result screen
- stats screen

Required interactions:
- tap/click cards to select/deselect
- show selected count
- allow submit only when exactly 4 selected
- clear selection action
- visually lock solved groups
- show mistakes left
- show elapsed time if already simple enough
- show victory/defeat result
- navigate to next standard puzzle and daily puzzle

UI principles:
- clean
- readable
- mobile-first
- minimal animation
- minimal chrome
- accessible contrast
- no routing complexity unless clearly justified

## Phase 5 — Content pipeline
Implement and/or refine:
- puzzle schema/types
- validator script
- duplicate detection
- basic ambiguity-risk checks if feasible without overengineering

Validator must check at minimum:
- correct shape
- exactly 4 groups
- exactly 4 items per group
- duplicate item detection across the puzzle
- label presence

Expand puzzle content toward at least 30 curated puzzles.
Do not trust generated content blindly.
Validate all included puzzles.
Revise weak puzzles.
If generating puzzle drafts, validate and revise before inclusion.

## Phase 6 — Verification
Run and fix, in this order where practical:
- install dependencies if needed
- typecheck
- tests
- lint only if already part of the repo or fast to add
- production build
- puzzle validation script
- manual QA pass against docs/QA_CHECKLIST.md

Record findings in:
- docs/QA_NOTES.md

## Phase 7 — Release prep
Create or update:
- README.md
- docs/RELEASE_NOTES.md
- docs/KNOWN_LIMITATIONS.md
- docs/DEPLOY.md

Also ensure:
- accurate app title is set to Foldwink
- project title is set consistently
- favicon placeholder exists if practical
- basic metadata/basic description exists
- startup instructions are accurate
- build instructions are accurate
- validation instructions are documented
- deployment notes are documented

# Constraints and scope guardrails
Do not add:
- backend
- auth
- accounts
- online sync
- cloud sync
- leaderboard
- analytics SDK
- ads
- premium packs
- monetization flows
- localization beyond English
- procedural runtime generation
- unnecessary router/state abstractions
- heavy animation libraries

Do not widen the product into a platform.
Do not invent features outside the spec just because they are easy.
Do not spend time polishing what is not part of MVP completion.

# Decision rules
When in doubt:
1. Prefer simpler implementation.
2. Prefer local files over services.
3. Prefer pure functions over hidden logic in components.
4. Prefer one working screen over multiple speculative screens.
5. Prefer content quality over content volume.
6. Prefer documented defaults over asking questions.

# Required artifacts by the end
By the end of the run, the repository must contain at least:
- working app code
- validated puzzle content
- tests for core logic
- docs/MVP_DECISIONS.md
- docs/TODO.md
- docs/BUILD_PLAN.md
- docs/QA_NOTES.md
- docs/RELEASE_NOTES.md
- docs/KNOWN_LIMITATIONS.md
- docs/DEPLOY.md
- updated README.md

# Progress reporting behavior
At the end of each completed phase:
1. Summarize what changed.
2. Update docs/TODO.md.
3. State the next smallest high-value step.
4. Continue automatically unless a hard blocker prevents progress.

# Definition of done
The task is done only when all of the following are true:
- app starts locally
- at least one complete game can be played end-to-end
- daily puzzle mode works deterministically
- standard puzzle mode works
- local stats persist correctly
- included puzzles pass validation
- production build completes successfully

# Hard reset follow-up if you drift
If you start drifting, overengineering, or asking unnecessary questions, immediately self-correct and continue with this instruction:

Reset to execution mode.
Return to the smallest correct Foldwink MVP.
Do not widen scope.
Do not ask non-critical questions.
Finish the current phase, update docs/TODO.md, and continue.
```
