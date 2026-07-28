#!/usr/bin/env bash
# dk-post-commit-convention.test.sh — synthetic-payload tests.
#
# The hook reads the subject from `git log -1` rather than from the command string, so every
# fixture here is a real (throwaway) git repo with a real commit. Exit 0 = all assertions passed.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-post-commit-convention.sh"
FAIL=0

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export TMPDIR="$WORK/tmp"; mkdir -p "$TMPDIR"   # dk_once markers stay per-test

pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# repo <dir> <subject> — a git repo whose HEAD carries <subject>.
repo() {
  local d="$WORK/$1"; mkdir -p "$d"
  git -C "$d" init -q 2>/dev/null
  git -C "$d" config user.email t@t.t; git -C "$d" config user.name t
  : > "$d/f"; git -C "$d" add f
  git -C "$d" commit -qm "$2" 2>/dev/null
  printf '%s' "$d"
}

# run <cwd> <command> — invoke the hook with a synthetic payload. Fresh TMPDIR per call so the
# per-SHA dedupe never suppresses an assertion that is supposed to fire.
run() {
  export TMPDIR="$WORK/tmp-$RANDOM"; mkdir -p "$TMPDIR"
  OUT="$(printf '{"cwd":"%s","session_id":"s1","tool_input":{"command":"%s"}}' "$1" "$2" \
        | bash "$HOOK" 2>&1)"
  RC=$?
}

# ---------------------------------------------------------------- fixtures

GOOD="$(repo good 'feat(auth): add session refresh')"
BAD="$(repo bad 'made some changes')"
LONG="$(repo long "feat: $(printf 'x%.0s' {1..80})")"
MERGE="$(repo merge 'Merge branch feature/x')"
NOSTATE="$(repo nostate 'nope not conventional')"

for d in "$GOOD" "$BAD" "$LONG" "$MERGE"; do printf 'stage: 8\nmode: manual\n' > "$d/.dk-state"; done
# NOSTATE deliberately gets no .dk-state.

# ---------------------------------------------------------------- assertions

run "$NOSTATE" "git commit -m 'nope not conventional'"
check "no .dk-state — silent (invariant 1)" "$([ -z "$OUT" ] && [ "$RC" = 0 ] && echo 0 || echo 1)" "out=$OUT rc=$RC"

OUT="$(printf 'not json at all' | bash "$HOOK" 2>&1)"; RC=$?
check "malformed payload — silent, exit 0 (invariant 2)" "$([ -z "$OUT" ] && [ "$RC" = 0 ] && echo 0 || echo 1)" "out=$OUT rc=$RC"

OUT="$(printf '' | bash "$HOOK" 2>&1)"; RC=$?
check "empty payload — silent, exit 0" "$([ -z "$OUT" ] && [ "$RC" = 0 ] && echo 0 || echo 1)" "out=$OUT rc=$RC"

run "$GOOD" "git commit -m 'feat(auth): add session refresh'"
check "conforming subject — silent (invariant 4)" "$([ -z "$OUT" ] && echo 0 || echo 1)" "out=$OUT"

run "$BAD" "git commit -m 'made some changes'"
check "non-conforming subject — warns" "$(grep -q 'does not follow Conventional Commits' <<<"$OUT" && echo 0 || echo 1)"
check "warning names the offending subject" "$(grep -q 'made some changes' <<<"$OUT" && echo 0 || echo 1)"
check "warning never blocks" "$([ "$RC" = 0 ] && ! grep -q '"decision"' <<<"$OUT" && echo 0 || echo 1)" "rc=$RC"
check "output is a valid hook envelope" "$(node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.exit(j.hookSpecificOutput&&j.hookSpecificOutput.hookEventName==="PostToolUse"?0:1)})' <<<"$OUT" && echo 0 || echo 1)"

run "$LONG" "git commit -m 'feat: xxx'"
check "over-length subject — warns about truncation" "$(grep -q 'over 72' <<<"$OUT" && echo 0 || echo 1)"

run "$MERGE" "git commit -m 'Merge branch feature/x'"
check "merge subject — exempt, silent" "$([ -z "$OUT" ] && echo 0 || echo 1)" "out=$OUT"

run "$BAD" "git commit --amend -m 'still bad'"
check "--amend — never re-warns" "$([ -z "$OUT" ] && echo 0 || echo 1)" "out=$OUT"

run "$BAD" "git status"
check "a non-commit Bash call — silent" "$([ -z "$OUT" ] && echo 0 || echo 1)" "out=$OUT"

run "$BAD" "git log --oneline"
check "'git log' is not mistaken for a commit" "$([ -z "$OUT" ] && echo 0 || echo 1)" "out=$OUT"

# Dedupe: the same TMPDIR twice on the same SHA must warn once only.
export TMPDIR="$WORK/tmp-dedupe"; mkdir -p "$TMPDIR"
P="$(printf '{"cwd":"%s","session_id":"s1","tool_input":{"command":"git commit -m x"}}' "$BAD")"
FIRST="$(printf '%s' "$P" | bash "$HOOK" 2>&1)"
SECOND="$(printf '%s' "$P" | bash "$HOOK" 2>&1)"
check "same commit warns exactly once" "$([ -n "$FIRST" ] && [ -z "$SECOND" ] && echo 0 || echo 1)" "first=${FIRST:0:24} second=${SECOND:0:24}"

[ "$FAIL" = 0 ] && echo "PASS — dk-post-commit-convention.sh" || echo "FAIL — dk-post-commit-convention.sh"
exit "$FAIL"
