# dev-kit Workflow Recommendations

Two things: the capability-level homing table with **Workflow** as an explicit 5th
option (§1), and a full asset sweep flagging which dev-kit skills/agents/commands should
generate or invoke a real Workflow script (§2). Only items needing a change are listed.

> **Provenance & currency (2026-07-22).** §1 originates in the full analysis in
> `docs/gwd-pipeline-gap-analysis.md` (kept as-is as the audit trail; its own §2-equivalent
> asset sweep is **superseded** by the sweep below). §2 here is a **fresh, full re-sweep of
> all 190 current assets** run against their *rewritten* on-disk prose — necessary because
> the lane plugins (specialized, infra, product) and parts of core/data-ai were natively
> rewritten after the original analysis, invalidating the old per-asset flags. Counts are
> now reconciled to the live repo: **190 assets** (141 skills + 41 agents + 8 commands;
> `dev-kit-core` = 49 skills + 37 agents + 8 commands = 94, lanes = 96). The former
> `code-reviewer` and `gate-codex-round` agents are merged into `code-review-gate` (its own
> description states it "supersedes" both); the surviving `skills/code-review-protocol/code-reviewer.md`
> is a prompt-template reference inside that skill, not the retired agent. `feature-forge`,
> `first-principles-thinking`, and `clarify` were folded into `specify`/`spec-review-cpo`.

**Homes used below:** **Workflow** (bounded, deterministic, single-invocation multi-agent
script — `agent()`/`parallel()`/`pipeline()`/`phase()`, worktree isolation, token budgets;
no live user Q&A mid-run, nothing survives a `/clear` on its own) · **Orchestration**
(the not-yet-built, persistent, cross-session, mode-governed sequencer that decides *when*
to invoke a Workflow/Agent/Skill, and survives context resets via file-based state) ·
**Agent/Skill** (methodology living inside dev-kit) · **Hooks** (a `.claude/hooks/`
lifecycle layer dev-kit could add) · **Skip**.

---

## 1. Capability table — GWD-gap capabilities, final recommended homes

