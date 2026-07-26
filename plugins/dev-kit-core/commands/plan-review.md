---
description: Lens-based plan review — dispatch the plan-reviewer agent in parallel, one lens each (eng, design, devex, goal-backward).
---

Parse `$ARGUMENTS` as: a plan file path, plus optional lens names (`eng`, `design`, `devex`, `goal-backward`). Default to all 4 lenses when none are named.

There is intentionally **no `ceo`/scope lens** here: scope and product strategy are settled once, before any plan exists, by `spec-review-cpo` (Stage 1) and locked into the spec's Scope Decision Record. These 4 lenses are execution-quality checks only.

**2 or more lenses → run the Workflow. Mandatory, not an option** — the default (all 4) is always a Workflow. It fans out one `plan-reviewer` per lens in parallel and consolidates:

```
Workflow({
  scriptPath: "<dev-kit-core>/references/workflows/plan-review.workflow.mjs",
  args: { plan: "<plan path>", lenses: ["eng", "design", "devex", "goal-backward"] }
})
```

`scriptPath` takes a real filesystem path, not an `@references/…` citation — resolve `<dev-kit-core>` to the installed plugin directory before calling. Optional args: `context` (extra paths every reviewer should read), `reportDir`, `agentType` (see the script's header contract).

**Exactly 1 lens → no Workflow.** Dispatch `agents/plan-reviewer` inline with that lens; a Workflow for a single agent is pure overhead.

Expected output: one lens report per dispatch, consolidated into a single set of findings. The workflow returns the aggregate verdict, per-severity totals, per-lens results, and a `coverage`/`missingLenses` pair — if `coverage.returned` is short of `coverage.requested`, a lens failed and the aggregate verdict is provisional, so say so rather than reporting it as a clean panel. The user-facing verdict and next step are yours to state after it returns.
