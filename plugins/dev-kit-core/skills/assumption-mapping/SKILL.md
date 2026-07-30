---
name: assumption-mapping
description: Use when identifying and prioritizing risky assumptions in a product idea, feature, or strategy before committing engineering effort. Invoke to surface hidden assumptions, score them by importance and evidence, and design the cheapest experiments to test the riskiest ones first. Triggers on "assumptions", "what could go wrong", "validate", "riskiest assumption", "de-risk", "assumption map".
license: MIT
metadata:
  version: "1.0.0"
  domain: product-strategy
  triggers: assumptions, riskiest assumption, de-risk, validate idea, assumption map, product validation, VUBF, experiment design
  role: strategist
  scope: analysis
  output-format: document
  related-skills: ab-test-analysis, backlog-grooming, growth-loops
---

# Assumption Mapping

Risk-driven product validation methodology. Surface the hidden assumptions baked into any product idea and prioritize which ones to test first — before wasting engineering effort building on a shaky foundation.

## The 4 Risk Categories (VUBF)

### Value Risk
Will customers want this? Will it solve a real problem?
- "Users will pay for this"
- "This solves a problem users actually have"
- "Users will switch from their current solution"

### Usability Risk
Can customers figure out how to use it?
- "Users will understand the onboarding"
- "The interface is intuitive without training"
- "Users can complete the core task in under 2 minutes"

### Business Viability Risk
Can we build a sustainable business around this?
- "Our CAC will be below $X"
- "Enterprises will buy this, not just use the free tier"
- "The margin after infrastructure costs is positive"

### Feasibility Risk
Can we actually build it?
- "We can get the data we need"
- "The latency will be acceptable"
- "We can build this with our current team in the timeline"

## Prioritization Grid

Map each assumption on 2 axes:
- **X-axis**: Importance to the idea succeeding (Low -> High)
- **Y-axis**: Evidence we have right now (Strong -> Weak)

| Quadrant | Action |
|---|---|
| High importance + Weak evidence | **Test immediately** — highest priority |
| Low importance + Weak evidence | Test eventually |
| High importance + Strong evidence | Monitor |
| Low importance + Strong evidence | Ignore for now |

## For Each Priority Assumption, Define

1. The assumption stated clearly
2. The riskiest version of this assumption
3. The cheapest/fastest experiment to test it
4. What "validated" looks like (success metric)
5. What "invalidated" means for the product direction

## Assumption Extraction Process

When given a product idea or feature:
1. Ask: What must be true for this to succeed?
2. Extract assumptions across all 4 VUBF categories
3. Score each: Importance (H/M/L) x Evidence (H/M/L)
4. Rank and identify the top 3-5 to test first
5. Suggest the cheapest experiment for each

## Parallel Extraction

Step 2 of that process is four independent passes over the same input — the VUBF categories share
no evidence and no ordering between them. For a spec longer than about a page, dispatch one
subagent per category in a single message, each returning its assumptions with an importance
score, an evidence score, and the source backing each score.

| VUBF categories | Dispatch |
| --- | --- |
| All 4 categories (the normal case) | **Workflow script — mandatory.** `Workflow({ scriptPath: "<dev-kit-core>/references/workflows/assumption-map.workflow.mjs", args: { categories } })` |
| Fewer than 4 (re-running 1-3 dropped categories) | Plain inline `Agent` call per category — a Workflow for a partial roster is refused by the script |

Render each category's complete extraction prompt yourself, in this turn, before dispatching —
the workflow script performs no judgment and carries no VUBF definitions or scoring rubric of its
own, only whatever prompt text you hand it per category. Every rendered prompt must also end by
requiring this exact JSON return shape: `{ assumptions: [{ assumption, importance: "H"|"M"|"L",
evidence: "H"|"M"|"L", source }] }` — single-letter H/M/L scores under these exact key names,
never "High"/"Medium"/"Low" or a different nesting:

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build **one** descriptor for the single agent role this fan-out uses — `assumption-extractor` — surface "workflow", profile `research`, signals declared per that doc's profile tables. One descriptor per ROLE, not per instance: the four VUBF categories below are four instances of the same extraction role (they differ only in which prompt they receive), so they share one descriptor and one routing entry, keyed `assumption-extractor` — the same key `assumption-map.workflow.mjs` looks up. Write it keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller assumption-mapping --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```js
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/assumption-map.workflow.mjs", args: {
  categories: [
    { key: "value", prompt: "<your rendered Value Risk extraction prompt>" },
    { key: "usability", prompt: "<your rendered Usability Risk extraction prompt>" },
    { key: "business", prompt: "<your rendered Business Viability Risk extraction prompt>" },
    { key: "feasibility", prompt: "<your rendered Feasibility Risk extraction prompt>" },
  ],
} })
```

`scriptPath` resolves `<dev-kit-core>` to the installed plugin dir; a dead run resumes via
`Workflow({ scriptPath, resumeFromRunId: "<runId>" })`. The roster is fixed at exactly these 4
keys — the script throws on a missing, duplicate, or unknown key rather than running a partial
VUBF pass. Re-running any subset of dropped categories (per the workflow's `missingCategories`
return) is the "Fewer than 4" inline row above, never another Workflow call.

Scoring stays per-category; **ranking does not**. The prioritization grid is a barrier: every
category must be back before any assumption can be ranked against the others, because "riskiest"
is a claim across the whole set, not within one quadrant. Never let a subagent return a top-3.
Fold the workflow's returned `categories` yourself and run the grid in this turn — the workflow
return is not pre-ranked.

Keep the extraction inline for a single feature or a short spec — four dispatches cost more than
the pass they replace.

## Output Format

Deliver:
- Assumption table: Assumption | Category | Importance | Evidence | Priority
- Top 3-5 assumptions to test with specific experiment suggestions
- Decision rules: what result validates vs. invalidates each assumption