| # | Capability | Home | Why |
|---|---|---|---|
| 1 | Macro step sequencing & mode governance (step table, phase-gating, auto/manual/sleep, context boundaries, decision-point registry, canonical walkthrough) | **Orchestration** | This *is* the sequencer's job — dev-kit supplies the skills it calls, not the call order |
| 2 | Layered context/doc architecture (thin always-loaded contract + on-demand sub-docs) | **Orchestration** | A per-project contract the pipeline scaffolds, not something dev-kit's plugins carry |
| 3 | Upstream source/version pinning ledger | **Orchestration** | Tracks the pipeline's own dependency versions; dev-kit's `dependency-manager` agent already covers code deps, not skill-library versions |
| 4 | Multi-level requirement hierarchy (Theme→Pillar→Story-bank, global US-xxx) | **Agent/Skill** ✅ DONE | `specify` allocates global, never-renumbered `US-xxx` IDs with an optional Pillar field; `roadmapper` parses Theme→Pillar→US-xxx and keys coverage/traceability on it when present |
| 5 | Vertical-slice enforcement (never horizontal-layer phases) | **Agent/Skill** ✅ DONE | `references/vertical-slice.md` is the canonical definition + acceptance test; `roadmapper.md`'s prose is now a hard gate alongside the coverage gate |
| 6 | Wave/track parallel dispatch + worktree isolation (GWD step 12) | **Workflow** | `pipeline()`/`parallel()` + `isolation:'worktree'` almost verbatim — `sprint-execution`/`bugfix-wave` already hand-roll this in prose today (confirmed still true in §2) |
| 7 | Adversarial review ↔ fix loop, ≤6 iterations (GWD step 13) | **Workflow** | Textbook loop-until-count/dry pattern — a plain `while` calling `agent()`. The per-round reviewer (`code-review-gate` round mode) is a single-round leaf; the ≤6 loop that dispatches it belongs to this Workflow/orchestrator, not the agent — see §2 note on leaf workers |
| 8 | Deterministic model/effort scoring — the band/floor math | **Workflow** | Arithmetic on bounded factors — real JS computes it deterministically, no external `.mjs` CLI needed |
| 9 | Deterministic model/effort scoring — what signals to extract | **Agent/Skill** ✅ DONE | `references/complexity-signals.md` is the canonical vocabulary; `planner` emits per-task `complexity_signals`, `writing-plans` has a mandatory Signals: block — both feed the still-open Workflow half (row 8) |
| 10 | Telemetry + defect-attribution + calibration-proposal computation | **Workflow** | The matching/attribution logic is plain JS over structured agent outputs — one-shot computation |
| 11 | Telemetry — persisting calibration state across sprints/sessions | **Orchestration** | Long-lived state carried across many separate sessions over the project's life |
| 12 | Tiered state persistence (hot resume-head / phase-boundary state / on-demand journal) | **Orchestration** (+ Hook to surface) | Defines the state-file contract first; a Hook can auto-surface it at SessionStart once it exists |
| 13 | Append-only execution journal | **Orchestration** | Part of the state contract above |
| 14 | Self-update / freshness check | **Skip** | Solves an npm-install problem dev-kit doesn't have — the plugin marketplace already handles updates |
| 15 | Context-budget awareness warning | **Hooks** | Generically useful, zero GWD-specific dependency — good to add now |
| 16 | Content-safety scanning (prompt-injection / invisible-unicode) | **Hooks** | Broadly useful regardless of pipeline status — strongest general-purpose candidate |
| 17 | Commit-message convention enforcement | **Hooks** | Generically useful, low risk, optional |
| 18 | Custom statusline (model/phase/context visibility) | **Hooks/settings** | Nice-to-have; only meaningful once dev-kit has an actual phase/state concept |
| 19 | Knowledge-graph freshness nudges (hint before search, update after merge) | **Hooks** | Reinforces the `graphify` skill dev-kit already ships — the hint hook needs zero changes, the update hook needs one gate removed |
| 20 | State-file sync nudges (remind to update STATE.md, print at session start) | **Hooks** | Depends on #12 — only wire once dev-kit has an enforced (not just templated) `STATE.md` convention |
| 21 | External knowledge-base sync (Obsidian vault ingest/save + kill switches) | **Hooks** (optional) | Only worth it if dev-kit takes a real dependency on the external `claude-obsidian` plugin |
| 22 | Independent (non-Claude) review bridge — the dispatch/retry loop | **Workflow** | An agent stage with Bash access shelling out to the external CLI fits a Workflow stage's retry/loop control |
| 23 | Independent (non-Claude) review bridge — the generic rule | **Agent/Skill** ✅ DONE | `references/independent-review.md` is the engine registry (claude/gemini/codex/cursor/antigravity, default-per-role, fallback order) with one adapter file per engine under `references/review-engines/`; `gate-plan-review.md` and the merged `code-review-gate.md` select from it by engine name instead of hardcoding a single vendor plugin |
| 24 | New-repo scaffolding (lint/tsconfig templates, bootstrap/adopt/audit scripts, kickoff/adoption guides) | **Agent/Skill/Command** (not Workflow, not built) | Needs live user Q&A (lane selection, clarifying questions) mid-flow — Workflow has no interactive back-and-forth; dev-kit also has no scaffolding surface at all today |

**Tally:** 6 Orchestration-only, 6 Agent/Skill, 5 Workflow, 6 Hooks, 1 Skip (some
capabilities split across two homes, so this sums to more than 24). All "✅ DONE" rows
re-verified 2026-07-22 against the live repo — every cited reference file exists and the
named assets wire to it.

### Recommended skill changes this implies (concrete, buildable today)

1. **`sprint-execution` / `bugfix-wave`** — generate/invoke an actual Workflow script
   (`pipeline()`/`parallel()` with `isolation:'worktree'`) for wave/track dispatch instead
   of prose "make these calls yourself" instructions. **Still the two prime targets** — the
   §2 re-sweep confirms both remain hand-rolled orchestrator prose today.
2. **The ≤6-round adversarial loop** (GWD step 13 / row 7) — express the loop as a Workflow
   `while` calling `code-review-gate` (round mode) once per round and checking `stop_loop`.
   Note the seam: `code-review-gate` itself is now a correct **single-round leaf** (it
   reviews one round and emits `next_action`/`stop_loop` JSON); the loop that re-invokes it
   belongs to the Workflow/orchestrator, **not** to the agent. So the buildable change is a
   new orchestrating Workflow script, not an edit to `code-review-gate`.
