---
description: Recover SDD and ADRs from undocumented code, and ingest ADRs/PRDs/specs that sit outside the canonical locations.
argument-hint: "[M]"
gate: auto
precondition: "(git ls-files | grep -qv '^docs/' && ! test -d docs/global/architecture) || (git ls-files '*.md' | grep -qiE '(adr|prd|spec)' | grep -qv '^docs/')"
asks: "Does this repo have undocumented existing code, ADRs/PRDs/specs outside the canonical locations, or both?"
---
Two independent recoveries. Run only the halves whose own condition holds; when both hold, run them concurrently — they touch different files (recovered requirements vs classified doc intel).

**Code half.** Enable the dev-kit-backend plugin **first** — step 2 is too late. Then the spec-miner
skill, then gate-reverse-engineer to promote what it mined, then legacy-modernizer against that
recovered picture, recording its migration-strategy choice as an ADR. Assessment and plan only:
step 8 builds it.

**Docs half.** 2 or more documents is the doc-ingest Workflow, mandatory; exactly 1 is a plain inline pair of
Agent calls — one doc-classifier, then one doc-synthesizer next turn.

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — `doc-classifier` at profile research, `doc-synthesizer` at profile writing — surface "workflow", signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller bootstrap:intake --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.
```
Workflow({ scriptPath: "<dev-kit-core>/references/workflows/doc-ingest.workflow.mjs",   // real fs path
  args: { docs: [{ path }] } })   // required, 2+; outputDir/intelDir/mode optional overrides
```
