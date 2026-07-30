#!/usr/bin/env node
/**
 * model-route — routes ONE dispatch (or a batch of them) to a model + effort + effort parameter.
 *
 * WHY THIS EXISTS
 * ---------------
 * `complexity-score.mjs` checks a plan's *declared* Model/Effort columns after the planner wrote
 * them. That only helps work that goes through a plan. Everything else an orchestrator dispatches —
 * a verifier, a researcher, an ad-hoc fix agent — picks its model by vibe at the call site, and the
 * choice is invisible afterwards. This CLI is the other half: a routing decision computed from
 * declared signals BEFORE dispatch, with the decision and its inputs appended to a log so the
 * choices can be reviewed as a set rather than one prompt at a time.
 *
 * It is a thin shell over routing-engine.mjs. All the arithmetic, and every rule, is there.
 *
 * USAGE
 *   echo '<descriptor json>' | model-route.mjs [--json] [--caller <name>]
 *   model-route.mjs --batch <file.json> [--json] [--caller <name>]
 *
 * Output is always JSON — `--json` is accepted for symmetry with complexity-score.mjs. Single mode
 * emits one decision object; batch mode emits `{ key: decision, ... }` under the input's own keys.
 *
 * DESCRIPTOR (see references/ for the canonical spec)
 *   { "agent": "verifier", "profile": "coding", "surface": "workflow",
 *     "signals": { "novelty": "low", "logic": "medium", "ambiguity": "low",
 *                  "tests": "new", "files": ["src/a.ts"] },
 *     "context": { "gateFeeding": false, "dependsOn": 0, "dependents": 2 } }
 *
 * EXIT CODES
 *   0  a decision was produced for every descriptor
 *   2  usage error, unreadable/invalid config, or an invalid descriptor
 *
 * There is deliberately no exit code for "routed low" — this tool decides, it does not gate.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { score, validateConfig } from './routing-engine.mjs';

const SELF_DIR = dirname(new URL(import.meta.url).pathname);

const die = (msg) => { process.stderr.write(`model-route: ${msg}\n`); process.exit(2); };
const warn = (msg) => { process.stderr.write(`model-route: warning: ${msg}\n`); };

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let batchPath = null;
let caller = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--json') continue;                     // always-on; accepted for symmetry
  else if (a === '--batch') { batchPath = args[++i] ?? null; if (!batchPath) die('--batch needs a file path'); }
  else if (a.startsWith('--batch=')) batchPath = a.slice('--batch='.length);
  else if (a === '--caller') { caller = args[++i] ?? null; if (caller === null) die('--caller needs a name'); }
  else if (a.startsWith('--caller=')) caller = a.slice('--caller='.length);
  else die(`unknown argument "${a}" — usage: model-route.mjs [--batch <file.json>] [--caller <name>] [--json]`);
}

// ---------------------------------------------------------------------------
// Config — same two-path lookup as complexity-score.mjs: the project copy wins, the plugin's own
// copy is the fallback so routing works before bootstrap has been re-run. Both are validated
// identically, and an invalid one is fatal rather than defaulted.
// ---------------------------------------------------------------------------
function loadConfig() {
  const candidates = [
    join(process.cwd(), '.claude/bin/complexity.config.json'),
    join(SELF_DIR, 'complexity.config.json'),
  ];
  const path = candidates.find((p) => existsSync(p));
  if (!path) die('no complexity.config.json found in .claude/bin/ or beside the router');

  let cfg;
  try { cfg = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { die(`${path} is not valid JSON: ${e.message}`); }

  try { validateConfig(cfg); }
  catch (e) { die(`${path}: ${e.message}`); }

  cfg._path = path;
  return cfg;
}

// ---------------------------------------------------------------------------
// Log — one line per decision. Best effort: a routing call must not fail because the log is
// unwritable (read-only checkout, a directory owned by someone else). Losing an audit line is worth
// less than blocking the dispatch it was auditing.
// ---------------------------------------------------------------------------
function logDecision(entry) {
  const dir = join(process.cwd(), '.claude');
  try {
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'routing-log.jsonl'), `${JSON.stringify(entry)}\n`);
  } catch (e) {
    warn(`could not append to ${join(dir, 'routing-log.jsonl')}: ${e.message}`);
  }
}

function decide(descriptor, cfg, label) {
  let decision;
  try { decision = score(descriptor, cfg); }
  catch (e) { die(label ? `${label}: ${e.message}` : e.message); }
  logDecision({
    ts: new Date().toISOString(),
    caller,
    agent: descriptor.agent,
    descriptor,
    decision,
  });
  return decision;
}

function readStdin() {
  try { return readFileSync(0, 'utf8'); }
  catch (e) { die(`could not read the descriptor from stdin: ${e.message}`); }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const cfg = loadConfig();

if (batchPath) {
  if (!existsSync(batchPath)) die(`batch file not found: ${resolve(batchPath)}`);
  let batch;
  try { batch = JSON.parse(readFileSync(batchPath, 'utf8')); }
  catch (e) { die(`${batchPath} is not valid JSON: ${e.message}`); }
  if (!batch || typeof batch !== 'object' || Array.isArray(batch))
    die(`${batchPath} must be a JSON object of { "key": descriptor, ... } — an array has no keys to route back to`);

  const entries = Object.entries(batch);
  if (!entries.length) die(`${batchPath} contains no descriptors`);

  const out = {};
  for (const [key, descriptor] of entries) out[key] = decide(descriptor, cfg, key);
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  process.exit(0);
}

const rawIn = readStdin();
if (!rawIn.trim()) die('no descriptor on stdin — pipe one descriptor as JSON, or use --batch <file.json>');

let descriptor;
try { descriptor = JSON.parse(rawIn); }
catch (e) { die(`the descriptor on stdin is not valid JSON: ${e.message}`); }

process.stdout.write(`${JSON.stringify(decide(descriptor, cfg, null), null, 2)}\n`);
process.exit(0);
