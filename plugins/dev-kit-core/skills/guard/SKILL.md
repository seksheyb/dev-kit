---
name: guard
description: Safety guardrails for risky sessions. Warns before destructive commands (rm -rf, DROP TABLE, force-push, git reset --hard, kubectl delete) and can freeze edits to a chosen directory, with unfreeze to lift the boundary. Use when touching prod, debugging live systems, working in shared environments, or when asked to "be careful", "safety mode", "guard mode", "freeze edits", or "unfreeze".
---

# Guard — Session Safety Mode

One skill, three protections. Activate what the situation calls for:

| Request | Activate |
|---|---|
| "be careful", "prod mode", "safety mode" | **Destructive-command warnings** |
| "freeze", "restrict edits to X", "lock scope" | **Edit-scope freeze** |
| "guard", "full safety" | **Both** |
| "unfreeze", "lift the restriction" | **Unfreeze** |

State convention: the freeze boundary is stored in a session state file (default `.claude/state/freeze-dir.txt` in the repo, or the project's configured state dir). If the project has PreToolUse hooks wired to these conventions, the hooks enforce them mechanically; without hooks, YOU enforce them behaviorally — check every command and edit against the active guardrails before executing.

---

## Protection 1: Destructive-Command Warnings

When active, every shell command is checked against destructive patterns before running. On a match: **stop, warn the user with the specific risk, and ask before executing.** The user can always override — this is a speed bump, not a wall.

### What's protected

| Pattern | Example | Risk |
|---------|---------|------|
| `rm -rf` / `rm -r` / `rm --recursive` | `rm -rf /var/data` | Recursive delete |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Data loss |
| `TRUNCATE` | `TRUNCATE orders;` | Data loss |
| `git push --force` / `-f` | `git push -f origin main` | History rewrite |
| `git reset --hard` | `git reset --hard HEAD~3` | Uncommitted work loss |
| `git checkout .` / `git restore .` | `git checkout .` | Uncommitted work loss |
| `git clean -f` | `git clean -fdx` | Untracked file loss |
| `kubectl delete` | `kubectl delete pod` | Production impact |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Container/image loss |
| Piped remote scripts | `curl … \| sh` | Arbitrary code execution |

### Safe exceptions (no warning)

Recursive deletes of disposable build artifacts: `node_modules`, `.next`, `dist`, `build`, `__pycache__`, `.cache`, `.turbo`, `coverage`.

Exception: a `git reset --hard <base>` executed as the mandated first step inside a fresh, commitless subagent worktree (per the sprint-execution skill) is non-destructive and needs no warning.

### Warning format

> ⚠️ Destructive command detected: `<command>`
> Risk: <what is irreversibly lost>
> Proceed anyway, or cancel?

For genuinely one-way operations (force-push to a shared branch, DROP on a non-local database), require an explicit typed confirmation — never proceed on a vague "ok".

---

## Protection 2: Edit-Scope Freeze

Lock file edits to a specific directory. Any Edit or Write targeting a file outside the allowed path is **blocked** (not just warned).

### Setup

1. Ask the user which directory to restrict edits to (free-text path). When freeze is triggered by another skill (e.g., systematic-debugging's scope lock), the narrowest directory containing the affected files is used instead of asking.
2. Resolve to an absolute path and store with a trailing slash:

```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
FREEZE_DIR="${FREEZE_DIR%/}/"
mkdir -p .claude/state
echo "$FREEZE_DIR" > .claude/state/freeze-dir.txt
echo "Freeze boundary set: $FREEZE_DIR"
```

3. Tell the user: "Edits are now restricted to `<path>/`. Any Edit or Write outside this directory will be blocked. Run `/guard` again to change the boundary, or unfreeze to remove it."

### Enforcement rules

- Before every Edit/Write, check the target path starts with the freeze directory. Outside the boundary → **deny**, explain, and continue with in-scope work. If an out-of-scope change is genuinely required, say so and ask the user to widen or lift the freeze — don't silently work around it.
- The trailing `/` prevents `/src` from matching `/src-old`.
- Freeze applies to Edit/Write operations only — Read, Bash, Glob, Grep are unaffected. It prevents accidental edits; it is **not a security boundary** (shell commands like `sed` could still modify files outside it — while frozen, don't use them to do so).
- The boundary persists for the session via the state file; re-freezing overwrites it.

---

## Protection 3: Full Guard Mode (both)

Activates destructive-command warnings AND the edit boundary in one step. Ask once: "Guard mode: which directory should edits be restricted to? Destructive command warnings are always on." Then run the freeze setup, and announce:

> **Guard mode active.** Two protections running:
> 1. **Destructive command warnings** — rm -rf, DROP TABLE, force-push, etc. warn before executing (you can override)
> 2. **Edit boundary** — file edits restricted to `<path>/`; edits outside are blocked
> To remove the edit boundary, unfreeze. Protections end with the session.

---

## Unfreeze

Remove the edit restriction, allowing edits everywhere:

```bash
if [ -f .claude/state/freeze-dir.txt ]; then
  PREV=$(cat .claude/state/freeze-dir.txt)
  rm -f .claude/state/freeze-dir.txt
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Report the result to the user. Unfreeze clears only the edit boundary — destructive-command warnings, if active, stay on until the session ends. To re-freeze, run the freeze setup again.
