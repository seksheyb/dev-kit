# domain-researcher

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/domain-researcher.md`
- **file_lines**: 178
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 06

---

## Invocation 1 — step 06 (Phase specs), block 2, lines 435-444

### verbatim_text

```text
Use the domain-researcher agent for the real-world evaluation criteria in this domain — it
writes SPEC/AI-SPEC.md §1 (critical failure modes — the sharpest 3–5 domain failure modes
promoted to system level, informed by §2's system_type) and §1b (the domain rubric
ingredients); eval-planner reads and confirms §1 downstream. Give it the system_type from
framework-selector, the phase name and goal from docs/milestones/<M>/ROADMAP.md,
SPEC/AI-SPEC.md as ai_spec_path, PHASE/CONTEXT.md, docs/milestones/<M>/REQUIREMENTS.md and
PHASE/RESEARCH.md — and tell it not to re-derive the domain-adjacent findings step 5 already
surfaced.
```

### surrounding_prose

Preceded by '(only if this phase builds an AI/LLM system needing an eval contract — after the block above)' — same conditional gate, ordered after the ai-researcher block. This block is where §1 (critical failure modes) is actually authored, referenced back in block 0's prose ('§1 ... is authored downstream in this same step by domain-researcher'). eval-planner (next block) reads and confirms §1 and §1b downstream.

---
