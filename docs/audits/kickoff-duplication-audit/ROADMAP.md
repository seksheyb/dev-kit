# Roadmap: thin KICKOFF — small prompts only

**Goal (the contract this roadmap serves):** the pipeline guide (`devkit-pipeline/KICKOFF.md`)
carries only small prompts. File names, methodologies, output formats, and every other
instruction live inside the assets (skills/agents/commands) in `dev-kit`. The operator never
has to remember what prompt to give. `references/doc-sitemap.md` is the agreed path contract
that makes this possible.

**Where the audit stopped, and why this roadmap exists:** the audit (REPORT.md) classified
KICKOFF text as 55% redundant / 45% load-bearing — but it graded against the assets *as they
are today*. Most of the "load-bearing" 45% is load-bearing only because an asset is currently
defective or currently refuses to own its path. Those are asset bugs, not guide content. This
roadmap fixes the assets first, which converts the keep-list into cut-list, then rewrites
KICKOFF down to the irreducible operator layer.

---

## The end-state contract: what a KICKOFF stage may say

A stage prompt may contain **only** the six things no asset can ever know:

1. **Which asset to invoke** — one line: "Use the `<name>` skill/agent."
2. **Identifiers** — `<M>`, `<NN>`, `<MM>`, `<branch>`, round `n`. Ids only, never paths.
   Assets derive every path from the sitemap contract + the ids.
3. **Mode selection** among modes the asset genuinely offers (brainstorming's three modes,
   code-review-gate round vs single, plan-review lens subset).
4. **Operator-judgment gates** — `*(only if this phase shipped UI)*`, "Tell me before you let
   it do that", "run it even when verify came back `passed`".
5. **Cross-step ordering, parallelism, and session boundaries** — "these five fan out safely",
   "the merge belongs inside the loop", the six `context-save` → `/clear` → `context-restore`
   placements.
6. **Scope narrowing the asset cannot know** — "this milestone's delta, not the whole surface",
   "against SPEC/spec.md".

Everything else — methodology, output templates, severity ladders, git recipes, path strings,
input-file lists, purpose paraphrases — is asset content. If a stage prompt needs more than
~5 lines, that is a defect in an asset, and the fix goes in the asset.

Target size: **≤400 lines total** (from 1,396), typical prompt block 2–5 lines.

---

## Milestone 1 — Fix the HIGH-severity asset defects (repo: dev-kit)

These are live bugs today regardless of any trimming, and each one holds KICKOFF lines
hostage. Sources: REPORT.md §1 (D-findings that are skill-side) + §4b HIGH table.

