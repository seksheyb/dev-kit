# framework-selector

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-data-ai/agents/framework-selector.md`
- **file_lines**: 242
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 06

---

## Invocation 1 — step 06 (Phase specs), block 0, lines 404-420

### verbatim_text

```text
Dispatch the framework-selector agent first — it settles the framework and is the first writer
of SPEC/AI-SPEC.md. Pass it SPEC/AI-SPEC.md as ai_spec_path explicitly — its listed default is
a placeholder path it cannot resolve itself. Tell it to read PHASE/RESEARCH.md first — its
`## Standard Stack` and `## Don't Hand-Roll` sections — plus PHASE/CONTEXT.md, to skip every
interview question those already answer, and never to recommend a framework RESEARCH.md's
Package Legitimacy Audit flagged [SLOP]. It runs a ≤6-question interview. When ai_spec_path
does not exist it creates AI-SPEC.md with the full section skeleton — §1, §1b, §2, §3, §4,
§4b, §5–§7 — so later agents fill their own sections against that numbering, and it writes §2
(framework) itself. Nothing in this chain is yours to hand-write: §2 is framework-selector's,
and §1 (critical failure modes) is authored downstream in this same step by domain-researcher,
which eval-planner then reads and confirms. It also returns a FRAMEWORK_RECOMMENDATION block:
primary, alternative, system_type, model_provider, eval_concerns, hard_constraints,
existing_ecosystem. Keep system_type, framework and model_provider from that block — §2 now
carries them too, but the dispatches below pass them as required inputs in the prompt, so the
returned block is where you take them from.
```

### surrounding_prose

Header for the whole step: '## 6. Phase specs — (conditional)'. Immediately above this block: '(only if this phase builds an AI/LLM system needing an eval contract)' — this entire AI chain (this block and the three that follow) only runs conditionally on the phase involving an AI/LLM system needing an eval contract. This is the first block in that chain; framework-selector is dispatched first because it creates AI-SPEC.md's skeleton and writes §2, and other agents depend on its FRAMEWORK_RECOMMENDATION output (system_type, framework, model_provider) as required inputs to their own dispatches.

---
