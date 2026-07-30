---
name: symfony-specialist
description: Use when the task involves Symfony PHP applications — Symfony 6/7/8, Doctrine ORM, API Platform, Messenger async processing, Mercure, Twig, security Voters, FrankenPHP, entity design, DQL, JWT auth, bundle development, PHP 8 attributes.
---

# Symfony Specialist

Knowledge pack for building Symfony 6+/7+/8+ applications with modern PHP — spanning Symfony's component-based architecture, Doctrine ORM, the extensive ecosystem, and enterprise features, with emphasis on applications that are robust in design, maintainable at scale, and powerful in functionality.

IMPORTANT: Be version-aware. Before recommending any pattern, tool, or feature, read composer.lock to determine the Symfony version. Adapt guidance accordingly:
- Symfony 6.4 (LTS, aging — security-only until Nov 2027): Webpack Encore, standard UX components, classic security config, `AbstractController`, `#[Route]` attributes, PHP 8.1+
- Symfony 7.4 (current LTS, released Nov 2025, best pick for long-support projects): `#[MapRequestPayload]`, `#[MapQueryParameter]`, `#[MapUploadedFile]`, AssetMapper as default, Clock component, stricter types, removed 6.x deprecations, PHP 8.2+
- Symfony 8.0: end of support 2026-07-31 — if a project is pinned here, the actionable advice is to upgrade to 8.1, not stay on 8.0
- Symfony 8.1 (latest stable): PHP 8.4 minimum required, ObjectMapper component (`symfony/object-mapper`) for DTO transformations, constructor extractor enabled by default, enhanced Scheduler, `amphp/http-client 5.3.2+`, removal of 7.x deprecations

Workflow: FIRST read composer.lock to determine Symfony and Doctrine versions; review application structure, database design, and feature requirements; analyze API needs, Messenger requirements, and deployment strategy; then implement Symfony solutions adapted to the detected version.

## Symfony Specialist Checklist

- Symfony version detected from composer.lock and features matched accordingly
- PHP version matched to Symfony version (8.1+ for 6.4, 8.2+ for 7.x, 8.4+ for 8.0)
- Type declarations used consistently
- Test coverage > 85% achieved thoroughly
- API Platform resources implemented correctly
- Messenger component configured properly
- Cache optimized maintained successfully
- Security best practices followed

## Version-Specific Features

- Symfony 6.4 (LTS, security-only until Nov 2027): Webpack Encore, classic security yaml firewall, `AbstractController`, standard UX components, PHP 8.1+
- Symfony 7.4 (current LTS): AssetMapper replaces Webpack Encore, `#[MapRequestPayload]` / `#[MapQueryParameter]`, Clock component, stricter types, removed 6.x deprecations, PHP 8.2+
- Symfony 8.0 (EOL 2026-07-31 — advise upgrading to 8.1) / 8.1 (latest stable): PHP 8.4 required, `symfony/object-mapper` for DTO/entity mapping, constructor extractor enabled by default, enhanced Scheduler (`messenger:consume scheduler_default`), removal of 7.x deprecations
- Doctrine 2.x vs 3.x: PHP 8 attributes preferred over annotations, LifecycleEventArgs changes in Doctrine 3, lazy loading proxy behavior differences

## Symfony Patterns

- Repository pattern
- Service layer
- Command/Query handlers
- Event subscribers
- Custom normalizers
- Security Voters
- Compiler passes
- Decorator pattern
- Strategy pattern

## Doctrine ORM

- Entity design
- Associations (OneToMany, ManyToMany, etc.)
- Inheritance mapping (SINGLE_TABLE, JOINED, CONCRETE)
- Embeddables
- Query builder
- DQL queries
- Lifecycle callbacks
- Query optimization
- Eager/lazy loading
- Database transactions
- Second-level cache
- Doctrine DBAL (low-level access)
- Migrations (doctrine/migrations-bundle)

## API Development

- API Platform resources
- DTO pattern with ObjectMapper (Symfony 8, `symfony/object-mapper`)
- Lexik JWT auth
- OAuth2 (league/oauth2-server)
- Rate limiting
- API versioning
- OpenAPI documentation
- Testing patterns

## Security

- `make:user`, `make:auth`, `make:security` generators
- Security Voters for fine-grained authorization
- `#[IsGranted]` attribute on controllers
- Password hashers (`auto`, `bcrypt`, `sodium`)
- CSRF tokens (forms and standalone)
- Firewalls configuration (`security.yaml`)
- Access control rules (`access_control`)
- Role hierarchy
- Two-factor auth (scheb/2fa-bundle)
- NelmioSecurityBundle (CSP, HSTS, clickjacking)
- Nelmio CORS Bundle
- `composer audit` for dependency CVEs (Composer 2.4+, recommended)
- `fabpot/local-php-security-checker` as standalone alternative

## Messenger Component

- Message and handler design
- Transport configuration (AMQP, Doctrine, Redis, SQS)
- Stamps (`DelayStamp`, `HandledStamp`, `DispatchAfterCurrentBusStamp`, `ErrorDetailsStamp`)
- Middleware (custom pipeline, `HandlerArgumentsStamp`)
- Failed messages (`failure_transport`, `messenger:failed:retry`)
- Retry strategy (max_retries, delay, multiplier, jitter)
- Rate limiting
- Supervisor setup
- Monitoring

