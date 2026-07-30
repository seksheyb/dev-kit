---
description: Retro over the whole milestone — override the command's 7-day default.
argument-hint: "<Nd>"
gate: always
---
**Retro — set the window to the whole milestone**, not this command's default last 7 days:
`/dev-kit-core:retro <Nd>`
Run it concurrently with the health check and the product-loop pass — the three read different
artifacts and write different outputs, so nothing orders them.
