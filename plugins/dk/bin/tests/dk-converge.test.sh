#!/usr/bin/env bash
# dk-converge.test.sh — the convergence tool, and the closure invariant that makes it safe.
#
# TWO JOBS.
#
# 1. THE CLOSURE INVARIANT. dk-converge moves plugin artifacts into and out of a project in SETS,
#    because the scorer imports `./routing-engine.mjs` and the context hook requires
#    `./lib/dk-common.js`. Handling either file without its siblings is how a project ends up with
#    a scorer that dies on ERR_MODULE_NOT_FOUND — the exact failure that hit every project
#    bootstrapped on dk 1.0.0, whose copy list named the scorer and not the engine.
#
#    So this does not assert the literal string "routing-engine.mjs" anywhere. It WALKS each managed
#    executable's local (`./`) imports transitively and requires the resulting closure to be covered
#    by that file's set. Asserting the string would re-break on the next sibling import somebody
#    adds; walking the closure cannot.
#
# 2. THE TOOL'S OWN CONTRACT — that it removes what it should, refuses what it must not touch, and
#    never writes calibration data.
#
# Exit 0 = all assertions passed.

set -u

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DK="$ROOT/plugins/dk"
CONVERGE="$DK/bin/dk-converge.mjs"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

FAIL=0
pass() { printf 'ok   — %s\n' "$1"; }
fail() { printf 'FAIL — %s\n' "$1"; FAIL=1; }
check() { if [ "$2" = "0" ]; then pass "$1"; else fail "$1${3:+ ($3)}"; fi; }

# ---------------------------------------------------------------------------
# 1. init.md vendors nothing into .claude/bin/. The copy list is the thing that was wrong in both
#    directions; the fix was to delete it, so assert it stays deleted.
# ---------------------------------------------------------------------------
COPY_LINES="$(grep -n 'to `\.claude/bin/`\|copy .*\.claude/bin' "$DK/commands/bootstrap/init.md" 2>/dev/null \
  | grep -iv 'no executables\|do not touch\|earlier versions' || true)"
check "init.md no longer instructs copying anything into .claude/bin/" \
  "$([ -z "$COPY_LINES" ] && echo 0 || echo 1)" "$COPY_LINES"

grep -q 'plugin-paths.md' "$DK/commands/bootstrap/init.md"
check "init.md points at the path convention that replaced the copies" "$?"

# The hooks copy DOES survive, with its own independent reason. Assert both halves are still named
# together — a copy list that names one without the other is the original bug's shape.
grep -q 'dk-context.js' "$DK/commands/bootstrap/init.md" && grep -q 'dk-common.js' "$DK/commands/bootstrap/init.md"
check "init.md still copies the hooks pair, and names both halves" "$?"

