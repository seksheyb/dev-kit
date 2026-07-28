---
description: Scoped rebuild for convergence tasks and gaps, then re-verify until passed or human_needed.
gate: verdict
on: "converge appended convergence tasks, or verify:goal returned gaps_found"
---
Go back to step 8 and run sprint-execution again, scoped to exactly this and nothing else:
converge's appended tasks, every gap verification listed, and any eval-auditor BLOCKER from above.
Take **keep** at the finishing-a-development-branch menu again, then re-run /dev-kit-core:verify on
the same goal until it comes back `passed` or `human_needed`. If the same gaps survive two cycles,
stop and escalate to me.
