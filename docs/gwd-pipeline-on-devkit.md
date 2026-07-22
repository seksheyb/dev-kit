# The GWD Pipeline, Rebuilt on dev-kit

**What this is.** A single ordered walkthrough of a *complete* GWD-style pipeline — PRD → shipped,
test-covered, reviewed milestone — expressed entirely in `dev-kit` skills, agents, and commands.
Where `GWD-PIPELINE.md` (the canonical 15-step table in `~/ADD-SDD-Initiator`) binds each
step to an *external* library (Spec-Kit / gstack / GSD / fullstack-dev-skills / custom gate agents),
this document answers the sibling question: **if you were to stand the same pipeline up using only
dev-kit, which asset fires at each step, and in what order?**

Every one of dev-kit's **94 core assets** (49 skills, 37 agents, 8 commands — including `spec-review-cpo`, added
alongside this document to close the spec-stage product-review gap, and net of `first-principles-thinking`,
`clarify`, and `feature-forge`, folded into `specify`/`spec-review-cpo` during a Stage 0/1 asset-overlap audit;
and net of a Stage 2/7 audit that removed `plan-review-ceo` and added `sdd-review-cto` in its place — a net-zero
skill swap that gives Stage 2 a real architecture-review gate)
is placed somewhere below,
and the **96 lane assets** (the 7 stack-reference plugins) are routed in at the stages where they apply.
"I assume all should be utilised" — they are; see the [coverage appendix](#coverage-appendix--every-asset-placed).

**What dev-kit is *not*.** dev-kit deliberately stops at the skill/agent/command layer. The *sequencer*
that walks these stages in order, survives a `/clear`, and governs auto/manual/sleep modes is not a
dev-kit asset — it is the not-yet-built **Orchestration** layer. Deterministic fan-out/loop chunks
(wave dispatch, the review↔fix loop, complexity scoring) are **Workflow** scripts. Lifecycle nudges
(content-safety scan, graphify hints, commit-message enforcement) are **Hooks**. See
[`gwd-pipeline-gap-analysis.md`](gwd-pipeline-gap-analysis.md) and
[`workflow-recommendations.md`](workflow-recommendations.md) for those four homes. This doc covers the
Skill/Agent/Command spine those glue layers would drive.

---

## The pipeline at a glance

Stages 0–4 run **once per milestone**. Stages 5–12 are the **per-phase loop** (repeat for every
vertical slice the roadmap produced). Stages 13–15 close out the branch, the milestone, and the operate/learn
cycle. Conditional stages are marked *(if …)*.

**A milestone is the whole pipeline, not a phase.** One full Stage 0→16 traversal delivers one milestone. A new
milestone is **not** a special continuation path — it re-enters Stage 0 and runs the entire pipeline again,
treated exactly like a new project. The only thing that changes is where Stage 1 gets its requirements from: a
first milestone starts from a PRD; every milestone after that starts from `docs/BACKLOG.md` — the durable,
cross-milestone backlog `spec-review-cpo` (Stage 1) writes to every time it descopes something. See
[New milestone = new project](#new-milestone--new-project) below.

| # | Stage | Primary dev-kit assets | In → Out |
|---|-------|------------------------|----------|
| **0** | Bootstrap & governance | `constitution` · *(legacy)* `spec-miner` → `gate-reverse-engineer` · *(existing docs)* `doc-classifier` → `doc-synthesizer` · *(existing code)* `cso` · `graphify` | repo/PRD → `constitution.md`, recovered SDD/PRD/ADRs, `.security-reports/*.json`, `graph.json` |
| **1** | Requirements & product framing | `brainstorming` · `specify` (generate + clarify) · `assumption-mapping` → `backlog-grooming` · `market-researcher` · `spec-review-cpo` | PRD (or `docs/BACKLOG.md` for milestone 2+) → `spec.md` (+ `US-xxx` story bank) + locked Scope Decision Record + updated `docs/BACKLOG.md` |
| **2** | Architecture & tech stack | `architecture-designer` · `diagram` · `sdd-review-cto` | requirements → `SDD.md` + ADRs |
| **3** | Research & roadmap | `project-researcher` ×4 → `research-synthesizer` · `roadmapper` | requirements + research → `ROADMAP.md` (vertical slices) + `STATE.md` |
| **4** | Design system *(if UI)* | `design-consultation` → `design-html`[^plan-review-design] | product → `DESIGN.md` |
| **5** | Phase discovery | `codebase-mapper` ×4 · `pattern-mapper` · `assumptions-analyzer` · `advisor-researcher` · `phase-researcher` · `graphify` (query) | phase → `CONTEXT.md`, `PATTERNS.md`, `RESEARCH.md`, codebase maps |
| **6** | AI / UI phase specs *(conditional)* | *(AI)* `domain-researcher` → `eval-planner`/`eval-auditor` (data-ai lane) · *(UI)* `ui-researcher` → `ui-checker` | phase → `AI-SPEC.md` / `UI-SPEC.md` |
| **7** | Plan the phase | `writing-plans` · `planner` · `plan-review` (cmd) → `plan-reviewer` → 4 lenses (incl. `plan-review-design`) · `gate-plan-review` · `analyze` | context → `PLAN.md` (waves + tracks), reviewed & complexity-gated |
| **8** | Execute the phase | `using-git-worktrees` · `sprint-execution` · `test-driven-development` · `dispatching-parallel-agents` · `fullstack-guardian`/`secure-code-guardian` · `refactoring-specialist` · `guard` · `design-handoff` (Claude Design → codebase bridge, when UI in scope) · `verification-before-completion` · **lane skills** | plan → code + tests, per-track parallel |
| **9** | Debug *(as needed)* | `debug` (cmd) → `debugger` ← `systematic-debugging` · `learn` | failure → root-cause fix + regression test |
| **10** | Adversarial review ↔ fix loop | `review` (cmd) → `code-review-gate` (round) ↔ `bugfix-wave` · `code-review-protocol` · `qa` (cmd/agent) · `ui-auditor` | code → fixes (loop ≤6) |
| **11** | Verify the goal | `verify` (cmd) → `verifier` · `converge` · `integration-checker` · `nyquist-auditor` · `gate-automation` ← `test-master`/`playwright-expert` | code → `VERIFICATION.md`, gaps closed, Playwright/Maestro flows |
| **12** | Security & compliance gate | `security-audit` (cmd) → `security-auditor` · `cso` (`--diff`) · `penetration-tester` · `compliance-auditor` · `security-reviewer` · `dependency-manager` | code → `SECURITY.md`, `.security-reports/*.json`, dependency/license report, open threats block ship |
| **13** | Document | `document-generate`/`code-documenter` · `content-qa` · `document-release` → `doc-verifier` | shipped surface → synced docs, CHANGELOG |
| **14** | Ship & deploy | `finishing-a-development-branch` *(manual)* **or** `ship` → `land-and-deploy` · **infra lane** | branch → PR → merged & deployed |
| **15** | Operate, retrospect, close | `health` (cmd) → `health-reporter` · `performance-engineer` · `incident-responder` · `retro` (cmd) → `retro` · `design-reviewer` (full/deep) · `devex-review` · `accessibility-tester` · milestone archive | milestone → dashboards, postmortems, archive + tag |

**Always-on (cross-cutting, not a stage):** `context-save` / `context-restore` (session continuity),
`learn` (durable knowledge), `guard` (safety), `graphify` (query anytime), `diagram` (any review/design
step), `writing-skills` (codify a repeated workflow into a new skill). See
[Cross-cutting assets](#cross-cutting-assets).

[^plan-review-design]: `plan-review-design` is introduced conceptually here, alongside `DESIGN.md`, but
does not execute in Stage 4 — it has no artifact to review yet. It fires once per phase, in Stage 7, as
one of four parallel lenses against *that phase's own* `PLAN.md` (a fresh artifact per phase, not a
project-wide one) — see Stage 7's row above and its own section below.

---

## Conditional gates & branches

The pipeline is not a straight line — several stages fire only when a predicate holds, and the whole middle is a
loop. This section is the single place that states, for every branch point, **when it runs** and **what happens when
it doesn't**. (Evaluating these predicates and skipping cleanly is the not-yet-built **Orchestration** layer's job;
dev-kit supplies the assets, not the branch logic.)

### Three structural branches

1. **Entry path (Stage 0)** — mutually exclusive by repo state, evaluated fresh **every milestone**, not just the
   first:
   - *Greenfield* (first milestone, no code, no docs) → skip the legacy and existing-docs sub-paths entirely; run
     only `constitution` (+ `graphify` once code exists). `cso` also skips — there's nothing in the repo yet for
     it to scan.
   - *Legacy / inherited / undocumented code* → run `spec-miner` → `gate-reverse-engineer` to recover SDD/PRD/ADRs
     before Stage 1, and run `cso` for a full security baseline of the codebase being onboarded (secrets in git
     history, dependency supply chain, CI/CD, infra — all of it pre-dates this pipeline's own tracking).
   - *Existing planning docs* (a pile of ADRs/PRDs/specs) → run `doc-classifier` → `doc-synthesizer` to ingest them.
     These two sub-paths are independent — a repo can trigger both, neither, or one.
   - *Continuing milestone* (milestone 2+ of a project this pipeline already built) → none of the doc-recovery
     sub-paths above really apply — there's no undocumented legacy pile, the project's own docs are already
     current. `constitution` runs in **update** mode (not init), `graphify` runs an **incremental** update (not a
     first build), and neither `spec-miner` nor the doc-ingest pair fire. `cso` still runs, full (not `--diff`) —
     the repo now carries every prior milestone's shipped code, which is exactly the kind of accumulated-risk
     surface (stale dependencies, drifted CI config, secrets that leaked since the last full sweep) a per-phase
     `--diff` pass at Stage 12 wouldn't catch. This is the common case after milestone 1.
2. **The per-phase loop (Stages 5–12)** — runs **once per roadmap phase** produced by Stage 3. Loop position lives in
   `STATE.md`. Stages 0–4 run once per milestone; Stages 13–15 run once at milestone close-out. Every per-phase
   conditional below is re-evaluated **for each phase**.
3. **The milestone loop (Stages 0→15)** — a full pipeline traversal is one milestone. Stage 15's close-out doesn't
   terminate the project — it checks `docs/BACKLOG.md`: if enough Now/Next items exist to justify one, the pipeline
   re-enters Stage 0 for the next milestone. See [New milestone = new project](#new-milestone--new-project).

### Conditional gate table

| Gate | Runs when (predicate) | If the predicate is false |
|------|-----------------------|---------------------------|
| `market-researcher` (S1) | A product-direction / sizing / competitive decision is open | Skip; requirements proceed on existing evidence |
| **Design system** (S4) | Project has a UI lane **and** no `DESIGN.md` exists yet | Skip the whole stage — runs **once ever**, never per phase |
| **AI spec** (S6): `domain-researcher` + `eval-planner`/`eval-auditor` | The phase builds an AI/LLM system needing an eval contract | Skip; no `AI-SPEC.md` for this phase |
| **UI spec** (S6): `ui-researcher` → `ui-checker` | The phase has UI work | Skip; no `UI-SPEC.md`. If run, `ui-checker` **BLOCKED** halts planning until fixed |
| `plan-review-design` (S7) | The plan has any UI scope | Auto-reports "not applicable", verdict APPROVE, completeness N/A |
| `plan-review-devex` (S7) | The plan has a developer-facing surface (API/CLI/SDK) | Auto-reports "not applicable", auto-approve N/A |
| `plan-review-eng` / `-goal-backward` (S7) | **Always** (unconditional lenses) | — |
| `spec-review-cpo` (S1) | A spec exists and a real scope/strategy call is needed before planning | Skip; no strategic/scope challenge happens for this spec at all — nothing downstream re-checks it |
| `docs/BACKLOG.md` write (part of S1's `spec-review-cpo`) | The posture/milestone-split work identifies anything descoped from this milestone | Skip — nothing writes/updates the file this run; a milestone that descopes nothing leaves it untouched |
| **Milestone loop** (after S15) | `docs/BACKLOG.md` has Now/Next items after close-out | Skip — project ends here; the backlog (if any) sits idle until someone manually starts a new milestone |
| `refactoring-specialist` (S8) | A track touches existing code | Skip; new-file tracks don't need it |
| `secure-code-guardian` (S8) | Track implements auth / input handling / crypto | Skip |
| `fullstack-guardian` (S8) | Feature spans frontend + backend together | Use narrower lane skills instead |
| `guard` (S8) | Track touches prod / shared / destructive surface | Skip the freeze |
| **Debug** (S9) | A bug / test failure / unexpected behavior occurs | Skip; execution continues |
| `ui-auditor` (S10) | Phase shipped UI | Skip; `code-review-gate` + `qa` still run |
| `nyquist-auditor` (S11) | `verifier` Step 6d found requirements with no automated test coverage (`validation_gaps` non-empty) | Skip; nothing to fill |
| `gate-automation` (S11) | Sprint diff added/changed **primary** user flows | No new flows required (internal-only changes excluded) |
| `cso` (S0) | Entry path has existing code — Legacy or Continuing-milestone | Skip on a first-milestone Greenfield entry; nothing to scan yet |
| `dependency-manager` (S12) | Always runs | — |
| `compliance-auditor` + product compliance skills (S12) | Regulated data/industry in scope (GDPR/HIPAA/PCI/SOC2…) | Skip |
| `penetration-tester` (S12) | Active exploitation is **authorized and in scope** | Skip — agent refuses without written authorization |
| `cso` (S12) | Always runs (`--diff` mode) | — |
| `security-auditor` (S12) | Always runs; **branches internally** | With a threat model → verifies mitigations; without → falls back directly to `security-reviewer`'s general methodology |
| **Ship mode** (S14) | Automated (`ship` → `land-and-deploy`) vs manual (`finishing-a-development-branch`) — an operator choice, not a repo predicate | Pick one path; both end in a merged/deployed or explicitly-kept branch |
| Infra deploy specifics (S14) | Deploy platform detected (Fly/Render/Vercel/Netlify/GH Actions) | GitLab/unknown → `land-and-deploy` stops, hands off to manual merge |
| `incident-responder` (S15) | An active production incident is underway | Skip |
| `design-reviewer` (full/deep) / `devex-review` / `accessibility-tester` (S15) | Milestone shipped UI or a developer-facing surface anywhere across its phases | Skip; `health-reporter` + `retro` still run |
| **Lane skills** (S8 mostly) | The project's actual stack matches the lane | Unmatched lanes never fire — a Python+React app invokes `python-pro`/`react-expert`, not `golang-pro`/`swift-expert` |

**Rule of thumb:** the *unconditional* backbone every project runs is Stages 1 → 2 → 3 → 5 → 7 → 8 → 10 → 11 → 13 →
14 → 15. Everything else keys off a predicate above. This is exactly why "193 assets placed" ≠ "193 assets fire for
any one project" — most runs exercise a minority of the catalog, selected by these gates.

---

## Stage-by-stage

### Stage 0 — Bootstrap & governance *(once per project)*

Establish the rules of the game before any spec exists, and recover ground truth if the project isn't greenfield.

1. **`constitution`** — write/amend `docs/constitution.md` (semantically versioned project principles).
   Everything downstream treats it as binding: `analyze` flags any conflict with a MUST principle as CRITICAL,
   `converge` emits constitution-violation remediation first.
2. **Legacy path** *(inherited/undocumented repo)* — **`spec-miner`** reverse-engineers observed requirements in
   EARS format from the code itself; **`gate-reverse-engineer`** promotes that into a "Legacy SDD", "Legacy PRD",
   and retrospective ADRs the rest of the pipeline can plan against.
3. **Existing-docs path** *(a pile of ADRs/PRDs/specs already exists)* — **`doc-classifier`** (one per doc,
   parallel) types each as ADR/PRD/SPEC/DOC; **`doc-synthesizer`** merges them under precedence rules into
   `INGEST-CONFLICTS.md` + per-type intel, hard-blocking on LOCKED-vs-LOCKED contradictions.
4. **`cso`** *(existing-code path — Legacy entry, or a Continuing-milestone entry at milestone 2+)* — a full
   15-phase Chief-Security-Officer audit of whatever code is already in the repo, saved to
   `.security-reports/*.json`. Skipped on a true first-milestone Greenfield entry — there's no code yet to scan.
   This is `cso`'s *other* scheduled invocation; see Stage 12 for its per-phase companion run. Establishes the
   security baseline `planner`'s Stage 7 `<threat_model>` step consults before assigning threat dispositions, and
   the evidence `sdd-review-cto` can weigh at Stage 2.
5. **`graphify`** — turn the repo (and any doc corpus) into a persistent, queryable `graph.json` +
   `GRAPH_REPORT.md`. `planner` and `phase-researcher` later query it for dependency context.

### Stage 1 — Requirements & product framing *(GWD steps 1–3)*

Turn a PRD/idea into a validated, unambiguous, testable spec with a numbered story bank. **First milestone:**
input is a fresh PRD. **Every milestone after that:** input is `docs/BACKLOG.md`'s Now/Next items — see
[New milestone = new project](#new-milestone--new-project).

1. **`brainstorming`** — the hard gate: no implementation may begin until a design is explored and approved.
   Pure ideation — explores context, interviews one question at a time, proposes 2-3 approaches, gets
   section-by-section design approval, then hands off to `specify` with that approved design as context.
   Does not write its own spec file, run its own quality checks, or invoke planning directly — those were
   folded into `specify` after a Stage 0/1 audit found brainstorming's old steps 5-8 ran a second, competing
   "idea → spec → plan" path under a different file convention (`docs/specs/YYYY-MM-DD-<topic>-design.md`
   vs. `specify`'s `docs/specs/NNN-feature-name/spec.md`) that bypassed the Clarification Pass and
   `spec-review-cpo` entirely. Includes YC-office-hours and go/no-go idea-validation modes for pre-code
   product ideas. Its mandatory Premise
   Challenge (is this the right problem / what if we do nothing / what already exists) is a lighter, pre-spec pass
   of the same checklist `spec-review-cpo` runs formally below — running it here first avoids drafting a full spec
   for an idea that would fail that gate anyway. If the framing itself looks inherited-by-convention rather than
   reasoned, either skill escalates to a full first-principles decomposition (strip to assumptions, challenge
   each, rebuild from fundamental truths; plus the 5D operational-problem method) — the complete methodology now
   lives in `spec-review-cpo`'s `references/first-principles.md` rather than as a standalone skill.
2. **`specify`** — convert the description (the PRD, or `docs/BACKLOG.md`'s top items for milestone 2+) into a
   structured `spec.md` (WHAT/WHY only), allocating global, never-renumbered **`US-xxx`** story IDs
   (Theme→Pillar→Story-bank hierarchy) — carrying forward any ID a backlog item already had, never re-minting one.
   Interviews from PM Hat (value/goals) and Dev Hat (feasibility/security/edge cases), requires EARS-format
   phrasing for conditional functional requirements, and closes with an inline **Clarification Pass** — the
   bounded 5-question ambiguity scan formerly run by a separate `clarify` skill, writing answers back into the
   spec's `## Clarifications` section. Both halves remain independently invocable ("clarify the spec" re-enters
   the Clarification Pass directly on an existing spec).
3. **`assumption-mapping`** → **`backlog-grooming`** — surface & rank the riskiest VUBF assumptions, design the
   cheapest experiment for the top few; validated assumptions become groomed, sprint-ready backlog items in the
   same `docs/BACKLOG.md` `spec-review-cpo` writes to below — one file, one taxonomy (Now/Next/Later/Icebox/Won't
   Do), fed by two different skills for two different reasons (new candidate ideas vs. descoped existing scope).
4. **`market-researcher`** *(agent)* — sourced market-sizing / competitive / trends intelligence → `MARKET.md`,
   consumed by `spec-review-cpo` below rather than re-derived.
5. **`spec-review-cpo`** *(skill)* — the pipeline's **only** product/strategy gate, and it runs here, once, before
   any plan exists: challenges the premise, commits to a scope posture (expand/hold/cut), scores prioritization
   (RICE/Kano/JTBD/North Star) against the `US-xxx` Theme→Pillar hierarchy if present, and writes a **Scope
   Decision Record** into `spec.md`'s `## CPO Review` section. **Whatever it descopes gets written to
   `docs/BACKLOG.md`** (created if missing), not just noted in prose — every descoped item is an ID-tracked entry
   carrying its `US-xxx`/Pillar forward, ready to seed the *next* milestone's Stage 1. Nothing downstream
   re-litigates strategy once this has run — Stage 7's lenses (`eng`/`design`/`devex`/`goal-backward`) are
   execution-quality checks, not scope checks; the pipeline deliberately runs no founder-mode plan-stage scope re-review (there is no `plan-review-ceo`) at any
   stage (see the note at the top of Stage 7). `the-fool`'s adversarial modes (pre-mortem, red-team) remain
   available as an optional extra pressure-test for unusually high-stakes specs, but are no longer required by
   default now that CPO's own posture
   is inherently adversarial.

### Stage 2 — Architecture & tech stack *(GWD steps 4–5)*

1. **`architecture-designer`** — 5-step workflow → requirements summary, a **`diagram`**-rendered Mermaid
   architecture, ADR-formatted decisions with explicit trade-offs, risks/mitigations. Output: `SDD.md` + ADRs.
2. **`diagram`** — editable `.mmd` + `.svg`/`.png` (optionally `.excalidraw`) as the single source of truth for
   every architecture/flow diagram the reviews will demand.
3. **`sdd-review-cto`** *(skill)* — the pipeline's **only** architecture/technical-strategy gate, and it runs here,
   once, before the roadmap exists: pressure-tests the `SDD.md` + ADRs for technical soundness, ADR quality
   (alternatives + trade-offs actually recorded), innovation-token spend, scalability posture, technical-debt
   trajectory, and evolution path, then writes a locked **Architecture Decision Record** into the SDD's
   `## CTO Review` section. The Stage 2 counterpart to Stage 1's `spec-review-cpo`: CPO settles *what* to build,
   CTO settles *whether the chosen architecture is sound to build on*. It defers security depth to `cso` — not
   concurrent with this review (`cso` isn't a Stage 2 asset; see Stage 0 and Stage 12), so it weighs whatever
   `.security-reports/` already exists rather than a fresh pass — and does **not** review any phase's `PLAN.md`
   — that's `plan-review-eng`'s job at Stage 7, against a different artifact. Nothing downstream re-litigates the
   architecture once this locks it.

### Stage 3 — Research & roadmap *(GWD step 7)*

1. **`project-researcher`** ×4 *(agents, parallel — STACK / FEATURES / ARCHITECTURE / PITFALLS)* — ecosystem
   research with a strict Context7 → official-docs → WebSearch hierarchy and honest confidence tags. They write
   but never commit.
2. **`research-synthesizer`** — reads all four, writes & commits `SUMMARY.md`, derives suggested phase structure.
3. **`roadmapper`** — derive phases from requirement categories & dependencies (never a "Setup→Core→Polish"
   template), enforce **vertical slices**, validate 100% requirement coverage, write `ROADMAP.md` + initialize
   `STATE.md`.

> **Boundary ‖** — this is a natural `/clear` point (mirrors GWD's boundary after step 3/roadmap).

### Stage 4 — Design system *(GWD step 6 — once, only if the project has a UI lane and no `DESIGN.md`)*

1. **`design-consultation`** — establish typography/color/layout/spacing/motion as one coherent system (anti-AI-slop
   discipline), write `DESIGN.md`. Includes "Variant shotgun" mode for competing directions. Delivery is **always**
   Claude Design — no local-file fallback. It is also the **only** skill that resolves or binds
   `claude_design_system_id`; every downstream skill just reads that id from `DESIGN.md` and stops if it's absent.
2. **`design-html`** — turn the approved system into a real, responsive, accessible screen, built directly as a
   Claude Design `.dc.html` deliverable (never a plain local HTML file). Reads `claude_design_system_id` from
   `DESIGN.md` (stops and points back to `design-consultation` if missing) rather than resolving it itself. Also
   fires standalone in Stage 8 for a single phase's screen, where it creates its own screen-scoped project bound
   to that same system id (never design-consultation's demo project).
`design-handoff` and `plan-review-design` are **not** Stage 4 assets despite being about design — see the
table footnote above for `plan-review-design` (fires in Stage 7), and Stage 8 below for `design-handoff`
(fires per phase, bridging a finished Claude Design screen into codebase-native code —
`get_claude_design_prompt` already auto-loads the system's context for anything staying inside Claude
Design, so design-handoff's translated cheat sheet only earns its keep for the *codebase-side*
implementer, which doesn't exist until a phase is actually being built).

**Design system vs. project — and the one gap MCP can't close:** a Claude Design *design system* (the shared,
reusable token/asset library — fonts, colors, spacing, component templates) is a different object from a Claude
Design *project* (one deliverable, e.g. a demo preview or a single screen). Projects *bind* to a system via
`design_system_id`; no MCP tool creates a design system — that's a Claude Design UI-only action. When
`design-consultation` runs and no existing system fits, it composes a **paste-ready prompt** from the approved
design decisions (aesthetic, typography, colors, spacing, motion, seed templates), saves it to
`.claude/design/claude-design-system-prompt.md`, and has the user paste it into Claude Design directly to create the
system — then reports the resulting id back to store as `claude_design_system_id`. This run's own delivery still
proceeds without blocking on that manual step.

**Model selection for Claude Design work:** whenever `design-consultation` or `design-html` is about to make its
first `mcp__claude-design__*` call, it asks once (per invocation) which model should perform that generation work —
Sonnet (high thinking, default), Opus, or Fable — then **always** dispatches via the Agent tool's `model` override
to run it, regardless of which model the current session happens to be (there's no way for a skill's instructions
to change which model is answering the current turn — dispatch is the only mechanism that actually guarantees the
choice). See `references/claude-design-mcp-protocol.md` for the shared protocol both skills follow.

**Not part of this path:** Stage 6's `ui-researcher`/`ui-checker` never touch the claude-design MCP — they write
`UI-SPEC.md`, a per-phase constraints *contract* (hard limits, component vetting), not visuals. The actual
per-phase screens this contract governs are what Stage 8's `design-html` invocation (above) builds.

---

## The per-phase loop *(GWD steps 8–14, repeated per roadmap phase)*

### Stage 5 — Phase discovery *(GWD step 8)*

Build the context a planner needs, cheaply, before writing tasks.

- **`codebase-mapper`** ×4 *(agents — tech / arch / quality / concerns)* — write `.planning/codebase/*.md` maps. For
  the `arch`/`concerns` focuses specifically, checks for an existing `graphify` graph first and queries it before
  fresh exploration — its community detection and hotspot analysis (`god_nodes`/`surprising_connections`) map
  directly onto ARCHITECTURE.md's Layers/Key Abstractions and CONCERNS.md's Fragile Areas, so a pre-built graph is
  a starting point, not something to silently re-derive from scratch. The `tech`/`quality` focuses have no graphify
  equivalent (package manifests, lint config) and always explore fresh.
- **`pattern-mapper`** — map each new/changed file to its closest existing analog with line-numbered excerpts → `PATTERNS.md`.
- **`assumptions-analyzer`** — deep-read 5–15 source files, return evidence-cited, confidence-labeled assumptions.
- **`advisor-researcher`** *(per gray-area decision)* — one 5-column options comparison table per open question.
- **`phase-researcher`** — investigate the phase's technical domain (don't-hand-roll list, pitfalls, package-legitimacy gate) → `RESEARCH.md`.
- **`graphify`** *(query)* — answer phase-relevant dependency questions from the existing graph instead of re-reading.

### Stage 6 — AI / UI phase specs *(conditional)*

- **AI work (GWD step 9):** **`domain-researcher`** *(agent)* researches practitioner evaluation criteria and
  failure modes into `AI-SPEC.md §1b`; the **data-ai lane** then owns the eval contract — **`eval-planner`** designs
  the strategy/rubrics, **`eval-auditor`** later audits coverage; **`framework-selector`** / **`ai-researcher`** /
  **`rag-architect`** / **`prompt-engineer`** / **`ml-pipeline`** etc. supply the build methodology. All four of
  `framework-selector`/`ai-researcher`/`domain-researcher`/`eval-planner` now check for Stage 5's `RESEARCH.md` (if
  it exists) before researching — a Stage 5/6 audit found this AI lane was the only part of Stage 6 that never
  consumed Stage 5 output (the UI lane below already did), risking duplicated research and un-reconciled stack picks
  for the same phase.
- **UI work (GWD step 10):** **`ui-researcher`** *(agent)* produces the `UI-SPEC.md` design contract (hard
  constraints: ≤4 font sizes, spacing multiples of 4, registry-safety vetting); **`ui-checker`** *(agent)* validates
  it BLOCK/FLAG/PASS before planning may proceed. Both now read Stage 4's `DESIGN.md` (repo root) when it exists —
  it's the project-wide authority for spacing/typography/color, and the same audit found neither agent actually
  read it despite the catalog already claiming they did; `ui-researcher` now maps DESIGN.md's declared tokens onto
  the phase-level contract instead of re-asking, and `ui-checker` BLOCKs on undeclared drift from it.

### Stage 7 — Plan the phase *(GWD step 11)*

**No scope/strategy lens here, by design.** That question was already settled at Stage 1 by `spec-review-cpo` and
locked into the spec's Scope Decision Record; architecture strategy was settled at Stage 2 by `sdd-review-cto`. A
founder-mode scope review is not part of this pipeline at any stage (there is no `plan-review-ceo`) — running a
second scope review after the spec has already committed to a posture would re-litigate a decision that's already
made, on an artifact (the plan) whose job is execution, not strategy. The 4 lenses below are all execution-quality
checks.

1. **`writing-plans`** *(skill)* + **`planner`** *(agent)* — a skill+agent pair, not two competing authors.
   `writing-plans` is the canonical authoring methodology and `<task>` format (used standalone for interactive
   planning); `planner` is the pipeline agent that **invokes `writing-plans`** to author each plan, then adds the
   pipeline wrapping — multi-plan wave/track decomposition, dependency graph, frontmatter, the `## Parallel
   Execution Map`, file naming, and git. Both emit the same `PLAN.md` task format (with `complexity_signals` +
   goal-backward must-haves), so both flow through the review + gate chain below. Output: `PLAN.md`.
2. **`plan-review`** *(command)* → **`plan-reviewer`** *(agent)*, dispatched once per lens **in parallel**:
   **`plan-review-eng`** (architectural soundness / code quality / test coverage / performance),
   **`plan-review-design`** (UI), **`plan-review-devex`** (developer-facing surface),
   **`plan-review-goal-backward`** (will it actually hit the goal — requirement coverage, dependency correctness,
   scope-reduction detection).
3. **`gate-plan-review`** *(agent)* — independent, deterministic complexity-score gate on every track's declared
   Model/Effort, plus a **non-Claude** review engine (Gemini → Codex → Claude fallback, per
   `references/independent-review.md`). `gate_passed: true` unlocks Wave 1.
4. **`analyze`** — read-only cross-artifact audit (spec ↔ `PLAN.md` ↔ constitution) with a requirement-to-task
   coverage table before any code is written. Reads the phase's `PLAN.md` with its tasks embedded as `<task>`
   blocks — this pipeline's single-file plan convention, the same one Stage 11's `converge` now reads and appends
   to (a Stage 7/11 audit retargeted `converge` off the Spec-Kit `spec.md`/`plan.md`/`tasks.md` triad, which
   nothing in dev-kit produces).

**Default review tier (cost vs. rigor):** running every applicable lens plus `gate-plan-review` is the maximum-rigor
setting; the conditional-gates table already auto-prunes `plan-review-design`/`-devex` for phases with no UI/dev-facing
surface. For everyday phases, the **minimum bar** is `gate-plan-review` + `plan-review-goal-backward` — the one gate
that verifies the plan actually achieves its goal, paired with the one that verifies complexity/effort honesty and
architectural alignment. Escalate to the full lens set (`eng`, plus `design`/`devex` when applicable) for
higher-stakes phases: new architecture, security/payments/auth surface, or anything touching >15 files. This is a
project-level policy choice, not a hard rule — set it once in `CLAUDE.md` and `plan-review` (command) can default to
the lighter tier, with the full set still available as an explicit escalation.

> **Boundary ‖** — natural `/clear` point (mirrors GWD's boundary after step 11/plan).

### Stage 8 — Execute the phase *(GWD step 12 — run in-house, TDD-first, per-track model/effort)*

1. **`using-git-worktrees`** — isolate the workspace, install deps, confirm a clean baseline.
2. **`sprint-execution`** *(skill)* — the spine: one subagent per track per wave in its own worktree, mandatory
   `git reset --hard` base-sync, TDD-first task contracts, per-task briefs-in/reports-out, two-stage review gates,
   a compaction-proof progress ledger. **Orchestrator must not start Wave N+1 until Wave N merges.**
3. **`test-driven-development`** — RED → GREEN → REFACTOR inside every track (the "no production code without a
   failing test first" iron law).
4. **`dispatching-parallel-agents`** — the lightweight ad-hoc counterpart to `sprint-execution` and
   `bugfix-wave`: same core pattern (one focused, self-contained subagent per independent problem,
   dispatched in parallel), with none of their ceremony — no plan file, no worktree isolation, no
   wave/gate protocol. Reach for it when you have 2+ independent tasks but neither a written plan
   nor a triaged bug list yet.
5. Implementation skills, per surface: **`fullstack-guardian`** (frontend+backend+security together),
   **`secure-code-guardian`** (auth/input/crypto), **`refactoring-specialist`** (injected into any track touching
   existing code — behavior-preserving, one move at a time).
6. **`guard`** — destructive-command warnings + edit-scope freeze when a track touches prod or shared surface.
7. **`design-handoff`** *(UI tracks only)* — bridges a `design-html`-built Claude Design screen into this track's
   actual codebase: translates `DESIGN.md` into a hex/typography quick-reference and copy-paste component prompts
   for the lane skill below to build against, since a codebase-side implementer has no automatic access to the
   Claude Design system's context (`get_claude_design_prompt` only auto-loads that for work staying inside Claude
   Design itself). Runs once its first output is needed, per phase — not eagerly at Stage 4, since at that point
   there's no codebase yet to bridge into.
8. **`verification-before-completion`** — every "done" claim backed by fresh command output, not confidence.
9. **Lane skills** — the actual framework work routes here (see [Lane routing](#lane-routing)): e.g. `python-pro` /
   `fastapi-expert` / `postgres-pro` (backend), `react-expert` / `nextjs-developer` (web), `swift-expert` /
   `flutter-expert` (mobile), `terraform-engineer` / `kubernetes-specialist` (infra), `payment-integration` /
   `fintech-engineer` (specialized).

### Stage 9 — Debug *(as needed, inside execution)*

- **`debug`** *(command)* → **`debugger`** *(agent)* ← **`systematic-debugging`** *(skill)* — root-cause-first,
  one falsifiable hypothesis at a time, 3-strike rule, persistent debug file that survives context resets, minimal
  fix + failing-then-passing regression test. Archives every resolved session to its own exhaustive,
  symptom-matched case log (`.planning/debug/knowledge-base.md`) — read at the start of every future investigation
  loop — and, only when the root cause generalizes beyond the one incident, also cross-posts a `pitfall` entry to
  `learn`'s ledger. A Stage 8–13 audit found these two stores had no bridge (durable findings were invisible
  outside debug sessions) and, after weighing a full merge, kept them separate: one is a case log matched by
  symptom keywords and written for every bug, the other a curated, cross-session insight store — different types
  of knowledge, not just different file formats.
- **`learn`** — record the gotcha/convention/pitfall to `.claude/learnings.jsonl` so the next session doesn't
  rediscover it.

### Stage 10 — Adversarial review ↔ fix loop *(GWD step 13)*

1. **`review`** *(command)* → **`code-review-gate`** *(agent, round mode)* — one round of a ≤6-round adversarial
   loop against the sprint branch; severity-classified findings with a quote-the-motivating-line verification gate,
   engine-selected (default Codex for rounds) → canonical `findings.json`.
2. **`bugfix-wave`** *(skill)* — consume the findings: classify by model/effort, group into file-conflict-free
   tracks/waves, one atomic verified commit per fix with a structural-fix mandate (fix the *class*, add a regression
   guard). Loop with the reviewer until clean or the ≤6-round cap.
3. **`code-review-protocol`** — governs how the caller dispatches the reviewer and responds to feedback
   (verify-before-implementing; no gratitude-performance).
4. **`qa`** *(command/agent)* — browser-driven QA on the running app/diff: health score, before/after screenshots,
   fix-then-regression-test loop (or `report_only`).
5. **`ui-auditor`** *(if phase shipped UI)* — cheap, static-grep-first, no browser required: scores this phase's
   diff against its own `UI-SPEC.md` (or abstract 6-pillar standards) → `UI-REVIEW.md`. Kept in the per-phase loop
   deliberately — it's diff-scoped and mechanical, unlike the three passes below.

   **Deliberately NOT per-phase:** `design-reviewer`, `devex-review`, and `accessibility-tester` moved to Stage 15
   (milestone close-out) — see the note there. They're expensive, browser-driven, whole-surface audits (cross-page
   consistency, end-to-end developer journey, site-wide WCAG conformance) that don't decompose cleanly to one
   phase's diff and would otherwise re-audit unchanged pages on every phase. Keeping the phase loop to
   `code-review-gate`/`bugfix-wave`/`qa`/`ui-auditor` keeps Stage 10 fast on every phase.

### Stage 11 — Verify the goal

1. **`verify`** *(command)* → **`verifier`** *(agent)* — goal-backward: observable truths → artifact exists /
   substantive / wired / real data flowing → key-link checks → `VERIFICATION.md` (passed / gaps_found / human_needed).
   Step 6d additionally checks each requirement for real automated test coverage (independent of pass/fail status)
   and structures any misses as a `validation_gaps` list — `nyquist-auditor`'s actual input, below.
2. **`converge`** — the remediation compiler: assess present-state code against `spec.md` + the phase's `PLAN.md`(s)
   (plus the constitution, and `VERIFICATION.md`'s gaps as pre-confirmed evidence when present), append
   missing/partial/contradicts/unrequested gaps as new `<task>` blocks under a `## Phase N: Convergence` header at
   the end of the relevant `PLAN.md` (never rewrites existing tasks). An exhaustive requirement-level sweep
   (FR/SC/AC + constitution MUST) that `verifier`'s roadmap-truth check doesn't attempt — the two are
   complementary, not redundant.
3. **`integration-checker`** *(agent)* — cross-phase wiring: every export imported *and used*, every API route has a
   real consumer, sensitive routes are auth-protected, E2E flows trace end-to-end.
4. **`nyquist-auditor`** *(agent)* — dispatched with `verifier`'s `validation_gaps` as `<gaps>`; for each, write a
   real behavioral test targeting the hardest edge (never a trivially-passing one); FILLED / ESCALATED /
   justified-SKIP. Distinct from `converge`: this fills missing *test coverage* for requirements that already work,
   not missing *implementation*.
5. **`gate-automation`** *(agent, GWD step 14 territory)* — diff the sprint for new/changed primary flows, author
   golden-path + critical-edge E2E flows (Playwright web / Maestro mobile), run them locally, check for an
   on-demand E2E CI job → `authoring-report.json`. Invokes **`test-master`** / **`playwright-expert`** (web lane)
   for test-design guidance. A Stage 8–13 audit folded this in from its own former stage — it answers the same
   question as `verifier`/`converge` above ("is the goal actually covered?") at the E2E-user-flow layer, and was
   a near-single-asset stage on its own.

### Stage 12 — Security & compliance gate

- **`security-audit`** *(command)* → **`security-auditor`** *(agent)* — verify every declared threat mitigation at
  *all* entry points (not one grep hit) → `SECURITY.md`; **open threats block the phase from shipping**. Its
  methodology home for the general-audit fieldwork pass is `security-reviewer` (below) — it does not restate that
  methodology, only the threat-register-disposition verification that's unique to it.
- **`cso`** *(skill, `--diff` mode)* — this phase's companion run to its Stage 0 full audit: an incremental sweep
  of just this phase's changes (attack surface, secrets, supply chain, CI/CD, STRIDE), trend-tracked by fingerprint
  against the prior `.security-reports/` entry so Resolved/Persistent/New findings are visible phase over phase.
  Always has code to scan by construction — Stage 12 runs after Stage 8 (Execute) for this phase.
- **`penetration-tester`** *(agent)* — authorized active exploitation (recon / OWASP / API / network / cloud).
- **`compliance-auditor`** *(agent)* — map named regulations (GDPR/HIPAA/PCI/SOC2/…) to actual controls; the
  **product lane** `gdpr-ccpa-compliance` / `hipaa-compliance` skills supply the framework detail.
- **`security-reviewer`** *(skill)* — the manual SAST + auth/input/crypto review methodology `security-auditor`
  declares as its methodology home; also the general-audit fallback `security-auditor` runs directly when a phase
  has no `<threat_model>` to verify against.
- **`dependency-manager`** *(agent)* — CVE / version-conflict / license / dead-weight sweep, incremental tested
  updates. A Stage 8–13 audit moved this in from the verify stage — a dependency/license sweep answers "is this
  compliant and safe to ship," the security gate's question, not "did we build the goal." Overlaps with
  `security-auditor`'s own dependency fieldwork (both may surface the same CVE); that overlap is acceptable,
  same layering as `security-auditor`/`security-reviewer` elsewhere in this stage. **Lane routing:** the
  **specialized lane**'s `license-engineer` handles deep license-compliance questions this agent's sweep flags.

---

## Milestone close-out

### Stage 13 — Document

- **`document-generate`** / **`code-documenter`** — Diataxis doc set + validated docstrings/API docs (every example
  actually compiles/runs).
- **`content-qa`** — de-slop the prose (AI-ism scan, content-type-aware strictness) before publishing.
- **`document-release`** — build a coverage map of shipped-vs-documented public surface, sync each doc against the
  diff, polish CHANGELOG voice (never clobber history), then **`doc-verifier`** *(agent)* re-verifies every checkable
  claim (file paths, commands, endpoints) against the filesystem.

### Stage 14 — Ship & deploy *(GWD step 15 territory)*

- **`finishing-a-development-branch`** *(skill, manual)* — the safe 4-option (merge / PR / keep / discard) menu with a
  pre-merge test gate and provenance-checked worktree cleanup. **Or**, fully automated:
- **`ship`** *(skill)* — 14-step non-interactive pipeline: merge base → test-failure triage → coverage-gap tracing +
  generate missing tests → plan-completion audit → adversarial pre-landing review with auto-fix → version bump →
  CHANGELOG → bisectable commits → push → create/update PR.
- **`land-and-deploy`** *(skill)* — picks up where `ship` left off: readiness gate → merge → poll the deploy platform
  → verify production health → revert as the escape hatch. **Infra lane** owns the platform detail: `devops-engineer`
  (CI/CD, go/no-go gates), `terraform-engineer` / `cloud-architect` (IaC, wave migrations), `kubernetes-specialist` /
  `docker-expert`, `sre-engineer` (SLIs/SLOs), `monitoring-expert`.

### Stage 15 — Operate, retrospect, close

- **`health`** *(command)* → **`health-reporter`** *(agent)* — weighted 0–10 codebase-quality dashboard with trend history.
- **`performance-engineer`** *(agent)* — measure-first bottleneck elimination with before/after evidence.
- **`incident-responder`** *(agent)* — triage → contain → preserve evidence → diagnose → blameless postmortem, if
  production breaks; hands off to `compliance-auditor` for breach-notification obligations. `chaos-engineer` (infra
  lane) proactively rehearses these failures.
- **Experience audit** *(if the milestone shipped UI or a developer-facing surface, across any of its phases)*:
  **`design-reviewer`** in full/deep mode *(cross-page consistency, whole-site AI-slop sweep, design-score delta
  vs. the last milestone's `design-baseline.json` via regression mode)*, **`devex-review`** *(the real,
  now-stable getting-started flow — TTHW, CLI `--help`, real errors — measuring a whole-product journey that
  isn't meaningful mid-phase)*, **`accessibility-tester`** *(site-wide WCAG 2.1 AA conformance)*. Moved here from
  the former per-phase Stage 10 slot — see that stage's note — to keep the phase loop light and because these
  three checks are inherently whole-surface, not diff-scoped.
- **`retro`** *(command)* → **`retro`** *(agent)* — periodic engineering retrospective mined from git history.
- **Product lane** analytics — `ab-test-analysis`, `cohort-analysis`, `growth-loops` — close the loop back to Stage 1's
  assumption bank with real usage evidence.
- **Milestone archive + git tag** — the milestone's phases and `STATE.md` get archived (dev-kit has no
  `/complete-milestone` command; the archival mechanics are the Orchestration layer's job). This is **not** the
  pipeline's terminal state, though — see below.

### New milestone = new project

Archiving a milestone doesn't end the pipeline; it decides whether to loop. Check `docs/BACKLOG.md`:

- **Now/Next items exist** → start the next milestone by re-entering **Stage 0**, run the entire pipeline again.
  Treat it exactly like a new project — same `constitution` check (now in update mode per the "Continuing
  milestone" entry-path branch), same `graphify` (incremental), same Stage 1 → 16 sequence. The only structural
  difference from milestone 1 is Stage 1's input: `specify` reads `docs/BACKLOG.md`'s top items instead of
  waiting for a fresh PRD, and `spec-review-cpo` runs again against whatever didn't fit last time — posture,
  premise, and prioritization all get re-evaluated fresh for this milestone, not inherited from the last one.
- **Backlog is empty, or only Later/Icebox items remain** → the project is genuinely done for now. Terminal state,
  same as before.

This is why Stage 0's entry path (see [Three structural branches](#three-structural-branches)) has to be
re-evaluated every milestone, not just once: a repo mid-way through its third milestone is never "greenfield"
again.

---

## Cross-cutting assets

These aren't a stage — they run *throughout* the pipeline:

| Asset | Role | Fires |
|-------|------|-------|
| `context-save` / `context-restore` | Session continuity across `/clear`, branch switches, worktrees | At every boundary ‖ and on resume |
| `learn` | Durable cross-session knowledge ledger | Whenever a gotcha/convention surfaces (esp. Stages 8–11) |
| `guard` | Destructive-command + edit-scope safety | Any prod/shared-surface work (esp. Stage 8, 14) |
| `graphify` | Persistent queryable knowledge graph | Built in Stage 0, queried in Stages 5, 7 |
| `diagram` | Editable Mermaid → SVG/PNG artifacts | Any architecture/plan/design step (2, 4, 7) |
| `writing-skills` | Codify a repeated workflow into a new dev-kit skill | Post-`retro`, when Stage 15 surfaces a reusable pattern |

---

## Lane routing

The 7 stack-lane plugins are **reference packs** with no phase structure of their own — they plug into the core
pipeline at the stages where their expertise is needed (overwhelmingly Stage 8 execution, plus review/ship stages):

| Lane (plugin) | Plugs into | Representative assets |
|---|---|---|
| **Backend** (`dev-kit-backend`, 26) | Stage 8 execution; `legacy-modernizer` at Stage 0/8 | `python-pro`, `golang-pro`, `rust-engineer`, `fastapi-expert`, `spring-boot-engineer`, `postgres-pro`, `api-designer`, `microservices-architect` |
| **Web** (`dev-kit-web`, 11) | Stage 8; `playwright-expert` at Stage 11 | `react-expert`, `nextjs-developer`, `vue-expert`, `typescript-pro`, `electron-pro` |
| **Mobile** (`dev-kit-mobile`, 4) | Stage 8; Maestro flows at Stage 11 | `swift-expert`, `kotlin-specialist`, `flutter-expert`, `react-native-expert` |
| **Data/AI** (`dev-kit-data-ai`, 17) | Stage 6 (eval contract) + Stage 8 | `eval-planner`, `eval-auditor`, `framework-selector`, `ai-researcher`, `rag-architect`, `prompt-engineer`, `ml-pipeline`, `llm-architect` |
| **Infra** (`dev-kit-infra`, 14) | Stage 14 deploy + Stage 15 operate | `devops-engineer`, `terraform-engineer`, `cloud-architect`, `kubernetes-specialist`, `sre-engineer`, `chaos-engineer`, `monitoring-expert` |
| **Specialized** (`dev-kit-specialized`, 19) | Stage 8 (domain build); `license-engineer` at Stage 12 | `payment-integration`, `fintech-engineer`, `healthcare-admin`, `mcp-developer`, `blockchain-developer`, `game-developer`, `seo-specialist` |
| **Product** (`dev-kit-product`, 5) | Stage 1 (assumptions) + Stage 12/15 (compliance, analytics) | `ab-test-analysis`, `cohort-analysis`, `growth-loops`, `gdpr-ccpa-compliance`, `hipaa-compliance` |

---

## What the pipeline still needs (the glue dev-kit doesn't ship)

This document is the **Skill/Agent/Command spine**. A *running* GWD pipeline also needs three layers dev-kit
deliberately leaves out — see [`workflow-recommendations.md`](workflow-recommendations.md) for the full table:

- **Orchestration** *(not-yet-built)* — the persistent, cross-session sequencer that walks Stages 0→15, survives a
  `/clear`, governs auto/manual/sleep modes, holds the context boundaries ‖, and carries `STATE.md` / calibration
  state across many sessions. This is what actually *drives* everything above.
- **Workflow** *(buildable today)* — bounded deterministic scripts for the fan-out/loop chunks: Stage 8 wave/track
  dispatch (`sprint-execution`/`bugfix-wave`), the Stage 10 ≤6-round review↔fix loop, per-track complexity scoring,
  and the parallel dispatches in Stages 3/5/7 (`plan-reviewer`, `codebase-mapper`, `doc-classifier`).
- **Hooks** *(candidates)* — content-safety scanning on read/write, context-budget warnings, commit-message
  enforcement, graphify freshness nudges, and STATE.md sync reminders.

---

## Coverage appendix — every asset placed

**All 94 core assets** (49 skills · 37 agents · 8 commands), by the stage that owns them:

- **Stage 0:** `constitution`, `spec-miner`, `gate-reverse-engineer`, `doc-classifier`, `doc-synthesizer`, `graphify`
  (`cso` also fires here on an existing-code entry path, but is counted once under Stage 12, its home)
- **Stage 1:** `brainstorming`, `specify` (generate + clarify in one skill), `assumption-mapping`, `backlog-grooming`, `market-researcher`, `spec-review-cpo` (`the-fool` remains available as an optional extra pressure-test, no longer in the default list; `first-principles-thinking`, `clarify`, and `feature-forge` were folded into `specify`/`spec-review-cpo` — see the note at the top of this document)
- **Stage 2:** `architecture-designer`, `diagram`, `sdd-review-cto`
- **Stage 3:** `project-researcher`, `research-synthesizer`, `roadmapper`
- **Stage 4:** `design-consultation`, `design-html` (`plan-review-design` is introduced here conceptually but
  only executes — and is counted — under Stage 7; `design-handoff` is counted under Stage 8, where it actually
  fires — see both stages' notes)
- **Stage 5:** `codebase-mapper`, `pattern-mapper`, `assumptions-analyzer`, `advisor-researcher`, `phase-researcher`
- **Stage 6:** `domain-researcher`, `ui-researcher`, `ui-checker`
- **Stage 7:** `writing-plans`, `planner`, `plan-review` (cmd), `plan-reviewer`, `plan-review-eng`, `plan-review-design`, `plan-review-devex`, `plan-review-goal-backward`, `gate-plan-review`, `analyze` (`plan-review-eng` is a Stage 7 lens reviewing `PLAN.md`; the Stage 2 SDD/ADR review is now `sdd-review-cto`'s job. There is no `plan-review-ceo` — a founder-mode scope re-review is intentionally not part of this pipeline; scope is owned by `spec-review-cpo` at Stage 1)
- **Stage 8:** `using-git-worktrees`, `sprint-execution`, `test-driven-development`, `dispatching-parallel-agents`, `fullstack-guardian`, `secure-code-guardian`, `refactoring-specialist`, `guard`, `design-handoff`, `verification-before-completion`
- **Stage 9:** `debug` (cmd), `debugger`, `systematic-debugging`
- **Stage 10:** `review` (cmd), `code-review-gate`, `bugfix-wave`, `code-review-protocol`, `qa` (cmd), `qa` (agent), `ui-auditor` (`design-reviewer`, `accessibility-tester`, and `devex-review` moved out to Stage 15 — see that stage's note and Stage 10's own note above)
- **Stage 11:** `verify` (cmd), `verifier`, `converge`, `integration-checker`, `nyquist-auditor`, `gate-automation`, `test-master` (folded in from the former standalone Automation-coverage stage — see the note at the bottom of this document)
- **Stage 12:** `security-audit` (cmd), `security-auditor`, `cso`, `penetration-tester`, `compliance-auditor`, `security-reviewer`, `dependency-manager` (relocated in from the verify stage — see the note at the bottom of this document)
- **Stage 13:** `document-generate`, `code-documenter`, `content-qa`, `document-release`, `doc-verifier`
- **Stage 14:** `finishing-a-development-branch`, `ship`, `land-and-deploy`
- **Stage 15:** `health` (cmd), `health-reporter`, `performance-engineer`, `incident-responder`, `design-reviewer`, `devex-review`, `accessibility-tester`, `retro` (cmd), `retro` (agent)
- **Cross-cutting:** `context-save`, `context-restore`, `learn`, `writing-skills` (+ `guard`, `graphify`, `diagram` listed above)

**All 96 lane assets** route in via [Lane routing](#lane-routing) — predominantly at Stage 8, with the Data/AI eval
pair at Stage 6, infra at Stages 14–15, and product analytics/compliance at Stages 1/12/15. The full roster, every
one named against the stage it plugs into:

**Backend** (`dev-kit-backend`, 26) — Stage 8 execution *(languages/frameworks/data/API)*; `legacy-modernizer` at
Stage 0/8:
`cpp-pro`, `csharp-developer`, `golang-pro`, `python-pro`, `rust-engineer`, `node-specialist`, `php-pro`,
`django-expert`, `fastapi-expert`, `nestjs-expert`, `dotnet-core-expert`, `java-architect`, `spring-boot-engineer`,
`laravel-specialist`, `symfony-specialist`, `rails-expert`, `elixir-expert`, `database-optimizer`, `postgres-pro`,
`sql-pro`, `api-designer`, `graphql-architect`, `microservices-architect`, `websocket-engineer`,
`dotnet-framework-4.8-expert`, `legacy-modernizer`.

**Web** (`dev-kit-web`, 11) — Stage 8; `playwright-expert` at Stage 11:
`react-expert`, `nextjs-developer`, `angular-architect`, `vue-expert`, `vue-expert-js`, `javascript-pro`,
`typescript-pro`, `playwright-expert`, `shopify-expert`, `wordpress-pro`, `electron-pro`.

**Mobile** (`dev-kit-mobile`, 4) — Stage 8; Maestro flows at Stage 11:
`flutter-expert`, `kotlin-specialist`, `react-native-expert`, `swift-expert`.

**Data/AI** (`dev-kit-data-ai`, 17) — Stage 6 eval contract (`domain-researcher` → the eval pair) + Stage 8 build:
`data-analyst`, `data-engineer`, `data-scientist`, `pandas-pro`, `spark-engineer`, `ml-engineer`, `ml-pipeline`,
`fine-tuning-expert`, `nlp-engineer`, `reinforcement-learning-engineer`, `llm-architect`, `rag-architect`,
`prompt-engineer`, `framework-selector`, `ai-researcher`, `eval-planner`, `eval-auditor`.

**Infra** (`dev-kit-infra`, 14) — Stage 14 deploy + Stage 15 operate:
`cloud-architect`, `terraform-engineer`, `azure-infra-engineer`, `docker-expert`, `kubernetes-specialist`,
`platform-engineer`, `devops-engineer`, `sre-engineer`, `monitoring-expert`, `chaos-engineer`,
`database-administrator`, `network-engineer`, `microsoft-ops`, `powershell-pro`.

**Specialized** (`dev-kit-specialized`, 19) — Stage 8 domain build; `license-engineer` at Stage 12; MCP/tooling at
Stage 0/8:
`cli-developer`, `devtools-engineer`, `mcp-developer`, `atlassian-mcp`, `slack-expert`, `license-engineer`,
`fintech-engineer`, `healthcare-admin`, `legal-advisor`, `risk-manager`, `quant-analyst`, `payment-integration`,
`embedded-systems`, `game-developer`, `iot-engineer`, `salesforce-developer`, `seo-specialist`,
`blockchain-developer`, `visual-asset-generator`.

**Product** (`dev-kit-product`, 5) — Stage 1 assumptions + Stage 12 compliance + Stage 15 analytics:
`ab-test-analysis`, `cohort-analysis`, `growth-loops`, `gdpr-ccpa-compliance`, `hipaa-compliance`.

**Total: 190 / 190 dev-kit assets placed** (94 core + 96 lane) — verified by diffing every catalog header against
this document. `spec-review-cpo` was added alongside this pipeline doc to close the spec-stage product-review gap
(see [Conditional gates & branches](#conditional-gates--branches) and its full entry in
[`core-discovery-and-design.md`](catalog/core-discovery-and-design.md#role-product--requirements-owner));
`first-principles-thinking`, `clarify`, and `feature-forge` were later removed as standalone assets when a
Stage 0/1 audit found their content duplicated inside `specify` and `spec-review-cpo` with no other functional
caller — see the note at the top of this document. A subsequent Stage 2/7 audit made a net-zero skill swap:
`plan-review-ceo` was removed (a founder-mode scope re-review of the plan re-litigated a decision `spec-review-cpo`
already locks at Stage 1) and `sdd-review-cto` was added as Stage 2's architecture-strategy gate; `plan-review-eng`,
formerly claimed to also review the SDD at Stage 2, is now a Stage 7-only lens over `PLAN.md`, and `analyze` was
retargeted from the Spec-Kit `spec.md`/`plan.md`/`tasks.md` triad to this pipeline's single embedded-task `PLAN.md`.
A subsequent Stage 8–13 audit retargeted Stage 11's `converge` the same way — off that same unproduced triad and
onto `spec.md` + the phase's embedded-task `PLAN.md`, appending new `<task>` blocks instead of `tasks.md` checklist
items, and positioned it explicitly as the requirement-level **remediation compiler** alongside `verifier`'s
goal-backward **verdict**. The same audit found `nyquist-auditor` similarly wired to nothing — its `no_test_file` /
`test_fails` / `no_automated_command` gap vocabulary matched neither `verifier`'s failed-truth gaps nor `converge`'s
implementation tasks — and gave `verifier` a new Step 6d that emits a `validation_gaps` list in the shape
`nyquist-auditor` actually consumes, orthogonal to pass/fail status. The same audit also found `cso` misplaced at
Stage 2: every one of its 15 phases (stack detection, attack-surface census, git-history secrets scan, dependency
manifests, CI/CD configs, STRIDE against Phase 0's detected components) assumes an existing checkout, but Stage 2
is the *first* artifact of a greenfield milestone — no code exists yet to scan. `cso` moved to Stage 0 (a full
audit, gated on the entry path already having code — Legacy or Continuing-milestone, never a first-milestone
Greenfield entry) and the Security gate (`--diff` mode, per phase — always has code by construction, since that
stage runs after Stage 8's Execute; numbered Stage 13 at the time, later renumbered Stage 12 — see below).
`security-auditor` was found to duplicate `security-reviewer`'s audit methodology, tool list, and report format
nearly verbatim (~40 lines, including an identical worked example); it now declares `security-reviewer` its
methodology home (the `debugger`/`systematic-debugging` pattern) and keeps only its unique job — verifying a
`<threat_model>`'s declared dispositions. `planner`'s Stage 7 threat-modeling step and `sdd-review-cto`'s Stage 2
review were both wired to consult `cso`'s latest `.security-reports/` entry when one exists, replacing the prior
doc claim of a direct Stage 2 → Security-gate handoff that no code ever actually implemented. A following Stage
8–13 audit pass folded the near-single-asset Automation-coverage stage into the verify stage (`gate-automation`
answers the same "is the goal covered" question `verifier`/`converge` do, at the E2E-user-flow layer) and moved
`dependency-manager` out of the verify stage into the security gate (a CVE/license/version sweep is that gate's
question, not "did we build the goal"; `license-engineer`'s lane-routing note moved with it) — renumbering
Stages 12–16 down to 11–15 throughout this document.

---

*Companion docs: [`gwd-pipeline-gap-analysis.md`](gwd-pipeline-gap-analysis.md) (what GWD has that dev-kit doesn't),
[`workflow-recommendations.md`](workflow-recommendations.md) (the four-homes table + Workflow sweep), and the
[role catalog](catalog/README.md) (every asset documented in full).*
