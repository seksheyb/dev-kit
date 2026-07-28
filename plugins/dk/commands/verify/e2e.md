---
description: Automate end-to-end coverage for primary user flows this phase added or changed.
argument-hint: "[NN] [branch]"
gate: operator
asks: "Did this phase add or change primary user flows — flows an end user actually touches? Skipping is the correct outcome for a phase that changed none."
---
Use the gate-automation agent for phase <NN> on <branch>, this phase's integration branch.

**Session boundary** — anything from verification worth recording with the `learn` skill goes in
first. Then **back to step 5**; when every phase is done, continue to Part C.

→ next: `/clear`, then `/dk:discover:graph-update` for the next phase — or `/dk:final:ui` when every phase is done
