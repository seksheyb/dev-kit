#!/usr/bin/env bash
# dk-post-merge-graphify.sh — PostToolUse(Bash).
#
# After a track/wave merge lands, nudge an incremental graph refresh so the next reader of
# GRAPH_REPORT.md sees the code that was just integrated.
#
# WHY `git merge` is the correct trigger and not merely a convenient one:
#
#   1. graphify must NEVER run inside a worktree. Every track in a wave gets its own
#      worktree, and they all resolve docs/state/graphs/ to the same single output
#      directory — parallel tracks would race, and the survivor is whichever finished last:
#      a graph describing one track's branch and silently mislabelled as the repo's.
#   2. A merge is by definition post-integration and single-tree: the worktrees are done,
#      their code is in one branch, and the writer is the orchestrator. It is the one moment
#      in the wave where writing the graph is both safe and meaningful.
#
# And WHY a hook rather than a step in the RUNBOOK: merges happen an unpredictable number of
# times inside a single `sprint-execution` turn (one per track, plus conflict re-merges, plus
# whatever adhoc work landed). A command step fires once at a fixed position; it cannot know
# how many integrations happened inside the turn it follows, so it either misses refreshes or
# hard-codes a count that is wrong for every wave but one. The merge itself is the only
# reliable signal.

. "$(dirname "$0")/lib/dk-common.sh"

dk_read_stdin
dk_guard
dk_flag_off graphify && exit 0

# No graph yet means graphify was never opted into here — a merge is not the place to sell it.
[ -f "$(dk_root)/docs/state/graphs/graph.json" ] || exit 0

CMD="$(dk_json tool_input.command)"
[ -n "$CMD" ] || exit 0

# The command may be a compound line (`cd sub && git merge x`, `git fetch; git merge x`), so
# split on shell separators and judge each segment on its own. Judging the whole string at
# once misfires both ways: `git merge-base a b && git merge x` is a real merge that a
# whole-string exclusion would suppress.
dk_is_merge() {
  local seg="$1"

  # A real merge: `git merge <ref>` or `git -C <path> merge <ref>`. Matching whole tokens is
  # what keeps the substring "merge" from firing — `git log --merges` (merge + `s`),
  # `echo "merge"` (no git), and any path component like src/merge/util.ts (mid-token) all
  # fail this, because `merge` must start a token and end at whitespace or end-of-segment.
  printf '%s' "$seg" | grep -qE '(^|[[:space:]])git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?merge([[:space:]]|$)' || return 1

  # Not a merge *query*. `merge-base` already fails the pattern above (the `-` is not
  # whitespace); the explicit guard stays because a silent regression here is invisible —
  # it shows up only as spurious graph rebuilds nobody traces back to this file.
  printf '%s' "$seg" | grep -qE '(^|[[:space:]])git[[:space:]]+merge-base([[:space:]]|$)' && return 1

  # Not a merge being unwound or resumed. --abort and --quit leave the tree mid-flight or
  # reverted, so there is nothing new to graph; --continue finishes a merge whose own
  # invocation already fired this hook.
  printf '%s' "$seg" | grep -qE 'merge[[:space:]]+--(abort|quit|continue)([[:space:]]|$)' && return 1

  return 0
}

FIRED=""
# tr maps every separator character to a newline, which covers `;`, `&&`, `||` and `|` in one
# pass (the doubled forms just yield an extra empty segment, which matches nothing).
while IFS= read -r SEG; do
  [ -n "$SEG" ] || continue
  dk_is_merge "$SEG" && { FIRED=1; break; }
done <<EOF
$(printf '%s' "$CMD" | tr ';&|' '\n')
EOF

[ -n "$FIRED" ] || exit 0

dk_emit PostToolUse "dk graphify: a merge just landed — the wave is integrated and this is a single working tree, which is the only safe point to write docs/state/graphs/. Run the graphify skill with --update for an incremental refresh, so GRAPH_REPORT.md reflects the merged code before the next wave's planner reads it. One refresh per wave is enough; ignore further merge nudges until the wave's tracks are all merged."
exit 0
