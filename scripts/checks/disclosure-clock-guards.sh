#!/usr/bin/env bash
# Regression guard for the "regulatory disclosure clock has no defined start"
# defect class (Milestone-2 bug-fix wave, track ops):
#
#   1. incident-responder.md and compliance-auditor.md both track regulatory
#      disclosure deadlines (breach notification, regulator reporting) but
#      neither ever said what event starts the clock. An agent that starts
#      counting at containment, root-cause confirmation, or when the
#      postmortem/audit is written will systematically under-estimate time
#      remaining and can blow a statutory deadline (e.g. GDPR's 72-hour
#      window, which runs from *awareness*) while believing it has days left.
#   2. compliance-auditor.md's only stated output was a full audit report —
#      the right final deliverable, but the wrong thing to be waiting on
#      while a statutory clock is running, since a complete audit takes
#      longer to produce than most disclosure windows allow.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset
# repo) — this script is NOT wired into any pipeline. Run it by hand after
# editing either file, before merging, to catch a regression back into
# either bug.
#
# Usage: bash scripts/checks/disclosure-clock-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

IR_FILE="plugins/dev-kit-core/agents/incident-responder.md"
CA_FILE="plugins/dev-kit-core/agents/compliance-auditor.md"

# A file "has the discovery-start clause" if it says the clock starts at
# discovery/awareness AND explicitly rules out containment as the start —
# the exact under-counting failure this guard exists to catch.
has_discovery_clause() {
  local f="$1"
  grep -qiE "(clock|deadline)[^.]*(starts?|measured)[^.]*(at|from)[^.]*(discovery|becoming aware|awareness)" "$f" 2>/dev/null \
    && grep -qi "containment" "$f" 2>/dev/null
}

has_interim_artifact() {
  local f="$1"
  grep -qi "Interim Disclosure Assessment" "$f" 2>/dev/null
}

echo "== Check 1: incident-responder.md states the discovery-start rule =="
if [ ! -f "$IR_FILE" ]; then
  echo "FAIL: $IR_FILE not found"
  fail=1
elif has_discovery_clause "$IR_FILE"; then
  echo "PASS: $IR_FILE ties the disclosure clock to discovery, ruling out containment as the start"
else
  echo "FAIL: $IR_FILE has no discovery-start clause (or it no longer rules out containment)"
  fail=1
fi

echo
echo "== Check 2: compliance-auditor.md states the discovery-start rule =="
if [ ! -f "$CA_FILE" ]; then
  echo "FAIL: $CA_FILE not found"
  fail=1
elif has_discovery_clause "$CA_FILE"; then
  echo "PASS: $CA_FILE ties every tracked deadline to discovery, ruling out containment as the start"
else
  echo "FAIL: $CA_FILE has no discovery-start clause (or it no longer rules out containment)"
  fail=1
fi

echo
echo "== Check 3: compliance-auditor.md names its early interim artifact =="
if [ ! -f "$CA_FILE" ]; then
  echo "FAIL: $CA_FILE not found"
  fail=1
elif has_interim_artifact "$CA_FILE"; then
  echo "PASS: $CA_FILE names the Interim Disclosure Assessment"
else
  echo "FAIL: $CA_FILE no longer names an Interim Disclosure Assessment (or it was renamed without updating this guard)"
  fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
