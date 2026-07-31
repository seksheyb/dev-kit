# Getting started

This is the technical onboarding path for dev-kit: installing it, standing up your first
project, adopting an existing repo, and understanding the one gate you cannot skip. It
assumes you have already decided to try dev-kit; for the "why should I" case, see the
[root README](../../README.md).

## 1. Prerequisites

- **Claude Code CLI**, installed and authenticated. dev-kit is a Claude Code plugin
  marketplace; it has no other runtime.
- **git**, for cloning the marketplace repo and for the repos you point dev-kit at.

Nothing else. dev-kit does not require a database, a build step of its own, or network
access beyond what Claude Code already needs.

## 2. Install

Add this repo as a Claude Code marketplace, then install plugins into it. There are
9 plugins in total: `dev-kit-core` plus 7 stack-lane plugins, and `dk`, the
orchestration layer.

```bash
# in any Claude Code session
/plugin marketplace add seksheyb/dev-kit
/plugin install dev-kit-core@dev-kit      # always
/plugin install dev-kit-backend@dev-kit   # plus the lanes this project needs
/plugin install dk@dev-kit                # at user level, always on — see below
```

Install **`dev-kit-core` always**: it carries the SDD spine, the plan-review lenses,
the dev-loop, every gate, and the commands that drive them. Then install the lane
plugins your stack actually needs, per project. Installing only what a project uses
keeps the per-session skill listing small: a project on the web lane loads far fewer
skills than one that also pulls in mobile or data/AI work it will never touch.

Lane presets (matching the bootstrap lanes `dk` scaffolds against):

| Lane | Use case | Plugins enabled |
|---|---|---|
| `LANE_A` | Web app | `dev-kit-core` + `dev-kit-web` + `dev-kit-backend` |
| `LANE_M` | Mobile | `dev-kit-core` + `dev-kit-mobile` + `dev-kit-backend` |
| `LANE_B` | SaaS | `dev-kit-core` + `dev-kit-web` + `dev-kit-backend` + `dev-kit-product` |
| `LANE_C` | AI product | the SaaS set + `dev-kit-data-ai` |

`dev-kit-infra` and `dev-kit-specialized` are not tied to a preset — enable them
directly when a project is infra-heavy or sits in a niche domain (embedded, games,
Salesforce, blockchain, fintech, and similar). `/dk:arch:lanes` (stage 2 of the
pipeline) is what actually turns lane plugins on for a project, once architecture is
settled; the table above is what it is choosing from.

Install **`dk` at the user level, always on**, not per project, unlike the lane
plugins. The reason is ordering: `dk` is what creates a project in the first place
(`/dk:bootstrap:init`), so it has to already be available before that project, or
its `.claude/` config, exists. A per-project install can't bootstrap the project
that would carry it.

## 3. First greenfield project

From any session, anywhere, since `dk` is user-level:

```bash
/dk:bootstrap:init myProject       # or --here, to adopt an existing repo — see §4
```

This scaffolds the project directory and writes `CLAUDE.md`, `.gitignore`,
`.claude/settings.json`, `docs/SITEMAP.md`, and the three documentation tiers from
`dk`'s templates, never overwriting a file that already exists; it reports instead.
It also copies the status-line hook to `.claude/hooks/`, because a `statusLine`
in `settings.json` cannot interpolate a plugin path and the plugin's own
directory is replaced on every `dk` update. That hook is the only thing it
vendors — executables like the plan gate's complexity scorer need no copy at all,
since Claude Code puts every enabled plugin's `bin/` on the Bash tool's `PATH`.
Only `dev-kit-core` is enabled at this point — lane plugins come later, at stage 2.

```bash
cd myProject && claude
```

From inside the new project, print the map before doing anything else:

```bash
/dk:runbook
```

This prints all 16 stages of the pipeline, the exact command for each, and every
condition that gates it — the same file `/dk:run` reads. Then pick how you want to
drive it:

| | What it does |
|---|---|
| `/dk:runbook` | Print the map — all 16 stages, every command, every condition |
| `/dk:status` | Where an **orchestrator-driven** run left off — stage, phase, last verdict, open gates. Reads `.dk-state`, which only `/dk:run` writes, so a hand-driven project has none and this points you back to `/dk:runbook` |
| `/dk:run --manual` | Walks the runbook and **stops at every step** — shows you the command, waits for `run / skip / edit / stop` |
| `/dk:run --auto` | Walks it, stopping only at operator-judgment gates |
| `/dk:run --sleep` | Unattended. Runs **through** session boundaries on automatic compaction, and reads gate answers from `.claude/dk-policy.yml`; **stops** at any gate it has no answer for |

Or drive it by hand: type `/dk:requirements:specify`, `/dk:plan:gate 03`,
`/dk:final:gate`, and so on, yourself. Ordering lives in `RUNBOOK.md` and nowhere
else — no command names its own successor — so `/dk:runbook` is what tells you
where you are in the sequence, not any command's own output. This matters because
`/dk:status` only serves an **orchestrator-driven** run: it reads `.dk-state`, a
file only `/dk:run` writes. Drive by hand and no such file exists, so `/dk:status`
has nothing to report and sends you back to `/dk:runbook` instead. Every command
also runs standalone regardless of mode — cold session, no state files, out of
order — which is what makes hand-driving a real option and not a degraded one.

## 4. Adopting an existing repo (brownfield)

Same pipeline, same commands — only stage 0 differs. Instead of scaffolding an
empty project, it recovers the SDD, ADRs, and security baseline the repo never
wrote down, so the remaining 15 stages have something real to plan against.

