---
description: Record what outlives the review rounds, then run QA. Gate — unattended test-framework bootstrap.
gate: always
---
Once the loop exits clean: use the `learn` skill for what outlives these rounds' findings, before
moving on. Then `/dev-kit-core:qa` — or `/dev-kit-core:qa report_only` for defects documented and
nothing touched:

In full mode the qa agent bootstraps a test framework unattended when the repo has none. Tell me
before you let it do that.

→ next: `/dk:review:ui` if this phase shipped UI, else `/dk:verify:goal`
