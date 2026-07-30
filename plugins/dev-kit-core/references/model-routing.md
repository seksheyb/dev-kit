# Model Routing — The Abstract Router Contract

> One abstract router decides model and effort before every agent dispatch, across every
> profile (coding, research, review, writing, ops) and every surface (inline `Agent`,
> `Workflow`, plan-driven track). `references/complexity-signals.md` is the coding
> vocabulary this doc sits above — read it first; this doc does not restate its tables,
> it generalizes the same idea (signals → model/effort) to non-coding profiles and gives
> every dispatch site one procedure to call instead of five ad-hoc ones.
> `references/agent-model-tiers.md` is the per-agent tier policy's history (T0/T1, the
> never-downgrade list, and why the model-axis pin those sections describe was later
> removed) — read it before assuming an agent's name, rather than its descriptor's
> signals, has any say in its model.

## 1. Purpose & invariants

A single abstract router — not each dispatch site improvising — decides `{model, effort}`
before every agent dispatch, on every surface. The rules below are non-negotiable:

- **The router decides, the dispatcher obeys.** No command, skill, or workflow script
  picks a model or effort by its own judgment once a descriptor exists for the dispatch —
  it calls the router and passes through what comes back.
- **`inherit` is a router OUTPUT, never a dispatcher default.** A dispatcher that omits
  `model` because it forgot to call the router is not the same as the router deciding
  `inherit` — the former is a bug, the latter is a legitimate decision the router made on
  the signals it was given.
- **Effort is never lowered to fit a model.** If a descriptor's signals demand `high`
  effort, the router does not quietly relax that to make a cheaper model's constraints
  easier to satisfy — see §5 for what happens instead when a model/effort combination
  can't be expressed natively.
- **The LLM declares signals (judgment); code alone converts them to a decision
  (arithmetic).** Deciding "this task has `ambiguity: high`" is a judgment call the
  dispatching LLM makes about the work in front of it. Turning that declaration into
  `{model: opus, effort: high}` is a deterministic table lookup — the same descriptor
  must always produce the same decision. Judgment and arithmetic never happen in the same
  step, and arithmetic never second-guesses the judgment step's inputs.
- **No agent's model is pinned by name — dev-kit's shipped config carries zero
  `agents.*.model` entries.** Gate-feeding agents like `code-review-gate` and
  `security-auditor` are scored from their descriptor's real signals exactly like any
  other agent; a lazily-written descriptor bands them down like any other lazily-written
  descriptor would. The engine still supports a `model` pin structurally (a project's own
  `complexity.config.json` may set one), but dev-kit does not use it — the operator's
  position (see `agent-model-tiers.md`) is that every agent's work is judgment-shaped, so
  a name-based override is not a better signal than the descriptor's own
  novelty/logic/ambiguity. **Effort is different: the 15 never-downgrade agents keep an
  `effortFloor: high` pin**, so their effort axis cannot be scored down even when
  capability legitimately lands low — see `agent-model-tiers.md` for which agents and why.

## 2. Abstract axes

Every routing decision reduces to two independent 0–12 sums, each banded by
`complexity.config.json`'s `modelBands`/`effortBands` (see `complexity-signals.md` for
the coding-specific version of this same idea):

| Axis | Feeds | Sub-signals summed |
|---|---|---|
| **Capability** | `model` (`haiku` \| `sonnet` \| `opus` \| `inherit`) | novelty, reasoning depth (`logic`), ambiguity, breadth, fan-in/out |
| **Risk** | `effort` (`low` \| `medium` \| `high` \| `xhigh` \| `max`) | consequence/gate-feeding (the sensitivity slot), blast radius, reversibility, downstream verifiability (the `tests`/`verifiability` slot), ambiguity |

