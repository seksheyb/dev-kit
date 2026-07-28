#!/usr/bin/env node
'use strict';
// dk-context.js — context-budget awareness for a dk run. Dual-mode, by design.
//
//   node dk-context.js --statusline   ← Claude Code `statusLine` command (NOT a hook)
//   node dk-context.js --monitor      ← PostToolUse hook (matcher Bash|Edit|Write|Agent)
//
// Why one file with two modes: the harness reports `context_window` to the statusLine
// command and to nothing else — no hook payload carries it (see ../CONTRACTS.md). So the
// statusline half writes the number to a small bridge file and the hook half reads it
// back. Splitting these into two files would put a shared file format across a boundary
// nobody would remember existed; keeping them adjacent is the point.
//
// Invariant 2 is absolute here. This runs on every tool call and, in statusline mode,
// several times a second. It never blocks, never throws, and never exits non-zero.

const fs = require('fs');
const os = require('os');
const path = require('path');
const dk = require('./lib/dk-common.js');

const TMP = process.env.TMPDIR || os.tmpdir() || '/tmp';

// Bridge freshness. Longer than a statusline refresh, short enough that a number from a
// previous burst of work is never mistaken for the current one.
const BRIDGE_MAX_AGE_S = 60;

// Thresholds are per-source: anything reconstructed from the transcript is a turn behind,
// so it must warn earlier to warn at the same true remaining budget.
const THRESHOLDS = {
  bridge:     { warning: 35, critical: 25, label: 'statusline' },
  hybrid:     { warning: 40, critical: 30, label: 'estimated, known window' },
  transcript: { warning: 40, critical: 30, label: 'transcript, estimated' }
};

// Tool calls that must pass between two emissions of the same severity. An escalation
// ignores it — the whole value of the critical message is that it is not late.
const DEBOUNCE_CALLS = 5;

// Known context window sizes, ascending. Add a size by adding it here; the inference below
// needs no other change.
const WINDOW_TIERS = [200000, 1000000];

const TRANSCRIPT_TAIL_BYTES = 256 * 1024;

// ---------------------------------------------------------------- shared

function bridgePath(sid) {
  return path.join(TMP, `dk-ctx-${sid}.json`);
}

function debouncePath(sid) {
  return path.join(TMP, `dk-ctx-${sid}-warned.json`);
}

function readJsonFile(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function clampPct(n) {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function positiveNumber(n) {
  return typeof n === 'number' && isFinite(n) && n > 0;
}

// ---------------------------------------------------------------- statusline mode

// The statusline payload is not a hook payload — it carries `context_window` and a `model`
// object, and readPayload's "unparseable is a real fault" stance is wrong for it (a broken
// statusline should still print something). So stdin is read directly here.
function readStatuslinePayload(cb) {
  let input = '';
  const timer = setTimeout(() => finish(null), 3000);
  let done = false;
  function finish(data) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    try { cb(data); } catch { process.stdout.write('\n'); }
    process.exit(0);
  }
  try {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => { input += c; });
    process.stdin.on('error', () => finish(null));
    process.stdin.on('end', () => {
      let data = null;
      try { data = JSON.parse(input); } catch { /* render what we can: nothing */ }
      finish(data);
    });
  } catch { finish(null); }
}

function modelName(data) {
  const m = data && data.model;
  if (!m) return '';
  if (typeof m === 'string') return m;
  return m.display_name || m.displayName || m.name || m.id || '';
}

// Milestone/phase segment. Absent state is the normal case outside a dk run, and the
// self-scope guard deliberately does NOT apply in statusline mode: the ctx number is
// useful in every repo, so only the dk-specific segments drop out.
function positionSegment(data) {
  const milestone = dk.stateKey(data, 'milestone');
  const phase = dk.stateKey(data, 'phase');
  if (milestone && phase) return `${milestone}·phase ${phase}`;
  return milestone || (phase ? `phase ${phase}` : '');
}

// Queue path is fixed by CONTRACTS.md (`.claude/dk-wiki-pending`, tab-separated). Consumers
// dedupe by path keeping the newest entry, so the pending count is unique paths, not lines.
function wikiPending(data) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(dk.root(data), '.claude', 'dk-wiki-pending'), 'utf8');
  } catch { return 0; }
  const paths = new Set();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const p = line.split('\t')[2];
    if (p && p.trim()) paths.add(p.trim());
  }
  return paths.size;
}

