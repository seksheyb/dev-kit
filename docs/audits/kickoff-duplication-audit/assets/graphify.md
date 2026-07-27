# graphify

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/graphify/SKILL.md`
- **file_lines**: 1497
- **has_references**: no
- **complexity**: high
- **invocation_count**: 3
- **invoked by steps**: 00, 00, 05

---

## Invocation 1 — step 00 (Bootstrap), block 6, lines 95-100

### verbatim_text

```text
Use the graphify skill on that doc corpus to build docs/state/graphs/graph.json — it ingests
docs as well as code, so a pure-docs entry still gets a queryable graph even though cso (and the
code-path graphify run below) both skip on a true greenfield entry. Re-run it (or
`--update`) once this milestone's code exists so the graph doesn't go stale.
```

### surrounding_prose

Preceded by italic conditioning text: '*(only if the repo is greenfield with no code yet, but the doc-ingest step above just ran)*', meaning this block's predicate depends on the doc-ingest block immediately before it having executed. Notes that cso and the code-path graphify run (the following block) both skip in a true greenfield entry, so this is the only graph-building path available for a pure-docs greenfield case. Instructs re-running (or `--update`) once code exists later so the graph does not go stale. Followed by italic conditioning text for the next block: '*(only if the repo has code — a legacy/inherited entry, or any milestone after the first)*' — mutually-exclusive alternative to this block.

---

## Invocation 2 — step 00 (Bootstrap), block 7, lines 103-115

### verbatim_text

```text
Run two skills here, in this order, one after the other — they are skills that load into this
session rather than agents you can fan out, so there is no dispatching both in one message:
graphify mandates its own Agent-tool fan-out for semantic extraction, and cso runs its phases
inline. First, use the graphify skill to build docs/state/graphs/graph.json, or run it with
`--update` for an incremental re-extract if a graph already exists. If graphify fails, note it
and continue — it is an optimization, not a gate. Then use the cso skill for a full security
baseline into docs/milestones/<M>/reports/security/ — full, no flags, never --diff: at milestone
2+ the repo carries every prior milestone's shipped code, and that accumulated surface (stale
dependencies, drifted CI config, secrets leaked since the last full sweep) is exactly what step
12's --diff pass is scoped too narrowly to catch. This baseline is what planner's threat-model
step and sdd-review-cto both consult later, so it comes before step 2.
```

### surrounding_prose

Preceded by italic conditioning text: '*(only if the repo has code — a legacy/inherited entry, or any milestone after the first)*' — the code-bearing alternative to the previous pure-docs-greenfield block. Explains the two skills must run sequentially, not dispatched together, since both load into the current session rather than being fanned out as agents. Notes graphify failure is non-fatal ('an optimization, not a gate') but cso must run 'full, no flags, never --diff' at this stage, contrasted with step 12's narrower --diff pass. States this baseline feeds planner's threat-model step and sdd-review-cto later. Followed by an unconditioned block (context-save) — no italic tag precedes it, implying it always runs.

---

## Invocation 3 — step 05 (Phase discovery), block 0, lines 352-359

### verbatim_text

```text
Use the graphify skill to build docs/state/graphs/graph.json over this repo before anything in
this step or step 7 queries it. Step 0's two graph builds are both gated — one on a doc corpus
having just been ingested, one on the repo already having code — so a true-greenfield milestone
arrives here with no graph at all and every graph query below silently degrades into a fresh
tree read. If a graph.json already exists but predates this phase's code, run `--update` for an
incremental re-extract rather than a full rebuild.
```

### surrounding_prose

Section header 'Part B — the per-phase loop': 'Repeat steps 5–11 for every phase in ROADMAP.md. PHASE/ below is that phase's directory.' Then '## 5. Phase discovery' followed by a conditioning line directly above this block: '*(only if docs/state/graphs/graph.json does not exist and this milestone has shipped code — i.e. from phase 2 onward on a greenfield project)*' — this is a gate on whether the block runs at all. No prose appears between this block and the next; they are separated only by a blank line.

---
