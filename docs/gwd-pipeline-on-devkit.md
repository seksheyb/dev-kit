# The GWD Pipeline, Rebuilt on dev-kit

**What this is.** A single ordered walkthrough of a *complete* GWD-style pipeline — PRD → shipped,
test-covered, reviewed milestone — expressed entirely in `dev-kit` skills, agents, and commands.
Where `GWD-PIPELINE.md` (the canonical 15-step table in `~/ADD-SDD-Initiator`) binds each
step to an *external* library (Spec-Kit / gstack / GSD / fullstack-dev-skills / custom gate agents),
this document answers the sibling question: **if you were to stand the same pipeline up using only
dev-kit, which asset fires at each step, and in what order?**

Every one of dev-kit's **97 core assets** (52 skills, 37 agents, 8 commands — including `spec-review-cpo`, added
alongside this document to close the spec-stage product-review gap) is placed somewhere below,
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

Stages 0–4 run **once per project/milestone**. Stages 5–13 are the **per-phase loop** (repeat for every
vertical slice the roadmap produced). Stages 14–16 close out the branch, the milestone, and the operate/learn
cycle. Conditional stages are marked *(if …)*.

| # | Stage | Primary dev-kit assets | In → Out |
|---|-------|------------------------|----------|
| **0** | Bootstrap & governance | `constitution` · *(legacy)* `spec-miner` → `gate-reverse-engineer` · *(existing docs)* `doc-classifier` → `doc-synthesizer` · `graphify` | repo/PRD → `constitution.md`, recovered SDD/PRD/ADRs, `graph.json` |
| **1** | Requirements & product framing | `first-principles-thinking` · `brainstorming` · `specify` · `clarify` · `feature-forge` · `assumption-mapping` → `backlog-grooming` · `market-researcher` · `spec-review-cpo` | PRD → `spec.md` (+ `US-xxx` story bank) + locked Scope Decision Record |
| **2** | Architecture & tech stack | `architecture-designer` · `diagram` · `cso` · `plan-review-eng` (lens) | requirements → `SDD.md` + ADRs + threat posture |
| **3** | Research & roadmap | `project-researcher` ×4 → `research-synthesizer` · `roadmapper` | requirements + research → `ROADMAP.md` (vertical slices) + `STATE.md` |
| **4** | Design system *(if UI)* | `design-consultation` → `design-html` → `design-handoff` · `plan-review-design` (lens) | product → `DESIGN.md` + build prompts |
| **5** | Phase discovery | `codebase-mapper` ×4 · `pattern-mapper` · `assumptions-analyzer` · `advisor-researcher` · `phase-researcher` · `graphify` (query) | phase → `CONTEXT.md`, `PATTERNS.md`, `RESEARCH.md`, codebase maps |
| **6** | AI / UI phase specs *(conditional)* | *(AI)* `domain-researcher` → `eval-planner`/`eval-auditor` (data-ai lane) · *(UI)* `ui-researcher` → `ui-checker` | phase → `AI-SPEC.md` / `UI-SPEC.md` |
| **7** | Plan the phase | `writing-plans` · `planner` · `plan-review` (cmd) → `plan-reviewer` → 5 lenses · `gate-plan-review` · `analyze` | context → `PLAN.md` (waves + tracks), reviewed & complexity-gated |
| **8** | Execute the phase | `using-git-worktrees` · `sprint-execution` · `test-driven-development` · `dispatching-parallel-agents` · `fullstack-guardian`/`secure-code-guardian` · `refactoring-specialist` · `guard` · `verification-before-completion` · **lane skills** | plan → code + tests, per-track parallel |
| **9** | Debug *(as needed)* | `debug` (cmd) → `debugger` ← `systematic-debugging` · `learn` | failure → root-cause fix + regression test |
| **10** | Adversarial review ↔ fix loop | `review` (cmd) → `code-review-gate` (round) ↔ `bugfix-wave` · `code-review-protocol` · `qa` (cmd/agent) · `design-reviewer` · `ui-auditor` · `accessibility-tester` · `devex-review` | code → fixes (loop ≤6) |
| **11** | Verify the goal | `verify` (cmd) → `verifier` · `converge` · `integration-checker` · `nyquist-auditor` · `dependency-manager` | code → `VERIFICATION.md`, gaps closed |
| **12** | Automation coverage | `gate-automation` ← `test-master`/`playwright-expert` | code → Playwright/Maestro flows |
| **13** | Security & compliance gate | `security-audit` (cmd) → `security-auditor` · `penetration-tester` · `compliance-auditor` · `security-reviewer` | code → `SECURITY.md`, open threats block ship |
| **14** | Document | `document-generate`/`code-documenter` · `content-qa` · `document-release` → `doc-verifier` | shipped surface → synced docs, CHANGELOG |
| **15** | Ship & deploy | `finishing-a-development-branch` *(manual)* **or** `ship` → `land-and-deploy` · **infra lane** | branch → PR → merged & deployed |
| **16** | Operate, retrospect, close | `health` (cmd) → `health-reporter` · `performance-engineer` · `incident-responder` · `retro` (cmd) → `retro` · milestone archive | milestone → dashboards, postmortems, archive + tag |

