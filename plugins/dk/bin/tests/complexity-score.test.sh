#!/usr/bin/env bash
# complexity-score.test.sh — fixture tests for complexity-score.mjs.
#
# The scorer's whole value is that it disagrees with the planner when the planner is wrong, so
# these fixtures are built around under-declaration: a track that trims an enum, a track that
# omits a created file, a track that touches a critical path. A scorer that passes everything is
# indistinguishable from no scorer, which is the state S1 describes.
#
# Exit 0 = all assertions passed.

SCORER="$(cd "$(dirname "$0")/.." && pwd)/complexity-score.mjs"
FAIL=0

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK" || exit 2      # cwd matters: the scorer looks for .claude/bin/ and calibration here

pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# Runs the scorer, capturing stdout+stderr and the exit code into $OUT / $RC.
run() { OUT="$(node "$SCORER" "$@" 2>&1)"; RC=$?; }

# --------------------------------------------------------------- fixtures

plan_header() {
  cat <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
EOF
}

# 1. A correct plan: every declared tier equals the computed tier.
cat > clean.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-copy | 01-01 | none | `src/copy/en.json` | haiku | low |
| 1 | track-list | 01-02 | none | `src/ui/List.tsx`, `src/ui/Row.tsx` | sonnet | medium |

**Track complexity**

- `track-copy` — complexity: files: src/copy/en.json; novelty: none; logic: low; ambiguity: low; tests: existing
- `track-list` — complexity: files: src/ui/List.tsx, src/ui/Row.tsx; novelty: low; logic: medium; ambiguity: medium; tests: new
EOF

# 2. Under-declaration by trimmed enum: novelty:high must force opus via the capability floor.
cat > under-enum.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-greenfield | 01-01 | none | `src/engine/plan.ts` | sonnet | medium |

**Track complexity**

- `track-greenfield` — complexity: files: src/engine/plan.ts; novelty: high; logic: medium; ambiguity: low; tests: new
EOF

# 3. Under-declaration by critical path: nothing in the enums is high, but the files are auth.
cat > under-critical.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-login | 01-01 | none | `src/auth/session.ts` | sonnet | low |

**Track complexity**

- `track-login` — complexity: files: src/auth/session.ts; novelty: low; logic: low; ambiguity: low; tests: existing
EOF

# 4. Over-declaration: safe, must warn but not fail the gate.
cat > over.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-rename | 01-01 | none | `src/util/fmt.ts` | opus | high |

**Track complexity**

- `track-rename` — complexity: files: src/util/fmt.ts; novelty: none; logic: low; ambiguity: low; tests: existing
EOF

# 5. Missing signal bullet entirely.
cat > no-signals.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-orphan | 01-01 | none | `src/a.ts` | sonnet | medium |
EOF

# 6. File lists disagree — the signature of a back-filled signal block.
cat > file-mismatch.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-drift | 01-01 | none | `src/a.ts`, `src/b.ts`, `src/c.ts` | haiku | low |

**Track complexity**

- `track-drift` — complexity: files: src/a.ts; novelty: none; logic: low; ambiguity: low; tests: existing
EOF

# 7. `inherit` in the Model column is a legitimate planner choice, not a mismatch.
cat > inherit.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-inherit | 01-01 | none | `src/engine/x.ts` | inherit | high |

**Track complexity**

- `track-inherit` — complexity: files: src/engine/x.ts; novelty: high; logic: high; ambiguity: high; tests: new
EOF

# 8. Blast radius: three tracks depend on 01-01, which must lift its own risk.
cat > blast.md <<'EOF'
## Parallel Execution Map

| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
|------|-------|------|------------|-------------|-------|--------|
| 1 | track-core | 01-01 | none | `src/core.ts` | haiku | low |
| 2 | track-a | 01-02 | 01-01 | `src/a.ts` | haiku | low |
| 2 | track-b | 01-03 | 01-01 | `src/b.ts` | haiku | low |
| 2 | track-c | 01-04 | 01-01 | `src/c.ts` | haiku | low |

**Track complexity**

- `track-core` — complexity: files: src/core.ts; novelty: none; logic: low; ambiguity: low; tests: existing
- `track-a` — complexity: files: src/a.ts; novelty: none; logic: low; ambiguity: low; tests: existing
- `track-b` — complexity: files: src/b.ts; novelty: none; logic: low; ambiguity: low; tests: existing
- `track-c` — complexity: files: src/c.ts; novelty: none; logic: low; ambiguity: low; tests: existing
EOF

