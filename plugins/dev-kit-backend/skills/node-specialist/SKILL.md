---
name: node-specialist
description: Use when the task involves Node.js backend development — APIs, microservices, CLIs, background workers, Express, Fastify, NestJS, event loop, streams, worker threads, async/await patterns, npm ecosystem, server-side JavaScript performance and security.
---

# Node Specialist

Knowledge pack for building, optimizing, and debugging Node.js backend applications — highly scalable APIs, microservices, CLI tools, and background workers using the Node.js runtime, V8 engine, core features, and ecosystem tools.

Before implementing, review the project structure, package.json, and configurations; review architecture, dependencies, and environment setup; analyze async patterns, stream usage, and performance characteristics; then implement solutions following Node.js backend best practices.

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Async Patterns | `references/async-patterns.md` | Promises, async/await, AsyncLocalStorage, event-driven code, node:test |
| Performance | `references/performance.md` | Event loop lag, memory leaks, GC tuning, connection pooling, profiling |
| Streams | `references/streams.md` | Readable/Writable/Transform streams, pipeline(), backpressure |

## Node.js Development Checklist

- Package.json correctly configured
- Asynchronous code properly handled
- Error boundaries established
- Memory management optimized
- Security best practices implemented
- Logging configured appropriately
- Environment variables secured
- Graceful shutdown implemented

## Node.js Core Mastery

- Event Loop deep understanding
- Stream API and buffers
- File System (fs/promises)
- Child Processes and Worker Threads
- Clustering and IPC
- Events and EventEmitter
- HTTP/HTTPS modules
- Native addons and N-API
- Node 24 (Active LTS) as the default target; Node 22 (Maintenance LTS) for older codebases

## Asynchronous Patterns

- Promise and async/await mastery
- Error handle first callbacks
- Event-driven architecture
- Promise.allSettled and race
- AsyncLocalStorage usage
- Top-level await
- Native `fetch`, `FormData`, and Web Streams for HTTP calls — no need for `node-fetch`/`axios` on simple requests
- Native `WebSocket` global for outbound client connections (server-side still uses `ws`/Socket.IO)
- `node:test` as the default test runner (assertions, mocks, coverage, watch mode) — reach for Jest/Vitest only when the project already depends on their ecosystem

## Performance Optimization

- Memory leak detection and prevention
- Event loop blockage prevention
- Garbage collection tuning
- Stream processing instead of buffering
- Connection pooling
- Caching strategies (Redis, Memcached)
- Profiling with Node built-in tools

## Security Practices

- OWASP Top 10 mitigation
- npm audit and dependency vetting
- CORS and helmet configuration
- Rate limiting and DDoS protection (see `references/performance.md` for connection/throughput tuning)
- JWT and session management
- Secure password hashing (Argon2id first, bcrypt as fallback)
- Input validation and sanitization

## Framework Ecosystem

- Express 5 (current default) and Fastify 5 architecture
- NestJS dependency injection
- GraphQL servers (Apollo/Mercurius)
- ORMs/Query Builders — Prisma or Drizzle as the default choice for new projects; TypeORM/Knex for existing transaction-heavy codebases
- Message queues (RabbitMQ, BullMQ, Kafka)
- WebSockets (Socket.io, ws) — native `WebSocket` global for simple outbound clients

## Development Workflow

### 1. Code Analysis

Understand existing backend patterns and structure.

Analysis priorities:

- Dependency evaluation and audit
- Async code structure
- Middleware architecture
- Database connection lifecycle
- Error handling patterns
- Security posture

### 2. Implementation Phase

Develop robust backend solutions.

Implementation approach:

- Optimize I/O bound operations
- Setup proper logging (Pino/Winston)
- Implement validation (Zod first, Joi for legacy schemas)
- Construct proper error classes
- Implement graceful degradation
- Setup thorough unit and integration testing

### 3. Quality Assurance

Ensure the backend is production-ready.

Quality verification:

- High load testing passing
- Memory footprint stable
- Security audits clear
- Error tracking integrated
- Zero-downtime deployment ready

## Priorities

- Prioritize scalability, system stability, and I/O performance while leveraging the Node.js event-driven architecture.
