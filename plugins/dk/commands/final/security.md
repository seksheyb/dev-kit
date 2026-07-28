---
description: The security gate — always runs. Open threats block the ship.
gate: always
blocking: true
---
**b. Security — always runs**

Fan the /dev-kit-core:security-audit out across the milestone — one security-auditor per phase, all
dispatched in a single message, each scoped to the threat model that phase declared rather than to
the current change — then merge what they return into one threat register yourself. Do not add
security-reviewer as a parallel pass; that ban is about a redundant second scanner over the same
ground, not about the per-phase fan-out. Then, once every audit has returned and never beside them,
the cso skill in --diff mode over this milestone's accumulated changes — it needs the whole register
to diff against; open threats block the ship. Only once cso has finished — never alongside it, since
it rewrites the manifests and lockfiles cso just fingerprinted — the dependency-manager agent,
escalating license questions to license-engineer.
