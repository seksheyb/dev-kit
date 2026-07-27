# learn

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/learn/SKILL.md`
- **file_lines**: 101
- **has_references**: no
- **complexity**: high
- **invocation_count**: 3
- **invoked by steps**: 08, 10, 11

---

## Invocation 1 — step 08 (Build it, test-first), block 0, lines 566-590

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then use the using-git-worktrees
skill to isolate this wave's workspace, install deps, and confirm a clean baseline. Then use the
sprint-execution skill to execute PHASE/<NN>-<MM>-PLAN.md under the test-driven-development
skill — write the failing tests first, then implement to green, with every "done" claim backed
by fresh command output per the verification-before-completion skill, not confidence. It
dispatches one subagent per track, each in its own git worktree, runs its own two-stage review
gates (per-track/per-wave, then a final whole-branch pass) with a compaction-proof progress
ledger, and merges centrally. Before moving on, confirm the merge mechanically: `git log
<integration-branch>..<branch> --oneline` must come back empty for every branch — a handover's
`Merged` field is a self-report, not evidence. One wave per run, so invoke it again for each
wave; never start wave N+1 until wave N has merged and verified clean. (This review is
per-track/per-wave scaffolding to keep execution honest — it is not step 10's adversarial
phase-level review, which runs once against the whole built phase.) If a wave surfaced a project
convention or a systemic trap the next wave would otherwise rediscover — a build quirk, a library
misuse, an ordering constraint — record it with the learn skill before starting the next wave.

Know how this skill ends. Once the final whole-branch review comes back clean, sprint-execution
hands off to the finishing-a-development-branch skill, which puts a merge / PR / keep / discard
menu in front of me — so the last wave of this phase will surface that menu right here, at step
8. Take **keep** ("keep the branch as-is"): the branch still has to survive step 10's adversarial
review loop, step 11's verification and step 12's milestone gate, and the PR is opened at step
13. Merging or opening the PR at this point bypasses all four. If I answer anything other than
keep, say plainly which gates I am skipping before you act on it.
```

### surrounding_prose

This is the main step-8 prompt, positioned directly under the '## 8. Build it, test-first' heading with no conditioning prose before it — it is the default/primary path for this step. The block itself contains embedded operator guidance: it explains that the per-track/per-wave review gates inside sprint-execution are NOT the same as step 10's adversarial phase-level review (which runs once against the whole built phase), that only one wave is executed per invocation (re-invoke for each subsequent wave, never starting wave N+1 until wave N is merged and verified clean via the mechanical git log check), and that any project convention or systemic trap surfaced mid-wave should be recorded via the learn skill before the next wave starts. It also describes how sprint-execution terminates: it hands off to finishing-a-development-branch, which presents a merge/PR/keep/discard menu — the operator is instructed to choose 'keep' at this point specifically, because the branch still must pass step 10 (adversarial review), step 11 (verification) and step 12 (milestone gate) before the PR is opened at step 13; merging or opening the PR now would bypass all four gates, and if the user answers anything other than keep, Claude should state plainly which gates are being skipped before acting.

---

## Invocation 2 — step 10 (Adversarial review/fix loop), block 0, lines 685-753

### verbatim_text

