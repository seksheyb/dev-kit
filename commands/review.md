---
description: Review the current diff — dispatch the code-reviewer agent.
---

Parse `$ARGUMENTS` for an optional diff range or scope (default: the current uncommitted/branch diff).

Dispatch `agents/code-reviewer` on that diff.

Expected output: severity-classified review findings with file:line references.
