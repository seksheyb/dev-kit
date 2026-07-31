# What dev-kit puts in a project, and what keeps it current

The contract behind `/dk:bootstrap:init` and `/dk:bootstrap:converge`. Both commands are thin
dispatchers; the rules live here.

## Two file classes, two overwrite rules

State which rule you applied for every file you touch, so a re-run is auditable.

**1. Scaffolded templates — write once, never overwrite.** `CLAUDE.md`, `.gitignore`,
`.claude/settings.json`, `docs/SITEMAP.md` and the three doc tiers. These become project content the
moment they land: the operator edits them, and a re-run that clobbered them would destroy real work.
If one already exists, leave it and report it as skipped. Re-running `init` never refreshes them.

**2. Plugin artifacts copied into the project — overwrite every run, as a set.**
`hooks/dk-context.js` and `hooks/lib/dk-common.js` → `.claude/hooks/`. These carry zero project
content — they are byte-for-byte plugin output — so there is nothing to preserve and a stale copy is
pure liability. Copy the pair together, never one without the other: they are one import closure,
and a half-updated pair fails in a way neither file's own version stamp can explain.

That copy exists for one specific reason no path convention fixes: the scaffolded `settings.json`
wires a `statusLine` to it, a plugin cannot declare a `statusLine`, and `settings.json` cannot
interpolate a plugin path. That reason still holds. It does **not** generalize to anything else.

## Copy no executables into `.claude/bin/`

Earlier versions copied the complexity scorer and its config there. That was a workaround for a path
convention that turned out to already exist: Claude Code puts every enabled plugin's `bin/` on the
Bash tool's `PATH`, so `complexity-score.mjs` and `model-route.mjs` are bare commands from any cwd
in any project, with nothing vendored and nothing to go stale. See `dev-kit-core`'s
`references/plugin-paths.md`.

`init` never touches an existing `.claude/bin/`. Converging one is `/dk:bootstrap:converge`'s job,
because telling a stale plugin artifact from a file dev-kit has never shipped needs the hash
manifest, not a guess.

## The one tunable, and why it is not seeded

`complexity.config.json` has exactly two project-shaped keys — `sensitivePaths`
(`critical`/`sensitive`/`adjacent`) and `reversibility` (`destructive`/`schema`), globs that raise a
track's risk score. The shipped values (`**/auth/**`, `**/payments/**`, `**/migrations/**`,
`**/terraform/**`) are approximately right on any repo and exactly right on none. Everything else —
`modelBands`, `effortBands`, `capabilityFloors`, `effortFloors`, `agents.effortFloor` — is a
universal ladder that nothing about a single project justifies pinning.

Copying the file is therefore **opt-in, and only to tune those two keys**. Never seed it: a project
copy takes precedence over the plugin's, so a copy carrying no project-specific values is a pure
staleness pin — it silently freezes scaffold-day defaults and re-breaks on the next schema change.
If the operator asks for one, say plainly what they are taking on: the copy overrides the plugin's
config wholesale, not key-by-key, and must be re-migrated by hand on every `dk` update that touches
the schema.

## Converging an existing project

`dk-converge.mjs --check` is read-only and reports per-file status. Read the exit code and do not
improvise past it:

- **0 — converged.** Absent is the *desired* state for `.claude/bin/complexity-score.mjs`,
  `routing-engine.mjs` and `complexity.config.json`. An `ABSENT-OK` line is not a gap to fill.
- **1 — mechanical drift.** Copies dev-kit shipped and no longer vendors, or a status-line hook that
  has fallen behind. `--apply` fixes it, moving each import closure as a set.
- **3 — a decision that is not yours.** A `FOREIGN` file matches no version dev-kit has ever
  shipped; a `CUSTOMIZED` config differs from all of them and may carry real local tuning. `--apply`
  leaves both untouched and still exits 3. Surface them and stop — do not delete, overwrite or
  "migrate" either on your own judgment.
- **2 — usage error or unreadable project.** Report the stderr line verbatim.

Never write `complexity-calibration.json`, under any exit code or argument: it is telemetry-derived
and owner-approved, and the tool reports it `READ-ONLY` for that reason. `UNRECOGNIZED` entries are
the project's own files that dev-kit has never shipped — reported so nobody is surprised by them,
not so they can be cleaned up. `ORPHANED-INSTALL-RECORD` is Claude Code's own state, which a live
session rewrites; the supported removal is `/plugin uninstall` from inside the project.

Wiring `--check` into CI or a `SessionStart` hook is supported and is the point of the exit codes:
`1` means "run `--apply`", `3` never does.
