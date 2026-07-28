---
description: Release notes over the existing CHANGELOG entry, then content-qa, while the PR is still open.
gate: always
---
Use the document-release skill, over the CHANGELOG entry that already exists — whether ship wrote
it or I did on the manual path. Run it while the PR is still open and unmerged; the merge is the
last thing in this step. Then the content-qa skill over everything this step has touched,
including document-release's own edits — it runs alone, nothing else touching these files.

→ next: `/dk:docs:verify`
