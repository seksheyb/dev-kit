# dev-kit

A Claude Code **marketplace of 8 lane-scoped plugins plus `dk`, the orchestration layer** —
the merged best-of-breed of six
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
- **Orchestration** — the cross-session sequencer that walks the stages, survives a
  `/clear`, and governs manual/auto/sleep modes — is the `dk` plugin. See
  [Running the pipeline](#running-the-pipeline-dk).

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

Install **`dk` at user level, always on** — unlike the lane plugins, which are enabled
per project. It has to be available before a project exists, because `/dk:bootstrap:init`
is what creates one.

## Running the pipeline (`dk`)

`dk` walks a project from idea to shipped milestone. The stages live in
[`plugins/dk/RUNBOOK.md`](plugins/dk/RUNBOOK.md); every prompt is its own command.

```bash
# any session, anywhere — dk is user-level
/dk:bootstrap:init myProject       # or --here, to adopt an existing repo
cd myProject && claude
```

Then pick how you want to drive it:

| | What it does |
|---|---|
| `/dk:runbook` | Print the map — all 16 stages, every command, every condition |
| `/dk:status` | Where an **orchestrator-driven** run left off — stage, phase, last verdict, open gates. Reads `.dk-state`, which only `/dk:run` writes, so a hand-driven project has none and this points you back to `/dk:runbook` |
| `/dk:run --manual` | Walks the runbook and **stops at every step** — shows you the command, waits for `run / skip / edit / stop` |
| `/dk:run --auto` | Walks it, stopping only at operator-judgment gates |
| `/dk:run --sleep` | Unattended. Runs **through** session boundaries on automatic compaction, and reads gate answers from `.claude/dk-policy.yml`; **stops** at any gate it has no answer for |

Or type the commands yourself — `/dk:requirements:specify`, `/dk:plan:gate 03`,
`/dk:final:security`. Ordering lives in RUNBOOK.md and nowhere else — no command names its
own successor — so `/dk:runbook` is what tells you where you are in the sequence. Nothing
tracks your position on this path, by design: driving by hand writes no state, and
`/dk:status` will tell you as much and send you to the map.

**Every command runs standalone.** Cold session, no state files, out of order — always
works. The orchestrator is additive, never load-bearing, and
`scripts/checks/pipeline-command-guards.sh` enforces that: only `/dk:run` and `/dk:status`
may read state.

### Brownfield — adopting an existing repo

Same pipeline, same commands. Only stage 0 differs: instead of scaffolding an empty
project, it *recovers* the SDD, ADRs and security baseline the repo never wrote down, so
stages 1–15 have something real to plan against.

```bash
cd existing-repo && claude
/dk:bootstrap:init --here          # adopt in place — never overwrites, reports instead
/dk:bootstrap:constitution 1
```

> **Enable `dev-kit-backend` before `/dk:bootstrap:legacy`, not at stage 2.** `spec-miner`
> needs the lane skills to read the codebase it is mining. Stage 2 is where lanes are
> normally chosen, and by then the mining has already run thin. This is the one ordering
> mistake that silently degrades a brownfield run rather than failing loudly.

Then three **independent** sub-paths — a repo can trigger all three, some, or none:

| Command | Fires when | What it does |
|---|---|---|
| `/dk:bootstrap:legacy` | Undocumented existing code | `spec-miner` → `gate-reverse-engineer` promotes what it mined → `legacy-modernizer` records its migration-strategy choice as an ADR |
| `/dk:bootstrap:ingest-docs` | ADRs/PRDs/specs outside the canonical locations | Fans out one `doc-classifier` per document, then a single `doc-synthesizer` barrier |
| `/dk:bootstrap:baseline` | Anything to index — that doc corpus, or code | `graphify`, then `cso` **with no flags** — the full audit, not `--diff`. One per turn; neither fans out |

**`legacy` assesses and plans; it does not build.** Stage 3 sequences the modernization
work into phases, stage 8 builds it. Treating its output as a to-do list to execute
immediately skips the roadmap that makes it a milestone.

**Brownfield adoption is not the same as milestone 2+.** Both re-enter stage 0 — "is this
repo still greenfield?" is re-asked every milestone — but a *continuing* project answers
`continuing`: `constitution` runs in update mode, `graphify` runs incremental, and neither
`legacy` nor `ingest-docs` fires, because the project's own docs are already current.
`baseline` still runs the **full** `cso` audit, since the repo now carries every prior
milestone's shipped code, and stage 12's `--diff` pass is scoped to this milestone only.

In `--auto` and `--sleep`, all three sub-paths are Class A — `/dk:run` evaluates each
`precondition:` against the repo and skips what does not apply. Driving by hand, the
`asks:` line in each is the question to answer yourself.

### The three gate classes

Stages are conditional, and the condition's *kind* decides whether a mode can resolve it.
Each command declares its own in frontmatter, so the runbook's prose and the
orchestrator's logic derive from one fact.

| Class | Declared as | Example | Auto / sleep |
|---|---|---|---|
| **A** — repo predicate | `gate: auto` + `precondition:` | "no design system exists yet" | Resolves it |
| **B** — prior verdict | `gate: verdict` + `on:` | "verify came back `gaps_found`" | Resolves it |
| **C** — operator judgment | `gate: operator` + `asks:` | "is a product-direction call genuinely open?" | **Stops and asks** (sleep: policy, or stop) |

`blocking: true` halts every mode, sleep included — a `REVISE`, `UNSOUND`,
`gate_passed: false` or `human_needed` verdict never gets walked past.

### State

`/dk:run` writes three tiers so it can resume across the `/clear` at each session boundary.
They are split by **how often each is read**, not by topic — putting them in one file is
what makes resume expensive:

| What | Where | Read |
|---|---|---|
| Next action, loop position | `.dk-state` | **every resume** |
| Progress across stages | `docs/state/STATE.md` | stage/phase boundaries |
| Wave, gate and round history | `docs/state/journal/<NN>-<slug>.md` | **on demand only** |

`.dk-state` is a **slim marker, not a journal** — closed key set, ≤15 lines, overwritten
every step and never appended. Its `next:` line is a *pointer, not a payload*: one
imperative for the next step, naming a journal file when history is needed. On resume the
orchestrator acts on `next:` directly rather than re-deriving position by walking
RUNBOOK.md — re-deriving a mid-loop position like "round 3 of 6" from a linear spine is
exactly where a resume goes wrong.

Full schema: [`plugins/dk/references/state-contract.md`](plugins/dk/references/state-contract.md).
Guard 6 fails CI if `/dk:run` or `/dk:status` ever names a key it doesn't define — key-creep
is how a resume head silently becomes the journal.

Driving by hand writes none of these files.
