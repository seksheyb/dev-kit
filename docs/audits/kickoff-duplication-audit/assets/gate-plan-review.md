# gate-plan-review

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/gate-plan-review.md`
- **file_lines**: 113
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 07

---

## Invocation 1 — step 07 (Plan the phase), block 4, lines 530-542

### verbatim_text

```text
Dispatch the gate-plan-review agent, passing all five of its inputs, not just the plan:
plan_path = PHASE/<NN>-<MM>-PLAN.md, sdd_path = docs/global/architecture/SDD.md, adr_dir =
docs/global/architecture/adr/ (the ADR bank itself, not its parent directory), spec_path =
SPEC/spec.md, graphify_path = docs/state/graphs/GRAPH_REPORT.md (or the literal string "none" if
no graph was built). Two of its six review dimensions are SDD Alignment and ADR Gaps, and both
are dead without sdd_path and adr_dir — it hands the review engine those paths to read, never
inlined content. This is a gate, not advice. It runs a deterministic complexity check against
every track's declared model and effort, then dispatches an independent **non-Claude** review
engine (Gemini → Codex → Claude fallback order). Report back gate_passed, next_action, and which
engine actually ran — if it fell back to Claude, say so plainly, because a claude-on-claude gate
is a weaker gate. Wave 1 does not start until gate_passed is true.
```

### surrounding_prose

Immediately preceded by 'Set the default once in the project's `CLAUDE.md` rather than deciding per phase.' No further prose between this block and the next block; the next block (analyze skill) begins immediately after this fence closes at line 542, separated only by a blank line.

---
