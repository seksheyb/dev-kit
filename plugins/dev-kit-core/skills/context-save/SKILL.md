---
name: context-save
description: Save working context — git state, decisions made, and remaining work — so any future session (even on a different branch or worktree) can resume without losing a beat via /context-restore. Use when asked to "save progress", "save state", "context save", or "save my work" before ending a session or handing off.
---

# /context-save — Save Working Context

You are a **Staff Engineer who keeps meticulous session notes**. Capture the full working context — what's being done, what decisions were made, what's left — so any future session can resume via `/context-restore`.

**HARD GATE:** Do NOT implement code changes. This skill captures state only.

## Detect command

- `/context-save` or `/context-save <title>` → **Save** (use the given title, else infer one)
- `/context-save list` → **List**
- `/context-save resume` or `restore` → tell the user: "Use `/context-restore` — save and restore are separate skills."

## Save flow

### Step 1: Gather state

```bash
echo "=== BRANCH ===";           git rev-parse --abbrev-ref HEAD
echo "=== STATUS ===";           git status --short
echo "=== DIFF STAT ===";        git diff --stat
echo "=== STAGED DIFF STAT ==="; git diff --cached --stat
echo "=== RECENT LOG ===";       git log --oneline -10
```

### Step 2: Summarize context

Using the gathered state plus the conversation history, produce a summary covering:

1. **What's being worked on** — the high-level goal or feature
2. **Decisions made** — architectural choices, trade-offs, approaches chosen and why
3. **Remaining work** — concrete next steps, in priority order
4. **Notes** — anything a future session needs (gotchas, blocked items, open questions, things tried that didn't work)

Infer a concise title (3-6 words) if none was given.

### Step 3: Write the saved-context file

Saved contexts live outside the repo so they survive branch switches and worktree handoffs: `~/.claude/context/<project-slug>/`. Compute the path in bash — never splice a raw user title into a command (the sanitizer is an allowlist: only `a-z 0-9 - .` survive):

```bash
# Project slug from the origin remote (owner-repo), falling back to the directory name
SLUG=$(git remote get-url origin 2>/dev/null \
  | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' \
  | tr '/' '-' | tr -cd 'a-zA-Z0-9._-')
SLUG="${SLUG:-$(basename "$PWD" | tr -cd 'a-zA-Z0-9._-')}"
DIR="$HOME/.claude/context/$SLUG"
mkdir -p "$DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RAW="${TITLE_RAW:-untitled}"   # pass the raw title in via TITLE_RAW
TITLE_SLUG=$(printf '%s' "$RAW" | tr '[:upper:]' '[:lower:]' | tr -s ' \t' '-' | tr -cd 'a-z0-9.-' | cut -c1-60)
TITLE_SLUG="${TITLE_SLUG:-untitled}"
FILE="$DIR/${TIMESTAMP}-${TITLE_SLUG}.md"
# Collision-safe: same-second double save gets a random suffix. Files are append-only — never overwrite.
[ -e "$FILE" ] && FILE="$DIR/${TIMESTAMP}-${TITLE_SLUG}-$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 4).md"
echo "FILE=$FILE"
```

Write the file to the exact `$FILE` path printed (do not reconstruct it):

```markdown
---
status: in-progress
branch: {current branch name}
timestamp: {ISO-8601 timestamp}
files_modified:
  - path/to/file1
  - path/to/file2
---

## Working on: {title}

### Summary
{1-3 sentences: the high-level goal and current progress}

### Decisions Made
{bulleted list of choices, trade-offs, and reasoning}

### Remaining Work
{numbered list of concrete next steps, in priority order}

### Notes
{gotchas, blocked items, open questions, dead ends already tried}
```

`files_modified` comes from `git status --short` (staged and unstaged), relative to the repo root.

Confirm to the user: title, branch, file path, number of modified files. "Restore later with /context-restore."

## List flow

Find saved contexts (filename timestamp prefix is the canonical order — stable across copies, unlike mtime):

```bash
find "$HOME/.claude/context/$SLUG" -maxdepth 1 -name "*.md" -type f 2>/dev/null | sort -r
```

**Default: show contexts for the current branch only** (read `branch:` from each file's frontmatter). With `--all`, show every branch and add a Branch column.

Present as a table: `# | Date | Title | (Branch) | Status`. No saved contexts → "No saved contexts yet. Run `/context-save` to save your current working state."

## Important Rules

- **Never modify code.** Read state, write the context file, nothing else.
- **Always include the branch name in frontmatter** — critical for cross-branch restore.
- **Saved files are append-only.** Never overwrite or delete; each save is a new file.
- **Infer, don't interrogate.** Use git state and conversation context; only ask if the title genuinely cannot be inferred.
