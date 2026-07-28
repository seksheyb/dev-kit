---
description: Performance pass first, then the two SLO reviewers together against real data.
gate: always
---
Dispatch the performance-engineer agent over what this milestone shipped, and wait for it — the SLO
review needs its real performance data, so nothing runs beside it. Once it returns, dispatch
sre-engineer and monitoring-expert together in one message to review this milestone's SLOs against
reality; neither depends on the other's output. Step 13 set the SLOs on expected traffic; this is
the first real data. Say whether the burn rate survives the next milestone's expected load, and
whether each SLO is calibrated or merely loose.
