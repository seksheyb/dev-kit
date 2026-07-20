---
name: context-restore
description: Restore working context saved earlier by /context-save. Loads the most recent saved state (across all branches by default) so you can pick up where you left off — even across worktree or workspace handoffs. Use when asked to "resume", "restore context", "where was I", or "pick up where I left off".
---

# /context-restore — Restore Saved Working Context

You are a **Staff Engineer reading a colleague's meticulous session notes** to pick up exactly where they left off. Load the most recent saved context and present it clearly so the user can resume without losing a beat.

**HARD GATE:** Do NOT implement code changes. This skill only reads saved context files and presents the summary.

**Default: load the most recent saved context across ALL branches.** This is intentionally different from `/context-save list`, which defaults to the current branch. Restore exists for cross-branch and cross-worktree handoff — a context saved on one branch can be resumed from another. Do NOT filter the candidate set by current branch.

## Detect command

- `/context-restore` → load the most recent saved context (any branch)
- `/context-restore <title-fragment-or-number>` → load a specific saved context
- `/context-restore list` → "Use `/context-save list` — listing lives on the save side." Exit.

## Restore flow

### Step 1: Find saved contexts

Saved contexts live in `~/.claude/context/<project-slug>/` (the slug is derived from the origin remote as owner-repo, falling back to the directory name — same derivation as `/context-save`):

```bash
SLUG=$(git remote get-url origin 2>/dev/null \
  | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' \
  | tr '/' '-' | tr -cd 'a-zA-Z0-9._-')
SLUG="${SLUG:-$(basename "$PWD" | tr -cd 'a-zA-Z0-9._-')}"
DIR="$HOME/.claude/context/$SLUG"
# find + sort, NOT ls -1t: the filename YYYYMMDD-HHMMSS prefix is the canonical
# order (stable across copies/rsync; mtime is not), and empty input cleanly
# returns nothing. Cap at 20 so a huge archive doesn't blow the context window.
find "$DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort -r | head -20
```

Candidates include every file regardless of branch — the branch lives in frontmatter and is displayed, not filtered on.

### Step 2: Load the right file

- Title fragment or number given → find the matching file among the candidates.
- Otherwise → load the **first file from `sort -r`** — the newest timestamp prefix is the canonical "most recent".

Read the file and present:

```
RESUMING CONTEXT
════════════════════════════════════════
Title:   {title}
Branch:  {branch from frontmatter}
Saved:   {timestamp, human-readable}
Status:  {status}
════════════════════════════════════════

### Summary
{summary}

### Remaining Work
{remaining work items}

### Notes
{notes}
```

If the current branch differs from the saved context's branch, say so: "This context was saved on branch `{branch}`; you are on `{current}`. You may want to switch branches before continuing."

### Step 3: Offer next steps

Ask: A) Continue working on the remaining items (summarize the first one and suggest starting there); B) Show the full saved file; C) Just needed the context, thanks.

## If no saved contexts exist

"No saved contexts yet. Run `/context-save` first to save your current working state, then `/context-restore` will find it."

## Important Rules

- **Never modify code.** Read and present only.
- **Always search across all branches by default.** Cross-branch resume is the whole point.
- **"Most recent" means the filename `YYYYMMDD-HHMMSS` prefix,** not filesystem mtime — filenames are stable across filesystem operations, mtime is not.
