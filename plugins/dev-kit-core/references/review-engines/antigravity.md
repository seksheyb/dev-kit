# Review Engine — Antigravity

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Antigravity binding lives. Gates reference this
> engine by name (`antigravity`) only — never its binding inline.
>
> **Recipe stub:** dev-kit ships no built-in Antigravity binding. This adapter is an
> availability-gated recipe — wire it to your environment's Antigravity agent, or leave it
> unavailable and callers fall back.

**Engine id:** `antigravity`

**Independence:** Cross-model (a non-Claude agent) — strong independence from
Claude-authored work.

**Availability check:** The environment exposes an Antigravity agent — e.g.
`command -v antigravity` succeeds, or an Antigravity agent/skill is resolvable via the
Agent/Skill tools. If none is present, this engine is unavailable and callers fall back per
the role's chain.

**Invocation:** Dispatch the Antigravity agent via whatever binding this environment
provides (its CLI, or an agent surfaced to the Agent/Skill tools) with a path-only brief,
telling it to read the diff/plan/spec paths itself and write its review to the
gate-specified output file.

**Content-passing:** paths only — never inline diff, plan, or spec content. The agent
reads the files (and runs `git diff` where relevant) itself.

**Strengths / when to prefer:** Available as an explicit override (`--engine antigravity`)
in environments that have an Antigravity agent wired up. Not in any role's default fallback
chain by default, since its availability is environment-specific.

**If unavailable:** callers fall back to the next engine in the role's chain (see the
registry's Default Engine per Role table), terminating at `claude`.
