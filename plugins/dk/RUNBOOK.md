# RUNBOOK: idea → shipped milestone, stage by stage

The ordered stage list for a dev-kit milestone. Every prompt lives in its own `dk` command; this
file carries only what no single command can know — **order, conditions, gates, session boundaries,
and loop structure.**

Read it yourself and type the commands (manual), or let `/dk:run` walk it for you. Same file either
way: you read the prose, the orchestrator reads each command's `gate:` frontmatter.

## What this file may contain

A step entry here may carry **only** the six things no asset can ever know. Everything else —
methodology, output templates, severity ladders, git recipes, path strings, input-file lists,
purpose paraphrases — is asset content and belongs in the skill/agent/command, not here.

1. **Which asset to invoke** — one line: "Use the `<name>` skill/agent."
2. **Identifiers** — `<M>`, `<NN>`, `<MM>`, `<branch>`, round `n`. Ids only, never paths; assets
   derive every path from the sitemap contract plus the ids.
3. **Mode selection** among modes the asset genuinely offers.
4. **Operator-judgment gates** — *(only if this phase shipped UI)*, "tell me before you let it do
   that", "run it even when verify came back `passed`".
5. **Cross-step ordering, parallelism, and session boundaries** — what fans out safely, what sits
   inside a loop, where `context-save` → `/clear` → `context-restore` falls.
6. **Scope narrowing the asset cannot know** — "this milestone's delta, not the whole surface".

If a command body needs more than ~5 lines, that is a defect in an asset, and the fix goes in the
asset. Enforced by `scripts/checks/pipeline-command-guards.sh`.

**Three parts.** Part A runs **once per milestone** (steps 0–4). Part B is the **per-phase loop**
(steps 5–11), repeated for every phase the roadmap produced. Part C **closes the milestone**
(steps 12–15). Steps marked *(only if …)* are conditional. **Session boundary** means:
`context-save`, then `/clear` — and the next step opens with `context-restore`.

Driving by hand, and under `--manual` / `--auto`, a boundary is a **stop**. Under `--sleep` it is
not: state is written and the run continues through it on automatic compaction, because parking at
every boundary — a milestone has several — would end the unattended run before it got anywhere.

## The three gate classes

Every conditional below is one of three kinds. This is what `/dk:run` acts on.

| Class | Frontmatter | Manual | Auto | Sleep |
|---|---|---|---|---|
| **A** — decidable from the repo | `gate: auto` + `precondition:` | you decide | predicate decides | predicate decides |
| **B** — decided by the previous verdict | `gate: verdict` + `on:` | you decide | routes on verdict | routes on verdict |
| **C** — operator judgment | `gate: operator` + `asks:` | you decide | **stops, asks you** | policy answers, or hard stop |
| — unconditional | `gate: always` | you run it | runs | runs |

`blocking: true` means a bad verdict stops the pipeline — no mode may advance past it.

---

# Part A — once per milestone

## 0. Bootstrap
`/dk:bootstrap:init myProject` — or `--here` to adopt an existing repo. Then start a session in it.
Only `dev-kit-core` is on; step 2 enables the stack lanes.

`/dk:bootstrap:constitution <M>`

*(only if the repo has undocumented existing code)* — `/dk:bootstrap:legacy`

*(only if the repo has ADRs/PRDs/specs outside the canonical locations)* — `/dk:bootstrap:ingest-docs`

*(only if there is anything to index — the doc corpus above, or existing code)* — `/dk:bootstrap:baseline`

**Session boundary.**

## 1. Requirements & product framing
`/dk:requirements:brainstorm <product, one line>` · `/dk:requirements:specify`

*(only if a product-direction, sizing, or competitive call is genuinely open)* —
`/dk:requirements:market <M>`, dispatched alongside `specify`'s assumption-mapping run: different
files, no ordering.

**The scope gate** — `/dk:requirements:scope-gate`. **Blocking.**

*(only if this spec is unusually high-stakes)* — `/dk:requirements:premortem`

