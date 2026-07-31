---
description: Reconcile this project's vendored dk artifacts with what the plugin actually ships — reports drift, removes copies that are no longer vendored, refreshes the ones that still are.
gate: auto
precondition: "! dk-converge.mjs --check >/dev/null 2>&1"
asks: "Has a dk plugin update left this project carrying stale copies?"
argument-hint: "[--apply]"
---
`${CLAUDE_PLUGIN_ROOT}/references/scaffold-contract.md` § Converging an existing project is the
contract — read it, then run the read-only report first whatever `$ARGUMENTS` says:

```bash
dk-converge.mjs --check
```

A bare command, off this plugin's `bin/` on the Bash tool's `PATH` — no path, no `node` prefix.

Show the operator the report verbatim, then act on the exit code per that reference: `0` stop, `1`
apply when `$ARGUMENTS` says so and otherwise ask, `3` surface and stop, `2` report the stderr line.
Never write `complexity-calibration.json`, under any exit code or argument.
