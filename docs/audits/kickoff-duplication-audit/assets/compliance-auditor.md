# compliance-auditor

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/compliance-auditor.md`
- **file_lines**: 25
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 12, 15

---

## Invocation 1 — step 12 (Final review — milestone gate), block 6, lines 1053-1060

### verbatim_text

```text
Use the compliance-auditor agent against the applicable regime, and the matching product-lane
skill for framework detail — gdpr-ccpa-compliance or hipaa-compliance. Hand the auditor all
three of the things it establishes before it can map law to controls, rather than letting it
guess them: which regulations actually apply, what categories of personal or regulated data
this milestone touches, and which jurisdictions the users and the data sit in. Point it at any
prior audit history and existing control or policy docs too.
```

### surrounding_prose

Conditioning line immediately above the fence: '*(only if regulated data or industry is in scope — GDPR/HIPAA/PCI/SOC2)*'. gdpr-ccpa-compliance and hipaa-compliance are named as alternatives ('or') — the matching one is chosen per the applicable regime, not both dispatched together.

---

## Invocation 2 — step 15 (Operate, retrospect, close), block 6, lines 1354-1364

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
