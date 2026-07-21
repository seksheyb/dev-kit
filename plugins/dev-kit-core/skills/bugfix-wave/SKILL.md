---
name: bugfix-wave
description: >
  Parallel bug-fix executor. Takes a list of bugs/findings (from code review, adversarial audit,
  security scan, lint report, etc.), classifies each by model and effort, groups them into
  independent tracks with no file conflicts, organizes tracks into dependency-ordered waves,
  then dispatches parallel subagents — one per track — each working in its own git worktree
  and branch. The orchestrator merges completed tracks, resolves any conflicts, cleans up
  worktrees/branches, and moves to the next wave.

  Trigger this skill whenever the user provides a prioritized bug list and wants them fixed
  in parallel. Also trigger when the user says "fix these", "execute these findings",
  "run the fix wave", "parallel fix", or pastes a list of issues with severity tags
  (P0/P1/P2, critical/major/minor, etc.). This is the go-to skill for turning any bug list
  into shipped fixes with maximum parallelism.
---

# Bugfix Wave Executor

You are the orchestrator. Your job: take a bug list, classify it, partition it into conflict-free
parallel tracks, dispatch subagents in waves, merge their work, and clean up. No plan files. No
markdown output. Just execute.

## Input modes

Bugfix-wave accepts input in two modes. Detect which one you've been given before Phase 1.

### Mode 1 — Free-text bug list (default)

Caller pastes or describes findings inline. You parse them as in §1.1 below. Structural-fix mandate
in §1.5 is **recommended** (apply where the finding is a class of defect, not a one-off typo). No
machine-readable output is required at the end.

### Mode 2 — `findings.json` path (structured)

Caller provides a path to a `findings.json` file matching a published schema (e.g.
`docs/dev-kit/SCHEMAS.md` in caller-side projects). Read that file at the start of Phase 1.

In this mode:
- Every entry in `blockers` represents a **defect class** with one or more instances. Treat it
  as a class, not a single bug.
- The structural-fix mandate in §1.5 is **required** for every entry — find all instances of
  the class, fix them all in one commit per class, and add a regression guard.
- After the final wave merges, you **must** emit a `fixes.json` summary at a caller-supplied
  path (see Phase 4).

The caller may provide the schema path explicitly (e.g. `SCHEMAS.md`); read it before authoring
the output JSON so the shape matches exactly.

## Phase 1: Classify and Partition

### 1.1 — Read the bug list

Parse each finding. Extract:
- **ID**: sequential (B1, B2, ...) or use the user's IDs if provided
- **Priority**: P0 / P1 / P2 (normalize from whatever scheme the user used)
- **Summary**: one line
- **Files touched**: list every file path the fix will need to modify
- **Depends on**: which other bugs must be fixed first (if any)
- **Class** (Mode 2 only): copy the `class` field from `findings.json` verbatim. The class is
  the unit of fix, not the individual finding.

### 1.2 — Assign model and effort

Pick model and effort independently for each bug, then combine.

**Model axis** — pick by task nature:

| Model | When to use |
|-------|-------------|
| `haiku` | Pure mechanical: config edits, copy changes, string replacements, type stubs |
| `sonnet` | Standard feature work: wiring existing patterns, API/UI implementation, predictable scope |
| `opus` | Moderate complexity: multi-file refactors, non-trivial logic, some ambiguity to resolve |

Use `opus` for P0s that involve cross-cutting concerns or ambiguous requirements. Use `haiku` for
P2 cosmetic/docs fixes. Default to `sonnet` when unsure.

**Effort axis** — pick by required reasoning depth:

| Level | When to use |
|-------|-------------|
| `low` | Execute literally. Trivial fix, no judgment calls. |
| `medium` | Standard quality. Minor judgment on details. |
| `high` | Think carefully. Surface edge cases. Prefer correctness. |

Default to `medium`. Upgrade to `high` for security fixes, data-loss bugs, and anything where
getting it wrong creates a worse bug than the original.

### 1.3 — Group into tracks

A **track** is a set of bugs that:
1. Touch the same subsystem (so the subagent has coherent context)
2. Have no file-level conflicts with other tracks in the same wave

**Conflict rule**: if two bugs touch the same file, they must be in the same track OR in
different waves. Same file = same track is simpler; use different waves only when the bugs
are in fundamentally different subsystems that happen to share one file.

**Track sizing**: aim for 2-6 bugs per track. A single-bug track is fine for isolated P0s.
More than 6 bugs means the subagent prompt gets unwieldy — split into sub-tracks.

