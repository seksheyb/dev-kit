# spec-review-cpo

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/spec-review-cpo/SKILL.md`
- **file_lines**: 273
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 01

---

## Invocation 1 — step 01 (Requirements & product framing), block 4, lines 177-183

### verbatim_text

```text
Use the spec-review-cpo skill to review SPEC/spec.md. Challenge the premise, commit to a
scope posture, score prioritization against the US-xxx hierarchy, and append a Scope
Decision Record with a LOCK line to the spec's ## CPO Review section. Anything you descope
goes to docs/global/requirements/BACKLOG.md as ID-tracked entries, not just spec prose.
Any conflict with a constitution MUST principle is a BLOCKER.
```

### surrounding_prose

Immediately preceded by the bolded lead-in (line 175): 'The scope gate — the only product/strategy gate in the pipeline:'. Immediately followed (line 185) by: 'A REVISE verdict or any BLOCKER means stop and fix the spec — do not proceed to step 2.' — this is a hard gate: a REVISE verdict or any BLOCKER halts the pipeline and requires fixing the spec before advancing to step 2 (Architecture & tech stack).

---
