---
description: Manual path — open the PR with finishing-a-development-branch. Do not merge.
gate: operator
asks: "Manual or automated ship path? This is manual."
exclusive-with: ship:auto
---
**Now open the PR. Pick one path** — manual:

Use the finishing-a-development-branch skill for this milestone. Take option 2, "Push and create a
Pull Request" — not option 1, merge: step 14's document-release needs the diff still open, and it
aborts outright if run from the base branch. Keep the worktree; step 14 still commits docs from it.

→ next: `/dk:docs:generate`
