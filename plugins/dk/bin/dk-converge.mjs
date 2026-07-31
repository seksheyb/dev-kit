#!/usr/bin/env node
/**
 * dk-converge — reconcile a project's vendored dk artifacts with what dk actually ships.
 *
 * WHY THIS EXISTS
 * ---------------
 * `/dk:bootstrap:init` used to copy the complexity scorer and its config into every project's
 * `.claude/bin/`. Nothing ever told those copies they had gone stale. When the model router landed,
 * a scaffold-day `complexity.config.json` — which takes precedence over the plugin's own — started
 * failing `model-route.mjs`'s config validation outright, and since routing is mandatory before
 * dispatch, that took down every `/dk:*` command in three real projects at once. Nobody found out
 * until the router hard-died mid-run: the scorer only warns, the router did not warn at all, and a
 * missing `routing-engine.mjs` warned least of all.
 *
 * The vendoring is gone (Claude Code puts every enabled plugin's `bin/` on the Bash tool's PATH, so
 * there was never anything to copy — see dev-kit-core's references/plugin-paths.md). This tool is
 * how projects scaffolded before that fix get there, and how they stay honest afterwards.
 *
 * THE THREE FILE CLASSES, HANDLED DIFFERENTLY
 * -------------------------------------------
 *   CODE        `.claude/bin/complexity-score.mjs`, `.claude/bin/routing-engine.mjs`
 *               Plugin artifacts with zero project content, and no longer vendored at all.
 *               End state: absent. `--apply` REMOVES them, as a set — the scorer imports the
 *               engine, so a half-removed pair is worse than either state.
 *
 *               `.claude/hooks/dk-context.js`, `.claude/hooks/lib/dk-common.js`
 *               Also plugin artifacts, but these still have a reason to be copied that no path
 *               convention fixes: `settings.json` cannot interpolate a plugin path for its
 *               `statusLine`. End state: byte-identical to the plugin's. `--apply` REFRESHES them,
 *               as a set, for the same import-closure reason.
 *
 *   CONFIG      `.claude/bin/complexity.config.json`
 *               An override with a working fallback. Byte-identical to a version dk shipped means
 *               it carries no project content — it is a stale pin, and the fix is REMOVAL, not a
 *               refresh: with no copy present, both tools fall through to the plugin's current one
 *               and the routing decision is identical. A copy that matches nothing dk shipped may
 *               hold real local tuning (`sensitivePaths`, `reversibility`), so it is KEPT and
 *               reported for a human decision, never rewritten.
 *
 *   CALIBRATION `.claude/bin/complexity-calibration.json` (and `.claude/complexity-calibration.json`)
 *               NEVER WRITTEN, under any flag. It is telemetry-derived and owner-approved; consuming
 *               projects' CLAUDE.md carries "never edit it directly; apply a proposal only on owner
 *               approval." It is not even read to decide whether a config is customized.
 *
 * REFUSING TO GUESS
 * -----------------
 * A file that matches NO version dk has ever shipped is reported `foreign` and left completely
 * alone. One real project carries a 369-line scorer descending from an earlier GSD pipeline; that
 * is a migration with consequences, not a stale copy, and the only correct move is to stop and say
 * so. Files dk has never shipped under any name at all (a project's own `track-metrics.mjs`) are
 * reported `unrecognized` and likewise never touched.
 *
 * An ABSENT config is not a gap to fill. Under the corrected default, absent is the desired state,
 * so it reports `absent-ok` and counts as converged.
 *
 * USAGE
 *   dk-converge.mjs [--check] [--json] [--project <dir>]   read-only report (default)
 *   dk-converge.mjs --apply [--json] [--project <dir>]     make the changes it can make safely
 *
 * EXIT CODES
 *   0  converged — nothing to do, or `--apply` finished and nothing needs a human
 *   1  drift this tool can fix mechanically (`--check` only; `--apply` fixes it and returns 0)
 *   2  usage error, or the project directory is unreadable
 *   3  something needs a human decision (`foreign` or `customized`) — never auto-resolved
 *
 * Exit 1 is deliberately distinct from exit 3: 1 wires cleanly into a session-start hook or CI as
 * "run --apply"; 3 never does, because no flag makes it safe.
 */

