#!/usr/bin/env bash
# Regression guard for two orchestration-semantics defect classes fixed on
# bugfix/w1-track-orchestration:
#
#   1. bugfix-wave dispatched with no preflight for residue left by a PREVIOUS session.
#      Two classes of residue matter — leftover agent worktrees, and leftover branches
#      carrying this run's track names (the latter hard-fails `git checkout -b`) — and a
#      leftover branch must be classified merged-vs-unmerged before anyone deletes it.
#   2. sprint-execution applied "a self-report is not evidence" to the handover's `Merged`
#      field only, leaving the adjacent `Tests` and `Status` fields unchallenged.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the skills below,
# before merging, to catch a regression back into either bug.
#
# Verified in both directions: fails against `git show main:<path>` (pre-fix), passes
# against the fixed files.
#
# Usage: bash scripts/checks/orchestration-evidence-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: bugfix-wave preflights BOTH classes of prior-session residue =="
BW_FILE="plugins/dev-kit-core/skills/bugfix-wave/SKILL.md"
if [ ! -f "$BW_FILE" ]; then
  echo "FAIL: $BW_FILE not found"
  fail=1
else
  bw_fail=0

  # The preflight must exist as its own numbered step, before the dispatch route is chosen.
  preflight="$(awk '/^### 2\.0 /{f=1} f&&/^### 2\.1 /{exit} f' "$BW_FILE")"
  if [ -z "$preflight" ]; then
    echo "FAIL: no '### 2.0' preflight section ahead of '### 2.1' — the preflight is gone"
    bw_fail=1
  else
    # Residue class A: leftover worktrees.
    echo "$preflight" | grep -q "git worktree list" || {
      echo "FAIL: preflight does not inspect 'git worktree list' for leftover worktrees"; bw_fail=1; }
    echo "$preflight" | grep -q "git worktree remove" || {
      echo "FAIL: preflight states no removal remedy for a leftover worktree"; bw_fail=1; }

    # Residue class B: leftover branches with the same track names. This is the one that
    # hard-fails `git checkout -b`, so the preflight must both look for branches and say so.
    echo "$preflight" | grep -q "git branch --list" || {
      echo "FAIL: preflight does not enumerate existing branches ('git branch --list')"; bw_fail=1; }
    echo "$preflight" | grep -q "git checkout -b" || {
      echo "FAIL: preflight no longer explains that a name collision fails 'git checkout -b'"; bw_fail=1; }

    # A leftover branch is NOT automatically safe to delete: the preflight must classify it
    # by whether it carries unmerged commits, and must say so explicitly.
    echo "$preflight" | grep -q "git log <source-branch>..<branch>" || {
      echo "FAIL: preflight has no 'git log <source-branch>..<branch>' merged-vs-unmerged classification"; bw_fail=1; }
    echo "$preflight" | grep -qi "unmerged" || {
      echo "FAIL: preflight never mentions unmerged commits — a leftover branch may hold real work"; bw_fail=1; }
    echo "$preflight" | grep -qi "not automatically safe to delete" || {
      echo "FAIL: preflight no longer warns that a leftover branch is not automatically safe to delete"; bw_fail=1; }
  fi

  if [ "$bw_fail" -eq 0 ]; then
    echo "PASS: bugfix-wave 2.0 preflights leftover worktrees AND same-name branches, with an"
    echo "      unmerged-work classification before any deletion"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: bugfix-wave's checked-out-branch edge case is multi-cause =="
if [ ! -f "$BW_FILE" ]; then
  echo "FAIL: $BW_FILE not found"
  fail=1
