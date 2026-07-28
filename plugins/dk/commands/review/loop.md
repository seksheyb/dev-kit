---
description: The adversarial review to fix loop, at most 6 rounds. Never open a 7th.
argument-hint: "[NN] [branch]"
gate: always
---
Run the phase <NN> review ↔ fix loop under the code-review-protocol skill, receiving side. Per
round n: code-review-gate in round mode, round = n, branch = <branch>; then, unless it returns
stop_loop, bugfix-wave in findings.json mode on round n with <branch> as source, driving its
merge-and-clean-up to the end inside the loop before round n+1 opens. Read stop_loop and
next_action rather than re-deriving them, and never open a 7th round.

→ next: `/dk:review:qa`
