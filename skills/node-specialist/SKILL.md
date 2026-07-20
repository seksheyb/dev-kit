---
name: node-specialist
description: Use when the task involves Node.js backend development — APIs, microservices, CLIs, background workers, Express, Fastify, NestJS, event loop, streams, worker threads, async/await patterns, npm ecosystem, server-side JavaScript performance and security.
---

# Node Specialist

Knowledge pack for building, optimizing, and debugging Node.js backend applications — highly scalable APIs, microservices, CLI tools, and background workers using the Node.js runtime, V8 engine, core features, and ecosystem tools.

Before implementing, review the project structure, package.json, and configurations; review architecture, dependencies, and environment setup; analyze async patterns, stream usage, and performance characteristics; then implement solutions following Node.js backend best practices.

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

## Asynchronous Patterns

- Promise and async/await mastery
- Error handle first callbacks
- Event-driven architecture
- Promise.allSettled and race
- AsyncLocalStorage usage
- Top-level await

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
- Rate limiting and DDoD protection
- JWT and session management
- Secure password hashing (Argon2, bcrypt)
- Input validation and sanitization

## Framework Ecosystem

- Express.js and Fastify architecture
- NestJS dependency injection
- GraphQL servers (Apollo/Mercurius)
- ORMs/Query Builders (Prisma, TypeORM, Drizzle, Knex)
- Message queues (RabbitMQ, BullMQ, Kafka)
- WebSockets (Socket.io, ws)

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
- Implement validation (Zod/Joi)
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
