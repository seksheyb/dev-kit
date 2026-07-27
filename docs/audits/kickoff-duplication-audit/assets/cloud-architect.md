# cloud-architect

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-infra/skills/cloud-architect/SKILL.md`
- **file_lines**: 216
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 13

---

## Invocation 1 — step 13 (Ship — open the PR), block 1, lines 1102-1119

### verbatim_text

```text
Route the infra lane over this milestone's deploy surface. Run these in sequence, not in
parallel — they write overlapping config and the later ones depend on the earlier ones' output:

1. devops-engineer — own the CI/CD pipeline config that land-and-deploy's readiness gate will
   poll. This is the one that gate depends on, so do it first.
2. terraform-engineer, with cloud-architect where the topology itself is in question — the IaC
   and any migrations this milestone's waves imply.
3. kubernetes-specialist and/or docker-expert — only whichever actually matches how this
   project runs. Skip the one that does not apply rather than inventing a use for it.
4. sre-engineer — define the SLIs and SLOs for what this milestone shipped, against real
   expected traffic. Step 15 reviews error-budget burn against exactly these, so vague or
   aspirational targets there become an unreviewable step 15.
5. monitoring-expert — wire the dashboards and alerts to the SLOs sre-engineer just defined.
   These thresholds are a first guess by definition; step 15 tunes them from real signal.

Tell me which of the five you ran and which you skipped as not applicable.
```

### surrounding_prose

Preceded by bold lead-in: 'Set up the deploy surface before you ship into it.' `land-and-deploy` at the end of step 14 has a readiness gate that polls a CI/CD pipeline and then verifies production health; if nobody owns that config, the gate polls something that does not exist. This is also where the SLOs get defined — step 15 only *reviews* burn against them, so if they are never set up there is nothing to review. And `land-and-deploy` carries its own one-time, *interactive* first-run wizard that writes that config; run it here, not at the end of step 14 where it would stall an otherwise unattended deploy on a question. Conditioning line directly above the fence: '(only if this milestone changed the deploy, infra, or runtime surface — or if this is the first milestone to deploy at all)' — this entire block is conditional/skippable.

---
