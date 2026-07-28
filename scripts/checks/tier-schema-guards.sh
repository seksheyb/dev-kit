#!/usr/bin/env bash
# Regression guard for "clause 1"-class findings-contract fixes surfaced by the QA
# findings-contract audit (docs/audits/kickoff-duplication-audit/
# roadmap-shortlisted-workflow.md, item 6): a declared tier must have a field to
# land in — an enum value, schema field, or template slot in the asset's OWN
# output. Each check below asserts one such fixed state so it cannot silently
# regress back to an implicit-pass collapse (a tier that exists in prose but has
# no schema slot, a caveat/skip/indeterminate outcome that can vanish or get
# folded into a clean/determinate result).
#
# Checks 1-3 cover the original three (doc-verifier / nyquist-auditor /
# integration-checker); each has since been extended with additional assertions
# for further Q5 fixes to the same file. Checks 4+ cover the rest of the
# per-asset sweep, one check per asset (entries for the same asset are folded
# into a single check block).
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo,
# with one small exception — plan-review.workflow.mjs, exercised with a real
# `node` invocation in Check 40) — this script is NOT wired into any pipeline.
# Run it by hand after editing any asset below, before merging, to catch a
# regression back into any of these fixes.
#
# Usage: bash scripts/checks/tier-schema-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

echo "== Check 1: doc-verifier represents UNVERIFIABLE and SKIP, not just PASS/FAIL =="
DV_FILE="plugins/dev-kit-core/agents/doc-verifier.md"
if [ ! -f "$DV_FILE" ]; then
  echo "FAIL: $DV_FILE not found"
  fail=1
else
  dv_fail=0

  # The adversarial_stance must declare the third outcome explicitly, not
  # just PASS/FAIL.
  grep -q "UNVERIFIABLE" "$DV_FILE" || {
    echo "FAIL: no UNVERIFIABLE tier declared in $DV_FILE"; dv_fail=1; }

  # The three-way resolution must be spelled out (regression signature of the
  # original bug: a two-way PASS/FAIL sentence with no third option).
  grep -q "PASS, FAIL (BLOCKER), or UNVERIFIABLE (WARNING" "$DV_FILE" || {
    echo "FAIL: claim resolution is not explicitly three-way (PASS / FAIL / UNVERIFIABLE)"; dv_fail=1; }

  # The output schema needs an actual field to land in, not just prose.
  grep -q '"claims_unverifiable"' "$DV_FILE" || {
    echo "FAIL: output_format JSON has no 'claims_unverifiable' field"; dv_fail=1; }
  grep -q '"unverifiable":' "$DV_FILE" || {
    echo "FAIL: output_format JSON has no 'unverifiable' array"; dv_fail=1; }

  # The critical_rules must forbid silently folding UNVERIFIABLE into SKIP or
  # PASS — this is the exact failure mode the tier exists to prevent.
  grep -qi "Never collapse UNVERIFIABLE into SKIP or PASS" "$DV_FILE" || {
    echo "FAIL: no rule forbidding UNVERIFIABLE from collapsing into SKIP/PASS"; dv_fail=1; }

  # --- extension: SKIP must also have a real field to land in, distinct from
  # a claim silently excluded from claims_checked with no count and no array
  # anywhere in the output (the pre-fix bug's regression signature). ---
  grep -q '"claims_skipped"' "$DV_FILE" || {
    echo "FAIL: output_format JSON has no 'claims_skipped' field"; dv_fail=1; }
  grep -q '"skipped":' "$DV_FILE" || {
    echo "FAIL: output_format JSON has no 'skipped' array"; dv_fail=1; }
  grep -q 'claims_skipped.*MUST equal .skipped\.length' "$DV_FILE" || {
    echo "FAIL: critical_rules no longer requires claims_skipped == skipped.length"; dv_fail=1; }

  if [ "$dv_fail" -eq 0 ]; then
    echo "PASS: doc-verifier's schema has UNVERIFIABLE and SKIP fields/slots distinct from PASS/FAIL"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: nyquist-auditor represents a caveated pass AND a justified SKIP, not just bare green =="
NA_FILE="plugins/dev-kit-core/agents/nyquist-auditor.md"
if [ ! -f "$NA_FILE" ]; then
  echo "FAIL: $NA_FILE not found"
  fail=1
else
  na_fail=0

  # The classification step must name a caveated pass as its own WARNING-tier
  # outcome, distinct from a clean pass.
  grep -qi "Caveated pass (WARNING)" "$NA_FILE" || {
    echo "FAIL: no 'Caveated pass (WARNING)' classification found"; na_fail=1; }

  # The per-gap schema needs an actual field to land in: a caveat string that
  # can be non-null, not just a bare status.
  grep -q 'caveat: null | "{' "$NA_FILE" || {
    echo "FAIL: resolved-gap schema has no 'caveat: null | \"{...}\"' field"; na_fail=1; }

  # A caveated pass must be wired all the way to the report, not just
  # classified and dropped: the structured returns need a dedicated Caveats
  # section (checked in both GAPS FILLED and PARTIAL formats).
  caveats_sections="$(grep -c "^### Caveats" "$NA_FILE")"
  if [ "$caveats_sections" -lt 2 ]; then
    echo "FAIL: expected a '### Caveats' section in both GAPS FILLED and PARTIAL formats, found $caveats_sections"
    na_fail=1
  fi

  # Regression signature of the original bug: the run_and_verify step recorded
  # any pass unconditionally ("If passes: record success") with no
  # classification step at all — i.e. a pass is recorded without ever being
  # run through the clean-vs-caveated split.
  if grep -qE 'If passes: record success' "$NA_FILE"; then
    echo "FAIL: run_and_verify still records a pass unconditionally, in the exact shape of the pre-fix bug"
    na_fail=1
  fi

  # success_criteria must hold the line so a future edit can't quietly drop
  # the wiring while leaving the schema field behind.
  grep -qi "never folded silently into a plain green" "$NA_FILE" || {
    echo "FAIL: success_criteria no longer forbids folding a caveat silently into a plain green"; na_fail=1; }

  # --- extension: SKIP needs the same real-field treatment as the caveat did.
  # Regression signature of the original bug: only BLOCKER/WARNING-shaped
  # bullets exist in the classification list, SKIP mentioned only in the
  # three-way-taxonomy sentence with no bullet of its own. ---
  grep -qE '^\s*-\s+\*\*SKIP\*\*' "$NA_FILE" || {
    echo "FAIL: no SKIP classification bullet in <adversarial_stance>'s finding-classification list"; na_fail=1; }
  grep -q 'Skipped gaps:' "$NA_FILE" || {
    echo "FAIL: no 'Skipped gaps:' schema line distinct from Resolved/Escalated gaps"; na_fail=1; }
  skipped_headings="$(grep -c '^### Skipped' "$NA_FILE")"
  if [ "$skipped_headings" -lt 1 ]; then
    echo "FAIL: expected a '### Skipped' heading in structured_returns, found $skipped_headings"
    na_fail=1
  fi
  grep -q '\*\*Skipped:\*\*' "$NA_FILE" || {
    echo "FAIL: PARTIAL template's counts line has no '**Skipped:**' alongside Resolved/Escalated"; na_fail=1; }
  grep -qi 'never dropped, and never folded silently into FILLED or ESCALATED' "$NA_FILE" || {
    echo "FAIL: success_criteria no longer forbids folding a justified SKIP into FILLED/ESCALATED"; na_fail=1; }

  if [ "$na_fail" -eq 0 ]; then
    echo "PASS: nyquist-auditor's schema and report carry a caveat AND a justified SKIP, both distinct from a clean green"
  else
    fail=1
  fi
fi

echo
echo "== Check 3: integration-checker handles WARNING and UNVERIFIED, not just WIRED/BROKEN =="
IC_FILE="plugins/dev-kit-core/agents/integration-checker.md"
if [ ! -f "$IC_FILE" ]; then
  echo "FAIL: $IC_FILE not found"
  fail=1
else
  ic_fail=0

  # The adversarial_stance enum must name a real middle tier (FRAGILE/WARNING)
  # alongside the two extremes, not just WIRED/BROKEN.
  grep -q "FRAGILE (WARNING" "$IC_FILE" || {
    echo "FAIL: no FRAGILE (WARNING) tier declared in <adversarial_stance>"; ic_fail=1; }
  grep -q "WIRED (verified end-to-end), FRAGILE (WARNING" "$IC_FILE" || {
    echo "FAIL: connection resolution is not explicitly three-way (WIRED / FRAGILE / BROKEN)"; ic_fail=1; }

  # The Requirements Integration Map's Status column — the field that
  # actually reaches the per-requirement table row — must carry the same
  # middle tier, not just the two extremes.
  grep -q "WIRED / PARTIAL (WARNING) / UNWIRED (BLOCKER)" "$IC_FILE" || {
    echo "FAIL: Requirements Integration Map Status column has no PARTIAL (WARNING) option"; ic_fail=1; }

  # Every Detailed Findings entry must carry an explicit label per the
  # <adversarial_stance> classification — this is what actually wires the
  # tier into the evidence section rather than leaving it implicit.
  grep -qi "there is no unlabelled finding" "$IC_FILE" || {
    echo "FAIL: no rule requiring every Detailed Findings entry to carry an explicit label"; ic_fail=1; }

  # --- extension: UNVERIFIED (the "the check itself could not be completed"
  # tier, distinct from a clean WIRED/CONNECTED result and from BLOCKER) must
  # be wired at every point a search-method false negative could otherwise
  # silently collapse it. Regression = any ONE of these six locations
  # dropping the literal string. ---
  grep -qi "the check itself could not be completed" "$IC_FILE" || {
    echo "FAIL: <adversarial_stance> no longer declares UNVERIFIED as its own classification"; ic_fail=1; }
  grep -q 'report the export as \*\*UNVERIFIED\*\*, not ORPHANED' "$IC_FILE" || {
    echo "FAIL: Step 2 export-usage guidance no longer routes an inconclusive export to UNVERIFIED"; ic_fail=1; }
  grep -q '\[BLOCKER|WARNING|UNVERIFIED\]' "$IC_FILE" || {
    echo "FAIL: no [BLOCKER|WARNING|UNVERIFIED] Detailed-Findings bullet template"; ic_fail=1; }
  grep -q '\[BLOCKER|UNVERIFIED\]' "$IC_FILE" || {
    echo "FAIL: no [BLOCKER|UNVERIFIED] Detailed-Findings bullet template"; ic_fail=1; }
  grep -q '^#### Unverified Checks' "$IC_FILE" || {
    echo "FAIL: no '#### Unverified Checks' section header"; ic_fail=1; }
  grep -q 'WIRED / PARTIAL (WARNING) / UNWIRED (BLOCKER) / UNVERIFIED' "$IC_FILE" || {
    echo "FAIL: Requirements Integration Map Status column has no UNVERIFIED option"; ic_fail=1; }
  grep -qF '`[BLOCKER]`/`[WARNING]`/`[UNVERIFIED]` label per `<adversarial_stance>`' "$IC_FILE" || {
    echo "FAIL: no success_criteria checkbox requiring the explicit BLOCKER/WARNING/UNVERIFIED label"; ic_fail=1; }

  if [ "$ic_fail" -eq 0 ]; then
    echo "PASS: integration-checker's schema carries WARNING- and UNVERIFIED-tier values distinct from WIRED/BROKEN"
  else
    fail=1
  fi
fi

