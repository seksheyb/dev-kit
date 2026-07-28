---
description: The security gate — always runs. Open threats block the ship.
gate: always
blocking: true
---
**b. Security — always runs**

/dev-kit-core:security-audit every phase in this milestone, phase by phase — every threat model it
declared, not just the current change. Do not add security-reviewer as a parallel pass. Then the
cso skill in --diff mode over this milestone's accumulated changes; open threats block the ship.
Only once cso has finished — never alongside it, since it rewrites the manifests and lockfiles cso
just fingerprinted — the dependency-manager agent, escalating license questions to license-engineer.

→ next: `/dk:final:compliance` if regulated data is in scope, `/dk:final:pentest` if authorized, else `/dk:ship:safety`
