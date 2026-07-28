#!/usr/bin/env bash
# Regression guard for two defect classes fixed on bugfix/w1-track-review
# (dev-kit Milestone-2 bug-fix wave):
#
#   1. Unreachable bootstrap: design-reviewer's regression mode was the ONLY
#      mode that wrote docs/state/baselines/design-baseline.json, but that
#      same mode required the file to already exist to do its load-and-compare
#      step. On a project that never ran regression mode, the file could
#      never be created — the bootstrap was unreachable. Fixed by adding an
#      absent-baseline branch: regression mode establishes the baseline on
#      first run instead of requiring one to already exist.
#
#   2. Hardcoded default: plan-review.md always defaulted to all 4 lenses
#      with no way for a project to configure a smaller default set. Fixed
#      by reading a `## Plan Review Lenses` section from CLAUDE.md first,
#      falling back to all 4 only when no such section (or no CLAUDE.md)
#      exists.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset
# repo) — this script is NOT wired into any pipeline. Run it by hand after
# touching either file, before merging, to catch a regression back into
# either class.
#
# Usage: bash scripts/checks/review-track-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

DESIGN_REVIEWER="plugins/dev-kit-core/agents/design-reviewer.md"
PLAN_REVIEW="plugins/dev-kit-core/commands/plan-review.md"

echo "== Check 1: design-reviewer's regression mode can bootstrap a missing baseline =="
if [ ! -f "$DESIGN_REVIEWER" ]; then
  echo "FAIL: $DESIGN_REVIEWER not found"
  fail=1
else
  # Grab the "- **Regression:**" bullet out of the Modes section.
  regression_line="$(grep -n '^\- \*\*Regression:\*\*' "$DESIGN_REVIEWER" || true)"
  if [ -z "$regression_line" ]; then
    echo "FAIL: no '- **Regression:**' bullet found in $DESIGN_REVIEWER — has the Modes section been renamed?"
    fail=1
  elif ! echo "$regression_line" | grep -qi 'does not exist'; then
    echo "FAIL: the Regression mode description no longer branches on the baseline file being absent."
    echo "      It must run the full audit unconditionally, then only LOAD+COMPARE when the baseline"
    echo "      file exists — and ESTABLISH it (skip the delta section) when it doesn't. Without that"
    echo "      branch, a project that has never run regression mode can never bootstrap the baseline:"
    echo "      the file is written only by the mode that requires it to already exist."
    fail=1
  else
    echo "PASS: Regression mode has an absent-baseline bootstrap branch"
  fi

  # The write step (Phase 6) must not read back as gated on the file already existing.
  if ! grep -q 'bootstrapping the baseline' "$DESIGN_REVIEWER"; then
    echo "FAIL: Phase 6 no longer documents that the baseline write also covers the bootstrap case"
    echo "      (first run, no prior baseline) — re-check the write step still fires regardless of"
    echo "      whether the file pre-existed."
    fail=1
  else
    echo "PASS: Phase 6's baseline write covers both the bootstrap and refresh case"
  fi
fi

echo
echo "== Check 2: plan-review sources its default lens set from configuration, not a bare literal =="
if [ ! -f "$PLAN_REVIEW" ]; then
  echo "FAIL: $PLAN_REVIEW not found"
  fail=1
else
  default_line="$(awk '/none are named/{print; exit}' "$PLAN_REVIEW")"
  if [ -z "$default_line" ]; then
    echo "FAIL: no 'default ... when none are named' sentence found in $PLAN_REVIEW — has the"
    echo "      argument-parsing paragraph been rewritten?"
    fail=1
  elif ! echo "$default_line" | grep -q 'CLAUDE.md'; then
    echo "FAIL: the default-lens sentence no longer reads a project config (CLAUDE.md) before"
    echo "      falling back to all 4 — a hardcoded 'default to all 4' literal with no override path"
    echo "      is exactly the regressed bug: a project wanting a fixed subset has no way to say so."
    fail=1
  else
    echo "PASS: default lens set is sourced from a CLAUDE.md section, falling back to all 4"
  fi

  # The no-ceo-lens and workflow-is-mandatory rules must survive the config change.
  if ! grep -q 'no `ceo`/scope lens' "$PLAN_REVIEW"; then
    echo "FAIL: the explicit 'no ceo/scope lens' note is missing — configurability must not have"
    echo "      quietly reintroduced a way to add it back."
    fail=1
  else
    echo "PASS: the no-ceo-lens note is intact"
  fi
  if ! grep -qE '2 or more lenses.*(Mandatory|mandatory)' "$PLAN_REVIEW"; then
    echo "FAIL: the '2+ lenses is always a Workflow, not an option' rule is missing — a configured"
    echo "      default of 2+ lenses must still take the Workflow path."
    fail=1
  else
    echo "PASS: the 2-or-more-lenses-is-mandatory-Workflow rule is intact"
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
