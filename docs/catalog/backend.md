# Backend Engineer

## Languages & Runtimes

#### `cpp-pro`
- **Why needed:** Modern C++ (20/23) has enough surface area — concepts, ranges, coroutines, allocator-aware containers — that generic completions tend to regress to C++03/11 idioms (raw pointers, manual loops) unless explicitly pinned to current standards and toolchains.
- **What it does:** Encodes a workflow of designing with C++20 concepts, applying RAII/constexpr, then running AddressSanitizer/UndefinedBehaviorSanitizer and profiling before considering work done. Hard constraints ban raw `new`/`delete`, C-style casts, and ignored compiler warnings, with copy-paste concept and RAII wrapper templates.
- **Why not vanilla Claude Code:** Base model knowledge of C++ blends two decades of idiom eras; without this skill Claude Code is as likely to hand back a `malloc`/`free` pattern as a `unique_ptr` one, and won't reliably insist on sanitizer runs before declaring memory safety.
- **When to use:** Building or refactoring C++ code requiring concepts, ranges, coroutines, SIMD optimization, or careful memory management — or addressing performance bottlenecks, concurrency issues, and CMake configuration.
- **Then what:** Output shifts to concept-constrained templates, smart-pointer ownership, `-Wall -Wextra -Wpedantic`-clean code, and a mandatory sanitizer/benchmark pass before the change is presented as finished.

#### `csharp-developer`
- **Why needed:** .NET's DI, async, and EF Core surfaces have accumulated subtly wrong "common" patterns (blocking `.Result`, entities leaking into API responses) that keep circulating in training data even though they cause deadlocks and over-exposure in production.
- **What it does:** Covers ASP.NET Core (Minimal + controller APIs), EF Core with a required "review the migration before applying" checkpoint, Blazor Server/WASM, and Span<T>/Memory<T> performance work, all built on C# 12 file-scoped namespaces and primary constructors with nullable reference types mandatory.
- **Why not vanilla Claude Code:** Vanilla completions frequently reach for `.Result`/`.Wait()` on async calls or expose EF entities directly — both flagged explicitly here as MUST NOT DO — because those patterns are still common in older StackOverflow-era snippets the base model has absorbed.
- **When to use:** Building C# apps with .NET 8+, ASP.NET Core APIs, or Blazor web apps — minimal/controller routing, EF Core data access, CQRS via MediatR, or Blazor state management.
- **Then what:** Every async method takes and forwards `CancellationToken`, DTOs (not entities) cross the API boundary, and EF migrations get reviewed for unintended drops before `dotnet ef database update`.
- **Notes:** Overlaps with `dotnet-core-expert`, which covers similar .NET 8 ground but leans further into clean-architecture/CQRS and cloud-native concerns; this one is the broader C#-language-plus-Blazor entry point.

#### `golang-pro`
- **Why needed:** Go's concurrency primitives are easy to misuse — leaked goroutines, unbounded channels, swallowed errors — and the language's idioms (explicit error handling, small interfaces) are exactly the corners generic completions cut for brevity.
- **What it does:** Encodes a workflow of `go vet` then `golangci-lint`, then benchmarking with pprof, then table-driven tests run with `-race`. Provides a concrete goroutine-with-context-cancellation pattern showing bounded lifetime and `%w`-wrapped error propagation as the baseline shape for concurrent code.
- **Why not vanilla Claude Code:** Generic Go output often drops context cancellation handling or uses naked goroutines without lifecycle management — the skill's MUST NOT DO list calls these out directly as things to avoid, which requires stack-specific opinion rather than general model knowledge.
- **When to use:** Building Go applications requiring concurrent programming, microservices architecture, or high-performance systems — goroutines, channels, generics, gRPC, CLI tools, benchmarks, or table-driven testing.
- **Then what:** Every blocking call gets a `context.Context`, errors are wrapped and never discarded, and tests are table-driven with the race detector enabled before the code is considered complete.

