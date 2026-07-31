---
description: Verify the phase — one read-only wave, then converge, plus the Nyquist audit if verify found gaps.
argument-hint: "[NN]"
gate: always
---
| Wave members | Dispatch |
| --- | --- |
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/verify-phase.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `verifier`, `eval-auditor`, `integration-checker`, `converge`, `nyquist-auditor` — surface "workflow", profile review, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `model-route.mjs --caller verify:phase --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```js
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/verify-phase.workflow.mjs", args: { phase: "<NN>", hasEvalContract, isFirstPhase,   // required booleans — you decide both, the script cannot
  planPath, branch } })                           // optional
```

Members are the verifier — the authoritative run, since step 10's finder-stage verifier was only early warning against the pre-sweep tree — plus the eval-auditor (only if step 6 wrote an AI eval contract for this phase) and the integration-checker (skip it on the milestone's first phase). Establish both conditions yourself before dispatching: the script has no filesystem access and cannot check either.

The one 1-member shape is the milestone's first phase with no eval contract: dispatch `/dev-kit-core:verify the goal and success criteria of phase <NN>` inline instead. `scriptPath` takes a real filesystem path, so run the bare command `dev-kit-core-root` and substitute its output for `<dev-kit-core>`; a dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

The script runs converge after the wave — on the fresh verification report as pre-confirmed evidence, and even when verify came back `passed` — with the nyquist-auditor beside it only when verify reported validation gaps. Gaps are build work for step 8 and never sweep work; carry every eval BLOCKER into the remediation pass; hand every ESCALATED integration item back to step 8.
