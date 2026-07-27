# test-master

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/test-master/SKILL.md`
- **file_lines**: 92
- **has_references**: yes
- **complexity**: low
- **invocation_count**: 1
- **invoked by steps**: 11

---

## Invocation 1 — step 11 (Verify the goal), block 7, lines 937-952

### verbatim_text

```text
Use the gate-automation agent for phase <NN>, passing the phase directory and the phase's
integration branch. Have it determine the automation surface from the repo rather than
assuming one — Playwright for web, Maestro for mobile, both when the project spans both, and
trust repo evidence over the **Requirement Scope:** line in CLAUDE.md if they disagree. For each primary flow it
identifies in the sprint diff it authors a golden-path flow, plus a critical-edge flow where
the feature has a real failure mode, invoking playwright-expert for web or test-master for
Maestro as the test-design skill. It then runs the new flows locally and checks whether an
on-demand E2E CI job exists, discovering the workflow from .github/workflows/ rather than
guessing a job name.

Report back with the JSON at PHASE/reports/automation/authoring-report.json — flows_added,
missing_coverage with a reason per item, local_pass, ci_label_run, gate_passed. I want to know
specifically whether the flows were executed locally or merely written, and if the project has
no E2E CI job yet, say so plainly so I can add one.
```

### surrounding_prose

Preceding conditional gate: '(only if this phase added or changed primary user flows — flows an end user actually touches. Internal refactors, schema migrations, codegen and infra changes are excluded, and skipping is the correct outcome for a phase that only did those.)' Note: the phrase 'as the test-design skill' in this block is a role label for whichever of playwright-expert/test-master is invoked (per the CRITICAL TRAP guidance for line 944), not itself an asset name — both playwright-expert and test-master ARE real invoked assets here, selected conditionally by platform (web vs Maestro/mobile).

---
