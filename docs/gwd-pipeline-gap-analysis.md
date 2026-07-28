# dev-kit Pipeline — Shortcomings

Regenerated 2026-07-28. Supersedes the 2026-07-21 artifact-name inventory, which was
written before the `dk` plugin existed and is now substantially wrong (it asserted
dev-kit had no hooks layer, no state contract, and no orchestrator — all three now
exist).

**What this file is.** A shortcomings-only register for dev-kit's pipeline. Every item
below is something dev-kit is missing, has left undefined, or ships broken.

**What it is not.** It is not a coverage report. The full step-for-step comparison
against the ADD-SDD pipeline (`~/IdeaProjects/ADD-SDD-Initiator`) was run and is not
reproduced here: **all 15 ADD-SDD steps are covered**, 11 as strict supersets, and
dev-kit adds 6 stages ADD-SDD has no counterpart for. Nothing methodological is missing.
What follows is the residue.

**Status.** 6 of 19 resolved (S1, S6, S7, S8, S12, S17 — see each section). 13 open.

**Sources read in full to produce this.** `plugins/dk/RUNBOOK.md`, all 68 `dk` commands,
`references/state-contract.md`, all hooks + `hooks.json` + `CONTRACTS.md`, all templates,
`plugins/dev-kit-core` (37 agents · 49 skills · 8 commands · references), the 7 lane plugins,
`scripts/checks/*` — cross-referenced against ADD-SDD's `GWD-PIPELINE.md`, `CLAUDE.md.template`,
`docs/gwd/*`, `SCHEMAS.md`, its 13 hooks, 3 bin scripts, 4 gate agents, templates, and
bootstrap/adopt/audit scripts.

---

## Summary

| ID | Shortcoming | Severity | Home |
|---|---|---|---|
| ~~**S1**~~ | ~~Deterministic complexity scorer is invoked but not shipped~~ — **FIXED 2026-07-28**, see below | — | shipped |
| **S2** | `--sleep` mode's policy file is undefined — the mode does not work unattended | High | Orchestration |
| **S3** | `complexity-calibration.json` is read by a gate; nothing writes it and it is not shipped | Medium | Orchestration |
| **S4** | No telemetry, defect attribution, or calibration loop of any kind | Medium | Workflow + Orchestration |
| **S5** | Standing rules are enforced but never surfaced — vertical slicing, TDD-first, reviewer defaults | Medium | Template |
| ~~**S6**~~ | ~~Story-bank file tree has no creator or maintainer~~ — **FIXED 2026-07-28** | — | shipped |
| ~~**S7**~~ | ~~`docs/state/journal/` is not in the SITEMAP~~ — **FIXED 2026-07-28** | — | shipped |
| ~~**S8**~~ | ~~The calibration tier is consumed and produced by nothing~~ — **FIXED 2026-07-28** | — | shipped |
| **S9** | No scaffolding surface — no adopt path, no compliance audit, no lint/TS baseline | Low–Med | Agent/Skill/Command |
| **S10** | No write-side injection guard — content authored from poisoned context is unscanned | Low–Med | Hooks |
| **S11** | Two Workflow scripts are still prose: the ≤6-round review loop and the review-engine retry loop | Low–Med | Workflow |
| ~~**S12**~~ | ~~No commit-message convention enforcement~~ — **FIXED 2026-07-28** | — | shipped |
| **S13** | `.dk-state`'s commit/ignore status is unspecified | Low | Template |
| **S14** | Statusline path resolution has never been verified against a live session | Low | Hooks |
| **S15** | No discrete step applies the scope gate's outcome | Low | Command |
| **S16** | No git `pre-commit` graph refresh — out-of-pipeline commits drift the graph | Low | Hooks |
| ~~**S17**~~ | ~~Shipped docs are stale~~ — **FIXED 2026-07-28** by deleting them | — | resolved |
| **S18** | `docs/global/process/SCHEMAS.md` is canonical in the SITEMAP and read by a gate, but no template ships its content | Medium | Template |
| **S19** | Three of the repo's own regression guards are failing at `HEAD` | Medium | Repo |

---

## S1 — The deterministic complexity scorer *(FIXED — 2026-07-28)*

