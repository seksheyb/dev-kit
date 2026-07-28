---
description: The UI spec chain — ui-researcher, then ui-checker against what it produced.
argument-hint: "[M] [NN]"
gate: operator
asks: "Does this phase have UI work?"
---
Use the ui-researcher agent for milestone <M>, phase <NN>. Then the ui-checker agent against the
spec it produced.

*(if this phase has both AI and UI work, run the two chains concurrently — they share no files.
Each chain is internally sequential.)*

→ next: `/dk:plan:write`
