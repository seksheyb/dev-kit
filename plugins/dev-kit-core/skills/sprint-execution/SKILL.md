---
name: sprint-execution
description: Use when executing a written sprint/implementation plan with multiple tasks or parallel tracks. Covers wave-based dispatch of subagents in isolated git worktrees, TDD-first task execution, per-task briefs and reviews, orchestrator merge and post-wave bookkeeping, and durable progress tracking. Trigger when asked to "execute the plan", "run the sprint", "dispatch the waves", or when a plan file with a parallel execution map exists.
---

# Sprint Execution

Execute a written plan by dispatching subagents — one per track — in parallel waves, each in an isolated git worktree, with the orchestrator owning merges, state, and gates. One canonical flow covers both parallel multi-track sprints and simple sequential task lists (a sequential plan is just a sprint where every wave has one track).

**No plan file yet, just a handful of independent tasks?** This skill's worktree/wave/gate ceremony is overkill for that — use `dispatching-parallel-agents` instead for lightweight, no-ceremony parallel dispatch.

## Conventions (canonical paths from `references/doc-sitemap.md`)

These are the canonical doc paths every dev-kit asset shares. A project may override them in its plan header or config (CLAUDE.md); absent an override, use these. Throughout, `PHASE/` = `docs/milestones/<M>/phases/<NN>-<slug>/`.

