# Review Engine — Codex

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Codex binding lives. Gates reference this engine
> by name (`codex`) only — never its binding inline.

**Engine id:** `codex`

**Independence:** Cross-model (a non-Claude model) — strong independence from
Claude-authored work.

**Availability check:** Whatever Codex mechanism this environment exposes is reachable —
e.g. the `codex` plugin is installed (its `codex:rescue` skill resolves via the Skill
tool), or a Codex CLI is on PATH. If none is present, this engine is unavailable and
callers fall back per the role's chain.

**Invocation:** Dispatch a Codex model via whatever binding this environment provides. If
the `codex` plugin is installed, invoke its `codex:rescue` skill via the Skill tool with a
path-only brief; otherwise use the environment's Codex CLI. The engine runs its own
`git diff` and file reads in its own context — the brief lists paths only.

**Content-passing:** paths only — never inline diff, plan, or spec content. The engine
runs `git diff` and reads files itself.

**Strengths / when to prefer:** Independent adversarial passes over a diff — the default
engine for adversarial review rounds (`code-review-gate` round mode) and for docs-vs-code
drift review (`document-release`).

**If unavailable:** callers fall back to the next engine in the role's chain (see the
registry's Default Engine per Role table), terminating at `claude`.
