# GWD Pipeline → dev-kit Gap Analysis

Generated 2026-07-21. Source: parallel-agent inventory of `~/ADD-SDD-Initiator` (GWD
pipeline) cross-referenced against all 8 `dev-kit` plugins. Lists **only** GWD components
with no equivalent anywhere in dev-kit today — items with a dev-kit equivalent (e.g.
`gate-plan-review`, `plan-reviewer` + lens skills, `graphify`, TDD skill, design-reviewer)
are omitted.

This is a factual snapshot for reference while designing dev-kit's own pipeline — not a
proposal. See conversation history / follow-up docs for design decisions made from it.

## Orchestration (9)

| GWD Component | Purpose | Source |
|---|---|---|
| GWD Pipeline step table (15 steps) | Canonical table binding every step to its skill, source, model/effort, and reviewer | `GWD-PIPELINE.md` |
| ADD Protocol (Inquiry/Design/Validation/Implementation) | Top-level methodology gating one phase's completion before the next begins | `CLAUDE.md.template` |
| Context architecture hierarchy | Thin always-loaded `CLAUDE.md` routing to `docs/gwd/*` sub-files on demand | `CLAUDE.md.template` |
| Operating modes: auto / manual / sleep | Named run-mode switch controlling stop/continue cadence across the pipeline | `CLAUDE.md.template` |
| Context boundaries (‖) after steps 1, 3, 6, 11 | Fixed points where the orchestrator must stop for a `/clear` | `CLAUDE.md.template` |
| Genuine decision points list | Central enumeration of where auto/sleep mode must stop and ask the user | `CLAUDE.md.template` |
| Canonical sequence walkthrough | One-line narrative of the full pipeline flow with boundaries/branches | `CLAUDE.md.template` |
| Source pins table | Version ledger for each upstream library, to trace behavior drift after auto-updates | `GWD-PIPELINE.md` |
| Requirements hierarchical story bank (Theme → Pillar → Story Bank) | Tree-structured requirements with globally numbered US-xxx stories, vs. devkit's flat backlog | `CLAUDE.md.template` |

## Mandates (3 of 8 — the rest have devkit equivalents)

| GWD Component | Purpose | Source |
|---|---|---|
| Mandate 1 — Vertical slicing always | Standing rule forbidding horizontal-layer phase decomposition | `CLAUDE.md.template` |
| Mandate 6 — Telemetry + calibration (boundary-only) | Per-track metrics after each wave + user-approved calibration proposal | `CLAUDE.md.template` |
| Mandate 7 — Wiki capture | Standing rule to run wiki-ingest/save (capability itself lives outside devkit too) | `CLAUDE.md.template` |

## State Management (2)

| GWD Component | Purpose | Source |
|---|---|---|
| Three-tier state model | Splits state by access pattern: `.gwd-state` (every resume), `STATE.md` (boundaries), journal (on demand) | `CLAUDE.md.template` |
| Journal mechanics (`docs/gwd/journal/NN-<phase>.md`) | Append-only per-phase narrative log, separate from the always-loaded state file | `CLAUDE.md.template` |

## Hooks / Lifecycle Scripts (17 — devkit has no hooks layer at all)