#### `python-pro`
- **Why needed:** Python's dynamic typing means "correct" code and "type-safe, mypy-strict, well-tested" code look identical at a glance; without an enforced bar, generated Python skips type hints, uses mutable default arguments, or mixes sync/async carelessly.
- **What it does:** Drives toward `mypy --strict` clean output, `black`/`ruff` formatting, and >90% pytest coverage, with dataclasses preferred over manual `__init__`, `X | None` over `Optional[X]`, and context managers for resource handling. Includes the actual `pyproject.toml` mypy-strict config to apply.
- **Why not vanilla Claude Code:** Without a pinned bar, base Python output is inconsistent about strict typing and commonly leaves mutable default arguments or bare `except:` in place — both explicitly called out here as MUST NOT DO items this skill catches.
- **When to use:** Building Python 3.11+ applications requiring type safety, async programming, or robust error handling — type hints, async/await patterns, dataclasses, dependency injection, logging, structured error handling.
- **Then what:** Function signatures gain full type annotations, dataclasses replace hand-rolled `__init__`, and the change isn't presented as done until `mypy --strict` reports zero issues.
- **Notes:** General-purpose Python skill; framework-specific work routes to `django-expert` or `fastapi-expert` instead.

#### `rust-engineer`
- **Why needed:** Rust's ownership/lifetime system and `unsafe` boundaries are exactly where model-generated code tends to either over-clone (fighting the borrow checker) or under-document `unsafe` blocks, since both failure modes are invisible until `cargo clippy`/`cargo test` actually runs.
- **What it does:** Encodes explicit lifetime annotation, trait-based design with default methods, `thiserror`-based custom errors propagated via `?`, and tokio async patterns — with a hard rule that every `unsafe` block must document its safety invariants and `unwrap()` is banned in production code (use `expect()` with a message instead).
- **Why not vanilla Claude Code:** Idiomatic Rust changes fast enough (async ecosystem, trait patterns) that generic completions default to `.clone()`-heavy code or bare `.unwrap()` chains rather than the borrow-preferring, `Result`-propagating style this skill enforces.
- **When to use:** Building Rust applications, solving ownership/borrowing issues, designing trait-based APIs, implementing async/await concurrency, creating FFI bindings, or optimizing for performance and memory safety.
- **Then what:** Output favors `&str`/borrowing over cloning, wraps errors in `thiserror` enums, and isn't finished until `cargo clippy --all-targets --all-features` and `cargo fmt --check` both pass clean.

#### `node-specialist`
- **Why needed:** Node's event loop, streams, and worker-thread model are frequently misunderstood at the runtime level (blocking the loop, buffering instead of streaming, leaking memory across requests) in ways that only show up under load — this skill packages the runtime-level checklist rather than framework code.
- **What it does:** A knowledge pack covering event loop mechanics, stream/buffer APIs, clustering/IPC, AsyncLocalStorage, OWASP-aligned security practices (helmet, rate limiting, Argon2/bcrypt hashing), and a development workflow of dependency audit → async structure review → logging/validation setup → load testing.
- **Why not vanilla Claude Code:** Model knowledge of "Node.js best practice" is often stale on newer APIs (worker threads, AsyncLocalStorage, top-level await) and under-weights operational concerns like graceful shutdown and memory-leak detection that this pack calls out explicitly.
- **When to use:** Node.js backend development — APIs, microservices, CLIs, background workers, Express, Fastify, NestJS, event loop, streams, worker threads, async/await patterns, npm ecosystem, server-side performance and security.
- **Then what:** Claude reasons about I/O-bound operations in terms of streams vs. buffering, adds graceful shutdown and structured logging (Pino/Winston) by default, and treats memory/event-loop profiling as part of the deliverable, not an afterthought.
- **Notes:** Runtime-level counterpart to the framework-specific `nestjs-expert`; use this one for Express/Fastify or general Node internals, that one for NestJS's DI-driven architecture.

#### `php-pro`
- **Why needed:** PHP 8.3+'s strict-typing and static-analysis tooling (PHPStan level 9, readonly properties, enums) is routinely skipped by generic completions that default to PHP 5/7-era loose typing, even on modern codebases.
- **What it does:** Drives strict-typed domain models (readonly DTOs, backed enums), PSR-12 compliance, and a hard gate of `phpstan analyse --level=9` plus `phpunit`/`pest` at 80%+ coverage before delivery — framework-agnostic but with Laravel/Symfony pattern references available.
- **Why not vanilla Claude Code:** Vanilla PHP output commonly omits `declare(strict_types=1)` and type hints, or reaches for deprecated patterns — this skill's MUST NOT DO list (no `mixed`, no `var_dump` in production, no unvalidated input) is a curated bar the base model doesn't reliably self-impose.
- **When to use:** Building PHP applications with modern PHP 8.3+ features, Laravel, or Symfony frameworks — strict typing, PHPStan level 9, async with Swoole, PSR standards, controllers, migrations, typed DTOs.
- **Then what:** Every property/parameter/return gets a type hint, PHPStan level 9 must pass clean, and delivered code includes a typed DTO, a service class, and a test as the baseline structure.
- **Notes:** Language-level PHP skill; overlaps with `laravel-specialist` and `symfony-specialist`, which apply this same rigor within a specific framework's conventions.

