---
name: constitution
description: Create or update the project constitution — the durable memory of project principles that every later SDD phase (specify, analyze, converge) checks against. Use when the user says "create a constitution", "project principles", "update the constitution", "set project ground rules", "governance rules", or when starting spec-driven development on a project that has no constitution yet.
---

# Constitution — Project Principles Memory

You are creating or amending the project constitution: a short, versioned document of
non-negotiable principles that governs every downstream artifact (specs, plans, tasks,
implementation). Later SDD phases treat the constitution as **non-negotiable authority** —
`analyze` flags any conflict with a MUST principle as CRITICAL, and `converge` emits
constitution-violation remediation tasks first. Precision here pays off everywhere else.

## File Location

The constitution lives at `docs/global/project/constitution.md` — the single canonical
path every downstream skill reads from. Don't invent a variant location.

If no constitution file exists yet, initialize it from `constitution-template.md` in this
skill's directory, then fill it in — sourcing the values as the next section describes.

## Where Values Come From: Inference vs. Elicitation

Decide this once, before filling anything. The answer changes the whole run.

**Step A — is there already a constitution?**
If `docs/global/project/constitution.md` exists and is not an unfilled template, you are
**amending**. Source values from the change the user asked for plus the existing file, then go
straight to the Outline below. No interview.

If it exists but is still an unfilled template (its `[ALL_CAPS_IDENTIFIER]` tokens are largely
unreplaced), treat it as not existing and continue to Step B.

**Step B — measure how much signal the project offers.**
Initialize the file from `constitution-template.md` if it does not already exist, then survey
the repo for material a principle can honestly be inferred from. Count a source only when it carries substantive
content, not a stub:

- `README.md` — goals, non-goals, or stated engineering values beyond a title line
- `docs/` — architecture notes, ADRs, existing `docs/global/project/*` artifacts, prior specs
- `CONTRIBUTING.md`, PR/issue templates — review and quality rules the project already states
- A source tree with real modules (not bare scaffolding) — layering, testing discipline, and
  documentation style are all readable from working code
- Test directories, CI workflows, lint/format/type-check configs — the gates already enforced
- The conversation so far — anything the user has already said about how they work

**Two or more substantive sources → brownfield.** Infer the principles from them exactly as
Outline step 2 says, and spend at most three targeted questions confirming what you inferred.
Do **not** run the elicitation pass — a project that can be read should be read, not
interviewed.

**Fewer than two → greenfield.** There is nothing to infer from. Run the Greenfield Elicitation
Pass below rather than inventing principles for a project you know nothing about.

## Greenfield Elicitation Pass

Runs only in the greenfield case identified above.

**Derive the question set from the template, not from the table below.** Read
`constitution-template.md` first and enumerate the `[ALL_CAPS_IDENTIFIER]` slots it actually
contains. Every question must map to a slot that exists; every slot needing a human decision
must be covered by exactly one question. The table records what the template currently yields —
if the template has changed, the template wins and the table is stale.

This is a bounded pass, not an open-ended interview:

- **Maximum 7 questions**, asked **one at a time**. Never present the whole set at once.
- Each question is either a multiple-choice selection (2–5 mutually exclusive options) or a
  short answer of five words or fewer. Use structured question tools (e.g. `AskUserQuestion`)
  wherever the options can be predetermined.
- For each multiple-choice question, give your **recommended** option first with one or two
  sentences of reasoning, then the options. The user may pick an option, accept the
  recommendation, or answer in their own words.
- Skip any question already answered by the conversation or by a signal source, and record
  where that value came from instead.
- Stop as soon as every slot is covered. Fewer questions is better.

| Template slot | What to ask |
|---|---|
| `[PROJECT_NAME]` | Usually inferable from the repo or directory name — infer and confirm in passing rather than spending a question. |
| `[PRINCIPLE_N_NAME]` / `[PRINCIPLE_N_DESCRIPTION]` | **One question for the whole principle set**, never one per principle: which engineering rules are non-negotiable here? Offer a recommended starter set (test-first, simplicity/YAGNI, observability, contract/versioning stability, security-by-default) and let the user select, drop, or add. Spend a second question only if what "non-negotiable" means in practice is left ambiguous. |
| `[SECTION_2_NAME]` / `[SECTION_2_CONTENT]` | What hard constraints does the project operate under — stack, compliance, performance, deployment targets? |
| `### Documentation Standard` / `[DOCUMENTATION_STANDARD]` | **Always ask this.** Which docstring format per language, what must carry documentation, and which paths are excluded? Offer the language-conventional defaults (Google for Python, TSDoc/JSDoc for TypeScript/JavaScript) as options. The `code-documenter` skill reads this named slot to resolve its format; leaving it unasked silently downgrades that skill to sampling the codebase. |
| `[SECTION_3_NAME]` / `[SECTION_3_CONTENT]` | What does the development workflow require — review, testing gates, deployment approval? |
| `[GOVERNANCE_RULES]` | How are amendments made and compliance verified? Propose the standard rule set and ask for confirmation rather than asking open-ended. |
| `[RATIFICATION_DATE]` | Today, unless the user says the principles were adopted earlier. Confirm in passing; do not spend a question on it. |

`[CONSTITUTION_VERSION]` and `[LAST_AMENDED_DATE]` are never asked: a first, fully filled
constitution is `1.0.0`, ratified and last amended today.

