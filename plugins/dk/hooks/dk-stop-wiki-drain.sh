#!/usr/bin/env bash
# dk-stop-wiki-drain.sh — registered on BOTH Stop and PreCompact: the REASONING-CAPTURE end
# of the wiki queue.
#
# Why it fires here and not somewhere calmer: at Stop and at PreCompact the deliberation that
# produced the artifact is still in context. That is the only window in which "why did the
# other option lose" can still be answered. One turn later it is gone, and a note written from
# the artifact alone is a summary of a file that is already in the repo — worthless.
# dk-session-start-orient.sh is the backstop for what slips through; it cannot recover the
# reasoning, only the fact that something is pending.
#
# Contracts: ../CONTRACTS.md — "The wiki queue", "The six note types", "Note frontmatter".

. "$(dirname "$0")/lib/dk-common.sh"

dk_read_stdin
dk_guard
dk_flag_off wiki && exit 0

# Stop fires after EVERY assistant turn; the queue gets ~10-20 entries across a whole
# milestone. Silence is not the edge case, it is virtually the whole distribution — so the
# no-op path is one stat() and out, before any state read, field read or subprocess.
Q="$(dk_queue)"
[ -s "$Q" ] || exit 0

# The six note types, by number. CONTRACTS.md owns these names; the nudge must use the name
# and not the bare number, because "type 1" tells the agent nothing about what to write.
dk_type_name() {
  case "$1" in
    1) printf 'decision + rejected alternatives' ;;
    2) printf 'post-mortem' ;;
    3) printf 'constraint + how it was learned' ;;
    4) printf 'domain knowledge' ;;
    5) printf 'milestone retrospect' ;;
    6) printf 'dismissed finding' ;;
  esac
}

# scope, per CONTRACTS.md "Note frontmatter" — derived from the ARTIFACT'S PATH, never from
# `.dk-state`. The two look interchangeable and are not: `phase` is set on entering stage 5 and
# cleared at stage 12, so it reads `-` through Part A and Part C, which is exactly when types 1,
# 4 and 5 are written. Reading scope from state would stamp `project` on every ADR, research
# note and milestone retrospect — erasing the milestone from the notes whose entire job is to
# carry memory across milestones. The path always knows; the state file only sometimes does.
#
# Order is load-bearing: the phases/ rule must be tried BEFORE the milestone rule, or
# `docs/milestones/v2/phases/03-x/reviews/REVIEW.md` resolves to `v2` instead of `v2/phase-03`.
# Anchored EREs with `[^/]+` per segment, same discipline as the producer's path→type table.
#
# Anything outside docs/milestones/ — docs/global/**, CLAUDE.md, and docs/state/debug/** (the
# type-2 path the table does not name) — is project-lifetime, so `project` is the right default
# rather than a gap.
dk_scope_for_path() {
  if [[ $1 =~ ^docs/milestones/([^/]+)/phases/([0-9]+)-[^/]+/ ]]; then
    printf '%s/phase-%s' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  elif [[ $1 =~ ^docs/milestones/([^/]+)/ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
  else
    printf 'project'
  fi
}

# Dedupe by path keeping the newest entry. The queue is append-only, so newest = last
# occurrence; awk keeps the last line per path along with its line number, and the sort
# restores queue order so the nudge lists artifacts in the order they were last touched.
PENDING="$(awk -F'\t' '
  NF >= 3 && $2 ~ /^[1-6]$/ { last[$3] = $0; ord[$3] = NR }
  END { for (p in last) print ord[p] "\t" last[p] }
' "$Q" 2>/dev/null | sort -n | cut -f2-)"
[ -n "$PENDING" ] || exit 0

# type and scope are both per-artifact, so both belong on the artifact's own line. One drain
# routinely spans scopes — an ADR (`project`) next to a round-findings note (`v2/phase-03`) —
# and a single shared `scope:` in the frontmatter block would silently mislabel one of them.
COUNT=0
LIST=""
while IFS=$'\t' read -r _ts type path; do
  [ -n "$path" ] || continue
  COUNT=$((COUNT + 1))
  LIST="$LIST
  - $path
      type: $type ($(dk_type_name "$type"))
      scope: $(dk_scope_for_path "$path")"
done <<EOF
$PENDING
EOF
[ "$COUNT" -gt 0 ] || exit 0

# One script, two events — emit the event we were actually called for or the injection is
# dropped. Default to Stop only so a payload missing the field still says something.
EVENT="$(dk_json hook_event_name)"
[ -n "$EVENT" ] || EVENT="Stop"

TEXT="dk wiki: $COUNT artifact(s) written in this session have no vault note yet.
$LIST

Dispatch \`claude-obsidian:save\` once per artifact above. Required frontmatter on each note —
\`type\` and \`scope\` are per-note, copied from that artifact's own lines above; \`status\` is the
only constant:

  type: <that artifact's type>
  scope: <that artifact's scope>
  status: active

Two rules decide whether these notes are worth having:

  1. Capture the REASONING — the alternatives that were considered and why each one lost,
     the diagnosis behind the fix, the incident behind the constraint. Not the artifact's
     contents. If the note could have been written by reading the file afterwards, it is
     the wrong note.
  2. LINK to the artifact, never copy it. The vault is deliberately lossy — the repo already
     holds the artifact and always will. A vault that mirrors the repo has no retrievable
     signal left in it."

# Stop carries last_assistant_message; PreCompact carries no such field. Anchor the save to
# what was just decided when we have it, and simply omit the anchor when we do not — the
# nudge is still correct without it.
LAM="$(dk_json last_assistant_message | tr '\n\t' '  ' | cut -c1-320)"
if [ -n "$LAM" ]; then
  TEXT="$TEXT

Just decided, for the note to draw on: \"$LAM\""
fi

dk_emit "$EVENT" "$TEXT"

# The queue is deliberately NOT cleared here, and must not be "fixed" to clear it.
# This hook cannot observe whether the save actually happened — it emits context and exits
# long before the agent acts on it, and on PreCompact the agent may never act on it at all.
# Clearing here would drop the artifact on the floor whenever the save is skipped. Leaving
# the queue intact is precisely what lets dk-session-start-orient.sh act as the backstop; the
# truncate happens there, once a save is acknowledged. Re-nudging is cheap, losing is not.
exit 0
