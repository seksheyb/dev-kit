# integration-checker

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/integration-checker.md`
- **file_lines**: 408
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 11

---

## Invocation 1 — step 11 (Verify the goal), block 5, lines 902-917

### verbatim_text

```text
Dispatch the integration-checker agent to confirm the cross-phase flows still connect
end-to-end — every export actually imported and called, every API route with a real consumer,
sensitive routes auth-protected, full flows tracing through without a break. Run it whether or
not verify found gaps: a phase with full in-phase coverage tells you nothing about whether it is
wired to the phases around it.

It needs context it cannot discover on its own, so give it all of it: the completed phase
directories in this milestone by path (every phase up to and including <NN>, not just this one),
the key exports each one declares in its PHASE/<NN>-<MM>-SUMMARY.md, and the requirement bank —
SPEC/spec.md's US-xxx story IDs with their descriptions and the phase each is assigned to. That
last one is not optional: it has to map every integration finding to the requirement IDs it
affects and produce a Requirements Integration Map flagging any requirement with no cross-phase
wiring, and it cannot do either without the ID list. Also say which phases you expect to connect
to which, and what each provides versus consumes.
```

### surrounding_prose

Preceding conditional gate: '(skip on the milestone's first phase — nothing is cross-phase yet)'. Explicitly instructed to run 'whether or not verify found gaps'. Requires operator to supply context the agent cannot discover: completed phase directory paths, key exports from each SUMMARY.md, and SPEC/spec.md's US-xxx story IDs — described as non-optional inputs.

---
