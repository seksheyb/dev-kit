#!/usr/bin/env bash
# Regression guard for the "asset routes to another asset for capability X, but the
# destination has no X" defect class (Milestone-2 bug-fix wave, track: testing).
#
# Concrete instance fixed: plugins/dev-kit-core/agents/gate-automation.md step 5 sends
# Maestro test-authoring to the `test-master` skill via the Skill tool ("invoke the
# test-master skill ... for test-design guidance" for Maestro flows), but test-master
# (SKILL.md + every file under references/) had zero mentions of Maestro anywhere — the
# route existed, the destination that was supposed to receive it didn't. Fixed by adding
# references/maestro-flows.md plus a Reference Guide row in SKILL.md.
#
# Routing pairs live in the ROUTES array below as
#   SOURCE_FILE|DESTINATION_PATH|CAPABILITY_KEYWORD
# DESTINATION_PATH may be a file or a directory (checked recursively). Add a line
# whenever a new "invoke skill/agent X for capability Y" route is introduced elsewhere,
# so this guard keeps covering the whole defect class rather than just this instance.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after touching a routing
# instruction or its destination, before merging.
#
# Usage: bash scripts/checks/skill-routing-capability-guards.sh
# Exit 0: every declared destination actually mentions its routed-for capability.
# Exit 1: at least one destination is silent on the capability it's routed to provide.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

# SOURCE_FILE|DESTINATION_PATH|CAPABILITY_KEYWORD (grep -i, extended regex)
ROUTES=(
  "plugins/dev-kit-core/agents/gate-automation.md|plugins/dev-kit-core/skills/test-master|maestro"
)

for route in "${ROUTES[@]}"; do
  IFS='|' read -r source dest keyword <<< "$route"

  if [ ! -f "$source" ]; then
    echo "FAIL: source file $source not found (route declaration is stale)"
    fail=1
    continue
  fi

  if [ ! -e "$dest" ]; then
    echo "FAIL: destination $dest not found (route declaration is stale)"
    fail=1
    continue
  fi

  if ! grep -Eqi "$keyword" "$source"; then
    echo "WARN: $source no longer mentions '$keyword' — the route may have been reworded or removed; verify by hand"
  fi

  if [ -d "$dest" ]; then
    hit="$(grep -Erli "$keyword" "$dest" 2>/dev/null | head -1)"
  else
    hit="$(grep -Eli "$keyword" "$dest" 2>/dev/null | head -1)"
  fi

  if [ -n "$hit" ]; then
    echo "PASS: $dest covers '$keyword' (routed from $source) — see $hit"
  else
    echo "FAIL: $dest has zero mentions of '$keyword', but $source routes to it for that capability"
    fail=1
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "All routing-capability checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
