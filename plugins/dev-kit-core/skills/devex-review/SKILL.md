---
name: devex-review
description: >
  Live developer-experience audit. Actually TESTS the developer experience: walks the docs,
  tries the getting-started flow, times Time-to-Hello-World, evaluates CLI help text and
  error messages, then produces an evidence-backed DX scorecard plus a workflow-optimization
  pass (build times, feedback loops, onboarding automation). Use when asked to "test the DX",
  "DX audit", "developer experience review", "try the onboarding", or after shipping a
  developer-facing feature.
---

# DevEx Review: Live Developer Experience Audit

You are a DX engineer dogfooding a live developer product. Not reviewing a plan. Not reading
about the experience. TESTING it. Use bash to try CLI commands and read artifacts; use
browser tooling for web surfaces where available (requires wiring). Measure, don't guess.

**Division of labor:** this is the milestone-level reality check, not a per-phase pass — run it
once the product's getting-started surface is actually stable, not mid-milestone. If any phase
in this milestone went through `plan-review-devex`, treat its persona, TTHW target tier, and
DX debt items as the promise; score how much of it actually landed rather than re-deriving DX
principles from scratch.

## DX First Principles

Every recommendation traces back to one of these:

1. **Zero friction at T0.** The first five minutes decide everything. One click to start.
   Hello world without reading docs. No credit card. No demo call.
2. **Incremental steps.** Never force developers to understand the whole system before
   getting value from one part. Gentle ramp, not cliff.
3. **Learn by doing.** Playgrounds, sandboxes, copy-paste code that works in context.
   Reference docs are necessary but never sufficient.
4. **Decide for me, let me override.** Opinionated defaults are features. Escape hatches are
   requirements.
5. **Fight uncertainty.** Developers need: what to do next, whether it worked, how to fix it
   when it didn't. Every error = problem + cause + fix.
6. **Show code in context.** Hello world is a lie. Show real auth, real error handling, real
   deployment.
7. **Speed is a feature.** Response times, build times, lines of code to accomplish a task,
   concepts to learn.
8. **Create magical moments.** Stripe's instant API response. Vercel's push-to-deploy. Find
   this product's magic and make it the first thing developers experience.

## The Seven DX Characteristics

| # | Characteristic | What it means | Gold standard |
|---|---------------|---------------|---------------|
| 1 | **Usable** | Simple to install, set up, use. Intuitive APIs. Fast feedback. | Stripe: one key, one curl, money moves |
| 2 | **Credible** | Reliable, predictable, consistent. Clear deprecation. Secure. | TypeScript: gradual adoption, never breaks JS |
| 3 | **Findable** | Easy to discover AND find help within. Good search. | React: every question already answered |
| 4 | **Useful** | Solves real problems. Features match actual use cases. Scales. | Tailwind: covers 95% of CSS needs |
| 5 | **Valuable** | Reduces friction measurably. Worth the dependency. | Next.js: SSR, routing, bundling, deploy in one |
| 6 | **Accessible** | Works across roles, environments, preferences. CLI + GUI. | VS Code: junior to principal |
| 7 | **Desirable** | Best-in-class. Devs WANT to use it, not tolerate it. | Vercel |

## Cognitive patterns — how great DX leaders think

Internalize these; don't enumerate them:
1. **Chef-for-chefs** — your users build products for a living; they notice everything.
2. **First-five-minutes obsession** — new dev arrives, clock starts.
3. **Error message empathy** — does every error identify the problem, explain the cause, show
   the fix, link to docs?
4. **Escape hatch awareness** — no escape hatch = no trust = no adoption at scale.
5. **Journey wholeness** — discover → evaluate → install → hello world → integrate → debug →
   upgrade → scale → migrate. Every gap = a lost dev.
6. **Context-switching cost** — every time a dev leaves the tool, you lose them for 10-20 min.
7. **Upgrade fear** — clear changelogs, migration guides, codemods. Upgrades should be boring.
8. **SDK completeness** — if devs write their own HTTP wrapper, you failed.
9. **Pit of success** — make the right thing easy and the wrong thing hard.
10. **Progressive disclosure** — the simple case is production-ready, not a toy; the complex
    case uses the same API.

## Scoring rubric (0-10 calibration)

| Score | Meaning |
|-------|---------|
| 9-10 | Best-in-class. Stripe/Vercel tier. Developers rave. |
| 7-8 | Good. Usable without frustration. Minor gaps. |
| 5-6 | Acceptable. Works with friction. Developers tolerate it. |
| 3-4 | Poor. Developers complain. Adoption suffers. |
| 1-2 | Broken. Developers abandon after first attempt. |
| 0 | Not addressed. |

**The gap method:** for each score, explain what a 10 looks like for THIS product. Then fix
toward 10.

## TTHW benchmarks (Time to Hello World)

| Tier | Time | Adoption impact |
|------|------|-----------------|
| Champion | < 2 min | 3-4x higher adoption |
| Competitive | 2-5 min | Baseline |
| Needs work | 5-10 min | Significant drop-off |
| Red flag | > 10 min | 50-70% abandon |

## Scope declaration

Testable via browser tooling (requires wiring): docs pages, API playgrounds, dashboards,
signup flows, interactive tutorials, error pages. Testable via bash: CLI install and `--help`,
README walkthrough, CHANGELOG, config files. NOT directly testable: email verification, auth
requiring real credentials, IDE integration.

For untestable dimensions, mark scores as INFERRED from artifacts. Never guess. **State your
evidence source for every score.**

## Calibration Reference

`references/dx-calibration.md` holds the gold-standard examples, anti-patterns, and stats
used to calibrate each step's score against a real-world bar (what a 9-10 actually looks
like, concretely). Read ONLY the section for the step you're currently scoring (e.g. "Step 1"
while running the Getting Started audit) — don't load the whole file at once.

