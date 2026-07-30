---
description: Debug a failure to root cause, with a regression test — as needed, any time.
argument-hint: "<symptom>"
gate: verdict
on: "any step reported a failure"
---
`/dev-kit-core:debug <symptom>` — if the symptom has several genuinely competing root causes, fan
the hypotheses out in parallel per systematic-debugging rather than trying them in turn. Then, at
close-out, `Tell me which of the two knowledge stores you wrote to.`
