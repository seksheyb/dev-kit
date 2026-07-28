#!/usr/bin/env bash
# Regression guard for the PRD-retirement contract change.
#
# Item 2 of docs/audits/kickoff-duplication-audit/roadmap-shortlisted-workflow.md:
# `docs/global/requirements/PRD.md` was filed as a global, project-lifetime doc but
# duplicated `docs/global/project/PROJECT.md`'s role and was authored by nothing in
# the pipeline — it was only ever an operator-supplied input, live exactly once.
# The decision: retire the path entirely, at every tier, with no replacement file.
#
#   - `docs/global/project/PROJECT.md` owns "what is this product, why, for whom".
#   - `SPEC/spec.md` plus the milestone `REQUIREMENTS.md` rollup are the
#     milestone-scoped requirements artifact.
#   - `specify` is the entry point for EVERY milestone: milestone 1 consumes the
#     operator's raw input directly, milestone 2+ consumes BACKLOG.md's Now/Next.
#     Milestone 1 is no longer a special case.
#   - The two Stage 0 exception paths (`gate-reverse-engineer` for legacy code,
#     `doc-classifier`/`doc-synthesizer` for an ingested doc pile) write their
#     recovered requirements under `docs/state/intel/` as milestone-1 SEED INPUT,
#     never as a persisted PRD in the project's doc tree.
#
# "PRD" survives as a *type of incoming external document* in the doc-ingest
# taxonomy (ADR > SPEC > PRD > DOC). That is not the defect and this guard does
# not touch it — the defect is dev-kit maintaining a PRD of its own.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing the
# sitemap, `specify`, or either exception path, before merging.
#
# Usage: bash scripts/checks/prd-retirement-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

SITEMAPS=(
  "plugins/dev-kit-core/references/doc-sitemap.md"
  "plugins/dev-kit-data-ai/references/doc-sitemap.md"
  "docs/SITEMAP.md"
)

SPECIFY_FILE="plugins/dev-kit-core/skills/specify/SKILL.md"
GRE_FILE="plugins/dev-kit-core/agents/gate-reverse-engineer.md"
SYNTH_FILE="plugins/dev-kit-core/agents/doc-synthesizer.md"
CLASSIFIER_FILE="plugins/dev-kit-core/agents/doc-classifier.md"
PIPELINE_FILE="docs/gwd-pipeline-on-devkit.md"

echo "== Check 1: every sitemap copy retires PRD.md and re-introduces it nowhere =="
for sm in "${SITEMAPS[@]}"; do
  if [ ! -f "$sm" ]; then
    echo "FAIL: $sm not found"
    fail=1
    continue
  fi

  sm_fail=0

  # The "Retired paths" section must exist, and must carry the PRD row.
  grep -q '^## Retired paths' "$sm" || {
    echo "FAIL: $sm has no '## Retired paths' section"; sm_fail=1; }

  awk '/^## Retired paths/{f=1} f' "$sm" | grep -Fq 'docs/global/requirements/PRD.md' || {
    echo "FAIL: $sm's Retired paths section does not list docs/global/requirements/PRD.md"; sm_fail=1; }

  # The canonical tree and the migration map (everything BEFORE Retired paths)
  # must contain no PRD path at all — that is the row this change deleted.
  if awk '/^## Retired paths/{exit} {print}' "$sm" | grep -q 'PRD'; then
    echo "FAIL: $sm re-introduces a PRD path above the Retired paths section:"
    awk '/^## Retired paths/{exit} {print}' "$sm" | grep -n 'PRD' | sed 's/^/       /'
    sm_fail=1
  fi

  # The requirements tier keeps BACKLOG.md and TODOS.md — and nothing else.
  # (The PRD row's deletion is what makes this a two-entry tier; assert the whole
  # set, so a re-added third entry is caught even if it is not named "PRD".)
  tier_entries="$(awk '/^\xe2\x94\x82   \xe2\x94\x9c\xe2\x94\x80\xe2\x94\x80 requirements\//{f=1;next} f&&!/^\xe2\x94\x82   \xe2\x94\x82/{exit} f' "$sm" \
                  | grep -oE '[A-Za-z-]+\.md' | sort | tr '\n' ' ')"
  if [ "$tier_entries" != "BACKLOG.md TODOS.md " ]; then
    echo "FAIL: $sm's docs/global/requirements/ tier is '${tier_entries}', expected 'BACKLOG.md TODOS.md '"
    sm_fail=1
  fi

  if [ "$sm_fail" -eq 0 ]; then
    echo "PASS: $sm"
  else
    fail=1
  fi
