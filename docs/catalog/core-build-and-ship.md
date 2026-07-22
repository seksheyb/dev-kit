# dev-kit-core Catalog: Build & Ship

## Role: Engineer (Build & Debug)

#### `systematic-debugging` (skill)

- **Why needed:** Left unchecked, agents (and people) patch symptoms under time pressure, which masks the underlying defect and turns debugging into whack-a-mole.
- **What it does:** Enforces a four-phase root-cause-first process — investigate (reproduce, bisect, gather evidence), pattern-match against known bug signatures, form and test one falsifiable hypothesis at a time (3-strike rule before questioning architecture), then implement a minimal fix backed by a failing-then-passing regression test. Closes with a structured DEBUG REPORT (symptom/root cause/fix/evidence/status).
- **Why not vanilla Claude Code:** Vanilla Claude Code has no iron law against fixing before understanding — under "just one quick fix" pressure it will happily propose a plausible-looking patch without ever confirming a root cause, and there's no 3-strike gate forcing an architecture conversation after repeated failed fixes.
- **When to use:** "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes." Especially under time pressure or after multiple failed fix attempts.
- **Then what:** A confirmed root-cause hypothesis, a minimal fix, a regression test that failed before and passes after, and a DEBUG REPORT with a DONE / DONE_WITH_CONCERNS / BLOCKED status.
- **Notes:** Feeds test-driven-development for the regression test step and verification-before-completion for the final fix check; the `debugger` agent loads this skill as its methodology home.

#### `test-driven-development` (skill)

- **Why needed:** Without a forcing function, tests get written after the implementation (if at all), so they pass immediately and prove nothing about correctness.
- **What it does:** Enforces RED (write one failing test) → verify it fails for the right reason → GREEN (minimal code to pass) → verify it passes → REFACTOR while staying green, repeated per behavior. Includes a verification checklist and explicit handling for bug fixes (write the failing repro test first).
- **Why not vanilla Claude Code:** Vanilla Claude Code has no forced red-green-refactor discipline, so tests get written after the fact or skipped under time pressure, and a test that passes on first run gives false confidence it's testing the right thing.
- **When to use:** "Use when implementing any feature or bugfix, before writing implementation code."
- **Then what:** A codebase where every new behavior has a test that was observed failing before the implementation existed, plus a verification checklist confirming pristine output.
- **Notes:** Its "Iron Law" (no production code without a failing test first) is the same discipline `writing-skills` and `systematic-debugging` build on.

#### `verification-before-completion` (skill)

- **Why needed:** Agents (and people) are prone to declaring "done" based on confidence or a prior run rather than fresh evidence, which erodes trust when the claim turns out false.
- **What it does:** A gate function — before any completion claim, identify the command that proves it, run it fresh, read the full output, and only then state the claim with evidence attached. Lists common failure phrases ("should work now", "I'm confident") and the reality behind each.
- **Why not vanilla Claude Code:** Vanilla Claude Code will readily say "tests pass" or "that's fixed" based on a previous tool call, code that "looks right," or an agent's self-report, with no structural requirement to re-run and paste fresh output before the claim.
- **When to use:** "Use when about to claim work is complete, fixed, or passing, before committing or creating PRs" — any expression of success or satisfaction.
- **Then what:** Every completion claim in the transcript is backed by a freshly-run command's output rather than an assumption.
- **Notes:** Explicitly named as the final check in `systematic-debugging`'s fix-verification step and is the discipline `qa`, `verifier`, and `ship` all build their evidence requirements on.

#### `dispatching-parallel-agents` (skill)

- **Why needed:** Investigating multiple unrelated failures one at a time wastes wall-clock time when the problems have no shared state and don't depend on each other.
- **What it does:** Teaches how to identify independent problem domains, craft focused self-contained subagent prompts (scope, constraints, expected output), and issue multiple Agent dispatches in a single response so they run concurrently, then review and integrate results and re-run the full suite.
- **Why not vanilla Claude Code:** Without this skill's guidance, an agent tends to either investigate everything itself sequentially or dispatch a single vague "fix all the tests" subagent that loses focus — nothing forces the one-agent-per-independent-domain split or the single-message parallel dispatch pattern.
- **When to use:** "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies."
- **Then what:** Multiple subagents' fixes/investigations are reviewed for conflicts, integrated, and the full test suite is re-run to confirm they compose cleanly.
- **Notes:** The lightweight, no-ceremony counterpart to `sprint-execution` (plan-driven) and `bugfix-wave` (bug-list-driven) — same core pattern, without their worktree/wave/gate machinery. Use this when neither a plan file nor a triaged bug list exists yet; once one does, that skill's ceremony is warranted instead.

#### `using-git-worktrees` (skill)

- **Why needed:** Working directly on the current branch/workspace risks polluting it with in-progress feature work, and manually managing `git worktree` commands is error-prone (wrong directory, untracked contents, orphaned worktrees).
- **What it does:** Detects whether you're already in an isolated workspace, prefers the harness's native worktree tool over raw git, falls back to a `git worktree add` flow with `.gitignore` safety checks otherwise, then runs project setup and a clean-baseline test run before reporting readiness.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standard protocol for detecting existing isolation or preferring native worktree tooling, so it either fights the harness by shelling out `git worktree add` when a native tool already exists, or skips baseline verification and starts implementing on a workspace that was already broken.
- **When to use:** "Use when starting feature work that needs isolation from current workspace or before executing implementation plans."
- **Then what:** An isolated workspace with dependencies installed and a passing baseline test run, ready for implementation to begin.
- **Notes:** `sprint-execution` §1 now names this skill for the orchestrator's own workspace isolation (distinct from the per-track `isolation="worktree"` it sets up separately on each subagent dispatch — see that entry's notes). `finishing-a-development-branch` also assumes this skill's worktree conventions (`.worktrees/` ownership, provenance-based cleanup). `bugfix-wave` uses a different path convention (`.claude/worktrees/<id>`) and doesn't reference this skill — the "assumes conventions" claim doesn't hold for it; flagged, not yet reconciled.

#### `finishing-a-development-branch` (skill)

- **Why needed:** "What do I do with this finished branch?" is usually answered ad hoc — sometimes skipping test verification, sometimes deleting a worktree the harness still needs, sometimes force-deleting work without confirmation.
- **What it does:** Verifies tests pass, detects the workspace environment (normal repo / named-branch worktree / detached HEAD) to pick the right menu, presents exactly 4 structured options (merge / PR / keep / discard — 3 for detached HEAD), executes the choice, and cleans up the worktree only for merge or discard.
- **Why not vanilla Claude Code:** Left to its own judgment, an agent might ask an open-ended "what next?", skip the pre-merge test check, or remove a worktree the user still needs for PR iteration — this skill hard-codes the safe sequence and the provenance check for which worktrees it's allowed to delete.
- **When to use:** "Use when implementation is complete, all tests pass, and you need to decide how to integrate the work."
- **Then what:** The branch is merged/pushed/kept/discarded per the user's choice, with the worktree cleaned up only when appropriate and branch deletion always happening after (never before) worktree removal.
- **Notes:** Directly composes with `using-git-worktrees` (same directory conventions) and is functionally the manual counterpart to the fully automated `ship`/`land-and-deploy` skills.

#### `bugfix-wave` (skill)

- **Why needed:** A prioritized list of many bugs (from a review, security scan, or lint report) fixed one-by-one in a single session is slow and risks context exhaustion; naive parallelization risks file conflicts and un-auditable batched commits.
- **What it does:** Classifies each finding by model/effort, groups them into file-conflict-free tracks, sequences tracks into dependency-ordered waves, dispatches one subagent per track (each in its own worktree/branch) with a structural-fix mandate (fix every instance of a defect class plus a regression guard, not just the flagged line), then merges, resolves conflicts, and cleans up between waves.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no notion of grouping bugs into non-conflicting tracks or waves, no per-fix atomic-commit-with-rollback discipline, and no structural-fix requirement — it would either fix bugs serially or parallelize naively into merge conflicts and unreviewable diffs.
- **When to use:** Triggered by a pasted bug list with severity tags, or explicit requests like "fix these", "execute these findings", "run the fix wave".
- **Then what:** Every fixable finding lands as its own atomic, verified commit with a regression guard; unresolved findings are reported with rationale; in structured (`findings.json`) mode, a `fixes.json` summary is emitted for the next pipeline stage.
- **Notes:** The higher-ceremony sibling of `dispatching-parallel-agents` for the bug-list case — same core parallel-dispatch pattern, with worktrees, waves, and structured commits layered on top; commonly the consumer of `code-review-gate`/`security-auditor` output.

