# Stream API

## Why Streams

Streams process data in chunks with constant memory, instead of buffering an entire payload before acting on it. Use them for anything whose size isn't bounded and known-small: file uploads/downloads, large API responses, CSV/log processing, proxying between two I/O sources.

## The Four Stream Types

| Type | Direction | Examples |
|---|---|---|
| `Readable` | Source → app | `fs.createReadStream`, HTTP request body, `process.stdin` |
| `Writable` | App → sink | `fs.createWriteStream`, HTTP response, `process.stdout` |
| `Duplex` | Both, independent | TCP sockets |
| `Transform` | Both, output derived from input | `zlib.createGzip`, `crypto` cipher streams, custom parsers |

## pipeline() Over .pipe()

`stream.pipeline()` (from `node:stream/promises`) is the default way to connect streams — unlike `.pipe()`, it forwards errors from every stream in the chain and guarantees cleanup (destroying all streams) if any one of them fails or the consumer aborts early. Manual `.pipe()` chains silently leak file descriptors on mid-stream errors unless every stream's `'error'` handler manually destroys the others.

```javascript
const { pipeline } = require('node:stream/promises');
const { createReadStream, createWriteStream } = require('node:fs');
const { createGzip } = require('node:zlib');

await pipeline(
  createReadStream('input.log'),
  createGzip(),
  createWriteStream('input.log.gz')
);
// Throws (rejects) with the first error in the chain; all streams are cleaned up automatically.
```

## Async Iteration Over Streams

Readable streams are async iterables — use `for await` for simple line-by-line or chunk-by-chunk consumption when you don't need backpressure-aware piping into another stream:

```javascript
const readline = require('node:readline');
const rl = readline.createInterface({ input: createReadStream('access.log') });

for await (const line of rl) {
  if (line.includes('ERROR')) errorCount++;
}
```

## Writing a Transform Stream

```javascript
const { Transform } = require('node:stream');

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

await pipeline(
  createReadStream('in.txt'),
  new UppercaseTransform(),
  createWriteStream('out.txt')
);
```

For simple cases, `stream.Transform` construction via the options object (passing a `transform` function) avoids the subclass boilerplate:

```javascript
const { Transform } = require('node:stream');
const upper = new Transform({
  transform(chunk, enc, cb) { cb(null, chunk.toString().toUpperCase()); }
});
```

## Backpressure

`writable.write()` returns `false` when the internal buffer exceeds `highWaterMark` — the producer should pause until `'drain'` fires before writing more. `pipeline()` and `.pipe()` handle this automatically; only hand-roll backpressure logic when reading from one stream and writing to a non-stream sink manually (e.g., writing to a rate-limited external API).

```javascript
if (!writable.write(chunk)) {
  await new Promise((resolve) => writable.once('drain', resolve));
}
```

## Web Streams Interop

Node's implementation of the WHATWG Web Streams API (`ReadableStream`, `WritableStream`, `TransformStream`) is stable and shared with `fetch`'s `response.body`. Convert between Node streams and Web streams with `stream.Readable.toWeb()` / `stream.Readable.fromWeb()` when mixing a `fetch` response body into a Node-stream pipeline:

```javascript
const { Readable } = require('node:stream');
const res = await fetch(url);
const nodeStream = Readable.fromWeb(res.body);
await pipeline(nodeStream, createWriteStream('download.bin'));
```

## Common Mistakes

- Using `.pipe()` chains for anything with more than one stage — error handling requires manually wiring `'error'` on every stream; `pipeline()` does this for free.
- Buffering a stream into memory with an array of chunks + `Buffer.concat` when the actual goal is to forward or process incrementally — defeats the purpose of streaming.
- Ignoring `write()`'s boolean return value and pushing data faster than the sink can drain it — causes unbounded memory growth in the writable's internal buffer, not the fast turnaround the code implies.
- Forgetting that a `Transform`'s `_transform` callback must be called exactly once per chunk — calling it twice, or never, stalls or corrupts the stream.
