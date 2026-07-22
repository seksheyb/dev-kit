---
name: elixir-expert
description: Use when the task involves Elixir or the BEAM ecosystem — Phoenix, LiveView, OTP, GenServer, supervision trees, Ecto, Mix, ExUnit, distributed/fault-tolerant systems, real-time features, concurrency, message passing, clustering.
---

# Elixir Expert

Knowledge pack for building fault-tolerant, concurrent, and distributed systems with Elixir 1.18+ (OTP 27+) and OTP — spanning Phoenix web applications, real-time features with LiveView, and leveraging the BEAM VM for maximum reliability and scalability.

Before implementing, review mix.exs configuration, supervision trees, and OTP patterns; analyze process architecture, GenServer implementations, and fault tolerance strategies; then implement solutions following Elixir idioms and OTP best practices.

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| OTP Patterns | `references/otp-patterns.md` | GenServer, Supervisor trees, Registry, Task, ETS, "let it crash" |
| Phoenix & LiveView | `references/phoenix-liveview.md` | Contexts, LiveView/LiveComponent, streams, PubSub, Channels, forms |

## Elixir Development Checklist

- Idiomatic code following Elixir style guide
- mix format and Credo compliance
- Proper supervision tree design
- Comprehensive pattern matching usage
- ExUnit tests with doctests
- Rely on the built-in compiler type system first; Dialyzer/`@spec` as supplementary
- Documentation with ExDoc
- OTP behavior implementations

## Functional Programming Mastery

- Immutable data transformations
- Pipeline operator for data flow
- Pattern matching in all contexts
- Guard clauses for constraints
- Higher-order functions with Enum/Stream
- Recursion with tail-call optimization
- Protocols for polymorphism
- Behaviours for contracts

## OTP Excellence

- GenServer state management
- Supervisor strategies and trees
- Application design and configuration
- Agent for simple state
- Task for async operations
- Registry for process discovery
- DynamicSupervisor for runtime children
- ETS/DETS for shared state

## Concurrency Patterns

- Lightweight process architecture
- Message passing design
- Process linking and monitoring
- Timeout handling strategies
- Backpressure with GenStage
- Flow for parallel processing
- Broadway for data pipelines
- Process pooling with Poolboy

## Error Handling Philosophy

- "Let it crash" with supervision
- Tagged tuples {:ok, value} | {:error, reason}
- with statements for happy path
- Rescue only at boundaries
- Graceful degradation patterns
- Circuit breaker implementation
- Retry strategies with exponential backoff
- Error logging with Logger

## Phoenix Framework

- Context-based architecture
- LiveView real-time UIs
- Channels for WebSockets
- Plugs and middleware
- Router design patterns
- Controller best practices
- Component architecture
- PubSub for messaging

## LiveView Expertise

- Server-rendered real-time UIs
- LiveComponent composition
- Hooks for JavaScript interop
- Streams for large collections
- Uploads handling
- Presence tracking
- Form handling patterns
- Optimistic UI updates

## Ecto Mastery

- Schema design and associations
- Changesets for validation
- Query composition
- Multi-tenancy patterns
- Migrations best practices
- Repo configuration
- Connection pooling
- Transaction management

## Performance Optimization

- BEAM scheduler understanding
- Process hibernation
- Binary optimization
- ETS for hot data
- Lazy evaluation with Stream
- Profiling with :observer
- Memory analysis
- Benchmark with Benchee

## Testing Methodology

- ExUnit test organization
- Doctests for examples
- Property-based testing with StreamData
- Mox for behavior mocking
- Sandbox for database tests
- Integration test patterns
- LiveView testing
- Wallaby for browser tests

## Macro and Metaprogramming

- Quote and unquote mechanics
- AST manipulation
- Compile-time code generation
- use, import, alias patterns
- Custom DSL creation
- Macro hygiene
- Module attributes
- Code reflection

## Build and Tooling

- Mix task creation
- Umbrella project organization
- Release configuration with Mix releases
- Environment configuration
- Dependency management with Hex
- Documentation with ExDoc
- Static analysis with Dialyzer
- Code quality with Credo
- Native `JSON` module (stdlib since 1.18) or Jason for encode/decode

## Development Workflow

### 1. Architecture Analysis

Understand process architecture and supervision design.

Analysis priorities:

- Application supervision tree
- GenServer and process design
- Phoenix context boundaries
- Ecto schema relationships
- PubSub and messaging patterns
- Clustering configuration
- Release and deployment setup
- Performance characteristics

Technical evaluation:

- Review supervision strategies
- Analyze message flow
- Check fault tolerance design
- Assess process bottlenecks
- Profile memory usage
- Check compiler type inference / Dialyzer findings
- Review test coverage
- Evaluate documentation

### 2. Implementation Phase

Develop Elixir solutions with OTP principles at the core.

Implementation approach:

- Design supervision tree first
- Implement GenServer behaviors
- Use contexts for boundaries
- Apply pattern matching extensively
- Create pipelines for transforms
- Handle errors at proper level
- Lean on the set-theoretic compiler type system; add `@spec`/Dialyzer where it adds precision
- Document with examples

Development patterns:

- Start with simple processes
- Add supervision incrementally
- Use LiveView for real-time
- Implement with/else for flow
- Leverage protocols for extension
- Create custom Mix tasks
- Use releases for deployment
- Monitor with Telemetry

### 3. Production Readiness

Ensure fault tolerance and operational excellence.

Quality verification:

- Credo passes with strict mode
- Compiler type checks clean; Dialyzer clean where specs are used
- Test coverage > 85%
- Documentation complete
- Supervision tree validated
- Release builds successfully
- Clustering verified
- Monitoring configured

## Distributed Systems

- Node clustering with libcluster
- Distributed Registry patterns
- Horde for distributed supervisors
- Phoenix.PubSub across nodes
- Consistent hashing strategies
- Leader election patterns
- Network partition handling
- State synchronization

## Deployment Patterns

- Mix releases configuration
- Multi-environment release configs
- Docker containerization
- Kubernetes deployment
- Hot code upgrades
- Rolling deployments
- Health check endpoints
- Graceful shutdown

## Observability Setup

- Telemetry events and metrics
- Logger configuration
- :observer for debugging
- OpenTelemetry integration
- Custom metrics with Prometheus
- LiveDashboard integration
- Error tracking setup
- Performance monitoring

## Security Practices

- Input validation with changesets
- CSRF protection in Phoenix
- Authentication with Guardian/Pow
- Authorization patterns
- Secret management
- SSL/TLS configuration
- Rate limiting implementation
- Security headers

## Priorities

- Prioritize fault tolerance, concurrency, and the "let it crash" philosophy while building reliable distributed systems on the BEAM.
