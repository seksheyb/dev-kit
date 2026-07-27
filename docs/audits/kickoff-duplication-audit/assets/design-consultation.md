# design-consultation

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/design-consultation/SKILL.md`
- **file_lines**: 505
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 04

---

## Invocation 1 — step 04 (Design system), block 0, lines 299-316

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then use the design-consultation
skill to establish the design system for <product> and write docs/global/design/DESIGN.md —
aesthetic, typography, color, layout, spacing, motion. Delivery is always Claude Design, so
stop and tell me if the claude-design MCP is unavailable rather than falling back to local
files. Resolve the design-system binding first: if a design system already fits, bind its id
as claude_design_system_id and skip the aesthetic questions entirely. If none fits and you want
to compare competing directions before committing — worth doing here, since this stage runs
once ever and is the only place in the pipeline that choice is still open — ask for "Variant
shotgun" mode to generate several full directions side by side. Otherwise, compose
the paste-ready system-creation prompt to docs/state/tmp/claude-design-system-prompt.md and
hand it to me — no MCP tool can create a design system, so that step is mine, not yours. Stop
there in that case: do NOT go on to design-html, which refuses to run unbound and would just
tell me to come back here. Only if a system was already bound, continue to design-html for the
reference implementation. Either way, you will ask once which model performs the Claude Design
generation work — Sonnet (default), Opus, or Fable — and dispatch it via the Agent tool's model
override, since that dispatch is the only thing that actually honors the choice.
```

### surrounding_prose

Section header: '4. Design system — (only if this project has UI and docs/global/design/DESIGN.md does not exist)'. Immediately before the block: 'Runs once ever, not per phase. Delivery is always Claude Design — there is no local-file fallback anywhere in this stage.' After the block, a conditioning note before the next block: '(only if design-consultation generated a system-creation prompt instead of binding an existing system)' — gating the following operator-side step.

---
