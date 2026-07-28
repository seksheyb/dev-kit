---
description: Converge the phase — runs even when verify came back passed.
argument-hint: "[NN]"
gate: always
---
Use the converge skill for phase <NN> — run it even when verify came back passed; a pass there
does not excuse skipping this step.

→ next: `/dk:verify:remediate` if converge appended tasks or verify came back gaps_found, else `/dk:verify:integrate`
