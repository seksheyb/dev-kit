# assumption-mapping

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/assumption-mapping/SKILL.md`
- **file_lines**: 80
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 01

---

## Invocation 1 — step 01 (Requirements & product framing), block 2, lines 154-163

### verbatim_text

```text
Use the assumption-mapping skill to surface what must be true for this spec to succeed
(Value / Usability / Business viability / Feasibility, scored importance × evidence), then
design the cheapest experiment for the top few and tell me which ones I need to run — the skill
stops at experiment design, and most VUBF tests (fake-door, landing page, interviews) are mine
to execute, not yours. Only assumptions that come back validated go to backlog-grooming, which
turns them into entries in docs/global/requirements/BACKLOG.md under the
Now/Next/Later/Icebox/Won't-Do taxonomy — an unvalidated assumption stays an assumption, not a
sprint-ready backlog item.
```

### surrounding_prose

No conditioning prose immediately precedes this block (directly follows block 1's fence after a blank line). The block itself references 'backlog-grooming' as the downstream consumer of validated assumptions (mentioned inline in the prompt text, not invoked by this block) and explains that unvalidated assumptions do not become backlog items. Followed by the conditional prose '(only if a product-direction, sizing, or competitive call is genuinely open)' (line 165) which gates the next block.

---
