# Review Engine — Cursor

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Cursor binding lives. Gates reference this engine
> by name (`cursor`) only — never its binding inline.

**Engine id:** `cursor`

**Independence:** Cross-model (a non-Claude agent) — strong independence from
Claude-authored work.

**Availability check:** `command -v cursor-agent` (or the project's configured Cursor CLI
binary) succeeds. If the binary is absent, this engine is unavailable and callers fall
back per the role's chain.

**Invocation:** Shell out via **Bash** to the Cursor agent CLI (`cursor-agent …`, or the
project-configured equivalent) with a path-only brief, telling it to read the diff/plan/spec
paths itself and write its review to the gate-specified output file. dev-kit does not bundle
the CLI — it must be installed in the environment; the availability check gates on that.
Same content-passing discipline as `codex`.

**Content-passing:** paths only — never inline diff, plan, or spec content. The agent
reads the files (and runs `git diff` where relevant) itself.

**Strengths / when to prefer:** Available as an explicit override (`--engine cursor`) in
environments that have a Cursor agent wired up. Not in any role's default fallback chain
by default, since its availability is environment-specific.

**If unavailable:** callers fall back to the next engine in the role's chain (see the
registry's Default Engine per Role table), terminating at `claude`.
