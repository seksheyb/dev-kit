---
description: Review the current diff for bugs, security issues, and code quality problems — dispatch the code-review-gate agent.
---

Parse `$ARGUMENTS` for an optional diff range or scope (default: the current uncommitted/branch diff) and an optional `--engine <claude|gemini|codex|cursor|antigravity>` override (default: `claude`, per `references/independent-review.md` and its per-engine adapters in `references/review-engines/`).

Dispatch `agents/code-review-gate` (single mode) on that diff with the selected engine.

Expected output: severity-classified review findings with file:line references, rendered from the agent's canonical `findings.json`.
