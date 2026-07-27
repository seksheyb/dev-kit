# architecture-designer

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/architecture-designer/SKILL.md`
- **file_lines**: 120
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 02

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
