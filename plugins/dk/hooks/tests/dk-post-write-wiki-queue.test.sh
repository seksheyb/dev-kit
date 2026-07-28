#!/usr/bin/env bash
# Test for dk-post-write-wiki-queue.sh.
#
# The hook cannot be exercised without a live session, so every case builds a synthetic
# project in a temp dir and pipes a synthetic PostToolUse payload to stdin. Exit 0 = all pass,
# one line printed per assertion.
#
# What this file really guards: the hook is silent on every path, including success. A
# regression is therefore invisible in normal use — the only way to notice the queue stopped
# being written is a test that reads the queue file.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-post-write-wiki-queue.sh"
BASE="$(mktemp -d)"
trap 'rm -rf "$BASE"' EXIT
TAB=$'\t'
FAILED=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n        %s\n' "$1" "$2"; FAILED=1; }
check() { # check <name> <expected> <actual>
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected [$2] got [$3]"; fi
}

# A fresh project root per case, so no case can see another's queue.
mkproject() { # mkproject [.dk-state contents] -> prints the root
  local d; d="$(mktemp -d "$BASE/projXXXXXX")"
  [ $# -gt 0 ] && printf '%s\n' "$1" > "$d/.dk-state"
  printf '%s' "$d"
}

# Payloads are built by node rather than mashed together in shell: new_string carries newlines
# and quotes, and a test that hand-escapes them ends up testing the escaping, not the hook.
payload() { # payload <cwd> <file_path> [tool_name] [tool_input key] [value]
  node -e '
    const [cwd, fp, tool, k, v] = process.argv.slice(1);
    const o = {
      session_id: "test-queue", cwd, hook_event_name: "PostToolUse",
      tool_name: tool || "Write", tool_input: { file_path: fp }
    };
    if (k) o.tool_input[k] = v;
    process.stdout.write(JSON.stringify(o));
  ' "$@"
}

# Sets OUT and RC in the caller. Not a command substitution: RC has to survive.
run() { OUT="$(printf '%s' "$1" | bash "$HOOK" 2>/dev/null)"; RC=$?; }

queue_of()    { cat "$1/.claude/dk-wiki-pending" 2>/dev/null; }
queue_lines() { queue_of "$1" | grep -c .; }

ADR="docs/global/architecture/adr/0004-session-store.md"

# ---------------------------------------------------------------- 1. no .dk-state
D="$(mkproject)"
run "$(payload "$D" "$D/$ADR")"
check "no .dk-state -> exit 0"           "0" "$RC"
check "no .dk-state -> no output"        ""  "$OUT"
check "no .dk-state -> no queue written" "0" "$(queue_lines "$D")"

# ---------------------------------------------------------------- 2. kill switch
D="$(mkproject "stage: 4
wiki: off")"
run "$(payload "$D" "$D/$ADR")"
check "wiki: off -> exit 0"              "0" "$RC"
check "wiki: off -> no output"           ""  "$OUT"
check "wiki: off -> queue untouched"     "0" "$(queue_lines "$D")"

# ---------------------------------------------------------------- 3. malformed stdin
D="$(mkproject "stage: 4")"
run '{"cwd": "'"$D"'", "tool_input":'
check "malformed JSON -> exit 0"         "0" "$RC"
check "malformed JSON -> no output"      ""  "$OUT"
check "malformed JSON -> no queue"       "0" "$(queue_lines "$D")"

# ---------------------------------------------------------------- 4. happy path, type 1
D="$(mkproject "stage: 4
milestone: v2")"
run "$(payload "$D" "$D/$ADR")"
check "type-1 ADR -> exit 0"             "0" "$RC"
check "type-1 ADR -> emits nothing"      ""  "$OUT"
check "type-1 ADR -> exactly one line"   "1" "$(queue_lines "$D")"
LINE="$(queue_of "$D")"
if printf '%s' "$LINE" | grep -qE "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z${TAB}1${TAB}$ADR\$"; then
  pass "type-1 ADR -> line is <iso8601>TAB<type>TAB<relative-path>"
else
  fail "type-1 ADR -> line is <iso8601>TAB<type>TAB<relative-path>" "got [$LINE]"
fi

# A relative file_path must be normalized to the same relative path as the absolute one.
run "$(payload "$D" "$ADR")"
check "relative file_path -> appended too"  "2" "$(queue_lines "$D")"
check "relative file_path -> same rel path" "2" "$(queue_of "$D" | grep -c "${TAB}1${TAB}$ADR\$")"

# ---------------------------------------------------------------- 5. non-matching paths
D="$(mkproject "stage: 4")"
run "$(payload "$D" "$D/src/index.ts")"
check "src/index.ts -> exit 0"           "0" "$RC"
check "src/index.ts -> no output"        ""  "$OUT"
check "src/index.ts -> queue unchanged"  "0" "$(queue_lines "$D")"

run "$(payload "$D" "$D/docs/milestones/v2/phases/03-x/03-01-PLAN.md")"
check "*-PLAN.md excluded on purpose"    "0" "$(queue_lines "$D")"
check "*-PLAN.md -> no output"           ""  "$OUT"

run "$(payload "$D" "$D/docs/milestones/v2/specs/003-auth/spec.md")"
check "specs/*/spec.md excluded on purpose" "0" "$(queue_lines "$D")"

# A phase-level RETROSPECTIVE.md must NOT match the milestone-level type-5 pattern. A shell
# glob would have swallowed it, because `*` crosses `/` — that is how the note budget quietly
# triples without anyone noticing.
run "$(payload "$D" "$D/docs/milestones/v2/phases/03-x/RETROSPECTIVE.md")"
check "phase-level RETROSPECTIVE not queued" "0" "$(queue_lines "$D")"

run "$(payload "$D" "/elsewhere/$ADR")"
check "absolute path outside root not queued" "0" "$(queue_lines "$D")"

# ---------------------------------------------------------------- 6. rest of the table
D="$(mkproject "stage: 4")"
expect_type() { # expect_type <name> <relative path> <expected type, empty for "not queued">
  local before after
  before="$(queue_lines "$D")"
  run "$(payload "$D" "$D/$2")"
  after="$(queue_lines "$D")"
  if [ -z "$3" ]; then
    check "$1 -> not queued" "$before" "$after"
  else
    check "$1 -> queued as type $3" "1" "$(queue_of "$D" | tail -1 | grep -c "${TAB}$3${TAB}$2\$")"
  fi
}
expect_type "SDD.md"         "docs/global/architecture/SDD.md"                            1
expect_type "ARCHITECTURE"   "docs/global/architecture/ARCHITECTURE.md"                   1
expect_type "cloud-design"   "docs/global/architecture/cloud-design.md"                   1
expect_type "constitution"   "docs/global/project/constitution.md"                        1
expect_type "DESIGN.md"      "docs/global/design/DESIGN.md"                               1
expect_type "debug note"     "docs/state/debug/resolved/flaky-login.md"                   2
expect_type "postmortem"     "docs/global/ops/postmortems/2026-07-01-outage.md"           2
expect_type "PRD"            "docs/global/requirements/PRD.md"                            4
expect_type "research doc"   "docs/milestones/v2/research/MARKET.md"                      4
expect_type "retrospective"  "docs/milestones/v2/RETROSPECTIVE.md"                        5
expect_type "round findings" "docs/milestones/v2/phases/03-x/reviews/round-2/findings.md" 6
expect_type "REVIEW.md"      "docs/milestones/v2/phases/03-x/reviews/REVIEW.md"           6
expect_type "BACKLOG.md"     "docs/global/requirements/BACKLOG.md"                        ""
expect_type "STATE.md"       "docs/state/STATE.md"                                        ""

# ---------------------------------------------------------------- 7. type 3, CLAUDE.md
# The documented tradeoff: an Edit whose own text mentions a constraint is queued; nothing
# else about CLAUDE.md is, because a false positive on the most-edited file in the repo
# trains the user to ignore every nudge, including the other five types.
D="$(mkproject "stage: 4")"
run "$(payload "$D" "$D/CLAUDE.md" Edit new_string "## Project Constraints
- Node 20 only; the pg driver segfaults on 22.")"
check "CLAUDE.md constraints Edit -> type 3" "1" "$(queue_of "$D" | grep -c "${TAB}3${TAB}CLAUDE.md\$")"

D="$(mkproject "stage: 4")"
run "$(payload "$D" "$D/CLAUDE.md" Edit new_string "Run the test suite with npm test.")"
check "CLAUDE.md unrelated Edit -> not queued" "0" "$(queue_lines "$D")"

D="$(mkproject "stage: 4")"
run "$(payload "$D" "$D/CLAUDE.md" Write content "## Project Constraints
- Node 20 only.")"
check "CLAUDE.md full Write -> not queued (false negative by design)" "0" "$(queue_lines "$D")"

# ---------------------------------------------------------------- 8. missing file_path
D="$(mkproject "stage: 4")"
run '{"cwd":"'"$D"'","hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{}}'
check "no file_path -> exit 0"    "0" "$RC"
check "no file_path -> no output" ""  "$OUT"

exit $FAILED
