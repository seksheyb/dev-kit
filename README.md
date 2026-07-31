# dev-kit

A Claude Code marketplace of **`dev-kit-core`, 7 stack-lane plugins, and `dk`, the
orchestration layer**: 141 skills, 41 agents, and 55 pipeline commands that walk a project
from idea to shipped milestone through a 16-stage pipeline with blocking gates, parallel
agent waves, and deterministic model routing. It merges six upstream libraries
(superpowers, spec-kit, gstack, get-shit-done, claude-skills,
awesome-claude-code-subagents) into one de-duplicated architecture; see
[ATTRIBUTION.md](ATTRIBUTION.md). Install is one line:
`/plugin marketplace add seksheyb/dev-kit`.

## Why this beats vanilla Claude Code

Vanilla Claude Code gives you one session, one model for everything in it, ad-hoc
prompting, and no memory of process across a `/clear`. Nothing checks the plan before you
build against it, and every subagent you dispatch inherits whatever model you happen to be
sitting on. dev-kit adds six things on top, each of which you can verify in this repo:

- **A staged pipeline with blocking gates, grounded in real research.**
  `/dk:requirements:scope-gate`, `/dk:arch:gate`, `/dk:plan:gate` and `/dk:final:gate` are
  marked `blocking: true`: a `REVISE`, `UNSOUND`, `gate_passed: false` or `human_needed`
  verdict halts the run in every mode. What reaches those gates isn't a guess — a roster of
  specialized researchers (`phase-researcher`, `project-researcher`, `market-researcher`,
  `domain-researcher`, `advisor-researcher`) hits docs, the web, and the codebase before
  `/dk:requirements:specify` writes the spec, and `/dk:verify:phase` verifies the phase goal
  independently of whoever built it.
- **Deterministic model routing.** Every dispatch is described by a signal descriptor and
  scored by [`plugins/dk/bin/model-route.mjs`](plugins/dk/bin/model-route.mjs): two 0–12
  sums, capability → model and risk → effort. The LLM declares the signals; code alone
  converts them to a decision, so the same descriptor always yields the same
  `{model, effort}`. Mechanical work lands on haiku at low effort; judgment work lands on
  the higher tier arithmetically, rather than on whichever model you launched.
- **No agent is special-cased — none, anywhere, including the gate agents.** No agent
  definition's frontmatter, no entry in `plugins/dk/bin/complexity.config.json`, and no
  workflow script carries a hardcoded model for any agent. `code-review-gate`,
  `security-auditor`, `advisor-researcher` and every other agent get their model from the
  same signal score. What the 15 gate/review agents do keep is an `effortFloor: high`, so
  a descriptor whose signals genuinely land it on a cheap model still can't be scored down
  on rigor: score `code-review-gate` at every signal's floor and the router returns
  `haiku` / `effort: high`, not `haiku` / `effort: low`.
- **Parallel execution instead of one serial context.** `/dk:build:waves` runs a phase's
  tracks as waves of subagents in their own git worktrees; `/dk:discover:map` fans out six
  agents in a single wave. Independent work happens side by side, not sequentially in one
  context window.
- **Lane-scoped context.** Install `dev-kit-core` everywhere and add lanes per project, so
  a Spring + React project loads 86 skills, not all 141. The skill listing stays small
  enough that the model still picks the right one.
- **Resumable orchestration, adversarial review, and testing that closes the loop.**
  `/dk:run --sleep` runs unattended through session boundaries, resuming from `.dk-state`, a
  ≤15-line marker file whose `next:` line points at the next action. `/dk:review:cycle` runs
  an adversarial find → triage → sweep loop — finders surface issues, skeptics try to refute
  them — of at most 6 rounds, closes only on a full-roster round that comes back clean, and
  never opens a 7th. Coverage doesn't stop at "looks done": `nyquist-auditor` generates real
  tests to close validation gaps, `gate-automation` writes and runs Playwright/Maestro e2e
  coverage for changed flows, and `eval-planner`/`eval-auditor` score AI-phase evaluation
  coverage against the AI-SPEC.

## 60-second start

```bash
# in any Claude Code session
/plugin marketplace add seksheyb/dev-kit
/plugin install dev-kit-core@dev-kit      # always
/plugin install dev-kit-backend@dev-kit   # plus the lanes this project needs
/plugin install dk@dev-kit                # install dk at USER level, always on

# dk has to exist before the project does
/dk:bootstrap:init myProject              # or --here, to adopt an existing repo
```

