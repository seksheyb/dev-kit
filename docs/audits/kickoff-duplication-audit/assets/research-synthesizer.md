# research-synthesizer

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/research-synthesizer.md`
- **file_lines**: 248
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 03

---

## Invocation 1 — step 03 (Research & roadmap), block 0, lines 252-265

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then dispatch four
project-researcher agents in one message — one per axis: STACK, FEATURES, ARCHITECTURE,
PITFALLS — writing docs/milestones/<M>/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md.
Give every one of them the same context — the project one-liner,
docs/global/project/PROJECT.md and SPEC/spec.md, ecosystem mode, and the specific open
questions you want answered — and tell each one explicitly that it owns only its single
assigned file: they default to writing STACK, FEATURES and PITFALLS on every run, which would
have four parallel agents overwriting each other. They write but never commit. When all four
have returned, use research-synthesizer to merge them into
docs/milestones/<M>/research/SUMMARY.md and commit it — the four researchers never commit;
research-synthesizer is the one that does. Have it also derive a suggested phase structure
from the merged research for the roadmapper step below to weigh.
```

### surrounding_prose

This is the first prompt under heading '## 3. Research & roadmap'. No conditioning text precedes it beyond the section heading itself. The block itself contains the operative instructions: dispatch four project-researcher agents in one message (one per axis STACK/FEATURES/ARCHITECTURE/PITFALLS), give them shared context, warn explicitly that each must own only its single assigned file (their default behavior would otherwise cause all four to write STACK, FEATURES, and PITFALLS and overwrite each other), have them write-but-not-commit, then use research-synthesizer to merge into SUMMARY.md and commit — noting explicitly that the four researchers never commit and research-synthesizer is the one that does. Also instructs research-synthesizer to derive a suggested phase structure for the next block (roadmapper) to weigh.

---
