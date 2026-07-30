# Workflow scripts

This directory holds every `*.workflow.mjs` script in the dev-kit corpus — the
`Workflow`-tool implementation of a planned, deterministic, fixed(-ish)-roster agent
fan-out. Each script is invoked by exactly one owning asset (a command or a skill), which
carries the routing table that decides whether a given run reaches this file at all.

## 1. Routing convention

Every owning asset applies the same rule at its dispatch point:

| Unit count | Route |
|---|---|
| **2 or more** | `Workflow` script — mandatory. `Workflow({ scriptPath, args })`. |
| **Exactly 1** | Plain inline `Agent` call. A `Workflow` for one agent is pure overhead. |

"Unit" means whatever this script fans out over — lenses, tracks, docs, modules, gray
areas, candidate findings. A script that is invoked with fewer than 2 units throws rather
than run degraded (see the authoring checklist).

**Resuming a dead run:** re-invoke the same script with `Workflow({ scriptPath,
resumeFromRunId })`. There is no other recovery path — specifically, there is no "Workflow
unavailable, fall back to N inline Agent calls" branch anywhere in this corpus. If
`Workflow` cannot run, the fan-out does not run; the only sanctioned non-`Workflow` route
is the exactly-1-unit inline case above, which is a different situation (never a fallback
for a failed multi-unit dispatch).

**The one exception — `e2e-split`:** it does not route on unit count at all. It routes on
**automation SURFACES spanned** (Playwright / web UI, Maestro / mobile). A project
spanning both surfaces routes here — two `gate-automation` dispatches, one pinned to each
surface — even though that is still "2 dispatches" by coincidence; a project on only one
surface goes inline, even though `gate-automation` itself is a single agent type on both
sides of the fork. Read `e2e-split.workflow.mjs`'s header before assuming the usual
unit-count rule applies to it.

## 2. Prompt-embedding strategies

Three strategies cover the corpus, each with a reason:

- **Inputs-only** (`plan-review.workflow.mjs`) — the dispatched agent's own `.md` file
  (`agents/plan-reviewer.md`) owns the procedure and the output contract. The script's
  prompt carries only the plan path, the lens, and (optionally) context paths and a report
  path — never a restatement of what the agent should do or return. This keeps the agent
  definition the single source of truth and the workflow prompt a thin pointer to it.

- **Skill self-injection** (`sprint-execution.workflow.mjs`) — the dispatched subagent
  invokes the `Skill` tool on *itself* (`invoke the Skill tool with skill:
  <track.skillId>`), rather than the orchestrator loading the skill and pasting its
  contents into the prompt. This keeps the orchestrator's own context thin: the skill's
  full instructions only ever load inside the subagent that needs them.

- **Orchestrator-pre-rendered** (`bugfix-wave.workflow.mjs`) — the owning skill
  (`skills/bugfix-wave/SKILL.md` §2.3) renders the complete subagent prompt — base-sync
  opener, boundaries, merge protocol, close-handover block — in the orchestrator's own
  turn, before the `Workflow` call. The script passes that rendered string through
  untouched and writes no prompt text of its own. Consequence: anything missing from the
  rendered template is missing from the dispatch — the script cannot patch it up, and
  won't try to.

Pick the strategy by asking who owns the procedure: the agent's own `.md` (inputs-only),
a skill the subagent should load for itself (self-injection), or a template only the
orchestrating skill can correctly fill in because it holds per-track values the script
never computes (pre-rendered).

## 3. Authoring checklist

Every script in this directory satisfies all of the following. Treat a new script that
fails any line as unfinished, not stylistically different:

