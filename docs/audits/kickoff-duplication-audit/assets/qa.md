# qa

- **kind**: command
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/commands/qa.md`
- **file_lines**: 9
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 10, 10

---

## Invocation 1 — step 10 (Adversarial review/fix loop), block 3, lines 782-784

### verbatim_text

```text
/dev-kit-core:qa
```

### surrounding_prose

Follows directly after the pre-flight check block (git status, test framework, browser tooling). After this block, prose describes what browser-driven QA does at the default Standard tier (fixes critical/high/medium with atomic commits + regression tests, defers low/cosmetic; Quick fixes only critical+high; Exhaustive fixes everything down to cosmetic; anything unfixable from source is deferred at every tier), then introduces the report_only alternative.

---

## Invocation 2 — step 10 (Adversarial review/fix loop), block 4, lines 796-798

### verbatim_text

```text
/dev-kit-core:qa report_only
```

### surrounding_prose

Preceded by: '*(instead of the bare command above, only if you want the defects documented and nothing touched — report_only runs the browser baseline and the report and stops there: no fixes, no source reading, no edits, no commits, and no test-framework bootstrap)*'. This is an alternative mode of the same qa command (the 'bare command above' referenced here is the plain '/dev-kit-core:qa' block, block_index 3 — not a real asset). Followed by '*(only if this phase shipped UI)*' introducing the ui-auditor block.

---
