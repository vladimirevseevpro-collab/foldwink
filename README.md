# Foldwink

**Version 0.8.4 - externally staged pilot candidate, by Neural Void.**

Foldwink is a short daily grouping puzzle. Find four hidden groups of four in a
4x4 grid. A correct group locks in; four mistakes end the round.

Medium puzzles use the Foldwink Tabs: every solved group reveals one more
letter on each unsolved tab. Once per medium puzzle, the player may Wink one
tab to reveal its full category. Easy puzzles intentionally have neither Tabs
nor Wink; Hard has no Tabs and no Wink (pure deduction).

## Product status

- Mobile-first static web/PWA. Direct web is the canonical product; itch.io is
  optional discovery.
- Tactile 2.5D card surface, nine local paper/card/wood/tile audio cues, and
  a canvas share card.
- Local-first: no accounts, backend, cloud sync, or leaderboard.
- Active curated pool size is reported per language by `npm run validate`. The
  pool is being de-duplicated after a 2026-10-01 audit found that roughly half
  of the September scale-up consisted of recombined copies of existing boards,
  so no fixed catalogue count is quoted here.
- Optional Ko-fi and cosmetic Supporter checkout are code-ready but hidden
  until valid public URLs are configured. No core gameplay is paywalled.
- itch.io playable build `#1984826` and download build `#1984827` are the
  hash-matched public W7 pilot surfaces. The direct
  canonical deployment, physical-device QA, real human pilot and D1/D7 evidence
  remain required before commercial-release acceptance.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

## Verification and release commands

| Command                          | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `npm run typecheck`              | TypeScript check                                            |
| `npm run lint`                   | ESLint                                                      |
| `npm test`                       | Unit tests                                                  |
| `npm run validate`               | Validate active English puzzle pool                         |
| `npm run build`                  | Typecheck, sound-pack check, production build               |
| `npm run test:e2e`               | Full Playwright browser suite                               |
| `npm run release:preflight`      | Validate a free build and report hidden public CTAs         |
| `npm run release:preflight:paid` | Require public payment config and print checkout return URL |
| `npm run pack:itch`              | Build a versioned itch.io HTML5 upload archive              |
| `npm run release:butler`         | Push a packed archive to configured itch.io target          |
| `npm run pilot:verify-channel`   | Fetch and hash-check the immutable itch channel             |
| `npm run pilot:verify-staging`   | Smoke-test live itch EN/DE/RU at the acceptance viewports   |

## Deployment

Foldwink is a static Vite application. `npm run build` writes `dist/`.
Deploy that directory to the canonical direct web/PWA origin first.

For a free deployment, no environment values are required. For optional paid
surfaces, configure public values outside source control:

- `VITE_KOFI_HANDLE`
- `VITE_SUPPORTER_CHECKOUT_URL`
- `FOLDWINK_CANONICAL_URL` for the paid preflight command only

Read [docs/DEPLOY.md](docs/DEPLOY.md) and
[docs/MONETIZATION.md](docs/MONETIZATION.md) before publishing. Do not activate
payment CTAs until the deployed checkout return has been tested on the same
origin.

## Content work

Puzzle JSON is bundled at build time. Add or change a puzzle only through the
editorial workflow:

1. Create or revise a draft outside the active pool.
2. Run the draft/reference validator against the active pool.
3. Require editorial review for naturalness, ambiguity, and language quality.
4. Promote one-for-one, archive the retired board, then run the full gates.

The validator catches structural errors and defined duplicate risks; it cannot
replace human editorial judgment. See
[docs/content/PUZZLE_EDITORIAL_GUIDELINES.md](docs/content/PUZZLE_EDITORIAL_GUIDELINES.md).

## Product boundaries

Foldwink deliberately does not include accounts, cloud sync, multiplayer,
runtime-generated puzzles, paid gameplay advantages, autoplay ads,
interstitials, banners, a 3D renderer, or a motion framework.

## Documentation

- [docs/DEPLOY.md](docs/DEPLOY.md) - direct web and optional itch release flow
- [docs/MONETIZATION.md](docs/MONETIZATION.md) - public config and privacy rules
- [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) - remaining real limits
- [docs/TODO.md](docs/TODO.md) - current milestone and release checklist
- [docs/reports/](docs/reports/) - audit, sprint, content, and release evidence

## License

Proprietary - all rights reserved.
