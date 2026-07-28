---
description: Route the infra lane over the deploy surface, strictly sequential — each writes config the next depends on.
gate: operator
asks: "Did this milestone change the deploy, infra, or runtime surface — or is it the first to deploy at all?"
---
Route the infra lane over this milestone's deploy surface before we ship into it, in this order and
never in parallel — each writes config the next depends on: devops-engineer, then
terraform-engineer with cloud-architect only where the topology itself is open, then whichever of
kubernetes-specialist / docker-expert matches how this project runs — skip the other rather than
inventing a use for it — then sre-engineer, then monitoring-expert. Tell me which you ran, and which not.

→ next: `/dk:ship:deploy-setup` if land-and-deploy was never configured here, else `/dk:ship:pr` or `/dk:ship:auto`
