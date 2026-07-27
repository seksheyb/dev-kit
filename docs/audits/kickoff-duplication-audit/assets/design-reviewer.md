# design-reviewer

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/design-reviewer.md`
- **file_lines**: 306
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 12

---

## Invocation 1 — step 12 (Final review — milestone gate), block 1, lines 985-1011

### verbatim_text

```text
Run these across everything this milestone shipped, and produce scorecards, not prose. First
the design-reviewer agent in full/deep mode, with regression mode against
docs/state/baselines/design-baseline.json so I get a design-score delta versus the last
milestone — it writes that baseline file, so it is not read-only and does not share a browser
with the others. On the first milestone there is no prior baseline to diff against; say so and
establish it rather than reporting a delta against nothing. Give the agent the target URL of
the running app explicitly — <URL> — instead of letting it fall back to diff-aware port
sniffing, plus whatever auth it needs to get past a login, and have it write its report and
screenshots to docs/milestones/<M>/reports/design/.

Two preconditions, both of which make it stop rather than degrade, so clear them before you
dispatch: it drives a live browser, so browser tooling has to be available in this session — if
it is not, it says so and stops, and that is the correct outcome, not a failure. And its fix
loop makes commits, so the working tree has to be clean — commit or stash anything outstanding
first.

Have it read every PHASE/reviews/UI-REVIEW.md step 10's ui-auditor wrote this milestone before
it starts: contract-conformance findings already scored there are settled, so spend this pass on
what only a live cross-page look can see — consistency across pages, AI-slop, interaction feel,
and the fix loop — rather than re-litigating them.

Then dispatch the accessibility-tester agent; it only reads. Give it its conformance target
explicitly — WCAG 2.1 AA unless this project committed to something stricter — so it is not
inferring the bar it is grading against. This is a gate: tell me plainly whether it passed,
because a failing scorecard blocks the ship.
```

### surrounding_prose

Conditioning line immediately above the fence: '*(only if the milestone shipped UI, across any of its phases)*'. This is the first of the two functional-gate sub-blocks referenced by the preceding prose ('shipped UI triggers the first'). References step 10's ui-auditor output (PHASE/reviews/UI-REVIEW.md) as already-settled findings not to re-litigate. Ends on a gate statement: failing scorecard blocks the ship.

---