#### `test-master` (skill)

- **Why needed:** Ad hoc testing tends to cover only the happy path, skip flaky-test triage, and leave coverage gaps undocumented — none of which surfaces until production.
- **What it does:** Runs a define-scope → strategy → write → execute → report workflow across functional, performance, and security testing; enforces mocking external dependencies, meaningful assertions (not just truthiness), and independently-runnable tests; produces severity-rated findings and fix recommendations.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no default discipline against order-dependent tests, no requirement to test both branches of a conditional, and no structured escalation path for flaky tests (it tends to just re-run until green rather than quarantine-and-fix).
- **When to use:** "Use when writing unit tests, integration tests, or E2E tests; creating test strategies or automation frameworks; analyzing coverage gaps... or working on QA, regression, test automation, quality gates."
- **Then what:** A test plan/suite with scope, coverage analysis, and severity-rated findings with concrete fix recommendations; coverage gaps are flagged explicitly rather than silently accepted.
- **Notes:** `gate-automation` invokes this skill directly for Maestro/mobile test-design guidance.

#### `refactoring-specialist` (skill)

- **Why needed:** Refactors done casually tend to bundle behavior changes with structural changes in one un-reviewable diff, and legacy code with no tests gets "cleaned up" without anyone verifying behavior was preserved.
- **What it does:** A non-negotiable safety contract — tests (or characterization tests) before touching code, one named refactoring at a time, tests green after every step, small revertable commits, and zero verified behavior change — applied through an analysis → transformation → verification workflow with a catalog of concrete refactoring moves (Extract Method, Replace Conditional with Polymorphism, etc.) and legacy-code seam-finding guidance.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no default separation between "refactor" and "improve/change behavior" — it will happily mix a rename with a logic tweak in one commit, and has no built-in requirement to write characterization tests before touching untested legacy code.
- **When to use:** "Use when refactoring, cleaning up code smells, reducing complexity or duplication, or restructuring legacy code."
- **Then what:** A sequence of small, green, revertable commits, each named after the refactoring applied, with reported complexity/duplication/coverage deltas and zero observable behavior change.
- **Notes:** Designed to be "injected into executor tracks that touch existing code" — i.e., composes with `bugfix-wave` tracks and plan execution rather than standing alone.

#### `learn` (skill)

- **Why needed:** Insights discovered mid-session (a gotcha, a project convention, a pitfall) normally evaporate when the session ends, forcing every future session to rediscover them the hard way.
- **What it does:** Maintains an append-only JSONL ledger (`.claude/learnings.jsonl`) of patterns/pitfalls/preferences/architecture/tool/operational insights with confidence scores and time-based decay for unconfirmed observations; supports show/search/prune/export/stats/add operations, with a hard gate against making code changes.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no persistent, structured memory across sessions — anything learned mid-conversation is lost unless the user manually writes it down somewhere, and there's no confidence-decay or contradiction-detection mechanism for that memory.
- **When to use:** "Use when asked 'what have you learned', '/learn', 'search learnings', 'prune learnings', or to record an insight for future sessions."
- **Then what:** The ledger gains or updates an entry (or the user gets a filtered/exported view of existing entries); no code is ever touched.
- **Notes:** Read-only with respect to code — pairs naturally with `context-save`/`context-restore` for session continuity but tracks durable knowledge rather than in-flight state.

#### `context-save` (skill)

- **Why needed:** Ending a session (or handing off to another branch/worktree) without a structured summary means the next session has to reconstruct "what was I doing and why" from scratch, often losing decisions and rationale.
- **What it does:** Gathers git state (branch, status, diff stats, recent log), summarizes what's being worked on, decisions made, remaining work, and gotchas, then writes a timestamped Markdown file to `~/.claude/context/<project-slug>/` outside the repo so it survives branch switches; supports listing saved contexts per branch.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no external, branch-tagged session-state file — closing the session or switching branches loses the working narrative entirely, with nothing analogous to this skill's append-only, cross-worktree-safe save location.
- **When to use:** "Use when asked to 'save progress', 'save state', 'context save', or 'save my work' before ending a session or handing off."
- **Then what:** A new append-only Markdown file exists with branch, decisions, remaining work, and notes, ready to be picked up later via `/context-restore`.
- **Notes:** Deliberately paired with `context-restore` — save defaults to the current branch's list, restore defaults to the most recent save across ALL branches (an intentional asymmetry for cross-branch handoff).

#### `context-restore` (skill)

- **Why needed:** Resuming work after a break (or on a different branch/worktree than where it was saved) needs the prior session's decisions and next steps surfaced clearly, not buried in scrollback that's already gone.
- **What it does:** Finds saved context files under `~/.claude/context/<project-slug>/` across all branches, loads the most recent one (or a user-specified one by title/number), presents title/branch/summary/remaining-work/notes, and flags a branch mismatch if the current branch differs from the saved one.
- **Why not vanilla Claude Code:** Without a persisted, cross-branch-aware restore mechanism, vanilla Claude Code has nothing to resume from once a session ends — "where was I?" has no answer beyond what the user remembers.
- **When to use:** "Use when asked to 'resume', 'restore context', 'where was I', or 'pick up where I left off'."
- **Then what:** The user sees the saved summary and remaining-work list and chooses to continue on the first item, view the full file, or simply confirm they have the context they needed.
- **Notes:** Read-only — never touches code; its "most recent" ordering is by filename timestamp prefix (stable across copies), not filesystem mtime.

#### `guard` (skill)

- **Why needed:** Working in risky contexts (production, shared environments, live debugging) invites both destructive one-liners (`rm -rf`, `git reset --hard`, force-push) executed without a second thought and accidental edits drifting outside an intended scope.
- **What it does:** Two independently-activatable protections — destructive-command warnings (pattern-match risky shell commands, stop and require confirmation before running) and edit-scope freeze (block any Edit/Write outside a designated directory) — plus an unfreeze to lift the boundary; state persists in a session file that PreToolUse hooks can enforce mechanically if wired up.
- **Why not vanilla Claude Code:** Vanilla Claude Code will run `rm -rf`, `git push --force`, or `DROP TABLE` the moment it's asked, with no built-in speed-bump or scope boundary — it has no session-level mechanism to say "restrict my own edits to this directory" the way this skill does.
- **When to use:** "Use when touching prod, debugging live systems, working in shared environments, or when asked to 'be careful', 'safety mode', 'guard mode', 'freeze edits', or 'unfreeze'."
- **Then what:** Either a warning-before-destructive-command habit is active for the rest of the session, an edit boundary is enforced (Edit/Write outside it is denied), or both — until explicitly unfrozen or the session ends.
- **Notes:** `systematic-debugging`'s scope-lock step explicitly recommends invoking this skill's freeze to enforce its narrowed-directory boundary.

#### `writing-skills` (skill)

- **Why needed:** Skills (and edits to them) written without testing tend to have unclear triggers, workflow-summarizing descriptions that agents shortcut past, and loopholes that rationalization finds under pressure — exactly the failure modes this meta-skill exists to prevent.
- **What it does:** Applies TDD to documentation itself — run a baseline pressure scenario without the skill (RED), write the minimal skill addressing the observed rationalizations (GREEN), then close loopholes found in re-testing (REFACTOR) — with detailed guidance on frontmatter, description writing (trigger-only, never workflow-summarizing), token efficiency, flowchart usage, and a "match the form to the failure" framework for choosing prohibition vs. recipe vs. structural vs. conditional guidance.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no discipline requiring a skill to be pressure-tested before shipping, and left to its own judgment tends to write descriptions that summarize the workflow (which research here shows causes agents to follow the description instead of reading the skill body) rather than pure trigger conditions.
- **When to use:** "Use when creating new skills, editing existing skills, verifying skills work before deployment, or codifying a repeated workflow from this session into a permanent skill."
- **Then what:** A new or edited SKILL.md that has been pressure-tested against baseline failures, with a rationalization table and red-flags list closing known loopholes, committed only after tests pass.
- **Notes:** Explicitly requires `test-driven-development` as background reading — the entire skill is that skill's Iron Law applied to documentation.

