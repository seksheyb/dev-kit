#!/usr/bin/env bash
# Guards for the `dk` orchestration plugin.
#
# The `dk` commands are NOT like dev-kit-core's commands. A core command IS the asset — it carries
# methodology, and it is long on purpose. A `dk` command only DISPATCHES an asset, and is bound by
# the six content categories in RUNBOOK.md. These guards are what stop `dk` drifting into core's
# shape and re-inflating the duplication that milestones M1-M5 of the kickoff-duplication audit
# stripped out.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DK="$ROOT/plugins/dk"
CMDS="$DK/commands"
RUNBOOK="$DK/RUNBOOK.md"
fail=0
note() { printf '  %s\n' "$1"; }
bad() { printf 'FAIL: %s\n' "$1"; fail=1; }

# The three orchestrator commands are exempt from the body-length and state-purity guards:
# they exist precisely to read state and hold the walk logic.
ORCHESTRATOR='^(runbook|status|run)\.md$'

step_commands() {
  find "$CMDS" -mindepth 2 -name '*.md' | sort
}

# ---------------------------------------------------------------------------
# Guard 1 — six-category: a step command's body stays thin.
# A body over 12 lines means methodology leaked out of an asset and into the runbook layer.
# ---------------------------------------------------------------------------
echo "Guard 1: six-category (thin bodies)"
while read -r f; do
  body=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$f" | grep -vE '^\s*$' | grep -vE '^→ next:')
  lines=$(printf '%s\n' "$body" | grep -c . || true)
  [ "$lines" -gt 12 ] && bad "${f#$ROOT/}: body is $lines lines (max 12) — the excess belongs in the asset"
  grep -qE '^\s*(#{1,6})\s' <<<"$body" && bad "${f#$ROOT/}: contains headings — output templates belong in the asset"
  grep -qE 'docs/(global|milestones|state)/[a-zA-Z<]' <<<"$body" \
    && bad "${f#$ROOT/}: contains a doc path — assets derive paths from the sitemap plus ids"
done < <(step_commands)
[ $fail -eq 0 ] && note "ok"

# ---------------------------------------------------------------------------
# Guard 2 — manual-mode escape hatch: no step command may require orchestrator state.
# This is the invariant that keeps the machinery from ever becoming load-bearing. Every one of the
# step commands must run cold, standalone, out of order, with no state files present.
# ---------------------------------------------------------------------------
echo "Guard 2: manual-mode purity (no state reads outside the orchestrator)"
g2=0
while read -r f; do
  base=$(basename "$f")
  [[ "$base" =~ $ORCHESTRATOR ]] && continue
  if grep -qE '\.dk-state|docs/state/STATE\.md|docs/state/journal' "$f"; then
    bad "${f#$ROOT/}: reads orchestrator state — only /dk:run and /dk:status may"; g2=1
  fi
done < <(find "$CMDS" -name '*.md')
[ $g2 -eq 0 ] && note "ok"

# ---------------------------------------------------------------------------
# Guard 3 — every step command declares a gate class the orchestrator can act on.
# ---------------------------------------------------------------------------
echo "Guard 3: gate declarations"
g3=0
while read -r f; do
  fm=$(awk 'BEGIN{n=0} /^---$/{n++; if(n==2) exit; next} n==1' "$f")
  gate=$(grep -oE '^gate:\s*\S+' <<<"$fm" | awk '{print $2}')
  case "$gate" in
    always) ;;
    auto)     grep -qE '^precondition:' <<<"$fm" || bad "${f#$ROOT/}: gate:auto without a precondition:" ;;
    verdict)  grep -qE '^on:'           <<<"$fm" || bad "${f#$ROOT/}: gate:verdict without an on:" ;;
    operator) grep -qE '^asks:'         <<<"$fm" || bad "${f#$ROOT/}: gate:operator without an asks:" ;;
    "")       bad "${f#$ROOT/}: no gate: declared"; g3=1 ;;
    *)        bad "${f#$ROOT/}: unknown gate class '$gate'"; g3=1 ;;
  esac
  grep -qE '^description:' <<<"$fm" || bad "${f#$ROOT/}: no description:"