## 2. Architecture & tech stack
`/dk:arch:design`

**The architecture gate** — `/dk:arch:gate`. **Blocking.**

`/dk:arch:lanes`

**Session boundary.**

## 3. Research & roadmap
`/dk:roadmap:build <M>` — four project-researchers fan out, then synthesis, then the roadmapper.

**Session boundary.**

## 4. Design system — *(only if this project has UI and no design system exists yet)*
Runs **once ever**, not per phase.

`/dk:design:system <product>`

*(only if it stopped at a system-creation prompt — once you have the id it asked you for)* —
`/dk:design:bind <uuid>`

**Session boundary.**

---

# Part B — the per-phase loop, once per phase in the roadmap

## 5. Phase discovery
*(only if this milestone has shipped code — i.e. from phase 2 onward on a greenfield project)* —
`/dk:discover:graph-update`, before anything in this step or step 7 queries the repo graph.

Two waves, not four serial dispatches.

`/dk:discover:map <NN>` — six agents fan out safely: the four mappers, the assumptions-analyzer,
and the phase-researcher, which joins this wave because its research is external to the map the
mappers are rewriting.

`/dk:discover:research <NN>` — the advisors and the pattern-mapper fan out together. Both consume
wave 1's research, which is what puts them in the second wave rather than the first.

## 6. Phase specs — *(conditional)*
*(only if this phase builds an AI/LLM system needing an eval contract)* — `/dk:spec:ai <M> <NN> <NNN>`

*(only if this phase has UI work)* — `/dk:spec:ui <M> <NN>`

*(if this phase has both, run the two chains concurrently — they share no files. Each chain is
internally sequential.)*

## 7. Plan the phase
`/dk:plan:write <NN>` · `/dk:plan:review` — fix what it flags; it does **not** run the gate.

`/dk:plan:gate <NN>` — **blocking.** Wave 1 does not start until `gate_passed: true`.

**Session boundary.**

## 8. Build it
`/dk:build:waves <NN> <MM>`

*(only if you have 2+ independent tasks outside this plan — no written plan, no triaged bug list)*
— `/dk:build:adhoc`

`/dk:build:tracks`

*(only if this phase ships UI)* — `/dk:build:ui`, opened alongside wave 1's non-UI tracks rather
than ahead of them; only the UI tracks wait on its handoff.

## 9. Debug — *(as needed)*
`/dk:debug:run <symptom>` — any time a step reports a failure. Returns you to where you were.

## 10. Adversarial review ↔ fix loop (≤6 rounds)
A round is four stages — freeze, fan out every finder, triage into one deduped set, one fix sweep.
The finders are all read-only and the sweep is the only writer, which is what lets them share a
round. `code-review-protocol` part 3 owns the stage shape.

**Before the first round** — `/dk:review:qa`. It settles the test framework, and settling one is a
write, so it cannot happen inside a round.

*(only if this phase shipped UI)* — `/dk:review:ui <NN>` adds its lens to that finder stage.

`/dk:review:loop <NN> <branch>` — never opens a 7th round.

*(only if you want a one-shot look at the current diff, outside the loop)* — `/dk:review:once`.
It runs code-review-gate in single mode, so it is never a substitute for round 1.

## 11. Verify the goal
`/dk:verify:goal <NN>` — the authoritative run; step 10's finder stage ran a verifier only as early
warning, against the pre-sweep tree.

*(only if this phase built an AI/LLM system with an eval contract from step 6)* — `/dk:verify:eval
<NN>`, dispatched **alongside** the goal verification above, not after it.

*(only if verify came back `human_needed`)* — `/dk:verify:human`. **Blocking** — `human_needed` is
never a pass.

`/dk:verify:converge <NN>` — runs even when verify came back `passed`.

*(only if converge appended convergence tasks, or verify came back `gaps_found`)* —
`/dk:verify:remediate`. If the same gaps survive two cycles, it escalates.

