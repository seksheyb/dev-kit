# Self-containment audit — paused state (2026-07-21)

## What this is

A per-file audit of every dev-kit skill/agent (143 skills + 42 agents = 185 items),
triggered by finding a leftover `@references/gsd/mandatory-initial-read.md` include in
`planner.md`. Each item gets a fresh subagent that:

1. Reads the file in full.
2. Resolves every `@include` / "Read X" / "See X" reference — confirms it exists inside
   the file's own plugin, is not a stub, and doesn't point at the six now-uninstalled
   source repos (superpowers, spec-kit, gstack, get-shit-done, claude-skills,
   awesome-claude-code-subagents).
3. Cross-checks the item's original source file(s) (still on disk at
   `/Users/sekshey/IdeaProjects/new-ADD-SDD-Initiator/<source-repo>/...`) for genuine
   methodology/knowledge that was lost during porting (as opposed to deliberately
   stripped infra preamble/branding) — and restores it if found.
4. Fixes anything it finds directly with the Edit tool.

Full prompt template: `.audit/audit-workflow-original-185.js` (the script that was run).

## Why it was paused

The user asked to pause: wait for in-flight agents, don't dispatch new ones, save
state, commit, and continue from a cloud server. **I could not find a working stop
mechanism** — `TaskStop`/`TaskList`/`TaskOutput` did not recognize the workflow's task
ID (`wnb62tlg1`) or run ID (`wf_df63ca05-64b`) under any form I tried. The workflow may
continue running in the background of the original session; this snapshot and the
resume script make that irrelevant — treat the state below as authoritative regardless.

## Progress at time of snapshot

**73 of 185 items have a confirmed result: 54 clean, 19 fixed.**
**7 items were in-flight (started, no confirmed result) — see below.**
**112 items remain (105 never started + the 7 in-flight ones, to be safe).**

- `.audit/all-185-items.json` — the full original item list.
- `.audit/completed-73-items.json` — the 73 confirmed-done items, keyed by repo-relative
  path, with status/fixes_applied/capability_gaps_found/notes for each.
- `.audit/remaining-112-items.json` — everything NOT yet confirmed done. This is what
  `resume-audit-workflow.js` runs against.

### The 19 genuinely fixed files (real capability restored, not just cleanup)

Real methodology/checklist content that had been lost during the original porting pass
was found and restored in these files (see `completed-73-items.json` for full detail
per file):

- `plugins/dev-kit-backend/skills/rails-expert/SKILL.md`
- `plugins/dev-kit-core/skills/content-qa/SKILL.md`
- `plugins/dev-kit-core/skills/brainstorming/SKILL.md`
- `plugins/dev-kit-core/skills/context-save/SKILL.md`
- `plugins/dev-kit-core/skills/diagram/SKILL.md`
- `plugins/dev-kit-core/skills/document-generate/SKILL.md`
- `plugins/dev-kit-core/skills/design-html/SKILL.md`
- `plugins/dev-kit-core/skills/cso/SKILL.md`
- `plugins/dev-kit-core/skills/devex-review/SKILL.md` (+ new `references/dx-calibration.md`)
- `plugins/dev-kit-core/skills/document-release/SKILL.md`
- `plugins/dev-kit-core/skills/learn/SKILL.md`
- `plugins/dev-kit-core/skills/land-and-deploy/SKILL.md`
- `plugins/dev-kit-core/skills/plan-review-devex/SKILL.md` (+ new `references/dx-calibration.md`)
- `plugins/dev-kit-core/skills/plan-review-design/SKILL.md`
- `plugins/dev-kit-core/skills/refactoring-specialist/SKILL.md`
- `plugins/dev-kit-core/skills/plan-review-eng/SKILL.md`
- `plugins/dev-kit-core/skills/plan-review-ceo/SKILL.md`
- `plugins/dev-kit-core/skills/systematic-debugging/SKILL.md`
- `plugins/dev-kit-core/skills/sprint-execution/SKILL.md`

### 7 items in-flight at snapshot time (unconfirmed — may have partial edits on disk)

These had a subagent actively working on them with no completed result. The resume
script re-audits them from scratch (safe/idempotent even if partially edited already):

- `plugins/dev-kit-core/skills/writing-plans/SKILL.md`
- `plugins/dev-kit-core/skills/ship/SKILL.md`
- `plugins/dev-kit-core/skills/specify/SKILL.md`
- `plugins/dev-kit-core/skills/writing-skills/SKILL.md`
- `plugins/dev-kit-core/agents/advisor-researcher.md`
- `plugins/dev-kit-core/agents/accessibility-tester.md`
- `plugins/dev-kit-core/agents/assumptions-analyzer.md`

## How to resume (on the cloud server or any new session)

**Do NOT use `Workflow({scriptPath, resumeFromRunId: "wf_df63ca05-64b"})`** — per the
Workflow tool's own docs, `resumeFromRunId` only works **same-session**. A new session
(cloud server) has no access to that cached run.

Instead, just run the pre-built resume script — it already contains only the 112
remaining items:

```
Workflow({ scriptPath: "<repo>/.audit/resume-audit-workflow.js" })
```

That's it — no need to reconstruct the item list or re-explain the task. When it
finishes, re-run the same journal-extraction approach documented above (or just trust
its own returned summary — `clean_count`/`fixed_count`/`needs_attention_count`) to
confirm all 185 are done, then delete the `.audit/` directory (it's scaffolding, not
a permanent part of the plugin) before considering the audit complete.

## Concurrency note

The original run used the Workflow tool's built-in `pipeline()` concurrency cap
(~15, matching the user's stated limit) over all 185 items at once. The resume script
does the same over the remaining 112 — no changes needed to the mechanism itself.