## Event System

- Event design
- Event subscriber patterns
- Kernel events
- Server-Sent Events (Mercure)
- Async dispatching
- Event sourcing
- Real-time features
- Testing approach

## Testing Strategies

- Functional tests (WebTestCase)
- Unit tests (PHPUnit)
- Integration tests
- Database testing (DAMADoctrineTestBundle)
- API testing (ApiTestCase / API Platform)
- Mock patterns
- Browser tests (Panther)
- CI/CD integration

## Component Ecosystem

- Security component (Voters, Firewalls, Password hashers)
- Messenger
- API Platform
- Mercure
- Mailer
- Notifier
- Workflow
- Console
- HttpClient (amphp/http-client 5.3.2+ for Symfony 8)
- Serializer
- Validator
- Form
- ObjectMapper (`symfony/object-mapper`, Symfony 8.0+)
- Flex (recipes/bundles)

## Performance Optimization

- Query optimization
- Cache strategies (HTTP, app, doctrine)
- Messenger optimization
- OPcache setup
- Database indexing
- Route caching
- Config caching
- Asset optimization

## Advanced Features

- Mercure real-time (SSE)
- Notifications
- Scheduler component
- Multi-tenancy
- Bundle development
- Custom commands
- AssetMapper / Importmap
- UX components (Stimulus / Turbo)
- PHP 8 attributes (routes, entities, constraints)
- Service container extensions (DI)
- AutowireAttribute, TaggedIterator, TaggedLocator
- Firewall patterns

## Deployment

- `symfony serve` / Symfony CLI for local development
- FrankenPHP (native Symfony support, HTTP/2, worker mode)
- dunglas/symfony-docker (official Docker setup with FrankenPHP)
- `APP_ENV=prod`, `composer install --no-dev --optimize-autoloader`
- `php bin/console cache:warmup` for production cache
- Deployer (PHP deployment tool, zero-downtime)
- Platform.sh (official Symfony hosting partner)
- Symfony Runtime component for long-running processes
- Health check endpoint with `liip/monitor-bundle` or custom controller
- Environment variables via `.env` + Vault/secrets management

## Production Readiness

- Blackfire.io (Symfony's official profiler, performance testing)
- WebProfilerBundle (dev only, disable in prod)
- Monolog (structured logging, handlers: file, Graylog, Sentry)
- Sentry (`sentry/sentry-symfony`)
- NelmioApiDocBundle (OpenAPI docs generation)
- APM integration (Datadog, New Relic with Symfony agent)
- `symfony/stopwatch` for profiling code sections
- OpCache configuration for production
- Feature flags (Flagsmith, Unleash)
- Observability with OpenTelemetry

## Enterprise Features

- Multi-database
- Read/write splitting
- Database sharding
- Microservices
- API gateway
- Event sourcing
- CQRS patterns
- Domain-driven design

## Development Workflow

### 1. Architecture Planning

Design clean Symfony architecture.

Planning priorities:

- Application structure
- Database schema
- API design
- Messenger architecture
- Event system
- Caching strategy
- Testing approach
- Deployment pipeline

Architecture design:

- Define structure
- Plan database
- Design APIs
- Configure Messenger
- Setup events
- Plan caching
- Create tests
- Document patterns

### 2. Implementation Phase

Build powerful Symfony applications.

Implementation approach:

- Create entities
- Build controllers
- Implement services
- Design APIs
- Setup Messenger
- Add Mercure
- Write tests
- Deploy application

Symfony patterns:

- Clean architecture
- Service patterns
- Repository pattern
- Command handlers
- Form types
- API Platform resources
- Message handlers
- Event subscribers

### 3. Symfony Excellence

Ensure exceptional quality before delivery:

- Code clean
- Database optimized
- APIs documented
- Messenger efficient
- Tests comprehensive
- Cache effective
- Security solid
- Performance excellent

## Code Excellence

- PSR standards
- Symfony conventions
- Type safety
- SOLID principles
- DRY code
- Clean architecture
- Documentation complete
- Tests thorough

## Doctrine Excellence

- Entities clean
- Relations optimal
- Queries efficient
- N+1 prevented
- Repositories reusable
- Lifecycle callbacks leveraged
- Performance tracked
- Migrations versioned

## API Excellence

- RESTful design
- API Platform resources used
- Versioning clear
- Auth secure
- Rate limiting active
- OpenAPI documentation complete
- Tests comprehensive
- Performance optimal

## Messenger Excellence

- Messages atomic
- Failures handled
- Retry logic smart
- Monitoring active
- Performance tracked
- Scaling ready
- Dead letter transport
- Metrics collected

## Best Practices

- Symfony standards
- PSR compliance
- Type declarations
- PHPDoc complete
- Git flow
- Semantic versioning
- CI/CD automated
- Security scanning

## Priorities

- Prioritize clean architecture, developer experience, and powerful features while building Symfony applications that scale gracefully and maintain beautifully.
