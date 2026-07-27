#!/usr/bin/env bash
# Regression guard for the "option/step name promises PR creation, body never
# does it" defect class (see docs/audits/kickoff-duplication-audit).
#
# Any SKILL.md heading (###/####/##) whose title promises creating a pull
# request or MR ("create a pull request", "create PR", "push and create...")
# must contain a `gh pr create` or `glab mr create` invocation somewhere in
# its own body, before the next heading of the same or shallower level.
#
# This repo has no CI/test harness — run this manually (or wire it into CI
# later) whenever a skill's PR/MR-creation option is touched.
#
# Usage: scripts/check-skill-pr-promises.sh
# Exit 0 + "OK" line: no violations found.
# Exit 1 + one line per violation: a heading promises a PR/MR but never
# invokes gh/glab to create one.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0

while IFS= read -r -d '' file; do
  violations="$(awk -v file="$file" '
    BEGIN { in_section=0; promise=0; has_gh=0 }
    /^#{2,4}[ \t]/ {
      if (in_section && promise && !has_gh) {
        print file ":" start_line ": \"" heading "\" promises PR/MR creation but its body has no gh pr create / glab mr create"
      }
      in_section=1
      has_gh=0
      heading=$0
      start_line=NR
      promise = (heading ~ /[Cc]reate[^\n]*([Pp]ull [Rr]equest|PR\b|[Mm]erge [Rr]equest|MR\b)/) \
             || (heading ~ /[Pp]ush[^\n]*[Cc]reate/)
      next
    }
    in_section && /gh pr create|glab mr create/ { has_gh=1 }
    END {
      if (in_section && promise && !has_gh) {
        print file ":" start_line ": \"" heading "\" promises PR/MR creation but its body has no gh pr create / glab mr create"
      }
    }
  ' "$file")"

  if [ -n "$violations" ]; then
    echo "$violations"
    fail=1
  fi
done < <(find "$repo_root/plugins" -path '*/skills/*/SKILL.md' -print0)

if [ "$fail" -ne 0 ]; then
  echo "FAIL: one or more skill headings promise PR/MR creation without a gh/glab invocation." >&2
  exit 1
fi

echo "OK: every skill heading promising PR/MR creation has a matching gh pr create / glab mr create."
