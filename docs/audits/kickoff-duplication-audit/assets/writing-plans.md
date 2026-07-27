# writing-plans

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/writing-plans/SKILL.md`
- **file_lines**: 176
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 07

---

## Invocation 1 — step 07 (Plan the phase), block 0, lines 484-497

### verbatim_text

```text
Use the writing-plans skill and the planner agent to produce PHASE/<NN>-<MM>-PLAN.md with
waves and tracks. Keep the vertical-slice mandate. Read PHASE/PATTERNS.md and cite its per-file
analog and code excerpts in each task's action section — the planner does not load it
automatically, so unless you pass it here step 5's pattern mapping never reaches the plan. Same
for step 6's specs: read PHASE/UI-SPEC.md and SPEC/AI-SPEC.md when that step produced them and
make the plan's tasks implement those contracts, because the planner does not load either one on
its own. Its <threat_model> step should consult docs/milestones/<M>/reports/security/ (step 0's baseline)
before assigning threat dispositions rather than re-deriving them from zero, and it should query
docs/state/graphs/graph.json for dependency context the same way step 5 did, rather than
re-reading the tree. Declare complexity signals (files — complete, including files the track
creates — plus novelty/logic/ambiguity/tests) plus model and effort on every track. Use the
diagram skill for the wave/track dependency graph.
```

### surrounding_prose

This is the opening block of step 7, under heading '## 7. Plan the phase'. No conditioning prose precedes it in this slice; it directly follows the section heading.

---