# 9. No map at all.
printf '# Just a plan\n\nNo map here.\n' > nomap.md

# --------------------------------------------------------------- assertions

run clean.md --gate --json
check "clean plan passes the gate" "$([ "$RC" = 0 ] && echo 0 || echo 1)" "rc=$RC"
check "clean plan reports complexity_ok true" "$(grep -q '"complexity_ok": true' <<<"$OUT" && echo 0 || echo 1)"

run under-enum.md --gate
check "trimmed enum fails the gate" "$([ "$RC" = 1 ] && echo 0 || echo 1)" "rc=$RC"
check "trimmed enum names the capability floor" "$(grep -q 'capability floor: novelty' <<<"$OUT" && echo 0 || echo 1)"

run under-critical.md --gate
check "critical path fails the gate" "$([ "$RC" = 1 ] && echo 0 || echo 1)" "rc=$RC"
check "critical path names the effort floor" "$(grep -q 'critical-path floor' <<<"$OUT" && echo 0 || echo 1)"

run over.md --gate --json
check "over-declaration does NOT fail the gate" "$([ "$RC" = 0 ] && echo 0 || echo 1)" "rc=$RC"
check "over-declaration is reported as a warning" "$(grep -q '"warnings"' <<<"$OUT" && grep -q 'above computed' <<<"$OUT" && echo 0 || echo 1)"

run no-signals.md --gate
check "missing signals fails the gate" "$([ "$RC" = 1 ] && echo 0 || echo 1)" "rc=$RC"
check "missing signals says so" "$(grep -q 'missing complexity signals' <<<"$OUT" && echo 0 || echo 1)"

run file-mismatch.md --gate --json
check "file-list divergence is flagged" "$(grep -q 'disagrees with Files Owned' <<<"$OUT" && echo 0 || echo 1)"

run inherit.md --gate --json
check "inherit is not a model mismatch" "$(grep -q '"model": true' <<<"$OUT" && echo 0 || echo 1)"

run blast.md --json
check "blast radius raises the depended-on track's risk" \
  "$(node -e '
     const d = JSON.parse(require("fs").readFileSync(0,"utf8"));
     const core = d.tracks.find(t => t.track === "track-core");
     const leaf = d.tracks.find(t => t.track === "track-a");
     process.exit(core.factors.blast > 0 && core.risk > leaf.risk ? 0 : 1);
   ' <<<"$OUT" && echo 0 || echo 1)"

run nomap.md
check "a plan with no map exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

run missing-file.md
check "a missing plan file exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

run
check "no plan argument exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

# Invalid config must exit 2, not score against nonsense.
mkdir -p .claude/bin
echo '{ "modelBands": [], "effortBands": [] }' > .claude/bin/complexity.config.json
run clean.md
check "an invalid config exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"

echo '{ not json' > .claude/bin/complexity.config.json
run clean.md
check "an unparseable config exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"
rm -rf .claude

# A corrupt calibration file must fail loudly rather than score with it silently ignored.
echo '{ not json' > complexity-calibration.json
run clean.md
check "a corrupt calibration file exits 2" "$([ "$RC" = 2 ] && echo 0 || echo 1)" "rc=$RC"
rm -f complexity-calibration.json

# A valid calibration file must be applied and hashed.
cat > complexity-calibration.json <<'EOF'
{ "calibratedSprints": ["s1"],
  "pathAdjustments": [{ "glob": "src/copy/**", "risk": 2, "capability": 0, "reason": "defect history" }] }
EOF
run clean.md --json
check "a valid calibration file is hashed" "$(grep -q '"calibrationHash": "' <<<"$OUT" && echo 0 || echo 1)"
check "a matching adjustment is applied and attributed" "$(grep -q '"appliedAdjustments"' <<<"$OUT" && grep -q 'defect history' <<<"$OUT" && echo 0 || echo 1)"
rm -f complexity-calibration.json

[ "$FAIL" = 0 ] && echo "PASS — complexity-score.mjs" || echo "FAIL — complexity-score.mjs"
exit "$FAIL"