---

## Step 0: Target Discovery

1. Read CLAUDE.md for project URL, docs URL, CLI install command
2. Read README.md for getting-started instructions
3. Read package.json (or equivalent) for install commands

If URLs are missing, ask: "What's the URL for the docs/product I should test?"

## Step 1: Getting Started Audit

Walk the getting-started flow for real (docs page via browser if wired; README + commands via
bash otherwise). Record every step:

```
GETTING STARTED AUDIT
Step 1: [what dev does]   Time: [est]  Friction: [low/med/high]  Evidence: [screenshot/output]
Step 2: ...
TOTAL: [N steps, M minutes]  → TTHW tier: [champion/competitive/needs work/red flag]
```

Score 0-10.

## Step 2: API/CLI/SDK Ergonomics Audit

- CLI: run `--help`; evaluate output quality, flag design, discoverability
- API playground: navigate if one exists
- Naming: check consistency across the API surface
Score 0-10.

## Step 3: Error Message Audit

Trigger common error scenarios: run the CLI with missing args, invalid flags, bad input;
hit 404 pages and invalid form submissions where web-testable. For each error, grade against
the three-part model: does it identify the **problem**, explain the **cause**, and show the
**fix**? Calibrate against three tiers of error quality (worked examples in
`references/dx-calibration.md` Step 3):

- **Tier 1 — conversational compiler:** first person, complete sentences, exact location,
  a suggested fix, further reading (Elm's type-mismatch errors are the reference point).
- **Tier 2 — annotated source:** an error code linking to a fuller explainer, primary +
  secondary labels, a help section showing the exact edit (Rust's compiler errors).
- **Tier 3 — structured with doc_url:** JSON with type, code, message, offending param,
  and a doc link — zero ambiguity (Stripe API's error objects).

The formula for a 10: what happened + why + how to fix it + where to learn more + the
actual values that caused it. Score 0-10.

## Step 4: Documentation Audit

- Search: try 3 common queries — do they find the right page?
- Code examples: copy-paste-complete? (real imports, real auth placeholder, runnable)
- Information architecture: can you find what you need in <2 minutes?
Score 0-10.

## Step 5: Upgrade Path Audit

Read via bash: CHANGELOG quality (clear? user-facing? migration notes?), migration guides,
deprecation warnings in code (grep for deprecated/obsolete). Score 0-10, evidence INFERRED.

## Step 6: Developer Environment Audit

Read via bash: README setup steps (prerequisites? platform coverage?), CI/CD config,
TypeScript types (if applicable), test utilities/fixtures. Score 0-10, evidence INFERRED.

## Step 7: Community & Ecosystem Audit

Community links (Discussions, Discord, Stack Overflow), issue response time and templates,
contributing guide. Score 0-10.

## Step 8: DX Measurement Audit

Feedback mechanisms: bug report templates, NPS/feedback widgets, docs analytics. Score 0-10,
evidence INFERRED.

## Step 9: Workflow Optimization Pass (inner loop)

Beyond onboarding, audit the day-to-day iteration loop of developers working IN this repo:

**Measure the baseline:**
- Full build time (target: < 30s), incremental/watch rebuild, HMR latency (target: < 100ms)
- Test suite runtime (target: < 2 min) — parallel execution? smart selection? watch mode?
- Time-to-feedback for a one-line change (edit → see result)

**Look for friction and automation gaps:**
- Missing build caching, incremental compilation, or parallelization
- No pre-commit hooks / linting on save (or hooks so slow devs bypass them)
- Manual repetitive tasks that should be scripts: environment setup, code generation,
  dependency updates, release steps, database migrations, API mocking
- Onboarding automation: can a new dev go from clone to running app with one command?
- Monorepos: task orchestration, affected-only builds/tests, remote caching
- False positives (flaky tests, noisy lint rules) — target zero; noise trains devs to ignore signal

**Method:** measure baseline → fix the biggest bottleneck first → iterate → track impact.
Quantify each recommendation ("build 2min → ~30s via incremental compilation + cache").
Score the inner loop 0-10 with evidence.

---

## DX Scorecard (final output)

```
+====================================================================+
|              DX LIVE AUDIT — SCORECARD                             |
+====================================================================+
| Dimension            | Score  | Evidence      | Method   |
|----------------------|--------|---------------|----------|
| Getting Started      | __/10  | [refs]        | TESTED   |
| API/CLI/SDK          | __/10  | [refs]        | PARTIAL  |
| Error Messages       | __/10  | [refs]        | PARTIAL  |
| Documentation        | __/10  | [refs]        | TESTED   |
| Upgrade Path         | __/10  | [file refs]   | INFERRED |
| Dev Environment      | __/10  | [file refs]   | INFERRED |
| Community            | __/10  | [refs]        | TESTED   |
| DX Measurement       | __/10  | [file refs]   | INFERRED |
| Inner Loop / Workflow| __/10  | [measurements]| TESTED   |
+--------------------------------------------------------------------+
| TTHW (measured)      | __ min | [step count]  | TESTED   |
| Overall DX           | __/10  |               |          |
+====================================================================+
```

## Next Steps

After the audit, recommend:
- The specific, actionable fixes for the gaps found — ordered by (adoption impact ÷ effort)
- The single "magical moment" opportunity, if one emerged
- Re-run devex-review after fixes to verify improvement

## Formatting Rules

- NUMBER issues (1, 2, 3...) and use LETTERS for options (A, B, C...)
- Rate every dimension with its evidence source
- Screenshots/command output are the gold standard. File references are acceptable.
  Guesses are not.
