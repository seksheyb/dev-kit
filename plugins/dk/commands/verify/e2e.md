---
description: Automate end-to-end coverage for primary user flows this phase added or changed.
argument-hint: "[NN] [branch]"
gate: operator
asks: "Did this phase add or change primary user flows — flows an end user actually touches? Skipping is the correct outcome for a phase that changed none."
---
| Automation surfaces | Route |
| --- | --- |
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/e2e-split.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor for the agent role — `gate-automation` — surface "workflow", profile review, signals declared per that doc's profile tables; write it keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller verify:e2e --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/e2e-split.workflow.mjs", args: { phaseDir: "<phase dir>", branch: "<branch>", surfaces: ["playwright","maestro"], // required
          agentType: "gate-automation" } })                                               // optional
```

Count **surfaces**, not tracks — a project spanning both takes the top row, one surface dispatches `gate-automation` inline and unscoped for phase <NN> on <branch>; `scriptPath` takes a real filesystem path, so resolve `<dev-kit-core>` to the installed plugin dir, and a dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

**Session boundary** — anything from verification worth recording with the `learn` skill goes in
first. Then **back to step 5**; when every phase is done, continue to Part C.