| # | Asset | Fix | Status |
|---|---|---|---|
| 1.1 | `agents/planner.md` | Phase-context loader must ingest `PHASE/PATTERNS.md`, `PHASE/UI-SPEC.md`, `SPEC/AI-SPEC.md` (when present). Also close the `## Parallel Execution Map` template gap (§3.5 risk 2). | ✅ **Done** — see 1.1 note |
| 1.2 | `agents/pattern-mapper.md` | Fix the mis-named consumer claim (`:67`) — the real consumer today is `plan-review-goal-backward`; add planner once 1.1 ships. Add a non-empty-input precondition guard. | ⬜ Open — unblocked now that 1.1 has shipped |
| 1.3 | `agents/project-researcher.md` | Add an assigned-file dispatch input so four parallel researchers stop overwriting each other. | ✅ **Done** — `assigned_axis` |
| 1.4 | `agents/roadmapper.md` | Must *create* `REQUIREMENTS.md` (traceability section included), not just update it. Remove the Setup→…→Polish worked example under "Good Phase Patterns" (D5). | ⬜ Open |
| 1.5 | `skills/finishing-a-development-branch` | "Push and Create PR" must actually run `gh pr create`. | ✅ **Done** — ported from `ship:176` |
| 1.6 | `skills/devex-review` | Define pass/fail threshold, emit a verdict; add read-only/no-commit restraint (also §4b MEDIUM). | ✅ **Done** |
| 1.7 | D2 — 4 lane skills (`python-pro`, `flutter-expert`, `django-expert`, +grep for others) | Reconcile code-first internal workflows with TDD: one line deferring test ordering to `test-driven-development` when co-loaded. | ⬜ Open — superseded in scope by `roadmap-shortlisted-workflow.md` item 3 |
| 1.8 | D4 `skills/design-consultation` | Gate the Phase 6 "run design-html" closer on `claude_design_system_id` being bound. | ✅ **Done** |
| 1.9 | D6 `skills/code-documenter` | Remove the interactive "ask for format preference" requirement (`SKILL.md:25,120,129`); resolve docstring format from `docs/global/project/constitution.md` (same default path/fallback pattern as `analyze`/`converge`/`specify` — missing/unfilled constitution is not fatal), then existing codebase convention, then language default. No human turn required. | ✅ **Done** — full 3-tier, ask removed |
| 1.10 | D3 `agents/codebase-mapper` | Either drop the hard `Today's date:` requirement or make the date self-derivable; stop requiring an input no dispatch convention supplies. | ✅ **Done** — Bash `date` fallback |
| 1.11 | D8/§3.2 `agents/qa.md`, `agents/ui-auditor.md` | qa: none (guide text was wrong, rewrite already fixes it). ui-auditor: kill the "Top 3" template ceiling; wire `needs_human_review` beyond the browser branch. **Blocks the §3.2 cut.** | ✅ **Done** — §3.2 cut now unblocked |
| 1.12 | D9 `commands/verify.md` chain | No asset change needed — KICKOFF's stale mechanism claim dies in Milestone 4. | ✅ **Resolved, no action** — confirmed against live files |
| 1.13 | `agents/{ai-researcher,eval-planner,framework-selector}.md` (dev-kit-data-ai), `agents/domain-researcher.md` (dev-kit-core) | **New — same damage class as 1.3, different root cause.** All four "update `AI-SPEC.md` at `ai_spec_path`", but their `tools:` frontmatter grants `Write` only, not `Edit`. Write is a whole-file overwrite, so each clobbers its siblings' sections **even on the documented sequential chain**. Fix is a tool grant + an explicit read-modify-write contract; spans two plugins including frontmatter. | ⬜ **Open — new, HIGH** |
| 1.14 | `skills/graphify/SKILL.md:295-301,369-372` | **New — scoping token exists but is never wired to the write.** N chunk subagents are dispatched in one message with byte-identical prompts; `CHUNK_NUM` is substituted only into a human-readable header, never into an output path, and the prompt never tells the subagent to Write at all — yet the collector treats the missing `.graphify_chunk_NN.json` as a read-only-agent-type failure. Same shape as 1.3/1.13. | ⬜ **Open — new** |

**Provenance of 1.13/1.14:** both were surfaced by the structural sweeps during the 1.1/1.3
fix wave, not by the original audit. They are live asset bugs but they hold **no KICKOFF text
hostage**, so they do **not** gate this milestone's exit criterion below — they are filed here
because this is the "fix live asset defects" milestone, not because the trim depends on them.

**1.1 note — one contract decision made during the fix, flagged for review.** The
`## Parallel Execution Map` gap could not be closed without reconciling a granularity
mismatch: the planner emits **one plan file per track**, but the map's consumers
(`gate-plan-review`, `sprint-execution`) assume **one plan file carrying many tracks**. The
shipped resolution puts the map **once per phase, in the lowest-numbered plan**, with a
one-line pointer in every other plan — duplicating the table into every plan would have
recreated exactly the duplication this audit exists to remove. This is a contract decision
rather than a bug fix, so it must be reviewed before the Milestone 4 step-7 planner-handoff
rewrite ships against it (see Milestone 4 item 2).

**1.9 note — shipped in two passes; the second closed the gap.** The fix wave first landed the
narrower variant described in `roadmap-shortlisted.md` (a 2-tier unattended branch with the
interactive ask retained), which did not satisfy this row. A follow-up pass replaced it with
the 3-tier order specified above. As shipped now:
- **Tier 1 constitution lookup added** — `docs/global/project/constitution.md` at its canonical
  default path; when it names a documentation standard, that governs and later tiers are not
  consulted. Absent / unfilled-template / silent all fall through and are explicitly not fatal,
  matching how `analyze`, `converge`, and `specify` treat the same file.
- **The ask is gone, not rescoped.** There is no interactive-vs-unattended split any more —
  resolution is deterministic, so the skill behaves identically either way and cannot stall.
  The `### MUST DO` bullet now states the resolution order; `### MUST NOT DO` forbids stalling
  on a human choice and forbids overriding an explicit constitution standard.
- **Tier 2 gained explicit style-config detection** (`numpydoc`/`sphinx` settings,
  `.jsdoc.json`, `typedoc.json`) ahead of docstring sampling; ties fall through to tier 3
  rather than resolving arbitrarily. Exclusions resolve the same way, so the whole Discover
  step is unattended-safe rather than just the format half.
