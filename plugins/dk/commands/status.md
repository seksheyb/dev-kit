---
description: Where an orchestrator-driven run left off — its next action, position, and open gates. Read-only.
---
Read `.dk-state` (the resume head). If it is absent, say so plainly — that is the normal state for
a project driven by hand, not an error — and offer `/dk:runbook` instead.

When it exists, lead with its `next:` line: that is the answer to "what now", already decided when
the line was written, and it needs no walk of RUNBOOK.md. Then report the rest of the head —
milestone, stage, phase, round, mode, last verdict — and name any gate that stopped the walk.

`${CLAUDE_PLUGIN_ROOT}/references/state-contract.md` is the schema. If `.dk-state` carries keys
outside it, or has grown past 15 lines, say so: it has started turning into a journal, which is what
`docs/state/journal/<NN>-<slug>.md` is for.

Do not open the journal to answer this. It is read on demand only, never on a normal resume — open
it only if `next:` points into it.

Read only. Never advance the pipeline, never write state — `/dk:run` does that.
