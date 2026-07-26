# devkit-pipeline — Step 0 (Bootstrap & governance)

**Status:** Approved 2026-07-26. Scope: `devkit-pipeline` v0.1 — the initiator repo and Step 0
only. Steps 1–15 are transcribed later, one at a time.

## What this is

`dev-kit` is an asset layer: 190 skills, agents, and commands, plus a canonical doc-path
contract (`docs/SITEMAP.md`). It deliberately ships no sequencer. `docs/gwd-pipeline-on-devkit.md`
describes the pipeline those assets would run in, but nothing executes it.

`devkit-pipeline` is that sequencer — a separate initiator repo that scaffolds a project and
drives it through steps 0–15. This document designs **Step 0** and the initiator's shape.

Prior art is `~/ADD-SDD-Initiator` (the GWD pipeline). Where this design departs from it, the
reason is stated.

## Decisions

| # | Decision |
|---|---|
| 1 | Step 0 owns **bootstrap + governance** — scaffolding *and* the entry-path branch |
| 2 | The pipeline is a **separate repo**, not a 9th dev-kit plugin |
| 3 | A scaffolded project carries a **contract + project-local slash commands** |
| 4 | **Script scaffolds, Claude governs** — deterministic work in bash, judgment in the model |
| 5 | **No lane abstraction.** Step 2 reads the locked SDD and enables what that milestone needs |
| 6 | **`KICKOFF.md` is a human guide** in the initiator — never loaded, never copied |
| 7 | The pipeline definition is **copied into each project and version-pinned** |
| 8 | Recovery is **idempotent re-entry**, not checkpoints |

### Why the pipeline is copied rather than referenced (7)

The pipeline runs in three modes — `auto`, `manual`, `sleep`. Sleep is unattended: it runs
through context boundaries, relies on auto-compaction, and has nobody watching. After every
compaction the orchestrator must re-resolve the pipeline definition with no human to re-point
it. That makes resolution a correctness property.

Referencing the initiator fails that bar twice. It is an external path dependency that must
resolve in CI, containers, and fresh clones — and Step 8 dispatches track subagents into **git
worktrees**, a different working directory, where an in-repo `docs/devkit/` travels but an
absolute path to the initiator may not. Worse, `git pull` on the initiator during a multi-day
sleep run silently changes a step's definition underneath a pipeline already executing it.

Copying is hermetic. The cost — a project can sit on an old pipeline version — is a maintenance
cost, not a correctness risk, and is managed by an explicit update path rather than tolerated.
Pinning also closes capability row 3 (the source-pinning ledger): every project records exactly
which pipeline version produced it.

### Why idempotent re-entry (8)

Three options were considered:

- **Checkpoints** (`step: 0, substep: d`) make the marker a second source of truth. A crash
  after writing `constitution.md` but before updating the marker re-runs the action and
  clobbers a finished file.
