# cso

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/cso/SKILL.md`
- **file_lines**: 313
- **has_references**: no
- **complexity**: high
- **invocation_count**: 2
- **invoked by steps**: 00, 12

---

## Invocation 1 — step 00 (Bootstrap), block 7, lines 103-115

### verbatim_text

```text
Run two skills here, in this order, one after the other — they are skills that load into this
session rather than agents you can fan out, so there is no dispatching both in one message:
graphify mandates its own Agent-tool fan-out for semantic extraction, and cso runs its phases
inline. First, use the graphify skill to build docs/state/graphs/graph.json, or run it with
`--update` for an incremental re-extract if a graph already exists. If graphify fails, note it
and continue — it is an optimization, not a gate. Then use the cso skill for a full security
baseline into docs/milestones/<M>/reports/security/ — full, no flags, never --diff: at milestone
2+ the repo carries every prior milestone's shipped code, and that accumulated surface (stale
dependencies, drifted CI config, secrets leaked since the last full sweep) is exactly what step
12's --diff pass is scoped too narrowly to catch. This baseline is what planner's threat-model
step and sdd-review-cto both consult later, so it comes before step 2.
```

### surrounding_prose

Preceded by italic conditioning text: '*(only if the repo has code — a legacy/inherited entry, or any milestone after the first)*' — the code-bearing alternative to the previous pure-docs-greenfield block. Explains the two skills must run sequentially, not dispatched together, since both load into the current session rather than being fanned out as agents. Notes graphify failure is non-fatal ('an optimization, not a gate') but cso must run 'full, no flags, never --diff' at this stage, contrasted with step 12's narrower --diff pass. States this baseline feeds planner's threat-model step and sdd-review-cto later. Followed by an unconditioned block (context-save) — no italic tag precedes it, implying it always runs.

---

## Invocation 2 — step 12 (Final review — milestone gate), block 4, lines 1034-1041

### verbatim_text

```text
Then use the cso skill in --diff mode over this milestone's accumulated changes,
fingerprint-trend-tracked against the prior docs/milestones/<M>/reports/security/ entry so
Resolved/Persistent/New findings are visible milestone over milestone. Do not add
security-reviewer as a parallel pass — it is the methodology home security-auditor already
falls back to on its own when a phase has no threat model to verify against, so running it
separately just re-runs the same fieldwork. Open threats block the ship.
```

### surrounding_prose

Immediately follows the security-audit block with no intervening prose paragraph (just a blank line). Explicitly instructs NOT to add security-reviewer as a parallel pass, explaining that security-auditor already falls back to it when no threat model exists. Ends with gate statement: 'Open threats block the ship.'

---
