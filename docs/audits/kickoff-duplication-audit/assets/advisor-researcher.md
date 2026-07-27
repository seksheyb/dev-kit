# advisor-researcher

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/advisor-researcher.md`
- **file_lines**: 129
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 05

---

## Invocation 1 — step 05 (Phase discovery), block 2, lines 377-387

### verbatim_text

```text
Use the phase-researcher agent to write PHASE/RESEARCH.md — how to actually implement this
phase, including a don't-hand-roll list, common pitfalls, and its package-legitimacy gate
(catches hallucinated/typosquatted dependencies before planning). Give it the phase number and
name, the phase description/goal, this phase's requirement IDs, the constraints, and
PHASE/RESEARCH.md as its output path. Then fan out one advisor-researcher agent per gray-area
decision, all in one message, each given its gray area's name and description, the phase context
from the roadmap, brief project context, and the same calibration tier, and each returning a
5-column options table (Option / Pros / Cons / Complexity / Recommendation); fold those tables
back into RESEARCH.md.
```

### surrounding_prose

No prose between this block and the ones adjacent to it beyond blank-line separators. The block is self-contained: it names its own inputs (phase number/name, description/goal, requirement IDs, constraints, output path) and describes folding advisor-researcher's per-gray-area options tables back into RESEARCH.md.

---
