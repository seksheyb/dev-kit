---
description: One doc-verifier per doc, dispatched last, after content-qa.
gate: always
---
| Docs to verify | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/doc-verify.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor for the agent role — `doc-verifier` — surface "workflow", profile review, signals declared per that doc's profile tables; write it keyed by role to a temp JSON; run `model-route.mjs --caller docs:verify --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/doc-verify.workflow.mjs",
  args: { docs: ["<doc path>", "..."], outputDir: "<dir>" } })  // docs required — every doc this step created or touched, 2+ paths; outputDir optional — omit for the agent's own default
```

scriptPath needs a real filesystem path — run the bare command `dev-kit-core-root` and substitute its output for `<dev-kit-core>`. A dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

Once every doc-verifier has reported, read the result files yourself and give one report — failures, unverifiable claims, and what came clean.
