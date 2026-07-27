#!/usr/bin/env bash
# Regression guard for the defect found in the roadmap-shortlisted-workflow audit
# (item 2.14), fixed on bugfix/w2-track-rag-diagram:
#
#   rag-architect's Core Workflow step 2 ("Vector Store Design") and step 4
#   ("Retrieval Pipeline") ran unconditionally, re-deriving a vector store /
#   embedding model decision that framework-selector had already made and
#   recorded in AI-SPEC.md Section 2 — producing a second, unreconciled stack
#   answer. Constraints and Output Templates reinforced the unconditional
#   selection as a MUST and a required deliverable.
#
# The fix: Core Workflow step 2 now reads AI-SPEC.md Section 2 first. If a
# decision is already recorded, rag-architect adopts it and only validates it
# against this system's requirements (surfacing genuine conflicts instead of
# silently re-deciding). A missing AI-SPEC.md is non-fatal — it falls back to
# the existing selection flow, matching the constitution.md soft-optional
# pattern already used by analyze/converge/specify. Constraints and Output
# Templates were adjusted to describe the deferring path instead of
# contradicting it.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing
# rag-architect/SKILL.md, before merging, to catch a regression back into this
# bug.
#
# Usage: bash scripts/checks/rag-aispec-deference-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

RAG_FILE="plugins/dev-kit-data-ai/skills/rag-architect/SKILL.md"

echo "== Check 1: Core Workflow step 2 reads AI-SPEC.md Section 2 before selecting =="
if [ ! -f "$RAG_FILE" ]; then
  echo "FAIL: $RAG_FILE not found"
  fail=1
else
  # Isolate the numbered Core Workflow list (between the heading and the next
  # "## " heading) so the check is scoped to step 2, not just anywhere in the file.
  workflow_block="$(awk '/^## Core Workflow/{f=1;next} f&&/^## /{exit} f' "$RAG_FILE")"
  wf_fail=0

  echo "$workflow_block" | grep -Eq '2\. \*\*Vector Store Design\*\*' || {
    echo "FAIL: step 2 'Vector Store Design' no longer found in Core Workflow"; wf_fail=1; }

  echo "$workflow_block" | grep -Fq 'AI-SPEC.md' || {
    echo "FAIL: step 2 no longer reads AI-SPEC.md"; wf_fail=1; }

  echo "$workflow_block" | grep -Eq 'Section 2' || {
    echo "FAIL: step 2 no longer names AI-SPEC.md Section 2"; wf_fail=1; }

  echo "$workflow_block" | grep -Fq 'adopt it' || {
    echo "FAIL: step 2 no longer states it adopts a recorded AI-SPEC.md decision"; wf_fail=1; }

  echo "$workflow_block" | grep -Eqi 'surface (it|any conflict)' || {
    echo "FAIL: step 2 no longer states genuine conflicts must be surfaced to the operator"; wf_fail=1; }

  if [ "$wf_fail" -eq 0 ]; then
    echo "PASS: Core Workflow step 2 reads AI-SPEC.md Section 2, adopts a recorded decision, and surfaces conflicts"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: a missing AI-SPEC.md is treated as non-fatal =="
if [ ! -f "$RAG_FILE" ]; then
  echo "FAIL: $RAG_FILE not found"
  fail=1
else
  if grep -Eq 'missing .?AI-SPEC\.md.? is not fatal' "$RAG_FILE"; then
    echo "PASS: a missing AI-SPEC.md is explicitly stated as non-fatal"
  else
    echo "FAIL: no 'missing AI-SPEC.md is not fatal' statement found — matches analyze/converge/specify's constitution.md soft-optional phrasing"
    fail=1
  fi
fi

echo
echo "== Check 3: Constraints and Output Templates no longer demand an unconditional independent selection =="
if [ ! -f "$RAG_FILE" ]; then
  echo "FAIL: $RAG_FILE not found"
  fail=1
else
  ct_fail=0

  must_do="$(awk '/^### MUST DO/{f=1;next} f&&/^### /{exit} f' "$RAG_FILE")"
  echo "$must_do" | grep -Fq 'Evaluate multiple embedding models' || {
    echo "FAIL: MUST DO no longer mentions evaluating embedding models"; ct_fail=1; }
  echo "$must_do" | grep -Fq 'AI-SPEC.md' || {
    echo "FAIL: MUST DO's embedding-model bullet no longer conditions on AI-SPEC.md"; ct_fail=1; }

  output_templates="$(awk '/^## Output Templates/{f=1;next} f&&/^## /{exit} f' "$RAG_FILE")"
  echo "$output_templates" | grep -Fq 'Vector database selection with trade-off analysis' || {
    echo "FAIL: Output Templates no longer has the vector database selection deliverable"; ct_fail=1; }
  echo "$output_templates" | grep -Fq 'AI-SPEC stack decision plus validation' || {
    echo "FAIL: Output Templates no longer offers the AI-SPEC-deferred deliverable alternative"; ct_fail=1; }

  if [ "$ct_fail" -eq 0 ]; then
    echo "PASS: Constraints and Output Templates describe the AI-SPEC-deferring path, not just an unconditional independent selection"
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
