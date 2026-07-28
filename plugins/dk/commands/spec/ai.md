---
description: The AI/LLM spec chain — framework-selector, the researcher pair together, then eval-planner.
argument-hint: "[M] [NN] [NNN]"
gate: operator
asks: "Does this phase build an AI/LLM system needing an eval contract?"
---
Run this chain for milestone <M>, phase <NN>, spec <NNN>, skipping none, each dispatch passing its
predecessors' decisions forward. framework-selector first and alone — it creates the spec file and
the placeholders every later agent writes into. Confirm that file exists, then dispatch
domain-researcher and ai-researcher together in one message: they own disjoint sections and edit
in place, so they do not collide. If the file is missing, framework-selector failed and this pair
must **not** fan out — each would fall back to writing the whole skeleton, and one would silently
overwrite the other. Then eval-planner last and alone; it reads what all three wrote. No section
of the spec is yours to hand-write — each one belongs to an agent in this chain.

Step 11 carries the `eval-auditor` dispatch that audits these rubrics against what got built.
