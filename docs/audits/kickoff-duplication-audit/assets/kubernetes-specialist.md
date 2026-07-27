# kubernetes-specialist

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-infra/skills/kubernetes-specialist/SKILL.md`
- **file_lines**: 241
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 08, 13

---

## Invocation 1 — step 08 (Build it, test-first), block 2, lines 603-624

### verbatim_text

```text
For each track in this wave, name the lane skill that owns its surface in the track's brief
and have the implementer use it — python-pro / fastapi-expert / django-expert / postgres-pro /
api-designer for backend work, react-expert / nextjs-developer / typescript-pro / vue-expert
for web, swift-expert / kotlin-specialist / flutter-expert / react-native-expert for mobile,
rag-architect / prompt-engineer / ml-pipeline for AI work, terraform-engineer /
kubernetes-specialist / devops-engineer for infra, payment-integration / fintech-engineer /
mcp-developer for specialized domains. Pick from the plugins we actually enabled; a track with
no matching lane just uses the core skills. Tell me the track-to-lane mapping before you
dispatch.

Every name above is a skill, and the track subagent loads its own assigned skill itself.
framework-selector and ai-researcher are **agents**, not skills — a track subagent cannot load
either one, so never put them in a track's skill slot. They already ran at step 6: the
framework, model provider and build methodology are settled and live in SPEC/AI-SPEC.md, with
step 5's PHASE/RESEARCH.md as the phase-level companion. AI tracks build against that choice
here — read both files, do not re-open the selection, and if the stack is genuinely wrong go
back to step 6 rather than deciding it inside a track. If an AI track needs framework detail
those two files do not carry, dispatch ai-researcher yourself as the orchestrator, have it
check PHASE/RESEARCH.md first so it never duplicates that research, and hand its output to the
track as brief material.
```

### surrounding_prose

Preceded by bold guidance: 'Route the work through the lanes you enabled at step 2. The lane plugins are where the actual framework expertise lives; without this they never fire.' Note: 'the core skills' (line 611, 'a track with no matching lane just uses the core skills') is plain English, not an asset name, per the trap list — excluded from assets_invoked. framework-selector is explicitly named in-block as an agent, not a skill, and explicitly forbidden from being placed in a track's skill slot; it is not invoked by this block (it already ran at step 6) so it is NOT included in assets_invoked. ai-researcher is named as an agent (not a skill) that the orchestrator — not the track subagent — may dispatch directly if an AI track needs framework detail beyond SPEC/AI-SPEC.md and PHASE/RESEARCH.md; included in assets_invoked since the block does instruct dispatching it under that condition. The block also instructs the operator to read SPEC/AI-SPEC.md and PHASE/RESEARCH.md (outputs of step 6 and step 5 respectively) rather than re-deciding the stack, and to return to step 6 if the stack is wrong rather than deciding inside a track.

---

## Invocation 2 — step 13 (Ship — open the PR), block 1, lines 1102-1119

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