- **A free-form `next:` pointer** (GWD's model) is model-authored prose read back by a
  different context after compaction — weakest exactly where it is needed most.
- **Idempotent re-entry** has no sub-step state. Resume re-runs Step 0; every action is guarded
  by a file-existence predicate, reusing the same predicates the pipeline's conditional gates
  already use. State cannot disagree with the filesystem.

This is also the lighter option: existence guards instead of checkpoint bookkeeping.

## Architecture

```
dev-kit/                    asset layer — 190 skills/agents/commands
    ↑ invoked by
devkit-pipeline/            the initiator — canonical pipeline definition (NEW)
    ↓ scaffolds + copies into
myProject/                  a project running the pipeline
```

`dev-kit` does not change.

### The initiator (v0.1)

```
PIPELINE.md                 steps 0–15 · gates · boundaries · mandates
KICKOFF.md                  human guide: starting a project (never loaded)
BACKLOG.md                  the capability table's open rows — this repo's build backlog
VERSION                     0.1.0
steps/00-bootstrap.md       the only step written in full at v0.1
templates/
  CLAUDE.md.template        ~50 lines
  commands/{start,resume,status}.md
bin/bootstrap-devkit-project.sh
```

`PIPELINE.md` **absorbs** `dev-kit/docs/gwd-pipeline-on-devkit.md` rather than citing it: the
16-step table, the conditional-gates table, the three structural branches (entry path ·
per-phase loop · milestone loop), cross-cutting assets, and lane routing. Step N ≡ blueprint
Stage N — no renumbering, so the two can be diffed during transcription.

`BACKLOG.md` absorbs the still-open rows of `dev-kit/docs/workflow-recommendations.md`:
Orchestration (1, 2, 3, 11, 12, 13), Workflow (7, 8, 10, 22), Hooks (15–21), and row 24.
Those rows *are* this repo's roadmap.

Once steps 0–15 are all written and diffed against the source, `gwd-pipeline-on-devkit.md`,
`workflow-recommendations.md`, and `gwd-pipeline-gap-analysis.md` are deleted from `dev-kit`
in one commit.

### A scaffolded project

```
CLAUDE.md                   ~50 lines: identity, mode, constraints, pointer table
.claude/
  settings.json             dev-kit marketplace + dev-kit-core ONLY
  commands/devkit/{start,resume,status}.md
docs/
  SITEMAP.md                the doc-path contract (copied from dev-kit)
  devkit/
    PIPELINE.md  steps/  VERSION      ← copied, pinned
    journal/NN-<phase>.md
  global/ milestones/v1/ state/       ← dirs per SITEMAP
```

Only `dev-kit-core` is enabled at bootstrap. Nothing else installs until Step 2 locks the SDD.

## Step 0

### The script half

`bin/bootstrap-devkit-project.sh <name> [--here]` — no questions, no detection, no judgment.
Same output every time:

```
git init (if needed)
CLAUDE.md                        from template
.gitignore
.claude/settings.json            dev-kit marketplace + dev-kit-core
.claude/commands/devkit/{start,resume,status}.md
docs/SITEMAP.md                  copied from dev-kit
docs/devkit/                     PIPELINE.md · steps/ · VERSION (version + sha)
docs/state/config.json           step: 0 · mode: auto · milestone: v1
dir skeleton                     global/ · milestones/v1/ · state/ · devkit/journal/
```

**The script never overwrites.** It writes a file only if absent, reports what it skipped, and
exits non-zero if the skip list means the project is half-scaffolded. `--here` on a repo that
already has a `CLAUDE.md` writes `CLAUDE.devkit.md` alongside it and says to merge.

**The script stays small and dumb** — `mkdir -p`, copy templates, substitute a project name,
write `VERSION`. Anything conditional belongs in `steps/00-bootstrap.md` where Claude executes
it, or in a template. GWD's equivalent is 1042 untested lines; that size is what happens when a
scaffolder accumulates decisions it should not own. If this script approaches a few hundred
lines, that is the signal.

### The Claude half

`/devkit:start` reads `docs/devkit/steps/00-bootstrap.md` and runs six guarded actions. Every
guard is a filesystem predicate, so the step is re-entrant by construction.

| # | Action | Skip if | Runs |
|---|---|---|---|
| 0a | Verify scaffold | `docs/devkit/VERSION` present, tree intact | — (else halt) |
| 0b | Detect + record entry path | `config.json.entry_path` set | writes `config.json` |
| 0c | Write project identity | `docs/global/project/PROJECT.md` exists | interview → `PROJECT.md` |
| 0d | Entry-path branch | per-branch artifact exists | see below |
| 0e | Security baseline | security report exists, or no code | `cso` (full) |
| 0f | Knowledge graph | `graph.json` current, or no code | `graphify` |

**0d branches** — not mutually exclusive; a repo can trigger both middle rows:

```
greenfield      → constitution (init)
legacy code     → spec-miner → gate-reverse-engineer     [+ cso at 0e]
existing docs   → doc-classifier ×N → doc-synthesizer
continuing (M2+)→ constitution (update) + graphify (incremental)   [+ cso at 0e]
```

Detection order: prior archived milestone → `continuing`; source files beyond ecosystem/docs →
`legacy`; planning docs outside canonical paths → `existing-docs`; else `greenfield`. Detected,
then **confirmed with the user** — misclassifying sends the whole milestone down the wrong path.

### Two corrections to the blueprint

**Step 0 writes `PROJECT.md` (0c).** `SITEMAP.md` defines `docs/global/project/PROJECT.md` and
the `STATE.md` template reads from it, but no stage in the blueprint ever writes it. Step 0 is
its natural owner — project identity is bootstrap-time by definition.

**Step 0 does no requirements intake.** An earlier draft had Step 0 place a PRD and gate on
Step 1 having an input. That was wrong. Only five files in `dev-kit` mention `PRD.md`, and
three of them are consumers, not authors: `gate-reverse-engineer` *recovers* a Legacy PRD on
the legacy path, `doc-synthesizer` *classifies* PRDs that already exist, and
`plan-review-goal-backward` *reads* one if present. `specify` and `brainstorming` do not
mention PRDs at all — Step 1's chain is `brainstorming` → `specify` → **`spec.md`**, and the
spec is the requirements artifact. `PRD.md` is only ever a user-supplied input file or a
recovered legacy artifact. Nothing in Step 0 gates on it.

## State and contract

**One machine-state file.** GWD keeps `.gwd-state` at the repo root, but `SITEMAP.md` is
explicit that the root holds ecosystem files only and machine state lives under `docs/state/`.
`config.json` already exists in that contract, so position goes there:

```json
{
  "pipeline":   { "version": "0.1.0", "sha": "8f2a1c" },
  "position":   { "step": 0, "mode": "auto", "milestone": "v1", "phase": null },
  "entry_path": "greenfield",
  "flags":      { "graphify": true }
}
```

There is no `next:` field. Position is a number; the filesystem is the truth about what is done.

**State tiers**, by access pattern:

| What | Where | Read |
|---|---|---|
| Position, mode, entry path | `docs/state/config.json` | every resume |
| Durable constraints | `CLAUDE.md` → Project Constraints | every turn |
| Progress digest | `docs/state/STATE.md` | phase boundaries (created Step 3) |
| Narrative, wave/gate history | `docs/devkit/journal/NN-<phase>.md` | on demand only |

**`CLAUDE.md` — ~50 lines, project-specific only:** what pipeline version this project runs and
where position lives · the orchestration model (dispatch each step as a fresh subagent; hold
paths, not content) · modes and boundaries · decision points · a pointer table into
`docs/devkit/` · Project Constraints (durable, hand-edited). No step table, no gate shapes, no
dispatch invariants — those live in `docs/devkit/` and are read by the step that needs them.

**Commands** are thin dispatchers — read `config.json`, read the step file, execute. ~15 lines
each, carrying no step logic, so a pipeline update never requires rewriting them.

```
/devkit:start      begin — or safely re-enter Step 0 (idempotent)
/devkit:resume     read position, continue from the recorded step
/devkit:status     print position + what's next; no side effects
```

### Modes

| | auto | manual | sleep |
|---|---|---|---|
| Between steps | advance | **stop** | advance |
| At a boundary ‖ | **stop** for `/clear` | **stop** | advance (auto-compact) |
| At a decision point | **stop** | **stop** | **stop** |
| On hard block | **stop** | **stop** | **stop** |

**Step 0's decision points** — where even `sleep` parks: entry-path confirmation (0b), the
project identity interview (0c), and `constitution`'s principle interview (0d).

**Boundary ‖ after Step 0, always.** The blueprint marks boundaries only after Stages 3 and 7,
but Step 0 can end having run `spec-miner`, `cso`, and `graphify` — a lot of dead context to
carry into requirements work. A `/clear` costs nothing because Step 1 starts fresh from disk.

## Failure handling

| Failure | Response |
|---|---|
| Scaffold missing / tree incomplete (0a) | **Halt.** Name the missing files and the bootstrap command. Never self-repair — usually means the wrong directory |
| Pinned version < initiator version | **Warn, continue.** Never auto-update mid-milestone |
| `dev-kit-core` unreachable | **Halt.** Every 0d action is a dev-kit asset |
| Dispatched asset fails | Retry once, then **halt**. State untouched, so `/devkit:resume` re-enters cleanly |
| Entry path detected wrong | User overrides at 0b; the override is recorded and never re-detected |
| `doc-synthesizer` finds LOCKED-vs-LOCKED contradictions | **Hard block** — only a human can resolve contradictory locked decisions |
| `graphify` fails or times out | **Degrade.** Set `flags.graphify: false`, continue. Steps 5 and 7 fall back to fresh exploration |

The rule: **halt** when continuing would produce garbage downstream; **degrade** when the
artifact is an optimization. A pipeline that hard-blocks on a slow graph build is useless in
sleep mode; one that shrugs off a missing constitution poisons every stage that treats it as
binding.

### Exit gate

All must hold before `position.step` advances to 1:

```
✓ config.json has entry_path and a pinned pipeline version
✓ docs/global/project/PROJECT.md exists and is non-stub
✓ entry-path branch artifact present:
    greenfield    → docs/global/project/constitution.md
    legacy        → recovered SDD + PRD + ADRs
    existing-docs → INGEST-CONFLICTS.md, zero unresolved LOCKED blockers
    continuing    → constitution.md amended (version bumped)
✓ if code exists → security report + graph.json present, OR flagged as degraded
```

Then: `position.step = 1`, print the boundary, and in `auto`/`manual`, stop.

## Verification

**The script is deterministic — test it directly.**

```
fresh dir                  → exact expected file list; VERSION pinned to a real sha
--here + existing CLAUDE.md → writes CLAUDE.devkit.md; original byte-identical; exits non-zero
re-run on scaffolded project → zero writes; skip list reported
SITEMAP conformance        → nothing written to repo root outside the allowed ecosystem set
```

The last is worth automating because it is the rule most likely to erode quietly.

**Fixtures for the Claude half** — greenfield and legacy at v0.1:

| Fixture | Asserts |
|---|---|
| empty git repo | detects `greenfield`; runs `constitution` only; `cso`/`graphify` skipped |
| source files, no docs | detects `legacy`; `spec-miner` → `gate-reverse-engineer` + `cso` fire |

`existing-docs` and `continuing` fixtures follow later — they exercise `doc-classifier` and
`constitution --update`, which barely differ mechanically from the two above.

**The idempotency test is the important one**, because recovery model 8 is the whole safety
story: run Step 0, kill after each of the six actions, `/devkit:resume`, and assert the final
state is identical *and no already-written file was touched* — comparing shas, not just
existence. If that passes, sleep mode is crash-safe. If it does not, nothing else matters.

**Out of scope:** whether `constitution` writes a *good* constitution, or `spec-miner` recovers
*accurate* requirements. That is model output quality, not pipeline correctness. The gate
asserts the artifact exists and is not a stub; judging its content is what Step 1's reviews do.

There is no prior art to inherit — the GWD initiator has exactly one test file
(`antigravity-review.test.sh`), and it covers the review bridge, not the pipeline. Its 1042-line
bootstrap, its scoring and telemetry scripts, and all 13 of its hooks are untested. GWD's actual
strategy is `audit-project-add.sh`: conformance-check the scaffolded project rather than
unit-test the scaffolder. That approach is sound and is adopted here — folded into action 0a
rather than shipped as a separate script you must remember to run.

## Deferred from v0.1

| Deferred | Why it can wait |
|---|---|
| `update-devkit-project.sh` | Needed only once old projects exist. The `VERSION` pin is still written — that is what makes the updater possible later |
| `audit-devkit-project.sh` as its own script | Folded inline into 0a; extract when it earns a file |
| `existing-docs` / `continuing` fixtures | Mechanically close to the two v0.1 fixtures |
| `/devkit:step <n>` escape hatch | Solves a problem not yet hit |
| `ADOPTION.md` | `--here` works; the guide can follow |
| `steps/01–15.md` | Written when each step is reached. Empty stubs are noise |

## Open for later steps

Not decided here, and not needed for Step 0: how Step 2 derives the plugin set from the locked
SDD; where telemetry and calibration state live (BACKLOG rows 10, 11); whether the Hooks layer
(rows 15–21) ships with the initiator or separately.
