<!-- Shipped copy of the dev-kit doc-path contract. Source of truth: references/doc-sitemap.md in the dev-kit repo — keep in sync. -->
# Documentation Sitemap — Canonical Doc-Path Contract

**Status:** Approved 2026-07-22. Every dev-kit asset that creates or reads a document in an
end-user project MUST use the canonical paths defined here. No asset may invent a new
top-level directory or a path variant.

## Tokens

| Token | Meaning | Example |
|---|---|---|
| `<M>` | Milestone version | `v1`, `v2` |
| `<NN>` | Zero-padded phase number | `01`, `04` |
| `<MM>` | Plan number within a phase | `01`, `02` |
| `<NNN>` | Feature spec number | `003` |
| `<slug>` | Kebab-case name | `auth-foundation` |
| `<R>` | Review round number | `1`, `2` |
| `<date>` | ISO date | `2026-07-22` |

Shorthand used below: `PHASE/` = `docs/milestones/<M>/phases/<NN>-<slug>/`.

## Repo root — ecosystem files only

`README.md` · `CHANGELOG.md` · `CONTRIBUTING.md` · `LICENSE` · `VERSION` · `CLAUDE.md`.
Tool state stays under `.claude/` (`learnings.jsonl`, `design/screens.json`).
**Nothing else lives at the root.**

## The tree

```
docs/
├── global/                              # whole-project lifetime
│   ├── project/
│   │   ├── PROJECT.md                   # project identity, goals, decisions
│   │   ├── constitution.md              # versioned project principles
│   │   └── quickstart.md
│   ├── requirements/
│   │   ├── PRD.md
│   │   ├── BACKLOG.md                   # cross-milestone backlog
│   │   └── TODOS.md                     # deferred work & known limitations
│   ├── architecture/
│   │   ├── SDD.md                       # internal system design doc
│   │   ├── ARCHITECTURE.md              # public-facing architecture overview
│   │   ├── cloud-design.md
│   │   └── adr/NNNN-<slug>.md           # single ADR bank
│   ├── design/
│   │   ├── DESIGN.md                    # design system source of truth
│   │   └── handoffs/<name>.md           # component build guides
│   ├── codebase/                        # codebase map: STACK.md, STRUCTURE.md,
│   │                                    #   ARCHITECTURE.md, CONVENTIONS.md,
│   │                                    #   CONCERNS.md, INTEGRATIONS.md, TESTING.md
│   ├── process/
│   │   ├── SCHEMAS.md                   # pipeline data contracts
│   │   └── TESTING.md                   # testing strategy
│   └── ops/                             # ALL infra-lane output
│       ├── runbooks/**
│       ├── monitoring/                  # alerting-rules, dashboards, load-tests, capacity
│       ├── database/                    # operations, performance-tuning, disaster-recovery
│       ├── deployment/                  # strategies, docker, kubernetes, procedures, ci-cd notes
│       ├── security/                    # ops security reviews, remediation plans
│       ├── resilience/                  # chaos experiments, DR plan, game-day reports
│       ├── cost/                        # cost-optimization analyses
│       └── postmortems/                 # incident postmortems
│
├── milestones/<M>/                      # one directory per milestone
│   ├── ROADMAP.md
│   ├── REQUIREMENTS.md
│   ├── RETROSPECTIVE.md
│   ├── research/                        # SUMMARY.md, STACK.md, FEATURES.md, PITFALLS.md,
│   │                                    #   ARCHITECTURE.md, MARKET.md, FEASIBILITY.md, COMPARISON.md
│   ├── specs/<NNN>-<slug>/
│   │   ├── spec.md
│   │   ├── AI-SPEC.md                   # AI-lane phases only
│   │   └── checklists/requirements.md
│   ├── reports/                         # milestone-scoped audits + ad-hoc runs
│   │   ├── qa/<date>-<domain>.md
│   │   ├── security/<date>-<HHMMSS>.json
│   │   ├── design/<date>-<domain>.md    # + screenshots/
│   │   └── retros/<date>-<n>.json
│   └── phases/<NN>-<slug>/              # phases ALWAYS nest inside their milestone
│       ├── CONTEXT.md · DISCOVERY.md · RESEARCH.md · PATTERNS.md
│       ├── UI-SPEC.md
│       ├── <NN>-<MM>-PLAN.md            # the ONLY plan path
│       ├── <NN>-<MM>-SKELETON.md · <NN>-PLAN-OUTLINE.md
│       ├── <NN>-<MM>-SUMMARY.md
│       ├── VERIFICATION.md · UAT.md · USER-SETUP.md
│       ├── reviews/
│       │   ├── <plan>.<lens>-review.md  # plan-review lens outputs (+ <plan>.review-summary.json)
│       │   ├── REVIEW.md                # code-review gate verdict
│       │   ├── round-<R>/findings.md · round-<R>/findings.json · round-<R>/fixes.json
│       │   ├── UI-REVIEW.md · EVAL-REVIEW.md
│       │   └── SECURITY.md
│       └── reports/
│           ├── deploy/<date>-pr<number>.md
│           └── automation/authoring-report.{md,json}
│
└── state/                               # machine state — pipeline-internal
    ├── STATE.md                         # always-open position pointer
    ├── config.json
    ├── baselines/                       # cross-milestone trend data
    │   ├── design-baseline.json · qa-baseline.json · health-history.jsonl
    ├── intel/                           # doc-ingest synthesis (SYNTHESIS.md, decisions.md, …)
    ├── graphs/                          # graph.json, GRAPH_REPORT.md
    ├── debug/                           # knowledge-base.md, <slug>.md, resolved/
    ├── sprint/                          # progress.md, task-N-brief.md, task-N-report.md
    └── tmp/                             # scratch, verify-*.json, INGEST-CONFLICTS.md
```

