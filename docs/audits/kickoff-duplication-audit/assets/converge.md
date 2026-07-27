# converge

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/converge/SKILL.md`
- **file_lines**: 261
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 11

---

## Invocation 1 — step 11 (Verify the goal), block 3, lines 867-879

### verbatim_text

```text
Use the converge skill for phase <NN>. Assess the present-state code — no git, no diffing, no
history — against SPEC/spec.md, every PLAN file for this phase, and
docs/global/project/constitution.md, treating PHASE/VERIFICATION.md's gaps as pre-confirmed
evidence. Sweep every FR, SC, AC and constitution MUST, then append each missing / partial /
contradicts / unrequested gap as a new traceable <task> block under a "## Phase N:
Convergence" header at the END of the plan file. Never rewrite or renumber an existing task.
Constitution-violation remediation comes first. This is the exhaustive requirement-level sweep
the verifier deliberately does not attempt — the two are complementary, so do not skip it just
because verify came back passed. converge itself writes no application code — appending the
tasks is the whole of its job, and completing them is an implementation pass. Tell me how many
tasks it appended and to which plan file.
```

### surrounding_prose

No explicit conditional gate precedes this block in the prose (it appears to run unconditionally after the human_needed branch, complementary to verify regardless of its verdict — text states 'do not skip it just because verify came back passed'). Followed by a conditional block for what to do if converge appended tasks or verify returned gaps_found.

---
