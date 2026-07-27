# Roadmap: shortlisted for execution

Items pulled out of `ROADMAP.md` to be worked next. Source of truth for scope stays
`ROADMAP.md`; this file is the working shortlist.

Shortlisted: **none — the shortlist is empty.**

## Last wave: all 10 items shipped

**1.13**, **1.15**, **2.12**, **2.13**, **2.14**, **2.15**, **2.16**, **2.17**, **2.18**,
**2.19** all shipped in a two-wave parallel fix run. Status and one-line outcomes live in
`ROADMAP.md`'s Milestone 1 and Milestone 2 tables; implementation detail lives in the git
history. Cleared from this file so it only tracks live work.

The one hard dependency held: **2.14 was blocked on 1.13** and was dispatched only after 1.13
merged, with `scripts/checks/aispec-coauthor-guards.sh` passing as the precondition check.

**Guards:** `scripts/checks/` now holds 16 run-by-hand scripts, up from 9. Seven were added by
this wave (`aispec-coauthor`, `brainstorming-premise`, `chaos-incident-seeding`, `orphan-asset`,
`rag-aispec-deference`, `single-cause-diagnosis`, `ui-audit-severity`) and `diagram-delegation`
was extended. Each was verified failing against the pre-fix file and passing against the fix.
All 16 pass against `main`.

**Two items were assessment-first, and the assessment mattered.** 2.18 and 2.19 were flagged
"confirm before touching" rather than scheduled as edits. Confirming was the right call: of 14
line references across the two items, **5 were genuine defects and 9 were correct as-is** and
were recorded with reasons rather than edited. A uniform sweep would have churned nine call
sites to no benefit.

---

## Open elsewhere — candidates for the next shortlist

Not scheduled here yet; listed so the next shortlist has a starting set.

| # | Asset | Why it is still open |
|---|---|---|
| 1.2 | `agents/pattern-mapper.md` | Unblocked since 1.1 shipped. Note it overlaps `roadmap-shortlisted-workflow.md` item 1 (consumer-identity axis) — worth resolving on the same visit rather than twice. |
| 1.4 | `agents/roadmapper.md` | Must *create* `REQUIREMENTS.md`, not just update it. Gates workflow item 2 (retiring `PRD.md`). |
| 1.7 | D2 — lane skills vs TDD ordering | Superseded in scope by `roadmap-shortlisted-workflow.md` item 3, which is marked unblocked. The roster still needs per-skill verification before the line is inserted. |
| 1.14 | `skills/graphify` | **Cannot be closed by a commit in this repo** — `graphify` is a personal skill at `~/.claude/skills/graphify/SKILL.md`. The fix is a prompt-level change applied at kickoff time; see the delivery note under `ROADMAP.md` 1.14. |

## New finding surfaced by this wave — worth scoping as its own item

**Declared classification tier with no field to land in.** Two tracks independently hit the
same shape: an asset declares a severity/confidence tier, but the tier has no representation
anywhere in that asset's own output schema — so the weaker tier silently reads as the stronger
one. This is a distinct defect from 1.15's "taxonomy doesn't reach the findings section": there
the label was missing from a template that could hold it; here there is no field at all.

Confirmed instances, all fixed during this wave:

| Asset | The tier that had nowhere to go |
|---|---|
| `skills/cso` | `SELF-VERIFIED` — Status enum offered only `VERIFIED\|UNVERIFIED\|TENTATIVE`, so a same-context self-read was indistinguishable from an independently-confirmed finding |
| `agents/doc-verifier` | UNVERIFIABLE — against a PASS/FAIL-only schema, so unverifiable claims vanished from the report entirely |
| `agents/nyquist-auditor` | "caveated pass" — a bare `status: "green"` could not be told apart from a caveated one |
| `agents/integration-checker` | WARNING declared, but the resolution logic handled only WIRED/BROKEN |
| `agents/ui-auditor` | BLOCKER/WARNING (this is item 1.15 itself) |

Five instances across two unrelated sweeps is a class, not a coincidence.

**Why it still needs an item despite all five being fixed:** only `ui-auditor`/`design-reviewer`
and `cso` are guarded. The `doc-verifier`, `nyquist-auditor`, and `integration-checker` fixes
are **unguarded**, and no sweep has asked the question repo-wide — the five surfaced incidentally
while looking for two different things. Scope: extend `ui-audit-severity-guards.sh` (or add a
sibling) to cover the three unguarded fixes, then sweep every asset that declares a tier and
check it against that asset's own output schema.
