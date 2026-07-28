#!/usr/bin/env bash
# dk-context.test.sh — synthetic-payload tests for dk-context.js, both modes.
#
# No hook can be exercised without a live session, so everything here is fixtures: a temp
# project with (or without) .dk-state, hand-written bridge files, and a synthetic transcript.
# Exit 0 = all assertions passed.

HOOK="$(cd "$(dirname "$0")/.." && pwd)/dk-context.js"
FAIL=0

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Each test gets its own TMPDIR so bridge and debounce files never leak between them.
export TMPDIR="$WORK/tmp"
mkdir -p "$TMPDIR"

pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }

check() { # <name> <condition-result> [detail]
  if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi
}

# ---------------------------------------------------------------- fixtures

PROJ="$WORK/proj"          # a live dk run
BARE="$WORK/bare"          # a repo with no .dk-state
mkdir -p "$PROJ" "$BARE"
cat > "$PROJ/.dk-state" <<'EOF'
stage: 7
mode: auto
milestone: v2
phase: 03
round: -
verdict: pass
next: "run plan:write for phase 03"
EOF

payload() { # <session-id> <cwd> [transcript]
  printf '{"session_id":"%s","cwd":"%s","transcript_path":"%s","hook_event_name":"PostToolUse","tool_name":"Bash"}' \
    "$1" "$2" "${3:-}"
}

sl_payload() { # <session-id> <cwd> <remaining-pct>
  printf '{"session_id":"%s","cwd":"%s","model":{"display_name":"Opus 5"},"context_window":{"remaining_percentage":%s,"total_tokens":1000000}}' \
    "$1" "$2" "$3"
}

bridge() { # <session-id> <remaining-pct> <age-seconds> [total-tokens]
  local ts=$(( $(date +%s) - $3 ))
  if [ -n "$4" ]; then
    printf '{"remaining_percentage":%s,"used_pct":%s,"timestamp":%s,"total_tokens":%s}' \
      "$2" "$((100 - $2))" "$ts" "$4" > "$TMPDIR/dk-ctx-$1.json"
  else
    printf '{"remaining_percentage":%s,"used_pct":%s,"timestamp":%s}' \
      "$2" "$((100 - $2))" "$ts" > "$TMPDIR/dk-ctx-$1.json"
  fi
}

# A one-turn transcript. The model id is incidental — nothing here may depend on it.
turn() { # <file> <model> <input-tokens> [more-input-tokens...]
  local file="$1" model="$2"; shift 2
  : > "$file"
  for t in "$@"; do
    printf '{"type":"assistant","message":{"model":"%s","usage":{"input_tokens":%s}}}\n' \
      "$model" "$t" >> "$file"
  done
}

# ---------------------------------------------------------------- 1. no .dk-state

OUT="$(payload s1 "$BARE" | node "$HOOK" --monitor 2>&1)"; RC=$?
check "monitor: no .dk-state → silent" "$([ -z "$OUT" ] && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"

# ---------------------------------------------------------------- 2. malformed stdin

OUT="$(printf '{not json' | node "$HOOK" --monitor 2>&1)"; RC=$?
check "monitor: malformed JSON → silent" "$([ -z "$OUT" ] && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"

# ---------------------------------------------------------------- 3. fresh bridge, critical

bridge s3 20 0
OUT="$(payload s3 "$PROJ" | node "$HOOK" --monitor 2>&1)"; RC=$?
check "monitor: bridge at 20% → CRITICAL" \
  "$(echo "$OUT" | grep -q 'CONTEXT CRITICAL' && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"
check "monitor: critical names the recovery path" \
  "$(echo "$OUT" | grep -q 'context-save' && echo "$OUT" | grep -q '/dk:run' && echo 0 || echo 1)" "out=$OUT"
check "monitor: critical is a PostToolUse envelope" \
  "$(echo "$OUT" | grep -q '"hookEventName":"PostToolUse"' && echo 0 || echo 1)" "out=$OUT"

# ---------------------------------------------------------------- 4. fresh bridge, healthy

bridge s4 90 0
OUT="$(payload s4 "$PROJ" | node "$HOOK" --monitor 2>&1)"; RC=$?
check "monitor: bridge at 90% → silent" "$([ -z "$OUT" ] && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"

# ---------------------------------------------------------------- 5. stale bridge → transcript