done < <(step_commands)
[ $g3 -eq 0 ] && note "ok"

# ---------------------------------------------------------------------------
# Guard 4 — spine/command agreement: every command appears in RUNBOOK.md, and every
# /dk: reference in RUNBOOK.md resolves to a real command file.
# ---------------------------------------------------------------------------
echo "Guard 4: RUNBOOK <-> commands agreement"
g4=0
while read -r f; do
  rel="${f#$CMDS/}"; rel="${rel%.md}"
  grep -qF "/dk:${rel//\//:}" "$RUNBOOK" || { bad "${f#$ROOT/}: not referenced in RUNBOOK.md"; g4=1; }
done < <(step_commands)
while read -r ref; do
  path="$CMDS/${ref//://}.md"; path="${path/\/dk\//}"
  target="$CMDS/$(sed 's|^/dk:||; s|:|/|g' <<<"$ref").md"
  [ -f "$target" ] || { bad "RUNBOOK.md references $ref, which has no command file"; g4=1; }
done < <(grep -oE '/dk:[a-z0-9-]+:[a-z0-9-]+' "$RUNBOOK" | sort -u)
[ $g4 -eq 0 ] && note "ok"

# ---------------------------------------------------------------------------
# Guard 5 — no per-command ordering. Sequencing belongs to RUNBOOK.md and the orchestrator,
# in one place. Commands once carried a `→ next:` breadcrumb; it was a second copy of the
# sequence that nothing could verify — guard 4 checks that a referenced command EXISTS, never
# that the order is still true — so reordering a stage rotted 65 bodies silently. Removed.
# `/dk:status` and `/dk:runbook` answer "what's next" from the single source instead.
# ---------------------------------------------------------------------------
echo "Guard 5: no per-command ordering"
g5=0
while read -r f; do
  grep -qE '^→ next:|^next:' "$f" \
    && { bad "${f#$ROOT/}: carries its own successor — ordering lives in RUNBOOK.md only"; g5=1; }
done < <(step_commands)
[ $g5 -eq 0 ] && note "ok"

# ---------------------------------------------------------------------------
# Guard 6 — state-key discipline. `.dk-state` is a slim resume marker with a closed key set
# (references/state-contract.md). The failure mode it guards against is key-creep: a `note:` here,
# a `wave_progress:` there, until the resume head has become the journal and every resume pays to
# read it. CI cannot inspect a runtime .dk-state, but it CAN check that the two commands allowed to
# touch it never name a key the contract does not define.
# ---------------------------------------------------------------------------
echo "Guard 6: state-key discipline"
CONTRACT="$DK/references/state-contract.md"
g6=0
if [ ! -f "$CONTRACT" ]; then
  bad "references/state-contract.md is missing — /dk:run and /dk:status both cite it"; g6=1
else
  # keys are the `foo:` lines inside the contract's fenced schema block
  allowed=$(awk '/^```$/{f=!f; next} f' "$CONTRACT" | grep -oE '^#? *[a-z_]+:' | tr -d '# :' | sort -u)
  # frontmatter keys are not state keys — run.md necessarily names them when explaining gates
  frontmatter=$(printf '%s\n' gate precondition on asks blocking description argument-hint exclusive-with)
  for c in run status; do
    f="$CMDS/$c.md"
    used=$(grep -oE '`[a-z_-]+:`' "$f" | tr -d '`:' | sort -u)
    for k in $used; do
      grep -qx "$k" <<<"$allowed" && continue
      grep -qx "$k" <<<"$frontmatter" && continue
      bad "commands/$c.md names state key '$k', which state-contract.md does not define"; g6=1
    done
  done
fi
[ $g6 -eq 0 ] && note "ok"

echo
if [ $fail -eq 0 ]; then echo "pipeline-command-guards: PASS ($(step_commands | wc -l) step commands)"; else echo "pipeline-command-guards: FAIL"; fi
exit $fail
