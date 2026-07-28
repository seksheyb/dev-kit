# Story Bank — INDEX

<!--
The registry for the Theme → Pillar → US-xxx hierarchy. Created and maintained by the `specify`
skill; see "Assigning US-xxx IDs" in its SKILL.md.

This file is the AUTHORITY for the next US number. Do not re-derive it by scanning specs: a spec
that is deleted, archived, or moved takes its high-water mark with it, and the next allocation
then re-issues a retired ID — silently breaking every roadmap row, plan and review that already
referenced it. The counter below only ever moves forward.

Lives at docs/global/requirements/stories/INDEX.md — project lifetime, spans milestones. Themes
outlive the milestone that introduced them, which is why this is not per-milestone.
-->

**Next US number:** US-001

## Themes and Pillars

Each pillar is one file at `stories/<theme>/<pillar>.md`. A phase in a roadmap maps to a pillar,
which is what keeps phases vertical: a pillar is a slice of user-facing capability, never a layer.

| Theme | Pillar | File | Stories | Introduced |
|-------|--------|------|---------|------------|
| _(none yet)_ | | | | |

<!--
Example once populated:

| Theme | Pillar | File | Stories | Introduced |
|-------|--------|------|---------|------------|
| Accounts | Sign-in | `accounts/sign-in.md` | US-001 – US-006 | v0.1 |
| Accounts | Profile | `accounts/profile.md` | US-007 – US-011 | v0.1 |
| Billing  | Checkout | `billing/checkout.md` | US-012 – US-020 | v0.2 |

The Stories column is a human-readable span, not a parser input. When a pillar's stories are
non-contiguous (the normal case after a few milestones), list them comma-separated instead.
-->

## Retired IDs

IDs whose story was deleted or merged away. Recorded so it is obvious the number was used and is
not available — never reissue one.

| ID | Was | Retired in | Why |
|----|-----|-----------|-----|
| _(none)_ | | | |

## Conventions

- **IDs are global and permanent.** `US-xxx` is allocated once, from this file's counter, and is
  never renumbered, reused, or re-scoped — even if the story moves to a different pillar.
- **Stories live in pillar files, never in a flat `USER_STORIES.md`.** A spec's `spec.md` may
  restate a story for readability, but the pillar file is the source of truth for its wording.
- **A story belongs to exactly one pillar.** If it genuinely serves two, it is two stories.
- **Themes are added, not planned.** Create a theme when a second pillar needs it, not upfront.
