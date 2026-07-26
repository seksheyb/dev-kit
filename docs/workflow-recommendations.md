# dev-kit Pipeline Capability Table

Working note — **not shipped, delete when the pipeline is built.** The 190-asset Workflow
sweep that used to live here is closed (3 routes built: `bugfix-wave`, `sprint-execution`,
`plan-review`; nothing left to convert) and has been removed. What remains is the
capability table: GWD-gap capabilities and where each one belongs.

**Still open:** rows 1, 2, 3, 11, 12, 13 (Orchestration — the pipeline itself) ·
rows 7, 8, 10, 22 (Workflow scripts, none written) · rows 15–21 (Hooks, no
`.claude/hooks/` layer exists) · row 24 (no scaffolding surface).
**Done and verified 2026-07-26:** rows 4, 5, 6, 9, 23. Row 14 is Skip.

**Homes:** **Workflow** (bounded, deterministic, single-invocation multi-agent script —
`agent()`/`parallel()`/`pipeline()`/`phase()`, worktree isolation, token budgets; no live
user Q&A mid-run, nothing survives a `/clear` on its own) · **Orchestration** (the
not-yet-built, persistent, cross-session, mode-governed sequencer that decides *when* to
invoke a Workflow/Agent/Skill, and survives context resets via file-based state) ·
**Agent/Skill** (methodology living inside dev-kit) · **Hooks** (a `.claude/hooks/`
lifecycle layer dev-kit could add) · **Skip**.

