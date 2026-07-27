# constitution

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/constitution/SKILL.md`
- **file_lines**: 100
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 00, 00

---

## Invocation 1 — step 00 (Bootstrap), block 1, lines 39-43

### verbatim_text

```text
Use the constitution skill to interview me and write docs/global/project/constitution.md.
Then write docs/global/project/PROJECT.md: what this project is, who it is for, what
success looks like for milestone 1, and any hard constraints known today.
```

### surrounding_prose

Immediately preceded by the bolded line '**Then establish governance:**'. This is the default/milestone-1 governance block (no conditioning italic tag precedes it, unlike the blocks that follow). The next block is explicitly the milestone-2+ alternative to this one, marked '*(milestone 2+ — the modes change, because the repo is no longer greenfield)*'.

---

## Invocation 2 — step 00 (Bootstrap), block 2, lines 46-53

### verbatim_text

```text
This is milestone <M>, not the first. Use the constitution skill in amend mode against the
existing docs/global/project/constitution.md — bump its semantic version and propagate the
amendments to dependent docs; do not re-initialize it from the template. Update
docs/global/project/PROJECT.md's success definition to this milestone's. Skip the spec-miner
and doc-ingest paths below entirely: there is no undocumented legacy pile here and this
project's own docs are already current.
```

### surrounding_prose

Preceded by italic conditioning text: '*(milestone 2+ — the modes change, because the repo is no longer greenfield)*'. This block is an alternative to the previous (milestone-1) constitution block, used instead of it on milestone 2+. It explicitly instructs skipping the spec-miner and doc-ingest blocks that follow ('Skip the spec-miner and doc-ingest paths below entirely'). Followed by italic conditioning text for the next block: '*(only if the repo has undocumented existing code)*'.

---