| GWD Component | Purpose | Source |
|---|---|---|
| `gsd-check-update.js` | SessionStart hook, spawns background update-check worker | `.claude/hooks/gsd-check-update.js` |
| `gsd-check-update-worker.js` | Compares installed vs. latest GSD version | `.claude/hooks/gsd-check-update-worker.js` |
| `gsd-context-monitor.js` | PostToolUse hook injecting context-usage warnings | `.claude/hooks/gsd-context-monitor.js` |
| `gsd-phase-boundary.sh` | Reminds agent to update STATE.md after `.planning/` writes | `.claude/hooks/gsd-phase-boundary.sh` |
| `gsd-prompt-guard.js` | PreToolUse scan for prompt-injection/invisible-Unicode in writes | `.claude/hooks/gsd-prompt-guard.js` |
| `gsd-read-injection-scanner.js` | PostToolUse scan of Read content for injection patterns | `.claude/hooks/gsd-read-injection-scanner.js` |
| `gsd-session-state.sh` | SessionStart orientation reminder (prints STATE.md head) | `.claude/hooks/gsd-session-state.sh` |
| `gsd-statusline.js` | Custom statusline (model, phase, context-usage bar) | `.claude/hooks/gsd-statusline.js` |
| `gsd-validate-commit.sh` | Blocks non-Conventional-Commit messages | `.claude/hooks/gsd-validate-commit.sh` |
| `gwd-graphify-hint.sh` | Nudges reading `GRAPH_REPORT.md` before Glob/Grep | `.claude/hooks/gwd-graphify-hint.sh` |
| `gwd-graphify-update.sh` | Nudges an incremental graphify update after a git merge | `.claude/hooks/gwd-graphify-update.sh` |
| `gwd-wiki-ingest.sh` | SessionStart nudge to run wiki-ingest | `.claude/hooks/gwd-wiki-ingest.sh` |
| `gwd-wiki-save.sh` | PostToolUse nudge to run wiki save after artifact writes | `.claude/hooks/gwd-wiki-save.sh` |
| Wiki capture mechanics (ingest/save/vault mirror) | Full spec for Obsidian vault ingest + mirroring to story bank | `docs/gwd/CAPTURE.md` |
| Wiki capture hook backstop | Hook-level reminder independent of the orchestrator | `docs/gwd/CAPTURE.md` |
| Wiki kill switch (`wiki: off`) | `.gwd-state` flag silencing wiki capture | `docs/gwd/CAPTURE.md` |
| Graphify kill switch (`graphify: off`) | `.gwd-state` flag silencing graphify capture | `docs/gwd/CAPTURE.md` |

## Scripts / Tooling (16 — devkit ships no `bin/` scripts, only markdown)

| GWD Component | Purpose | Source |
|---|---|---|
| `complexity-score.mjs` | Deterministic CLI scoring model/effort from a plan's complexity signals | `.claude/bin/complexity-score.mjs` |
| Complexity scoring model (Capability & Risk/Depth axes) | The 0–15 two-axis algorithm itself | `docs/gwd/COMPLEXITY.md` |
| Capability floor rule | Forces minimum model when novelty/logic maxed | `docs/gwd/COMPLEXITY.md` |
| Context guard (`haikuFileBumpThreshold`) | Bumps haiku→sonnet when file count exceeds threshold | `docs/gwd/COMPLEXITY.md` |
| Critical-path floor rule | Lifts effort when touching auth/payments/secrets globs | `docs/gwd/COMPLEXITY.md` |
| Effort-driven model floor | Bumps model up to match computed effort | `docs/gwd/COMPLEXITY.md` |
| Calibration adjustments (`complexity-calibration.json`) | Path-glob risk deltas from prior sprints' defects | `docs/gwd/COMPLEXITY.md` |
| `track-metrics.mjs record` | Records per-track metrics after wave merges | `docs/gwd/EXECUTION.md` |
| `track-metrics.mjs attribute` | Maps review findings back to originating track | `docs/gwd/EXECUTION.md` |
| `track-metrics.mjs calibrate` | Generates calibration proposal from attributed findings | `docs/gwd/EXECUTION.md` |
| `track-metrics.mjs apply-calibration` | Applies approved calibration, idempotent per sprint | `docs/gwd/EXECUTION.md` |
| `antigravity-review.sh` | Bash wrapper invoking Antigravity CLI pinned to Gemini (independence guard) | `.claude/bin/antigravity-review.sh` |
| `antigravity-review.test.sh` | Test suite for the above | `.claude/bin/antigravity-review.test.sh` |
| `plan-parse.mjs` | Shared ESM parser lib (glob matching, signal-block/PEM parsing) | `.claude/bin/lib/plan-parse.mjs` |
| `settings.json` | Wires SessionStart/PreToolUse/PostToolUse hooks to matchers | `.claude/settings.json` |
| `complexity.config.json` | Tunables feeding the scorer (globs, bands, floors, guards) | `complexity.config.json` |

## Templates / Schemas (6)