**Always-on (cross-cutting, not a stage):** `context-save` / `context-restore` (session continuity),
`learn` (durable knowledge), `guard` (safety), `graphify` (query anytime), `diagram` (any review/design
step), `writing-skills` (codify a repeated workflow into a new skill). See
[Cross-cutting assets](#cross-cutting-assets).

---

## Conditional gates & branches

The pipeline is not a straight line — several stages fire only when a predicate holds, and the whole middle is a
loop. This section is the single place that states, for every branch point, **when it runs** and **what happens when
it doesn't**. (Evaluating these predicates and skipping cleanly is the not-yet-built **Orchestration** layer's job;
dev-kit supplies the assets, not the branch logic.)

### Two structural branches

1. **Entry path (Stage 0)** — mutually exclusive by repo state:
   - *Greenfield* (new project, no code, no docs) → skip the legacy and existing-docs sub-paths entirely; run only
     `constitution` (+ `graphify` once code exists).
   - *Legacy / inherited / undocumented code* → run `spec-miner` → `gate-reverse-engineer` to recover SDD/PRD/ADRs
     before Stage 1.
   - *Existing planning docs* (a pile of ADRs/PRDs/specs) → run `doc-classifier` → `doc-synthesizer` to ingest them.
     These two sub-paths are independent — a repo can trigger both, neither, or one.
2. **The per-phase loop (Stages 5–13)** — runs **once per roadmap phase** produced by Stage 3. Loop position lives in
   `STATE.md`. Stages 0–4 run once per project/milestone; Stages 14–16 run once at close-out. Every per-phase
   conditional below is re-evaluated **for each phase**.

### Conditional gate table

| Gate | Runs when (predicate) | If the predicate is false |
|------|-----------------------|---------------------------|
| `first-principles-thinking` (S1) | The problem framing itself is suspect / inherited-by-convention | Skip; go straight to `brainstorming` |
| `market-researcher` (S1) | A product-direction / sizing / competitive decision is open | Skip; requirements proceed on existing evidence |
| **Design system** (S4) | Project has a UI lane **and** no `DESIGN.md` exists yet | Skip the whole stage — runs **once ever**, never per phase |
| **AI spec** (S6): `domain-researcher` + `eval-planner`/`eval-auditor` | The phase builds an AI/LLM system needing an eval contract | Skip; no `AI-SPEC.md` for this phase |
| **UI spec** (S6): `ui-researcher` → `ui-checker` | The phase has UI work | Skip; no `UI-SPEC.md`. If run, `ui-checker` **BLOCKED** halts planning until fixed |
| `plan-review-design` (S7) | The plan has any UI scope | Auto-reports "not applicable", verdict APPROVE, completeness N/A |
| `plan-review-devex` (S7) | The plan has a developer-facing surface (API/CLI/SDK) | Auto-reports "not applicable", auto-approve N/A |
| `plan-review-eng` / `-goal-backward` (S7) | **Always** (unconditional lenses) | — |
| `plan-review-ceo` (S7) | **Always** runs, but *how* varies: a locked Scope Decision Record from `spec-review-cpo` exists | Inherits posture/premise, checks only for drift (light). No record exists → runs its own full Step 0 (heavy, self-sufficient fallback) |
| `spec-review-cpo` (S1) | A spec exists and a real scope/strategy call is needed before planning | Skip; Stage 7's `plan-review-ceo` falls back to running its own Step 0 from scratch (heavier, later) |
| `refactoring-specialist` (S8) | A track touches existing code | Skip; new-file tracks don't need it |
| `secure-code-guardian` (S8) | Track implements auth / input handling / crypto | Skip |
| `fullstack-guardian` (S8) | Feature spans frontend + backend together | Use narrower lane skills instead |
| `guard` (S8) | Track touches prod / shared / destructive surface | Skip the freeze |
| **Debug** (S9) | A bug / test failure / unexpected behavior occurs | Skip; execution continues |
| UI/DX review passes (S10): `design-reviewer`, `ui-auditor`, `accessibility-tester`, `devex-review` | Phase shipped UI or a developer-facing surface | Skip; `code-review-gate` + `qa` still run |
| `nyquist-auditor` (S11) | `verifier`/`converge` surfaced validation gaps | Skip; nothing to fill |
| `gate-automation` (S12) | Sprint diff added/changed **primary** user flows | No new flows required (internal-only changes excluded) |
| `compliance-auditor` + product compliance skills (S13) | Regulated data/industry in scope (GDPR/HIPAA/PCI/SOC2…) | Skip |
| `penetration-tester` (S13) | Active exploitation is **authorized and in scope** | Skip — agent refuses without written authorization |
| `security-auditor` (S13) | Always runs; **branches internally** | With a threat model → verifies mitigations; without → general audit + recommends `cso` first |
| **Ship mode** (S15) | Automated (`ship` → `land-and-deploy`) vs manual (`finishing-a-development-branch`) — an operator choice, not a repo predicate | Pick one path; both end in a merged/deployed or explicitly-kept branch |
| Infra deploy specifics (S15) | Deploy platform detected (Fly/Render/Vercel/Netlify/GH Actions) | GitLab/unknown → `land-and-deploy` stops, hands off to manual merge |
| `incident-responder` (S16) | An active production incident is underway | Skip |
| **Lane skills** (S8 mostly) | The project's actual stack matches the lane | Unmatched lanes never fire — a Python+React app invokes `python-pro`/`react-expert`, not `golang-pro`/`swift-expert` |