3. **`planner`** — add a companion pattern: an agent stage extracts complexity signals as
   structured output, a Workflow script's plain JS computes the deterministic model/effort
   bands — closing the gap with `gate-plan-review`/`sprint-execution`, which already know
   how to *consume* a complexity-score signal but have nothing producing one.
4. ✅ **DONE** — **`gate-plan-review`** generalized the hardcoded single-vendor
   independence check to engine selection via `references/independent-review.md` (default
   Gemini, fallback order Gemini → Codex → Claude), with per-engine binding adapters under
   `references/review-engines/`. A Workflow `agent()` stage with Bash access remains one
   valid way to host that dispatch/retry loop, not the only one — still open for a future
   Workflow-script pass.

---

## 2. Workflow-candidate sweep — all 190 dev-kit assets (2026-07-22 re-sweep)

Every `SKILL.md`, agent, and command across all 8 plugins (49 core skills, 37 core agents,
8 core commands, 26 backend, 11 web, 4 mobile, 13 data-ai skills + 4 data-ai agents, 14
infra, 19 specialized, 5 product = **190 files**) was re-read against its **current** prose
and classified by whether that prose issues, as a first-class operational instruction, one
of three Workflow shapes:

1. **Fan-out** — parallel dispatch of N independent subagents over a data-driven, variable-size list, then aggregate → `parallel()`/`pipeline()`.
2. **Bounded-loop** — an iterative loop with a hard, deterministic exit condition → a `while` calling `agent()`.
3. **Dependent-pipeline** — stages where a later stage must not begin until an earlier one completes, for correctness → `phase()`/`pipeline()`.

**Unit-of-analysis rule (this is what changed most from the prior sweep):** each file is
judged on **its own text**. An agent that is *dispatched* N-wide by an orchestrator is a
**leaf worker** — the fan-out/loop lives in the *caller*, not in the agent's file. In
dev-kit that caller is almost always the not-yet-built pipeline (§1), so leaf agents are
`no-change` here even though they participate in a Workflow shape upstream.

### Result

**11 of 190 flagged — 5 Workflow, 6 Agent-only. 179 need no change.**

- **All 11 flagged assets are in `dev-kit-core`.** Every one of the 96 lane assets
  (backend, web, mobile, data-ai, infra, specialized, product) is now `no-change`: the
  native rewrites turned them into single-agent linear methodologies with no fan-out/loop/
  pipeline shape. The lanes are, as a body, not Workflow surface.
- No **new** Workflow candidates emerged from the rewrites; the only newly-surfaced flag is
  `design-html` (agent-only). The rewrites only *removed* shapes.

### Flagged **Workflow** (5) — hand-rolled orchestration that a Workflow script should own

| Asset | Kind | Shape | Mechanism | Current-text evidence |
|---|---|---|---|---|
| `bugfix-wave` | skill | fan-out + pipeline | `parallel()` per-wave track dispatch w/ `isolation:'worktree'`; `phase()` wave-N-before-N+1 gate | "Group into tracks… Wave 1: tracks with no dependencies… Wave N: tracks depending on Wave N-1", "single message with multiple Agent tool" calls |
| `sprint-execution` | skill | fan-out + pipeline | `parallel()`/`pipeline()` per-wave fan-out in worktrees; `phase()` wave gate | "Dispatch one subagent per track within a wave, each with worktree isolation" + "must not start Wave N+1 until all Wave N subagents have returned and their worktrees are merged" |
| `graphify` | skill | fan-out + pipeline | `parallel()` chunked subagent fan-out; `phase()` Detect→Extract→Merge→Cluster | Step 3B: "Call the Agent tool multiple times IN THE SAME RESPONSE — one call per chunk… the only way they run in parallel"; chunk count is data-driven |
| `ship` | skill | dependent-pipeline + bounded-loop | `phase()`/`pipeline()` for Steps 0–13; a bounded `while` for the coverage-gate + verification-gate retries | Ordered Steps 0–13 that must not begin before the prior completes ("Merge base BEFORE tests", "Run tests on merged code", Step 11 Verification Gate looping failures back) |
| `plan-review` | command | fan-out | `parallel()` one `plan-reviewer` per lens, then consolidate | "Dispatch `agents/plan-reviewer` once per selected lens, in parallel… consolidated into a single set of findings" (default all 4 lenses) |

