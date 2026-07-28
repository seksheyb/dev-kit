---
description: Manual path — merge the PR with the docs in it, then verify production health by hand.
gate: verdict
on: "ship:pr was taken at step 13, or land handed off"
---
Merge the PR now, with the docs in it. First confirm CI is green on the current head and that
nothing has been pushed since content-qa and doc-verifier ran; if something has, re-run those two
first. Leave the worktree until step 15 is done. land-and-deploy does not run on this path — poll
the deploy and verify production health by hand; if it is unhealthy, tell me and revert.
