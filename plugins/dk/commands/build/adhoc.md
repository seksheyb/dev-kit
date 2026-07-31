---
description: Parallel dispatch for independent tasks that have no written plan.
gate: operator
asks: "Are there 2+ independent tasks outside this plan — no written plan, no triaged bug list?"
---
Use the dispatching-parallel-agents skill instead.

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step, the router decides `model`/`effort` for every one of these dispatches — this command has no written plan to carry declared values, so nothing here is Surface C and there is no plan row to fall back on. Pick the procedure by how the fan-out actually dispatches:

- **Surface A — the normal path here.** `dispatching-parallel-agents` fans out over N *inline* `Agent` calls (no `Workflow` script, no worktree), so each dispatch is its own Surface A call with `surface: "agent"`. Build one descriptor per agent ROLE — not per task instance: three unrelated bugs handed to the same investigator role share one descriptor, while an investigator and a doc-writer are two. Signals come from that doc's profile tables; `ambiguity` is usually the deciding signal for ad hoc work, since the defining property of this command is that nobody wrote the task down. Route them in one call — `model-route.mjs --caller build:adhoc --batch <file>` accepts a mixed batch and honors each descriptor's own `surface` — then, per role: pass the returned `model` on the `Agent` call unless it is `"inherit"` (omit `model` entirely in that case — `inherit` is a router decision, never a skipped step), and because `effortParam` is always `null` on this surface, inject the matching effort prompt block from § Effort prompt blocks verbatim into that agent's prompt text. A single descriptor may also be routed on its own with `--caller build:adhoc --json` on stdin.
- **Surface B — only if this fan-out is actually a `Workflow` script run.** If the work turns out to match a fixed roster under `references/workflows/`, it is that script's owning asset that routes it: build one descriptor per role with `surface: "workflow"`, run `--batch`, and forward the keyed output verbatim as `args.routing` on the `Workflow` call. Do not hand-write `model`/`effort` into `args`.

Either way the routing step runs before the first dispatch, and no task picks its own model at the call site.
