#!/usr/bin/env bash
# Regression guard for the dk hook layer (plugins/dk/hooks/).
#
# Hooks are the one part of dev-kit that runs on EVERY tool call in a user's
# session, unattended, with no model in the loop to notice when they misbehave.
# A hook that blocks, crashes, or chatters is a defect the operator experiences
# as "Claude Code is broken" — not as "a dev-kit asset is wrong". That asymmetry
# is why this layer gets a guard script and the markdown assets mostly don't.
#
# The five invariants asserted here are stated in plugins/dk/hooks/CONTRACTS.md;
# this script is the mechanical check that no hook has drifted from them. Checks
# 1-5 are static (grep the sources); check 6 executes every hook's own test.
#
# This repo has no CI and no test harness — this script is NOT wired into any
# pipeline. Run it by hand after adding or editing any hook, before merging.
#
# Usage: bash scripts/checks/hook-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

HOOKS_DIR="plugins/dk/hooks"
MANIFEST="$HOOKS_DIR/hooks.json"
fail=0

# Hook sources, excluding the shared libs and the tests.
hook_files() {
  find "$HOOKS_DIR" -maxdepth 1 -type f \( -name '*.sh' -o -name '*.js' \) | sort
}

echo "== Check 1: every hook referenced by the manifest exists =="
if [ ! -f "$MANIFEST" ]; then
  echo "FAIL: $MANIFEST is missing — the plugin declares no hooks at all"
  fail=1
else
  missing=0
  while read -r ref; do
    [ -n "$ref" ] || continue
    if [ ! -f "$HOOKS_DIR/$ref" ]; then
      echo "FAIL: manifest references $ref, which does not exist"
      missing=1; fail=1
    fi
  done < <(grep -oE 'hooks/[a-z0-9.-]+\.(sh|js)' "$MANIFEST" | sed 's|^hooks/||' | sort -u)
  [ "$missing" -eq 0 ] && echo "PASS: all manifest-referenced hooks exist"
fi

echo
echo "== Check 2: every hook is registered in the manifest =="
# An unregistered hook is dead code that reads like a live safeguard — the most
# misleading state this directory can be in.
unreg=0
for f in $(hook_files); do
  base="$(basename "$f")"
  if ! grep -q "$base" "$MANIFEST" 2>/dev/null; then
    echo "FAIL: $base exists but is not registered in hooks.json"
    unreg=1; fail=1
  fi
done
[ "$unreg" -eq 0 ] && echo "PASS: every hook file is registered"

echo
echo "== Check 3: no hook can block a tool call (invariant 2) =="
# Exit 2 is the harness's "block this call" signal. Nothing in this directory is
# allowed to use it: a false positive would deadlock a session with no recourse.
blocked=0
for f in $(hook_files); do
  if grep -nE '\bexit[[:space:]]+2\b|process\.exit\([[:space:]]*2[[:space:]]*\)' "$f" >/dev/null 2>&1; then
    echo "FAIL: $(basename "$f") contains a blocking exit(2):"
    grep -nE '\bexit[[:space:]]+2\b|process\.exit\([[:space:]]*2[[:space:]]*\)' "$f"
    blocked=1; fail=1
  fi
done
[ "$blocked" -eq 0 ] && echo "PASS: no hook uses a blocking exit"

echo
echo "== Check 4: every hook self-scopes on .dk-state (invariant 1) =="
# dev-kit installs into repos that are not running the pipeline. A hook that
# fires there is pure noise in someone else's unrelated session.
unscoped=0
for f in $(hook_files); do
  base="$(basename "$f")"
  if ! grep -qE 'dk_guard|\bguard\(' "$f" 2>/dev/null; then
    # dk-context.js is the documented exception: in --statusline mode it renders
    # for any project, and only its --monitor half is guarded.
    if [ "$base" = "dk-context.js" ]; then
      if grep -qE 'dk_guard|\bguard\(' "$f" 2>/dev/null; then continue; fi
      echo "FAIL: $base never calls guard() — even the --monitor half must self-scope"
      unscoped=1; fail=1
    else
      echo "FAIL: $base never calls dk_guard/guard() — it would fire outside a dk run"
      unscoped=1; fail=1
    fi
  fi
done
[ "$unscoped" -eq 0 ] && echo "PASS: every hook self-scopes"

echo
echo "== Check 5: capture hooks honor their kill switch (invariant 3) =="
# Both flags live in the .dk-state closed key set purely so these hooks can read
# them. A flag with no consumer is worse than no flag: it reads as a working
# switch that silently does nothing.
declare -A SWITCH=(
  [dk-post-write-wiki-queue.sh]=wiki
  [dk-stop-wiki-drain.sh]=wiki
  [dk-session-start-orient.sh]=wiki
  [dk-pre-search-graph-hint.sh]=graphify
  [dk-post-merge-graphify.sh]=graphify
)
switchless=0
for base in "${!SWITCH[@]}"; do
  f="$HOOKS_DIR/$base"
  [ -f "$f" ] || continue
  if ! grep -qE "flagOff|dk_flag_off" "$f" 2>/dev/null; then
    echo "FAIL: $base does not check its '${SWITCH[$base]}: off' kill switch"
    switchless=1; fail=1
  fi
done
[ "$switchless" -eq 0 ] && echo "PASS: every capture hook checks its kill switch"

echo
echo "== Check 6: every hook has a test, and every test passes =="
testless=0
for f in $(hook_files); do
  base="$(basename "$f")"
  t="$HOOKS_DIR/tests/${base%.*}.test.sh"
  if [ ! -f "$t" ]; then
    echo "FAIL: $base has no test at $t"
    testless=1; fail=1
  fi
done
[ "$testless" -eq 0 ] && echo "PASS: every hook has a test file"

if [ -d "$HOOKS_DIR/tests" ]; then
  for t in "$HOOKS_DIR"/tests/*.test.sh; do
    [ -f "$t" ] || continue
    # stdin MUST be closed: every hook opens with a blocking read of its payload,
    # so a test that invokes one without redirecting stdin inherits this script's
    # and waits forever. Found the hard way — the guard hung, not the hooks.
    if timeout 120 bash "$t" </dev/null >/tmp/dk-hook-test.$$ 2>&1; then
      echo "PASS: $(basename "$t")"
    else
      echo "FAIL: $(basename "$t") — output follows:"
      sed 's/^/      /' /tmp/dk-hook-test.$$
      fail=1
    fi
    rm -f /tmp/dk-hook-test.$$
  done
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All hook guards passed."
else
  echo "At least one hook guard FAILED."
fi
exit "$fail"
