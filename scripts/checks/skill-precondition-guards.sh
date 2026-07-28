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

echo "== Check 1: design-consultation's downstream-readiness closer is gated on a bound system =="
DC_FILE="plugins/dev-kit-core/skills/design-consultation/SKILL.md"
if [ ! -f "$DC_FILE" ]; then
  echo "FAIL: $DC_FILE not found"
  fail=1
else
  # Post-sweep (Q2 consumer decoupling) the closer no longer names design-html; the invariant
  # it protected survives in consumer-agnostic form: downstream readiness must be conditioned
  # on claude_design_system_id being bound, the unbound branch must warn that bound-system-
  # requiring tooling can't proceed, and no named downstream consumer may reappear.
  dc_fail=0

  grep -qE "if .?claude_design_system_id.? is bound" "$DC_FILE" || {
    echo "FAIL: closer no longer conditions downstream readiness on claude_design_system_id being bound"; dc_fail=1; }

  grep -qE "requires a bound (design )?system (can't|cannot|won't)" "$DC_FILE" || {
    echo "FAIL: unbound branch no longer warns that bound-system-requiring tooling can't proceed"; dc_fail=1; }

  if grep -qn "design-html" "$DC_FILE"; then
    echo "FAIL: named downstream consumer 'design-html' has reappeared in $DC_FILE (Q2 consumer-agnostic contract)"
    dc_fail=1
  fi

  if [ "$dc_fail" -eq 0 ]; then
    echo "PASS: downstream readiness is gated on claude_design_system_id, unbound branch warns, no named consumer"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: code-documenter resolves docstring format with no human turn =="
# Contract (ROADMAP 1.9): format resolves constitution -> existing convention -> language
# default. There is no "ask the user" branch at all, so the skill is unattended-safe by
# construction rather than by having a separate unattended mode.
CD_FILE="plugins/dev-kit-core/skills/code-documenter/SKILL.md"
if [ ! -f "$CD_FILE" ]; then
  echo "FAIL: $CD_FILE not found"
  fail=1
else
  cd_fail=0

  # Tier 1 must consult the constitution at its canonical default path.
  grep -q "docs/global/project/constitution.md" "$CD_FILE" || {
    echo "FAIL: tier 1 gone — no reference to docs/global/project/constitution.md"; cd_fail=1; }

  # A missing/unfilled constitution must fall through, not abort.
  grep -qi "unfilled template" "$CD_FILE" || {
    echo "FAIL: constitution absent/unfilled fallthrough is no longer stated"; cd_fail=1; }

  # Tier 3 must remain the last resort.
  grep -qi "Language-conventional default" "$CD_FILE" || {
    echo "FAIL: tier 3 language-conventional default is missing"; cd_fail=1; }

  # The ask must stay dead. Any bullet reinstating "ask for format" is a regression.
  if grep -Eqi '^[[:space:]]*[-*].*ask (the user )?for format' "$CD_FILE"; then
    echo "FAIL: an 'ask for format' bullet has been reinstated — 1.9 requires no human turn"
    cd_fail=1
  fi

  # MUST DO must state the resolution order; MUST NOT DO must forbid stalling on a human.
  must_do="$(awk '/^### MUST DO/{f=1;next} f&&/^### /{exit} f' "$CD_FILE")"
  must_not="$(awk '/^### MUST NOT DO/{f=1;next} f&&/^### /{exit} f' "$CD_FILE")"
  echo "$must_do" | grep -qi "constitution" || {
    echo "FAIL: MUST DO no longer names the constitution-first resolution order"; cd_fail=1; }
  echo "$must_not" | grep -qi "stall" || {
    echo "FAIL: MUST NOT DO no longer forbids stalling on a human format choice"; cd_fail=1; }

  if [ "$cd_fail" -eq 0 ]; then
    echo "PASS: code-documenter resolves format constitution -> convention -> default, with no ask"
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
