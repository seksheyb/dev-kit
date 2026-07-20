# dev-kit

A Claude Code **marketplace of 8 lane-scoped plugins** — the merged best-of-breed of six
upstream libraries (superpowers, spec-kit, gstack, get-shit-done, claude-skills,
awesome-claude-code-subagents), de-duplicated into a single architecture.
See [ATTRIBUTION.md](ATTRIBUTION.md).

Install **dev-kit-core** everywhere; add lane plugins per project. This keeps each
session's skill-listing context small — a Spring+React project loads ~88 skills, not 143.

## Plugins

| Plugin | Skills | Agents | Install when |
|---|---|---|---|
| **dev-kit-core** | 51 | 38 | Always — process, SDD spine, plan-review lenses, dev-loop, gates, commands |
| **dev-kit-backend** | 26 | — | Any server-side work (Java, Python, Node, Go, Rust, PHP, Ruby, .NET, SQL...) |
| **dev-kit-web** | 11 | — | Web frontend (React, Next, Vue, Angular, TS, Playwright...) |
| **dev-kit-mobile** | 4 | — | Mobile (Flutter, React Native, Swift, Kotlin) |
| **dev-kit-data-ai** | 13 | 4 | AI/data lanes — includes the AI-lane agents (ai-researcher, framework-selector, eval-planner, eval-auditor) |
| **dev-kit-infra** | 14 | — | Infra-heavy work (K8s, Terraform, Docker, cloud, SRE, PowerShell...) |
| **dev-kit-specialized** | 19 | — | Niche domains (embedded, games, Salesforce, blockchain, fintech, payments, healthcare, legal, SEO...) |
| **dev-kit-product** | 5 | — | Product analytics & compliance (A/B, cohorts, growth, GDPR, HIPAA) |

Lane presets (matching the GWD bootstrap lanes):
`LANE_A` web app → core + web + backend · `LANE_M` mobile → core + mobile + backend ·
`LANE_B` SaaS → core + web + backend + product · `LANE_C` AI → + data-ai

## Architecture

- **Skills** carry all methodology and knowledge, injected in-session into whatever
  agent is running. One canonical home per capability.
- **Agents** are thin isolation wrappers — identity, tool grants, output contract —
  used only where fresh context, distinct model/effort, or parallel fan-out is needed.
  Agents *reference* skills, never restate them. Models are set at dispatch time.
- **Commands** are logic-free stubs dispatching an agent or skill for manual use.
  Orchestration lives in the (separate) pipeline.

### Lens-based plan review (in core)

One `plan-reviewer` agent + five lens skills (`plan-review-ceo`, `-eng`, `-design`,
`-devex`, `-goal-backward`). Dispatch N× in parallel, one lens each — a stable agent
prompt gives cache hits across the fan-out; adding a lens is just a new skill file.

### Co-location guarantees

Cross-referencing assets always ship in the same plugin: plan-reviewer + its lens
skills, commands + the agents they dispatch, writing-plans + sprint-execution,
gate-reverse-engineer + spec-miner, and the vendored GSD references
(`plugins/dev-kit-core/references/gsd/`).

## Install

Add this repo as a marketplace in Claude Code, then install `dev-kit-core` plus the
lane plugins you need.
