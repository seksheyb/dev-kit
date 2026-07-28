---
description: Lens-based plan review — fix what it flags. Does not run the gate.
argument-hint: "[lenses]"
gate: always
---
Then `/dev-kit-core:plan-review`. Fix what it flags before going on; it does **not** run the gate
below, which is a separate dispatch.

**Review tier — your call; no lens can make it.** The everyday **minimum bar** is
`gate-plan-review` plus `/dev-kit-core:plan-review goal-backward`; all four lenses is maximum
rigor. Add `eng` for new architecture, a security/payments/auth surface, or anything touching
>15 files; add `design`/`devex` when the phase also has UI or a developer-facing surface.
