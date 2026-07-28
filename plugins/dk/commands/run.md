---
description: The orchestrator — walk the RUNBOOK from the current position. Manual stops at every step; auto stops at operator gates; sleep stops at nothing.
argument-hint: "[--manual | --auto | --sleep] [--from <stage>]"
---
Walk `${CLAUDE_PLUGIN_ROOT}/RUNBOOK.md` from the position in `.dk-state`. Parse `$ARGUMENTS` for the
mode; absent one, use the mode recorded in `.dk-state`, defaulting to `--manual`.

**Resolve the next step's gate from its command frontmatter, never from RUNBOOK prose:**

- `gate: always` — run it.
- `gate: auto` — evaluate `precondition:` as a shell test in the repo root. True runs, false skips.
  If the command has no `precondition:`, or it cannot be evaluated, treat it as `gate: operator` and
  use its `asks:` — never guess a predicate you could not check.
- `gate: verdict` — run only if `on:` matches the last recorded verdict in `.dk-state`.
- `gate: operator` — see mode table below.
- `blocking: true` — a REVISE/BLOCKER/UNSOUND/`gate_passed: false`/`human_needed` verdict halts the
  walk in every mode, including sleep. Report and stop.
- `exclusive-with:` — the two are mutually exclusive; once one has run, skip the other for this
  milestone.

**Mode governs stop-frequency, nothing else:**

| Mode | Stops at |
|---|---|
| `--manual` | **every step** — show the command, its body, and its gate; wait for run / skip / edit / stop |
| `--auto` | `gate: operator` steps only |
| `--sleep` | nothing — read the answer for each `gate: operator` from `.claude/dk-policy.yml`; if a gate has no entry there, **stop**, do not assume |

**After each step**, append the command, its verdict and the timestamp to
`docs/state/journal/<NN>-<slug>.md`, and update `.dk-state`. At a **session boundary**, also write
`docs/state/STATE.md`, run `context-save`, and then stop and tell the operator to `/clear` and
re-run `/dk:run` — the boundary is a gate in every mode, including sleep. Position lives on disk, so
the walk resumes exactly where it stopped.

Never inline a step's prompt yourself: dispatch the actual `dk` command so there is exactly one copy
of every prompt.
