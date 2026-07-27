# design-html

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/design-html/SKILL.md`
- **file_lines**: 238
- **has_references**: no
- **complexity**: high
- **invocation_count**: 3
- **invoked by steps**: 04, 04, 08

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

## Invocation 2 — step 04 (Design system), block 1, lines 325-331

### verbatim_text

```text
The Claude Design system id is <uuid>. Store it as claude_design_system_id in
docs/global/design/DESIGN.md. Now use the design-html skill for the first time against that bound
system — the block above deliberately stopped short of it, because design-html refuses to run
unbound — so the reference implementation is built from the system's real tokens rather than
proposed values. Every downstream design step reads that id and stops if it is absent.
```

### surrounding_prose

Preceded by: '**This step is yours, not the agent's.** Open `docs/state/tmp/claude-design-system-prompt.md`, paste it into Claude Design at claude.ai/design, create the system, and copy the id it gives you back. Then paste:' — this is an operator-manual (non-Claude-Code) action performed before pasting this block back into Claude Code.

---

## Invocation 3 — step 08 (Build it, test-first), block 4, lines 636-649

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
