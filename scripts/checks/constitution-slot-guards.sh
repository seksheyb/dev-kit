#!/usr/bin/env bash
# Regression guard for two defect classes in the `constitution` skill:
#
#   1. A skill is told to fill a template's placeholders with concrete values, but nothing
#      in the skill elicits those values. On a greenfield project there is nothing to infer
#      from, so the only ways to satisfy the instruction are to fabricate values or stall.
#      The fix requires a real elicitation pass AND an explicit no-human-available path
#      that defers rather than inventing or blocking.
#   2. A cross-asset contract is carried by prose matching instead of a named slot: one
#      asset is told to look for something "naturally under" some section of another asset,
#      with no stable identifier on either side. Here: code-documenter resolving its
#      docstring format from the project constitution.
#
# This repo has no CI and no test harness (it is a markdown prompt-asset repo) — this
# script is NOT wired into any pipeline. Run it by hand after editing the files below,
# before merging, to catch a regression back into either bug.
#
# Usage: bash scripts/checks/constitution-slot-guards.sh
# Exit code: 0 = all checks passed, 1 = at least one check failed.

set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

fail=0

TEMPLATE="plugins/dev-kit-core/skills/constitution/constitution-template.md"
CONST_SKILL="plugins/dev-kit-core/skills/constitution/SKILL.md"
CD_FILE="plugins/dev-kit-core/skills/code-documenter/SKILL.md"

echo "== Check 1: the constitution template carries a NAMED docstring-format slot =="
if [ ! -f "$TEMPLATE" ]; then
  echo "FAIL: $TEMPLATE not found"
  fail=1
else
  c1_fail=0

  # The heading is the machine-readable anchor code-documenter searches for. Its text and
  # level are the contract — renaming or demoting it silently breaks tier-1 resolution.
  grep -qE '^### Documentation Standard[[:space:]]*$' "$TEMPLATE" || {
    echo "FAIL: no verbatim '### Documentation Standard' heading in the template"; c1_fail=1; }

  # The placeholder token must exist so an unfilled slot is detectable as unfilled.
  grep -q '\[DOCUMENTATION_STANDARD\]' "$TEMPLATE" || {
    echo "FAIL: no [DOCUMENTATION_STANDARD] placeholder token in the template"; c1_fail=1; }

  # An unreplaced token must be the documented signal for "undecided" — otherwise a
  # deferring run writes "TBD"/"none" and code-documenter reads it as a real standard.
  grep -qi 'unreplaced' "$TEMPLATE" || {
    echo "FAIL: the template no longer states that an unreplaced token is the undecided signal"
    c1_fail=1; }

  if [ "$c1_fail" -eq 0 ]; then
    echo "PASS: template defines '### Documentation Standard' + [DOCUMENTATION_STANDARD]"
  else
    fail=1
  fi
fi

echo
echo "== Check 2: code-documenter's tier 1 looks for the named slot =="
if [ ! -f "$CD_FILE" ]; then
  echo "FAIL: $CD_FILE not found"
  fail=1
else
  # Isolate the Tier 1 block so a stray mention elsewhere in the file cannot satisfy this.
  tier1="$(awk '/^\*\*Tier 1 —/{f=1} f&&/^\*\*Tier 2 —/{exit} f' "$CD_FILE")"
  c2_fail=0

  [ -n "$tier1" ] || {
    echo "FAIL: could not locate the Tier 1 block in $CD_FILE"; c2_fail=1; }

  echo "$tier1" | grep -q 'Documentation Standard' || {
    echo "FAIL: tier 1 does not name the '### Documentation Standard' slot — it is back to"
    echo "      prose-matching only, which is what the fix removed"
    c2_fail=1; }

  # An unfilled slot must fall through, not be read as a standard.
  echo "$tier1" | grep -q 'DOCUMENTATION_STANDARD' || {
    echo "FAIL: tier 1 does not treat an unreplaced [DOCUMENTATION_STANDARD] token as silent"
    c2_fail=1; }

  if [ "$c2_fail" -eq 0 ]; then
    echo "PASS: code-documenter tier 1 resolves via the named slot and falls through when unfilled"
  else
    fail=1
  fi