echo
echo "== Check 4: brainstorming's Idea Validation verdict keeps all four Recommendation values, wired to a trigger =="
BS_FILE="plugins/dev-kit-core/skills/brainstorming/SKILL.md"
if [ ! -f "$BS_FILE" ]; then
  echo "FAIL: $BS_FILE not found"
  fail=1
else
  bs_fail=0
  section="$(awk '/^# Mode: Idea Validation/{f=1} f{print} f && /^# Mode:/ && !/Idea Validation/{exit}' "$BS_FILE")"
  if [ -z "$section" ]; then
    echo "FAIL: no '# Mode: Idea Validation' section found in $BS_FILE"
    bs_fail=1
  else
    grep -q 'GO / NO-GO / PIVOT / COULD NOT DETERMINE' <<<"$section" || {
      echo "FAIL: Verdict item 5 (Recommendation) no longer lists all four of GO/NO-GO/PIVOT/COULD NOT DETERMINE"; bs_fail=1; }
    occurrences="$(grep -c 'COULD NOT DETERMINE' <<<"$section")"
    if [ "$occurrences" -lt 2 ]; then
      echo "FAIL: expected >=2 'COULD NOT DETERMINE' occurrences in the Idea Validation section (one in the Recommendation bullet, one in the closing branching paragraph), found $occurrences"
      bs_fail=1
    fi
    grep -qE 'If COULD NOT DETERMINE:' <<<"$section" || {
      echo "FAIL: closing branching paragraph has no triggered 'If COULD NOT DETERMINE:' sentence"; bs_fail=1; }
  fi
  if [ "$bs_fail" -eq 0 ]; then
    echo "PASS: Idea Validation's Recommendation keeps all four values, with COULD NOT DETERMINE wired to a trigger condition"
  else
    fail=1
  fi
fi

echo
echo "== Check 5: bugfix-wave's not-cleanly-fixed bucket stays distinct from classes_fixed/unresolved =="
BW_FILE="plugins/dev-kit-core/skills/bugfix-wave/SKILL.md"
if [ ! -f "$BW_FILE" ]; then
  echo "FAIL: $BW_FILE not found"
  fail=1
else
  bw_fail=0
  grep -q 'Findings not cleanly fixed:' "$BW_FILE" || {
    echo "FAIL: close-handover template (§2.3) no longer has a 'Findings not cleanly fixed:' line"; bw_fail=1; }
  grep -q 'non-issue | requires human verification | rolled back: fix' "$BW_FILE" || {
    echo "FAIL: 'Findings not cleanly fixed' line no longer enumerates all four tags"; bw_fail=1; }
  grep -q 'caused errors | skipped: code context differs from finding' "$BW_FILE" || {
    echo "FAIL: 'Findings not cleanly fixed' line is missing the rolled-back/skipped tags"; bw_fail=1; }
  grep -q '`not_cleanly_fixed`: every entry any track reported under \*\*Findings not cleanly fixed\*\*' "$BW_FILE" || {
    echo "FAIL: Phase 4.1's not_cleanly_fixed aggregation bullet is gone"; bw_fail=1; }
  phase41_flat="$(awk '/^### 4\.1/{f=1} f{print} f && /^### 4\.2/{exit}' "$BW_FILE" | tr '\n' ' ')"
  grep -qi 'it must not' <<<"$phase41_flat" && grep -qi 'be counted as fixed' <<<"$phase41_flat" || {
    echo "FAIL: Phase 4.1 no longer says an entry here must not be counted as fixed"; bw_fail=1; }
  grep -qi 'This is a distinct bucket from' "$BW_FILE" || {
    echo "FAIL: not_cleanly_fixed is no longer described as a distinct bucket from unresolved"; bw_fail=1; }
  if [ "$bw_fail" -eq 0 ]; then
    echo "PASS: Findings not cleanly fixed (§2.3) and its Phase 4.1 aggregation both survive as a distinct, uncounted bucket"
  else
    fail=1
  fi
fi

echo
echo "== Check 6: code-reviewer's Ready-to-merge verdict keeps a fourth 'Could not determine' option, DON'T ban is qualified =="
CR_FILE="plugins/dev-kit-core/skills/code-review-protocol/code-reviewer.md"
if [ ! -f "$CR_FILE" ]; then
  echo "FAIL: $CR_FILE not found"
  fail=1
else
  cr_fail=0
  grep -q '\[Yes | No | With fixes | Could not determine\]' "$CR_FILE" || {
    echo "FAIL: 'Ready to merge?' line no longer lists a fourth 'Could not determine' option"; cr_fail=1; }
  grep -q 'Avoid giving a clear verdict by hedging inside Yes/No/With fixes' "$CR_FILE" || {
    echo "FAIL: the DON'T rule is gone, or no longer scoped to hedging-inside-the-three-value-set"; cr_fail=1; }
  grep -qi 'say .Could not determine. instead of guessing' "$CR_FILE" || {
    echo "FAIL: the DON'T rule no longer carves out an explicit 'Could not determine' exception"; cr_fail=1; }
  if [ "$cr_fail" -eq 0 ]; then
    echo "PASS: 'Could not determine' survives as a fourth verdict, and the DON'T rule stays qualified rather than an unconditional ban"
  else
    fail=1
  fi
fi

echo
echo "== Check 7: converge's Step 7.3 task blocks carry a <severity> (group-ordered), and 'undetermined' survives as its own gap-type =="
CV_FILE="plugins/dev-kit-core/skills/converge/SKILL.md"
if [ ! -f "$CV_FILE" ]; then
  echo "FAIL: $CV_FILE not found"
  fail=1
else
  cv_fail=0
  grep -q '<severity>{CRITICAL|HIGH|MEDIUM|LOW' "$CV_FILE" || {
    echo "FAIL: appended <task type=\"auto\"> template has no <severity>{CRITICAL|HIGH|MEDIUM|LOW...} element"; cv_fail=1; }
  grep -q 'carrying forward each finding.s Step 5 severity' "$CV_FILE" || {
    echo "FAIL: Step 7.3 no longer states the <severity> tag carries forward the Step 5 tier"; cv_fail=1; }
  step73_flat="$(awk '/^1\. Scan all existing/{f=1} f{print} f && /^```markdown/{exit}' "$CV_FILE" | tr '\n' ' ')"
  grep -qE 'ordered[[:space:]]+CRITICAL/HIGH first' <<<"$step73_flat" || {
    echo "FAIL: Step 7.3 no longer states group-level CRITICAL/HIGH-before-MEDIUM/LOW ordering"; cv_fail=1; }
  # Negative check: the spec must NOT have been over-tightened into a strict
  # full ordering (CRITICAL, then HIGH, then MEDIUM, then LOW) — that reading
  # is stricter than Step 7.3's own text and would make a valid HIGH-before-
  # CRITICAL (both ahead of any MEDIUM/LOW) output fail a guard that assumed
  # intra-group order was specified.
  if grep -qiE 'ordered CRITICAL, then HIGH, then MEDIUM, then LOW|CRITICAL first, HIGH second' "$CV_FILE"; then
    echo "FAIL: ordering text has been tightened into a strict intra-group order Step 7.3 never specified"
    cv_fail=1
  fi

  # --- extension: an intent-inventory item converge cannot conclusively
  # assess via static inspection alone must surface as its own gap-type
  # (undetermined), not be omitted as if satisfied — wired through Step 4's
  # classification, Step 6's summary counts, and Step 7's <action> text
  # reading as verification instructions, not implementation instructions. ---
  grep -q '\*\*`undetermined`\*\*: static inspection cannot conclusively establish' "$CV_FILE" || {
    echo "FAIL: Step 4 classification list no longer names 'undetermined' for a statically-unresolvable item"; cv_fail=1; }
  grep -qi 'Never silently resolve this to "satisfied" by omission' "$CV_FILE" || {
    echo "FAIL: no rule forbidding an undetermined item from silently resolving to satisfied by omission"; cv_fail=1; }
  grep -q 'Findings by gap type (missing / partial / contradicts / unrequested / undetermined)' "$CV_FILE" || {
    echo "FAIL: Step 6 In-Session Findings Summary no longer counts 'undetermined' among the gap types"; cv_fail=1; }
  step7_action="$(awk '/<action>/{f=1} f{print} f && /<\/action>/{exit}' "$CV_FILE" | tr '\n' ' ')"
  grep -qE 'For gap-type .undetermined., give\s+verification instructions instead' <<<"$step7_action" || {
    echo "FAIL: the <action> template no longer routes gap-type undetermined to verification instructions"; cv_fail=1; }
  grep -qiE 'not\s+implementation instructions' <<<"$step7_action" || {
    echo "FAIL: the <action> template no longer states undetermined's action text is NOT implementation instructions"; cv_fail=1; }

  if [ "$cv_fail" -eq 0 ]; then
    echo "PASS: <severity> carries forward group-ordered, and undetermined survives as its own gap-type through Step 4/6/7 (action = verification, not implementation)"
  else
    fail=1
  fi
fi

echo
echo "== Check 8: devex-review keeps COULD NOT DETERMINE/N/A scoring AND per-finding severity tags in Next Steps =="
DXR_FILE="plugins/dev-kit-core/skills/devex-review/SKILL.md"
if [ ! -f "$DXR_FILE" ]; then
  echo "FAIL: $DXR_FILE not found"
  fail=1
else
  dxr_fail=0
  grep -q 'COULD NOT DETERMINE' "$DXR_FILE" || {
    echo "FAIL: no 'COULD NOT DETERMINE' Method value found in the scope-declaration/scorecard section"; dxr_fail=1; }
  grep -q 'Score cell as `N/A`' "$DXR_FILE" || {
    echo "FAIL: no paired 'Score cell as N/A' instruction alongside COULD NOT DETERMINE"; dxr_fail=1; }
  next_steps_section="$(awk '/^## Next Steps/{f=1} f{print}' "$DXR_FILE")"
  if [ -z "$next_steps_section" ]; then
    echo "FAIL: no '## Next Steps' section found"
    dxr_fail=1
  else
    grep -qE '\*\*BLOCKER\*\*.*\*\*MAJOR\*\*.*\*\*MINOR\*\*' <<<"$next_steps_section" || {
      echo "FAIL: '## Next Steps' no longer tags each recommended fix with BLOCKER/MAJOR/MINOR"; dxr_fail=1; }
    grep -qi 'tagged with its severity' <<<"$next_steps_section" || {
      echo "FAIL: '## Next Steps' no longer states each fix is tagged with its severity"; dxr_fail=1; }
  fi
  if [ "$dxr_fail" -eq 0 ]; then
    echo "PASS: devex-review keeps COULD NOT DETERMINE/N/A scoring and per-finding severity tags in Next Steps"
  else
    fail=1
  fi
fi

echo
echo "== Check 9: land-and-deploy's Deploy Report keeps Tests: BLOCKER, the four-way Reviews enum, and TIMEOUT wired to Step 6 =="
LAD_FILE="plugins/dev-kit-core/skills/land-and-deploy/SKILL.md"
if [ ! -f "$LAD_FILE" ]; then
  echo "FAIL: $LAD_FILE not found"
  fail=1
