---
description: Performance pass first, then the two SLO reviewers together against real data.
gate: always
---
Dispatch the performance-engineer agent over what this milestone shipped, and wait for it — the SLO
review needs its real performance data, so nothing runs beside it. Once it returns, route the pair.

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `sre-engineer`, `monitoring-expert` — surface "workflow", profile ops, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller close:operate --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

| SLO pair | Dispatch |
| --- | --- |
| **2 (normal run)** | **Workflow — mandatory.** `Workflow({ scriptPath: "<dev-kit-core>/references/workflows/slo-review.workflow.mjs", args: { perfReportRef, window } })` |
| 1 (re-run a dropped member) | Plain inline `Agent` call for that member only |

A dead run resumes via `Workflow({ scriptPath, resumeFromRunId })`. Step 13 set the SLOs on expected
traffic; this is the first real data. Say whether the burn rate survives the next milestone's
expected load, and whether each SLO is calibrated or merely loose.
