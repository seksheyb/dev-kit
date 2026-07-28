---
description: The adversarial find→triage→sweep loop, at most 6 rounds. Never open a 7th.
argument-hint: "[NN] [branch]"
gate: always
---
Run the phase <NN> review ↔ fix loop under the code-review-protocol skill — part 2 for the
receiving side, part 3 for the four stages each round takes. Per round n: freeze the head, then
fan out that part's whole finder set against that one commit, code-review-gate among them in
round mode, round = n, branch = <branch>. Triage what they return into a single deduped findings
set before anything is dispatched to fix it. Then, unless code-review-gate returns stop_loop, one
bugfix-wave over that merged set with <branch> as source, driven through its merge-and-clean-up
before round n+1 opens. Read stop_loop and next_action rather than re-deriving them, and never
open a 7th round.
