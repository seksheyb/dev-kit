# Agent Model & Effort Tiers

> Governs every agent definition under `agents/` in `dev-kit-core` and `dev-kit-data-ai`.
> Read this before adding a new agent or changing an existing one's `tools:`/scope — the
> tier follows from the work the agent does, not from how expensive a past run was.
>
> **No agent has a `model` pin anywhere — not in frontmatter, not in
> `complexity.config.json`, not hardcoded at a dispatch site.** `advisor-researcher`'s
> former `model: sonnet` hardcode (the `ADVISOR_MODEL` constant in
> `discovery-research.workflow.mjs`, described in `commands/discover/research.md`) was the
> last one and is now removed too — see "Model pinning removed" below for the full
> history of what changed and why. Every agent, including the 15 never-downgrade agents,
> is scored from its dispatch descriptor's real signals. The empirical haiku testing and
> reversal history further down explains how an earlier tier was reached, not what
> currently runs.**

## What the harness actually supports (verified against `sdk-tools.d.ts`, Claude Code 2.1.220)

- **`model:` in an agent's frontmatter is a real, honored override.** Precedence is:
  explicit `model` param on the dispatching `Agent`/`Task` call → the agent definition's
  `model:` frontmatter → inherit the parent session's model. Leaving the key out of
  frontmatter means "always follow the session," which is the correct default (see below).
- **There is no per-agent `effort:` frontmatter key, and none is planned.** Reasoning
  effort is only settable two ways: the session-wide `/effort` (or global config, which
  applies to everything), or `Workflow`'s `agent(prompt, {effort})` inside a workflow
  script. The plain `Agent` tool — which is how every `dk:*` command dispatches — has no
  `effort` parameter at all. **Do not add `effort:` to an agent's frontmatter; it is
  silently ignored by the harness.** If a dispatch site needs effort control, it has to
  route through `Workflow`, which is a bigger change than a frontmatter edit (see the
  fan-out note below).

## The two tiers

**T0 — inherit (no `model:` key). Default for everything.** The agent runs on whatever
model the session (or an explicit per-call override) is already using. Use this whenever
the agent's output:

- requires judgment, synthesis, or trade-off reasoning (planning, research, verification,
  advisory recommendations), or
- feeds a gate that can block a phase, milestone, or ship (see the no-downgrade list
  below), or
- is expensive to detect as wrong after the fact — a bad verdict ships silently rather
  than getting caught downstream.

**T1 — `model: haiku`.** Reserve for agents whose task is a bounded, mechanically
checkable transform: a single classification label, a boolean claim-check against the
repo, a deterministic score computed from other tools' output. A wrong T1 output must be
cheap to catch (caught by a downstream synthesis/merge step or a human skim) and cheap to
re-run — never a phase-blocking verdict.

Current T1 agents, with the argument for each:

| Agent | Task shape | Why cheap-to-verify | Risk if wrong |
|---|---|---|---|
| `doc-classifier` | One label (ADR/PRD/SPEC/DOC/UNKNOWN) + title/summary extraction per doc | `doc-synthesizer` re-reads every classified doc during precedence merge | One doc mis-bucketed; caught at synthesis |
| `doc-verifier` | Checks a claim (path/command/function) against the live repo | Verification is itself a grep/read against ground truth | A stale reference flagged/missed; next verify pass catches it |
| `health-reporter` | Wraps typechecker/linter/test-runner/dead-code output into a weighted formula | The score is arithmetic over other tools' deterministic output; report-only, fixes nothing | Dashboard number off for one run; trend-tracked, self-corrects |
| `retro` | Aggregates `git log` into commit/session/hotspot stats | Descriptive analytics, not a decision input | Minor mischaracterization in an FYI report |

`doc-synthesizer`, `pattern-mapper`, and `codebase-mapper` were tested at T1 (see the
verification and reversal history further down) but are **not** T1 today — see "Operator
override" immediately below for what actually runs.

Do **not** promote a new agent to T1 by analogy alone — re-derive the argument (bounded
task, cheap verification, cheap failure) each time, and write it down like the rows above.

## Operator override — `sonnet`, set directly (2026-07-30)

