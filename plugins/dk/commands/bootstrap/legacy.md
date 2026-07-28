---
description: Recover SDD and ADRs from undocumented existing code, then assess modernization.
argument-hint: "[M]"
gate: auto
precondition: "git ls-files | grep -qv '^docs/' && ! test -d docs/global/architecture"
asks: "Does this repo have undocumented existing code?"
---
Enable the dev-kit-backend plugin first — step 2 is too late. Then the spec-miner skill, then
gate-reverse-engineer to promote what it mined, then legacy-modernizer against that recovered
picture, recording its migration-strategy choice as an ADR. Assessment and plan only: step 8
builds it, step 3 sequences it.