**Rule of thumb:** the *unconditional* backbone every project runs is Stages 1 → 2 → 3 → 5 → 7 → 8 → 10 → 11 → 14 →
15 → 16. Everything else keys off a predicate above. This is exactly why "193 assets placed" ≠ "193 assets fire for
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
4. **`graphify`** — turn the repo (and any doc corpus) into a persistent, queryable `graph.json` +
   `GRAPH_REPORT.md`. `planner` and `phase-researcher` later query it for dependency context.

### Stage 1 — Requirements & product framing *(GWD steps 1–3)*

Turn a PRD/idea into a validated, unambiguous, testable spec with a numbered story bank.

1. **`first-principles-thinking`** *(if the framing itself is suspect)* — strip the problem to irreducible truths
   before accepting the request's framing.
2. **`brainstorming`** — the hard gate: no implementation may begin until a design is explored and approved.
   Includes YC-office-hours and go/no-go idea-validation modes for pre-code product ideas.
3. **`specify`** — convert the description into a structured `spec.md` (WHAT/WHY only), allocating global,
   never-renumbered **`US-xxx`** story IDs (Theme→Pillar→Story-bank hierarchy).
4. **`clarify`** — bounded 5-question ambiguity scan, writing answers back into the spec's `## Clarifications`.
5. **`feature-forge`** *(per feature)* — PM+Dev requirements workshop producing EARS-format functional +
   non-functional requirements and Given/When/Then acceptance criteria.
6. **`assumption-mapping`** → **`backlog-grooming`** — surface & rank the riskiest VUBF assumptions, design the
   cheapest experiment for the top few; validated assumptions become groomed, sprint-ready backlog items.
7. **`market-researcher`** *(agent)* — sourced market-sizing / competitive / trends intelligence → `MARKET.md`,
   consumed by `spec-review-cpo` below rather than re-derived.
8. **`spec-review-cpo`** *(skill)* — the real product/strategy gate at this stage: challenges the premise, commits
   to a scope posture (expand/hold/cut), scores prioritization (RICE/Kano/JTBD/North Star) against the `US-xxx`
   Theme→Pillar hierarchy if present, and writes a locked **Scope Decision Record** into `spec.md`'s `## CPO Review`
   section. `plan-review-ceo` at Stage 7 *inherits* this record instead of re-litigating strategy once a plan
   exists — see that lens's own "Relationship to `spec-review-cpo`" section. `the-fool`'s adversarial modes
   (pre-mortem, red-team) remain available as an optional extra pressure-test for unusually high-stakes specs, but
   are no longer required by default now that CPO's own posture is inherently adversarial.

### Stage 2 — Architecture & tech stack *(GWD steps 4–5)*

1. **`architecture-designer`** — 5-step workflow → requirements summary, a **`diagram`**-rendered Mermaid
   architecture, ADR-formatted decisions with explicit trade-offs, risks/mitigations. Output: `SDD.md` + ADRs.
2. **`diagram`** — editable `.mmd` + `.svg`/`.png` (optionally `.excalidraw`) as the single source of truth for
   every architecture/flow diagram the reviews will demand.
3. **`cso`** — 15-phase Chief-Security-Officer audit at design time: attack-surface census, secrets archaeology,
   supply chain, STRIDE threat model → a threat posture the later `security-auditor` will verify mitigations against.
