---
description: Milestone-wide design and accessibility review. Gates the milestone.
argument-hint: "[URL]"
gate: operator
asks: "Did the milestone ship UI, across any of its phases?"
blocking: true
---
Both sub-stages **gate** the milestone. **a. Functional** is two independent predicates — shipped
UI triggers the first block, a developer-facing surface the second; a milestone with both runs both.

Use the context-restore skill. Then, across everything this milestone shipped: the design-reviewer
agent in full mode with regression — give it the app's URL explicitly, <URL>, plus whatever auth it
needs past a login, and dispatch it alone, not fanned out. Then the accessibility-tester agent.
Gate: tell me whether each passed.

Run this beside the other two milestone gates, devex and compliance, not after them — three
independent predicates over different surfaces writing different reports, each still returning its
own blocking verdict. That concurrency is between the gates only: inside this one design-reviewer
still goes alone, since a full-mode regression review needs exclusive use of the app URL, and
accessibility-tester still waits for it.
