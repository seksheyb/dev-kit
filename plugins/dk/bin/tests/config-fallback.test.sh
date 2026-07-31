#!/usr/bin/env bash
# config-fallback.test.sh — keeps alive the fallback that dropping the vendored config relies on.
#
# `/dk:bootstrap:init` no longer copies `complexity.config.json` into `.claude/bin/`, and
# `dk-converge` removes copies that carry no project content. Both rest on one claim: with no
# project config present, the tools fall through to the plugin's own and produce the SAME decision.
# If that ever stopped holding, removing a config would silently change routing everywhere — the
# quiet version of the outage this whole change is about.
#
# So: run both tools twice over the same inputs — once with a project config that is byte-identical
# to the plugin's, once with none at all — and require identical output on both.
#
# It also pins the migration asymmetry that caused the outage, so nobody "fixes" it by accident:
# a pre-router config makes complexity-score.mjs warn and continue, and makes model-route.mjs die.
# That asymmetry is deliberate (model-route.mjs's own comment: "an invalid one is fatal rather than
# defaulted"). It is safe only because no config is vendored any more.
#
# Exit 0 = all assertions passed.

set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DK_BIN="$ROOT/plugins/dk/bin"
PLUGIN_CONFIG="$DK_BIN/complexity.config.json"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

FAIL=0
pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

export PATH="$DK_BIN:$PATH"

# ---------------------------------------------------------------------------
# A plan with two tracks of different shapes, so a config difference would show up somewhere.
# ---------------------------------------------------------------------------
mk_plan() {
  cat > "$1" <<'EOF'
# Phase 04 plan

## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
| 1 | track-auth-model | 04-01 | none | `src/auth/user.ts` | sonnet | high |
| 2 | track-docs | 04-02 | 04-01 | `docs/readme.md` | haiku | low |

**Track complexity**
- `track-auth-model` — complexity: files: src/auth/user.ts; novelty: high; logic: medium; ambiguity: low; tests: new
- `track-docs` — complexity: files: docs/readme.md; novelty: low; logic: low; ambiguity: low; tests: none
EOF
}

DESC_FILE_CONTENT='{
  "verifier":  {"agent":"verifier","profile":"coding","surface":"workflow","signals":{"novelty":"high","logic":"high","ambiguity":"medium","tests":"new","files":["src/auth/user.ts","src/payments/charge.ts"]},"context":{"gateFeeding":true,"dependsOn":1,"dependents":3}},
  "doc-writer":{"agent":"doc-writer","profile":"writing","surface":"agent","signals":{"novelty":"low","logic":"low","ambiguity":"low","tests":"none","files":["docs/readme.md"]},"context":{"gateFeeding":false,"dependsOn":0,"dependents":0}}
}'

# with = a project config byte-identical to the plugin's; without = nothing vendored
mkdir -p "$WORK/with/.claude/bin" "$WORK/without"
cp "$PLUGIN_CONFIG" "$WORK/with/.claude/bin/complexity.config.json"
for d in with without; do
  mk_plan "$WORK/$d/plan.md"
  printf '%s' "$DESC_FILE_CONTENT" > "$WORK/$d/descriptors.json"
done

run_in() {  # run_in <dir> <cmd...> — runs in that dir; the CALLER decides what to capture.
  ( cd "$WORK/$1" && shift && "$@" )
}

# Both tools report which config they loaded, and that path legitimately differs between the two
# runs — it is the one field that MUST differ. Strip it so the comparison is about the decision.
strip_config_path() { sed -E 's#("config": ")[^"]*#\1<path>#; s#^config: [^ ]+#config: <path>#'; }

# ---------------------------------------------------------------------------
# 1. model-route.mjs — identical decisions with and without a project config.
# ---------------------------------------------------------------------------
R_WITH="$(run_in with model-route.mjs --caller fallback-test --batch descriptors.json 2>&1)";  RC_WITH=$?
R_WITHOUT="$(run_in without model-route.mjs --caller fallback-test --batch descriptors.json 2>&1)"; RC_WITHOUT=$?

