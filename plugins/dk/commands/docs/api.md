---
description: Code-level API docs — the half document-generate does not cover.
gate: auto
precondition: "test -n \"$(git diff --name-only origin/HEAD 2>/dev/null)\""
asks: "Did this milestone ship a code-level public surface — new or changed functions, classes, HTTP endpoints, or published events? Skip only if none."
---
Now the code-documenter skill for the half document-generate does not cover, scoped to every
function, class, endpoint and event this milestone added or changed. Do not re-open the Diataxis
pages document-generate just wrote.

→ next: `/dk:docs:changelog` if you took the manual path at step 13, else `/dk:docs:release`
