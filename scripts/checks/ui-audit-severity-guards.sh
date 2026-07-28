#!/usr/bin/env bash
# Regression guard for two defect classes found in the UI-audit chain
# (roadmap items 1.15 and 2.16):
#
#   1. `ui-auditor` declares a BLOCKER/WARNING/BELOW-BAR severity taxonomy in
#      <adversarial_stance>, but the taxonomy stopped at the Priority Fixes rollup —
#      the `## Detailed Findings` section (the one carrying file:line evidence) had
#      bare `{findings...}` placeholders with no severity label at all.
#   2. `design-reviewer` carried forward `ui-auditor`'s self-reported
#      `needs_human_review` list and treated it as the complete set of items needing
#      live judgment, with no re-check for items that should have been flagged and
#      weren't — an under-flagging ui-auditor run produced a short list, got
#      dutifully resolved, and both reports read clean.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the agents below,
# before merging, to catch a regression back into either bug.
#
# Usage: bash scripts/checks/ui-audit-severity-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: ui-auditor's Detailed Findings carry explicit BLOCKER/WARNING labels =="
UA_FILE="plugins/dev-kit-core/agents/ui-auditor.md"
if [ ! -f "$UA_FILE" ]; then
  echo "FAIL: $UA_FILE not found"
  fail=1
else
  # Isolate the Detailed Findings section (from its heading to the next top-level
  # section, ## Needs Human Review, which always follows it per <output_format>).
  section="$(awk '/^## Detailed Findings/{f=1} f{print} /^## Needs Human Review/{exit}' "$UA_FILE")"

  if [ -z "$section" ]; then
    echo "FAIL: no '## Detailed Findings' section found in $UA_FILE"
    fail=1
  else
    ua_fail=0

    # The severity labels must actually appear inside the section (not just declared
    # elsewhere in the file, e.g. in <adversarial_stance>).
    echo "$section" | grep -q '\[BLOCKER' || {
      echo "FAIL: '## Detailed Findings' has no [BLOCKER] label instruction"; ua_fail=1; }
    echo "$section" | grep -q '\[WARNING' || {
      echo "FAIL: '## Detailed Findings' has no [WARNING] label instruction"; ua_fail=1; }

    # Regression signature of the original bug: a bare, unlabelled placeholder
    # directly under a pillar heading, e.g. "{findings with file:line references}"
    # with no severity bracket anywhere on the line.
    if echo "$section" | grep -qE '^\{findings[^}]*\}[[:space:]]*$'; then
      echo "FAIL: found a bare unlabelled '{findings...}' placeholder — severity taxonomy has not been wired into Detailed Findings"
      ua_fail=1
    fi

    if [ "$ua_fail" -eq 0 ]; then
      echo "PASS: Detailed Findings requires explicit [BLOCKER]/[WARNING] labels, no bare placeholders"
    else
      fail=1
    fi
  fi
fi

echo
echo "== Check 2: design-reviewer re-checks for ui-auditor under-flagging, not just carry-forward =="
DR_FILE="plugins/dev-kit-core/agents/design-reviewer.md"
if [ ! -f "$DR_FILE" ]; then
  echo "FAIL: $DR_FILE not found"
  fail=1
else
  dr_fail=0

  # The existing carry-forward duty (item 1.11's fix) must still be present and unchanged
  # in spirit — this guard is additive, not a replacement.
  grep -qi "Carry forward .\{0,5\}Needs Human Review" "$DR_FILE" || {
    echo "FAIL: the existing 'Carry forward Needs Human Review' duty is gone"; dr_fail=1; }

  # The re-check duty must be present: independent scanning for under-flagged items.
  grep -qi "re-check for under-flagging" "$DR_FILE" || {
    echo "FAIL: no re-check-for-under-flagging duty found"; dr_fail=1; }

  # The report must distinguish ui-auditor-flagged items from this-pass-added items —
  # a single undifferentiated carry-forward list is exactly what let under-flagging
  # stay invisible.
  grep -qi "Added by this pass" "$DR_FILE" || {
    echo "FAIL: report no longer distinguishes items added by this pass from items ui-auditor flagged"; dr_fail=1; }

  # The upstream list must no longer be asserted as exhaustive/complete on its own.
  if grep -qi "not assumed exhaustive\|floor, not a ceiling" "$DR_FILE"; then
    : # good — explicit non-exhaustiveness framing present
  else
    echo "FAIL: design-reviewer's instructions don't state the upstream list is non-exhaustive"
    dr_fail=1
  fi

  if [ "$dr_fail" -eq 0 ]; then
    echo "PASS: design-reviewer carries forward ui-auditor's flags AND independently re-checks for under-flagging"
  else
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
