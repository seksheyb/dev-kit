---
description: Lens-based plan review — dispatch the plan-reviewer agent in parallel, one lens each.
---

Parse `$ARGUMENTS` as: a plan file path, plus optional lens names (`ceo`, `eng`, `design`, `devex`, `goal-backward`). Default to all 5 lenses when none are named.

Dispatch `agents/plan-reviewer` once per selected lens, in parallel, passing the plan path and the lens skill for that lens.

Expected output: one lens report per dispatch, consolidated into a single set of findings for the plan.
