#!/usr/bin/env bash
# Reassemble the `dk` shard into a single KICKOFF-equivalent document.
#
# Why this exists: milestone M6 of the kickoff-duplication audit
# (docs/audits/kickoff-duplication-audit/) grades a SINGLE file against baseline/. Sharding KICKOFF
# into 65 command files destroyed that target. Rather than rewrite workflow.js, this reassembles the
# shard so M6 can grade the same text it always graded.
#
# It emits ONLY prompt bodies — frontmatter and `→ next:` breadcrumbs are shard scaffolding, not
# prompt content, and were never in KICKOFF. Order follows RUNBOOK.md, which is the spine.
#
#   ./scripts/checks/dk-concat.sh > /tmp/KICKOFF-equivalent.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CMDS="$ROOT/plugins/dk/commands"
RUNBOOK="$ROOT/plugins/dk/RUNBOOK.md"

body() {
  # `asks:` is prompt content — it is the operator-gate predicate, category 4 of the six, and in
  # KICKOFF it was the *(only if …)* marker. Emit it as that marker so M6 sees it.
  awk 'BEGIN{n=0} /^---$/{n++; if(n==2) exit; next} n==1 && /^asks:/ {
    sub(/^asks:[ \t]*"?/,""); sub(/"?[ \t]*$/,""); print "*(only if " $0 ")*"
  }' "$1"
  # everything after the closing --- of the frontmatter, minus the breadcrumb
  awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$1" | grep -vE '^→ next:'
}

# Walk the spine line by line. Each line is emitted as-is; where it references commands, their
# bodies are inlined directly after it. Spine + bodies together are what KICKOFF used to be, so
# this is the document M6 should grade.
emitted=" "
while IFS= read -r line; do
  printf '%s\n' "$line"
  for ref in $(grep -oE '/dk:[a-z0-9-]+:[a-z0-9-]+' <<<"$line" | sort -u); do
    case "$emitted" in *" $ref "*) continue ;; esac   # a command referenced twice is emitted once
    path="$CMDS/$(sed 's|^/dk:||; s|:|/|g' <<<"$ref").md"
    [ -f "$path" ] || continue
    emitted="$emitted$ref "
    body "$path"
  done
done < "$RUNBOOK"
