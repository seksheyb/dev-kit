#!/usr/bin/env bash
# Regression guard for the plumbing-bypass defect found while executing the
# roadmap shortlist (docs/audits/kickoff-duplication-audit/):
#
#   A bugfix-wave track whose `git push . HEAD:<source-branch>` is refused with
#   "branch is currently checked out" routes around the refusal with plumbing —
#   `git update-ref refs/heads/<source-branch> <sha>`. Plumbing does not run
#   porcelain's checked-out-branch check, so it SUCCEEDS. The commit lands on the
#   ref, the track honestly reports `Merged: yes`, and its own verification
#   (`git show <source-branch>:<path>`) passes. What breaks is the INDEX of the
#   working tree holding that branch: it still has the parent commit staged, so it
#   is staged to undo the commit that just landed. The next `git commit` there
#   reverts the work with no conflict and no warning.
#
#   Two tracks did this in one run. The skill said "do not try to work around it"
#   but never named the workaround, and its orchestrator-side repair prescribed
#   `git checkout -- <files>`, which fixes the working tree and leaves the index
#   — the half that actually matters — untouched.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) —
# this script is NOT wired into any pipeline. Run it by hand after editing the
# skill below, before merging, to catch a regression back into the bug.
#
# Usage: bash scripts/checks/worktree-merge-safety-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

BW="${BW_FILE:-plugins/dev-kit-core/skills/bugfix-wave/SKILL.md}"

if [ ! -f "$BW" ]; then
  echo "FAIL: $BW not found"
  exit 1
fi

echo "== Check 1: the subagent merge protocol names update-ref as forbidden =="
# "Do not work around it" is not enough — a model reaching for update-ref does not
# necessarily classify plumbing as "a workaround". The prohibition must name it.
if grep -q "update-ref" "$BW"; then
  if grep -qiE "never route around|forbidden|may use|only merge routes" "$BW"; then
    echo "PASS: update-ref is named and explicitly prohibited"
  else
    echo "FAIL: $BW mentions update-ref but never prohibits it"
    fail=1
  fi
else
  echo "FAIL: $BW never names 'update-ref' — the specific bypass two tracks reached for"
  fail=1
fi

echo
echo "== Check 2: the prohibition explains that the bypass SUCCEEDS =="
# The reason this trap works is that plumbing reports success. A prohibition that
# reads as "it won't work" invites a retry; it must say "it works, and that is the problem".
if grep -qiE "succeed|succeeds" "$BW" && grep -qiE "does not run porcelain|safety check|checked-out-branch check" "$BW"; then
  echo "PASS: the skill explains that plumbing succeeds by skipping porcelain's check"
else
  echo "FAIL: $BW does not explain that the bypass succeeds — without that, the ban reads as"
  echo "      'it will fail anyway' and a track will try it"
  fail=1
fi

echo
echo "== Check 3: the orchestrator repair uses restore --staged, not just checkout -- =="
# `git checkout -- <files>` only touches the working tree. The poisoned half is the index.
if grep -q -- "restore --staged" "$BW"; then
  echo "PASS: the skill prescribes 'git restore --staged --worktree' for the index repair"
else
  echo "FAIL: $BW never prescribes 'git restore --staged' — 'git checkout -- <files>' alone"
  echo "      leaves the staged revert in place, which is the half that loses work"
  fail=1
fi

echo
echo "== Check 4: the staged-vs-unstaged column distinction is documented =="
# Telling the two apart is the whole diagnosis: ' M' (unstaged cross-talk) vs 'A '/'D ' (poisoned index).
if grep -qiE "first column|letter in the \*first\*|letter first|space first" "$BW"; then
  echo "PASS: the skill documents how to tell a poisoned index from ordinary cross-talk"
else
  echo "FAIL: $BW does not explain how to distinguish staged reverts from unstaged dirt;"
  echo "      without it the orchestrator cannot tell the benign case from the lossy one"
  fail=1
fi

echo
echo "== Check 5: a track that self-merged after a rejection is not trusted on its word =="
if grep -qiE "before believing any .?Merged: yes|status --porcelain on the source branch" "$BW"; then
  echo "PASS: the skill tells the orchestrator to verify a post-rejection 'Merged: yes'"
else
  echo "FAIL: $BW does not tell the orchestrator to re-check a 'Merged: yes' that followed a"
  echo "      rejection — the track's own verification cannot detect this failure"
  fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "At least one check FAILED."
fi
exit "$fail"
