# sprint-execution

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/sprint-execution/SKILL.md`
- **file_lines**: 219
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 08

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