import { readFileSync, existsSync, statSync, readdirSync, mkdirSync, copyFileSync, rmSync, rmdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';

const SELF_DIR = dirname(new URL(import.meta.url).pathname);
const PLUGIN_ROOT = dirname(SELF_DIR);

const die = (msg) => { process.stderr.write(`dk-converge: ${msg}\n`); process.exit(2); };

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let apply = false;
let json = false;
let projectDir = process.cwd();

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--check' || a === '--dry-run') apply = false;
  else if (a === '--apply') apply = true;
  else if (a === '--json') json = true;
  else if (a === '--project') { projectDir = args[++i] ?? die('--project needs a directory'); }
  else if (a.startsWith('--project=')) projectDir = a.slice('--project='.length);
  else if (a === '--help' || a === '-h') {
    process.stdout.write('usage: dk-converge.mjs [--check|--apply] [--json] [--project <dir>]\n');
    process.exit(0);
  } else die(`unknown argument "${a}" — usage: dk-converge.mjs [--check|--apply] [--json] [--project <dir>]`);
}

projectDir = resolve(projectDir);
if (!existsSync(projectDir) || !statSync(projectDir).isDirectory())
  die(`not a directory: ${projectDir}`);

// ---------------------------------------------------------------------------
// What dk has ever shipped
// ---------------------------------------------------------------------------
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

let historical;
try {
  historical = JSON.parse(readFileSync(join(SELF_DIR, 'known-versions.json'), 'utf8')).files;
} catch (e) {
  die(`could not read known-versions.json beside me: ${e.message}`);
}

/** Every hash dk has ever shipped for `pluginRelPath`, current one included. */
function shippedVersions(pluginRelPath) {
  const out = new Map(Object.entries(historical[pluginRelPath] ?? {}));
  const live = join(PLUGIN_ROOT, pluginRelPath);
  if (existsSync(live)) out.set(sha(live), 'current');
  return out;
}

// ---------------------------------------------------------------------------
// The managed set
// ---------------------------------------------------------------------------
// `end` is what the project SHOULD look like once converged:
//   'absent'  — dk no longer vendors this; remove any copy that matches a shipped version
//   'current' — dk still vendors this; the copy must be byte-identical to the plugin's
// `set` groups files that must move together (an import closure).
const MANAGED = [
  { project: '.claude/bin/complexity-score.mjs',  plugin: 'bin/complexity-score.mjs',  end: 'absent',  set: 'scorer', kind: 'code' },
  { project: '.claude/bin/routing-engine.mjs',    plugin: 'bin/routing-engine.mjs',    end: 'absent',  set: 'scorer', kind: 'code' },
  { project: '.claude/bin/complexity.config.json', plugin: 'bin/complexity.config.json', end: 'absent', set: 'config', kind: 'config' },
  { project: '.claude/hooks/dk-context.js',       plugin: 'hooks/dk-context.js',       end: 'current', set: 'hooks',  kind: 'code' },
  { project: '.claude/hooks/lib/dk-common.js',    plugin: 'hooks/lib/dk-common.js',    end: 'current', set: 'hooks',  kind: 'code' },
];

// Read-only always. Named so it can be recognized and skipped, never so it can be written.
// The FIRST entry is the real one: complexity-score.mjs's loadCalibration() reads
// `join(process.cwd(), 'complexity-calibration.json')` — the PROJECT ROOT, not `.claude/`. The
// two `.claude/` paths are listed defensively so a copy that ended up in either place is still
// recognized as calibration and skipped rather than being reported `unrecognized`.
const NEVER_TOUCH = new Set([
  'complexity-calibration.json',
  '.claude/bin/complexity-calibration.json',
  '.claude/complexity-calibration.json',
]);

// ---------------------------------------------------------------------------
// Classify
// ---------------------------------------------------------------------------
const findings = [];
const add = (f) => findings.push(f);

