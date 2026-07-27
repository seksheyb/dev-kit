# step07-planner-handoff
step 7 — plan · KICKOFF lines 484-497 · assets: planner, writing-plans, pattern-mapper, plan-review

Scope note: lines 484-497 are the single fenced planner-dispatch block. The `plan-review` block
begins at line 499 and is outside this target; its verdicts were read and none of them bear on
484-497 (all nine attach to lines 499-526). `pattern-mapper` is not invoked here — it is invoked
at step 5 — but its verdicts govern this block because `PHASE/PATTERNS.md` is the artifact this
block hand-wires forward.

## Current (verbatim)
```text
Use the writing-plans skill and the planner agent to produce PHASE/<NN>-<MM>-PLAN.md with
waves and tracks. Keep the vertical-slice mandate. Read PHASE/PATTERNS.md and cite its per-file
analog and code excerpts in each task's action section — the planner does not load it
automatically, so unless you pass it here step 5's pattern mapping never reaches the plan. Same
for step 6's specs: read PHASE/UI-SPEC.md and SPEC/AI-SPEC.md when that step produced them and
make the plan's tasks implement those contracts, because the planner does not load either one on
its own. Its <threat_model> step should consult docs/milestones/<M>/reports/security/ (step 0's baseline)
before assigning threat dispositions rather than re-deriving them from zero, and it should query
docs/state/graphs/graph.json for dependency context the same way step 5 did, rather than
re-reading the tree. Declare complexity signals (files — complete, including files the track
creates — plus novelty/logic/ambiguity/tests) plus model and effort on every track. Use the
diagram skill for the wave/track dependency graph.
```

## Trimmed
```text
Use the planner agent to produce PHASE/<NN>-<MM>-PLAN.md. Keep the vertical-slice mandate.
Read PHASE/PATTERNS.md and have each task's <action> reference the per-file analog and the
excerpt's line range — reference it, do not paste the fenced blocks, which <action> forbids.
The planner does not load PATTERNS.md automatically, so unless you pass it here step 5's
pattern mapping never reaches the plan. Same for step 6's specs: read PHASE/UI-SPEC.md and
SPEC/AI-SPEC.md when that step produced them and make the plan's tasks implement those
contracts, because the planner does not load either one on its own. Use the diagram skill for
the wave/track dependency graph.
```

12 content lines → 8.

