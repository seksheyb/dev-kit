# The pipeline — what each stage produces

`dk` walks a milestone through 16 stages, numbered 0–15 in
[`plugins/dk/RUNBOOK.md`](../../plugins/dk/RUNBOOK.md), which is the authority on order,
commands, and conditions. This guide restates it from a different angle: not "what
command do I type" but "what do I get for it, and why does that matter to the business."

Three parts: **Part A** (stages 0–4) runs once per milestone. **Part B** (stages 5–11) is
the per-phase loop, repeated once for every phase the roadmap produced. **Part C**
(stages 12–15) closes the milestone. Every artifact path below follows the canonical tree
in [`docs/SITEMAP.md`](../SITEMAP.md); no command in the corpus invents a path outside it.

## The three gate classes

Every conditional step in the pipeline is one of three kinds, declared in each command's
own frontmatter, so the runbook's prose and the orchestrator's logic both derive from the
same fact instead of drifting apart:

| Class | Declared as | What decides it | Example |
|---|---|---|---|
| **A — repo predicate** | `gate: auto` + `precondition:` | The state of the repo itself | "no design system exists yet" |
| **B — prior verdict** | `gate: verdict` + `on:` | What the previous command returned | "verify came back `gaps_found`" |
| **C — operator judgment** | `gate: operator` + `asks:` | A human call, not derivable from either | "is a product-direction call genuinely open?" |

`/dk:run --auto` resolves Class A and B on its own and stops only at Class C. `/dk:run
--sleep` resolves Class C from `.claude/dk-policy.yml` when an answer exists, and hard-stops
when it doesn't. `blocking: true` on any of the three means a bad verdict — `REVISE`,
`UNSOUND`, `gate_passed: false`, `human_needed` — halts every mode, sleep included. There
is no mode that walks past a blocking failure; that is the one rule every driving style
shares.

## Part A — once per milestone

### Bootstrap
Commands: `/dk:bootstrap:init`, `/dk:bootstrap:constitution`, `/dk:bootstrap:intake`
*(conditional)*, `/dk:bootstrap:baseline` *(conditional)*.

In: a product idea, or an existing repo to adopt (`--here`). Out: `docs/global/project/PROJECT.md`
(identity, goals, decisions), `docs/global/project/constitution.md` (versioned governing
principles), and — when the repo has undocumented code or stray ADRs/PRDs — a recovered
spec written into the milestone tree plus a security baseline via `cso`.

Business value: this is the only stage that turns "we have an idea" or "we have a
codebase nobody wrote down" into something the rest of the pipeline can actually check
work against. Skipping it means every later gate is grading against nothing.

### Requirements & product framing
Commands: `/dk:requirements:brainstorm`, `/dk:requirements:specify`,
`/dk:requirements:market` *(conditional)*, **the scope gate** —
`/dk:requirements:scope-gate` (**blocking**), `/dk:requirements:premortem` *(conditional)*.

In: a one-line product framing. Out: `docs/milestones/<M>/REQUIREMENTS.md`, an assumption
map, and — when a product-direction call is genuinely open — competitive/market research
under `docs/milestones/<M>/research/`.

Business value: the scope gate is the only product/strategy gate in the whole pipeline.
It stops you building the wrong thing before a line of code exists. A `REVISE` or any
`BLOCKER` verdict here is cheaper than the same finding six stages later.

### Architecture & tech stack
Commands: `/dk:arch:design`, **the architecture gate** — `/dk:arch:gate` (**blocking**),
`/dk:arch:lanes`.

In: the approved spec. Out: `docs/global/architecture/SDD.md` (internal system design) and
ADRs under `docs/global/architecture/adr/`, plus the lane plugins enabled for this stack.

Business value: the architecture gate is the only architecture/technical-strategy gate.
An `UNSOUND` verdict means the technical foundation itself is wrong, and every phase built
on it would inherit that. Catching it here is a design-doc edit; catching it in stage 8
is a rewrite.

