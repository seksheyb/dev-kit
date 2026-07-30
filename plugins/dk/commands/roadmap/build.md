---
description: Four-axis ecosystem research, synthesis, then split the milestone into phases.
argument-hint: "[M]"
gate: always
---
Use the context-restore skill.

| Axes to research | Route |
|---|---|
| **2 or more axes** | **Workflow script — mandatory.** `@references/workflows/roadmap-research.workflow.mjs` |
| Exactly 1 axis (re-running one failed axis) | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `project-researcher`, `research-synthesizer`, `roadmapper` — surface "workflow", profile research, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller roadmap:build --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/roadmap-research.workflow.mjs",
  args: { milestone: "<M>", context: "<project context + open questions>" } }) // axes optional, default all four
```
`scriptPath` needs a real filesystem path — resolve `<dev-kit-core>` to the installed plugin dir. A dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

**Session boundary.**