// The bridge is the reason this mode exists. Written on every render so the hook half
// always has a number less than a minute old while the user is actually working.
//
// `total_tokens` is persisted alongside the percentage because it outlives it: the
// percentage is meaningless a minute later, but the window does not change mid-session, so
// a stale bridge still carries an exact denominator. That is the only place the true window
// is ever stated — it appears nowhere in the transcript.
function writeBridge(data, cw, remaining) {
  const sid = dk.safeSessionId(data);
  if (!sid || remaining === null) return;
  const record = {
    remaining_percentage: remaining,
    used_pct: 100 - remaining,
    timestamp: Math.floor(Date.now() / 1000)
  };
  if (positiveNumber(cw.total_tokens)) record.total_tokens = cw.total_tokens;
  try {
    fs.writeFileSync(bridgePath(sid), JSON.stringify(record));
  } catch { /* a read-only tmp must not break the statusline */ }
}

function runStatusline() {
  readStatuslinePayload(data => {
    if (!data) { process.stdout.write('\n'); return; }

    const cw = data.context_window || {};
    const remaining = clampPct(cw.remaining_percentage);
    writeBridge(data, cw, remaining);

    const segments = [];
    const model = modelName(data);
    if (model) segments.push(model);

    const position = positionSegment(data);
    if (position) segments.push(position);

    // Reported as remaining, not used: every other dk surface that talks about context
    // budget — the warnings below, the session-boundary advice — speaks in what is left.
    if (remaining !== null) segments.push(`ctx ${Math.round(remaining)}%`);

    const pending = wikiPending(data);
    if (pending > 0) segments.push(`wiki ${pending} pending`);

    process.stdout.write(segments.join(' │ ') + '\n');
  });
}

// ---------------------------------------------------------------- monitor mode

// Read dk's own bridge, fresh or not — a stale one is still useful for its window.
//
// Deliberately only `dk-ctx-<session>.json`. Other tools write compatible-looking bridges
// under other names; reading them would be untested code on every machine that matters.
function readBridge(data) {
  const sid = dk.safeSessionId(data);
  if (!sid) return null;
  const record = readJsonFile(bridgePath(sid));
  if (!record || typeof record.timestamp !== 'number') return null;
  const age = Math.floor(Date.now() / 1000) - record.timestamp;
  return { record, fresh: age >= 0 && age <= BRIDGE_MAX_AGE_S };
}

// Read only the tail: transcripts run to tens of megabytes on a long session, and the
// line we want is always near the end.
function readTail(file, bytes) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, bytes);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const text = buf.toString('utf8');
    // A mid-line start would parse as garbage; drop the fragment.
    return len < size ? text.slice(text.indexOf('\n') + 1) : text;
  } catch {
    return '';
  } finally {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch { /* nothing to do */ } }
  }
}

// Infer the window from the largest token total the session has actually reached.
//
// Model id is NOT evidence: measured against the statusline across 8 sessions, seven agreed
// to the point, and the eighth ran `claude-opus-5` — a 1M id — against a 200k window
// (135790/200000 = 67.9%, matching the bridge exactly). The window is a session
// configuration and appears nowhere in the transcript; every field name was checked.
//
// So infer it from the one thing the transcript does prove: a session that has reached N
// live tokens has a window of at least N. Default to the smallest tier and step up only
// when the observed peak rules it out. That errs toward over-warning on a large window
// early in a session, and self-corrects the moment the peak crosses a tier. Over-warning is
// recoverable; the bug this replaces reported 14% for a session truly at 68% and said
// nothing at all. Do not "simplify" this back to a model-id lookup.
function inferWindow(peak) {
  for (const w of WINDOW_TIERS) if (peak <= w) return w;
  return WINDOW_TIERS[WINDOW_TIERS.length - 1];
}

function usageTotal(usage) {
  // Cache reads and creations occupy the window exactly as fresh input tokens do.
  return (usage.input_tokens || 0)
    + (usage.cache_creation_input_tokens || 0)
    + (usage.cache_read_input_tokens || 0)
    + (usage.output_tokens || 0);
}