else
  lad_fail=0
  grep -qE '^Tests:.*BLOCKER' "$LAD_FILE" || {
    echo "FAIL: Step 9 Deploy Report template has no '^Tests:' line whose enum includes BLOCKER"; lad_fail=1; }
  grep -qE '^Reviews:.*CURRENT.*RECENT.*STALE.*NOT RUN' "$LAD_FILE" || {
    echo "FAIL: Step 9 Deploy Report template's Reviews line no longer enumerates all four of CURRENT/RECENT/STALE/NOT RUN"; lad_fail=1; }

  # --- extension: Deploy Report's Deploy line keeps a TIMEOUT value, and
  # Step 6's 20-minute-timeout sentence still routes a skipped-after-timeout
  # deploy to that exact value — not to PASSED and not to a silent drop. ---
  grep -qE '^Deploy:.*PASSED.*FAILED.*NO WORKFLOW.*CI AUTO-DEPLOY.*TIMEOUT' "$LAD_FILE" || {
    echo "FAIL: Step 9 Deploy Report template's Deploy line no longer includes a TIMEOUT value"; lad_fail=1; }
  grep -qi '20-minute timeout.*record Deploy: TIMEOUT' "$LAD_FILE" || {
    echo "FAIL: Step 6's 20-minute-timeout sentence no longer instructs recording Deploy: TIMEOUT"; lad_fail=1; }
  grep -qi 'record Deploy: TIMEOUT.*never report it as PASSED' "$LAD_FILE" || {
    echo "FAIL: Step 6 no longer forbids reporting a skipped-after-timeout deploy as PASSED"; lad_fail=1; }

  if [ "$lad_fail" -eq 0 ]; then
    echo "PASS: Deploy Report keeps 'Tests:' BLOCKER, the four-way Reviews tiering, and TIMEOUT wired from Step 6 (never PASSED)"
  else
    fail=1
  fi
fi

echo
echo "== Check 10: plan-review-design's Required Outputs keep the Severity field and the Lens Verdict cross-reference =="
PR_DESIGN_FILE="plugins/dev-kit-core/skills/plan-review-design/SKILL.md"
if [ ! -f "$PR_DESIGN_FILE" ]; then
  echo "FAIL: $PR_DESIGN_FILE not found"
  fail=1
else
  prd_fail=0
  outputs_section="$(awk '/^## Required Outputs/{f=1} f{print} f && /^## [A-Z]/ && !/^## Required Outputs/{exit}' "$PR_DESIGN_FILE")"
  if [ -z "$outputs_section" ]; then
    echo "FAIL: no '## Required Outputs' section found"
    prd_fail=1
  else
    grep -q 'Design debt items' <<<"$outputs_section" || {
      echo "FAIL: no 'Design debt items' bullet under Required Outputs"; prd_fail=1; }
    grep -q 'Severity (BLOCKER/MAJOR/MINOR, per the Lens Verdict mapping below)' <<<"$outputs_section" || {
      echo "FAIL: Design debt items bullet has no Severity field referencing '## Lens Verdict' by name"; prd_fail=1; }
    grep -q 'Unresolved decisions' <<<"$outputs_section" || {
      echo "FAIL: no 'Unresolved decisions' bullet under Required Outputs"; prd_fail=1; }
    grep -q 'counts as MAJOR per the Lens Verdict mapping below' <<<"$outputs_section" || {
      echo "FAIL: Unresolved decisions bullet no longer states it counts as MAJOR per '## Lens Verdict'"; prd_fail=1; }
  fi
  # The cross-reference must resolve to a heading that actually exists.
  grep -q '^## Lens Verdict' "$PR_DESIGN_FILE" || {
    echo "FAIL: '## Lens Verdict' heading referenced by Required Outputs does not exist in this file"; prd_fail=1; }
  if [ "$prd_fail" -eq 0 ]; then
    echo "PASS: Design debt items keeps its Severity field and Unresolved decisions its MAJOR clause, both correctly naming '## Lens Verdict'"
  else
    fail=1
  fi
fi

echo
echo "== Check 11: plan-review-devex's DX debt Severity field, CND touchpoints, and a distinct Decisions Needed bullet all survive =="
PR_DEVEX_FILE="plugins/dev-kit-core/skills/plan-review-devex/SKILL.md"
if [ ! -f "$PR_DEVEX_FILE" ]; then
  echo "FAIL: $PR_DEVEX_FILE not found"
  fail=1
else
  prdx_fail=0
  grep -q 'Severity\*\* (BLOCKER / MAJOR / MINOR' "$PR_DEVEX_FILE" || {
    echo "FAIL: 'DX debt items' bullet has no Severity sub-field naming BLOCKER/MAJOR/MINOR"; prdx_fail=1; }
  cnd_count="$(grep -c 'CND' "$PR_DEVEX_FILE")"
  if [ "$cnd_count" -lt 4 ]; then
    echo "FAIL: expected >=4 'CND' occurrences (rubric row, anti-skip sentence, scorecard note, Lens Verdict sentence), found $cnd_count"
    prdx_fail=1
  fi
  grep -q 'DECISION NEEDED' "$PR_DEVEX_FILE" || {
    echo "FAIL: Lens Verdict no longer requires a CND pass be tagged DECISION NEEDED"; prdx_fail=1; }

  # --- extension: '## Lens Verdict' must carry a 'Decisions Needed' bullet
  # that is its own consolidating template slot, textually distinct from the
  # 'Verdict' bullet — regression signature: DECISION NEEDED tags left only
  # in per-pass prose, with no dedicated bullet collecting them here. ---
  decisions_line="$(grep -n '\*\*Decisions Needed:\*\*' "$PR_DEVEX_FILE" | head -1)"
  verdict_line="$(grep -n '\*\*Verdict:\*\* APPROVE' "$PR_DEVEX_FILE" | head -1)"
  if [ -z "$decisions_line" ]; then
    echo "FAIL: '## Lens Verdict' has no '**Decisions Needed:**' bullet"
    prdx_fail=1
  elif [ -z "$verdict_line" ]; then
    echo "FAIL: '## Lens Verdict' has no '**Verdict:**' bullet to compare against"
    prdx_fail=1
  elif [ "${decisions_line%%:*}" = "${verdict_line%%:*}" ]; then
    echo "FAIL: 'Decisions Needed' and 'Verdict' collapsed onto the same line — no distinct consolidating slot"
    prdx_fail=1
  fi
  grep -q 'collected here even though each also appears inline where it occurs' "$PR_DEVEX_FILE" || {
    echo "FAIL: Decisions Needed bullet no longer states items are collected here in addition to inline"; prdx_fail=1; }
  grep -qi 'left only in per-pass prose, with nothing surfacing it here, is incomplete' "$PR_DEVEX_FILE" || {
    echo "FAIL: no rule marking a DECISION NEEDED tag left only in per-pass prose as incomplete"; prdx_fail=1; }

  if [ "$prdx_fail" -eq 0 ]; then
    echo "PASS: DX debt items keeps its Severity sub-field, CND stays wired end-to-end, and Decisions Needed stays a distinct consolidating bullet"
  else
    fail=1
  fi
fi

echo
echo "== Check 12: plan-review-eng keeps the Appendix landing section and the Retrospective re-verification wording =="
PRE_FILE="plugins/dev-kit-core/skills/plan-review-eng/SKILL.md"
if [ ! -f "$PRE_FILE" ]; then
  echo "FAIL: $PRE_FILE not found"
  fail=1
else
  pre_fail=0
  appendix_count="$(grep -c 'Appendix — Low-Confidence Findings' "$PRE_FILE")"
  if [ "$appendix_count" -lt 2 ]; then
    echo "FAIL: expected 'Appendix — Low-Confidence Findings' in both the Confidence Calibration table row and Required Outputs, found $appendix_count occurrence(s)"
    pre_fail=1
  fi
  grep -qE 're-verified.*not re-checked.*could not verify' "$PRE_FILE" || {
    echo "FAIL: Retrospective note bullet no longer offers the re-verified/not-re-checked/could-not-verify tri-state"; pre_fail=1; }
  grep -qi 'floor.*never a ceiling' "$PRE_FILE" || {
    echo "FAIL: Retrospective note no longer states a prior finding/resolution is a floor, never a ceiling"; pre_fail=1; }
  if [ "$pre_fail" -eq 0 ]; then
    echo "PASS: Appendix — Low-Confidence Findings has a defined landing section, and the Retrospective note keeps its per-item re-verification requirement"
  else
    fail=1
  fi
fi

echo
echo "== Check 13: plan-review-goal-backward keeps Skipped Dimensions AND Suggestions (info) in both Structured Return templates =="
PRGB_FILE="plugins/dev-kit-core/skills/plan-review-goal-backward/SKILL.md"
if [ ! -f "$PRGB_FILE" ]; then
  echo "FAIL: $PRGB_FILE not found"
  fail=1
else
  prgb_fail=0
  skipped_dim_count="$(grep -c '^### Skipped Dimensions' "$PRGB_FILE")"
  if [ "$skipped_dim_count" -lt 2 ]; then
    echo "FAIL: expected a '### Skipped Dimensions' section in both VERIFICATION PASSED and ISSUES FOUND templates, found $skipped_dim_count"
    prgb_fail=1
  fi
  grep -qi 'Carry every SKIPPED dimension' "$PRGB_FILE" || {
    echo "FAIL: Verification Process no longer instructs carrying SKIPPED dimension notes into the Skipped Dimensions section"; prgb_fail=1; }

  # --- extension: INFO-tier findings (present in the Issue Format's
  # `blocker | warning | info` enum and in the ISSUES FOUND summary line
  # "{Z} info") must always have an evidence-section slot to land in — a
  # '### Suggestions (info)' heading in BOTH output-template code blocks
  # under '## Structured Returns' — so this tier can't silently regress back
  # to summary-only reporting. ---
  suggestions_count="$(grep -c '^### Suggestions (info)' "$PRGB_FILE")"
  if [ "$suggestions_count" -lt 2 ]; then
    echo "FAIL: expected a '### Suggestions (info)' section in both VERIFICATION PASSED and ISSUES FOUND templates, found $suggestions_count"
    prgb_fail=1
  fi
  grep -q 'blocker | warning | info' "$PRGB_FILE" || {
    echo "FAIL: Issue Format no longer declares the blocker | warning | info severity enum"; prgb_fail=1; }
  grep -q '{Z} info' "$PRGB_FILE" || {
    echo "FAIL: ISSUES FOUND's Issues summary line no longer counts '{Z} info'"; prgb_fail=1; }

  # Positional check inside each fenced template block: Suggestions (info)
  # must sit ahead of Skipped Dimensions in VERIFICATION PASSED, and between
  # Warnings (should fix) and Skipped Dimensions in ISSUES FOUND — a template
  # slot with no defined position is as good as no slot.
  vp_block="$(awk '/\*\*VERIFICATION PASSED:\*\*/{f=1} f{print} f && /^```/{c++; if (c==2) exit}' "$PRGB_FILE")"
  if_block="$(awk '/\*\*ISSUES FOUND:\*\*/{f=1} f{print} f && /^```/{c++; if (c==2) exit}' "$PRGB_FILE")"
  vp_sugg_line="$(grep -n '^### Suggestions (info)' <<<"$vp_block" | head -1 | cut -d: -f1)"
  vp_skip_line="$(grep -n '^### Skipped Dimensions' <<<"$vp_block" | head -1 | cut -d: -f1)"
  if [ -z "$vp_sugg_line" ] || [ -z "$vp_skip_line" ] || [ "$vp_sugg_line" -ge "$vp_skip_line" ]; then
    echo "FAIL: VERIFICATION PASSED template no longer positions Suggestions (info) ahead of Skipped Dimensions"
    prgb_fail=1
  fi
  if_warn_line="$(grep -n '^### Warnings (should fix)' <<<"$if_block" | head -1 | cut -d: -f1)"
  if_sugg_line="$(grep -n '^### Suggestions (info)' <<<"$if_block" | head -1 | cut -d: -f1)"
  if_skip_line="$(grep -n '^### Skipped Dimensions' <<<"$if_block" | head -1 | cut -d: -f1)"
  if [ -z "$if_warn_line" ] || [ -z "$if_sugg_line" ] || [ -z "$if_skip_line" ] || \
     ! { [ "$if_warn_line" -lt "$if_sugg_line" ] && [ "$if_sugg_line" -lt "$if_skip_line" ]; }; then
    echo "FAIL: ISSUES FOUND template no longer orders Warnings (should fix) -> Suggestions (info) -> Skipped Dimensions"
    prgb_fail=1
  fi

  if [ "$prgb_fail" -eq 0 ]; then
    echo "PASS: Skipped Dimensions AND Suggestions (info) both survive, correctly positioned, in both Structured Return templates"
  else
    fail=1
  fi
