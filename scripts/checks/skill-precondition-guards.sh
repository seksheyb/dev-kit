#!/usr/bin/env bash
# Regression guard for two defect classes found in the KICKOFF-duplication audit
# (docs/audits/kickoff-duplication-audit/):
#
#   1. A skill's closing text suggests running a follow-up skill that itself hard-refuses
#      to run unless some precondition is met, without checking that precondition first.
#   2. A skill demands a human question turn ("ask the user...") with no unattended
#      branch, even though it can be dispatched as a domain skill on an unattended
#      pipeline path (sprint-execution / bugfix-wave track dispatch).
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the skills below,
# before merging, to catch a regression back into either bug.
#
# Usage: bash scripts/checks/skill-precondition-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: design-consultation's design-html suggestion is gated =="
DC_FILE="plugins/dev-kit-core/skills/design-consultation/SKILL.md"
if [ ! -f "$DC_FILE" ]; then
  echo "FAIL: $DC_FILE not found"
  fail=1
else
  # The line recommending design-html must appear together with a conditional on
  # claude_design_system_id being bound, in the same paragraph — not as a bare,
  # unconditional suggestion.
  if grep -n "Run design-html" "$DC_FILE" >/dev/null; then
    if grep -B4 "Run design-html" "$DC_FILE" | grep -qE "if .?claude_design_system_id.? is bound"; then
      echo "PASS: design-html suggestion is conditioned on claude_design_system_id being bound"
    else
      echo "FAIL: found a 'Run design-html' suggestion in $DC_FILE with no nearby bound-system gate"
      fail=1
    fi
  else
    echo "FAIL: expected a 'Run design-html' suggestion in $DC_FILE — has the closer been removed or reworded?"
    fail=1
  fi
fi

echo
echo "== Check 2: code-documenter has an unattended branch for format selection =="
CD_FILE="plugins/dev-kit-core/skills/code-documenter/SKILL.md"
if [ ! -f "$CD_FILE" ]; then
  echo "FAIL: $CD_FILE not found"
  fail=1
else
  has_unattended_section=0
  grep -qi "unattended" "$CD_FILE" && has_unattended_section=1

  # The MUST DO / MUST NOT DO pair must not both be unconditional "ask the user" rules —
  # each bullet (which may wrap onto a following indented line) must at least mention the
  # interactive/unattended split. Extract each bullet as the "- ..." line plus any immediately
  # following indented continuation lines.
  must_do_bullet="$(awk '/^### MUST DO/{f=1;next} f&&/^### /{exit} f' "$CD_FILE" | awk '/^- /{if(b)exit; b=1} b')"
  must_not_bullet="$(awk '/^### MUST NOT DO/{f=1;next} f&&/^### /{exit} f' "$CD_FILE" | awk '/^- /{if(b)exit; b=1} b')"

  if [ "$has_unattended_section" -eq 1 ] \
     && echo "$must_do_bullet" | grep -qi "unattended" \
     && echo "$must_not_bullet" | grep -qi "unattended"; then
    echo "PASS: code-documenter defines an unattended branch and both MUST DO/MUST NOT DO scope to it"
  else
    echo "FAIL: code-documenter is missing (or has regressed) its unattended branch, or the"
    echo "      MUST DO / MUST NOT DO 'ask for format' pair no longer scopes to the interactive case."
    fail=1
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
