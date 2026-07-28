#!/usr/bin/env bash
# Test for dk-session-start-orient.sh.
#
# A SessionStart hook cannot be exercised without a live session, so — per CONTRACTS.md
# "Testing" — this pipes synthetic payloads to stdin against fixture repos in a temp dir and
# asserts stdout plus exit code. Nothing here touches the operator's real project.
#
# Usage: bash plugins/dk/hooks/tests/dk-session-start-orient.test.sh
# Exit code: 0 = all assertions passed, 1 = at least one failed.

set -u

HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/dk-session-start-orient.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
OUT=""
RC=0

# ok <name> <0|1> — one line per assertion.
ok() {
  if [ "$2" -eq 0 ]; then echo "PASS: $1"; else echo "FAIL: $1"; fail=1; fi
}

yes_no() { if [ "$1" -eq 0 ]; then echo 0; else echo 1; fi; }

# has <regex> / lacks <regex> — assertion helpers over the last hook output.
has()   { printf '%s' "$OUT" | grep -q "$1" && echo 0 || echo 1; }
lacks() { printf '%s' "$OUT" | grep -q "$1" && echo 1 || echo 0; }

# fixture <name> — a fresh repo dir; prints its path.
fixture() { local d="$TMP/$1"; mkdir -p "$d/.claude"; printf '%s' "$d"; }

# run_hook <cwd> <source> — sets OUT and RC. Deliberately not a command substitution: RC has to
# survive, and a subshell would swallow it.
run_hook() {
  printf '{"session_id":"t-%s","hook_event_name":"SessionStart","cwd":"%s","source":"%s"}' \
    "$RANDOM" "$1" "$2" | bash "$HOOK" > "$TMP/out" 2>/dev/null
  RC=$?
  OUT="$(cat "$TMP/out")"
}

echo "== dk-session-start-orient.sh =="

# --- 1. No .dk-state → invariant 1, this repo is not running the pipeline ---------------------
D="$(fixture no-state)"
run_hook "$D" startup
ok "1a. no .dk-state emits nothing" "$([ -z "$OUT" ]; yes_no $?)"
ok "1b. no .dk-state exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"

# --- 2. Malformed JSON on stdin → invariant 2, never block ------------------------------------
D="$(fixture bad-json)"
printf 'stage: 7\nnext: "run /dk:plan:gate 03"\n' > "$D/.dk-state"
printf '{"cwd":"%s","source":"clear"' "$D" | bash "$HOOK" > "$TMP/out" 2>/dev/null
RC=$?; OUT="$(cat "$TMP/out")"
ok "2a. malformed JSON emits nothing" "$([ -z "$OUT" ]; yes_no $?)"
ok "2b. malformed JSON exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"

# --- 3. source: fork → a copy already carries full context ------------------------------------
D="$(fixture forked)"
cat > "$D/.dk-state" <<'STATE'
stage: 7
mode: auto
milestone: v2
phase: 03
round: 2
verdict: passed
next: "run /dk:plan:gate 03 — see journal/03-checkout.md"
STATE
printf '2026-07-28T14:02:11Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n' \
  > "$D/.claude/dk-wiki-pending"
run_hook "$D" fork
ok "3a. fork emits nothing despite full state and a populated queue" "$([ -z "$OUT" ]; yes_no $?)"
ok "3b. fork exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"

# --- 4. clear + a next: naming plan:gate → head plus a scoped ingest nudge ---------------------
D="$(fixture clear-plan-gate)"
cat > "$D/.dk-state" <<'STATE'
stage: 7
mode: manual
milestone: v2
phase: 03
round: -
verdict: passed
next: "run /dk:plan:gate 03 — see journal/03-checkout.md §round-2"
STATE
run_hook "$D" clear
ok "4a. exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"
ok "4b. state head names the milestone" "$(has 'milestone v2')"
ok "4c. state head names the phase" "$(has 'phase 03')"
ok "4d. state head names the stage" "$(has 'stage 7')"
ok "4e. state head carries the last verdict" "$(has 'last verdict: passed')"
ok "4f. round is omitted when it reads '-'" "$(lacks ', round ')"
ok "4g. next: is reproduced verbatim, journal pointer intact" \
   "$(has 'Next: run /dk:plan:gate 03 — see journal/03-checkout.md §round-2')"
