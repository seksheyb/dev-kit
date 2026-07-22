---
name: plan-review-eng
description: Engineering/architecture-lens plan review. Scope challenge, then four deep passes — architecture, code quality, tests, performance — with confidence-calibrated findings, a pre-emit verification gate, full test-coverage tracing, and macro-design review judgment (patterns, scalability, technology fit, technical debt, evolution path). Use when reviewing a plan for architectural soundness and test completeness — directly or via the plan-reviewer agent with lens=eng.
---

# Plan Review — Engineering Lens (Architecture & Tests)

Review this plan thoroughly before any code changes. For every issue, explain the concrete tradeoffs and give an opinionated recommendation. Do NOT make code changes. Review only.

**Non-interactive execution:** When run by an agent, do not pause for approval. Record each issue as a finding with the recommendation and tradeoffs; tag genuine either-way calls `DECISION NEEDED`. Never silently reduce or expand scope.

**Scope: the phase plan (`PHASE/<NN>-<MM>-PLAN.md`, where `PHASE` = `docs/milestones/<M>/phases/<NN>-<slug>/`), not the project SDD.** This is a Stage 7 lens — it reviews one phase's plan (task decomposition, the plan-delta's architecture, code quality, tests, performance) before that phase executes. The *project-level* architecture and technical strategy (`docs/global/architecture/SDD.md` plus the ADR bank at `docs/global/architecture/adr/`) are reviewed once, at Stage 2, by `sdd-review-cto`. Assess how this plan's choices fit the established design; don't re-litigate the system architecture here.

## Engineering Preferences (guide every recommendation)

* DRY is important — flag repetition aggressively.
* Well-tested code is non-negotiable; too many tests beats too few.
* "Engineered enough" — not under-engineered (fragile, hacky), not over-engineered (premature abstraction, unnecessary complexity).
* Err toward handling more edge cases; thoughtfulness > speed.
* Bias toward explicit over clever.
* Right-sized diff: smallest diff that cleanly expresses the change — but don't compress a necessary rewrite into a minimal patch. If the existing foundation is broken, say "scrap it and do this instead."
* ASCII diagrams for data flow, state machines, dependency graphs, pipelines, decision trees — in plans and in code comments for Models (state transitions), Services (pipelines), Controllers (request flow), Tests (non-obvious setup). Diagram maintenance is part of the change; flag stale diagrams even outside the immediate scope.

## Cognitive Patterns — How Great Eng Managers Think

1. **State diagnosis** — Teams are falling behind, treading water, repaying debt, or innovating; each demands a different intervention.
2. **Blast radius instinct** — "What's the worst case and how many systems/people does it affect?"
3. **Boring by default** — Every company gets about three innovation tokens. Everything else should be proven technology.
4. **Incremental over revolutionary** — Strangler fig, not big bang. Canary, not global rollout. Refactor, not rewrite.
5. **Systems over heroes** — Design for tired humans at 3am, not your best engineer on their best day.
6. **Reversibility preference** — Feature flags, A/B tests, incremental rollouts. Make the cost of being wrong low.
7. **Failure is information** — Blameless postmortems, error budgets, chaos engineering.
8. **Org structure IS architecture** — Conway's Law in practice; design both intentionally.
9. **DX is product quality** — Slow CI, bad local dev, painful deploys → worse software.
10. **Essential vs accidental complexity** — "Is this solving a real problem or one we created?"
11. **Two-week smell test** — If a competent engineer can't ship a small feature in two weeks, you have an onboarding problem disguised as architecture.
12. **Glue work awareness** — Recognize and value invisible coordination work.
13. **Make the change easy, then make the easy change** — Refactor first, implement second. Never structural + behavioral changes simultaneously.
14. **Own your code in production** — No wall between dev and ops.
15. **Error budgets over uptime targets** — Reliability is resource allocation.

When evaluating architecture, think "boring by default." When reviewing tests, think "systems over heroes." When a plan introduces new infrastructure, check whether it's spending an innovation token wisely.

## Macro-Design Review Judgment

System-level review discipline — evaluate designs at the macro level before drilling into code.

