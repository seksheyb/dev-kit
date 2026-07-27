# step10-ui-auditor-scoring
step 10 — UI audit · KICKOFF lines 801-817 · assets: ui-auditor

Source: `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md` lines 801-817 (the fenced block).
Line 800, `*(only if this phase shipped UI)*`, sits outside the replaced range and is left
untouched — it is the operator-judgment condition confirmed load-bearing by ui-auditor-1.
Asset read: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/ui-auditor.md`
(462 lines; no `references/` chain exists — `plugins/dev-kit-core/agents/references` is absent,
so that one file is the complete coverage surface).

## Current (verbatim)
```text
Use the ui-auditor agent for a 6-pillar visual audit of what this phase shipped. Score this
phase's diff against its own PHASE/UI-SPEC.md when one exists, and against the abstract
6-pillar standards when it does not — write the result to PHASE/reviews/UI-REVIEW.md with a
1-4 score per pillar and at least one specific finding justifying each score, classified
BLOCKER or WARNING. This pass is cheap and static-grep-first and never blocks on a browser, but
get the capture precedence right: check first whether browser automation is available in this
session (Playwright MCP, an in-session browser pane, or equivalent) and use it if it is —
desktop 1440x900 and mobile 375x812, plus a targeted shot per component UI-SPEC.md names. The
CLI screenshot route is the fallback for when no browser tooling is available, and it only fires
if a dev server happens to already be running; with neither, it degrades to a code-only audit
rather than failing. Flag anything needing subjective judgment rather than scoring it. Do not average
scores upward to soften the findings, and do not stop at three issues if more exist. Keep it
scoped to contract conformance on this diff — subjective "does it feel right" judgment,
cross-page consistency, and any actual fixing belong to design-reviewer at step 12, which reads
this file as its per-phase baseline.
```

## Trimmed
```text
Use the ui-auditor agent for a 6-pillar visual audit of what this phase shipped — write the
result to PHASE/reviews/UI-REVIEW.md. design-reviewer at step 12 reads that file as its
per-phase baseline.
```

15 inner lines → 3. Every cut is a CONFIRMED `redundant-restatement` verdict; every
`load-bearing-parameter` verdict (ui-auditor-1, -3, -13) survives.

## What was cut, and which skill sentence covers it
- "Score this phase's diff against its own PHASE/UI-SPEC.md when one exists, and against the
  abstract 6-pillar standards when it does not" (ui-auditor-2, medium) → ui-auditor.md:66-67
  "If UI-SPEC.md exists and is approved: audit against it specifically. / If no UI-SPEC exists:
  audit against abstract 6-pillar standards." Also :19 and :25; the path itself is not an
  argument — execution_flow Step 1 (:367) has the agent parse `$PHASE_DIR/UI-SPEC.md` on its own,
  and per-pillar branches repeat it at :180, :202, :216, :230.
- "with a 1-4 score per pillar and at least one specific finding justifying each score,
  classified BLOCKER or WARNING" (ui-auditor-4, high) → ui-auditor.md:41 "Every scored pillar
  must have at least one specific finding justifying the score." Scale fixed by the heading
  :158 "## 6-Pillar Scoring (1-4 per pillar)" + definitions :160-164 + `{1-4}/4` cells :316-321;
  taxonomy is its own labelled subsection at :38-40.
- "This pass is cheap and static-grep-first and never blocks on a browser" (ui-auditor-5, low) →
  ui-auditor.md:150 "If no dev server is detected: audit runs on code review only …", plus :119
  and :146. "Cheap" is cost framing, not an instruction; "static-grep-first" is also inaccurate —
  execution_flow captures screenshots at Step 3 (:375) before the pillar greps at Step 5 (:385).
- "but get the capture precedence right: check first whether browser automation is available in
  this session (Playwright MCP, an in-session browser pane, or equivalent) and use it if it is"
  (ui-auditor-6, high) → ui-auditor.md:105, verbatim including the same parenthetical tool list;
  restated by the section heading :103 "preferred when available" and execution_flow :375
  "browser tooling preferred, CLI fallback."
- "desktop 1440x900 and mobile 375x812, plus a targeted shot per component UI-SPEC.md names"
  (ui-auditor-7, high) → ui-auditor.md:108-110, verbatim; constants repeat in the CLI script at
  :136 and :139. The skill's CLI path also captures tablet 768x1024 (:142), which the KICKOFF
  list silently omitted — the guide's copy was already incomplete.
- "The CLI screenshot route is the fallback for when no browser tooling is available, and it only
  fires if a dev server happens to already be running; with neither, it degrades to a code-only
  audit rather than failing." (ui-auditor-8, high) → ui-auditor.md:119 (fallback), the
  `DEV_STATUS` guard at :129-131 (no start-a-server branch anywhere), and :150 + :146 + :18
  (code-only degradation), with the output field at :308 and success criterion at :448.
- "Flag anything needing subjective judgment rather than scoring it." (ui-auditor-9, low) →
  ui-auditor.md:25 (unconditional deferral of subjective judgment) and :117
  "items requiring subjective judgment are flagged `needs_human_review: true`."
- "Do not average scores upward to soften the findings" (ui-auditor-10, high) →
  ui-auditor.md:10 "…do not average scores upward to soften findings." Restated at :32 as the
  first common failure mode, and :459 "Fair scoring: 4/4 is achievable, 1/4 means real problems."
- "and do not stop at three issues if more exist" (ui-auditor-11, medium) → ui-auditor.md:36
  "- Identifying 3 priority fixes and stopping, when 6+ issues exist", under the
  `<adversarial_stance>` failure-mode list at :31.
- "Keep it scoped to contract conformance on this diff — subjective \"does it feel right\"
  judgment, cross-page consistency, and any actual fixing belong to design-reviewer …, which
  reads this file as its per-phase baseline." (ui-auditor-12, high) → ui-auditor.md:25, the most
  literal duplication in the block: same "per-phase, diff-scoped, contract-conformance" framing,
  same quoted "does it feel right", same exclusion list (the skill enumerates one more —
  AI-slop detection), same handoff target, same "reads this file … as its baseline" clause.
  The two words "at step 12" are carved out and kept (ui-auditor-13).

## Parameters preserved
- **Asset selection** — `ui-auditor`, named explicitly, still the agent the operator dispatches.
- **Operator-judgment condition** — `*(only if this phase shipped UI)*` on line 800 is outside
  the replaced range and untouched. ui-auditor-1 confirms the skill has no self-abort path for a
  phase that shipped no frontend (line 10 presupposes one was submitted), so this line must not
  be folded into the block or dropped.
- **Output path** — `PHASE/reviews/UI-REVIEW.md`. ui-auditor-3: the skill at :23 explicitly hands
  path authority to the dispatch prompt ("use whatever paths the dispatch prompt provides"), so
  supplying it is an argument by the skill's own design even though it matches the default and
  `references/doc-sitemap.md:168`.
- **Scope target** — "what this phase shipped": which phase's work is under audit is the
  per-invocation binding (`PHASE_DIR` is orchestrator-supplied, per the skill's line 7 note).
- **Cross-asset ordering / handoff boundary** — "design-reviewer at step 12 reads that file as
  its per-phase baseline." ui-auditor-13: the skill knows the cadence ("once per milestone") but
  names no pipeline step number anywhere; step 12 verified correct against KICKOFF
  "## 12. Final review — the milestone gate" (lines 971-1072, design-reviewer dispatch at 987).
  This also preserves the producer→consumer artifact link (UI-REVIEW.md feeds step 12).
- **Invocation task name** — "6-pillar visual audit", the phrase that lets a human operator
  scanning the guide recognise what step 10 does. Not itself a cut claim; the rubric mechanics
  behind it are.
- **Block placement and fence** — same `​```text` fenced block in the same position between the
  qa report_only block (798) and "## 11. Verify the goal" (822), so surrounding prose and step
  numbering are unaffected.

