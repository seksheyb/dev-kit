---
description: Stand up a new dev-kit project (or adopt an existing repo) — writes CLAUDE.md, .gitignore, .claude/settings.json, docs/SITEMAP.md and the three doc tiers.
argument-hint: "<projectName> | --here"
gate: always
---
Scaffold a dev-kit project from `${CLAUDE_PLUGIN_ROOT}/templates/`. Parse `$ARGUMENTS` as the project
name, or `--here` to adopt the current repo in place. Create the directory (unless `--here`), then
write the files below.

**Two file classes, two different overwrite rules.** State which rule you applied for every file you
touch, so a re-run is auditable.

1. **Scaffolded templates — write once, never overwrite.** `CLAUDE.md`, `.gitignore`,
   `.claude/settings.json`, `docs/SITEMAP.md` and the three doc tiers. These become project content
   the moment they land: the operator edits them, and a re-run that clobbered them would destroy
   real work. If one already exists, leave it and report it as skipped. Re-running this command
   never refreshes them.

2. **Plugin artifacts copied into the project — overwrite on every run, as a set.**
   `${CLAUDE_PLUGIN_ROOT}/hooks/dk-context.js` and `${CLAUDE_PLUGIN_ROOT}/hooks/lib/dk-common.js` to
   `.claude/hooks/`. These carry zero project content — they are byte-for-byte plugin output — so
   there is nothing to preserve and a stale copy is pure liability. Copy the pair together, never
   one without the other: they are one import closure, and a half-updated pair fails in a way
   neither file's own version stamp can explain. Re-run this command after updating the `dk` plugin
   to refresh them; a stale copy degrades the context monitor to its conservative fallback rather
   than breaking it.

   This copy exists for one specific reason that no path convention fixes: the scaffolded
   `settings.json` wires a `statusLine` to it, a plugin cannot declare a `statusLine`, and
   `settings.json` cannot interpolate a plugin path. That reason still holds. It does **not**
   generalize to anything else.

**Copy no executables into `.claude/bin/`.** Earlier versions of this command copied the complexity
scorer and its config there. That was a workaround for a path convention that turned out to already
exist: Claude Code puts every enabled plugin's `bin/` on the Bash tool's `PATH`, so
`complexity-score.mjs` and `model-route.mjs` are bare commands from any cwd in any project, with
nothing vendored and nothing to go stale. See `dev-kit-core`'s `references/plugin-paths.md`. If the
project you are adopting already has `.claude/bin/complexity-score.mjs`, `routing-engine.mjs` or
`complexity.config.json`, do not touch them here — tell the operator to run
`/dk:bootstrap:converge`, which knows how to tell a stale plugin artifact from a file it has never
shipped.

**The one tunable, and why it is not copied.** `complexity.config.json` has exactly two keys that
are project-shaped — `sensitivePaths` (`critical`/`sensitive`/`adjacent`) and `reversibility`
(`destructive`/`schema`), globs that raise a track's risk score. The shipped values
(`**/auth/**`, `**/payments/**`, `**/migrations/**`, `**/terraform/**`) are approximately right on
any repo and exactly right on none. Everything else in that file — `modelBands`, `effortBands`,
`capabilityFloors`, `effortFloors`, `agents.effortFloor` — is a universal ladder that nothing about
a single project justifies pinning.

Copying the file is therefore **opt-in, and only to tune those two keys**. Do not seed it here: a
project copy takes precedence over the plugin's, so a copy carrying no project-specific values is a
pure staleness pin — it silently freezes scaffold-day defaults and re-breaks on the next schema
change. If the operator asks for one, say plainly what they are taking on: the copy overrides the
plugin's config wholesale, not key-by-key, and it must be re-migrated by hand on every `dk` update
that touches the schema. `/dk:bootstrap:converge --check` reports when a copy has fallen behind.

Only `dev-kit-core` is on; step 2 enables the stack lanes.
