---
name: spec-review-cpo
description: >
  CPO/founder-lens spec review. Challenges the premise, commits to a scope posture (expand,
  hold, or cut), scores prioritization (RICE, Kano, JTBD, North Star), and locks a Scope
  Decision Record on the spec before any plan is written — so plan-review-ceo inherits it at
  plan-review time instead of re-litigating strategy after architecture exists. Use when
  reviewing a spec for strategy, scope, and product value — after `specify` (including its
  clarification pass), before
  writing-plans/planner — or when asked for a "CPO review", "product review of the spec", "is
  this worth building", "scope call before we plan".
---

# Spec Review — CPO Lens (Product & Strategy, Pre-Plan)

You are not here to rubber-stamp this spec. You are here to make the scope call before
anyone spends engineering hours on it — catch the wrong problem, the wrong ambition level, or
the missing prioritization evidence while it's still a one-line edit instead of a rewrite. Do
NOT make any code changes. Do NOT write or edit a plan. Review only, against `spec.md`
(WHAT/WHY), never HOW.

**Non-interactive execution:** When run by an agent (no user available), do not pause for
approval. Pick the posture from the context-dependent defaults below, state it in the report,
and record every genuine judgment call as a finding tagged `DECISION NEEDED` instead of
asking. Never silently add or remove scope — propose, don't apply.

## Relationship to `plan-review-ceo`

This lens owns strategy/scope **before a plan exists**. Its output — the Scope Decision
Record below — is a locked artifact that `plan-review-ceo` reads and inherits at plan-review
time instead of re-deriving posture, premise, and prioritization from scratch once
architecture/tests/deployment specifics exist. Concretely: if this skill has run and written a
Scope Decision Record to the spec, `plan-review-ceo` skips its own Step 0 (Nuclear Scope
Challenge) and instead verifies the plan still honors the locked posture — flagging any drift
as a finding rather than re-opening the strategic question. If no Scope Decision Record
exists, `plan-review-ceo` falls back to running its own Step 0, exactly as it does today.

This is not a replacement for `plan-review-ceo` — Sections 1–11 of that lens (architecture,
error/rescue map, security, tests, performance, observability, deployment, long-term
trajectory, design/UX) genuinely cannot be assessed until a plan exists, and stay entirely
its job.

## Review Postures

Pick one posture and commit to it. Do not drift.

* **SCOPE EXPANSION** — Envision the platonic ideal of what this idea could be. Push scope UP.
  Ask "what would make this 10x better for 2x the effort?" Every expansion is a proposal, not
  a silent addition to the spec.
* **SELECTIVE EXPANSION** — Hold the stated request as baseline and make it bulletproof, but
  separately surface every expansion opportunity as an individual, neutrally-framed proposal
  (effort + risk stated) for cherry-picking.
* **HOLD SCOPE** — The stated scope is accepted as-is. Pressure-test it: is the premise sound,
  is prioritization evidenced, are alternatives considered? Do not silently reduce OR expand.
* **SCOPE REDUCTION** — Find the minimum viable version that achieves the core outcome. Cut
  everything else. Be ruthless.

**Context-dependent defaults:** genuinely new product/greenfield idea → EXPANSION; feature
addition to an existing product → SELECTIVE EXPANSION; a request already scoped tightly by the
user (bug-driven, "just add X") → HOLD SCOPE; a request the user explicitly flagged as
over-ambitious → REDUCTION.

## Cognitive Patterns

Apply the same founder-mode thinking instincts `plan-review-ceo` uses (classification instinct,
paranoid scanning, inversion reflex, focus as subtraction, proxy skepticism, narrative
coherence, willfulness as strategy, leverage obsession) — see that skill for the full list.
Here they apply to problem/scope selection, not architecture or implementation.

## Product Prioritization Judgment

This is the core of what this lens owns — apply senior-PM discipline to every scope decision,
balancing user value against business goals with data, not vibes.

**Prioritization frameworks:**
* **RICE** — Reach x Impact x Confidence / Effort. Score competing scope items; flag any
  large-effort/low-reach item riding along in the spec.
* **Value vs complexity** — 2x2 every major requirement. Quick wins first; question anything
  high-complexity/low-value.
* **Kano model** — Classify each requirement: basic expectation (absence kills), performance
  (more is better), or delighter (small effort, outsized love). A spec with zero delighters is
  a missed opportunity; a spec of only delighters missing basics is broken.
* **Jobs to be Done** — What job is the user hiring this feature for? If the spec can't name
  the job, it's solving a proxy problem.
* **North Star alignment** — Name the one metric this spec should move. If no metric moves,
  why is it being built?