fi

echo
echo "== Check 14: sdd-review-cto's CTO Review template keeps the Other findings slot between Deferred-to-cso and LOCK =="
SRC_FILE="plugins/dev-kit-core/skills/sdd-review-cto/SKILL.md"
if [ ! -f "$SRC_FILE" ]; then
  echo "FAIL: $SRC_FILE not found"
  fail=1
else
  src_fail=0
  template_section="$(awk '/^## CTO Review$/{f=1} f{print} f && n++ && /^## [A-Z]/ && !/^## CTO Review$/{exit} f{n++}' "$SRC_FILE")"
  # Simpler ordering check: line numbers of the three markers, in file order.
  deferred_line="$(grep -n '\*\*Deferred to `cso`:\*\*' "$SRC_FILE" | head -1 | cut -d: -f1)"
  other_line="$(grep -n '\*\*Other findings:\*\*' "$SRC_FILE" | head -1 | cut -d: -f1)"
  lock_line="$(grep -n '\*\*LOCK:\*\*' "$SRC_FILE" | head -1 | cut -d: -f1)"
  if [ -z "$deferred_line" ] || [ -z "$other_line" ] || [ -z "$lock_line" ]; then
    echo "FAIL: one of Deferred to cso / Other findings / LOCK lines is missing from $SRC_FILE"
    src_fail=1
  elif ! { [ "$deferred_line" -lt "$other_line" ] && [ "$other_line" -lt "$lock_line" ]; }; then
    echo "FAIL: 'Other findings:' is no longer positioned after 'Deferred to cso' and before 'LOCK'"
    src_fail=1
  fi
  other_findings_block="$(sed -n "${other_line},$((other_line + 3))p" "$SRC_FILE" 2>/dev/null | tr '\n' ' ')"
  grep -q 'MINOR' <<<"$other_findings_block" || {
    echo "FAIL: 'Other findings:' bracketed instruction no longer mentions MINOR severity"; src_fail=1; }
  grep -q 'DECISION NEEDED' <<<"$other_findings_block" || {
    echo "FAIL: 'Other findings:' bracketed instruction no longer mentions DECISION NEEDED"; src_fail=1; }
  if [ "$src_fail" -eq 0 ]; then
    echo "PASS: 'Other findings:' keeps its position and its MINOR/DECISION NEEDED landing slot"
  else
    fail=1
  fi
fi

echo
echo "== Check 15: security-reviewer keeps the Info row in both report tables and the Needs Verification confirmation field =="
SREV_TEMPLATE="plugins/dev-kit-core/skills/security-reviewer/references/report-template.md"
SREV_SKILL="plugins/dev-kit-core/skills/security-reviewer/SKILL.md"
if [ ! -f "$SREV_TEMPLATE" ] || [ ! -f "$SREV_SKILL" ]; then
  echo "FAIL: security-reviewer file(s) not found ($SREV_TEMPLATE, $SREV_SKILL)"
  fail=1
else
  srev_fail=0
  info_rows="$(grep -c '| Info |' "$SREV_TEMPLATE")"
  if [ "$info_rows" -lt 2 ]; then
    echo "FAIL: expected an 'Info' row in both Findings Summary and Severity Definitions tables of $SREV_TEMPLATE, found $info_rows"
    srev_fail=1
  fi
  grep -q 'Needs Verification' "$SREV_TEMPLATE" || {
    echo "FAIL: no 'Needs Verification' Confirmation value in $SREV_TEMPLATE"; srev_fail=1; }
  grep -q 'Needs Verification' "$SREV_SKILL" || {
    echo "FAIL: no 'Needs Verification' instruction in $SREV_SKILL's Core Workflow step 4"; srev_fail=1; }
  if [ "$srev_fail" -eq 0 ]; then
    echo "PASS: Info stays in both report tables, and Needs Verification stays wired in SKILL.md and the template"
  else
    fail=1
  fi
fi

echo
echo "== Check 16: ship's Pre-Landing Review always states adversarial-pass status, and reused checklist items are tagged =="
SHIP_FILE="plugins/dev-kit-core/skills/ship/SKILL.md"
if [ ! -f "$SHIP_FILE" ]; then
  echo "FAIL: $SHIP_FILE not found"
  fail=1
else
  ship_fail=0
  grep -q 'Adversarial pass: not attempted | attempted, survived | attempted, refuted' "$SHIP_FILE" || {
    echo "FAIL: PR-body Pre-Landing Review section no longer has the explicit Adversarial pass line"; ship_fail=1; }
  grep -qi "not attempted.*the diff wasn.t large/risky enough to trigger the pass — say so by name" "$SHIP_FILE" || {
    echo "FAIL: 'not attempted' is no longer paired with a stated reason"; ship_fail=1; }
  grep -q '(reused from VERIFICATION.md)' "$SHIP_FILE" || {
    echo "FAIL: no literal '(reused from VERIFICATION.md)' tag for Step 5 sub-step-0 reused verdicts"; ship_fail=1; }
  if [ "$ship_fail" -eq 0 ]; then
    echo "PASS: Adversarial pass is always stated with a reason for 'not attempted', and reused verdicts are tagged"
  else
    fail=1
  fi
fi

echo
echo "== Check 17: spec-review-cpo's CPO Review template keeps Completeness/Findings/Verdict, INSUFFICIENT EVIDENCE, and floor/carry-forward wording =="
SRCPO_FILE="plugins/dev-kit-core/skills/spec-review-cpo/SKILL.md"
if [ ! -f "$SRCPO_FILE" ]; then
  echo "FAIL: $SRCPO_FILE not found"
  fail=1
else
  srcpo_fail=0
  grep -q '\*\*Completeness score (0-10):\*\*' "$SRCPO_FILE" || {
    echo "FAIL: persisted CPO Review template has no 'Completeness score (0-10):' line"; srcpo_fail=1; }
  grep -q '\*\*Findings:\*\*.*BLOCKER / MAJOR / MINOR' "$SRCPO_FILE" || {
    echo "FAIL: persisted CPO Review template's Findings line no longer enumerates BLOCKER/MAJOR/MINOR"; srcpo_fail=1; }
  grep -q '\*\*Verdict:\*\* APPROVE / APPROVE-WITH-CHANGES / REVISE' "$SRCPO_FILE" || {
    echo "FAIL: persisted CPO Review template's Verdict line no longer enumerates APPROVE/APPROVE-WITH-CHANGES/REVISE"; srcpo_fail=1; }
  grep -q '\*\*Premise verdict:\*\* VALIDATED / REFRAMED / REJECTED / INSUFFICIENT EVIDENCE' "$SRCPO_FILE" || {
    echo "FAIL: Premise verdict enum no longer includes INSUFFICIENT EVIDENCE alongside VALIDATED/REFRAMED/REJECTED"; srcpo_fail=1; }
  grep -qi 'Record the Completeness score, the severity-tagged Findings list, and the overall Verdict' "$SRCPO_FILE" || {
    echo "FAIL: Lens Verdict's closing bullet no longer wires Completeness/Findings/Verdict into the named template fields"; srcpo_fail=1; }

  # --- extension: upstream MARKET.md / assumption-mapping input must be
  # re-weighed, not inherited at face value — tying "floor, not a ceiling"
  # (Pre-Review Context Gathering) to the template's requirement that the
  # Premise verdict line name the source and its corroboration status. ---
  grep -q 'Either input is a floor, not a ceiling' "$SRCPO_FILE" || {
    echo "FAIL: Pre-Review Context Gathering no longer states MARKET.md/assumption-mapping input is a floor, not a ceiling"; srcpo_fail=1; }
  grep -q 'carrying it forward as-is' "$SRCPO_FILE" || {
    echo "FAIL: CPO Review template's Premise verdict line no longer offers 'carrying it forward as-is' as the un-corroborated option"; srcpo_fail=1; }
  # Do NOT assert 'REFRAMED' appears in the floor-not-a-ceiling paragraph —
  # it only ever appears in the template's Premise-verdict enum line; a guard
  # requiring it in both places would fail against the file as written.

  # --- extension: the 'floor, not a ceiling' upstream-self-report language
  # must be co-located with 'name the source', not just present somewhere in
  # the file — otherwise an inherited MARKET.md/assumption-mapping claim
  # could be adopted at face value with no provenance requirement attached. ---
  pre_review_section="$(awk '/^## Pre-Review Context Gathering/{f=1} f{print} f && /^## Step 0/{exit}' "$SRCPO_FILE")"
  if [ -z "$pre_review_section" ]; then
    echo "FAIL: no '## Pre-Review Context Gathering' section found in $SRCPO_FILE"
    srcpo_fail=1
  else
    grep -q 'floor, not a ceiling' <<<"$pre_review_section" || {
      echo "FAIL: Pre-Review Context Gathering section lost the 'floor, not a ceiling' phrase"; srcpo_fail=1; }
    grep -q 'name the source' <<<"$pre_review_section" || {
      echo "FAIL: Pre-Review Context Gathering section no longer co-locates 'name the source' with the floor/ceiling framing"; srcpo_fail=1; }
  fi

  # --- extension: REFRAMED must survive in BOTH §0A's first-principles-rebuild
  # guidance (co-located with 'materially different framing', so a rebuilt
  # premise is never forced into VALIDATED or REJECTED) AND the CPO Review
  # template's Premise verdict enum. ---
  reframed_total="$(grep -c 'REFRAMED' "$SRCPO_FILE")"
  if [ "$reframed_total" -lt 2 ]; then
    echo "FAIL: expected 'REFRAMED' in at least 2 places (§0A rebuild guidance + CPO Review template enum), found $reframed_total"
    srcpo_fail=1
  fi
  rebuild_section="$(awk '/Feed the rebuilt framing into 0C-bis/{f=1} f{print} f && /rebuilt framing\.$/{exit}' "$SRCPO_FILE")"
  if [ -z "$rebuild_section" ]; then
    echo "FAIL: could not locate §0A's first-principles-rebuild paragraph (Feed the rebuilt framing into 0C-bis ... rebuilt framing.)"
    srcpo_fail=1
  else
    grep -q 'REFRAMED' <<<"$rebuild_section" || {
      echo "FAIL: §0A's rebuild-guidance paragraph no longer records the premise verdict as REFRAMED"; srcpo_fail=1; }
    grep -q 'materially different' <<<"$rebuild_section" || {
      echo "FAIL: §0A's rebuild-guidance paragraph no longer co-locates REFRAMED with 'materially different framing'"; srcpo_fail=1; }
  fi
  grep -q '\*\*Premise verdict:\*\* VALIDATED / REFRAMED / REJECTED / INSUFFICIENT EVIDENCE' "$SRCPO_FILE" || {
    echo "FAIL: CPO Review template's Premise verdict enum no longer lists REFRAMED"; srcpo_fail=1; }

  # --- extension: INSUFFICIENT EVIDENCE must appear in exactly the two
  # places it was fixed to land — §0A's instruction not to force a
  # VALIDATED/REJECTED call when evidence is absent, and the CPO Review
  # template's Premise-verdict enum line — not zero (dropped), not one
  # (only in one of the two), and §0A itself must not force VALIDATED. ---
  ie_count="$(grep -c 'INSUFFICIENT EVIDENCE' "$SRCPO_FILE")"
  if [ "$ie_count" -ne 2 ]; then
    echo "FAIL: expected 'INSUFFICIENT EVIDENCE' in exactly 2 places (§0A + CPO Review template), found $ie_count"
    srcpo_fail=1
  fi
  grep -q 'do not force a VALIDATED or REJECTED' "$SRCPO_FILE" || {
    echo "FAIL: §0A no longer forbids forcing a VALIDATED/REJECTED call when evidence is absent"; srcpo_fail=1; }
  grep -qi 'rather than silently defaulting to VALIDATED' "$SRCPO_FILE" || {
    echo "FAIL: §0A no longer forbids silently defaulting an absent-evidence case to VALIDATED"; srcpo_fail=1; }

  if [ "$srcpo_fail" -eq 0 ]; then
    echo "PASS: CPO Review template keeps Completeness/Findings/Verdict, INSUFFICIENT EVIDENCE, and the floor/carry-forward provenance wiring"
  else
    fail=1
  fi
