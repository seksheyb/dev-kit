---
description: Index the repo graph and take the milestone's security baseline.
gate: auto
precondition: "test -n \"$(git ls-files)\""
asks: "Is there anything to index — the doc corpus above, or existing code?"
---
Use the graphify skill, with `--update` if a graph already exists; if it fails, note it and carry
on. Then, only if the repo has code, the cso skill with no flags — the full audit, not `--diff` —
for this milestone's security baseline. One per turn; neither can be fanned out.

**Session boundary.**

→ next: `/clear`, then `/dk:requirements:brainstorm`
