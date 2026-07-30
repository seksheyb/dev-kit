---
description: The unified review cycle — every lens finds in the same round, one bugfix-wave sweeps them together.
argument-hint: "[NN] [branch]"
gate: always
---
**Before** the loop opens and never inside it, settle the test framework: `/dev-kit-core:qa` in full mode
bootstraps one when the repo has none, and that is a write that would mutate the tree the finders read
mid-round — tell me before you let it do that. Then the phase <NN> review ↔ fix loop under the
code-review-protocol skill: part 2 for the receiving side, part 3 for the stages, the dormancy rule and
the exit. Per round n: freeze the head, then fan that round's active lens set at the one frozen commit
via the review-finders workflow route — code-review-gate in round mode with round = n and branch =
<branch>, qa in `report_only`, security-auditor, verifier, plus ui-auditor when this phase shipped UI;
round 1 rosters them all. Triage what they return into ONE deduped set, then one bugfix-wave over that
whole merged set with <branch> as source, driven through its merge-and-clean-up before round n+1 opens.
A lens that came back clean sits the next round out. The loop closes only on a full-roster round with no
P0/P1/P2 and nothing indeterminate; a P3/P4-only ending is mine to call. Never a 7th round. Once it
exits clean, use the learn skill for what outlives these rounds' findings.
