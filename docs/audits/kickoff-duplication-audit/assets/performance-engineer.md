# performance-engineer

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/performance-engineer.md`
- **file_lines**: 27
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 15

---

## Invocation 1 — step 15 (Operate, retrospect, close), block 1, lines 1304-1315

### verbatim_text

```text
Dispatch the performance-engineer agent over what this milestone shipped. Measure first — no
optimizing on a hunch. Establish the baseline and profile the running system, then eliminate the
single biggest bottleneck, re-measure, and iterate; the usual suspects are N+1 queries, pool
exhaustion, cache misses, synchronous blocking, and memory leaks. Write
docs/global/ops/monitoring/performance-report.md with before and after numbers — response time,
throughput, resource use — the bottlenecks found, the fixes applied, and the evidence validating
each gain, plus the alert thresholds that keep the gains from regressing. A report without
before/after numbers is not a performance pass. If the bottleneck turns out to be infra-wide or
capacity-related rather than app-level, hand the dashboard and capacity follow-through to
monitoring-expert rather than continuing to profile app code.
```

### surrounding_prose

Introduced by the sentence before block 0 ends: this is the first of 'the next two blocks' that are 'the running-system half' of operate, run in order, both writing under docs/global/ops/monitoring/, without overlapping them. No prose immediately follows before the next block starts.

---
