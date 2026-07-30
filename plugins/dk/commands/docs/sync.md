---
description: Post-release doc-sync scoped to this milestone's delta, plus the manual path's version bump and CHANGELOG.
gate: always
---
**One paste at a time, in this order.** `document-generate` and `code-documenter` are **sequential,
not alternatives**; running only one leaves half the doc set unwritten. Use the document-generate
skill in its post-release doc-sync mode, scoped to this milestone's delta, not the whole doc surface.

Beside that chain rather than after it, and only if the manual ship path (`ship:pr`) was taken at
step 13: nothing on that path wrote a version bump or a CHANGELOG entry. Write both now, before
document-release runs; decide the bump level from this milestone's own commits and ask me before
anything above patch. The changelog and the version file sit outside the doc tree the chain writes,
and nothing in the chain reads them. Then tell me plainly that ship's coverage-gap tracing and
plan-completion audit did not run on this path either.
