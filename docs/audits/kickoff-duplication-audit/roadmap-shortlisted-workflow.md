# Roadmap: shortlisted backlog

Ideas surfaced during review that aren't yet folded into `ROADMAP.md`'s milestones —
candidates for a future milestone once scoped.

---

## 1. Decouple output-format contracts from named consumers

**Where:** `agents/pattern-mapper.md:66-76` (`<downstream_consumer>` block), and
potentially any other asset that names a specific downstream skill/agent instead of
stating a consumer-agnostic requirement.

**Problem:** `ROADMAP.md` item 1.2 fixes the immediate bug (pattern-mapper's
`<downstream_consumer>` block names `planner` as the consumer of `PATTERNS.md`, but
the real current consumer is `plan-review-goal-backward` — see
`RE-VERIFICATION.md:16`). That fix is a rename, not a structural one: it patches
today's staleness but leaves the same failure mode ready to recur the next time
consumers change.

The block conflates two things that should be separated:
- **Format/quality bar** (durable) — e.g. "cite concrete `file.ts:12-25` patterns,
  not abstract prose." This is what actually shapes pattern-mapper's output and is
  true regardless of who reads `PATTERNS.md`.
- **Consumer identity** (`planner`, `plan-review-goal-backward`) — pure metadata with
  no effect on pattern-mapper's behavior. Consumers already know how to interpret
  `PATTERNS.md` from their own prompts; they don't need the producer to predict their
  needs. Naming a specific reader is exactly the part that silently rotted.

**Proposed fix:** Rewrite `<downstream_consumer>` as a consumer-agnostic output-format
spec (keep the "be concrete, not abstract" guidance and the section-by-section shape),
and drop the named-consumer table. Nothing left to go stale, because nothing points at
a specific reader anymore.

**Broader implication:** this is the same shape of bug Milestone 3
(`ROADMAP.md:96-112`, "ids in, paths out") is chasing for path strings — a producer
hardcoding a pointer to something that can change out from under it — just applied to
consumer *identity* instead of file *paths*. Worth a repo-wide sweep (grep for assets
that name a specific downstream skill/agent by name rather than stating a
consumer-agnostic contract) alongside or after Milestone 3.

**Status:** not scoped into a milestone yet. Candidate for Milestone 2 or 3 once
sized.

---

## 2. Retire global `PRD.md` — `specify` becomes the entry point for every milestone

**Where:** `docs/global/requirements/PRD.md` (`references/doc-sitemap.md:38`),
`skills/specify/SKILL.md`, `agents/roadmapper.md` (1.4 above), and Stage 0/1 of
`gwd-pipeline-on-devkit.md:31-41`.

**Problem:** `PRD.md` is filed as a **global, project-lifetime** doc, but in practice
it is only ever live input once — `gwd-pipeline-on-devkit.md:34` says "a first
milestone starts from a PRD; every milestone after that starts from
`docs/global/requirements/BACKLOG.md`." No dev-kit asset actually *authors* it in the
normal path (see the PRD-creator research above): it's either brought by the operator
from outside the pipeline, or recovered on two exception paths
(`spec-miner`→`gate-reverse-engineer` for legacy code, `doc-classifier`→
`doc-synthesizer` for an existing doc pile). Meanwhile `docs/global/project/PROJECT.md`
already claims the identical role — "project identity, goals, decisions,"
project-lifetime. Two docs both claiming to be the durable whole-product north star is
the same duplication shape the rest of this audit exists to cut, just one tier up from
the KICKOFF findings.

Root-cause note from the `agents/roadmapper.md` REQUIREMENTS.md investigation (1.4):
dev-kit's `roadmapper` is a near-verbatim port of `get-shit-done`'s `gsd-roadmapper`
agent, which correctly presupposes `REQUIREMENTS.md` exists — because GSD has a
first-class **orchestrator** (`workflows/new-project.md:1109-1162`) that generates and
commits `REQUIREMENTS.md` *before* spawning the roadmapper subagent. dev-kit has no
orchestrator layer (`gwd-pipeline-on-devkit.md:11-18` — deliberately not-yet-built), so
that create-step had nowhere to land when the agent was ported. The same
orchestrator-shaped gap is what makes `PRD.md` an input nothing produces.

