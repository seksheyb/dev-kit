# Vertical Slices — Never Horizontal Layers

> The canonical definition of a vertical slice and the acceptance test that
> distinguishes it from a horizontal layer. Referenced by `roadmapper.md` (phase
> structure), `planner.md` (task decomposition, MVP mode), `writing-plans`, `specify`,
> and `gate-plan-review`. This is the phase/plan-structure companion to
> `references/planning/planner-mvp-mode.md`, which covers the task-order mechanics inside a
> single MVP phase.

## What a Vertical Slice Is

A **vertical slice** delivers one complete, user-observable capability end-to-end —
through every technical layer it touches (UI → API → data, or the equivalent for the
project) — rather than delivering one layer across every capability.

**The distinguishing property:** a vertical slice is *independently deliverable and
independently testable*. When it completes, a real user can do something they could not
do before. A horizontal layer, by contrast, produces nothing a user can exercise until
some *later* layer is also built.

- Vertical (good): "User profiles" — the model, the endpoint, and the UI for profiles,
  all together. Ship it and profiles work.
- Horizontal (bad): "All database models", then "All API endpoints", then "All UI".
  Nothing works until the last phase, and no phase can be verified on its own.

## The Acceptance Test

Apply this test to every phase (roadmapper) and every task (planner):

> **After this phase/task completes, can a real user *do* something they could not do
> before?**

- **Yes** → it is a vertical slice. Proceed.
- **"No, but the foundation is laid"** → it is a horizontal layer disguised as a slice.
  Restructure it.

The test is about *observable capability*, not code volume. A slice may be thin (one
hard-coded happy path) and still pass, as long as a user can exercise it end-to-end.

## Anti-Patterns to Reject

- **Horizontal layers as phases.** `Phase 1: Models → Phase 2: APIs → Phase 3: UI`.
  Too coupled; nothing verifiable until the end. Reject.
- **Layer cake disguised as slices.** Three "vertical" tasks where Task 1 is "all the
  schemas", Task 2 is "all the endpoints", Task 3 is "all the UI". That is horizontal
  planning with new labels. Reject.
- **Partial features.** Half of auth in one phase, the other half in another, with
  neither independently usable. Reject — draw the boundary at a complete capability.
- **Artificial splits to hit a phase/task count.** Splitting a coherent slice into
  layers just to produce more phases. Reject.

## The One Legitimate Exception

Horizontal structure is allowed **only** when a shared foundation is genuinely required
before any slice can be built — e.g. a project scaffold, a schema-migration framework, or
an auth substrate that every subsequent slice depends on. When you use it, say so
explicitly and name the slices it unblocks. "It's cleaner" or "it's how I'd organize the
code" is not a justification. If you cannot name the dependent slices, it is not a
foundation — it is a horizontal layer, and you should restructure.

Even a foundation phase should be the *thinnest* stack that unblocks the next slice (see
the Walking Skeleton in `references/planning/planner-mvp-mode.md`), not a full layer built out
ahead of demand.
