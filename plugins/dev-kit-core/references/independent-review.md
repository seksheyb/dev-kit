# Independent Review — Engine Bridge Registry

> Generic rule for any gate that needs an **independent** (non-self) review pass: dispatch
> a review engine chosen from this registry, not a hardcoded plugin. Referenced by
> `agents/gate-plan-review.md`, `agents/code-review-gate.md`, `skills/document-release/SKILL.md`,
> `skills/sprint-execution/SKILL.md`, and `skills/bugfix-wave/SKILL.md`.

## Why Independence Matters

A reviewer that shares the implementer's context (same model, same conversation, same
blind spots) is weaker evidence than one that doesn't. Where possible, prefer a **different
model** from whatever wrote the work under review. `claude` is always available as a full
peer reviewer — not merely a fallback — but a cross-model engine (`gemini`, `codex`,
`cursor`) is stronger independence when installed.

## Engine Registry

| Engine | Invocation | Availability check | Notes |
|---|---|---|---|
| `claude` | Internal subagent (Task/Agent tool, `general-purpose` or a purpose-built agent) | Always available | Full peer reviewer, not a degraded fallback. Runs the complete methodology in-process — no plugin dependency, no Bash shell-out. |
| `gemini` | `cc-gemini-plugin:gemini` Skill | The `cc-gemini-plugin` is installed (skill resolvable via the Skill tool) | Best for large-context, structured-data-heavy review passes (architecture, cross-file consistency). |
| `codex` | `codex:rescue` Skill | The `codex` plugin is installed (skill resolvable via the Skill tool) | Runs its own `git diff`/file reads independently — pass paths only, never inline diff/plan content. |
| `cursor` | Bash CLI (`cursor-agent` or project-configured equivalent) | `command -v cursor-agent` (or project's configured binary) succeeds | Project-supplied recipe; treat the same as `codex` for content-passing rules (paths only). |

**Adding an engine:** any CLI or Skill that can (1) be given a brief by file path, (2)
read the diff/plan/spec itself, and (3) write its findings to a file the gate then reads
back satisfies this contract. No registry code change is needed beyond adding a row here.

## Default Engine per Role

| Role | Default | Fallback order |
|---|---|---|
| Plan-gate review (`gate-plan-review`) | `gemini` | `gemini` → `codex` → `claude` |
| One-shot code review (`code-review-gate`, non-round mode) | `claude` | `claude` (always available; no fallback needed) |
| Adversarial review rounds (`code-review-gate`, round mode) | `codex` | `codex` → `gemini` → `claude` |
| Docs-vs-code drift review (`document-release`) | `codex` | `codex` → `claude` (general-purpose subagent) |

A caller may override the default explicitly (e.g. `/review --engine gemini`). When the
default engine's availability check fails, fall back to the next engine in that role's
order — `claude` terminates every fallback chain since it has no external dependency.

## Content-Passing Rules (apply to every engine)

- **Never inline plan, spec, SDD, or diff content into the dispatch brief.** Pass file
  paths and let the engine read them (or run `git diff` itself) in its own context.
  This holds for `claude` too — even though it's an in-process subagent, keep briefs
  path-based so gates stay engine-agnostic and cheap to swap.
- The engine writes its full prose review to disk; the gate reads that file back and
  produces the schema-compliant JSON summary itself (or validates the engine's JSON,
  per the gate's own contract).
- The gate's reply to its caller contains only the JSON summary (and its path) — never
  the review prose, never the plan/diff content.

## Selecting an Engine (what a gate does)

1. Determine the role (see table above) and its default engine.
2. Run that engine's availability check.
3. If unavailable, advance to the next engine in the fallback order; log which engine
   was actually used (gates should record this in their output, e.g. an `engine:` field
   in the JSON summary) so a fallback is visible to the caller, not silent.
4. Dispatch per that engine's invocation method with a path-only brief.