**Proposed fix:**
1. Retire `docs/global/requirements/PRD.md` from the sitemap contract entirely — don't
   relocate it to a milestone tier, delete the concept. `PROJECT.md` already owns
   "what is this product, why, for whom" at the global tier.
2. `specify` (Stage 1) stops presupposing a pre-existing `PRD.md` and instead consumes
   the operator's raw input directly for milestone 1 — exactly the same shape it
   already uses for milestone 2+ via `BACKLOG.md`'s Now/Next items. This removes the
   "milestone 1 is a special case" asymmetry called out at
   `gwd-pipeline-on-devkit.md:31-36`.
3. No new milestone-scoped "PRD" file is needed to replace it: `SPEC/spec.md` (per
   feature) plus the milestone's `REQUIREMENTS.md` rollup (once 1.4 lands) already
   *are* the milestone-scoped requirements artifact — that's their job today.
   Introducing a parallel PRD-shaped file per milestone would just reproduce the same
   duplication one tier down.
4. `docs/global/requirements/` keeps `BACKLOG.md` (cross-milestone durable queue) and
   `TODOS.md` — both stay exactly as they are; only `PRD.md` goes.
5. Update the two exception paths (`gate-reverse-engineer`, `doc-synthesizer`) so a
   recovered/ingested "PRD" is written as milestone 1's seed input (folded into
   `specify`'s intake) rather than as a persisted `docs/global/requirements/PRD.md`.

**Explicitly out of scope:** a phase-level requirements document. A phase already
inherits its slice of requirements via the milestone `REQUIREMENTS.md` traceability
table (`REQ-01 → Phase 2`) plus `PHASE/CONTEXT.md`/`PATTERNS.md`/`RESEARCH.md` for
phase-specific context — adding a phase-scoped "mini-PRD" would recreate the same
duplication one tier further down and was rejected during scoping.

**Broader implication:** this is a structural change to an "Approved" contract
(`references/doc-sitemap.md`), not a line-item asset bug — it touches the sitemap, the
migration map, `specify`'s SKILL.md, and Stage 0/1 of the pipeline walkthrough
together. Should land as its own milestone (after or alongside Milestone 3's
"ids in, paths out" flip, since both are contract-shaped changes) rather than folding
into Milestone 1.

**Status:** not scoped into a milestone yet. Candidate for its own milestone once
sized — depends on 1.4 (roadmapper REQUIREMENTS.md creation) landing first so
`REQUIREMENTS.md` is reliably the milestone's canonical requirements artifact before
`PRD.md` is retired.

---

## 3. Lane skills become self-sufficient on TDD via the constitution — supersedes `ROADMAP.md` 1.7

**Where:** every lane skill (`scope: implementation` specialist skills across all
`plugins/*/skills/`), `skills/constitution/constitution-template.md`, and
`KICKOFF.md:564-570` + `:889` (devkit-pipeline).

**Problem (REPORT.md D2, `ROADMAP.md` 1.7):** KICKOFF.md hardcodes an unconditional
test-first mandate — "execute the plan under the `test-driven-development` skill — write
the failing tests first, then implement to green," reinforced verbatim at the convergence
re-run (`:889`). But lane skills a track loads alongside it order the same work oppositely
in their own numbered `## Core Workflow`, e.g. `python-pro/SKILL.md:32` (Implement, then
Test), `flutter-expert/SKILL.md:33` (Widgets/code, then Test), `django-expert/SKILL.md:35`
(Test is step 6 of 6). Grep confirms none of them contain any TDD/red-green/test-first
language to reconcile against — the skill is the more specific, more procedural document,
so it silently wins, and the pipeline's headline "test-first" guarantee goes unenforced in
exactly the tracks that most need it.

The deeper issue underneath D2: TDD is not actually a universal mandate.
`constitution-template.md`'s "III. Test-First (NON-NEGOTIABLE)" is only an **example**
principle slot — a project may or may not adopt it. KICKOFF applying it unconditionally to
every project, regardless of what that project's own constitution says, is the real defect;
patching only the three named lane skills to defer-when-co-loaded would fix the symptom
without fixing why the mismatch exists.