4. **`plan-review-eng`** *(engineering-review lens)* — architectural soundness / built-in-vs-custom / test-coverage
   pass over the SDD & ADRs before roadmapping.

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

1. **`design-consultation`** — establish typography/color/layout/spacing/motion as one coherent system
   (anti-AI-slop discipline), write `DESIGN.md`. Includes "Variant shotgun" mode for competing directions. **When
   the `claude-design` MCP is available**, the preview/handoff artifact is a claude-design project instead of (or
   alongside) a local self-contained HTML file — see "Claude Design MCP path" below.
2. **`design-html`** — turn the approved system into a real, responsive, accessible, self-contained HTML preview;
   reuses the same claude-design project (never creates a second one) if one exists.
3. **`design-handoff`** — translate `DESIGN.md` into copy-paste-ready component build prompts for implementing agents.
4. **`plan-review-design`** *(design lens)* — becomes load-bearing again in Stage 7 for any plan with UI scope.

**Claude Design MCP path:** `design-consultation` checks `DESIGN.md` for a stored
`<!-- claude_design_project_id: ... -->` comment before ever calling `create_project` — reuse, never duplicate.
The first run that creates a project persists its ID into `DESIGN.md`'s frontmatter comment and Decisions Log, so
every later stage that touches the design system (`design-html`, `design-handoff`, and any UI work in Stage 8)
references the same collaborative workspace instead of drifting into disconnected local files. Falls back to a
plain local HTML file automatically when the MCP isn't wired in — this path is optional, never required.

---

## The per-phase loop *(GWD steps 8–14, repeated per roadmap phase)*

### Stage 5 — Phase discovery *(GWD step 8)*

Build the context a planner needs, cheaply, before writing tasks.

- **`codebase-mapper`** ×4 *(agents — tech / arch / quality / concerns)* — write `.planning/codebase/*.md` maps.
- **`pattern-mapper`** — map each new/changed file to its closest existing analog with line-numbered excerpts → `PATTERNS.md`.
- **`assumptions-analyzer`** — deep-read 5–15 source files, return evidence-cited, confidence-labeled assumptions.
- **`advisor-researcher`** *(per gray-area decision)* — one 5-column options comparison table per open question.
- **`phase-researcher`** — investigate the phase's technical domain (don't-hand-roll list, pitfalls, package-legitimacy gate) → `RESEARCH.md`.
- **`graphify`** *(query)* — answer phase-relevant dependency questions from the existing graph instead of re-reading.

### Stage 6 — AI / UI phase specs *(conditional)*

- **AI work (GWD step 9):** **`domain-researcher`** *(agent)* researches practitioner evaluation criteria and
  failure modes into `AI-SPEC.md §1b`; the **data-ai lane** then owns the eval contract — **`eval-planner`** designs
  the strategy/rubrics, **`eval-auditor`** later audits coverage; **`framework-selector`** / **`ai-researcher`** /
  **`rag-architect`** / **`prompt-engineer`** / **`ml-pipeline`** etc. supply the build methodology.
- **UI work (GWD step 10):** **`ui-researcher`** *(agent)* produces the `UI-SPEC.md` design contract (hard
  constraints: ≤4 font sizes, spacing multiples of 4, registry-safety vetting); **`ui-checker`** *(agent)* validates
  it BLOCK/FLAG/PASS before planning may proceed.

### Stage 7 — Plan the phase *(GWD step 11)*

1. **`writing-plans`** *(skill)* / **`planner`** *(agent)* — decompose the phase into 2–3-task plans grouped into
   dependency-ordered **waves + tracks**, derive goal-backward must-haves, forbid scope-reduction language, emit
   per-task `complexity_signals`. Output: `PLAN.md`.
2. **`plan-review`** *(command)* → **`plan-reviewer`** *(agent)*, dispatched once per lens **in parallel**:
   **`plan-review-ceo`** (scope/strategy — inherits the locked Scope Decision Record from `spec-review-cpo` at
   Stage 1 instead of re-deriving posture/premise from scratch; only checks the plan for drift against it, then
   runs its own 11 technical-adjacent sections in full), **`plan-review-eng`** (soundness/tests),
   **`plan-review-design`** (UI), **`plan-review-devex`** (developer-facing surface),
   **`plan-review-goal-backward`** (will it actually hit the goal).
3. **`gate-plan-review`** *(agent)* — independent, deterministic complexity-score gate on every track's declared
   Model/Effort, plus a **non-Claude** review engine (Gemini → Codex → Claude fallback, per
   `references/independent-review.md`). `gate_passed: true` unlocks Wave 1.
4. **`analyze`** — read-only cross-artifact audit (spec ↔ plan ↔ tasks ↔ constitution) with a requirement-to-task
   coverage table before any code is written.