done

echo
echo "== Check 2: the two plugin sitemap copies stay byte-identical =="
if cmp -s "${SITEMAPS[0]}" "${SITEMAPS[1]}"; then
  echo "PASS: the dev-kit-core and dev-kit-data-ai sitemap copies match"
else
  echo "FAIL: ${SITEMAPS[0]} and ${SITEMAPS[1]} have diverged"
  fail=1
fi

echo
echo "== Check 3: no asset names docs/global/requirements/PRD.md as a live path =="
# Every surviving mention outside the sitemaps must be a NEGATION — the asset
# saying the path is retired — not an instruction to read or write it. The
# retired-ness must appear on the mention's own line or the one after it, so a
# disclaimer elsewhere in the file cannot mask a live reference here.
c3_fail=0
while IFS= read -r hit; do
  hit_file="${hit%%:*}"
  rest="${hit#*:}"
  hit_line="${rest%%:*}"
  window="$(sed -n "${hit_line},$((hit_line + 1))p" "$hit_file")"
  if ! echo "$window" | grep -Eiq 'retired|has no|dev-kit has \*\*no PRD\*\*'; then
    echo "FAIL: $hit_file:$hit_line names docs/global/requirements/PRD.md without marking it retired"
    c3_fail=1
  fi
done < <(grep -rn 'docs/global/requirements/PRD\.md' plugins/ docs/ \
           --exclude=doc-sitemap.md --exclude=SITEMAP.md \
           --exclude-dir=audits 2>/dev/null)

# And no such file may actually exist in the tree.
if find . -path ./.git -prune -o -name 'PRD.md' -print 2>/dev/null | grep -q .; then
  echo "FAIL: a PRD.md file exists in the repo tree:"
  find . -path ./.git -prune -o -name 'PRD.md' -print | sed 's/^/       /'
  c3_fail=1
fi

if [ "$c3_fail" -eq 0 ]; then
  echo "PASS: every surviving mention is a negation, and no PRD.md file exists"
else
  fail=1
fi

echo
echo "== Check 4: specify is the entry point for every milestone, PRD-free =="
if [ ! -f "$SPECIFY_FILE" ]; then
  echo "FAIL: $SPECIFY_FILE not found"
  fail=1
else
  sp_fail=0

  grep -q '^## Intake' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE has no '## Intake' section"; sp_fail=1; }

  # Milestone 1 is explicitly not a special case.
  grep -Eiq 'Milestone 1 is not a special case' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE does not state that milestone 1 is not a special case"; sp_fail=1; }

  # Both intake sources named: raw operator input (M1) and BACKLOG Now/Next (M2+).
  grep -Eiq "operator's raw input" "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE does not name the operator's raw input as milestone 1's input"; sp_fail=1; }
  grep -Fq 'docs/global/requirements/BACKLOG.md' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE does not name BACKLOG.md as the milestone 2+ input"; sp_fail=1; }

  # Seed material from the exception paths is optional and never required.
  grep -Fq 'docs/state/intel/recovered-requirements.md' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE does not fold in the legacy-recovery seed file"; sp_fail=1; }
  grep -Fq 'docs/state/intel/requirements.md' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE does not fold in the doc-ingest seed file"; sp_fail=1; }

  # The prohibition must be explicit, not merely implied by omission.
  grep -Eiq 'Wait for, request, or write a PRD' "$SPECIFY_FILE" || {
    echo "FAIL: $SPECIFY_FILE has no explicit MUST-NOT against waiting for/writing a PRD"; sp_fail=1; }

  if [ "$sp_fail" -eq 0 ]; then
    echo "PASS: specify consumes raw input for milestone 1 and never presupposes a PRD"
  else
    fail=1
  fi