fi

echo
echo "== Check 18: sprint-execution's ledger line keeps a minor: slot naming §7's Minor-findings instruction =="
SE_FILE="plugins/dev-kit-core/skills/sprint-execution/SKILL.md"
if [ ! -f "$SE_FILE" ]; then
  echo "FAIL: $SE_FILE not found"
  fail=1
else
  se_fail=0
  ledger_line="$(grep -n 'minor:' "$SE_FILE" | head -1)"
  if [ -z "$ledger_line" ]; then
    echo "FAIL: no 'minor:' slot found in the §6 step-6 progress-ledger line template"
    se_fail=1
  else
    grep -q 'minor:' "$SE_FILE" || { echo "FAIL: minor: slot missing"; se_fail=1; }
  fi
  grep -qi "The .minor:. slot is where §7.s Minor findings land" "$SE_FILE" || {
    echo "FAIL: the paragraph defining the minor: slot no longer names §7's Minor-findings instruction"; se_fail=1; }
  if [ "$se_fail" -eq 0 ]; then
    echo "PASS: the ledger's minor: slot survives, cross-referenced to §7's Minor-findings instruction"
  else
    fail=1
  fi
fi

echo
echo "== Check 19: test-master keeps Could Not Determine in SKILL.md AND both COULD NOT DETERMINE landings in test-reports.md =="
TM_SKILL="plugins/dev-kit-core/skills/test-master/SKILL.md"
TM_REPORTS="plugins/dev-kit-core/skills/test-master/references/test-reports.md"
if [ ! -f "$TM_SKILL" ] || [ ! -f "$TM_REPORTS" ]; then
  echo "FAIL: test-master file(s) not found ($TM_SKILL, $TM_REPORTS)"
  fail=1
else
  tm_fail=0
  grep -q 'Could Not Determine' "$TM_SKILL" || {
    echo "FAIL: Output Templates item 4 (Findings with severity) no longer mentions 'Could Not Determine'"; tm_fail=1; }
  grep -q '| \*\*COULD NOT DETERMINE\*\* |' "$TM_REPORTS" || {
    echo "FAIL: no 'COULD NOT DETERMINE' row in test-reports.md's Severity Definitions table"; tm_fail=1; }
  grep -q '^### \[COULD NOT DETERMINE\]' "$TM_REPORTS" || {
    echo "FAIL: no '### [COULD NOT DETERMINE]' heading in test-reports.md's Findings template section"; tm_fail=1; }
  if [ "$tm_fail" -eq 0 ]; then
    echo "PASS: Could Not Determine survives in SKILL.md's Output Templates and both landings in test-reports.md"
  else
    fail=1
  fi
fi

echo
echo "== Check 20: the-fool's Attack Vectors table keeps Unknown in both cells, wired to the Process step 4 instruction =="
FOOL_FILE="plugins/dev-kit-core/skills/the-fool/references/red-team-adversarial.md"
if [ ! -f "$FOOL_FILE" ]; then
  echo "FAIL: $FOOL_FILE not found"
  fail=1
else
  fool_fail=0
  unknown_cells="$(grep -c 'High/Med/Low/\*\*Unknown\*\*' "$FOOL_FILE")"
  if [ "$unknown_cells" -lt 2 ]; then
    echo "FAIL: expected the literal 'Unknown' enum value in both Likelihood and Impact cell templates, found $unknown_cells"
    fool_fail=1
  fi
  grep -q 'mark it \*\*Unknown\*\* rather than guessing' "$FOOL_FILE" || {
    echo "FAIL: Process step 4 no longer instructs marking an unassessed vector Unknown rather than guessing"; fool_fail=1; }
  if [ "$fool_fail" -eq 0 ]; then
    echo "PASS: Attack Vectors table keeps Unknown in both cells, wired to the Process step 4 instruction"
  else
    fail=1
  fi
fi

echo
echo "== Check 21: ab-test-analysis's Output Format keeps Inconclusive alongside Ship/No-ship/Iterate =="
ABT_FILE="plugins/dev-kit-product/skills/ab-test-analysis/SKILL.md"
if [ ! -f "$ABT_FILE" ]; then
  echo "FAIL: $ABT_FILE not found"
  fail=1
else
  abt_fail=0
  line="$(grep -E 'Ship.*No-ship.*Iterate' "$ABT_FILE" | head -1)"
  if [ -z "$line" ]; then
    echo "FAIL: no Output Format line matching Ship/No-ship/Iterate found"
    abt_fail=1
  elif ! grep -qi 'inconclusive' <<<"$line"; then
    echo "FAIL: Output Format's Ship/No-ship/Iterate line has no 'Inconclusive' token"
    abt_fail=1
  fi
  if [ "$abt_fail" -eq 0 ]; then
    echo "PASS: Output Format keeps Inconclusive alongside Ship/No-ship/Iterate"
  else
    fail=1
  fi
fi

echo
echo "== Check 22: accessibility-tester's Output keeps 'could not determine' as its own field, distinct from a pass =="
AT_FILE="plugins/dev-kit-core/agents/accessibility-tester.md"
if [ ! -f "$AT_FILE" ]; then
  echo "FAIL: $AT_FILE not found"
  fail=1
else
  at_fail=0
  output_section="$(awk '/^## Output/{f=1} f{print}' "$AT_FILE")"
  grep -qi 'could not determine' <<<"$output_section" || {
    echo "FAIL: '## Output' no longer mentions 'could not determine' for an unverifiable criterion"; at_fail=1; }
  if [ "$at_fail" -eq 0 ]; then
    echo "PASS: 'could not determine' survives in accessibility-tester's Output section"
  else
    fail=1
  fi
fi

echo
echo "== Check 23: code-review-gate's content_reverified field and Plan Completion Audit gating both survive =="
CRG_FILE="plugins/dev-kit-core/agents/code-review-gate.md"
if [ ! -f "$CRG_FILE" ]; then
  echo "FAIL: $CRG_FILE not found"
  fail=1
else
  crg_fail=0
  grep -q 'content_reverified' "$CRG_FILE" || {
    echo "FAIL: no content_reverified field documented"; crg_fail=1; }
  grep -q "content_reverified.*true.*only when.*engine == claude" "$CRG_FILE" || {
    echo "FAIL: content_reverified is no longer gated to true only when engine == claude"; crg_fail=1; }
  grep -q "content_reverified.*false.*when.*engine != claude" "$CRG_FILE" || {
    echo "FAIL: content_reverified is no longer gated to false when engine != claude"; crg_fail=1; }
  grep -q 'includes `content_reverified`, `false` whenever `engine != claude`' "$CRG_FILE" || {
    echo "FAIL: success-criteria checklist no longer requires content_reverified=false whenever engine != claude"; crg_fail=1; }
  grep -q '^## Plan Completion Audit' "$CRG_FILE" || {
    echo "FAIL: no rendered '## Plan Completion Audit' section header"; crg_fail=1; }
  grep -q 'Only when a plan file exists' "$CRG_FILE" || {
    echo "FAIL: Plan Completion Audit section is no longer gated on plan-file detection"; crg_fail=1; }
  grep -q 'omit this section entirely otherwise, do not emit it empty' "$CRG_FILE" || {
    echo "FAIL: Plan Completion Audit no longer states it must be omitted entirely (not present-but-empty) when no plan exists"; crg_fail=1; }
  grep -q 'DONE.*PARTIAL.*NOT DONE.*CHANGED.*UNVERIFIABLE' "$CRG_FILE" || {
    echo "FAIL: no DONE/PARTIAL/NOT DONE/CHANGED/UNVERIFIABLE classification bullets"; crg_fail=1; }
  if [ "$crg_fail" -eq 0 ]; then
    echo "PASS: content_reverified stays engine-gated, and Plan Completion Audit stays presence-gated on plan-file detection"
  else
    fail=1
  fi
fi

echo
echo "== Check 24: debugger's status enum keeps 'diagnosed' paired with the instruction that sets it =="
DBG_FILE="plugins/dev-kit-core/agents/debugger.md"
if [ ! -f "$DBG_FILE" ]; then
  echo "FAIL: $DBG_FILE not found"
  fail=1
else
  dbg_fail=0
  grep -qE '^status: gathering \| investigating \|.*\bdiagnosed\b' "$DBG_FILE" || {
    echo "FAIL: frontmatter status-enum documentation line no longer contains the token 'diagnosed'"; dbg_fail=1; }
  grep -q 'Update status to "diagnosed"' "$DBG_FILE" || {
    echo "FAIL: no 'Update status to \"diagnosed\"' instruction in return_diagnosis"; dbg_fail=1; }
  if [ "$dbg_fail" -eq 0 ]; then
    echo "PASS: 'diagnosed' survives in both the declared enum and the instruction that sets it"
  else
    fail=1
  fi
fi

echo
echo "== Check 25: dependency-manager's Output keeps 'could not determine' distinct from 'no known issues found' =="
DM_FILE="plugins/dev-kit-core/agents/dependency-manager.md"
if [ ! -f "$DM_FILE" ]; then
  echo "FAIL: $DM_FILE not found"
  fail=1
else
  dm_fail=0
  grep -qi 'could not determine' "$DM_FILE" || {
    echo "FAIL: no 'could not determine' status in ## Output"; dm_fail=1; }
  if [ "$dm_fail" -eq 0 ]; then
    echo "PASS: 'could not determine' survives as a status distinct from a clean report"
  else
    fail=1
  fi
fi

echo
echo "== Check 26: design-reviewer keeps PARTIAL's MEDIUM-impact finding rule AND the 'still undetermined' verdict =="
DR_FILE="plugins/dev-kit-core/agents/design-reviewer.md"
if [ ! -f "$DR_FILE" ]; then
  echo "FAIL: $DR_FILE not found"
  fail=1