Then `cd myProject && claude`, and drive the pipeline: `/dk:run --manual` stops at every
step and shows you the command before it runs, `/dk:runbook` prints the whole map, and
`/dk:status` reports where an orchestrator-driven run left off. Full path, including
brownfield adoption: **[docs/guide/getting-started.md](docs/guide/getting-started.md)**.

**After updating the plugins** (`/plugin update`, `/reload-plugins`), run
`/dk:bootstrap:converge` in each project you have scaffolded. Projects created on 1.0.0 or
earlier vendored a copy of the complexity scorer and its config into `.claude/bin/`; a vendored
config takes precedence over the plugin's own, so a stale one silently pins scaffold-day
defaults. `--check` is read-only and reports per-file status; `--apply` fixes what is safe to fix
and stops on anything needing a decision.

## What's inside

| Plugin | Skills | Agents | Install when |
|---|---|---|---|
| **dev-kit-core** | 49 | 37 | Always — the pipeline spine, quality gates, and process skills every project needs regardless of stack |
| **dev-kit-backend** | 26 | — | Server-side work (Java, Python, Node, Go, Rust, PHP, Ruby, .NET, SQL) |
| **dev-kit-specialized** | 19 | — | Niche domains (embedded, games, Salesforce, blockchain, fintech, healthcare, legal, SEO) |
| **dev-kit-infra** | 14 | — | Infra-heavy work (K8s, Terraform, Docker, cloud, SRE, PowerShell) |
| **dev-kit-data-ai** | 13 | 4 | AI/data lanes (LLM apps, ML pipelines, RAG) — the only lane plugin with its own agents, for framework selection and evaluation design/audit |
| **dev-kit-web** | 11 | — | Web frontend (React, Next, Vue, Angular, TypeScript, Playwright) |
| **dev-kit-product** | 5 | — | Product analytics and compliance (A/B, cohorts, growth, GDPR, HIPAA) |
| **dev-kit-mobile** | 4 | — | Mobile (Flutter, React Native, Swift, Kotlin) |

Plus **`dk`**: 55 commands and the RUNBOOK, installed at user level rather than per
project. Lane presets: `LANE_A` web app → core + web + backend · `LANE_M` mobile → core +
mobile + backend · `LANE_B` SaaS → core + web + backend + product · `LANE_C` AI → + data-ai.
Every skill and agent is documented one by one in the
**[capability catalog](docs/catalog/README.md)**.

## The pipeline at a glance

Sixteen stages in three parts: A runs once per milestone, B repeats per phase, C closes the
milestone.

| Stages | What you get out of it |
|---|---|
| 0 Bootstrap | A project with governance, doc tiers, a repo graph and a security baseline — or an existing repo adopted, with the spec and ADRs it never wrote down recovered |
| 1–2 Requirements, architecture | An approved spec with its assumptions mapped, then a technical design, each past its own blocking gate |
| 3–4 Roadmap, design system | The milestone split into phases off four-axis research; a design system, established once ever |
| 5–7 Discover, plan | The phase's codebase map and research, then a wave/track plan that has passed the plan gate |
| 8–9 Build, debug | The phase built by parallel tracks in worktrees, with failures root-caused and covered by regression tests |
| 10–11 Review, verify | Findings found, triaged and swept over ≤6 adversarial rounds; the phase goal verified and remaining gaps remediated |
| 12–13 Final review, ship | Security, UI, devex and compliance lanes cleared; a PR open and deliberately unmerged |
| 14–15 Document, operate | Docs, changelog and release notes written against the real diff, then merge, health, SLO review, retro, and the milestone closed |

Stage-by-stage detail: **[docs/guide/pipeline.md](docs/guide/pipeline.md)**.

## Docs

| Doc | What it covers |
|---|---|
| [docs/guide/getting-started.md](docs/guide/getting-started.md) | Install, first run, greenfield and brownfield paths |
| [docs/guide/pipeline.md](docs/guide/pipeline.md) | What each of the 16 stages delivers, and its gates |
| [docs/guide/architecture.md](docs/guide/architecture.md) | Skills, agents, commands, model routing, state files |
| [docs/catalog/README.md](docs/catalog/README.md) | Every skill and agent, by plugin and by role |
| [plugins/dk/RUNBOOK.md](plugins/dk/RUNBOOK.md) | The operational map — order, conditions, gates, loop structure |
| [CHANGELOG.md](CHANGELOG.md) | Release history; every plugin ships on one coordinated version |

## License and attribution

[MIT](LICENSE). Upstream sources, and what was taken from each:
[ATTRIBUTION.md](ATTRIBUTION.md).
