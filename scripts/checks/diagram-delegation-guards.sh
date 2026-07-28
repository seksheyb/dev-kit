#!/usr/bin/env bash
# Regression guard for diagram-deliverable-without-delegation defects.
#
# Original defect class, found in the KICKOFF-duplication audit
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
# Extended for item 2.18 (kickoff-duplication audit; see ROADMAP.md), fixed on
# bugfix/w2-track-rag-diagram: four more skills named a diagram as a required
# deliverable without routing to the `diagram` skill — cloud-architect,
# microservices-architect, rag-architect, and growth-loops. Each now invokes
# `diagram` via the Skill tool the same way architecture-designer does. Three
# other rows from the same audit were assessed and left unchanged because they
# are not instances of the defect: api-designer:22 (an internal sketch step,
# not a shipped deliverable), api-designer:205 (deliverable is "diagram or
# table" — optional by construction), microservices-architect:3 (frontmatter
# description prose, not an instruction — architecture-designer's own
# frontmatter sets this precedent), and network-engineer:143 ("Review
# architecture diagrams" consumes a diagram as input, it does not produce
# one) — Check 3 below intentionally does not touch these four.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing any
# skill below, before merging, to catch a regression back into any of these
# bugs.
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
echo "== Check 3: the four 2.18 assets delegate their diagram deliverable to skills/diagram =="

# Each entry: "file|marker text unique to the diagram deliverable line"
CHECK3_ASSETS=(
  "plugins/dev-kit-infra/skills/cloud-architect/SKILL.md|Architecture diagram with services and data flow"
  "plugins/dev-kit-backend/skills/microservices-architect/SKILL.md|Service boundary diagram with bounded contexts"
  "plugins/dev-kit-data-ai/skills/rag-architect/SKILL.md|System architecture diagram (ingestion + retrieval pipelines)"
  "plugins/dev-kit-product/skills/growth-loops/SKILL.md|Loop diagram with metrics at each step"
)

for entry in "${CHECK3_ASSETS[@]}"; do
  asset_file="${entry%%|*}"
  marker="${entry#*|}"

  if [ ! -f "$asset_file" ]; then
    echo "FAIL: $asset_file not found"
    fail=1
    continue
  fi

  asset_fail=0

  # The deliverable line itself must still exist.
  grep -Fq "$marker" "$asset_file" || {
    echo "FAIL: $asset_file no longer contains the diagram deliverable line ('$marker')"; asset_fail=1; }

  # That same line must delegate to the diagram skill via the Skill tool —
  # check the line and its immediate neighbors, not the whole file, so an
  # unrelated delegation phrase elsewhere doesn't mask a missing one here.
  if grep -Fq "$marker" "$asset_file"; then
    context="$(grep -F -A1 "$marker" "$asset_file")"
    echo "$context" | grep -Fq 'invoke the `diagram` skill via the Skill tool' || {
      echo "FAIL: $asset_file's diagram deliverable line does not delegate to the diagram skill"; asset_fail=1; }
  fi

  if [ "$asset_fail" -eq 0 ]; then
    echo "PASS: $asset_file delegates its diagram deliverable to the diagram skill"
  else
    fail=1
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
