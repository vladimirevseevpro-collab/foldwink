# Foldwink — Comprehensive Project Knowledge Base

> **Single Source of Truth** for game design, architecture, content, infrastructure, contacts, and links.

---

## 1. Executive Summary & Brand Identity

- **Game Name:** Foldwink
- **Brand / Studio:** Neural Void (`https://neural-void.com`)
- **Tagline / Lockup:** "Foldwink by Neural Void"
- **Product Definition:** A minimalist, web-first daily grouping/word puzzle game where the player identifies 4 hidden groups of 4 related items from a 4×4 grid of 16 cards.
- **Design Philosophy:** Minimalist, tactile, distraction-free indie experience with zero casino/FOMO hooks, local-first privacy, and clean aesthetics (paper / card / ceramic / wood tactile theme).

---

## 2. Web Sites, URLs & Platforms

| Resource                | Canonical URL                                                  | Notes                                                                        |
| :---------------------- | :------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **Canonical Web / PWA** | `https://neural-void.com/foldwink/`                            | Primary player-facing entry point (direct web / standalone PWA)              |
| **Studio Website**      | `https://neural-void.com`                                      | Neural Void studio homepage                                                  |
| **GitHub Repository**   | `https://github.com/sunlike78/foldwink`                        | Main source repository                                                       |
| **GitHub Pages Mirror** | `https://sunlike78.github.io/foldwink/`                        | Public CI/CD preview & staging deployment                                    |
| **Itch.io Page**        | `https://neural-void.itch.io/foldwink`                         | Indie distribution page (HTML5 embed / download)                             |
| **Cloudflare Pages**    | Project `neural-void-site`, target `neural-void/foldwink:html` | Production hosting infrastructure (managed via `C:/AI/neural-void.com/site`) |
| **Local Workspace**     | `C:\AI\Games\Foldwink`                                         | Active development root directory; old path is a junction                   |

---

## 3. Contacts & Emails

| Contact Type                    | Address                    | Usage                                                                              |
| :------------------------------ | :------------------------- | :--------------------------------------------------------------------------------- |
| **Official Support & Feedback** | `foldwink@neural-void.com` | Embedded in `AboutFooter`, Itch metadata, OG tags, and player support mailto links |
| **Creator / Developer**         | `sunlike78@gmail.com`      | Lead developer (Vladimir / sunlike78)                                              |

---

## 4. Core Game Mechanics & Rules

### 4.1 Board & Selection

- **Grid:** 16 cards displayed in a 4×4 grid.
- **Selection:** Player selects up to 4 cards; tapping a selected card deselects it.
- **Submission:** Enabled only when exactly 4 cards are selected.
- **Validation:**
  - **Correct:** Group locks in with its distinct category color/tint and moves to the solved state.
  - **Incorrect:** Consumes 1 mistake.
- **Failure Budget:** Exactly **4 mistakes max** before game over (Loss).
- **Victory:** All 4 groups solved before exhausting mistakes (Win).

### 4.2 Difficulty Tiers & The "Wink" System

- **Easy Mode:** 16 cards only. No Foldwink Tabs or Wink mechanic.
- **Medium & Hard Modes (Foldwink Tabs + Wink):**
  - **Foldwink Tabs:** A row of 4 tabs above the grid. Each tab starts as a single-letter clue for a category.
  - **Incremental Clues:** Solving any group reveals +1 additional letter on all remaining unsolved tabs.
  - **The Wink Affordance:** Once per game, the player can tap any unsolved tab to **"Wink"** it — instantly revealing the full category label. Winking is free, optional, capped at 1 per puzzle, and does **not** solve the cards (player must still find the 4 items).

### 4.3 Game Modes & Progression

- **Daily Mode:** Deterministic daily puzzle selected via FNV-1a hash of the local date string (`YYYY-MM-DD`). Everyone plays the exact same puzzle on the same day. Replaying a completed daily does not alter historical stats.
- **Standard Mode (Pool / Archive):** Sequential progression through curated puzzle pools.
- **7-Day Daily Fold:** Weekly calendar view in Menu and Stats modal for recent daily challenges.
- **Local Persistence:** All stats, win streaks, history, and audio settings are saved exclusively in `localStorage` on the player's device.

