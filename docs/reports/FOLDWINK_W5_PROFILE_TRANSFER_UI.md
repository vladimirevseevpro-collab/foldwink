# Foldwink W5 — Profile Transfer UI

## Sprint Summary

Implemented the FW-026 client-side full-profile backup and import interface.
It uses the existing persistence backup API and does not transfer settings,
consent, or Supporter state. Import validates and previews without writing;
Merge is the default and Replace requires a separate confirmation checkbox.

## Changed Files

- `src/components/ProfileTransferDialog.tsx` — accessible export/import dialog,
  preview, baseline selection, guarded replacement, and post-commit reload.
- `src/components/ArchivistPassportModal.tsx` — prominent full-backup entry
  point and explicitly labelled legacy wax-seal transfer copy. Existing
  milestone-page work was preserved.

## Tests Run

- `npm run typecheck` — passed.
- `npm run validate` — passed: 1000 puzzles validated; 1903 pre-existing
  advisory editorial warnings reported.
- `npm run build` — passed (including sound-pack check); existing bundle-size
  warnings remain.
- `npm test` — 329/330 tests passed. One unrelated current-worktree failure:
  `store — duel mode > starts duel with specified puzzle id and challenger
  metrics` now receives a `challenge: { source: "legacy" }` property.
- Manual visual inspection: DialogShell at 1440×900, 1024×768, and 390×844;
  no visible clipping or horizontal overflow. Keyboard focus initially lands
  on the labelled file input.

## Manual QA Notes

- Export downloads a safely named JSON file. If browser download support is
  unavailable, a read-only JSON textarea and copy action are shown. Copy
  success is displayed only after Clipboard API success.
- File size and pasted content are checked at 2 MiB before parsing. Preview
  reads current state afresh, exposes version/language/date/counts/conflicts
  and both legacy XP baselines, and makes no mutation.
- Import commits only after an explicit merge/replace choice. A differing
  merge baseline needs a radio selection; Replace needs its confirmation
  checkbox. Storage and conflict errors remain in an aria-live status.

## Open Risks

- The full-suite duel-store assertion needs reconciliation by the owner of the
  concurrent challenge metadata change.
- Browser download initiation is observable but, like all browser downloads,
  cannot prove an OS-level save destination; the manual fallback remains
  available when initiation itself fails.

## Go / No-Go for Next Sprint

Go for integration after the unrelated duel-store test expectation is updated
or the new challenge field is removed by its owner.