### Flagged **Agent-only** (6) — real fan-out, but small/ad-hoc or human-in-loop; a plain Agent/Task dispatch fits better than a full Workflow

| Asset | Kind | Shape | Why agent-only, not Workflow |
|---|---|---|---|
| `cso` | skill | fan-out | Verification subagent per candidate finding with a confidence-gate discard — genuine data-driven fan-out, but no worktree/wave/budget machinery needed |
| `design-consultation` | skill | fan-out | Shotgun mode: one subagent per variant (3–8) writing independent files, then a comparison board — small fan-out + simple aggregation |
| `dispatching-parallel-agents` | skill | fan-out | Explicitly the **no-worktree, no-ceremony** variant for ad-hoc mid-session parallel Task dispatch; self-scopes heavier machinery to other skills |
| `plan-reviewer` | agent | fan-out | Says "Dispatch N of these in parallel (one per lens)" — but over a fixed 4-lens set; the operational fan-out really belongs to the `plan-review` command (which *is* flagged Workflow). Leaf-ish |
| `specify` | skill | fan-out | Optional pre-discovery via a couple of parallel Task subagents for multi-domain features — framed as an accelerant, not core methodology |
| `design-html` | skill | (human-loop) | Single subagent dispatch + a "Maximum 10 iterations" refinement loop whose exit condition is the **user saying "done"** — live mid-run Q&A a Workflow cannot host. Agent-only for the dispatch's context isolation only |

### What changed vs. the prior sweep (30 flagged → 11) and why

The original sweep flagged **29 Workflow + 1 Agent-only**. The reduction is real and has
three distinct, legitimate causes — not a defect in either analysis:

- **A. Content rewrites (8 drops).** The lane skills the prior sweep flagged were natively
  rewritten into single-agent linear methodologies; their old fan-out/gated-pipeline prose
  is gone. Dropped to `no-change`: `legacy-modernizer`, `chaos-engineer`, `sre-engineer`,
  `devops-engineer`, `cloud-architect`, `terraform-engineer`, `microsoft-ops`,
  `license-engineer`.
- **B. Leaf-worker vs. orchestrator (5 reclassifications).** The prior sweep flagged
  agent-definition files by their *role* in a fan-out pattern; this sweep judges each file's
  own text, and these are leaf workers whose fan-out/loop lives in the caller (the future
  pipeline, i.e. §1): `doc-classifier`, `doc-synthesizer`, `research-synthesizer`,
  `codebase-mapper` → `no-change`; `code-review-gate` (round mode) → `no-change` (its ≤6
  loop is §1 row 7); `plan-reviewer` → `agent-only` (its fan-out owner, `plan-review`, is
  the flagged Workflow).
- **C. Single-agent bounded loops (4 drops).** These have a genuine hard-capped loop but the
  **same agent iterates in its own context** rather than dispatching `agent()` per item, so
  under a strict multi-agent-shape reading they are `no-change`: `qa` (hard cap 50 fixes,
  self-regulate every 5), `design-reviewer` (cap 30), `nyquist-auditor` (per-gap, max-3
  debug), `gate-automation` (per-flow authoring). **Future note:** each *could* be
  restructured into a `bugfix-wave`-style parallel Workflow — that is a design opportunity,
  not a property of the current text.

### Tally

- **11 flagged** — all in `dev-kit-core`. Workflow (5): `bugfix-wave`, `sprint-execution`, `graphify`, `ship` (skills) + `plan-review` (command). Agent-only (6): `cso`, `design-consultation`, `dispatching-parallel-agents`, `design-html`, `specify` (skills) + `plan-reviewer` (agent).
- **179 need no change** — 83 of 94 core assets + all 96 lane assets.
- **0 flagged Hooks/Orchestrator** — those homes apply to the GWD-gap capabilities in §1,
  not to any of dev-kit's own existing assets.

_Sweep method: 21 parallel classifier agents (Sonnet — high effort on core, medium on
lanes) each read the full current prose of an asset batch and returned a structured verdict
with cited evidence; 190/190 classified, 0 errors._