**Track naming**: short, descriptive. `track-schema`, `track-rls`, `track-ui`, `track-docs`.

**Track model/effort**: use the highest model and effort of any bug in the track. A track with
one `opus/high` bug and three `sonnet/medium` bugs runs at `opus/high`.

### 1.4 — Organize into waves

A **wave** is a set of tracks that can run simultaneously.

- Wave 1: tracks with no dependencies on other bugs
- Wave 2: tracks whose bugs depend on Wave 1 fixes (e.g., tests that need schema changes from Wave 1)
- Wave N: tracks depending on Wave N-1

Also push tracks to later waves when they'd have file conflicts with Wave 1 tracks that couldn't
be resolved by grouping.

Most bug lists fit in 1-2 waves. Three waves is unusual. If you're creating 4+ waves, you're
over-sequencing — re-examine your dependency analysis.

### 1.5 — Structural-fix mandate

A **structural fix** treats the finding as a class of defect and resolves every instance, then
locks in a regression guard. A **point fix** changes only the flagged location and leaves
other instances of the same class intact. Point fixes are cheaper short-term and worse
long-term — the same defect re-appears in the next review round.

Mode 2 (`findings.json` input): **required for every entry**. Mode 1: **recommended** when the
finding represents a class.

For each class to fix, the responsible track must:

