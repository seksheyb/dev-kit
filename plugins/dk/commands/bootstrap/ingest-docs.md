---
description: Ingest ADRs/PRDs/specs that sit outside the canonical locations.
gate: auto
precondition: "git ls-files '*.md' | grep -qiE '(adr|prd|spec)' | grep -qv '^docs/'"
asks: "Does the repo have ADRs/PRDs/specs outside the canonical locations?"
---
Run a workflow to ingest them: stage 1 fans out one doc-classifier agent per document, stage 2 is a
barrier of one doc-synthesizer. For a handful of docs, run the two stages in consecutive turns instead.

→ next: `/dk:bootstrap:baseline`