#### `debugger` (agent)

- **Why needed:** Interactive debugging sessions often get interrupted by context resets, and without persistent state the investigation has to restart from zero each time — losing eliminated hypotheses and gathered evidence.
- **What it does:** Loads `systematic-debugging` as its core methodology, then adds session management on top: creates a persistent debug file immediately, updates Current Focus/Evidence/Eliminated sections continuously so it can resume perfectly after a context reset, runs a mandatory "reasoning checkpoint" before any fix, and returns structured results (ROOT CAUSE FOUND / DEBUG COMPLETE / CHECKPOINT REACHED) depending on mode (diagnose-only, find-and-fix, TDD mode).
- **Why not vanilla Claude Code:** A vanilla Claude Code session investigating a bug has no on-disk debug-file protocol — if the context resets or a checkpoint is needed, the entire evidence trail (what was tried, what was ruled out) is gone, and there's no mandatory reasoning-checkpoint gate forcing a filled-in hypothesis/evidence/falsification-test before any fix is attempted.
- **When to use:** Dispatched by the orchestrator/pipeline for interactive debugging or parallel UAT diagnosis; also backs the `/debug` command.
- **Then what:** A resolved (or explicitly inconclusive/checkpointed) debug session file moved to `.planning/debug/resolved/`, a knowledge-base entry appended for future pattern matching, and a commit with the fix and root cause in the message.
- **Notes:** Requires explicit human confirmation ("confirmed fixed") before archiving — it will not self-certify a fix as done.

#### `code-review-gate` (agent)

- **Why needed:** Code review that isn't adversarial by default tends to stop at obvious issues and accept plausible-looking logic without tracing edge cases, letting real bugs and security gaps ship — and a single hardcoded reviewer provider means no independent second opinion when that provider isn't installed.
- **What it does:** Reviews source files or a pre-landing diff at one of three depths (quick/standard/deep), classifies every finding as Critical/Warning/Info (mapped to a P0–P4 ladder) with a 1-10 confidence score, runs a pre-emit verification gate requiring the motivating code line to be quoted before a finding can be promoted, and — in branch/diff mode — also checks scope drift and plan-completion before the main review. Runs in **single mode** (one-shot review, default engine `claude`) or **round mode** (one round of a ≤6-round adversarial loop against a sprint branch, default engine `codex`, with defect-class grouping and `previously_seen_classes` tracking) — the engine is selected per `references/independent-review.md`. Produces a canonical `findings.json` with a human-readable review rendered from it.
- **Why not vanilla Claude Code:** Vanilla Claude Code reviewing code on request tends to soften findings and accept "looks fine" without evidence; this agent's forced adversarial stance, severity taxonomy, and quote-the-motivating-line verification gate specifically exist to kill the "field doesn't exist" class of false-positive and the "stopping at surface issues" failure mode. Its engine registry also means "independent review" degrades gracefully instead of failing outright when no external CLI is installed.
- **When to use:** Dispatched by the orchestrator/pipeline for plan/sprint reviews and adversarial rounds; also backs the `/review` command.
- **Then what:** A canonical `findings.json` plus a REVIEW.md (single mode) or `findings.md` (round mode) rendered from it, with YAML frontmatter (finding counts by severity, files reviewed, engine used) and structured Critical/Warning/Info sections, each finding carrying a concrete fix suggestion; the orchestrator handles any commit.
- **Notes:** Read-only — it never modifies source files, only writes the findings/review files; `code-review-protocol` is the skill governing how a caller should dispatch this agent and respond to its feedback. Supersedes the former `code-reviewer` and `gate-codex-round` agents.

#### `qa` (agent)

- **Why needed:** Code review and unit tests alone don't catch what breaks when a real user clicks through a live app — broken forms, dead buttons, console errors, and regressions on adjacent pages.
- **What it does:** Drives a live browser like a real user (or auto-detects diff-aware mode on a feature branch), documents issues with before/after screenshots and severity/category tags, computes a weighted health score, then — unless `report_only` is set — fixes bugs in source with one atomic commit per fix, re-verifies with evidence, writes regression tests matching existing test conventions, and self-regulates against runaway fix sprees.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no browser-driven QA loop at all by default — it would need to be told explicitly to open a browser, and even then has no structured health-score rubric, before/after screenshot discipline, or fix-then-regression-test loop with a self-regulation stop condition.
- **When to use:** Dispatched by the orchestrator/pipeline to test a running app or a branch's diff; `report_only: true` switches to find-and-document-only mode. Also backs the `/qa` command.
- **Then what:** A QA report with per-issue evidence and (in full mode) fix status (verified/best-effort/reverted/deferred), commit SHAs, and a before/after health score; `report_only` mode produces only the report, no source changes.
- **Notes:** In full mode it also bootstraps a test framework if none exists (Phase 1b) — a QA run can be the reason a project gets its first test suite.

#### `verifier` (agent)

- **Why needed:** "All tasks marked complete" is not the same as "the phase goal is actually true in the codebase" — a placeholder component satisfies a checklist item without delivering working behavior, and SUMMARY.md claims can't be trusted at face value.
- **What it does:** Goal-backward verification — establishes must-have observable truths (from roadmap success criteria and plan frontmatter), then checks supporting artifacts at four levels (exists, substantive/not-a-stub, wired/imported-and-used, and data actually flowing from a real source), verifies key links (component→API→DB→display), scans for anti-pattern stubs and debt markers, runs behavioral spot-checks and any declared probes, and determines an overall passed/gaps_found/human_needed status. Separately (Step 6d), checks every requirement for real automated test coverage and structures any misses as a `validation_gaps` list — orthogonal to the pass/fail status, since a requirement can work correctly yet have no test proving it.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked "is this phase done?" tends to trust the SUMMARY narrative and treat file existence as proof of implementation; this agent's four-level artifact check and stub-detection patterns specifically exist because "exists" and "wired" and "producing real data" are three different (and often false) things.
- **When to use:** Dispatched by the orchestrator/pipeline after a phase completes; also backs the `/verify` command.
- **Then what:** A VERIFICATION.md with per-truth status, artifact/key-link tables, and — if gaps exist — structured YAML gap entries that a gap-closure planning workflow can consume directly; a non-empty `validation_gaps` list hands straight to `nyquist-auditor` as its `<gaps>` input.
- **Notes:** Supports re-verification mode that reuses a previous run's must-haves and does a lighter regression check on items that already passed, rather than re-deriving everything from scratch. This is Stage 11's **verdict** gate over roadmap-level truths — distinct from `converge` (see [`core-discovery-and-design.md`](core-discovery-and-design.md)), the **remediation compiler** that sweeps every FR/SC/AC/constitution principle and turns gaps into new `<task>` blocks; `converge` treats a `VERIFICATION.md` gaps list as pre-confirmed input evidence when one exists. `validation_gaps` (Step 6d) is a third, independent output — test-coverage gaps for `nyquist-auditor`, not goal gaps for `converge`.

#### `integration-checker` (agent)

- **Why needed:** Individual phases can each look complete in isolation while the system as a whole is broken, because a component exists without being imported, or an API exists with no caller — existence checks miss this entirely.
- **What it does:** Builds a provides/consumes map across phases from their SUMMARYs, verifies each export is both imported and actually used (not just imported), checks API routes have real consumers, verifies auth protection on sensitive routes, and traces end-to-end flows (auth, data display, form submission) through the codebase to find exactly where they break.
- **Why not vanilla Claude Code:** Vanilla Claude Code checking "does this feature work" tends to verify each piece exists and stop there; this agent's explicit distinction between "exported" and "imported AND used" is the check that catches orphaned code and broken wiring that per-phase review never would.
- **When to use:** Dispatched by the orchestrator/pipeline to audit cross-phase integration after multiple phases are complete.
- **Then what:** A structured report of connected/orphaned exports, consumed/orphaned API routes, protected/unprotected sensitive routes, and complete/broken E2E flows with the exact break point named (e.g. "Dashboard.tsx line 45 fetches but doesn't await response").
- **Notes:** Read-only (no Write tool) — it only traces and reports; complements `verifier`'s within-phase check by looking across phase boundaries instead.

