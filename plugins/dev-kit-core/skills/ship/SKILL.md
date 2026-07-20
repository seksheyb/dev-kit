---
name: ship
description: Fully automated ship workflow — merge base, run tests with failure triage, audit test coverage and plan completion, review the diff, bump version, write the CHANGELOG, split bisectable commits, push, and create/update the PR. Non-interactive by default; the user says /ship and the next thing they see is the PR URL. Use when asked to "ship", "ship it", "create a PR", or "prepare this branch for merge".
---

# /ship — Fully Automated Ship Workflow

This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step. The user said `/ship` which means DO IT. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- In-branch test failures (pre-existing failures are triaged, not auto-blocking)
- Review findings that need user judgment
- MINOR or MAJOR version bump needed (ask)
- Coverage below the minimum threshold (hard gate with user override)
- Plan items NOT DONE with no user override

**Never stop for:**
- Uncommitted changes (always include them)
- MICRO/PATCH version bump choice (auto-pick)
- CHANGELOG content (auto-generate from diff)
- Commit message approval (auto-commit)
- Multi-file changesets (auto-split into bisectable commits)
- Auto-fixable review findings (dead code, stale comments — fix them)

**Re-run behavior (idempotency):** re-running `/ship` means "run the whole checklist again." Every verification step runs on every invocation. Only *actions* are idempotent: skip the version bump if already bumped, skip the push if already pushed, update the PR body instead of creating a duplicate PR. Never skip a verification step because a prior run performed it.

## Step 0: Detect platform and base branch

Detect the git hosting platform from `git remote get-url origin`:
- URL contains "github.com" → **GitHub**; contains "gitlab" → **GitLab**
- Otherwise: `gh auth status` succeeds → GitHub (covers Enterprise); `glab auth status` succeeds → GitLab; neither → unknown (git-native commands only)

Determine the base branch (the branch the PR targets, or the repo default):
- **GitHub:** `gh pr view --json baseRefName -q .baseRefName`, else `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`
- **GitLab:** `glab mr view -F json` → `target_branch`, else `glab repo view -F json` → `default_branch`
- **Git-native fallback:** `git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'`; else check `origin/main`, then `origin/master`; else `main`.

Print the detected base branch. Substitute it wherever the steps below say `<base>`.

## Step 1: Pre-flight

1. If on the base branch or the repo default branch, **abort**: "You're on the base branch. Ship from a feature branch."
2. `git status` — uncommitted changes are always included, no need to ask.
3. `git diff <base>...HEAD --stat` and `git log <base>..HEAD --oneline` to understand what's being shipped.
4. If the diff is >200 lines, note that an architecture-level review before shipping is recommended — but do not block. Ship runs its own diff review in Step 6.

## Step 2: Merge the base branch (BEFORE tests)

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

Auto-resolve simple conflicts (VERSION, lockfiles, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them. If already up to date, continue silently.

## Step 3: Run tests (on merged code)

Detect the test command: read CLAUDE.md's Testing section first; otherwise detect from the project (package.json scripts, Makefile, pytest/cargo/go conventions). If the project has no test framework, offer to bootstrap one (pick the ecosystem standard — vitest/jest for Node, pytest for Python, minitest/rspec for Ruby, stdlib for Go/Rust — install, configure, write 3-5 real tests for recently-changed high-risk code, add a CI workflow) or record the user's decline and continue without tests.

Run the full suite. **If any test fails, do NOT immediately stop — triage ownership first:**

1. **Classify each failure:** get the branch's changed files (`git diff <base>...HEAD --name-only`). A failure is **in-branch** if the failing test file or the code it tests was modified on this branch, or the failure traces to a branch change. Otherwise it's **likely pre-existing**. When ambiguous, default to in-branch — it's safer to stop the developer than to ship a broken test.
2. **In-branch failures: STOP.** These are your failures. Fix before shipping.
3. **Pre-existing failures:** ask the user — A) investigate and fix now (commit the fix separately: `fix: pre-existing test failure in <file>`), B) add as a P0 item to TODOS.md and continue, C) create an issue assigned to whoever last touched the production code under test (`git log --format="%an" -1 -- <source-file>`), or D) skip and note it in the output.
4. After triage: any unfixed in-branch failure → **STOP**. All pre-existing failures handled → continue.

If the diff touches prompt/LLM files and the project has an eval suite, run the affected evals too — a failing eval blocks the same way a failing test does.

## Step 4: Test Coverage Audit

Dispatch as a subagent if available (fresh context; the parent only needs the conclusion). 100% coverage is the goal — evaluate what was ACTUALLY coded (the diff), not what was planned.

