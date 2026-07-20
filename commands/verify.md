---
description: Verify a change achieves its goal — dispatch the verifier agent.
---

Parse `$ARGUMENTS` as the goal, plan, or acceptance criteria to verify against (default: the current change's stated goal).

Dispatch `agents/verifier` with that context.

Expected output: a pass/fail verification report with the evidence that backs each verdict.
