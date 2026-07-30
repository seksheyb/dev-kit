# Review Engine — Claude

> One of the review-engine adapters indexed by `references/independent-review.md`. This
> file is the single place the concrete Claude binding lives. Gates reference this engine
> by name (`claude`) only — never its binding inline.

**Engine id:** `claude`

**Independence:** Self-family. A Claude reviewer does not have cross-model independence
from Claude-authored work, but it is a full-strength adversarial reviewer and is **always
available**, so it terminates every fallback chain.

**Availability check:** Always available. No external dependency — it runs in-process.

**Invocation:** Dispatch an internal subagent via the Agent tool (a `general-purpose`
agent, or a purpose-built review agent). The subagent runs the full review methodology
in-process; no shell-out, no plugin.

**Content-passing:** Even though this is in-process, keep the brief **path-based** (diff
base/branch, plan path, schema path) so gates stay engine-agnostic and cheap to swap. Let
the subagent read the files / run `git diff` itself.

**Strengths / when to prefer:** The default for one-shot code review, and the guaranteed
fallback when no cross-model engine is installed. Prefer a cross-model engine (`gemini`,
`codex`, `cursor`, `antigravity`) when independence from Claude-authored work matters.

**If unavailable:** N/A — `claude` is the terminal engine of every fallback chain.