### Research & roadmap
Command: `/dk:roadmap:build <M>`. Four project-researchers fan out across stack,
features, architecture, and pitfalls, then a synthesis barrier, then the roadmapper.

Out: `docs/milestones/<M>/ROADMAP.md`, the milestone split into phases.

Business value: turns a single large goal into a sequence of shippable phases, each small
enough to plan, gate, and verify independently. That phase is the unit the rest of the
pipeline operates on.

### Design system
*(Only if this project has UI and no design system exists yet; runs once ever, not per
phase.)* Commands: `/dk:design:system`, `/dk:design:bind` *(conditional)*.

Out: `docs/global/design/DESIGN.md`, the design system source of truth every later UI
phase builds against.

Business value: one design system decision instead of one per phase means every screen
this milestone ships looks like it came from the same product.

## Part B — the per-phase loop (repeats once per phase)

### Discover
Commands: `/dk:discover:graph-update` *(conditional, from phase 2 onward)*,
`/dk:discover:map`, `/dk:discover:research`.

In: the phase's slice of the roadmap. Out: `docs/milestones/<M>/phases/<NN>-<slug>/CONTEXT.md`,
`DISCOVERY.md`, `RESEARCH.md`, `PATTERNS.md` — what the codebase looks like where this
phase lands, what's assumed, and what's already been solved elsewhere.

Business value: a plan written against a codebase nobody actually looked at re-discovers
problems the team already hit last phase. This stage is what makes the plan step informed
instead of guessed.

### Phase specs
*(Only if the phase builds an AI/LLM system needing an eval contract, or ships UI.)*
Command: `/dk:spec:phase`.

Out: `docs/milestones/<M>/specs/<NNN>-<slug>/AI-SPEC.md` and/or
`docs/milestones/<M>/phases/<NN>-<slug>/UI-SPEC.md`.

Business value: an AI feature without an eval contract, or a UI phase without a spec, gets
built once and re-argued about forever afterward. This stage front-loads that argument.

### Plan
Commands: `/dk:plan:write`, `/dk:plan:review`, **the plan gate** — `/dk:plan:gate`
(**blocking**).

Out: `PHASE/<NN>-<MM>-PLAN.md` — the one canonical plan path — reviewed against four lenses
(engineering, design, devex, goal-backward) and passed through the deterministic complexity
scorer before Wave 1 is allowed to start.

Business value: `gate_passed: true` is the point where "this plan looks reasonable to one
person" becomes "this plan survived four adversarial reviews plus a machine check of its
own declared model/effort signals." The most expensive rework this pipeline prevents is
a wave built against a plan nobody actually checked.

### Build
Commands: `/dk:build:waves`, `/dk:build:adhoc` *(conditional)*, `/dk:build:tracks`,
`/dk:build:ui` *(conditional)*.

Out: the phase's code, plus per-track summaries at `PHASE/<NN>-<MM>-SUMMARY.md`.

Business value: this is the only stage that produces working software. Everything before
it de-risks what gets built here; everything after it checks that what got built here is
actually right.

### Debug
*(As needed — any time a step reports a failure.)* Command: `/dk:debug:run <symptom>`.

Out: an entry in `docs/state/debug/knowledge-base.md`, and a fix.

Business value: root-causes a failure instead of patching the symptom, and returns you to
exactly where you were in the pipeline rather than derailing the run.

### Review
Command: `/dk:review:cycle <NN> <branch>` — the adversarial find → triage → sweep loop,
at most 6 rounds, never a 7th.

Out: `PHASE/reviews/round-<R>/findings.md`, `findings.json`, `fixes.json`, and — folded in
when this phase shipped UI — `UI-REVIEW.md`.

Business value: converts "a reviewer looked at the diff" into "code-review-gate,
security-auditor, verifier, qa, and (for UI phases) ui-auditor all looked, and every
finding they raised got triaged and either fixed or explicitly accepted." A closing round
that carries only advisory findings stops and asks a human whether to sweep them or accept
them; it never silently drops or silently fixes low-priority noise on its own judgment.

