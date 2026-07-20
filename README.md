# dev-kit

Consolidated Claude Code plugin: **~110 skills, ~43 agents, 8 thin commands** — the
merged best-of-breed of six upstream libraries (superpowers, spec-kit, gstack,
get-shit-done, claude-skills, awesome-claude-code-subagents), de-duplicated into a
single architecture. See [ATTRIBUTION.md](ATTRIBUTION.md).

## Architecture

- **Skills** carry all methodology and knowledge, injected in-session into whatever
  agent is running. One canonical home per capability.
- **Agents** are thin isolation wrappers — identity, tool grants, output contract —
  used only where fresh context, a distinct model/effort, or parallel fan-out is
  needed (reviewers, auditors, researchers, producers). Agents *reference* skills,
  never restate them. Models/effort are set at dispatch time.
- **Commands** are logic-free stubs that dispatch an agent or invoke a skill for
  manual use. Orchestration lives in the (separate) pipeline, not here.

## Layout

```
skills/       flat: <name>/SKILL.md
  process:    brainstorming, writing-plans, sprint-execution, tdd, systematic-debugging,
              verification-before-completion, code-review-protocol, using-git-worktrees,
              finishing-a-development-branch, dispatching-parallel-agents, writing-skills,
              first-principles-thinking, guard, refactoring-specialist
  sdd:        constitution, specify, clarify, analyze, converge
  plan-review lenses: plan-review-ceo / -eng / -design / -devex / -goal-backward
  devloop:    cso, ship, land-and-deploy, context-save/restore, learn, diagram,
              document-generate, document-release, design-consultation, design-html,
              design-handoff, devex-review, content-qa, bugfix-wave, graphify
  product:    ab-test-analysis, cohort-analysis, assumption-mapping, backlog-grooming,
              growth-loops, gdpr-ccpa-compliance, hipaa-compliance
  domain:     ~85 knowledge packs (languages, frameworks, infra, data/AI, niche domains)
agents/       plan-reviewer (lens-based) · reviewers · verifiers · researchers ·
              producers · gates (plan-review/Gemini, codex-round, automation,
              reverse-engineer)
commands/     /plan-review /qa /debug /review /verify /security-audit /retro /health
```

## Key design: lens-based plan review

One `plan-reviewer` agent, five lens skills (`plan-review-ceo`, `-eng`, `-design`,
`-devex`, `-goal-backward`). Dispatch it N× in parallel, one lens each — stable agent
prompt gives cache hits across the fan-out; adding a lens is just a new skill file.

## Install

Add this repo as a marketplace in Claude Code, then install the `dev-kit` plugin.