```bash
cd existing-repo && claude
/dk:bootstrap:init --here          # adopt in place — never overwrites, reports instead
/dk:bootstrap:constitution 1
```

**Ordering trap:** enable `dev-kit-backend` (or whichever lane plugins match the
repo's stack) before `/dk:bootstrap:intake`, not later at stage 2 where lanes are
normally chosen. `spec-miner`, which `intake` dispatches, needs the lane skills
loaded to read the codebase it is mining. Enable lanes at the usual point in the
sequence instead, and the mining has already run thin by the time they arrive.
This is the one ordering mistake in the whole pipeline that degrades a brownfield
run silently rather than failing loudly.

From there, three **independent** sub-paths fire across two commands. A repo can
trigger all three, some, or none; `intake`'s two halves run beside each other when
both fire:

| Command | Fires when | What it does |
|---|---|---|
| `/dk:bootstrap:intake` (code half) | Undocumented existing code | `spec-miner` → `gate-reverse-engineer` promotes what it mined → `legacy-modernizer` records its migration-strategy choice as an ADR |
| `/dk:bootstrap:intake` (docs half) | ADRs/PRDs/specs outside the canonical locations | Fans out one `doc-classifier` per document, then a single `doc-synthesizer` barrier |
| `/dk:bootstrap:baseline` | Anything to index — that doc corpus, or code | `graphify`, then `cso` with no flags — the full audit, not `--diff` |

The code half of `intake` **assesses and plans; it does not build.** Stage 3
sequences the modernization work it surfaces into phases, and stage 8 is what
actually builds it. Treating `intake`'s output as a to-do list to execute right
away skips the roadmap step that turns it into a real milestone.

**Brownfield adoption is not the same distinction as milestone 2+.** Both re-enter
stage 0 — "is this repo still greenfield?" gets re-asked every milestone — but a
*continuing* project answers `continuing` rather than triggering the brownfield
path: `constitution` runs in update mode, `graphify` runs incremental, and neither
half of `intake` fires, because the project's own docs are already current from the
prior milestone. `baseline` still runs the full `cso` audit regardless, since the
repo now carries every prior milestone's shipped code; it's stage 12's security
review that scopes down to `--diff`, just this milestone.

## 5. Your first gate

The first gate you'll actually hit while building a phase is `/dk:plan:gate`,
after `/dk:plan:write` produces the phase plan and `/dk:plan:review` has fixed
whatever it flagged. `/dk:plan:gate` is **blocking**: Wave 1 of the build does not
start until it returns `gate_passed: true`.

Before the independent review engine even runs, the gate runs a deterministic
check: `complexity-score.mjs` — a bare command, resolved off the `dk` plugin's
`bin/` on `PATH`, with nothing installed into the project — recomputes each
track's model and effort tier from the
`complexity:` signals the plan already declares (novelty, logic, ambiguity,
sensitivity, blast radius, and so on) and compares that computed tier against
the `Model`/`Effort` columns the planner wrote by hand. A track declared *below*
its computed tier — the failure mode this catches is trimming a signal to land a
track on a cheaper model — fails the gate outright as a HIGH-severity blocker,
listed as `track <name>: declared <x>/<y> but computed <m>/<e>`. A track declared
*above* its computed tier is only a warning: it costs tokens, not correctness, and
does not fail the gate. `gate_passed` is `true` only once `complexity_ok` is true
and every other HIGH finding from the review engine (SDD alignment, ADR gaps,
scope coverage, structural soundness, vertical-slice compliance) is either absent
or waived with a justification this gate has independently spot-checked — a plan
author's own inline `won't fix — <reason>` is a candidate resolution, not an
automatic one.

Elsewhere in the pipeline, two other blocking gates use a different verdict
vocabulary you'll also want to recognize: the scope gate (`/dk:requirements:scope-gate`,
stage 1) returns `REVISE` or `BLOCKER`, and the architecture gate (`/dk:arch:gate`,
stage 2) returns `UNSOUND`. Any of these — like `gate_passed: false` at the plan
gate, or `human_needed` at the verify step — halts the walk in every mode,
including `--sleep`. As the operator, that means: stop, read what the gate wrote
to disk, fix the artifact it flagged (the spec, the SDD, or the plan's complexity
columns), and re-run the same gate command. None of these gates advance the
pipeline on a partial fix; they re-check the whole artifact each time.

## 6. Where everything lands

Every document a dev-kit pipeline reads or writes in your project has exactly one
canonical path, defined in `docs/SITEMAP.md`, the contract every dev-kit asset is
required to follow; no command may invent a new top-level directory. At a glance:

- `docs/global/` — whole-project-lifetime documents: `PROJECT.md`, the
  constitution, the SDD and ADR bank, the design system, and the codebase map.
- `docs/milestones/<M>/` — everything scoped to one milestone: its roadmap,
  requirements, specs, and, nested inside it, `phases/<NN>-<slug>/` for each
  phase's plan, reviews, and verification artifacts.
- `docs/state/` — machine state only: the resume pointer, the journal, the repo
  graph, and scratch files. Nothing here is meant for a human to browse directly.

If you're ever unsure where a file belongs, `docs/SITEMAP.md` is the source of
truth, not this guide.

For what the 16 stages actually produce, read
[`docs/guide/pipeline.md`](pipeline.md). For how skills, agents, commands, and
model routing fit together underneath all of this, read
[`docs/guide/architecture.md`](architecture.md).
