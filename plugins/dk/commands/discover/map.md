---
description: Discovery wave 1 — four codebase-mappers, the assumptions-analyzer, and the phase-researcher.
argument-hint: "[NN]"
gate: always
---
Use the context-restore skill.

| Discovery agents | Dispatch |
| --- | --- |
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/discovery-map.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `codebase-mapper`, `assumptions-analyzer`, `phase-researcher` — surface "workflow", profile research, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller discover:map --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```js
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/discovery-map.workflow.mjs", args: { phase: "<NN>", calibrationTier, roadmapPath, phaseDescription,   // required — calibrationTier from CLAUDE.md's
  milestone, scopePaths } })   // Discovery Calibration section, "standard" if missing; both optional
```

`scriptPath` resolves `<dev-kit-core>` to the installed plugin dir; a dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`. Roster is fixed at 6 — inline only to re-run one unit.

Fold the assumptions and phase-relevant map findings yourself; the workflow return is not pre-folded.