fi

echo
echo "== Check 5: the two exception paths write seed input, not a PRD =="
ex_fail=0

if [ ! -f "$GRE_FILE" ]; then
  echo "FAIL: $GRE_FILE not found"
  ex_fail=1
else
  grep -Fq 'docs/state/intel/recovered-requirements.md' "$GRE_FILE" || {
    echo "FAIL: $GRE_FILE does not write recovered requirements to docs/state/intel/"; ex_fail=1; }
  # It must never write into the global requirements tier at all.
  if grep -n 'Write to `docs/global/requirements/' "$GRE_FILE" | grep -q .; then
    echo "FAIL: $GRE_FILE writes into docs/global/requirements/ again"
    ex_fail=1
  fi
  grep -Eiq 'seed input' "$GRE_FILE" || {
    echo "FAIL: $GRE_FILE does not mark its recovered requirements as seed input"; ex_fail=1; }
fi

if [ ! -f "$SYNTH_FILE" ]; then
  echo "FAIL: $SYNTH_FILE not found"
  ex_fail=1
else
  grep -Eiq 'never a dev-kit artifact' "$SYNTH_FILE" || {
    echo "FAIL: $SYNTH_FILE does not scope \"PRD\" to an ingested external document type"; ex_fail=1; }
  grep -Eiq 'Persist an ingested PRD as a project doc' "$SYNTH_FILE" || {
    echo "FAIL: $SYNTH_FILE has no MUST-NOT against persisting an ingested PRD"; ex_fail=1; }
fi

if [ ! -f "$CLASSIFIER_FILE" ]; then
  echo "FAIL: $CLASSIFIER_FILE not found"
  ex_fail=1
else
  # doc-classifier routes into doc-synthesizer, so it must carry the same scoping
  # standalone — most of these assets are also invoked with no pipeline in the loop.
  grep -Eiq 'type of \*?incoming\*? document' "$CLASSIFIER_FILE" || {
    echo "FAIL: $CLASSIFIER_FILE does not scope \"PRD\" to an incoming document type"; ex_fail=1; }
fi

if [ "$ex_fail" -eq 0 ]; then
  echo "PASS: gate-reverse-engineer, doc-synthesizer and doc-classifier all treat PRD as input, never as an artifact"
else
  fail=1
fi

echo
echo "== Check 6: the pipeline walkthrough drops the milestone-1 PRD special case =="
if [ ! -f "$PIPELINE_FILE" ]; then
  echo "FAIL: $PIPELINE_FILE not found"
  fail=1
else
  pl_fail=0

  grep -Eiq 'there is no PRD, at any tier|there is no PRD at any tier' "$PIPELINE_FILE" || {
    echo "FAIL: $PIPELINE_FILE does not state that there is no PRD at any tier"; pl_fail=1; }
  grep -Eiq 'milestone 1 is not a special case' "$PIPELINE_FILE" || {
    echo "FAIL: $PIPELINE_FILE Stage 1 does not state that milestone 1 is not a special case"; pl_fail=1; }
  grep -Eiq 'Neither exception path writes a PRD into' "$PIPELINE_FILE" || {
    echo "FAIL: $PIPELINE_FILE Stage 0 does not state that neither exception path writes a PRD"; pl_fail=1; }
  # Stage 3's REQUIREMENTS.md rollup is what makes the retirement safe (ROADMAP 1.4).
  grep -Fq 'docs/milestones/<M>/REQUIREMENTS.md' "$PIPELINE_FILE" || {
    echo "FAIL: $PIPELINE_FILE no longer names the milestone REQUIREMENTS.md rollup"; pl_fail=1; }

  if [ "$pl_fail" -eq 0 ]; then
    echo "PASS: Stage 0/1 treat every milestone identically and name no PRD"
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