else
  dr_fail=0
  grep -q 'PARTIAL is at minimum a MEDIUM-impact finding' "$DR_FILE" || {
    echo "FAIL: Trunk Test no longer states a PARTIAL is at minimum a MEDIUM-impact finding"; dr_fail=1; }
  grep -q 'still undetermined' "$DR_FILE" || {
    echo "FAIL: no 'still undetermined' verdict option in the Carried-Forward Human-Review Items handling"; dr_fail=1; }
  if [ "$dr_fail" -eq 0 ]; then
    echo "PASS: PARTIAL keeps its finding-landing rule, and 'still undetermined' survives as a representable verdict"
  else
    fail=1
  fi
fi

echo
echo "== Check 27: doc-classifier's manifest_override exception keeps notes populated even at high confidence =="
DC_FILE="plugins/dev-kit-core/agents/doc-classifier.md"
if [ ! -f "$DC_FILE" ]; then
  echo "FAIL: $DC_FILE not found"
  fail=1
else
  dc_fail=0
  grep -q 'manifest_override: true.*where .notes. must always carry the unverified-provenance text' "$DC_FILE" || {
    echo "FAIL: the field-rule exception for manifest_override no longer requires notes to carry the unverified-provenance text"; dc_fail=1; }
  prov_count="$(grep -c 'Type supplied by manifest; not independently re-verified against content signals\.' "$DC_FILE")"
  if [ "$prov_count" -lt 2 ]; then
    echo "FAIL: expected the literal provenance sentence in BOTH heuristic_classification and the write_output field-rules bullet (anti-drift), found $prov_count"
    dc_fail=1
  fi
  grep -qi 'overriding the usual rule that .notes. is omitted at high confidence' "$DC_FILE" || {
    echo "FAIL: manifest_override notes rule no longer states it overrides the general omit-at-high-confidence rule"; dc_fail=1; }
  if [ "$dc_fail" -eq 0 ]; then
    echo "PASS: manifest_override still forces notes to carry unverified-provenance text even at high confidence"
  else
    fail=1
  fi
fi

echo
echo "== Check 28: doc-synthesizer keeps COULD NOT DETERMINE wired through detection, template, and success_criteria (c3) =="
DS_FILE="plugins/dev-kit-core/agents/doc-synthesizer.md"
if [ ! -f "$DS_FILE" ]; then
  echo "FAIL: $DS_FILE not found"
  fail=1
else
  ds_fail=0
  cnd_total="$(grep -c 'COULD NOT DETERMINE' "$DS_FILE")"
  if [ "$cnd_total" -lt 3 ]; then
    echo "FAIL: expected 'COULD NOT DETERMINE' in at least 3 distinct regions (detect_conflicts, write_conflicts_report template, success_criteria), found $cnd_total total occurrences"
    ds_fail=1
  fi
  detect_section="$(awk '/<step name="detect_conflicts">/{f=1} f{print} f && /<\/step>/{exit}' "$DS_FILE")"
  grep -q 'COULD NOT DETERMINE' <<<"$detect_section" || {
    echo "FAIL: detect_conflicts step has no COULD NOT DETERMINE detection pass"; ds_fail=1; }
  pass_count="$(grep -cE '^[0-9]+\. \*\*' <<<"$detect_section")"
  if [ "$pass_count" -lt 8 ]; then
    echo "FAIL: detect_conflicts numbered pass list dropped back to $pass_count passes (need >=8 — a pass must route an undecidable comparison to unresolved-blockers)"
    ds_fail=1
  fi
  grep -qi 'unresolved-blockers' <<<"$detect_section" || {
    echo "FAIL: detect_conflicts has no pass routing an indeterminate comparison to unresolved-blockers"; ds_fail=1; }
  write_section="$(awk '/<step name="write_conflicts_report">/{f=1} f{print} f && /<\/step>/{exit}' "$DS_FILE")"
  grep -q 'COULD NOT DETERMINE' <<<"$write_section" || {
    echo "FAIL: write_conflicts_report's fenced report template has no COULD NOT DETERMINE entry"; ds_fail=1; }
  success_section="$(awk '/<success_criteria>/{f=1} f{print} f && /<\/success_criteria>/{exit}' "$DS_FILE")"
  grep -q 'COULD NOT DETERMINE' <<<"$success_section" || {
    echo "FAIL: success_criteria no longer requires COULD NOT DETERMINE blockers"; ds_fail=1; }
  grep -qiE 'could not run.*found nothing|check you could not run' "$DS_FILE" || {
    echo "FAIL: no anti-pattern line forbidding treating an un-run check as one that found nothing"; ds_fail=1; }
  if [ "$ds_fail" -eq 0 ]; then
    echo "PASS: COULD NOT DETERMINE stays wired through detect_conflicts (>=8 passes), the report template, and success_criteria"
  else
    fail=1
  fi
fi

echo
echo "== Check 29: doc-synthesizer keeps asserted_by/reverified floor-not-ceiling wiring across load/extract/report (c4) =="
if [ ! -f "$DS_FILE" ]; then
  echo "FAIL: $DS_FILE not found"
  fail=1
else
  ds2_fail=0
  asserted_total="$(grep -c 'asserted_by' "$DS_FILE")"
  reverified_total="$(grep -c 'reverified' "$DS_FILE")"
  if [ "$asserted_total" -lt 3 ] || [ "$reverified_total" -lt 3 ]; then
    echo "FAIL: expected asserted_by/reverified markers in >=3 regions each, found asserted_by=$asserted_total reverified=$reverified_total"
    ds2_fail=1
  fi
  load_section="$(awk '/<step name="load_classifications">/{f=1} f{print} f && /<\/step>/{exit}' "$DS_FILE")"
  grep -q 'asserted_by' <<<"$load_section" || { echo "FAIL: load_classifications has no asserted_by marker"; ds2_fail=1; }
  grep -q 'reverified' <<<"$load_section" || { echo "FAIL: load_classifications has no reverified marker"; ds2_fail=1; }
  grep -qi 'floor, not a ceiling' <<<"$load_section" || {
    echo "FAIL: load_classifications no longer states classifier claims are a floor, not a ceiling"; ds2_fail=1; }
  grep -q 'Accepted' <<<"$load_section" || {
    echo "FAIL: load_classifications no longer requires re-checking e.g. locked against the ADR's own 'Accepted' status line"; ds2_fail=1; }
  extract_section="$(awk '/<step name="extract_per_type">/{f=1} f{print} f && /<\/step>/{exit}' "$DS_FILE")"
  grep -q 'asserted_by' <<<"$extract_section" || { echo "FAIL: extract_per_type provenance sentence has no asserted_by marker"; ds2_fail=1; }
  grep -q 'reverified' <<<"$extract_section" || { echo "FAIL: extract_per_type provenance sentence has no reverified marker"; ds2_fail=1; }
  write_section="$(awk '/<step name="write_conflicts_report">/{f=1} f{print} f && /<\/step>/{exit}' "$DS_FILE")"
  grep -q 'asserted_by' <<<"$write_section" || { echo "FAIL: write_conflicts_report template has no asserted_by marker"; ds2_fail=1; }
  grep -q 'reverified' <<<"$write_section" || { echo "FAIL: write_conflicts_report template has no reverified marker"; ds2_fail=1; }
  grep -qi 'locked.*type.*precedence.*on trust' "$DS_FILE" || {
    echo "FAIL: anti_patterns no longer forbids taking locked/type/precedence on trust"; ds2_fail=1; }
  if [ "$ds2_fail" -eq 0 ]; then
    echo "PASS: asserted_by/reverified stay wired through load_classifications, extract_per_type, and the report template"
  else
    fail=1
  fi
fi

echo
echo "== Check 30: domain-researcher keeps 'Unclear' across all three tier-vocabulary sites AND its quality_standards bullet =="
DOR_FILE="plugins/dev-kit-core/agents/domain-researcher.md"
if [ ! -f "$DOR_FILE" ]; then
  echo "FAIL: $DOR_FILE not found"
  fail=1
else
  dor_fail=0
  grep -q 'Critical / High / Medium / Unclear' "$DOR_FILE" || {
    echo "FAIL: Section 1 failure-mode table row template no longer lists Unclear"; dor_fail=1; }
  grep -q 'Stakes Level:\*\* Low | Medium | High | Critical | Unclear' "$DOR_FILE" || {
    echo "FAIL: Section 1b Stakes Level line no longer lists Unclear"; dor_fail=1; }
  unclear_count="$(grep -c 'Critical / High / Medium / Unclear' "$DOR_FILE")"
  if [ "$unclear_count" -lt 2 ]; then
    echo "FAIL: expected the 'Critical / High / Medium / Unclear' template in both the Section 1 row and the rubric-ingredient Stakes: line, found $unclear_count"
    dor_fail=1
  fi
  quality_section="$(awk '/<quality_standards>/{f=1} f{print} f && /<\/quality_standards>/{exit}' "$DOR_FILE")"
  grep -qi 'mark it .Unclear. rather than guessing' <<<"$quality_section" || {
    echo "FAIL: quality_standards no longer instructs marking thin domain signal 'Unclear'"; dor_fail=1; }
  # --- second entry: upstream findings as a floor, not a ceiling ---
  grep -qi 'Upstream findings are a floor, not a ceiling' "$DOR_FILE" || {
    echo "FAIL: extract_domain_signal no longer states upstream RESEARCH.md findings are a floor, not a ceiling"; dor_fail=1; }
  if [ "$dor_fail" -eq 0 ]; then
    echo "PASS: Unclear survives at all tier-vocabulary sites, and upstream confidence/provenance carries forward rather than being trusted blind"
  else
    fail=1
  fi
fi

echo
echo "== Check 31: gate-automation keeps 'could not determine' distinct from false in both step 6 and step 7 =="
GA_FILE="plugins/dev-kit-core/agents/gate-automation.md"
if [ ! -f "$GA_FILE" ]; then
  echo "FAIL: $GA_FILE not found"
  fail=1
else
  ga_fail=0
  step6="$(sed -n '/^6\. Run the new flows locally:/,/^7\. Check for an on-demand E2E CI job:/p' "$GA_FILE")"
  step7="$(sed -n '/^7\. Check for an on-demand E2E CI job:/,/^8\. Write `authoring-report.md`/p' "$GA_FILE")"
  grep -qi 'could not determine' <<<"$step6" || {
    echo "FAIL: step 6 (local flow execution) no longer distinguishes an un-executable flow as 'could not determine'"; ga_fail=1; }
  grep -qi 'could not determine' <<<"$step7" || {
    echo "FAIL: step 7 (CI-job check) no longer distinguishes an incomplete check as 'could not determine'"; ga_fail=1; }
  if [ "$ga_fail" -eq 0 ]; then
    echo "PASS: 'could not determine' stays distinct from a plain false in both step 6 and step 7"
  else
    fail=1
  fi
fi

echo
echo "== Check 32: gate-plan-review's waived_highs entries and provenance-tagged blockers both survive =="
GPR_FILE="plugins/dev-kit-core/agents/gate-plan-review.md"
if [ ! -f "$GPR_FILE" ]; then
  echo "FAIL: $GPR_FILE not found"
  fail=1
