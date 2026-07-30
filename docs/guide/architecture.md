# Architecture — how dev-kit fits together

This is the technical map of the corpus: the four asset types, model routing, parallel
execution, plan review, and state. Read [`docs/guide/pipeline.md`](pipeline.md) first for
what the pipeline produces; this doc is how it produces it.

## 1. The four asset types

- **Skills carry all methodology and knowledge**, injected in-session into whatever agent
  is running. One canonical home per capability — a skill is never restated in two places.
- **Agents are thin isolation wrappers** — identity, tool grants, an output contract —
  used only where fresh context, a distinct model/effort, or parallel fan-out is actually
  needed. Agents *reference* skills, never restate them; model is set at dispatch time,
  not baked into the agent's own prose.
- **Commands are logic-free stubs** dispatching an agent or skill for manual, one-off use.
  If a command body needs more than a dozen lines, that's a defect in the underlying
  asset, not a reason to grow the command — `scripts/checks/pipeline-command-guards.sh`
  enforces a 12-line ceiling on every step command's body.
- **`dk` is the cross-session sequencer** — the orchestration layer that walks the 16
  stages, survives a `/clear`, and governs manual/auto/sleep driving modes. It is
  additive, never load-bearing: every one of its 55 commands runs standalone, cold, out of
  order, with no state files present. Only `/dk:run` and `/dk:status` are permitted to read
  pipeline state at all.

## 2. Model routing

One abstract router — not each dispatch site improvising — decides `{model, effort}`
before every agent dispatch, on every surface. The full contract lives in
[`references/model-routing.md`](../../plugins/dev-kit-core/references/model-routing.md);
this section is the ~30-line version.

**The two-stage split:** the dispatching LLM declares *signals* about the work (novelty,
logic depth, ambiguity, verifiability, breadth): a judgment call. `model-route.mjs` then
converts that descriptor into a decision: a deterministic table lookup. The same
descriptor always produces the same `{model, effort, effortParam}`; judgment and
arithmetic never happen in the same step, and the arithmetic never second-guesses the
judgment's inputs.

**Three surfaces** call the same router:
- **Inline `Agent`** (exactly 1 unit) — `--caller <asset>`, feeding the descriptor on
  stdin; `effortParam` is always `null` here, so the matching effort prompt block gets
  injected into the agent's prompt text instead.
- **`Workflow` `args.routing`** (2+ units) — one descriptor per agent *role*, batched
  through `--batch`, forwarded as `args.routing = { agentKey: { model, effort } }`.
- **Plan-declared columns** — `sprint-execution`/`bugfix-wave` tracks carry `Model`/
  `Effort` columns the planner declared up front; `gate-plan-review` verifies those against
  the deterministic scorer rather than calling the router fresh.

**No agent has a model pin — every agent, gate-feeding or not, is scored from its
dispatch descriptor's real signals.** `plugins/dk/bin/complexity.config.json`'s `agents`
block carries no `model` entry for any agent, and no agent-definition frontmatter does
either. What a fixed **never-downgrade list** — `code-review-gate`, `security-auditor`,
`penetration-tester`, `compliance-auditor`, `gate-automation`, `gate-plan-review`,
`gate-reverse-engineer`, `ui-checker`, `verifier`, `integration-checker`,
`nyquist-auditor`, `design-reviewer`, `ui-auditor`, `eval-auditor`, and `plan-reviewer` —
does keep is an `effortFloor: high` entry: each feeds a gate that can block a phase,
milestone, or ship, so their effort axis cannot be scored down even when a descriptor's
capability signals legitimately land low. See `references/agent-model-tiers.md` for why
the model-axis pin these agents once carried was removed.

**The effort ladder is five levels**: `low` (execute literally), `medium` (ordinary
professional judgment), `high` (surface edge cases, prefer correct over fast), `xhigh`
(reason adversarially against your own conclusion), `max` (treat every claim, including
your own, as unproven until verified). Whichever level the router computes, effort is
never quietly lowered to fit a cheaper model's supported range. If a model can't express
the computed effort as a real parameter, the router either rides it as injected prompt
text or bumps the model up, never down.

