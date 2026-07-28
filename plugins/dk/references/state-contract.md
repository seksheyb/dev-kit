# The `dk` state contract

Read by `/dk:run` (the only writer) and `/dk:status` (read-only). No other command may touch these
files — guard 2 of `scripts/checks/pipeline-command-guards.sh` enforces it, which is what keeps all
65 step commands runnable cold, standalone and out of order.

Modelled on ADD-SDD's `.gwd-state` contract (`~/ADD-SDD-Initiator/project-bootstrap/
CLAUDE.md.template:110-145`).

## Three tiers, routed by access pattern

The split is not "more state is better." Each tier exists because it is read at a **different
frequency**, and putting them in one file makes the cheap reads expensive.

| What | Where | Read |
|---|---|---|
| Next action, loop position | `.dk-state` | **every resume** |
| Progress, "where are we" across stages | `docs/state/STATE.md` | stage/phase boundaries |
| Narrative — wave, gate and round history | `docs/state/journal/<NN>-<slug>.md` | **on demand only** |

The **journal is append-only and is never read on a normal resume.** Open it only when `next:`
points into it, or when a specific decision needs its history. That rule is the whole reason resume
stays cheap; ignoring it collapses the three tiers back into one slow file.

## `.dk-state` — the resume head

A **slim marker, not a journal.** Overwritten every step, never appended, and kept to **≤15 lines**.

```
stage: <0-15>            # last completed stage
mode: manual|auto|sleep
milestone: <id or ->
phase: <NN or ->         # set on entering stage 5, cleared at stage 12
round: <n or ->          # stage 10's review loop; the cap is 6 and a 7th must never open
verdict: <last command's verdict or ->
next: "<one-line imperative for the next step; may name a journal file to read>"
# optional flags, omit when default:
# graphify: off
# wiki: off
```

**These keys only.** Never add `note`, `findings`, `wave_progress`, `history`, or any narrative
key — that is what the journal is for. A `.dk-state` that grows past 15 lines has become a journal
and stopped doing its job.

`round` is a structured key rather than prose inside `next:` because stage 10's cap is a hard rule —
"never open a 7th round" — and a limit you must not exceed should not depend on parsing a sentence.

**The two flags are kill switches for the hook layer** (`../hooks/`), which is their only consumer.
`graphify: off` silences the graph hint and the post-merge refresh nudge; `wiki: off` silences the
vault ingest nudge and both ends of the wiki save queue. Omit them unless switching a capture layer
off — absent means on. Nothing else reads them, and no other flag key may be added here: a flag is
part of the closed key set, so it needs a consumer before it needs a name.

## `next:` is a pointer, not a payload

One line stating the next action. When history is needed to act on it, **name the journal file**
rather than inlining the history:

```
next: "review round 3 of 6 on branch feat/checkout — see journal/03-checkout.md §round-2"
```

On resume, `/dk:run` reads `next:` and acts on it. It does **not** re-derive position by walking
RUNBOOK.md — the deciding already happened when the line was written, and re-deriving a mid-loop
position from a linear spine is exactly where a resume goes wrong.

RUNBOOK.md still owns the *sequence*, and each command's `gate:` frontmatter still owns the
*decision*. `next:` records the outcome of applying those two, so it never becomes a third opinion:
if `next:` is missing or unparseable, fall back to locating `stage`/`phase` in RUNBOOK.md and
re-resolving the gate from frontmatter.

## Writing it

`/dk:run` rewrites `.dk-state` after **every** step, appends one line to the journal, and writes
`docs/state/STATE.md` only at stage and phase boundaries. In `--sleep` it writes all three at a
session boundary and then continues through it; in `--manual` and `--auto` it writes them and stops.

Driving by hand writes none of them. `/dk:status` reports their absence as normal, not as an error.