**Current state, overriding everything the empirical testing below concluded:**
`advisor-researcher`, `pattern-mapper`, `doc-synthesizer`, and `codebase-mapper` all run on
explicit `model: sonnet` — three in their own frontmatter, `advisor-researcher` at its
command-level dispatch site in `commands/discover/research.md` (same reasoning as always:
one caller today, generic description, so the override lives at the call site, not baked
into frontmatter for any future caller to inherit invisibly).

This was a direct operator decision, not a re-derived conclusion from the testing/scorer
work below — it supersedes the haiku tier that testing had arrived at for all four. The
sections below (empirical verification, the scorer disagreement, the codebase-mapper
reversal, the runtime-conditional methodology and its own later revert) are kept as the
historical record of how the haiku tier was reached and why it no longer applies — not as
a description of what currently runs. If you're only here to answer "what model does
`pattern-mapper` use," the answer is `sonnet`, full stop; read on only for why the
frontmatter says what it says.

## Machine-readable mirror: config agents block (2026-07-30)

The `agents` block in `plugins/dk/bin/complexity.config.json` is now the runtime authority
consulted by the model router (`routing-engine.mjs`'s pin lookup, `config.agents[descriptor.agent]`)
at every dispatch that goes through the router — a `model` entry short-circuits the capability
axis (including `"inherit"`, which keeps the agent on T0 with no override), and an `effortFloor`
entry raises the computed effort the same way any other floor does. This document remains the
rationale and changelog: it is where the argument for each tier is made and re-derived, and where
future tier changes get their history recorded, not the config file. The frontmatter `model:` pins
on individual agent definitions stay in place as a harness-level backstop — they take effect even
for dispatches that never go through the router at all, so removing them in favor of the config
block would silently lose that coverage. `plugins/dk/bin/tests/agents-config-consistency.test.sh`
guards drift between the three surfaces (frontmatter, config, and this document's tier lists), so
any tier change must update the config block and this document together, not one without the other.
See `references/model-routing.md` for the router's full contract.

## Model pinning removed from config — operator decision, supersedes the section above

**Current state, overriding the "Machine-readable mirror" section immediately above:**
`plugins/dk/bin/complexity.config.json`'s `agents` block no longer carries a `model` entry
for any agent — not the 15 never-downgrade agents, not the 4 T1 agents, not the 4 operator
sonnet overrides. The router's capability axis is scored from real dispatch-descriptor
signals for every agent, gate-feeding or not. The operator's own reasoning: every agent in
this corpus does judgment-shaped work, and a name-based override is not a better signal of
that than the descriptor's own `novelty`/`logic`/`ambiguity` — a real gate-audit descriptor
should band to `opus` because the work in front of it is genuinely novel or ambiguous, not
because the agent is named `security-auditor`. The prior config-mirror design additionally
had a live defect worth recording: the never-downgrade agents were pinned to
`model: "inherit"`, which does not mean "always a strong model" — it means "run on
whatever model the calling session happens to be on." A gate agent dispatched from a
haiku-orchestrated session would have quietly run on haiku, which directly contradicted
this document's own "never downgrade" premise. Removing the pin fixes that by removing the
escape hatch, not by adding a new floor in its place.

**What did NOT change (at the time this section was written):** the 15 never-downgrade
agents kept an `effortFloor: high` entry — effort is not scored down for these roles even
when capability legitimately lands low. That is still true today. What was left in place
at the time — the 3 agent-definition **frontmatter** `model: sonnet` pins
(`pattern-mapper`, `doc-synthesizer`, `codebase-mapper`; the T1 haiku frontmatter pins on
`doc-classifier`, `doc-verifier`, `retro`, `health-reporter` were also still standing) —
is addressed by the section immediately below, which supersedes this paragraph's "left
untouched" framing.

## Frontmatter model pins removed too — operator decision, supersedes the paragraph above

Every agent-definition frontmatter `model:` key is now gone: the 3 operator-sonnet
overrides (`pattern-mapper`, `doc-synthesizer`, `codebase-mapper`) and the 4 T1 haiku pins
(`doc-classifier`, `doc-verifier`, `retro`, `health-reporter`) — 7 files total. This closes
exactly the gap the paragraph above flagged: frontmatter is a harness-level mechanism that
applies even to dispatches bypassing the router, so a config with no model pins and a
frontmatter with one would have let the same agent get two different answers depending on
dispatch path. There is now no per-agent model override on either side for these 7 agents;
`agents-config-consistency.test.sh` gained a matching structural guard — no agent `.md`'s
frontmatter may carry a `model` key, mirroring the config-side guard.

## The last hardcode removed too — operator decision, supersedes the paragraph above

`advisor-researcher` never had a frontmatter pin — its `model: sonnet` was hardcoded as
the `ADVISOR_MODEL` constant inside `references/workflows/discovery-research.workflow.mjs`,
described in `commands/discover/research.md`, and explicitly documented there as winning
over `args.routing['advisor-researcher']`. That was the single hardcoded model override
left anywhere in the corpus after the two removals above, and it is now removed as well:
the constant is deleted, both prose sites are rewritten, and `advisor-researcher` is
scored from its dispatch descriptor's signals exactly like `pattern-mapper` and every
other agent in this document. There is no per-agent model override anywhere in dev-kit's
shipped corpus — not in a frontmatter file, not in `complexity.config.json`, not
hardcoded at a dispatch site — full stop.

Everything above this section and below the "Operator override" heading is historical: how
tiers were tested, argued, and pinned before this decision. It is retained because the
reasoning in it (why `pattern-mapper` was ever thought to be haiku-safe, why
`codebase-mapper` was reversed, what the empirical passes found) is still the right way to
evaluate a *new* agent's tier — it just no longer describes a pin that exists in config.

## Never downgrade — flagged independently of cost

These agents feed a gate that can block a phase, milestone, or ship, or produce a verdict
whose failure mode is a false negative (vulnerability shipped, broken integration merged,
non-compliant release approved) that is *not* cheaply caught downstream. Cost observed in
production is not sufficient reason to move any of these off T0 — the argument has to be
made independently, on the merits of that specific agent, same as promoting to T1 does.

`code-review-gate`, `security-auditor`, `penetration-tester`, `compliance-auditor`,
`gate-automation`, `gate-plan-review`, `gate-reverse-engineer`, `ui-checker`, `verifier`,
`integration-checker`, `nyquist-auditor`, `design-reviewer`, `ui-auditor`, `eval-auditor`,
`plan-reviewer` (feeds the fix-before-gate step even though it doesn't run the gate
itself). All 15 stay T0 (no `model:` key) as of this policy's introduction
(2026-07-29).

## `pattern-mapper`'s cost driver is separate from its model tier

`pattern-mapper` was the single largest cost item in the incident that prompted this
policy (~240k tokens, 65 tool calls, one dispatch) and is now T1 (see verification below).
Moving it to `haiku` addresses cost-per-token; it does **not** address tool-call *volume*,
which scales with however many files a phase touches and was the actual driver of that
240k-token run. If this agent is still expensive after this change, the next fix is
bounding its search scope in the prompt (a cap on files/analogs per dispatch), not a
further model change — track that as a separate, still-open efficiency question.

## Where the fan-out problem actually lives — not a frontmatter question

`advisor-researcher` and `pattern-mapper` (the two agents in the incident) have exactly
one caller each: `commands/discover/research.md`. Their cardinality — one
`advisor-researcher` per gray-area decision, uncapped — is a **command-level** dispatch
decision, not a property of the agent. Putting `model: haiku` on `advisor-researcher`'s
own frontmatter would silently downgrade it for any future caller too, invisibly at the
call site. The fix for an unbounded fan-out belongs in the dispatching command (a fan-out
cap, and/or an explicit `model` override passed at the call site) or, for real per-call
*effort* control, in migrating that dispatch to `Workflow`. See
`commands/discover/research.md` for the cap this policy added; a `Workflow` migration is
a separate, larger decision not made by this policy (see PROJECT memory / CHANGELOG for
the open follow-up).

That `Workflow` migration is now done for discover/research: `advisor-researcher`'s
`model` override no longer lives in `commands/discover/research.md`'s prose, it lives at
the dispatch site inside `discovery-research.workflow.mjs`, the Workflow script that now
fans out that step (see `references/workflows/README.md`).

## Empirical verification (2026-07-30)

The 4 T1 agents (plus the command-level `advisor-researcher` override) were actually
dispatched on `model: haiku` against real or ground-truth-checkable inputs — not just
argued for — before being trusted:

| Agent | Test | Result |
|---|---|---|
| `doc-classifier` | Classified `RUNBOOK.md` (clear DOC) and, as a stretch test outside its real domain, this policy doc itself | `RUNBOOK.md` correctly called DOC. The policy doc was called SPEC — but that's this agent's own written ambiguity rule (`ADR > SPEC > PRD > DOC` precedence, line 89) applied to an atypical input never meant for it (an internal `references/` doc, not an end-user ADR/PRD/SPEC/DOC candidate); any model tier follows the same explicit rule. Not counted as a haiku miss. Follow-up: the rubric has no path signal for `references/**`, which is a prompt gap independent of model tier |
| `doc-verifier` | 4 planted claims (2 true, 2 false, including an exact-number check) | 4/4 correct with precise file/line citations |
| `health-reporter` | Synthetic 5-category input including one skipped category, requiring proportional weight redistribution | Composite computed as 5.75/10 — exact match to hand-calculated ground truth (512/89) |
| `retro` | Full retrospective against this repo's real history | Every checkable number (144/43/2/2 commits per author, 470,179/56,030 LOC added/deleted, 47/43/9/6/5/3 commit-type breakdown, exact per-day commit counts, real `bugfix/w1-*`/`w2-*` branch names from merge commits) matched `git log --all` exactly |
| `advisor-researcher` (command-level, not frontmatter) | Real gray-area question about this doc's own placement | Coherent 3-option table at `standard` shape, correctly grounded in this repo's actual `references/` vs `skills/` convention |

Verdict: no T1 assignment reversed. `doc-verifier`, `health-reporter`, and `retro` are
clean passes; `doc-classifier`'s one debatable call traces to a rubric gap, not a model
capability gap, and doesn't reproduce on its actual (end-user doc-ingestion) domain.

### Round 2 — the flagged trial candidates (2026-07-30)

`codebase-mapper`, `doc-synthesizer`, and `pattern-mapper` were run the same way, against
harder, more realistic inputs than round 1:

| Agent | Test | Result |
|---|---|---|
| `codebase-mapper` | Real `tech`-focus dispatch against `~/projects/aiChatter` (a real pnpm monorepo, not this repo — dev-kit's own repo has no `src/`/`package.json` shape this agent expects) | Every checkable claim matched exactly: `pnpm@9.0.0`, `next@16.2.7`, `react@19.2.7`, `tailwindcss@4.3.0`, exact file path `apps/ai/src/aichatter_ai/decay/canonical.py`, exact Terraform module names, exact CI job names, and exact PostHog event names (`facet_view`, `ask_submitted`, `article_opened`) pulled from real source comments — but see the reversal below |
| `doc-synthesizer` | Synthetic 3-doc set with two LOCKED ADRs contradicting each other on the same decision (planted, unresolvable) plus one PRD | Correctly hard-blocked rather than picking a side; quoted its own precedence rule **verbatim** (`agents/doc-synthesizer.md:63`, "LOCKED vs LOCKED: two locked ADRs in the ingest set that contradict → hard BLOCKER... Never auto-resolve") and explicitly rejected all three wrong shortcuts (picking the "superseding" one, picking by recency, silently merging) |
| `pattern-mapper` | Two genuinely new agent proposals (`api-contract-auditor`, `license-auditor`) against this repo's real 41 agents | Correctly picked `integration-checker` and `dependency-manager` as closest analogs and quoted their actual sections near-verbatim with correct line ranges — checked against the real files, not paraphrased or fabricated |

All three promoted to T1. Caveat, stated plainly: these were single favorable-case tests,
not adversarial stress tests the way the doc-classifier/doc-verifier round-1 tests were —
nobody tried to trip these three up with a deliberately bad edge case (e.g. a to-be-created
file with no good analog, an altered/incorrect analog to see if it'd be blindly trusted).
`doc-synthesizer`'s test also didn't exercise its file-reading/cross-ref-cycle-detection
path (the conflicting docs were supplied inline, not as files it had to discover and read).
If either gap concerns you, that's the next round to run — not a reason to hold this one.

### A reversal: `codebase-mapper` (2026-07-30)

Two independent checks disagreed with the round-2 promotion, and a follow-up test sided
with them:

1. **Dev-kit's own deterministic scorer disagreed.** `plugins/dk/bin/complexity-score.mjs`
   is the exact tool `gate-plan-review` uses to catch under-declared model/effort on real
   build tracks — it exists specifically to stop a task's true judgment requirement from
   being trimmed to land on a cheaper model. Fed a synthetic track for each T1 agent's task
   (honest signal values, not massaged to fit), it agreed with 6 of 7 — but scored
   `codebase-mapper` at `capability: 3` (`ambiguity: medium`, 2 output files) → **`sonnet`
   band**, not haiku. This is a legitimate way to reuse an existing repo tool for this kind
   of check: it wasn't built for scoring agent-dispatch tasks, only build-plan tracks, so
   feeding it a synthetic track is an adaptation, not a literal fit — but the signal
   vocabulary (novelty/logic/ambiguity/tests → capability/risk → model/effort) is the same
   question this policy is answering, and the tool is designed to resist exactly the kind
   of favorable self-report a promoter (including this policy) might make.
2. **A live haiku-vs-sonnet comparison confirmed it.** The round-2 test only used the
   `tech` focus (the most retrieval-heavy of the agent's four modes). Re-run on `concerns`
   (the most judgment-heavy) against the same real target: haiku wasn't wrong about
   anything it reported, but it was measurably less thorough than sonnet on the same
   dispatch — it missed 2 of 11 real findings sitting in a security report both models
   read (an SSM-into-bash command-injection risk and a missing CODEOWNERS file), missed a
   completely broken root TypeScript/ESLint config (arguably the single most important
   "concerns" finding in that repo), missed a 12-run CI-red streak, and root-caused zero of
   the bugs sonnet traced to specific causes (a cascading test failure, a Postgres
   pool-timeout explaining a 32-minute CI job, `mypy` silently skipped after `pytest`
   fails first).

**Reverted to T0** (no `model:` key). The reason isn't that haiku is bad at this agent's
job — the `tech`-focus result stands, uncontradicted. It's that the agent's four focus
modes are not uniformly bounded, frontmatter has no way to set a tier conditional on the
`focus` argument passed at dispatch, and "some invocations are fine on haiku" isn't a
basis for a blanket agent-level tier when the harder invocations demonstrably need more.
If `tech`/`quality` dispatches specifically are worth the savings, that lever belongs at
the calling command (`commands/discover/map.md`), the same way `advisor-researcher`'s
override lives at its call site rather than in its own frontmatter — not done here; flag
it as a future refinement if the cost is worth chasing.

**Takeaway for future promotions:** an empirical pass on a favorable test is necessary but
not sufficient. Cross-check against this repo's own deterministic scorer where the task
can be honestly translated into its signal vocabulary, and if a task has multiple
qualitatively different modes, test the hardest one, not the easiest.

## Adding a new agent

1. Classify it: mechanical/structured-extraction, synthesis/judgment, or
   adversarial/security-critical — and separately ask whether its output can block a
   gate.
2. Gate-feeding or adversarial/security-critical → T0, no further discussion needed.
3. Otherwise, only pick T1 if you can fill in a row like the table above: bounded task,
   cheap verification, cheap failure. If you can't fill in the "risk if wrong" cell
   honestly, it's T0.
4. Before trusting a T1 promotion, cross-check it against `plugins/dk/bin/complexity-score.mjs`
   (feed it a synthetic track with honest `novelty`/`logic`/`ambiguity`/`tests` values for
   the agent's task) and empirically test its *hardest* mode, not its easiest — see the
   `codebase-mapper` reversal above for why both matter.
5. If the agent has more than one qualitatively different invocation shape (a `focus` or
   mode argument), a single frontmatter tier can't follow it. Either the whole agent stays
   T0, or the tier lives at the calling command for the modes that qualify.
6. Never add `effort:` to the frontmatter — it does nothing on this harness.