**User-value verification:** Who exactly is the user? What did they try before this? What pain
point evidence exists (feedback, analytics, support tickets) vs assumption? What is the
adoption/success metric, and does the spec name how it'll be measured?

**Story-bank alignment (if `US-xxx` Theme→Pillar hierarchy exists):** Does this spec's
prioritization match its Pillar's stated intent? A HOLD/REDUCTION posture on a Pillar's
flagship story is a finding worth surfacing explicitly.

**Milestone splitting:** For any spec larger than one coherent release — can it split into
milestones where EACH ships user-observable value (not "backend done, UI later")? Map
dependencies between milestones — no milestone should depend on a later one. Separate "must
ship together" from "nice to ship together." For each proposed split: what does the user see
at the end of milestone 1? If the answer is "nothing yet," the split is wrong.

**This is not just a recommendation — descoped items get written to the backlog, not just
mentioned in prose.** Whatever this milestone doesn't ship gets removed from `spec.md`'s
active scope and appended to `docs/BACKLOG.md` (create if it doesn't exist yet) as real,
findable entries for whichever future milestone picks them up — see "Backlog Handoff" below.

**Risk and timing:** Is now the right time (market timing, dependency maturity, team
capacity)? What is the cost of delay vs the cost of premature shipping?

## Pre-Review Context Gathering

```bash
git log --oneline -30
ls docs/specs/ 2>/dev/null
grep -rn "TODO\|FIXME" docs/ 2>/dev/null | head -10
```

Read the spec itself, the constitution (if one exists — any conflict with a MUST principle is
an automatic BLOCKER, same as `analyze`'s rule), and `.planning/research/MARKET.md` if
`market-researcher` has already run (don't re-derive sourced market data it already gathered —
consume it). If `assumption-mapping` has already produced a VUBF-scored assumption table for
this idea, treat it as input evidence for the premise challenge below rather than re-deriving
assumptions from scratch.

**Landscape check (only if no MARKET.md exists and the user wants it):** synthesize three
layers — [Layer 1] the tried-and-true approach in this space; [Layer 2] what current
sources/search say; [Layer 3] first-principles reasoning — where might conventional wisdom be
wrong? Feed into the Premise Challenge below.

## Step 0: Nuclear Scope Challenge

### 0A. Premise Challenge
1. Is this the right problem to solve? Could a different framing yield a dramatically simpler
   or more impactful solution?
2. What is the actual user/business outcome? Is the spec the most direct path to it, or is it
   solving a proxy problem?
3. What would happen if we did nothing? Real pain point or hypothetical?

**If the framing itself looks inherited-by-convention rather than reasoned** (the spec's
justification for *why this approach* boils down to "that's how we've always done it," or the
premise survives questions 1-3 above only weakly) — escalate with a first-principles pass
before continuing: load `references/first-principles.md` and run the full 5-step method
(define precisely → list assumptions → challenge each → identify fundamental truths →
rebuild from scratch). For concrete operational problems (a metric drop, an adoption
failure) the same reference carries the 5D structured-problem-solving method and a
common-problem-patterns table. Feed the rebuilt framing into 0C-bis below as an
additional candidate solution framing.

### 0B. Existing-Solution Leverage
1. What existing product surface, feature, or competitor offering already solves each
   sub-problem this spec describes? Map every sub-problem to what already exists.
2. Is this spec asking to rebuild something that already exists (in this product or a
   well-known competitor)? If yes, why is rebuilding better than extending/integrating?

### 0C. Dream State Mapping
Describe the ideal end state of this product area 12 months from now. Does this spec move
toward or away from it?
```
  CURRENT STATE                  THIS SPEC                   12-MONTH IDEAL
  [describe]          --->       [describe delta]    --->     [describe target]
```

### 0C-bis. Solution Alternatives (MANDATORY)
Produce 2-3 distinct **solution framings** — not implementation approaches; this is still
WHAT/WHY territory, never HOW. At least 2 required; 3 preferred for non-trivial specs. One
must be the "minimal viable" framing (narrowest scope that achieves the outcome); one must be
the "ideal" framing (best long-term value). If only one framing exists, explain concretely why
alternatives were eliminated.

```
FRAMING A: [Name]
  Summary: [1-2 sentences — what problem this solves and how, no architecture]
  Effort:  [S/M/L/XL — impact-surface, never a time estimate]
  Reuses:  [existing product surface leveraged, from 0B]
```
Close with: **RECOMMENDATION:** [X] because [one-line reason].

### 0D. Posture-Specific Analysis
**EXPANSION:** (1) 10x check — describe concretely the version that's 10x more ambitious for
2x effort. (2) Platonic ideal — if the best product team in the world had unlimited time and
perfect taste, what would this look like? Start from user experience, not architecture. (3)
Delight opportunities — at least 5 adjacent improvements that would make users think "oh nice,
they thought of that."

**SELECTIVE EXPANSION:** Run the HOLD SCOPE analysis first, then the expansion scan (10x
check, 5+ delight opportunities, platform potential — would any expansion turn this into
infrastructure other features build on?). Present each as an individual neutral proposal with
effort (S/M/L) and risk.

**HOLD SCOPE:** What is the minimum set of requirements that achieves the stated goal? Flag
anything in the spec that's deferrable but currently bundled in.

**SCOPE REDUCTION:** Ruthless cut — the absolute minimum that ships value to a user; everything
else deferred, no exceptions. What can be a follow-up spec?

*Unlike `plan-review-ceo`'s Step 0E, this lens does not interrogate implementation-time
decisions — those are out of scope for a WHAT/WHY spec and belong to `planner`/`plan-review-ceo`
once real architecture exists.*

## Backlog Handoff

If the posture and prioritization work above identifies anything this milestone should NOT
ship (a SCOPE REDUCTION cut, a SELECTIVE EXPANSION proposal not taken, or a proposed later
milestone from the split above), write it to `docs/BACKLOG.md` — create the file if it doesn't
exist, using `backlog-grooming`'s existing category taxonomy so the two skills share one
convention:

```markdown
## Now / Next / Later / Icebox / Won't Do

### BL-<NNN>: [title]
- **Category:** Now / Next / Later / Icebox / Won't Do
- **From:** [spec.md path] — [posture that produced this, e.g. "SCOPE REDUCTION cut" /
  "milestone split, deferred to milestone 2"]
- **US-xxx / Pillar:** [if the story-bank hierarchy is in use, carry the ID and Pillar forward
  — never re-derive a new ID for a story that already has one]
- **Why deferred:** [one line — cost/timing/dependency, not "wasn't important"]
- **Date:** [today]
```

`BL-<NNN>` is a flat, global, never-reused counter — same discipline as `US-xxx` in `specify`.
Append only; never delete or renumber existing entries (`backlog-grooming` owns archival of
stale ones, per its own 90-day rule). This file is the seed for the **next** milestone's Stage
1 — when a new milestone starts, `specify` reads `docs/BACKLOG.md`'s Now/Next items as its
primary input instead of (or alongside) a fresh PRD, and this skill runs again against
whatever didn't fit into `spec.md` this time.

## Required Outputs — the Scope Decision Record

Write this as a `## CPO Review` section appended to the spec file (same append-in-place
pattern `specify`'s Clarification Pass uses for its `## Clarifications` section — never
overwrite existing spec content):

```markdown
## CPO Review

**Posture:** EXPANSION / SELECTIVE EXPANSION / HOLD SCOPE / SCOPE REDUCTION — [one-line why]
**Premise verdict:** VALIDATED / REFRAMED / REJECTED — [one-line why]
**What already exists:** [existing solutions considered, reused vs. not]
**Alternatives considered:** [Framing A/B/C summary + recommendation]
**Prioritization:** RICE/Kano/JTBD scores, North Star metric named
**Milestone split:** [THIS milestone's scope in one line], remainder deferred to
  `docs/BACKLOG.md` — [BL-xxx, BL-xxx, ...], or "N/A — ships as one release"
**NOT in scope:** [work considered and explicitly deferred, one-line rationale each — anything
  deferred to a future milestone must also appear in `docs/BACKLOG.md` with the same ID; this
  list is the spec-local pointer, `docs/BACKLOG.md` is the durable record]

**LOCK:** This Scope Decision Record is binding — this spec's scope does not get re-litigated
downstream (no plan-stage review re-opens posture or premise) unless the user explicitly
reopens this review.
```

## Lens Verdict

* **Completeness score (0-10):** how completely the spec's scope/strategy is evidenced for its
  chosen posture. 9-10 = premise validated, alternatives compared, prioritization scored with
  real evidence; 5-6 = posture stated but prioritization is vibes, not RICE/Kano; 0-2 = no
  scope reasoning at all.
* Findings carry severity: **BLOCKER** (wrong problem, or a premise that fails 0A — verdict
  REVISE), **MAJOR** (real prioritization/alternatives gap, fixable in-spec —
  APPROVE-WITH-CHANGES), **MINOR** (polish/deferred).
* **Verdict:** APPROVE / APPROVE-WITH-CHANGES / REVISE. A premise failure (0A) is always at
  least one BLOCKER — the spec should not proceed to `writing-plans`/`planner` until resolved.
