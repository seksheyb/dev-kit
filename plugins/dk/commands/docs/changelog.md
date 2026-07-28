---
description: Manual path only — write the version bump and CHANGELOG entry ship would have written.
gate: verdict
on: "ship:pr was taken at step 13"
---
Nothing on the manual path wrote a version bump or a CHANGELOG entry. Write both now, before
document-release runs; decide the bump level from this milestone's own commits and ask me before
anything above patch. Run this beside the doc-sync rather than after it — the changelog and the
version file are not part of the doc tree that doc-sync and the API pass write, and nothing in
either of those reads them. Then tell me plainly that ship's coverage-gap tracing and
plan-completion audit did not run on this path either.
