# spec-miner

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/spec-miner/SKILL.md`
- **file_lines**: 111
- **has_references**: yes
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 00

---

## Invocation 1 — step 00 (Bootstrap), block 4, lines 63-76

### verbatim_text

```text
Use the spec-miner skill to reverse-engineer the observed requirements from this codebase in
EARS format into SPEC/spec.md, then the gate-reverse-engineer agent to promote that into a
Legacy SDD at docs/global/architecture/SDD.md, a Legacy PRD at docs/global/requirements/PRD.md,
and retrospective ADRs at docs/global/architecture/adr/NNNN-<slug>.md. Then use the
legacy-modernizer skill against that recovered picture: dependency map, service boundaries, risk
register, and an incremental migration plan with a rollback trigger and owner per phase. Fold
the dependency map and the service boundaries into the Legacy SDD, and record the
migration-strategy choice — strangler fig or branch by abstraction; a big-bang rewrite is not
on the menu, legacy-modernizer itself prohibits it — as its own ADR in
that same bank. Assessment and plan only at this stage: no facades, adapters, characterization
tests, or monitoring code, because step 8 builds those and step 3's roadmap is what sequences
the migration phases.
```

### surrounding_prose

Preceded by italic conditioning text: '*(only if the repo has undocumented existing code)*' (same predicate as the plugin-enable block immediately above it, which exists to make legacy-modernizer available here). The block itself notes scope limits: 'Assessment and plan only at this stage: no facades, adapters, characterization tests, or monitoring code, because step 8 builds those and step 3's roadmap is what sequences the migration phases.' Followed by italic conditioning text for the next block: '*(only if the repo has a pile of ADRs/PRDs/specs outside canonical SITEMAP paths)*'.

---
