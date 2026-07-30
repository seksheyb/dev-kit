#!/usr/bin/env bash
# model-route.test.sh — fixture tests for model-route.mjs and routing-engine.mjs.
#
# The router's value is that the decision is computed rather than picked, so these fixtures are
# built around the places where a hand-picked answer and a computed one diverge: a pin that
# overrides the signals, a floor that overrides the band, an effort the chosen model cannot
# actually be handed, and a descriptor that is malformed enough that any answer at all would be a
# guess. A router that always agrees with the caller is indistinguishable from no router.
#
# Every case runs against a FIXTURE config written into the temp workdir's .claude/bin/, never the
# repo's own complexity.config.json — otherwise these tests would silently start asserting whatever
# a project happened to tune, and tuning the project would break the test suite.
#
# Exit 0 = all assertions passed.

CLI="$(cd "$(dirname "$0")/.." && pwd)/model-route.mjs"
FAIL=0

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK" || exit 2      # cwd matters: the router looks for .claude/bin/ and writes the log here

pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# Routes a descriptor file. Extra args are passed through. stdout+stderr land in $OUT, rc in $RC.
route() { OUT="$(node "$CLI" "${@:2}" < "$1" 2>&1)"; RC=$?; }
# Routes with no stdin at all (batch/usage cases).
routeq() { OUT="$(node "$CLI" "$@" < /dev/null 2>&1)"; RC=$?; }

# Reads a dotted path out of the JSON in $OUT.
field() {
  node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8"));
           process.stdout.write(String(process.argv[1].split(".").reduce((a,k)=>a?.[k],d)));' "$1" <<<"$OUT"
}
eq() { check "$1" "$([ "$2" = "$3" ] && echo 0 || echo 1)" "got '$2', want '$3'"; }
has() { check "$1" "$(grep -qF "$2" <<<"$OUT" && echo 0 || echo 1)"; }

# --------------------------------------------------------------- fixture config
# $1 = onInexpressibleEffort, $2 = haiku support list, $3 = sonnet/opus support list
write_config() {
  mkdir -p .claude/bin
  cat > .claude/bin/complexity.config.json <<EOF
{
  "sensitivePaths": {
    "critical": ["**/auth/**"],
    "sensitive": ["**/db/**"],
    "adjacent": ["**/api/**"]
  },
  "reversibility": {
    "destructive": ["**/*drop*"],
    "schema": ["**/migrations/**"]
  },
  "modelBands": [
    { "min": 0, "max": 2, "model": "haiku" },
    { "min": 3, "max": 7, "model": "sonnet" },
    { "min": 8, "max": 12, "model": "opus" }
  ],
  "effortBands": [
    { "min": 0, "max": 2, "effort": "low" },
    { "min": 3, "max": 5, "effort": "medium" },
    { "min": 6, "max": 7, "effort": "high" },
    { "min": 8, "max": 9, "effort": "xhigh" },
    { "min": 10, "max": 12, "effort": "max" }
  ],
  "capabilityFloors": [
    { "signal": "novelty", "atLeast": "high", "model": "opus" },
    { "signal": "logic", "atLeast": "high", "model": "opus" },
    { "signal": "ambiguity", "atLeast": "high", "model": "opus" }
  ],
  "effortFloors": [
    { "signal": "ambiguity", "atLeast": "high", "effort": "high" },
    { "signal": "ambiguity", "atLeast": "medium", "effort": "medium" },
    { "signal": "logic", "atLeast": "medium", "effort": "medium" }
  ],
  "criticalEffortFloor": "high",
  "haikuFileBumpThreshold": 5,
  "effortParamSupport": { "haiku": ${2}, "sonnet": ${3}, "opus": ${3} },
  "onInexpressibleEffort": "${1}",
  "agents": {
    "verifier":  { "model": "inherit" },
    "copy-bot":  { "model": "haiku" },
    "careful":   { "effortFloor": "xhigh" }
  }
}
EOF
}

FULL='["low", "medium", "high", "xhigh", "max"]'
write_config "prompt-text" "[]" "$FULL"

# --------------------------------------------------------------- descriptors

# Would compute opus/high on its own: novelty+logic+ambiguity all high.
cat > d-pinned-inherit.json <<'EOF'
{ "agent": "verifier", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "high", "logic": "high", "ambiguity": "high",
               "tests": "new", "files": ["src/engine/x.ts"] } }