**Proposed fix — three parts, single source of truth (`docs/global/project/constitution.md`):**

1. **Lane skills check the constitution themselves.** Add one canonical line directly
   after each affected skill's `## Core Workflow` numbered list (before `## Reference
   Guide`, no renumbering of existing steps):

   > If this project's constitution (`docs/global/project/constitution.md`) declares a
   > Test-First/TDD principle, load `test-driven-development` and defer to its red-green
   > ordering — write the failing test for each unit before implementing it, superseding
   > this workflow's own Test-step position. Otherwise, follow the order below as written.

   This makes each skill correct standalone, not just when dispatched through KICKOFF —
   most of these skills are invoked directly by users with no pipeline in the loop at all,
   and a pipeline-only fix would leave that path unreconciled.

2. **KICKOFF's hardcoded mandate gets cut, not fixed.** Once the lane skill owns the
   decision, `KICKOFF.md:564-570` and `:889` become exactly the kind of "guide restates
   what the asset now handles itself" duplication the rest of this audit exists to remove.
   No pipeline-side gating or injection logic is needed — step 8 can just say "use the
   appropriate lane skill" as it already does. This folds into Milestone 5's rewrite as a
   confirmed cut, not a new devkit-pipeline feature.

3. **Sweep the full lane roster, not just the three (or the 25) already spot-checked.**
   Walk every `scope: implementation` specialist skill across every plugin and verify each
   one individually — insert the line only where a skill's own workflow actually authors
   tests in an order that could conflict. Confirmed-needed so far (numbered workflow, a
   terminal/late "Test" step, zero TDD language): `python-pro`, `flutter-expert`,
   `django-expert`, `csharp-developer`, `dotnet-core-expert`, `fastapi-expert`,
   `golang-pro`, `laravel-specialist`, `nestjs-expert`, `spring-boot-engineer`,
   `kotlin-specialist`, `react-native-expert`, `swift-expert`, `game-developer`,
   `salesforce-developer`, `angular-architect`, `javascript-pro`, `react-expert`,
   `typescript-pro`, `vue-expert-js`, `vue-expert`, `wordpress-pro`, `cli-developer`,
   `mcp-developer`, `embedded-systems`. Checked and confirmed **not** needed so far (test
   step runs an existing suite/lint pass rather than authoring new tests, or the skill
   isn't an implementation lane at all): `cpp-pro`, `java-architect`, `php-pro`,
   `postgres-pro`, `rails-expert`, `rust-engineer`, `sql-pro`, `websocket-engineer`,
   `nextjs-developer`, `shopify-expert`, `atlassian-mcp`, `refactoring-specialist`
   (already TDD-aligned), `security-reviewer` (`scope: review`), `prompt-engineer`
   (`scope: design`), `sre-engineer` (borderline — its "Test resilience" step is chaos
   validation, not application TDD; leave out unless re-flagged). The goal is uniform
   *treatment*, not uniform *text*: every lane gets checked and operates the same way
   relative to the constitution, and a skill that genuinely has no authoring-order
   conflict is left alone — that is the correct outcome for it, not a gap.

**Explicitly out of scope (separate future idea, not part of this item):** generalizing
constitution-awareness to *all* skills for *any* governing principle (not just
Test-First/TDD). That's a materially bigger, more speculative initiative with no confirmed
defect behind it yet — logged here as a backlog idea, not folded in.

**Broader implication:** this supersedes `ROADMAP.md` item 1.7 as currently worded (which
undersold the roster as "4 lane skills … +grep for others" and implied a pipeline-side
fix). When this is folded back into `ROADMAP.md`, 1.7 should be rewritten to point here,
scoped as a dev-kit-only sweep (Milestone 1) plus one confirmed cut in devkit-pipeline
(Milestone 5) — no devkit-pipeline feature work required.

**Status:** not scoped into a milestone yet. Candidate to fold into `ROADMAP.md`
Milestone 1 (the sweep) once the full lane roster is verified, with the KICKOFF cut
riding along in Milestone 5.
