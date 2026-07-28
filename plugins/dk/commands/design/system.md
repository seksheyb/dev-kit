---
description: Establish the design system — runs once ever, not per phase.
argument-hint: "[product]"
gate: auto
precondition: "! test -f docs/global/design/DESIGN.md"
asks: "Does this project have UI, and no design system yet?"
---
Runs **once ever**, not per phase.

Use the context-restore skill. Then the design-consultation skill for <product>. Ask for "Variant
shotgun" mode if you want competing directions compared first — this is the only place in the
pipeline that choice is still open. If it binds a system, go on to design-html for the reference
implementation; if it hands me a system-creation prompt instead, stop there.

→ next: `/dk:design:bind` if it stopped at a system-creation prompt, else `/dk:discover:graph-update`