#### `nyquist-auditor` (agent)

- **Why needed:** A validation gap ("no test exists for this requirement") left unaddressed silently becomes a false sense of completeness; simply writing a trivially-passing test to close the gap is worse than no test at all.
- **What it does:** For each declared gap, classifies the needed test type (unit/integration/smoke), writes a real behavioral test targeting the requirement's hardest edge (not the easy case), runs it, and — if it fails — debugs for up to 3 iterations, escalating implementation bugs to the developer rather than weakening the assertion to make it pass.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked to "add a test to close this gap" has no adversarial stance forcing it to write a test that could actually fail, and no hard rule against quietly loosening an assertion until a failing test goes green — this agent is built specifically to resist both.
- **When to use:** Dispatched by the orchestrator/pipeline with `verifier`'s `validation_gaps` (Step 6d of `VERIFICATION.md`) as its `<gaps>` input — the only asset in this pipeline that produces gaps in the `no_test_file`/`test_fails`/`no_automated_command` shape this agent consumes.
- **Then what:** Each gap resolves to FILLED (a real passing test exists), ESCALATED (implementation bug found, reported with evidence), or an explicitly justified SKIP — never silently marked done.
- **Notes:** Implementation files are read-only for this agent; it can only create/modify test files, fixtures, and its VALIDATION.md report. A Stage 8–13 audit found this agent's expected input previously had no producer — `verifier`'s pre-existing `gaps:` (failed truths) and `converge`'s appended `<task>` blocks are shaped for different jobs — and wired `verifier` Step 6d to close the gap.

#### `gate-automation` (agent)

- **Why needed:** New or materially-changed user flows can ship without any E2E coverage, and nobody notices until the flow breaks in production — this agent exists to make that gap visible and closed before a sprint tags.
- **What it does:** Determines the project's automation surface (Playwright for web, Maestro for mobile, or both) from `CLAUDE.md`'s requirement scope and repo evidence, identifies primary user flows added/changed in the sprint diff, invokes `playwright-expert` or `test-master` for test-design guidance, authors golden-path plus critical-edge-case flows, runs them locally, checks for an on-demand E2E CI job, and emits a schema-compliant `authoring-report.json`.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing notion of "primary user flow coverage as a sprint gate" — it wouldn't systematically diff the sprint, distinguish primary flows from internal refactors, or know to check for (and report the absence of) an on-demand E2E CI job.
- **When to use:** Spawned after the adversarial review loop terminates cleanly, before a sprint tag.
- **Then what:** New E2E flow files exist and pass locally, `authoring-report.md`/`.json` are written under `docs/dev-kit/automation/<sprint_id>/`, and the orchestrator receives only the JSON summary (flows added, missing coverage with reasons, local pass, CI status, gate_passed).
- **Notes:** Never invents features to test — it anchors strictly to the actual sprint diff and plan, and internal-only changes are excluded from required coverage.

#### `debug` (command)

- **Why needed:** Users need a fast, explicit entry point to trigger systematic investigation rather than describing a bug in prose and hoping the right skill activates.
- **What it does:** Parses `$ARGUMENTS` as the bug description, failing test, or error output, and dispatches the `debugger` agent with that context.
- **Why not vanilla Claude Code:** A slash command gives a stable, discoverable trigger for the full debugger-agent-plus-systematic-debugging-skill pipeline instead of relying on vanilla Claude Code to infer that a bug report warrants a structured investigation.
- **When to use:** Whenever a user wants to hand off a bug/failure for root-cause investigation via an explicit command rather than freeform conversation.
- **Then what:** A root-cause diagnosis with evidence and a proposed fix, per the debugger agent's structured return format.

#### `qa` (command)

- **Why needed:** Running QA on the current change should be a single explicit action, with an easy way to ask for a report only (no fixes) when that's what's wanted.
- **What it does:** Parses `$ARGUMENTS` for an optional `report_only` flag (also matching "report only" / "no fixes") and dispatches the `qa` agent against the current change with that flag.
- **Why not vanilla Claude Code:** Without this command, invoking the full browser-driven QA-plus-fix-loop agent requires knowing it exists and phrasing a request precisely; the command makes the report-only vs. fix-and-verify choice a one-word flag.
- **When to use:** After a change is ready to validate against a running app, with or without auto-fixing what's found.
- **Then what:** A QA report of what works and what's broken, with fixes applied and commits made unless `report_only` was set.

#### `review` (command)

- **Why needed:** Requesting a code review on the current diff should not require manually assembling SHAs and file lists every time.
- **What it does:** Parses `$ARGUMENTS` for an optional diff range or scope (default: current uncommitted/branch diff) and an optional `--engine` override, and dispatches the `code-review-gate` agent (single mode) on that diff.
- **Why not vanilla Claude Code:** Without a dedicated command, getting an adversarial, severity-classified review with a reusable format each time requires re-explaining the desired review process; this command locks in the `code-review-gate` agent's behavior as a one-line invocation.
- **When to use:** Before merging, after completing a task, or any time a second, adversarial pass over the current diff is wanted.
- **Then what:** Severity-classified review findings with file:line references, rendered from the `code-review-gate` agent's canonical `findings.json`.

#### `verify` (command)

- **Why needed:** Confirming a change actually achieves its stated goal (not just that tasks were checked off) needs a lightweight, repeatable trigger.
- **What it does:** Parses `$ARGUMENTS` as the goal, plan, or acceptance criteria to verify against (default: the current change's stated goal) and dispatches the `verifier` agent with that context.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked "is this done?" will typically answer from its own read of the summary rather than running the verifier's four-level artifact and key-link checks; this command makes invoking that stricter process a single step.
- **When to use:** After implementation work claims to be finished, before trusting that claim.
- **Then what:** A pass/fail verification report with the evidence backing each verdict, per the `verifier` agent's VERIFICATION.md.

## Role: Security / Compliance Reviewer

#### `security-reviewer` (skill)

- **Why needed:** Security review that relies solely on automated scanners misses context-dependent issues in auth, input handling, and cryptography that only manual review catches.
- **What it does:** Runs a scope → scan (semgrep/bandit/gitleaks/npm audit/trivy) → manual review → test-and-classify (CVSS severity) → report workflow, with mandatory authorization/scope confirmation before active testing and a structured finding format (ID, severity, file/line, description, impact, remediation, CWE/OWASP reference).
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing checklist forcing authN/authZ review first, no consistent CVSS-based severity calibration, and no default habit of running automated tools before manual review — each security ask would otherwise be handled ad hoc and inconsistently across sessions.
- **When to use:** "Use when conducting security audits, reviewing code for vulnerabilities, or analyzing infrastructure security" — SAST scans, penetration testing, DevSecOps, cloud security, dependency audits, secrets scanning.
- **Then what:** An executive summary with risk assessment, a findings table by severity, detailed per-finding entries with remediation, and prioritized recommendations.
- **Notes:** Explicitly related to `secure-code-guardian` (implementation-time prevention) as the audit-time counterpart — this skill finds problems, that one prevents them while writing code. `security-auditor` declares this skill its **methodology home** for the general-audit fieldwork pass (the `debugger`/`systematic-debugging` pattern) — a Stage 8–13 audit found the agent had copy-pasted this skill's workflow, tool list, constraints, and report format nearly verbatim (~40 lines, down to an identical worked example) instead of referencing it; the agent now applies this skill directly and only adds threat-register-disposition verification on top.

#### `cso` (skill)

- **Why needed:** Security review that starts and ends at application code misses the far larger real attack surface — leaked secrets in git history, unpinned CI actions, misconfigured infrastructure, and the emerging risk of malicious AI agent skills — none of which get caught by asking "is this feature secure?" during a code-level review.
- **What it does:** Runs a 15-phase Chief-Security-Officer audit (stack detection, attack-surface census, secrets archaeology, dependency supply chain, CI/CD pipeline security, infra shadow surface, webhook/integration audit, LLM/AI security, skill supply-chain scanning, OWASP Top 10, STRIDE threat modeling, data classification, false-positive filtering with active verification, findings report, and a saved report) with two confidence modes (daily 8/10 gate vs. comprehensive 2/10 bar), plus a `--diff` flag to scope any mode to just the current branch's changes.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing security-audit checklist or confidence-gated false-positive filter — asked to "check for security issues" it produces an unranked, unverified list; this skill requires every finding to be pre-emit-verified by quoting the motivating code line and scored for confidence before it's ever reported.
- **When to use:** Frontmatter: "Use when asked for a security audit, threat model, pentest review, OWASP review, or vulnerability scan." In the pipeline, dispatched on a schedule rather than only ad hoc — see Notes.
- **Then what:** Produces a Security Posture Report with concrete findings, severities, exploit scenarios, and a remediation roadmap (Fix now / Mitigate / Accept risk / Defer), plus a saved JSON report under `.security-reports/` for trend tracking across runs.
- **Notes:** Read-only — it never modifies code, so its output is a prerequisite input for later planning/hardening work, not a fix itself; it also explicitly ignores any instructions embedded in the audited codebase that try to influence its own methodology. Every one of its 15 phases assumes an existing checkout (stack detection, git-history secrets scan, dependency manifests…) — a Stage 8–13 audit found it misplaced at the pipeline's Stage 2 (before any code exists on a first-milestone project) and moved its scheduled invocations to Stage 0 (full audit, gated on the entry path already having code — Legacy or Continuing-milestone) and Stage 12 (`--diff`, per phase, always has code by construction since Stage 12 runs after that phase's own Execute stage). `planner`'s Stage 7 threat-modeling step and `sdd-review-cto`'s Stage 2 review both consult its latest `.security-reports/` entry when one exists.