// Walk the transcript tail for two numbers: the latest usage total (the live context size)
// and the largest seen (evidence about the window). Inherently ~1 turn stale — the last
// assistant message's usage describes the request that produced it, so everything since
// this turn began is uncounted. That is why every transcript-derived threshold above fires
// earlier than the bridge's.
function scanTranscript(file) {
  if (!file || typeof file !== 'string') return null;

  const lines = readTail(file, TRANSCRIPT_TAIL_BYTES).split('\n');
  let latest = null;
  let peak = 0;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (!entry || entry.type !== 'assistant') continue;
    const usage = entry.message && entry.message.usage;
    if (!usage || typeof usage !== 'object') continue;

    const total = usageTotal(usage);
    if (!total) continue;
    if (latest === null) latest = total;
    if (total > peak) peak = total;
  }
  return latest === null ? null : { latest, peak };
}

function remainingFrom(tokens, window) {
  return clampPct(100 - (tokens / window) * 100);
}

// Source resolution, best evidence first. The middle case is the one that matters: a stale
// bridge's percentage is worthless but its window is still exact, so pairing it with a
// fresh transcript numerator makes both halves measured rather than guessed.
function resolveReading(data) {
  const bridge = readBridge(data);

  if (bridge && bridge.fresh) {
    const remaining = clampPct(bridge.record.remaining_percentage);
    if (remaining !== null) return { remaining, source: 'bridge' };
  }

  const usage = scanTranscript(data && data.transcript_path);
  if (!usage) return null;

  const knownWindow = bridge && positiveNumber(bridge.record.total_tokens)
    ? bridge.record.total_tokens
    : null;
  if (knownWindow) {
    const remaining = remainingFrom(usage.latest, knownWindow);
    if (remaining !== null) return { remaining, source: 'hybrid' };
  }

  const remaining = remainingFrom(usage.latest, inferWindow(usage.peak));
  return remaining === null ? null : { remaining, source: 'transcript' };
}

function severityFor(remaining, source) {
  const t = THRESHOLDS[source];
  if (remaining <= t.critical) return 'critical';
  if (remaining <= t.warning) return 'warning';
  return 'none';
}

const RANK = { none: 0, warning: 1, critical: 2 };

// Debounce bookkeeping. `calls` counts monitor invocations that got far enough to know a
// percentage; `emittedAt` is the call number of the last emission.
function shouldEmit(sid, severity) {
  const file = sid ? debouncePath(sid) : null;
  const prev = file ? readJsonFile(file) : null;
  const calls = ((prev && prev.calls) || 0) + 1;
  const prevLevel = (prev && prev.level) || 'none';
  const emittedAt = (prev && prev.emittedAt) || 0;

  let emit = false;
  if (severity !== 'none') {
    // Escalation bypasses the debounce; a first warning has nothing to debounce against.
    if (RANK[severity] > RANK[prevLevel]) emit = true;
    else if (calls - emittedAt >= DEBOUNCE_CALLS) emit = true;
  }

  const next = {
    calls,
    // Dropping back below the thresholds (a /clear, a compact) resets the ladder, so the
    // next warning of the new session arrives immediately rather than being debounced.
    level: severity,
    emittedAt: emit ? calls : emittedAt
  };
  if (file) {
    try { fs.writeFileSync(file, JSON.stringify(next)); } catch { /* best effort */ }
  }
  return emit;
}

// Advisory, never imperative: this hook cannot know whether stopping now is correct, and a
// hook that orders the agent around mid-task is how a good warning becomes noise.
function message(severity, remaining, source) {
  const label = THRESHOLDS[source].label;
  const left = Math.round(remaining);
  const used = 100 - left;
  if (severity === 'critical') {
    return `CONTEXT CRITICAL: ~${used}% used, ~${left}% left (${label}). Tell the user to `
      + `run context-save, then /clear, then /dk:run to resume — position is on disk, so `
      + `resuming is cheap.`;
  }
  return `CONTEXT WARNING: ~${used}% used, ~${left}% left (${label}). Avoid starting new `
    + `work in this step. The next dk session boundary is the natural place to stop.`;
}

function runMonitor() {
  dk.readPayload(data => {
    dk.guard(data);

    const reading = resolveReading(data);
    if (!reading) process.exit(0);   // no source — nothing honest to say

    const severity = severityFor(reading.remaining, reading.source);
    if (!shouldEmit(dk.safeSessionId(data), severity)) process.exit(0);

    dk.emit('PostToolUse', message(severity, reading.remaining, reading.source));
  });
}

// ---------------------------------------------------------------- entry

try {
  if (process.argv.includes('--statusline')) runStatusline();
  else if (process.argv.includes('--monitor')) runMonitor();
  else process.exit(0);
} catch {
  process.exit(0);
}
