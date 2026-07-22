---
description: Lens-based plan review — dispatch the plan-reviewer agent in parallel, one lens each.
---

Parse `$ARGUMENTS` as: a plan file path, plus optional lens names (`eng`, `design`, `devex`, `goal-backward`). Default to all 4 lenses when none are named.

There is intentionally **no `ceo`/scope lens** here: scope and product strategy are settled once, before any plan exists, by `spec-review-cpo` (Stage 1) and locked into the spec's Scope Decision Record. These 4 lenses are execution-quality checks only.

Dispatch `agents/plan-reviewer` once per selected lens, in parallel, passing the plan path and the lens skill for that lens.

Expected output: one lens report per dispatch, consolidated into a single set of findings for the plan.
