---
description: Produce a codebase quality dashboard — dispatch the health-reporter agent.
---

`$ARGUMENTS` is unused; the agent auto-detects the project's health stack (or reads `## Health Stack` from CLAUDE.md).

Dispatch `agents/health-reporter`.

Expected output: a weighted 0-10 quality dashboard with per-category scores, the trend vs prior runs, and impact-ranked recommendations. Read-only.
