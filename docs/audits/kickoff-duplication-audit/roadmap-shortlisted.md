# Roadmap: shortlisted for execution

Items pulled out of `ROADMAP.md` Milestone 1 to be worked next. Source of truth for
scope stays `ROADMAP.md`; this file is the working shortlist.

Shortlisted: **1.1**, **1.3**, **1.5**, **1.6**, **1.8**, **1.9**, **1.10**, **1.11**, **1.12**.

---

## 1.1 — `agents/planner.md`

**Fix:** Phase-context loader must ingest `PHASE/PATTERNS.md`, `PHASE/UI-SPEC.md`, and
`SPEC/AI-SPEC.md` (when present). Also close the `## Parallel Execution Map` template gap
(REPORT §3.5 risk 2).

**Why it matters beyond the asset:** this is a live bug today — the planner plans without
inputs that exist on disk. It also holds KICKOFF text hostage: the step-7 planner-handoff
rewrite carries planner-gap warnings that become deletable only once this ships
(`ROADMAP.md` Milestone 4, item 2).

**Downstream link:** `ROADMAP.md` item 1.2 adds planner to `pattern-mapper.md`'s consumer
claim *once 1.1 ships* — so 1.1 lands first.

---

## 1.3 — `agents/project-researcher.md` assigned-axis dispatch

**Fix:** Add an assigned-file dispatch input so four parallel researchers stop overwriting
each other.

**Bug (REPORT §4b-H3, confirmed in RE-VERIFICATION `:19`):** Step 5 of the agent
(`project-researcher.md:537-545`) writes STACK.md and FEATURES.md and PITFALLS.md
unconditionally ("Always"), plus ARCHITECTURE.md "if patterns discovered" — with no axis
argument gating any of it. When the orchestrator fans out four parallel researchers for
Phase 6 (one per research domain), every one of them runs the full `<execution_flow>` and
writes to the same four paths under `docs/milestones/<M>/research/`. Last-writer-wins; three
of the four dispatches' work is silently discarded, and there is no per-axis assignment
mechanism anywhere in the agent or in `dev-kit-core/references/` to prevent it.

**Fix — copy the mechanism its siblings already use.** Two agents in the same directory
solve this exact problem today:
- `market-researcher.md` takes a `focus` argument (`market-sizing | competitive | trends`)
  that scopes both which section it researches and what it hands back.
- `advisor-researcher.md` is dispatched with exactly one gray area and returns exactly one
  comparison table — never a bundle of outputs.

Apply the same shape to `project-researcher.md`:

1. **Frontmatter `description`:** state that the agent accepts an `assigned_axis` argument
   (`stack | features | architecture | pitfalls`) that scopes both research and output; note
   that omitting it (solo/non-parallel dispatch, e.g. `new-project` running one researcher)
   falls back to today's all-axes behavior.
2. **New `<input>` block** (this agent has none today — unlike `market-researcher.md:21-25`):
   document `assigned_axis`, the required project context inputs, and any orchestrator-supplied
   scope hints, mirroring `market-researcher.md`'s `<input>` section.
3. **Step 2 (Identify Research Domains):** when `assigned_axis` is set, research only that one
   domain — stop treating Technology/Features/Architecture/Pitfalls as a bundle to always run
   together.
4. **Step 5 (Write Output Files):** replace the unconditional "STACK.md — Always / FEATURES.md
   — Always / PITFALLS.md — Always" list with a single rule: write only the file matching
   `assigned_axis` (STACK.md for `stack`, FEATURES.md for `features`, ARCHITECTURE.md for
   `architecture`, PITFALLS.md for `pitfalls`). No `assigned_axis` → keep current all-four
   behavior for callers that still dispatch a single researcher solo.
5. **Structured return (`## RESEARCH COMPLETE`):** the "Files Created" table and "Confidence
   Assessment" table should list only the one file/area actually produced when `assigned_axis`
   is set, not all four placeholders unconditionally.
6. **Comparison/feasibility modes are unaffected** — `assigned_axis` only governs the
   ecosystem-mode four-way fan-out; `COMPARISON.md`/`FEASIBILITY.md` already map 1:1 to a
   single dispatch and need no change.
7. **Downstream check:** `research-synthesizer` (the agent that reads all four files into
   `SUMMARY.md`) needs no change — it already expects four separate files at fixed paths; this
   fix just makes sure four *different* dispatches each write to a *different* one of those
   paths instead of all four racing to write all of them.

**Acceptance:** dispatching four `project-researcher` calls in parallel, one per
`assigned_axis` value, produces four distinct files with no overwritten content, and a solo
dispatch with no `assigned_axis` still produces all four files as it does today.

---

## 1.5 — `skills/finishing-a-development-branch` PR option must create the PR

**Fix:** "Push and Create PR" must actually run `gh pr create`.

