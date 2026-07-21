# Independent Review — Engine Bridge Registry

> Generic rule for any gate that needs an **independent** (non-self) review pass: dispatch
> a review engine chosen from this registry, not a hardcoded plugin. Referenced by
> `agents/gate-plan-review.md`, `agents/code-review-gate.md`, `commands/review.md`,
> `skills/code-review-protocol/SKILL.md`, and `skills/document-release/SKILL.md`.

## Why Independence Matters

A reviewer that shares the implementer's context (same model, same conversation, same
blind spots) is weaker evidence than one that doesn't. Where possible, prefer a **different
model** from whatever wrote the work under review. `claude` is always available as a full
peer reviewer — not merely a fallback — but a cross-model engine (`gemini`, `codex`,
`cursor`, `antigravity`) is stronger independence when installed.

## Engine Registry

Each engine's **concrete binding lives in its own adapter file** under
`references/review-engines/` — the registry and every gate reference an engine **by name
only**, never its binding inline. This keeps plugin/CLI names out of the gates: swapping,
renaming, or wiring an engine touches exactly one adapter file.

| Engine | Adapter (the binding) | Independence | When to prefer |
|---|---|---|---|
| `claude` | `review-engines/claude.md` | Self-family (always available) | Default one-shot review; terminal fallback for every role |
| `gemini` | `review-engines/gemini.md` | Cross-model | Large-context, structured-data-heavy passes; default plan-gate review |
| `codex` | `review-engines/codex.md` | Cross-model | Independent adversarial diff passes; default for review rounds & docs-drift |
| `cursor` | `review-engines/cursor.md` | Cross-model | Explicit override where a Cursor agent is wired up (recipe stub) |
| `antigravity` | `review-engines/antigravity.md` | Cross-model | Explicit override where an Antigravity agent is wired up (recipe stub) |

**Adding an engine:** drop a new adapter file in `references/review-engines/` that (1)
takes a brief by file path, (2) reads the diff/plan/spec itself, and (3) writes its
findings to a file the gate then reads back. Add one row here pointing at it. No gate
changes needed.

## Default Engine per Role

| Role | Default | Fallback order |
|---|---|---|
| Plan-gate review (`gate-plan-review`) | `gemini` | `gemini` → `codex` → `claude` |
| One-shot code review (`code-review-gate`, non-round mode) | `claude` | `claude` (always available; no fallback needed) |
| Adversarial review rounds (`code-review-gate`, round mode) | `codex` | `codex` → `gemini` → `claude` |
| Docs-vs-code drift review (`document-release`) | `codex` | `codex` → `claude` (general-purpose subagent) |

A caller may override the default explicitly (e.g. `/review --engine gemini`, or
`--engine cursor` / `--engine antigravity` where those are wired up). When the default
engine's availability check fails, fall back to the next engine in that role's order —
`claude` terminates every fallback chain since it has no external dependency. `cursor` and
`antigravity` are not in any default chain (their availability is environment-specific);
select them explicitly.

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

1. Determine the role (see table above) and its default engine (or honor an explicit override).
2. Open that engine's adapter file (`references/review-engines/<engine>.md`) and run its
   availability check.
3. If unavailable, advance to the next engine in the fallback order; log which engine
   was actually used (gates should record this in their output, e.g. an `engine:` field
   in the JSON summary) so a fallback is visible to the caller, not silent.
4. Dispatch per the adapter's invocation method with a path-only brief.
