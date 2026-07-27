# document-release

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/document-release/SKILL.md`
- **file_lines**: 406
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 14

---

## Invocation 1 — step 14 (Document), block 3, lines 1233-1240

### verbatim_text

```text
Use the document-release skill. Build the shipped-vs-documented coverage map against
SPEC/spec.md's US-xxx story bank as well as the diff, so a requirement never touched at all
still gets flagged. Sync each doc against the diff, check the architecture diagrams for drift,
and polish the CHANGELOG entry that already exists — whether ship wrote it or I did on the
manual path. Polish the voice only, never rewrite or regenerate it. Run from the feature branch
with the PR still open; it aborts on the base branch because it needs the unmerged diff.
```

### surrounding_prose

No explicit conditional gate before this block (applies to both automated and manual paths — text explicitly says 'whether ship wrote it or I did on the manual path'). This is the 'release' step in the prose → code-level docs → release → de-slop → verify sequence. Must run from the feature branch with PR still open.

---
