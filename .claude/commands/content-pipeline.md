Build the content pipeline for Foldwink.

Need:

- puzzle types
- puzzle loader
- validator script
- duplicate detection
- fairness checklist support
- starter puzzle content

Approach:

1. stabilize schema
2. create first 10 puzzles
3. validate and fix
4. scale toward 30 puzzles only after stability

Use:

- `puzzle-designer`
- `puzzle-validator`

Do not mass-generate content before validation is working.
