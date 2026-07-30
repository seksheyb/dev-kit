---
description: Discovery wave 2 — advisor-researchers per gray area and the pattern-mapper, together.
argument-hint: "[NN]"
gate: always
---
The phase-researcher already ran in wave 1. For phase <NN>, fan out one advisor-researcher per gray-area decision its research left open, plus the pattern-mapper alongside them; only the pattern-mapper writes, so fold the advisors' tables in yourself.

| Units to dispatch | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/discovery-research.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `advisor-researcher`, `pattern-mapper` — surface "workflow", profile research, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller discover:research --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it. Neither `advisor-researcher` nor `pattern-mapper` has a config or frontmatter model pin — both are scored from their descriptor's signals like every other agent.

```
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/discovery-research.workflow.mjs", args: {
  grayAreas: [{ name, description }], phaseContext, projectContext, phase: "<NN>",   // all required
  calibrationTier: "standard" } })   // optional — from CLAUDE.md's Discovery Calibration section
```

Pre-cap the gray areas at 5 yourself, highest blast radius first (architecture/security/payments/auth, then whatever a wrong call is most expensive to unwind), folding the remainder into one combined advisor or a follow-up wave — the script rejects more than 5.