**Was.** `agents/gate-plan-review.md` step 0 invoked `.claude/bin/complexity-score.mjs`; dev-kit
shipped no such file, and the documented fallback was a manual signal check — a second model
re-reading the same prose the planner used, which cannot produce a different answer than the one
already written down. Model and effort per track were effectively chosen, not computed.

**Now.** Shipped at `plugins/dk/bin/complexity-score.mjs` (+ `complexity.config.json`), installed
into `.claude/bin/` by `/dk:bootstrap:init`.

**Two findings that changed the design from the original write-up of this item:**

1. **dev-kit had not "dropped the dependency signals."** They are absent from the per-task
   `<complexity_signals>` block, but `Depends On` is a column of the Parallel Execution Map, so
   fan-out and blast radius are both derivable — blast by reversing the plan-id edges. **Every term
   ADD-SDD's scorer needs is already in a dev-kit plan.** No producer change was required; nothing
   in `planner.md`, `writing-plans`, `sprint-execution` or `bugfix-wave` was touched.
2. **Bands alone contradict `complexity-signals.md`.** A track declaring `ambiguity: high` scores 3
   of 12 on the risk axis and bands to `low` effort — while the doc's own effort table says `high`
   is for "cross-cutting scope, or `ambiguity: high`", and `low` requires "`ambiguity: low` **and**
   `logic: low`". A sum lets one maxed-out signal be averaged away by low ones. The fix is
   `effortFloors`, symmetric to the capability floors, encoding that table verbatim.

**Scoring, on dev-kit's own 3-value vocabulary (both axes 0–12):**

```
capability = novelty + logic + ambiguity + breadth + fanout          -> band -> model
risk       = sensitivity + blast + reversibility + tests + ambiguity -> band -> effort
```

then, in order: capability floors → effort floors → critical-path effort floor → haiku context
guard. Floors read the **raw declared enums**, never the calibrated score, so a negative calibration
delta can never suppress a floor.

**Two deliberate divergences from ADD-SDD's scorer, both forced by dev-kit's own documented rules:**

| Divergence | Why |
|---|---|
| **No `minModelForEffort`.** ADD-SDD raises the model to match a high effort band. dev-kit must not | `complexity-signals.md` states the axes are independent — *"a mechanical-but-risky task can be `haiku`/`high`"*. An effort-driven model floor would contradict a documented invariant |
| **Over-declaration warns, it does not fail.** Exit 1 fires only on under-declaration or missing signals | The failure being defended against is *gaming* — trimming `novelty` to land a cheaper model. Declaring above the computed tier costs tokens, not correctness; failing on it would punish conservative planning. ADD-SDD demands exact equality both ways |

**Also handled:** `inherit` in the Model column is a legitimate planner choice, so the model
comparison is skipped for those rows (effort is still checked). A track whose bullet `files` list
disagrees with its row's `Files Owned` is flagged — that divergence is the signature of a
back-filled signal block, and it makes both this score and the map's disjointness check unreliable.
`complexity-calibration.json` is read when present and hashed into the output, so **S3's read side
already works** the moment a producer for it exists; absent, `calibrationHash` is `null`.

**Verification.** `plugins/dk/bin/tests/complexity-score.test.sh` — 21 assertions, all passing:
clean plan passes; trimmed enum fails naming the capability floor; critical-path track fails naming
the effort floor; over-declaration warns without failing; missing signals fail; file-list divergence
flagged; `inherit` not a mismatch; blast radius demonstrably raises a depended-on track's risk; and
exit-2 paths for no map, missing file, no argument, invalid config, unparseable config, corrupt
calibration. Run against a four-track fixture it caught two genuine under-declarations.

**Consumer updated.** `gate-plan-review.md` step 0 now reads the scorer's `blockers` array verbatim
rather than deriving the list from `match.model`/`match.effort` — those are also false for
over-declaration, which is not a failure. The manual fallback is retained for repos adopted by hand,
but is no longer described as the common case.

---

## S2 — `--sleep` mode's policy file is undefined

**Evidence.** `plugins/dk/commands/run.md:33` — in `--sleep`, every `gate: operator`
answer is read from `.claude/dk-policy.yml`, and "if a gate has no entry there, stop, do
not assume."

That file has **no schema, no template, no example, and no gitignore entry anywhere in
the repo.** `run.md:33` is its only mention.