1. **Identify the class** — name the underlying defect type (e.g. "missing zod validation at
   edge function boundary", "RLS check missing on `select` policy", "resolver returns DB row
   without privacy filter"). Not just "bug at line 42".
2. **Find every instance** — grep, ripgrep, AST-walk, or read the relevant subsystem. The
   `lead_file` in `findings.json` is a starting point, not the only target.
3. **Fix all instances in one commit per class** — commit message must list every file
   touched and end with `structural fix — applied to N call sites`.
4. **Add a regression guard** — at least one of:
   - A test (unit / contract / integration / E2E) that fails if the class re-appears
   - A lint rule (ESLint, custom AST rule, semgrep)
   - A type-level constraint (branded types, exhaustive unions, generics)
   - A CI check (schema diff, bundle audit, RLS test job)

   Pure documentation is not a regression guard. The guard must mechanically prevent or
   detect re-introduction.
5. **Record the result** — every track that fixes a class must report, in its close handover:
   - The class name
   - Number of instances touched
   - Every file modified
   - The regression guard added (file + rule/test name)

This information feeds the `fixes.json` summary in Phase 4.

If a class genuinely cannot be fixed structurally (e.g. one of the instances requires a
breaking API change scheduled for a later sprint), the track records it as **unresolved** in
the close handover with a one-line rationale. The orchestrator surfaces unresolved classes
to the caller.

### 1.6 — Atomic per-fix commit discipline (subagent contract)

Every track subagent follows this discipline for each bug/class it fixes. Bake it into every
subagent prompt (the template in §2.3 references it).

**One commit per fix.** Each bug (Mode 1) or class (Mode 2) gets exactly one atomic commit.
Never batch unrelated fixes into one commit; never split one fix across commits. The commit
message uses conventional format — `fix: {id} {short description}` — and its body lists every
file touched (class fixes additionally end with `structural fix — applied to N call sites`
per §1.5).

**Read before fixing.** The finding description is GUIDANCE, not a patch to blindly apply.
Read the actual source at the cited location (±10 lines minimum), confirm the code matches
what the finding describes, and adapt the fix to the real current state. If the code has
changed so much the fix no longer applies, skip with reason "code context differs from
finding" — do not force a broken fix.

**Verify before committing (3 tiers):**
- *Tier 1 (always):* re-read the modified section; confirm the fix is present and the
  surrounding code is intact.
- *Tier 2 (when available):* run a syntax/type check appropriate to the file type
  (`npx tsc --noEmit`, `node -c`, `python -c "import ast; ast.parse(open(f).read())"`, JSON
  parse, project typecheck command). Ignore pre-existing errors in OTHER files — only fail on
  new errors in the files you touched.
- *Tier 3 (fallback):* if no checker exists for the file type (.md, .sh, etc.), accept
  Tier 1 and proceed — don't skip a fix just because syntax checking is unavailable.

**Rollback on failure.** Before editing, note every file you're about to touch. If
verification fails or the commit fails, revert with `git checkout -- <file>` for each touched
file (safe — the fix isn't committed yet, and prior findings' commits are untouched), then
mark the finding "skipped: fix caused errors, rolled back" with details. Never use a file
rewrite for rollback, and never leave uncommitted changes behind.

**Logic-bug caveat.** Tiers 1-2 verify syntax, not semantics. For findings classified as
logic errors (wrong condition, off-by-one, bad state handling), report the fix in the close
handover as `fixed: requires human verification` so the orchestrator can flag it.

**Why this matters:** per-fix commits make partial failure safe by design — if a subagent
dies mid-track, every commit already made is self-contained, correct, and revertable on its
own. The orchestrator (and the user) can `git log` the branch and know exactly which findings
landed.

## Phase 2: Dispatch

### 2.1 — Announce the plan

Before dispatching, tell the user (brief, not markdown):
- How many tracks and waves
- Track names with bug IDs and model/effort
- Any dependency reasoning

Example:
```
Wave 1 (5 tracks): track-schema (B1-B3, opus/high), track-resolvers (B4,B16, sonnet/high),
track-rls (B5, sonnet/high), track-buzzsprout (B9-B10,B24-B25, sonnet/medium),
track-pushfanout (B17-B18, sonnet/medium)

Wave 2 (4 tracks): track-tests (B6, sonnet/medium — needs schema from W1),
track-progress (B11-B12, sonnet/high), track-ui (B14-B15,B19-B23, sonnet/medium),
track-cosmetic (B26-B28, haiku/low)
```

### 2.2 — Dispatch all tracks in a wave simultaneously

Use a **single message** with multiple `Agent` tool invocations — one per track. Each agent gets:

- `isolation: "worktree"` — so it works on an isolated copy
- `model`: set to the track's model (`haiku`, `sonnet`, or `opus`)
- A self-contained prompt (the subagent has zero context from this conversation)

### 2.3 — Subagent prompt template

Every subagent prompt must follow this structure:

```
You are the {track-name} subagent for the {context} bug-fix wave.
Model: {model-id}
Effort level: {effort}

Effort level meaning:
- low:    Execute literally. Follow plan steps mechanically. No deliberation.
- medium: Standard quality. Use judgement on minor details. No second-guessing.
- high:   Think carefully before each step. Surface edge cases. Prefer correctness.

## Your task

{One sentence summary of what this track fixes.}

## Branch

Create branch `{prefix}/w{wave}-track-{name}` from `main`.
Commit frequently with conventional commit messages.
Merge back to `main` when done. Delete the branch after merge.

## Specific issues to fix

{For each bug / class in this track:}
1. **{Priority}: {Class or Summary}** (`{lead_file}:{line}`): {Description of the defect
   class and what the fix should look like. Be specific — the subagent wasn't in the
   conversation. In Mode 2, copy the class name verbatim from findings.json.}

## How to approach

1. Read each file mentioned to understand current state (±10 lines around every cited
   location). The finding is guidance, not a patch — adapt to the real code. If the code
   context differs so much the fix no longer applies, skip with reason; don't force it.
2. **Structural-fix step** (required in Mode 2, recommended in Mode 1): for each class above,
   grep / ripgrep / AST-walk for every other instance in the relevant subsystem. The
   lead_file is a starting point, not the only target. Fix all instances together.
3. {Ordered steps specific to this track}
4. **Add a regression guard** — at least one of: a failing-without-fix test, a lint rule, a
   type constraint, or a CI check. Pure docs do not count.
5. **Verify each fix before committing** (3 tiers): re-read the modified section; run
   `pnpm typecheck` (or the project-appropriate check) — only fail on NEW errors in files
   you touched, ignore pre-existing errors elsewhere; if no checker exists for the file
   type, the re-read suffices.
6. **If verification fails:** roll back with `git checkout -- <file>` for every file you
   touched for that fix, mark it "skipped: fix caused errors, rolled back", and move on.
   Never leave uncommitted changes.
7. **Commit each fix atomically** — one commit per bug/class, message format
   `fix: {id} {short description}`, body listing every file touched; class fixes end with
   `structural fix — applied to N call sites`. For logic-error findings (wrong condition,
   off-by-one, state handling), report `fixed: requires human verification` in the handover.
8. Merge to main, delete branch.

## Boundaries

- ONLY touch: {explicit file list — but include the full subsystem when applying structural fixes}
- Do NOT touch: {files owned by other tracks}

## Close handover (required)

Report (used by Phase 4 fixes.json output if applicable):

```
Track: {name}
Branch: {branch}
Merged: yes | no
Classes fixed:
  - class: {verbatim class name}
    instances_touched: {N}
    files: [list every file modified for this class]
    regression_guard: {file + rule/test name + one-line description}
Unresolved classes: {class name — one-line rationale} | none
Conflicts handed off: {file — description} | none
```
```

**Critical prompt-writing rules:**

- The subagent has **no context** from this conversation. Include file paths, line numbers,
  field names, and enough background to act independently.
- Spell out what the correct fix looks like. "Fix the resolver" is bad.
  "Change `published_at` to `publishedAt` in the GraphQL field selection at line 14" is good.
- Include the **Boundaries** section so tracks don't step on each other's files.
- If there's a pattern to follow (e.g., "see how article.ts does locale fallback and replicate
  that in home.ts"), say so and give the file path.

## Phase 3: Merge and Clean Up

### 3.1 — After each wave completes

Subagents using `isolation: "worktree"` sometimes merge to their worktree's tracking branch
instead of actual `main`. This is expected. The orchestrator must:

1. **Check main**: `git log --oneline -N main` to see which merges landed
2. **Find stragglers**: `git worktree list` to find remaining agent worktrees, then
   `git log main..<branch> --oneline` to see unmerged commits
3. **Clean main's working tree**: if dirty files exist on main (from worktree cross-talk),
   `git checkout -- <files>` to restore clean state before merging
4. **Merge each straggler**: `git merge <branch> --no-edit -m "Merge {branch}: {summary}"`
5. **Resolve conflicts**: if a merge conflicts, read both sides, pick the correct resolution
   using your knowledge of what each track was supposed to do
6. **Clean up worktrees**: for each agent worktree:
   ```
   git worktree unlock .claude/worktrees/<id> 2>/dev/null
   git worktree remove .claude/worktrees/<id> --force 2>/dev/null
   ```
7. **Delete branches**: `git branch -d <branch>` (or `-D` if needed)
8. **Verify**: `git worktree list | grep -c agent` should return 0

### 3.2 — Between waves

After Wave N is fully merged and cleaned up:
- Verify main has all expected commits
- Dispatch Wave N+1

### 3.3 — After final wave

Report to the user:
- Total tracks dispatched, total bugs fixed
- Any merge conflicts resolved and how
- Any bugs that couldn't be fixed (with explanation)
- Keep it brief — a few lines, not a formatted report

In Mode 2, also proceed to Phase 4 before reporting.

## Phase 4: Emit fixes.json (Mode 2 only)

Only runs when bugfix-wave was invoked with a `findings.json` input. Skip in Mode 1.

### 4.1 — Aggregate classes

Walk every track's close handover. Collect:
- `classes_fixed`: every entry across all tracks. One JSON object per class with:
  - `class` (verbatim from findings.json)
  - `instances_touched` (sum across tracks if a class spanned tracks)
  - `files` (deduplicated union of modified files for this class)
  - `regression_guard` (verbatim from the responsible track; if multiple guards combine, list them)
- `unresolved`: every class any track marked unresolved, with the one-line rationale.

### 4.2 — Validate against the contract

Every entry in `classes_fixed` must satisfy:
- `instances_touched >= 1`
- `files` non-empty
- `regression_guard` non-empty and is a mechanical guard (test / lint rule / type constraint /
  CI check) — not pure documentation.

If any entry fails validation, the orchestrator must dispatch a fixer to add the missing
guard or move the class to `unresolved` with an explicit rationale before writing the JSON.

### 4.3 — Write the file

The caller specifies the output path (or asks you to derive it from the input findings.json
path). Write JSON matching the schema referenced by the caller (typically
`docs/dev-kit/SCHEMAS.md` — the `fixes.json` shape).

### 4.4 — Compute next_action

- If `unresolved` is empty: `"dispatch gate-codex-round (round <K+1>)"` (or caller-specified
  follow-up).
- Else: `"escalate <count> unresolved classes"`.

### 4.5 — Return to caller

Reply with the path to `fixes.json` and the JSON contents only. Do **not** paste track
handovers, diffs, or commit logs into your reply — they live in commit history and
`fixes.md` (if the caller also requested a prose companion).

## Edge Cases

**Subagent reports typecheck failure due to missing node_modules in worktree**: This is expected.
Worktrees don't share `node_modules`. If the subagent's code changes are logically correct and
the error is just missing dependencies, accept the merge. The real typecheck runs in the main
worktree.

**Subagent can't delete its branch because worktree is checked out**: Expected. The orchestrator
handles branch deletion after removing the worktree.

**Bug turns out to be a non-issue or unfixable**: The subagent should report this in its handover
rather than making a wrong fix. The orchestrator relays this to the user.

**Circular dependency between bugs**: Put them in the same track. If they're in different
subsystems, pick the one with fewer file touches to go first.