### When no human is available to answer

This skill can be reached from an unattended path — a pipeline step, a `sprint-execution` or
`bugfix-wave` dispatch, or any run with no interactive turn to spend. **Do not stall, and do
not invent principles to fill the silence.** Take this path when a question goes unanswered,
when the run has no interactive channel, or when the caller said to run unattended:

1. Stop asking. Do not retry the question, and do not substitute a plausible-sounding default
   for a slot only a human can decide.
2. Leave every unanswered slot's `[ALL_CAPS_IDENTIFIER]` token **in place, unreplaced**. This is
   exactly the "intentionally retained template slot" Outline step 3 permits, and an unreplaced
   token is the machine-readable signal that the slot is undecided.
3. Fill only what you can source honestly: `[PROJECT_NAME]` from the repo, the dates,
   `[CONSTITUTION_VERSION]` as `0.1.0` (a constitution with deferred slots is not ratified at
   `1.0.0`), and any slot a signal source genuinely answers.
4. Write the file anyway. Record every deferred slot in the Sync Impact Report (Outline step 5)
   under Follow-up TODOs, one line per slot, using the same `TODO(<FIELD_NAME>)` convention as
   the Edge Cases section — e.g.
   `TODO(DOCUMENTATION_STANDARD): deferred — no human available to decide; ask before this
   slot is treated as binding.` The justification is required, not optional.
5. State it in the final summary: which slots are deferred, and that the constitution is
   **partially unfilled** until they are answered.

This degrades safely by design. Downstream skills already treat a missing, unfilled, or
partially unfilled constitution as **not fatal**: `analyze` and `converge` skip their
constitution passes and note it, `specify` loads it only if present, and `code-documenter`
treats an unreplaced `[DOCUMENTATION_STANDARD]` as silent and falls through to sampling the
codebase. A deferred slot degrades gracefully; a fabricated principle does not — `analyze` and
`converge` will enforce it as CRITICAL on the strength of nothing.

Whichever path ran — amendment, inference, elicitation, or deferral — the consistency
propagation checklist (Outline step 4) and the Sync Impact Report (step 5) still run in full.

## Outline

The constitution file is a TEMPLATE containing placeholder tokens in square brackets
(e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete
values, (b) fill the template precisely, and (c) propagate any amendments across dependent
artifacts.

Follow this execution flow:

1. Load the existing constitution file.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the
   template. If a number is specified, respect that - follow the general template. You will
   update the doc accordingly.

2. Collect/derive values for placeholders:
   - If user input (conversation) supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if
     embedded) — see "Where Values Come From" above for how much signal counts as enough to
     infer from.
   - If there is too little signal to infer from (greenfield), run the **Greenfield Elicitation
     Pass** above instead of inventing values. If no human is available to answer it, take that
     section's "When no human is available" deferral path — never stall, never fabricate.
   - For governance dates: `RATIFICATION_DATE` is the original adoption date (if unknown ask or mark TODO), `LAST_AMENDED_DATE` is today if changes are made, otherwise keep previous.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - If version bump type ambiguous, propose reasoning before finalizing.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Consistency propagation checklist (convert prior checklist into active validations):
   - If the project keeps a plan template, ensure any "Constitution Check" or rules align with updated principles.
   - If the project keeps a spec template, check scope/requirements alignment—update if constitution adds/removes mandatory sections or constraints.
   - If the project keeps a tasks template, ensure task categorization reflects new or removed principle-driven task types (e.g., observability, versioning, testing discipline).
   - Read the sibling SDD skills in this kit (`specify` — which includes the clarification pass — `analyze`, `converge`) or any equivalent workflow docs installed in the project to verify no outdated references remain when generic guidance is required.
   - Read any runtime guidance docs (e.g., `README.md`, `docs/global/project/quickstart.md`, or agent-specific guidance files if present). Update references to principles changed.

5. Produce a Sync Impact Report (prepend as an HTML comment at top of the constitution file after update):
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred.

6. Validation before final output:
   - No remaining **unexplained** bracket tokens. A token deliberately deferred by the
     "When no human is available to answer" path is explained — it carries a `TODO(...)` line
     in the Sync Impact Report — and so passes this check. Only tokens left behind with no
     recorded justification are failures.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).

7. Write the completed constitution back to the constitution file (overwrite).

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

## Formatting & Style Requirements

- Use Markdown headings exactly as in the template (do not demote/promote levels).
- Wrap long rationale lines to keep readability (<100 chars ideally) but do not hard enforce with awkward breaks.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

## Edge Cases

- If the user supplies partial updates (e.g., only one principle revision), still perform
  validation and version decision steps.
- If critical info missing (e.g., ratification date truly unknown), insert
  `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.
- Do not create a new template; always operate on the project's constitution file
  (initializing it from `constitution-template.md` only when it does not exist).
- If the project is greenfield **and** no human is available to answer the elicitation pass,
  do not stall and do not fabricate principles — write the file with the undecided slots left
  as unreplaced tokens and a `TODO(<FIELD_NAME>)` line each in the Sync Impact Report. See
  "When no human is available to answer" above for the full path.

## Handoff

After the constitution is written, suggest the next phase: run the `specify` skill to turn
a feature description into a specification that the constitution now governs.
