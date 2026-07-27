# document-generate

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/document-generate/SKILL.md`
- **file_lines**: 166
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 14

---

## Invocation 1 — step 14 (Document), block 0, lines 1189-1195

### verbatim_text

```text
Use the document-generate skill to sync the prose doc set to what actually shipped — all four
Diataxis quadrants: tutorial, how-to, reference, explanation. Source it from SPEC/spec.md,
docs/global/architecture/SDD.md's ADRs, and the phase PLAN files, so trade-offs and
alternatives-considered come from the ADR that already recorded them rather than being
re-derived from code comments and git history.
```

### surrounding_prose

Header: '## 14. Document — while the PR is still open'. Preamble: 'These run in sequence, one paste at a time.' content-qa rewrites prose, so it cannot run beside doc-verifier — the verifier would be checking text that is still being edited. Order matters: prose → code-level docs → release → de-slop → verify. Also: 'document-generate and code-documenter are sequential, not alternatives — their surfaces do not overlap. document-generate writes the four Diataxis quadrants and nothing else; it does not touch docstrings or API specs. code-documenter writes docstrings, JSDoc/TSDoc and OpenAPI/AsyncAPI and nothing else; it has no Diataxis quadrants. Running only one leaves half the doc set unwritten.' This is the first block in the sequence (prose).

---
