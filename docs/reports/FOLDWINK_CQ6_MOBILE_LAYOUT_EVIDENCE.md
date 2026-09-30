# Foldwink CQ6 Mobile Layout Evidence

## Scope

Local production-equivalent rendering was measured at an iPhone-width viewport:
390 x 844 CSS pixels, touch enabled, after first-run onboarding was skipped.

## Measured Result

- Document scroll width: 390px, exactly equal to viewport width.
- Document scroll height: 844px, exactly equal to viewport height.
- Grid side margins: 12px.
- Grid width: 367px.
- Every card: 86px x 68px.
- Four rows are visible without scrolling.
- The primary action row is visible below the grid:
  Clear 129px wide and Submit 174px wide.
- Quit remains reachable below the primary action row.

## Evidence

The rendered game was an Easy daily board. Cards occupied x=12 through x=379;
the rightmost edge remains inside the 390px viewport. No horizontal overflow was
present. Card labels including "Spark Plug", "Glove Box", and "Gear Stick" fit
inside the stable 4x4 layout.

## Automated Coverage

The current production browser suite also passed 47 checks, including:

- 390px mobile menu and gameplay layout
- 320px and 430px responsive cases
- iPhone 390x844 multi-round Next flow
- Pixel 6 multi-round Next flow
- itch embed and direct full-size launch
- PWA offline behavior

## Residual Risk

This is strong browser-render evidence, not a physical iPhone Safari proof.
The human iPhone/Android safe-area, browser-chrome, audio-unlock, native-share,
and checkout-return checks remain required before public paid activation.