else
  gpr_fail=0
  grep -q "won't fix — <reason>" "$GPR_FILE" || {
    echo "FAIL: no inline \"won't fix — <reason>\" detection instruction"; gpr_fail=1; }
  grep -q 'gate_spot_checked' "$GPR_FILE" || {
    echo "FAIL: waived_highs entry no longer records gate_spot_checked"; gpr_fail=1; }
  grep -qF 'in `waived_highs` (step 4); only the ones that pass the spot check are excluded' "$GPR_FILE" || {
    echo "FAIL: every waived HIGH is no longer recorded in waived_highs regardless of spot-check outcome"; gpr_fail=1; }
  grep -q 'accepted.*boolean.*did the justification pass the spot check' "$GPR_FILE" || {
    echo "FAIL: waived_highs no longer records an accepted boolean gating HIGH exclusion"; gpr_fail=1; }
  grep -q 'subtracting only the HIGHs whose .waived_highs. entry has .accepted: true' "$GPR_FILE" || {
    echo "FAIL: gate_passed no longer requires accepted:true before excluding a waived HIGH"; gpr_fail=1; }
  grep -q '\[complexity\]' "$GPR_FILE" || { echo "FAIL: no [complexity] provenance tag"; gpr_fail=1; }
  grep -q '\[engine:<name>\]' "$GPR_FILE" || { echo "FAIL: no [engine:<name>] provenance tag"; gpr_fail=1; }
  grep -qi 'distinguishable in the same list rather than merging both provenances' "$GPR_FILE" || {
    echo "FAIL: blockers no longer keep self-verified and relayed-unverified findings distinguishable"; gpr_fail=1; }
  if [ "$gpr_fail" -eq 0 ]; then
    echo "PASS: waived_highs stays recorded for every won't-fix HIGH with accepted-gated exclusion, and blockers stay provenance-tagged"
  else
    fail=1
  fi
fi

echo
echo "== Check 33: penetration-tester keeps Needs Verification (Output) and do-not-drop (Method) both wired =="
PT_FILE="plugins/dev-kit-core/agents/penetration-tester.md"
if [ ! -f "$PT_FILE" ]; then
  echo "FAIL: $PT_FILE not found"
  fail=1
else
  pt_fail=0
  output_section="$(awk '/^## Output/{f=1} f{print}' "$PT_FILE")"
  grep -q 'Needs Verification' <<<"$output_section" || {
    echo "FAIL: '## Output' no longer has a 'Needs Verification' Confirmation status"; pt_fail=1; }
  method_section="$(awk '/^## Method/{f=1} f{print} f && /^## Output/{exit}' "$PT_FILE")"
  grep -qi 'do not drop it' <<<"$method_section" || {
    echo "FAIL: '## Method' no longer instructs not dropping an unconfirmable finding"; pt_fail=1; }
  if [ "$pt_fail" -eq 0 ]; then
    echo "PASS: Needs Verification survives in Output, and the do-not-drop instruction survives in Method"
  else
    fail=1
  fi
fi

echo
echo "== Check 34: plan-reviewer keeps BLOCKED as a fourth verdict, uncoercible into APPROVE/REVISE, and DECISION NEEDED prefix =="
PR_FILE="plugins/dev-kit-core/agents/plan-reviewer.md"
if [ ! -f "$PR_FILE" ]; then
  echo "FAIL: $PR_FILE not found"
  fail=1
else
  pr_fail=0
  grep -q 'APPROVE | APPROVE-WITH-CHANGES | REVISE | BLOCKED' "$PR_FILE" || {
    echo "FAIL: Output contract Verdict line no longer lists BLOCKED as a fourth value"; pr_fail=1; }
  grep -qi 'PHASE.* does not exist.*stop and report it as .BLOCKED' "$PR_FILE" || {
    echo "FAIL: the 'PHASE directory does not exist' stop condition no longer routes to BLOCKED"; pr_fail=1; }
  grep -qi 'skill file cannot be found.*stop and report the failure as .BLOCKED' "$PR_FILE" || {
    echo "FAIL: the 'skill file cannot be found' stop condition no longer routes to BLOCKED"; pr_fail=1; }
  grep -qi 'coerced into APPROVE/REVISE' "$PR_FILE" || {
    echo "FAIL: no clause forbidding BLOCKED from being coerced into APPROVE/REVISE"; pr_fail=1; }
  grep -q 'DECISION NEEDED: <one-line issue>' "$PR_FILE" || {
    echo "FAIL: no instruction to prefix a DECISION NEEDED finding's Issue cell with the literal tag"; pr_fail=1; }
  if [ "$pr_fail" -eq 0 ]; then
    echo "PASS: BLOCKED stays a distinct, uncoercible fourth verdict, and DECISION NEEDED keeps its Issue-cell prefix"
  else
    fail=1
  fi
fi

echo
echo "== Check 35: security-auditor keeps COULD_NOT_VERIFY in both the classification list and the OPEN_THREATS template =="
SA_FILE="plugins/dev-kit-core/agents/security-auditor.md"
if [ ! -f "$SA_FILE" ]; then
  echo "FAIL: $SA_FILE not found"
  fail=1
else
  sa_fail=0
  stance_section="$(awk '/<adversarial_stance>/{f=1} f{print} f && /<\/adversarial_stance>/{exit}' "$SA_FILE")"
  grep -q 'COULD_NOT_VERIFY' <<<"$stance_section" || {
    echo "FAIL: <adversarial_stance> classification list has no COULD_NOT_VERIFY entry"; sa_fail=1; }
  grep -q '^### Could Not Verify' "$SA_FILE" || {
    echo "FAIL: OPEN_THREATS structured-return template has no '### Could Not Verify' section"; sa_fail=1; }
  cnv_table="$(awk '/^### Could Not Verify/{f=1} f{print} f && /^\| \{id\}/{c++} c>=1 && /^\n$/{exit}' "$SA_FILE")"
  grep -q '| Threat ID | Category | Blocking Reason | Action Needed |' "$SA_FILE" || {
    echo "FAIL: Could Not Verify table has lost its Threat ID/Category/Blocking Reason/Action Needed columns"; sa_fail=1; }
  # --- second entry: threats_could_not_verify > 0 must route to OPEN_THREATS, never SECURED ---
  grep -q 'If .threats_could_not_verify. is nonzero, return .OPEN_THREATS. — even when .threats_open. is 0' "$SA_FILE" || {
    echo "FAIL: verify_and_write no longer forces OPEN_THREATS when threats_could_not_verify > 0 even with threats_open == 0"; sa_fail=1; }
  grep -q 'Use SECURED only when every threat is CLOSED — no OPEN and no COULD_NOT_VERIFY' "$SA_FILE" || {
    echo "FAIL: SECURED template's guard comment no longer forbids use when any COULD_NOT_VERIFY threat exists"; sa_fail=1; }
  if [ "$sa_fail" -eq 0 ]; then
    echo "PASS: COULD_NOT_VERIFY stays wired in the classification list and the OPEN_THREATS template, and can't silently route through SECURED"
  else
    fail=1
  fi
fi

echo
echo "== Check 36: ui-checker keeps a COULD NOT DETERMINE verdict (gating), its own Verdict Gaps section, and the self-report PASS callout in prose + checklist =="
UC_FILE="plugins/dev-kit-core/agents/ui-checker.md"
if [ ! -f "$UC_FILE" ]; then
  echo "FAIL: $UC_FILE not found"
  fail=1
else
  uc_fail=0
  cnd_dims="$(grep -c '{PASS / FLAG / BLOCK / COULD NOT DETERMINE}' "$UC_FILE")"
  if [ "$cnd_dims" -lt 6 ]; then
    echo "FAIL: expected all 6 dimension lines in Output Format to offer COULD NOT DETERMINE, found $cnd_dims"
    uc_fail=1
  fi
  grep -q '{PASS/FLAG/BLOCK/COULD NOT DETERMINE}' "$UC_FILE" || {
    echo "FAIL: Issues Found's Dimension Results verdict placeholder no longer offers COULD NOT DETERMINE"; uc_fail=1; }
  grep -q '^### Undetermined' "$UC_FILE" || {
    echo "FAIL: no '### Undetermined' section header"; uc_fail=1; }
  grep -qE 'BLOCKED\*\*.*if ANY dimension is COULD NOT DETERMINE' "$UC_FILE" || {
    echo "FAIL: Overall-status rule no longer treats COULD NOT DETERMINE as gating (forcing BLOCKED)"; uc_fail=1; }
  grep -qE 'APPROVED\*\*.*if all dimensions are PASS or FLAG' "$UC_FILE" || {
    echo "FAIL: APPROVED rule no longer explicitly excludes any COULD NOT DETERMINE dimension"; uc_fail=1; }
  grep -q 'PASS (researcher self-report, {date}) — not independently re-verified' "$UC_FILE" || {
    echo "FAIL: Dimension 6's PASS provenance callout is gone"; uc_fail=1; }

  # --- extension: the "verdict gap" itself must have its own named section
  # heading (distinct from the '### Undetermined' report-template heading),
  # so an indeterminate dimension has a place to be reasoned about, not just
  # reported. ---
  grep -q '^## Verdict Gaps: When You Cannot Determine' "$UC_FILE" || {
    echo "FAIL: no '## Verdict Gaps: When You Cannot Determine' section heading"; uc_fail=1; }
  grep -qi 'use verdict .COULD NOT DETERMINE. for that dimension instead of guessing' "$UC_FILE" || {
    echo "FAIL: Verdict Gaps section no longer instructs using COULD NOT DETERMINE instead of guessing"; uc_fail=1; }

  # --- extension: Dimension 6's self-report qualifier must survive in BOTH
  # the inline Provenance note AND the success_criteria checklist item — a
  # regression that drops either would let a Safety Gate self-report be
  # presentable as a bare, unqualified PASS somewhere in the file. ---
  grep -qi 'a PASS from either self-reported phrasing above is the .researcher.s. claim, carried forward' "$UC_FILE" || {
    echo "FAIL: the inline Provenance note no longer marks a Dimension 6 PASS as the researcher's carried-forward claim"; uc_fail=1; }
  grep -q 'Dimension 6 PASS verdicts based on the researcher.s self-reported Safety Gate value are labeled as self-report' "$UC_FILE" || {
    echo "FAIL: success_criteria checklist no longer requires a Dimension 6 self-report PASS to be labeled as such"; uc_fail=1; }
  grep -q 'not presented as independently re-verified' "$UC_FILE" || {
    echo "FAIL: success_criteria checklist no longer forbids presenting a self-report PASS as independently re-verified"; uc_fail=1; }

  if [ "$uc_fail" -eq 0 ]; then
    echo "PASS: COULD NOT DETERMINE stays gating, representable, and has its own Verdict Gaps section; Dimension 6 PASS keeps its self-report qualifier in prose AND the checklist"
  else
    fail=1
  fi
fi

echo
echo "== Check 37: verifier.md keeps Requirements Coverage's ORPHANED row rule, HOLLOW data-flow downgrade, and COULD_NOT_RUN probe handling =="
VER_FILE="plugins/dev-kit-core/agents/verifier.md"
if [ ! -f "$VER_FILE" ]; then
  echo "FAIL: $VER_FILE not found"
  fail=1
