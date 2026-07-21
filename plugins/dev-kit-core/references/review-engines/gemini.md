# Review Engine — Gemini

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Gemini binding lives. Gates reference this engine
> by name (`gemini`) only — never its binding inline.

**Engine id:** `gemini`

**Independence:** Cross-model (a non-Claude model) — strong independence from
Claude-authored work.

**Availability check:** Whatever Gemini mechanism this environment exposes is reachable —
e.g. `command -v gemini` succeeds for a Gemini CLI, or a Gemini agent/skill is resolvable
via the Agent/Skill tools. If none is present, this engine is unavailable and callers fall
back per the role's chain.

**Invocation:** Dispatch a Gemini model via whatever binding this environment provides —
a `gemini` CLI invocation, or an installed Gemini agent surfaced to the Agent/Skill tools.
Bind the concrete mechanism for your environment here; do not hardcode a specific vendor
plugin id in the registry or in any gate. The brief passes file paths only and instructs
the model to read each path and write its review to the gate-specified output file.

**Content-passing:** paths only — never inline diff, plan, or spec content. The engine
reads the files (and runs `git diff` where relevant) itself.

**Strengths / when to prefer:** Large-context, structured-data-heavy review passes
(architecture alignment, cross-file consistency, ADR-gap detection). The default engine
for the plan-gate review role.

**If unavailable:** callers fall back to the next engine in the role's chain (see the
registry's Default Engine per Role table), terminating at `claude`.
