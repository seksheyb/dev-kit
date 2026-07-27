# sre-engineer

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-infra/skills/sre-engineer/SKILL.md`
- **file_lines**: 188
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 13, 15

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

## Invocation 2 — step 15 (Operate, retrospect, close), block 2, lines 1317-1326

### verbatim_text

```text
Now review the SLOs against reality, using the sre-engineer and monitoring-expert skills. Step
13 defined the SLIs/SLOs and wired the alerts on expected traffic; this is the first time there
is real data to check them against. Report actual SLO attainment and error-budget burn for this
milestone — how much budget was consumed, by what, and whether the burn rate is survivable at
the next milestone's expected load. Then tune the alert thresholds from that real signal: name
every alert that fired without a real incident and every incident that fired no alert, and
adjust. An SLO that was never breached and never came close is not automatically correct — say
whether it is calibrated or merely loose.
```

### surrounding_prose

This is the second of the two 'running-system half' blocks that must run in the stated order after the performance-engineer block, both writing under docs/global/ops/monitoring/. It explicitly references step 13's SLIs/SLOs as prior input. Followed by: 'Retro — set the window to the milestone. Bare, this command retrospects the last 7 days, so a milestone that ran longer gets a retro covering only its final week. Pass the actual span:'

---
