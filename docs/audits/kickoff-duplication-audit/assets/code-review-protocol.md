# code-review-protocol

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/code-review-protocol/SKILL.md`
- **file_lines**: 320
- **has_references**: no
- **complexity**: high
- **invocation_count**: 1
- **invoked by steps**: 10

---

## Invocation 1 — step 10 (Adversarial review/fix loop), block 0, lines 685-753

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
