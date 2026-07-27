# react-native-expert

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-mobile/skills/react-native-expert/SKILL.md`
- **file_lines**: 187
- **has_references**: yes
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 08

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
