# `dk` hooks — shared contracts

Every hook in this directory is written against the contracts below. **Nothing here may be
re-decided inside an individual hook** — a hook that invents its own queue format, kill-switch
name, or note type breaks the others silently, because hooks never see each other's output.

## The five invariants

1. **Self-scoping.** A hook is a no-op unless `.dk-state` exists in the session's `cwd`. dev-kit
   installs into repos that are not running the pipeline; those sessions must see nothing.
2. **Never block.** No hook in this directory blocks a tool call. Any error — bad JSON, missing
   file, unreadable state — exits `0` silently. A hook that breaks a session is worse than a hook
   that does nothing.
3. **Kill switches are honored before any work.** `wiki: off` and `graphify: off` in `.dk-state`
   silence their respective hooks. Check the flag before reading anything else.
4. **Emit nothing unless there is something to say.** These fire on every matching tool call.
   Silence is the default and the common case; output is the exception.
5. **No code derived from external hook packages.** Notably not from `get-shit-done`'s hooks,
   which are pinned to `.planning/` internals dev-kit does not have. Design ideas are fine;
   copied implementations are not.

## Hook input

Common fields on stdin for every event:

```
session_id · prompt_id · transcript_path · cwd · permission_mode · effort.level
hook_event_name · agent_id (subagent only) · agent_type (subagent only)
```

Event-specific fields actually used here:

| Event | Fields |
|---|---|
| `SessionStart` | `source`: `startup` \| `resume` \| `clear` \| `compact` \| `fork` |
| `PreToolUse` | `tool_name`, `tool_input` |
| `PostToolUse` | `tool_name`, `tool_input`, `tool_use_id`, `tool_output`, `tool_output_is_error` |
| `Stop` | `last_assistant_message` |
| `PreCompact` | common only |

**There is no `context_window` field in any hook payload.** It reaches the `statusLine` command
only. `dk-context.js` bridges it; see that file's header.

## Hook output

To inject context, print one JSON object to stdout and exit `0`:

```json
{"hookSpecificOutput":{"hookEventName":"<event>","additionalContext":"<text>"}}
```

To stay silent, print nothing and exit `0`.

## Shared helpers — use these, do not reimplement

`lib/dk-common.sh` (source it) and `lib/dk-common.js` (require it) implement the invariants
once. Both are smoke-tested. Reimplementing any of this inside a hook is how the five hooks
drift apart.

| Shell | Node | Does |
|---|---|---|
| `dk_read_stdin` | `readPayload(cb)` | Slurp + validate the payload. **Exits 0 on empty or unparseable input** — call it first |
| `dk_guard` | `guard(data)` | Invariant 1 — exit unless `.dk-state` exists |
| `dk_flag_off <name>` | `flagOff(data, name)` | Invariant 3 — kill switch check |
| `dk_state <key>` | `stateKey(data, key)` | Read a `.dk-state` key; `-` reads as empty |
| `dk_json <a.b.c>` | *(use `data` directly)* | Read a payload field |
| `dk_root` | `root(data)` | Project root — payload `cwd`, falling back to `PWD` |
| `dk_emit <event> <text>` | `emit(event, text)` | Invariant 4 — emits nothing when text is empty |
| `dk_once <tag>` | `safeSessionId(data)` | Once-per-session marker, keyed on a sanitized session id |
| `dk_queue` | — | Path to the wiki queue |

## The wiki queue

**Path:** `.claude/dk-wiki-pending` (project-local, gitignored — it is a work queue, not a record)

**Format:** tab-separated, one entry per line, append-only.

```
<iso8601>\t<type>\t<path>
2026-07-28T14:02:11Z	1	docs/global/architecture/adr/0004-session-store.md
```

Producer (`dk-post-write-wiki-queue.sh`) appends without reading — it must stay trivial.
Consumers (`dk-stop-wiki-drain.sh`, `dk-session-start-orient.sh`) dedupe by path keeping the
newest entry, and truncate the file once a save is acknowledged.