fi

echo
echo "== Check 3: the constitution skill actually elicits greenfield values =="
if [ ! -f "$CONST_SKILL" ]; then
  echo "FAIL: $CONST_SKILL not found"
  fail=1
else
  c3_fail=0

  # (a) A dedicated elicitation section must exist, keyed on the greenfield case.
  grep -qE '^## Greenfield Elicitation Pass[[:space:]]*$' "$CONST_SKILL" || {
    echo "FAIL: no '## Greenfield Elicitation Pass' section — nothing elicits the values the"
    echo "      skill is told to fill the template with"
    c3_fail=1; }

  # (b) The trigger must distinguish greenfield from brownfield, so a repo that CAN be
  #     inferred from is not forced through an interview.
  grep -qi 'brownfield' "$CONST_SKILL" || {
    echo "FAIL: no brownfield/greenfield distinction — the interview is unconditional"
    c3_fail=1; }

  # (c) The question set must be bounded, not an open-ended interview.
  grep -qiE 'maximum[^.]{0,20}questions' "$CONST_SKILL" || {
    echo "FAIL: no stated maximum on the number of elicitation questions"; c3_fail=1; }

  # (d) The question set must be derived from the template, so the two stay in step.
  grep -q 'constitution-template.md' "$CONST_SKILL" || {
    echo "FAIL: the elicitation pass is not anchored to constitution-template.md"; c3_fail=1; }

  # (e) The elicitation pass must cover the named documentation slot, or the slot added to
  #     the template never gets filled on a greenfield project.
  grep -q 'DOCUMENTATION_STANDARD' "$CONST_SKILL" || {
    echo "FAIL: the elicitation pass does not ask about [DOCUMENTATION_STANDARD]"; c3_fail=1; }

  if [ "$c3_fail" -eq 0 ]; then
    echo "PASS: bounded, template-derived greenfield elicitation exists and covers the doc slot"
  else
    fail=1
  fi
fi

echo
echo "== Check 4: the no-human-available path is explicit and does not stall or fabricate =="
if [ ! -f "$CONST_SKILL" ]; then
  echo "FAIL: $CONST_SKILL not found"
  fail=1
else
  c4_fail=0

  # A named section, so an executing model on an unattended path can find it.
  grep -qE '^### When no human is available to answer[[:space:]]*$' "$CONST_SKILL" || {
    echo "FAIL: no '### When no human is available to answer' section — an unattended run has"
    echo "      no defined behaviour and will stall on the interview"
    c4_fail=1; }

  # Isolate that section so the assertions below cannot be satisfied by unrelated prose.
  nohuman="$(awk '/^### When no human is available to answer/{f=1;next} f&&/^#{2,3} /{exit} f' \
    "$CONST_SKILL")"

  echo "$nohuman" | grep -qiE 'do not stall|never stall' || {
    echo "FAIL: the no-human path does not forbid stalling"; c4_fail=1; }

  echo "$nohuman" | grep -qiE 'do not invent|not fabricate|never fabricate|do not substitute' || {
    echo "FAIL: the no-human path does not forbid inventing principles"; c4_fail=1; }

  # The deferral must be recorded, not silent — this is what :48 permits and what makes the
  # unfilled slot legible to downstream skills.
  echo "$nohuman" | grep -q 'TODO(' || {
    echo "FAIL: the no-human path does not record deferred slots as TODO(...) entries"
    c4_fail=1; }

  echo "$nohuman" | grep -qi 'unreplaced' || {
    echo "FAIL: the no-human path does not say to leave undecided tokens unreplaced"; c4_fail=1; }

  # Deferral is only safe because downstream treats an unfilled constitution as non-fatal.
  echo "$nohuman" | grep -qi 'not fatal' || {
    echo "FAIL: the no-human path no longer states the downstream not-fatal contract"; c4_fail=1; }

  if [ "$c4_fail" -eq 0 ]; then
    echo "PASS: unattended runs defer with justification instead of stalling or fabricating"
  else
    fail=1
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks FAILED."
fi
exit "$fail"
