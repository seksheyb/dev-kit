#!/usr/bin/env bash
# plugin-path-resolution.test.sh — the test that would have caught the whole class.
#
# Every script the corpus tells an agent to RUN has to resolve from a consuming project's cwd, not
# just from inside the dev-kit repo. That distinction is the entire bug this file exists for:
# `node plugins/dk/bin/model-route.mjs` works perfectly when you test it from the dev-kit checkout
# and fails in every project that installs the plugin, because `plugins/` exists in exactly one of
# those two places. Three real projects went down before anyone noticed.
#
# So this test never runs from the repo. It builds a throwaway directory that looks like a consuming
# project — no `plugins/`, no `.claude/bin/` — puts the plugin `bin/` dirs on PATH the way Claude
# Code does, cds in, and asserts the corpus's invocation forms actually work there.
#
# The convention under test is documented in dev-kit-core/references/plugin-paths.md.
#
# Exit 0 = all assertions passed.

set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DK_BIN="$ROOT/plugins/dk/bin"
CORE_BIN="$ROOT/plugins/dev-kit-core/bin"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

FAIL=0
pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# ---------------------------------------------------------------------------
# The simulated consuming project. Deliberately bare: this is what a scaffolded project looks
# like once nothing is vendored into it.
# ---------------------------------------------------------------------------
mkdir -p "$WORK/proj/src"
cd "$WORK/proj" || exit 2

# Exactly what Claude Code does with an enabled plugin's bin/.
export PATH="$DK_BIN:$CORE_BIN:$PATH"

# ---------------------------------------------------------------------------
# 1. Every executable the corpus invokes as a bare command resolves here.
# ---------------------------------------------------------------------------
EXECUTABLES="model-route.mjs complexity-score.mjs dk-converge.mjs dev-kit-core-root"

for exe in $EXECUTABLES; do
  command -v "$exe" >/dev/null 2>&1
  check "bare command resolves from a consuming-project cwd: $exe" "$?"
done

# ---------------------------------------------------------------------------
# 2. …and each is actually executable with a shebang. PATH resolution is worth nothing if the
#    file is not marked executable or has no interpreter line — and both are easy to lose in a
#    copy, an archive, or a careless chmod.
# ---------------------------------------------------------------------------
for exe in $EXECUTABLES; do
  p="$(command -v "$exe" 2>/dev/null)"
  [ -n "$p" ] && [ -x "$p" ]
  check "executable bit is set: $exe" "$?"
  head -c 2 "$p" 2>/dev/null | grep -q '#!'
  check "carries a shebang: $exe" "$?"
done

# ---------------------------------------------------------------------------
# 3. The router runs and decides, from this cwd, with nothing vendored.
# ---------------------------------------------------------------------------
DESC='{"agent":"verifier","profile":"coding","surface":"workflow","signals":{"novelty":"low","logic":"medium","ambiguity":"low","tests":"new","files":["src/a.ts"]},"context":{"gateFeeding":false,"dependsOn":0,"dependents":2}}'
OUT="$(printf '%s' "$DESC" | model-route.mjs --caller path-resolution-test --json 2>&1)"
check "model-route.mjs decides from a consuming-project cwd with no .claude/bin/" "$?" "$OUT"
printf '%s' "$OUT" | grep -q '"model"'
check "model-route.mjs output carries a model decision" "$?" "$OUT"

# The scorer's usage error is proof it loaded its config AND its routing-engine.mjs import — a
# missing sibling import dies with ERR_MODULE_NOT_FOUND before it ever reaches argument parsing.
SOUT="$(complexity-score.mjs 2>&1)"; SRC=$?
[ "$SRC" = "2" ]
check "complexity-score.mjs reaches its own usage check (import closure intact)" "$?" "rc=$SRC $SOUT"
printf '%s' "$SOUT" | grep -qi 'ERR_MODULE_NOT_FOUND'
check "complexity-score.mjs does NOT fail on a missing local import" "$([ $? = 0 ] && echo 1 || echo 0)" "$SOUT"

