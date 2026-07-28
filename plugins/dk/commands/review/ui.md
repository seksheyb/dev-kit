---
description: Adds the ui-auditor lens to the loop's finder stage — design-reviewer comes at step 12.
argument-hint: "[NN]"
gate: operator
asks: "Did this phase ship UI?"
---
Add the ui-auditor agent for phase <NN> to the loop's finder stage, where it runs beside the other
lenses against the same frozen commit and its findings merge into the same swept set — rather than
alone after the loop has already exited, which is too late for the sweep to fix any of them.
Dispatch it on its own only if you are skipping the loop entirely. design-reviewer at step 12.
