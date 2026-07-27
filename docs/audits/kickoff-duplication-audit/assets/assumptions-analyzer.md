# assumptions-analyzer

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/assumptions-analyzer.md`
- **file_lines**: 109
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 05

---

## Invocation 1 — step 05 (Phase discovery), block 1, lines 361-375

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then dispatch five agents in one
message for phase <NN>: four codebase-mapper agents, one per focus area (tech / arch / quality /
concerns) — name the focus area in each dispatch, it is the only input they take — which write
their maps to docs/global/codebase/*.md, the canonical project-wide location, not into PHASE/;
plus one assumptions-analyzer, given the phase number and name, the phase goal from ROADMAP.md,
the locked decisions from earlier phases, the codebase hints you already have, and the
calibration tier. These five are safe concurrently because they write different files AND read
nothing each other produces. pattern-mapper is deliberately NOT in this fan-out: it reads
PHASE/CONTEXT.md and PHASE/RESEARCH.md, neither of which exists yet, so it gets its own block
below. Fold the assumptions and the phase-relevant findings from those maps into
PHASE/CONTEXT.md. The arch and concerns mappers should query the graph at
docs/state/graphs/graph.json before exploring fresh, and so should you, rather than re-reading
the tree.
```

### surrounding_prose

No prose lines between this block and the previous or next block — just a blank line separator on each side. The block itself explains its own ordering rationale (pattern-mapper excluded because its inputs, PHASE/CONTEXT.md and PHASE/RESEARCH.md, don't exist yet) and instructs folding outputs into PHASE/CONTEXT.md.

---