for (const m of MANAGED) {
  const abs = join(projectDir, m.project);
  const shipped = shippedVersions(m.plugin);
  const pluginPath = join(PLUGIN_ROOT, m.plugin);

  if (!existsSync(abs)) {
    if (m.end === 'absent') {
      add({ ...m, status: 'absent-ok', note: 'not vendored — the plugin\'s own copy serves; this is the desired state' });
    } else {
      add({ ...m, status: 'missing', note: 'required copy is absent', fixable: true });
    }
    continue;
  }

  const h = sha(abs);
  const version = shipped.get(h);

  if (!version) {
    add({
      ...m,
      status: m.kind === 'config' ? 'customized' : 'foreign',
      hash: h,
      note: m.kind === 'config'
        ? 'differs from every version dk has shipped — may carry real local tuning (sensitivePaths / reversibility). Kept as-is; decide by hand whether to migrate it forward or drop it and use the plugin\'s.'
        : 'matches no version dk has ever shipped — this is a migration with consequences, not a stale copy. Left untouched; decide by hand.',
      needsDecision: true,
    });
    continue;
  }

  if (m.end === 'absent') {
    const which = version === 'current' ? 'the version dk ships today' : `dk ${version}`;
    add({ ...m, status: 'should-be-removed', version, note: `byte-identical to ${which} — a copy carrying no project content, and no longer vendored at all`, fixable: true });
  } else if (version === 'current') {
    add({ ...m, status: 'current', version });
  } else {
    add({ ...m, status: 'stale', version, note: `matches dk ${version}; the plugin now ships a different ${m.plugin}`, fixable: true });
  }
}

// Anything else living in .claude/bin/ is the project's own. Report it; never touch it.
const binDir = join(projectDir, '.claude/bin');
const managedProjectPaths = new Set(MANAGED.map((m) => m.project));
if (existsSync(binDir)) {
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) { walk(abs); continue; }
      const rel = relative(projectDir, abs).split('\\').join('/');
      if (managedProjectPaths.has(rel)) continue;
      if (NEVER_TOUCH.has(rel)) {
        add({ project: rel, status: 'read-only', kind: 'calibration', note: 'calibration data — telemetry-derived and owner-approved; never written by this tool, and never read to decide anything' });
        continue;
      }
      add({ project: rel, status: 'unrecognized', kind: 'project-local', note: 'dk has never shipped a file by this name — treated as the project\'s own and left alone' });
    }
  };
  walk(binDir);
}

for (const p of NEVER_TOUCH) {
  if (findings.some((f) => f.project === p)) continue;
  if (existsSync(join(projectDir, p)))
    add({ project: p, status: 'read-only', kind: 'calibration', note: 'calibration data — never written by this tool' });
}