## Web Frameworks & Backend Platforms

#### `django-expert`
- **Why needed:** Django ORM misuse (missing `select_related`/`prefetch_related`) is the single most common source of N+1 query bugs in Django apps, and it's invisible in code review unless someone is specifically checking for it.
- **What it does:** Targets Django 5.0 + DRF: models with proper indexes and migrations, `select_related`/`prefetch_related` on every queryset touching relations, DRF serializers with field validation, JWT/session auth, and `APITestCase`-based tests — with a concrete end-to-end example tying all of it together.
- **Why not vanilla Claude Code:** Generic Django output often queries related objects in a loop without eager loading, or skips permission classes on viewsets — both explicitly named in this skill's MUST NOT DO list as failures to actively guard against.
- **When to use:** Building Django web applications or REST APIs with DRF — working with settings.py, models.py, manage.py, serializers, viewsets, JWT auth.
- **Then what:** ViewSets default to `select_related`/`prefetch_related`, models carry `db_index=True` on frequently-queried fields, and permission classes are attached to every endpoint rather than left implicit.

#### `fastapi-expert`
- **Why needed:** FastAPI's ecosystem moved from Pydantic V1 to V2 with breaking syntax changes (`@validator` → `@field_validator`, `class Config` → `model_config`), and generic completions frequently mix the two, producing code that silently fails validation or won't run.
- **What it does:** Enforces Pydantic V2 syntax exclusively, async SQLAlchemy CRUD patterns, the `Annotated`-based dependency injection idiom, and JWT auth via `OAuth2PasswordBearer` — with a full working schema+endpoint+CRUD example and a migration reference for teams moving off Django/DRF.
- **Why not vanilla Claude Code:** Base model training data is split across Pydantic V1 and V2 eras; without this skill's explicit ban on `@validator`/`class Config`, generated code risks looking plausible but breaking against a V2 install.
- **When to use:** Building high-performance async Python APIs with FastAPI and Pydantic V2 — REST endpoints, Pydantic models, JWT auth, async SQLAlchemy, WebSocket endpoints, OpenAPI docs.
- **Then what:** All I/O is async (no sync DB calls), schemas use `field_validator`/`model_config`, and `X | None` replaces `Optional[X]` throughout.
- **Notes:** Both this and `django-expert` cover Python web APIs; the two are mutually exclusive per-project (see the migration-from-Django reference) rather than complementary.

#### `nestjs-expert`
- **Why needed:** NestJS's dependency-injection and decorator-heavy architecture (modules, guards, interceptors, pipes) has enough ceremony that generic TypeScript completions tend to either bypass DI (`new Service()`) or skip validation pipes entirely, defeating the framework's main safety net.
- **What it does:** Scaffolds modules/controllers/services/DTOs together, mandates constructor injection over `new`, `class-validator` DTOs with a global `ValidationPipe`, typed HTTP exceptions, and Swagger decorators on every endpoint — with full controller/service/module/test code shown as one cohesive unit.
- **Why not vanilla Claude Code:** Generic Nest output sometimes passes raw `req.body` straight to services or skips the `ValidationPipe` registration — this skill's MUST NOT DO list flags both as things Claude must actively avoid, which requires NestJS-specific conventions rather than general Node/TS knowledge.
- **When to use:** Building NestJS REST APIs or GraphQL services, DI, modular architecture, JWT/Passport auth, TypeORM/Prisma integration, or working with .module.ts/.controller.ts/.service.ts files.
- **Then what:** Every service is `@Injectable()` and constructor-injected, DTOs replace raw request bodies, and unit tests using `Test.createTestingModule` accompany every service method.
- **Notes:** Framework-specific complement to `node-specialist`'s runtime-level Node knowledge.

