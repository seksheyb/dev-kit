---
description: One doc-verifier per doc, dispatched last, after content-qa.
gate: always
---
Dispatch the doc-verifier agent last, after content-qa: list every doc this step created or
touched, then one doc-verifier per doc in a single message. Once all have reported, read their
result files yourself and give me one report — failures, unverifiable claims, and what came clean.
