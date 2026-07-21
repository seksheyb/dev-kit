# dev-kit Workflow Recommendations

Two things, extracted from the full analysis in `docs/gwd-pipeline-gap-analysis.md` (kept
as-is for the complete audit trail — it reflects the 193-asset count at the time of that
analysis; §2 below has been updated to the current 192-asset count after `code-reviewer`
and `gate-codex-round` merged into `code-review-gate`): the capability-level homing table
with **Workflow** as an explicit 5th option, and the full asset sweep flagging which
dev-kit skills/agents/commands should generate/invoke a real Workflow script. Only items
needing a change are listed in both.

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
| 6 | Wave/track parallel dispatch + worktree isolation (GWD step 12) | **Workflow** | `pipeline()`/`parallel()` + `isolation:'worktree'` almost verbatim — `sprint-execution`/`bugfix-wave` already hand-roll this in prose today |
| 7 | Adversarial review ↔ fix loop, ≤6 iterations (GWD step 13) | **Workflow** | Textbook loop-until-count/dry pattern — a plain `while` calling `agent()`, no external state needed |
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
capabilities split across two homes, so this sums to more than 24).

### Recommended skill changes this implies (concrete, buildable today)

1. **`sprint-execution` / `bugfix-wave`** — generate/invoke an actual Workflow script
   (`pipeline()`/`parallel()` with `isolation:'worktree'`) for wave/track dispatch instead
   of prose "make these calls yourself" instructions.
2. **`code-review-gate`** (round mode; formerly `gate-codex-round`, now merged with
   `code-reviewer` — see row 23) — express the ≤6-round adversarial loop as a Workflow
   `while` loop instead of a prose "loop ≤6 times, check majority-refuted" instruction.
3. **`planner`** — add a companion pattern: an agent stage extracts complexity signals as
   structured output, a Workflow script's plain JS computes the deterministic model/effort
   bands — closing the gap with `gate-plan-review`/`sprint-execution`, which already know
   how to *consume* a `complexity-score.mjs`-style signal but have nothing producing one.
4. ✅ **DONE** — **`gate-plan-review`** generalized the hardcoded single-vendor
   independence check to engine selection via `references/independent-review.md` (default
   Gemini, fallback Codex then Claude), with per-engine binding adapters under
   `references/review-engines/`. A Workflow `agent()` stage with Bash access remains
   one valid way to host that dispatch/retry loop, not the only one — still open for a
   future Workflow-script pass.

---

## 2. Workflow-candidate sweep — all 192 dev-kit assets

Every `SKILL.md`, agent, and command file across all 8 plugins (51 core skills, 37 core
agents, 8 core commands, 26 backend, 11 web, 4 mobile, 13+4 data-ai, 14 infra, 19
specialized, 5 product = 192 files — `code-reviewer` and `gate-codex-round` merged into
one `code-review-gate` agent since this count was last taken), checked for: parallel
fan-out over independent items, an iterative loop with a hard exit condition, or a
multi-stage pipeline where later stages depend on earlier ones completing.

**29 of 192 flagged.** The other 163 (162 no-change + `feature-forge` as Agent-only) need
no change — single-agent linear methodology with no fan-out/loop/pipeline shape.

### dev-kit-core skills (9 of 51)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `bugfix-wave` | Classifies bugs into non-conflicting tracks, dependency-ordered waves, parallel subagents per track in worktree isolation | **Workflow** | Textbook `parallel()`+`phase()` — currently hand-rolled in prose |
| `sprint-execution` | Same wave/track/worktree/merge pattern generalized to arbitrary plans | **Workflow** | Matches `parallel()` + worktree isolation + cached resumability directly |
| `graphify` | Chunked N-way parallel extraction with a caching layer, multi-stage pipeline | **Workflow** | Fan-out + cached resumability + dependent stages, currently a long bash-heavy prose script |
| `cso` | Independent verification subagent per candidate finding, gate-scored, aggregated | **Workflow** | Parallel-map-then-reduce over a variable-N finding list |
| `dispatching-parallel-agents` | Entire skill content is prose teaching manual N-way parallel dispatch | **Workflow** | Could generate a small Workflow script instead of re-teaching the technique every time |
| `design-consultation` (Shotgun mode) | 3–8 independent variant-mockup subagents, then a merge/comparison board | **Workflow** | Fan-out-then-aggregate, currently hand-orchestrated |
| `feature-forge` | Multi-domain discovery via Task subagents when a feature spans domains | **Agent** (not full Workflow) | Small/ad-hoc fan-out — needs fresh-context isolation, not worktrees/waves/budget tracking |
| `ship` | 14 sequential gated steps (merge→test→coverage→plan-audit→review→version→changelog→PR) | **Workflow** | Each stage's output gates the next — currently prose trusting one agent to track 14 steps of gate state |
| `land-and-deploy` | Multiple poll-with-hard-timeout loops chained with revert-on-failure branches | **Workflow** | Deterministic loop/exit-condition + `phase()` beats manual re-polling and elapsed-time tracking |

### dev-kit-core agents + commands (12 of 45)