#### `dotnet-core-expert`
- **Why needed:** .NET 8 clean-architecture setups (CQRS via MediatR, layered separation) are easy to get structurally wrong — business logic leaking into controllers, or EF Core entities exposed as API responses — because the "correct" layering isn't enforced by the compiler.
- **What it does:** Builds Minimal API + MediatR query/command handlers + EF Core `DbContext` with `AsNoTracking()` reads, record-type DTOs, and a `dotnet build`/`dotnet test` verification loop with `WebApplicationFactory` integration tests — all under nullable-reference-types-enabled projects.
- **Why not vanilla Claude Code:** Generic .NET completions often mix concerns across layers or expose EF entities directly rather than mapping to DTOs — both are explicit MUST NOT DO items here that require an opinionated architectural stance, not just C# syntax knowledge.
- **When to use:** Building .NET 8 applications with minimal APIs, clean architecture, or cloud-native microservices — EF Core, CQRS with MediatR, JWT auth, AOT compilation.
- **Then what:** Handlers are separated into MediatR request/handler pairs, DTOs are records, and EF Core queries default to `AsNoTracking()` for reads.
- **Notes:** Overlaps significantly with `csharp-developer`; use this one when the project is explicitly clean-architecture/CQRS/microservices-shaped, the other for general ASP.NET Core/Blazor work.

#### `java-architect`
- **Why needed:** Spring Boot 3.x + Java 21 introduces newer idioms (records, sealed classes, virtual threads via WebFlux/reactive stacks) that generic completions often ignore in favor of older Spring Boot 2.x patterns, and reactive/blocking code mixing is a subtle bug class that's easy to introduce without noticing.
- **What it does:** Combines WebFlux reactive endpoints, JPA query optimization (JOIN FETCH to avoid N+1, DTO projections), and OAuth2/JWT Spring Security config into one architecture-first workflow, gated by `./mvnw verify` at 85%+ JaCoCo coverage and explicit checks on `SecurityFilterChain` bean ordering when auth tests fail.
- **Why not vanilla Claude Code:** Vanilla output risks blocking calls inside reactive chains or deprecated Spring Security config styles (`WebSecurityConfigurerAdapter`) that Spring itself has since removed — this skill's constraints catch exactly that class of staleness.
- **When to use:** Building, configuring, or debugging enterprise Java apps with Spring Boot 3.x, microservices, or reactive programming — WebFlux endpoints, JPA optimization, Spring Security OAuth2/JWT, async processing.
- **Then what:** Reactive endpoints return `Mono`/`Flux` without ever calling `.block()`, repositories use `JOIN FETCH` or projections instead of naive `findAll()`, and Flyway/Liquibase migrations back every schema change.
- **Notes:** Companion to `spring-boot-engineer`; this one leans architecture/reactive/JPA depth, the other leans day-to-day Spring Boot scaffolding (controllers, security config, Actuator).

#### `spring-boot-engineer`
- **Why needed:** Spring's DI conventions get violated constantly in generated code — field injection via `@Autowired` instead of constructor injection, `@Component` used where `@Service`/`@Repository` is more correct — small stylistic slips that compile fine but fight the framework's testability model.
- **What it does:** Lays out entity → repository → service (constructor-injected) → controller → DTO → global exception handler as the standard shape for any feature, plus Spring Security 6 config, Actuator health-check verification, and `@SpringBootTest`/`MockMvc`/Testcontainers test slices.
- **Why not vanilla Claude Code:** Field injection and stringly-typed exception handling are still common in general Spring examples circulating in training data; this skill's explicit MUST NOT DO table (no `@Autowired` on fields, no secrets in `application.yml`) directly counters that.
- **When to use:** Building Spring Boot 3.x applications, microservices, or reactive Java applications — Spring Data JPA, Spring Security 6, WebFlux, Spring Cloud, Java REST API design.
- **Then what:** Services take dependencies via constructor parameters, config binds through `@ConfigurationProperties` records rather than string keys, and a `@RestControllerAdvice` catches domain exceptions instead of leaking stack traces.
- **Notes:** See `java-architect` for the more architecture/reactive-heavy counterpart on the same Spring Boot 3.x stack.

#### `laravel-specialist`
- **Why needed:** Eloquent's convenience is also its trap — lazy-loading relationships in a loop (N+1) is the default behavior unless a developer explicitly eager-loads, and this is invisible until profiling under load.
- **What it does:** Builds Eloquent models with typed casts/enums and eager-loaded relationships, API Resources for response transformation, queued jobs with `failed()` handlers, and Pest feature tests — validated against a concrete checkpoint table (`migrate:status`, `route:list`, `queue:work --once`, `pint --test`) at each workflow stage.
- **Why not vanilla Claude Code:** Generic Laravel code frequently omits eager loading or skips the `failed()` callback on queued jobs, silently swallowing job failures — both flagged explicitly as MUST NOT DO here.
- **When to use:** Building Laravel 10+ apps — Eloquent models/relationships, Sanctum auth, Horizon queues, RESTful APIs with API resources, Livewire components.
- **Then what:** Every collection query eager-loads its relations up front, long-running work is dispatched to a queued job rather than run inline, and PSR-12/Pint linting gates delivery.
- **Notes:** Overlaps with `php-pro`'s Laravel reference material but goes deeper into Laravel-specific concerns (Horizon, Livewire, Sanctum) that the language-level skill only references.

