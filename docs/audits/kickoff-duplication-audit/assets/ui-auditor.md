# ui-auditor

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/ui-auditor.md`
- **file_lines**: 462
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 10

---

## Invocation 1 — step 10 (Adversarial review/fix loop), block 5, lines 801-817

### verbatim_text

```text
Use the ui-auditor agent for a 6-pillar visual audit of what this phase shipped. Score this
phase's diff against its own PHASE/UI-SPEC.md when one exists, and against the abstract
6-pillar standards when it does not — write the result to PHASE/reviews/UI-REVIEW.md with a
1-4 score per pillar and at least one specific finding justifying each score, classified
BLOCKER or WARNING. This pass is cheap and static-grep-first and never blocks on a browser, but
get the capture precedence right: check first whether browser automation is available in this
session (Playwright MCP, an in-session browser pane, or equivalent) and use it if it is —
desktop 1440x900 and mobile 375x812, plus a targeted shot per component UI-SPEC.md names. The
CLI screenshot route is the fallback for when no browser tooling is available, and it only fires
if a dev server happens to already be running; with neither, it degrades to a code-only audit
rather than failing. Flag anything needing subjective judgment rather than scoring it. Do not average
scores upward to soften the findings, and do not stop at three issues if more exist. Keep it
scoped to contract conformance on this diff — subjective "does it feel right" judgment,
cross-page consistency, and any actual fixing belong to design-reviewer at step 12, which reads
this file as its per-phase baseline.
```

### surrounding_prose

Preceded by: '*(only if this phase shipped UI)*' — conditional gate, only run this block if the phase shipped UI. This block's final sentence explicitly defers subjective 'does it feel right' judgment, cross-page consistency, and actual fixing to 'design-reviewer at step 12', which reads PHASE/reviews/UI-REVIEW.md (this block's output) as its per-phase baseline. Immediately followed by a horizontal rule ('---') ending the step.

---
