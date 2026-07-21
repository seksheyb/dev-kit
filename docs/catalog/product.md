# Product Analyst & Compliance

## Analytics & Growth

#### `ab-test-analysis`

- **Why needed:** Teams routinely misread experiment dashboards — treating a low p-value as proof of a win, stopping tests early, or ignoring guardrail regressions — leading to ship decisions that don't hold up.
- **What it does:** Explains what a p-value actually means (and the four things it is NOT), separates statistical from practical significance, and provides a ship/no-ship/iterate/inconclusive decision framework built on primary metric, effect size, guardrails, and sample ratio checks. It also catalogs common analysis errors (peeking, multiple comparisons, Simpson's Paradox, survivorship bias) with fixes.
- **Why not vanilla Claude Code:** Without this skill, Claude reasons about test results in whatever ad hoc way the prompt implies, with no fixed decision rule — it can just as easily rationalize a ship call from a p=0.06 result as flag it, since it has no committed thresholds or error checklist to apply consistently.
- **When to use:** When analyzing A/B test results, interpreting p-values, or making a ship/no-ship call — triggers include "analyze A/B test," "statistical significance," "confidence interval," or "did it work."
- **Then what:** Produces a results summary table (control vs. treatment: n, conversion, lift, CI, p-value), a significance verdict, and a ship/no-ship/iterate recommendation with rationale.
- **Notes:** Explicitly flags post-hoc segmentation as p-hacking — only pre-planned segments should be reported.

#### `cohort-analysis`

- **Why needed:** Retention data is easy to eyeball wrong — a declining curve can look like a growth problem when it's actually a product-market-fit problem, and without a defined activation metric, teams chase acquisition instead of fixing onboarding.
- **What it does:** Distinguishes acquisition, behavioral, and segment cohorts; defines N-day vs. rolling retention; teaches retention curve diagnosis (asymptotic/healthy vs. sloping-to-zero/dying); and walks through activation analysis to find the "aha moment" behavior that predicts long-term retention.
- **Why not vanilla Claude Code:** Vanilla Claude has no fixed vocabulary for "healthy vs. dying" curve shapes or a repeatable activation-metric-discovery procedure, so it may conflate a retention problem with an acquisition problem or skip the cohort-table structure entirely.
- **When to use:** When analyzing retention, cohort behavior, or engagement trends — triggers include "cohort analysis," "week 1 retention," "retention curve," or "activation metric."
- **Then what:** Delivers a cohort retention table, a curve-shape diagnosis, identified drop-off points with timing, an activation metric hypothesis, and ranked product recommendations.

#### `growth-loops`

- **Why needed:** Growth strategy conversations default to funnel thinking (acquire → convert → retain), which is linear and stops when ad spend stops; teams need a structured way to design compounding, self-reinforcing loops instead.
- **What it does:** Contrasts funnel vs. loop thinking, catalogs five loop types (viral/social, content/SEO, paid acquisition, network effect, sales-led) with real examples, and provides a four-step loop design process — identify the output, map the loop, find the constraint, measure efficiency (viral coefficient, cycle time, conversion per step).
- **Why not vanilla Claude Code:** Without this skill Claude would likely suggest generic acquisition channels rather than reasoning in terms of loop mechanics, viral coefficient math, or a named constraint-analysis step to target the weakest link.
- **When to use:** When designing a growth loop or understanding PLG mechanics — triggers include "growth loop," "flywheel," "viral loop," or "how do we grow."
- **Then what:** Outputs the identified loop(s) with type classification, a loop diagram with per-step metrics, a constraint analysis, and the top 2-3 experiments to strengthen the weakest step.

## Compliance

#### `gdpr-ccpa-compliance`

- **Why needed:** GDPR and CCPA/CPRA carry steep penalties (up to 4% of global revenue, or $100-$7,500 per violation) and are easy to violate unknowingly through pre-ticked consent boxes, missing DSR processes, or absent "Do Not Sell" links.
- **What it does:** Covers GDPR's core principles and six legal bases for processing, the full set of data subject rights, and a GDPR product checklist; separately covers CCPA/CPRA applicability thresholds, consumer rights, and its own checklist; includes a side-by-side comparison table of scope, consent model, and penalties.
- **Why not vanilla Claude Code:** Privacy law specifics — the 72-hour GDPR breach window, the 45-day CCPA response window, opt-in vs. opt-out consent models — are exactly the kind of detail vanilla Claude gets approximately right or conflates between regimes without a grounding checklist to check claims against.
- **When to use:** When assessing GDPR or CCPA/CPRA compliance, reviewing data practices, or evaluating privacy requirements — triggers include "GDPR," "CCPA," "right to deletion," or "consent."
- **Then what:** Produces a compliance gap assessment against the checklist, risk-ranked priority actions, a data subject rights implementation plan, and a documentation requirements list.

#### `hipaa-compliance`

- **Why needed:** Any SaaS vendor touching patient data for a healthcare customer may unknowingly be a HIPAA Business Associate, obligated to sign a BAA and implement safeguards before PHI can legally be handled — a gap that creates real liability if missed.
- **What it does:** Defines Covered Entity vs. Business Associate status, explains BAA requirements, lists the 18 HIPAA identifiers that must be stripped for de-identification, breaks down Security Rule safeguards (administrative/physical/technical), sets breach notification timelines, and gives an 8-step compliance roadmap with a HITECH penalty tier table.
- **Why not vanilla Claude Code:** The Business-Associate determination, the exact 18-identifier de-identification list, and the tiered HITECH penalty amounts are specific regulatory facts vanilla Claude would need to recall precisely and correctly apply to a vendor's situation — this skill fixes them as a checkable reference instead.
- **When to use:** When building a healthcare product needing HIPAA compliance, determining Business Associate status, or handling PHI — triggers include "HIPAA," "PHI," "business associate," or "BAA."
- **Then what:** Delivers an applicability assessment (Covered Entity/Business Associate/neither), a safeguards gap analysis, a BAA requirement checklist, a breach response plan outline, and prioritized remediation steps.
- **Notes:** Flags de-identified data (all 18 identifiers removed) as falling outside HIPAA entirely — a distinction worth surfacing since it changes the compliance obligation altogether.