#### `symfony-specialist`
- **Why needed:** Symfony 6.4 LTS, 7.x, and 8.0 have materially different defaults (Webpack Encore vs. AssetMapper, PHP 8.1 vs. 8.4 minimums, `#[MapRequestPayload]` availability, ObjectMapper in 8.0) — recommending the wrong era's tooling breaks the build outright.
- **What it does:** Mandates reading `composer.lock` first to detect the actual Symfony/Doctrine version before recommending any pattern, then covers Doctrine ORM (entities, DQL, migrations), API Platform, Messenger async transports, Security Voters, and FrankenPHP deployment — scoped to whichever version is actually installed.
- **Why not vanilla Claude Code:** Symfony's rapid version churn (6.4 LTS → 7.x → 8.0) means generic completions default to whichever era dominates training data, which may recommend Webpack Encore on a project that migrated to AssetMapper, or miss that 8.0 requires PHP 8.4 — a version-detection step the base model won't perform unprompted.
- **When to use:** Symfony 6/7/8 applications — Doctrine ORM, API Platform, Messenger async processing, Mercure, Twig, Security Voters, FrankenPHP, DQL, JWT auth, PHP 8 attributes.
- **Then what:** Claude reads `composer.lock` before writing any code, then matches syntax and package choices (annotations vs. attributes, Encore vs. AssetMapper) to the detected version rather than a generic "latest Symfony" assumption.
- **Notes:** Knowledge-pack format (no code-execution workflow steps like the versioned `*-expert` skills); pairs with `php-pro` for underlying PHP 8.x language rigor.

#### `rails-expert`
- **Why needed:** Rails 8 quietly replaced Redis-backed defaults (Sidekiq, Redis Action Cable) with database-backed "Solid" adapters (Solid Queue, Solid Cache, Solid Cable) — recommending Sidekiq on a fresh Rails 8 app when Solid Queue is already wired up is an active regression, not a neutral suggestion.
- **What it does:** Requires checking `Gemfile.lock` for the Rails major version before recommending job/cache/cable tooling, covers Active Record N+1 prevention via `includes`/`eager_load`, Turbo Frames/Streams, Sidekiq worker patterns with `failed()`-style rescue, and gates delivery on `rspec` + `rubocop` + `brakeman`/`bundle audit`.
- **Why not vanilla Claude Code:** Generic Rails advice defaults to Sidekiq/Redis/Devise because that's what dominates older training data, but this skill's version-defaults table catches the Rails 7-vs-8 tooling shift that a non-version-aware answer would miss entirely.
- **When to use:** Building Rails 7+ web applications with Hotwire, real-time features, or background job processing — Active Record optimization, Turbo Frames/Streams, Action Cable, Sidekiq, RSpec Rails.
- **Then what:** Collection queries always eager-load associations, background jobs go through whichever queue backend the Gemfile actually shows, and `brakeman`/`bundle audit` run before anything ships.

#### `elixir-expert`
- **Why needed:** Elixir/OTP's fault-tolerance model ("let it crash," supervision trees) is a fundamentally different error-handling philosophy from try/catch-style languages, and generic completions tend to import exception-handling habits from other languages rather than lean on supervision.
- **What it does:** A knowledge pack spanning GenServer/Supervisor/DynamicSupervisor design, Phoenix context-based architecture, LiveView real-time UIs, Ecto changesets/multi-tenancy, and distributed clustering (libcluster, Horde) — organized around designing the supervision tree first, then implementing GenServers within it.
- **Why not vanilla Claude Code:** "Let it crash" plus tagged-tuple (`{:ok, value} | {:error, reason}`) error handling is a deliberately different idiom than most languages use, and generic model output tends to over-apply defensive try/rescue instead of trusting supervision — this pack corrects that bias explicitly.
- **When to use:** Elixir or the BEAM ecosystem — Phoenix, LiveView, OTP, GenServer, supervision trees, Ecto, Mix, ExUnit, distributed/fault-tolerant systems, real-time features, concurrency, clustering.
- **Then what:** Error handling shifts to tagged tuples and `with` chains with rescue only at process boundaries, and any stateful logic gets modeled as a supervised GenServer rather than a bare module-level process.

