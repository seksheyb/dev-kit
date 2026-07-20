---
description: Run a security audit — dispatch the security-auditor agent.
---

Parse `$ARGUMENTS` for an optional scope (paths, subsystem, or focus area; default: the whole repo or current change).

Dispatch `agents/security-auditor` over that scope.

Expected output: severity-ranked security findings with locations and remediation guidance.