check "model-route.mjs exits 0 WITH a project config"    "$RC_WITH"    "$R_WITH"
check "model-route.mjs exits 0 WITHOUT a project config" "$RC_WITHOUT" "$R_WITHOUT"
[ "$R_WITH" = "$R_WITHOUT" ]
check "model-route.mjs: identical decisions with and without a project config" "$?" \
  "$(diff <(printf '%s\n' "$R_WITH") <(printf '%s\n' "$R_WITHOUT") | head -20)"

# ---------------------------------------------------------------------------
# 2. complexity-score.mjs — same, on both the human and the --json path.
# ---------------------------------------------------------------------------
for mode in "--json" ""; do
  # shellcheck disable=SC2086
  S_WITH="$(run_in with complexity-score.mjs plan.md $mode 2>/dev/null | strip_config_path)"
  # shellcheck disable=SC2086
  S_WITHOUT="$(run_in without complexity-score.mjs plan.md $mode 2>/dev/null | strip_config_path)"
  [ "$S_WITH" = "$S_WITHOUT" ]
  check "complexity-score.mjs${mode:+ $mode}: identical output with and without a project config" "$?" \
    "$(diff <(printf '%s\n' "$S_WITH") <(printf '%s\n' "$S_WITHOUT") | head -20)"
done

# The --gate verdict must match too — that is the one that fails a plan.
run_in with complexity-score.mjs plan.md --gate --json >/dev/null 2>&1;    G_WITH=$?
run_in without complexity-score.mjs plan.md --gate --json >/dev/null 2>&1; G_WITHOUT=$?
[ "$G_WITH" = "$G_WITHOUT" ]
check "complexity-score.mjs --gate: identical exit code with and without a project config" "$?" \
  "with=$G_WITH without=$G_WITHOUT"

# ---------------------------------------------------------------------------
# 3. Neither tool emits a migration warning when no project config is present. An absent config is
#    the desired state now, so it must be silent — a warning here would train operators to "fix" it
#    by vendoring a copy, which is the behavior that broke three projects.
# ---------------------------------------------------------------------------
NOISE="$(run_in without complexity-score.mjs plan.md --json 2>&1 >/dev/null)"
[ -z "$NOISE" ]
check "complexity-score.mjs is silent on stderr with no project config" "$?" "$NOISE"

NOISE_R="$(run_in without model-route.mjs --caller fallback-test --batch descriptors.json 2>&1 >/dev/null)"
[ -z "$NOISE_R" ]
check "model-route.mjs is silent on stderr with no project config" "$?" "$NOISE_R"

# ---------------------------------------------------------------------------
# 4. The migration asymmetry, pinned. A pre-router config (no effortParamSupport /
#    onInexpressibleEffort) is survivable for the scorer and fatal for the router — exactly the
#    pair of behaviors the outage report describes. Both are deliberate; assert them so a future
#    change to either is a conscious one.
# ---------------------------------------------------------------------------
mkdir -p "$WORK/legacy/.claude/bin"
mk_plan "$WORK/legacy/plan.md"
printf '%s' "$DESC_FILE_CONTENT" > "$WORK/legacy/descriptors.json"
node -e '
  const fs = require("fs");
  const cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  delete cfg.effortParamSupport;
  delete cfg.onInexpressibleEffort;
  fs.writeFileSync(process.argv[2], JSON.stringify(cfg, null, 2));
' "$PLUGIN_CONFIG" "$WORK/legacy/.claude/bin/complexity.config.json"

L_ERR="$(run_in legacy complexity-score.mjs plan.md --json 2>&1 >/dev/null)"; L_RC=$?
# ^ stderr only: 2>&1 binds stderr to the capture pipe first, then stdout is sent to /dev/null.
check "pre-router config: complexity-score.mjs still runs" "$L_RC" "$L_ERR"
printf '%s' "$L_ERR" | grep -q 'predates the model router'
check "pre-router config: complexity-score.mjs warns about it" "$?" "$L_ERR"

run_in legacy model-route.mjs --caller fallback-test --batch descriptors.json >/dev/null 2>&1
[ "$?" = "2" ]
check "pre-router config: model-route.mjs still dies (exit 2) — deliberate, not a bug to soften" "$?"

echo
if [ "$FAIL" = "0" ]; then echo "all assertions passed"; else echo "FAILURES"; fi
exit "$FAIL"
