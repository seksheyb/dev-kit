#!/usr/bin/env bash
# Regression guard for two defect classes found in the KICKOFF-duplication audit
# (docs/audits/kickoff-duplication-audit/), fixed on bugfix/w1-track-diagrams:
#
#   1. architecture-designer carried its own mermaid guidance ("Mermaid
#      preferred" + a full inline ```mermaid example) instead of delegating
#      diagram production to the dedicated `diagram` skill, which owns
#      mermaid mechanics/rendering/file placement.
#   2. diagram had no duty to keep an `.mmd` file and any ```mermaid fence
#      embedded from it in sync in either direction, so the two copies could
#      silently diverge the first time either side was edited.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing
# either skill below, before merging, to catch a regression back into either
# bug.
#
# Usage: bash scripts/checks/diagram-delegation-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

AD_FILE="plugins/dev-kit-core/skills/architecture-designer/SKILL.md"
DIAG_FILE="plugins/dev-kit-core/skills/diagram/SKILL.md"

echo "== Check 1: architecture-designer delegates diagram production to the diagram skill =="
if [ ! -f "$AD_FILE" ]; then
  echo "FAIL: $AD_FILE not found"
  fail=1
else
  ad_fail=0

  # Must invoke the diagram skill via the Skill tool, matching the repo's
  # existing cross-invocation idiom (agents/gate-automation.md).
  if grep -Eq 'invoke the `diagram` skill via the Skill tool' "$AD_FILE"; then
    : # OK
  else
    echo "FAIL: no 'invoke the \`diagram\` skill via the Skill tool' phrase found in $AD_FILE"
    ad_fail=1
  fi

  # Must NOT carry its own inline mermaid example/mechanics again — that's
  # exactly the duplication this fix removed.
  if grep -Fq '```mermaid' "$AD_FILE"; then
    echo "FAIL: $AD_FILE contains an inline \`\`\`mermaid fence again — diagram mechanics belong to the diagram skill"
    ad_fail=1
  fi

  if [ "$ad_fail" -eq 0 ]; then
    echo "PASS: architecture-designer delegates to diagram and carries no inline mermaid mechanics"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: diagram states a two-directional re-sync duty for embedded fences =="
if [ ! -f "$DIAG_FILE" ]; then
  echo "FAIL: $DIAG_FILE not found"
  fail=1
else
  diag_fail=0

  # A marking convention must exist so an embedded fence's source .mmd is
  # mechanically discoverable.
  grep -q 'diagram:source=' "$DIAG_FILE" || {
    echo "FAIL: no 'diagram:source=' marking convention found in $DIAG_FILE"; diag_fail=1; }

  # Direction 1: .mmd edited -> propagate to every embedded fence derived from it.
  if grep -Eq '\*\*`\.mmd`[[:space:]]edited\*\*' "$DIAG_FILE"; then
    : # OK
  else
    echo "FAIL: no '.mmd edited -> update fences' duty found in $DIAG_FILE"
    diag_fail=1
  fi

  # Direction 2: fence edited in place -> write back to the .mmd.
  if grep -Eiq 'fence edited in place' "$DIAG_FILE"; then
    : # OK
  else
    echo "FAIL: no 'fence edited in place -> write back to .mmd' duty found in $DIAG_FILE"
    diag_fail=1
  fi

  if [ "$diag_fail" -eq 0 ]; then
    echo "PASS: diagram states the marking convention and both re-sync directions"
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
