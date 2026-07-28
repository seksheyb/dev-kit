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

→ next: `/dk:final:devex` if the milestone shipped a developer-facing surface, else `/dk:final:security`
