# finishing-a-development-branch

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/finishing-a-development-branch/SKILL.md`
- **file_lines**: 241
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 08, 13

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

## Invocation 2 — step 13 (Ship — open the PR), block 3, lines 1146-1162

### verbatim_text

```text
Use the finishing-a-development-branch skill for this milestone. Run its pre-merge test gate,
then take option 2, "Push and create a Pull Request" — not option 1, merge. Leave the branch
unmerged: step 14's document-release needs the diff still open, and it aborts outright if run
from the base branch.

Do not clean up the worktree, and do not ask the skill to. Option 2 deliberately preserves it —
worktree cleanup runs for options 1 and 4 only — because I need it alive to iterate on PR
feedback, and step 14 still commits docs from it.

Option 2's body is only `git push -u origin <branch>`; despite its name it does not actually
open the PR. So once the push lands, confirm the PR exists before we go anywhere near step 14:
run `gh pr view --json number,url,state` and, if there is none, open it yourself with
`gh pr create`, titling and describing it from `git log <base>..HEAD`. Give me the PR URL.
Step 14's document-release writes its shipped-vs-documented coverage and docs-debt report into
the PR body and skips that write with only a passing message when it finds no PR — so an
unconfirmed PR still loses that report, with nothing louder than that one line to flag it.
```

### surrounding_prose

Section header: '**Now open the PR. Pick one path.**' This block is labeled 'Manual:' as one of two alternative paths (the other being 'Automated:' / block_index 3). Mentions document-release (step 14's asset) only as context for why the branch must stay unmerged and why the PR must exist — document-release itself is not invoked by this block.

---
