---
name: bugfix-wave
description: >
  Parallel bug-fix executor. Takes a list of bugs/findings (from code review, adversarial audit,
  security scan, lint report, etc.), classifies each by model and effort, groups them into
  independent tracks with no file conflicts, organizes tracks into dependency-ordered waves,
  then dispatches every wave through a single Workflow run — one subagent per track, each
  working in its own git worktree and branch, merging itself back into the source branch when
  done. The orchestrator reconciles whatever failed to merge, cleans up worktrees and
  branches, and emits the summary. Runs whole rounds unattended, so it composes with an
  adversarial review loop inside one workflow.

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

**No bug list yet, just a couple of independent tasks?** This skill's classify/track/wave/worktree
ceremony is overkill for that — use `dispatching-parallel-agents` instead for lightweight,
no-ceremony parallel dispatch.

## Branch model (read before Phase 2)

Bugfix-wave is **self-merging and multi-wave**: all waves run in one Workflow, and each track
lands its own work. That is what lets a whole fix round run unattended inside a larger
workflow alongside adversarial review.

This deliberately **differs from `sprint-execution`**, which is orchestrator-merged and
one-wave-per-run. Do not port one skill's branch model onto the other; the rationale for the
split: bugfix-wave writes no state
file, roadmap or ledger — its only durable artifact, `fixes.json`, is emitted after the final
wave anyway — so it has nothing per-wave to defer to an orchestrator turn.

- **Source branch** — the branch the round starts from. Always named explicitly in the
  Workflow args. **Never hardcoded to `main`**; if the round runs on a working branch, that
  branch is the source and the merge target.
- Every track gets **its own worktree and its own branch cut from the source branch**.
- A track **commits, merges itself into the source branch, and returns.** It does not delete
  its branch (it cannot — the branch is checked out in its own worktree).
- Wave N+1's tracks open with `git reset --hard <source-branch>`, so they inherit wave N's
  merged fixes. This is what makes all-waves-in-one-run correct rather than merely faster.
- **The orchestrator reconciles**, after the run: merge whatever failed to land, remove
  worktrees, delete branches (Phase 3).

### The two git preconditions

Self-merge works, but only under conditions the old version of this skill did not meet — which
is why it used to half-fail and need a straggler pass. Both are verified:

1. **The orchestrator must not hold the source branch checked out.** Git allows one checkout
   per branch, so a track pushing into a checked-out branch is rejected with
   `! [remote rejected] (branch is currently checked out)`. That is git declining, not agent
   flakiness. Phase 2 has the orchestrator `git checkout --detach` before dispatching, which
   frees the ref.
2. **Concurrent tracks race on the ref.** The first push fast-forwards; the second is rejected
   as non-fast-forward. The §2.3 merge protocol makes each track fetch, merge, and retry.

A track that loses every retry leaves its branch unmerged and says so. **That is an expected
outcome, not a failure** — Phase 3 exists to catch it.

## Input modes

Bugfix-wave accepts input in two modes. Detect which one you've been given before Phase 1.

### Mode 1 — Free-text bug list (default)

Caller pastes or describes findings inline. You parse them as in §1.1 below. Structural-fix mandate
in §1.5 is **recommended** (apply where the finding is a class of defect, not a one-off typo). No
machine-readable output is required at the end.

### Mode 2 — `findings.json` path (structured)

Caller provides a path to a `findings.json` file matching a published schema (e.g.
`docs/global/process/SCHEMAS.md` in caller-side projects). Read that file at the start of Phase 1.

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

**If the input already carries `complexity_signals` or a declared model/effort** (e.g. a
`findings.json` produced by `code-review-gate`, or signals copied from a plan per
`@references/complexity-signals.md`), those are authoritative — use them directly rather
than re-deriving from the bug description.

Otherwise, pick model and effort independently for each bug, then combine, using the
canonical axes below (same vocabulary as `@references/complexity-signals.md`):

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

### 2.2 — Dispatch the wave

The route is decided by track count. It is not a preference, and it is not a question for
the user:

| Tracks in the wave | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/bugfix-wave.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

Invoking bugfix-wave with a bug list **is** the request for parallel execution. Never ask
for a second confirmation before taking the Workflow route, and never offer the inline route
as an alternative when the wave has 2+ tracks.

**Free the source branch first.** Before dispatching, run `git checkout --detach` in the main
working tree. Tracks cannot push into a branch that is checked out, and this is the whole
reason the old version of this skill needed a straggler pass. Re-check-out the source branch
in Phase 3, after the run.

**Workflow route.** Phase 1 completes in your turn first — the script carries zero judgment.
You classify (§1.2), group (§1.3), wave-order (§1.4), and render each track's §2.3 prompt in
full, then hand **every wave** over in one call:

```
Workflow({
  scriptPath: "plugins/dev-kit-core/references/workflows/bugfix-wave.workflow.mjs",
  args: {
    context: "round 3 findings",
    sourceBranch: "main",          // required — branch tracks cut from AND merge back into
    waves: [
      { wave: 1, tracks: [
          { name: "track-schema", branch: "bugfix/w1-track-schema",
            model: "opus", effort: "high",
            prompt: "<the fully-rendered §2.3 prompt for this track>" },
          { name: "track-rls", branch: "bugfix/w1-track-rls",
            model: "sonnet", effort: "high", prompt: "..." }
      ]},
      { wave: 2, tracks: [ /* ... */ ]}
    ]
  }
})
```

- **All waves go in one run.** Tracks self-merge, so by the time wave N+1 runs its opening
  `git reset --hard <source-branch>`, wave N's fixes are already there. This is the property
  that makes multi-wave-in-one-run correct — and it is why this skill can sit inside a larger
  workflow next to an adversarial review loop without an orchestrator turn between rounds.
- One `waves[]` entry per wave in dependency order, one `tracks[]` entry per track.
  `sourceBranch`, `name`, `branch`, `model`, `effort` and `prompt` are required; `context`,
  `wave` and `agentType` are not.
- `prompt` is the §2.3 template rendered in full — base-sync opener, boundaries, merge
  protocol, close handover block. The script passes it through untouched and writes no prompt
  text of its own, so anything missing from your rendering is missing from the dispatch.
- The script sets `isolation: "worktree"` on every track agent, runs each wave in one
  `parallel()`, and does not start wave N+1 until every wave-N track has returned.
- It returns immediately with a runId, runs in the background, and notifies you on
  completion. The result is `{ sourceBranch, waves, handovers, dropped, unmerged, branches }`
  — `handovers` are the §2.3 close handovers as structured objects, `dropped` is every track
  that returned nothing, **`unmerged` is every track that returned but did not land**, and
  `branches` is every branch dispatched.

**The Workflow cannot clean up after itself.** It has no filesystem or git access. Reconciling
`unmerged`, worktree removal, branch deletion (Phase 3) and `fixes.json` (Phase 4) all run in
your turn after it returns. Run Phase 3 even when the workflow fails — and note you are still
on a detached HEAD until you re-check-out the source branch there.

**Inline route (1 track only).** A single `Agent` call with `isolation: "worktree"`, `model`
set to the track's model, and the same §2.3 prompt. Phase 3 still applies.

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

FIRST, before anything else, run `git reset --hard {source-branch}` in your worktree, then
`git checkout -b {branch}`. A fresh worktree branch has no commits of its own, so the reset
is non-destructive — it is there because the harness pins a worktree's base commit at process
launch, so without it you cannot see earlier waves' merged fixes.

Commit frequently with conventional commit messages.

## Merge protocol (run after your last commit, before you return)

You cannot `git checkout {source-branch}` — it may be checked out elsewhere, and git allows
one checkout per branch. Push into it from your worktree instead, and expect to race with
other tracks merging at the same time:

1. `git push . HEAD:{source-branch}`
2. **Success** → you are done. Report `Merged: yes`.
3. **Rejected, non-fast-forward** → another track landed while you worked. Run
   `git fetch . {source-branch}` then `git merge --no-edit FETCH_HEAD`, re-run your
   verification (their changes are now in your tree), and go back to step 1. Retry up to
   **5 times**.
4. **Rejected with "branch is currently checked out"** → stop immediately. Do not try to work
   around it. Report `Merged: no` with that exact reason; the orchestrator reconciles you.
5. **A conflict lands in a file you do NOT own** (see Boundaries) → `git merge --abort`,
   leave your branch unmerged, report `Merged: no` and list the file under "Conflicts handed
   off". Never resolve another track's file.

Do NOT delete your branch — you cannot (it is checked out in your worktree), and the
orchestrator needs it to reconcile. Leaving a branch unmerged with an honest reason is always
better than forcing a merge you are not sure about.

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
8. Run the merge protocol above, then return the close handover below.

## Boundaries

- ONLY touch: {explicit file list — but include the full subsystem when applying structural fixes}
- Do NOT touch: {files owned by other tracks}

## Close handover (required)

Report (used by Phase 4 fixes.json output if applicable):