else
  ver_fail=0
  grep -q 'Status: SATISFIED | BLOCKED | NEEDS HUMAN | ORPHANED' "$VER_FILE" || {
    echo "FAIL: '### Requirements Coverage' status enum no longer lists all four of SATISFIED/BLOCKED/NEEDS HUMAN/ORPHANED"; ver_fail=1; }
  grep -q 'ORPHANED requirements MUST land as their own row' "$VER_FILE" || {
    echo "FAIL: Step 6c no longer requires orphaned requirements to be their own table row"; ver_fail=1; }
  grep -q 'Source Plan: .none.' "$VER_FILE" || {
    echo "FAIL: ORPHANED row instruction no longer specifies Source Plan: none"; ver_fail=1; }

  # --- extension: a Level 4 data-flow trace that finds the source
  # disconnected (exists + substantive + wired, but no real data flowing)
  # must downgrade the Required Artifacts Status from VERIFIED to HOLLOW —
  # never silently keep reporting VERIFIED, and never fold into
  # STATIC/DISCONNECTED. ---
  grep -qF '⚠️ HOLLOW (exists + substantive + wired, but data does NOT flow)' "$VER_FILE" || {
    echo "FAIL: Data-Flow status enum no longer has its own HOLLOW value distinct from STATIC/DISCONNECTED"; ver_fail=1; }
  grep -qF 'downgraded from VERIFIED to `⚠️ HOLLOW`' "$VER_FILE" || {
    echo "FAIL: no rule downgrading the Required Artifacts Status from VERIFIED to HOLLOW when Level 4 finds data disconnected"; ver_fail=1; }
  grep -qi 'must never report as VERIFIED once Level 4 finds the data disconnected' "$VER_FILE" || {
    echo "FAIL: no explicit prohibition on reporting VERIFIED once Level 4 finds the data disconnected"; ver_fail=1; }

  # --- extension: a probe blocked by unavailable infrastructure must be
  # recorded as COULD_NOT_RUN — not counted as a gap, not rendered FAILED —
  # and surfaced in the Step 8 human verification list; a probe that runs
  # and genuinely fails must stay FAILED and still count as a gap. ---
  grep -qF 'mark `COULD_NOT_RUN` instead of FAILED, do not count it as a gap' "$VER_FILE" || {
    echo "FAIL: Step 7c no longer marks an infrastructure-blocked probe COULD_NOT_RUN, excluded from gap count"; ver_fail=1; }
  grep -q 'add it to the Step 8 human verification list naming the missing infrastructure' "$VER_FILE" || {
    echo "FAIL: a COULD_NOT_RUN probe is no longer routed to the Step 8 human verification list"; ver_fail=1; }
  grep -q 'A non-zero exit from the probe.s own assertion logic is FAILED' "$VER_FILE" || {
    echo "FAIL: a probe that runs and genuinely fails is no longer recorded as FAILED"; ver_fail=1; }

  if [ "$ver_fail" -eq 0 ]; then
    echo "PASS: Requirements Coverage keeps its four-value enum with ORPHANED's own row, HOLLOW downgrades from VERIFIED, and COULD_NOT_RUN stays uncounted-as-gap yet surfaced"
  else
    fail=1
  fi
fi

echo
echo "== Check 38: eval-auditor keeps COULD NOT DETERMINE in the scoring criteria AND the write_eval_review output template =="
EA_FILE="plugins/dev-kit-data-ai/agents/eval-auditor.md"
if [ ! -f "$EA_FILE" ]; then
  echo "FAIL: $EA_FILE not found"
  fail=1
else
  ea_fail=0
  score_section="$(awk '/<step name="score_dimensions">/{f=1} f{print} f && /<\/step>/{exit}' "$EA_FILE")"
  grep -q 'COULD NOT DETERMINE' <<<"$score_section" || {
    echo "FAIL: score_dimensions step has no COULD NOT DETERMINE criteria/guidance"; ea_fail=1; }
  write_section="$(awk '/<step name="write_eval_review">/{f=1} f{print} f && /<\/step>/{exit}' "$EA_FILE")"
  grep -q 'COVERED/PARTIAL/MISSING/COULD NOT DETERMINE' <<<"$write_section" || {
    echo "FAIL: write_eval_review's Dimension Coverage status enum no longer lists COULD NOT DETERMINE"; ea_fail=1; }
  grep -q '^## Verification Gaps' "$EA_FILE" || {
    echo "FAIL: no '## Verification Gaps' section heading"; ea_fail=1; }
  if [ "$ea_fail" -eq 0 ]; then
    echo "PASS: COULD NOT DETERMINE survives in both score_dimensions and the write_eval_review output template"
  else
    fail=1
  fi
fi

echo
echo "== Check 39: plan-review.md states findings are lens-tagged self-reports, un-reverified across lenses =="
PLR_FILE="plugins/dev-kit-core/commands/plan-review.md"
if [ ! -f "$PLR_FILE" ]; then
  echo "FAIL: $PLR_FILE not found"
  fail=1
else
  plr_fail=0
  lens_line="$(grep -n 'lens' "$PLR_FILE" | grep -i 'self-report\|un-reverified' | head -1)"
  if [ -z "$lens_line" ]; then
    echo "FAIL: no sentence near 'Expected output' asserting findings are lens-tagged and not cross-verified between lenses"
    plr_fail=1
  fi
  if [ "$plr_fail" -eq 0 ]; then
    echo "PASS: findings stay tagged by lens and explicitly un-reverified across lenses"
  else
    fail=1
  fi
fi

echo
echo "== Check 40: plan-review.workflow.mjs forces aggregateVerdict to BLOCKED when any lens is BLOCKED, and surfaces it =="
PLW_FILE="plugins/dev-kit-core/references/workflows/plan-review.workflow.mjs"
if [ ! -f "$PLW_FILE" ]; then
  echo "FAIL: $PLW_FILE not found"
  fail=1
elif ! command -v node >/dev/null 2>&1; then
  echo "SKIP: node not available on PATH — cannot behaviorally exercise the consolidation logic"
else
  plw_fail=0

  # Static check: the printed rollup must name a BLOCKED lens as a dispatch
  # defect, never silently folding it into the ordinary per-lens list.
  grep -q 'BLOCKED lenses (dispatch defect, not reviewed)' "$PLW_FILE" || {
    echo "FAIL: no 'BLOCKED lenses (dispatch defect, not reviewed)' line in the printed rollup"; plw_fail=1; }

  # Behavioral check: extract the pure consolidation lines (SEVERITY_RANK
  # through the totals loop and aggregateVerdict, plus the blockedLenses
  # line) and actually execute them against a mocked `reviews` array where
  # one lens is BLOCKED and another is APPROVE.
  rank_start="$(grep -n '^const SEVERITY_RANK' "$PLW_FILE" | head -1 | cut -d: -f1)"
  agg_end="$(grep -n '^const aggregateVerdict' "$PLW_FILE" | head -1 | cut -d: -f1)"
  agg_end="$(awk -v s="$agg_end" 'NR>=s && /;$/{print NR; exit}' "$PLW_FILE")"
  blocked_line="$(grep -n '^const blockedLenses' "$PLW_FILE" | head -1 | cut -d: -f1)"

  if [ -z "$rank_start" ] || [ -z "$agg_end" ] || [ -z "$blocked_line" ]; then
    echo "FAIL: could not locate SEVERITY_RANK/aggregateVerdict/blockedLenses lines to extract for the behavioral test"
    plw_fail=1
  else
    harness="$(mktemp -t plan-review-consolidation.XXXXXX.mjs)"
    {
      echo "const reviews = ["
      echo "  { lens: 'eng', verdict: 'BLOCKED', counts: { BLOCKER: 0, MAJOR: 0, MINOR: 0 } },"
      echo "  { lens: 'design', verdict: 'APPROVE', counts: { BLOCKER: 0, MAJOR: 0, MINOR: 0 } },"
      echo "];"
      sed -n "${rank_start},${agg_end}p" "$PLW_FILE"
      sed -n "${blocked_line}p" "$PLW_FILE"
      echo "console.log(JSON.stringify({ aggregateVerdict, blockedLenses }));"
    } > "$harness"

    result="$(node "$harness" 2>&1)"
    rm -f "$harness"

    if ! grep -q '"aggregateVerdict":"BLOCKED"' <<<"$result"; then
      echo "FAIL: with one BLOCKED lens and one APPROVE lens, aggregateVerdict did not resolve to BLOCKED (got: $result)"
      plw_fail=1
    fi
    if ! grep -q '"blockedLenses":\["eng"\]' <<<"$result"; then
      echo "FAIL: blockedLenses did not contain the BLOCKED lens (got: $result)"
      plw_fail=1
    fi
  fi

  if [ "$plw_fail" -eq 0 ]; then
    echo "PASS: a BLOCKED lens forces aggregateVerdict to BLOCKED, is listed in blockedLenses, and is surfaced as a dispatch defect"
  else
    fail=1
  fi
fi

echo
echo "== Check 41: verify.md's Expected output keeps the three-way passed/gaps_found/human_needed contract =="
VFY_FILE="plugins/dev-kit-core/commands/verify.md"
if [ ! -f "$VFY_FILE" ]; then
  echo "FAIL: $VFY_FILE not found"
  fail=1
else
  vfy_fail=0
  grep -q '`passed`' "$VFY_FILE" || { echo "FAIL: no 'passed' token"; vfy_fail=1; }
  grep -q '`gaps_found`' "$VFY_FILE" || { echo "FAIL: no 'gaps_found' token"; vfy_fail=1; }
  grep -q '`human_needed`' "$VFY_FILE" || { echo "FAIL: no 'human_needed' token"; vfy_fail=1; }
  grep -qi 'not a binary pass/fail' "$VFY_FILE" || {
    echo "FAIL: Expected output no longer states this is not a binary pass/fail"; vfy_fail=1; }
  grep -qi 'must not be collapsed into either .passed. or .gaps_found.' "$VFY_FILE" || {
    echo "FAIL: human_needed is no longer distinguished from a collapse into passed/gaps_found"; vfy_fail=1; }
  if [ "$vfy_fail" -eq 0 ]; then
    echo "PASS: Expected output keeps the three-way passed/gaps_found/human_needed contract, human_needed distinct from both"
  else
    fail=1
  fi
fi

echo
echo "== Check 42: project-researcher's Sources sections keep HIGH/MEDIUM/LOW confidence tags, and Step 4 still requires them in-file =="
PJR_FILE="plugins/dev-kit-core/agents/project-researcher.md"
if [ ! -f "$PJR_FILE" ]; then
  echo "FAIL: $PJR_FILE not found"
  fail=1
else
  pjr_fail=0
  # Regression signature of the original bug: confidence tiers landed only in
  # the structured-return summary rollup, never in the Sources section of
  # the evidence files themselves. Each of STACK/FEATURES/ARCHITECTURE/
  # PITFALLS.md's own Sources template must carry an explicit tagging
  # instruction.
  sources_tag_count="$(grep -c 'each tagged HIGH/MEDIUM/LOW' "$PJR_FILE")"
  if [ "$sources_tag_count" -lt 4 ]; then
    echo "FAIL: expected a 'each tagged HIGH/MEDIUM/LOW' instruction in all 4 of STACK/FEATURES/ARCHITECTURE/PITFALLS.md's Sources templates, found $sources_tag_count"
    pjr_fail=1
  fi
  grep -qi 'tag every entry HIGH/MEDIUM/LOW' "$PJR_FILE" || {
    echo "FAIL: Step 4 (Quality Check) no longer instructs tagging every Sources entry HIGH/MEDIUM/LOW"; pjr_fail=1; }
  grep -qi 'confidence must be visible in the file itself, not only in the structured return' "$PJR_FILE" || {
    echo "FAIL: Step 4 no longer states confidence must be visible in the file itself, not only the structured-return rollup"; pjr_fail=1; }
  if [ "$pjr_fail" -eq 0 ]; then
    echo "PASS: all four Sources templates keep their HIGH/MEDIUM/LOW tagging instruction, and Step 4 still enforces it in-file"
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
