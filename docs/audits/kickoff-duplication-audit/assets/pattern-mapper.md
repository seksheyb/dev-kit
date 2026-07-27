# pattern-mapper

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/pattern-mapper.md`
- **file_lines**: 337
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 05

---

## Invocation 1 — step 05 (Phase discovery), block 3, lines 389-397

### verbatim_text

```text
Now that PHASE/CONTEXT.md and PHASE/RESEARCH.md both exist, dispatch the pattern-mapper agent —
it extracts the list of files this phase will create or modify from those two documents and
writes PHASE/PATTERNS.md, mapping each file to its closest existing analog with concrete code
excerpts to copy. Give it the phase number and name, the phase directory PHASE/, the
PHASE/CONTEXT.md path and the PHASE/RESEARCH.md path — those two files are its entire upstream,
so dispatching it any earlier yields an empty or invented PATTERNS.md. Step 7's planner does not
load PATTERNS.md on its own, so it has to be handed to it explicitly there.
```

### surrounding_prose

Opens with its own ordering condition 'Now that PHASE/CONTEXT.md and PHASE/RESEARCH.md both exist' — explicit dependency on the two prior blocks' outputs. Also flags forward to step 7: 'Step 7's planner does not load PATTERNS.md on its own, so it has to be handed to it explicitly there' — a load-bearing note for a later step, not this one. Followed by a horizontal rule '---' at line 399 closing out step 5 / this slice.

---
