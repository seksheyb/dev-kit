---
description: The milestone gate — security always, plus the UI, devex, compliance and pentest lanes that apply.
argument-hint: "[URL]"
gate: always
blocking: true
---
Use the context-restore skill. Ask me up front and stop for the answers: did any phase ship UI; is there a developer-facing surface (API/CLI/SDK); is regulated data or industry in scope (GDPR/HIPAA/PCI/SOC2); is active exploitation authorized in writing? Unanswered still runs the first three — they gate the milestone, so skipping one silently is worse than running it unasked — and never the fourth: an authorization you inferred is not one.

| Lane-wave units (the security half counts as one) | Dispatch |
| --- | --- |
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/final-gate-lanes.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `security-auditor`, `design-reviewer`, `devex-review`, `compliance-auditor`, `accessibility-tester`, `penetration-tester` — surface "workflow", profile review, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller final:gate --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it. The security lane's key is `security-auditor`, not `security-gate`: `final-gate-lanes.workflow.mjs` forwards this whole `routing` object into the child `security-gate.workflow.mjs` run unchanged, and the child looks up `security-auditor` — the agent that actually runs — so a `security-gate` key would route nothing.

```js
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/final-gate-lanes.workflow.mjs", args: {   // resolve <dev-kit-core> to the installed plugin dir
  milestone, phases: [{ phaseId, phaseDir, threatModelPath }], lanes: { ui, devex, compliance, pentest }, securityGateScriptPath, securityGateArgs, appUrlHint, pentestAuthorization } })   // all required but the last two — 2+ phases, four strict booleans from the answers above, the resolved child path plus its verbatim args; pentestAuthorization says where the written authorization lives — without it, or without lanes.ui, the pentest lane is skipped and named in skippedLanes rather than failing the run
```

One wave: the security child (`/dev-kit-core:security-audit` carries its own route and barrier rules) beside design-reviewer in full mode with regression, the devex-review skill and the compliance-auditor agent; accessibility-tester and, if authorized, penetration-tester wait behind it for the URL design-reviewer releases and owns. Security counts as a unit, so security with every lane false is the exactly-one case — fan that audit inline instead. A **single-phase** milestone also routes the whole gate inline however many lanes it enabled: one security-auditor per /dev-kit-core:security-audit's table, then the enabled lanes, then the URL consumers behind design-reviewer — the script requires 2+ phases. A dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

Merge what returns into one threat register yourself. Once every audit is back and **never** beside them, the cso skill in --diff mode over this milestone's changes; open threats block the ship. Then dependency-manager, escalating license to license-engineer. Say which gates passed and name any lane you could not run.
