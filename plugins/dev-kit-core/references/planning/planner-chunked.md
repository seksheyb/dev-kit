# Chunked Mode Return Formats

Used when `plan-phase` spawns the `planner` agent with `CHUNKED_MODE=true` (triggered by the
`--chunked` flag or `workflow.plan_chunked: true` config). Splits the single long-lived planner
Task into shorter-lived Tasks to bound the blast radius of stdio hangs on long single-Task runs.

## Modes

### outline-only

Write **only** `PHASE/<NN>-PLAN-OUTLINE.md` (`PHASE/` = `docs/milestones/<M>/phases/<NN>-<slug>/`,
per the doc-path sitemap). Do not write any PLAN.md files. Return:

```markdown
## OUTLINE COMPLETE

**Phase:** {phase-name}
**Plans:** {N} plan(s) in {M} wave(s)

| Plan ID | Objective | Wave | Depends On | Requirements |
|---------|-----------|------|-----------|-------------|
| <NN>-01 | [brief objective] | 1 | none | REQ-001, REQ-002 |
| <NN>-02 | [brief objective] | 1 | none | REQ-003 |
```

The orchestrator reads this table, then spawns one single-plan Task per row.

### single-plan

Write **exactly one** `PHASE/<NN>-<MM>-PLAN.md` — the only plan path. Do not write any other
plan files. Return:

```markdown
## PLAN COMPLETE

**Plan:** <NN>-<MM>
**Objective:** {brief}
**File:** PHASE/<NN>-<MM>-PLAN.md
**Tasks:** {N}
```

The orchestrator verifies the file exists on disk after each return, commits it, then moves
to the next plan entry from the outline.

## Resume Behaviour

If the orchestrator detects that `PHASE/<NN>-PLAN-OUTLINE.md` already exists (from a prior
interrupted run), it skips the outline-only Task and goes directly to single-plan Tasks,
skipping any `PHASE/<NN>-<MM>-PLAN.md` files that already exist on disk.
