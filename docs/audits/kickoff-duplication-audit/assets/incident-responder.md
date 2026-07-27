# incident-responder

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/incident-responder.md`
- **file_lines**: 30
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 15

---

## Invocation 1 — step 15 (Operate, retrospect, close), block 6, lines 1354-1364

### verbatim_text

```text
Use the incident-responder agent: triage, contain, preserve evidence, diagnose, recover, then
write the blameless postmortem to docs/global/ops/postmortems/. Containment never comes at the
cost of evidence integrity — preserve first, then clean up.

If this incident has regulatory exposure — a security breach, or any incident touching personal
or regulated data — hand off to the compliance-auditor agent for the framework-specific
breach-notification obligations, and do it early rather than at postmortem time. Disclosure
deadlines start running from discovery, not from the fix, so surface the applicable regime and
its clock to me while the incident is still open.
```

### surrounding_prose

Conditioned by the italic line immediately above the fence: '(only if a production incident is underway)'. Contains an internal conditional: the compliance-auditor handoff applies only 'if this incident has regulatory exposure — a security breach, or any incident touching personal or regulated data', and should happen early, not at postmortem time, since disclosure deadlines start from discovery.

---
