# step10-bugfix-wave-merge-loop
step 10 — review + fix loop · KICKOFF lines 685-753 · assets: bugfix-wave, code-review-gate, code-review-protocol

Sources consulted:
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/bugfix-wave/SKILL.md` (602 lines, no `references/`)
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/code-review-gate.md` (+ `references/independent-review.md`)
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/code-review-protocol/SKILL.md` (+ `code-reviewer.md`)
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/references/workflows/bugfix-wave.workflow.mjs`

## Current (verbatim)
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

## Trimmed
```text
Run the adversarial review ↔ fix loop for phase <NN> as a workflow. Source branch: <branch>.
Max 6 rounds.

First confirm no other worktree or session holds <branch> checked out — the fix tracks merge
themselves into it, and git rejects a merge into a branch that is checked out elsewhere.

Run the whole loop under the code-review-protocol skill, receiving side.

Then loop, round n = 1..6:

1. Dispatch the code-review-gate agent in round mode against PHASE/, passing all three of its
   round-mode inputs: phase_dir = PHASE/, round = n, branch = <branch> (engine codex). The
   branch is not optional — a round dispatched without it reviews the wrong tree. It writes
   findings.{md,json} into the round directory, and computes stop_loop and next_action
   itself — read those, never re-derive them. If no external engine is installed it falls back
   per the engine registry — say so in the final report, because a claude-on-claude round is a
   weaker gate.
2. If stop_loop is true, leave the loop.
3. Otherwise hand that findings.json to the bugfix-wave skill, naming <branch> as the source
   branch, and give it an explicit output path for the fixes.json summary its Phase 4 must
   emit: PHASE/reviews/round-<n>/fixes.json — the same round directory code-review-gate just
   wrote findings.json into. That path is required and it is not a free choice: round n+1's
   code-review-gate globs PHASE/reviews/round-*/fixes.json to decide whether a
   previously_seen_class has since been resolved.
3b. Reconcile this round before you open the next one. bugfix-wave's merge-and-clean-up phase
   is yours to drive, and it belongs here inside the loop, not after it — round n+1's review
   diffs <branch>, so a track that did not land is invisible to it and its defect classes come
   back as previously_seen_classes on fixes that were already written, burning rounds toward
   the hard cap. Drive its Phase 3 to the end, steps 3.1-1 through 3.1-7 in the skill's order,
   before you open round n+1.
4. Go to round n+1 — the next review has to see the merged fixes, which it only can if 3b ran.

Leave the loop when stop_loop is true, or at round 6 with stop_loop still false ("hard cap
reached — escalate"). Never open a 7th round.

Once you are out of the loop, confirm you are back on <branch> and that no agent worktrees
remain, then report the round count, what was fixed in each round, and anything still open.

Finally: if these rounds surfaced a convention or a recurring pitfall that generalizes past
this phase's findings — something the next phase's review would otherwise re-derive from
scratch — record it with the learn skill before moving on.
```

67 inner lines → 41 (26 cut, ~39%). All 22 CONFIRMED redundant-restatement claims are acted on;
every REFUTED claim's text survives; the one CONFIRMED unenforced-gap survives verbatim.

## What was cut, and which skill sentence covers it

