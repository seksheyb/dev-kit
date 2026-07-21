# Review Engine — Antigravity

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Antigravity binding lives. Gates reference this
> engine by name (`antigravity`) only — never its binding inline.

**Engine id:** `antigravity`

**Independence:** Cross-model (a non-Claude agent). Antigravity fronts Google's **Gemini**
models, so selecting `antigravity` runs the Gemini model family via its CLI — it is one of
the concrete bindings the `gemini` engine can also resolve to (see `review-engines/gemini.md`).

**Availability check:** `command -v antigravity` (or the project-configured Antigravity CLI
binary) succeeds. If the binary is absent, this engine is unavailable and callers fall back
per the role's chain.

**Invocation:** Shell out via **Bash** to the Antigravity CLI (`antigravity …`, or the
project-configured equivalent) with a path-only brief, telling it to read the diff/plan/spec
paths itself and write its review to the gate-specified output file. dev-kit does not bundle
the CLI — it must be installed in the environment; the availability check gates on that.

**Content-passing:** paths only — never inline diff, plan, or spec content. The agent reads
the files (and runs `git diff` where relevant) itself.

**Strengths / when to prefer:** A CLI-based cross-model reviewer running Gemini. Selectable
as an explicit override (`--engine antigravity`), and a valid binding for the `gemini`
engine's plan-gate role where a standalone `gemini` CLI isn't installed but Antigravity is.

**If unavailable:** callers fall back to the next engine in the role's chain (see the
registry's Default Engine per Role table), terminating at `claude`.
