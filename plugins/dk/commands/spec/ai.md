---
description: The AI/LLM spec chain — framework-selector through eval-planner, one dispatch per turn.
argument-hint: "[M] [NN] [NNN]"
gate: operator
asks: "Does this phase build an AI/LLM system needing an eval contract?"
---
Run this chain for milestone <M>, phase <NN>, spec <NNN> — one dispatch per turn, in this order,
skipping none, each passing its predecessors' decisions forward: framework-selector, then
domain-researcher and ai-researcher, then eval-planner last. No section of the spec is yours to
hand-write — each one belongs to an agent in this chain.

Step 11 carries the `eval-auditor` dispatch that audits these rubrics against what got built.

→ next: `/dk:spec:ui` if this phase also has UI work (the two chains share no files and run concurrently), else `/dk:plan:write`