**code-review-protocol** (the loop's receiving-side stance — claims 2, 3, 4, all CONFIRMED)
- "Every finding is a suggestion to evaluate, not an order to follow: verify each one against the actual code before implementing it, and question the ones that look wrong rather than complying." → skills/code-review-protocol/SKILL.md:320 "**Receiving:** External feedback = suggestions to evaluate, not orders to follow. Verify. Question. Then implement." (also :119 "Verify before implementing. Ask before assuming.", :126-131 Response Pattern)
- "A reviewer that misread the code is a finding to reject with a reason, not a defect to fix." → skills/code-review-protocol/SKILL.md:183-184 "IF suggestion seems wrong: / Push back with technical reasoning" (trigger listed at :224 "Reviewer lacks full context")
- "No gratitude performance and no performative agreement in the round reports — technical correctness over social comfort." → skills/code-review-protocol/SKILL.md:250 "❌ ANY gratitude expression", :171 "**No performative agreement**", :255 "If you catch yourself about to write \"Thanks\": DELETE IT", and the literal string at :10 / :119 "Technical correctness over social comfort."

**code-review-gate** (claims 4, 5, 7, 10 CONFIRMED; 2, 3, 8, 9, 11, 12 REFUTED and kept)
- "round mode diffs it to see what this sprint changed, and" → agents/code-review-gate.md:90 "Run `git diff main...<branch>` (or have the dispatched engine run it) to see what changed in this sprint." (repeated at :323)
- literal path "PHASE/reviews/round-<n>/findings.{md,json}" → agents/code-review-gate.md:461 "**Round mode output paths must be exactly** `{phase_dir}/reviews/round-<round>/findings.md` and `.../findings.json`." (also pinned :33-35, :358). The *wiring* ("the same round directory") is kept; only the literal string is dropped, and the directory is still named literally by the fixes.json path in item 3.
- "Round mode defaults to codex so the review is a structurally independent pass rather than the same model grading its own homework." → agents/code-review-gate.md:37 "Default engine: `codex`. Do not run round-mode reviews as `claude` by default — the point of the loop is a second, structurally independent pass" (also frontmatter :3, references/independent-review.md:42)
- "so with no fixes.json on disk stop_loop can only ever go true on a genuinely empty previously_seen_classes list." → agents/code-review-gate.md:88 (globs `round-*/fixes.json`) + :99 stop_loop rule "(or every class listed there is now resolved per a prior round's fixes.json)". Per the verdict, the rationale is *compressed, not deleted* — the "globs … to decide whether a previously_seen_class has since been resolved" half stays so the mandatory path does not read as a free choice.

**bugfix-wave** (claims 1-6, 10-17 CONFIRMED redundant; 7, 8, 9 load-bearing and kept; 19 gap and kept)
- "It groups the findings into conflict-free tracks, runs them in parallel worktrees, and each track merges itself back into <branch>." → skills/bugfix-wave/SKILL.md:5-9 frontmatter description, restated :45-47 "Every track gets **its own worktree and its own branch cut from the source branch**. A track **commits, merges itself into the source branch, and returns.**"
- "Its structural-fix mandate is required for every findings.json entry, so hold it to that:" → SKILL.md:179-180 "Mode 2 (`findings.json` input): **required for every entry**." and :87-88 (Mode 2 is auto-detected from the input this step supplies, :71/:79-82)
- "name the underlying class of defect rather than the line that got flagged, find and fix every instance of that class in one atomic verified commit" → SKILL.md:184-190 §1.5 steps 1-3 ("Identify the class … Not just \"bug at line 42\"", "Find every instance", "Fix all instances in one commit per class") + :217 "One commit per fix." + :229 "Verify before committing (3 tiers)"; also baked into the rendered subagent prompt at :404-407, :417-420
- "and leave a regression guard behind — a test, a lint rule, a type-level constraint, or a CI check. Prose in a doc is not a guard." → SKILL.md:191-198 §1.5 step 4, same four-item taxonomy in the same order + ":197 Pure documentation is not a regression guard."; hard-validated at :528-529
- "A point fix that touches only the flagged location is why the next round re-flags the same class." → SKILL.md:175-177 "A **point fix** changes only the flagged location … the same defect re-appears in the next review round."
- "A class that genuinely cannot be fixed structurally is recorded as unresolved with a one-line rationale, not quietly downgraded to a point fix." → SKILL.md:207-210 "If a class genuinely cannot be fixed structurally … records it as **unresolved** … with a one-line rationale"; gate at :531-532
- "The workflow script cannot touch git or the filesystem, so" → SKILL.md:335-337 "**The Workflow cannot clean up after itself.** It has no filesystem or git access. Reconciling `unmerged`, worktree removal, branch deletion (Phase 3) and `fixes.json` (Phase 4) all run in your turn after it returns." (also bugfix-wave.workflow.mjs:37, :293). Only the causal clause goes; "bugfix-wave's merge-and-clean-up phase is yours to drive" stays as the referent for the load-bearing placement rule.
- bullet 1, "`git log <branch>..<track-branch> --oneline` must come back empty" → SKILL.md:478-480 step 3, verbatim including "empty" and "Do not clean up until it passes."
- bullet 1, "Merge whatever did not land, resolving conflicts centrally — you hold the findings list and the cross-track context no single track has." → SKILL.md:469-472 step 1 ("resolve centrally: you hold the bug list, the track partition and the cross-track context that no single track has")
- bullet 1, "A track that lost every merge retry is an expected outcome, not a failure." → SKILL.md:66-67 "**That is an expected outcome, not a failure** — Phase 3 exists to catch it." (third copy at bugfix-wave.workflow.mjs:116)
- bullet 1, "A track that returned no handover is not an empty track: inspect its branch and merge what it did commit, and treat its remaining findings as unfixed." → SKILL.md:473-477 step 2 ("a missing handover is never an empty one … inspect with `git log …` and merge what landed. Treat its remaining bugs as unfixed"), repeated :573-579
- bullet 1, "Do not clean up until that check comes back empty for every branch." → SKILL.md:480 "Do not clean up until it passes." + the `-D` guard at :488
- bullet 2 (whole re-attach bullet) → SKILL.md:481-482 step 4 "**Re-attach**: `git checkout <source-branch>`. If dirty files linger from worktree cross-talk, `git checkout -- <files>` first." + :288-291 (the detach and its "tracks cannot push into a branch that is checked out" rationale) + :337-338 / :465 (the detached-HEAD warning)
- bullet 3, "Only then remove the agent worktrees and delete the track branches." → SKILL.md:483-488 steps 5-6, in that order, with the actual commands the guide omitted

## Parameters preserved
1. Phase placeholder `<NN>` and the "as a workflow" dispatch mode.
2. `Source branch: <branch>` — the caller-supplied value bugfix-wave refuses to infer (SKILL.md:42-44 "Never hardcoded to `main`").
3. `Max 6 rounds` / `round n = 1..6` — the loop bound.
4. The cross-session worktree pre-flight, kept **verbatim**: "First confirm no other worktree or session holds <branch> checked out — the fix tracks merge themselves into it, and git rejects a merge into a branch that is checked out elsewhere." (CONFIRMED unenforced-gap, bugfix-wave-19 — the skill's Edge Case at SKILL.md:559-560 actively misdiagnoses this case as a skipped `--detach`.)
5. code-review-protocol **mode selection**: "receiving side", plus the scope qualifier "the whole loop" (all six rounds, not one).
6. code-review-gate **mode selection**: "in round mode", and the target "against PHASE/".
7. All three round-mode inputs by name and value: `phase_dir = PHASE/`, `round = n`, `branch = <branch>`.
8. The explicit `(engine codex)` argument (code-review-gate-2 REFUTED — it is a caller override the agent solicits at :45, and it neither pins nor weakens the fallback chain).
9. "The branch is not optional … a round dispatched without it reviews the wrong tree" (code-review-gate-3 REFUTED — a duty on the caller no agent text can bind).
10. "computes stop_loop and next_action itself — read those, never re-derive them" (code-review-gate-6, load-bearing).
11. The fallback-disclosure duty: "If no external engine is installed it falls back per the engine registry — say so in the final report, because a claude-on-claude round is a weaker gate." (code-review-gate-8 REFUTED — `engine` in findings.json is a machine field, not the operator's report; the fallback clause is the grammatical subject of "say so".)
12. Loop control flow the guide owns: "If stop_loop is true, leave the loop" (step 2), "Go to round n+1" (step 4), the exit condition, the literal escalation string "hard cap reached — escalate", and "Never open a 7th round" (code-review-gate-9 and -11 REFUTED).
13. Which artifact feeds bugfix-wave: "hand that findings.json to the bugfix-wave skill".
14. `<branch>` named to bugfix-wave as the source branch (bugfix-wave-7).
15. The fixes.json output path, literal and unchanged: `PHASE/reviews/round-<n>/fixes.json`, with its "same round directory code-review-gate just wrote findings.json into" wiring (bugfix-wave-8 — Phase 4.3 delegates this path to the caller).
16. The path's non-negotiability plus the round-n+1 glob `PHASE/reviews/round-*/fixes.json` and its `previously_seen_class` purpose (compressed per code-review-gate-10's own remedy, not cut).
17. **The merge belongs inside the loop, not after it** — step 3b's placement, its ordering relative to round n+1, and its full outer-loop rationale (bugfix-wave-9, load-bearing; the skill's "once, after the whole run" is scoped to waves inside one invocation and cannot see the outer loop).
18. Responsibility assignment: bugfix-wave's merge-and-clean-up phase is the operator's turn to drive, and it runs to completion (all of Phase 3.1's seven steps, in the skill's order) before round n+1 opens.
19. Step 4's dependency statement — the next review only sees merged fixes if 3b ran.
20. The post-loop invariant + report contents: back on `<branch>`, no agent worktrees, round count, per-round fixes, anything still open.
21. The closing learn-skill hand-off with its "generalizes past this phase's findings" operator-judgment condition (no verdict claims it; untouched).

Deliberate non-cut: bugfix-wave-18 ("confirm you are back on <branch> and that no agent worktrees
remain") is CONFIRMED redundant at low severity against SKILL.md:481 and :489, but the dispatch
brief named those lines as must-keep-verbatim, and the same sentence carries the report
requirement that item 11 above ("say so in the final report") depends on. Kept whole; the saving
would have been one clause.

## Risk
Three things an operator loses, none of them a parameter:

1. **Reading-level convenience.** The guide no longer spells out the structural-fix mandate, the
   regression-guard taxonomy, or the Phase 3.1 git commands. A human skimming KICKOFF.md now has
   to open bugfix-wave/SKILL.md §1.5 and §3.1 to see them. The *executing* model does not — it
   loads the skill, and the skill enforces all of it three ways over (prose, the rendered subagent
   prompt at :404-420, and the Phase 4.2 validation gate at :528-532). Acceptable: KICKOFF is a
   dispatch brief, not a manual.
2. **One non-duplicated consequence clause**, "skip this and every remaining round runs on a
   detached HEAD" (bugfix-wave-16). The skill states the per-invocation version (:337-338, :465)
   and hard-orders re-attach as Phase 3.1 step 4 before cleanup in steps 5-6, so instructing the
   operator to run steps 1-7 in order preserves the behavior; only the cross-round framing of the
   consequence is gone. This is the single most defensible thing to add back if a reviewer wants
   insurance — one clause on the 3b line.
3. **The literal findings.{md,json} path** is now implied rather than stated. It is recoverable
   two ways in-block: the agent pins it as a hard rule (code-review-gate.md:461) and returns the
   path in its reply (:105), and item 3 still names `PHASE/reviews/round-<n>/fixes.json`
   literally, which fixes the directory.

Nothing load-bearing was removed: every REFUTED claim's text is intact, the CONFIRMED
unenforced-gap is verbatim, and all 21 enumerated parameters survive. The riskiest single edit is
the Phase 3.1 pointer replacing three bullets — it trades explicit commands for a numbered
reference into a skill that will be loaded anyway; if the guide's owners prefer belt-and-braces on
git operations, restoring bullet 2 (re-attach) alone recovers most of the safety at 4 lines.