**Review method:** Start with the big picture, then drill into details. Cross-reference requirements. Consider alternatives. Assess trade-offs explicitly. Think long-term. Be pragmatic — balance ideal architecture with practical constraints. Document rationale for every recommendation.

**Architecture review checklist:** design patterns appropriate for the problem; scalability requirements actually met; technology choices justified; integration patterns sound; security architecture robust; performance architecture adequate; technical debt manageable; evolution path clear.

**System design:** component boundaries, data flow, API design quality, service contracts, dependency management, coupling vs cohesion, modularity. Pattern fit — is the chosen shape (monolith, microservices, event-driven, layered, hexagonal, DDD, CQRS) right for this team and this scale, or cargo-culted?

**Scalability assessment:** horizontal vs vertical scaling, data partitioning, load distribution, caching strategy, database scaling, message queuing, known performance limits.

**Technology evaluation** (for every new dependency, framework, or infrastructure piece): stack appropriateness, maturity, team expertise, community support, licensing, cost implications, migration complexity, future viability.

**Integration patterns:** API strategy, message patterns, event streaming, service discovery, circuit breakers, retry mechanisms, data synchronization, transaction handling across boundaries.

**Security architecture:** authentication design, authorization model, data encryption (at rest and in transit), network security, secrets management, audit logging, compliance requirements, threat modeling.

**Data architecture:** data model choices, storage strategy, consistency requirements, backup and archive policy, data governance, privacy compliance, analytics integration.

**Technical debt assessment:** architecture smells, outdated patterns, complexity metrics, maintenance burden, remediation priority. For legacy touchpoints prefer strangler pattern, branch by abstraction, parallel run.

**Evolutionary architecture:** favor reversible decisions, incremental evolution, and explicit architectural decision records. Principles: separation of concerns, single responsibility, interface segregation, dependency inversion, open/closed, DRY, KISS, YAGNI.

## Step 0: Scope Challenge (before any section review)

1. **Existing code leverage:** What existing code already partially or fully solves each sub-problem? Can outputs be captured from existing flows rather than building parallel ones?
2. **Minimum change set:** What is the minimum set of changes that achieves the stated goal? Flag any work deferrable without blocking the core objective. Be ruthless about scope creep.
3. **Complexity check:** If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts. Name what's overbuilt and propose a minimal version.
4. **Search check:** For each architectural pattern, infrastructure component, or concurrency approach the plan introduces: does the runtime/framework have a built-in? Is the chosen approach current best practice? Are there known footguns? If the plan rolls a custom solution where a built-in exists, flag it as a scope reduction opportunity. Annotate with [Layer 1] tried-and-true, [Layer 2] current-best-practice, [Layer 3] first-principles insight.
5. **TODOS cross-reference:** Read `docs/global/requirements/TODOS.md` if it exists. Deferred items blocking this plan? Bundleable without expanding scope? New work this plan creates that should be captured?
6. **Completeness check:** Is the plan doing the complete version or a shortcut? With AI-assisted coding, completeness (100% coverage, full edge cases, complete error paths) costs minutes, not days. If a shortcut saves human-hours but only minutes with AI assistance, recommend the complete version.
7. **Distribution check:** If the plan introduces a new artifact type (CLI binary, package, container image, app), does it include the build/publish pipeline, target platforms, and install path? Code without distribution is code nobody can use. If deferred, it must appear explicitly in "NOT in scope."

Once a scope call is made, commit fully — do not re-argue during later sections or silently drop planned components.

## Confidence Calibration (applies to every finding)

Every finding MUST include a confidence score (1-10):

| Score | Meaning | Display rule |
|-------|---------|-------------|
| 9-10 | Verified by reading specific code; concrete bug demonstrated | Show normally |
| 7-8 | High-confidence pattern match | Show normally |
| 5-6 | Moderate; could be a false positive | Show with caveat: "Medium confidence, verify" |
| 3-4 | Suspicious pattern, may be fine | Appendix only |
| 1-2 | Speculation | Only report if severity would be critical |

**Finding format:** `[SEVERITY] (confidence: N/10) file:line — description`

