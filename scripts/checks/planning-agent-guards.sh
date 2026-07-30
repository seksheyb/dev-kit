#!/usr/bin/env bash
# Regression guard for two defect classes found in the KICKOFF-duplication audit
# (docs/audits/kickoff-duplication-audit/), fixed on bugfix/w1-track-agents-planning:
#
#   A. Phase-context loader omits artifacts that already exist on disk when the agent
#      runs. The planner loaded CONTEXT/RESEARCH/DISCOVERY but not PHASE/PATTERNS.md,
#      PHASE/UI-SPEC.md or SPEC/AI-SPEC.md, so it planned without inputs it could read.
#      The same shape was swept into plan-reviewer (reviewed plans blind to the phase's
#      own UI-SPEC contract).
#   B. An agent fanned out in parallel writes a fixed set of output files with no
#      per-dispatch argument gating which file it writes. Four parallel
#      project-researcher dispatches all wrote the same four paths in one directory —
#      last writer wins, three dispatches' work discarded. Fixed with `assigned_axis`.
#
#   Also guarded: the `## Parallel Execution Map` template gap — the planner claimed
#   ownership of a section its own PLAN.md template never defined, while
#   gate-plan-review and sprint-execution both score/dispatch its columns.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the agents below,
# before merging, to catch a regression back into either class.
#
# Usage: bash scripts/checks/planning-agent-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

PLANNER="plugins/dev-kit-core/agents/planner.md"
RESEARCHER="plugins/dev-kit-core/agents/project-researcher.md"
REVIEWER="plugins/dev-kit-core/agents/plan-reviewer.md"

# Extract the body of an XML-ish <step name="X"> ... </step> block.
step_block() {
  awk -v want="$1" '
    $0 ~ "<step name=\"" want "\">" { f = 1; next }
    f && /^<\/step>/ { exit }
    f' "$2"
}

echo "== Check 1 (class A): planner's phase-context loader reads the conditional artifacts =="
if [ ! -f "$PLANNER" ]; then
  echo "FAIL: $PLANNER not found"
  fail=1
else
  block="$(step_block gather_phase_context "$PLANNER")"
  if [ -z "$block" ]; then
    echo "FAIL: no <step name=\"gather_phase_context\"> block in $PLANNER — has the loader been renamed?"
    fail=1
  else
    missing=""
    for artifact in PATTERNS.md UI-SPEC.md AI-SPEC.md; do
      echo "$block" | grep -q "$artifact" || missing="$missing $artifact"
    done
    if [ -n "$missing" ]; then
      echo "FAIL: gather_phase_context does not load:$missing"
      echo "      Each is produced upstream (pattern-mapper / ui-researcher / the AI chain) and"
      echo "      exists on disk by the time the planner runs. Load it when present, skip when absent."
      fail=1
    elif ! echo "$block" | grep -qi "never an error"; then
      echo "FAIL: gather_phase_context loads the conditional artifacts but no longer states that"
      echo "      absence is a graceful skip — a loader that treats a missing conditional artifact"
      echo "      as an error is the same bug pointed the other way."
      fail=1
    else
      echo "PASS: planner loads PATTERNS.md, UI-SPEC.md and AI-SPEC.md, and absence is a graceful skip"
    fi
  fi
fi

echo
echo "== Check 2: planner defines the Parallel Execution Map it claims to own =="
if [ ! -f "$PLANNER" ]; then
  echo "FAIL: $PLANNER not found"
  fail=1
else
  # The agent asserts ownership of the section; the spec for it must exist in the same file.
  if ! grep -q "Parallel Execution" "$PLANNER"; then
    echo "FAIL: $PLANNER no longer mentions the Parallel Execution Map at all"
    fail=1
  elif ! grep -q '^| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |' "$PLANNER"; then
    echo "FAIL: the Parallel Execution Map's required column header row is missing from $PLANNER."
    echo "      gate-plan-review scores its Model/Effort columns and sprint-execution dispatches"
    echo "      from it — the planner owns the shape, so the shape must be defined here."
    fail=1
  elif ! grep -q 'Deriving the map' "$PLANNER"; then
    echo "FAIL: the map's derivation rules (wave assignment + same-wave file disjointness) are"
    echo "      missing from $PLANNER — a table shape with no derivation rule is still a gap."
    fail=1
  else
    echo "PASS: Parallel Execution Map structure and derivation rules are defined"
  fi
fi

echo
echo "== Check 3 (class B): project-researcher gates its writes on assigned_axis =="
if [ ! -f "$RESEARCHER" ]; then
  echo "FAIL: $RESEARCHER not found"
  fail=1
else
  step5="$(awk '/^## Step 5: Write Output Files/{f=1} f&&/^## Step 6/{exit} f' "$RESEARCHER")"
  if [ -z "$step5" ]; then
    echo "FAIL: no '## Step 5: Write Output Files' section in $RESEARCHER"
    fail=1
  else
    unconditional="$(echo "$step5" | grep -nE '\*\*(STACK|FEATURES|PITFALLS)\.md\*\*[[:space:]]*(—|-|--)[[:space:]]*Always' || true)"
    if [ -n "$unconditional" ]; then
      echo "FAIL: Step 5 still writes files unconditionally:"
      echo "$unconditional" | sed 's/^/      /'
      echo "      Four parallel dispatches share docs/milestones/<M>/research/ — an unconditional"
      echo "      write means last-writer-wins and three dispatches' work is discarded."
      fail=1
    elif ! echo "$step5" | grep -q 'assigned_axis'; then
      echo "FAIL: Step 5 does not reference assigned_axis — nothing scopes which file this"
      echo "      dispatch writes."
      fail=1
    else
      echo "PASS: Step 5 writes only the file matching assigned_axis"
    fi
  fi

  # The argument must also be declared, or callers have no way to pass it.
  if ! awk '/^<input>/{f=1} f&&/^<\/input>/{exit} f' "$RESEARCHER" | grep -q 'assigned_axis'; then
    echo "FAIL: $RESEARCHER has no <input> block declaring assigned_axis — an argument the"
    echo "      execution flow gates on but never documents cannot be dispatched."
    fail=1
  else
    echo "PASS: <input> block declares assigned_axis"
  fi

  # Comparison/feasibility map 1:1 to a single dispatch and must stay ungated.
  if ! grep -q 'never gated by `assigned_axis`' "$RESEARCHER"; then
    echo "FAIL: $RESEARCHER no longer states that COMPARISON.md / FEASIBILITY.md are exempt"
    echo "      from assigned_axis — gating them would break the single-dispatch modes."
    fail=1
  else
    echo "PASS: comparison/feasibility modes are explicitly left ungated"
  fi
fi

echo
echo "== Check 4 (class A sweep): plan-reviewer reads the plan's sibling phase artifacts =="
if [ ! -f "$REVIEWER" ]; then
  echo "FAIL: $REVIEWER not found"
  fail=1
else
  # The default multi-lens dispatch passes no `context` argument, so the sibling artifacts
  # must be read by the agent itself, not left to the caller.
  if grep -q 'PHASE/UI-SPEC.md' "$REVIEWER" && grep -q 'PHASE/CONTEXT.md' "$REVIEWER"; then
    echo "PASS: plan-reviewer reads the phase's own CONTEXT.md and UI-SPEC.md"
  else
    echo "FAIL: $REVIEWER does not read the plan's sibling phase artifacts. The default 4-lens"
    echo "      dispatch omits the optional 'context' argument entirely, so a reviewer that waits"
    echo "      to be handed them reviews the plan blind — the design lens in particular scores a"
    echo "      UI plan without the phase's own UI-SPEC contract."
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