// ---------------------------------------------------------------------------
// Orphaned project-scope install records. Enabling a plugin at project scope writes a record into
// ~/.claude/plugins/installed_plugins.json pinning the version installed that day. Removing the
// `enabledPlugins` block from settings.json does NOT remove that record — verified: one project's
// block was deleted by hand and its five records survived, still pinning an old version and
// holding its cache directory alive.
//
// REPORTED, NEVER TOUCHED. This file is Claude Code's own state, not the project's, and a live
// session rewrites it; a tool editing it underneath the harness would be racing. The supported
// removal is `/plugin uninstall <name>` from inside the project.
// ---------------------------------------------------------------------------
const installedPluginsPath = join(process.env.HOME ?? '', '.claude/plugins/installed_plugins.json');
if (existsSync(installedPluginsPath)) {
  try {
    const reg = JSON.parse(readFileSync(installedPluginsPath, 'utf8'));
    const settingsPath = join(projectDir, '.claude/settings.json');
    let enabled = null;
    if (existsSync(settingsPath)) {
      try { enabled = JSON.parse(readFileSync(settingsPath, 'utf8')).enabledPlugins ?? null; } catch { /* unparseable settings: treat as unknown */ }
    }
    const orphans = [];
    for (const [name, records] of Object.entries(reg.plugins ?? {})) {
      for (const r of Array.isArray(records) ? records : []) {
        if (r?.scope !== 'project') continue;
        if (resolve(r.projectPath ?? '') !== projectDir) continue;
        if (enabled && Object.prototype.hasOwnProperty.call(enabled, name)) continue;  // still enabled here
        orphans.push(`${name}@${r.version}`);
      }
    }
    if (orphans.length)
      add({
        project: '~/.claude/plugins/installed_plugins.json',
        status: 'orphaned-install-record',
        kind: 'harness-state',
        note: `${orphans.length} project-scope record(s) for this project that its settings.json no longer enables (${orphans.join(', ')}). They pin an old version and keep its cache directory alive. Not this tool's to remove — run \`/plugin uninstall\` from inside the project.`,
      });
  } catch { /* an unreadable registry is not this tool's problem to report on */ }
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
const actions = [];

if (apply) {
  // Sets move together or not at all — never half-update an import closure.
  const setsToFix = new Set(findings.filter((f) => f.fixable).map((f) => f.set));

  for (const setName of setsToFix) {
    const members = MANAGED.filter((m) => m.set === setName);
    const blocked = findings.find((f) => f.set === setName && f.needsDecision);
    if (blocked) {
      actions.push({ set: setName, action: 'skipped', reason: `${blocked.project} needs a human decision — the whole set is left alone rather than half-converged` });
      continue;
    }
    for (const m of members) {
      const abs = join(projectDir, m.project);
      if (m.end === 'absent') {
        if (existsSync(abs)) { rmSync(abs); actions.push({ file: m.project, action: 'removed' }); }
      } else {
        mkdirSync(dirname(abs), { recursive: true });
        copyFileSync(join(PLUGIN_ROOT, m.plugin), abs);
        actions.push({ file: m.project, action: 'refreshed' });
      }
    }
  }

  // Leave no empty .claude/bin/ behind — but only if it is genuinely empty.
  for (const dir of [join(projectDir, '.claude/bin/lib'), join(projectDir, '.claude/bin')]) {
    try {
      if (existsSync(dir) && readdirSync(dir).length === 0) { rmdirSync(dir); actions.push({ file: relative(projectDir, dir), action: 'removed empty directory' }); }
    } catch { /* a non-empty or unremovable dir is not an error — it just stays */ }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const needsDecision = findings.some((f) => f.needsDecision);
// In check mode every fixable finding still stands. After --apply only the ones whose set was
// skipped for a pending decision do — everything else has been written.
const blockedSets = new Set(findings.filter((f) => f.needsDecision).map((f) => f.set));
const stillFixable = findings.some((f) => f.fixable && (!apply || blockedSets.has(f.set)));

if (json) {
  process.stdout.write(`${JSON.stringify({
    project: projectDir,
    plugin: PLUGIN_ROOT,
    mode: apply ? 'apply' : 'check',
    findings,
    actions,
    converged: !stillFixable && !needsDecision,
  }, null, 2)}\n`);
} else {
  const width = Math.max(...findings.map((f) => f.project.length), 10);
  process.stdout.write(`dk-converge — ${apply ? 'apply' : 'check'} — ${projectDir}\n`);
  process.stdout.write(`plugin: ${PLUGIN_ROOT}\n\n`);
  for (const f of findings.sort((a, b) => a.project.localeCompare(b.project))) {
    process.stdout.write(`  ${f.project.padEnd(width)}  ${f.status.toUpperCase()}${f.note ? `\n  ${' '.repeat(width)}  ${f.note}` : ''}\n`);
  }
  if (actions.length) {
    process.stdout.write('\nactions:\n');
    for (const a of actions) process.stdout.write(`  ${a.action}: ${a.file ?? a.set}${a.reason ? ` — ${a.reason}` : ''}\n`);
  }
  process.stdout.write('\n');
  if (needsDecision) process.stdout.write('NEEDS A DECISION — see the foreign/customized entries above. Nothing was written for them.\n');
  else if (stillFixable) process.stdout.write('DRIFT — re-run with --apply to converge.\n');
  else process.stdout.write('converged.\n');
}

process.exit(needsDecision ? 3 : (stillFixable ? 1 : 0));