## The six note types

The vault is **deliberately lossy**. It holds only what no other dev-kit surface holds, because
`.dk-state`, `STATE.md`, `journal/`, `docs/` artifacts, graphify and `learnings.jsonl` already
cover the rest — and almost all of them are archived at `close:milestone`, which is the gap the
vault exists to fill.

| Type | Name | What the note captures |
|---|---|---|
| 1 | Decision + rejected alternatives | The chosen option **and the discarded branches with why they lost** — ADRs record only the winner, which is why rejected ideas get re-proposed |
| 2 | Post-mortem | Root-cause diagnosis, not just the fix. The fix is in git; the diagnosis dies with the session |
| 3 | Constraint + how it was learned | `CLAUDE.md` holds the one-line active constraint; the vault holds the incident that produced it, so its removal cost is on record |
| 4 | Domain knowledge | Market, user, competitive, regulatory facts. graphify covers code; nothing else covers domain |
| 5 | Milestone retrospect | What a milestone shipped and why, surviving the archive |
| 6 | Dismissed finding | A review finding rejected as a false positive, with the reason — the loop re-flags these every round otherwise |

### Path → type

Derived from `templates/SITEMAP.md`. A write whose path matches nothing here is **not queued**.

| Type | Path patterns (relative to repo root) |
|---|---|
| 1 | `docs/global/architecture/adr/*.md` · `docs/global/architecture/SDD.md` · `docs/global/architecture/ARCHITECTURE.md` · `docs/global/architecture/cloud-design.md` · `docs/global/project/constitution.md` · `docs/global/design/DESIGN.md` |
| 2 | `docs/state/debug/**/*.md` · `docs/global/ops/postmortems/*.md` |
| 3 | `CLAUDE.md` *(only when the diff touches the Project Constraints section)* |
| 4 | `docs/milestones/*/research/*.md` · `docs/global/requirements/PRD.md` |
| 5 | `docs/milestones/*/RETROSPECTIVE.md` |
| 6 | `docs/milestones/*/phases/*/reviews/round-*/findings.md` · `docs/milestones/*/phases/*/reviews/REVIEW.md` |

**Deliberately excluded**, and why — these are the two that would blow the budget:

- `*-PLAN.md` — an execution decomposition, not a decision. Its real decisions surface in the SDD
  and ADRs, which are queued.
- `specs/*/spec.md` — a full artifact the vault must not mirror. What survives of it is captured
  once, at `RETROSPECTIVE.md`.

**Volume budget: 10–20 notes per milestone.** The table above lands ~17 on a four-phase
milestone. At 100/milestone, type 1 has degenerated into a copy of the journal and retrieval
quality is already gone — re-tighten the table rather than accepting the drift.

## Step → types needed

Used by `dk-session-start-orient.sh` to scope its ingest nudge. Most steps need **nothing**; only
steps that open a new line of reasoning benefit. Parse the command name out of `.dk-state`'s
`next:` line and look it up here. No match → emit no ingest nudge.

| Command prefix | Types |
|---|---|
| `arch:design`, `arch:gate` | 1, 3 |
| `plan:write`, `plan:review`, `plan:gate` | 1, 3 |
| `debug:run` | 2, 3 |
| `discover:research`, `discover:map` | 4 |
| `requirements:brainstorm`, `requirements:specify`, `requirements:market` | 4, 5 |
| `review:cycle`, `review:once` | 6 |
| `close:retro`, `close:milestone` | 1, 2, 3, 4, 5, 6 |
| anything else | *(none — stay silent)* |

## Note frontmatter the save nudge must request

```yaml
type: 1              # 1-6, from the table above
scope: v2/phase-03   # see the three shapes below
status: active       # or `superseded-by [[note-name]]`
```

**`scope` is derived from the artifact's path, not from `.dk-state`.** SITEMAP already encodes
lifetime in the path, and a note's scope is the lifetime of the thing it describes:

