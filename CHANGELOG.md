# Changelog

All notable changes to dev-kit are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every plugin in this marketplace ships on one coordinated version — installing a lane
never means reasoning about which core it pairs with.

## [Unreleased]

### Added

- **Agent model-tier policy** (`dev-kit-core/references/agent-model-tiers.md`) — governs
  `model:` frontmatter across all 41 agents in `dev-kit-core`/`dev-kit-data-ai`. Confirms
  `model:` is a real, harness-honored override and that no per-agent `effort:` key exists
  or is planned; sets `doc-classifier`, `doc-verifier`, `health-reporter`, and `retro` to
  `model: haiku` as bounded, cheaply-verified transforms, and enumerates 15 gate-feeding /
  adversarial agents that stay on inherit regardless of cost.

### Changed

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
