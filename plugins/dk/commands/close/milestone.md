---
description: Close the milestone by hand — freeze docs, move the pointer, tag, then read the backlog.
argument-hint: "[M]"
gate: always
---
Only once nothing is on fire, close the milestone out:

Close milestone <M> out by hand — no dev-kit asset does this: freeze this milestone's docs as a
historical record, move the position pointer off its last phase and onto the next milestone, and
tag the merged commit `<M>`. Then read the backlog: if it has Now or Next items, tell me what the
next milestone would be scoped from; if only Later or Icebox, we are done.

→ next: `/dk:bootstrap:constitution` for milestone <M+1> — milestone 2+ starts over at step 0, not step 1
