# roadmapper

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/roadmapper.md`
- **file_lines**: 729
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 03

---

## Invocation 1 — step 03 (Research & roadmap), block 1, lines 267-281

### verbatim_text

```text
Use the roadmapper agent to split this milestone into phases in
docs/milestones/<M>/ROADMAP.md, and initialize docs/state/STATE.md. Its inputs are SPEC/spec.md,
docs/milestones/<M>/research/SUMMARY.md and docs/global/project/PROJECT.md. There is no
REQUIREMENTS.md for it to parse — nothing upstream of here writes one — so tell it to work
SPEC/spec.md's US-xxx story bank directly, since coverage and traceability key on those IDs, and
to create docs/milestones/<M>/REQUIREMENTS.md here, traceability section included, rather than
expecting to find it.
MANDATE: every phase is a vertical slice that ships end-to-end (thin full-stack), never
horizontal layers — no all-backend-then-all-frontend, and never a Setup → Core → Features →
Polish template. Derive the phases from requirement categories and their dependencies
instead. Validate 100% requirement coverage before writing the file — an orphaned requirement
is a hard stop, not a footnote, and so is any phase that fails the vertical-slice acceptance
test.
```

### surrounding_prose

Follows directly after the research block with no heading in between. States roadmapper's three inputs (SPEC/spec.md, the SUMMARY.md just produced, PROJECT.md), and explains a gap: there is no REQUIREMENTS.md upstream, so roadmapper must work the SPEC's US-xxx story bank directly for coverage/traceability and must itself create docs/milestones/<M>/REQUIREMENTS.md (with a traceability section) rather than expect to find one. A capitalized MANDATE follows: every phase must be a vertical end-to-end slice, never horizontal layers, never a Setup→Core→Features→Polish template; phases are derived from requirement categories and dependencies; 100% requirement coverage must be validated before writing the file, with an orphaned requirement or a phase failing the vertical-slice acceptance test both being hard stops.

---
