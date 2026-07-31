# Changelog

All notable changes to dev-kit are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every plugin in this marketplace ships on one coordinated version — installing a lane
never means reasoning about which core it pairs with.

## [Unreleased]

### Upgrading — action required for projects scaffolded on 1.0.0 or earlier

`/dk:bootstrap:init` used to copy the complexity scorer and its config into each project's
`.claude/bin/`. Those copies are no longer written, and existing ones should be removed.
**After `/reload-plugins`, run `/dk:bootstrap:converge` in each project you have scaffolded**
— `--check` first, then `--apply`. It reports per-file status and exits non-zero on drift, so
it also wires into CI or a `SessionStart` hook.

Why it matters: a project copy of `complexity.config.json` *overrides* the plugin's, so a
scaffold-day copy silently pinned pre-router defaults. When the model router landed,
`model-route.mjs` rejected those configs outright — and because routing is mandatory before
dispatch, that took down every `/dk:*` command in three projects at once. Projects that had no
copy were unaffected.

`dk-converge` refuses to overwrite anything matching no version dk has shipped (exit `3`), and
never writes `complexity-calibration.json` under any flag.

### Added

- **A documented cross-plugin path convention** (`dev-kit-core/references/plugin-paths.md`).
  Claude Code puts every enabled plugin's `bin/` on the Bash tool's `PATH`, so
  `model-route.mjs`, `complexity-score.mjs` and `dk-converge.mjs` are bare commands from any
  cwd in any project — no `node` prefix, no path, nothing vendored. Non-executable files
  (workflow scripts handed to `Workflow({ scriptPath })`) resolve through a new
  `dev-kit-core-root` helper, which is what the `<dev-kit-core>` placeholder has always meant.
  All 26 `node plugins/dk/bin/…` invocations across `dk` commands and `dev-kit-core`
  skills/commands were repo-relative and worked only from inside the dev-kit checkout; they now
  use the bare form.
- **`/dk:bootstrap:converge`** and `dk-converge.mjs` — reconcile a project's vendored dk
  artifacts with what the plugin ships. `--check` is read-only and exits `1` on mechanical
  drift, `3` when a file needs a human decision. `--apply` removes copies that are no longer
  vendored, refreshes the status-line hook pair, and moves each import closure as a set so a
  half-updated pair is unreachable.
- **Three regression tests** in `plugins/dk/bin/tests/` — `plugin-path-resolution.test.sh`
  (every invocation form resolves from a simulated consuming-project cwd; this is the one that
  would have caught the whole class), `config-fallback.test.sh` (both tools produce identical
  decisions with and without a project config), and `dk-converge.test.sh` (walks each managed
  executable's local-import closure transitively rather than asserting a filename, so it does
  not re-break on the next sibling import).

- **Agent model-tier policy** (`dev-kit-core/references/agent-model-tiers.md`) — governs
  `model:` frontmatter across all 41 agents in `dev-kit-core`/`dev-kit-data-ai`. Confirms
  `model:` is a real, harness-honored override and that no per-agent `effort:` key exists
  or is planned; sets `doc-classifier`, `doc-verifier`, `health-reporter`, and `retro` to
  `model: haiku` as bounded, cheaply-verified transforms, and enumerates 15 gate-feeding /
  adversarial agents that stay on inherit regardless of cost.

### Changed

- **`/dk:bootstrap:init` vendors nothing into `.claude/bin/`.** The copy list was wrong in
  both directions: it omitted `routing-engine.mjs`, which `complexity-score.mjs` imports — so
  every project bootstrapped on 1.0.0 failed its first gate run with `ERR_MODULE_NOT_FOUND` —
  and it included `complexity.config.json`, which must not be copied at all. The command now
  also states its overwrite rule per file class, which was previously ambiguous: scaffolded
  templates are written once and never overwritten; the status-line hook pair is overwritten on
  every run, as a set. That hook copy keeps its own independent reason to exist —
  `settings.json` cannot interpolate a plugin path for `statusLine`.
- **`complexity.config.json` is opt-in, and only to tune two keys.** `sensitivePaths` and
  `reversibility` are the only project-shaped values in it; `modelBands`, `effortBands`,
  `capabilityFloors`, `effortFloors` and `agents.effortFloor` are universal ladders that never
  justify a local copy. A copy overrides the plugin's config wholesale rather than key-by-key,
  so `init.md` now says plainly what taking one on costs instead of writing a generic copy and
  calling it tunable.
- **`plugins/dk/templates/gitignore`** ignores `.claude/routing-log.jsonl`. `model-route.mjs`
  appends to it on every routing call, so projects were accruing untracked noise.
- **`dk:discover:research`** now caps advisor-researcher fan-out at 5 per wave and
  dispatches each with an explicit `model: haiku` override — the fix for the discovery
  wave that measured ~900k tokens across 10 advisors + pattern-mapper in one message.
  `pattern-mapper`'s own model tier is left unchanged (see the policy doc for why).

## [1.0.0] — 2026-07-29

First released version. History before this point was squashed into the initial commit.

### Added

- **`dk` — the orchestration layer.** `RUNBOOK.md` carries the stage spine: 15 stages
  from idea to shipped milestone, in three parts (once per milestone, the per-phase
  loop, and milestone close). 65 thin dispatcher commands sit under it, one per prompt
  unit, runnable by hand or driven by the `/dk:run` orchestrator.
- **Three gate classes** the orchestrator acts on — `auto` (decidable from the repo),
  `verdict` (routed by the previous step's result), and `operator` (stops and asks) —
  plus `blocking: true` for the gates no mode may advance past.
- **`dev-kit-core`** — process discipline, the SDD spine, lens-based plan review,
  dev-loop workflows, lifecycle agents, and gates. Install everywhere.
- **Seven lane plugins** — `web`, `mobile`, `backend`, `data-ai`, `infra`,
  `specialized`, `product` — enabled per project from the architecture stage.
- **A canonical doc-path contract** (`docs/SITEMAP.md`). Every asset derives its paths
  from the sitemap plus a set of ids, so producers and consumers never diverge and no
  asset invents a top-level directory.
- **Guard scripts** under `scripts/checks/` that hold the command layer thin, keep
  `RUNBOOK.md` the single source of sequencing, and catch regressions in the asset
  contracts.

### Parallelism

Stages declare what fans out and what cannot, and every sequential constraint states
its reason inline rather than asserting itself:

- Phase discovery runs as two waves rather than four serial dispatches.
- Plan review fans out one reviewer per lens and consolidates.
- The adversarial review round freezes a commit, fans out every finder against it, and
  triages into one deduped set before a single fix sweep — finders are read-only, the
  sweep is the only writer.
- The milestone gates run concurrently; per-phase security audits fan out.

The constraints that remain sequential do so for stated cause — shared-file writes,
scanner fingerprint hazards, and real data dependencies.

[1.0.0]: https://github.com/seksheyb/dev-kit/releases/tag/v1.0.0