- **Guarded:** `scripts/checks/skill-precondition-guards.sh` Check 2 asserts all three tiers,
  the fallthrough clause, and that no "ask for format" bullet returns. Verified to fail against
  both the pre-wave file and the interim 2-tier version.
- **Still open (unchanged):** the constitution template has no dedicated docstring-format slot
  (freeform prose only), so tier 1 is human-readable but not machine-checkable. Tracked below.

**1.9 detail — `code-documenter/SKILL.md` resolution order (unattended-safe, no ask):**
1. **Constitution** — load `docs/global/project/constitution.md` (default path per the `constitution` skill). If it names a documentation/docstring standard (naturally under an "Additional Constraints" or "Development Workflow" section), that governs.
2. **Existing codebase convention** — if the constitution is absent, unfilled, or silent on documentation style: scan for existing docstrings/comments and style markers (`numpydoc`/`sphinx` config, `.jsdoc.json`, `typedoc.json`) and match what's already there.
3. **Language-conventional default** — Google-style for Python, JSDoc for TS/JS — only if neither of the above yields a signal.

Line-level changes: `SKILL.md:25` (Discover step) drops "Ask for format preference" for the tiered lookup above; `SKILL.md:120` (MUST DO) becomes "Determine format preference: constitution → existing convention → language default"; `SKILL.md:129` (MUST NOT DO) drops "without asking" so it no longer forbids the tiered resolution it now requires. Open follow-up: the constitution template has no dedicated docstring-format slot today (freeform prose only) — may need a named field for tier 1 to be reliably machine-checkable; track separately if so.

**1.11 detail — `agents/ui-auditor.md` line-level changes (qa.md needs none):**

1. **Kill the "Top 3" template ceiling (ui-auditor-11, medium — do not ship the §3.2 cut without this).** The skill forbids stopping at 3 issues at `:36` but its own output template only has 3 slots, so it self-contradicts and under-reports. Change all four sites from a fixed 3-slot list to an open, severity-ranked list:
   - `:20` → "Score each pillar 1-4, identify all priority fixes ranked by severity (do not cap at three)"
   - `:327` (`## Top 3 Priority Fixes`) → `## Priority Fixes`, with a note "list every BLOCKER and WARNING found, ranked by severity — do not cap at three" and an open-ended numbered list instead of exactly 3 slots
   - `:426` (`### Top 3 Fixes` in the structured return) → `### Priority Fixes`, same open-list treatment
   - `:451` (success-criteria checkbox) → "All priority fixes identified and ranked (not capped at three)"

2. **Wire `needs_human_review` beyond the browser branch (ui-auditor-9, low).** `:117` only sets `needs_human_review: true` inside the browser-tooling branch; the CLI-fallback and code-only paths (`:123-154`) have no equivalent, even though `:25` already states the intent generally. Move the flagging language out of `<browser_tooling_approach>` into a mechanism-agnostic spot (e.g. `<audit_pillars>` or `<output_format>`): any finding requiring subjective/visual judgment gets `needs_human_review: true` regardless of whether screenshots came from browser tooling, CLI fallback, or a code-only audit.

Not required for 1.11 but worth doing alongside it: the BLOCKER/WARNING taxonomy declared at `:38-40` never appears in the `<output_format>` template (`:303-359`) — wire severity labels into the findings sections when this file is next touched.

**1.12 detail — D9 `commands/verify.md` chain: why no dev-kit fix applies, and where the deletion actually lands:**

1. **Confirmed no asset defect.** `commands/verify.md:5` says only "default: the current change's stated goal" — it never claims to grade a diff. `agents/verifier.md` is phase-directory-oriented end to end: canonical PHASE dir at `:16`, PLAN/SUMMARY/roadmap loaded at `:84`, Step 0 keyed off `PHASE_DIR/VERIFICATION.md` at `:67`. RE-VERIFICATION.md confirms it: "Zero diff-grading mechanism in verify.md (9 lines) or verifier.md." There is nothing to change in `dev-kit`.
2. **The defect is 100% guide-side.** `KICKOFF.md:823-825` claims bare `verify` "grades the working diff" — a mechanism that exists nowhere in the chain. The operator instruction that follows (pass the goal explicitly) stays correct; only the stated *reason* for it is fiction — drift that survives edits because the conclusion still looks right (REPORT.md D9).
3. **Where the deletion actually happens — flag a sequencing gap.** The stale sentence sits inside step 11, but the only drafted Milestone-4 rewrite for that step, `rewrites/step11-converge-sweep.md`, is scoped to KICKOFF lines 867-879 (the converge block) — it does not touch 823-825. So "dies in Milestone 4" is only true if that rewrite's scope is widened to also drop/correct 823-825 before it ships. As drafted today, the stale sentence would survive Milestone 4 untouched and only get caught by Milestone 5's full step-by-step rewrite. When executing Milestone 4 item 2 (step 11), either (a) extend `rewrites/step11-converge-sweep.md` to cover 823-825, or (b) update this roadmap to move 1.12's actual payoff to Milestone 5 and drop the Milestone-4 claim.
4. **Exit check for 1.12 specifically:** grep the shipped KICKOFF.md for "grades the working diff" — zero hits confirms closure, independent of which milestone actually removed it.