| GWD Component | Purpose | Source |
|---|---|---|
| `complexity:` HTML comment block | Per-track raw signal block the planner emits for the scorer | `docs/gwd/COMPLEXITY.md` |
| `stories/INDEX.template.md` | Story-bank registry: US-xxx counter, theme/pillar map | `docs/requirements/stories/INDEX.template.md` |
| `stories/_templates/PILLAR.md` | Per-pillar story file template | `docs/requirements/stories/_templates/PILLAR.md` |
| `stories/_templates/THEME.md` | Theme overview template (intent, metrics, dependencies) | `docs/requirements/stories/_templates/THEME.md` |
| `eslint.config.js` | Bootstrap-time lint config for scaffolded projects | `eslint.config.js` |
| `tsconfig.base.json` | Bootstrap-time base TS config for scaffolded projects | `tsconfig.base.json` |

## Bootstrap / Adoption Scripts (6 — devkit is installed as a plugin, not scaffolded/injected)

| GWD Component | Purpose | Source |
|---|---|---|
| `ADOPTION_GUIDE.md` | Manual for retrofitting an existing repo onto GWD | `ADOPTION_GUIDE.md` |
| `KICKOFF_GUIDE.md` | Manual for starting a brand-new project under GWD | `KICKOFF_GUIDE.md` |
| `SKILL.md` (new-project front-end agent) | Entry-point skill classifying lane + triggering scaffolder | `SKILL.md` |
| `adopt-project-add.sh` | Injects the ADD framework into an existing project | `adopt-project-add.sh` |
| `audit-project-add.sh` | Audits a project for ADD framework compliance | `audit-project-add.sh` |
| `bootstrap-claude-project.sh` | Single-shot scaffolder for a brand-new ADD project | `bootstrap-claude-project.sh` |

## Gate Agents (1 of 5 — the other 4 already exist in devkit)

| GWD Component | Purpose | Source |
|---|---|---|
| `antigravity-explorer` | Large-context exploration subagent bridging to the external Antigravity/Gemini CLI | `.claude/agents/antigravity-explorer.md` |

---

**Pattern:** devkit deliberately stops at the skill/agent/command layer — no hooks
runtime, no `bin/` scripts, no state-file contract, no project-scaffolding layer.
Everything above is orchestration glue, lifecycle hooks, deterministic scoring/telemetry
tooling, or bootstrap scripts — not domain methodology (which devkit already covers).

All `GWD-PIPELINE.md` file paths are relative to `~/ADD-SDD-Initiator/`
(`project-bootstrap/` unless otherwise rooted at repo top level).

---

## Capability view (the same 60 items, de-duplicated by underlying capability)

