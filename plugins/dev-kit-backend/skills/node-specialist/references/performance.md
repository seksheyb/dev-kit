# Performance Optimization

## Event Loop Blockage Prevention

The single-threaded event loop stalls on any long synchronous operation — CPU-bound work, large synchronous JSON parses, `sort()` on huge arrays, regex catastrophic backtracking. Symptoms: rising p99 latency under load while p50 looks fine, and a growing task queue.

- Move CPU-bound work to `worker_threads` — don't offload to `child_process` unless you need process isolation or a separate memory limit.
- Chunk large synchronous loops with `setImmediate`/`queueMicrotask` checkpoints when a worker thread isn't warranted.
- Use `node --prof` or the `perf_hooks` module to confirm the event loop is actually the bottleneck before restructuring code.

```javascript
const { Worker } = require('node:worker_threads');

function runInWorker(workerFile, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
    });
  });
}
```

## Measuring Event Loop Lag

```javascript
const { monitorEventLoopDelay } = require('node:perf_hooks');
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(() => {
  logger.info({ p50: histogram.mean, p99: histogram.percentile(99) }, 'event loop lag');
  histogram.reset();
}, 30_000);
```

## Memory Leak Detection

Common leaks: unbounded caches (Map/object growing without eviction), listeners added per-request but never removed, closures retaining large buffers, module-level arrays that only grow.

- Take heap snapshots with `node --inspect` + Chrome DevTools, or `node --heapsnapshot-signal=SIGUSR2` for on-demand snapshots in production.
- Compare snapshots across two points under steady load — objects that should have been garbage collected but persist across snapshots are the leak.
- Watch `process.memoryUsage().heapUsed` trend over time in monitoring; a steady upward slope under constant load (not traffic growth) indicates a leak.

## Garbage Collection Tuning

- `--max-old-space-size` caps heap size — set it below the container memory limit (leave headroom for non-heap memory: buffers, native addons) so the OOM killer doesn't fire before GC has a chance to reclaim.
- `node --trace-gc` surfaces GC pause frequency and duration; frequent long "Mark-sweep" pauses under load indicate an oversized heap or a retention leak, not a tuning problem to paper over.
- Prefer fixing retention (leaks, oversized caches) over aggressive GC flag tuning — flags shift when pauses happen, not whether the memory pressure exists.

## Stream Processing Instead of Buffering

Buffering an entire file or response body into memory before processing does not scale with payload size. See `references/streams.md` for the full streams API — the short version: pipe, don't buffer, for anything that can exceed a few MB (file uploads, large API responses, CSV/log processing).

## Connection Pooling

- Reuse a single pool per process for databases (`pg.Pool`, Prisma's connection pool, `mysql2` pool) — never open a connection per request.
- Size the pool to the database's max connection limit divided by expected process/replica count, not to a fixed arbitrary number.
- Set pool `idleTimeoutMillis` and `connectionTimeoutMillis` explicitly — an unbounded wait for a pool slot manifests as request timeouts that are hard to distinguish from a slow query.

## Caching Strategies

- Redis (or Memcached) for shared, cross-process cache — required once you run more than one Node process/replica, since in-process caches diverge.
- In-process `Map`-based caches are fine for single-replica deployments or data that's safe to be briefly stale per-process, but must have a size bound (LRU) or TTL — an unbounded in-process cache is a memory leak by another name.
- Cache invalidation strategy (TTL vs explicit invalidation on write) should be decided per data type — don't default to "cache everything with a 5-minute TTL" without checking staleness tolerance.

## Profiling with Built-in Tools

| Tool | Use for |
|---|---|
| `node --prof` + `node --prof-process` | CPU profile — where time is actually spent |
| `node --inspect` + Chrome DevTools | Interactive CPU/heap profiling, breakpoints |
| `perf_hooks.monitorEventLoopDelay` | Event loop lag over time, low overhead, safe for production |
| `node --heapsnapshot-signal` | On-demand heap snapshot without restarting the process |
| `clinic.js` (`clinic doctor`, `clinic flame`) | Ecosystem tool that wraps the above into readable reports |

## Common Mistakes

- Profiling in development and drawing conclusions about production — GC behavior, connection pool contention, and event loop lag under real concurrency don't show up on a laptop with one request at a time.
- Tuning GC flags before confirming GC is actually the bottleneck — check `--trace-gc` output and heap growth trend first.
- Buffering large payloads (`req.body` accumulation, full-file reads) when a stream would do the same work with constant memory.