**The audit log**: every decision returns `{model, effort, effortParam, capability, risk,
reasons}`, so any caller (or a human skimming a workflow's return value) can see which
signals, floors, or pins drove the final numbers without re-deriving them.

## 3. Parallel execution

Work fans out in **waves** built from **tracks**: a wave is a barrier, a track is one
independently-dispatchable unit of work inside it. Every fan-out of 2 or more units routes
through a `Workflow` script (`*.workflow.mjs`); exactly 1 unit is a plain inline `Agent`
call, because a `Workflow` for one agent is pure overhead. There is no "Workflow
unavailable, fall back to N inline calls" branch anywhere in the corpus: if a multi-unit
fan-out can't run through `Workflow`, it doesn't run degraded, it doesn't run.

**Worktree isolation is opt-in, not default.** `isolation: 'worktree'` costs real time and
disk per agent, and is reserved for the one case that actually needs it: fanned-out
members that commit **concurrently** to git and would otherwise race on the same ref or
files. Of the 25 workflow scripts in the corpus, only `sprint-execution` and `bugfix-wave`
set it — both because their tracks commit to their own branches, and in `bugfix-wave`'s
case, merge themselves back into the source branch. Every read-only or single-writer
script (`plan-review`, `discovery-map`, `review-finders`, `doc-verify`, and 19 others)
runs in the shared tree.

**The 2+/exactly-1 routing convention** is the same rule model routing's Surface A/B split
follows — unit count decides the dispatch mechanism, not a per-caller judgment call. The
one documented exception is `e2e-split`, which routes on automation *surfaces spanned*
(Playwright, Maestro) rather than unit count.

## 4. Lens-based plan review and co-location

**Lens-based plan review** is one `plan-reviewer` agent plus four lens skills
(`plan-review-eng`, `-design`, `-devex`, `-goal-backward`), dispatched N× in
parallel with one lens each. A stable agent prompt gives cache hits across the fan-out;
adding a fifth lens is a new skill file, not a new agent.

**Co-location guarantees** keep cross-referencing assets in the same plugin, so a change
to one side of a pairing can't silently drift from the other: `plan-reviewer` ships beside
its lens skills, each `dev-kit-core` command ships beside the agent it dispatches,
`writing-plans` ships beside `sprint-execution`, `gate-reverse-engineer` ships beside
`spec-miner`, and the planning references the `planner` agent reads live beside it under
`plugins/dev-kit-core/references/planning/`.

## 5. State & resumability

`/dk:run` writes three tiers, split by **how often each is read** — not by topic, because
putting them in one file makes the cheap read expensive:

| Tier | Where | Read frequency |
|---|---|---|
| Next action, loop position | `.dk-state` | Every resume |
| Progress across stages | `docs/state/STATE.md` | Stage/phase boundaries |
| Wave, gate, and round history | `docs/state/journal/<NN>-<slug>.md` | On demand only |

`.dk-state` is a **slim marker, not a journal**: a closed key set, at most 15 lines,
overwritten every step and never appended to. Its `next:` line is a pointer, not a
payload: one imperative sentence for the next action, naming a journal file when history
is actually needed rather than inlining it. On resume, the orchestrator acts on `next:`
directly instead of re-deriving position by walking `RUNBOOK.md` from scratch. Re-deriving
a mid-loop position like "round 3 of 6" from a linear spine is exactly where a resume goes
wrong. Full schema in
[`plugins/dk/references/state-contract.md`](../../plugins/dk/references/state-contract.md).
Driving the pipeline by hand writes none of these three files; `/dk:status` reports their
absence as normal, not as an error, and points back to `/dk:runbook`.

## 6. Quality machinery

- **The adversarial review loop** (`/dk:review:cycle`) runs at most 6 rounds, never a
  7th: freeze the head, fan out that round's finder lenses, triage into one deduped set,
  one fix sweep. Finders are read-only and the sweep is the only writer, which is what
  lets several lenses share a round safely. A lens that comes back clean sits the next
  round out, but the loop only closes on a full-roster round that comes back completely
  clean, so a narrowed clean round buys one more full round rather than an automatic exit.
- **The deterministic complexity scorer** (`complexity-score.mjs`) is the plan-gate
  adapter over the same routing engine described in §2: it verifies a plan's *declared*
  `Model`/`Effort` signals against what the scorer would compute fresh, rather than trusting
  the plan's self-report, before `gate-plan-review` will pass the plan gate.
- **Guard scripts** under `scripts/checks/` (21 scripts) enforce the structural rules this
  corpus depends on but can't rely on any individual asset to remember: which commands may
  read pipeline state (`pipeline-command-guards.sh`), that a review round's frozen SHA is
  respected (`review-track-guards.sh`), that a worktree merge can't race another
  (`worktree-merge-safety-guards.sh`), and more. A guard failure is a CI-blocking signal
  that a structural invariant broke, not a style nitpick.
