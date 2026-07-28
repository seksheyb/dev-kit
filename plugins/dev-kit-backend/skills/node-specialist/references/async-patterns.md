# Asynchronous Patterns

## Promise and async/await Fundamentals

```javascript
async function fetchUser(id) {
  try {
    const res = await fetch(`https://api.example.com/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    logger.error({ err, id }, 'fetchUser failed');
    throw err;
  }
}
```

Node ships a native, browser-compatible `fetch`/`FormData`/Web Streams implementation (stable since Node 18) — reach for `node-fetch` or `axios` only when you need interceptors, automatic retries, or a client shared with legacy callback code. For simple outbound HTTP calls, native `fetch` is the default choice.

## Concurrency Combinators

| Combinator | Behavior | Use when |
|---|---|---|
| `Promise.all` | Rejects fast on first rejection | All results required, fail-fast is acceptable |
| `Promise.allSettled` | Waits for every promise, never rejects | Partial failures are acceptable (batch jobs, fan-out calls) |
| `Promise.race` | Resolves/rejects on first settle | Timeouts, "fastest wins" |
| `Promise.any` | Resolves on first fulfillment, rejects only if all reject | Multiple redundant sources, first success wins |

```javascript
const results = await Promise.allSettled(userIds.map(fetchUser));
const failures = results.filter(r => r.status === 'rejected');
```

## Error-First Callbacks

Legacy Node APIs and some ecosystem packages still use `(err, result) => {}` callbacks. Wrap them with `util.promisify` rather than hand-rolling a Promise:

```javascript
const { promisify } = require('node:util');
const fs = require('node:fs');
const readFile = promisify(fs.readFile);
// Prefer node:fs/promises directly when available — it's the same API, already promisified.
const { readFile: readFileP } = require('node:fs/promises');
```

## AsyncLocalStorage for Request Context

`AsyncLocalStorage` (stable, `node:async_hooks`) propagates context across async boundaries without threading a parameter through every function call — the standard way to carry a request ID, tenant ID, or trace context through async/await chains, including inside `setTimeout`, promise chains, and stream callbacks.

```javascript
const { AsyncLocalStorage } = require('node:async_hooks');
const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  requestContext.run({ requestId: crypto.randomUUID() }, next);
});

function logger(msg) {
  const ctx = requestContext.getStore();
  console.log(`[${ctx?.requestId ?? 'no-context'}] ${msg}`);
}
```

## Top-Level Await

ESM modules support `await` at the module top level — useful for one-time async initialization (DB connection, config fetch) before the rest of the module loads. Not available in CommonJS; wrap the entry point in an async IIFE there instead.

```javascript
// db.mjs
export const pool = await createPool(process.env.DATABASE_URL);
```

## Event-Driven Architecture

`EventEmitter` remains the backbone for decoupled, in-process pub/sub (lifecycle hooks, plugin systems, streaming progress events). Always attach an `'error'` listener — an unhandled `'error'` event throws and can crash the process:

```javascript
const emitter = new EventEmitter();
emitter.on('error', (err) => logger.error({ err }, 'emitter error'));
```

## Native WebSocket Client

Node 21+ ships a global `WebSocket` constructor with the same API surface as browsers. For simple outbound/client connections (calling out to a WebSocket API, a test harness, a CLI tool), this native global replaces the `ws` package:

```javascript
const socket = new WebSocket('wss://example.com/stream');
socket.addEventListener('message', (event) => console.log(event.data));
```

Server-side WebSocket handling (accepting connections, broadcasting to many clients, rooms/namespaces) still calls for `ws` or Socket.IO — the native global is a client API only.

## node:test as the Default Test Runner

`node:test` (stable since Node 20) covers assertions, mocks, coverage, watch mode, and parallel execution without a dependency. Treat it as the default for new projects; reach for Jest or Vitest only when the project already depends on their ecosystem (snapshot testing, existing config, framework-specific integrations like `@nestjs/testing`).

```javascript
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

test('fetchUser returns parsed JSON', async (t) => {
  const fetchMock = mock.method(globalThis, 'fetch', async () =>
    new Response(JSON.stringify({ id: 1 }), { status: 200 }));
  const user = await fetchUser(1);
  assert.equal(user.id, 1);
});
```

## Common Mistakes

- Forgetting `await` inside a `.map()` callback — produces an array of pending Promises, not resolved values. Use `Promise.all(items.map(async (i) => ...))`.
- Using `Promise.all` when partial failure is acceptable — prefer `Promise.allSettled` for fan-out batch work so one failure doesn't discard successful results.
- Losing async context across `setTimeout`/`setInterval` — `AsyncLocalStorage` handles this correctly; a manually-threaded context parameter is easy to forget in one branch.
- Missing `'error'` listener on an `EventEmitter` — an emitted `error` event with no listener throws synchronously and can bring down the process.