| Name | Type | Trigger | Mechanism | Rationale |
|---|---|---|---|---|
| `plan-review` | Command | Dispatch `plan-reviewer` once per lens, in parallel (up to 5) | **Workflow** | Parallel fan-out + consolidation, currently one prose sentence |
| `plan-reviewer` | Agent | Own description tells its caller to dispatch N in parallel | **Workflow** | That orchestration instruction belongs in a deterministic script, not agent prose |
| `code-review-gate` (round mode) | Agent | Spawned per round of a max-6-round adversarial loop; emits JSON for an external caller to parse and re-invoke | **Workflow** | Loop-up-to-N-with-hard-exit, removes risk of the caller mis-reading `next_action` |
| `gate-automation` | Agent | One golden-path + one edge-case flow per primary flow, done serially | **Workflow** | Each flow is independent — embarrassingly parallel across worktrees |
| `nyquist-auditor` | Agent | Per-gap: generate test, run, debug if failing (max 3), sequentially across all gaps | **Workflow** | Independent items + bounded retry-cap sub-loop |
| `qa` | Agent | Fix loop: one commit per issue in severity order, risk-gate every 5, hard cap 50 | **Workflow** | Same shape as `bugfix-wave` but currently done alone, serially, in one context |
| `design-reviewer` | Agent | Identical fix-loop pattern to `qa`, cap 30 | **Workflow** | Same rationale as `qa` |
| `planner` | Agent | `build_dependency_graph`/`assign_waves` given as literal pseudocode for the LLM to hand-simulate | **Workflow** | Deterministic graph/topo-sort — real JS never mis-orders a large plan set |
| `codebase-mapper` | Agent | Dispatched with one of four independent focus areas, non-overlapping outputs | **Workflow** | Clean `parallel()` fan-out, currently relies on the caller to invoke it 4 times |
| `doc-classifier` | Agent | One classifier per input doc, parallel, feeding a downstream synthesis stage | **Workflow** | Classify→synthesize dependency is a `phase()`/`pipeline()` stage-boundary case |
| `doc-synthesizer` | Agent | Dispatched only after all classifiers complete; cycle detection + conflict resolution | **Workflow** | Correctness depends on a hard stage boundary a `phase()` gate enforces structurally |
| `research-synthesizer` | Agent | Dispatched after 4 parallel researcher agents complete | **Workflow** | Same fan-out-then-synthesize shape as the doc-ingestion pair |

*Checked, not flagged:* `code-review-gate` (single mode — one-shot review, no fan-out/loop), `doc-verifier`, `health-reporter`, `incident-responder`, `retro`, `roadmapper`, `phase-researcher`, `market-researcher`, `debugger` (needs live user interaction — unsuited to Workflow by design), `gate-plan-review`, `gate-reverse-engineer`.

### dev-kit-backend + dev-kit-web (1 of 37)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `legacy-modernizer` | 5-phase gated strangler-fig migration, traffic-increment gates (5%→25%→50%→100%), rollback triggers | **Workflow** | Gated multi-stage pipeline with measurable exit conditions; per-component facades could dispatch via `parallel()` + worktree isolation |

### dev-kit-infra + dev-kit-specialized (7 of 33)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `chaos-engineer` | Game days = N independent per-service experiments, steady-state baseline, blast-radius cap, scripted rollback | **Workflow** | `parallel()` over experiments with per-track abort condition |
| `sre-engineer` | Same SLI/SLO pipeline rolled out per-service across a catalog | **Workflow** | Repeatable per-item pipeline, `phase()`/`parallel()` over a service list |
| `devops-engineer` | Multi-environment staged pipeline with go/no-go gates and rollback-on-failure | **Workflow** | Textbook staged `pipeline()`-with-gates case |
| `cloud-architect` | Wave-based migration: each wave moves workloads in parallel, gated by a checkpoint | **Workflow** | `phase()` (waves) + `parallel()` (workloads per wave) |
| `terraform-engineer` | Explicit re-validate loop with named failure branches | **Workflow** | Iterative loop with hard exit condition ("repeat until clean") |
| `microsoft-ops` | Bulk AD/M365 changes, each needing enumerate→dry-run→apply→verify→rollback | **Workflow** | Fan-out over objects with per-object safety gates |
| `license-engineer` | Classifying potentially hundreds of dependencies for license/copyleft risk | **Workflow** | Classify-many-in-parallel-then-synthesize, same shape as `doc-classifier` |

### dev-kit-mobile + dev-kit-product + dev-kit-data-ai (0 of 26)

No changes. Single-pass build/analysis, or the "loop" is already parallel at the compute
layer inside one script/job (training epochs, embedding batches, Spark partitions) —
fanning those out to separate Claude subagents would add coordination overhead without
parallelizing real work.

### Tally

- **29 flagged for Workflow**: 9 core skills, 12 core agents/commands, 1 backend/web, 7 infra/specialized.
- **1 flagged Agent-only** (`feature-forge`).
- **162 need no change.**
- **0 flagged Hooks/Orchestrator** — those homes apply to the GWD-gap capabilities in
  section 1, not to any of dev-kit's own existing assets.