| Convention | Canonical path | Purpose |
|---|---|---|
| Plan file | `PHASE/<NN>-<MM>-PLAN.md` | Tasks, tracks, waves, Parallel Execution Map |
| State file | `docs/state/STATE.md` | Which tasks/waves are executed — orchestrator-owned |
| Roadmap file | `docs/milestones/<M>/ROADMAP.md` | Milestone-level progress — orchestrator-owned |
| Progress ledger | `docs/state/sprint/progress.md` | Compaction-proof recovery map (pipeline-internal scratch) |
| Track summary | `PHASE/<NN>-<MM>-SUMMARY.md`, committed inside each track's worktree | Subagent handover record |
| Metrics/telemetry command | none (optional) | Post-wave recording, if the project has one |
| Integration branch | `main` (or the sprint's working branch) | Where track worktrees merge |

Never hardcode a different project's paths. Read the plan header first; it wins.

## 1 — Load and Review the Plan (before any dispatch)

1. Read the plan file fully. Note context, global constraints, tracks, waves, and dependencies. Requirement IDs referenced may be REQ-form or `US-xxx` (Theme→Pillar→US-xxx hierarchy) — treat either as valid.
2. **Review critically.** Scan once for conflicts: tasks that contradict each other or the global constraints, and anything the plan mandates that a reviewer would flag as a defect. Present all findings to the user as ONE batched question — each finding beside the plan text that mandates it, asking which governs — before execution begins, not one interrupt per discovery mid-plan. If the scan is clean, proceed without comment.
3. Create todos for all tasks. Check the progress ledger: tasks already marked complete are DONE — do not re-dispatch them; resume at the first incomplete task.
4. Verify you are NOT on the default branch without explicit user consent; create/verify the sprint working branch or worktree — use `using-git-worktrees` for this (it detects existing isolation first, so it's a no-op if the orchestrator itself is already running inside one).

## 2 — Orchestrator Posture

- The orchestrator holds the full plan, spec, all subagent handover summaries, conflict reports, and wave state. Keep its context thin: bulk artifacts move as **files**, never pasted text.
- Use the most capable available model/effort for the orchestrator — cross-track dependency reasoning, conflict arbitration, and wave gating are where bad calls cascade into every downstream subagent. The plan's Parallel Execution Map header states the orchestrator model and per-track models; honor it.
- **Continuous execution.** Do not pause to check in between tasks. The only reasons to stop: a BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, a plan gap, or all tasks complete. Don't force through blockers — stop and ask rather than guess.

## 3 — Dispatch Parallel Subagents (per wave)

- Dispatch **one subagent per track** within a wave, each with worktree isolation (`isolation="worktree"`) so tracks run in parallel git worktrees without colliding on the shared working tree.
- **Dispatch each Agent call in its own message with `run_in_background: true` — do NOT batch multiple Agent invocations into a single message.** Simultaneous worktree creation races on `.git/config.lock`; one-at-a-time dispatch avoids the race while the agents still run concurrently once their worktrees exist.
- **MANDATORY worktree base-sync — every track-subagent's FIRST step is `git reset --hard <integration-branch>`.** The harness captures each worktree's base commit at process launch, not dispatch time, so a worktree created later in the session is pinned to a stale HEAD and cannot see plans or prior-wave merges committed after launch. Open every track prompt with: *"FIRST, before anything else, run `git reset --hard <integration-branch>` in your worktree, then verify your plan/brief file is present."* A fresh worktree branch has no commits, so the reset is non-destructive. This lets every wave run fully parallel in ONE session with zero process restarts.
- Set the `model` parameter (and effort, when supported) per the plan's Parallel Execution Map. Omit `model` only when the map says `inherit`.
- **Model selection.** A plan's declared `complexity_signals` / `Model`/`Effort` columns (canonical vocabulary: `@references/complexity-signals.md`) are authoritative — honor them. **When the plan doesn't declare signals**, fall back to this heuristic: use the least powerful model that can handle the role. Mechanical 1-2 file tasks with complete specs → cheapest tier. Multi-file integration → standard tier. Architecture/judgment and the final whole-branch review → most capable tier. Turn count beats token price: the cheapest models take 2-3× the turns on multi-step work, so use a mid-tier floor for reviewers and prose-spec implementers.
- Track subagents **must NOT modify the state file, roadmap file, or calibration/metrics files** — the orchestrator owns those writes (§6). Each subagent commits its tasks atomically and **writes + commits a track `SUMMARY.md` before returning** (the worktree is force-removed on return; uncommitted work is lost).
- Each subagent's prompt opens with an explicit self-definition block:

  ```
  You are the <track-name> subagent for this sprint.
  Model: <model-id>
  Effort level: <low|medium|high|max>
  Skill: <skill-id or "none">
  ```

- **Skill injection:** if a track has an assigned domain skill, the subagent loads it **itself** — the orchestrator never invokes the Skill tool for it (that would pull the skill's full instructions into the orchestrator's context, which must stay thin). Immediately after the self-definition block, the prompt instructs: *"First action: invoke the Skill tool with skill: `<skill-id>` and follow its guidance for all work in this track."*
- **TDD-first is the default task contract.** Every implementation task: write the failing test, watch it fail, implement, watch it pass, commit. Subagents follow the test-driven-development skill; the dispatch prompt says so explicitly.
- Each subagent receives: its track's tasks (as a brief file, see §4), the plan file path, the spec file path, the `<track-name>` (a logical label — not a git branch it creates), and the skill-invocation instruction.
- The orchestrator **must not start Wave N+1** until all Wave N subagents have returned and their worktrees are merged (§6).

## 4 — Per-Task Dispatch Discipline (file handoffs)

Everything pasted into a dispatch prompt — and everything a subagent prints back — stays resident in orchestrator context forever. Hand artifacts over as files:

- **Task brief:** extract the track's full task text from the plan into a uniquely named brief file (`docs/state/sprint/task-N-brief.md`) and pass the path. The dispatch prompt contains only: (1) one line on where this track fits the project; (2) the brief path, introduced as "read this first — it is your requirements, with the exact values to use verbatim"; (3) interfaces and decisions from earlier waves the brief cannot know; (4) your resolution of any ambiguity you noticed; (5) the report-file path and report contract. Exact values (numbers, magic strings, signatures, test cases) live only in the brief.
- **Report file:** name it after the brief (`docs/state/sprint/task-N-brief.md` → `docs/state/sprint/task-N-report.md`). The subagent writes the full report there and returns only status, commits, a one-line test summary, and concerns.
- **Never make a subagent read the whole plan file** when a brief will do, and never paste accumulated prior-wave history into later dispatches — a fresh subagent needs its task, the interfaces it touches, and the global constraints. Nothing else.
- **Do not pre-judge findings for reviewers.** Never instruct a reviewer to ignore an issue or cap a severity. Copy binding requirements verbatim from the plan's global constraints as the reviewer's attention lens.

## 5 — Subagent Close Handover

Every track subagent ends with:

```
Track: <name>
Tasks completed: T1, T2, ...
Commits: <sha …>   (in the worktree branch)
SUMMARY.md: committed
Tests: <suite result one-liner>
Conflicts handed off: <file> — <description> | none
Notes for orchestrator: <anything outside this track's context>
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
```

Subagents do **not** self-merge. Conflicts outside a track's context are reported with affected files + description, not resolved unilaterally.

**Handling statuses:**
- **DONE** → proceed to merge/review.
- **DONE_WITH_CONCERNS** → read the concerns first. Correctness/scope concerns get addressed before merge; observations get noted in the ledger.
- **NEEDS_CONTEXT** → provide the missing context and re-dispatch.
- **BLOCKED** → assess: context problem → re-dispatch with more context; reasoning ceiling → re-dispatch on a more capable model; task too large → split it; plan wrong → escalate to the user. Never force the same model to retry unchanged.

## 6 — Orchestrator Post-Wave Bookkeeping

After each wave's subagents return, and before Wave N+1:

1. **Merge** every Wave-N track worktree into the integration branch; resolve handed-off conflicts centrally. Idempotent on re-run after a crash: a branch already merged (`git branch --merged`) is skipped.
2. **Update state:** mark the wave's tasks executed in the state file and roadmap file (idempotent mark-done operations). The orchestrator owns these writes exclusively.
3. **Record metrics/telemetry** if the project defines a command for it (re-runnable; overwrites the snapshot).
4. **Ledger:** append one line per completed task to the progress ledger: `Task N: complete (commits <base7>..<head7>, review clean)`. Conversation memory does not survive compaction — controllers that lost their place have re-dispatched entire completed sequences, the single most expensive failure observed. After compaction, trust the ledger and `git log` over your own recollection.
5. **Optionally dispatch a verification subagent** for wave/phase-completion checks before advancing.
6. Only then start Wave N+1.

## 7 — Review Gates

- **Per-track/per-wave review:** after merging, generate a review package (commit list + diff stat + full diff written to one file) and dispatch a reviewer subagent with the file path — never ask a reviewer to re-derive the diff, and never use `HEAD~1` as base (it silently drops all but the last commit); use the base commit recorded before dispatch.
- **Fix loop:** dispatch fix subagents for Critical/Important findings; each fix dispatch names the covering test files and carries the contract to re-run them and report results. Re-review after fixes. Record Minor findings in the ledger for final-review triage. Don't move on with open Critical/Important issues.
- **Final whole-branch review:** after all waves, run one broad review over `merge-base..HEAD` on the most capable model. If it returns findings, dispatch ONE fix subagent with the complete findings list — not one fixer per finding (per-finding fixers each rebuild context and re-run suites, costing more than all the tasks combined).
- **"Cannot verify from diff" items:** a reviewer may report requirements it can't confirm from the diff alone — things that live in unchanged code or span multiple tracks/waves. These don't block the rest of the review, but resolve each one yourself before marking the review clean: you hold the plan and cross-track context the reviewer lacks. If you confirm one is a real gap, treat it as a failed review finding — dispatch the fix and re-review.
- If the project defines additional gates (plan review before Wave 1, adversarial review rounds after merges via `code-review-gate` in round mode, automation gates before tagging), run them in the plan's stated order at wave boundaries only — never mid-review. Review engines are selected per `@references/independent-review.md`, not hardcoded to one provider.
- If a gate produces a calibration or process-change proposal, **surface it to the user at the next checkpoint** — it's a genuine decision point. Apply on approval; archive if declined.
- **After the final whole-branch review comes back clean**, the sprint's implementation work is done — invoke the finishing-a-development-branch skill to verify tests one last time and present the merge/PR/keep/discard decision. Don't decide that disposition yourself; it's the skill's call to make with the user.

## Red Flags

**Never:**
- Start execution on the default branch without explicit user consent
- Batch multiple worktree-creating Agent calls in one message
- Skip the `git reset --hard <integration-branch>` first step in a track prompt
- Let a track subagent write the state/roadmap files or self-merge
- Start Wave N+1 with unmerged Wave-N worktrees
- Re-dispatch a task the ledger already marks complete
- Paste session history into dispatch prompts, or make subagents read the whole plan
- Skip verifications the plan specifies, or accept "close enough" on spec compliance
- Proceed past a BLOCKED status without changing something (context, model, task size, or plan)
- Merge, PR, or discard the sprint branch yourself after the final review — hand off to finishing-a-development-branch instead
