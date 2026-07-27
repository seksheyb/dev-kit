# eval-planner

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-data-ai/agents/eval-planner.md`
- **file_lines**: 158
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 06

---

## Invocation 1 — step 06 (Phase specs), block 3, lines 447-457

### verbatim_text

```text
Use the eval-planner agent to write SPEC/AI-SPEC.md §5–§7 and nothing else: §5 evaluation
strategy (eval dimensions with rubrics, tooling with its install command, reference-dataset
spec, CI/CD eval command), §6 guardrails (online guardrails plus the offline flywheel), §7
production monitoring. It does not author §1's failure modes — domain-researcher does; it reads
and confirms them — and it owns neither §2 nor §3–§4b. Give it the system_type, framework and
model_provider from framework-selector (system_type is what selects the eval dimensions, so
without it the rubrics degrade to generic ones), the phase name and goal, SPEC/AI-SPEC.md as
ai_spec_path, PHASE/CONTEXT.md, docs/milestones/<M>/REQUIREMENTS.md and PHASE/RESEARCH.md. It
runs last because it reads §1, §1b, §2 and §3–4 — every section the three blocks above produced.
```

### surrounding_prose

Preceded by '(only if this phase builds an AI/LLM system needing an eval contract — after the block above)' — same conditional gate, last in the AI chain since it depends on all prior sections (§1, §1b, §2, §3–4). Immediately after this block, separate prose (not inside a fence) clarifies: 'The rubrics written here are audited once the system exists, not now — eval-planner designs them, eval-auditor is the pair that later checks them against what actually got built. Step 11 carries that dispatch.' This introduces eval-auditor as a distinct, later-invoked asset (step 11), not invoked in this step.

---
