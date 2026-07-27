# eval-auditor

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-data-ai/agents/eval-auditor.md`
- **file_lines**: 179
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 11

---

## Invocation 1 — step 11 (Verify the goal), block 1, lines 837-848

### verbatim_text

```text
Dispatch the eval-auditor agent against this phase — the retroactive pair to step 6's
eval-planner. Audit what SPEC/AI-SPEC.md planned against what the code actually does, scoring
every planned eval dimension COVERED / PARTIAL / MISSING, and write PHASE/reviews/EVAL-REVIEW.md.
Assume the eval strategy was not implemented until codebase evidence proves otherwise: AI-SPEC.md
documents intent, and the code often does something less. A MISSING dimension or an unimplemented
guardrail is a BLOCKER — do not soften one to PARTIAL because some tests exist, and do not credit
the AI-SPEC.md text itself as implementation evidence. A BLOCKER here is remediation work, not a
report line: it has no route of its own, so carry every MISSING dimension and unimplemented
guardrail — with the Remediation Plan section EVAL-REVIEW.md ends on — into the implementation
pass further down this step, and re-run this audit once that pass has landed.
```

### surrounding_prose

Preceding conditional gate: '(only if this phase built an AI/LLM system with an eval contract from step 6)'. This block references step 6's eval-planner as the forward pair, and references AI-SPEC.md and PHASE/reviews/EVAL-REVIEW.md as artifacts. It notes findings must be carried into 'the implementation pass further down this step' and that this audit should be re-run once that pass lands.

---