---

## 5. Technical Architecture & Stack

### 5.1 Frontend Core

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (custom tokens, warm minimalist palette, no external motion libraries)
- **State Management:** Zustand stores (`gameStore`, `audioStore`, `settingsStore`, `statsStore`)
- **Game Logic:** Pure functional game engine in `src/game/engine/` (`board.ts`, `validate.ts`, `daily.ts`, `progression.ts`, `share.ts`, `tabs.ts`).

### 5.2 Audio & Tactile Polish

- **Engine:** Custom `useSound` hook with Web Audio API + HTML5 Audio fallback (`src/sound/`).
- **Sound Palette:** Tactile acoustic sounds (ceramic, paper, wood cues for select, deselect, submit, correct, wrong, win, loss, wink, tabReveal).
- **Safety:** Mobile audio unlock on first user gesture, persistent mute state, zero blocking of core gameplay if muted.

### 5.3 Share Card & Visual Export

- **Renderer:** Zero-dependency HTML5 Canvas engine (`src/share/shareCard.ts`).
- **Output:** Clean high-resolution branded summary card ("BY NEURAL VOID", solved color blocks, result status, `neural-void.com/foldwink` footer).
- **Text Share:** Compact emoji matrix formatted with canonical URL for instant clipboard sharing.

### 5.4 Progressive Web App (PWA)

- **Offline Shell:** Service worker (`dist/sw.js`) with warm-cache strategy.
- **Manifest:** Full `manifest.webmanifest` configuration with standalone display.
- **Icons:** Rasterized branded app icons (180×180 Apple touch icon, 192×192 & 512×512 PWA icons).
- **Install CTA:** Non-intrusive, player-initiated native install prompt.

---

## 6. Content Library & Validation

### 6.1 Curated Puzzle Pools

The game ships with **1,500 total curated puzzles** across 3 languages, strictly locked at 500 per language:

- **English (EN):** 500 puzzles (275 Easy, 191 Medium, 34 Hard)
- **Russian (RU):** 500 puzzles
- **German (DE):** 500 puzzles

### 6.2 Editorial & Content Quality Rules

- **No Ambiguity:** Puzzles must not allow alternative valid 4-group groupings.
- **Zero Trivia Traps:** Avoid hyper-specialized trivia, obscure medical/clinical terms, or transient pop culture.
- **Near-Duplicate Detection:** Automated validator check for draft-to-active 3-of-4 card collisions and plural-insensitive repeats.
- **Screen Fit:** Every board is checked against a 390px mobile viewport to ensure card labels never clip or wrap awkwardly.

---

## 7. Ethical Monetization & Privacy Policy

- **Core Rule:** **Never paywall today's daily puzzle, easy mode, or the archive.**
- **No Pay-to-Win:** No paid Wink boosts or in-game cheats.
- **Config File:** `src/monetization/config.ts` acts as the single source of truth.
- **3 Non-Intrusive Channels:**
  1. **Tip Jar:** Ko-fi / Buy Me a Coffee link displayed gently on the victory screen (hidden if no handle configured).
  2. **One-Time Supporter Unlock:** Hosted Stripe/Lemon Squeezy checkout link setting a local `localStorage` flag for a cosmetic "Supporter ★" badge and thank-you note.
  3. **Opt-in Rewarded Ads:** Player-initiated only (`window.foldwinkShowRewardedAd`), never auto-play, never interstitial.
- **Privacy:** Strict local-first telemetry. Explicit consent controls in `AboutFooter` and zero third-party tracking without opt-in.

---

## 8. Key Developer Commands

```bash
# Start local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run unit and engine tests (Vitest)
npm run test

# Run content validator across all puzzle pools
npm run validate

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