```text
Run the adversarial review ↔ fix loop for phase <NN> as a workflow. Source branch: <branch>.
Max 6 rounds.

First confirm no other worktree or session holds <branch> checked out — the fix tracks merge
themselves into it, and git rejects a merge into a branch that is checked out elsewhere.

Run the whole loop under the code-review-protocol skill, receiving side. Every finding is a
suggestion to evaluate, not an order to follow: verify each one against the actual code before
implementing it, and question the ones that look wrong rather than complying. A reviewer that
misread the code is a finding to reject with a reason, not a defect to fix. No gratitude
performance and no performative agreement in the round reports — technical correctness over
social comfort.

Then loop, round n = 1..6:

1. Dispatch the code-review-gate agent in round mode against PHASE/, passing all three of its
   round-mode inputs: phase_dir = PHASE/, round = n, branch = <branch> (engine codex). The
   branch is not optional — round mode diffs it to see what this sprint changed, and a round
   dispatched without it reviews the wrong tree. It writes
   PHASE/reviews/round-<n>/findings.{md,json} and computes stop_loop and next_action
   itself — read those, never re-derive them. Round mode defaults to codex so the review is a
   structurally independent pass rather than the same model grading its own homework. If no
   external engine is installed it falls back per the engine registry — say so in the final
   report, because a claude-on-claude round is a weaker gate.
2. If stop_loop is true, leave the loop.
3. Otherwise hand that findings.json to the bugfix-wave skill, naming <branch> as the source
   branch. It groups the findings into conflict-free tracks, runs them in parallel worktrees,
   and each track merges itself back into <branch>. Its structural-fix mandate is required for
   every findings.json entry, so hold it to that: name the underlying class of defect rather
   than the line that got flagged, find and fix every instance of that class in one atomic
   verified commit, and leave a regression guard behind — a test, a lint rule, a type-level
   constraint, or a CI check. Prose in a doc is not a guard. A point fix that touches only the
   flagged location is why the next round re-flags the same class. A class that genuinely
   cannot be fixed structurally is recorded as unresolved with a one-line rationale, not
   quietly downgraded to a point fix. Give it an explicit output path for the fixes.json
   summary its Phase 4 must emit: PHASE/reviews/round-<n>/fixes.json — the same round directory
   code-review-gate just wrote findings.json into. That path is required and it is not a free
   choice: round n+1's code-review-gate globs PHASE/reviews/round-*/fixes.json to decide whether
   a previously_seen_class has since been resolved, so with no fixes.json on disk stop_loop can
   only ever go true on a genuinely empty previously_seen_classes list.
3b. Reconcile this round before you open the next one. The workflow script cannot touch git or
   the filesystem, so bugfix-wave's merge-and-clean-up phase is yours to drive, and it belongs
   here inside the loop, not after it — round n+1's review diffs <branch>, so a track that did
   not land is invisible to it and its defect classes come back as previously_seen_classes on
   fixes that were already written, burning rounds toward the hard cap. In this order:
   - For every track branch, `git log <branch>..<track-branch> --oneline` must come back empty.
     Merge whatever did not land, resolving conflicts centrally — you hold the findings list and
     the cross-track context no single track has. A track that lost every merge retry is an
     expected outcome, not a failure. A track that returned no handover is not an empty track:
     inspect its branch and merge what it did commit, and treat its remaining findings as
     unfixed. Do not clean up until that check comes back empty for every branch.
   - Re-attach the repo: `git checkout <branch>`. bugfix-wave runs `git checkout --detach` in
     the main working tree before dispatching, because tracks cannot push into a branch that is
     checked out, and nothing else puts you back — skip this and every remaining round runs on a
     detached HEAD. If cross-talk left dirty files, `git checkout -- <files>` first.
   - Only then remove the agent worktrees and delete the track branches.
4. Go to round n+1 — the next review has to see the merged fixes, which it only can if 3b ran.

Leave the loop when stop_loop is true, or at round 6 with stop_loop still false ("hard cap
reached — escalate"). Never open a 7th round.

Once you are out of the loop, confirm you are back on <branch> and that no agent worktrees
remain, then report the round count, what was fixed in each round, and anything still open.

Finally: if these rounds surfaced a convention or a recurring pitfall that generalizes past
this phase's findings — something the next phase's review would otherwise re-derive from
scratch — record it with the learn skill before moving on.
```

### surrounding_prose

Header: '## 10. Adversarial review ↔ fix loop (≤6 rounds)'. This is the main workflow prompt the operator pastes to run the full loop for a given phase/branch. Followed immediately by a parenthetical note: '(only if you want a one-shot look at the current diff, outside the loop — it runs code-review-gate in single mode, so it is never a substitute for round 1)' introducing the next block.

---

## Invocation 3 — step 11 (Verify the goal), block 8, lines 954-958

### verbatim_text

```text
Use the context-save skill to checkpoint this boundary — what is done, what got decided, and
what is next. If verification surfaced a convention or a recurring gap pattern that
generalizes beyond this phase, also record it with the learn skill before the checkpoint.
```

### surrounding_prose

No explicit conditional gate; appears to run at the end of the step regardless. Conditional clause inside the block itself: the learn skill is invoked only 'if verification surfaced a convention or a recurring gap pattern that generalizes beyond this phase', and must run 'before the checkpoint' (i.e. before context-save).

---