**Exit criterion:** every §4b-HIGH KICKOFF line is reclassified trimmable.

## Milestone 2 — Fix the MEDIUM gap defects (repo: dev-kit)

The §4b MEDIUM entries, as corrected by RE-VERIFICATION.md (one refuted, four narrowed):

- `skills/bugfix-wave` — add the cross-session preflight covering both leftover worktrees AND
  leftover same-name track branches (`git checkout -b` fails on those); fix the misdiagnosing
  Edge Case (`:559-562`).
- `skills/constitution` — add a real elicitation pass for greenfield repos (the step-0 pipeline
  design already assumes a "principle interview").
- `skills/rag-architect` — defer to an upstream AI-SPEC decision instead of re-opening the stack.
- `agents/design-reviewer` — bootstrap branch: when `design-baseline.json` is absent, run the
  full audit and write this run as the baseline (today only regression mode writes the file it
  itself requires).
- `skills/ship` — one cross-link sentence naming `land-and-deploy` as where merge/deploy lives
  (the boundary exists there already; ship just never says so).
- `skills/sprint-execution` — extend the `Merged`-field verification duty (`:180`, `:212`) to
  the `Tests:`/`Status:` handover fields; the rest of its evidence machinery is real.
- `agents/incident-responder` — add the disclosure-clock-starts-at-discovery clause to First
  response (deadline tracking already exists at `:24`); `agents/compliance-auditor` gets the
  full fix (discovery-start rule + early interim regime artifact).
- Rest of the list unchanged: brainstorming premise-gate in the standard flow, diagram re-sync
  duty for embedded fences, plan-review config-sourced default, chaos-engineer incident-derived
  seeding, test-master Maestro methodology (load-bearing — `gate-automation:42` routes Maestro
  authoring to it), architecture-designer (`skills/`, not `agents/`) ↔ diagram pairing.
- ~~`skills/learn` autonomous append path~~ — **REFUTED, dropped**: `SKILL.md:26` already
  authorizes unattended workflow appends and `debugger.md:276` implements it.
- `skills/sre-engineer` — **downgraded to optional**: a blocking calibration gate already
  exists (`SKILL.md:21`); only the reference checklist's one-sidedness remains.

**Exit criterion:** the corrected §4b list is empty; zero KICKOFF lines exist to compensate for an asset.

## Milestone 3 — Path-ownership flip: ids in, paths out (repo: dev-kit)

The structural move the audit did not make. Every asset that currently says "the caller
supplies the path" gets its **default path from the sitemap contract**, parameterized only by
ids. The dispatch contract becomes: *pass `<M>`/`<NN>`/`<branch>`/round `n`; the asset resolves
paths itself and accepts an explicit path only as an override.*

