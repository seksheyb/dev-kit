# verify

- **kind**: command
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/commands/verify.md`
- **file_lines**: 9
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 11, 11
- **aliases_merged**: dev-kit-core:verify

---

## Invocation 1 — step 11 (Verify the goal), block 0, lines 827-830

### verbatim_text

```text
/dev-kit-core:verify the goal and success criteria of phase <NN> as written in its PHASE
directory — not the working diff
```

### surrounding_prose

Precedes the block: 'Pass the phase goal explicitly. Bare, this command defaults to "the current change's stated goal" and grades the working diff; the gate here is the phase's goal, which the diff is only evidence for.' Follows the block: 'Writes PHASE/VERIFICATION.md via the verifier agent — goal-backward, not task-completion. Its Step 6d structures any requirement lacking real automated coverage as a validation_gaps list, which is what gates the nyquist dispatch below.'

---

## Invocation 2 — step 11 (Verify the goal), block 4, lines 883-899

### verbatim_text

```text
Those appended tasks and those gaps are not done work — nothing downstream builds them. Go back
to step 8 and run the sprint-execution pass again, scoped to exactly this: the "## Phase N:
Convergence" section converge appended at the end of PHASE/<NN>-<MM>-PLAN.md, plus every gap
VERIFICATION.md lists, plus any BLOCKER in PHASE/reviews/EVAL-REVIEW.md if step 11 produced one.
Nothing else — do not re-execute already-completed tasks, and keep the constitution-violation
remediation tasks first, in the order converge wrote them. Same contract as step 8: test-first,
one wave per run, merge verified mechanically. Take **keep** at the finishing-a-development-
branch menu again.

Then re-run /dev-kit-core:verify on the same phase goal. The verifier auto-detects the existing
PHASE/VERIFICATION.md and enters RE-VERIFICATION MODE — full three-level checks on the items
that failed, a quick regression check on the ones that already passed — so this second pass is
cheap. Repeat this remediation-then-re-verify cycle until verify comes back passed or
human_needed. A phase does not leave step 11 on gaps_found; if the same gaps survive two
cycles, stop and escalate to me rather than opening a third.
```

### surrounding_prose

Preceding conditional gate: '(only if converge appended a ## Phase N: Convergence section, or verify came back gaps_found)'. This block references step 8's sprint-execution pass and the finishing-a-development-branch menu as prior/external processes it re-invokes ('run the sprint-execution pass again', 'Take keep at the finishing-a-development-branch menu again') rather than as assets invoked by this text block itself — it directs the operator back to step 8, not to run a new command inline here except re-running /dev-kit-core:verify explicitly. Note: text has a typo/rendering quirk 'PHASE/<NN>-<MM>-PLAN.md' etc. Ends with an escalation rule: stop after two failed remediation cycles rather than opening a third.

---