TRANSCRIPT="$WORK/transcript.jsonl"
{
  printf '{"type":"user","message":{"content":"hello"}}\n'
  printf '{"type":"assistant","message":{"model":"claude-opus-5","usage":{"input_tokens":10,"cache_read_input_tokens":100,"output_tokens":10}}}\n'
  printf '{"type":"user","message":{"content":"more"}}\n'
  # 600000 + 10000 + 5000 + 5000 = 620000 of a 1M window → 38% remaining → warning
  printf '{"type":"assistant","message":{"model":"claude-opus-5","usage":{"input_tokens":10000,"cache_creation_input_tokens":5000,"cache_read_input_tokens":600000,"output_tokens":5000}}}\n'
} > "$TRANSCRIPT"

bridge s5 90 300   # stale AND healthy — if the bridge were used, there would be no output
OUT="$(payload s5 "$PROJ" "$TRANSCRIPT" | node "$HOOK" --monitor 2>&1)"; RC=$?
check "monitor: stale bridge → transcript fallback" \
  "$(echo "$OUT" | grep -q 'CONTEXT WARNING' && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"
check "monitor: fallback computes 38% remaining" \
  "$(echo "$OUT" | grep -q '~38% left' && echo 0 || echo 1)" "out=$OUT"
check "monitor: fallback is labelled estimated" \
  "$(echo "$OUT" | grep -q 'estimated' && echo 0 || echo 1)" "out=$OUT"

# ------------------------------------------- 5b. stale bridge carries an exact window

# 135790 of a known 200k window = 67.9% used. The stale percentage (90% remaining) must be
# ignored while the stale window is trusted.
turn "$WORK/known.jsonl" claude-opus-5 40000 135790
bridge s5c 90 300 200000
OUT="$(payload s5c "$PROJ" "$WORK/known.jsonl" | node "$HOOK" --monitor 2>&1)"
check "monitor: stale bridge supplies the window, transcript the numerator" \
  "$(echo "$OUT" | grep -q '~68% used' && echo 0 || echo 1)" "out=$OUT"
check "monitor: hybrid source is labelled partially estimated" \
  "$(echo "$OUT" | grep -q 'estimated, known window' && echo 0 || echo 1)" "out=$OUT"

# ------------------------------------------- 5c. window inference from the observed peak

# Both fixtures end on the same 130000-token turn and differ only in the peak reached
# earlier, so the two outcomes below can only come from the inference.

# Peak under 200k → 200k is not ruled out, so assume it: 130000/200000 = 65% used.
turn "$WORK/small.jsonl" claude-opus-5 60000 130000
OUT="$(payload s5d "$PROJ" "$WORK/small.jsonl" | node "$HOOK" --monitor 2>&1)"
check "monitor: no bridge, peak under 200k → 200k window assumed" \
  "$(echo "$OUT" | grep -q '~65% used' && echo 0 || echo 1)" "out=$OUT"

# An earlier 450000-token turn proves the window is not 200k: the same 130000 is now 13%.
turn "$WORK/big.jsonl" claude-opus-5 450000 130000
OUT="$(payload s5e "$PROJ" "$WORK/big.jsonl" | node "$HOOK" --monitor 2>&1)"
check "monitor: no bridge, peak over 200k → 1M window inferred" \
  "$([ -z "$OUT" ] && echo 0 || echo 1)" "130000/1M is healthy, expected silence, got: $OUT"

# ------------------------------------------- 5d. the regression itself

# The bug: model id `claude-opus-5` was read as a 1M window, so a session truly at 68% used
# reported 14% and stayed silent. Same id, same tokens — must now warn.
turn "$WORK/regression.jsonl" claude-opus-5 135790
OUT="$(payload s5f "$PROJ" "$WORK/regression.jsonl" | node "$HOOK" --monitor 2>&1)"
check "regression: opus-5 at 135790 tokens reports ~68% used, not ~14%" \
  "$(echo "$OUT" | grep -q '~68% used' && echo 0 || echo 1)" "out=$OUT"
check "regression: 68% used is not silent" \
  "$(echo "$OUT" | grep -q 'CONTEXT' && echo 0 || echo 1)" "out=$OUT"

# The same numbers under a proven-1M window must read as healthy — confirming the two
# outcomes differ by observed peak alone, never by model id.
turn "$WORK/regression-1m.jsonl" claude-opus-5 900000 135790
OUT="$(payload s5g "$PROJ" "$WORK/regression-1m.jsonl" | node "$HOOK" --monitor 2>&1)"
check "regression: identical id + tokens read as healthy once 1M is proven" \
  "$([ -z "$OUT" ] && echo 0 || echo 1)" "expected silence, got: $OUT"

# ---------------------------------------------------------------- 6. debounce