### Verify
Command: `/dk:verify:phase <NN>` — the authoritative goal check (distinct from the review
loop's early-warning pass), plus convergence, plus the eval audit and integration check
where applicable.

Out: `PHASE/VERIFICATION.md`, and — when gaps remain — appended convergence tasks or an
escalation after two remediation cycles.

Business value: this is the stage that converts "the tasks in the plan are marked done"
into "the goal the phase was written to achieve is actually met, with evidence." A
`passed` from step 10's finder-stage verifier is provisional; this is the one that counts.
`human_needed` is never treated as a pass: it is blocking, and `/dk:verify:human` hands
back the exact list a person has to look at.

## Part C — close the milestone

### Final gates
Command: `/dk:final:gate <URL>` (**always runs, blocking**) — the security fan-out runs
beside conditional lanes: UI *(if the milestone shipped UI)*, devex *(if it shipped an
API/CLI/SDK)*, compliance *(if regulated data is in scope)*, pentest *(only with written
authorization)*.

Out: `PHASE/reviews/SECURITY.md` per phase and the milestone-level gate verdict.

Business value: the milestone-wide gate. Open security threats block the ship regardless
of how clean every phase-level review already looked. This is deliberately the one place
that re-checks everything at once, not per phase, because a set of individually-safe
phases can still combine into an unsafe milestone.

### Ship
Commands: `/dk:ship:safety`, `/dk:ship:deploy-setup` *(conditional)*, `/dk:ship:infra`
*(conditional)*, then exactly one of `/dk:ship:pr` (manual) or `/dk:ship:auto` (automated).

Out: an open pull request. Stops at the PR; it does not merge yet.

Business value: separates "the code is ready to ship" from "the code is merged and
deployed," so the doc stage below can document the milestone against the real diff before
it lands.

### Docs
Commands: `/dk:docs:sync`, `/dk:docs:api` *(conditional)*, `/dk:docs:release`,
`/dk:docs:verify`, then `/dk:docs:land` (automated path) or `/dk:docs:merge` (manual path).

Out: `CHANGELOG.md`, the version file, API docs, release notes, and the merged, deployed
PR.

Business value: the milestone's public-facing story — what shipped and why — gets written
and verified while the PR is still open, not reconstructed from memory after the fact.

### Close / operate
Commands: `/dk:close:health`, `/dk:close:operate`, `/dk:close:retro`,
`/dk:close:product-loop` *(conditional)*, `/dk:close:incident` *(conditional)*,
`/dk:close:followups` *(conditional)*, finally `/dk:close:milestone <M>`.

Out: `docs/state/baselines/health-history.jsonl`, `docs/milestones/<M>/RETROSPECTIVE.md`,
and the milestone pointer moved forward.

Business value: closes the loop from "we shipped it" to "we know whether it's healthy in
production and what we'd do differently," and only moves the milestone pointer once
nothing is actively on fire.

## Cost & model economics

Every dispatch in this pipeline is routed by the model router described in
[`docs/guide/architecture.md`](architecture.md) and specified in full in
[`references/model-routing.md`](../../plugins/dev-kit-core/references/model-routing.md):
mechanical, cheaply-verified work (a classification label, a claim check against the
repo, a formula over other tools' output) is routed to a cheap tier, while judgment and
gate-feeding work — anything that can block a phase, milestone, or ship — stays on the
strong tier by default. A fixed pin list (`code-review-gate`, `security-auditor`,
`verifier`, `plan-reviewer`, and others that feed a blocking gate) cannot be silently
downgraded off that tier by a lazily-written dispatch, regardless of what a cost-driven
change elsewhere in the corpus might otherwise compute. The result is that the pipeline's
expensive reasoning is spent where a wrong answer is expensive to catch, and its cheap
reasoning is spent where a wrong answer is cheap to catch and cheap to re-run.
