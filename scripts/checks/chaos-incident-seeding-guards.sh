#!/usr/bin/env bash
# Regression guard for the "known upstream artifact has a producer in-repo but no
# consumer read" defect class (ROADMAP.md 2.13, dev-kit-infra track chaos):
#
#   1. chaos-engineer designed experiments purely from an architecture diagram and
#      never read this system's own incident history, even though incident-responder
#      already writes blameless postmortems to `docs/global/ops/postmortems/` and
#      runbook updates to `docs/global/ops/runbooks/` (see
#      plugins/dev-kit-core/agents/incident-responder.md:28,31). Experiments should be
#      seeded from what has actually broken, ranked ahead of speculative,
#      architecture-derived hypotheses.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing
# plugins/dev-kit-infra/skills/chaos-engineer/SKILL.md, before merging, to catch a
# regression back into the bug.
#
# Usage: bash scripts/checks/chaos-incident-seeding-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: chaos-engineer/SKILL.md's Core Workflow references docs/global/ops/postmortems/ =="
CE_FILE="plugins/dev-kit-infra/skills/chaos-engineer/SKILL.md"
if [ ! -f "$CE_FILE" ]; then
  echo "FAIL: $CE_FILE not found"
  fail=1
else
  # Extract the ## Core Workflow section only (up to the next ## heading), so a
  # postmortems mention elsewhere in the file (e.g. an unrelated example) doesn't
  # count — the wiring must live in the workflow step itself.
  core_workflow="$(awk '/^## Core Workflow/{f=1;next} f&&/^## /{exit} f' "$CE_FILE")"

  if [ -z "$core_workflow" ]; then
    echo "FAIL: no '## Core Workflow' section found in $CE_FILE"
    fail=1
  else
    ce_fail=0

    echo "$core_workflow" | grep -q "docs/global/ops/postmortems/" || {
      echo "FAIL: Core Workflow no longer references docs/global/ops/postmortems/"; ce_fail=1; }

    echo "$core_workflow" | grep -q "docs/global/ops/runbooks/" || {
      echo "FAIL: Core Workflow no longer references docs/global/ops/runbooks/"; ce_fail=1; }

    # Step 1 (System Analysis) must be the one doing the reading.
    echo "$core_workflow" | grep -E "^1\." | grep -q "docs/global/ops/postmortems/" || {
      echo "FAIL: step 1 (System Analysis) no longer reads docs/global/ops/postmortems/"; ce_fail=1; }

    # Step 2 (Experiment Design) must consume what step 1 found, not just read it and
    # drop it on the floor.
    echo "$core_workflow" | grep -E "^2\." | grep -qi "postmortem\|runbook\|Step 1" || {
      echo "FAIL: step 2 (Experiment Design) no longer consumes postmortem/runbook findings"; ce_fail=1; }

    # Missing/empty directories must stay non-fatal, matching the analyze/converge
    # convention for a missing constitution.
    echo "$core_workflow" | grep -qi "not fatal" || {
      echo "FAIL: Core Workflow no longer states that a missing/empty postmortems dir is non-fatal"; ce_fail=1; }

    if [ "$ce_fail" -eq 0 ]; then
      echo "PASS: Core Workflow reads postmortems/runbooks in step 1 and ranks them in step 2, non-fatally"
    else
      fail=1
    fi
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