## Data & Persistence

#### `database-optimizer`
- **Why needed:** Query optimization work is worthless without a measured baseline, and generic advice tends to suggest indexes or config tweaks without first capturing `EXPLAIN ANALYZE` output — meaning "improvements" can't be verified or can even regress write performance unnoticed.
- **What it does:** Cross-engine (PostgreSQL + MySQL) workflow: capture baseline via `EXPLAIN (ANALYZE, BUFFERS)` or `pg_stat_statements`, identify patterns like `Seq Scan` on large tables or `Sort Method: external merge`, apply one change at a time with `CREATE INDEX CONCURRENTLY`, then re-measure — explicitly banning simultaneous multi-change tuning because it makes impact impossible to attribute.
- **Why not vanilla Claude Code:** Generic tuning suggestions often skip the before/after measurement discipline entirely, or bundle multiple changes together — this skill's MUST DO/MUST NOT DO pairing (baseline first, one change at a time, roll back if replication lag worsens) is an engineering discipline, not domain trivia the model already "knows."
- **When to use:** Investigating slow queries, analyzing execution plans, or optimizing database performance — index design, query rewrites, configuration tuning, partitioning, lock contention.
- **Then what:** Every optimization ships with a captured before/after `EXPLAIN ANALYZE` comparison and is tested in non-production first, with an explicit revert trigger if write throughput or replication lag degrades.
- **Notes:** Cross-engine generalist; for PostgreSQL-only work with more depth (JSONB, replication internals, extensions) use `postgres-pro` instead.

#### `postgres-pro`
- **Why needed:** PostgreSQL-specific features — JSONB GIN indexing, logical vs. streaming replication, autovacuum tuning, extension usage (pgvector, PostGIS) — have enough nuance and version drift (12 through 16) that generic "SQL" knowledge doesn't cover them correctly.
- **What it does:** Walks the full slow-query-to-fix-to-verification loop with real SQL (partial indexes, `EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_replication` lag queries, dead-tuple bloat monitoring), and covers JSONB containment queries with GIN indexes and replication lag monitoring as first-class topics.
- **Why not vanilla Claude Code:** Base model PostgreSQL knowledge can be stale on newer features (pgvector, logical replication nuances) or vague about when GIN vs. BRIN indexes actually help — this skill pins concrete, verifiable SQL patterns instead of general "add an index" advice.
- **When to use:** Optimizing PostgreSQL queries, configuring replication, or implementing advanced database features — EXPLAIN analysis, JSONB operations, extension usage, VACUUM tuning, performance monitoring.
- **Then what:** Index creation always uses `CONCURRENTLY` to avoid locking production tables, JSONB queries get GIN-indexed containment operators instead of unindexed scans, and replication lag is checked via `pg_stat_replication` as part of any replication setup.
- **Notes:** PostgreSQL-specific depth layer on top of the cross-engine `database-optimizer`; use both together when the target is specifically Postgres.

#### `sql-pro`
- **Why needed:** Correlated subqueries and row-by-row cursor logic are easy to write and easy to get "working," but scale terribly — the failure mode only appears at production data volumes, which is exactly when it's expensive to fix.
- **What it does:** Pushes set-based rewrites (CTEs, window functions like `ROW_NUMBER`/`RANK`/`LAG`) over correlated subqueries and cursors, with a concrete before/after example converting a per-row correlated subquery into a single aggregation join plus covering index, and a dialect-differences reference for PostgreSQL/MySQL/SQL Server/Oracle portability.
- **Why not vanilla Claude Code:** Generic SQL suggestions often reach for `SELECT *` or correlated subqueries because they're the most "obviously correct" pattern to write, not the fastest one — this skill's explicit before/after rewrite habit and dialect-awareness require deliberately opinionated tuning knowledge.
- **When to use:** A query is slow, complex joins/aggregations are needed, database performance issues arise, or a schema needs designing/migrating — window functions, CTEs, indexing strategies, query plan analysis, cross-dialect migration.
- **Then what:** Row-by-row and correlated-subquery patterns get rewritten as set-based joins or window functions, `EXISTS` replaces `COUNT` for existence checks, and every optimization ships with an `EXPLAIN ANALYZE` before/after comparison.
- **Notes:** Language/pattern-level SQL skill distinct from `postgres-pro` (engine-specific administration) and `database-optimizer` (measurement-driven tuning workflow); this one is about writing and rewriting queries themselves.