*(skip `integration-checker` on the milestone's first phase; run `nyquist-auditor` only if verify
reported validation gaps)* — `/dk:verify:integrate <NN>`

*(only if this phase added or changed **primary** user flows)* — `/dk:verify:e2e <NN> <branch>`

**Session boundary** — anything worth recording with `learn` goes in first. Then **back to step 5**;
when every phase is done, continue to Part C.

---

# Part C — close the milestone

## 12. Final review — the milestone gate
Both sub-stages **gate** the milestone. **a. Functional** is two independent predicates — shipped UI
triggers the first, a developer-facing surface the second; a milestone with both runs both. The
three conditional gates below cover different surfaces and return separate verdicts, so run them
**concurrently** — the ordering here is reading order, not execution order.

*(only if the milestone shipped UI, across any of its phases)* — `/dk:final:ui <URL>`

*(only if the milestone shipped a developer-facing surface — API/CLI/SDK — in any phase)* —
`/dk:final:devex`

**b. Security — always runs** — `/dk:final:security`. One auditor per phase fans out; `cso` is the
barrier that needs the whole register. Open threats block the ship.

*(only if regulated data or industry is in scope — GDPR/HIPAA/PCI/SOC2)* — `/dk:final:compliance`

*(only if active exploitation is authorized and in scope, in writing)* — `/dk:final:pentest`

## 13. Ship — open the PR, do not merge yet
**Stop at the PR.** Step 14 documents the milestone against the still-unmerged diff; the merge and
deploy happen at the end of step 14. Safety rails on first.

`/dk:ship:safety`

*(only if land-and-deploy has never been configured in this repo — check now, not at deploy time)* —
`/dk:ship:deploy-setup`, run **beside** the rails above: an interactive wizard and a guard mode
share nothing.

*(only if this milestone changed the deploy, infra, or runtime surface — or is the first to deploy
at all)* — `/dk:ship:infra`

**Now open the PR. Pick one path** — `/dk:ship:pr` (manual) **or** `/dk:ship:auto` (automated).
Mutually exclusive; the choice determines steps 14's `changelog`, `land` and `merge`.

## 14. Document — while the PR is still open
**The doc-tree chain is one paste at a time, in this order.** `document-generate` and
`code-documenter` are **sequential, not alternatives**; running only one leaves half the doc set
unwritten.

`/dk:docs:generate`

*(skip only if this milestone shipped no code-level public surface)* — `/dk:docs:api`

*(only if you took the manual path at step 13)* — `/dk:docs:changelog`, which is the one thing in
this step that runs **alongside** that chain rather than after it: it writes the changelog and the
version file, which nothing in the chain reads or touches. `document-release` below is the barrier
that needs both back.

`/dk:docs:release` · `/dk:docs:verify`

*(then land it — only if you took the automated path at step 13)* — `/dk:docs:land`. If it stops and
hands off, that is the correct outcome — fall through to the manual merge.

*(only if you took the manual path at step 13, or land handed off)* — `/dk:docs:merge`

## 15. Operate, retrospect, close
`/dk:close:health` · `/dk:close:operate` · `/dk:close:retro <Nd>` — set the window to the whole
milestone, not the command's 7-day default. `health`, `retro` and the product loop below read
different artifacts and write different outputs, so run all three concurrently; `operate` is the
one with an internal order, and it keeps it.

*(only if the retro surfaced a workflow this project keeps repeating by hand)* — `/dk:close:codify`

*(only if this milestone shipped user-facing changes with usage data behind them)* —
`/dk:close:product-loop`, alongside `health` and `retro`

*(only if a production incident is underway)* — `/dk:close:incident`

*(only if the postmortem named a failure mode nobody had rehearsed)* — `/dk:close:game-day`

Only once nothing is on fire — `/dk:close:milestone <M>`

**Milestone 2+ starts over at step 0**, not at step 1 — "is this repo still greenfield?" is re-asked
every milestone, and the answer is now `continuing`. The only thing that changes is where step 1
gets its requirements: the backlog instead of a PRD or a fresh idea.