## Risk
Two real, bounded losses.

1. **Anti-softening pressure (ui-auditor-11, medium).** The skill forbids stopping at three
   issues at :36, but its own output template pushes the other way — "## Top 3 Priority Fixes"
   (:327), "### Top 3 Fixes" (:426), "identify top 3 priority fixes" (:20), and a checkbox at
   :451. The KICKOFF clause was counter-pressure against the skill's own template. Removing it is
   correct (the operator should not be patching a skill defect from the guide) but should be
   **paired with tightening ui-auditor's template** to say "all findings, ranked; top 3 called
   out" rather than implying exactly three. Without that pairing, expect mild regression toward
   three-item reports. This is the one item I would not ship blind.

2. **Subjective-flag scope (ui-auditor-9, low).** `needs_human_review: true` is only wired into
   the browser branch (:117); the unconditional deferral at :25 covers intent but not mechanism
   on the CLI and code-only paths. The KICKOFF sentence was implicitly generalising it. Same
   remedy: generalise the flag in the skill.

Not a risk, but worth recording: the block also papered over a genuine skill gap — the
BLOCKER/WARNING taxonomy is declared at :38-40 yet never surfaced in the `<output_format>`
template (:303-359). Cutting the KICKOFF restatement makes that gap visible instead of masked,
which is the desired direction, but the skill should wire the labels into the findings sections.

Everything else lost is either verbatim duplication, methodology constants the KICKOFF copied
incompletely (missing tablet 768x1024), or a phrase that was outright wrong
("static-grep-first"). The operator loses nothing actionable from those.
