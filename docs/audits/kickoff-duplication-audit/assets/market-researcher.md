# market-researcher

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/market-researcher.md`
- **file_lines**: 129
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 01

---

## Invocation 1 — step 01 (Requirements & product framing), block 3, lines 166-173

### verbatim_text

```text
Use the market-researcher agent to write docs/milestones/<M>/research/MARKET.md. Name its
focus — market-sizing, competitive, or trends; with none given it runs a lighter combined pass
over all three and flags which one deserves a dedicated follow-up — and give it
docs/global/project/PROJECT.md and SPEC/spec.md as project context for domain, target users,
and constraints. There is no REQUIREMENTS.md to hand it yet; step 3 creates that. Dispatch it
alongside the assumption-mapping run above — different files, no ordering between them.
```

### surrounding_prose

Immediately preceded (line 165) by the conditional gate: '(only if a product-direction, sizing, or competitive call is genuinely open)' — this block is optional and only run when that condition holds. The block's own text notes 'There is no REQUIREMENTS.md to hand it yet; step 3 creates that' and instructs dispatching it 'alongside the assumption-mapping run above — different files, no ordering between them', i.e. it can run in parallel with block 2. Followed by the bolded heading (line 175) 'The scope gate — the only product/strategy gate in the pipeline:' introducing the next block.

---
