---
description: Audit the eval rubrics from step 6 against what actually got built.
argument-hint: "[NN]"
gate: auto
precondition: "test -f docs/milestones/*/specs/*/AI-SPEC.md"
asks: "Did this phase build an AI/LLM system with an eval contract from step 6?"
---
Dispatch the eval-auditor agent against phase <NN>, in the same message as the goal verification
above: they write different reports and neither reads the other's. Carry every BLOCKER into the
remediation pass below — it has no route of its own — and re-run this audit once that pass has
landed.