- `export const meta = { ... phases: [...] }` — `phases` is a **static literal**, never
  built from `args` at module scope (a script may still collapse or select among a static
  set at runtime, e.g. `bugfix-wave`'s "Wave 4+" bucket).
- A header comment with an `args` pseudo-type (name, type, required/optional, what it
  means) and a **ZERO-JUDGMENT paragraph**: stating plainly that classification,
  grouping, model/effort choice, and prompt authoring already happened in the caller's
  turn, and this script performs no judgment of its own — only control flow.
- **Module-scope schemas** (e.g. `LENS_RESULT_SCHEMA`, `CLOSE_HANDOVER_SCHEMA`,
  `HANDOVER_SCHEMA`) that mirror the dispatched agent's documented output contract
  **field for field** — never a competing or independently-invented shape.
- **Eager validation that throws before any dispatch** — missing required args, an empty
  unit list, a below-minimum unit count, or malformed entries all raise `Error` before the
  first `agent()`/`parallel()` call, never partway through a fan-out.
- **The thunk layer** — `parallel(units.map((u) => () => agent(prompt(u), opts(u))))`.
  Thunks, not already-invoked promises, so `parallel()` controls concurrency and its
  barrier semantics hold.
- **An opts builder that omits absent `model`/`effort`/`agentType` — and consumes
  `args.routing` when present — rather than defaulting them; an absent `model` still means
  "inherit the session model."** Every script's args pseudo-type documents
  `routing?: {role: {model?, effort?}}`, decided caller-side by
  `plugins/dk/bin/model-route.mjs` per `references/model-routing.md`.
- **`label` and `phase` on every dispatched call** — every agent in every wave/fan-out is
  individually identifiable in the progress display and in the return value.
- **`COVERAGE GAP` logging for every dropped unit** — a unit whose agent returned nothing
  (died, was skipped, or failed schema validation) is logged loudly, by name, with what it
  means for the caller (not reviewed / not fixed / not verified) — never silently absent
  from the output.
- **Separately-named failure lists** — a unit that died (no return value at all) is never
  conflated with a unit that returned a legitimate "could not determine" / `BLOCKED`
  result. Compare `plan-review`'s `missingLenses` vs. `blockedLenses`, or
  `bugfix-wave`/`sprint-execution`'s `dropped`/`tracksNeedingRedispatch` vs. a returned
  `NEEDS_CONTEXT`/`BLOCKED` status.
- **No `Date.now()`, `Math.random()`, filesystem access, or `import`** — the workflow
  runtime forbids all four. Non-determinism and I/O stay in the caller's turn or inside a
  dispatched agent, never in this script.

## 4. The isolation rule

`isolation: 'worktree'` costs ~200-500ms plus disk per agent. Use it **only** when the
fanned-out members commit concurrently to git — i.e. only when running them in the same
tree would race on the same ref or files. It buys nothing for read-only or single-writer
fan-outs, so it is the default-off choice.

None of the read-only/single-writer scripts in this directory use it (`plan-review`,
`doc-verify`, `review-finders`, `cso-verify`, `backlog-groom`, `legacy-explore`,
`discovery-map`, `discovery-research`, `roadmap-research`, `graphify-extract`,
`doc-ingest`, `security-gate`, `plan-gate`, `e2e-split`, `final-gate-lanes`,
`verify-phase`, `spec-research-pair`, `assumption-map`, `adr-draft`, `design-batch`,
`design-variants`, `slo-review`, `ship-audit-pair`). `sprint-execution` and
`bugfix-wave` are the two exceptions in this corpus, and both need it for the same
reason: their tracks commit to their own branches and, in `bugfix-wave`'s case, merge
themselves back into the source branch — real concurrent git writes that a shared tree
cannot safely serve.

## 5. Script index

All 25 `Workflow` scripts in the corpus, their owning asset (the file carrying the
routing table that decides whether a run reaches this script), and what each fans out
over.

| Script | Owning asset | What fans out |
|---|---|---|
| `plan-review.workflow.mjs` | `commands/plan-review.md` | One `plan-reviewer` per review lens (eng/design/devex/goal-backward) |
| `bugfix-wave.workflow.mjs` | `skills/bugfix-wave/SKILL.md` | Pre-classified bug-fix tracks, wave by wave, each self-merging into the source branch |
| `sprint-execution.workflow.mjs` | `skills/sprint-execution/SKILL.md` | One wave's tracks, each in its own worktree/branch |
| `doc-ingest.workflow.mjs` | `/dk:bootstrap:intake` | One `doc-classifier` per document, then a `doc-synthesizer` barrier |
| `roadmap-research.workflow.mjs` | `commands/roadmap/build.md` (`/dk:roadmap:build`) | Four-axis ecosystem research (stack/features/architecture/pitfalls), then a `research-synthesizer` barrier and the roadmapper |
| `graphify-extract.workflow.mjs` | `skills/graphify/SKILL.md` (Step 3, Part B, Step B2) | One semantic-extraction subagent per uncached chunk |
| `discovery-map.workflow.mjs` | `plugins/dk/commands/discover/map.md` (`/dk:discover:map`) | Fixed 6-agent roster: four `codebase-mapper` (tech/arch/quality/concerns), one `assumptions-analyzer`, one `phase-researcher` |
| `discovery-research.workflow.mjs` | `plugins/dk/commands/discover/research.md` (`/dk:discover:research`) | One `advisor-researcher` per open gray-area decision, plus one `pattern-mapper` |
| `review-finders.workflow.mjs` | `skills/code-review-protocol/SKILL.md` Part 3, Stage A | The round's finder lenses, fanned out against one frozen SHA |
| `security-gate.workflow.mjs` | `/dev-kit-core:security-audit` | One `security-auditor` per milestone phase, scoped to that phase's declared threat model |
| `cso-verify.workflow.mjs` | `skills/cso/SKILL.md` Phase 12 | One fresh-context verifier per candidate security finding |
| `doc-verify.workflow.mjs` | `plugins/dk/commands/docs/verify.md` (`/dk:docs:verify`) | One `doc-verifier` per doc |
| `backlog-groom.workflow.mjs` | `skills/backlog-grooming/SKILL.md` Part 2 (Story Refinement) | One read-only refinement agent per candidate story (2-8 per session) |
| `legacy-explore.workflow.mjs` | `skills/spec-miner/SKILL.md` ("Scaling: multi-module systems") | One `spec-miner` pass per module of an undocumented system |
| `plan-gate.workflow.mjs` | `plugins/dk/commands/plan/gate.md` (`/dk:plan:gate`) | Concurrent pair: `gate-plan-review` and the `analyze` skill |
| `e2e-split.workflow.mjs` | `commands/verify/e2e.md` (`/dk:verify:e2e`) | Two `gate-automation` runs, one per automation surface (Playwright, Maestro) — see the SURFACES exception above |
| `final-gate-lanes.workflow.mjs` | `plugins/dk/commands/final/gate.md` (`/dk:final:gate`) | One lane wave: the security half as a child `security-gate.workflow.mjs` run, beside whichever of design-reviewer / devex-review / compliance-auditor the operator's answers enabled; accessibility-tester and (if authorized) penetration-tester held at a barrier behind it for design-reviewer's URL |
| `verify-phase.workflow.mjs` | `plugins/dk/commands/verify/phase.md` (`/dk:verify:phase`) | Wave 1: verifier, plus eval-auditor and integration-checker when the caller says those apply; barrier; then wave 2: converge, with the nyquist-auditor beside it iff verifier reported validation gaps |
| `spec-research-pair.workflow.mjs` | `plugins/dk/commands/spec/phase.md` (`/dk:spec:phase`) | `domain-researcher` + `ai-researcher` together against the same AI-SPEC.md, plus `ui-checker` as a third when the phase's UI chain is also active |
| `assumption-map.workflow.mjs` | `skills/assumption-mapping/SKILL.md` §Parallel Extraction | The fixed 4-category VUBF fan-out (value/usability/business/feasibility), one extraction subagent per category |
| `adr-draft.workflow.mjs` | `skills/architecture-designer/SKILL.md` "Parallel ADR drafting" | One drafting agent per ADR, each writing its own disjoint `NNNN-<slug>.md` file |
| `design-batch.workflow.mjs` | `skills/design-html/SKILL.md` Batch Mode (initial builds only) | One Step-3 page-builder subagent per requested page, each its own Claude Design project/file |
| `design-variants.workflow.mjs` | `skills/design-consultation/SKILL.md` Variant Shotgun mode | One subagent per competing visual direction (2-8 variants), each its own `.dc.html` file |
| `slo-review.workflow.mjs` | `plugins/dk/commands/close/operate.md` (`/dk:close:operate`) | Fixed pair, after the performance-engineer barrier: `sre-engineer` and `monitoring-expert` against the same frozen performance report |
| `ship-audit-pair.workflow.mjs` | `skills/ship/SKILL.md` (Steps 4+5 dispatch) | Fixed pair, barrier only: Step 4 Test Coverage Audit and Step 5 Plan Completion Audit |
