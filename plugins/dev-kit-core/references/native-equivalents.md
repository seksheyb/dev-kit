# Native equivalents reference

dev-kit has zero runtime dependency on any external SDK, CLI, or install.
Every operation an agent might otherwise shell out to is replaced by one of
these native operations, using only the agent's own granted tools
(Read/Write/Bash/Grep/Glob/WebSearch). This file is the single source of
truth — agents reference it by operation name instead of re-deriving the
equivalent inline.

| Op | What it did | Native replacement |
|---|---|---|
| `state.load` | Read the orchestrator's phase/project state file | `Read` the state file directly (default `docs/state/STATE.md`, orchestrator-configurable). If absent, state is empty — proceed with what the dispatch prompt provided. |
| `init.plan-phase` / `init.phase-op` | Bootstrap phase context (load ROADMAP, REQUIREMENTS, prior artifacts for this phase) | `Glob` the phase directory (default `docs/milestones/<M>/phases/<NN>-<slug>/`) and `Read` `docs/milestones/<M>/ROADMAP.md`, `docs/milestones/<M>/REQUIREMENTS.md`, and any existing `CONTEXT.md`/`RESEARCH.md`/`<NN>-<MM>-PLAN.md` already in the phase directory. Treat missing files as "not yet produced," not an error. |
| `websearch` | Query the web with a result-limit hint | Call the agent's own `WebSearch` tool directly with the same query. Apply the `--limit` as an informal cap on how many results you read deeply. |
| `commit` | Stage named files and commit with a message | `Bash`: `git add <files> && git commit -m "<message>"`. Never `git add -A` — pass explicit paths. If the working tree has unrelated changes, stage only the paths this operation names. |
| `frontmatter.validate <path> --schema plan` | Check a markdown file's YAML frontmatter against a shape | `Read` the file, parse the frontmatter block between the first two `---` lines, and check it has the fields the schema name implies (for `plan`: objective/context/tasks/success-criteria sections present in the body — see the `writing-plans` skill for the canonical `<NN>-<MM>-PLAN.md` shape). Report which fields are missing rather than a pass/fail boolean. |
| `verify.plan-structure <path>` | Confirm a plan file has the required sections in order | `Read` the file and `Grep` for the required headings (Objective, Context, Tasks, Success Criteria — see `writing-plans` skill). Flag missing or out-of-order sections directly in your output; don't silently accept. |
| `roadmap.analyze` | Summarize a ROADMAP.md's phase list and dependencies | `Read` `docs/milestones/<M>/ROADMAP.md` directly and reason over its phase table/dependency notes yourself — no separate analysis step exists to call. |
| `learnings.query --tag <tag> --limit N` | Look up prior project learnings matching a tag | Use the `learn` skill's search behavior: `grep` the learnings ledger (default `.claude/learnings.jsonl`) for entries whose `tags` field matches, take the most recent N. |
| `history-digest` | Summarize recent session/commit history for context recovery | `Bash`: `git log --oneline -20` plus a `Read` of the most recently modified `CONTEXT.md` under `docs/milestones/<M>/phases/*/` (or the project's configured context-save location, per the `context-save`/`context-restore` skills). Synthesize a short digest yourself. |
| `graphify status` / `graphify query <kw>` | Query the codebase knowledge graph | Invoke the `graphify` skill directly (it owns this capability natively in dev-kit — no external binary). |

**General rule:** none of these require a tool beyond what's already granted in
the agent's frontmatter. If an operation needs a file that doesn't exist yet
(fresh project, first phase), treat that as the expected empty case, not a
failure — proceed with the context you do have.
