---
name: document-release
description: >
  Post-ship documentation sync. Runs after code is committed (PR exists or about to exist)
  but before it merges. Reads every project doc, cross-references the branch diff, builds a
  Diataxis coverage map (reference/how-to/tutorial/explanation), updates
  README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped, detects architecture
  diagram drift, polishes CHANGELOG voice with a sell-test rubric, cleans up TODOS, and
  optionally bumps VERSION. Use when asked to "update the docs", "sync documentation", or
  "post-ship docs". Proactively suggest after a PR is merged or code is shipped.
---

# Document Release: Post-Ship Documentation Update

You are running the document-release workflow. It runs **after code ships** (committed, PR
exists or about to exist) but **before the PR merges**. Your job: ensure every documentation
file in the project is accurate, up to date, and written in a friendly, user-forward voice.

You are mostly automated. Make obvious factual updates directly. Stop and ask only for risky
or subjective decisions.

**Only stop to ask for:**
- Risky/questionable doc changes (narrative, philosophy, security, removals, large rewrites)
- VERSION bump decision (if not already bumped)
- New TODOS items to add
- Cross-doc contradictions that are narrative (not factual)

**Never stop for:**
- Factual corrections clearly warranted by the diff
- Adding items to tables/lists
- Updating paths, counts, version numbers
- Fixing stale cross-references
- CHANGELOG voice polish (minor wording adjustments)
- Marking TODOS complete
- Cross-doc factual inconsistencies (e.g., version number mismatch)

**NEVER do:**
- Overwrite, replace, or regenerate CHANGELOG entries — polish wording only, preserve all content
- Bump VERSION without asking — always confirm version changes with the user
- Use whole-file overwrite on CHANGELOG.md — always make exact targeted edits

---

## Step 0: Detect platform and base branch

Detect the git hosting platform from the remote URL:

```bash
git remote get-url origin 2>/dev/null
```

- URL contains "github.com" → **GitHub**
- URL contains "gitlab" → **GitLab**
- Otherwise check CLI availability: `gh auth status` succeeds → GitHub; `glab auth status`
  succeeds → GitLab; neither → **unknown** (use git-native commands only)

Determine which branch this PR/MR targets, or the repo's default branch if no PR/MR exists.
Use the result as "the base branch" in all subsequent steps.

**GitHub:** `gh pr view --json baseRefName -q .baseRefName`, else
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`.
**GitLab:** `glab mr view -F json` → `target_branch`, else `glab repo view -F json` → `default_branch`.
**Git-native fallback:** `git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'`,
else try `origin/main`, then `origin/master`, else fall back to `main`.

Print the detected base branch and substitute it wherever the steps below say `<base>`.

---

## Step 1: Pre-flight & Diff Analysis

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch.
   Run from a feature branch."

2. Gather what changed:

```bash
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
git diff <base>...HEAD --name-only
```

3. Discover all documentation files:

```bash
find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" | sort
```

4. Classify changes into documentation-relevant categories:
   - **New features** — new files, commands, skills, capabilities
   - **Changed behavior** — modified services, updated APIs, config changes
   - **Removed functionality** — deleted files, removed commands
   - **Infrastructure** — build system, test infrastructure, CI

5. Output a brief summary: "Analyzing N files changed across M commits. Found K documentation
   files to review."

---

## Step 1.5: Coverage Map (Blast-Radius Analysis)

Before touching any doc file, build a **coverage map** of what shipped vs what's documented,
using the Diataxis framework (tutorial / how-to / reference / explanation) as an audit lens,
not a generation tool.

1. **Extract public surface changes from the diff.** Scan for:
   - New exported functions, classes, commands, CLI flags, config options, API endpoints
   - New skills, workflows, or user-facing capabilities
   - Renamed or removed public surface (modules, commands, features)
   - New environment variables, feature flags, configuration knobs

2. **For each new/changed public surface item, assess documentation coverage:**

```
Coverage map:
  [entity]         [reference?] [how-to?] [tutorial?] [explanation?]
  /new-skill       yes README   no        no          no
  --new-flag       yes README   yes       no          no
  FooProcessor     no           no        no          no
```

Definitions:
- **Reference** — factual description of what it is, its API, its options (README tables, API docs)
- **How-to** — task-oriented: "how to do X with this" (README examples, CONTRIBUTING workflows)
- **Tutorial** — learning-oriented: step-by-step walkthrough for newcomers (getting-started guides)
- **Explanation** — understanding-oriented: "why this works this way" (ARCHITECTURE rationale)