bridge s6 30 0     # warning band for the bridge source (<=35, >25)
OUT1="$(payload s6 "$PROJ" | node "$HOOK" --monitor 2>&1)"
bridge s6 30 0
OUT2="$(payload s6 "$PROJ" | node "$HOOK" --monitor 2>&1)"
check "monitor: first warning emits" \
  "$(echo "$OUT1" | grep -q 'CONTEXT WARNING' && echo 0 || echo 1)" "out=$OUT1"
check "monitor: second identical warning is debounced" \
  "$([ -z "$OUT2" ] && echo 0 || echo 1)" "out=$OUT2"

# escalation must not wait for the debounce window
bridge s6 20 0
OUT3="$(payload s6 "$PROJ" | node "$HOOK" --monitor 2>&1)"
check "monitor: escalation bypasses the debounce" \
  "$(echo "$OUT3" | grep -q 'CONTEXT CRITICAL' && echo 0 || echo 1)" "out=$OUT3"

# ---------------------------------------------------------------- 7. statusline

mkdir -p "$PROJ/.claude"
printf '2026-07-28T14:02:11Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n' \
  > "$PROJ/.claude/dk-wiki-pending"
printf '2026-07-28T14:09:02Z\t1\tdocs/global/architecture/adr/0004-session-store.md\n' \
  >> "$PROJ/.claude/dk-wiki-pending"
printf '2026-07-28T14:11:40Z\t5\tdocs/milestones/v2/RETROSPECTIVE.md\n' \
  >> "$PROJ/.claude/dk-wiki-pending"

OUT="$(sl_payload s7 "$PROJ" 62 | node "$HOOK" --statusline 2>&1)"; RC=$?
check "statusline: renders the ctx percentage" \
  "$(echo "$OUT" | grep -q 'ctx 62%' && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"
check "statusline: renders model and position" \
  "$(echo "$OUT" | grep -q 'Opus 5' && echo "$OUT" | grep -q 'v2·phase 03' && echo 0 || echo 1)" "out=$OUT"
check "statusline: wiki queue counts unique paths" \
  "$(echo "$OUT" | grep -q 'wiki 2 pending' && echo 0 || echo 1)" "out=$OUT"
check "statusline: writes the bridge file" \
  "$([ -f "$TMPDIR/dk-ctx-s7.json" ] && echo 0 || echo 1)"
check "statusline: bridge carries remaining and used" \
  "$(grep -q '"remaining_percentage":62' "$TMPDIR/dk-ctx-s7.json" &&
     grep -q '"used_pct":38' "$TMPDIR/dk-ctx-s7.json" && echo 0 || echo 1)" \
  "$(cat "$TMPDIR/dk-ctx-s7.json" 2>/dev/null)"
check "statusline: bridge carries total_tokens (the only record of the window)" \
  "$(grep -q '"total_tokens":1000000' "$TMPDIR/dk-ctx-s7.json" && echo 0 || echo 1)" \
  "$(cat "$TMPDIR/dk-ctx-s7.json" 2>/dev/null)"

# the bridge the statusline just wrote is authoritative for the monitor
OUT="$(payload s7 "$PROJ" | node "$HOOK" --monitor 2>&1)"
check "statusline bridge is consumed by the monitor" \
  "$([ -z "$OUT" ] && echo 0 || echo 1)" "62% remaining should be silent, got: $OUT"

# ---------------------------------------------------------------- 8. statusline outside a dk run

OUT="$(sl_payload s8 "$BARE" 47 | node "$HOOK" --statusline 2>&1)"; RC=$?
check "statusline: no .dk-state → still renders model/ctx" \
  "$(echo "$OUT" | grep -q 'Opus 5' && echo "$OUT" | grep -q 'ctx 47%' && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"
check "statusline: no .dk-state → no position or wiki segment" \
  "$(echo "$OUT" | grep -q 'phase\|wiki' && echo 1 || echo 0)" "out=$OUT"

OUT="$(printf 'not json at all' | node "$HOOK" --statusline 2>&1)"; RC=$?
check "statusline: malformed payload → empty line, exit 0" \
  "$([ -z "$(echo "$OUT" | tr -d '[:space:]')" ] && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"

# ---------------------------------------------------------------- 9. no mode flag

OUT="$(payload s9 "$PROJ" | node "$HOOK" 2>&1)"; RC=$?
check "no mode flag → silent, exit 0" "$([ -z "$OUT" ] && [ $RC -eq 0 ] && echo 0 || echo 1)" "rc=$RC out=$OUT"

exit $FAIL