EOF

# Same signals, but pinned to the cheapest model there is.
cat > d-pinned-haiku.json <<'EOF'
{ "agent": "copy-bot", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "high", "logic": "high", "ambiguity": "high",
               "tests": "new", "files": ["src/engine/x.ts"] } }
EOF

# capability sums to 2 (haiku's band) but novelty:high must force opus anyway.
cat > d-cap-floor.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "high", "logic": "low", "ambiguity": "low",
               "tests": "existing", "files": ["src/x.ts"] } }
EOF

# risk = sensitivity 3 + blast 3 + reversibility 0 + tests 2 + ambiguity 0 = 8 -> xhigh
cat > d-effort-xhigh.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "none", "logic": "low", "ambiguity": "low",
               "tests": "none", "files": ["src/auth/x.ts"] },
  "context": { "dependents": 5 } }
EOF

# risk = 3 + 3 + 2 + 2 + 2 = 12 -> max (the file is both a critical path and destructive)
cat > d-effort-max.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "none", "logic": "low", "ambiguity": "high",
               "tests": "none", "files": ["src/auth/drop-session.ts"] },
  "context": { "dependents": 5 } }
EOF

# The Agent tool has no effort parameter, whatever the model is.
cat > d-surface-agent.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "agent",
  "signals": { "novelty": "high", "logic": "high", "ambiguity": "high",
               "tests": "new", "files": ["src/engine/x.ts"] } }
EOF

# capability 0 -> haiku, risk 5 + critical-path floor -> high. haiku expresses no effort at all,
# which is the whole inexpressibility case in one descriptor.
cat > d-haiku-high.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "none", "logic": "low", "ambiguity": "low",
               "tests": "none", "files": ["src/auth/a.ts"] } }
EOF

# Pinned effort floor, on a track whose own signals only reach medium.
cat > d-effortfloor-pin.json <<'EOF'
{ "agent": "careful", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "low", "logic": "medium", "ambiguity": "low",
               "tests": "existing", "files": ["src/x.ts", "src/y.ts"] } }
EOF

# Non-coding degradation: no files, so breadth comes from unitCount and sensitivity from gateFeeding.
cat > d-research.json <<'EOF'
{ "agent": "researcher", "profile": "research", "surface": "workflow",
  "signals": { "novelty": "low", "logic": "low", "ambiguity": "medium",
               "verifiability": "unverified", "unitCount": 4 },
  "context": { "gateFeeding": true } }
EOF

# --- malformed ---
cat > d-bad-enum.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "extreme", "logic": "low", "ambiguity": "low", "tests": "new" } }
EOF

cat > d-missing-surface.json <<'EOF'
{ "agent": "builder", "profile": "coding",
  "signals": { "novelty": "low", "logic": "low", "ambiguity": "low", "tests": "new" } }
EOF

cat > d-both-risk-slots.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "low", "logic": "low", "ambiguity": "low",
               "tests": "new", "verifiability": "skim" } }
EOF

cat > d-no-risk-slot.json <<'EOF'
{ "agent": "builder", "profile": "coding", "surface": "workflow",
  "signals": { "novelty": "low", "logic": "low", "ambiguity": "low" } }
EOF

cat > d-bad-profile.json <<'EOF'
{ "agent": "builder", "profile": "vibes", "surface": "workflow",
  "signals": { "novelty": "low", "logic": "low", "ambiguity": "low", "tests": "new" } }
EOF

printf 'not json at all\n' > d-garbage.json

# --- batch ---
cat > batch.json <<'EOF'
{
  "wave1-track-auth": { "agent": "builder", "profile": "coding", "surface": "workflow",
    "signals": { "novelty": "high", "logic": "high", "ambiguity": "low",
                 "tests": "new", "files": ["src/auth/login.ts"] } },
  "wave1-track-copy": { "agent": "builder", "profile": "coding", "surface": "workflow",
    "signals": { "novelty": "none", "logic": "low", "ambiguity": "low",
                 "tests": "existing", "files": ["src/copy/en.json"] } }
}
EOF

cat > batch-array.json <<'EOF'
[ { "agent": "builder", "profile": "coding", "surface": "workflow",
    "signals": { "novelty": "low", "logic": "low", "ambiguity": "low", "tests": "new" } } ]
EOF

# --------------------------------------------------------------- 1. pin short-circuit