**Bug (REPORT §4b-H5, confirmed and aggravated in RE-VERIFICATION `:22`):** Option 2 is
titled "Push and Create PR" (`:74`, `:86`) but its body (`:121-126`) is
`git push -u origin <feature-branch>` and nothing else. There is **zero `gh`** anywhere in
the file — the option does not do what its name says.

**Why it's aggravated:** the path is reachable *unattended* via `sprint-execution:198`, so
nobody is present to notice the PR was never opened.

**Fix — crib the working code that already exists.** `skills/ship/SKILL.md:176` has a
functioning `gh pr create` invocation; port it into Option 2's body. Alternative (worse)
resolution is renaming the option to "Push" — reject that: the callers want a PR.

**Acceptance:** running Option 2 unattended leaves an open PR, not just a pushed branch.

---

## 1.6 — `skills/devex-review` gate semantics + read-only restraint

**Fix:** Define a pass/fail threshold, emit a verdict, and add a read-only/no-commit
restraint. (The restraint half is also carried in §4b MEDIUM.)

**Bug A — no gate semantics (REPORT §4b-H6, confirmed in RE-VERIFICATION `:23`):** KICKOFF
treats the DX scorecard as a ship-blocking gate. The skill has a 1–10 rubric (`:74-86`) and
**no threshold, no verdict, no blocking semantics** anywhere. The guide asks for a gate the
skill cannot produce.
- **Model to copy:** sibling `plan-review-devex:240` already has the exact threshold/verdict
  vocabulary — reuse it rather than inventing a second dialect.

**Bug B — the skill may commit (REPORT §4b MEDIUM, confirmed but softer in
RE-VERIFICATION `:24`):** the guide bills this as a non-destructive pass, but Step 9 says
"measure baseline → fix" and `:208` ("fix the biggest bottleneck") is imperative. `:239-242`
leans advisory, so the file contradicts itself rather than being uniformly destructive.
- **Fix is one line**, model: `retro.md:39` — "Read-only — this reports, it does not change
  code."

**Acceptance:** a devex-review run emits an explicit pass/fail verdict against a stated
threshold, and produces no commits or source edits.

---

## 1.8 — `skills/design-consultation` must gate its design-html closer (D4)

**Fix:** Gate the Phase 6 "run design-html" closer on `claude_design_system_id` being bound.

