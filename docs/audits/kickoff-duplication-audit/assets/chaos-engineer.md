# chaos-engineer

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-infra/skills/chaos-engineer/SKILL.md`
- **file_lines**: 182
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 15

---

## Invocation 1 — step 15 (Operate, retrospect, close), block 7, lines 1367-1371

### verbatim_text

```text
Use the chaos-engineer skill to rehearse that failure mode deliberately, before it recurs on
its own schedule. Start from the postmortem's actual failure path rather than a generic fault
list, and verify the alerting and recovery you just tuned above actually fire under it.
```

### surrounding_prose

Conditioned by the italic line immediately above the fence: '(only if the postmortem named a failure mode nobody had rehearsed)'. References 'the alerting and recovery you just tuned above' (the SLO/alert-tuning block) as the thing to verify fires under the rehearsed failure. Followed by: 'Only once nothing is on fire, close the milestone out:' introducing the next block.

---
