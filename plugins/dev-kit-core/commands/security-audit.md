---
description: Run a security audit — scan for vulnerabilities and verify declared threat mitigations exist in code — dispatch the security-auditor agent.
---

Parse `$ARGUMENTS` for an optional scope (paths, subsystem, or focus area; default: the whole repo or current change).

Dispatch `agents/security-auditor` over that scope.

Expected output: severity-ranked security findings with locations and remediation guidance.

## Milestone-wide fan-out

When the scope is a whole milestone rather than one change, audit **one phase at a time, in parallel** — one
`security-auditor` per phase, each scoped to the threat model *that phase declared*, never to the current diff.
Route on how many phases the milestone shipped:

| Phases in the milestone | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/security-gate.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor for the agent role — `security-auditor` — surface "workflow", profile review, signals declared per that doc's profile tables; write it keyed by role to a temp JSON; run `model-route.mjs --caller security-audit --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. One descriptor per ROLE, not per phase: the N per-phase auditors are N instances of the one `security-auditor` role and share a single routing entry, which is the key `security-gate.workflow.mjs` looks up. `security-auditor` is on `agent-model-tiers.md`'s never-downgrade list, so its config pin is a floor the router itself applies and returns — never hand-set it here, and never skip the step to get "inherit", which is a router decision. On the exactly-1 path use the same descriptor with `surface: "agent"` and `--caller security-audit --json` on stdin, then inject the §6 effort prompt block (`effortParam` is always `null` on that surface).

```
Workflow({
  // run the bare command dev-kit-core-root and substitute its output for <dev-kit-core>
  scriptPath: "<dev-kit-core>/references/workflows/security-gate.workflow.mjs",
  args: {
    milestone: "<M>",              // required
    phases: [                      // required, 2 or more
      { phaseId, phaseDir, threatModelPath }, // one entry per phase the milestone shipped
    ],
  },
})
```

A dead run resumes via `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.

The script has zero judgment: it dispatches one auditor per phase, waits, and concatenates what they return —
it never dedupes. Merging the per-phase results into one threat register is yours, and so is the ordering that
follows: `cso` in `--diff` mode runs only once **every** auditor is back and never beside them (it needs the
whole register to diff against), and `dependency-manager` runs only after `cso`, because it rewrites the
manifests and lockfiles `cso` just fingerprinted. Do not add `security-reviewer` as a second parallel scanner
over the same ground — that ban is about a redundant scanner, not about this per-phase fan-out.

An unaudited phase is never a clean phase: the script returns `unauditedPhases` separately from `openThreats`
and `couldNotVerify`, precisely so a dropped auditor cannot read as a pass.
