---
description: Respond to a live production incident.
gate: operator
asks: "Is a production incident underway?"
---
Use the incident-responder agent on this live incident.

→ next: `/dk:close:game-day` if the postmortem named an unrehearsed failure mode, else `/dk:close:milestone`
