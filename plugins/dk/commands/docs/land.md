---
description: Automated path — full merge-and-deploy run. A handoff is the correct outcome.
gate: verdict
on: "ship:auto was taken at step 13"
---
Use the land-and-deploy skill for the full merge-and-deploy run; its wizard already ran at step 13.
If it stops and hands off, that is the correct outcome — fall through to the manual merge below.

→ next: `/dk:close:health`, or `/dk:docs:merge` if it handed off