1. **Trace every changed codepath.** Read each changed file in full. Follow the data: where does input come from, what transforms it, where does it go, what can go wrong (null, invalid input, network failure, empty collection)? Map every conditional branch, error path, and call into helpers with their own branches.
2. **Map user flows and error states.** Double-click/rapid resubmit, navigate-away mid-operation, stale data, slow connection, concurrent tabs; for every handled error, what does the user actually see, and can they recover? Empty/zero/boundary states.
3. **Check each branch against existing tests.** Both true AND false paths of each conditional; a test that triggers each specific error; integration/E2E for flows spanning 3+ components and for auth/payment/data-destruction paths. Quality scale: ★★★ behavior + edge + error, ★★ happy path, ★ smoke check.
4. **REGRESSION RULE (mandatory):** if the diff modifies existing behavior and no test covers the changed path, write the regression test immediately — no asking, no skipping. Commit as `test: regression test for {what broke}`.
5. **Output an ASCII coverage diagram** (code paths + user flows, TESTED/GAP per branch, overall percentage). All paths covered → "All new code paths have test coverage ✓" and continue.
6. **Generate tests for uncovered paths.** Error handlers and edge cases first. Match the project's test conventions (read 2-3 existing tests). Run each generated test: passes → commit as `test: coverage for {feature}`; fails → fix once; still fails → revert and note the gap. Caps: ~30 paths analyzed, ~20 tests generated.
7. **Coverage gate:** use CLAUDE.md's `## Test Coverage` Minimum/Target if present, else Minimum 60% / Target 80%. At or above target → pass. Between → ask: generate more tests (recommended) / ship anyway / mark paths intentionally uncovered. Below minimum → ask: generate more (max 2 passes) / explicit override. Test-only diffs or undeterminable percentage → skip the gate.

## Step 5: Plan Completion Audit

If a plan file exists for this work (active plan in conversation context, or a recent plan file mentioning this branch/repo), audit it. No plan file → skip with "No plan file detected."

1. **Extract actionable items** (checkboxes, numbered implementation steps, imperative statements, file-level specs, test requirements, data-model changes). Ignore context/background sections, open questions, and explicitly deferred items ("Future:", "Out of scope:"). Cap at 50.
2. **Classify verifiability:** DIFF-VERIFIABLE (would show in `git diff <base>...HEAD`), CROSS-REPO (check file existence on disk if the sibling repo is reachable), EXTERNAL-STATE (DNS, SaaS config — cannot be proven from the diff).
3. **Classify each item:** DONE (clear evidence, cite files), PARTIAL, NOT DONE, CHANGED (same goal via different approach — note the difference), UNVERIFIABLE (cite the specific manual check the user must perform).
4. **Honesty rules:** be conservative with DONE — code that *handles* a deliverable is not the deliverable. Be generous with CHANGED. Prefer UNVERIFIABLE over silently assuming DONE.
5. Items NOT DONE → **STOP** and ask: finish now, defer explicitly (list them in the PR body), or drop. Include the completion checklist in the PR body.

## Step 6: Pre-landing review

Review the full diff before shipping (dispatch as a subagent if available):
- Correctness: logic errors, off-by-one, unhandled null/error paths, race conditions
- Security: injection, secrets in the diff, authz gaps on new endpoints
- Performance: N+1 queries, unbounded loops, missing indexes for new query patterns
- Hygiene: dead code, debug leftovers, stale comments, unused imports

Auto-fix mechanical findings (dead code, stale comments, imports) and commit them. For findings that need judgment (behavior changes, security trade-offs), **STOP** and ask. Optionally run an adversarial second pass — "try to break this diff" — with a fresh subagent for large or risky changes.

## Step 7: Version bump (auto-decide)

If the project keeps a VERSION file and/or a version field in its manifest (package.json etc.):

1. **Classify state:** compare the branch's VERSION against `<base>`'s (`git show origin/<base>:VERSION`). Already bumped → skip the bump but verify VERSION and manifest agree; a mismatch means a manual edit — reconcile before continuing.
2. **Decide the bump level from the diff:** MICRO/PATCH — bug fixes, small additive changes (auto-pick). MINOR — new capability, migration, new module, or a large diff (**ASK**). MAJOR — breaking changes or milestones (**ASK**). The level communicates what kind of release this is; don't undersell a big diff as a PATCH.
3. **Write the bump** to VERSION and the manifest together — never just one of them.

Projects with no version tracking: skip this step silently.

## Step 8: CHANGELOG (auto-generate)