#### `secure-code-guardian` (skill)

- **Why needed:** Custom auth/authz/input-handling code written without a security-specific checklist tends to reproduce classic OWASP Top 10 mistakes (plaintext passwords, string-interpolated SQL, missing rate limiting) even when the developer "knows better" in the abstract.
- **What it does:** Threat-model → design → implement-with-defense-in-depth → validate-with-explicit-checkpoints → document workflow, with concrete, ready-to-adapt code for bcrypt password hashing, parameterized SQL, Zod input validation, JWT verification with explicit algorithm allowlisting, and a full secured-endpoint example combining rate limiting, validation, auth, and httpOnly cookies.
- **Why not vanilla Claude Code:** Vanilla Claude Code implementing "add a login endpoint" from scratch has no forced checklist requiring bcrypt over MD5, parameterized queries over string interpolation, or an explicit JWT algorithm allowlist — each of those is a well-known mistake this skill exists specifically to preempt via MUST/MUST NOT constraints and validation checkpoints.
- **When to use:** "Use when implementing authentication/authorization, securing user input, or preventing OWASP Top 10 vulnerabilities" — password hashing, SQL sanitization, CORS/CSP config, JWT setup.
- **Then what:** Secure implementation code plus explicit security considerations, required env-var/header configuration, and testing recommendations (brute-force lockout, privilege-escalation paths, injection payload rejection).
- **Notes:** For pre-built OAuth/SSO integrations or standalone security audits, the skill itself recommends a more specialized skill (`security-reviewer` for audits).

#### `fullstack-guardian` (skill)

- **Why needed:** Feature work spanning frontend, backend, and security is often built one layer at a time with security bolted on afterward (or skipped), producing endpoints that trust client-side validation alone or leak sensitive fields in API responses.
- **What it does:** Gathers requirements, designs across all three perspectives (Frontend/Backend/Security) simultaneously, writes a technical design doc, runs a mandatory security checkpoint before any code, implements incrementally with input validated on both client and server and output sanitized, then hands off to Test Master/DevOps.
- **Why not vanilla Claude Code:** Vanilla Claude Code building a full-stack feature tends to implement backend and frontend as separate concerns without a structural requirement to address security at every layer simultaneously — this skill's three-perspective example (explicit 403 before DB access, explicit response schema excluding sensitive fields) is the discipline that's otherwise easy to skip under feature-delivery pressure.
- **When to use:** "Use when implementing features across frontend and backend, building REST APIs with corresponding UI, connecting frontend components to backend endpoints... or implementing CRUD operations with UI forms."
- **Then what:** A technical design document (for non-trivial features), backend code (models/schemas/endpoints), frontend code (components/hooks/API calls), and brief security notes — each component tested as it's built.
- **Notes:** Distinct from frontend-only or backend-only skills specifically because it forces the security perspective into the same workflow rather than treating it as a separate audit step.

#### `code-review-protocol` (skill)

