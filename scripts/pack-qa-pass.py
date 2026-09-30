"""Bundle every artefact produced by the 2026-04-15 QA triage pass into one zip.

Run from the repo root:  python scripts/pack-qa-pass.py
Output: reports/foldwink-qa-pass-2026-04-15.zip
"""

from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "foldwink-qa-pass-2026-04-15.zip"

# Everything worth shipping to whoever reviews this pass. Paths are repo-relative.
INCLUDE = [
    # Reports
    "reports/qa_triage_report.md",
    "reports/fix_plan.md",
    "reports/post_fix_verification.md",
    "reports/open_questions.md",
    "reports/qa-pass-manifest.md",
    # Code changes from this pass (current on-disk versions)
    "src/components/GameTimer.tsx",
    "src/game/state/store.ts",
    "src/game/state/__tests__/store.test.ts",
    "src/components/Onboarding.tsx",
    "src/components/ShareButton.tsx",
    "src/stats/persistence.ts",
    "src/components/AboutFooter.tsx",
    "src/components/Card.tsx",
    "docs/KNOWN_LIMITATIONS.md",
    "package.json",
    # e2e agents
    "tests/e2e/lib/harness.mjs",
    "tests/e2e/progression-validator.mjs",
    "tests/e2e/gameplay-smoke.mjs",
    "tests/e2e/responsive-smoke.mjs",
    "tests/e2e/itch-embed-smoke.mjs",
    "tests/e2e/run-all.mjs",
    # QA data + helper
    "scripts/dump-qa-xlsx.py",
    "scripts/pack-qa-pass.py",
    "test/qa-dump.json",
    "test/FOLDWINK_MANUAL_QA.xlsx",
]


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    missing: list[str] = []
    written = 0
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for rel in INCLUDE:
            src = ROOT / rel
            if not src.exists():
                missing.append(rel)
                continue
            # Preserve the repo-relative path inside the zip for easy
            # reviewer navigation.
            z.write(src, arcname=rel.replace(os.sep, "/"))
            written += 1
    size_kb = OUT.stat().st_size / 1024
    print(f"wrote {written} files → {OUT.relative_to(ROOT)} ({size_kb:.1f} KB)")
    if missing:
        print(f"WARNING: {len(missing)} files missing from working copy:", file=sys.stderr)
        for m in missing:
            print(f"  - {m}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