## API & Service Architecture

#### `api-designer`
- **Why needed:** REST API "design" often means ad hoc endpoint naming and inconsistent error shapes decided endpoint-by-endpoint, which becomes a breaking-change minefield the moment the API has external consumers — versioning and error contracts need to be decided up front, not discovered later.
- **What it does:** Drives resource modeling → OpenAPI 3.1 spec → mock server verification (`@redocly/cli lint`, `@stoplight/prism-cli mock`) → versioning/deprecation plan, standardizing on RFC 7807 Problem Details for all error responses and cursor-based pagination, with a full copy-paste OpenAPI 3.1 starter spec.
- **Why not vanilla Claude Code:** Generic API scaffolding rarely produces a validated OpenAPI 3.1 spec or RFC 7807-compliant errors by default — it tends toward inconsistent ad hoc JSON error shapes per endpoint, which this skill's explicit MUST DO list rules out.
- **When to use:** Designing REST or GraphQL APIs, creating OpenAPI specifications, or planning API architecture — resource modeling, versioning strategies, pagination patterns, error handling standards.
- **Then what:** Every collection endpoint gets cursor pagination, every error response uses `application/problem+json` with a stable `type` URI, and the delivered spec must pass `redocly lint` with zero errors.
- **Notes:** REST/OpenAPI counterpart to `graphql-architect`; overlaps at the boundary of "which style of API should this even be" — see that skill for the GraphQL-specific path.

#### `graphql-architect`
- **Why needed:** GraphQL's flexibility hides two recurring production failures — N+1 resolver queries and unbounded query complexity/depth — that are invisible in a schema definition and only surface under real traffic or malicious queries.
- **What it does:** Schema-first workflow through Apollo Federation 2.5+ composition validation (checking `@key` entity resolution across subgraphs), DataLoader-batched resolvers to eliminate N+1s, and query complexity/depth limiting before deployment — with working SDL federation examples and a `graphql-query-complexity` validation rule snippet.
- **Why not vanilla Claude Code:** Generic GraphQL resolver code frequently omits DataLoader batching (causing N+1 queries per request) and skips complexity limiting entirely — both are explicit MUST NOT DO items here because they're easy to miss without GraphQL-specific review discipline.
- **When to use:** Designing GraphQL schemas, implementing Apollo Federation, or building real-time subscriptions — schema design, resolvers with DataLoader, query optimization, federation directives.
- **Then what:** Every resolver that fetches related entities goes through a per-request DataLoader instance instead of direct per-item queries, and the schema ships with a complexity ceiling (e.g., `maximumComplexity: 1000`) enforced at the validation layer.
- **Notes:** Complements `api-designer` (REST/OpenAPI) as the GraphQL-specific design path, and `database-optimizer` for the underlying query performance DataLoader is compensating for.

#### `microservices-architect`
- **Why needed:** Decomposing a monolith into services is easy to get structurally wrong in ways that only surface at scale — shared databases between "independent" services, synchronous calls chained across service boundaries, missing circuit breakers — turning a "microservices" system into a distributed monolith with all the coupling and none of the resilience.
- **What it does:** DDD-driven bounded-context analysis with an explicit validation checkpoint (each service owns its data exclusively, deployable independently), plus concrete resilience patterns: correlation-ID middleware for distributed tracing, a Python circuit breaker (`pybreaker`, 5-failure threshold, 30s reset), and a TypeScript saga orchestrator with automatic compensation on failure.
- **Why not vanilla Claude Code:** Generic "microservices" scaffolding often produces services that still share a database or call each other synchronously for cross-aggregate operations — precisely the distributed-monolith anti-pattern this skill's MUST NOT DO list names directly, requiring deliberate architectural discipline to avoid.
- **When to use:** Designing distributed systems, decomposing monoliths, or implementing microservices patterns — service boundaries, DDD, saga patterns, event sourcing, CQRS, service mesh, distributed tracing.
- **Then what:** Every external call carries an explicit timeout/retry budget/fallback, cross-aggregate writes go through a saga with defined compensation steps rather than a distributed transaction, and every request is traceable end-to-end via a correlation ID.
- **Notes:** Architecture-level skill that sits above language-specific backend skills — it produces the service boundary and resilience design that `golang-pro`, `spring-boot-engineer`, `nestjs-expert`, etc. then implement within.

