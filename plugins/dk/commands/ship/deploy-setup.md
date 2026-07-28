---
description: Run land-and-deploy's first-run wizard now, while a human is present to answer it.
gate: auto
precondition: "! test -f .claude/land-and-deploy.json"
asks: "Has land-and-deploy ever been configured in this repo? Check now, not at deploy time."
---
Run land-and-deploy's first-run setup wizard now, while I am sitting here to answer it; left until
step 14 it stalls an otherwise unattended deploy. Sort out GitHub auth now too, for the same
reason — not mid-deploy.

→ next: `/dk:ship:pr` (manual) or `/dk:ship:auto` (automated) — pick one
