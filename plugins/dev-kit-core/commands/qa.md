---
description: Test a running app like a real user (click everything, fill every form, check every state), fix what's broken, and report — dispatch the qa agent; report-only when requested.
---

Parse `$ARGUMENTS` for an optional `report_only` flag (also matches "report only" / "no fixes").

Dispatch `agents/qa` against the current change, passing the `report_only` flag when present. The agent derives its own report and baseline paths from `references/doc-sitemap.md` plus the active milestone id — no path needs to be supplied here; pass one explicitly only to override the agent's derived default.

Expected output: a QA report of what works and what's broken; fixes applied only when `report_only` is not set.