1. Read the CHANGELOG header to learn the format.
2. **Enumerate every commit on the branch:** `git log <base>..HEAD --oneline`. This list is your checklist.
3. **Read the full diff** (`git diff <base>...HEAD`) to see what each commit actually changed.
4. **Group commits by theme** (features, performance, fixes, cleanup, infrastructure, refactoring) before writing.
5. **Write one unified entry** for the new version, dated today. If earlier branch-internal entries exist that never landed on the base branch, collapse them into this one — readers see one release, not a branch diary. Sections: `### Added` / `### Changed` / `### Fixed` / `### Removed`.
6. **Voice:** lead with what the user can now DO that they couldn't before. Plain language, not implementation details. Never mention internal tracking, branch history, or mid-branch fixes — the entry is the diff between base and this branch, not how the branch got there.
7. **Cross-check:** every commit from step 2 must map to at least one bullet. Do NOT ask the user to describe changes — infer from the diff.

## Step 9: TODOS.md (auto-update)

If the repo keeps a TODOS.md, cross-reference it against the diff and commit messages. Mark items complete only with clear evidence in the diff (be conservative), move them to a `## Completed` section with the version and date, and summarize (`N items marked complete, M remaining`). Missing or disorganized file → offer once to create/reorganize, otherwise skip. Never fail the ship over a TODOS write error.

## Step 10: Commit (bisectable chunks)

**Goal:** small, logical commits that work with `git bisect` and make the history readable.

1. Group changes into logical commits — one coherent change each, not one file each.
2. **Ordering:** infrastructure (migrations, config, routes) → models/services (+ their tests) → controllers/views/components (+ their tests) → VERSION + CHANGELOG + TODOS.md always in the final commit.
3. A unit and its test file go in the same commit. Migrations get their own commit or ride with the model they support. Diffs under ~50 lines across <4 files can be a single commit.
4. **Each commit must be independently valid** — no broken imports, no references to code that doesn't exist yet.
5. Messages: `<type>: <summary>` (feat/fix/chore/refactor/docs/test) plus a brief body. The final version-bump commit carries the version tag.

If the branch contains WIP checkpoint commits, squash them into their logical commits first — but NEVER `git reset --soft` past non-WIP commits (that destroys landed work); only reset-soft when the branch is verified to be all-WIP.

## Step 11: Verification Gate

**IRON LAW: no completion claims without fresh verification evidence.**

1. If ANY code changed after Step 3's test run (review fixes, generated tests), re-run the test suite and paste fresh output. Stale output is not acceptable.
2. If the project has a build step, run it.
3. Rationalization prevention: "should work now" → RUN IT. "I'm confident" → confidence is not evidence. "I tested earlier" → code changed since then. "It's trivial" → trivial changes break production.

Tests fail here → **STOP**, do not push. Fix and return to Step 3.

## Step 12: Push

Idempotency check: compare `git rev-parse HEAD` with `git rev-parse origin/<branch>` after a fetch. Already pushed → skip. Otherwise `git push -u origin <branch>`. Never force push.

Before pushing, eyeball the outgoing diff for credentials (API keys, tokens, private keys) — a leaked secret in a pushed commit is an incident, not a cleanup. (Requires wiring for automated scanning: gitleaks or a pre-push hook.)

**You are NOT done** — PR creation is a mandatory final step.

## Step 13: Create or update the PR/MR

Check for an existing open PR/MR (`gh pr view` / `glab mr view`). If one exists, **update** its body — always regenerated from this run's fresh results, never reused stale content. If none exists, create it (`gh pr create --base <base>` / `glab mr create -b <base>`).

**Title format:** `v<VERSION> <type>: <summary>` when the project tracks a version (version first, always), else `<type>: <summary>`.

**Body sections:**

```
## Summary
<group every substantive commit into logical sections; enumerate git log <base>..HEAD
 and check every commit is represented — the version-bump commit excepted>

## Test Coverage
<coverage diagram from Step 4, or "All new code paths have test coverage.">
<Tests: {before} → {after} (+{delta} new)>

## Pre-Landing Review
<findings from Step 6, or "No issues found.">

## Plan Completion
<checklist summary from Step 5, deferred items listed; or "No plan file detected.">

## TODOS
<completed items with version, or omit>

## Test plan
- [x] <suite>: N passed, 0 failed
```

If neither `gh` nor `glab` is available: print the branch name and remote URL and tell the user to open the PR via the web UI — the code is pushed and ready.

**Output the PR/MR URL.**

## Important Rules

- **Never skip tests.** If tests fail (in-branch), stop.
- **Never force push.**
- **Never ask for trivial confirmations** ("ready to push?", "create PR?"). DO stop for MINOR/MAJOR bumps and review findings that need judgment.
- **Split commits for bisectability** — each commit = one logical change.
- **TODOS completion detection must be conservative.**
- **Never push without fresh verification evidence.**
- **Generated coverage tests must pass before committing.** Never commit failing tests.
- **The goal:** the user says `/ship`, the next thing they see is the review summary + PR URL.