#### `websocket-engineer`
- **Why needed:** WebSocket connections are stateful in a way HTTP request/response isn't — sticky sessions, presence cleanup on disconnect, and horizontal scaling via Redis pub/sub are all easy to omit in a first working version and only fail once a second server instance or a network blip enters the picture.
- **What it does:** Builds Socket.IO servers with JWT auth middleware, room-based broadcasting, and a Redis adapter for horizontal scaling, paired with client-side exponential-backoff reconnection and message queuing during disconnection windows — validated with local `wscat` checks before scaling and Redis pub/sub round-trip verification before enabling the adapter.
- **Why not vanilla Claude Code:** Generic WebSocket examples frequently skip heartbeat/ping-pong dead-connection detection or presence cleanup on disconnect — both explicitly named MUST DO/MUST NOT DO items here, since a "working" single-instance demo hides exactly the failure modes that show up under horizontal scaling.
- **When to use:** Building real-time communication systems with WebSockets or Socket.IO — bidirectional messaging, horizontal scaling with Redis, presence tracking, room management.
- **Then what:** Connections get heartbeat/ping-pong checks and sticky-session routing baked in from the start, presence and room state is cleaned up explicitly on disconnect, and any multi-instance deployment gets a Redis pub/sub adapter rather than in-memory state.

## Legacy & Modernization

#### `dotnet-framework-4.8-expert`
- **Why needed:** .NET Framework 4.8 (Web Forms, WCF, C# 7.3) is a fundamentally different runtime than .NET Core/8 — recommending modern .NET patterns onto a legacy Framework 4.8 codebase produces code that won't compile or won't integrate with the existing Windows infrastructure it depends on.
- **What it does:** A knowledge pack scoped specifically to legacy surfaces — Web Forms page lifecycle/ViewState, WCF service contracts and bindings, Windows Services, EF6 (not EF Core), COM interop/Win32 calls — organized around a stability-first workflow: legacy assessment (dependency/security/performance review) before any implementation.
- **Why not vanilla Claude Code:** Base model knowledge of ".NET" defaults toward modern .NET Core/8 idioms; without this skill, Claude Code is likely to suggest patterns (minimal APIs, EF Core, `Microsoft.Extensions.DependencyInjection`) that simply don't exist in a Framework 4.8 codebase, rather than the EF6/WCF/Web Forms patterns that actually apply.
- **When to use:** Legacy .NET Framework 4.8 enterprise applications — Web Forms, WCF services, Windows services, EF6, C# 7.3, COM interop, IIS, ViewState, legacy maintenance, modernization.
- **Then what:** Recommendations stay within C# 7.3/Framework 4.8 capabilities (no records, no top-level statements) and prioritize backward compatibility and stability over adopting newer patterns, even when a newer pattern would otherwise be preferable.
- **Notes:** Distinct from `dotnet-core-expert`/`csharp-developer` — this is the only skill in the plugin scoped to pre-.NET-Core Framework; also pairs with `legacy-modernizer` when the goal is migrating off Framework 4.8 rather than maintaining it in place.

#### `legacy-modernizer`
- **Why needed:** Modernizing a legacy system by rewriting it wholesale ("big bang") is the single most common way these projects fail — generic "help me modernize this" requests default to a rewrite recommendation unless explicitly steered toward incremental, safety-net-first migration.
- **What it does:** Enforces strangler-fig migration: dependency map and risk register first, then characterization tests (golden-master, 80%+ coverage of existing behavior) before touching production code, then feature-flagged incremental traffic shifting (5%→25%→50%→100%) with an explicit rollback trigger and error-rate/latency validation at each step.
- **Why not vanilla Claude Code:** Left to its own judgment, a general-purpose response to "modernize this legacy system" gravitates toward a full rewrite recommendation — this skill's MUST NOT DO list bans big-bang rewrites outright and requires a facade-and-feature-flag structure instead, which is a deliberate constraint, not default model behavior.
- **When to use:** Modernizing legacy systems, implementing strangler fig or branch-by-abstraction, decomposing monoliths, upgrading frameworks/languages, or reducing technical debt without disrupting business operations.
- **Then what:** Any legacy touch point gets a facade routing between old and new implementations by feature flag, characterization tests are written and passing on the unmodified system before any refactor starts, and the legacy path is only removed after the new path proves stable at 100% traffic for a full release cycle.
- **Notes:** Complements `dotnet-framework-4.8-expert` (and any other legacy-stack skill) when the goal shifts from maintaining a legacy system to migrating off it.