# ---------------------------------------------------------------------------
# 2. Closure invariant — walked, not hardcoded.
# ---------------------------------------------------------------------------
closure_of() {  # closure_of <plugin-relative entry> -> plugin-relative paths, one per line
  node -e '
    const fs = require("fs"), path = require("path");
    const root = process.argv[1], entry = process.argv[2];
    const seen = new Set(), queue = [entry];
    while (queue.length) {
      const rel = queue.shift();
      if (seen.has(rel)) continue;
      seen.add(rel);
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) continue;
      const src = fs.readFileSync(abs, "utf8");
      // ESM `from "./x"` and CJS `require("./x")`, ignoring anything inside a line comment so a
      // usage example in a header block does not count as a real edge.
      for (const line of src.split("\n")) {
        if (/^\s*(\/\/|\*|#)/.test(line)) continue;
        for (const m of line.matchAll(/(?:from|require\()\s*["'"'"'](\.[^"'"'"']+)["'"'"']/g)) {
          queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
        }
      }
    }
    seen.delete(entry);
    for (const s of seen) console.log(s);
  ' "$DK" "$1"
}

# The sets dk-converge actually declares, read out of the tool itself rather than restated here.
set_members() {  # set_members <set name> -> plugin-relative paths
  node -e '
    const src = require("fs").readFileSync(process.argv[1], "utf8");
    const want = process.argv[2];
    for (const m of src.matchAll(/plugin:\s*'"'"'([^'"'"']+)'"'"',\s*end:\s*'"'"'[a-z]+'"'"',\s*set:\s*'"'"'([^'"'"']+)'"'"'/g)) {
      if (m[2] === want) console.log(m[1]);
    }
  ' "$CONVERGE" "$1"
}

assert_closure_covered() {  # <entry> <set name>
  local entry="$1" setname="$2" missing=""
  local members; members="$(set_members "$setname")"
  [ -n "$members" ] || { fail "dk-converge declares a '$setname' set"; return; }
  while IFS= read -r dep; do
    [ -n "$dep" ] || continue
    printf '%s\n' "$members" | grep -qx "$dep" || missing="$missing $dep"
  done <<EOF
$(closure_of "$entry")
EOF
  check "dk-converge's '$setname' set covers every local import reachable from $entry" \
    "$([ -z "$missing" ] && echo 0 || echo 1)" "uncovered:$missing"
}

# Sanity first: the walker must actually find edges, or the assertions above are vacuous.
[ -n "$(closure_of 'bin/complexity-score.mjs')" ]
check "import walker finds at least one local import from the scorer (guards a vacuous pass)" "$?"

assert_closure_covered 'bin/complexity-score.mjs' 'scorer'
assert_closure_covered 'hooks/dk-context.js'      'hooks'

# ---------------------------------------------------------------------------
# 3. known-versions.json is about HISTORY. The current shipped hashes must not be in it — those are
#    read live off the plugin — or "matches something I shipped" would go stale the moment a release
#    changed a file without updating the manifest.
# ---------------------------------------------------------------------------
STALE_ENTRY="$(node -e '
  const fs = require("fs"), path = require("path"), crypto = require("crypto");
  const dk = process.argv[1];
  const m = JSON.parse(fs.readFileSync(path.join(dk, "bin/known-versions.json"), "utf8")).files;
  for (const [rel, hashes] of Object.entries(m)) {
    const abs = path.join(dk, rel);
    if (!fs.existsSync(abs)) { console.log(`${rel}: listed but not shipped`); continue; }
    const h = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
    if (h in hashes) console.log(`${rel}: current hash is listed as historical (${hashes[h]})`);
  }
' "$DK")"
check "known-versions.json lists only historical hashes, and every path it names is shipped" \
  "$([ -z "$STALE_ENTRY" ] && echo 0 || echo 1)" "$STALE_ENTRY"

# ---------------------------------------------------------------------------
# 4. The tool's contract, on fixtures.
# ---------------------------------------------------------------------------
mk_hooks() { mkdir -p "$1/.claude/hooks/lib"; cp "$DK/hooks/dk-context.js" "$1/.claude/hooks/"; cp "$DK/hooks/lib/dk-common.js" "$1/.claude/hooks/lib/"; }

# (a) converged project — absent bin artifacts are the DESIRED state, not a gap
mkdir -p "$WORK/ok"; mk_hooks "$WORK/ok"
OUT="$("$CONVERGE" --check --project "$WORK/ok" 2>&1)"; RC=$?
check "converged project exits 0" "$RC" "$OUT"
printf '%s' "$OUT" | grep -q 'ABSENT-OK'
check "an absent bin artifact reports ABSENT-OK, not a gap to fill" "$?" "$OUT"

# (b) a 1.0.0-vendored project — removable set, plus a project-local file that must survive
mkdir -p "$WORK/vend/.claude/bin"; mk_hooks "$WORK/vend"
cp "$DK/bin/complexity-score.mjs" "$DK/bin/routing-engine.mjs" "$WORK/vend/.claude/bin/"
echo '// the project own tool' > "$WORK/vend/.claude/bin/track-metrics.mjs"
"$CONVERGE" --check --project "$WORK/vend" >/dev/null 2>&1
check "vendored plugin artifacts report drift (exit 1)" "$([ $? = 1 ] && echo 0 || echo 1)"

"$CONVERGE" --apply --project "$WORK/vend" >/dev/null 2>&1
check "--apply converges a vendored project (exit 0)" "$?"
[ ! -e "$WORK/vend/.claude/bin/complexity-score.mjs" ] && [ ! -e "$WORK/vend/.claude/bin/routing-engine.mjs" ]
check "--apply removed the whole scorer set" "$?"
[ -f "$WORK/vend/.claude/bin/track-metrics.mjs" ]
check "--apply left an unrecognized project-local file alone" "$?"
"$CONVERGE" --check --project "$WORK/vend" >/dev/null 2>&1
check "--apply is idempotent — a re-check is clean" "$?"

# (c) a foreign scorer plus real calibration data — refuse, and touch nothing
mkdir -p "$WORK/foreign/.claude/bin"; mk_hooks "$WORK/foreign"
printf '#!/usr/bin/env node\n// from /gsd:plan-phase\n' > "$WORK/foreign/.claude/bin/complexity-score.mjs"
# Calibration lives at the PROJECT ROOT — that is where complexity-score.mjs reads it from.
printf '{"calibratedSprints":["10-1"],"pathAdjustments":[{"glob":"apps/x/**","risk":1}]}\n' > "$WORK/foreign/complexity-calibration.json"
BEFORE="$(find "$WORK/foreign" -type f | sort | xargs sha256sum | sha256sum)"

OUT="$("$CONVERGE" --check --project "$WORK/foreign" 2>&1)"; RC=$?
check "a file matching no shipped version exits 3 (needs a decision)" "$([ "$RC" = 3 ] && echo 0 || echo 1)" "$OUT"
printf '%s' "$OUT" | grep -q 'FOREIGN'
check "…and is reported FOREIGN" "$?" "$OUT"

"$CONVERGE" --apply --project "$WORK/foreign" >/dev/null 2>&1
check "--apply on a foreign file still exits 3" "$([ $? = 3 ] && echo 0 || echo 1)"
AFTER="$(find "$WORK/foreign" -type f | sort | xargs sha256sum | sha256sum)"
[ "$BEFORE" = "$AFTER" ]
check "--apply wrote NOTHING: foreign scorer and calibration data both untouched" "$?"

# (d) calibration is never written, even into a project that has none
mkdir -p "$WORK/nocal/.claude/bin"; mk_hooks "$WORK/nocal"
cp "$DK/bin/complexity-score.mjs" "$DK/bin/routing-engine.mjs" "$WORK/nocal/.claude/bin/"
"$CONVERGE" --apply --project "$WORK/nocal" >/dev/null 2>&1
[ ! -e "$WORK/nocal/complexity-calibration.json" ] && [ ! -e "$WORK/nocal/.claude/bin/complexity-calibration.json" ] && [ ! -e "$WORK/nocal/.claude/complexity-calibration.json" ]
check "--apply never creates complexity-calibration.json" "$?"

# The path dk-converge treats as calibration must be the path the scorer actually reads, or the
# read-only guarantee is aimed at the wrong file. Assert the two agree rather than trusting both.
grep -q "join(process.cwd(), 'complexity-calibration.json')" "$DK/bin/complexity-score.mjs"
check "complexity-score.mjs reads calibration from the project root" "$?"
grep -q "^  'complexity-calibration.json'," "$CONVERGE"
check "dk-converge treats that same project-root path as read-only" "$?"

# And a root calibration file is reported, not ignored — silence would let it look unmanaged.
mkdir -p "$WORK/cal"; mk_hooks "$WORK/cal"
printf '{"calibratedSprints":[],"pathAdjustments":[]}\n' > "$WORK/cal/complexity-calibration.json"
CAL_BEFORE="$(sha256sum "$WORK/cal/complexity-calibration.json" | cut -d' ' -f1)"
OUT="$("$CONVERGE" --apply --project "$WORK/cal" 2>&1)"
printf '%s' "$OUT" | grep -q 'complexity-calibration.json.*READ-ONLY'
check "a project-root calibration file is reported READ-ONLY" "$?" "$OUT"
[ "$CAL_BEFORE" = "$(sha256sum "$WORK/cal/complexity-calibration.json" | cut -d' ' -f1)" ]
check "--apply left the calibration file byte-identical" "$?"

# (e) a customized config is kept and surfaced, never rewritten
mkdir -p "$WORK/tuned/.claude/bin"; mk_hooks "$WORK/tuned"
node -e '
  const fs = require("fs");
  const c = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  c.sensitivePaths.critical = ["**/billing/**"];
  fs.writeFileSync(process.argv[2], JSON.stringify(c, null, 2));
' "$DK/bin/complexity.config.json" "$WORK/tuned/.claude/bin/complexity.config.json"
TUNED_BEFORE="$(sha256sum "$WORK/tuned/.claude/bin/complexity.config.json" | cut -d' ' -f1)"
OUT="$("$CONVERGE" --apply --project "$WORK/tuned" 2>&1)"; RC=$?
check "a locally-tuned config exits 3 (needs a decision)" "$([ "$RC" = 3 ] && echo 0 || echo 1)" "$OUT"
printf '%s' "$OUT" | grep -q 'CUSTOMIZED'
check "…and is reported CUSTOMIZED" "$?" "$OUT"
[ "$TUNED_BEFORE" = "$(sha256sum "$WORK/tuned/.claude/bin/complexity.config.json" | cut -d' ' -f1)" ]
check "--apply did not rewrite the tuned config" "$?"

# (f) a config byte-identical to a shipped version is REMOVED, not refreshed
mkdir -p "$WORK/pinned/.claude/bin"; mk_hooks "$WORK/pinned"
cp "$DK/bin/complexity.config.json" "$WORK/pinned/.claude/bin/"
"$CONVERGE" --apply --project "$WORK/pinned" >/dev/null 2>&1
[ ! -e "$WORK/pinned/.claude/bin/complexity.config.json" ]
check "a config carrying no project content is removed, not refreshed" "$?"

# (g) orphaned project-scope install records are REPORTED but never touched, and never change the
#     exit code — they are harness state this tool cannot fix, so a non-zero exit would be a
#     permanently-red signal rather than an actionable one.
mkdir -p "$WORK/orph/.claude" "$WORK/fakehome/.claude/plugins"
mk_hooks "$WORK/orph"
printf '{"extraKnownMarketplaces":{}}\n' > "$WORK/orph/.claude/settings.json"
cat > "$WORK/fakehome/.claude/plugins/installed_plugins.json" <<EOF
{"version":2,"plugins":{
  "dev-kit-core@dev-kit":[{"scope":"project","projectPath":"$WORK/orph","version":"0.2.0"},
                          {"scope":"user","version":"1.0.0"}],
  "dev-kit-web@dev-kit": [{"scope":"project","projectPath":"$WORK/elsewhere","version":"0.2.0"}]
}}
EOF
REG_BEFORE="$(sha256sum "$WORK/fakehome/.claude/plugins/installed_plugins.json" | cut -d' ' -f1)"
OUT="$(HOME="$WORK/fakehome" "$CONVERGE" --apply --project "$WORK/orph" 2>&1)"; RC=$?
check "an orphaned install record does not change the exit code" "$RC" "$OUT"
printf '%s' "$OUT" | grep -q 'ORPHANED-INSTALL-RECORD'
check "an orphaned project-scope install record is reported" "$?" "$OUT"
printf '%s' "$OUT" | grep -q 'dev-kit-core@dev-kit@0.2.0'
check "…naming the stale version it pins" "$?" "$OUT"
printf '%s' "$OUT" | grep -q 'dev-kit-web'
check "…and NOT another project's record" "$([ $? = 0 ] && echo 1 || echo 0)" "$OUT"
[ "$REG_BEFORE" = "$(sha256sum "$WORK/fakehome/.claude/plugins/installed_plugins.json" | cut -d' ' -f1)" ]
check "--apply never writes installed_plugins.json" "$?"

# A plugin the project still enables is not an orphan.
printf '{"enabledPlugins":{"dev-kit-core@dev-kit":true}}\n' > "$WORK/orph/.claude/settings.json"
OUT="$(HOME="$WORK/fakehome" "$CONVERGE" --check --project "$WORK/orph" 2>&1)"
printf '%s' "$OUT" | grep -q 'ORPHANED-INSTALL-RECORD'
check "a record for a still-enabled plugin is not reported as orphaned" "$([ $? = 0 ] && echo 1 || echo 0)" "$OUT"

# (h) --json stays parseable
"$CONVERGE" --check --json --project "$WORK/vend" 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{JSON.parse(s)})'
check "--json emits parseable JSON" "$?"

echo
if [ "$FAIL" = "0" ]; then echo "all assertions passed"; else echo "FAILURES"; fi
exit "$FAIL"
