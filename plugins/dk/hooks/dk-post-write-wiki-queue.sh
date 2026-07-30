#!/usr/bin/env bash
# dk-post-write-wiki-queue.sh — PostToolUse (matcher Write|Edit): the CAPTURE end of the
# wiki queue. Its whole job is to make forgetting impossible at zero cost.
#
# This hook is SILENT BY DESIGN. It never prints, not even on the happy path. It fires on
# every Write and Edit in every dk session, so any output at all would be noise on the
# overwhelmingly common case where the write is ordinary source code. Writing state and
# saying nothing is the entire contract; the drain end (dk-stop-wiki-drain.sh) does the
# talking, once, when there is something worth saying.
#
# Contracts: ../CONTRACTS.md — "The wiki queue" and "Path → type". Nothing here re-decides
# either; the pattern table below is a transcription of that table and must stay one.

. "$(dirname "$0")/lib/dk-common.sh"

dk_read_stdin
dk_guard
dk_flag_off wiki && exit 0

FP="$(dk_json tool_input.file_path)"
[ -n "$FP" ] || exit 0

# Match relative to the repo root, not as written. The agent writes some paths absolute and
# some relative to cwd; the queue and the path→type table are both defined relative to the
# root, so normalize once here rather than teaching every pattern both shapes.
ROOT="$(dk_root)"
case "$FP" in
  "$ROOT"/*) REL="${FP#"$ROOT"/}" ;;
  /*)        exit 0 ;;              # absolute and outside the project — not ours to queue
  ./*)       REL="${FP#./}" ;;
  *)         REL="$FP" ;;
esac
[ -n "$REL" ] || exit 0

# Path → type, from CONTRACTS.md. Anchored regexes rather than shell globs because a glob's
# `*` also crosses `/`: `docs/milestones/*/RETROSPECTIVE.md` would silently swallow a phase
# directory's retro, and over-matching here is what turns a 17-note milestone into a 100-note
# one. `[^/]+` says "one segment" and means it.
DK_TYPE_PATTERNS=(
  '1|^docs/global/architecture/adr/[^/]+\.md$'
  '1|^docs/global/architecture/(SDD|ARCHITECTURE|cloud-design)\.md$'
  '1|^docs/global/project/constitution\.md$'
  '1|^docs/global/design/DESIGN\.md$'
  '2|^docs/state/debug/.+\.md$'
  '2|^docs/global/ops/postmortems/[^/]+\.md$'
  '3|^CLAUDE\.md$'
  '4|^docs/milestones/[^/]+/research/[^/]+\.md$'
  '4|^docs/global/requirements/PRD\.md$'
  '5|^docs/milestones/[^/]+/RETROSPECTIVE\.md$'
  '6|^docs/milestones/[^/]+/phases/[^/]+/reviews/round-[^/]+/findings\.md$'
  '6|^docs/milestones/[^/]+/phases/[^/]+/reviews/REVIEW\.md$'
)

TYPE=""
for entry in "${DK_TYPE_PATTERNS[@]}"; do
  if [[ $REL =~ ${entry#*|} ]]; then TYPE="${entry%%|*}"; break; fi
done
[ -n "$TYPE" ] || exit 0    # no match — invariant 4, say nothing and do nothing

# Type 3 is the one path that is not self-identifying. CLAUDE.md is edited constantly for
# reasons that have nothing to do with constraints, and queueing all of those would train
# the user to ignore the drain nudge — which costs every other type too.
#
# Tradeoff chosen: queue only on Edit, and only when the edited text itself mentions a
# constraint. An Edit's new_string/old_string is a narrow slice of the file, so a hit there
# is real evidence the Project Constraints section is what moved. A Write carries the whole
# file, whose constraints heading always matches regardless of what actually changed, and
# PostToolUse fires after the write so there is no prior content to diff against — the
# signal is unrecoverable, so a Write to CLAUDE.md is deliberately NOT queued. That costs at
# most one missed note on a full rewrite; the alternative costs the credibility of the nudge.
if [ "$TYPE" = "3" ]; then
  PAYLOAD="$(dk_json tool_input.new_string)$(dk_json tool_input.old_string)"
  printf '%s' "$PAYLOAD" | grep -qi 'constraint' || exit 0
fi

Q="$(dk_queue)"
mkdir -p "$(dirname "$Q")" 2>/dev/null || exit 0

# Append-only, never read. Consumers dedupe; the producer stays trivial so it cannot become
# a reason a Write is slow. One printf is a single small O_APPEND write, so concurrent
# sessions interleave lines rather than corrupting them.
printf '%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$TYPE" "$REL" >> "$Q" 2>/dev/null

exit 0
