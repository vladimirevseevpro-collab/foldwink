# Puzzle Schema

## Canonical TypeScript shape

```ts
type PuzzleDifficulty = "easy" | "medium" | "hard";

type PuzzleGroup = {
  id: string;
  label: string;
  items: [string, string, string, string];
  /**
   * Short keyword used by Foldwink Tabs on medium puzzles. Medium reveals
   * one more letter per solve and supports one optional Wink. Easy and Hard
   * have no Tabs and no Wink in the accepted product baseline.
   */
  revealHint?: string;
};

type Puzzle = {
  id: string;
  title: string;
  difficulty: PuzzleDifficulty;
  groups: [PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup];
  editorialSummary?: string;
};
```

## JSON example (easy, no twist)

```json
{
  "id": "puzzle-0001",
  "title": "Starter Pack",
  "difficulty": "easy",
  "groups": [
    { "id": "planets", "label": "Planets", "items": ["Mars", "Venus", "Earth", "Jupiter"] },
    { "id": "colors", "label": "Colors", "items": ["Red", "Blue", "Green", "Yellow"] },
    { "id": "pets", "label": "Pets", "items": ["Dog", "Cat", "Hamster", "Rabbit"] },
    { "id": "sports", "label": "Sports", "items": ["Tennis", "Boxing", "Football", "Golf"] }
  ]
}
```

## JSON example (medium with Foldwink Tabs)

```json
{
  "id": "puzzle-0019",
  "title": "Red shades",
  "difficulty": "medium",
  "editorialSummary": "Four categories that all plausibly contain the word 'red' but only one actually names reds.",
  "groups": [
    {
      "id": "reds",
      "label": "Shades of red",
      "revealHint": "Reds",
      "items": ["Scarlet", "Crimson", "Ruby", "Cherry"]
    },
    {
      "id": "fruits",
      "label": "Red fruits",
      "revealHint": "Fruits",
      "items": ["Apple", "Strawberry", "Pomegranate", "Raspberry"]
    },
    {
      "id": "birds",
      "label": "Red birds",
      "revealHint": "Birds",
      "items": ["Cardinal", "Robin", "Flamingo", "Macaw"]
    },
    {
      "id": "signals",
      "label": "Stop signals",
      "revealHint": "Signals",
      "items": ["Brake", "Siren", "Alarm", "Flag"]
    }
  ]
}
```

The game renders these four hints across the Foldwink Tabs row above the grid. At stage 0 the player sees `R···` / `F·····` / `B····` / `S······`. Each correct solve reveals one more letter on every remaining tab. When a group is solved, its tab snaps to the full category `label` in its solved color.

### Wink mechanic

Once per **medium** puzzle the player may tap an unsolved tab to **Wink** it. That tab's full category label appears immediately, regardless of progressive reveal stage. Only one tab can be winked per game. The winked tab is not solved: the player still has to find its four matching items.

Hard puzzles are the strict no-hint tier: they render neither Foldwink Tabs nor Wink. A hard payload may retain historical authoring metadata, but runtime and release manifests must not expose it as an active hint surface.

## Validation rules (enforced by `npm run validate`)

Hard (error):

- exactly 4 groups
- each group has exactly 4 items
- every puzzle has a unique `id` across the pool
- every group has a unique `id` within the puzzle
- items must be non-empty strings
- labels must be non-empty strings
- no duplicate items across groups within a single puzzle (case-insensitive)
- difficulty must be `easy`, `medium`, or `hard`
- if a `revealHint` is present, it must be a non-empty string

Soft (warning):

- item length outside `[2, 22]` characters
- same item string appearing in multiple puzzles (cross-puzzle reuse — often intentional)

## Fairness checklist per puzzle

1. Is there one intended canonical solution?
2. Does any item naturally belong to more than one group?
3. Are the category labels real and defensible?
4. Are any items so obscure that they make the puzzle feel unfair?
5. Is the false trail interesting rather than trick-only?
6. For medium puzzles: is every `revealHint` short enough to fit a tab and a meaningful category keyword? Wink reveals the full category label, not the hint.
7. For hard puzzles: is the board fair without Tabs, Wink, or another hint system?
