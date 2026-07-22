---
name: converge
description: Assess the current codebase against a phase's spec and PLAN.md (tasks embedded as <task> blocks), then append any remaining unbuilt work as new traceable <task> blocks under a "## Phase N: Convergence" header so an implementation pass can complete it. Use when the user says "converge", "diff the code against the spec", "what's left to build", "gap analysis vs spec", "check if the implementation matches the spec", or after an implementation pass to find remaining work.
---

# Converge — Close the Gap Between Spec and Codebase

## Goal

Close the gap between what a feature's specification and a phase's `PLAN.md` call for and
what the codebase currently implements. Read `spec.md` and the phase's `PLAN.md` file(s)
(tasks embedded as `<task>` blocks) as the **sole source of intent** (with the constitution
as governing constraints, and the phase's `VERIFICATION.md` — if present — as pre-confirmed
supporting evidence), assess the current state of the code, determine which requirements,
acceptance criteria, plan decisions, and existing tasks are unmet, incomplete, or only
partially satisfied, and **append each piece of remaining work as a new, traceable `<task>`
block** under a `## Phase N: Convergence` header at the bottom of the plan file so that an
implementation pass can complete it. This should run only after implementation has run on
the current `PLAN.md`.

This is **not** a diff tool and does **not** track changes. It assesses the present state
of the code relative to the feature's artifacts — no git, no branch comparison, no history.

> **Artifact convention.** This pipeline produces a single `PLAN.md` per plan/track with its
> tasks embedded (`<task>…</task>`), not a separate `plan.md` + `tasks.md` split. `converge`
> reads `spec.md` and the phase's `PLAN.md`(s) and appends new `<task>` blocks to a plan
> file — the same convention `analyze` and `writing-plans`/`planner` already use.

## Relationship to Other Verify-Stage Assets

Converge is the **remediation compiler**, not the verdict: it runs an exhaustive
requirement-level sweep (every FR/SC/AC, every constitution MUST, plus `unrequested`
scope-creep detection) and turns whatever remains into executable `<task>` blocks. It sits
alongside three other verify-stage assets that answer different questions:

- **`verifier`** — the **verdict** gate: goal-backward observable truths, 4-level
  artifact/wiring checks, structured gaps → `VERIFICATION.md`. Uniquely catches stubs and
  hollow wiring that a requirements sweep alone would miss. `converge` treats a phase's
  `VERIFICATION.md` (when present) as pre-confirmed evidence — see Step 2 — but still runs
  its own full sweep, since verifier only checks roadmap-level truths, not every FR/SC/AC.
- **`integration-checker`** — **cross-phase** wiring (verifier and converge are
  within-phase); fires meaningfully once ≥2 phases exist in the milestone.
- **`nyquist-auditor`** — the **test-gap filler**: writes a real behavioral test for each
  requirement verifier/converge flagged as lacking automated coverage.

## File Locations

- **SPEC** — the governing spec: `docs/milestones/<M>/specs/<NNN>-<slug>/spec.md`
  (configurable; if the project keeps requirements elsewhere, use whichever the plan's
  `requirements` frontmatter references).
- **PLAN** — the phase's `PLAN.md` file(s): by default
  `docs/milestones/<M>/phases/<NN>-<slug>/<NN>-<MM>-PLAN.md`. A phase may have several plans
  across waves/tracks; load **all** of them to build the intent inventory. If the user points
  at one plan file directly, converge against that file.
- **VERIFICATION** — the phase's `VERIFICATION.md`
  (`docs/milestones/<M>/phases/<NN>-<slug>/VERIFICATION.md`), if one exists. Optional input
  evidence, not a prerequisite.
- **CONSTITUTION** — `docs/global/project/constitution.md` by default (see the `constitution`
  skill).

Follow any project-specific path convention (CLAUDE.md) over these defaults.

## Operating Constraints

**APPEND-ONLY, NEVER REWRITE**: The **only** write is appending a new
`## Phase N: Convergence` section — containing one or more new `<task>` blocks — to the end
of a `PLAN.md` file. You MUST NOT:

- modify `spec.md`, `VERIFICATION.md`, or any existing part of `PLAN.md` in any way;
- rewrite, renumber, reorder, or delete any existing `<task>` block (including tasks from a
  prior Convergence section);