The 60-item list above is organized by artifact name. Read by *capability* instead — what
job each cluster of files actually does — it collapses to ~19 distinct capabilities. Each
is tagged with where it belongs: **Orchestration Pipeline** (the separate, not-yet-built
sequencer that calls dev-kit), **Agent/Skill** (belongs inside dev-kit itself), **Hooks**
(dev-kit could add a `.claude/hooks/` layer for this now), or **Skip** (solves a problem
dev-kit doesn't have).

| # | Capability | Recommended home | Why |
|---|---|---|---|
| 1 | Pipeline step sequencing & mode governance (step table, phase-gating, auto/manual/sleep modes, context boundaries, decision-point registry) | **Orchestration Pipeline** | This *is* the sequencer's job — dev-kit supplies the skills it calls, not the call order |
| 2 | Layered context/doc architecture (thin always-loaded contract + on-demand sub-docs) | **Orchestration Pipeline** | A per-project contract the pipeline scaffolds, not something dev-kit's plugins carry |
| 3 | Upstream source/version pinning ledger | **Orchestration Pipeline** | Tracks the pipeline's own dependency versions; dev-kit's `dependency-manager` agent already covers code deps, not skill-library versions |
| 4 | Multi-level requirement hierarchy (Theme→Pillar→Story-bank, global US-xxx) | **Agent/Skill** (optional) | Dev-kit's spec→roadmap→plan→summary chain already gives traceability at project scope; this is a different *ambition* (portfolio-scale), only worth building if dev-kit needs to manage multiple products at once |
| 5 | Vertical-slice enforcement (never horizontal-layer phases) | **Agent/Skill** | `roadmapper.md` already has the guidance as prose; needs promoting to a hard rule + reference doc, same pattern as `planner.md`'s MVP mode |
| 6 | Deterministic model/effort scoring (complexity algorithm, floors, guards, config) | **Orchestration Pipeline** (scorer) + **Agent/Skill** (consumer) | The scorer is executable tooling dev-kit can't ship (markdown-only); `gate-plan-review`/`sprint-execution` already consume it as optional external tooling — `planner.md` just needs to learn to emit the signal blocks so there's something to consume |
| 7 | Telemetry recording + defect-attribution + calibration loop | **Orchestration Pipeline** | Needs an executable script and persistent calibration state carried across sprints — infra, not methodology |
| 8 | Tiered state persistence (hot resume-head / phase-boundary state / on-demand journal) | **Orchestration Pipeline** | Defines the state-file contract; a **Hook** can auto-surface it at SessionStart once the contract exists, but the contract itself is a pipeline decision |
| 9 | Append-only execution journal | **Orchestration Pipeline** | Part of the state contract above |
| 10 | Self-update / freshness check | **Skip** | Solves "GSD installed via npm outside the plugin system" — dev-kit is distributed via the Claude Code plugin marketplace, which already handles this |
| 11 | Context-budget awareness warning | **Hooks** | Generically useful for any coding session, zero GWD-specific dependency — good candidate to add now |
| 12 | Content-safety scanning on read/write (prompt-injection + invisible-unicode detection) | **Hooks** | Broadly useful regardless of pipeline status — strongest candidate to add regardless of anything else in this list |
| 13 | Commit-message convention enforcement | **Hooks** | Generically useful, low risk, optional |
| 14 | Custom statusline (model/phase/context visibility) | **Hooks/settings** | Nice-to-have; only meaningful once dev-kit has an actual phase/state concept, so lower priority |
| 15 | Knowledge-graph freshness nudges (hint before search, update after merge) | **Hooks** | Reinforces the `graphify` skill dev-kit already ships; the hint hook needs zero changes, the update hook needs one gate removed — add both now |
| 16 | State-file sync nudges (remind to update STATE.md, print it at session start) | **Hooks** | Depends on #8 — only wire this once dev-kit has an enforced (not just templated) `STATE.md` convention |
| 17 | External knowledge-base sync (Obsidian vault ingest/save + kill switches) | **Hooks** (optional) | Only worth it if dev-kit takes a real dependency on the external `claude-obsidian` plugin; otherwise out of scope |
| 18 | Independent (non-Claude) model review bridge | **Orchestration Pipeline** (bridge script) + **Agent/Skill** (rule) | The actual CLI-calling bridge is host/environment-specific plumbing (GWD's own copy lives in per-project scaffolding, not a shared lib); `gate-plan-review.md` should just state the rule generically ("dispatch a non-Claude model") instead of hardcoding one mechanism |
| 19 | New-repo scaffolding with baseline tooling (lint/tsconfig templates, bootstrap/adopt/audit scripts, kickoff/adoption guides) | **Orchestration Pipeline** | Entirely a "stand up a new project under this pipeline" concern; dev-kit installs into existing repos and has no scaffolding surface at all |

**Rough tally:** 10 of 19 capabilities belong to the future orchestration pipeline, not
dev-kit. Of the rest, 6 are Hooks candidates (2 ready to add now — graphify hint/update —
plus content-safety scanning as the strongest general-purpose addition), 2 are Agent/Skill
work already scoped (vertical-slicing mandate, planner scoring-consumer update), and 1 is
a plain skip.

---

## Revision: Workflow is a distinct 4th home, not a synonym for "Orchestration Pipeline"

The tally above was written before re-examining Claude Code's `Workflow` tool (deterministic
multi-agent scripts: `pipeline()`/`parallel()`/loops, worktree isolation, token budgets).
It is bounded and single-invocation — it runs start to finish within one tool call and
returns a result, with no live user Q&A mid-run and nothing that survives a `/clear` or a
multi-day pause on its own. That is meaningfully different from "Orchestration" as used
above, which means the persistent, cross-session, mode-governed sequencer that decides
*when* to invoke a Workflow, an Agent, or a Skill, and that survives context resets via
file-based state. A Workflow run is a tool that orchestrator would reach for — it isn't
the orchestrator.

Four homes now, not three(+skip): **Workflow** (bounded deterministic fan-out/loop, this
session only) · **Orchestration** (persistent cross-session sequencer + state) ·
**Agent/Skill** · **Hooks** · **Skip**.

Reclassifications and additions:

| Capability | Previous tag | Revised home | Why the change |
|---|---|---|---|
| Wave/track parallel dispatch + worktree isolation (part of #1, GWD step 12) | Orchestration Pipeline | **Workflow** | This is `pipeline()`/`parallel()` with `isolation:'worktree'` almost verbatim. Dev-kit's `sprint-execution`/`bugfix-wave` skills already hand-roll this exact pattern today by instructing the *main agent* to make parallel `Agent()` calls in prose — they could instead generate/invoke an actual Workflow script for it |
| Adversarial review ↔ fix loop, ≤6 iterations (GWD step 13) | Orchestration Pipeline | **Workflow** | Textbook loop-until-count / loop-until-dry pattern — plain JS `while` loop calling `agent()` per iteration, no external state needed across the loop's own lifetime |
| Deterministic model/effort scoring (#6) | Orchestration Pipeline (external scorer) + Agent/Skill | **Workflow** (math) + Agent/Skill (what to extract) | The scoring bands/floors are just arithmetic on bounded 0–3 factors — real JS in a Workflow script computes them deterministically (no external `.mjs` CLI needed); an agent stage only needs to extract the raw signals (novelty, files touched, etc.) as structured output for the script to sum/band |
| Telemetry recording + defect-attribution + calibration-proposal generation (#7) | Orchestration Pipeline | **Workflow** (the matching/attribution logic itself is plain JS over structured agent outputs) + **Orchestration** (persisting the calibration file across many separate sprints/sessions over the project's life) | Splits cleanly: one-shot computation vs. long-lived state |
| Independent (non-Claude) review bridge (#18) | Orchestration Pipeline (bridge) + Agent/Skill (rule) | **Workflow** (dispatch/retry loop, via an agent stage with Bash access to shell out to the external CLI) + Agent/Skill (rule) unchanged | The looping/retry control fits a Workflow stage; the actual bridge binary is still host-specific plumbing outside dev-kit either way |
| New-repo scaffolding (#19) | Orchestration Pipeline | **Agent/Skill/Command** (not Workflow) | Needs live user Q&A (lane selection, clarifying questions) mid-flow — Workflow runs in the background with no interactive back-and-forth, so this is better suited to a normal foreground skill/command even inside a future pipeline |

Everything else in the 19-item list (macro step sequencing/mode governance, context
boundaries, tiered state/journal, source pins, all Hooks candidates, the skip) is
unaffected — those genuinely need cross-session persistence or are independent of any
orchestration mechanism, so no bounded Workflow run substitutes for them.

**Net effect:** dev-kit's own skills (`sprint-execution`, `bugfix-wave`, `gate-plan-review`,
`gate-codex-round`, `planner`) already describe several of these patterns in prose form
today, telling the main agent how to hand-orchestrate parallel dispatch/loops itself. The
concrete opportunity Workflow adds is upgrading those prose instructions into actual
generated Workflow scripts — more reliable control flow, resumability, budget tracking —
without needing anything from the not-yet-built cross-session orchestration pipeline.

---

## Workflow vs. Orchestration — what each is for, and what to change

**Orchestration** (the not-yet-built pipeline) has to survive things a single tool call
can't: `/clear`, multi-day pauses, a human weighing in on a CEO review or design
consultation. It's inherently interactive and long-lived, so it must be state-file-driven
(`.gwd-state`, `STATE.md`) and mode-governed (auto/manual/sleep). Workflow doesn't replace
any of this — it can't ask a clarifying question mid-run, and it forgets everything the
moment it returns unless something outside it writes state to disk.

**Workflow** solves a narrower, different problem. Today, several dev-kit skills tell *the
main agent* to hand-orchestrate parallel dispatch or loops itself, in prose — "make these
Agent() calls in this message, wait, merge, repeat." That's fragile in ways Workflow fixes:

- **Determinism** — a real `while` loop and `+=` can't drift the way a model re-deriving
  "loop up to 6 times, checking majority-refuted" can (miscounting, forgetting the cap,
  handling edge cases inconsistently turn to turn).
- **True concurrency + context isolation** — the main session makes one call and gets a
  result, instead of holding all the wave/track bookkeeping in its own context for the
  entire multi-wave execution.
- **Resumability** — `resumeFromRunId` replays cached agent results; a hand-rolled prose
  loop has no equivalent (a failure at step 4 of 6 means redoing 1–3 by hand).
- **An actual audit trail** — the script + `journal.jsonl` is a real, replayable record;
  a conversation transcript isn't as clean to verify against.
- **Hard budget ceilings** — `budget.remaining()` is enforced; "don't overdo it" in prose
  is not.

The tradeoff: Workflow can't stop mid-run to ask the user something, and nothing about it
persists once it returns — so it's the right tool for a *bounded chunk* an orchestrator
hands it ("run this wave," "run this review loop," "score these tracks"), not a
replacement for the thing deciding *when* to invoke that chunk. This distinction doesn't
require the (much bigger, not-yet-built) orchestration pipeline to exist first — the
skill-level changes below are buildable today.

### Recommended skill changes (to review and action)

1. **`sprint-execution` / `bugfix-wave`** (`plugins/dev-kit-core/skills/sprint-execution/`,
   `plugins/dev-kit-core/skills/bugfix-wave/`) — currently prose-instruct the main agent to
   hand-orchestrate parallel wave/track dispatch with git-worktree isolation. Change: have
   these skills generate/invoke an actual Workflow script (`pipeline()`/`parallel()` with
   `isolation:'worktree'`) for the dispatch instead of prose "make these calls yourself"
   instructions.
2. **`gate-codex-round` / `bugfix-wave`'s adversarial loop** (`plugins/dev-kit-core/agents/gate-codex-round.md`) —
   currently a prose "loop ≤6 times, check majority-refuted" instruction. Change: express
   this as a Workflow `while` loop (loop-until-count / loop-until-dry pattern) instead of
   relying on the model to track iteration count and refutation-majority itself.
3. **`planner`** (`plugins/dev-kit-core/agents/planner.md`) — has no complexity/model-effort
   scoring support at all today (see capability #6 above), while `gate-plan-review` and
   `sprint-execution` already know how to *consume* a `complexity-score.mjs`-style signal if
   present. Change: give `planner` a companion pattern where an agent stage extracts raw
   complexity signals (novelty, files touched, blast radius, etc.) as structured output, and
   a Workflow script's plain JS computes the deterministic model/effort bands — closing the
   producer/consumer gap without needing an external `.mjs` CLI.
4. **`gate-plan-review`** (`plugins/dev-kit-core/agents/gate-plan-review.md`) — hardcodes
   `cc-gemini-plugin:gemini` for its independence check with no fallback or guard against
   accidentally reviewing Claude's plan with Claude. Change: generalize the rule to "dispatch
   a non-Claude model for independence, via whichever mechanism — skill, CLI, or
   project-provided script — the environment supplies," and note a Workflow `agent()` stage
   (with Bash access) is one valid way to host that dispatch/retry loop, not the only one.

---

## Workflow-candidate sweep — all 193 dev-kit assets (skills + agents + commands)

Parallel-agent sweep of every `SKILL.md`, agent, and command file across all 8 plugins
(51 core skills, 38 core agents, 8 core commands, 26 backend, 11 web, 4 mobile, 13+4
data-ai, 14 infra, 19 specialized, 5 product = 193 files). For each, the question was:
does its described process involve parallel fan-out over independent items, an iterative
loop with a hard exit condition, or a multi-stage pipeline where later stages depend on
earlier ones completing — the shapes real `Workflow` scripts (`agent()`/`parallel()`/
`pipeline()`/`phase()`) handle deterministically, that are currently expressed as prose
trusting the calling agent to self-orchestrate correctly.

**Only entries needing a change are listed — 29 of 193.** Everything else (163 files) is
single-agent linear methodology with no fan-out/loop/pipeline shape and needs no change.
None of the 29 need to move to Hooks or "become a Skill" (they already are skills/agents;
the question was purely whether their *internal process* should generate/invoke a Workflow
script), and none need "Orchestrator" (cross-session/multi-day state) — that distinction
only came up for the GWD-gap capabilities earlier in this doc, not for dev-kit's own assets.

### dev-kit-core skills (9 of 51 flagged)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `bugfix-wave` | Classifies bugs into non-conflicting tracks, dependency-ordered waves, parallel subagents per track in worktree isolation | **Workflow** | Textbook `parallel()`+`phase()` — currently hand-rolled in prose telling the calling agent how to loop over waves itself |
| `sprint-execution` | Same wave/track/worktree/merge pattern generalized to arbitrary plans; "orchestrator must not start Wave N+1 until Wave N merged" | **Workflow** | Matches `parallel()` + worktree isolation + cached resumability directly |
| `graphify` | Chunked N-way parallel extraction with a `.graphify_uncached.txt` caching layer, multi-stage (detect→transcribe→extract→build→label→export) | **Workflow** | Fan-out + cached resumability + dependent pipeline stages, currently a long bash-heavy prose script |
| `cso` | "Launch an independent verification subagent with fresh context" per candidate finding, gate-scored, aggregated | **Workflow** | Parallel-map-then-reduce shape over a variable-N finding list |
| `dispatching-parallel-agents` | Entire skill content is prose teaching the calling agent to hand-roll N-way parallel dispatch | **Workflow** | Could generate a small Workflow script instead of re-teaching the technique every invocation |
| `design-consultation` (Shotgun mode) | 3–8 independent variant-mockup subagents, then a merge/comparison board | **Workflow** | Fan-out-then-aggregate, currently hand-orchestrated |
| `feature-forge` | Multi-domain discovery via Task subagents when a feature spans domains | **Agent** (not full Workflow) | Small/ad-hoc fan-out — needs fresh-context isolation, not worktrees/waves/budget tracking |
| `ship` | 14 sequential gated steps (merge→test→coverage→plan-audit→review→version→changelog→PR) | **Workflow** | Long ordered pipeline where each stage's output gates the next — currently prose trusting one agent to track gate state through 14 steps |
| `land-and-deploy` | Multiple poll-with-hard-timeout loops (CI wait, merge-queue wait, deploy wait) chained with revert-on-failure branches | **Workflow** | Deterministic loop/exit-condition + `phase()` support beats an agent manually re-polling and tracking elapsed time |

### dev-kit-core agents + commands (12 of 46 flagged)

| Name | Type | Trigger | Mechanism | Rationale |
|---|---|---|---|---|
| `plan-review` | Command | "Dispatch `plan-reviewer` once per selected lens, in parallel" (up to 5 lenses) | **Workflow** | Parallel fan-out + consolidation, currently one prose sentence trusting correct spawn/merge |
| `plan-reviewer` | Agent | Own description tells its *caller* to dispatch N in parallel, one per lens | **Workflow** | That orchestration instruction belongs in a deterministic script, not agent prose the dispatcher must remember to follow |
| `gate-codex-round` | Agent | Spawned per round of a max-6-round adversarial loop; emits `stop_loop`/`next_action` JSON for an external caller to parse and re-invoke | **Workflow** | Loop-up-to-N-with-hard-exit-condition, exactly Workflow's `while` pattern — removes risk of the caller mis-reading `next_action` |
| `gate-automation` | Agent | One golden-path + one edge-case flow authored per primary flow, done serially in one context | **Workflow** | Each flow is independent (separate spec files, no shared state) — embarrassingly parallel across worktrees |
| `nyquist-auditor` | Agent | Per-gap: generate test, run, debug if failing (max 3 iterations), sequentially across all gaps | **Workflow** | Independent items + bounded retry-cap sub-loop — matches "fan out N" + "retry until X or cap" primitives |
| `qa` | Agent | Phase 8 fix loop: one commit per fixable issue in severity order, risk-gate every 5 fixes, hard cap 50 | **Workflow** | Same shape as `bugfix-wave` (classify→non-conflicting tracks→parallel worktrees→merge) but currently done alone, serially, in one context |
| `design-reviewer` | Agent | Identical fix-loop pattern to `qa`, cap 30, mostly non-conflicting CSS fixes | **Workflow** | Same rationale as `qa` |
| `planner` | Agent | `build_dependency_graph`/`assign_waves` given as literal pseudocode for the LLM to hand-simulate | **Workflow** | Deterministic graph/topo-sort computation — real JS never mis-orders a large plan set the way free-form reasoning can |
| `codebase-mapper` | Agent | Dispatched with one of four independent focus areas (tech/arch/quality/concerns), non-overlapping output files | **Workflow** | Clean `parallel()` fan-out currently expressed as "dispatched with one of four," relying on the caller to invoke it 4 times |
| `doc-classifier` | Agent | One classifier per input doc, parallel, feeding a downstream synthesis stage | **Workflow** | Classify→synthesize dependency is the `phase()`/`pipeline()` stage-boundary case |
| `doc-synthesizer` | Agent | Dispatched only after all classifiers complete; cycle detection + LOCKED-conflict resolution | **Workflow** | Correctness depends on a hard stage boundary a `phase()` gate enforces structurally, vs. trusting the caller's sequencing |
| `research-synthesizer` | Agent | Dispatched after 4 parallel researcher agents complete | **Workflow** | Same fan-out-then-synthesize shape as the doc-ingestion pair |

*Not flagged despite keyword hits* (checked individually, no real fan-out/loop): `code-reviewer`, `doc-verifier`, `health-reporter`, `incident-responder`, `retro`, `roadmapper`, `phase-researcher`, `market-researcher`, `debugger` (needs live user interaction mid-run — unsuited to Workflow by design), `gate-plan-review`, `gate-reverse-engineer`.

### dev-kit-backend + dev-kit-web (1 of 37 flagged)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `legacy-modernizer` | 5-phase gated strangler-fig migration with per-phase rollback triggers and traffic-increment gates (5%→25%→50%→100%), each requiring metrics within baseline before advancing | **Workflow** | Gated multi-stage pipeline with measurable per-phase exit conditions and rollback branches; per-component strangler-fig facades could dispatch via `parallel()` + worktree isolation |

### dev-kit-infra + dev-kit-specialized (7 of 33 flagged)

| Skill | Trigger | Mechanism | Rationale |
|---|---|---|---|
| `chaos-engineer` | Game days = N independent per-service experiments, each with steady-state baseline, blast-radius cap, scripted rollback | **Workflow** | `parallel()` over experiments with per-track abort condition beats one agent serially running experiments from prose |
| `sre-engineer` | Same SLI/SLO-definition pipeline rolled out per-service across a catalog | **Workflow** | Repeatable per-item pipeline better expressed as `phase()`/`parallel()` over a service list than re-run manually per service |
| `devops-engineer` | Multi-environment (dev→staging→prod) staged pipeline with go/no-go gates and rollback-on-failure | **Workflow** | Textbook staged `pipeline()`-with-gates case |
| `cloud-architect` | Wave-based migration: each wave moves multiple workloads in parallel, gated by a connectivity/health checkpoint before the next wave | **Workflow** | `phase()` (waves) + `parallel()` (workloads per wave) |
| `terraform-engineer` | Explicit "after any fix, return to step 5 to re-validate" loop with named failure branches (state drift, auth errors, dependency errors) | **Workflow** | Iterative loop with hard exit condition ("repeat until clean") currently relies on the agent manually looping |
| `microsoft-ops` | Bulk AD/M365 changes (GPOs, mailboxes, OUs) each needing enumerate→dry-run→apply→verify→rollback | **Workflow** | Fan-out over objects with per-object safety gates, not a single serial script |
| `license-engineer` | Classifying potentially hundreds of dependencies for license/copyleft risk | **Workflow** | Classify-many-in-parallel-then-synthesize, same shape as the doc-classifier pattern; cached resumability matters for large dependency trees |

### dev-kit-mobile + dev-kit-product + dev-kit-data-ai (0 of 26 flagged)

No changes recommended. Mobile/product skills are single-pass build/analysis. Data-AI
skills (data-scientist, ml-pipeline, rag-architect, fine-tuning-expert, etc.) do describe
multi-stage pipelines, but their "items" (training epochs, embedding batches, Spark
partitions) are already parallel at the compute layer inside one script/job — fanning them
out to separate Claude subagents would add coordination overhead without parallelizing any
real work. `eval-planner`/`eval-auditor`/`ai-researcher`/`framework-selector` are each a
single bounded pass (2–4 pages, 3–7 dimensions), not internal N-item loops.

### Tally

- **29 flagged** (generate/invoke a Workflow script): 9 core skills, 12 core agents/commands, 1 backend/web, 7 infra/specialized.
- **1 flagged as Agent-only** (`feature-forge`) — genuine small fan-out, but doesn't need worktrees/waves/budget tracking.
- **163 need no change** — single-agent linear methodology, no fan-out/loop/pipeline shape.
- **0 flagged as needing Hooks or Orchestrator** — those homes are relevant to the GWD-gap
  capabilities earlier in this doc, not to any of dev-kit's own existing assets.
