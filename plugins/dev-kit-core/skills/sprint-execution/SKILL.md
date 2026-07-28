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
| Integration branch | `main` (or the sprint's working branch) | The **source branch**: what every track branch is cut from, and what the orchestrator merges them back into |
| Track branch | `sprint/w<N>-<track-name>` | One per track, created by the track, merged and deleted by the orchestrator |

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

## 3 — Dispatch a Wave

**Branch model.** This skill is **orchestrator-merged and one-wave-per-run**. `bugfix-wave` deliberately differs (it is self-merging and runs all waves in one Workflow, because it writes no state file, roadmap or ledger and is built to run unattended inside a larger review loop). Do not port one skill's branch model onto the other.

- The **integration branch** is the source branch — always named explicitly in args, never
  hardcoded.
- Every track gets **its own worktree and its own branch cut from the integration branch**.
- A track **commits, writes and commits its SUMMARY and report, and returns. It does not
  merge, does not rebase onto the integration branch, and does not delete its branch.** A
  track that rebases can pull in another track's in-flight work and then fail tests for
  reasons unrelated to its own tasks.
- **The orchestrator merges** every returned branch, resolves conflicts, verifies the merge
  mechanically, then deletes branches and removes worktrees (§6).
- **One wave per Workflow run.** Wave N+1 is dispatched only after the integration branch
  contains all of Wave N's merged work, so the next wave's worktrees inherit it.

Self-merge is not merely discouraged, it is mostly impossible: git allows one checkout per
branch, so a track in a worktree cannot merge into an integration branch the orchestrator
holds.

**Route by track count. This is not a preference and not an opt-in.**

| Tracks in the wave | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/sprint-execution.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for a single agent is pure overhead |

Invoking this skill on a plan that carries a Parallel Execution Map **is** the request for wave dispatch. The user does not have to say "workflow" for the Workflow route to apply. A sequential plan is just a sprint where every wave has one track, so it stays on the inline route throughout.

### 3a — Workflow route (≥2 tracks in the wave)

Do §1 (load + review the plan) and §2 (posture) first, and author every track's brief file per §4. All judgment happens there. The script has none: it takes pre-decided waves, tracks, models, efforts, skill-ids and file paths and dispatches them.

```
Workflow({
  // absolute path to the script shipped with this plugin, under the same
  // references/ root as this skill's other @references citations
  scriptPath: "<dev-kit-core plugin root>/references/workflows/sprint-execution.workflow.mjs",
  args: {
    integrationBranch: "main",              // required — source branch; tracks cut from it
    planPath: "PHASE/<NN>-<MM>-PLAN.md",    // required — path only, never pasted text
    specPath: "...",                        // optional
    sprintLabel: "...",                     // optional, log label only
    stagger: false,                         // optional — see the provisioning caveat below
    wave: 1,                                // optional — label/log only, defaults to 1
    tracks: [{
      name: "track-api",                    // required — logical label used in logs
      branch: "sprint/w1-track-api",        // required — the branch this track commits to
      briefPath: "docs/state/sprint/task-1-brief.md",   // required
      reportPath: "docs/state/sprint/task-1-report.md", // required
      model: "opus", effort: "high",        // omit model when the map says `inherit`
      skillId: "...",                       // optional — the SUBAGENT loads it itself
      contextLine: "...", priorInterfaces: "...", ambiguityNotes: ""  // optional
    }]
  }
})
```

The call returns a runId immediately and runs in the background; you are notified on completion. Per-track detail lands in each track's report file; the run logs one line per track with its close-handover status.

**ONE wave per run — there is no `waves[]` array, and passing one throws.** The script's `parallel()` barrier guarantees a wave's tracks have *returned*, not that they are *merged* — merge is orchestrator-owned (§6) and cannot happen inside the script. Since every track cuts its branch from `integrationBranch`, a later wave in the same run would branch off a commit that does not yet contain the earlier wave's work. Wave N+1 is a separate invocation, made only after §6 has merged and verified Wave N.

The return value is `{ integrationBranch, wave, merged, dispatched, handovers, branches, tracksNeedingRedispatch, tracksNeedingAction, conflicts }`. `branches` is the §6 merge worklist and includes tracks that died — their branches can still hold real commits. `merged` is always `false`.

**What stays in your turn, not the script's:** §6 post-wave bookkeeping in full (merge every track branch, resolve handed-off conflicts, verify the merge, remove worktrees, delete branches, mark state file + roadmap, record metrics, append the ledger) and §7 review gates. The script has no filesystem or git access, cannot write durable state, and cannot interpret a BLOCKED status; gates that need a user checkpoint cannot run inside a Workflow either — there is no live Q&A mid-run.

**Worktree provisioning caveat — unresolved, state it as such.** `parallel()` with `isolation:'worktree'` creates worktrees concurrently, which is the shape the inline route forbids (below). The workflow runtime provisions worktrees itself rather than you hand-issuing Agent calls, so the `.git/config.lock` race *may* not apply identically — that is a hypothesis, not a measurement, and nothing has verified it. **If a wave fails with worktree-creation or lock errors:** re-run that wave with `stagger: true`, which awaits the first track alone before parallelising the rest. That mitigation is **partial** — the remaining tracks still provision concurrently with each other — and it costs real wall-clock, because the first track runs to completion before any other starts (a 2-track wave becomes fully sequential). No cheaper stagger exists: the script cannot sleep. If `stagger: true` also fails, fall back to the inline route for that wave and report the failure.

### 3b — Inline route (exactly 1 track in the wave)

- Dispatch the track with `isolation="worktree"` so it doesn't collide with the shared working tree.
- **Dispatch each Agent call in its own message with `run_in_background: true` — do NOT batch multiple Agent invocations into a single message.** Simultaneous worktree creation races on `.git/config.lock`; one-at-a-time dispatch avoids the race while the agents still run concurrently once their worktrees exist. This rule governs **hand-dispatched** Agent calls; ≥2 tracks are not hand-dispatched at all under 3a.

### 3c — Holds on both routes

- **MANDATORY worktree base-sync — every track-subagent's FIRST step is `git reset --hard <integration-branch>`, then `git checkout -b <track-branch>`.** The harness captures each worktree's base commit at process launch, not dispatch time, so a worktree created later in the session is pinned to a stale HEAD and cannot see plans or prior-wave merges committed after launch. Every track prompt opens with: *"FIRST, before anything else, run `git reset --hard <integration-branch>` in your worktree, then `git checkout -b <track-branch>`, then verify your brief file is present."* A fresh worktree branch has no commits, so the reset is non-destructive. Cutting the branch *after* the reset is what makes "branched from the integration branch" true in fact rather than just in intent. This lets every wave run fully parallel in ONE session with zero process restarts. The Workflow script builds this opener from `integrationBranch` and `track.branch` — do not drop either arg.
- **Record the integration branch's HEAD sha before dispatching the wave**, and put it in the ledger with the `runId`. §6.2c and §7 both use it as the base for `git log <base-commit>..<branch>`; once the wave is merged, `<integration-branch>..<branch>` is empty by construction and no longer tells you what a track actually produced.
- Set the `model` parameter (and effort, when supported) per the plan's Parallel Execution Map. Omit `model` only when the map says `inherit`.
- **Model selection.** A plan's declared `complexity_signals` / `Model`/`Effort` columns (canonical vocabulary: `@references/complexity-signals.md`) are authoritative — honor them. **When the plan doesn't declare signals**, fall back to this heuristic: use the least powerful model that can handle the role. Mechanical 1-2 file tasks with complete specs → cheapest tier. Multi-file integration → standard tier. Architecture/judgment and the final whole-branch review → most capable tier. Turn count beats token price: the cheapest models take 2-3× the turns on multi-step work, so use a mid-tier floor for reviewers and prose-spec implementers.
- Track subagents **must NOT modify the state file, roadmap file, or calibration/metrics files** — the orchestrator owns those writes (§6). Each subagent commits its tasks atomically and **writes + commits a track `SUMMARY.md` before returning** (the worktree is force-removed on return; uncommitted work is lost).
- Track subagents **must NOT merge, rebase onto the integration branch, or delete their branch.** Commit, report, return — the orchestrator needs the branch intact to merge it (§6), and a mid-flight rebase drags another track's unreviewed work into this one's test run.
- Each subagent's prompt opens with an explicit self-definition block:

  ```
  You are the <track-name> subagent for this sprint.
  Model: <model-id>
  Effort level: <low|medium|high|max>
  Skill: <skill-id or "none">
  ```

- **Skill injection:** if a track has an assigned domain skill, the subagent loads it **itself** — the orchestrator never invokes the Skill tool for it (that would pull the skill's full instructions into the orchestrator's context, which must stay thin). Immediately after the self-definition block, the prompt instructs: *"First action: invoke the Skill tool with skill: `<skill-id>` and follow its guidance for all work in this track."*
- **TDD-first is the default task contract.** Every implementation task: write the failing test, watch it fail, implement, watch it pass, commit. Subagents follow the test-driven-development skill; the dispatch prompt says so explicitly.
- Each subagent receives: its track's tasks (as a brief file, see §4), the plan file path, the spec file path, the `<track-name>` (a logical label used in prompts, summaries and the execution map), the `<track-branch>` it creates and commits to, and the skill-invocation instruction.
- The orchestrator **must not start Wave N+1** until all Wave N subagents have returned and their worktrees are merged (§6). A Workflow run returning is only the first half of that gate.

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
Branch: <branch>
Merged: no
Tasks completed: T1, T2, ...
Commits: <sha …>   (on the track branch)
SUMMARY.md: committed
Tests: <suite result one-liner>
Conflicts handed off: <file> — <description> | none
Notes for orchestrator: <anything outside this track's context>
Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
```

On the Workflow route this block comes back as validated JSON — the script's schema carries the same ten fields with the same `status` enum, one object per track. On the inline route it comes back as the text block above. Handle both identically.

`Branch` is the orchestrator's authoritative merge target. `Merged` is always `no` — the field exists so a future variant that does let tracks merge cannot silently reuse this shape with the opposite meaning. A handover claiming `Merged: yes` means the track violated its prompt: inspect both that branch and the integration branch before trusting either.

`Tests` and `Status` are self-reports on exactly the same footing as `Merged`, and carry exactly the same weight: none, until checked. §6.2 gives the mechanical check for each of the three. Read a whole handover as the track's account of what it believes it did — invaluable for deciding *where to look*, never sufficient as evidence that it happened.

Subagents do **not** self-merge. Conflicts outside a track's context are reported with affected files + description, not resolved unilaterally.

**Handling statuses:**
- **DONE** → proceed to merge/review. The claim is still reconciled at §6.2c like every other field; a `DONE` you have not verified is a plan for where to look, not a completed track.
- **DONE_WITH_CONCERNS** → read the concerns first. Correctness/scope concerns get addressed before merge; observations get noted in the ledger.
- **NEEDS_CONTEXT** → provide the missing context and re-dispatch.
- **BLOCKED** → assess: context problem → re-dispatch with more context; reasoning ceiling → re-dispatch on a more capable model; task too large → split it; plan wrong → escalate to the user. Never force the same model to retry unchanged.

## 6 — Orchestrator Post-Wave Bookkeeping

After each wave's subagents return, and before Wave N+1. Park on the integration branch in the **main working tree only** — never check it out in a worktree a track also needs.

0. **Re-dispatch dead tracks first.** Every entry in `tracksNeedingRedispatch` returned no handover. **A track that returned no handover is not a completed track** — a missing handover is never an empty one. Re-dispatch it before merging the wave; merging a wave with a track missing ships partial work under a "wave complete" label.
1. **Merge** every branch in the returned `branches` list into the integration branch; resolve handed-off conflicts centrally. Idempotent on re-run after a crash: a branch already merged (`git branch --merged`) is skipped. Conflict arbitration is yours because you hold the plan, the spec, and the cross-track context no single track has — if two tracks made genuinely contradictory design choices, that is a plan defect, so surface it to the user rather than picking a side.
2. **Verify the handover mechanically — all three claimed fields, not just one.** `Merged`, `Tests` and `Status` are self-reports by the same subagent about its own work. A self-report is a claim, not evidence. Each gets its own check, and all three pass before you clean up or advance.

   **a. `Merged:`** — `git log <integration-branch>..<branch> --oneline` must come back **empty** for every branch. If any branch still carries commits, stop — do not clean up and do not advance. An unmerged branch left behind means Wave N+1 builds on incomplete work, which is the failure this whole design exists to prevent.

   **b. `Tests:`** — do not read the one-liner and move on. Re-run the project's test command yourself, on the integration branch, **after** the merge, and compare the result against what the handover claimed. Post-merge is the run that matters regardless: each track's suite passed against its own branch, and green-on-branch plus green-on-branch does not imply green-after-merge. A `Tests:` line that disagrees with your run is a finding — handle it exactly like a failed review finding (§7) and do not advance the wave.

     **When the project has no test command, say so — do not invent a check.** dev-kit itself is such a repo: no test suite, no CI, no `package.json`; a skill "passes" only when a human or a reviewer reads it. In that case record `Tests: n/a — no suite in this project` in the ledger and substitute the mechanical check the project *does* have, in this order: the check the plan names; any run-by-hand guard script the sprint touched (`scripts/checks/*.sh`); a lint/format/schema-validation run. If there is genuinely none, dispatch the §7 review gate and treat its verdict as the wave's evidence. An absent check is recorded as absent — never as passed, and never left to the subagent's word.

   **c. `Status:`** — reconcile the claim against what the wave actually produced. Per track: `git log <base-commit>..<branch> --oneline` (the base you recorded before dispatch per §3c, and which §7 also uses — after the merge the `<integration-branch>..<branch>` range is empty by construction and tells you nothing) must show commits covering every task in that track's brief; its `SUMMARY.md` must be committed on the branch; its report file must exist at the `reportPath` you passed. A `DONE` whose commits do not cover the brief's tasks is not DONE — downgrade it yourself and handle it per §5's status table on **your** classification, not the subagent's. Conversely, a `BLOCKED` or `DONE_WITH_CONCERNS` whose commits cover everything is still not DONE until you have read the stated concern and resolved it. The status you write to the ledger (step 6) is the one you verified, never the one you were handed.
3. **Clean up:** `git worktree remove` every wave worktree (`git worktree unlock` first if needed), delete the merged branches, and confirm none remain (`git worktree list`). Only after step 2 passed.
4. **Update state:** mark the wave's tasks executed in the state file and roadmap file (idempotent mark-done operations). The orchestrator owns these writes exclusively.
5. **Record metrics/telemetry** if the project defines a command for it (re-runnable; overwrites the snapshot).
6. **Ledger:** append one line per completed task to the progress ledger: `Task N: complete (commits <base7>..<head7>, review clean, minor: <finding — one line — or "none">)`. The `minor:` slot is where §7's Minor findings land — a Minor finding that isn't Critical/Important enough to gate the fix loop still needs a place to land for final-review triage; never drop it because the wave otherwise reads "clean." Include the Workflow `runId` for the wave, so a post-compaction session can resume the run rather than re-dispatch it. Conversation memory does not survive compaction — controllers that lost their place have re-dispatched entire completed sequences, the single most expensive failure observed. After compaction, trust the ledger and `git log` over your own recollection.
7. **Optionally dispatch a verification subagent** for wave/phase-completion checks before advancing.
8. Only then start Wave N+1, as a **new Workflow run**.

**If the Workflow dies mid-wave**, worktrees and branches survive it — the script never had the access to clean them up. Run this bookkeeping pass over whatever `git worktree list` and `git branch` actually show, then either re-dispatch the wave or resume with `resumeFromRunId`, which replays completed tracks from cache. Do not resume after you have already merged and deleted the first attempt's branches; re-dispatch instead.

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
- Hand-dispatch a wave of 2+ tracks as Agent calls — that wave goes through the Workflow script (§3a), always
- Batch multiple worktree-creating Agent calls in one message **on the inline route** (§3b) — the rule governs hand-dispatch
- Pass more than one wave to the Workflow script — one wave per run, always (§3a)
- Let the Workflow script write the state file, roadmap, ledger, or metrics — it dispatches, you record (§6)
- Treat a Workflow wave's return as "merged" — the barrier means returned; merging is still yours
- Claim the `.git/config.lock` race is solved on the Workflow route — it is untested there (§3a)
- Skip the `git reset --hard <integration-branch>` + `git checkout -b <track-branch>` first step in a track prompt
- Let a track subagent write the state/roadmap files, self-merge, rebase onto the integration branch, or delete its branch
- Accept a track's `Merged` field as proof it merged — verify with `git log <integration-branch>..<branch>` (§6.2a)
- Accept a track's `Tests` field as proof the suite passed — re-run the test command yourself post-merge, or record `n/a` with the substitute check when the project has no suite. Never report an absent check as a passing one (§6.2b)
- Accept a track's `Status` field as proof the track is done — reconcile it against its commits, its committed `SUMMARY.md`, its report file, and the ledger (§6.2c)
- Treat a track that returned no handover as an empty one — it needs a re-dispatch (§6.0)
- Start Wave N+1 with unmerged Wave-N branches, or before §6.2 verification passes
- Re-dispatch a task the ledger already marks complete
- Paste session history into dispatch prompts, or make subagents read the whole plan
- Skip verifications the plan specifies, or accept "close enough" on spec compliance
- Proceed past a BLOCKED status without changing something (context, model, task size, or plan)
- Merge, PR, or discard the sprint branch yourself after the final review — hand off to finishing-a-development-branch instead
