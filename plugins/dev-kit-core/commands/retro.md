---
description: Generate an engineering retrospective from git history (commit velocity, session patterns, per-contributor analysis, trends vs last snapshot) — dispatch the retro agent.
---

Parse `$ARGUMENTS` for an optional window (`24h`, `14d`, `30d`) or `compare` (default: last 7 days).

Dispatch `agents/retro` with that window.

Expected output: a retrospective report — velocity, session patterns, per-contributor analysis, and trends vs the last saved snapshot.