**Why it matters.** dev-kit has **18 `gate: operator` commands**. With no policy file, an
unattended `--sleep` run stops at the first one — which for a fresh milestone is
`/dk:requirements:market` at Stage 1. The mode is documented, persisted in `.dk-state`,
and mirrored in `RUNBOOK.md:34-36`, but is not usable.

This is a dev-kit-original hole, not inherited. ADD-SDD's sleep mode works because its
decision points are a fixed enumerated list of six that the orchestrator carries in
context; dev-kit's are decentralized into 18 `asks:` fields, which is the better design
*provided* the policy file exists.

**Home.** Orchestration. Define the schema (gate id → answer), ship a template, add it to
`templates/gitignore`, and state what an absent file means versus an incomplete one.

---

## S3 — `complexity-calibration.json` is read but never written

**Evidence.** `plugins/dev-kit-core/agents/gate-plan-review.md:44` reads it. No dev-kit
asset writes it. It is not in `plugins/dk/templates/`, so `/dk:bootstrap:init` does not
seed it.

**Why it matters.** Inert today — the gate degrades cleanly when it is absent. It matters
because it is the persistence layer S4 needs: path-glob risk deltas accumulated from
prior sprints' defects, machine-maintained on the risk axis and human-edited only on the
capability axis.

**Read side now closed (S1).** The shipped scorer reads this file when present, applies each
matching `pathAdjustments` entry (clamped ±2, largest signed delta per axis wins — no stacking),
hashes it into `calibrationHash`, and reports per-track `appliedAdjustments` so a routing change
caused by calibration is one-glance attributable. Floors are evaluated on raw enums, so a negative
delta cannot suppress one. What remains missing is only the **producer** — nothing generates or
approves the file.

**Home.** Orchestration (cross-sprint persistence). Blocks S4.

---

## S4 — No telemetry, defect attribution, or calibration loop

**Evidence.** `plugins/dev-kit-core/skills/sprint-execution/SKILL.md:23,194` records
metrics *only if the project defines a command* — dev-kit ships none.
`docs/workflow-recommendations.md` row 10 states it directly: *"no telemetry producer
exists anywhere in dev-kit today (scattered 'calibration' mentions are vocabulary, not
emitted data)."* The only other touchpoints are `gate-plan-review.md:44` (reading the
file from S3) and `skills/{devex-review,plan-review-devex}/references/dx-calibration.md`,
which is a scoring rubric, not emitted data.

**What is missing, precisely.** ADD-SDD's `track-metrics.mjs` is 409 lines across four
subcommands, none of which has any dev-kit counterpart:

| Subcommand | What it does |
|---|---|
| `record` | Post-wave snapshot of every track's model / effort / effortParam / skill / tasks / files into a per-sprint metrics file |
| `attribute` | Maps each review finding back to the track that produced it — three tiers: exact-file majority vote over `blocker.files[]` → longest shared segment-wise directory prefix vs `lead_file` → `unattributed`. Detects the contract breach where P0/P1 counts are non-zero but `blockers` is empty, and blocks all clean-streak credit for that sprint |
| `calibrate` | Generates a **proposal only**, never touching the live file: add / increase / reset-streak / decay / remove rules, with a decay pass that requires zero attributed P0/P1 *and* no unattributed blocker under the glob |
| `apply-calibration` | Post-approval application, idempotent per sprint via a `calibratedSprints` ledger |

**Why it matters.** Without it the pipeline cannot learn which surfaces systematically
under-route, `sprint-execution`'s metrics step has nothing to call, and S3's file has no
producer. ADD-SDD additionally names its metrics file the training corpus for a future
learned router — that avenue is closed to dev-kit entirely.

**Home.** Workflow for the attribution/calibration math (plain JS over structured agent
output) + Orchestration for the persisted ledger. Blocked on S3.

---

## S5 — Standing rules are enforced but never surfaced

**Evidence.** `plugins/dk/templates/CLAUDE.md.template` (69 lines) contains a doc-path
contract, a Project Constraints section, a Requirement Scope line, a Review Tier
Default, a Test Coverage section, and a heading-existence hazard block. It contains **no
mandate list, no operating-mode declaration, and no context-boundary registry.**

Neither `RUNBOOK.md` nor the template mentions vertical slicing at all.

**Where each rule actually lives:**

