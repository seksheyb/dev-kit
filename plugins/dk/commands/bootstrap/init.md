---
description: Stand up a new dev-kit project (or adopt an existing repo) — writes CLAUDE.md, .gitignore, .claude/settings.json, docs/SITEMAP.md and the three doc tiers.
argument-hint: "<projectName> | --here"
gate: always
---
`${CLAUDE_PLUGIN_ROOT}/references/scaffold-contract.md` is the contract for what lands in a project
and on what terms — read it first and follow its two overwrite rules, reporting which one you
applied per file.

Scaffold from `${CLAUDE_PLUGIN_ROOT}/templates/`. Parse `$ARGUMENTS` as the project name, or
`--here` to adopt the current repo in place. Create the directory unless `--here`, then write the
templates (write-once) and copy `${CLAUDE_PLUGIN_ROOT}/hooks/dk-context.js` with
`${CLAUDE_PLUGIN_ROOT}/hooks/lib/dk-common.js` to `.claude/hooks/` as a set (refreshed every run).

Copy nothing into `.claude/bin/` and never seed `complexity.config.json`. If the repo you are
adopting already has either, leave them and point the operator at `/dk:bootstrap:converge`.

Only `dev-kit-core` is on; step 2 enables the stack lanes.