route d-pinned-inherit.json --json
eq  "pin: inherit wins over a computed opus"        "$(field model)"       "inherit"
has "pin: the pin is named in the reasons"          'pin: agents.verifier.model = inherit'
eq  "pin: capability is still computed and reported" "$(field capability)" "6"
eq  "pin: inherit passes the effort through"        "$(field effortParam)" "high"

route d-pinned-haiku.json --json
eq  "pin: haiku wins over both the band and the capability floor" "$(field model)" "haiku"
check "pin: no capability floor reason is recorded when pinned" \
  "$(grep -q 'capability floor' <<<"$OUT" && echo 1 || echo 0)"
eq  "pin: the effort axis is untouched by a model pin" "$(field effort)" "high"

# --------------------------------------------------------------- 2. capability floor

route d-cap-floor.json --json
eq  "floor: novelty high forces opus from a capability of 2" "$(field model)" "opus"
eq  "floor: the capability score itself is unchanged"        "$(field capability)" "2"
has "floor: the floor is named in the reasons"               'capability floor: novelty >= high forces opus'

# --------------------------------------------------------------- 3. five-band effort edges

route d-effort-xhigh.json --json
eq  "bands: risk 8 lands in xhigh"                  "$(field effort)" "xhigh"
eq  "bands: risk 8 is reported as 8"                "$(field risk)"   "8"
eq  "bands: a cheap-but-risky task stays on haiku"  "$(field model)"  "haiku"

route d-effort-max.json --json
eq  "bands: risk 12 lands in max"                   "$(field effort)" "max"
eq  "bands: risk 12 is reported as 12"              "$(field risk)"   "12"

# --------------------------------------------------------------- 4. surface agent

route d-surface-agent.json --json
eq  "surface agent: effortParam is null even on opus" "$(field effortParam)" "null"
eq  "surface agent: the effort decision itself survives" "$(field effort)"    "high"
has "surface agent: the reason says why"              'surface \"agent\" has no effort parameter for any model'

# --------------------------------------------------------------- 5. workflow + prompt-text

route d-haiku-high.json --json
eq  "prompt-text: haiku cannot express high"        "$(field effortParam)" "null"
eq  "prompt-text: the model is NOT bumped"          "$(field model)"       "haiku"
eq  "prompt-text: the effort is NOT lowered"        "$(field effort)"      "high"
has "prompt-text: the reason says it travels as prompt text" 'travels as prompt text'

# --------------------------------------------------------------- 6. workflow + bump-model

write_config "bump-model" "[]" "$FULL"
route d-haiku-high.json --json
eq  "bump-model: haiku is raised to sonnet"         "$(field model)"       "sonnet"
eq  "bump-model: the effort becomes expressible"    "$(field effortParam)" "high"
eq  "bump-model: the effort is still not lowered"   "$(field effort)"      "high"
has "bump-model: the bump is named in the reasons"  'bump-model raises it to \"sonnet\"'

# --------------------------------------------------------------- 7. bump-model, nothing supports it

write_config "bump-model" "[]" "[]"
route d-haiku-high.json --json
eq  "ceiling: no model supports the effort, so none is chosen" "$(field model)" "haiku"
eq  "ceiling: effortParam falls through to null"    "$(field effortParam)" "null"
eq  "ceiling: the effort survives the fallthrough"  "$(field effort)"      "high"
has "ceiling: the fallthrough is named"             'bump-model hit ceiling, fell through to prompt-text'

write_config "prompt-text" "[]" "$FULL"

# --------------------------------------------------------------- 8. malformed input exits 2

route d-bad-enum.json --json
check "garbage: a bad enum exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"
has   "garbage: a bad enum names the field and the vocabulary" 'model-route: descriptor: signals.novelty'

route d-missing-surface.json --json
check "garbage: a missing required field exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"
has   "garbage: the missing field is named, not defaulted" '"surface" is required'

route d-bad-profile.json --json
check "garbage: an unknown profile exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

route d-both-risk-slots.json --json
check "garbage: tests AND verifiability exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

route d-no-risk-slot.json --json
check "garbage: neither tests NOR verifiability exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

route d-garbage.json --json
check "garbage: unparseable stdin exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

routeq --json
check "garbage: empty stdin exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

routeq --nonsense
check "garbage: an unknown flag exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

