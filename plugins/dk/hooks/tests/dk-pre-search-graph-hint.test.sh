#!/usr/bin/env bash
# Test for dk-pre-search-graph-hint.sh. Exit 0 = every assertion passed.
#
# The hook cannot be exercised without a live session, so each case pipes a synthetic
# PreToolUse payload to stdin against a fixture repo in a temp dir, and asserts on stdout
# plus exit code. TMPDIR is redirected too — dk_once writes its per-session marker there,
# and a test that leaked markers into the real /tmp would pass once and fail forever after.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-pre-search-graph-hint.sh"

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
  [ -n "$state" ] && printf 'next: discover:map\n' > "$dir/.dk-state"
  [ -n "$state" ] && [ -n "$flag" ] && printf 'graphify: off\n' >> "$dir/.dk-state"
  [ -n "$graph" ] && { mkdir -p "$dir/docs/state/graphs"; printf '{"nodes":[]}' > "$dir/docs/state/graphs/graph.json"; }
  printf '%s' "$dir"
}

payload() { # <cwd> <session_id> [tool_name]
  CWD="$1" SID="$2" TOOL="${3:-Glob}" node -e '
    process.stdout.write(JSON.stringify({
      session_id: process.env.SID,
      cwd: process.env.CWD,
      hook_event_name: "PreToolUse",
      tool_name: process.env.TOOL,
      tool_input: { pattern: "**/*.ts" }
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
  # `--` because an expected substring may itself start with a dash.
  elif ! printf '%s' "$OUT" | grep -qF -- "$3"; then report fail "$1" "output missing '$3': ${OUT:-<empty>}"
  else report ok "$1"; fi
}

# 1. Not a dk project — invariant 1.
assert_silent "no .dk-state → silent, exit 0" "$(payload "$(fixture nostate --no-state)" s1)"

# 2. Kill switch — invariant 3.
assert_silent "graphify: off → silent, exit 0" "$(payload "$(fixture off --off)" s2)"

# 3. Unparseable payload — invariant 2.
assert_silent "malformed JSON stdin → silent, exit 0" '{"session_id": "s3", cwd'
assert_silent "empty stdin → silent, exit 0" ''

# 4. Nothing to point at.
assert_silent "no graph.json → silent, exit 0" "$(payload "$(fixture nograph --no-graph)" s4)"

# 5. Happy path, then the once-per-session suppression that is the whole point of the hook.
HAPPY="$(fixture happy)"
assert_emits "first Glob with a graph → emits the report hint" \
  "$(payload "$HAPPY" sess-A)" "docs/state/graphs/GRAPH_REPORT.md"
assert_emits "emitted envelope is a PreToolUse hookSpecificOutput" \
  "$(payload "$HAPPY" sess-B)" '"hookEventName":"PreToolUse"'
assert_silent "second identical call, same session → silent" "$(payload "$HAPPY" sess-A)"
assert_silent "third call, same session, Grep instead of Glob → still silent" \
  "$(payload "$HAPPY" sess-A Grep)"

# 6. The marker is per-session, so a new session (e.g. after /clear) gets told again.
assert_emits "different session id → emits again" \
  "$(payload "$HAPPY" sess-C)" "docs/state/graphs/GRAPH_REPORT.md"

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
