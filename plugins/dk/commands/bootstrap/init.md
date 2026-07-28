---
description: Stand up a new dev-kit project (or adopt an existing repo) — writes CLAUDE.md, .gitignore, .claude/settings.json, docs/SITEMAP.md and the three doc tiers.
argument-hint: "<projectName> | --here"
gate: always
---
Scaffold a dev-kit project from `${CLAUDE_PLUGIN_ROOT}/templates/`. Parse `$ARGUMENTS` as the project
name, or `--here` to adopt the current repo in place. Create the directory (unless `--here`), then
write `CLAUDE.md`, `.gitignore`, `.claude/settings.json`, `docs/SITEMAP.md` and the three doc tiers
from the templates — never overwrite a file that already exists, report it instead.

Only `dev-kit-core` is on; step 2 enables the stack lanes.

→ next: `cd` into the project, start a session there, then `/dk:bootstrap:constitution`
