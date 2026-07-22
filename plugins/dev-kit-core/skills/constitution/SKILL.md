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
skill's directory, then fill it in.

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
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if embedded).
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
   - No remaining unexplained bracket tokens.
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

## Handoff

After the constitution is written, suggest the next phase: run the `specify` skill to turn
a feature description into a specification that the constitution now governs.