## The contradiction, resolved
KICKOFF said "cite its per-file analog and **code excerpts** in each task's action section"
(writing-plans-3, CONFIRMED contradiction, medium). `skills/writing-plans/SKILL.md:110` —
"Do NOT paste fenced code blocks here; code excerpts belong in referenced source files or an
`<interfaces>` block" — and `agents/pattern-mapper.md:184-217` shows Pattern Assignments are
literally ```` ```typescript ```` blocks, so the old wording instructed pasting exactly what the
`<action>` format forbids.

Resolved by moving to *reference* form, which is what both ends already wanted:
- `agents/pattern-mapper.md:72` — "Each plan's action section **references** the analog file and excerpts"
- `agents/pattern-mapper.md:75` — "Copy auth pattern from `src/controllers/users.ts` lines 12-25"

The hand-off is not weakened: PATTERNS.md is still read, still per-file, still lands in each
task's `<action>`, and the analog path + line range is the citation `pattern-mapper.md:75`
prescribes. Only the *form* of the citation changed, from paste to pointer. The parenthetical
naming the `<action>` rule is added text, not cut text — it is what stops an operator from
re-introducing the paste.

## What was cut, and which skill sentence covers it
- `the writing-plans skill and` (from "Use the writing-plans skill and the planner agent") →
  `agents/planner.md:29-34` "**Authoring method — you author plans with the `writing-plans`
  skill.** That skill … is the single source of truth for the plan-authoring discipline and the
  canonical `<task>` format … Invoke it (or read it as your reference) and apply it to author
  each plan's tasks." (planner-1, CONFIRMED redundant-restatement, low. The coupling is
  hard-wired from both ends — `skills/writing-plans/SKILL.md:17` states it in reverse. The
  planner is the dispatch target; it pulls the skill in itself.)
- `with waves and tracks` → `agents/planner.md:35` "multi-plan wave/track decomposition", plus
  the `<step name="assign_waves">` algorithm at `agents/planner.md:1011-1030`. (planner-2,
  CONFIRMED redundant-restatement, low. "wave/track" still appears in the surviving final
  sentence, so the vocabulary is not lost.)
- `Its <threat_model> step should consult docs/milestones/<M>/reports/security/ (step 0's
  baseline) before assigning threat dispositions rather than re-deriving them from zero` →
  `agents/planner.md:620` "Check for the latest `cso` posture report under
  `docs/milestones/<M>/reports/security/*.json`, if present (from Stage 0's onboarding audit, or
  a prior phase's Stage 12 `--diff` run) — start dispositions from findings it already surfaced
  for this scope **rather than re-deriving from zero.** … Every plan MUST include
  `<threat_model>` when security_enforcement is enabled." (planner-6, CONFIRMED
  redundant-restatement, medium. Same directory, same Stage-0 provenance, same ordering
  constraint, same closing phrase; re-checked in the completion checklist at
  `agents/planner.md:1240-1242`.)
- `and it should query docs/state/graphs/graph.json for dependency context the same way step 5
  did, rather than re-reading the tree` → `agents/planner.md:877-899`, `<step
  name="load_graph_context">`, opening `ls docs/state/graphs/graph.json 2>/dev/null` at :881 and
  :888 "Query the graph for phase-relevant dependency context (single query per D-06) via the
  `graphify` skill, using the keyword that best captures the phase goal." (planner-7, CONFIRMED
  redundant-restatement, medium. Same path literal, same single-query discipline, and the step
  already degrades gracefully at :898.)
- `Declare complexity signals (files — complete, including files the track creates — plus
  novelty/logic/ambiguity/tests) plus model and effort on every track.` →
  `skills/writing-plans/SKILL.md:116` "files: [complete list, including files this task
  CREATES]; novelty: none|low|high; logic: low|medium|high; ambiguity: low|medium|high; tests:
  none|existing|new" and `:120` "**`<complexity_signals>` is mandatory on every task**
  (canonical vocabulary: `@references/complexity-signals.md`)"; the per-*track* rollup is
  `references/complexity-signals.md:57-60` "Track-Level Aggregation … the track's declared
  model/effort is the **highest** of any task/bug in it", pulled into the planner's chain at
  `agents/planner.md:514`. (writing-plans-6, CONFIRMED redundant-restatement, medium — a
  field-for-field re-teach of a taxonomy the skill dedicates a section to. Note planner-8 tried
  to call the per-track model/effort declaration an unenforced gap and was **REFUTED**: the
  chain does carry it, via the Track-Level Aggregation rule which presupposes the declaration
  and states how to compute it.)

## What was kept and why (the sentences that must not move)
- `the planner does not load it automatically, so unless you pass it here step 5's pattern
  mapping never reaches the plan` — planner-4, CONFIRMED **unenforced-gap, HIGH**. The planner's
  two context loaders provably omit PATTERNS.md: `agents/planner.md:834` reads only ROADMAP.md,
  REQUIREMENTS.md and existing CONTEXT.md/RESEARCH.md/PLAN.md; `agents/planner.md:975-977`
  (`gather_phase_context`) cats only CONTEXT.md, RESEARCH.md, DISCOVERY.md. Corroborated from
  the other end by pattern-mapper-6, also CONFIRMED HIGH — `agents/pattern-mapper.md:67`
  declares "Your PATTERNS.md is consumed by `planner`", a handoff neither end implements. This
  guide sentence is the only thing that delivers it.
- `read PHASE/UI-SPEC.md and SPEC/AI-SPEC.md when that step produced them … because the planner
  does not load either one on its own` — planner-5, CONFIRMED **unenforced-gap, HIGH**. A full
  sweep of the planner's `@`-reference chain returns zero hits for UI-SPEC/AI-SPEC; AI-SPEC.md is
  doubly out of reach because it lives under `specs/`, outside the `$phase_dir` the loader globs.
  Also writing-plans-4, CONFIRMED load-bearing (conditional artifact selection is outside the
  skill's scope per `skills/writing-plans/SKILL.md:17`).
- `Keep the vertical-slice mandate.` — two confirmed verdicts disagree on class:
  writing-plans-2 calls it redundant against `skills/writing-plans/SKILL.md:42`, but planner-3
  calls it **load-bearing** because `agents/planner.md:356` states vertical slicing as a
  *preference* with an explicit escape hatch ("Use horizontal only when a shared foundation is
  genuinely required"), absolute only inside `MVP_MODE` (`agents/planner.md:303`, `:324`). The
  planner is the dispatch target and it is the one with the escape hatch, so the KICKOFF word
  "mandate" does real hardening work. KEPT. This is why 5 chunks were cut, not the 6 the
  nomination anticipated.
- `Use the diagram skill for the wave/track dependency graph.` — planner-9, refuted as a skill
  defect but confirmed **load-bearing**: nothing in the planner or its chain names the `diagram`
  skill (verified zero grep hits), so this is operator tool-wiring only KICKOFF can supply.
- `PHASE/<NN>-<MM>-PLAN.md` — planner-2 argued the filename template is redundant against
  `agents/planner.md:1073`, but writing-plans-1 classes it load-bearing and the audit bar puts
  output paths and filenames in the always-preserve set. KEPT unchanged, placeholders intact.

## Parameters preserved
- **Dispatch target:** the `planner` agent (the one agent named; `writing-plans` is auto-pulled by it).
- **Output path/filename:** `PHASE/<NN>-<MM>-PLAN.md`, with both `<NN>` and `<MM>` placeholders
  literal and unresolved, and the `PHASE/` directory shorthand intact.
- **Input artifact 1:** `PHASE/PATTERNS.md` (step 5's output), read explicitly.
- **Input artifact 2:** `PHASE/UI-SPEC.md` (note `PHASE/` prefix).
- **Input artifact 3:** `SPEC/AI-SPEC.md` (note the *different* `SPEC/` prefix — preserved
  verbatim, not normalized to `PHASE/`).
- **Operator-judgment condition:** "when that step produced them" — the UI-SPEC/AI-SPEC read is
  gated on step 6 having actually produced them, i.e. only if this phase has UI and/or AI work.
- **Placement instruction:** the analog citation goes in *each task's* `<action>` section, per
  file (unchanged target; citation form corrected from paste to reference).
- **Consumption obligation:** "make the plan's tasks implement those contracts" — the specs are
  not merely read, the tasks must satisfy them.
- **Both gap warnings** — "does not load PATTERNS.md automatically" and "does not load either
  one on its own" — the two HIGH-severity unenforced gaps, verbatim in force.
- **Methodology hardening:** "Keep the vertical-slice mandate."
- **Sibling-skill wiring:** the `diagram` skill, for the wave/track dependency graph specifically.
- **Ordering:** the block's position after step 5 (PATTERNS.md) and step 6 (specs) is carried by
  the "step 5" / "step 6's specs" references, both retained.
- **Not touched:** everything from line 498 down — the `/dev-kit-core:plan-review
  PHASE/<NN>-<MM>-PLAN.md` block, the lens vocabulary, and the review-tier guidance.

## Risk
Low, with two named residues.

1. **`with waves and tracks` is gone from the opening sentence.** An operator skimming only the
   first line no longer sees that the planner emits a multi-plan set. Acceptable:
   `agents/planner.md:35` declares wave/track decomposition as the agent's own wrapping and
   `assign_waves` (`:1011-1030`) is an unconditional step, and the trimmed block's last sentence
   still says "wave/track dependency graph", so the concept is visible in the block.

2. **The complexity-signals sentence is gone.** This is the one cut with a real, if small, edge:
   the planner's chain covers per-*task* signals (`skills/writing-plans/SKILL.md:116/120`,
   mandatory) and derives per-*track* model/effort by aggregation
   (`references/complexity-signals.md:57-60`), but no file in dev-kit-core defines the format of
   the `## Parallel Execution Map` where those per-track values are rendered — the planner claims
   ownership of that section at `agents/planner.md:36-37`, yet its own PLAN.md template
   (`:415-494`) omits it, while `gate-plan-review` (`:34`, `:52`) scores its `Model`/`Effort`
   columns. That is a template gap in the planner, flagged as a residual note under planner-8,
   and the deleted KICKOFF sentence was never a fix for it — it declared *what* to emit, never
   *where*. Restoring the sentence would not close the template gap; it would only re-teach the
   taxonomy. Acceptable to cut, but the template gap should be filed against
   `agents/planner.md`, not left to this block.

Nothing else an operator relied on is lost: the two HIGH-severity hand-offs are intact, the
citation contradiction is resolved in the direction both `agents/pattern-mapper.md:72` and
`skills/writing-plans/SKILL.md:110` already point, and every path, placeholder, condition and
skill name survives.
