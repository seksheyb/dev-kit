---
description: Project health check to open the operate stage.
gate: always
---
`/dev-kit-core:health` — run it concurrently with the retro and the product-loop pass. The three
read different artifacts and write different outputs, so nothing orders them.
