# Roadmap: shortlisted for execution

Items pulled out of `ROADMAP.md` Milestones 1 and 2 to be worked next. Source of truth
for scope stays `ROADMAP.md`; this file is the working shortlist.

Shortlisted: **1.13**, **1.15**, **2.12**, **2.13**, **2.14**, **2.15**, **2.16**,
**2.17**, **2.18**, **2.19**.

*(1.1, 1.3, 1.5, 1.6, 1.8, 1.9, 1.10, 1.11, 1.12 — the previous shortlist — have all
shipped or resolved with no action; see `ROADMAP.md` Milestone 1 for status and the
git history for implementation detail. Cleared from this file so it only tracks live
work.)*

**Dependency order.** Only one hard edge exists: **2.14 is blocked on 1.13** — see
2.14 below. Two soft edges: **2.16 should land after or with 1.15** (both change how
`UI-REVIEW.md` reads, and 2.16's fix is written against that format), and **2.18
touches `rag-architect/SKILL.md:190`, the same file 2.14 rewrites** — same track or a
later wave, never parallel. Everything else is independent.

---

## 1.13 — `agents/{ai-researcher,eval-planner,framework-selector}.md` (dev-kit-data-ai), `agents/domain-researcher.md` (dev-kit-core)

**Fix:** grant `Edit` alongside `Write` on all four agents, and replace each one's
"ALWAYS use the Write tool" mandate with an explicit read-modify-write contract for
updating `AI-SPEC.md`.

**Bug (surfaced by structural sweep during the M1 fix wave, same damage class as
1.3):** all four agents co-author `AI-SPEC.md` in a documented sequential chain
(`framework-selector` → `domain-researcher` → `ai-researcher` → `eval-planner`), each
owning disjoint sections. But every one of them is granted `Write` only, never `Edit`:

| Agent | `tools:` frontmatter | Sections owned |
|---|---|---|
| `framework-selector.md:4` | `Read, Write, Bash, Grep, Glob, WebSearch, AskUserQuestion` | 2 (also creates the full section skeleton) |
| `domain-researcher.md:4` | `Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*` | 1, 1b |
| `ai-researcher.md:4` | `Read, Write, Bash, Grep, Glob, WebFetch, WebSearch, mcp__context7__*` | 3, 4, 4b |
| `eval-planner.md:4` | `Read, Write, Bash, Grep, Glob, AskUserQuestion` | 5, 6, 7 |

`Write` is a whole-file overwrite. Each agent's own write step compounds the gap by
explicitly forbidding the natural workaround too — "**ALWAYS use the Write tool to
create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation"
appears verbatim in all four (`framework-selector.md:129`, `domain-researcher.md:102`,
`ai-researcher.md:91`, `eval-planner.md:121`). So the only path to "update" the file is
a full `Write`, and the only thing stopping one agent from clobbering a sibling's
already-written section is a self-reported checklist line ("No section other than N
written or modified" — e.g. `framework-selector.md:240`, `domain-researcher.md:176`)
with no mechanism behind it. This happens **even on the documented sequential chain** —
it isn't a parallelism bug like 1.3, it's that every "update" in the chain is secretly
a "regenerate the whole file and hope nothing downstream-authored got lost or
mis-spliced."

`domain-researcher.md:108` already shows awareness of a related symptom (heading drift
against the skeleton `framework-selector` creates) without addressing the deeper
overwrite risk — a sign the agents know they're on thin ice here but have no tool-level
guardrail.

**Why it matters beyond the four assets:** item **2.14** (`skills/rag-architect`) is
blocked on this — deferring to `AI-SPEC.md` as a trusted upstream decision is worse
than not deferring at all if its sections can silently disappear underneath whoever
writes it last.

**Fix — two parts:**
1. **Tool grant:** add `Edit` to all four `tools:` frontmatter lines (three files in
   `dev-kit-data-ai`, one in `dev-kit-core`).
2. **Explicit read-modify-write contract:** replace the categorical "ALWAYS use Write"
   instruction in each write step with: read the file first if it exists, locate your
   owned section(s) by heading, and either `Edit` the section boundaries in place or
   reconstruct the section deliberately — never regenerate the whole file from scratch
   once it already exists. Keep `Write` for the one legitimate case
   (`framework-selector` creating the skeleton when the file does not yet exist).

**Acceptance:** running the four-agent chain in documented order leaves all of Sections
1, 1b, 2, 3, 4, 4b, 5, 6, 7 populated and non-empty at the end — no agent's section is
overwritten, truncated, or reverted to a placeholder by a later agent in the chain.

**Downstream link:** unblocks **2.14** once shipped.

---

## 1.15 — `agents/ui-auditor.md` — severity taxonomy doesn't reach the Detailed Findings section

**Fix:** wire the declared BLOCKER/WARNING severity labels into the `## Detailed
Findings` section of the `<output_format>` template, not just the `## Priority Fixes`
rollup.

**Bug (surfaced by structural sweep during the M1 fix wave; carried over from 1.11's
notes, flagged there as "worth doing alongside" but out of that item's scope):**
`ui-auditor.md:38-40` declares the classification every finding must carry:

> - **BLOCKER** — pillar score 1 or a specific defect that breaks user task
>   completion; must fix before shipping
> - **WARNING** — pillar score 2-3 or a defect that degrades quality but doesn't
>   break flows; fix recommended

1.11 (`2c4b253`) already wired this into `## Priority Fixes` — the template shows
`1. **[BLOCKER] {specific issue}** — ...` (`ui-auditor.md:351-354`) — and gave
`needs_human_review` a real consumer. But the taxonomy stops there. `## Detailed
Findings` (`ui-auditor.md:361-380`), organized per pillar, is the section that actually
carries the evidence — file:line references, class-usage counts, spacing analysis —
and its placeholders are bare:

```
### Pillar 1: Copywriting ({score}/4)
{findings with file:line references}
```

No `{findings}` placeholder in this section instructs the agent to tag each finding
`[BLOCKER]`/`[WARNING]`. A reader working from the evidence section — the one with the
actual file:line citations, i.e. the one someone would open to go fix something — has
no severity signal without cross-referencing back to the separate Priority Fixes list
by matching issue text. The taxonomy exists, is enforced in the aggregated rollup, and
still doesn't reach the section where the findings are actually documented.

**Fix:** add the same `[BLOCKER]`/`[WARNING]` (or "below bar" for findings that don't
clear either) prefix convention to each per-pillar findings placeholder in `##
Detailed Findings`, so severity is legible at the point of evidence, not only in the
summary rollup.

**Acceptance:** every finding listed under `## Detailed Findings` carries an explicit
`[BLOCKER]`/`[WARNING]`/below-bar label, consistent with its corresponding entry (if
any) in `## Priority Fixes`.

**Downstream link:** 2.16 rewrites `design-reviewer`'s read of `UI-REVIEW.md`. Land
1.15 first (or in the same track) so 2.16 is written against the post-1.15 format.

---

## 2.12 — `skills/brainstorming` (dev-kit-core) — premise gate is missing from the standard design flow

**Fix:** add a premise gate to the **standard** design flow, or make the standard flow
explicitly invoke the existing Premise Challenge block.

**Bug (in the original §4b list; omitted when the actionable set was enumerated for the
M2 fix wave, so it was never dispatched — re-verified as real afterwards):** the
Premise Challenge block (`brainstorming/SKILL.md:186`, headed "Premise Challenge (both
postures — mandatory)") sits inside the **startup/office-hours mode**, not the standard
flow. "Both postures" means both *startup* postures — founder and builder — not
"startup mode and standard flow."

The standard flow has its own `## Checklist (standard design flow)` (`:32`) and
`## The Process` (`:51`). Its five checklist steps run: explore project context → ask
clarifying questions → propose 2-3 approaches → present design → hand off to `specify`.
No premise step anywhere. And `:30` says the special modes *feed into* the standard
flow ("The diagnostic and validation modes both END by feeding their output into the
standard design flow (premises → approaches → design → handoff to `specify`)"), which
means the standard flow **assumes premises already exist upstream** and gates nothing
itself.

So a user who enters the standard flow directly — which is the default path, and the
one the pipeline uses — never hits a premise challenge at all. The mandatory gate is
only mandatory for people who happened to arrive through startup mode.

**Fix:** insert a premise step into the `## Checklist (standard design flow)` sequence
ahead of "propose 2-3 approaches", pointing at the existing `## Premise Challenge`
block rather than restating it (the block at `:188-189` already cross-references
`spec-review-cpo`'s Step 0A/0B — keep that single source of truth). Emit premises as
explicit agree/disagree statements per `:209`, and loop back on disagreement, exactly
as the startup path already does.

**Acceptance:** entering `brainstorming` in the standard flow with no prior mode
produces an explicit premise list the user must accept before any approach is proposed;
the Premise Challenge methodology is referenced, not duplicated.

---

## 2.13 — `skills/chaos-engineer` (dev-kit-infra) — experiments are designed from scratch, never seeded from real incidents

**Fix:** seed experiment design from this system's own postmortems and runbooks — a
real producer already writes them and this consumer ignores it.

**Bug (in the original §4b list; omitted when the actionable set was enumerated for the
M2 fix wave, so it was never dispatched — re-verified as real afterwards):**
`chaos-engineer` has essentially no incident/postmortem wiring. Verified counts
(case-insensitive `incident|postmortem`): `SKILL.md` **0 hits**;
`references/game-days.md` **4**; `references/{experiment-design,chaos-tools,
infrastructure-chaos,kubernetes-chaos}.md` **0 each**. (The ROADMAP's "one incidental
hit in SKILL.md, twelve in game-days.md" has drifted — the shape of the finding is
unchanged, the counts are now 0 and 4.)

Its `## Core Workflow` (`SKILL.md:26-32`) opens at step 1 with "**System Analysis** —
Map architecture, dependencies, critical paths, and failure modes" and reaches step 4
"**Learn & Improve** — Document findings, implement fixes, enhance monitoring". Failure
modes get *derived from the architecture*, and learnings get written *forward* — the
loop never closes back on what has actually broken.

Meanwhile the producer already exists and writes to known paths:
`agents/incident-responder.md:28` writes the blameless postmortem to
`docs/global/ops/postmortems/<date>-<slug>.md` and files resulting runbook updates
under `docs/global/ops/runbooks/` (restated at `:31` and in the frontmatter
`description` at `:3`). Experiments should be seeded from what has actually broken in
this system, not designed from first principles against a diagram.

**Fix:** in `## Core Workflow` step 1 (System Analysis), add a read of
`docs/global/ops/postmortems/` and `docs/global/ops/runbooks/` when present, and carry
the recurring failure modes found there into step 2 (Experiment Design) as candidate
hypotheses — ranked ahead of architecture-derived ones, since they have already
happened. Missing or empty directories are not fatal (same non-fatal-optional-input
pattern `analyze`/`converge`/`specify` use for a missing constitution).

**Acceptance:** with at least one postmortem present under
`docs/global/ops/postmortems/`, chaos-engineer's experiment list names the failure mode
that postmortem describes; with the directory absent, the skill runs unchanged and does
not error.

---

## 2.14 — `skills/rag-architect` (dev-kit-data-ai) — re-opens a stack decision `AI-SPEC.md` already made

**⛔ Blocked on 1.13 — do not start until 1.13 has merged.**

**Fix:** defer to the upstream `AI-SPEC.md` framework/stack decision when one exists,
instead of re-running the selection from scratch.

**Bug:** `rag-architect`'s `## Core Workflow` (`SKILL.md:17-23`) runs step 2 "**Vector
Store Design** — Select database, schema design, indexing strategy, sharding approach"
and step 4 "**Retrieval Pipeline** — Embedding selection, query transformation, hybrid
search, reranking" unconditionally. Its `## Constraints` reinforce this as a MUST
(`:168`: "Evaluate multiple embedding models on your domain data before committing"),
and `## Output Templates` (`:189-190`) requires shipping a "Vector database selection
with trade-off analysis" as a deliverable. Its reference guide carries a whole
comparison table for the same decision (`:33` → `references/vector-databases.md`,
"Comparing Pinecone, Weaviate, Chroma, pgvector, Qdrant").

But by the time `rag-architect` runs, `framework-selector` has already made and
recorded exactly this decision in `AI-SPEC.md` Section 2. Re-opening it produces a
second, independently-derived stack answer with no reconciliation against the first —
the duplicated-decision shape this audit exists to cut.

**Why it is blocked:** the fix *creates a read of `AI-SPEC.md`*, which 1.13 must first
make trustworthy. Four agents currently whole-file-`Write` that document and clobber
each other's sections. Deferring to a stack decision that may have been silently
overwritten converts a duplicated-decision problem into a **silently-wrong-decision**
problem — strictly worse than the status quo. Ship 1.13 first.

**Fix:** at the top of step 2, read `AI-SPEC.md` Section 2 when present. If it records
a vector store / embedding model decision, adopt it and reduce step 2 to validating
that choice against this system's retrieval requirements — flagging a genuine conflict
for the operator rather than silently re-deciding. Only run the full selection when no
`AI-SPEC.md` decision exists. Adjust the `## Constraints` MUST at `:168` and the
`## Output Templates` deliverable at `:190` to match (deliver "the AI-SPEC stack
decision plus validation", not an independent trade-off analysis, on the deferring
path).

**Acceptance:** with an `AI-SPEC.md` Section 2 present, `rag-architect` names the
recorded stack and does not produce a competing selection; with none present, its
existing selection flow runs unchanged.

**File-conflict note:** 2.18 also edits `rag-architect/SKILL.md:190`. Same track or a
later wave — never in parallel.

---

## 2.15 — `skills/ship/SKILL.md:124` — single-cause diagnosis of a multi-cause symptom

**Fix:** replace the asserted single cause with the actual candidate set, or drop the
cause claim and keep the remedy.

**Bug (surfaced by the M2 fix wave's structural sweep; same class as the bugfix-wave
edge case fixed in 2.2):** Step 7 (Version bump) line 124 reads:

> **Classify state:** compare the branch's VERSION against `<base>`'s (`git show
> origin/<base>:VERSION`). Already bumped → skip the bump but verify VERSION and
> manifest agree; **a mismatch means a manual edit** — reconcile before continuing.

A VERSION/manifest mismatch does *not* mean a manual edit. A merge that took one side
of VERSION and the other side of the manifest, a release script that failed between its
two writes, or a revert that touched one file produce the identical symptom. Naming one
cause authoritatively sends the operator looking for a person to blame instead of
reading the history — and `ship` itself mandates writing both files together three
lines later (`:126`: "never just one of them"), which is precisely the invariant a
failed script breaks.

**Fix:** state the symptom and the resolution without asserting a single cause — e.g.
"a mismatch means the two drifted (a partial merge, a failed release script, a revert,
or a manual edit); check `git log` for the last write to each and reconcile before
continuing." Cause-listing is the fix, not cause-guessing.

**Acceptance:** `ship:124` no longer asserts a unique cause for the mismatch and points
at the evidence needed to identify the real one.

---

## 2.16 — `agents/design-reviewer.md:16,235-237` (dev-kit-core) — self-reported field consumed as proof

**Fix:** re-check `ui-auditor`'s `needs_human_review` flagging rather than treating the
carried-forward list as complete.

**Bug (surfaced by the M2 fix wave's structural sweep; same class as 2.5 — and note the
provenance: `needs_human_review` is the flag **1.11 introduced**, so the class we
created there already has a known instance):** `design-reviewer.md:16` instructs:

> **Carry forward `## Needs Human Review`.** Each UI-REVIEW.md ends with a `## Needs
> Human Review` section listing the findings `ui-auditor` marked
> `needs_human_review: true` … Collect them across all phases into a working list
> before Phase 1, resolve each one against the live site, and give every one an
> explicit verdict in your report.

and `:237` makes the report section mandatory, closing with "`ui-auditor` flagged it
precisely because only this pass can answer it."

Both treat `ui-auditor`'s self-report as the **complete** set. The duty is airtight in
one direction — nothing already flagged may be dropped — and absent in the other:
nothing checks for items that *should* have been flagged and weren't. A `ui-auditor`
run that under-flags (the failure mode the flag exists to prevent) produces a short
`## Needs Human Review` list, `design-reviewer` resolves every item on it, and both
reports read as clean. `:16` even names the population most at risk — "Phases whose
audit ran code-only (no dev server) typically contribute the most of these" — which is
exactly where a static-only pass is least able to judge what needed a live look.

**Fix:** keep the carry-forward duty as-is and add a re-check alongside it: for phases
whose audit ran code-only, and for any pillar scored 2-3 with no corresponding
carried-forward item, independently judge against the live site whether the finding
turns on taste/brand-fit/feel — and if so, treat it as carried-forward even though it
wasn't flagged. Report added items distinctly from flagged ones so under-flagging in
`ui-auditor` stays visible instead of being silently absorbed.

**Acceptance:** `design-reviewer`'s Carried-Forward section distinguishes items
`ui-auditor` flagged from items this pass added on its own, and the agent's own
instructions no longer treat the upstream list as exhaustive.

**Ordering:** land after or with 1.15 — 1.15 changes the `UI-REVIEW.md` findings format
this fix reads against.

---

## 2.17 — `skills/writing-plans/plan-document-reviewer-prompt.md` — orphaned asset, decide before fixing

**This is a decision item, not a direct fix.** `plan-document-reviewer-prompt.md`
carries a Class-B defect at `:38-49`, but nothing in `plugins/` references or
dispatches it — re-confirmed via `grep -rn "plan-document-reviewer" plugins/`, zero
hits outside the file itself. There is no consumer to fix the content against, so the
first step is choosing one of:

1. **Wire it in** — if `writing-plans` was meant to dispatch a plan-document-reviewer
   subagent using this template and the integration was simply never added, add the
   reference/dispatch call, then fix the Class-B content defect at lines 38-49 as a
   follow-up.
2. **Delete it** — if the template was superseded or abandoned, remove the file
   instead of polishing content nothing will ever read.

**Evidence favours (2), delete.** `writing-plans/SKILL.md:150-152` heads its review
step `## Self-Review` and states the opposite design decision explicitly: *"After
writing the complete plan, look at the spec with fresh eyes and check the plan against
it. **This is a checklist you run yourself — not a subagent dispatch.**"* The four
checks that follow (`:154-160` — spec coverage, placeholder scan, type consistency,
signal honesty) cover the same ground as the orphaned template's four-row "What to
Check" table, and `:162` closes the loop inline ("fix them inline. No need to
re-review"). On the pipeline path the reviewer role is already owned by
`gate-plan-review` and `plan-review-goal-backward` (`SKILL.md:92`, `:120`, `:132`). The
template isn't merely unwired — it is the discarded alternative to a decision the skill
made deliberately. Wiring it in would require reversing `:152` first.

**Acceptance:** either (a) `writing-plans` (or another skill) demonstrably dispatches
this template and its content defect is fixed, or (b) the file is deleted and no
reference to it remains.

---

## 2.18 — 6 skills name a diagram deliverable but never invoke `skills/diagram`

**Needs sizing before it is scheduled — and may be correct as-is.** Confirm per asset
before touching.

**Bug (surfaced by the M2 fix wave's structural sweep; weaker than 2.8 — a bare
deliverable mention, not restated mechanics):** six skills require a diagram as an
output without routing to the skill that owns diagram production. Verified live:

| Asset | Line | Text |
|---|---|---|
| `dev-kit-backend/skills/api-designer` | `:22` | "sketch entity diagram before writing any spec" |
| `dev-kit-backend/skills/api-designer` | `:205` | "Resource model and relationships (diagram or table)" |
| `dev-kit-infra/skills/cloud-architect` | `:211` | "Architecture diagram with services and data flow" |
| `dev-kit-backend/skills/microservices-architect` | `:3`, `:155` | "produces service boundary diagrams…"; "Service boundary diagram with bounded contexts" |
| `dev-kit-data-ai/skills/rag-architect` | `:190` | "System architecture diagram (ingestion + retrieval pipelines)" |
| `dev-kit-product/skills/growth-loops` | `:93` | "Loop diagram with metrics at each step" |
| `dev-kit-infra/skills/network-engineer` | `:143` | "Review architecture diagrams" |

`network-engineer:143` is very likely a **false positive** — "Review architecture
diagrams" consumes a diagram as input, it does not produce one. `api-designer:205`
("diagram **or table**") is optional by construction. Neither should be edited just to
make the sweep look complete.

**Fix:** per asset, where the skill genuinely *produces* a diagram as a required
deliverable, add a one-line delegation to `skills/diagram` (the pattern 2.8 established
for `architecture-designer` — delegate mechanics, don't restate them). Where the
diagram is an input, optional, or the mention is descriptive frontmatter, leave it
alone and record it as checked-and-correct. Uniform *treatment*, not uniform *text*.

**Acceptance:** every asset in the table above has been individually assessed; each is
either delegating to `skills/diagram` or recorded with a one-line reason it does not
need to.

**File-conflict note:** 2.14 also edits `rag-architect/SKILL.md`. Same track or a later
wave — never in parallel.

---

## 2.19 — Ambiguous instances of the 2.2 / 2.5 defect classes — confirm before touching

**Flagged rather than guessed at.** Each of these resembles a class already fixed
elsewhere but is hedged or partly mitigated in place. Confirm the defect is real before
editing; recording one as correct-as-is is a valid outcome.

**Single-cause class (same as 2.15 / 2.2)** — remedy-shaped and already hedged:

| Asset | Line | Note |
|---|---|---|
| `dev-kit-mobile/skills/react-native-expert` | `:30`, `:32` | "Metro bundler errors → clear cache…", "Android build fails → check `adb logcat` or Gradle output…" — under `### Error Recovery`; each names a diagnostic step before the remedy, which is the mitigation. |
| `dev-kit-mobile/skills/flutter-expert` | `:125` | "Build fails after adding package \| Incompatible dependency version \| Run `flutter pub upgrade --major-versions`" — a troubleshooting **table** whose middle column is explicitly a likely cause, not an assertion. |

**Self-report class (same as 2.16 / 2.5)** — each already partly mitigated:

| Asset | Line | Existing mitigation |
|---|---|---|
| `dev-kit-core/skills/cso` | `:263` | Parallel verification subagents score independently; the fallback path requires the note "Self-verified", making the weaker evidence visible. |
| `dev-kit-core/skills/design-consultation` | `:352-355` | Per-variant subagents self-report against "the same quality bar as the Phase 5 preview"; the comparison board that follows is a de facto human review gate. |
| `dev-kit-core/skills/document-release` | `:380-390` | External review engine with a documented fallback chain, and the step is explicitly labelled "best-effort" — the caveat is already stated. |

**Fix:** assess each row individually. Where the hedge or mitigation genuinely closes
the gap, record it as checked-and-correct with a one-line reason and change nothing.
Where it does not, apply the same fix shape used for its parent class (2.15 for
single-cause; 2.16 for self-report). Do **not** apply a uniform edit across the table.

**Acceptance:** each of the seven line references above carries an explicit verdict —
fixed (with the edit) or correct-as-is (with the reason) — and no row is left
unassessed.
