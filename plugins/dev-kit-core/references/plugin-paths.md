# Referencing a plugin's files from a consuming project

Dev-kit ships as nine plugins. Its assets constantly need to reach files that live in a *different*
plugin than the one being read — `dev-kit-core`'s `gate-plan-review` runs `dk`'s complexity scorer;
a dozen `dev-kit-core` skills and thirteen `dk` commands run `dk`'s model router. This file is the
one convention for doing that. Every executable and every script path in the corpus resolves through
one of the three forms below.

## What does not work, and why

| Form | Why it fails |
|---|---|
| `node plugins/dk/bin/model-route.mjs` | Repo-relative. `plugins/` exists in the dev-kit repo and nowhere else. Works when you test from inside dev-kit, which is exactly why it survived. |
| `${CLAUDE_PLUGIN_ROOT}/…` from another plugin | Resolves to the **referencing** plugin's root. A `dev-kit-core` agent cannot name `dk/bin/` with it. |
| `~/.claude/plugins/cache/dev-kit/dk/1.0.0/bin/…` | The install path is version-stamped and replaced on every update. Hardcoding it goes stale silently. |
| `node .claude/bin/complexity-score.mjs` | A copy vendored into the consuming project. Stale by construction, and the copy overrides the plugin's own — the failure mode that motivated this file. See `dk`'s `bootstrap/converge` command. |

`node <name>` is worth calling out on its own: `node` resolves its script argument against the
**cwd**, never `PATH`. `node model-route.mjs` fails everywhere the cwd is not the plugin's `bin/`.
Drop the `node`.

## Form 1 — executables: invoke as a bare command

Claude Code adds every enabled plugin's `bin/` directory to the Bash tool's `PATH`. Files there are
invokable as bare commands in any Bash tool call, from any cwd, from any plugin's agent, skill or
command, with no interpolation and nothing vendored into the project.

```bash
model-route.mjs --caller <asset> --batch <file>
complexity-score.mjs "$plan_path" --gate --json
```

This is the default form. Prefer it for anything that can be an executable.

What it costs: the file must carry a `#!` line and the executable bit, and it must keep its exact
name — the name *is* the interface. `plugins/dk/bin/tests/plugin-path-resolution.test.sh` asserts
both for every executable the corpus invokes.

What it requires: the plugin that ships the executable must be **enabled**. `model-route.mjs` and
`complexity-score.mjs` both live in `dk`, so a `dev-kit-core` asset that calls them needs `dk`
enabled — which every `/dk:*` pipeline step already does by construction. A missing executable
surfaces as exit `127` / an empty `command -v`, and the correct remedy is always *enable the
plugin*, never *copy the file into the repo*.

## Form 2 — non-executable files: resolve the plugin root first

A reference doc, or a workflow script handed to `Workflow({ scriptPath })`, needs a real filesystem
path. `PATH` cannot supply one, so each plugin ships a tiny executable that prints its own installed
root — reachable by Form 1, and answering the one question `PATH` cannot.

```bash
dev-kit-core-root            # -> /…/plugins/cache/dev-kit/dev-kit-core/<version>
```

Wherever this corpus writes the placeholder `<dev-kit-core>`, that is what it means:

```js
Workflow({ scriptPath: "$(dev-kit-core-root)/references/workflows/plan-review.workflow.mjs", args })
```

Run the helper and substitute the value; do not pass the literal `$(…)` string through to a tool
that does not run a shell.

## Form 3 — same-plugin references: cite them plugin-relative

Inside one plugin, never spell out a `plugins/<name>/…` path at all. Agents and skills cite their
own plugin's files with the `@references/…` form, and reach their own plugin's skills by **skill
id**:

```
@references/doc-sitemap.md
@references/complexity-signals.md
dev-kit-core:writing-plans          <- a skill, invoked by id, never by SKILL.md path
```

## Where a repo-relative `plugins/…` path is still correct

Prose that documents dev-kit's own source layout — `README.md`, `docs/`, "the shipped config lives
at `plugins/dk/bin/complexity.config.json`" — is describing the repository, not telling an agent
what to run. Those stay. The test above only scans **invocation** and **scriptPath** sites.