**Bug (REPORT §1 D4, confirmed in RE-VERIFICATION `:29`):** `SKILL.md:463` closes with an
**unconditional** suggestion — "Want to see this design system as a working page? Run
design-html." — placed straight after the two branch blocks at `:436` and `:441`. The skill
therefore already knows which path it took, and suggests design-html anyway. Meanwhile
`skills/design-html/SKILL.md:77-80` hard-refuses unbound users ("Stop and tell the user to
run `design-consultation` first … do not proceed unbound").

**Net effect:** an operator who follows the skill's own closing suggestion hits a dead end.
Note the direction of the fix — **the KICKOFF text (`:310-313`) is correct and stays**; the
skill is the defective side.

**Acceptance:** the Phase 6 closer fires only on the bound branch; the unbound branch ends
without pointing at design-html.

---

## 1.9 — `skills/code-documenter` must infer docstring format unattended (D6)

**Fix:** Permit convention-based docstring-format inference when running unattended.

**Bug (REPORT §1 D6, confirmed in RE-VERIFICATION `:27`):** `SKILL.md:120` requires "Ask for
format preference before starting", restated as both a **MUST DO** (`:120`) and a **MUST NOT
DO** (`:129`), with no unattended branch anywhere in the file. Step 14 of the pipeline is
unattended — there is no human turn to ask into, so the skill either stalls or violates its
own MUST NOT.

**Fix direction:** as with 1.8, **the guide text cannot be dropped** (KICKOFF:1200-1202
correctly names the per-language conventions: Google/NumPy/Sphinx for Python, JSDoc/TSDoc
for JS/TS). Amend the skill to add an unattended branch that infers the format from the
project's existing docstrings, keeping the ask-first rule for interactive runs.

**Acceptance:** an unattended code-documenter run completes without a question turn and
matches the repo's existing docstring convention.

---

## 1.10 — `agents/codebase-mapper` requires a date no dispatch supplies (D3)

**Fix:** Either drop the hard `Today's date:` requirement or make the date self-derivable;
stop requiring an input no dispatch convention supplies.

**Bug (REPORT §1 D3, confirmed in RE-VERIFICATION `:28`):** `codebase-mapper.md:191` says
"Replace `[YYYY-MM-DD]` with the date provided in your prompt (the `Today's date:` line).
NEVER guess or infer the date — always use the exact date from the prompt." Meanwhile
KICKOFF:364 tells the operator the focus area "is the only input they take". A repo-wide
grep for `Today's date` returns `:191` as the **only hit anywhere** — no dispatch convention
compensates. Every codebase-mapper dispatch built from this guide is missing a required
input, and the agent's own rule leaves it nowhere to go. **15 placeholders depend on it.**

**Cheapest fix (per RE-VERIFICATION):** the agent already has Bash (`:5`), so allow a `date`
fallback — keep the prompt-supplied date as the preferred source, permit self-derivation
when absent. Dropping the requirement entirely is the alternative but loses the dated
placeholders.

**Acceptance:** a codebase-mapper dispatch carrying only a focus area fills all 15 date
placeholders without stalling or guessing.

---

## 1.11 — `agents/qa.md` and `agents/ui-auditor.md` (D8 / §3.2)

Two assets, asymmetric verdicts.

### qa.md — no asset change needed

**Verdict (REPORT §1 D8, confirmed in RE-VERIFICATION `:36`):** the skip-conditions are
**real and correct** — `qa.md:251` ("Skip if: not 'verified', OR purely visual/CSS with no
JS behavior, OR no test framework exists") verbatim, plus the 2-minute cap at `:262` and the
upstream skip at `:121`; unattended operation confirmed at `:122`. It was the **guide** that
was wrong, promising "a regression test per fix" unqualified (KICKOFF:787-788). The step-10
rewrite already deletes that promise (§3.4). Nothing to do in the agent.

### ui-auditor.md — two real fixes

**Bug A — the "Top 3" template ceiling (confirmed, partially mitigated in
RE-VERIFICATION `:31`):** three-slot templates persist at `:327` ("## Top 3 Priority
Fixes"), `:426` ("### Top 3 Fixes"), `:20`, and a checkbox at `:451` — all pushing toward
exactly three findings even though `:36` forbids the ceiling. Mitigation noted: detailed
findings are unbounded, so the bias is **confined to the priority-fix section**. Kill the
three-slot templates.

**Bug B — `needs_human_review` is an orphaned flag:** it exists only at `:117`, inside the
browser branch, and has **no consumer anywhere** in the repo. Wire it beyond the browser
branch and give it a reader.

**Why this one is load-bearing for the trim: it blocks the §3.2 cut.** KICKOFF's "do not
stop at three issues" is counter-pressure against ui-auditor's *own* template. Cutting that
line is correct — the operator should not patch a skill defect from the guide — but REPORT
§3.2 is explicit that it must be **paired** with tightening the template, or expect
regression toward three-item reports. REPORT §6 ranks this "the one item not to ship blind."

**Acceptance:** ui-auditor emits an unbounded priority-fix list, and `needs_human_review` is
set outside the browser branch and consumed by something.

---

## 1.12 — `commands/verify.md` chain (D9) — no asset change

**Verdict (REPORT §1 D9, confirmed in RE-VERIFICATION `:37`):** KICKOFF:823-825 claims bare
`verify` "grades the working diff". That mechanism **exists nowhere** — zero diff-grading in
`verify.md` (all 9 lines of it) or `verifier.md`. The chain is phase-directory-oriented end
to end: canonical PHASE dir at `verifier.md:16`, PLAN/SUMMARY/roadmap loaded at `:84`,
Step 0 keyed off `PHASE_DIR/VERIFICATION.md` at `:67`.

The operator instruction that follows in KICKOFF (pass the goal explicitly) is still
correct — only the stated *reason* is fiction. REPORT calls this the exact shape of drift
that survives edits because the conclusion still looks right.

**Action:** none here. The stale claim dies with the Milestone 4 rewrite. Listed only so
it is not mistaken for unfinished asset work.

---

## Sequencing

Seven of the nine are independent asset edits across seven different files — no shared
inputs, no ordering constraints among them, so they can run fully in parallel. The
remaining two (**1.12**, and the qa.md half of **1.11**) require no asset change at all.

Downstream links worth knowing:
- **1.11 (ui-auditor half) blocks a Milestone 4 cut** — the §3.2 ui-auditor rewrite must not
  ship until the "Top 3" template is tightened. This is the only item here with a hard
  ordering dependency on the trim work.
- **1.1** gates `ROADMAP.md` item 1.2 (pattern-mapper's consumer claim adds planner only
  once 1.1 ships) and part of Milestone 4 item 2.
- **1.5** has ready-made source to copy (`ship:176`); **1.6** has ready-made vocabulary to
  copy (`plan-review-devex:240`) and a one-line restraint model (`retro.md:39`); **1.10** has
  a one-line fallback fix (Bash `date`, agent already has the tool).
- **1.8** and **1.9** are asset-side fixes whose corresponding KICKOFF text is correct and
  must **not** be trimmed — neither one converts a keep-line into a cut-line.
- **1.3** gates nothing else in Milestone 1.
- **1.12** and **qa.md** are the inverse case: the asset is correct and the *guide* is wrong,
  so both resolve inside Milestone 4's rewrites with zero dev-kit edits.
