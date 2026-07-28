---
description: Stand up a new dev-kit project (or adopt an existing repo) — writes CLAUDE.md, .gitignore, .claude/settings.json, docs/SITEMAP.md and the three doc tiers.
argument-hint: "<projectName> | --here"
gate: always
---
Scaffold a dev-kit project from `${CLAUDE_PLUGIN_ROOT}/templates/`. Parse `$ARGUMENTS` as the project
name, or `--here` to adopt the current repo in place. Create the directory (unless `--here`), then
write `CLAUDE.md`, `.gitignore`, `.claude/settings.json`, `docs/SITEMAP.md` and the three doc tiers
from the templates — never overwrite a file that already exists, report it instead.

Also copy `${CLAUDE_PLUGIN_ROOT}/hooks/dk-context.js` and `${CLAUDE_PLUGIN_ROOT}/hooks/lib/dk-common.js`
to `.claude/hooks/` — the scaffolded `settings.json` wires a `statusLine` to that copy. A plugin cannot
declare a `statusLine`, and the plugin's own directory is replaced on every update, so the copy is what
makes the path stable. Re-run this command after updating the `dk` plugin to refresh it; a stale copy
degrades the context monitor to its conservative fallback rather than breaking it.

Only `dev-kit-core` is on; step 2 enables the stack lanes.
