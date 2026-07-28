---
description: Where you are in the runbook, what ran, what is next, and which gates are open.
---
Read `.dk-state` (the resume head). If it is absent, say so plainly — that is the normal state for
a project driven by hand, not an error — and offer `/dk:runbook` instead.

When it exists, report: milestone, stage, phase, round, the last command's verdict, and any open
gates. Then name the next command from `${CLAUDE_PLUGIN_ROOT}/RUNBOOK.md`, with its gate class, and
say whether it would run, skip, or stop to ask under the current mode.

Read only. Never advance the pipeline, never write state — `/dk:run` does that.