| # | Capability | Home | Why |
|---|---|---|---|
| 1 | Macro step sequencing & mode governance (step table, phase-gating, auto/manual/sleep, context boundaries, decision-point registry, canonical walkthrough) | **Orchestration** | This *is* the sequencer's job — dev-kit supplies the skills it calls, not the call order |
| 2 | Layered context/doc architecture (thin always-loaded contract + on-demand sub-docs) | **Orchestration** | A per-project contract the pipeline scaffolds, not something dev-kit's plugins carry |
| 3 | Upstream source/version pinning ledger | **Orchestration** | Tracks the pipeline's own dependency versions; dev-kit's `dependency-manager` agent already covers code deps, not skill-library versions |
| 4 | Multi-level requirement hierarchy (Theme→Pillar→Story-bank, global US-xxx) | **Agent/Skill** ✅ DONE | `specify` allocates global, never-renumbered `US-xxx` IDs with an optional Pillar field; `roadmapper` parses Theme→Pillar→US-xxx and keys coverage/traceability on it when present |
| 5 | Vertical-slice enforcement (never horizontal-layer phases) | **Agent/Skill** ✅ DONE | `references/vertical-slice.md` is the canonical definition + acceptance test; `roadmapper.md`'s prose is now a hard gate alongside the coverage gate |
| 6 | Wave/track parallel dispatch + worktree isolation (GWD step 12) | **Workflow** ✅ DONE | Built 2026-07-26: `references/workflows/{bugfix-wave,sprint-execution}.workflow.mjs` — `parallel()` + `isolation:'worktree'` per track, `phase()` as the wave gate. Both skills invoke the script instead of hand-rolling dispatch in prose. **Constraints found while building, still true for any new script:** scripts cannot touch git or the filesystem (merges, cleanup, state writes stay in the orchestrator's turn); no mid-run interactivity, so a user checkpoint cannot live inside a script; `sprint-execution` is one wave per run because merge is orchestrator-owned; the concurrent-worktree `.git/config.lock` race is a hypothesis, unmeasured; `node --check` is the wrong validator (the runtime strips `export const meta` and wraps the body in an async fn, so top-level `await`/`return` falsely fails) |
| 7 | Adversarial review ↔ fix loop, ≤6 iterations (GWD step 13) | **Workflow** | Textbook loop-until-count/dry pattern — a plain `while` calling `agent()`. `code-review-gate` (round mode) is a correct **single-round leaf** emitting `next_action`/`stop_loop`; the ≤6 loop that re-invokes it belongs to this new Workflow script, **not** to the agent — so this is a new file, not an edit |
| 8 | Deterministic model/effort scoring — the band/floor math | **Workflow** | Arithmetic on bounded factors — real JS computes it deterministically, no external `.mjs` CLI needed. Producer half is live (row 9) |
| 9 | Deterministic model/effort scoring — what signals to extract | **Agent/Skill** ✅ DONE | `references/complexity-signals.md` is the canonical vocabulary; `planner` emits per-task `complexity_signals`, `writing-plans` has a mandatory Signals: block — both feed the still-open Workflow half (row 8) |
| 10 | Telemetry + defect-attribution + calibration-proposal computation | **Workflow** | The matching/attribution logic is plain JS over structured agent outputs — one-shot computation. **Blocked:** no telemetry producer exists anywhere in dev-kit today (scattered "calibration" mentions are vocabulary, not emitted data), so row 11 has to land first |
| 11 | Telemetry — persisting calibration state across sprints/sessions | **Orchestration** | Long-lived state carried across many separate sessions over the project's life. Gates row 10 |
| 12 | Tiered state persistence (hot resume-head / phase-boundary state / on-demand journal) | **Orchestration** (+ Hook to surface) | Defines the state-file contract first; a Hook can auto-surface it at SessionStart once it exists. Gates rows 20 and 13 |
| 13 | Append-only execution journal | **Orchestration** | Part of the state contract above |
| 14 | Self-update / freshness check | **Skip** | Solves an npm-install problem dev-kit doesn't have — the plugin marketplace already handles updates |
| 15 | Context-budget awareness warning | **Hooks** | Generically useful, zero GWD-specific dependency — good to add now |
| 16 | Content-safety scanning (prompt-injection / invisible-unicode) | **Hooks** | Broadly useful regardless of pipeline status — strongest general-purpose candidate |
| 17 | Commit-message convention enforcement | **Hooks** | Generically useful, low risk, optional |
| 18 | Custom statusline (model/phase/context visibility) | **Hooks/settings** | Nice-to-have; only meaningful once dev-kit has an actual phase/state concept (row 12) |
| 19 | Knowledge-graph freshness nudges (hint before search, update after merge) | **Hooks** | Reinforces the `graphify` skill dev-kit already ships — the hint hook needs zero changes, the update hook needs one gate removed |
| 20 | State-file sync nudges (remind to update STATE.md, print at session start) | **Hooks** | Depends on row 12 — only wire once dev-kit has an enforced (not just templated) `STATE.md` convention |
| 21 | External knowledge-base sync (Obsidian vault ingest/save + kill switches) | **Hooks** (optional) | Only worth it if dev-kit takes a real dependency on the external `claude-obsidian` plugin |
| 22 | Independent (non-Claude) review bridge — the dispatch/retry loop | **Workflow** | An agent stage with Bash access shelling out to the external CLI fits a Workflow stage's retry/loop control. Engine selection itself is done (row 23); only the loop around it is still prose |
| 23 | Independent (non-Claude) review bridge — the generic rule | **Agent/Skill** ✅ DONE | `references/independent-review.md` is the engine registry (claude/gemini/codex/cursor/antigravity, default-per-role, fallback order) with one adapter file per engine under `references/review-engines/`; `gate-plan-review.md` and the merged `code-review-gate.md` select from it by engine name instead of hardcoding a single vendor plugin |
| 24 | New-repo scaffolding (lint/tsconfig templates, bootstrap/adopt/audit scripts, kickoff/adoption guides) | **Agent/Skill/Command** (not Workflow, not built) | Needs live user Q&A (lane selection, clarifying questions) mid-flow — Workflow has no interactive back-and-forth; dev-kit also has no scaffolding surface at all today |

**Tally:** 6 Orchestration-only, 6 Agent/Skill, 5 Workflow, 6 Hooks, 1 Skip (some
capabilities split across two homes, so this sums to more than 24).

Full origin analysis: [`docs/gwd-pipeline-gap-analysis.md`](gwd-pipeline-gap-analysis.md).
Stage-by-stage pipeline walkthrough: [`docs/gwd-pipeline-on-devkit.md`](gwd-pipeline-on-devkit.md).
