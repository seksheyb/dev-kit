# design-handoff

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/design-handoff/SKILL.md`
- **file_lines**: 113
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 08

---

## Invocation 1 — step 08 (Build it, test-first), block 4, lines 636-649

### verbatim_text

```text
Use design-html to build this phase's actual screens as Claude Design .dc.html deliverables
against the bound claude_design_system_id — step 4 built the one-time reference
implementation, not these, and this invocation gets its own screen-scoped project. Then use
the design-handoff skill to translate docs/global/design/DESIGN.md, plus PHASE/UI-SPEC.md if
this phase has one, into a hex/typography quick-reference and copy-paste component prompts for
the codebase-side implementer. That bridge is the whole point: a lane skill like react-expert
writing real framework code has no access to the Claude Design system's context, which only
loads automatically for work staying inside Claude Design. Save that handoff to
docs/global/design/handoffs/<name>.md, where <name> is the project or screen name — that local
file is the primary artifact, since the codebase-side implementer reads it directly and has no
Claude Design access of its own. Hand it to the UI tracks by path before they build, and flag
any section missing from the source rather than inventing values.
```

### surrounding_prose

Conditioned by italic text immediately above: '(only if this phase ships UI)'. The block distinguishes this invocation from step 4's one-time reference implementation (this one is screen-scoped, produces actual phase screens, not the reference build), names its inputs (docs/global/design/DESIGN.md, optionally PHASE/UI-SPEC.md), names its output path convention (docs/global/design/handoffs/<name>.md) and explains why the handoff step exists (a codebase-side lane skill like react-expert has no access to Claude Design's context). react-expert here is used only as an illustrative example of 'a lane skill' with no Claude Design context, not as an invocation within this block.

---
