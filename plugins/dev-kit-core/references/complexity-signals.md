# Complexity Signals — Canonical Vocabulary

> The signal names, model axis, and effort axis that every plan-producing skill/agent
> emits and every gate/executor consumes. **Planners emit signals; gates and executors
> consume them.** Before this doc existed, `gate-plan-review.md`'s Signal Honesty check
> and `bugfix-wave`'s model/effort tables each carried their own inline enums with
> nothing upstream producing matching output — this is the shared contract that closes
> that gap. Referenced by `agents/planner.md`, `skills/writing-plans/SKILL.md`,
> `skills/sprint-execution/SKILL.md`, `skills/bugfix-wave/SKILL.md`, and
> `agents/gate-plan-review.md`.

## Signal Block

Every task/track that declares complexity emits these fields:

| Signal | Type | Meaning |
|---|---|---|
| `files` | list of paths | **Complete** file list the task/track touches — including files it will **CREATE**, not just files it edits. An incomplete list (omitting created files) is a Signal Honesty violation. |
| `novelty` | `none` \| `low` \| `high` | How much of this work is unprecedented in the codebase. `none` = copying an established pattern; `high` = greenfield design with no local precedent. |
| `logic` | `low` \| `medium` \| `high` | Depth of conditional/algorithmic reasoning required. `low` = straight-line code; `high` = multi-branch logic, state machines, concurrency. |
| `ambiguity` | `low` \| `medium` \| `high` | How much judgment is required to resolve underspecified requirements. `low` = the task spec is fully literal; `high` = the implementer must make real design calls. |
| `tests` | `none` \| `existing` \| `new` | Test surface this task affects. `new` = the task must author new test cases, not just satisfy existing ones. |

A track/plan is honest about its signals when the `files` list matches what its task
descriptions actually create or touch, and the enum values are plausible for the
described work — e.g. greenfield architecture work declaring `novelty: none` is
implausible and should be flagged (see `gate-plan-review.md`'s Signal Honesty check).

## Model Axis

Derived from the signals above — pick by task nature:

| Model | When to use |
|-------|-------------|
| `haiku` | Pure mechanical: config edits, copy changes, string replacements, type stubs. Low on every signal. |
| `sonnet` | Standard feature work: wiring existing patterns, API/UI implementation, predictable scope. The default when signals are middling. |
| `opus` | Moderate-to-high complexity: multi-file refactors, non-trivial logic, real ambiguity to resolve, or high novelty. |

Use `opus` for anything with cross-cutting concerns or genuinely ambiguous requirements,
regardless of file count. Use `haiku` only when every signal is at its floor. Default to
`sonnet` when unsure.

## Effort Axis

Derived independently from the signals — pick by required reasoning depth:

| Level | When to use |
|-------|-------------|
| `low` | Execute literally. Trivial fix, no judgment calls — `ambiguity: low` and `logic: low`. |
| `medium` | Standard quality. Minor judgment on details — the default when signals are middling. |
| `high` | Think carefully, surface edge cases, prefer correctness — security/data-loss risk, cross-cutting scope, or `ambiguity: high`. |

Model and effort are independent axes: a mechanical-but-risky task can be `haiku`/`high`
just as easily as an ambiguous-but-safe task can be `opus`/`medium`. Pick each axis on
its own signals, then combine.

## Track-Level Aggregation

When multiple tasks are grouped into a track (sprint-execution, bugfix-wave), the
track's declared model/effort is the **highest** of any task/bug in it — one `opus`/`high`
item pulls the whole track up. Track-level `files` is the deduplicated union of every
task's `files` list.

## Consumers

- **`gate-plan-review.md`** — step 0 sanity-checks declared `Model`/`Effort` against
  these signals (deterministic scorer if installed, manual fallback otherwise); the
  Signal Honesty review check flags implausible or incomplete signal blocks as HIGH.
- **`sprint-execution` §3** — a plan's declared signals/model/effort are authoritative;
  the "least powerful model that can handle the role" heuristic is the fallback only
  when a plan doesn't declare signals.
- **`bugfix-wave` §1.2** — uses these exact axes to classify each bug/finding; a
  `findings.json` input that already carries signals is authoritative over re-deriving
  them from the bug description.
