---
description: Settle the test framework before the loop opens, then record what outlives the rounds.
gate: always
---
Settle the test framework **before** the loop opens, never inside it: `/dev-kit-core:qa` in full
mode bootstraps one unattended when the repo has none, and that is a write — it would mutate the
tree the other finders are reading mid-round. Tell me before you let it do that. From there the
loop runs qa as `/dev-kit-core:qa report_only` in every round's finder stage, documenting defects
and touching nothing.

Once the loop exits clean, use the `learn` skill for what outlives these rounds' findings.