**Default review tier (cost vs. rigor):** running every applicable lens plus `gate-plan-review` is the maximum-rigor
setting; the conditional-gates table already auto-prunes `plan-review-design`/`-devex` for phases with no UI/dev-facing
surface. For everyday phases, the **minimum bar** is `gate-plan-review` + `plan-review-goal-backward` — the one gate
that verifies the plan actually achieves its goal, paired with the one that verifies complexity/effort honesty and
architectural alignment. Escalate to the full lens set (`ceo`, `eng`, plus `design`/`devex` when applicable) for
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
4. **`dispatching-parallel-agents`** — the underlying technique `sprint-execution` and `bugfix-wave` build on.
5. Implementation skills, per surface: **`fullstack-guardian`** (frontend+backend+security together),
   **`secure-code-guardian`** (auth/input/crypto), **`refactoring-specialist`** (injected into any track touching
   existing code — behavior-preserving, one move at a time).
6. **`guard`** — destructive-command warnings + edit-scope freeze when a track touches prod or shared surface.
7. **`verification-before-completion`** — every "done" claim backed by fresh command output, not confidence.
8. **Lane skills** — the actual framework work routes here (see [Lane routing](#lane-routing)): e.g. `python-pro` /
   `fastapi-expert` / `postgres-pro` (backend), `react-expert` / `nextjs-developer` (web), `swift-expert` /
   `flutter-expert` (mobile), `terraform-engineer` / `kubernetes-specialist` (infra), `payment-integration` /
   `fintech-engineer` (specialized).

### Stage 9 — Debug *(as needed, inside execution)*

- **`debug`** *(command)* → **`debugger`** *(agent)* ← **`systematic-debugging`** *(skill)* — root-cause-first,
  one falsifiable hypothesis at a time, 3-strike rule, persistent debug file that survives context resets, minimal
  fix + failing-then-passing regression test.
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
5. UI/DX passes *(if applicable)*: **`design-reviewer`** *(live browser-driven audit + atomic fixes)*,
   **`ui-auditor`** *(6-pillar spec-conformance score → `UI-REVIEW.md`)*, **`accessibility-tester`**
   *(WCAG 2.1 AA conformance)*, **`devex-review`** *(actually test the getting-started flow, CLI `--help`, real errors)*.

### Stage 11 — Verify the goal

1. **`verify`** *(command)* → **`verifier`** *(agent)* — goal-backward: observable truths → artifact exists /
   substantive / wired / real data flowing → key-link checks → `VERIFICATION.md` (passed / gaps_found / human_needed).
2. **`converge`** — assess present-state code against spec/plan/tasks, append missing/partial/contradicts gaps as a
   new `## Phase N: Convergence` task block (never rewrites existing tasks).
3. **`integration-checker`** *(agent)* — cross-phase wiring: every export imported *and used*, every API route has a
   real consumer, sensitive routes are auth-protected, E2E flows trace end-to-end.
4. **`nyquist-auditor`** *(agent)* — for each validation gap, write a real behavioral test targeting the hardest edge
   (never a trivially-passing one); FILLED / ESCALATED / justified-SKIP.
5. **`dependency-manager`** *(agent)* — CVE / version-conflict / license / dead-weight sweep, incremental tested updates.

### Stage 12 — Automation coverage *(GWD step 14)*

- **`gate-automation`** *(agent)* — diff the sprint for new/changed primary flows, author golden-path + critical-edge
  E2E flows (Playwright web / Maestro mobile), run them locally, check for an on-demand E2E CI job → `authoring-report.json`.
  Invokes **`test-master`** / **`playwright-expert`** (web lane) for test-design guidance.

### Stage 13 — Security & compliance gate

- **`security-audit`** *(command)* → **`security-auditor`** *(agent)* — verify every declared threat mitigation at
  *all* entry points (not one grep hit) → `SECURITY.md`; **open threats block the phase from shipping**.
- **`penetration-tester`** *(agent)* — authorized active exploitation (recon / OWASP / API / network / cloud).
- **`compliance-auditor`** *(agent)* — map named regulations (GDPR/HIPAA/PCI/SOC2/…) to actual controls; the
  **product lane** `gdpr-ccpa-compliance` / `hipaa-compliance` skills supply the framework detail.
- **`security-reviewer`** *(skill)* — the manual SAST + auth/input/crypto review methodology under all of the above.

---

## Milestone close-out

### Stage 14 — Document

- **`document-generate`** / **`code-documenter`** — Diataxis doc set + validated docstrings/API docs (every example
  actually compiles/runs).
- **`content-qa`** — de-slop the prose (AI-ism scan, content-type-aware strictness) before publishing.
- **`document-release`** — build a coverage map of shipped-vs-documented public surface, sync each doc against the
  diff, polish CHANGELOG voice (never clobber history), then **`doc-verifier`** *(agent)* re-verifies every checkable
  claim (file paths, commands, endpoints) against the filesystem.

### Stage 15 — Ship & deploy *(GWD step 15 territory)*

- **`finishing-a-development-branch`** *(skill, manual)* — the safe 4-option (merge / PR / keep / discard) menu with a
  pre-merge test gate and provenance-checked worktree cleanup. **Or**, fully automated:
- **`ship`** *(skill)* — 14-step non-interactive pipeline: merge base → test-failure triage → coverage-gap tracing +
  generate missing tests → plan-completion audit → adversarial pre-landing review with auto-fix → version bump →
  CHANGELOG → bisectable commits → push → create/update PR.
- **`land-and-deploy`** *(skill)* — picks up where `ship` left off: readiness gate → merge → poll the deploy platform
  → verify production health → revert as the escape hatch. **Infra lane** owns the platform detail: `devops-engineer`
  (CI/CD, go/no-go gates), `terraform-engineer` / `cloud-architect` (IaC, wave migrations), `kubernetes-specialist` /
  `docker-expert`, `sre-engineer` (SLIs/SLOs), `monitoring-expert`.

### Stage 16 — Operate, retrospect, close

- **`health`** *(command)* → **`health-reporter`** *(agent)* — weighted 0–10 codebase-quality dashboard with trend history.
- **`performance-engineer`** *(agent)* — measure-first bottleneck elimination with before/after evidence.
- **`incident-responder`** *(agent)* — triage → contain → preserve evidence → diagnose → blameless postmortem, if
  production breaks; hands off to `compliance-auditor` for breach-notification obligations. `chaos-engineer` (infra
  lane) proactively rehearses these failures.
- **`retro`** *(command)* → **`retro`** *(agent)* — periodic engineering retrospective mined from git history.
- **`plan-review-ceo`** *(optional, reused — not a new skill)* — a light strategic-drift checkpoint: does the shipped
  milestone still match the Scope Decision Record `spec-review-cpo` locked at Stage 1? This is deliberately
  **in addition to**, not instead of, the Stage 7 pass — catching a scope/strategy problem in a written plan is
  cheap; catching the same problem only after code, tests, and a deploy exist is not. Skip if the milestone already
  passed a Stage 7 CEO check with no drift and nothing has since changed.
- **Product lane** analytics — `ab-test-analysis`, `cohort-analysis`, `growth-loops` — close the loop back to Stage 1's
  assumption bank with real usage evidence.
- **Milestone archive + git tag** — the terminal state (dev-kit has no `/complete-milestone` command; this is the
  Orchestration layer's job, driven by `STATE.md`).

---

## Cross-cutting assets

These aren't a stage — they run *throughout* the pipeline:

| Asset | Role | Fires |
|-------|------|-------|
| `context-save` / `context-restore` | Session continuity across `/clear`, branch switches, worktrees | At every boundary ‖ and on resume |
| `learn` | Durable cross-session knowledge ledger | Whenever a gotcha/convention surfaces (esp. Stages 8–11) |
| `guard` | Destructive-command + edit-scope safety | Any prod/shared-surface work (esp. Stage 8, 15) |
| `graphify` | Persistent queryable knowledge graph | Built in Stage 0, queried in Stages 5, 7 |
| `diagram` | Editable Mermaid → SVG/PNG artifacts | Any architecture/plan/design step (2, 4, 7) |
| `writing-skills` | Codify a repeated workflow into a new dev-kit skill | Post-`retro`, when Stage 16 surfaces a reusable pattern |

---

## Lane routing

The 7 stack-lane plugins are **reference packs** with no phase structure of their own — they plug into the core
pipeline at the stages where their expertise is needed (overwhelmingly Stage 8 execution, plus review/ship stages):

| Lane (plugin) | Plugs into | Representative assets |
|---|---|---|
| **Backend** (`dev-kit-backend`, 26) | Stage 8 execution; `legacy-modernizer` at Stage 0/8 | `python-pro`, `golang-pro`, `rust-engineer`, `fastapi-expert`, `spring-boot-engineer`, `postgres-pro`, `api-designer`, `microservices-architect` |
| **Web** (`dev-kit-web`, 11) | Stage 8; `playwright-expert` at Stage 12 | `react-expert`, `nextjs-developer`, `vue-expert`, `typescript-pro`, `electron-pro` |
| **Mobile** (`dev-kit-mobile`, 4) | Stage 8; Maestro flows at Stage 12 | `swift-expert`, `kotlin-specialist`, `flutter-expert`, `react-native-expert` |
| **Data/AI** (`dev-kit-data-ai`, 17) | Stage 6 (eval contract) + Stage 8 | `eval-planner`, `eval-auditor`, `framework-selector`, `ai-researcher`, `rag-architect`, `prompt-engineer`, `ml-pipeline`, `llm-architect` |
| **Infra** (`dev-kit-infra`, 14) | Stage 15 deploy + Stage 16 operate | `devops-engineer`, `terraform-engineer`, `cloud-architect`, `kubernetes-specialist`, `sre-engineer`, `chaos-engineer`, `monitoring-expert` |
| **Specialized** (`dev-kit-specialized`, 19) | Stage 8 (domain build); `license-engineer` at Stage 11 | `payment-integration`, `fintech-engineer`, `healthcare-admin`, `mcp-developer`, `blockchain-developer`, `game-developer`, `seo-specialist` |
| **Product** (`dev-kit-product`, 5) | Stage 1 (assumptions) + Stage 13/16 (compliance, analytics) | `ab-test-analysis`, `cohort-analysis`, `growth-loops`, `gdpr-ccpa-compliance`, `hipaa-compliance` |

---

## What the pipeline still needs (the glue dev-kit doesn't ship)

This document is the **Skill/Agent/Command spine**. A *running* GWD pipeline also needs three layers dev-kit
deliberately leaves out — see [`workflow-recommendations.md`](workflow-recommendations.md) for the full table:

- **Orchestration** *(not-yet-built)* — the persistent, cross-session sequencer that walks Stages 0→16, survives a
  `/clear`, governs auto/manual/sleep modes, holds the context boundaries ‖, and carries `STATE.md` / calibration
  state across many sessions. This is what actually *drives* everything above.
- **Workflow** *(buildable today)* — bounded deterministic scripts for the fan-out/loop chunks: Stage 8 wave/track
  dispatch (`sprint-execution`/`bugfix-wave`), the Stage 10 ≤6-round review↔fix loop, per-track complexity scoring,
  and the parallel dispatches in Stages 3/5/7 (`plan-reviewer`, `codebase-mapper`, `doc-classifier`).
- **Hooks** *(candidates)* — content-safety scanning on read/write, context-budget warnings, commit-message
  enforcement, graphify freshness nudges, and STATE.md sync reminders.

---

## Coverage appendix — every asset placed

**All 97 core assets** (52 skills · 37 agents · 8 commands), by the stage that owns them:

- **Stage 0:** `constitution`, `spec-miner`, `gate-reverse-engineer`, `doc-classifier`, `doc-synthesizer`, `graphify`
- **Stage 1:** `first-principles-thinking`, `brainstorming`, `specify`, `clarify`, `feature-forge`, `assumption-mapping`, `backlog-grooming`, `market-researcher`, `spec-review-cpo` (`the-fool` remains available as an optional extra pressure-test, no longer in the default list)
- **Stage 2:** `architecture-designer`, `diagram`, `cso`, `plan-review-eng`
- **Stage 3:** `project-researcher`, `research-synthesizer`, `roadmapper`
- **Stage 4:** `design-consultation`, `design-html`, `design-handoff`, `plan-review-design`
- **Stage 5:** `codebase-mapper`, `pattern-mapper`, `assumptions-analyzer`, `advisor-researcher`, `phase-researcher`
- **Stage 6:** `domain-researcher`, `ui-researcher`, `ui-checker`
- **Stage 7:** `writing-plans`, `planner`, `plan-review` (cmd), `plan-reviewer`, `plan-review-ceo`, `plan-review-devex`, `plan-review-goal-backward`, `gate-plan-review`, `analyze`
- **Stage 8:** `using-git-worktrees`, `sprint-execution`, `test-driven-development`, `dispatching-parallel-agents`, `fullstack-guardian`, `secure-code-guardian`, `refactoring-specialist`, `guard`, `verification-before-completion`
- **Stage 9:** `debug` (cmd), `debugger`, `systematic-debugging`
- **Stage 10:** `review` (cmd), `code-review-gate`, `bugfix-wave`, `code-review-protocol`, `qa` (cmd), `qa` (agent), `design-reviewer`, `ui-auditor`, `accessibility-tester`, `devex-review`
- **Stage 11:** `verify` (cmd), `verifier`, `converge`, `integration-checker`, `nyquist-auditor`, `dependency-manager`
- **Stage 12:** `gate-automation`, `test-master`
- **Stage 13:** `security-audit` (cmd), `security-auditor`, `penetration-tester`, `compliance-auditor`, `security-reviewer`
- **Stage 14:** `document-generate`, `code-documenter`, `content-qa`, `document-release`, `doc-verifier`
- **Stage 15:** `finishing-a-development-branch`, `ship`, `land-and-deploy`
- **Stage 16:** `health` (cmd), `health-reporter`, `performance-engineer`, `incident-responder`, `retro` (cmd), `retro` (agent)
- **Cross-cutting:** `context-save`, `context-restore`, `learn`, `writing-skills` (+ `guard`, `graphify`, `diagram` listed above)

**All 96 lane assets** route in via [Lane routing](#lane-routing) — predominantly at Stage 8, with the Data/AI eval
pair at Stage 6, infra at Stages 15–16, and product analytics/compliance at Stages 1/13/16. The full roster, every
one named against the stage it plugs into:

**Backend** (`dev-kit-backend`, 26) — Stage 8 execution *(languages/frameworks/data/API)*; `legacy-modernizer` at
Stage 0/8:
`cpp-pro`, `csharp-developer`, `golang-pro`, `python-pro`, `rust-engineer`, `node-specialist`, `php-pro`,
`django-expert`, `fastapi-expert`, `nestjs-expert`, `dotnet-core-expert`, `java-architect`, `spring-boot-engineer`,
`laravel-specialist`, `symfony-specialist`, `rails-expert`, `elixir-expert`, `database-optimizer`, `postgres-pro`,
`sql-pro`, `api-designer`, `graphql-architect`, `microservices-architect`, `websocket-engineer`,
`dotnet-framework-4.8-expert`, `legacy-modernizer`.

**Web** (`dev-kit-web`, 11) — Stage 8; `playwright-expert` at Stage 12:
`react-expert`, `nextjs-developer`, `angular-architect`, `vue-expert`, `vue-expert-js`, `javascript-pro`,
`typescript-pro`, `playwright-expert`, `shopify-expert`, `wordpress-pro`, `electron-pro`.

**Mobile** (`dev-kit-mobile`, 4) — Stage 8; Maestro flows at Stage 12:
`flutter-expert`, `kotlin-specialist`, `react-native-expert`, `swift-expert`.

**Data/AI** (`dev-kit-data-ai`, 17) — Stage 6 eval contract (`domain-researcher` → the eval pair) + Stage 8 build:
`data-analyst`, `data-engineer`, `data-scientist`, `pandas-pro`, `spark-engineer`, `ml-engineer`, `ml-pipeline`,
`fine-tuning-expert`, `nlp-engineer`, `reinforcement-learning-engineer`, `llm-architect`, `rag-architect`,
`prompt-engineer`, `framework-selector`, `ai-researcher`, `eval-planner`, `eval-auditor`.

**Infra** (`dev-kit-infra`, 14) — Stage 15 deploy + Stage 16 operate:
`cloud-architect`, `terraform-engineer`, `azure-infra-engineer`, `docker-expert`, `kubernetes-specialist`,
`platform-engineer`, `devops-engineer`, `sre-engineer`, `monitoring-expert`, `chaos-engineer`,
`database-administrator`, `network-engineer`, `microsoft-ops`, `powershell-pro`.

**Specialized** (`dev-kit-specialized`, 19) — Stage 8 domain build; `license-engineer` at Stage 11; MCP/tooling at
Stage 0/8:
`cli-developer`, `devtools-engineer`, `mcp-developer`, `atlassian-mcp`, `slack-expert`, `license-engineer`,
`fintech-engineer`, `healthcare-admin`, `legal-advisor`, `risk-manager`, `quant-analyst`, `payment-integration`,
`embedded-systems`, `game-developer`, `iot-engineer`, `salesforce-developer`, `seo-specialist`,
`blockchain-developer`, `visual-asset-generator`.

**Product** (`dev-kit-product`, 5) — Stage 1 assumptions + Stage 13 compliance + Stage 16 analytics:
`ab-test-analysis`, `cohort-analysis`, `growth-loops`, `gdpr-ccpa-compliance`, `hipaa-compliance`.

**Total: 193 / 193 dev-kit assets placed** (97 core + 96 lane) — verified by diffing every catalog header against
this document. `spec-review-cpo` is the 97th core asset, added alongside this pipeline doc to close the spec-stage
product-review gap (see [Conditional gates & branches](#conditional-gates--branches) and its full entry in
[`core-discovery-and-design.md`](catalog/core-discovery-and-design.md#role-product--requirements-owner)).

---

*Companion docs: [`gwd-pipeline-gap-analysis.md`](gwd-pipeline-gap-analysis.md) (what GWD has that dev-kit doesn't),
[`workflow-recommendations.md`](workflow-recommendations.md) (the four-homes table + Workflow sweep), and the
[role catalog](catalog/README.md) (every asset documented in full).*
