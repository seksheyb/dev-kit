# doc-classifier

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/doc-classifier.md`
- **file_lines**: 160
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 00

---

## Invocation 1 — step 00 (Bootstrap), block 5, lines 79-92

### verbatim_text

```text
Run a workflow to ingest them. Stage 1: one doc-classifier agent per document, all in
parallel — give each its FILEPATH and OUTPUT_DIR docs/state/intel/classifications/. Each writes
its classification JSON there and returns a one-line confirmation and nothing else; no JSON and
no document contents come back inline, so do not ask for structured output. Stage 2 is a
barrier, because synthesis needs the whole set at once: one doc-synthesizer agent, given
CLASSIFICATIONS_DIR docs/state/intel/classifications/, INTEL_DIR docs/state/intel/,
CONFLICTS_PATH docs/state/tmp/INGEST-CONFLICTS.md and MODE new, reads that directory and merges
it under precedence rules into INGEST-CONFLICTS.md plus per-type intel under
docs/state/intel/. Two Accepted ADRs that contradict each other are an unresolved blocker —
report it, never pick a winner. If there are only a handful of docs, skip the workflow: dispatch
the classifiers in one message and run the synthesizer in the next turn, same inputs. The
work-list script only earns its keep over a long pile.
```

### surrounding_prose

Preceded by italic conditioning text: '*(only if the repo has a pile of ADRs/PRDs/specs outside canonical SITEMAP paths)*'. Describes a two-stage workflow: Stage 1 dispatches doc-classifier agents in parallel (one per document), Stage 2 is a barrier — a single doc-synthesizer agent run after all classifications complete. Notes a hard rule: two contradictory Accepted ADRs are an unresolved blocker to report, never resolve by picking a winner. Also notes a small-pile shortcut: skip the formal workflow script and just dispatch classifiers then the synthesizer manually. Followed by italic conditioning text for the next block: '*(only if the repo is greenfield with no code yet, but the doc-ingest step above just ran)*' — i.e. that next block depends on this one having run.

---