# ---------------------------------------------------------------------------
# 4. The plugin-root helper resolves this plugin's real installed root, from here.
# ---------------------------------------------------------------------------
CORE_ROOT="$(dev-kit-core-root 2>&1)"
check "dev-kit-core-root runs from a consuming-project cwd" "$?" "$CORE_ROOT"
[ -d "$CORE_ROOT/references/workflows" ]
check "dev-kit-core-root resolves to a root containing references/workflows/" "$?" "$CORE_ROOT"

# ---------------------------------------------------------------------------
# 5. `node <name>` must NOT be how the corpus invokes these — node resolves its script argument
#    against the cwd, never PATH, so a `node model-route.mjs` in any command or agent is broken
#    in every project. Prove the failure mode is real, then prove nobody ships it.
# ---------------------------------------------------------------------------
node model-route.mjs </dev/null >/dev/null 2>&1
check "'node model-route.mjs' genuinely fails from a foreign cwd (the trap this guards)" \
  "$([ $? != 0 ] && echo 0 || echo 1)"

# ---------------------------------------------------------------------------
# 6. No markdown in the corpus tells anyone to run a repo-relative or project-vendored path.
#    Scans invocation sites only; prose that documents dev-kit's own source layout is fine.
# ---------------------------------------------------------------------------
cd "$ROOT" || exit 2

# plugin-paths.md is excluded from both scans below: it is the document that names these broken
# forms in order to forbid them, so it is the one file allowed to contain them.
BAD_NODE="$(grep -rn 'node plugins/[a-z-]*/bin/' --include='*.md' plugins/ 2>/dev/null \
  | grep -v 'plugin-paths.md' || true)"
check "no command/agent/skill markdown invokes 'node plugins/<plugin>/bin/…'" \
  "$([ -z "$BAD_NODE" ] && echo 0 || echo 1)" "$BAD_NODE"

BAD_VENDOR="$(grep -rn '\.claude/bin/[a-z-]*\.mjs' --include='*.md' plugins/ 2>/dev/null \
  | grep -v 'plugins/dk/commands/bootstrap/' \
  | grep -v 'plugin-paths.md' \
  | grep -v 'never' || true)"
check "no markdown instructs running a vendored .claude/bin/ script" \
  "$([ -z "$BAD_VENDOR" ] && echo 0 || echo 1)" "$BAD_VENDOR"

BAD_SCRIPTPATH="$(grep -rn 'scriptPath: *"plugins/' --include='*.md' plugins/ 2>/dev/null || true)"
check "no scriptPath is repo-relative" \
  "$([ -z "$BAD_SCRIPTPATH" ] && echo 0 || echo 1)" "$BAD_SCRIPTPATH"

# Every file that hands Workflow a <dev-kit-core> path must also say how to resolve it.
MISSING_NOTE=""
for f in $(grep -rl '<dev-kit-core>/references/workflows' --include='*.md' plugins/ 2>/dev/null); do
  grep -q 'dev-kit-core-root' "$f" || MISSING_NOTE="$MISSING_NOTE $f"
done
check "every <dev-kit-core> scriptPath site names dev-kit-core-root as the resolver" \
  "$([ -z "$MISSING_NOTE" ] && echo 0 || echo 1)" "$MISSING_NOTE"

# ---------------------------------------------------------------------------
# 7. Every workflow script a scriptPath names actually exists under the plugin root the helper
#    resolves to — a live check that the placeholder points at something real.
# ---------------------------------------------------------------------------
MISSING_SCRIPT=""
for s in $(grep -rho '<dev-kit-core>/references/workflows/[a-z0-9-]*\.workflow\.mjs' --include='*.md' plugins/ 2>/dev/null | sort -u); do
  rel="${s#<dev-kit-core>/}"
  [ -f "$ROOT/plugins/dev-kit-core/$rel" ] || MISSING_SCRIPT="$MISSING_SCRIPT $rel"
done
check "every workflow script named by a scriptPath exists" \
  "$([ -z "$MISSING_SCRIPT" ] && echo 0 || echo 1)" "$MISSING_SCRIPT"

echo
if [ "$FAIL" = "0" ]; then echo "all assertions passed"; else echo "FAILURES"; fi
exit "$FAIL"
