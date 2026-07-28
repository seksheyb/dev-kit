---
description: Refresh the repo graph before anything in discovery or planning queries it.
gate: auto
precondition: "test -f docs/state/graphs/graph.json"
asks: "Has this milestone shipped code — i.e. phase 2 onward on a greenfield project?"
---
Use the graphify skill, with --update if a graph already exists, before anything in this step or
step 7 queries the repo graph.
