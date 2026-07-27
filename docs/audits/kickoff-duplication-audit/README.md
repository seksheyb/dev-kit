# KICKOFF.md duplication audit

Audit of `devkit-pipeline/KICKOFF.md` against the dev-kit skills, agents and commands it invokes,
asking which prompt-block sentences merely restate what the invoked asset already mandates.

Run 2026-07-27. 256 agents, 0 errors, ~4h39m, 14.0M subagent tokens.

**Read [`REPORT.md`](REPORT.md).** Everything else here is the evidence trail behind it.

## Headline

- **54.8% redundant / 45.2% load-bearing** across 797 lines of prompt-block body.
- **499 confirmed findings, 40 refuted** — 7.4% false-positive rate.
- **11 dangerous findings** (8 contradictions + stale drift) where the guide actively misleads.
- **23 `unenforced-gap` findings that are skill defects, not guide bloat** — 6 high severity. The
  guide text compensating for them must be KEPT until the skill is fixed.
- **7 drafted rewrites** recovering ~100 of 190 lines with no parameter lost.

Act in the order given in REPORT.md §6: fix the six high-severity skill defects first (they are
live bugs today, independent of any trimming), then take the cuts cleanest-first.

## Layout

Committed:

| path | what |
|---|---|
| `REPORT.md` | the deliverable |
| `rewrites/` | 7 drafted block rewrites — current vs trimmed, what-was-cut→skill-sentence table, parameters-preserved list, risk note |
| `workflow.js` | the workflow that produced all of it |

**Not committed — 483 files, 4.3MB of machine-generated evidence, deliberately left out of this
public repo.** It exists in a working tree at this same path, and the rerun below resumes from it:

| path | what |
|---|---|
| `patterns.json` | 7 duplication patterns ranked by KICKOFF line volume, with totals |
| `MANIFEST.json` | asset roster (119 assets, 153 invocations) + verify queue + dedupe stats |
| `roster-check.json` | lane-skill regression guard, KICKOFF 605-612 |
| `extract/` | 16 files, one per KICKOFF step — every prompt block verbatim. The evidence base. |
| `assets/` | one brief per asset (every invocation verbatim) + its verify queue |
| `findings/` | 118 files — raw claims, one per analyzed asset |
| `verdicts/` | 109 files — adjudication, refute-by-default |

Every finding in `REPORT.md` quotes its own evidence inline — a KICKOFF quote plus the exact skill
sentence and line number — so the report is checkable without the tree. The tree is what makes the
rerun cheap, and what you would need to re-derive a finding from scratch. A fresh clone that lacks
it will run the audit from zero.

## Rerunning

`WD` in `workflow.js` points at this directory, and **every agent prompt opens with a skip-if-done
check against its own output file.** So a rerun resumes from disk rather than redoing finished
work — it costs one cheap file read per completed unit.

```
Workflow({ scriptPath: "docs/audits/kickoff-duplication-audit/workflow.js" })
```

To force part of it to re-run, delete the relevant outputs:

- one asset's analysis → `rm findings/<name>.json`
- one asset's adjudication → `rm verdicts/<name>.json`
- the whole pivot and everything after → `rm MANIFEST.json`
- a fresh run from zero → empty this directory except `workflow.js`

`REPORT.md` is rewritten unconditionally on every run, since upstream files may have changed.

Phases 2 (Compile-Assets) and 5 (Compile-Claims) are deliberate barriers, against
pipeline-by-default: the sharding key changes from KICKOFF-step to asset at phase 2, and you
cannot invert a partial index or dedupe across assets before every asset has reported.

## Known gaps in this run

- **`cohort-analysis` was never adjudicated.** Its verify agent produced no `verdicts/` file, so
  1 of 539 deduped claims has no verdict — this is the 538-of-539 the report cites. Re-running
  will pick it up, since only the missing file gets recomputed.
- **The roster over-captured.** 119 assets / 153 invocations against a briefed expectation of
  62 / 81. The extract phase recorded assets named in *prose lists* — the lane-skill roster at
  KICKOFF 605-612, and the `gate-*` / `doc-*` / `eval-*` families — as invocations. The audit is
  therefore broader than scoped rather than wrong, and refute-by-default absorbed the noise; but
  some confirmed findings trace to a prose mention rather than a real invocation. Treat asset
  names appearing exactly once in a prose list with more skepticism than the rest.
- **REPORT.md §1 states a remedy for only 4 of its 9 dangerous findings.** D2, D3, D5, D7 and D9
  carry full evidence but stop at diagnosis. D2 is the consequential one: four lane skills are
  ordered test-first by the guide while their own numbered workflows are code-first, and whether
  the fix is amending the four skills or re-scoping KICKOFF's test-first claim is an open
  decision, not an oversight. §4b and §3 do carry per-item remedies.
- **`graphify` is excluded by user instruction** — filtered deterministically in `workflow.js`, and
  absent from every count, roster, pattern and quote here.

## Method, in one paragraph

Sharded by **asset**, not by KICKOFF step. Step-sharding would make six different agents each read
`context-save/SKILL.md` and form six independent opinions of it. Extraction is still step-sliced
(the only way to cut a 1396-line file) but reads zero skill files, so it cannot duplicate
judgement; all skill reading happens after the phase-2 pivot, one agent per asset. Because that
agent sees every invocation of its asset at once, it can also judge consistency across steps and
collapse pasted boilerplate into one systemic finding. A **fresh** agent then adjudicates each
asset's claims — never the analyzer, so one-per-asset never becomes self-review — defaulting to
refuting. Every claim requires both a KICKOFF quote and an exact skill sentence with a line
number; no skill quote, no finding.
