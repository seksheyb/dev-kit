# context-restore

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/context-restore/SKILL.md`
- **file_lines**: 80
- **has_references**: no
- **complexity**: high
- **invocation_count**: 6
- **invoked by steps**: 01, 03, 04, 05, 08, 12

---

## Invocation 1 — step 01 (Requirements & product framing), block 0, lines 130-138

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then use the brainstorming skill
to explore <product, one line> with me. Run your mandatory Premise Challenge first — is this
the right problem, what if we do nothing, what already exists — before proposing approaches;
escalate to full first-principles decomposition if the framing looks inherited-by-convention
rather than reasoned. Otherwise: one question at a time, 2–3 approaches with a recommendation,
and section-by-section design approval before we write anything. Use your YC-office-hours or
go/no-go mode instead if this is a pre-code idea validation call rather than a scoped feature.
```

### surrounding_prose

This is the first block under heading '## 1. Requirements & product framing' (line 128). Immediately after the fence, a parenthetical note (lines 140-141) says: '(milestone 2+: replace `<product, one line>` with "the Now/Next items in docs/global/requirements/BACKLOG.md")' — i.e. for milestone 2 and later runs, the placeholder in the prompt should be swapped out for a reference to the backlog file instead of a one-line product description. After that, line 143 reads 'Once the design is approved:' leading into the next block.

---

## Invocation 2 — step 03 (Research & roadmap), block 0, lines 252-265

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then dispatch four
project-researcher agents in one message — one per axis: STACK, FEATURES, ARCHITECTURE,
PITFALLS — writing docs/milestones/<M>/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md.
Give every one of them the same context — the project one-liner,
docs/global/project/PROJECT.md and SPEC/spec.md, ecosystem mode, and the specific open
questions you want answered — and tell each one explicitly that it owns only its single
assigned file: they default to writing STACK, FEATURES and PITFALLS on every run, which would
have four parallel agents overwriting each other. They write but never commit. When all four
have returned, use research-synthesizer to merge them into
docs/milestones/<M>/research/SUMMARY.md and commit it — the four researchers never commit;
research-synthesizer is the one that does. Have it also derive a suggested phase structure
from the merged research for the roadmapper step below to weigh.
```

### surrounding_prose

This is the first prompt under heading '## 3. Research & roadmap'. No conditioning text precedes it beyond the section heading itself. The block itself contains the operative instructions: dispatch four project-researcher agents in one message (one per axis STACK/FEATURES/ARCHITECTURE/PITFALLS), give them shared context, warn explicitly that each must own only its single assigned file (their default behavior would otherwise cause all four to write STACK, FEATURES, and PITFALLS and overwrite each other), have them write-but-not-commit, then use research-synthesizer to merge into SUMMARY.md and commit — noting explicitly that the four researchers never commit and research-synthesizer is the one that does. Also instructs research-synthesizer to derive a suggested phase structure for the next block (roadmapper) to weigh.

---

## Invocation 3 — step 04 (Design system), block 0, lines 299-316

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then use the design-consultation
skill to establish the design system for <product> and write docs/global/design/DESIGN.md —
aesthetic, typography, color, layout, spacing, motion. Delivery is always Claude Design, so
stop and tell me if the claude-design MCP is unavailable rather than falling back to local
files. Resolve the design-system binding first: if a design system already fits, bind its id
as claude_design_system_id and skip the aesthetic questions entirely. If none fits and you want
to compare competing directions before committing — worth doing here, since this stage runs
once ever and is the only place in the pipeline that choice is still open — ask for "Variant
shotgun" mode to generate several full directions side by side. Otherwise, compose
the paste-ready system-creation prompt to docs/state/tmp/claude-design-system-prompt.md and
hand it to me — no MCP tool can create a design system, so that step is mine, not yours. Stop
there in that case: do NOT go on to design-html, which refuses to run unbound and would just
tell me to come back here. Only if a system was already bound, continue to design-html for the
reference implementation. Either way, you will ask once which model performs the Claude Design
generation work — Sonnet (default), Opus, or Fable — and dispatch it via the Agent tool's model
override, since that dispatch is the only thing that actually honors the choice.
```

### surrounding_prose

Section header: '4. Design system — (only if this project has UI and docs/global/design/DESIGN.md does not exist)'. Immediately before the block: 'Runs once ever, not per phase. Delivery is always Claude Design — there is no local-file fallback anywhere in this stage.' After the block, a conditioning note before the next block: '(only if design-consultation generated a system-creation prompt instead of binding an existing system)' — gating the following operator-side step.

---

## Invocation 4 — step 05 (Phase discovery), block 1, lines 361-375

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint. Then dispatch five agents in one
message for phase <NN>: four codebase-mapper agents, one per focus area (tech / arch / quality /
concerns) — name the focus area in each dispatch, it is the only input they take — which write
their maps to docs/global/codebase/*.md, the canonical project-wide location, not into PHASE/;
plus one assumptions-analyzer, given the phase number and name, the phase goal from ROADMAP.md,
the locked decisions from earlier phases, the codebase hints you already have, and the
calibration tier. These five are safe concurrently because they write different files AND read
nothing each other produces. pattern-mapper is deliberately NOT in this fan-out: it reads
PHASE/CONTEXT.md and PHASE/RESEARCH.md, neither of which exists yet, so it gets its own block
below. Fold the assumptions and the phase-relevant findings from those maps into
PHASE/CONTEXT.md. The arch and concerns mappers should query the graph at
docs/state/graphs/graph.json before exploring fresh, and so should you, rather than re-reading
the tree.
```

### surrounding_prose

No prose lines between this block and the previous or next block — just a blank line separator on each side. The block itself explains its own ordering rationale (pattern-mapper excluded because its inputs, PHASE/CONTEXT.md and PHASE/RESEARCH.md, don't exist yet) and instructs folding outputs into PHASE/CONTEXT.md.

---

## Invocation 5 — step 08 (Build it, test-first), block 0, lines 566-590

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

## Invocation 6 — step 12 (Final review — milestone gate), block 0, lines 973-975

### verbatim_text

```text
Use the context-restore skill to reload the last checkpoint.
```

### surrounding_prose

Heading immediately above: '## 12. Final review — the milestone gate'. Immediately after the block: 'Both sub-stages **gate** the milestone. A failing functional scorecard blocks step 13 just as an open threat does.' Then: '**a. Functional** — two independent predicates, not one. The two blocks below gate on different things: shipped UI triggers the first, a shipped developer-facing surface triggers the second, and a milestone that shipped both runs both.'

---