- Sweep: grep dev-kit for delegation language ("dispatch prompt provides", "orchestrator
  supplies", "caller specifies") — known members: `market-researcher`, `ui-auditor`,
  `bugfix-wave` (fixes.json), plus the §4a "Output paths" category.
- Model to copy: `converge` already does this right — give it `<NN>` and it derives SPEC,
  PLAN, VERIFICATION, CONSTITUTION itself (REPORT §3.3).
- Verify each flipped asset's default against `references/doc-sitemap.md`; where the sitemap
  is silent (e.g. `PHASE/reviews/round-<n>/`), extend the sitemap — the contract grows, the
  guide does not.

**Exit criterion:** no KICKOFF prompt needs to contain a path string. Ids only.

## Milestone 4 — Ship the seven drafted rewrites (repo: devkit-pipeline)

The ~100-line down payment, already drafted in `rewrites/`. Order per REPORT §6:

1. step 2 `sdd-review-cto` + step 11 `converge` — zero-risk total deletions.
2. step 15 close-out, step 7 planner handoff, step 10 qa — after Milestone 1 lands (the
   planner-gap warnings in the step-7 rewrite become deletable too once 1.1 ships).
   **Added gate — review the 1.1 Parallel Execution Map contract decision before this ships.**
   1.1 resolved a granularity mismatch by placing the map once per phase in the lowest-numbered
   plan (pointer in the rest) rather than in every plan. The step-7 planner-handoff rewrite is
   drafted against the *old* assumption that a plan file carries many tracks. Confirm the
   shipped placement is the one you want, then write the rewrite against it — do not let the
   draft and the asset disagree silently. See the 1.1 note in Milestone 1.
3. step 10 `ui-auditor` — only after 1.11. **Unblocked: 1.11 has shipped.**
4. step 10 `bugfix-wave` merge loop last, restoring the two cheap insurances the draft names
   (the detached-HEAD consequence clause; the re-attach bullet).

**Exit criterion:** KICKOFF ≈ 1,300 lines and every rewrite's "pair with skill fix" condition
is satisfied, not skipped.

## Milestone 5 — Thin-KICKOFF full rewrite (repo: devkit-pipeline)

Rewrite all 16 steps to the end-state contract above. This is where the remaining ~380
redundant lines (437 confirmed minus the ~100 from Milestone 4) plus the newly-trimmable
gap-compensation and path text all come out.

- Work step-by-step, one PR-sized commit per step, checking each cut against the audit's
  claim data (`verdicts/`, `findings/`) — the trim list is act-on-as-read; **verify every
  "keep" before relying on it** (REPORT §6: refutations concentrated in the keep direction).
- Keep C4's lesson: where one asset is invoked N times, the *timing* sentence differs per
  site and stays; the description collapses to the invocation line.
- Add the one-word disambiguations the audit flagged as cheap permanent wins (C6: step 8
  names guard's mode explicitly).
- Put the end-state contract itself at the top of KICKOFF as a short "what this file may
  contain" preamble — that is the regression guard against restatement creeping back.

**Exit criterion:** ≤400 lines; every prompt block passes the six-category test.

## Milestone 6 — Verify and lock (both repos)

1. Re-run the audit machinery (`workflow.js` in this folder — asset-sharded, and mind the
   regex trap: `the [a-z0-9-]+ (skill|agent|command)` over-matches prose) against the new
   KICKOFF. Pass = zero confirmed methodology-reteach, output-contract, invocation-boilerplate,
   or path-restatement claims; roster check still 22/22; `unresolved: []`.
2. Dry-run steps 0–3 on a scratch project via `bin/bootstrap-devkit-project.sh` — the prompts
   have never been executed end to end; the thin versions must be exercised at least through
   roadmap creation before this closes.
3. Record the six-category contract in `CROSSCHECK-BACKLOG.md`'s successor as the standing
   review rule for all future KICKOFF edits.
4. **Correct the audit's own drifted counts before re-running.** The Milestone 1 fix wave
   verified several cited figures against the live files and found them overstated or stale.
   Known corrections: D3/1.10 claims "15 placeholders depend on it" — the real figure is
   **9 `[YYYY-MM-DD]` occurrences + 7 `[date]` footer slots = 16 date-dependent slots**;
   `codebase-mapper.md` frontmatter `tools:` is at `:4`, not `:5`; the Option 2 body in
   `finishing-a-development-branch` spans `:121-128`, not `:121-126`. All ui-auditor refs
   (`:20,:36,:117,:327,:426,:451`) and the design-consultation / code-documenter refs were
   confirmed exact. Sweep REPORT.md and RE-VERIFICATION.md for the same class of arithmetic
   drift — a re-run that grades against stale counts will mis-report closure.
5. **Wire the three guard scripts into whatever runner Milestone 6 establishes.**
   `scripts/checks/{planning-agent-guards,skill-precondition-guards,skill-pr-promise-guards}.sh`
   were added by the Milestone 1 fix wave and each was verified to fail against the pre-fix
   tree at `04c5cbf` and pass against the fix. They are run-by-hand today because this repo has
   no CI; they are the only mechanical regression guards the audit has produced.

**Exit criterion:** audit-clean + at least stages 0–3 executed successfully from the thin prompts.

---

## Sequencing and effort shape

M1 → M4(items 1–2 can start immediately, in parallel with M1) → M2 ∥ M3 → M4(rest) → M5 → M6.
M1–M3 are dev-kit asset edits (the bulk of the work, ~40 asset files touched). M4–M5 are
devkit-pipeline edits. M6 is the gate. Nothing here reintroduces pipeline machinery into
dev-kit or state files into devkit-pipeline — the operator's position remains "wherever they
are in KICKOFF.md".