Both axes are sums banded by config, not weighted averages — and both carry floors
evaluated on the *raw declared enums*, never on the summed score, so a single maxed-out
signal (e.g. `ambiguity: high`) can't be diluted into a lower band by several low signals
sitting next to it. This mirrors `complexity.config.json`'s `capabilityFloors` /
`effortFloors` exactly; this doc's abstract layer doesn't add new floors of its own, it
generalizes the same floor mechanism across profiles.

Note `ambiguity` appears in both axes — it drives which model can handle the judgment
call *and* how much risk an under-resolved requirement carries downstream. That's
intentional, not a duplication bug: a highly ambiguous task is both harder to execute
correctly and more expensive to get wrong.

## 3. The descriptor

Every routing call is driven by one descriptor, in this exact shape. A sibling track
implements this spec identically in code — do not improvise fields, rename them, or add
optional ones without updating both sides:

```json
{
  "agent": "verifier",
  "profile": "coding|research|review|writing|ops",
  "surface": "agent|workflow",
  "signals": {
    "novelty": "none|low|high",
    "logic": "low|medium|high",
    "ambiguity": "low|medium|high",
    "tests": "existing|new|none",
    "verifiability": "checked|skim|unverified",
    "files": ["..."],
    "unitCount": 3
  },
  "context": { "gateFeeding": true, "dependsOn": 2, "dependents": 1 }
}
```

Rules the router enforces on this shape:

- **Exactly one of `tests` \| `verifiability` is present.** They are mutually exclusive
  mappings onto the same risk slot, not two independent signals — a descriptor carrying
  both, or neither, is malformed. `tests` is the coding-native enum
  (`none|existing|new` — see `complexity-signals.md`); `verifiability` is how every
  non-coding profile expresses the identical risk slot: `checked` scores `0`, `skim`
  scores `1`, `unverified` scores `2`.
- **`files` present → breadth, sensitivity, and reversibility all derive from paths +
  config globs.** The router matches each path against `complexity.config.json`'s
  `sensitivePaths` (`critical`/`sensitive`/`adjacent`) and `reversibility`
  (`destructive`/`schema`) glob sets, same as the coding scorer does today.
- **`files` absent → breadth comes from `unitCount` instead, sensitivity is `3` iff
  `context.gateFeeding` is true (else `0`), and reversibility is `0`.** This is the
  non-file-shaped fallback for profiles where "which files" isn't a meaningful question
  (e.g. a research question, a review verdict, a piece of prose) — breadth is measured by
  how many discrete units of work exist instead of how many paths are touched.

**Decision output** — the router always returns this shape, regardless of profile or
surface:

```json
{
  "model": "haiku|sonnet|opus|inherit",
  "effort": "low|medium|high|xhigh|max",
  "effortParam": "low|medium|high|xhigh|max|null",
  "capability": 7,
  "risk": 5,
  "reasons": ["..."]
}
```

