---
description: Run QA on the current change — dispatch the qa agent, report-only when requested.
---

Parse `$ARGUMENTS` for an optional `report_only` flag (also matches "report only" / "no fixes").

Dispatch `agents/qa` against the current change, passing the `report_only` flag when present.

Expected output: a QA report of what works and what's broken; fixes applied only when `report_only` is not set.
