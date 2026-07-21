---
description: Review the current diff — dispatch the code-review-gate agent.
---

Parse `$ARGUMENTS` for an optional diff range or scope (default: the current uncommitted/branch diff) and an optional `--engine <claude|gemini|codex|cursor>` override (default: `claude`, per `references/independent-review.md`).

Dispatch `agents/code-review-gate` (single mode) on that diff with the selected engine.

Expected output: severity-classified review findings with file:line references, rendered from the agent's canonical `findings.json`.
