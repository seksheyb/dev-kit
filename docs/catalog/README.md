# dev-kit Role Catalog

A role-based map of every skill, agent, and command across all 8 `dev-kit` plugins —
193 entries total. No plugin boundaries changed; this is a reading guide layered on
top of the existing marketplace structure (see the [root README](../../README.md) for
install instructions).

## The mental model: two axes

Every real practitioner using this kit is wearing two hats at once:

1. **Phase role** — *where in the SDD lifecycle am I right now?* (Product/Requirements
   → Architect/Planner → UX/Design → Engineer → Security → Docs/Release). These live in
   `dev-kit-core` and apply regardless of what you're building.
2. **Stack lane** — *what am I building it in?* (Backend, Frontend/Web, Mobile,
   Data/AI, Infra/Platform, a specialized vertical, or product analytics/compliance).
   These live in the 7 lane plugins and are largely stack-reference packs: one skill
   per framework/domain, no phase structure of their own.

A backend engineer planning a phase is "Architect/Planner" (core) + "Backend Engineer"
(lane) at the same moment — the two axes combine, they don't replace each other.

## Part 1 — Phase roles (`dev-kit-core`)

| Role | What they're doing | Catalog | Items |
|---|---|---|---|
| Product / Requirements Owner | Turning an idea into a validated, unambiguous spec | [core-discovery-and-design.md](core-discovery-and-design.md#role-product--requirements-owner) | 18 |
| Architect / Planner | Designing the system and breaking it into an executable, reviewed plan | [core-discovery-and-design.md](core-discovery-and-design.md#role-architect--planner) | 19 |
| UX / Design | Turning an approved design into a real, accessible interface | [core-discovery-and-design.md](core-discovery-and-design.md#role-ux--design) | 10 |
| Engineer (Build & Debug) | Implementing, debugging, and verifying the plan against reality | [core-build-and-ship.md](core-build-and-ship.md#role-engineer-build--debug) | 27 |
| Security / Compliance Reviewer | Checking the implementation against threat models and regulatory bars | [core-build-and-ship.md](core-build-and-ship.md#role-security--compliance-reviewer) | 8 |
| Docs / Release / Ops Manager | Documenting, shipping, and monitoring what got built | [core-build-and-ship.md](core-build-and-ship.md#role-docs--release--ops-manager) | 15 |

**97 items** — 51 skills, 38 agents, 8 commands.

## Part 2 — Stack lanes (lane plugins)

| Lane persona | Plugin | Catalog | Items |
|---|---|---|---|
| Backend Engineer | `dev-kit-backend` | [backend.md](backend.md) | 26 |
| Frontend / Web Engineer | `dev-kit-web` | [web.md](web.md) | 11 |
| Mobile Engineer | `dev-kit-mobile` | [mobile.md](mobile.md) | 4 |
| Data / AI Engineer | `dev-kit-data-ai` | [data-ai.md](data-ai.md) | 17 |
| Infra / Platform Engineer | `dev-kit-infra` | [infra.md](infra.md) | 14 |
| Specialized Domain Expert | `dev-kit-specialized` | [specialized.md](specialized.md) | 19 |
| Product Analyst & Compliance | `dev-kit-product` | [product.md](product.md) | 5 |

**96 items** — 143 skills total across core + lanes minus the 51 core skills already
counted in Part 1, plus the 4 `dev-kit-data-ai` agents. (96 = 92 lane skills + 4 lane agents.)

## Entry format

Every skill, agent, and command in this catalog is documented with the same six
fields, each grounded in an actual read of its file — not generic filler:

- **Why needed** — the real gap or friction it addresses
- **What it does** — its concrete process/output
- **Why not vanilla Claude Code** — specifically why unassisted Claude Code gets this
  wrong, misses it, or does it inconsistently without the skill/agent loaded
- **When to use** — the concrete trigger, usually straight from its frontmatter
- **Then what** — the artifact or state change that exists after it runs
- **Notes** — only present where there's a genuine caveat or cross-reference to
  another entry; omitted otherwise (not padded for symmetry)

## Known overlaps worth knowing about

A few entries are relevant to more than one role/lane; they're documented once under
their primary owner and cross-referenced from wherever else they matter, rather than
duplicated:

- `diagram` and `plan-review-design` (Architect/Planner) are also load-bearing for
  UX/Design.
- `writing-plans` (Architect/Planner) is authored by that role but consumed daily by
  Engineer.
- The plan-review lens skills (`plan-review-ceo/eng/devex/goal-backward/design`) are
  dispatched together in parallel by the single `plan-reviewer` agent — they're
  co-located in the same plugin specifically so this fan-out never breaks across a
  plugin boundary.
- `assumption-mapping` (Product/Requirements) feeds directly into `backlog-grooming`.
- `eval-planner` / `eval-auditor` (Data/AI) are a matched pair — plan the evaluation
  strategy, then retroactively audit coverage against it.