- **Why needed:** Requesting review is often skipped ("it's simple") and receiving review feedback is often handled with performative agreement ("You're absolutely right!") instead of technical verification — both let real issues slip through or get implemented incorrectly.
- **What it does:** Covers both directions: dispatching a reviewer subagent with precisely-crafted context (never the requester's full session history) at mandatory checkpoints (after each task, after major features, before merge), and — when receiving feedback — a read/understand/verify/evaluate/respond/implement pattern that forbids gratitude-performance and requires checking suggestions against the actual codebase before acting, including a YAGNI check on "implement this properly" suggestions.
- **Why not vanilla Claude Code:** Vanilla Claude Code tends to either skip requesting review on "simple" changes or, when receiving feedback, respond with reflexive agreement and implement suggestions without first checking whether they're actually correct for this codebase — this skill's forbidden-response list and verify-before-implementing pattern directly counter both habits.
- **When to use:** "Use when requesting a code review (after completing tasks, implementing major features, or before merging) or when receiving review feedback, especially if feedback seems unclear or technically questionable."
- **Then what:** Either a dispatched review with a documented response to its findings (fixed / pushed back with reasoning), or feedback received and acted on item-by-item with unclear items clarified before any implementation begins.
- **Notes:** Governs how to interact with a code reviewer — it is the protocol layer, while `code-review-gate` (pipeline-dispatched reviews) or the skill's own local `code-reviewer.md` template (ad-hoc, in-session requests) does the reviewing.

#### `security-auditor` (agent)

- **Why needed:** A declared threat mitigation in a plan's threat model can look complete on paper while the actual code never implements it at every entry point — trusting the plan's intent instead of verifying the implementation leaves real gaps unnoticed until exploited.
- **What it does:** Verifies each threat from a `<threat_model>` by its declared disposition (mitigate/accept/transfer) — grepping for the mitigation pattern at ALL entry points, not just one — then runs `security-reviewer`'s general audit methodology (SAST/secrets/dependency tools plus mandatory manual auth/input/crypto review) as its Fieldwork pass, rates findings by CVSS-informed severity, and writes SECURITY.md with a Threat Verification table plus prioritized remediation.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked "is this secure?" has no structured threat-register cross-reference and would likely accept a single matching grep result as proof a mitigation is complete everywhere, rather than checking every entry point as this agent's adversarial stance requires.
- **When to use:** Dispatched by the orchestrator/pipeline to audit an implemented phase against its threat model; falls back to `security-reviewer`'s methodology directly when no threat model exists. Checks for `cso`'s latest `.security-reports/` entry first (Stage 12 runs `cso --diff` alongside it) and treats it as available scan-tool evidence rather than re-running the same tools. Also backs the `/security-audit` command.
- **Then what:** SECURITY.md with an executive summary, severity-counted findings table, detailed findings with remediation, and a structured SECURED / OPEN_THREATS / ESCALATE return — open threats block the phase from shipping.
- **Notes:** Explicitly not a proactive threat-modeling tool (that's `cso`) — this agent verifies mitigations that were already declared, and implementation files are strictly read-only to it. `security-reviewer` (above) is its declared methodology home — see that entry's note for why.

#### `penetration-tester` (agent)

- **Why needed:** Static/manual code review can miss vulnerabilities that only surface through active exploitation attempts (auth bypass chains, business-logic flaws, real attack-surface reconnaissance) — someone has to actually try to break in, under controlled and authorized conditions.
- **What it does:** Requires confirmed scope and written authorization before any active test, then covers reconnaissance, OWASP Top 10 web testing, API auth/authz/rate-limiting, network/infra/cloud/mobile/wireless testing, and (only if explicitly in scope) social engineering — validating every finding via safe proof-of-concept and never exceeding it.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no built-in gate refusing to proceed without explicit written authorization and scope, and no systematic offensive-testing methodology across recon/web/API/network/cloud layers — this agent exists specifically to bring disciplined, bounded, authorized exploitation testing rather than either refusing entirely or testing recklessly.
- **When to use:** "Use to conduct AUTHORIZED security penetration tests that identify real vulnerabilities through active exploitation and validation."
- **Then what:** A report with executive summary, technical findings with proof-of-concept and endpoint/file:line references, severity ratings (likelihood + impact), prioritized remediation, compliance mapping, and retest guidance.
- **Notes:** Distinct from `security-auditor` in that it actively exploits (within authorized, non-destructive bounds) rather than verifying declared mitigations or running read-only scans.

#### `compliance-auditor` (agent)

- **Why needed:** Regulatory compliance (GDPR, HIPAA, PCI DSS, SOC 2, etc.) requires mapping specific legal/framework obligations to actual technical and process controls — a task easy to get wrong by assuming "we probably handle that" instead of tracing the data lifecycle and testing control implementation.
- **What it does:** Establishes organizational scope and applicable regulations, reviews existing controls/policies/prior audits, maps law to controls and traces the data lifecycle, inventories and tests control implementation, scores gaps by category (implementation/documentation/process/technology/training), and runs a per-gap risk assessment (threat/likelihood/impact/residual risk).
- **Why not vanilla Claude Code:** Vanilla Claude Code has no built-in cross-reference between named regulations (GDPR, HIPAA, PCI DSS, SOC 2, ISO 27001, FedRAMP) and concrete control checklists — assessing compliance posture would otherwise depend on the model's unstructured recall rather than this agent's systematic map-trace-inventory-score method.
- **When to use:** "Use to achieve regulatory compliance, implement compliance controls, or prepare for audits" across the named frameworks.
- **Then what:** An audit report — executive summary, per-control findings with evidence, a risk matrix, a prioritized remediation roadmap, and a stated control-coverage percentage.
- **Notes:** Explicitly read-only — it recommends controls but never modifies systems, and is the framework/regulatory-mapping counterpart to `security-auditor`'s code-level threat verification.

#### `dependency-manager` (agent)

- **Why needed:** Dependency trees accumulate CVEs, version conflicts, license violations, and dead weight silently over time, and manual audits across ecosystems (npm, pip, Cargo, Maven, Composer, Go modules) are tedious enough that they get skipped.
- **What it does:** Establishes project type and security policy, scans the dependency tree for vulnerabilities/conflicts/unused packages/license issues, prefers incremental tested updates over big-bang bumps, detects breaking changes before applying them, and verifies build/tests pass after every change.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing "zero critical vulnerabilities is the bar" policy or systematic sweep across security/tree/versioning/license/optimization dimensions — it would need to be walked through each check manually rather than invoking one agent that already knows the multi-ecosystem playbook.
- **When to use:** "Use to audit dependencies for vulnerabilities, resolve version conflicts, check license compliance, optimize bundle size, or set up automated dependency updates."
- **Then what:** A report of vulnerabilities (with severity and fixed-in versions), resolved conflicts, license issues, and bundle-size wins; any applied fixes are verified against the build/test suite before being considered done.
- **Notes:** Overlaps with `security-auditor`'s dependency-scanning fieldwork but is the dedicated specialist for ongoing dependency hygiene rather than a one-time threat-model verification — that overlap is acceptable, same layering as `security-auditor`/`security-reviewer` elsewhere in this role. A Stage 8–13 audit relocated this agent here from the verify stage: a CVE/version/license sweep answers "is this compliant and safe to ship," this stage's question, not "did we build the goal." The **specialized lane**'s `license-engineer` handles deep license-compliance questions this agent's sweep flags.

#### `security-audit` (command)

- **Why needed:** Running a security audit on the repo or a change should be a single, discoverable action rather than requiring the user to know the `security-auditor` agent exists and how to invoke it correctly.
- **What it does:** Parses `$ARGUMENTS` for an optional scope (paths, subsystem, or focus area; default: the whole repo or current change) and dispatches the `security-auditor` agent over that scope.
- **Why not vanilla Claude Code:** Without this command, triggering the full threat-verification-plus-audit-methodology pipeline requires explicitly requesting it in the right terms each time; the command makes it a fixed, memorable entry point.
- **When to use:** Whenever a scoped or repo-wide security audit is wanted, especially before shipping a phase with declared threat mitigations.
- **Then what:** Severity-ranked security findings with locations and remediation guidance, per the `security-auditor` agent's SECURITY.md output.

## Role: Docs / Release / Ops Manager

#### `code-documenter` (skill)

- **Why needed:** Undocumented functions, missing API specs, and stale doc sites accumulate silently, and even when documentation is written, unvalidated code examples in it quietly rot out of sync with the real API.
- **What it does:** Discover format preference → detect language/framework → analyze undocumented code → document consistently → validate every example actually compiles/runs (doctest, `tsc --noEmit`, OpenAPI lint) → report a coverage summary; includes ready reference for Google/NumPy/Sphinx docstrings, JSDoc, and interactive API doc portals.
- **Why not vanilla Claude Code:** Vanilla Claude Code writing docstrings or API docs on request has no default step that actually executes/type-checks the examples it writes — this skill's mandatory validation step (Step 5) is what catches "compiles" claims that are actually false.
- **When to use:** "Use when adding docstrings to functions or classes, creating API documentation, building documentation sites, or writing tutorials and user guides."
- **Then what:** Documented files plus a coverage summary (or an OpenAPI spec + portal config, or a doc-site configuration, depending on the task), with every code example verified to actually run.
- **Notes:** Distinct from `document-generate` — this skill covers inline/API-level documentation (docstrings, specs), while `document-generate` covers the four-quadrant Diataxis documentation set for a whole feature/project.

#### `content-qa` (skill)

- **Why needed:** AI-assisted prose tends to accumulate detectable "AI-isms" (em dashes, hollow intensifiers, Tier-1 vocabulary like "delve"/"leverage"/"seamless", formulaic rule-of-three structure) that make writing read as machine-generated even when the underlying content is sound.
- **What it does:** A two-pass audit — Pass 1 scans for AI-writing patterns across formatting, sentence structure, and a tiered vocabulary list, tagging each finding P0 (credibility killer) through P2 (stylistic polish), with strictness varying by content-type profile (blog vs. technical vs. investor email vs. casual); Pass 2 applies editorial judgment (passive-voice chains, "There is/are" openers, restating headers) that pattern-matching alone can't catch.
- **Why not vanilla Claude Code:** Vanilla Claude Code writing or editing prose has no systematic detection list for AI-writing tells and no content-type-aware strictness dial — without this skill, "make this sound more human" is a vague instruction with no defined pass/fail bar.
- **When to use:** "Use before publishing any AI-generated or AI-assisted text, or when asked to 'humanize this', 'de-slop', 'check this for AI patterns', or 'edit before publishing'."
- **Then what:** A findings table (severity, category, exact text, suggested fix), a fully rewritten version with issues fixed, and a brief change summary — while preserving code blocks, URLs, and the author's original meaning.
- **Notes:** Explicitly an editing pass, not a rewrite-from-scratch — it's meant to preserve voice, and content-type profile determines how aggressively rules apply (e.g., documentation is relaxed overall; investor emails are extra strict).

#### `document-generate` (skill)

- **Why needed:** Documentation written without first fully understanding the code tends to describe only half a feature, or mix tutorial/reference/explanation content together in a way that serves no reader well.
- **What it does:** Researches the codebase exhaustively first (entry points, source, tests, related modules, inline `WHY:`/`DESIGN:` comments) to build a concept map, partitions the work across the four Diataxis quadrants (tutorial/how-to/reference/explanation) per entity, writes reference docs first to establish vocabulary, then explanation, how-to, and tutorial docs each with their own template and quality rules, cross-links everything, and self-reviews against accuracy/completeness/voice gates before committing.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked to "document this feature" tends to produce one undifferentiated document mixing tutorial and reference content, without first reading tests for edge cases or verifying every code example actually runs — this skill's mandatory research phase and per-quadrant templates exist specifically to prevent that.
- **When to use:** "Use when asked to 'document this', 'write docs', 'generate documentation', or fill documentation gaps."
- **Then what:** New or updated documentation files (inline, standalone, or both per user choice), cross-linked and reachable within 2 clicks from the README, committed with a `docs:` message and pushed; a PR gets a `## Documentation Generated` section.
- **Notes:** Complementary to `document-release` — this skill generates new documentation content; `document-release` audits and syncs existing docs against what a branch actually shipped.

#### `document-release` (skill)

- **Why needed:** Documentation drifts from reality after every merge unless something explicitly cross-references the diff against every doc file — otherwise README examples go stale, CHANGELOG entries read like commit messages instead of user-facing value statements, and new public surface ships with zero documentation.
- **What it does:** Detects the base branch, analyzes the diff, builds a Diataxis coverage map of shipped-vs-documented public surface (flagging critical gaps and stale diagrams), audits each doc file (README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md) against the diff with auto-update for clear factual corrections and user confirmation for risky/narrative changes, polishes CHANGELOG voice against a 3-point "sell test" rubric without ever clobbering existing entries, cleans up TODOS.md, asks about a VERSION bump, and runs an independent second-opinion documentation review before finishing.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing habit of building a coverage map of undocumented new public surface, and has no hard rule against silently rewriting CHANGELOG history — this skill's explicit "NEVER CLOBBER CHANGELOG" and "NEVER BUMP VERSION WITHOUT ASKING" rules exist because those are exactly the mistakes an unconstrained agent would make.
- **When to use:** "Use when asked to 'update the docs', 'sync documentation', or 'post-ship docs'. Proactively suggest after a PR is merged or code is shipped."
- **Then what:** Updated documentation files committed as `docs: update project documentation for vX.Y.Z`, a documentation health summary, and (if a PR exists) a `## Documentation` section added to its body listing doc-diff previews and any remaining documentation debt.
- **Notes:** Runs after code ships but before the PR merges — distinct in timing from `document-generate` (which can run any time to create new docs) and from `ship` (which creates the PR this skill then documents).

#### `land-and-deploy` (skill)

- **Why needed:** Merging a PR is irreversible in a way that "just try it and see" isn't appropriate for — without a structured readiness gate and a rehearsed revert path, a bad merge either ships silently broken or the team scrambles under pressure to figure out how to undo it.
- **What it does:** A one-time setup wizard detects the deploy platform (Fly.io/Render/Vercel/Netlify/GitHub Actions) and persists it to CLAUDE.md; then pre-flight checks CI and merge-conflict state, runs a pre-merge readiness gate (review staleness, test results, PR body accuracy, docs currency) with an explicit confirm/hold-off/override choice, merges, waits for the deploy (polling the platform's status mechanism), verifies production health (HTTP status, content, console errors, screenshot evidence), and offers revert as the escape hatch at every failure point.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no readiness-gate concept before an irreversible merge, no persisted per-project deploy configuration to poll against, and no built-in revert playbook — asking it to "merge and deploy this" without this skill means each of those steps is invented fresh (or skipped) every time.
- **When to use:** "Use when asked to 'land', 'merge and deploy', 'deploy this PR', or 'take this to production'."
- **Then what:** A LAND & DEPLOY REPORT with merge SHA, timing breakdown, review/CI/deploy/verification status, and a final verdict (DEPLOYED AND VERIFIED / DEPLOYED UNVERIFIED / STAGING VERIFIED / REVERTED).
- **Notes:** Explicitly picks up "where `/ship` left off" — `ship` creates the PR, this skill merges it and verifies the deploy; GitLab/unknown platforms are explicitly out of scope (it stops and hands off to manual merge).

#### `ship` (skill)

- **Why needed:** Preparing a branch for merge involves many easy-to-skip steps (merging the base branch before testing, auditing test coverage against what actually changed, checking plan completion, reviewing the diff, bumping version, writing the CHANGELOG, splitting bisectable commits) that under time pressure get abbreviated or skipped entirely.
- **What it does:** A fully non-interactive, fully automated pipeline: merge base → run tests with in-branch-vs-pre-existing failure triage → trace every changed codepath for test coverage gaps and generate missing tests → audit plan completion against actual diff evidence → adversarial pre-landing review with auto-fix of mechanical findings → auto-decide version bump (asking only for MINOR/MAJOR) → auto-generate CHANGELOG from the full commit history → split changes into bisectable, dependency-ordered commits → re-verify with fresh test output → push → create/update the PR with a fully regenerated body.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no default habit of tracing every changed codepath for coverage gaps, classifying test failures as in-branch vs. pre-existing before deciding whether to block, or splitting a changeset into deliberately bisectable commits — each of these is a specific engineering discipline this skill encodes as a mandatory, non-skippable step.
- **When to use:** "Use when asked to 'ship', 'ship it', 'create a PR', or 'prepare this branch for merge'."
- **Then what:** A pushed branch with bisectable commits, an updated VERSION/CHANGELOG, and a created or updated PR whose body contains the summary, test-coverage diagram, pre-landing review findings, plan-completion checklist, and test plan — the user's next view is the PR URL.
- **Notes:** Feeds directly into `land-and-deploy` (which merges the PR this skill creates) and shares its "never skip tests, never force push" discipline with `finishing-a-development-branch`'s test-verification gate.

#### `doc-classifier` (agent)

- **Why needed:** Ingesting a pile of planning documents (ADRs, PRDs, specs, general docs) needs each one correctly typed before synthesis — misclassifying a PRD as a generic DOC means its requirements silently never reach REQUIREMENTS.md, and misclassifying a Proposed ADR as locked would incorrectly freeze a decision that was never finalized.
- **What it does:** Reads one assigned document, applies filename/path heuristics plus frontmatter and content signals (Decision/Consequences sections → ADR; user stories/acceptance criteria → PRD; endpoint/schema tables → SPEC; prose-only → DOC) to classify it as ADR/PRD/SPEC/DOC/UNKNOWN with a confidence level, extracts title/summary/scope/cross-references, and writes one JSON classification file.
- **Why not vanilla Claude Code:** Vanilla Claude Code skimming a folder of mixed planning documents has no standing taxonomy or precedence-aware classification heuristic — it would need to be told, for every single document, what type it is and why, rather than applying this agent's consistent signal-based rules.
- **When to use:** Dispatched in parallel (one agent per document) by the orchestrator/pipeline during doc ingestion.
- **Then what:** One JSON classification file written per document (title, type, confidence, scope, cross_refs, locked status) plus a one-line confirmation — no document content or JSON is echoed back to the orchestrator.
- **Notes:** Deliberately narrow — it does not read a document's transitive references, only classifies the one file it was assigned; its output feeds `doc-synthesizer` directly.

#### `doc-synthesizer` (agent)

- **Why needed:** Merging classified documents into one coherent context risks silently picking a "winner" when two locked architecture decisions genuinely contradict, or quietly merging two PRDs' different acceptance criteria into a blended requirement that satisfies neither original intent.
- **What it does:** Consumes all classifiers' JSON output, runs cycle detection on the cross-reference graph, extracts per-type intel (decisions/requirements/constraints/context) with source attribution, applies precedence rules (ADR > SPEC > PRD > DOC, with LOCKED ADRs never auto-overridable), and writes a three-bucket INGEST-CONFLICTS.md (auto-resolved / competing-variants / unresolved-blockers) plus a SYNTHESIS.md summary.
- **Why not vanilla Claude Code:** Vanilla Claude Code merging a folder of planning docs would tend to pick a plausible-sounding synthesis when sources conflict, rather than hard-blocking on LOCKED-vs-LOCKED contradictions or preserving all variants of competing PRD acceptance criteria for the user to resolve — this agent's precedence rules and bucketed conflict report exist specifically to prevent that silent overwrite.
- **When to use:** Dispatched by the orchestrator/pipeline after all `doc-classifier` agents have completed.
- **Then what:** Per-type intel files (`decisions.md`, `requirements.md`, `constraints.md`, `context.md`) plus `INGEST-CONFLICTS.md` and `SYNTHESIS.md`, with a status of READY / AWAITING USER / BLOCKED depending on whether conflicts exist.
- **Notes:** Explicitly does not write PROJECT.md, REQUIREMENTS.md, or ROADMAP.md — those are downstream `roadmapper` outputs built from this agent's synthesis.

#### `doc-verifier` (agent)

- **Why needed:** Generated or hand-written documentation makes checkable factual claims (file paths, npm scripts, API endpoints, function names, dependencies) that silently go stale as the codebase evolves, and nothing catches the drift unless someone actually re-verifies each claim against the filesystem.
- **What it does:** Extracts five categories of checkable claims line-by-line from a doc (file paths, commands, API endpoints, function/export names, dependencies), applies skip rules for placeholders/examples/quoted prose, verifies each purely via Read/Grep/Glob (never executing anything from the doc), and writes a structured per-doc JSON result with PASS/FAIL/UNVERIFIABLE counts and exact failure details.
- **Why not vanilla Claude Code:** Vanilla Claude Code reading a doc has no systematic claim-extraction taxonomy or hard rule against ever executing doc-embedded commands during verification — it might spot-check a few obvious things but wouldn't line-by-line extract and verify every file path, command, and function reference the way this agent's five-category process does.
- **When to use:** Dispatched by the orchestrator/pipeline (docs-update workflow) once per doc file needing verification.
- **Then what:** A JSON result file (`verify-{doc}.json`) with claims_checked/passed/failed counts and a failures array citing line, claim, expected, and actual — plus a one-line confirmation to the orchestrator.
- **Notes:** Strictly read-only with respect to the doc itself and never executes any command extracted from doc content, even to "just check" it works.

#### `health-reporter` (agent)

- **Why needed:** Type errors, lint warnings, test failures, dead code, and shell-script issues each get checked separately (if at all) with no single composite signal of "how healthy is this codebase right now, and is that trending up or down."
- **What it does:** Auto-detects (or reads from CLAUDE.md) the project's own type checker/linter/test runner/dead-code detector/shell linter, runs each, scores every category 0-10 against a fixed rubric, computes a weighted composite, persists a JSONL history entry, and reports a trend (with per-category deltas) plus impact-ranked recommendations.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing weighted-composite scoring rubric or persisted trend history across runs — asking "how healthy is this codebase" would get an unstructured, non-comparable answer each time rather than this agent's consistent 0-10 dashboard with week-over-week tracking.
- **When to use:** "Use to produce a codebase quality dashboard" — wraps the project's own tools rather than substituting its own analysis. Also backs the `/health` command.
- **Then what:** A dashboard table (category/tool/score/status/duration/details), a composite score, an appended `.context/health-history.jsonl` entry, and ranked recommendations with the exact command to run for each below-10 category.
- **Notes:** Hard-gated to read-only — it reports and recommends but never fixes anything itself, leaving remediation to the user or another agent.

#### `retro` (agent)

- **Why needed:** Engineering velocity, focus, and team health are visible in git history but nobody manually mines commit timestamps, PR sizes, test-file ratios, and per-author patterns into a coherent retrospective on a regular cadence.
- **What it does:** Gathers commit/session/hotspot/PR data over a configurable window (default 7 days, or `24h`/`14d`/`30d`/`compare`) with a freshness pre-flight guard, computes velocity and per-author metrics (crediting AI-assisted commits separately from human co-authors), analyzes time distribution, session patterns, commit-type mix, hotspots, and PR-size distribution, tracks trends against saved snapshots, and produces a narrative with team-aware praise-plus-one-growth-opportunity per contributor.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no persisted retrospective snapshot mechanism or session-detection heuristic (45-minute gap threshold, deep/medium/micro classification) — generating a comparable week-over-week retrospective would require re-deriving this entire analysis method from scratch every time.
- **When to use:** "Use to generate a periodic engineering retrospective from git history." Also backs the `/retro` command.
- **Then what:** A narrative retrospective (tweetable summary, metrics table, trends vs. last retro, per-contributor breakdown, team wins/improvements/habits) plus a saved JSON snapshot under `.context/retros/` for the next run to compare against.
- **Notes:** Strictly read-only — it reports on history, it never changes code; treats AI-assisted commits as a distinct tracked metric rather than crediting them as a team member.

#### `incident-responder` (agent)

- **Why needed:** An active production incident (breach, outage, degradation, data incident) needs immediate, disciplined triage-contain-diagnose-recover-postmortem handling — improvised response under pressure risks destroying forensic evidence or missing the actual blast radius.
- **What it does:** Classifies incident type and severity, contains with the least-collateral-damage action available (isolate, revoke, reroute, rollback, feature-disable, scale), preserves evidence before further action (especially for security incidents), diagnoses via metrics/logs/tracing and timeline reconstruction, recovers and validates (service health, data integrity, security posture), and produces a blameless postmortem within 48 hours with five-whys root cause and owned action items.
- **Why not vanilla Claude Code:** Vanilla Claude Code has no standing incident-response playbook prioritizing evidence preservation before remediation, nor a structured severity classification and communication cadence — under live-incident pressure it would need this exact sequence spelled out each time rather than invoking a pre-built responder.
- **When to use:** "Use when an active production incident is underway — security breach, service outage, performance degradation, or data incident."
- **Then what:** A running status log during the incident, followed by a blameless postmortem report and a prioritized, owned action-item list addressing monitoring gaps, runbook additions, and prevention.
- **Notes:** For incidents with regulatory exposure (breach notification deadlines), it explicitly hands off to the `compliance-auditor` agent for framework-specific obligations.

#### `performance-engineer` (agent)

- **Why needed:** Performance problems get "optimized" on hunches (guessing which function is slow) without measuring first, which wastes effort on the wrong bottleneck and leaves no before/after evidence that the fix actually helped.
- **What it does:** Establishes SLAs/targets and current metrics, measures the baseline and profiles the running system, identifies bottlenecks systematically across CPU/memory/I/O/network/DB/cache/lock-contention, designs load/stress/spike/soak tests, optimizes the single biggest bottleneck at a time and re-measures before moving to the next, and reports validated before/after deltas.
- **Why not vanilla Claude Code:** Vanilla Claude Code asked to "make this faster" has no default requirement to measure a baseline before changing anything, and no systematic bottleneck taxonomy (N+1 queries, pool exhaustion, synchronous blocking) — "measure first, never optimize on a hunch" is this agent's explicit, otherwise-easy-to-skip discipline.
- **When to use:** "Use to identify and eliminate performance bottlenecks in applications, databases, or infrastructure, and when baseline metrics need improvement."
- **Then what:** A report with baseline-vs-after numbers (response time, throughput, resource use), the bottlenecks found, the fixes applied, validation evidence, and capacity-planning/monitoring-threshold notes so gains don't silently regress.
- **Notes:** Explicitly measurement-driven — every optimization claim in its output must be backed by a before/after number, the same evidence-before-assertion principle `verification-before-completion` enforces for engineering work generally.

#### `health` (command)

- **Why needed:** Producing the codebase quality dashboard should be a single command rather than requiring the user to know the `health-reporter` agent exists or how it auto-detects the project's tools.
- **What it does:** `$ARGUMENTS` is unused — the agent auto-detects the project's health stack (or reads a `## Health Stack` section from CLAUDE.md) — and dispatches `agents/health-reporter`.
- **Why not vanilla Claude Code:** Without this command, getting a consistent weighted-composite quality score requires explicitly invoking the health-reporter agent by name; the command makes it a memorable, zero-argument trigger.
- **When to use:** Any time a snapshot of type-check/lint/test/dead-code/shell-lint health and its trend is wanted.
- **Then what:** A weighted 0-10 quality dashboard with per-category scores, the trend vs. prior runs, and impact-ranked recommendations — read-only, no fixes applied.

#### `retro` (command)

- **Why needed:** Generating a periodic engineering retrospective should be a single command with an easy way to specify the time window, rather than requiring the user to invoke the `retro` agent directly with the right parameters.
- **What it does:** Parses `$ARGUMENTS` for an optional window (`24h`, `14d`, `30d`) or `compare` (default: last 7 days) and dispatches the `retro` agent with that window.
- **Why not vanilla Claude Code:** Without this command, producing a comparable retrospective each time requires re-explaining the desired window and metrics; the command locks in the `retro` agent's full analysis as a one-line invocation with a simple window argument.
- **When to use:** At the end of a sprint/week, or any time a velocity and team-health snapshot is wanted against the last saved baseline.
- **Then what:** A retrospective report — velocity, session patterns, per-contributor analysis, and trends vs. the last saved snapshot.