3. **Output the coverage map.** Items with zero coverage are **critical gaps** — flag them for
   Step 3. Items with reference-only coverage are **common gaps** — note them for the PR body.

4. **Architecture diagram drift detection.** If ARCHITECTURE.md (or any doc) contains ASCII
   diagrams or Mermaid blocks, extract entity names (modules, services, data flows) from the
   diagrams and cross-reference against the diff. Flag any diagram entities that were renamed,
   split, removed, or moved in the code.

The coverage map informs Steps 2-3 (what to audit and fix) and Step 9 (documentation debt in
the PR body). Do NOT auto-generate missing documentation pages — flag gaps only.

---

## Step 2: Per-File Documentation Audit

Read each documentation file and cross-reference it against the diff. Generic heuristics
(adapt to whatever project you're in):

**README.md:**
- Does it describe all features and capabilities visible in the diff?
- Are install/setup instructions consistent with the changes?
- Are examples, demos, and usage descriptions still valid?
- Are troubleshooting steps still accurate?

**ARCHITECTURE.md:**
- Do diagrams and component descriptions match the current code?
- Are design decisions and "why" explanations still accurate?
- Be conservative — only update things clearly contradicted by the diff.

**CONTRIBUTING.md — new-contributor smoke test:**
- Walk through the setup instructions as if you were a brand-new contributor.
- Are the listed commands accurate? Would each step succeed?
- Do test tier descriptions match the current test infrastructure?
- Flag anything that would fail or confuse a first-time contributor.

**CLAUDE.md / project instructions:**
- Does the project structure section match the actual file tree?
- Are listed commands and scripts accurate?
- Do build/test instructions match what's in package.json (or equivalent)?

**Any other .md files:**
- Read the file, determine its purpose and audience, and check whether the diff contradicts it.

Classify each needed update as:
- **Auto-update** — factual corrections clearly warranted by the diff: adding a table item,
  updating a file path, fixing a count, updating a structure tree.
- **Ask user** — narrative changes, section removal, security model changes, large rewrites
  (more than ~10 lines in one section), ambiguous relevance, entirely new sections.

---

## Step 3: Apply Auto-Updates

Make all clear factual updates directly with targeted edits.

For each file modified, output a one-line summary describing **what specifically changed** —
not "Updated README.md" but "README.md: added /new-skill to skills table, updated skill count
from 9 to 10."

**Never auto-update:**
- README introduction or project positioning
- ARCHITECTURE philosophy or design rationale
- Security model descriptions
- Never remove entire sections from any document

---

## Step 4: Ask About Risky/Questionable Changes

For each risky update identified in Step 2, ask the user with:
- Context: which doc file, what's being reviewed
- The specific documentation decision
- A clear recommendation with a one-line reason
- An explicit "Skip — leave as-is" option

Apply approved changes immediately after each answer.

---

## Step 5: CHANGELOG Voice Polish

**CRITICAL — NEVER CLOBBER CHANGELOG ENTRIES.** This step polishes voice. It does NOT
rewrite, replace, or regenerate content.

Rules:
1. Read the entire CHANGELOG.md first. Understand what is already there.
2. Only modify wording within existing entries. Never delete, reorder, or replace entries.
3. Never regenerate an entry from scratch — it was written from the actual diff and commit
   history; it is the source of truth. You are polishing prose, not rewriting history.
4. If an entry looks wrong or incomplete, ask the user — do NOT silently fix it.
5. Make exact targeted edits only — never overwrite the whole file.

If CHANGELOG was not modified in this branch: skip this step.

If it was, review the entry for voice:
- **Sell test (Diataxis rubric):** score each entry 0-3:
  - 1 point — answers "What changed?" (reference: names the feature/fix)
  - 1 point — answers "Why should I care?" (explanation: user impact, pain removed)
  - 1 point — answers "How do I use it?" (how-to: command, flag, or docs link)
  - Entries scoring <2 need a rewrite. Entries scoring 3 are gold.
- Lead with what the user can now **do** — "You can now..." not "Refactored the..."
- Flag and rewrite any entry that reads like a commit message.
- Internal/contributor changes belong in a separate "For contributors" subsection.
- Auto-fix minor voice adjustments; ask the user if a rewrite would alter meaning.

---

## Step 6: Cross-Doc Consistency & Discoverability Check

1. Does the README's feature list match what CLAUDE.md (or project instructions) describes?
2. Does ARCHITECTURE's component list match CONTRIBUTING's project structure description?
3. Does CHANGELOG's latest version match the VERSION file?
4. **Discoverability:** Is every documentation file reachable from README.md or CLAUDE.md?
   If ARCHITECTURE.md exists but neither entry-point file links to it, flag it.
5. Flag contradictions between documents. Auto-fix clear factual inconsistencies (e.g., a
   version mismatch); ask the user about narrative contradictions.

---

## Step 7: TODOS Cleanup

If TODOS.md (or equivalent) does not exist, skip.

1. **Completed items not yet marked:** cross-reference the diff against open TODO items. If a
   TODO is clearly completed by this branch, move it to the Completed section with the version
   and date. Be conservative — only with clear evidence in the diff.
2. **Stale descriptions:** if a TODO references files or components significantly changed,
   ask whether to update, complete, or leave it.
3. **New deferred work:** check the diff for `TODO`, `FIXME`, `HACK`, `XXX` comments. For each
   that represents meaningful deferred work, ask whether it should be captured in TODOS.md.

---

## Step 8: VERSION Bump Question

**CRITICAL — NEVER BUMP VERSION WITHOUT ASKING.**

1. If VERSION does not exist: skip silently.
2. Check whether VERSION was already modified on this branch: `git diff <base>...HEAD -- VERSION`
3. **If not bumped:** ask the user (recommend Skip for docs-only changes):
   - A) Bump PATCH — if doc changes ship alongside code changes
   - B) Bump MINOR — if this is a significant standalone release
   - C) Skip — no version bump needed