| Rule | Enforced in | Surfaced to the session? |
|---|---|---|
| Vertical slicing always | `references/vertical-slice.md` — a hard gate inside `roadmapper`, referenced by `planner`, `writing-plans`, `specify`, `gate-plan-review` | **No** |
| TDD-first execution | `test-driven-development` skill, invoked by `sprint-execution` | **No** |
| Reviewer defaults, auto-initiated | `references/independent-review.md` per-role defaults + fallback chains | **No** |
| Design-system bootstrap, one-time | `/dk:design:system` precondition | Yes, as machine state |
| UI = design handoff | `/dk:build:ui` → `design-handoff` | Yes, as a step |
| Wiki / graphify capture | hook layer | Yes, as runtime behavior |

**Why it matters.** ADD-SDD's eight mandates are read by the model every session because
they live in the always-loaded project contract. dev-kit's equivalents are reachable only
by whichever asset happens to load its reference file. That is fine when `/dk:run` drives
the walk and dispatches the right asset — and precisely wrong when an operator runs a step
command by hand, which the entire `dk` command set is explicitly designed to support
(guard 2 of `pipeline-command-guards.sh` exists to keep all 65 commands runnable cold and
out of order).

Rules 1, 2 and 5 are the three most likely to be silently violated in exactly that mode.

**Home.** Template. A Standing Rules section, one line each, each pointing at the asset
that enforces it — not a copy of the rule, a pointer to its owner.

---

## S6 — The story-bank file tree *(FIXED — 2026-07-28)*

**Was.** `US-xxx` allocation existed; the hierarchy did not. Downstream assets parsed
Theme→Pillar when present, but no command, RUNBOOK step, SITEMAP path or template created or
maintained a bank.

**Now.** `specify` is the bank's creator and maintainer — the right owner, since it is already
the only asset that mints `US-xxx`. The bank appears on first run; no bootstrap change was needed.

| Shipped | What |
|---|---|
| `skills/specify/story-bank-index-template.md` | The registry: `**Next US number:**` counter, Theme→Pillar table, a `## Retired IDs` ledger, and the conventions |
| `skills/specify/story-bank-pillar-template.md` | One pillar: intent, core stories, edge-case stories, and an `## Out of scope` section that records *why* something is absent |
| `templates/SITEMAP.md` | `global/requirements/stories/` — `INDEX.md` + `<theme>/<pillar>.md`, project lifetime |
| `skills/specify/SKILL.md` | Step 3 rewritten; new step 4 places stories into the bank |

**The fix that mattered most was not the templates.** `specify` allocated IDs by globbing every
`spec.md` and taking the highest `US-\d+` found. That makes the high-water mark a property of the
*surviving* specs — so archiving, deleting or moving a spec silently lowers it, and the next run
re-issues a retired ID, breaking every roadmap row, plan and review already pointing at it. The
skill's own rule that "IDs are never renumbered or reused" was unenforceable by its own algorithm.
INDEX.md is now the authority and only moves forward; the spec scan survives solely to bootstrap
the counter once, in a repo that already has specs, and the skill must say when it did that.

**A pillar is a vertical slice, not a layer.** Both the pillar template and step 4 apply
`references/vertical-slice.md`'s test one level up: if you cannot finish *"a user can now ___"*
with the pillar's name, it is a layer and the story belongs elsewhere. Without that, a story bank
becomes a second place to encode `services/`, `models/`, `ui/`.

**Flat projects opt out of the hierarchy, not the counter.** A single-spec project may skip pillar
files and keep INDEX.md as a bare counter — but still allocates from it. Inventing a one-pillar
hierarchy to satisfy the shape is explicitly called out as wrong.

---

## S7 — `docs/state/journal/` in the SITEMAP *(FIXED — 2026-07-28)*

**Was.** `commands/run.md:36` and `references/state-contract.md:19,75` wrote
`docs/state/journal/<NN>-<slug>.md`; `templates/SITEMAP.md` did not list it. The orchestrator was
the one asset breaking the "no asset invents a path" contract it enforces on the other 65.

**Now.** Added to the `state/` tree, carrying its access rule rather than just its name — written
by `/dk:run`, read only when `next:` points into it. That second clause is the part worth having
in the sitemap: a reader who sees a per-phase narrative file and does not know it is deliberately
never read on a normal resume will treat it as context to load, which is exactly the cost the
three-tier state design exists to avoid.

