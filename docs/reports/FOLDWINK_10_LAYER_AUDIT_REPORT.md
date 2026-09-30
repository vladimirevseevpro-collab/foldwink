# Foldwink 10-Layer Deep Heuristics Audit Report

**Date:** 2026-09-05
**Scope:** 3000 Puzzles (EN: 1000, RU: 1000, DE: 1000)

## Summary

- **Critical Errors:** 0
- **Quality Warnings:** 964
- **Design Advisories:** 470

## Findings Sample (First 50)

| Layer | Pool | Puzzle ID | Severity | Heuristic | Detail |
| :---: | :---: | :---: | :---: | :--- | :--- |
| 4 | EN | puzzle-0002 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'T' (reduces initial disambiguation) |
| 4 | EN | puzzle-0003 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'P' (reduces initial disambiguation) |
| 4 | EN | puzzle-0025 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0026 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'A' (reduces initial disambiguation) |
| 4 | EN | puzzle-0026 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'A' (reduces initial disambiguation) |
| 4 | EN | puzzle-0027 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0028 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'P' (reduces initial disambiguation) |
| 4 | EN | puzzle-0035 | warning | RevealHint Length Gate | RevealHint "NEWSPAPER" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0037 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'D' (reduces initial disambiguation) |
| 4 | EN | puzzle-0063 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'B' (reduces initial disambiguation) |
| 4 | EN | puzzle-0068 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'T' (reduces initial disambiguation) |
| 4 | EN | puzzle-0069 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'W' (reduces initial disambiguation) |
| 4 | EN | puzzle-0070 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'P' (reduces initial disambiguation) |
| 4 | EN | puzzle-0096 | warning | RevealHint Length Gate | RevealHint "CIRCULATION" length (11) outside recommended 3-6 range |
| 4 | EN | puzzle-0097 | warning | RevealHint Length Gate | RevealHint "TREATMENTS" length (10) outside recommended 3-6 range |
| 4 | EN | puzzle-0097 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'T' (reduces initial disambiguation) |
| 9 | EN | puzzle-0098 | advisory | Parasitic Suffix Concentration | 5+ items share suffix "-tion" (Refraction, Conduction, Convection, Radiation, Insulation), creating unintentional rhyme decoy |
| 4 | EN | puzzle-0119 | warning | RevealHint Length Gate | RevealHint "GYMNASTICS" length (10) outside recommended 3-6 range |
| 4 | EN | puzzle-0124 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'P' (reduces initial disambiguation) |
| 4 | EN | puzzle-0125 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0126 | warning | RevealHint Length Gate | RevealHint "DRESS CODE" length (10) outside recommended 3-6 range |
| 4 | EN | puzzle-0126 | warning | RevealHint Length Gate | RevealHint "BOXED STAPLES OF FAMILY GAME NIGHT" length (34) outside recommended 3-6 range |
| 4 | EN | puzzle-0126 | warning | RevealHint Length Gate | RevealHint "ROLES IN A 64-SQUARE BATTLE" length (27) outside recommended 3-6 range |
| 4 | EN | puzzle-0127 | warning | RevealHint Length Gate | RevealHint "STRUCTURE" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0127 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0128 | warning | RevealHint Length Gate | RevealHint "COMPUTING" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0128 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'C' (reduces initial disambiguation) |
| 4 | EN | puzzle-0130 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0130 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 9 | EN | puzzle-0146 | advisory | Parasitic Suffix Concentration | 5+ items share suffix "-erry" (Blueberry, Raspberry, Blackberry, Cranberry, Cherry), creating unintentional rhyme decoy |
| 4 | EN | puzzle-0153 | warning | RevealHint Length Gate | RevealHint "EMOTIONAL" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0154 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'E' (reduces initial disambiguation) |
| 4 | EN | puzzle-0156 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'M' (reduces initial disambiguation) |
| 4 | EN | puzzle-0157 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0159 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'M' (reduces initial disambiguation) |
| 4 | EN | puzzle-0160 | warning | RevealHint Length Gate | RevealHint "JEWELLERY" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0163 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'R' (reduces initial disambiguation) |
| 4 | EN | puzzle-0165 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'T' (reduces initial disambiguation) |
| 4 | EN | puzzle-0166 | warning | RevealHint Length Gate | RevealHint "FURNITURE" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0166 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'D' (reduces initial disambiguation) |
| 4 | EN | puzzle-0167 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'F' (reduces initial disambiguation) |
| 4 | EN | puzzle-0171 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'P' (reduces initial disambiguation) |
| 4 | EN | puzzle-0172 | warning | RevealHint Length Gate | RevealHint "MOTIVATION" length (10) outside recommended 3-6 range |
| 4 | EN | puzzle-0172 | warning | RevealHint Length Gate | RevealHint "COMPUTING" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0172 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'C' (reduces initial disambiguation) |
| 4 | EN | puzzle-0174 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'M' (reduces initial disambiguation) |
| 4 | EN | puzzle-0176 | warning | RevealHint Length Gate | RevealHint "ATHLETICS" length (9) outside recommended 3-6 range |
| 4 | EN | puzzle-0177 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'S' (reduces initial disambiguation) |
| 4 | EN | puzzle-0179 | warning | RevealHint Length Gate | RevealHint "DISTRIBUTION" length (12) outside recommended 3-6 range |
| 4 | EN | puzzle-0225 | advisory | Foldwink Tabs Initial Collision | Multiple revealHints start with letter 'H' (reduces initial disambiguation) |
