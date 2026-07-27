# dependency-manager

- **kind**: agent
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/dependency-manager.md`
- **file_lines**: 27
- **has_references**: no
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 12

---

## Invocation 1 — step 12 (Final review — milestone gate), block 5, lines 1043-1050

### verbatim_text

```text
Only once cso has finished, dispatch the dependency-manager agent for a CVE /
version-conflict / license / dead-weight sweep with incremental tested updates. It runs after,
not alongside: it edits manifests and lockfiles, which is exactly the supply-chain surface cso
just scanned, and overlapping the two would both corrupt cso's fingerprint trend and grade a
lockfile that is still moving. Escalate any deep license question it flags to the
license-engineer skill.
```

### surrounding_prose

Immediately follows the cso block, no intervening prose paragraph. Explicit sequencing instruction: 'Only once cso has finished' — must run after, not alongside, because it edits manifests/lockfiles (the same supply-chain surface cso just scanned) and overlapping would corrupt cso's fingerprint trend. license-engineer is invoked only as an escalation path for deep license questions, not dispatched directly by the operator.

---
