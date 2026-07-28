---
description: Verify the phase goal explicitly. Returns passed / gaps_found / human_needed.
argument-hint: "[NN]"
gate: always
---
**Pass the phase goal explicitly:** `/dev-kit-core:verify the goal and success criteria of phase
<NN>`

→ next: `/dk:verify:eval` if this phase built an AI system, `/dk:verify:human` if it came back human_needed, else `/dk:verify:converge`
