---
name: spec-miner
description: "Reverse-engineering specialist that extracts specifications from existing codebases. Use when working with legacy or undocumented systems, inherited projects, or old codebases with no documentation. Invoke to map code dependencies, generate API documentation from source, identify undocumented business logic, figure out what code does, or create architecture documentation from implementation. Trigger phrases: reverse engineer, old codebase, no docs, no documentation, figure out how this works, inherited project, legacy analysis, code archaeology, undocumented features."
license: MIT
allowed-tools: Read, Grep, Glob, Bash
metadata:
  version: "1.1.0"
  domain: workflow
  triggers: reverse engineer, legacy code, code analysis, undocumented, understand codebase, existing system
  role: specialist
  scope: review
  output-format: document
  related-skills: specify, fullstack-guardian, architecture-designer
---

# Spec Miner

Reverse-engineering specialist who extracts specifications from existing codebases.

## Role Definition

You operate with two perspectives: **Arch Hat** for system architecture and data flows, and **QA Hat** for observable behaviors and edge cases.

## When to Use This Skill

- Understanding legacy or undocumented systems
- Creating documentation for existing code
- Onboarding to a new codebase
- Planning enhancements to existing features
- Extracting requirements from implementation

## Core Workflow

1. **Scope** - Identify analysis boundaries (full system or specific feature)
2. **Explore** - Map structure using Glob, Grep, Read tools
   - _Validation checkpoint:_ Confirm sufficient file coverage before proceeding. If key entry points, configuration files, or core modules remain unread, continue exploration before writing documentation.
3. **Trace** - Follow data flows and request paths
4. **Document** - Write observed requirements in EARS format
5. **Flag** - Mark areas needing clarification

### Example Exploration Patterns

```
# Find entry points and public interfaces
Glob('**/*.py', exclude=['**/test*', '**/__pycache__/**'])

# Locate technical debt markers
Grep('TODO|FIXME|HACK|XXX', include='*.py')

# Discover configuration and environment usage
Grep('os\.environ|config\[|settings\.', include='*.py')

# Map API route definitions (Flask/Django/Express examples)
Grep('@app\.route|@router\.|router\.get|router\.post', include='*.py')
```

### EARS Format Quick Reference

EARS (Easy Approach to Requirements Syntax) structures observed behavior as:

| Type | Pattern | Example |
|------|---------|---------|
| Ubiquitous | The `<system>` shall `<action>`. | The API shall return JSON responses. |
| Event-driven | When `<trigger>`, the `<system>` shall `<action>`. | When a request lacks an auth token, the system shall return HTTP 401. |
| State-driven | While `<state>`, the `<system>` shall `<action>`. | While in maintenance mode, the system shall reject all write operations. |
| Optional | Where `<feature>` is supported, the `<system>` shall `<action>`. | Where caching is enabled, the system shall store responses for 60 seconds. |

> See `references/ears-format.md` for the complete EARS reference.

## Scaling: multi-module systems

The Core Workflow above is written for one analysis pass over one boundary. A large
undocumented system — several services, a monorepo with independent packages, a codebase a
prior scoping pass has already split into named modules — does not fit through that single
pass without either skipping modules or ballooning one subagent's context past what it can
hold. Once a scoping pass has produced 2 or more modules, route by module count:

| Modules from the scoping pass | Route |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/legacy-explore.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

The workflow fans out one read-only `spec-miner` subagent per module, each applying this
skill's Explore → Trace → Document (EARS) steps to its own module only, writing no files —
findings return as schema-validated JSON. It dispatches no writers: synthesizing everything
that comes back into a single spec (or, for `gate-reverse-engineer`'s callers, a Legacy SDD,
retrospective ADRs, and a recovered-requirements seed file) stays in the caller's turn, after
every module has returned.

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor for the `spec-miner` role — the key `legacy-explore.workflow.mjs` looks up, and the same methodology each dispatched module pass self-injects — surface "workflow", profile `research`, signals declared per that doc's profile tables; write it keyed by role to a temp JSON; run `model-route.mjs --caller spec-miner --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

```
Workflow({
  // scriptPath takes a real filesystem path, not an `@references/…` citation — run the
  // bare command dev-kit-core-root and substitute its output for <dev-kit-core>.
  scriptPath: "<dev-kit-core>/references/workflows/legacy-explore.workflow.mjs",
  args: {
    modules: [{                     // required, 2 or more entries — the scoping pass's output
      name: "billing-service",      // required
      paths: ["src/billing/"],      // required, non-empty
      focusNotes: "...",            // optional
    }],
    specHints: ["..."],             // optional — shared context applied across every module
  }
})
```

A dead run resumes with `Workflow({ scriptPath, resumeFromRunId: "<runId>" })` rather than a
full re-dispatch. The workflow's return distinguishes `explored` modules from
`unexploredModules` — an unexplored module is a coverage gap in whatever spec or SDD gets
synthesized next, never a silent drop.

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Analysis Process | `references/analysis-process.md` | Starting exploration, Glob/Grep patterns |
| EARS Format | `references/ears-format.md` | Writing observed requirements |
| Specification Template | `references/specification-template.md` | Creating final specification document |
| Analysis Checklist | `references/analysis-checklist.md` | Ensuring thorough analysis |

## Constraints

### MUST DO
- Ground all observations in actual code evidence
- Use Read, Grep, Glob extensively to explore
- Distinguish between observed facts and inferences
- Document uncertainties in dedicated section
- Include code locations for each observation

### MUST NOT DO
- Make assumptions without code evidence
- Skip security pattern analysis
- Ignore error handling patterns
- Generate spec without thorough exploration

## Output Templates

Save the mined specification to `docs/milestones/<M>/specs/<NNN>-<slug>/spec.md` — pick the
next available `<NNN>` and a `<slug>` naming the system or feature under analysis. This is
the same canonical spec path the `specify` skill writes, so downstream planning skills read
either origin identically.

Include:
1. Technology stack and architecture
2. Module/directory structure
3. Observed requirements (EARS format)
4. Non-functional observations
5. Inferred acceptance criteria
6. Uncertainties and questions
7. Recommendations

