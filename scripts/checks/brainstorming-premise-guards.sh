#!/usr/bin/env bash
# Regression guard for a defect fixed on bugfix/w1-track-brainstorming (roadmap 2.12):
#
#   brainstorming's mandatory Premise Challenge gate lived only inside the startup/
#   office-hours mode section (under "## Premise Challenge (both postures — mandatory)",
#   where "both postures" meant the two *startup* postures — founder/builder — not
#   "office-hours mode vs. standard flow"). The standard design flow — the default path,
#   and the one the pipeline actually uses when a feature/change arrives with no prior
#   mode — never ran a premise step at all: its checklist went straight from "ask
#   clarifying questions" to "propose 2-3 approaches".
#
# The fix inserts a premise-check step into "## Checklist (standard design flow)", ahead
# of "Propose 2-3 approaches", that references the existing "## Premise Challenge" section
# instead of duplicating its methodology.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing
# plugins/dev-kit-core/skills/brainstorming/SKILL.md, before merging, to catch a
# regression back into this bug.
#
# Verified in both directions: fails against `git show HEAD:<path>` (pre-fix, when run
# from a branch whose HEAD predates the fix), passes against the fixed file.
#
# Usage: bash scripts/checks/brainstorming-premise-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

BS_FILE="plugins/dev-kit-core/skills/brainstorming/SKILL.md"

echo "== Check 1: the standard-flow checklist contains a premise step, before approaches =="
if [ ! -f "$BS_FILE" ]; then
  echo "FAIL: $BS_FILE not found"
  fail=1
else
  c1_fail=0

  # Isolate the standard-flow checklist block: from its heading to the next "## " heading.
  checklist="$(awk '/^## Checklist \(standard design flow\)/{f=1;next} f&&/^## /{exit} f' "$BS_FILE")"
  if [ -z "$checklist" ]; then
    echo "FAIL: no '## Checklist (standard design flow)' section found"
    c1_fail=1
  else
    # Line numbers *within the block* of the premise step and the approaches step, so we
    # can assert ordering rather than just presence.
    premise_line="$(echo "$checklist" | grep -niE 'premise' | head -1 | cut -d: -f1)"
    approaches_line="$(echo "$checklist" | grep -niE 'propose 2-3 approaches' | head -1 | cut -d: -f1)"

    if [ -z "$premise_line" ]; then
      echo "FAIL: standard-flow checklist has no step mentioning 'premise' — the gate is not reachable from the default path"
      c1_fail=1
    elif [ -z "$approaches_line" ]; then
      echo "FAIL: standard-flow checklist has no 'Propose 2-3 approaches' step — checklist shape changed unexpectedly"
      c1_fail=1
    elif [ "$premise_line" -ge "$approaches_line" ]; then
      echo "FAIL: premise step (line $premise_line of block) does not come before the approaches step (line $approaches_line) — premises must be settled before solutions are proposed"
      c1_fail=1
    fi

    # The checklist step must be an explicit gate, not silent unconditional re-derivation:
    # it has to handle the case where premises already exist from an upstream mode.
    echo "$checklist" | grep -qi "already\|upstream\|agreed" || {
      echo "FAIL: checklist's premise step does not address the already-have-premises-from-upstream case"; c1_fail=1; }

    # Reference, don't duplicate: the checklist step must point at the shared section
    # rather than restate its methodology (no re-listing of the numbered premise questions
    # inline in the checklist item).
    echo "$checklist" | grep -q "Premise Challenge" || {
      echo "FAIL: checklist's premise step does not reference the '## Premise Challenge' section"; c1_fail=1; }
  fi

  if [ "$c1_fail" -eq 0 ]; then
    echo "PASS: standard-flow checklist gates on premises, ahead of approaches, referencing the shared section"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: the Premise Challenge heading no longer implies office-hours-only scope =="
if [ ! -f "$BS_FILE" ]; then
  echo "FAIL: $BS_FILE not found"
  fail=1
else
  c2_fail=0

  heading_line="$(grep -n "^## Premise Challenge" "$BS_FILE" | head -1)"
  if [ -z "$heading_line" ]; then
    echo "FAIL: no '## Premise Challenge' heading found"
    c2_fail=1
  else
    # The exact old parenthetical this regression would reinstate.
    if echo "$heading_line" | grep -qE '^\s*[0-9]+:## Premise Challenge \(both postures — mandatory\)\s*$'; then
      echo "FAIL: heading still reads '(both postures — mandatory)' verbatim — misleading now that the standard flow also gates on this section, since 'both postures' historically meant the two startup postures only"
      c2_fail=1
    fi
  fi

  # The output contract (explicit agree/disagree statements, loop back on disagreement)
  # must still be the single copy the checklist step points to.
  contract="$(awk '/^## Premise Challenge/{f=1;next} f&&/^## /{exit} f' "$BS_FILE")"
  echo "$contract" | grep -qi "agree/disagree\|agree or disagree" || {
    echo "FAIL: Premise Challenge section no longer states the agree/disagree output contract"; c2_fail=1; }
  echo "$contract" | grep -qi "loop back" || {
    echo "FAIL: Premise Challenge section no longer states the loop-back-on-disagreement behavior"; c2_fail=1; }

  if [ "$c2_fail" -eq 0 ]; then
    echo "PASS: Premise Challenge heading reflects its real (shared) scope, and its output contract is intact"
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
