# nyquist-auditor

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/nyquist-auditor.md`
- **file_lines**: 196
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 11

---

## Invocation 1 — step 11 (Verify the goal), block 6, lines 920-932

### verbatim_text

```text
Dispatch the nyquist-auditor agent with verify's validation_gaps passed as <gaps>: one real
behavioral test per uncovered requirement, targeting the hardest edge rather than a trivially
passing one, reporting FILLED / ESCALATED / justified-SKIP for each. Include the
<required_reading> block it treats as a mandatory initial read — this phase's PLAN.md file(s),
its SUMMARY.md file(s), and this PHASE/VERIFICATION.md — because without it the agent writes
tests against a requirement list it has no context for. Implementation files are **read-only**
to it: it may only add or change test files and fixtures, and a gap it cannot close because the
implementation is wrong is an ESCALATE, never a fix. Hand every ESCALATED item back to step 8 as
implementation work — it is a real defect, not a testing shortfall. This one waits its turn
rather than running beside integration-checker — it adds test files, and integration-checker's
import/export census has to be taken against a tree that is holding still.
```

### surrounding_prose

Preceding conditional gate: '(only if verify reported validation gaps — and only after integration-checker has returned)'. Notes this dispatch must run sequentially after integration-checker (not concurrently), because nyquist-auditor adds test files and integration-checker's import/export census needs a static tree. ESCALATED items are routed back to step 8 as implementation work, not treated as a testing shortfall.

---
