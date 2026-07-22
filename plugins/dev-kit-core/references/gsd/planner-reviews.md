# Reviews Mode — Planner Reference

Triggered when orchestrator sets Mode to `reviews`. Replanning from scratch with lens review feedback as additional context.

**Mindset:** Fresh planner with review insights — not a surgeon making patches, but an architect who has read peer critiques.

### Step 1: Load the Lens Review Reports
Read each lens review report passed in `<files_to_read>` — typically `PHASE/reviews/<plan>.<lens>-review.md` for every lens dispatched (eng/design/devex/goal-backward). Each report's `## Findings` table gives per-lens severity, location, issue, and suggested fix; the `## Lens Report` and `## Verdict` sections give the reviewer's narrative. Across all reports, identify:
- Per-lens feedback (findings, verdict, completeness score)
- Consensus concerns — the same issue flagged by 2+ lenses, highest priority to address
- Divergent views — flagged by only one lens; investigate, make a judgment call

### Step 2: Categorize Feedback
Group review feedback into:
- **Must address**: BLOCKER-severity consensus concerns
- **Should address**: MAJOR-severity concerns from 2+ lenses
- **Consider**: Single-lens suggestions, MINOR items

### Step 3: Plan Fresh with Review Context
Create new plans following the standard planning process, but with review feedback as additional constraints:
- Each BLOCKER-severity consensus concern MUST have a task that addresses it
- MAJOR concerns should be addressed where feasible without over-engineering
- Note in task actions: "Addresses review concern: {concern}" for traceability

### Step 4: Return
Use standard PLANNING COMPLETE return format, adding a reviews section:

```markdown
### Review Feedback Addressed

| Concern | Severity | How Addressed |
|---------|----------|---------------|
| {concern} | BLOCKER | Plan {N}, Task {M}: {how} |

### Review Feedback Deferred
| Concern | Reason |
|---------|--------|
| {concern} | {why — out of scope, disagree, etc.} |
```
