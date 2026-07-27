# diagram

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/diagram/SKILL.md`
- **file_lines**: 61
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 02, 07

---

## Invocation 1 — step 02 (Architecture & tech stack), block 0, lines 199-210

### verbatim_text

```text
Use the architecture-designer skill to write docs/global/architecture/SDD.md, and one ADR per
decision into the single ADR bank at docs/global/architecture/adr/NNNN-<slug>.md, from
SPEC/spec.md. Justify every stack, database, and integration choice in its own ADR. Use the
diagram skill for the architecture diagrams — its artifact contract is the editable `.mmd`
source plus rendered `.svg`/`.png` (optionally `.excalidraw`), committed as a pair, so don't
hand-draw or paste a flattened image in its place. Keep that pair current as the design moves,
and keep the Mermaid embedded in the SDD in sync with it: step 14's drift check never opens
`.mmd` or `.svg` at all — it extracts entity names from the ASCII and Mermaid blocks inside the
markdown docs and cross-references them against the diff, and it only reports advisory findings.
Nothing downstream catches a stale source file for you.
```

### surrounding_prose

This is the first block under the '## 2. Architecture & tech stack' heading (line 197), with no other prose before it. Immediately after the block (before the next block at line 214) comes a bolded line: '**The architecture gate — the only architecture/technical-strategy gate in the pipeline:**' introducing the next block as the sole gate for architecture/technical-strategy in the whole pipeline.

---

## Invocation 2 — step 07 (Plan the phase), block 0, lines 484-497

### verbatim_text

```text
Use the writing-plans skill and the planner agent to produce PHASE/<NN>-<MM>-PLAN.md with
waves and tracks. Keep the vertical-slice mandate. Read PHASE/PATTERNS.md and cite its per-file
analog and code excerpts in each task's action section — the planner does not load it
automatically, so unless you pass it here step 5's pattern mapping never reaches the plan. Same
for step 6's specs: read PHASE/UI-SPEC.md and SPEC/AI-SPEC.md when that step produced them and
make the plan's tasks implement those contracts, because the planner does not load either one on
its own. Its <threat_model> step should consult docs/milestones/<M>/reports/security/ (step 0's baseline)
before assigning threat dispositions rather than re-deriving them from zero, and it should query
docs/state/graphs/graph.json for dependency context the same way step 5 did, rather than
re-reading the tree. Declare complexity signals (files — complete, including files the track
creates — plus novelty/logic/ambiguity/tests) plus model and effort on every track. Use the
diagram skill for the wave/track dependency graph.
```

### surrounding_prose

This is the opening block of step 7, under heading '## 7. Plan the phase'. No conditioning prose precedes it in this slice; it directly follows the section heading.

---