**Pre-emit verification gate:** Before any finding is promoted to the report:
1. **Quote the specific code line(s) that motivate the finding** — file:line plus verbatim text. If the finding is "field X doesn't exist on model Y," quote the lines of Y where the field would live. If "dict.get() might return None," quote the dict initialization. If "race between A and B," quote both A and B.
2. **If you cannot quote the motivating line(s), the finding is unverified** — force its confidence to 4-5 (appendix). Do not invent speculative confidence 7+.
3. **Framework-meta nudge:** When a symbol is generated by a framework metaclass, ORM Meta block, decorator, or migration history (Django Meta, Rails `has_many`/`scope`, SQLAlchemy `relationship`, TypeORM/Sequelize/Prisma), quote the meta-construct that creates the symbol — the verification is "I read the source that creates this symbol," not "I grepped for the name and didn't find it."

## The 4 Review Sections

**Anti-skip rule:** Never condense or skip any section regardless of plan type. If a section genuinely has zero findings, record "No issues found" — but you must evaluate it. At most 8 top issues per section.

### 1. Architecture Review
Evaluate:
* Overall system design and component boundaries.
* Dependency graph and coupling concerns.
* Data flow patterns and potential bottlenecks.
* Scaling characteristics and single points of failure.
* Security architecture (auth, data access, API boundaries).
* Whether key flows deserve ASCII diagrams in the plan or code comments.
* For each new codepath or integration point: one realistic production failure scenario and whether the plan accounts for it.
* **Distribution architecture:** if this introduces a new artifact, how does it get built, published, and updated? Is CI/CD part of the plan or deferred?
* Apply the Macro-Design Review Judgment section above at full depth here.

### 2. Code Quality Review
Evaluate: code organization and module structure; DRY violations (aggressive, with file:line references); error handling patterns and missing edge cases (call out explicitly — "what happens when X is nil? when the API returns 429?"); technical debt hotspots; over-engineered or under-engineered areas relative to the preferences; existing ASCII diagrams in touched files — still accurate after this change?

### 3. Test Review
100% coverage is the goal. Evaluate every codepath in the plan and ensure the plan includes tests for each. If tests are missing, add them to the plan — implementation should include full coverage from the start, not deferred.

**Test framework detection:** Read CLAUDE.md for a Testing section (authoritative if present). Otherwise detect from the repo (Gemfile/package.json/pyproject/go.mod/Cargo.toml; jest/vitest/playwright/cypress/rspec/pytest configs; test/, spec/, __tests__/ dirs). If none detected, still produce the coverage diagram; skip test generation.

**Step 1 — Trace every codepath in the plan.** For each planned component, follow the data: where does input come from (params, props, DB, API)? What transforms it? Where does it go? What can go wrong at each step (null, invalid input, network failure, empty collection)? Diagram every added/modified function, every conditional branch, every error path, every call into helpers (do THEY have untested branches?), every nil/empty/invalid-type edge.

**Step 2 — Map user flows, interactions, and error states.** Code coverage isn't enough. Full journeys (e.g., "click Pay → validate → API call → success/failure screen"); interaction edge cases (double-click/rapid resubmit, navigate away mid-operation, stale data/expired session, slow connection, two tabs same form); user-visible error states (clear message or silent failure? recoverable or stuck? no network / 500 / invalid server data?); empty/zero/boundary states (zero results, 10,000 results, single char, max-length input). A user flow with no test is as much a gap as an untested if/else.

**Step 3 — Check each branch against existing tests.** For each diagram branch, search for a test exercising it — both true and false paths of conditionals, the specific error condition of each handler, an integration/E2E test walking each journey. Quality rubric:
- ★★★ tests behavior with edge cases AND error paths
- ★★ correct behavior, happy path only
- ★ smoke test / existence check / trivial assertion

**E2E decision matrix:** RECOMMEND E2E [→E2E] for common user flows spanning 3+ components/services, integration points where mocking hides real failures, and auth/payment/data-destruction flows. RECOMMEND EVAL [→EVAL] for critical LLM calls, prompt template or tool-definition changes. STICK WITH UNIT for pure functions, side-effect-free helpers, single-function edge cases, obscure non-customer-facing flows.

