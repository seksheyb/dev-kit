#!/usr/bin/env bash
# agents-config-consistency.test.sh — guards the "no model pinning" contract, on both
# sides where a pin could live: plugins/dk/bin/complexity.config.json's "agents" block,
# and the agent .md files' own frontmatter. Also checks the effortFloor entries that DO
# remain against agent-model-tiers.md's never-downgrade list.
#
# Per "Model pinning removed" in agent-model-tiers.md (supersedes the config-mirror
# section before it, and the earlier frontmatter-backstop framing before that): no
# agents.* config entry and no agent-definition frontmatter may carry a model key, for
# any agent — the router scores capability from real dispatch-descriptor signals only,
# every time, on every surface. This test's job changed from "does frontmatter match
# config" to "does anyone re-introduce a pin on either side" — a structural regression
# guard, not a cross-check between two sources of truth that both still exist.
#
# This test's whole point is drift detection, so it runs against the REAL repo config and
# REAL agent files — no fixtures. A fixture config would let this test pass while the real
# config silently rotted.
#
# Exit 0 = all assertions passed.

set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
CONFIG="$ROOT/plugins/dk/bin/complexity.config.json"
ROUTING_ENGINE="$ROOT/plugins/dk/bin/routing-engine.mjs"
CORE_AGENTS_DIR="$ROOT/plugins/dev-kit-core/agents"
DATA_AI_AGENTS_DIR="$ROOT/plugins/dev-kit-data-ai/agents"

FAIL=0
pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# ---------------------------------------------------------------------------
# 1. No agents.* entry carries a model key, for any agent — structural regression guard
#    against re-introducing a per-agent model pin now that dev-kit's shipped config scores
#    every agent from its descriptor's signals, gate-feeding or not.
# ---------------------------------------------------------------------------

MODEL_KEYS="$(node -e '
  const cfg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const [k, v] of Object.entries(cfg.agents || {})) {
    if (!k.startsWith("_") && v && Object.prototype.hasOwnProperty.call(v, "model")) console.log(k);
  }
' "$CONFIG")"
check "no agents.* entry carries a model key" \
  "$([ -z "$MODEL_KEYS" ] && echo 0 || echo 1)" "$MODEL_KEYS"

# ---------------------------------------------------------------------------
# 2. Every one of the 15 never-downgrade names has an effortFloor of "high" — the one pin
#    that DOES remain for this list. List hardcoded here from agent-model-tiers.md's
#    "Never downgrade" section (2026-07-29) — update both places together.
# ---------------------------------------------------------------------------

NEVER_DOWNGRADE="code-review-gate security-auditor penetration-tester compliance-auditor gate-automation gate-plan-review gate-reverse-engineer ui-checker verifier integration-checker nyquist-auditor design-reviewer ui-auditor eval-auditor plan-reviewer"

ND_FAILURES=""
for name in $NEVER_DOWNGRADE; do
  floor="$(node -e '
    const cfg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const entry = cfg.agents && cfg.agents[process.argv[2]];
    process.stdout.write(entry && entry.effortFloor ? entry.effortFloor : "");
  ' "$CONFIG" "$name")"
  if [ "$floor" != "high" ]; then
    ND_FAILURES="${ND_FAILURES}${name}: effortFloor=${floor:-<none>}; "
  fi
done
check "all 15 never-downgrade agents keep effortFloor: high" \
  "$([ -z "$ND_FAILURES" ] && echo 0 || echo 1)" "$ND_FAILURES"

# ---------------------------------------------------------------------------
# 3. Every agents entry's model/effortFloor values validate — reuse validateConfig.
# ---------------------------------------------------------------------------

VALIDATE_OUT="$(node -e '
  import("file://" + process.argv[1]).then(({ validateConfig }) => {
    const cfg = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
    try {
      validateConfig(cfg);
      console.log("VALID");
    } catch (e) {
      console.log("INVALID: " + e.message);
    }
  });
' "$ROUTING_ENGINE" "$CONFIG" 2>&1)"
check "validateConfig accepts the real config (including its agents block)" \
  "$(grep -q '^VALID$' <<<"$VALIDATE_OUT" && echo 0 || echo 1)" "$VALIDATE_OUT"

# ---------------------------------------------------------------------------
# 4. Every non-underscore agents key is a real agent .md file in the two dirs,
#    or is on the (currently empty) call-site-only allowlist below.
# ---------------------------------------------------------------------------

CALL_SITE_ONLY_ALLOWLIST=""

UNKNOWN_KEYS=""
KEYS="$(node -e '
  const cfg = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const k of Object.keys(cfg.agents || {})) {
    if (!k.startsWith("_")) console.log(k);
  }
' "$CONFIG")"
while IFS= read -r key; do
  [ -n "$key" ] || continue
  is_allowlisted=0
  for allowed in $CALL_SITE_ONLY_ALLOWLIST; do
    [ "$allowed" = "$key" ] && is_allowlisted=1 && break
  done
  if [ "$is_allowlisted" = 1 ]; then
    continue
  fi
  if [ ! -e "$CORE_AGENTS_DIR/$key.md" ] && [ ! -e "$DATA_AI_AGENTS_DIR/$key.md" ]; then
    UNKNOWN_KEYS="${UNKNOWN_KEYS}${key}; "
  fi
done <<<"$KEYS"
check "every agents key is a real agent file or on the call-site-only allowlist" \
  "$([ -z "$UNKNOWN_KEYS" ] && echo 0 || echo 1)" "$UNKNOWN_KEYS"

# ---------------------------------------------------------------------------
# 5. No agent .md's frontmatter carries a model: key — the symmetric structural guard on
#    the harness-level side of the same "no model pinning" contract check 1 enforces on
#    the config side.
# ---------------------------------------------------------------------------

FM_PINS=""
for dir in "$CORE_AGENTS_DIR" "$DATA_AI_AGENTS_DIR"; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*.md; do
    [ -e "$f" ] || continue
    fm_model="$(sed -n '/^---$/,/^---$/p' "$f" | grep -m1 '^model:' | sed 's/^model:[[:space:]]*//' | tr -d '[:space:]')"
    [ -n "$fm_model" ] && FM_PINS="${FM_PINS}$(basename "$f" .md)=${fm_model}; "
  done
done
check "no agent .md frontmatter carries a model key" \
  "$([ -z "$FM_PINS" ] && echo 0 || echo 1)" "$FM_PINS"

[ "$FAIL" = 0 ] && echo "PASS — agents-config-consistency.test.sh" || echo "FAIL — agents-config-consistency.test.sh"
exit "$FAIL"
