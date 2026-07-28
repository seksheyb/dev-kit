#!/usr/bin/env node
/**
 * complexity-score — deterministic model/effort scoring for a plan set's Parallel Execution Map.
 *
 * WHY THIS EXISTS
 * ---------------
 * `agents/planner.md` writes each track's `Model` and `Effort` columns itself, deriving them from
 * that track's declared signals via the prose axes in `references/complexity-signals.md`. Without
 * this script the plan gate's only check on those columns is `gate-plan-review`'s manual fallback —
 * a second model re-reading the same prose the first model used, which cannot produce a different
 * answer than the one already written down. That is not a check; it is a re-render.
 *
 * This script closes that loop: it recomputes both columns arithmetically from the signals the plan
 * already carries and fails the gate when the declared value is lower than the computed one. The
 * failure mode it targets is under-declaration — trimming `novelty` or omitting created files to
 * land a track on a cheaper model.
 *
 * INPUT (all of it already in the plan — this script requires no new producer output)
 * ----------------------------------------------------------------------------------
 * From `## Parallel Execution Map`, in the lowest-numbered plan of the set:
 *
 *   | Wave | Track | Plan | Depends On | Files Owned | Model | Effort |
 *   | 1 | track-auth-model | 04-01 | none | `src/models/user.ts` | sonnet | medium |
 *
 *   **Track complexity**
 *   - `track-auth-model` — complexity: files: src/models/user.ts; novelty: low; logic: medium; ambiguity: low; tests: new
 *
 * The table supplies the dependency edges (`Depends On`, by plan id) and the declared columns; the
 * bullet supplies the enums and the authoritative file list. `Files Owned` is cross-checked against
 * the bullet's `files` and a divergence is reported — a track whose two file lists disagree is the
 * signature of a back-filled signal block.
 *
 * SCORING (both axes 0-12 on dev-kit's 3-value enums)
 * ---------------------------------------------------
 *   capability = novelty + logic + ambiguity + breadth + fanout      -> band -> model
 *   risk       = sensitivity + blast + reversibility + tests + ambiguity -> band -> effort
 *
 * then, in order: capability floors (raw enums only) -> critical-path effort floor -> haiku context
 * guard. There is deliberately NO effort-driven model floor; see the note in complexity.config.json.
 *
 * USAGE
 *   node complexity-score.mjs <plan.md>                 human-readable table
 *   node complexity-score.mjs <plan.md> --json          machine output
 *   node complexity-score.mjs <plan.md> --gate [--json] exit non-zero on under-declaration
 *
 * EXIT CODES  (the contract agents/gate-plan-review.md step 0 already documents)
 *   0  every track's declared tier is at or above the computed tier
 *   1  (--gate only) at least one track under-declares, or is missing signals
 *   2  usage error, unreadable plan, no map found, or invalid config/calibration
 *
 * Over-declaration (declared ABOVE computed) is reported as a warning and does NOT fail the gate.
 * It costs tokens, not correctness, and failing on it would punish conservative planning. This is a
 * deliberate divergence from ADD-SDD's scorer, which demands exact equality in both directions.
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';

const SELF_DIR = dirname(new URL(import.meta.url).pathname);

// ---------------------------------------------------------------------------
// Signal scales. Order is the score: index 0 is the floor.
// These mirror references/complexity-signals.md exactly; changing one here without changing it
// there desynchronises the producer from the scorer, which is the bug this whole file prevents.
// ---------------------------------------------------------------------------
const SCALES = {
  novelty:   ['none', 'low', 'high'],
  logic:     ['low', 'medium', 'high'],
  ambiguity: ['low', 'medium', 'high'],
  // `tests` is scored as RESIDUAL RISK, so the scale is not the doc's declaration order:
  // `existing` (already covered) is the safest, `none` (no test surface touched at all) the riskiest.
  tests:     { existing: 0, new: 1, none: 2 },
};

const die = (msg) => { process.stderr.write(`complexity-score: ${msg}\n`); process.exit(2); };

// ---------------------------------------------------------------------------
// Tiny glob matcher — `**` crosses separators, `*` does not. Case-insensitive.
// ---------------------------------------------------------------------------
function globToRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}
const matchAny = (file, globs) => globs.some((g) => globToRe(g).test(file));

// `bucket(n, t0, t1, t2)` -> 0..3. n<=t0 is the floor; above t2 is the ceiling.
const bucket = (n, t0, t1, t2) => (n <= t0 ? 0 : n <= t1 ? 1 : n <= t2 ? 2 : 3);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function loadConfig(planPath) {
  // Project copy wins; the plugin's own copy is the fallback so the scorer runs before bootstrap
  // has been re-run. Both are validated identically.
  const candidates = [
    join(process.cwd(), '.claude/bin/complexity.config.json'),
    join(SELF_DIR, 'complexity.config.json'),
  ];
  const path = candidates.find((p) => existsSync(p));
  if (!path) die('no complexity.config.json found in .claude/bin/ or beside the scorer');

  let cfg;
  try { cfg = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { die(`${path} is not valid JSON: ${e.message}`); }

  // Validate loudly. A silently-wrong config produces silently-wrong routing, which is worse than
  // no scorer at all — the gate would report a confident PASS derived from nonsense.
  const models = cfg.modelBands?.map((b) => b.model) ?? [];
  const efforts = cfg.effortBands?.map((b) => b.effort) ?? [];
  if (!models.length) die('config: modelBands is empty or missing');
  if (!efforts.length) die('config: effortBands is empty or missing');
  for (const f of cfg.capabilityFloors ?? []) {
    if (!models.includes(f.model)) die(`config: capabilityFloors names model "${f.model}", absent from modelBands`);
    if (!SCALES[f.signal]) die(`config: capabilityFloors names unknown signal "${f.signal}"`);
    if (!scaleValues(f.signal).includes(f.atLeast)) die(`config: capabilityFloors "${f.signal}" atLeast "${f.atLeast}" is not a value of that scale`);
  }
  for (const f of cfg.effortFloors ?? []) {
    if (!efforts.includes(f.effort)) die(`config: effortFloors names effort "${f.effort}", absent from effortBands`);
    if (!SCALES[f.signal]) die(`config: effortFloors names unknown signal "${f.signal}"`);
    if (!scaleValues(f.signal).includes(f.atLeast)) die(`config: effortFloors "${f.signal}" atLeast "${f.atLeast}" is not a value of that scale`);
  }
  if (cfg.criticalEffortFloor && !efforts.includes(cfg.criticalEffortFloor))
    die(`config: criticalEffortFloor "${cfg.criticalEffortFloor}" is absent from effortBands`);
  if (!Number.isInteger(cfg.haikuFileBumpThreshold) || cfg.haikuFileBumpThreshold < 1)
    die('config: haikuFileBumpThreshold must be a positive integer');
  cfg._models = models;
  cfg._efforts = efforts;
  cfg._path = path;
  return cfg;
}

const scaleValues = (sig) => (Array.isArray(SCALES[sig]) ? SCALES[sig] : Object.keys(SCALES[sig]));
const scaleScore = (sig, val) => {
  const s = SCALES[sig];
  const v = String(val).trim().toLowerCase();
  if (Array.isArray(s)) { const i = s.indexOf(v); return i < 0 ? null : i; }
  return v in s ? s[v] : null;
};

// ---------------------------------------------------------------------------
// Calibration (optional). Present so the read side of gate-plan-review's documented contract works
// the moment a calibration producer lands; absent today, which is why the hash is null by default.
// ---------------------------------------------------------------------------
function loadCalibration() {
  const p = join(process.cwd(), 'complexity-calibration.json');
  if (!existsSync(p)) return { hash: null, adjustments: [] };
  let raw;
  try { raw = readFileSync(p, 'utf8'); JSON.parse(raw); }
  catch (e) { die(`complexity-calibration.json is invalid: ${e.message}`); }
  const parsed = JSON.parse(raw);
  return {
    hash: createHash('sha256').update(raw).digest('hex').slice(0, 12),
    adjustments: Array.isArray(parsed.pathAdjustments) ? parsed.pathAdjustments : [],
  };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------
const splitFiles = (s) =>
  String(s).split(',').map((f) => f.replace(/`/g, '').trim()).filter((f) => f && f !== 'none');

/** Rows of the `| Wave | Track | Plan | Depends On | Files Owned | Model | Effort |` table. */
function parseMapTable(raw) {
  const rows = [];
  for (const line of raw.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 7) continue;
    const [wave, track, plan, dependsOn, files, model, effort] = cells;
    if (!/^track[-_]/i.test(track)) continue;           // skips the header and separator rows
    rows.push({
      wave: Number(wave) || null,
      track,
      plan: plan.replace(/`/g, '').trim(),
      dependsOn: splitFiles(dependsOn),
      filesOwned: splitFiles(files),
      declaredModel: model.toLowerCase(),
      declaredEffort: effort.toLowerCase(),
    });
  }
  return rows;
}

/** `- \`track-x\` — complexity: files: a, b; novelty: low; logic: medium; ambiguity: low; tests: new` */
function parseSignalBullets(raw) {
  const out = {};
  const re = /^[-*]\s*`?(track[-_][\w-]+)`?\s*[—–-]\s*complexity:\s*(.+)$/gim;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const [, track, body] = m;
    const sig = {};
    for (const part of body.split(';')) {
      const idx = part.indexOf(':');
      if (idx < 0) continue;
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      sig[key] = key === 'files' ? splitFiles(val) : val.toLowerCase();
    }
    out[track] = sig;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
const bandFor = (score, bands, key) =>
  (bands.find((b) => score >= b.min && score <= b.max) ?? bands[bands.length - 1])[key];

function scoreTrack(row, sig, graph, cfg, calibration) {
  const errors = [];
  if (!sig) return { errors: ['missing complexity signals — no `- `track` — complexity: …` bullet found'] };

  const files = sig.files?.length ? sig.files : row.filesOwned;
  if (!files.length) errors.push('signal block declares no files');

  // A bullet whose file list disagrees with the row's Files Owned is the signature of a
  // back-filled signal block, and it makes both the disjointness check and this score unreliable.
  const owned = new Set(row.filesOwned);
  const missing = files.filter((f) => !owned.has(f));
  const extra = row.filesOwned.filter((f) => !new Set(files).has(f));
  if (row.filesOwned.length && (missing.length || extra.length))
    errors.push(`file list disagrees with Files Owned (bullet-only: ${missing.join(', ') || 'none'}; row-only: ${extra.join(', ') || 'none'})`);

  const raw = {};
  for (const s of ['novelty', 'logic', 'ambiguity', 'tests']) {
    const v = scaleScore(s, sig[s] ?? '');
    if (v === null) { errors.push(`signal "${s}" is missing or not one of ${scaleValues(s).join('|')}`); raw[s] = 0; }
    else raw[s] = v;
  }
  if (errors.length && !sig.novelty) return { errors };

  const sp = cfg.sensitivePaths ?? {};
  const rv = cfg.reversibility ?? {};
  const sensitivity = matchAny2(files, sp.critical) ? 3 : matchAny2(files, sp.sensitive) ? 2 : matchAny2(files, sp.adjacent) ? 1 : 0;
  const reversibility = matchAny2(files, rv.destructive) ? 2 : matchAny2(files, rv.schema) ? 1 : 0;
  const breadth = bucket(files.length, 1, 3, 6);
  const fanout = bucket(row.dependsOn.length, 0, 2, 4);
  const blast = bucket(graph.dependents.get(row.plan)?.size ?? 0, 0, 2, 4);

  let capability = raw.novelty + raw.logic + raw.ambiguity + breadth + fanout;
  let risk = sensitivity + blast + reversibility + raw.tests + raw.ambiguity;

  // Calibration deltas, clamped +/-2 per entry, largest signed delta per axis wins (no stacking).
  const applied = [];
  let dCap = 0, dRisk = 0;
  for (const adj of calibration.adjustments) {
    if (!adj.glob || !matchAny2(files, [adj.glob])) continue;
    const c = Math.max(-2, Math.min(2, Number(adj.capability) || 0));
    const r = Math.max(-2, Math.min(2, Number(adj.risk) || 0));
    if (Math.abs(c) > Math.abs(dCap)) dCap = c;
    if (Math.abs(r) > Math.abs(dRisk)) dRisk = r;
    if (c || r) applied.push({ glob: adj.glob, capability: c, risk: r, reason: adj.reason ?? null });
  }
  const clamp = (n) => Math.max(0, Math.min(12, n));
  capability = clamp(capability + dCap);
  risk = clamp(risk + dRisk);

  // 1. bands
  let model = bandFor(capability, cfg.modelBands, 'model');
  let effort = bandFor(risk, cfg.effortBands, 'effort');
  const reasons = [];

  // 2. capability floors — RAW enums only, so a negative calibration delta cannot suppress one.
  for (const f of cfg.capabilityFloors ?? []) {
    const declared = scaleScore(f.signal, sig[f.signal] ?? '');
    const threshold = scaleScore(f.signal, f.atLeast);
    if (declared !== null && declared >= threshold && rank(f.model, cfg._models) > rank(model, cfg._models)) {
      model = f.model;
      reasons.push(`capability floor: ${f.signal} >= ${f.atLeast} forces ${f.model}`);
    }
  }

  // 3a. effort floors — also raw enums, same reasoning as the capability floors.
  for (const f of cfg.effortFloors ?? []) {
    const declared = scaleScore(f.signal, sig[f.signal] ?? '');
    const threshold = scaleScore(f.signal, f.atLeast);
    if (declared !== null && declared >= threshold && rank(f.effort, cfg._efforts) > rank(effort, cfg._efforts)) {
      effort = f.effort;
      reasons.push(`effort floor: ${f.signal} >= ${f.atLeast} forces ${f.effort}`);
    }
  }

  // 3b. critical-path effort floor
  if (cfg.criticalEffortFloor && sensitivity === 3 && rank(cfg.criticalEffortFloor, cfg._efforts) > rank(effort, cfg._efforts)) {
    effort = cfg.criticalEffortFloor;
    reasons.push(`critical-path floor: touches a critical path, forces ${cfg.criticalEffortFloor} effort`);
  }

  // 4. haiku context guard
  if (model === cfg._models[0] && files.length > cfg.haikuFileBumpThreshold) {
    model = cfg._models[1] ?? model;
    reasons.push(`context guard: ${files.length} files exceeds ${cfg.haikuFileBumpThreshold}, bumps to ${model}`);
  }

  return {
    errors,
    factors: { novelty: raw.novelty, logic: raw.logic, ambiguity: raw.ambiguity, tests: raw.tests, breadth, fanout, blast, sensitivity, reversibility },
    capability, risk, model, effort, reasons,
    appliedAdjustments: applied,
    fileCount: files.length,
  };
}

const matchAny2 = (files, globs) => Array.isArray(globs) && files.some((f) => matchAny(f, globs));
const rank = (v, order) => order.indexOf(v);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const planPath = args.find((a) => !a.startsWith('--'));
const asJson = args.includes('--json');
const gateMode = args.includes('--gate');

if (!planPath) die('usage: complexity-score.mjs <plan.md> [--gate] [--json]');
if (!existsSync(planPath)) die(`plan not found: ${resolve(planPath)}`);

const rawPlan = readFileSync(planPath, 'utf8');
if (!/^##\s+Parallel Execution Map\s*$/m.test(rawPlan))
  die(`no "## Parallel Execution Map" in ${planPath} — score the lowest-numbered plan of the set, the one the map lives in`);

const cfg = loadConfig(planPath);
const calibration = loadCalibration();
const rows = parseMapTable(rawPlan);
if (!rows.length) die('the Parallel Execution Map has no track rows (expected a leading `track-` cell)');

const bullets = parseSignalBullets(rawPlan);

// Reverse dependency edges, for blast radius.
const dependents = new Map(rows.map((r) => [r.plan, new Set()]));
for (const r of rows) for (const dep of r.dependsOn) if (dependents.has(dep)) dependents.get(dep).add(r.plan);

const tracks = rows.map((row) => {
  const scored = scoreTrack(row, bullets[row.track], { dependents }, cfg, calibration);
  // `inherit` means "run on the orchestrator's model" and is a legitimate planner choice, so the
  // model comparison is skipped for it. Effort is still checked.
  const modelOk = row.declaredModel === 'inherit' || row.declaredModel === scored.model;
  const effortOk = row.declaredEffort === scored.effort;
  const under =
    (row.declaredModel !== 'inherit' && scored.model && rank(row.declaredModel, cfg._models) < rank(scored.model, cfg._models)) ||
    (scored.effort && rank(row.declaredEffort, cfg._efforts) < rank(scored.effort, cfg._efforts));
  return {
    track: row.track, wave: row.wave, plan: row.plan,
    declared: { model: row.declaredModel, effort: row.declaredEffort },
    computed: { model: scored.model ?? null, effort: scored.effort ?? null },
    match: { model: modelOk, effort: effortOk },
    direction: (scored.errors?.length) ? 'error' : under ? 'under' : (modelOk && effortOk) ? 'match' : 'over',
    ...scored,
  };
});

const failing = tracks.filter((t) => t.direction === 'under' || t.direction === 'error');
const warning = tracks.filter((t) => t.direction === 'over');
const ok = failing.length === 0;

if (asJson) {
  process.stdout.write(JSON.stringify({
    plan: planPath,
    config: cfg._path,
    calibrationHash: calibration.hash,
    complexity_ok: ok,
    tracks,
    blockers: failing.map((t) =>
      t.errors?.length
        ? `track ${t.track}: ${t.errors.join('; ')}`
        : `track ${t.track}: declared ${t.declared.model}/${t.declared.effort} but computed ${t.computed.model}/${t.computed.effort}`),
    warnings: warning.map((t) => `track ${t.track}: declared ${t.declared.model}/${t.declared.effort} above computed ${t.computed.model}/${t.computed.effort} — safe, but costs tokens`),
  }, null, 2) + '\n');
} else {
  const pad = (s, n) => String(s ?? '').padEnd(n);
  process.stdout.write(`\ncomplexity-score  ${planPath}\n`);
  process.stdout.write(`config: ${cfg._path}   calibration: ${calibration.hash ?? 'none'}\n\n`);
  process.stdout.write(`${pad('TRACK', 24)}${pad('CAP', 5)}${pad('RISK', 6)}${pad('COMPUTED', 16)}${pad('DECLARED', 16)}\n`);
  process.stdout.write(`${'-'.repeat(67)}\n`);
  for (const t of tracks) {
    const flag = { match: 'ok', over: 'warn', under: 'UNDER', error: 'ERROR' }[t.direction];
    process.stdout.write(`${pad(t.track, 24)}${pad(t.capability, 5)}${pad(t.risk, 6)}${pad(`${t.computed.model ?? '-'}/${t.computed.effort ?? '-'}`, 16)}${pad(`${t.declared.model}/${t.declared.effort}`, 16)}${flag}\n`);
    for (const r of t.reasons ?? []) process.stdout.write(`${' '.repeat(24)}└─ ${r}\n`);
    for (const e of t.errors ?? []) process.stdout.write(`${' '.repeat(24)}!! ${e}\n`);
  }
  process.stdout.write('\n');
  if (failing.length) process.stdout.write(`${failing.length} track(s) under-declared or missing signals — the plan cannot pass the gate.\n`);
  else if (warning.length) process.stdout.write(`${warning.length} track(s) over-declared. Safe; costs tokens. Gate passes.\n`);
  else process.stdout.write('All tracks match their computed tier.\n');
}

process.exit(gateMode && !ok ? 1 : 0);