---

## S8 — The calibration tier *(FIXED — 2026-07-28)*

**Was.** `/dk:discover:map` and `/dk:discover:research` passed "the calibration tier" to
`assumptions-analyzer` and every `advisor-researcher`. Nothing set it, and it could not become a
`.dk-state` key — that key set is closed by contract.

**Now.** A **Discovery Calibration** section in `templates/CLAUDE.md.template`, declaring
`standard` by default and documenting all three tiers with the situation each suits.

**Why CLAUDE.md and not a state file.** Two constraints ruled out the alternatives, and both are
guards, not preferences:

- `pipeline-command-guards.sh` guard 2 forbids any step command from naming `.dk-state`,
  `docs/state/STATE.md` or `docs/state/journal` — the invariant that keeps all 65 runnable cold.
- Guard 1 forbids any step command from naming a `docs/(global|milestones|state)/…` path at all,
  which rules out `docs/state/config.json` too.

CLAUDE.md is loaded every session, is not a state file, and already carries the **Review Tier
Default** as precedent for an operator-set pipeline knob. The tier is a judgment call about how
deep discovery should go — it belongs where the operator can see it.

**Defaults closed at both ends.** `assumptions-analyzer` and `advisor-researcher` now specify:
absent or unrecognised tier → `standard`, never stall, never invent a fourth output shape. Prior
to this the agents documented three tiers and no default, so an unset tier was undefined behaviour
in the consumer as well as unset in the producer.

---

## S9 — No scaffolding surface

**Evidence.** `find . -name "bootstrap*"` returns only `plugins/dk/commands/bootstrap/` —
five markdown dispatchers. `scripts/` contains 23 files, all `#!/usr/bin/env bash`
regression guards; there is no build, install, bootstrap, or CI script anywhere.