**REGRESSION RULE (iron rule):** When the audit identifies a regression — existing behavior the diff modifies with no covering test, or a new failure mode for existing callers — a regression test is added to the plan as a critical requirement. No skipping. When uncertain whether a change is a regression, err on the side of writing the test.

**Step 4 — Output ASCII coverage diagram** including BOTH code paths and user flows, with [★ TESTED]/[GAP] markers, [→E2E]/[→EVAL] tags, and a coverage line:
```
COVERAGE: 5/13 paths tested (38%) | Code paths: 3/5 | User flows: 2/8
QUALITY: ★★★:2 ★★:2 ★:1 | GAPS: 8 (2 E2E, 1 eval)
```
Fast path: all paths covered → "Test review: all new code paths have coverage" and continue.

**Step 5 — Add missing tests to the plan.** For each GAP: what test file (match existing naming conventions), what it asserts (specific inputs → expected outputs), unit vs E2E vs eval, and for regressions flag **CRITICAL** with what broke.

For LLM/prompt changes: state which eval suites must run, which cases should be added, and what baselines to compare against.

### 4. Performance Review
Evaluate: N+1 queries and database access patterns; memory-usage concerns; caching opportunities; slow or high-complexity code paths.

## Required Outputs

* **"NOT in scope"** — work considered and explicitly deferred, one-line rationale each.
* **"What already exists"** — existing code/flows that partially solve sub-problems, and whether the plan reuses or unnecessarily rebuilds them.
* **Diagrams** — ASCII diagrams for any non-trivial data flow, state machine, or pipeline; plus which implementation files should get inline diagram comments.
* **Failure modes** — for each new codepath in the test diagram, one realistic production failure (timeout, nil reference, race, stale data) and whether (1) a test covers it, (2) error handling exists, (3) the user sees a clear error or a silent failure. No test AND no handling AND silent → **CRITICAL GAP**.
* **Worktree parallelization strategy** — skip (state "Sequential implementation, no parallelization opportunity") if all steps touch the same primary module or there are <2 independent workstreams. Otherwise produce: (1) dependency table (Step | Modules touched | Depends on — module/directory level, not file level); (2) parallel lanes (no shared modules + no dependency → separate lanes; shared module → same lane sequential; dependent steps → later lanes); (3) execution order (which lanes launch in parallel, which wait); (4) conflict flags where parallel lanes touch the same module directory.
* **Implementation tasks** — synthesize findings into a flat list of build-actionable tasks, each derived from a specific finding (no padding):
  ```
  - [ ] T1 (P1, human: ~2h / AI: ~15min) — <component> — <imperative title>
    - Surfaced by: <section — finding>
    - Files: <paths>
    - Verify: <test command or check>
  ```
  P1 blocks ship; P2 lands same branch; P3 is a follow-up TODO. If a section had zero findings, note "No new tasks from <section>."
* **Retrospective note** — if git history shows a prior review cycle touching the same areas, note it and review those areas more aggressively.

## Completion Summary

```
- Step 0: Scope Challenge — accepted as-is / reduced per recommendation
- Architecture: ___ issues | Code Quality: ___ issues
- Tests: diagram produced, ___ gaps | Performance: ___ issues
- NOT in scope: written | What already exists: written
- Failure modes: ___ critical gaps flagged
- Parallelization: ___ lanes (___ parallel / ___ sequential)
```

## Lens Verdict

* **Completeness score (0-10):** 9-10 = all four sections evaluated, coverage diagram complete, every finding confidence-scored and quote-verified; 5-6 = architecture reviewed but coverage tracing shallow; 0-2 = surface skim.
* Severity mapping: **BLOCKER** = critical gap (silent untested failure path), missing regression test on modified behavior, or unmitigated architectural failure scenario → REVISE. **MAJOR** = coverage gaps, unjustified new dependency, N+1/scaling issue with concrete evidence → APPROVE-WITH-CHANGES. **MINOR** = style, naming, deferred polish.
* **Verdict:** APPROVE / APPROVE-WITH-CHANGES / REVISE.
