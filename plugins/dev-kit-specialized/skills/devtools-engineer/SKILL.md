---
name: devtools-engineer
description: Use when the task involves developer tooling or build systems — build performance optimization, bundlers and compilation, caching strategies, bundle size, monorepos, module federation, CLI development, code generators, scaffolding, IDE extensions, language servers, plugin architectures, tool distribution (npm, Homebrew, binaries).
---

# Devtools Engineer

Knowledge pack for developer-tooling work across two connected areas: optimizing build systems for speed, reliability, and scale, and creating developer tools — CLIs, code generators, build tools, and IDE extensions — with excellent performance, usability, and extensibility.

## Build Engineering Targets

- Build time < 30 seconds; rebuild time < 5 seconds
- Bundle size minimized optimally
- Cache hit rate > 90% sustained
- Zero flaky builds; reproducible builds ensured
- Metrics tracked continuously; documentation comprehensive

## Build System Architecture

- Tool selection strategy
- Configuration organization
- Plugin architecture design
- Task orchestration planning
- Dependency management
- Cache layer design
- Distribution strategy
- Monitoring integration

## Compilation Optimization

- Incremental compilation
- Parallel processing
- Module resolution
- Source transformation
- Type checking optimization
- Asset processing
- Dead code elimination
- Output optimization

## Bundle Optimization

- Code splitting strategies
- Tree shaking configuration
- Minification setup
- Compression algorithms
- Chunk optimization
- Dynamic imports
- Lazy loading patterns
- Asset optimization

## Caching Strategies

- Filesystem, memory, and remote caching
- Content-based hashing
- Dependency tracking
- Cache invalidation
- Distributed caching
- Cache persistence

## Build Performance

- Cold start optimization
- Hot reload speed
- Memory usage control
- CPU utilization
- I/O optimization
- Network usage
- Parallelization tuning
- Resource allocation

## Build Profiling

- Cold build timing and incremental build timing
- Hot reload speed
- Memory usage and CPU utilization
- I/O patterns and network requests
- Cache misses and cache effectiveness
- Bottleneck identification
- Tool evaluation and configuration review

## Module Federation

- Shared dependencies
- Runtime optimization
- Version management
- Remote modules
- Dynamic loading
- Fallback strategies
- Security boundaries
- Update mechanisms

## Monorepo Support

- Workspace configuration
- Task dependencies
- Affected detection
- Parallel execution
- Shared caching
- Cross-project builds
- Release coordination
- Dependency hoisting

## Production Builds

- Optimization levels
- Source map generation
- Asset fingerprinting
- Environment handling
- Security scanning
- License checking
- Bundle analysis
- Deployment preparation

## Testing Integration

- Test runner optimization
- Coverage collection
- Parallel test execution
- Test caching
- Flaky test detection
- Performance benchmarks
- Integration and E2E optimization

## Configuration Management

- Environment variables
- Build variants
- Feature flags
- Target platforms
- Optimization levels
- Debug and release configurations
- CI/CD integration

## Build Analytics

- Performance metrics and trend analysis
- Bottleneck detection
- Cache statistics
- Bundle analysis
- Dependency graphs
- Cost tracking
- Team dashboards

## Build Infrastructure

- Build server setup and agent configuration
- Resource allocation
- Network optimization
- Storage management
- Container usage
- Cloud resources and cost optimization

## Tooling Engineering Targets

- Tool startup < 100ms
- Memory efficient consistently
- Cross-platform support complete
- Extensive testing implemented
- Clear documentation provided
- Error messages helpful throughout
- Backward compatibility maintained

## CLI Development

- Command structure design and subcommand structure
- Argument parsing and flag conventions
- Interactive prompts and interactive mode
- Progress indicators
- Batch operations and pipeline support
- Output formats and error codes
- Configuration management
- Shell completions
- Help system and debug mode

## Tool Architecture

- Plugin systems and extension points
- Configuration layers
- Event systems
- Logging framework
- Error recovery
- Update mechanisms
- Distribution strategy

## Plugin Architecture

- Hook systems and event emitters
- Middleware patterns
- Dependency injection
- Configuration merge
- Lifecycle management
- API stability
- Plugin documentation
- Plugin examples: custom commands, output formatters, integration adapters, transform pipelines, validation rules, code generators, report generators, custom workflows

## Code Generation

- Template engines
- AST manipulation
- Schema-driven generation
- Type generation
- Scaffolding tools
- Migration scripts
- Boilerplate reduction
- Custom transformers

## Tool Categories

- Build tools (creating one draws on the build-system sections above: compilation pipeline, dependency resolution, cache management, parallel execution, incremental builds, watch mode, source maps, bundle optimization)
- Linters/formatters
- Code generators
- Migration tools
- Documentation tools
- Testing tools
- Debugging tools
- Performance tools

## IDE Extensions

- Language servers
- Syntax highlighting
- Code completion
- Refactoring tools
- Debugging integration
- Task automation
- Custom views
- Theme support

## Developer Experience

- Fast feedback loops and watch mode efficiency
- Intuitive commands with sensible defaults and progressive disclosure
- Clear feedback, progress indication, and error recovery
- Help discovery and configuration simplicity
- Manageable learning curve
- Performance profiling and debug capabilities
- IDE integration

## Tool Performance Techniques

- Startup optimization and lazy loading
- Memory usage, memory pooling, and CPU efficiency
- I/O optimization
- Caching strategies
- Parallel and stream processing
- Background processing and background tasks
- Resource pooling
- Binary optimization

## Distribution Strategies

- NPM packages
- Homebrew formulas
- Docker images
- Binary releases
- Auto-updates
- Version management
- Installation guides
- Migration paths

## Error Handling

- Clear error messages with actionable recovery suggestions
- Stack trace formatting and debug information
- Error codes and help references
- Dependency conflicts, version mismatches, configuration errors
- Resource failures and recovery strategies
- Fallback behavior and graceful degradation

## Documentation

- Getting started guide
- Command reference
- Plugin development guide
- Configuration guide
- Troubleshooting
- Best practices
- API documentation
- Migration guides

## Workflow Guidance

- Start with measurements: profile existing builds and workflows, identify bottlenecks, then design the optimization plan.
- Optimize incrementally; cache aggressively; parallelize builds; minimize I/O; reduce dependencies.
- For tools, map workflows and pain points first: analyze tool gaps, performance requirements, and integration needs before defining scope and architecture.
- Design user-first: fail gracefully, provide feedback, enable extensibility.
- Configure caching and monitoring, document changes, and validate results after every change.
- Detect performance regressions continuously; iterate based on data and usage.
- Test thoroughly across platforms; keep tools backward compatible.

## Priorities

- Build speed, reliability, and developer experience — with build systems that scale with project growth and tools that become essential parts of developer workflows.
