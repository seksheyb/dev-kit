---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. The canonical plan-authoring methodology and PLAN.md task format — invoked directly for interactive/standalone planning, and by the `planner` agent for pipeline-dispatched planning.
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, what to build, how to verify it, docs they might need to check. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

This skill is the **single source of truth for how a plan is authored and what a `PLAN.md` task looks like.** It is used two ways:

- **Standalone / interactive** — you invoke it directly to write one plan for a feature or task.
- **Pipeline-dispatched** — the `planner` agent invokes this skill's methodology and task format to author each plan it produces, then adds the pipeline-specific wrapping (multi-plan wave/track decomposition, frontmatter, file naming, git). When the `planner` drives, it supplies the paths and frontmatter; this skill supplies the authoring discipline and the `<task>` format below. Both paths produce the same task format, so both flow through `gate-plan-review` and `sprint-execution` unchanged.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `using-git-worktrees` skill at execution time.

## Where the plan is written

- **Standalone:** `docs/plans/YYYY-MM-DD-<feature-name>.md` (user preferences for plan location override this default).
- **Pipeline:** the `planner` agent supplies the path — `.planning/phases/<phase>/<padded_phase>-<NN>-PLAN.md` — and the plan-set frontmatter. Follow what the agent passes; do not invent a competing path or filename.

Either way the plan is executed by the **`sprint-execution`** skill (see Execution Handoff).

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own. (In the pipeline, the `planner` agent owns this split across multiple `PLAN.md` files and waves; standalone, you make the call.)

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer — task order should follow vertical slices, not horizontal layers (see `@references/vertical-slice.md`).
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable. Target **2–3 tasks per plan**; more than
that is a signal to split the plan.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sprint-execution to implement this plan task-by-task — one canonical flow covers both parallel multi-track dispatch and simple sequential execution (a sequential plan is just a sprint where every wave has one track).

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section. If the spec uses US-xxx IDs (Theme→Pillar→US-xxx
hierarchy), reference them the same way you'd reference REQ-IDs elsewhere
in the plan.]

---
```

In the pipeline, the `planner` agent additionally emits YAML frontmatter (`phase`, `plan`,
`wave`, `depends_on`, `files_modified`, `requirements`, `must_haves`, `autonomous`) and a
`## Parallel Execution Map` above/around this header — those are the plan-set wiring the agent
owns. The header and task format below are the same regardless.

## Task Format (canonical)

Each task is a `<task>` block. This is the format `sprint-execution` executes and
`gate-plan-review` scores — emit it whether authoring standalone or via the planner.

````markdown
<task type="auto">
  <name>Task N: [Action-oriented name]</name>
  <files>
    - Create: `exact/path/to/file.py`
    - Modify: `exact/path/to/existing.py:123-145`
    - Test: `tests/exact/path/to/test.py`
  </files>
  <interfaces>
    Consumes: [what this task uses from earlier tasks — exact signatures]
    Produces: [what later tasks rely on — exact names, parameter and return
    types. A task's implementer sees only their own task; this is how they
    learn the names and types neighboring tasks use.]
  </interfaces>
  <action>[Specific implementation instructions, including what to avoid and WHY.
  Directive prose — name the identifiers, signatures, config keys, imports, env
  vars, and behavior. Do NOT paste fenced code blocks here; code excerpts belong
  in referenced source files or an <interfaces> block.]</action>
  <verify>[How to prove the task is complete — a specific command that runs in
  under ~60s, with expected output. Every implementation task has an automated
  check. If no test exists yet, the first step is to create it.]</verify>
  <done>[Acceptance criteria — the measurable state of completion.]</done>
  <complexity_signals>files: [complete list, including files this task CREATES]; novelty: none|low|high; logic: low|medium|high; ambiguity: low|medium|high; tests: none|existing|new</complexity_signals>
</task>
````

- **`<complexity_signals>` is mandatory on every task** (canonical vocabulary: `@references/complexity-signals.md`). Emit them honestly from the task's actual work — `gate-plan-review` and `sprint-execution` read them to validate or select model/effort. Never derive a model/effort first and back-fill signals to match.
- **TDD is the default execution contract.** The plan declares the behavior and the verify command; the executor writes the failing test first, watches it fail, implements, watches it pass, commits (per the `test-driven-development` skill, which `sprint-execution` invokes). For a code-producing task, make the expected behavior explicit in `<action>`/`<verify>` so the test can be written before the implementation.
- **Grep-gate hygiene:** `grep -c` counts comment lines too. Use `grep -v '^#' | grep -c token`; a bare `== 0` gate on an unfiltered file is forbidden.

## Goal-Backward Must-Haves

Derive what must be TRUE for the goal to be achieved, not just what to build. For the plan's `must_haves` (frontmatter in the pipeline; a `## Must-Haves` block standalone), list:

- **truths** — 3–7 observable, user-verifiable behaviors ("user can send a message", not "bcrypt installed").
- **artifacts** — the specific files that must exist for those truths, with what each provides.
- **key_links** — the critical connections between artifacts (component → API, API → DB), where breakage cascades.

These are what `plan-review-goal-backward` and `verifier` check against — a plan whose artifacts are all created but never wired together does not achieve its goal.

## No Placeholders

Every task must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases" (name the specific errors and cases)
- "Write tests for the above" (without naming what they assert)
- "Similar to Task N" (state it explicitly — the engineer may read tasks out of order)
- Actions that describe what to do without the specifics (which function, which signature, which value)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Exact commands with expected output in `<verify>`
- Name every identifier, signature, and value — no vague directives
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps. Every requirement ID must appear in at least one plan.

**2. Placeholder scan:** Search your plan for the red flags in the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names in later tasks match what earlier tasks defined? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Signal honesty:** Does each task's `<complexity_signals>` reflect its actual work (files complete including creates; novelty/logic/ambiguity/tests plausible)? Under-declared signals game the gate.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer the execution choice:

**"Plan complete and saved to `<path>`. Two execution options:**

**1. Parallel (recommended for multi-track plans)** - dispatch a fresh subagent per track per wave, each in an isolated worktree, with review gates between waves

**2. Sequential** - one subagent per task in turn (a sprint where every wave has a single track), with checkpoints between tasks

**Which approach?"**

Either way, **REQUIRED SUB-SKILL:** Use `sprint-execution` — one canonical flow covers both parallel multi-track dispatch and simple sequential task-by-task execution, with two-stage review (per-wave and final whole-branch) either way. (In the pipeline, `sprint-execution` is invoked on the `planner`-produced `PLAN.md` set directly.)
