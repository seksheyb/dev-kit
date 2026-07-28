#!/usr/bin/env bash
# Test for dk-post-merge-graphify.sh. Exit 0 = every assertion passed.
#
# The hook cannot be exercised without a live session, so each case pipes a synthetic
# PostToolUse(Bash) payload to stdin against a fixture repo in a temp dir. The bulk of the
# cases are negative: this hook sits on EVERY Bash call, so a loose match on the substring
# "merge" would fire on ordinary greps and logs all day long.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-post-merge-graphify.sh"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export TMPDIR="$WORK/markers"
mkdir -p "$TMPDIR"

PASS=0
FAIL=0

report() { # <ok|fail> <name> [detail]
  if [ "$1" = ok ]; then
    PASS=$((PASS + 1)); printf 'ok   %s\n' "$2"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL %s%s\n' "$2" "${3:+ — $3}"
  fi
}

# fixture <name> [--no-state] [--off] [--no-graph] → prints the repo path
fixture() {
  local name="$1"; shift
  local dir="$WORK/repos/$name" state=1 flag="" graph=1
  for a in "$@"; do
    case "$a" in
      --no-state) state="" ;;
      --off) flag=1 ;;
      --no-graph) graph="" ;;
    esac
  done
  mkdir -p "$dir"
  [ -n "$state" ] && printf 'next: build:tracks\n' > "$dir/.dk-state"
  [ -n "$state" ] && [ -n "$flag" ] && printf 'graphify: off\n' >> "$dir/.dk-state"
  [ -n "$graph" ] && { mkdir -p "$dir/docs/state/graphs"; printf '{"nodes":[]}' > "$dir/docs/state/graphs/graph.json"; }
  printf '%s' "$dir"
}

payload() { # <cwd> <session_id> <command>
  CWD="$1" SID="$2" CMD="$3" node -e '
    process.stdout.write(JSON.stringify({
      session_id: process.env.SID,
      cwd: process.env.CWD,
      hook_event_name: "PostToolUse",
      tool_name: "Bash",
      tool_input: { command: process.env.CMD },
      tool_output: "",
      tool_output_is_error: false
    }));'
}

run() { OUT="$(printf '%s' "$1" | bash "$HOOK" 2>/dev/null)"; RC=$?; }

assert_silent() { # <name> <payload>
  run "$2"
  if [ -n "$OUT" ]; then report fail "$1" "expected no output, got: $OUT"
  elif [ "$RC" -ne 0 ]; then report fail "$1" "expected exit 0, got $RC"
  else report ok "$1"; fi
}

assert_emits() { # <name> <payload> <substring>
  run "$2"
  if [ "$RC" -ne 0 ]; then report fail "$1" "expected exit 0, got $RC"
  # `--` because an expected substring may itself start with a dash (e.g. `--update`).
  elif ! printf '%s' "$OUT" | grep -qF -- "$3"; then report fail "$1" "output missing '$3': ${OUT:-<empty>}"
  else report ok "$1"; fi
}

REPO="$(fixture happy)"

# 1. Not a dk project — invariant 1.
assert_silent "no .dk-state → silent, exit 0" \
  "$(payload "$(fixture nostate --no-state)" s1 'git merge feature/x')"

# 2. Kill switch — invariant 3.
assert_silent "graphify: off → silent, exit 0" \
  "$(payload "$(fixture off --off)" s2 'git merge feature/x')"

# 3. Unparseable payload — invariant 2.
assert_silent "malformed JSON stdin → silent, exit 0" '{"tool_input": {"command": "git merge x"'
assert_silent "empty stdin → silent, exit 0" ''

# 4. graphify never opted into here.
assert_silent "no graph.json → silent, exit 0" \
  "$(payload "$(fixture nograph --no-graph)" s4 'git merge feature/x')"

# 5. Happy path — a track landing on the integration branch.
assert_emits "git merge feature/x → emits the refresh nudge" \
  "$(payload "$REPO" s5 'git merge feature/x')" "graphify"
assert_emits "nudge names the incremental refresh" \
  "$(payload "$REPO" s5 'git merge feature/x')" "--update"
assert_emits "emitted envelope is a PostToolUse hookSpecificOutput" \
  "$(payload "$REPO" s5 'git merge feature/x')" '"hookEventName":"PostToolUse"'
assert_emits "git merge --no-ff track/a → still a real merge" \
  "$(payload "$REPO" s5 'git merge --no-ff track/a')" "graphify"

# 6. The exclusions. Every one of these runs routinely during a wave; each is a false fire
#    that would burn a graph rebuild and train the agent to ignore this hook.
assert_silent "git merge-base a b → silent (a query, not an integration)" \
  "$(payload "$REPO" s6 'git merge-base main feature/x')"
assert_silent "git merge --abort → silent (tree reverted, nothing new to graph)" \
  "$(payload "$REPO" s6 'git merge --abort')"
assert_silent "git merge --quit → silent" \
  "$(payload "$REPO" s6 'git merge --quit')"
assert_silent "git merge --continue → silent (its own merge already nudged)" \
  "$(payload "$REPO" s6 'git merge --continue')"
assert_silent "git log --merges → silent (substring 'merge', not the verb)" \
  "$(payload "$REPO" s6 'git log --merges --oneline -20')"
assert_silent 'echo "merge" → silent (no git at all)' \
  "$(payload "$REPO" s6 'echo "merge"')"
assert_silent "path containing 'merge' → silent" \
  "$(payload "$REPO" s6 'git show HEAD:src/merge/util.ts')"
assert_silent "rg over a merge/ directory → silent" \
  "$(payload "$REPO" s6 'rg -n merge src/merge/')"
assert_silent "empty command → silent" "$(payload "$REPO" s6 '')"

# 7. Compound shell lines — the orchestrator rarely runs a bare merge.
assert_emits "cd sub && git merge feature/y → emits" \
  "$(payload "$REPO" s7 'cd sub && git merge feature/y')" "graphify"
assert_emits "git fetch; git merge origin/main → emits" \
  "$(payload "$REPO" s7 'git fetch origin; git merge origin/main')" "graphify"
assert_emits "git -C worktrees/a merge track/b → emits" \
  "$(payload "$REPO" s7 'git -C worktrees/a merge track/b')" "graphify"
assert_emits "merge-base query followed by a real merge → still emits" \
  "$(payload "$REPO" s7 'git merge-base main track/c && git merge track/c')" "graphify"
assert_silent "compound of exclusions only → silent" \
  "$(payload "$REPO" s7 'git merge --abort && git log --merges')"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
