# Changelog

All notable changes to dev-kit are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every plugin in this marketplace ships on one coordinated version — installing a lane
never means reasoning about which core it pairs with.

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
