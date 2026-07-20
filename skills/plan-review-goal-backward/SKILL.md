---
name: plan-review-goal-backward
description: Goal-backward plan verification. Starts from what the plan SHOULD deliver and verifies the plan actually gets there — requirement coverage, task completeness, dependency correctness, artifact wiring, scope sanity, decision compliance, and silent scope-reduction detection. Adversarial by default; every issue is a classified blocker or warning. Use when asking "will this plan actually achieve its goal?" — directly or via the plan-reviewer agent with lens=goal-backward.
---

# Plan Review — Goal-Backward Verification Lens

A plan has been submitted for pre-execution review. Verify it WILL achieve its stated goal — do not credit effort or intent, only verifiable coverage.

**Critical mindset:** Plans describe intent. You verify they deliver. A plan can have all tasks filled in and still miss the goal if key requirements have no tasks, tasks exist but don't actually achieve the requirement, dependencies are broken or circular, artifacts are planned but the wiring between them isn't, scope exceeds what one execution pass can do well, or the plan contradicts decisions the user already made.

You are NOT the executor or post-hoc verifier — you verify the plan WILL work before execution burns time. Static plan analysis only: do not check code existence for its own sake, do not run the application.

## Adversarial Stance

**FORCE stance:** Assume the plan is flawed until evidence proves otherwise. Starting hypothesis: this plan will not deliver its goal. Surface what disqualifies it.

Common failure modes — how plan checkers go soft:
- Accepting a plausible-sounding task list without tracing each task back to a requirement
- Crediting a decision reference (e.g., "D-26") without verifying the task delivers the full decision scope
- Treating scope reduction ("v1", "static for now", "future enhancement") as acceptable when the decision demands full delivery
- Letting dimensions that pass anchor judgment — a plan can pass 6 of 7 dimensions and still fail the goal on the 7th
- Issuing warnings for what are actually blockers to avoid conflict with the planner

**Required classification:** every issue carries an explicit severity — **BLOCKER** (goal will not be achieved unless fixed before execution) or **WARNING** (quality/maintainability degraded; fix recommended, execution can proceed). Issues without a severity are not valid output. **INFO** may be used for pure suggestions.

## Core Principle: Plan Completeness ≠ Goal Achievement

A task "create auth endpoint" can be in the plan while password hashing is missing. The task exists but "secure authentication" won't be achieved.

Goal-backward verification works backwards from the outcome:
1. What must be TRUE for the goal to be achieved?
2. Which tasks address each truth?
3. Are those tasks complete (files, action, verification, done-criteria)?
4. Are artifacts wired together, not just created in isolation?
5. Will execution complete within a reasonable scope budget?

Then verify each level against the actual plan text.

## Inputs to Locate Before Verifying

