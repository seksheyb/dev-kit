---
description: Verify a change actually achieves its stated goal or acceptance criteria (goal-backward, evidence over claims) — dispatch the verifier agent.
---

Parse `$ARGUMENTS` as the goal, plan, or acceptance criteria to verify against (default: the current change's stated goal).

Dispatch `agents/verifier` with that context.

Expected output: a verification report with the evidence that backs each verdict. The report's overall status is one of three states, not a binary pass/fail: `passed` (goal achieved, nothing left to check), `gaps_found` (a requirement failed or is missing — not done, remediate and re-verify), or `human_needed` (everything programmatically checkable passed, but at least one item can only be judged by a human — this is the indeterminate/could-not-determine outcome, distinct from a failure, and must not be collapsed into either `passed` or `gaps_found`).
