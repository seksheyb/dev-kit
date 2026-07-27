# plan-review

- **kind**: command
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/commands/plan-review.md`
- **file_lines**: 22
- **has_references**: no
- **complexity**: high
- **invocation_count**: 3
- **invoked by steps**: 07, 07, 07

---

## Invocation 1 — step 07 (Plan the phase), block 1, lines 499-501

### verbatim_text

```text
/dev-kit-core:plan-review PHASE/<NN>-<MM>-PLAN.md
```

### surrounding_prose

Followed by: 'The command takes the plan path — pass it, or it has to guess which plan, and a phase can have several. Named with no lenses it runs all four — `eng`, `design`, `devex`, `goal-backward` — and fans them out in parallel as a workflow; the `design` and `devex` lenses self-report "not applicable" when the plan has no UI or developer-facing surface. Fix what it flags before going on. It does **not** run the gate below; that is a separate dispatch.' Then a 'Review tier.' subsection states: 'All four lenses is the maximum-rigor setting. The everyday **minimum bar** is `gate-plan-review` + the `goal-backward` lens — name that lens and you get only it:' which introduces the next block.

---

## Invocation 2 — step 07 (Plan the phase), block 2, lines 512-514

### verbatim_text

```text
/dev-kit-core:plan-review PHASE/<NN>-<MM>-PLAN.md goal-backward
```

### surrounding_prose

This is the 'minimum bar' example, introduced by: 'The everyday **minimum bar** is `gate-plan-review` + the `goal-backward` lens — name that lens and you get only it:' (note: this sentence names 'gate-plan-review' as part of the minimum bar description, but the actual command example that follows only passes the `goal-backward` lens argument). Followed by: 'Escalate by naming lenses explicitly. Add the `eng` lens — the engineering-quality lens, the one that catches structural and implementation-risk problems — for new architecture, a security/payments/auth surface, or anything touching >15 files:' which introduces the next block.

---

## Invocation 3 — step 07 (Plan the phase), block 3, lines 520-522

### verbatim_text

```text
/dev-kit-core:plan-review PHASE/<NN>-<MM>-PLAN.md eng goal-backward
```

### surrounding_prose

Followed by: 'Naming lenses suppresses the all-four default, so the example above runs only those two. When the escalated phase also has UI or a developer-facing surface, name `design`/`devex` too — or just use the bare no-lens form above to run all four. Set the default once in the project's `CLAUDE.md` rather than deciding per phase.' This closing prose precedes the next fenced block, which is a distinct dispatch (gate-plan-review agent) described as 'a separate dispatch' from plan-review per block 1's prose.

---
