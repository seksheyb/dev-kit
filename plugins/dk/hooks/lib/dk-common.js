'use strict';
// dk-common.js — shared helpers for the Node hooks in this directory.
//   const dk = require('./lib/dk-common.js');
//
// Contracts live in ../CONTRACTS.md. The five invariants that matter here: self-scope
// on .dk-state, never block, honor kill switches first, stay silent by default, and no
// code derived from external hook packages.

const fs = require('fs');
const path = require('path');

// readPayload(cb) — read the hook payload from stdin and hand it to cb.
// Invariant 2: any failure — malformed JSON, a stalled pipe, a thrown callback —
// exits 0 with no output. The timeout guards against a pipe that never closes,
// which would otherwise hang until the harness kills us and reports a hook error.
function readPayload(cb) {
  let input = '';
  const timer = setTimeout(() => process.exit(0), 8000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { input += c; });
  process.stdin.on('end', () => {
    clearTimeout(timer);
    let data;
    try {
      data = JSON.parse(input);
    } catch {
      process.exit(0);
    }
    try {
      cb(data);
    } catch {
      process.exit(0);
    }
  });
  process.stdin.on('error', () => process.exit(0));
}

// root(data) — project root for this session.
function root(data) {
  const c = data && data.cwd;
  if (c && typeof c === 'string') {
    try { if (fs.statSync(c).isDirectory()) return c; } catch { /* fall through */ }
  }
  return process.cwd();
}

// statePath(data) — absolute path to .dk-state.
function statePath(data) {
  return path.join(root(data), '.dk-state');
}

// guard(data) — invariant 1. Exits silently unless a dk run is active here.
function guard(data) {
  if (!fs.existsSync(statePath(data))) process.exit(0);
}

function readState(data) {
  try { return fs.readFileSync(statePath(data), 'utf8'); } catch { return ''; }
}

// flagOff(data, name) — invariant 3. True when `<name>: off` is set in .dk-state.
function flagOff(data, name) {
  return new RegExp(`^\\s*${name}:\\s*off\\s*$`, 'im').test(readState(data));
}

// stateKey(data, key) — read a key from .dk-state. Returns '' when absent, or when
// the value is the contract's null marker `-`.
function stateKey(data, key) {
  const m = readState(data).match(new RegExp(`^\\s*${key}:\\s*(.*)$`, 'im'));
  if (!m) return '';
  const v = m[1].trim().replace(/^"(.*)"$/, '$1');
  return v === '-' ? '' : v;
}

// emit(event, text) — invariant 4. Print the context-injection envelope and exit 0.
// Called with empty text it emits nothing, which is the common case.
function emit(event, text) {
  if (!text) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: text }
  }));
  process.exit(0);
}

// safeSessionId(data) — session id sanitized for use in a filename, or null.
// An id carrying separators or traversal could escape the temp directory.
function safeSessionId(data) {
  const s = data && data.session_id;
  if (!s || typeof s !== 'string') return null;
  if (/[/\\]|\.\./.test(s)) return null;
  return s;
}

module.exports = {
  readPayload, root, statePath, guard, readState,
  flagOff, stateKey, emit, safeSessionId
};
