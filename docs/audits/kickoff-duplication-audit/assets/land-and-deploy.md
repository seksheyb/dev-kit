# land-and-deploy

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/land-and-deploy/SKILL.md`
- **file_lines**: 205
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 2
- **invoked by steps**: 13, 14

---

## Invocation 1 — step 13 (Ship — open the PR), block 2, lines 1123-1140

### verbatim_text

```text
Run land-and-deploy's one-time first-run setup wizard now, while I am sitting here to answer it.
It is interactive and it fires only when CLAUDE.md has no `## Deploy Configuration` section, so
if it is left until land-and-deploy runs at the end of step 14 it stops an otherwise unattended
deploy to ask me questions.

First check `gh auth status`. land-and-deploy stops outright if that fails, and the fix is
`gh auth login` — do it now rather than discovering it mid-deploy. Then detect the platform from
the repo (fly.toml, render.yaml, vercel.json or .vercel, netlify.toml, Procfile, railway.json
or railway.toml, or the deploy workflows under .github/workflows/), and ask me directly for
anything you cannot detect.
Persist the result as a `## Deploy Configuration` section in CLAUDE.md with all eight fields:
platform, production URL, staging URL, deploy workflow, deploy status command, merge method,
project type, and post-deploy health check. Then verify it — curl the health-check URL, run the
status command, show me the validation table, and get my explicit confirmation before you treat
it as done. A failing check is a warning, not a blocker. Never print full API keys or tokens
while doing any of this.
```

### surrounding_prose

Conditioning line directly above the fence: '(only if CLAUDE.md has no `## Deploy Configuration` section — check that now, not at deploy time)' — conditional/skippable block. Follows directly after block 1 (infra lane routing) with no other prose between them besides the condition line.

---

## Invocation 2 — step 14 (Document), block 6, lines 1269-1274

### verbatim_text

```text
Use the land-and-deploy skill. It picks up where ship left off: readiness gate → merge → poll
the deploy platform → verify production health, with revert as the escape hatch at every
failure point. GitHub only — on GitLab or an unrecognized platform it stops and hands off to a
manual merge, which is the correct outcome, not a failure.
```

### surrounding_prose

Preceded by bolded transition '**Then land it.**'. Gated by: '(only if you took the automated path at step 13)'. Mentions 'ship' descriptively (what land-and-deploy picks up from), not as an invocation in this block.

---