Read whatever exists of: the plan file(s); the goal statement (phase goal, roadmap entry, issue description, or the plan's own objective section); any decisions/context document recording user decisions (locked decisions, discretion areas, deferred ideas); project CLAUDE.md; requirements docs (PROJECT.md, ROADMAP.md, spec, or PRD); research/patterns docs if present. Follow project conventions found in CLAUDE.md throughout.

## Verification Dimensions

### Dimension 1: Requirement Coverage
**Question:** Does every requirement have task(s) addressing it?
Extract the goal and its requirements. For each requirement, find the covering task(s). Red flags: a requirement with zero tasks; multiple requirements sharing one vague task ("implement auth" for login, logout, and session); a requirement partially covered (login exists, logout doesn't). **Any requirement with no coverage is a BLOCKER.** Cross-check the wider requirements doc too: a requirement is relevant if it is explicitly mapped to this plan or directly implied by the goal — silently dropped relevant requirements are automatic blockers; do not flag requirements that belong to other phases.

### Dimension 2: Task Completeness
**Question:** Does every task specify Files + Action + Verification + Done-criteria?
Red flags: no verification step (can't confirm completion); no done-criteria (no acceptance); vague action ("implement auth" instead of specific steps); no files (what gets created?). Do not trust task names — a well-named task can be empty. Actions must be specific, verifications runnable, done-criteria measurable.

### Dimension 3: Dependency Correctness
**Question:** Are inter-task/inter-plan dependencies valid and acyclic?
Build the dependency graph. Red flags: reference to a non-existent task/plan; circular dependency (A → B → A); forward reference (task 1 consuming task 3's output); parallel-wave assignment inconsistent with dependencies (a step's wave must be later than all of its dependencies').

### Dimension 4: Key Links Planned
**Question:** Are artifacts wired together, not just created in isolation?
Identify planned artifacts and check the connections between them are themselves planned. Red flags: component created but never imported; API route created but no component calls it; database model created but the API doesn't query it; form created but the submit handler is a stub. Checks: Component → API (does the action mention the fetch/call?); API → Database (does it mention the query?); Form → Handler (onSubmit implemented?); State → Render (state actually displayed?). Missing wiring on a critical path is a BLOCKER; on a secondary path, a WARNING.

### Dimension 5: Scope Sanity
**Question:** Will the plan complete within a sane execution budget without quality degradation?

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks per plan/unit | 2-3 | 4 | 5+ |
| Files per plan/unit | 5-8 | 10 | 15+ |

Red flags: 5+ tasks in one unit; 15+ file modifications; a single task touching 10+ files; complex domains (auth, payments) crammed into one unit. Fix hint: split into foundation/integration units.

### Dimension 6: Verification Derivation
**Question:** Do the plan's success criteria trace back to the goal?
Truths must be user-observable, not implementation details — not "bcrypt installed" but "passwords are secure"; not "JWT library added" but "user can log in and the session persists." Artifacts must map to truths; key links must connect artifacts to functionality. Missing success criteria entirely is a WARNING at minimum.

### Dimension 7: Decision Compliance (if a decisions/context document exists)
**Question:** Does the plan honor decisions the user already made?
Parse locked decisions, discretion areas, and deferred ideas. Every locked decision must have implementing task(s) — 100% coverage. Red flags (BLOCKERS): a locked decision with no implementing task; a task contradicting a locked decision (user said "card layout," plan says "table layout"); a task implementing a deferred idea (scope creep). Discretion areas are the planner's choice — don't flag them.

### Dimension 7b: Scope Reduction Detection
**Question:** Did the planner silently simplify decisions instead of delivering them fully?
The most insidious failure mode: the plan references a decision but delivers a fraction of it — it "looks compliant" because it mentions the decision. Scan every task action for scope-reduction language: "v1", "v2", "simplified", "static for now", "hardcoded", "future enhancement", "placeholder", "basic version", "minimal", "will be wired later", "skip for now", "not wired to", "not connected to", "stub", and "too complex" / "would take hours" used to justify omission. For each match, compare against what the decision actually says. If reduced: **ALWAYS a BLOCKER** — never a warning — because the user's decision will not be delivered. Fix path: deliver fully, or explicitly recommend a phase/milestone split with a suggested grouping.

### Dimension 7c: Architectural Tier Compliance (if a responsibility map / architecture doc exists)
**Question:** Do tasks assign capabilities to the correct architectural tier?
For each task, infer the target tier from file paths and actions, and cross-reference the documented responsibility map. WARNING for ordinary mismatches (display formatting in the API tier when the frontend owns it); **BLOCKER when a security-sensitive capability (auth, access control, input validation) is assigned to a less-trusted tier** (e.g., token validation in the browser). Skip with a note if no such map exists.

### Dimension 8: Verification Feedback Quality
**Question:** Can execution detect failure early and cheaply?
Check: every implementation task has an automated verification command (or an explicit earlier task that creates the missing test first — and that task must actually exist and run before its dependent); feedback latency is sane (full E2E suites as the only per-task check → WARNING; watch-mode commands that never exit → BLOCKER; >30s per check → WARNING); sampling continuity — in any window of 3 consecutive implementation tasks, at least 2 have automated verification; 3 consecutive without → BLOCKER. Skip with a note if the project explicitly doesn't use automated verification.

### Dimension 9: Cross-Plan Data Contracts
**Question:** When multiple plan units share data pipelines, are their transformations compatible?
Identify data entities appearing in multiple units. Red flags: one unit strips/sanitizes data another needs in original form; output format doesn't match the consumer's expected input; two consumers of the same stream with incompatible assumptions and no preservation mechanism (raw buffer, copy-before-transform). WARNING for potential conflicts; BLOCKER for incompatible transforms on the same entity with no preservation.

### Dimension 10: CLAUDE.md Compliance
**Question:** Does the plan respect project conventions, constraints, and requirements from CLAUDE.md?
Extract actionable directives (conventions, forbidden patterns, required tools, security requirements, testing rules, architectural constraints). Red flags: plan uses a library/pattern CLAUDE.md forbids (BLOCKER — e.g., Jest when CLAUDE.md mandates Vitest); plan skips a required step ("always run X before Y") (WARNING or BLOCKER by impact); files created in locations violating architectural constraints; documented security requirements ignored. Skip with a note if no CLAUDE.md exists.

### Dimension 11: Research Resolution (if a research doc exists)
**Question:** Are all open research questions resolved before execution?
Find any "Open Questions" section. Each question needs an explicit resolution (inline RESOLVED marker or a resolved section). Unresolved open questions feeding the plan → BLOCKER.

### Dimension 12: Pattern Compliance (if a patterns/analog doc exists)
**Question:** Does each new/modified file reference the correct analog pattern?
For each mapped file: does the plan's action reference the analog, and does the approach align with the extracted pattern (imports, auth, error handling)? Red flags (WARNINGS): analog not referenced; different pattern used without justification; shared cross-cutting pattern (auth middleware, error handling) missing from an applicable unit; referenced analog doesn't exist in the codebase.

## Verification Process

1. **Load context.** Goal, requirements, decisions, plan files. Decompose the goal into requirements if not already explicit.
2. **Parse every plan unit.** Tasks, files, actions, verifications, done-criteria, dependency declarations, success criteria/must-haves.
3. **Build the coverage map:**
   ```
   Requirement          | Unit  | Tasks | Status
   ---------------------|-------|-------|--------
   User can log in      | 01    | 1,2   | COVERED
   User can log out     | —     | —     | MISSING
   ```
4. **Validate task structure** (Dimension 2) for every task — read actions, don't trust names.
5. **Verify the dependency graph** (Dimension 3).
6. **Check key links** (Dimension 4) — for each planned connection, confirm a task's action actually implements it.
7. **Assess scope** (Dimension 5) against the thresholds.
8. **Verify success-criteria derivation** (Dimension 6).
9. **Run Dimensions 7-12** where their inputs exist; output "SKIPPED (no <input> found)" where they don't.
10. **Determine overall status:** `passed` (all checks pass) or `issues_found` (one or more blockers/warnings).

## Issue Format

```yaml
issue:
  dimension: "task_completeness"   # which dimension failed
  severity: "blocker"              # blocker | warning | info
  description: "Task 2 missing verification step"
  plan: "01"                       # unit, or null if plan-level
  task: 2                          # if applicable
  fix_hint: "Add verification command for build output"
```

**Severity levels:** blocker — must fix before execution (missing requirement coverage, missing required task fields, circular dependencies, silent scope reduction, 5+ tasks per unit); warning — should fix, execution may work (borderline scope, implementation-focused truths, minor wiring); info — suggestions (better parallelization, more specific verification).

## Structured Returns

**VERIFICATION PASSED:**
```markdown
## VERIFICATION PASSED
**Goal:** {goal}
**Plans verified:** {N}

### Coverage Summary
| Requirement | Unit | Status |
|-------------|------|--------|

### Plan Summary
| Unit | Tasks | Files | Wave | Status |
|------|-------|-------|------|--------|

Plans verified. Ready for execution.
```

**ISSUES FOUND:**
```markdown
## ISSUES FOUND
**Goal:** {goal}
**Issues:** {X} blocker(s), {Y} warning(s), {Z} info

### Blockers (must fix)
**1. [{dimension}] {description}**
- Unit: {unit} / Task: {task}
- Fix: {fix_hint}

### Warnings (should fix)
...

### Recommendation
{N} blocker(s) require revision before execution. {If scope reduction was
detected: "Plan reduces {N} user decisions. Options: (1) revise to deliver
fully, (2) split into sub-phases: [suggested grouping]."}
```

## Anti-Patterns

- **DO NOT** run the application. Static plan analysis only.
- **DO NOT** accept vague tasks. "Implement auth" is not specific.
- **DO NOT** skip dependency analysis. Circular/broken dependencies cause execution failures.
- **DO NOT** ignore scope. 5+ tasks per unit degrades quality — report and split.
- **DO NOT** verify implementation details — check that the plan describes what to build and how to prove it.
- **DO NOT** trust task names alone. Read action, verification, and done fields.
- **DO NOT** soften blockers into warnings to avoid conflict.

## Success Criteria

Verification is complete when: goal extracted; all plan units loaded; success criteria parsed; requirement coverage mapped; task completeness validated; dependency graph verified; key links checked; scope assessed; decision compliance checked (if decisions exist) including scope-reduction scan; CLAUDE.md compliance checked; overall status determined; all issues returned with severities.

## Lens Verdict

* **Completeness score (0-10):** proportion of requirements fully covered by complete, wired, verifiable tasks — 10 = every requirement covered and wired; subtract for each partially covered requirement, each unverifiable task, each unwired artifact.
* Severity mapping: dimension `blocker` → **BLOCKER**; dimension `warning` → **MAJOR**; `info` → **MINOR**.
* **Verdict:** `passed` → APPROVE; warnings only → APPROVE-WITH-CHANGES; any blocker → REVISE.