## Placement rules

1. **Lifetime decides tier:** project-lifetime → `global/`; per-milestone → `milestones/<M>/`;
   per-phase → `PHASE/`. If unsure, ask "does this survive the milestone?"
2. **Reports attach to the scope that triggered them.** Phase-triggered runs → `PHASE/reports/`;
   milestone audits and ad-hoc runs → the active milestone's `reports/`; only run-over-run
   trend data → `state/baselines/`.
3. **No loose files in `global/`** — every doc lives in a themed folder.
4. **One canonical path per logical doc.** Producers and consumers use the identical string.
5. **Humans vs machines:** anything an agent maintains for the pipeline (state, indexes,
   scratch) goes under `state/`, never in the browsable tiers.
6. **Infra output** always lands under `global/ops/` — never a new top-level directory.

## Migration map (old → new)

| Old path(s) | Canonical path |
|---|---|
| `spec.md`, `docs/specs/NNN-*/spec.md`, `specs/*_reverse_spec.md`, `specs/*_design.md` | `docs/milestones/<M>/specs/<NNN>-<slug>/spec.md` |
| `AI-SPEC.md` | `docs/milestones/<M>/specs/<NNN>-<slug>/AI-SPEC.md` |
| `SDD.md`, `docs/architecture/SDD.md` | `docs/global/architecture/SDD.md` |
| `ARCHITECTURE.md` (repo root) | `docs/global/architecture/ARCHITECTURE.md` |
| `docs/adr/*`, `docs/architecture/ADRs/*` | `docs/global/architecture/adr/NNNN-<slug>.md` |
| `docs/requirements/PRD.md` | `docs/global/requirements/PRD.md` |
| `docs/BACKLOG.md` | `docs/global/requirements/BACKLOG.md` |
| `TODOS.md` | `docs/global/requirements/TODOS.md` |
| `docs/constitution.md` | `docs/global/project/constitution.md` |
| `.planning/PROJECT.md` | `docs/global/project/PROJECT.md` |
| `docs/quickstart.md` | `docs/global/project/quickstart.md` |
| `DESIGN.md` | `docs/global/design/DESIGN.md` |
| `.claude/design/instructions-<name>.md`, `docs/design-handoff.md` | `docs/global/design/handoffs/<name>.md` |
| `.planning/codebase/*` | `docs/global/codebase/*` |
| `docs/dev-kit/SCHEMAS.md` | `docs/global/process/SCHEMAS.md` |
| `TESTING.md` | `docs/global/process/TESTING.md` |
| `runbooks/**` | `docs/global/ops/runbooks/**` |
| `docs/{monitoring,performance-testing,capacity-planning}/*` | `docs/global/ops/monitoring/*` |
| `docs/database/*` | `docs/global/ops/database/*` |
| `docs/{deployment,docker,kubernetes,procedures}/*` | `docs/global/ops/deployment/*` |
| `docs/security/*` (ops docs) | `docs/global/ops/security/*` |
| `docs/{chaos-engineering,disaster-recovery,game-days}/*` | `docs/global/ops/resilience/*` |
| `docs/cost-optimization/*` | `docs/global/ops/cost/*` |
| `postmortems/*` | `docs/global/ops/postmortems/*` |
| `docs/architecture/cloud-design.md` | `docs/global/architecture/cloud-design.md` |
| `.planning/ROADMAP.md`, `ROADMAP.md` | `docs/milestones/<M>/ROADMAP.md` |
| `.planning/REQUIREMENTS.md`, `REQUIREMENTS.md` | `docs/milestones/<M>/REQUIREMENTS.md` |
| `.planning/RETROSPECTIVE.md` | `docs/milestones/<M>/RETROSPECTIVE.md` |
| `.planning/research/*`, `research/*` | `docs/milestones/<M>/research/*` |
| `qa-reports/*.md` | `docs/milestones/<M>/reports/qa/` |
| `.security-reports/*` | `docs/milestones/<M>/reports/security/` |
| `design-reports/design-audit-*`, screenshots | `docs/milestones/<M>/reports/design/` |
| `.context/retros/*` | `docs/milestones/<M>/reports/retros/` |
| `.planning/phases/**` (all variants), `{PHASE_DIR}/**` | `PHASE/` = `docs/milestones/<M>/phases/<NN>-<slug>/` |
| `PLAN.md`, `docs/plans/*`, `docs/dev-kit/plans/*`, any `*-PLAN.md` variant | `PHASE/<NN>-<MM>-PLAN.md` |
| `SKELETON.md` | `PHASE/<NN>-<MM>-SKELETON.md` |
| `SUMMARY.md`, any `*-SUMMARY.md` variant | `PHASE/<NN>-<MM>-SUMMARY.md` |
| `VERIFICATION.md`, any `*-VERIFICATION.md` variant | `PHASE/VERIFICATION.md` |
| `UI-SPEC.md` | `PHASE/UI-SPEC.md` |
| `SECURITY.md` (phase audit) | `PHASE/reviews/SECURITY.md` |
| `{phase}-REVIEW.md`, `docs/dev-kit/reviews/<sprint>/round-*/*` | `PHASE/reviews/` (see tree) |
| `<plan-dir>/reviews/*.<lens>-review.md`, `<plan_path>.review*.{md,json}` | `PHASE/reviews/<plan>.<lens>-review.md` |
| `{PADDED_PHASE}-UI-REVIEW.md`, `{phase}/UI-REVIEW.md` | `PHASE/reviews/UI-REVIEW.md` |
| `{padded_phase}-EVAL-REVIEW.md` | `PHASE/reviews/EVAL-REVIEW.md` |
| `.deploy-reports/*` | `PHASE/reports/deploy/<date>-pr<number>.md` |
| `docs/dev-kit/automation/<sprint>/*` | `PHASE/reports/automation/` |
| `.planning/STATE.md` | `docs/state/STATE.md` |
| `.planning/config.json` | `docs/state/config.json` |
| `design-reports/design-baseline.json`, `qa-reports/baseline.json`, `.context/health-history.jsonl` | `docs/state/baselines/` |
| `.planning/intel/*` | `docs/state/intel/*` |
| `.planning/graphs/*`, `graphify-out/*` | `docs/state/graphs/*` |
| `.planning/debug/*` | `docs/state/debug/*` |
| `sprint/*` | `docs/state/sprint/*` |
| `.planning/tmp/*`, `.planning/INGEST-CONFLICTS.md` | `docs/state/tmp/*` |
| `.github/workflows/ci-cd.yml` | unchanged (CI config, not a doc) |
| `.claude/learnings.jsonl`, `.claude/design/screens.json` | unchanged (tool state) |
