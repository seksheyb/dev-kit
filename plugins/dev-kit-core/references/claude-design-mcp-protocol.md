# Claude Design MCP: Binding, Model Selection, Manual System Creation

Shared protocol for any skill that produces a design artifact (`design-consultation`,
`design-html`) via the `mcp__claude-design__*` tools. Referenced, not duplicated, by each — keep
this the single place the behavior is defined.

**Claude Design is the only delivery mechanism for these skills — there is no local-file
fallback.** If `mcp__claude-design__*` tools aren't available in this environment, stop and tell
the user the Claude Design MCP is required (don't silently degrade to writing local HTML).

## Two different kinds of thing: design systems vs. projects

- **A design system** is the shared, reusable token/asset library (fonts, colors, spacing,
  component templates), confirmed via `list_design_systems` and Claude Design's own system
  prompt. It is bound *into* projects via `design_system_id`. **No MCP tool creates one** — see
  "Manual design-system creation" below for the one-time bridge.
- **A project** is a specific deliverable (a demo/preview, a single screen, a deck), optionally
  bound to a design system via `create_project(design_system_id: ...)`. Binding loads the
  system's tokens/context automatically via `get_claude_design_prompt(design_system_id: ...)`,
  but concrete files the system ships (starter templates, `deck-stage.js`, etc.) still need an
  explicit `copy_files(src_project_id: <system's project id>)` into the consumer — binding does
  not copy files across projects by itself.

`DESIGN.md` tracks two separate ids:
- `claude_design_system_id` — the shared design system. Resolved **exactly once, by
  design-consultation** (see "Resolution ownership" below). Reused by every downstream skill.
- `claude_design_project_id` — design-consultation's own demo/preview project. One consumer of
  the system above, not a shared hub other skills write into.

## Resolution ownership: design-consultation only

**Only `design-consultation` resolves or binds `claude_design_system_id`.** It's the one skill
that runs once, before any phase work, and gates Stage 8's UI execution — by the time any other
skill needs a design system, design-consultation has already run and `DESIGN.md` already carries
the answer (this mirrors `design-handoff`'s existing rule: no DESIGN.md → stop, don't invent).

Every other skill (`design-html`, and any future one) just **reads** `claude_design_system_id`
from `DESIGN.md`:
- **Present:** use it — `create_project(design_system_id: ...)` for whatever new project this
  skill needs, `get_claude_design_prompt(design_system_id: ...)` to load its context.
- **Absent (no DESIGN.md, or DESIGN.md has no bound system):** stop and tell the user to run
  `design-consultation` first. Do not call `list_design_systems`, do not ask the user which
  system applies, do not create an unbound project as a workaround — that resolution logic
  lives in exactly one place.

## design-consultation's own resolution (Phase 0)

1. Check `DESIGN.md` for a stored `claude_design_system_id`. If present, that's the bound
   system — skip straight to Phase 5 (see the skill's own Phase 0/1 gate: no aesthetic
   re-proposal when a system is already bound).
2. Otherwise call `list_design_systems`. If one or more exist, ask the user which one (if any)
   applies to this project.
3. If none fits and the user wants fresh visual direction, run the full proposal flow — then
   see "Manual design-system creation" below before writing the final DESIGN.md.

## Manual design-system creation (the one gap MCP can't close)

No `mcp__claude-design__*` tool creates a design system — that's a Claude Design UI-only action.
Once a fresh visual language is approved (design-consultation's Phase 3), generate a **ready-to-
paste prompt** the user can drop into a Claude Design conversation to have it build the design
system for them, rather than a vague "go promote this somewhere":

- Compose the prompt from the approved decisions: aesthetic direction, typography (fonts +
  roles), color palette (hex + roles), spacing scale, motion approach, and any component
  templates worth seeding (buttons, cards, forms, nav — whatever the product type implies).
  Phrase it as an instruction Claude Design's own agent can act on directly, e.g.: *"Create a
  design system named '[Project] Design System'. Aesthetic: [direction]. Typography: [fonts +
  roles]. Colors: [hex + roles]. Spacing: [base unit + scale]. Motion: [approach]. Seed it with
  templates for [component list]."*
- Show this prompt in chat and save it (e.g. `.claude/design/claude-design-system-prompt.md`) so
  it isn't lost between sessions.
- Tell the user: paste this into Claude Design (claude.ai/design) to create the system, then
  send back the resulting id (or its `list_design_systems` name) so it can be stored as
  `claude_design_system_id` in `DESIGN.md`.
- Non-blocking: still deliver this run's demo/preview project now (bound to nothing, or
  re-bindable later) rather than stalling on the manual step.

## Step 1: Ask which model does the design work

Before the first `mcp__claude-design__*` call in a given skill invocation, ask
(AskUserQuestion):

**"Which model should generate this Claude Design work?"**
- Sonnet (high thinking) — default
- Opus
- Fable

Ask this once per skill invocation — design-consultation and design-html each ask independently
(don't assume an answer given to the other skill, or in a previous session, still holds). Within
a single invocation that fans out to multiple subagents (e.g. Variant Shotgun mode's parallel
variants, or design-html's refinement-loop rounds), ask once up front and pass the same chosen
model to every subagent dispatch in that invocation. If no user is available to ask
(non-interactive/autonomous dispatch), default to Sonnet without blocking.

## Step 2: Run the generation at the chosen model — always via subagent dispatch

**Always** dispatch via the Agent tool with an explicit `model` override — `"sonnet"`,
`"opus"`, or `"fable"` per the answer to Step 1 — regardless of which model is running the
current session. There is no way for a skill's instructions to change which model is answering
the current turn; the Agent tool's `model` parameter is the only mechanism that actually
guarantees the chosen model authors the content. Never simulate a different model by "acting as"
it yourself, and never skip the dispatch just because the current session happens to already be
running the chosen model — dispatch every time, for every choice.

Give the dispatched subagent everything it needs in one self-contained prompt — it has no
memory of this conversation:
- the resolved `claude_design_system_id` (or explicit instruction that none is bound)
- the project context / approved design decisions / tokens
- the `project_id` to reuse, or instruction to `create_project` (with `design_system_id` set
  when one is bound)
- instruction to follow Claude Design's own workflow end to end, including its verify loop
  (render → gate → `design-verifier` subagent → act, loaded via `get_claude_design_prompt`) —
  don't layer a separate dev-kit verification step on top
- the deliverable(s) expected back: `open_url` (never `serve_url` — that's token-bearing and
  short-lived, for browser tooling only, never user-facing)

## Step 3: Record the choice

Note which model produced the artifact, and which `claude_design_system_id` /
`claude_design_project_id` were used, in the calling skill's own record of the work (e.g.
`DESIGN.md`'s Decisions Log, or `finalized.json`) so a later session can see both which model
generated which artifact and which design system it was bound to.
