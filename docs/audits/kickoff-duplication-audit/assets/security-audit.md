# security-audit

- **kind**: command
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/commands/security-audit.md`
- **file_lines**: 9
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 12
- **aliases_merged**: dev-kit-core:security-audit

---

## Invocation 1 — step 12 (Final review — milestone gate), block 3, lines 1028-1032

### verbatim_text

```text
/dev-kit-core:security-audit every phase in this milestone — verify each declared threat
mitigation actually exists in code, phase by phase, and write the result to that phase's
PHASE/reviews/SECURITY.md
```

### surrounding_prose

Under section header '**b. Security — always runs**', preceded directly by the scoping prose: '**Scope it explicitly.** Bare, this command defaults to "the whole repo or current change" — which silently narrows a milestone gate down to one change. The gate is every threat model this milestone declared.' No conditional gate — this sub-stage always runs (unlike 'a. Functional' which had two conditional predicates).

---