`capability`/`risk` are the raw banded sums, kept in the output so a caller (or a human
skimming a workflow's return value) can see *why* a decision landed where it did without
re-deriving it. `model: "inherit"` is a valid engine output — a project's own config may
still set a `model` pin — but dev-kit's shipped `complexity.config.json` has no such
entries, so against it every dispatch resolves to a concrete `haiku|sonnet|opus`, never
`inherit`. `reasons` is a short list of which sub-signals/floors/pins drove the
final numbers — populate it whenever a floor or an agent pin overrode the raw sum, not
just when everything landed at its default.

## 4. Profiles

Each profile maps the same signal names onto what they mean in that domain. The signal
*names* and the axis math (§2) never change across profiles — only the meaning of each
enum value does.

### Coding

Delegates verbatim to `references/complexity-signals.md` — do not restate its tables
here. Read that doc for what `novelty`/`logic`/`ambiguity`/`tests` mean for implementation
work, and for the model/effort tables it derives from them.

### Research

| Signal | Meaning |
|---|---|
| `novelty` | How unexplored the question is — `none` = re-confirming a known answer, `high` = no existing source base to lean on. |
| `logic` | Depth of synthesis across sources required — `low` = single-source lookup, `high` = reconciling conflicting sources into one position. |
| `ambiguity` | How underspecified the research question itself is — `low` = a precise, answerable question, `high` = the asker doesn't yet know what they're really asking. |
| `verifiability` | Will anything downstream re-check this finding — `checked` = a later gate/citation audit re-verifies it, `unverified` = this finding ships as-is. |

### Review

| Signal | Meaning |
|---|---|
| `novelty` | How unfamiliar the reviewed surface is to established review patterns — `high` = reviewing a pattern with no precedent in this repo's prior reviews. |
| `logic` | Depth of reasoning needed to reach a verdict — `high` = the verdict requires tracing a multi-step failure chain, not a single obvious defect. |
| `ambiguity` | How contestable the verdict is — `high` = reasonable reviewers could disagree on the call. |
| `verifiability` | Will a later gate re-check this verdict — `checked` = a downstream gate re-reviews it, `unverified` = this verdict is the last check this content gets. |

### Writing

| Signal | Meaning |
|---|---|
| `novelty` | How much of the content is original argument vs. restating established material. |
| `logic` | Structural complexity of the argument being made — `high` = a multi-step argument with load-bearing sub-claims. |
| `ambiguity` | How underspecified the brief is — `high` = the writer must invent structure/scope, not just fill in a template. |
| `verifiability` | Will an editor/proofreader pass catch errors before publish — `checked` = yes, `unverified` = this draft ships as final. |

### Ops

| Signal | Meaning |
|---|---|
| `novelty` | How unprecedented the operational change is — `high` = no runbook or prior incident covers this. |
| `logic` | Depth of causal reasoning to diagnose or remediate — `high` = multi-system root-causing, not a single obvious fix. |
| `ambiguity` | How clear the intended end-state is — `high` = the operator must decide what "fixed" means. |
| `verifiability` | Will monitoring/alerting catch a wrong call — `checked` = yes, an alert would fire, `unverified` = a bad call ships silently. |

## 5. Expressibility

`effortParamSupport` describes which efforts are a real dispatch parameter, per model,
per surface — this is what makes `effortParam` sometimes `null` and sometimes a real
value in the decision output (§3).

- **Surface `agent` (inline `Agent` tool calls): no effort parameter exists for any
  model.** `effortParam` is always `null` on this surface, full stop — this mirrors
  `agent-model-tiers.md`'s finding that the plain `Agent` tool has no `effort` parameter
  at all. The dispatcher's job is to inject the matching effort prompt block (§6) into the
  agent's prompt text instead of passing effort as a parameter.
- **Surface `workflow` (`Workflow` tool calls): effort is a real opt**, passed as
  `agent(prompt, {effort})` per `agent-model-tiers.md`. When a computed `{model, effort}`
  pair is inexpressible on the target model (the model doesn't support that effort level
  as a real parameter), the router resolves it per the configured
  `onInexpressibleEffort` policy:
  - **`prompt-text`** (default) — keep the computed model, and instead ride the effort as
    prose: `effortParam` resolves to `null` and the effort prompt block (§6) is injected
    into the prompt, exactly as Surface A always does.
  - **`bump-model`** — raise the model to the cheapest model that *does* support the
    computed effort as a real parameter. `opus` is the ceiling: if the computed effort is
    still inexpressible at `opus`, this falls through to `prompt-text` as the mandatory
    terminal fallback — there is no model above `opus` to bump to, so the chain must
    terminate somewhere.
  - Either way, **effort is never lowered** to make a smaller model's supported range fit
    — the invariant in §1 holds identically here; `onInexpressibleEffort` only changes
    *how* the unsupported effort gets communicated, never whether it's honored.

## 6. Effort prompt blocks

The dispatcher injects exactly one of these five verbatim into the agent's prompt
whenever `effortParam` is `null` (always on Surface A; conditionally on Surface B under
`prompt-text`):

- **low** — Execute literally: follow the instructions exactly as given, with no added
  elaboration, alternatives, or judgment calls beyond what's explicitly asked.
- **medium** — Work to standard quality, using ordinary professional judgment on
  unstated details; this is the default depth when nothing unusual is at stake.
- **high** — Think carefully before acting: surface edge cases as you find them, and
  prefer a correct, well-reasoned answer over a fast one.
- **xhigh** — Reason deeply and adversarially about your own conclusion before returning
  it — actively try to find where it's wrong — and enumerate the failure modes you
  considered and ruled out.
- **max** — Apply maximum rigor: treat every claim, including your own intermediate
  ones, as unproven until verified against the source, and exhaust the plausible
  alternatives before concluding.

## 7. The routing step

Every dispatch site in the corpus points at one of these three procedures — pick by unit
count and surface, never by improvising a fourth path.

**Surface A — exactly 1 unit → inline `Agent` call.**
Build a descriptor with `surface: "agent"`. Run
`node plugins/dk/bin/model-route.mjs --caller <asset> --json`, feeding the descriptor on
stdin. Pass the returned `model` on the `Agent` call unless it is `"inherit"` (in which
case omit `model` entirely — see §1's invariant on what `inherit` means). `effortParam` is
always `null` on this surface (§5), so inject the matching effort prompt block (§6) into
the agent's prompt.

**Surface B — 2+ units → `Workflow` call.**
Build one descriptor **per agent role** (not per instance — a role fanned out 6 times
gets one descriptor, not 6), each with `surface: "workflow"`. Run
`model-route.mjs --batch <file>` against the full set. Forward the keyed output as
`args.routing = { agentKey: { model, effort } }` on the `Workflow` call. Per
`workflows/README.md` §3's opts-builder convention, each script's opts builder spreads
`...(args.routing?.[key] ?? {})` — still omitting absent keys entirely, so an absent key
still means "inherit," never a guessed default. **Precedence note:** an explicit
`operatorModel` forwarded by the invoking skill (a human's direct model choice for this
run, e.g. `design-html`/`design-consultation`'s Step-0/Step-1 operator choice) outranks
`args.routing` — an operator's own choice for this run always wins over the router's
computed value. This is the only override that outranks routing anywhere in the corpus;
per `agent-model-tiers.md`, no agent carries a hardcoded model at its dispatch site.

**Surface C — plan-driven tracks (sprint-execution, bugfix-wave, and similar).**
The planner declares signals directly in the plan (per `complexity-signals.md`'s Signal
Block), `gate-plan-review` verifies those declared signals against the deterministic
scorer (`complexity-score.mjs`) rather than calling the router fresh, and the plan's
declared `Model`/`Effort` columns are authoritative at execution time — there is no
second router call at dispatch. This is the same descriptor→decision contract as
Surfaces A/B, just computed once at plan time and carried forward as plain data instead
of re-invoked per dispatch.

## 8. Consumers

- **`model-route.mjs` / `routing-engine.mjs`** — the implementation of this contract:
  descriptor in, decision out, for both the single-call (`--caller`) and batch
  (`--batch`) modes described in §7.
- **`complexity-score.mjs`** — the plan-map adapter over the same routing engine, used by
  Surface C to verify a plan's declared signals rather than compute fresh ones.
- **`gate-plan-review`** — the Surface C check: verifies declared `Model`/`Effort`
  against the deterministic scorer before a plan is trusted for execution.
- **Every workflow-owning asset listed in `workflows/README.md` §5** — each is a Surface B
  call site and must follow the `args.routing` forwarding convention in §7.
- **`agent-model-tiers.md`** — the rationale for the per-agent pins mirrored in
  `complexity.config.json`'s agent-level entries, which this doc's §1 invariant says
  outrank signal scoring.
