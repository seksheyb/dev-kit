---
description: Scoped rebuild for convergence tasks and gaps, then re-verify until passed or human_needed.
gate: verdict
on: "verify:phase's converge appended convergence tasks, its goal verification returned gaps_found, its eval audit returned a BLOCKER, or its integration check ESCALATED an item"
---
Go back to step 8 and run sprint-execution again, scoped to exactly this and nothing else:
the convergence tasks `verify:phase`'s converge appended, every gap its goal verification listed,
and any eval-auditor BLOCKER its wave returned.
Take **keep** at the finishing-a-development-branch menu again.

**Model routing (mandatory, before each dispatch).** Per references/model-routing.md § The routing step (Surface A): build a descriptor for the agent role — `verifier`, profile review — with `surface: "agent"`, signals declared per that doc's profile tables; run `model-route.mjs --caller verify:remediate --json`, feeding the descriptor on stdin; pass the returned `model` on the `Agent` call unless it is `"inherit"`; `effortParam` is always `null` on this surface, so inject the matching effort prompt block (§6) into the agent's prompt. Then re-run /dev-kit-core:verify on
the same goal.

Only if this pass landed an eval BLOCKER, repeat the same routing step for the `eval-auditor` role — profile review — and re-run the eval-auditor over the same phase
after it — a remediated eval dimension that was never re-audited still stands at BLOCKER.
Each of those is one unit at its own dispatch point, so both stay plain inline `Agent` calls.
Repeat until verify comes back `passed` or `human_needed`.
If the same gaps survive two cycles, stop and escalate to me.
