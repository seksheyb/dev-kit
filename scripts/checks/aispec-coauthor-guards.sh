#!/usr/bin/env bash
# Regression guard for the AI-SPEC.md co-authorship defect (ROADMAP 1.13).
#
# Four agents co-author a single AI-SPEC.md in a documented sequential chain —
# framework-selector (Section 2 + the skeleton) -> domain-researcher (1, 1b) ->
# ai-researcher (3, 4, 4b) -> eval-planner (5, 6, 7). Each was granted `Write` but
# not `Edit`, and each carried a categorical "ALWAYS use the Write tool to create
# files" mandate. `Write` is a whole-file overwrite, so every agent after the first
# clobbered its siblings' sections, and the mandate forbade every workaround.
#
# The fix has two halves, and this script guards both:
#   a. `Edit` is present in the agent's `tools:` frontmatter, so an in-place update
#      path exists at all.
#   b. The categorical "ALWAYS use the Write tool to create files" string is gone,
#      replaced by an explicit read-modify-write contract. The heredoc prohibition
#      that shared that sentence is correct and must survive — checked separately.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the agents below,
# before merging, to catch a regression back into the overwrite bug.
#
# Usage: bash scripts/checks/aispec-coauthor-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

AISPEC_AGENTS="
plugins/dev-kit-data-ai/agents/framework-selector.md
plugins/dev-kit-core/agents/domain-researcher.md
plugins/dev-kit-data-ai/agents/ai-researcher.md
plugins/dev-kit-data-ai/agents/eval-planner.md
"

echo "== Check 1: every AI-SPEC.md co-author is granted Edit =="
# Without Edit the only write path is a whole-file Write, which destroys the
# sections the other three agents in the chain own.
c1_fail=0
for f in $AISPEC_AGENTS; do
  if [ ! -f "$f" ]; then
    echo "FAIL: $f not found — has the agent been moved or renamed?"
    c1_fail=1
    continue
  fi
  tools_line="$(grep -m1 "^tools:" "$f")"
  if [ -z "$tools_line" ]; then
    echo "FAIL: $f has no 'tools:' frontmatter line"
    c1_fail=1
  elif ! echo "$tools_line" | grep -qE '(^|[ ,:])Edit([ ,]|$)'; then
    echo "FAIL: $f grants Write with no Edit — in-place section update is impossible"
    c1_fail=1
  fi
done
if [ "$c1_fail" -eq 0 ]; then
  echo "PASS: all 4 AI-SPEC.md co-authors grant Edit alongside Write"
else
  fail=1
fi

echo
echo "== Check 2: the categorical 'ALWAYS use the Write tool' mandate is gone =="
# This sentence forbade every in-place alternative, so reinstating it re-breaks the
# chain even with Edit granted.
c2_fail=0
for f in $AISPEC_AGENTS; do
  [ -f "$f" ] || continue
  if grep -qn "ALWAYS use the Write tool to create files" "$f"; then
    echo "FAIL: $f still carries the categorical 'ALWAYS use the Write tool to create files' mandate"
    c2_fail=1
  fi
done
if [ "$c2_fail" -eq 0 ]; then
  echo "PASS: no AI-SPEC.md co-author carries the categorical Write mandate"
else
  fail=1
fi

echo
echo "== Check 3: the read-modify-write contract and the heredoc ban both survive =="
# Only the "ALWAYS use Write" absolutism was being replaced. The heredoc prohibition
# is correct, and the replacement must actually say to Edit in place.
c3_fail=0
for f in $AISPEC_AGENTS; do
  [ -f "$f" ] || continue
  grep -q "cat << 'EOF'" "$f" || {
    echo "FAIL: $f lost the Bash heredoc prohibition — that half of the mandate was correct"; c3_fail=1; }
  grep -qi "never .*whole file\|never \`Write\` the whole file\|do \*\*not\*\* \`Write\` it" "$f" || {
    echo "FAIL: $f no longer forbids a whole-file write over an existing AI-SPEC.md"; c3_fail=1; }
  grep -q '`Edit`' "$f" || {
    echo "FAIL: $f never names Edit as the in-place update path"; c3_fail=1; }
  grep -qi "next \`\?##\`\? heading" "$f" || {
    echo "FAIL: $f does not scope the edit to 'heading -> next ## heading'"; c3_fail=1; }
done
if [ "$c3_fail" -eq 0 ]; then
  echo "PASS: all 4 agents state a heading-scoped Edit contract and keep the heredoc ban"
else
  fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
