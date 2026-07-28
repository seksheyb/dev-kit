#!/usr/bin/env bash
# Regression guard for the defect fixed on bugfix/w1-track-writing-plans
# (docs/audits/kickoff-duplication-audit/, roadmap item 2.17):
#
#   plugins/dev-kit-core/skills/writing-plans/plan-document-reviewer-prompt.md
#   was an orphaned skill companion asset — nothing anywhere in plugins/
#   referenced or dispatched it. writing-plans/SKILL.md had already made the
#   opposite design decision explicitly ("This is a checklist you run
#   yourself — not a subagent dispatch."), so the template was the discarded
#   alternative to a deliberate decision, not an unfinished integration.
#   Fixed by deleting the orphaned file.
#
# This script generalizes the check: it also walks every non-SKILL.md
# markdown file that sits DIRECTLY inside a plugins/*/skills/*/ directory
# and fails if any of them is referenced (by filename) by zero other files
# in plugins/ — i.e. it detects newly-orphaned skill companion files, not
# just a regression of this specific one.
#
# Scope note: only direct children of plugins/*/skills/*/ are walked, not
# files nested under a references/ subdirectory. references/ files were
# checked by hand before writing this guard: every references/*.md file in
# the repo is cited by its literal filename in a "topic -> references/X.md"
# lookup table in its owning SKILL.md (e.g.
# plugins/dev-kit-infra/skills/monitoring-expert/SKILL.md:152-159), so they
# are already covered by the same by-filename reference check and don't
# need special-casing — they are consumed by table lookup, not by being
# directly inside the skill directory.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset
# repo) — this script is NOT wired into any pipeline. Run it by hand after
# adding, removing, or renaming skill companion files, before merging, to
# catch a newly-orphaned file.
#
# Usage: bash scripts/checks/orphan-asset-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: plan-document-reviewer-prompt.md stays deleted and unreferenced =="
DELETED_FILE="plugins/dev-kit-core/skills/writing-plans/plan-document-reviewer-prompt.md"
if [ -f "$DELETED_FILE" ]; then
  echo "FAIL: $DELETED_FILE exists again — this is the orphaned asset that roadmap item 2.17"
  echo "      deleted. If it's being reintroduced, it must be wired into a consumer first"
  echo "      (writing-plans/SKILL.md explicitly says review is 'not a subagent dispatch'),"
  echo "      not just restored as a dangling template."
  fail=1
else
  echo "PASS: $DELETED_FILE does not exist"
fi

if grep -rq "plan-document-reviewer-prompt" plugins/ 2>/dev/null; then
  echo "FAIL: a reference to plan-document-reviewer-prompt still exists under plugins/:"
  grep -rn "plan-document-reviewer-prompt" plugins/ 2>/dev/null
  fail=1
else
  echo "PASS: no reference to plan-document-reviewer-prompt remains under plugins/"
fi

echo
echo "== Check 2: no other skill companion file has become newly orphaned =="
orphans=""
file_list="$(find plugins -mindepth 4 -maxdepth 4 -type f -name "*.md" ! -name "SKILL.md")"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  base="$(basename "$f")"
  refs="$(grep -rl "$base" plugins/ --include="*.md" 2>/dev/null | grep -v -F "$f" | wc -l | tr -d ' ')"
  if [ "$refs" -eq 0 ]; then
    orphans="${orphans}${f}
"
  fi
done <<EOF
$file_list
EOF

if [ -n "$orphans" ]; then
  echo "FAIL: found skill companion file(s) with zero references anywhere in plugins/:"
  echo "$orphans"
  fail=1
else
  echo "PASS: every non-SKILL.md file directly inside a plugins/*/skills/*/ directory is"
  echo "      referenced by filename at least once elsewhere in plugins/"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
