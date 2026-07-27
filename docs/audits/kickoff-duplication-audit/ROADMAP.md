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

| # | Asset | Fix |
|---|---|---|
| 1.1 | `agents/planner.md` | Phase-context loader must ingest `PHASE/PATTERNS.md`, `PHASE/UI-SPEC.md`, `SPEC/AI-SPEC.md` (when present). Also close the `## Parallel Execution Map` template gap (§3.5 risk 2). |
| 1.2 | `agents/pattern-mapper.md` | Fix the mis-named consumer claim (`:67`) — the real consumer today is `plan-review-goal-backward`; add planner once 1.1 ships. Add a non-empty-input precondition guard. |
| 1.3 | `agents/project-researcher.md` | Add an assigned-file dispatch input so four parallel researchers stop overwriting each other. |
| 1.4 | `agents/roadmapper.md` | Must *create* `REQUIREMENTS.md` (traceability section included), not just update it. Remove the Setup→…→Polish worked example under "Good Phase Patterns" (D5). |
| 1.5 | `skills/finishing-a-development-branch` | "Push and Create PR" must actually run `gh pr create`. |
| 1.6 | `skills/devex-review` | Define pass/fail threshold, emit a verdict; add read-only/no-commit restraint (also §4b MEDIUM). |
| 1.7 | D2 — 4 lane skills (`python-pro`, `flutter-expert`, `django-expert`, +grep for others) | Reconcile code-first internal workflows with TDD: one line deferring test ordering to `test-driven-development` when co-loaded. |
| 1.8 | D4 `skills/design-consultation` | Gate the Phase 6 "run design-html" closer on `claude_design_system_id` being bound. |
| 1.9 | D6 `skills/code-documenter` | Permit convention-based docstring-format inference when running unattended. |
| 1.10 | D3 `agents/codebase-mapper` | Either drop the hard `Today's date:` requirement or make the date self-derivable; stop requiring an input no dispatch convention supplies. |
| 1.11 | D8/§3.2 `agents/qa.md`, `agents/ui-auditor.md` | qa: none (guide text was wrong, rewrite already fixes it). ui-auditor: kill the "Top 3" template ceiling; wire `needs_human_review` beyond the browser branch. **Blocks the §3.2 cut.** |
| 1.12 | D9 `commands/verify.md` chain | No asset change needed — KICKOFF's stale mechanism claim dies in Milestone 4. |

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
3. step 10 `ui-auditor` — only after 1.11.
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

**Exit criterion:** audit-clean + at least stages 0–3 executed successfully from the thin prompts.

---

## Sequencing and effort shape

M1 → M4(items 1–2 can start immediately, in parallel with M1) → M2 ∥ M3 → M4(rest) → M5 → M6.
M1–M3 are dev-kit asset edits (the bulk of the work, ~40 asset files touched). M4–M5 are
devkit-pipeline edits. M6 is the gate. Nothing here reintroduces pipeline machinery into
dev-kit or state files into devkit-pipeline — the operator's position remains "wherever they
are in KICKOFF.md".