4. **If already bumped:** do NOT skip silently. Check whether the bump covers the full scope
   of the branch: read the CHANGELOG entry for the current version, compare against the full
   diff. If significant changes are NOT covered by the entry, ask whether to bump again, fold
   the new changes into the existing entry, or leave as-is. Key insight: a VERSION bump set
   for "feature A" should not silently absorb "feature B" if B deserves its own entry.

---

## Step 9: Commit & Output

**Empty check first:** run `git status`. If no documentation files were modified, output
"All documentation is up to date." and exit without committing.

**Commit:**
1. Stage modified documentation files by name (never `git add -A` or `git add .`).
2. Create a single commit: `docs: update project documentation for vX.Y.Z`
3. Push to the current branch.

**PR/MR body update (idempotent):**
1. Read the existing PR/MR body (`gh pr view --json body -q .body` or
   `glab mr view -F json`) into a temp file.
2. If it already contains a `## Documentation` section, replace that section; otherwise
   append one at the end.
3. The Documentation section should include:
   - **Doc diff preview** — per modified file, what specifically changed.
   - **Documentation debt** — if the coverage map found gaps, a subsection listing:
     critical gaps (new public surface with zero coverage), common gaps (reference-only
     coverage), and stale diagrams (entity names that drifted from the code). Each item gets
     a one-line description of what's missing and which Diataxis quadrant would fill it.
4. Before writing the body back, scan it for secrets/credentials/PII — do not push a body
   containing anything sensitive.
5. Write it back with `gh pr edit --body-file` or `glab mr update -d`. If no PR/MR exists,
   skip with a message. If the edit fails, warn and continue — the changes are in the commit.

**Structured doc health summary (final output):**

```
Documentation health:
  README.md       [status] ([details])
  ARCHITECTURE.md [status] ([details])
  CONTRIBUTING.md [status] ([details])
  CHANGELOG.md    [status] ([details])
  TODOS.md        [status] ([details])
  VERSION         [status] ([details])
```

Status is one of: Updated / Current / Voice polished / Not bumped / Already bumped / Skipped.

If the coverage map identified gaps, append the coverage table and any diagram drift notes.
If all coverage is complete and no diagrams drifted: "Coverage: all shipped features have
adequate documentation."

---

## Important Rules

- **Read before editing.** Always read the full content of a file before modifying it.
- **Never clobber CHANGELOG.** Polish wording only. Never delete, replace, or regenerate entries.
- **Never bump VERSION silently.** Always ask — even if already bumped, check scope coverage.
- **Be explicit about what changed.** Every edit gets a one-line summary.
- **Generic heuristics, not project-specific.** The audit checks work on any repo.
- **Discoverability matters.** Every doc file should be reachable from README or CLAUDE.md.
- **Coverage map informs, never generates.** It flags gaps for the PR body and future work; it
  does not auto-generate missing pages or sections.
- **Diagram drift is advisory.** Flag stale diagrams in the PR body but do not auto-edit ASCII
  art or Mermaid blocks — they require human judgment.
- **Voice: friendly, user-forward, not obscure.** Write like you're explaining to a smart
  person who hasn't seen the code.
