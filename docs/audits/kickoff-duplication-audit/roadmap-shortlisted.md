# Roadmap: shortlisted for execution

Items pulled out of `ROADMAP.md` Milestone 1 to be worked next. Source of truth for
scope stays `ROADMAP.md`; this file is the working shortlist.

Shortlisted: **1.13**, **1.15**, **2.17**.

*(1.1, 1.3, 1.5, 1.6, 1.8, 1.9, 1.10, 1.11, 1.12 — the previous shortlist — have all
shipped or resolved with no action; see `ROADMAP.md` Milestone 1 for status and the
git history for implementation detail. Cleared from this file so it only tracks live
work.)*

---

## 1.13 — `agents/{ai-researcher,eval-planner,framework-selector}.md` (dev-kit-data-ai), `agents/domain-researcher.md` (dev-kit-core)

**Fix:** grant `Edit` alongside `Write` on all four agents, and replace each one's
"ALWAYS use the Write tool" mandate with an explicit read-modify-write contract for
updating `AI-SPEC.md`.

**Bug (surfaced by structural sweep during the M1 fix wave, same damage class as
1.3):** all four agents co-author `AI-SPEC.md` in a documented sequential chain
(`framework-selector` → `domain-researcher` → `ai-researcher` → `eval-planner`), each
owning disjoint sections. But every one of them is granted `Write` only, never `Edit`:

| Agent | `tools:` frontmatter | Sections owned |
|---|---|---|
| `framework-selector.md:4` | `Read, Write, Bash, Grep, Glob, WebSearch, AskUserQuestion` | 2 (also creates the full section skeleton) |
| `domain-researcher.md:4` | `Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*` | 1, 1b |
| `ai-researcher.md:4` | `Read, Write, Bash, Grep, Glob, WebFetch, WebSearch, mcp__context7__*` | 3, 4, 4b |
| `eval-planner.md:4` | `Read, Write, Bash, Grep, Glob, AskUserQuestion` | 5, 6, 7 |

`Write` is a whole-file overwrite. Each agent's own write step compounds the gap by
explicitly forbidding the natural workaround too — "**ALWAYS use the Write tool to
create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation"
appears verbatim in all four (`framework-selector.md:129`, `domain-researcher.md:102`,
`ai-researcher.md:91`, `eval-planner.md:121`). So the only path to "update" the file is
a full `Write`, and the only thing stopping one agent from clobbering a sibling's
already-written section is a self-reported checklist line ("No section other than N
written or modified" — e.g. `framework-selector.md:240`, `domain-researcher.md:176`)
with no mechanism behind it. This happens **even on the documented sequential chain** —
it isn't a parallelism bug like 1.3, it's that every "update" in the chain is secretly
a "regenerate the whole file and hope nothing downstream-authored got lost or
mis-spliced."

`domain-researcher.md:108` already shows awareness of a related symptom (heading drift
against the skeleton `framework-selector` creates) without addressing the deeper
overwrite risk — a sign the agents know they're on thin ice here but have no tool-level
guardrail.

**Why it matters beyond the four assets:** `ROADMAP.md` item **2.14**
(`skills/rag-architect`) is blocked on this — deferring to `AI-SPEC.md` as a trusted
upstream decision is worse than not deferring at all if its sections can silently
disappear underneath whoever writes it last.

**Fix — two parts:**
1. **Tool grant:** add `Edit` to all four `tools:` frontmatter lines (three files in
   `dev-kit-data-ai`, one in `dev-kit-core`).
2. **Explicit read-modify-write contract:** replace the categorical "ALWAYS use Write"
   instruction in each write step with: read the file first if it exists, locate your
   owned section(s) by heading, and either `Edit` the section boundaries in place or
   reconstruct the section deliberately — never regenerate the whole file from scratch
   once it already exists. Keep `Write` for the one legitimate case
   (`framework-selector` creating the skeleton when the file does not yet exist).

**Acceptance:** running the four-agent chain in documented order leaves all of Sections
1, 1b, 2, 3, 4, 4b, 5, 6, 7 populated and non-empty at the end — no agent's section is
overwritten, truncated, or reverted to a placeholder by a later agent in the chain.

**Downstream link:** unblocks `ROADMAP.md` item **2.14** once shipped.

---

## 1.15 — `agents/ui-auditor.md` — severity taxonomy doesn't reach the Detailed Findings section

**Fix:** wire the declared BLOCKER/WARNING severity labels into the `## Detailed
Findings` section of the `<output_format>` template, not just the `## Priority Fixes`
rollup.

**Bug (surfaced by structural sweep during the M1 fix wave; carried over from 1.11's
notes, flagged there as "worth doing alongside" but out of that item's scope):**
`ui-auditor.md:38-40` declares the classification every finding must carry:

> - **BLOCKER** — pillar score 1 or a specific defect that breaks user task
>   completion; must fix before shipping
> - **WARNING** — pillar score 2-3 or a defect that degrades quality but doesn't
>   break flows; fix recommended

1.11 (`2c4b253`) already wired this into `## Priority Fixes` — the template shows
`1. **[BLOCKER] {specific issue}** — ...` (`ui-auditor.md:351-354`) — and gave
`needs_human_review` a real consumer. But the taxonomy stops there. `## Detailed
Findings` (`ui-auditor.md:361-380`), organized per pillar, is the section that actually
carries the evidence — file:line references, class-usage counts, spacing analysis —
and its placeholders are bare:

```
### Pillar 1: Copywriting ({score}/4)
{findings with file:line references}
```

No `{findings}` placeholder in this section instructs the agent to tag each finding
`[BLOCKER]`/`[WARNING]`. A reader working from the evidence section — the one with the
actual file:line citations, i.e. the one someone would open to go fix something — has
no severity signal without cross-referencing back to the separate Priority Fixes list
by matching issue text. The taxonomy exists, is enforced in the aggregated rollup, and
still doesn't reach the section where the findings are actually documented.

**Fix:** add the same `[BLOCKER]`/`[WARNING]` (or "below bar" for findings that don't
clear either) prefix convention to each per-pillar findings placeholder in `##
Detailed Findings`, so severity is legible at the point of evidence, not only in the
summary rollup.

**Acceptance:** every finding listed under `## Detailed Findings` carries an explicit
`[BLOCKER]`/`[WARNING]`/below-bar label, consistent with its corresponding entry (if
any) in `## Priority Fixes`.

---

## 2.17 — `skills/writing-plans/plan-document-reviewer-prompt.md:38-49` — orphaned asset, decide before fixing

**This is a decision item, not a direct fix.** `plan-document-reviewer-prompt.md`
carries a Class-B defect (same family as the other M2 findings), but nothing in
`plugins/` references or dispatches it — confirmed via
`grep -rn "plan-document-reviewer-prompt" plugins/`, zero hits outside the file
itself. There is no consumer to fix the content against, so the first step is
choosing one of:

1. **Wire it in** — if `writing-plans` was meant to dispatch a plan-document-reviewer
   subagent using this template and the integration was simply never added, add the
   reference/dispatch call, then fix the Class-B content defect at lines 38-49 as a
   follow-up.
2. **Delete it** — if the template was superseded or abandoned, remove the file
   instead of polishing content nothing will ever read.

**Acceptance:** either (a) `writing-plans` (or another skill) demonstrably dispatches
this template and its content defect is fixed, or (b) the file is deleted and no
reference to it remains.
