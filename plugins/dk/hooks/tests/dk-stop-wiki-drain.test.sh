#!/usr/bin/env bash
# Test for dk-stop-wiki-drain.sh.
#
# Stop fires after every assistant turn, so the assertion that matters most is the negative
# one: with no queue there must be no output at all. A drain that talks when it has nothing
# to say is worse than no drain, because the nudge it exists to deliver stops being read.
#
# Exit 0 = all pass, one line printed per assertion.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-stop-wiki-drain.sh"
BASE="$(mktemp -d)"
trap 'rm -rf "$BASE"' EXIT
TAB=$'\t'
FAILED=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n        %s\n' "$1" "$2"; FAILED=1; }
check()    { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected [$2] got [$3]"; fi; }
contains() { # contains <name> <needle>  — asserts against the emitted additionalContext
  case "$CTX" in *"$2"*) pass "$1" ;; *) fail "$1" "additionalContext lacks [$2]" ;; esac
}
lacks() {
  case "$CTX" in *"$2"*) fail "$1" "additionalContext unexpectedly has [$2]" ;; *) pass "$1" ;; esac
}

mkproject() { # mkproject [.dk-state contents] -> prints the root
  local d; d="$(mktemp -d "$BASE/projXXXXXX")"
  [ $# -gt 0 ] && printf '%s\n' "$1" > "$d/.dk-state"
  printf '%s' "$d"
}

seed_queue() { # seed_queue <root> <line>...
  local d="$1"; shift
  mkdir -p "$d/.claude"
  : > "$d/.claude/dk-wiki-pending"
  local l; for l in "$@"; do printf '%s\n' "$l" >> "$d/.claude/dk-wiki-pending"; done
}

payload() { # payload <cwd> <hook_event_name> [last_assistant_message]
  node -e '
    const [cwd, evt, lam] = process.argv.slice(1);
    const o = { session_id: "test-drain", cwd, hook_event_name: evt };
    if (lam) o.last_assistant_message = lam;
    process.stdout.write(JSON.stringify(o));
  ' "$@"
}

# Sets OUT, RC, and — when something was emitted — EVT and CTX, unpacked by node so the test
# asserts on the decoded text rather than on JSON escaping.
run() {
  OUT="$(printf '%s' "$1" | bash "$HOOK" 2>/dev/null)"; RC=$?
  EVT=""; CTX=""
  if [ -n "$OUT" ]; then
    EVT="$(printf '%s' "$OUT" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.hookEventName' 2>/dev/null)"
    CTX="$(printf '%s' "$OUT" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).hookSpecificOutput.additionalContext' 2>/dev/null)"
  fi
}

ADR="docs/global/architecture/adr/0004-session-store.md"
RETRO="docs/milestones/v2/RETROSPECTIVE.md"

# ---------------------------------------------------------------- 1. no .dk-state
D="$(mkproject)"
seed_queue "$D" "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR"
run "$(payload "$D" Stop)"
check "no .dk-state -> exit 0"      "0" "$RC"
check "no .dk-state -> no output"   ""  "$OUT"

# ---------------------------------------------------------------- 2. kill switch
D="$(mkproject "stage: 4
wiki: off")"
seed_queue "$D" "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR"
run "$(payload "$D" Stop)"
check "wiki: off -> exit 0"         "0" "$RC"
check "wiki: off -> no output"      ""  "$OUT"

# ---------------------------------------------------------------- 3. malformed stdin
D="$(mkproject "stage: 4")"
seed_queue "$D" "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR"
run '{"cwd": "'"$D"'", "hook_event_name":'
check "malformed JSON -> exit 0"    "0" "$RC"
check "malformed JSON -> no output" ""  "$OUT"

# ---------------------------------------------------------------- 4. empty / missing queue
D="$(mkproject "stage: 4")"
run "$(payload "$D" Stop)"
check "missing queue -> exit 0"     "0" "$RC"
check "missing queue -> no output"  ""  "$OUT"

seed_queue "$D"                       # exists but empty
run "$(payload "$D" Stop)"
check "empty queue -> exit 0"       "0" "$RC"
check "empty queue -> no output"    ""  "$OUT"

# A queue of nothing but unparseable junk is the same as an empty one.
seed_queue "$D" "garbage" "2026-07-28T14:02:11Z${TAB}9${TAB}nope.md"
run "$(payload "$D" Stop)"
check "unusable queue -> no output" ""  "$OUT"

# ---------------------------------------------------------------- 5. two entries, two types
D="$(mkproject "stage: 11
milestone: v2
phase: 03")"
seed_queue "$D" \
  "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR" \
  "2026-07-28T14:09:03Z${TAB}5${TAB}$RETRO"
run "$(payload "$D" Stop "Went with the Redis session store over signed cookies; cookie size capped us at 4KB.")"
check    "two entries -> exit 0"        "0" "$RC"
check    "two entries -> emits once"    "1" "$(printf '%s' "$OUT" | grep -c .)"
check    "two entries -> hookEventName" "Stop" "$EVT"
contains "names the ADR"                "$ADR"
contains "names the retrospective"      "$RETRO"
contains "type 1 by NAME"               "decision + rejected alternatives"
contains "type 5 by NAME"               "milestone retrospect"
contains "counts both artifacts"        "2 artifact(s)"
contains "dispatches claude-obsidian:save" "claude-obsidian:save"
contains "frontmatter: type is per-note" "type: <that artifact's type>"
contains "frontmatter: scope is per-note" "scope: <that artifact's scope>"
contains "frontmatter: status active"   "status: active"
contains "rule: capture the REASONING"  "REASONING"
contains "rule: rejected alternatives"  "alternatives"
contains "rule: link, never copy"       "LINK to the artifact, never copy it"
contains "rule: vault is lossy"         "deliberately lossy"
contains "Stop anchors on last_assistant_message" "Went with the Redis session store"

# scope comes from the PATH, not from .dk-state. This project's state says phase 03, but a
# docs/global ADR is project-lifetime and a milestone-level retro is v2 — neither is
# `v2/phase-03`. If either of these ever reads `v2/phase-03`, the state read has crept back in.
contains "ADR under docs/global -> scope: project" "scope: project"
contains "milestone-level retro -> scope: v2"      "scope: v2"
lacks    "state's phase is NOT used for scope"     "scope: v2/phase-03"

# The queue must survive: this hook cannot know whether the save happened, and the
# SessionStart backstop depends on the entries still being there.
check "queue NOT cleared" "2" "$(grep -c . "$D/.claude/dk-wiki-pending")"

# ---------------------------------------------------------------- 6. the three scope shapes
# CONTRACTS.md "Note frontmatter": scope is derived from the artifact path. The ordering trap
# is the one that bites — a phases/ path must hit the phase rule, never the milestone rule.
scope_of() { # scope_of <name> <queued path> <expected scope>
  local d; d="$(mkproject "stage: 2
milestone: v9
phase: -")"
  seed_queue "$d" "2026-07-28T14:02:11Z${TAB}1${TAB}$2"
  run "$(payload "$d" Stop)"
  local got; got="$(printf '%s' "$CTX" | grep -oE 'scope: .*' | head -1)"
  check "$1 -> scope: $3" "scope: $3" "$got"
}
scope_of "docs/global/** artifact"   "docs/global/architecture/SDD.md"                            "project"
scope_of "CLAUDE.md"                 "CLAUDE.md"                                                  "project"
scope_of "debug note (unnamed path)" "docs/state/debug/resolved/flaky-login.md"                    "project"
scope_of "milestone-level retro"     "docs/milestones/v2/RETROSPECTIVE.md"                        "v2"
scope_of "milestone research"        "docs/milestones/v7/research/MARKET.md"                      "v7"
scope_of "phase reviews/REVIEW.md"   "docs/milestones/v2/phases/03-x/reviews/REVIEW.md"           "v2/phase-03"
scope_of "phase round findings"      "docs/milestones/v2/phases/11-auth/reviews/round-2/findings.md" "v2/phase-11"

# The ordering trap, stated as its own assertion: this path is under docs/milestones/<M>/ and
# so matches the milestone rule too. The phase rule must be tried first or it resolves to `v2`.
scope_of "ordering: phases/ beats milestone rule" "docs/milestones/v2/phases/03-x/reviews/REVIEW.md" "v2/phase-03"

# ---------------------------------------------------------------- 6b. mixed scopes, one drain
# The reason scope moved onto the per-artifact line: one message, three different scopes.
D="$(mkproject "stage: 11
milestone: v2
phase: 03")"
seed_queue "$D" \
  "2026-07-28T14:00:00Z${TAB}1${TAB}docs/global/architecture/adr/0004-session-store.md" \
  "2026-07-28T14:01:00Z${TAB}5${TAB}docs/milestones/v2/RETROSPECTIVE.md" \
  "2026-07-28T14:02:00Z${TAB}6${TAB}docs/milestones/v2/phases/03-x/reviews/REVIEW.md"
run "$(payload "$D" Stop)"
check    "mixed scopes -> still one message"  "1" "$(printf '%s' "$OUT" | grep -c .)"
# Count only the per-artifact lines (deeper indent); the frontmatter template also says "scope:".
check    "mixed scopes -> three scope lines"  "3" "$(printf '%s' "$CTX" | grep -c '^      scope: ')"
check    "mixed: project appears once"        "1" "$(printf '%s' "$CTX" | grep -c 'scope: project$')"
check    "mixed: v2 appears once"             "1" "$(printf '%s' "$CTX" | grep -c 'scope: v2$')"
check    "mixed: v2/phase-03 appears once"    "1" "$(printf '%s' "$CTX" | grep -c 'scope: v2/phase-03$')"
contains "mixed: type 6 by NAME"              "dismissed finding"

D="$(mkproject "stage: 2")"
seed_queue "$D" "2026-07-28T14:02:11Z${TAB}4${TAB}docs/global/requirements/PRD.md"
run "$(payload "$D" Stop)"
contains "PRD -> scope: project" "scope: project"
contains "type 4 by NAME"        "domain knowledge"

# ---------------------------------------------------------------- 7. dedupe by path
D="$(mkproject "stage: 11
milestone: v2
phase: 03")"
seed_queue "$D" \
  "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR" \
  "2026-07-28T14:40:00Z${TAB}1${TAB}$ADR" \
  "2026-07-28T15:01:00Z${TAB}1${TAB}$ADR" \
  "2026-07-28T15:02:00Z${TAB}2${TAB}docs/global/ops/postmortems/2026-07-01-outage.md"
run "$(payload "$D" Stop)"
check    "3 writes of one path -> listed once" "1" "$(printf '%s' "$CTX" | grep -c -- "- $ADR\$")"
check    "deduped count is 2, not 4"           "1" "$(printf '%s' "$CTX" | grep -c '2 artifact(s)')"
contains "type 2 by NAME"                      "post-mortem"

# ---------------------------------------------------------------- 8. PreCompact
# Same script, different event, and no last_assistant_message field to lean on.
D="$(mkproject "stage: 11
milestone: v2
phase: 03")"
seed_queue "$D" "2026-07-28T14:02:11Z${TAB}1${TAB}$ADR"
run "$(payload "$D" PreCompact)"
check    "PreCompact -> exit 0"                 "0" "$RC"
check    "PreCompact -> hookEventName PreCompact" "PreCompact" "$EVT"
contains "PreCompact still names the artifact"  "$ADR"
contains "PreCompact still carries the rules"   "LINK to the artifact, never copy it"
lacks    "PreCompact omits the decided-anchor"  "Just decided"

exit $FAILED