# --------------------------------------------------------------- 9. batch mode

routeq --batch batch.json --json --caller test-suite
check "batch: exits 0" "$([ "$RC" = 0 ] && echo 0 || echo 1)" "rc=$RC"
eq  "batch: decisions come back under the input's own keys" \
    "$(field 'wave1-track-auth.model')" "opus"
eq  "batch: the second key is routed independently" \
    "$(field 'wave1-track-copy.model')" "haiku"
eq  "batch: a critical-path file still floors the effort inside a batch" \
    "$(field 'wave1-track-auth.effort')" "high"

routeq --batch batch-array.json --json
check "batch: an array has no keys to route back to, exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

routeq --batch nope.json --json
check "batch: a missing batch file exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

# --------------------------------------------------------------- 10. per-agent effort floor

route d-effortfloor-pin.json --json
eq  "effortFloor pin: raises medium to xhigh"       "$(field effort)"      "xhigh"
eq  "effortFloor pin: leaves the model axis alone"  "$(field model)"       "sonnet"
eq  "effortFloor pin: sonnet can express it"        "$(field effortParam)" "xhigh"
has "effortFloor pin: the pin is named"             'pin: agents.careful.effortFloor = xhigh raises effort from medium'

# --------------------------------------------------------------- degradation without files

route d-research.json --json
eq  "no files: breadth comes from unitCount"        "$(field capability)"  "4"
eq  "no files: gateFeeding supplies the sensitivity" "$(field risk)"       "6"
eq  "no files: verifiability fills the tests slot"  "$(field effort)"      "high"
eq  "no files: a research descriptor still routes a model" "$(field model)" "sonnet"

# --------------------------------------------------------------- logging

check "log: a line is appended per decision" \
  "$([ -s .claude/routing-log.jsonl ] && echo 0 || echo 1)"
check "log: the line carries ts, caller, agent, descriptor and decision" \
  "$(node -e '
     const lines = require("fs").readFileSync(".claude/routing-log.jsonl","utf8").trim().split("\n");
     const e = lines.map(JSON.parse).find(x => x.caller === "test-suite");
     process.exit(e && !Number.isNaN(Date.parse(e.ts)) && e.agent && e.descriptor && e.decision ? 0 : 1);
   ' && echo 0 || echo 1)"

# --------------------------------------------------------------- config validation

cp .claude/bin/complexity.config.json good.json

node -e '
  const c = JSON.parse(require("fs").readFileSync("good.json","utf8"));
  delete c.effortParamSupport.opus;
  require("fs").writeFileSync(".claude/bin/complexity.config.json", JSON.stringify(c));
'
route d-cap-floor.json --json
check "config: a model with no effortParamSupport entry exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"
has   "config: the missing model is named" 'no entry for model "opus"'

node -e '
  const c = JSON.parse(require("fs").readFileSync("good.json","utf8"));
  c.onInexpressibleEffort = "shrug";
  require("fs").writeFileSync(".claude/bin/complexity.config.json", JSON.stringify(c));
'
route d-cap-floor.json --json
check "config: an unknown onInexpressibleEffort exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

node -e '
  const c = JSON.parse(require("fs").readFileSync("good.json","utf8"));
  c.agents.verifier.model = "gpt";
  require("fs").writeFileSync(".claude/bin/complexity.config.json", JSON.stringify(c));
'
route d-cap-floor.json --json
check "config: an agent pinned to an unknown model exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

node -e '
  const c = JSON.parse(require("fs").readFileSync("good.json","utf8"));
  c.agents.careful.effortFloor = "extreme";
  require("fs").writeFileSync(".claude/bin/complexity.config.json", JSON.stringify(c));
'
route d-cap-floor.json --json
check "config: an agent effortFloor outside effortBands exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

echo '{ not json' > .claude/bin/complexity.config.json
route d-cap-floor.json --json
check "config: an unparseable config exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

cp good.json .claude/bin/complexity.config.json

# --------------------------------------------------------------- determinism

route d-effort-max.json --json; A="$OUT"
route d-effort-max.json --json; B="$OUT"
check "determinism: the same descriptor routes the same way twice" \
  "$([ "$A" = "$B" ] && echo 0 || echo 1)"

[ "$FAIL" = 0 ] && echo "PASS — model-route.mjs" || echo "FAIL — model-route.mjs"
exit "$FAIL"
