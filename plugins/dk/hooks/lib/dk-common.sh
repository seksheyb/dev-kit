#!/usr/bin/env bash
# dk-common.sh — shared helpers for the shell hooks in this directory.
# Source it, never execute it:  . "$(dirname "$0")/lib/dk-common.sh"
#
# Contracts this implements live in ../CONTRACTS.md. The five invariants that matter
# here: self-scope on .dk-state, never block, honor kill switches first, stay silent
# by default, and no code derived from external hook packages.

# Every hook runs with errors non-fatal. A hook that dies mid-session is worse than
# one that does nothing, so nothing here uses `set -e`.

DK_STDIN=""

# dk_read_stdin — slurp and validate the hook payload once. Call it first.
#
# Invariant 2, and symmetric with dk-common.js: a payload that is empty or does not
# parse means we cannot know the tool, the path or the cwd, so there is nothing this
# hook could correctly say. Exit 0 immediately rather than continuing with empty
# fields — every hook is always handed a payload, so unparseable is a real fault,
# not a case to muddle through.
dk_read_stdin() {
  DK_STDIN="$(cat 2>/dev/null || true)"
  [ -n "$DK_STDIN" ] || exit 0
  printf '%s' "$DK_STDIN" | node -e '
    let d="";
    process.stdin.on("data", c => d += c);
    process.stdin.on("end", () => { try { JSON.parse(d); } catch { process.exit(1); } });
  ' >/dev/null 2>&1 || exit 0
}

# dk_json <dotted.path> — read a field from the payload. Prints the value or nothing.
# Uses node because tool_input paths carry escapes that shell parsing gets wrong.
dk_json() {
  [ -n "$DK_STDIN" ] || return 0
  printf '%s' "$DK_STDIN" | node -e '
    let d="";
    process.stdin.on("data", c => d += c);
    process.stdin.on("end", () => {
      try {
        let v = JSON.parse(d);
        for (const k of process.argv[1].split(".")) {
          if (v == null || typeof v !== "object") { v = undefined; break; }
          v = v[k];
        }
        if (v != null && typeof v !== "object") process.stdout.write(String(v));
      } catch { /* malformed payload — invariant 2: stay silent */ }
    });
  ' "$1" 2>/dev/null || true
}

# dk_root — project root for this session. Prefers the payload cwd, falls back to PWD.
dk_root() {
  local c
  c="$(dk_json cwd)"
  [ -n "$c" ] && [ -d "$c" ] && { printf '%s' "$c"; return 0; }
  printf '%s' "$PWD"
}

# dk_guard — invariant 1. Exits the hook silently unless a dk run is active here.
# Call it first in every hook, after dk_read_stdin.
dk_guard() {
  [ -f "$(dk_root)/.dk-state" ] || exit 0
}

# dk_flag_off <name> — invariant 3. True when `<name>: off` is set in .dk-state.
# Usage:  dk_flag_off wiki && exit 0
dk_flag_off() {
  grep -qiE "^[[:space:]]*$1:[[:space:]]*off[[:space:]]*$" "$(dk_root)/.dk-state" 2>/dev/null
}

# dk_state <key> — read a key from .dk-state. Prints the value or nothing.
# Handles both bare and quoted values; `-` (the contract's null) prints nothing.
dk_state() {
  local v
  v="$(grep -iE "^[[:space:]]*$1:" "$(dk_root)/.dk-state" 2>/dev/null | head -1 |
       sed -E "s/^[[:space:]]*[^:]+:[[:space:]]*//; s/^\"(.*)\"$/\1/; s/[[:space:]]*$//")"
  [ "$v" = "-" ] && return 0
  printf '%s' "$v"
}

# dk_emit <event> <text> — invariant 4. Print the context-injection envelope.
# Emit nothing at all when there is nothing to say; do not call this with empty text.
dk_emit() {
  [ -n "$2" ] || return 0
  EVT="$1" TXT="$2" node -e '
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: process.env.EVT,
        additionalContext: process.env.TXT
      }
    }));
  ' 2>/dev/null || true
}

# dk_once <tag> — true the first time it is called for this session, false after.
# Marker is keyed on session_id so concurrent sessions do not suppress each other.
dk_once() {
  local sid marker
  sid="$(dk_json session_id)"
  case "$sid" in *[/\\]*|*..*) return 1 ;; esac   # never build a path from a dirty id
  marker="${TMPDIR:-/tmp}/dk-${1}-${sid:-pid$PPID}"
  [ -f "$marker" ] && return 1
  : > "$marker" 2>/dev/null || return 1
  return 0
}

# dk_queue — path to the wiki work queue for this project.
dk_queue() {
  printf '%s' "$(dk_root)/.claude/dk-wiki-pending"
}
