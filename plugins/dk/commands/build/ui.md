---
description: Build this phase's actual screens and hand the design off to the UI tracks.
gate: operator
asks: "Does this phase ship UI?"
---
Use the design-html skill for this phase's actual screens — step 4 built the one-time reference
implementation, not these. Then the design-handoff skill. Start this pair as soon as wave 1
opens, beside the tracks that have no UI in them: only the UI tracks wait on the handoff, and
nothing else in the wave touches what these two write. Hand the handoff output to the UI tracks
before they build — a UI track that started without it is the one thing this ordering exists to
prevent, so say so rather than letting it run.
