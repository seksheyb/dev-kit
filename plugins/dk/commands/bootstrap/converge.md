---
description: Reconcile this project's vendored dk artifacts with what the plugin actually ships — reports drift, removes copies that are no longer vendored, refreshes the ones that still are.
argument-hint: "[--apply]"
gate: never
---
Run the drift report first, always, whatever `$ARGUMENTS` says:

```bash
dk-converge.mjs --check
```

`dk-converge.mjs` is a bare command — it ships in this plugin's `bin/`, which Claude Code puts on the
Bash tool's `PATH`. No path, no `node` prefix, nothing installed into the project.

Show the operator the report as it came back. Then read the exit code, and do not improvise past it:

- **0 — converged.** Say so and stop. Absent is a valid, and now the *desired*, state for
  `.claude/bin/complexity-score.mjs`, `routing-engine.mjs` and `complexity.config.json`: those are
  reached off `PATH` and off the plugin's own config. An `ABSENT-OK` line is not a gap to fill.
- **1 — mechanical drift.** Copies that dk shipped and no longer vendors, or a status-line hook that
  has fallen behind. Re-run with `--apply` if `$ARGUMENTS` contains `--apply`; otherwise show what
  `--apply` would do and ask. `--apply` moves each import closure as a set — the scorer with its
  engine, the context hook with `dk-common.js` — so a half-updated pair is not reachable.
- **3 — a decision is needed, and it is not yours to make.** A `FOREIGN` file matches no version dk
  has ever shipped; a `CUSTOMIZED` config differs from all of them and may carry real local tuning.
  `--apply` deliberately leaves both untouched and still exits 3. Surface them to the operator with
  what the tool said, and stop. Do not delete, overwrite or "migrate" either one on your own
  judgment — that is how a project loses work it never agreed to trade.
- **2 — usage or an unreadable project.** Report the stderr line verbatim.

Never write `complexity-calibration.json`, under any exit code or argument. It is telemetry-derived
and owner-approved, and the tool reports it `READ-ONLY` for that reason. `UNRECOGNIZED` entries are
the project's own files that dk has never shipped; they are reported so nobody is surprised by them,
not so they can be cleaned up.

Wiring this into CI or a `SessionStart` hook is supported and is the point of the exit codes: `1`
means "run `--apply`", `3` never does.
