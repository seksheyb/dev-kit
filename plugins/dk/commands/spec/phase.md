---
description: The phase spec chains — the AI/LLM eval chain and the UI chain, concurrently when the phase has both.
argument-hint: "[M] [NN] [NNN]"
gate: operator
asks: "Does this phase build an AI/LLM system needing an eval contract, have UI work, or both?"
---
Run whichever chains apply for milestone <M>, phase <NN>, spec <NNN>. When the phase has both, run them concurrently — they share no files, and each chain is internally sequential.

**AI chain.** framework-selector first and **alone** — it creates the spec file and the placeholders
every later agent writes into. No section of the spec is yours to hand-write.

Two preconditions before the pair: confirm AI-SPEC.md exists (framework-selector's output) — a missing file means it failed, and the pair must not fan out onto a skeleton neither of them created; and pass `includeUiChecker: true` only once ui-researcher has returned and UI-SPEC.md exists, since ui-checker riding this Workflow while the UI chain is still writing that file audits a half-written spec and comes back BLOCKED for reasons that are not the spec's. Otherwise pass `includeUiChecker: false`.

| Pair (domain-researcher + ai-researcher, +ui-checker if UI chain active) | Dispatch |
| --- | --- |
| 2 or more | **Workflow — mandatory.** `@references/workflows/spec-research-pair.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `domain-researcher`, `ai-researcher` at profile research, plus `ui-checker` at profile review when it rides this Workflow — surface "workflow", signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller spec:phase --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

`Workflow({ scriptPath: "<dev-kit-core>/references/workflows/spec-research-pair.workflow.mjs", args: { specPath, phase, includeUiChecker, uiSpecPath } })`; resume via `resumeFromRunId`.

Then eval-planner last and alone. Step 11's eval-auditor audits these rubrics against what actually got built.

**UI chain.** The ui-researcher agent first, then the ui-checker agent against the UI-SPEC.md it produced — riding the AI pair's Workflow when that pair has not been dispatched yet, otherwise a plain inline `Agent` call after it. Either way ui-checker runs exactly once, and never before ui-researcher returns.
