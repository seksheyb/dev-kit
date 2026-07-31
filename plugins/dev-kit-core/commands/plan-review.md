---
description: Lens-based plan review — dispatch the plan-reviewer agent in parallel, one lens each (eng, design, devex, goal-backward).
---

Parse `$ARGUMENTS` as: optional lens names (`eng`, `design`, `devex`, `goal-backward`), plus an optional plan file path override. By default, resolve the plan path yourself rather than requiring the caller to type it: identify the active milestone `<M>` and phase `<NN>-<slug>` (from the dispatch context, or the most recently modified phase directory if not otherwise stated), then glob `PHASE/<NN>-*-PLAN.md`, where `PHASE` is `docs/milestones/<M>/phases/<NN>-<slug>/` (`references/doc-sitemap.md`'s `PHASE/` shorthand; `<NN>-<MM>-PLAN.md` is the sitemap's only plan-path shape). Exactly one match → use it. Zero matches → error that no plan exists for that phase. More than one match (a phase can have several plans across waves/tracks) → ask the operator which plan, or error listing the candidates — never guess. Accept an explicitly-passed plan path in `$ARGUMENTS` only as an override to this default. When none are named, default to the project's configured lens set: read `CLAUDE.md` for a `## Plan Review Lenses` section (a list of lens names, one convention shared with `## Health Stack`, `## Testing`, and `## Deploy Configuration` elsewhere in this kit); if present, use exactly those lenses. Otherwise — no `CLAUDE.md`, or no such section — default to all 4 lenses.

There is intentionally **no `ceo`/scope lens** here: scope and product strategy are settled once, before any plan exists, by `spec-review-cpo` (Stage 1) and locked into the spec's Scope Decision Record. These 4 lenses are execution-quality checks only — a configured `## Plan Review Lenses` may narrow which of the 4 run by default, but can never reintroduce a `ceo` lens.

**2 or more lenses → run the Workflow. Mandatory, not an option** — the default set (all 4, or a configured subset of 2+) is always a Workflow. It fans out one `plan-reviewer` per lens in parallel and consolidates:

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor for the agent role — `plan-reviewer` — surface "workflow", profile review, signals declared per that doc's profile tables; write it keyed by role to a temp JSON; run `model-route.mjs --caller plan-review --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```
Workflow({
  scriptPath: "<dev-kit-core>/references/workflows/plan-review.workflow.mjs",
  args: { plan: "<plan path>", lenses: [...] }  // whichever set was resolved above: explicit $ARGUMENTS, the configured `## Plan Review Lenses`, or the all-4 fallback
})
```

`scriptPath` takes a real filesystem path, not an `@references/…` citation — run `dev-kit-core-root` (a bare command on `PATH`) and substitute its output for `<dev-kit-core>`. Optional args: `context` (extra paths every reviewer should read), `reportDir`, `agentType` (see the script's header contract).

**Exactly 1 lens → no Workflow.** Dispatch `agents/plan-reviewer` inline with that lens; a Workflow for a single agent is pure overhead.

Expected output: one lens report per dispatch, consolidated into a single set of findings. The workflow returns the aggregate verdict, per-severity totals, per-lens results, and a `coverage`/`missingLenses` pair — if `coverage.returned` is short of `coverage.requested`, a lens failed and the aggregate verdict is provisional, so say so rather than reporting it as a clean panel. A lens can also come back with verdict `BLOCKED` — it ran but could not actually review the plan (unresolved path, missing lens skill) — distinct from a missing lens that never returned at all; the workflow surfaces this as a separate `blockedLenses` list and forces `BLOCKED` to win the aggregate verdict rather than letting another lens's ordinary `REVISE`/`APPROVE` mask it, so report a `BLOCKED` panel as "could not determine," never as a clean or merely-provisional pass. Every surfaced finding carries the lens that produced it — that tag is provenance, not confirmation: the four lenses are disjoint by construction and the workflow deliberately does not cross-check one lens's finding against another, so each finding is that one lens's self-report, un-reverified by this command, and must be presented as such rather than as a panel-wide confirmed fact. The user-facing verdict and next step are yours to state after it returns.
