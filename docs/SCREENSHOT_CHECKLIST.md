# Foldwink Screenshot Acceptance Checklist

Release evidence uses actual rendered captures at 100% zoom. Numerical DOM
geometry supplements but never replaces visual inspection.

## Required matrix

| Profile | Viewport | Minimum locale coverage |
| ------- | -------: | ----------------------- |
| Desktop | 1440×900 | EN                      |
| Tablet  | 1024×768 | DE                      |
| Mobile  |  390×844 | RU                      |

Add a physical iOS Safari/PWA and Android Chrome/PWA set. Record browser, OS,
device, zoom, build/channel and whether browser chrome or safe areas are shown.

## Required states

1. Public listing and exact-build identifier.
2. Menu: Today, Daily Fold, Practice hierarchy, counts and footer.
3. First-run onboarding step 1 and step 2.
4. Fresh Easy board: 16 cards, 0/4, mistakes, disabled actions.
5. Medium Tabs/Wink before and after one correct group.
6. Four selected cards and one-away/wrong feedback.
7. Solved group plus 12 remaining cards.
8. Win and loss Result, including long localized copy.
9. Retry vs Another puzzle actions.
10. Stats, collection/passport and framed share card.
11. Challenge/share failure and safe error state.
12. Storage unavailable/conflict/recovery and PWA update notices.
13. Backup import preview, conflict and cancel.
14. About/privacy/research export.
15. Reduced-motion and keyboard-focus states.

## Inspection notes required per set

- horizontal overflow and viewport clipping;
- overlaps and unintended empty space;
- long-word/localized wrapping;
- hierarchy and primary action clarity;
- focus visibility and disabled/selected distinction;
- error wording and recovery action;
- contrast and non-colour solved markers;
- safe areas, browser chrome and touch target reachability.

Every folder of PNG files must have a short written inspection result. Do not
mark a state accepted merely because a screenshot file exists.