ok "4h. ingest nudge names note type 1 by name" "$(has 'Decision + rejected alternatives')"
ok "4i. ingest nudge names note type 3 by name" "$(has 'Constraint + how it was learned')"
ok "4j. ingest nudge dispatches wiki-ingest" "$(has 'claude-obsidian:wiki-ingest')"
ok "4k. ingest nudge is scoped to the current milestone/phase" \
   "$(has 'scoped to those note types and to milestone v2 / phase 03')"
ok "4l. no queue backstop when the queue is absent" "$(lacks 'claude-obsidian:save')"

# --- 5. startup + a step with no entry in the step→types table → head only ---------------------
D="$(fixture startup-ship-pr)"
cat > "$D/.dk-state" <<'STATE'
stage: 14
mode: manual
milestone: v2
phase: -
round: -
verdict: passed
next: "run /dk:ship:pr for milestone v2"
STATE
run_hook "$D" startup
ok "5a. exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"
ok "5b. state head still present" "$(has 'stage 14')"
ok "5c. next: still reproduced verbatim" "$(has 'Next: run /dk:ship:pr for milestone v2')"
ok "5d. unmatched step emits no ingest nudge" "$(lacks 'wiki-ingest')"
ok "5e. unmatched step names no note types" "$(lacks 'Decision + rejected alternatives')"

# --- 6. wiki: off → invariant 3, the kill switch silences b and c but not the head -------------
D="$(fixture wiki-off)"
cat > "$D/.dk-state" <<'STATE'
stage: 7
milestone: v2
phase: 03
verdict: passed
next: "run /dk:plan:gate 03"
wiki: off
STATE
printf '2026-07-28T14:02:11Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n' \
  > "$D/.claude/dk-wiki-pending"
run_hook "$D" clear
ok "6a. exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"
ok "6b. state head still present under wiki: off" "$(has 'milestone v2')"
ok "6c. wiki: off suppresses the ingest nudge" "$(lacks 'wiki-ingest')"
ok "6d. wiki: off suppresses the queue backstop" "$(lacks 'claude-obsidian:save')"

# --- 7. Populated queue → backstop lists artifacts by type name, queue untouched ---------------
D="$(fixture queued)"
cat > "$D/.dk-state" <<'STATE'
stage: 11
milestone: v2
phase: 03
verdict: passed
next: "run /dk:ship:pr"
STATE
Q="$D/.claude/dk-wiki-pending"
{
  printf '2026-07-28T14:02:11Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n'
  printf '2026-07-28T14:09:03Z\t6\tdocs/milestones/v2/phases/03/reviews/REVIEW.md\n'
  printf '2026-07-28T15:31:00Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n'
  printf '2026-07-28T15:44:12Z\t2\tdocs/state/debug/checkout-500.md\n'
} > "$Q"
BEFORE="$(cksum < "$Q")"
run_hook "$D" resume
ok "7a. exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"
ok "7b. backstop instructs a save" "$(has 'claude-obsidian:save')"
ok "7c. backstop counts the deduped artifacts (3, not 4)" "$(has '3 artifact(s)')"
ok "7d. backstop lists the ADR path" "$(has 'docs/global/architecture/adr/0004-session-store.md')"
ok "7e. backstop lists the review path" \
   "$(has 'docs/milestones/v2/phases/03/reviews/REVIEW.md')"
ok "7f. backstop lists the debug path" "$(has 'docs/state/debug/checkout-500.md')"
ok "7g. backstop names type 6 by name" "$(has 'Dismissed finding')"
ok "7h. backstop names type 2 by name" "$(has 'Post-mortem')"
ok "7i. backstop is honest that the deliberation is unrecoverable" "$(has 'not recoverable')"
ok "7j. the duplicate ADR path is listed once" \
   "$([ "$(printf '%s' "$OUT" | grep -c '0004-session-store.md')" -eq 1 ]; yes_no $?)"
ok "7k. the queue file is left unmodified" "$([ "$(cksum < "$Q")" = "$BEFORE" ]; yes_no $?)"

# --- 8. All fields '-' and an empty queue → nothing at all -------------------------------------
D="$(fixture empty-state)"
cat > "$D/.dk-state" <<'STATE'
stage: -
mode: -
milestone: -
phase: -
round: -
verdict: -
next: -
STATE
: > "$D/.claude/dk-wiki-pending"
run_hook "$D" clear
ok "8a. empty state and empty queue emit nothing" "$([ -z "$OUT" ]; yes_no $?)"
ok "8b. exits 0" "$([ "$RC" -eq 0 ]; yes_no $?)"

echo
if [ "$fail" -eq 0 ]; then echo "All assertions passed."; else echo "Assertions FAILED."; fi
exit "$fail"