```
Track: {name}
Branch: {branch}
Merged: yes | no
Merge note: {rejection text or abort cause — required when Merged is no, omit when yes}
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

Tracks merge themselves, so most work is already on the source branch when the Workflow
returns. This phase reconciles what did not land. It runs **once, after the whole run** — not
between waves.

### 3.1 — After the Workflow returns

You are still on a **detached HEAD** from Phase 2. Stay there until step 4.

1. **Reconcile `unmerged`.** Every entry returned but did not land — a lost retry race, a
   checked-out-branch rejection, or an aborted merge on someone else's file. For each:
   `git log <source-branch>..<branch> --oneline` to see what is missing, then merge it. If it
   conflicts, resolve centrally: you hold the bug list, the track partition and the
   cross-track context that no single track has. Two tracks making genuinely contradictory
   choices is a partition defect — surface it rather than picking a side.
2. **Check `dropped`.** A track that returned no handover is not a completed track, and a
   missing handover is never an empty one. Its branch may hold commits that are merged,
   partly merged, or not merged at all — per §1.6 every per-fix commit is self-contained, so
   inspect with `git log <source-branch>..<branch>` and merge what landed. Treat its
   remaining bugs as unfixed: re-dispatch or report them.
3. **Verify every branch is in.** For all of `branches`, `git log <source-branch>..<branch>
   --oneline` must come back **empty**. A track's `Merged:` field is a self-report; this
   check is the evidence. Do not clean up until it passes.
4. **Re-attach**: `git checkout <source-branch>`. If dirty files linger from worktree
   cross-talk, `git checkout -- <files>` first.
5. **Clean up worktrees**: for each agent worktree:
   ```
   git worktree unlock .claude/worktrees/<id> 2>/dev/null
   git worktree remove .claude/worktrees/<id> --force 2>/dev/null
   ```
6. **Delete branches**: `git branch -d <branch>` (`-D` only after step 3 passed).
7. **Confirm none remain**: `git worktree list | grep -c agent` should return 0.

### 3.2 — When an unmerged branch poisoned a later wave

Waves run back to back inside the run, so if a Wave-1 track failed to merge, any Wave-2 track
deferred **for a file conflict with it** built its fix on a stale version of that file. The
script logs this at the wave boundary. Check those tracks specifically after step 1: their
fixes may be correct but applied to the wrong base, and merging both can produce a silently
wrong result rather than a conflict. Re-dispatch rather than hand-patch when in doubt.

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
`docs/global/process/SCHEMAS.md` — the `fixes.json` shape).

### 4.4 — Compute next_action

- If `unresolved` is empty: `"dispatch code-review-gate in round mode (round <K+1>)"` (or
  caller-specified follow-up).
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

**Subagent reports `Merged: no` with "branch is currently checked out"**: you skipped the
`git checkout --detach` in Phase 2, so every track in that wave hit the same wall. Their work
is intact on their branches. Detach, reconcile all of them via Phase 3.1 step 1, and check
whether later waves built on the stale base (§3.2).

**Subagent can't delete its branch**: expected — it is checked out in the track's own
worktree. The orchestrator deletes it in Phase 3.1 step 6, after the worktree is removed.

**Bug turns out to be a non-issue or unfixable**: The subagent should report this in its handover
rather than making a wrong fix. The orchestrator relays this to the user.

**Circular dependency between bugs**: Put them in the same track. If they're in different
subsystems, pick the one with fewer file touches to go first.

**A track returns `null` (appears in the Workflow's `dropped`)**: The agent died, was
skipped, or its handover failed schema validation. It is not a clean track, and a missing
handover is never an empty one. Its branch may still hold real commits — per §1.6 every
per-fix commit is self-contained, so partial work is safe to inspect and merge. Check
`git log <source-branch>..<branch>`, then re-dispatch the track (Phase 3.1 step 0) before
merging the wave, and treat any bugs the re-dispatch doesn't cover as unfixed. Never let a
`dropped` track be counted as coverage.

**Workflow dies, is killed, or errors mid-wave**: Worktrees and branches from tracks that
already started survive it — the script never had the filesystem access to clean them up. Run
Phase 3 over whatever `git worktree list` and `git branch` actually show before deciding
anything else.

**Every track in a wave came back `Merged: no` with non-fast-forward rejections**: they
starved each other out of the retry loop. Reconcile them in Phase 3 and, if the same wave has
to run again, split it into two smaller waves — the ref is a serialization point, so a very
wide wave of tracks all finishing at once contends hard on it.

**Resuming a failed Workflow run**: `Workflow({ scriptPath, resumeFromRunId: "<runId>" })`.
The unchanged prefix of track dispatches returns cached, so completed tracks are not re-run —
this holds even if you edited the script in between. Fix the args or the script first if
either caused the failure; resuming the same broken input fails the same way. Do **not**
resume after you have already merged and deleted the first attempt's branches — the cached
handovers will point at branches that no longer exist. Re-dispatch instead.

**A wave with many tracks**: Concurrency is capped at `min(16, cores-2)` per workflow; extra
tracks queue and still complete. Never trim a wave to "fit". Whether concurrent worktree
creation can contend on git's own lock files at high fan-out is unverified here — if a wave
fails with a git lock error rather than a task error, re-dispatch the affected tracks as a
smaller wave.