else
  ec_fail=0
  # Isolate the edge-case entry: from its bold lead-in to the next bold lead-in.
  edge="$(awk '/^\*\*Subagent reports `Merged: no`/{f=1;print;next} f&&/^\*\*/{exit} f' "$BW_FILE")"
  if [ -z "$edge" ]; then
    echo "FAIL: the 'Merged: no / branch is currently checked out' edge case is gone"
    ec_fail=1
  else
    # The regression is asserting the skipped detach as THE cause. It may still appear as
    # ONE cause, but only alongside a way to tell causes apart and at least one other cause.
    echo "$edge" | grep -q "git worktree list" || {
      echo "FAIL: edge case gives no mechanical way to tell the causes apart ('git worktree list')"; ec_fail=1; }
    echo "$edge" | grep -qi "primary worktree" || {
      echo "FAIL: edge case omits the primary-worktree cause — the one directly observed in a live run"; ec_fail=1; }
    echo "$edge" | grep -qiE "expected, benign|benign outcome" || {
      echo "FAIL: edge case no longer states that a failed self-merge can be an expected, benign outcome"; ec_fail=1; }
    # The preserved-useful-parts contract.
    echo "$edge" | grep -q "Phase 3.1 step 1" || {
      echo "FAIL: edge case no longer routes reconciliation through Phase 3.1 step 1"; ec_fail=1; }
    echo "$edge" | grep -q "3.2" || {
      echo "FAIL: edge case no longer sends the orchestrator to check for a stale base (3.2)"; ec_fail=1; }
    # Guard against the exact single-cause assertion coming back.
    if echo "$edge" | grep -qE '^\*\*Subagent reports .*: you skipped'; then
      echo "FAIL: the single-cause assertion ('you skipped the ...') has been reinstated as the diagnosis"
      ec_fail=1
    fi
  fi

  if [ "$ec_fail" -eq 0 ]; then
    echo "PASS: edge case enumerates distinct causes, is discriminable via 'git worktree list',"
    echo "      and names the benign case"
  else
    fail=1
  fi
fi

echo
echo "== Check 3: sprint-execution treats all three handover fields as self-reports =="
SE_FILE="plugins/dev-kit-core/skills/sprint-execution/SKILL.md"
if [ ! -f "$SE_FILE" ]; then
  echo "FAIL: $SE_FILE not found"
  fail=1
else
  se_fail=0

  # The three fields the close handover (section 5) actually carries and the orchestrator
  # consumes. Each needs a stated mechanical check in section 6 step 2.
  verify="$(awk '/^2\. \*\*Verify the/{f=1} f&&/^3\. /{exit} f' "$SE_FILE")"
  if [ -z "$verify" ]; then
    echo "FAIL: section 6 step 2 (the verification step) not found"
    se_fail=1
  else
    for field in Merged Tests Status; do
      echo "$verify" | grep -q "\`${field}:\`" || {
        echo "FAIL: section 6 step 2 does not address the \`${field}:\` handover field by name"; se_fail=1; }
    done
    # Merged: the git-range check.
    echo "$verify" | grep -q "git log <integration-branch>..<branch>" || {
      echo "FAIL: the \`Merged\` git-range evidence check is gone"; se_fail=1; }
    # Tests: re-run rather than read, and an honest answer when no suite exists.
    echo "$verify" | grep -qi "re-run the project's test command" || {
      echo "FAIL: \`Tests\` has no re-run-and-compare duty — reading the field is not a check"; se_fail=1; }
    echo "$verify" | grep -qi "no test command" || {
      echo "FAIL: \`Tests\` does not cover the no-test-command case (this repo is one)"; se_fail=1; }
    echo "$verify" | grep -qi "never as passed\|never reported as passed\|never as a passing" || {
      echo "FAIL: the 'an absent check is recorded as absent, never as passed' rule is gone"; se_fail=1; }
    # Status: reconcile against commits/ledger, not against the word in the block.
    echo "$verify" | grep -q "git log <base-commit>..<branch>" || {
      echo "FAIL: \`Status\` has no commit-range reconciliation against the track's brief"; se_fail=1; }
    echo "$verify" | grep -qi "SUMMARY.md" || {
      echo "FAIL: \`Status\` reconciliation no longer requires a committed SUMMARY.md"; se_fail=1; }
  fi

  # The MUST-NOT list must name all three fields, not just Merged.
  rf="$(awk '/^## Red Flags/{f=1} f' "$SE_FILE")"
  for field in Merged Tests Status; do
    echo "$rf" | grep -qE "Accept a track's \`${field}\` field" || {
      echo "FAIL: Red Flags list has no MUST-NOT entry for the \`${field}\` field"; se_fail=1; }
  done

  if [ "$se_fail" -eq 0 ]; then
    echo "PASS: Merged, Tests and Status each carry a mechanical check in 6.2 and a Red Flags entry"
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