| Missing | ADD-SDD counterpart |
|---|---|
| An **adopt path** — retrofit the pipeline onto an existing repo | `adopt-project-add.sh` (238 lines): injects the framework, detects a legacy monolithic contract, scaffolds the story bank, flags a flat `USER_STORIES.md` for migration, queues mandatory follow-ups. dev-kit's `/dk:bootstrap:legacy` recovers *documentation* — it does not retrofit the framework |
| A **compliance audit** — is this project still conformant? | `audit-project-add.sh` (224 lines): brain-file presence, SDD/PRD current vs outdated vs missing by mtime-vs-last-commit, **a CLAUDE.md line budget**, and — most relevant here — **every sitemap/doc pointer must resolve or is reported DANGLING** (which is exactly the class of defect S7 is) |
| Lint / TS baseline | `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `eslint.config.js` (flat config, typescript-eslint + react-hooks) |
| Doc templates for incoming artifacts | `PRD` / `RFC` / `FUNCTIONAL_SPEC` / `SDD` / `ADR` templates. dev-kit ships a different, spec-first set and retires PRD deliberately — but `SDD.template.md` and `ADR.template.md` have no dev-kit equivalent even though `/dk:arch:design` produces both |

`/dk:bootstrap:init` copies four templates and three doc tiers and never overwrites. It
is a prompt, not an installer.

**Why it matters.** Low for greenfield, where `/dk:bootstrap:init` is enough. Real for
adoption — dev-kit's only entry into an existing repo is documentation recovery, with no
path for "this repo already has code and I want the pipeline on it." And the absent
compliance audit is what would have caught S7 mechanically.

**Home.** Agent/Skill/Command — explicitly **not** Workflow: adoption needs live operator
Q&A, and Workflow runs have no mid-run interactivity.

---

## S10 — No write-side injection guard

**Evidence.** `plugins/dk/hooks/hooks.json` registers `dk-post-read-scan.js` on
PostToolUse(`Read`). There is no PreToolUse(`Write|Edit`) scanner.

**Why it matters.** dev-kit's Read scanner is the stronger of the two systems' — five
pattern classes including `summarisation-persistence` ("the class that matters most here,
and the reason this hook exists"), a considered first-party exclusion list, severity by
distinct-class count. But it only covers content arriving *from* disk. Content the model
*authors* while already operating on poisoned context is never scanned before it lands,
and once written it is a first-party asset path, which the Read scanner's exclusion list
skips on the way back in.

ADD-SDD covers both directions (`gsd-prompt-guard.js` on PreToolUse Write/Edit,
advisory-only, scoped to its planning directory).

**Home.** Hooks. `dk-pre-write-scan.js`, advisory, reusing `dk-post-read-scan.js`'s
pattern classes and honoring CONTRACTS.md invariant 2 ("never block").

---

## S11 — Two orchestration loops are still prose, not Workflow scripts

**Evidence.** `plugins/dev-kit-core/references/workflows/` contains three scripts:
`bugfix-wave.workflow.mjs`, `plan-review.workflow.mjs`, `sprint-execution.workflow.mjs`.

Two loops that fit the Workflow model exactly are still prose instructions to the main
agent:

1. **The ≤6-round adversarial review↔fix loop.** `commands/review/loop.md` describes it in
   prose; `code-review-gate` is correctly a single-round leaf.
   `docs/workflow-recommendations.md` row 7 records that this needs a **new** Workflow
   file, not an edit to an existing one. Textbook loop-until-dry with a hard count cap.
2. **The independent-review dispatch/retry loop.** `references/independent-review.md`
   defines the engine registry and fallback chains
   (plan-gate → gemini→codex→claude; adversarial → codex→gemini→claude), but the retry
   control around it is prose. Row 22, still open.

**Why it matters.** Both are exactly what deterministic control flow is for. Left in
prose they depend on the main agent counting correctly — and in the review loop's case,
the count is a hard safety cap ("never open a 7th round"). The `round:` state key
mitigates this, but the loop body still isn't scripted.

Recorded constraints for whoever writes these: scripts cannot touch git or the filesystem
(merges, cleanup and state stay in the orchestrator's turn); no mid-run interactivity, so
an operator checkpoint cannot live inside a script; `node --check` is the wrong validator
for these files.

**Home.** Workflow.

---

## S12 — Commit-message convention *(FIXED — 2026-07-28)*

**Now.** `hooks/dk-post-commit-convention.sh`, registered PostToolUse(`Bash`), with 14 tests.

**Deliberately advisory, not blocking — and that is a real divergence from ADD-SDD.** Its
`gsd-validate-commit.sh` is a PreToolUse hook that returns a block decision, and is the only
blocking hook in either system. dev-kit's `hooks/CONTRACTS.md` invariant 2 says no hook in that
directory blocks a tool call, because "a hook that breaks a session is worse than a hook that does
nothing." A malformed commit subject does not clear that bar: nothing has been pushed, and
`--amend` is free. Blocking would also need an exemption for merges, reverts, fixups and amends —
and every exemption missed is a wedged session.

So it fires *after* the commit and points at `git commit --amend`.

**Why it is worth having at all**, given the message is only a string: `document-release` and
`ship` build CHANGELOG entries from commit history and `retro` mines it for trends. A subject none
of them parse does not error — it drops that commit out of the changelog and the retrospective
silently.

**Implementation notes worth keeping:**

- It reads the subject from `git log -1`, not from the command string. The command may quote the
  message several ways, use `-F` or a heredoc, or be one segment of a compound line; HEAD is
  unambiguous.
- `Merge`/`Revert`/`fixup!`/`squash!` subjects are exempt — git generates them.
- `--amend` invocations are skipped, since amending is usually the fix for this very warning.
- Warnings dedupe per commit SHA via `dk_once`, so a failed-then-retried commit, or any later Bash
  call in the same turn re-reading the same HEAD, cannot repeat the nudge.

**One guard caught a mistake during the build:** `hook-guards.sh` check 3 greps hook sources for a
blocking exit code and flagged the *comment* in which I described ADD-SDD's blocking design. The
guard is right to be conservative — a false negative there deadlocks sessions — so the comment was
reworded rather than the guard weakened.

---

## S13 — `.dk-state`'s commit status is unspecified

**Evidence.** `plugins/dk/templates/gitignore` (14 lines) ignores `docs/state/tmp/`,
`.claude/settings.local.json`, `.claude/dk-wiki-pending`, and OS/editor noise.
`.dk-state` is not listed — and not documented as intentionally committed either.

**Why it matters.** Ambiguous by omission. If committed, every operator's position
pointer collides on merge. If ignored, it should say so, as the wiki queue explicitly
does. `references/state-contract.md` covers the schema and the writer but not the
lifecycle.

**Home.** Template — decide and record it either way.

---

## S14 — Statusline path resolution is unverified

**Evidence.** `plugins/dk/hooks/CONTRACTS.md:197-199` flags it in its own text: whether a
`statusLine` command resolves a project-relative path "has not been confirmed against a
live session."

`plugins/dk/templates/settings.json` sets
`statusLine.command = "node .claude/hooks/dk-context.js --statusline"`, and
`/dk:bootstrap:init` copies `dk-context.js` + `lib/dk-common.js` into `.claude/hooks/`
specifically to make that path stable.

**Why it matters.** If it doesn't resolve, the statusline is silently absent — and so is
the bridge file `dk-context.js --statusline` writes, which is the **highest-quality
evidence tier** the `--monitor` hook uses for context readings. Monitoring degrades to the
transcript-only tier (thresholds 40/30 instead of 35/25) without any signal that it did.

The honest self-flag is good practice; it just needs closing.

**Home.** Hooks — one live-session check.

---

## S15 — No discrete step applies the scope gate's outcome

**Evidence.** ADD-SDD has step 3, "update requirements — apply CEO outcomes," as its own
numbered step. dev-kit folds this into `spec-review-cpo`'s own output (the locked Scope
Decision Record + descope to `BACKLOG.md`); no `/dk:requirements:*` command applies it.

**Why it matters.** Minor. The work happens inside the gate. It is listed because the
gate's job is to *rule*, and applying a ruling to the spec is a different action with a
different failure mode — a REVISE verdict that is acknowledged but not actually written
back leaves the spec and the decision record disagreeing, with nothing checking.

**Home.** Command, if the failure is ever observed. Low priority.

---

## S16 — No git `pre-commit` graph refresh

**Evidence.** dev-kit refreshes the graph at `/dk:bootstrap:baseline`,
`/dk:discover:graph-update`, and via the `dk-post-merge-graphify.sh` nudge. ADD-SDD
additionally writes a `.git/hooks/pre-commit` running `graphify update . --quiet` on
every commit.

**Why it matters.** Minor, and partly by design — running graphify inside a worktree is
correctly forbidden (all tracks resolve to the same output dir and race), which is why
post-merge is the right pipeline trigger. The residual gap is commits made *outside* the
pipeline (an operator's own commit, or an external CLI's), after which the graph is stale
and `dk-pre-search-graph-hint.sh` will still point at it as authoritative.

**Home.** Hooks or `/dk:bootstrap:init`. Low priority; note the worktree hazard in
whatever ships.

---

## S17 — Shipped docs are stale *(FIXED — 2026-07-28, by deletion)*

**Was.** `docs/workflow-recommendations.md` and `docs/gwd-pipeline-on-devkit.md` both asserted
dev-kit ships no hooks layer, no orchestrator and no Workflow scripts — all three of which the `dk`
plugin had since crossed. `workflow-recommendations.md` additionally carried its own instruction:
*"not shipped, delete when the pipeline is built."*

**Now.** Deleted, along with the historical `docs/audits/kickoff-duplication-audit/` and
`docs/superpowers/specs/2026-07-26-devkit-pipeline-step0-design.md` — 12 files. These were
build-time design-rationale artifacts, and the pipeline they were reasoning about is built. A stale
doc that describes the repo as it is not is worse than no doc: it is the first thing a contributor
reads and the last thing anyone thinks to update.

**Two references had to move with them**, or the deletion would have left the repo broken:

- `scripts/checks/prd-retirement-guards.sh` **check 6** hard-required `gwd-pipeline-on-devkit.md`
  to exist and grepped it for four PRD-retirement assertions. Removed, with a comment recording why
  and where those assertions still live — the sitemap Retired-paths rows (check 1) and the
  `specify` / `gate-reverse-engineer` / `doc-synthesizer` / `doc-classifier` assets (checks 2–5),
  which is where the retirement is actually load-bearing. Deleting a doc silently turns a guard red
  in a way that looks like an unrelated regression.
- `docs/catalog/core-discovery-and-design.md:27` linked to it for rationale. Clause dropped.

**What was deliberately kept:** the `scripts/checks/*.sh` header comments citing
`docs/audits/kickoff-duplication-audit/` as their provenance. Those are prose attributions, not
reads — no guard opens the directory (verified) — and rewriting 20 headers to erase the origin of
the defects they pin would cost more than the dangling reference does.

---

## S18 — `SCHEMAS.md` is canonical, read by a gate, and never authored

**Evidence.** `agents/gate-plan-review.md` step 1: *"Read `docs/global/process/SCHEMAS.md` for the
`review-summary.json` shape and the HIGH / MEDIUM / LOW classification."* That path is canonical in
`plugins/dk/templates/SITEMAP.md:51-52` (`process/ → SCHEMAS.md — pipeline data contracts`) and is a
migration target at `:139`.

`find . -name "SCHEMAS.md"` returns **nothing**. No template ships its content, and
`/dk:bootstrap:init` does not author it.

**Why it matters.** The plan gate is instructed to read a data contract that does not exist, then to
emit a `review-summary.json` conforming to it. In practice the agent invents the shape per run,
which is exactly the drift a schema file prevents — and the same JSON is consumed downstream by
`/dk:plan:gate`'s pass/fail read and by `code-review-gate`'s `findings.json` sibling contract.

ADD-SDD ships a 245-line `SCHEMAS.md` covering precisely this surface: a P0–P4 severity ladder with
required actions, and the shapes for `gemini-summary.json`, `findings.json`, `fixes.json`,
`authoring-report.json`, `track-metrics.json`, `calibration-proposal.json` and
`complexity-calibration.json`.

**Found while fixing S1** — the scorer's JSON output is one of the objects this missing file should
be specifying.

**Home.** Template. Ship it as `plugins/dk/templates/` content and have `/dk:bootstrap:init` write
it alongside the SITEMAP.

---

## S19 — Three of the repo's own regression guards fail at `HEAD`

**Evidence.** Running all 22 checks in `scripts/checks/` against a clean worktree of `HEAD`:

| Guard | Failure |
|---|---|
| `prd-retirement-guards.sh` | `plugins/dk/hooks/CONTRACTS.md:112` and two hook tests name `docs/global/requirements/PRD.md` without marking it retired |
| `review-track-guards.sh` | no *"default … when none are named"* sentence found in `plugins/dev-kit-core/commands/plan-review.md` |
| `orphan-asset-guards.sh` | 14 `dk` command files reported as orphaned companion assets |

**Why it matters.** These 23 scripts are the mechanism that pins previously-fixed defects. Three
being red means the suite cannot be used as a gate — a contributor who runs it sees failures either
way and learns to ignore it, which is how a regression suite dies.

The first two look like genuine drift. The third is likely a **false positive**: `dk` step commands
are dispatched by `RUNBOOK.md` and `/dk:run`, not "referenced" by another asset, so the guard's
reachability heuristic doesn't model them. If so, the guard needs to exempt `plugins/dk/commands/**`
— but that is a judgment call about the guard, not a defect in the commands, and it should be made
deliberately rather than by leaving the check red.

**Not caused by the S1 fix** — verified by running the same three guards against a worktree of
`HEAD` before any of this session's changes.

**Home.** Repo hygiene. Either fix the drift or amend the guards; do not leave them failing.

---

## Appendix — what changed since the 2026-07-21 revision

The prior version of this file concluded: *"devkit deliberately stops at the skill/agent
layer — no hooks runtime, no `bin/` scripts, no state-file contract, no
project-scaffolding layer,"* and tallied 10 of 19 capabilities as belonging to a
"not-yet-built orchestration pipeline."

Since then the `dk` plugin landed: a 16-stage RUNBOOK, 65 step commands + 3 orchestrator
commands, a four-class gate system in frontmatter, a three-tier state contract with a
closed key set, seven tested hooks with a written contract, five templates including a
canonical doc-path sitemap, and six command-purity guards. **The orchestration pipeline is
built**, which is why this file is now a shortcomings register rather than a gap inventory.

What survives unchanged from that revision: the scorer, the calibration file and the
telemetry loop are still the executable-tooling residue — now S1, S3, S4 — and the
scaffolding surface is still absent — now S9. Everything else on this list is new,
surfaced by walking the `dk` plugin itself rather than by comparing artifact names.
