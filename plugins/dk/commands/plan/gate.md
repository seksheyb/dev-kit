---
description: The plan gate — Wave 1 does not start until it returns gate_passed true.
argument-hint: "[NN]"
gate: always
blocking: true
---
Two members — gate-plan-review plus the analyze pass — run together, and the gate is not advisory: Wave 1 does not start until it returns `gate_passed: true`.

| Members | Dispatch |
| --- | --- |
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/plan-gate.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `gate-plan-review`, `analyze` — surface "workflow", profile review, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `model-route.mjs --caller plan:gate --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```js
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/plan-gate.workflow.mjs", args: { phase: "<NN>", planPath, sddPath, adrDir, specPath, graphifyPath,   // all required; graphifyPath may be "none"
  obsidianPath, constitutionPath } })                                 // optional
```

`scriptPath` needs a real filesystem path — run the bare command `dev-kit-core-root` and substitute its output for `<dev-kit-core>`; a dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

**Session boundary.**
