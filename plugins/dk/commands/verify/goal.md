---
description: Verify the phase goal explicitly. Returns passed / gaps_found / human_needed.
argument-hint: "[NN]"
gate: always
---
**Pass the phase goal explicitly:** `/dev-kit-core:verify the goal and success criteria of phase
<NN>`

Dispatch it together with the eval audit below — separate reports, neither reads the other. Step
10's finder stage already ran a verifier for early warning; this run is the authoritative one,
because it is the only one that sees the tree the sweep left behind. Whatever it returns as gaps
is build work for step 8 and never bug-fix work for the sweep.