- modify, create, or delete any application code — completing the appended tasks is the job
  of the implementation pass (`sprint-execution`).

When the codebase already satisfies everything, leave every `PLAN.md` file
**byte-for-byte unchanged** (no empty Convergence header) and report a clean result.

**Constitution Authority**: The project constitution is **non-negotiable**. Code that
violates a MUST principle is the highest-severity finding and produces a corresponding
remediation task. If the constitution is an unfilled template, skip constitution checks
gracefully rather than failing.

## Execution Steps

### 1. Initialize Convergence Context

Identify the active feature/phase — from the user's context, the most recently modified
phase directory, or by asking. Derive paths:

- SPEC = the governing spec (`docs/milestones/<M>/specs/<NNN>-<slug>/spec.md`, or the
  requirements doc the plan's `requirements` frontmatter points at)
- PLAN = the phase's `PLAN.md` file(s)
  (`docs/milestones/<M>/phases/<NN>-<slug>/<NN>-<MM>-PLAN.md`) — tasks live inline as
  `<task>` blocks
- VERIFICATION = the phase's `VERIFICATION.md`, if present
- CONSTITUTION = the project's constitution file, if present

If `spec.md` or every `PLAN.md` for the phase is missing, STOP with a clear, actionable
message naming the prerequisite step to run (the `specify` skill for a missing spec,
`planner`/`writing-plans` for a missing `PLAN.md`). Do not produce partial output. A missing
`VERIFICATION.md` is not fatal — converge simply runs its full sweep without pre-confirmed
evidence. A missing constitution is not fatal — note it and skip constitution checks.

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Functional Requirements (FR-###)
- Success Criteria (SC-###) — include only items requiring buildable work; exclude
  post-launch outcome metrics and business KPIs
- User Stories and their Acceptance Scenarios
- Edge Cases (if present)

**From each PLAN.md (all plan files for the phase):**

- Frontmatter: `requirements` (requirement IDs this plan claims), `must_haves`
  (truths/artifacts/key_links), `wave`, `depends_on`, `files_modified`
- Task IDs and `<name>` values (to compute the next task number and next
  `## Phase N: Convergence` number per file)
- Each `<task>` block's `<name>`, `<files>`, `<action>`, `<verify>`, `<done>`

**From VERIFICATION.md (if present):**

- Parse the `gaps:` list from frontmatter (`truth`, `status`, `reason`, `artifacts`,
  `missing`). These truths already failed goal-backward verification — fold each into the
  intent inventory as a pre-confirmed `missing`/`partial` finding sourced from
  `source-ref: verifier: <truth>`, without re-deriving it from scratch in Step 4. This is
  evidence, not the whole job: VERIFICATION.md only covers roadmap-level truths, not every
  FR/SC/AC or constitution principle, so continue the full sweep below regardless.

**From constitution (if not an unfilled template):**

- Principle names and MUST/SHOULD normative statements

### 3. Build the Intent Inventory

Create an internal model (do not echo raw artifacts):

- **Requirements inventory**: one stable key per FR-### / SC-### / user-story acceptance
  scenario (e.g. `US1/AC2`), plus the plan decisions and constitution principles that
  impose buildable obligations. Seed it with any pre-confirmed findings carried over from
  VERIFICATION.md (Step 2).
- **Code-scope map**: from the file paths named in `PLAN.md`, plus a keyword search for the
  concepts each requirement describes, derive the set of source files and components in
  scope for assessment. Bound the assessment to these — do **not** infer scope beyond what
  the artifacts define.

### 4. Assess the Codebase and Classify Findings

For each item in the intent inventory, inspect the current code in scope and produce a
`Finding` only where there is a gap. Classify every finding by **gap type**:

- **`missing`**: the required work is absent from the code entirely.
- **`partial`**: the work exists but does not yet fully satisfy the requirement /
  acceptance criterion / plan decision.
- **`contradicts`**: the code does something that conflicts with stated intent or a
  constitution MUST principle.
- **`unrequested`**: the code contains work not called for by the spec, plan, or tasks
  (surfaced for awareness — converge does **not** delete code, it only appends a task to
  review/justify or remove it).

Each `Finding` records: a stable id, the `source-ref` it traces to, the `gap-type`, a
severity, the target `PLAN.md` file it belongs to, and a short human-readable description
with the evidence (the file/area observed).

**Edge cases:**

- **Little or no code yet**: treat the entire specified scope as `missing` remaining work
  rather than failing.
- **Nothing remains**: produce zero findings and follow the converged branch in Step 7.

### 5. Assign Severity

- **CRITICAL**: violates a constitution MUST principle, or a `missing`/`contradicts` gap
  that blocks baseline functionality of a P1 user story.
- **HIGH**: a `missing` or `partial` gap on a core functional requirement or acceptance
  criterion.
- **MEDIUM**: a `partial` gap on a secondary requirement, or an `unrequested` addition with
  unclear justification.
- **LOW**: minor partial gaps, polish, or low-risk `unrequested` additions.

### 6. Present the In-Session Findings Summary

Before appending anything, output a compact, severity-graded summary (no file writes yet):

## Convergence Findings

| ID | Gap Type | Severity | Source | Target Plan | Evidence | Remaining Work |
|----|----------|----------|--------|--------------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | 03-01-PLAN.md | Example: no append-only guard detected in path/to/module.py | Add append-only enforcement |

**Summary metrics:**

- Requirements / acceptance criteria checked
- Plan decisions checked
- Constitution principles checked (or "skipped — template")
- Pre-confirmed findings carried over from VERIFICATION.md (or "none — no VERIFICATION.md")
- Findings by gap type (missing / partial / contradicts / unrequested)
- Findings by severity

### 7. Append Convergence Tasks (or report converged)

**If there are one or more actionable findings** (`tasks_appended` outcome):

Group findings by their target `PLAN.md` file, then per file, append to the **end** of that
file, per the append contract:

1. Scan all existing `<task><name>` ordinals across **every** `PLAN.md` for this phase; let
   `M` be the maximum task number found anywhere in the phase. Determine the next
   `## Phase N: Convergence` number for this file (highest existing `## Phase` header in
   this file + 1, starting at 1 if none).
2. Write a single new section header `## Phase N: Convergence` at the end of the file.
3. Emit one `<task type="auto">` block per actionable finding targeting this file, ordered
   CRITICAL/HIGH first, numbering `<name>` continuing from `M+1, M+2, …` across the whole
   phase (never reused across files):

   ```markdown
   <task type="auto">
     <name>Task {M+1}: {imperative description}</name>
     <files>
       - Create/Modify: `exact/path/to/file`
     </files>
     <interfaces>
       Consumes: [existing signatures this task builds on]
       Produces: [what it adds/changes]
     </interfaces>
     <action>{Specific implementation instructions per <source-ref> (<gap-type>) — name
     the identifiers, signatures, and behavior. No fenced code blocks here.}</action>
     <verify>{A specific command that proves the gap is closed, under ~60s}</verify>
     <done>{Acceptance criteria tracing back to the source requirement}</done>
     <complexity_signals>files: [...]; novelty: none|low|high; logic: low|medium|high; ambiguity: low|medium|high; tests: none|existing|new</complexity_signals>
   </task>
   ```

   `<source-ref>` (referenced inside `<action>`) traces the task to its origin: e.g.
   `FR-003`, `SC-002`, `US1/AC2`, `plan: storage decision`, `Constitution II`,
   `verifier: <truth>` (for findings carried over from VERIFICATION.md).

   `<gap-type>` is one of `missing`, `partial`, `contradicts`, `unrequested`.

   Constitution-violation tasks MUST be emitted first and described as `CRITICAL`.
4. Never reuse or renumber existing task numbers or `## Phase N` headers. If a prior
   Convergence section exists in this file, add a new, separately-numbered one below it —
   do not touch the old one.

**If there are no actionable findings** (`converged` outcome):

- Do **not** modify any `PLAN.md` at all — no empty phase header.
- Report: **"✅ Converged — the implementation satisfies the spec and PLAN.md(s)."**
- Include the summary counts of what was checked.

### 8. Provide Next Actions (Handoff)

- On `tasks_appended`: state how many tasks were appended, under which `## Phase N:
  Convergence` header(s), and in which `PLAN.md` file(s); recommend running an
  implementation pass (`sprint-execution`) to complete them; note that a follow-up converge
  run will find fewer or no remaining items.
- On `converged`: recommend proceeding to `verify` (if not already run) or review/PR. No
  further implementation pass is needed for this phase's specified scope.