| Artifact path | `scope` |
|---|---|
| `docs/global/**`, `CLAUDE.md` | `project` |
| `docs/milestones/<M>/phases/<NN>-<slug>/**` | `<M>/phase-<NN>` |
| `docs/milestones/<M>/**` (not under `phases/`) | `<M>` |

Deriving it from `.dk-state` instead looks equivalent and is not: `phase` is set on entering
stage 5 and cleared at stage 12, so it is `-` throughout Part A and Part C — which is precisely
when types 1, 4 and 5 are written. Reading scope from state would stamp `project` on every
milestone retrospect, ADR and research note, erasing the milestone from the notes that exist to
carry cross-milestone memory. The path always knows; the state file only sometimes does.

`status` is not optional. A reversed decision still reading as `active` makes the vault a source
of confidently wrong instructions — worse than an empty vault.

## The statusline is opt-in, and not shipped by this plugin

A plugin's `settings.json` supports only the `agent` and `subagentStatusLine` keys — **a plugin
cannot declare the main `statusLine`.** So `dk-context.js --statusline` ships here but is not
wired here.

This is why `--monitor` has a transcript fallback rather than treating the bridge file as
required: until an operator opts in, the fallback *is* the path, and the monitor still works.
Wiring the statusline upgrades it from an estimate to the authoritative number, since
`context_window` reaches the statusLine command and nothing else.

`/dk:bootstrap:init` wires it: it copies `dk-context.js` + `lib/dk-common.js` into `.claude/hooks/`
and writes this into the scaffolded `.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/dk-context.js --statusline"
  }
}
```

The copy is deliberate. `${CLAUDE_PLUGIN_ROOT}` does not resolve outside plugin-scoped config, and
the plugin's install directory is replaced on every update — pointing a `statusLine` at it would go
stale silently. Re-run `bootstrap:init` after a plugin update to refresh the copy.

**Verify the path form on first run.** Whether a `statusLine` command resolves a project-relative
path has not been confirmed against a live session; if the bar comes up blank, switch to an absolute
path. This is a ten-second check that could not be made from inside the repo.

### Why the statusline is worth wiring, not just nice to have

Measured across 8 real sessions, the transcript reconstruction matched the authoritative number
**exactly** in 7. The eighth read 67% authoritative against 14% reconstructed: that session ran
`claude-opus-5` — the same model id as the 1M sessions — against a **200k** window.

The fraction has two halves, and only one is recoverable without a statusline:

| | Numerator (tokens used) | Denominator (window) |
|---|---|---|
| Transcript | **exact** | **absent** — no `context_window`, `total_tokens` or equivalent appears anywhere in the JSONL |
| Statusline | exact | `context_window.total_tokens` |

So the window can only be guessed, and guessing from the model id fails in the dangerous
direction — silent under-reporting at 68% used. `dk-context.js` therefore defaults its fallback
to the *smaller* window and revises upward only on evidence (observed tokens exceeding it), which
over-warns rather than under-warns. Wiring the statusline replaces the guess with the real value.

## Naming convention

`dk-<phase>-<trigger>-<action>.<ext>` — phase is `session` \| `pre` \| `post`; trigger is the
**semantic** event, not the raw matcher (`search`, not `glob-grep`; `merge`, not `bash`). Raw
matchers churn when tools are added; the thing being watched does not. Filenames sort into
lifecycle order.

`dk-context.js` is the one deliberate exception: it is dual-trigger (`statusLine` **and**
`PostToolUse`), so it is named by subject.

## Testing

No hook here can be exercised without a live session, so each ships a test that pipes a synthetic
payload to stdin and asserts stdout plus exit code. Every test must cover, at minimum:

1. No `.dk-state` present → no output, exit 0
2. Kill switch set → no output, exit 0
3. Malformed JSON on stdin → no output, exit 0
4. The happy path → expected `additionalContext`, exit 0
