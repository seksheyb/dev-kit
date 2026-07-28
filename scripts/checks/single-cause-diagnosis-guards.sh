#!/usr/bin/env bash
# Regression guard for the single-cause-diagnosis-for-a-multi-cause-symptom defect
# class (roadmap items 2.15, 2.19, and their parent 2.2):
#
#   A skill asserts one specific cause as fact for a symptom that a competent
#   operator would recognize can arise from several distinct root causes (a
#   partial merge, a failed script, a revert, a same-context self-review that
#   shares its own blind spots, etc). Naming one cause authoritatively sends
#   the operator looking for a person/process to blame instead of reading the
#   evidence. The fix shape is: state the symptom, list the plausible causes
#   (or leave the door open to more than one), and point at the evidence
#   needed to identify which one actually happened — never assert a single
#   cause as settled fact.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing the
# skills below, before merging, to catch a regression back into either bug.
#
# Usage: bash scripts/checks/single-cause-diagnosis-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: ship's VERSION/manifest mismatch names multiple candidate causes =="
SHIP_FILE="plugins/dev-kit-core/skills/ship/SKILL.md"
if [ ! -f "$SHIP_FILE" ]; then
  echo "FAIL: $SHIP_FILE not found"
  fail=1
else
  ship_fail=0

  # The old bare assertion must be gone.
  if grep -q "means a manual edit" "$SHIP_FILE"; then
    echo "FAIL: $SHIP_FILE still asserts a mismatch 'means a manual edit' (single-cause claim)"
    ship_fail=1
  fi

  # The mismatch line must name more than one plausible cause, not just swap
  # in a different single culprit.
  mismatch_line="$(grep -n "mismatch means" "$SHIP_FILE" || true)"
  if [ -z "$mismatch_line" ]; then
    echo "FAIL: no 'mismatch means ...' line found in $SHIP_FILE — has Step 7 been reworded away entirely?"
    ship_fail=1
  else
    causes_named=0
    for cause in "partial merge" "failed release script" "revert" "manual edit"; do
      echo "$mismatch_line" | grep -qi "$cause" && causes_named=$((causes_named + 1))
    done
    if [ "$causes_named" -lt 2 ]; then
      echo "FAIL: mismatch line names fewer than 2 candidate causes: $mismatch_line"
      ship_fail=1
    fi
    # Must point at evidence, not just list causes and stop.
    echo "$mismatch_line" | grep -qi "git log" || {
      echo "FAIL: mismatch line no longer points at git log as the evidence to check"
      ship_fail=1
    }
  fi

  if [ "$ship_fail" -eq 0 ]; then
    echo "PASS: ship names multiple candidate causes for a VERSION/manifest mismatch and points at git log"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: cso's self-verified fallback stays visible in the findings output =="
CSO_FILE="plugins/dev-kit-core/skills/cso/SKILL.md"
if [ ! -f "$CSO_FILE" ]; then
  echo "FAIL: $CSO_FILE not found"
  fail=1
else
  cso_fail=0

  # The Parallel verification paragraph must wire its "Self-verified" note to
  # a distinct SELF-VERIFIED status, not just leave it as a note that never
  # reaches the output.
  parallel_para="$(grep -n "Parallel verification" "$CSO_FILE" || true)"
  if [ -z "$parallel_para" ]; then
    echo "FAIL: no 'Parallel verification' section found in $CSO_FILE"
    cso_fail=1
  else
    # Case-sensitive, backtick-wrapped match: the bare bugged text quotes
    # "Self-verified" (double quotes, no backticks) as a plain note with no
    # link to Status, so a loose case-insensitive substring match would pass
    # on the old text too. Require the fixed phrasing's literal marker.
    grep -A2 "Parallel verification" "$CSO_FILE" | grep -q '`SELF-VERIFIED`' || {
      echo "FAIL: the self-verify fallback no longer names a distinct \`SELF-VERIFIED\` status"
      cso_fail=1
    }
  fi

  # The per-finding Status enum must offer SELF-VERIFIED as its own value,
  # distinct from VERIFIED, so a same-context self-read can never render
  # identically to an independently confirmed finding.
  status_line="$(grep -n "^\* Status:" "$CSO_FILE" || true)"
  if [ -z "$status_line" ]; then
    echo "FAIL: no '* Status: ...' per-finding line found in $CSO_FILE"
    cso_fail=1
  else
    echo "$status_line" | grep -qi "SELF-VERIFIED" || {
      echo "FAIL: per-finding Status enum is missing SELF-VERIFIED: $status_line"
      cso_fail=1
    }
  fi

  if [ "$cso_fail" -eq 0 ]; then
    echo "PASS: cso's self-verified fallback is wired to a distinct, visible SELF-VERIFIED status"
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
