---
description: The plan gate — Wave 1 does not start until it returns gate_passed true.
argument-hint: "[NN]"
gate: always
blocking: true
---
Dispatch the gate-plan-review agent for phase <NN>, passing all five of its declared inputs, not
just the plan. When it clears, use the analyze skill for phase <NN> against its spec as the
governing document, never the roadmap or requirements fallback. Both run before step 8's Wave 1,
and the gate is not advisory: Wave 1 does not start until it returns `gate_passed: true`.

**Session boundary.**
