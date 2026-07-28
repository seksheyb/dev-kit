---
description: Safety rails on, held through the deploy. No edit-scope freeze — step 14 needs the whole repo.
gate: always
---
**Stop at the PR.** Step 14 documents the milestone against the still-unmerged diff; the merge and
deploy happen at the end of step 14. Safety rails on first.

Use the guard skill in safety mode, and keep it active from here through the deploy at the end of
step 14. Do not set an edit-scope freeze and do not ask me which directory to lock edits to: step
14 rewrites docs across the whole repo, so a freeze would stop it dead.

→ next: `/dk:ship:infra` if this milestone changed the deploy surface, else `/dk:ship:pr` or `/dk:ship:auto`
