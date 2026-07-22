---
name: specify
description: Create or update a feature specification from a natural language feature description — or interrogate a vague idea round-by-round until it becomes an executable spec. Resolves ambiguity and enforces EARS-format requirements as part of the same pass. Use when the user says "write a spec", "specify this feature", "create a feature specification", "turn this idea into a spec", "I want to build...", "clarify the spec", "resolve ambiguities", "de-risk the spec", or provides a feature description that needs to become a formal, testable specification before planning.
---

# Specify — Feature Description to Executable Specification

Turn what the user wants to build into a written specification that is precise enough for
someone unfamiliar with the codebase (or an AI agent) to plan and implement without
follow-up questions. The spec captures **WHAT** users need and **WHY** — never HOW to
implement it.

This skill covers the full arc from vague idea to unambiguous, gated spec: generate or
interrogate (below), then resolve remaining ambiguity as the final phase of the same pass
(the **Clarification Pass**). Both halves can also be invoked independently — "clarify the
spec" on an already-written spec re-enters at the Clarification Pass directly.

## File Locations

Specs live under the active milestone at `docs/milestones/<M>/specs/<NNN>-<slug>/spec.md`,
where `<M>` is the current milestone version, `<NNN>` a zero-padded feature number, and
`<slug>` the feature's short name. Each feature gets its own `<NNN>-<slug>/` subdirectory
under `docs/milestones/<M>/specs/` (see step 2 below). The output template is
`spec-template.md` in this skill's directory.

If the project has a constitution (see the `constitution` skill;
`docs/global/project/constitution.md`), load it for project principles and governance
constraints — the spec must not conflict with it.

## Two Lenses

Run every interview and every requirement pass through both perspectives — don't ask all
the PM questions, then all the Dev questions; weave them:

- **PM Hat**: user value, business goals, success metrics, priority
- **Dev Hat**: technical feasibility, security, performance, edge cases, error handling

## Before Drafting: Assess Scope

If the request describes multiple independent subsystems (e.g., "build a platform with chat,
file storage, billing, and analytics"), don't draft a single oversized spec for it. Flag this
immediately and help decompose into sub-projects — what are the independent pieces, how do they
relate, what order should they be built? Then run Mode A/B on the first sub-project only; each
sub-project gets its own spec (and its own spec → clarification → planning cycle). This check
belongs here, before step 1, not after a spec is already written — decomposition is far cheaper
before the interview than after.

## Choose an Entry Mode

- **Mode A — Direct generation**: The user gave a reasonably concrete feature
  description. Generate the spec directly (steps 1–8 below), using informed defaults and
  at most 3 targeted clarification questions.
- **Mode B — Interrogation (vague intent → executable spec)**: The request is a
  one-liner, an idea, or otherwise too vague to draft from ("make the app faster",
  "we need better onboarding"). Load `references/mode-b-interrogation.md` and run the
  five-phase interrogation first, then write the spec through Mode A steps 1–8.

When unsure, default to Mode A with clarification markers — do not over-interrogate a
description that is already specific.

Either mode ends by running the **Clarification Pass** — load
`references/clarification-pass.md` — before the spec is considered done.

## Reference Guide

Load these only when the corresponding path actually applies — don't pre-load them for a
simple, concrete spec that Mode A handles inline:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Mode B interrogation | `references/mode-b-interrogation.md` | Request is vague/one-line, needs round-by-round interrogation before drafting |
| Clarification Pass | `references/clarification-pass.md` | Always, once a spec draft exists — this is the final phase of every run, and the standalone entry point for "clarify the spec" |
| EARS syntax | `references/ears-syntax.md` | Writing a conditional functional requirement (When/While/Where + shall) |
| Multi-domain pre-discovery | `references/pre-discovery-subagents.md` | Feature spans 3+ system layers in an unfamiliar codebase, before Mode A step 7 or Mode B Phase 3 |

## Mode A: Direct Generation

Given the feature description, do this:

1. **Generate a concise short name** (2-4 words) for the feature:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Create the spec feature directory**:
   - Under `docs/milestones/<M>/specs/`, scan the existing `<NNN>-<slug>/` directories and
     pick the next available zero-padded 3-digit number `<NNN>`
   - Construct the directory name `<NNN>-<slug>` (e.g., `003-user-auth`)
   - Create `docs/milestones/<M>/specs/<NNN>-<slug>/` and copy `spec-template.md` (from this
     skill's directory) into it as `spec.md` — this is `SPEC_FILE`
   - Only create one feature per invocation

3. **Assigning US-xxx IDs (global allocation)**:
   - Glob every `spec.md` across all milestones (`docs/milestones/*/specs/*/spec.md`), not
     just this feature, and extract every `US-\d+` heading found.
   - Take the highest number found across ALL specs, and allocate the next sequential
     numbers to this feature's stories (e.g. if the highest existing is `US-014`, this
     feature's stories start at `US-015`).
   - If no existing specs have US-xxx headings yet, start at `US-001`.
   - **IDs are never renumbered or reused** — even if a story is later deleted, split, or
     reordered within its spec, its number is retired, not recycled. This keeps US-xxx a
     stable cross-spec key for roadmap/traceability tooling.
   - If the project uses a Theme→Pillar→US-xxx hierarchy, ask (or infer from context) which
     Pillar each story belongs to and fill the story's `**Pillar**:` field; otherwise omit it.

4. Load the spec template to understand required sections.

5. **IF EXISTS**: Load the project constitution for principles and governance constraints.

6. **For multi-domain features** (touches 3+ distinct system layers, unfamiliar codebase):
   consider front-loading technical context with parallel Task subagents before drafting —
   see `references/pre-discovery-subagents.md`. Skip for single-domain or well-understood
   features; this is an accelerant, not a requirement.

7. Follow this execution flow:
    1. Parse the user's feature description
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description (PM Hat + Dev Hat)
       Identify: actors, actions, data, constraints, security/error-handling implications
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section (Given/When/Then acceptance scenarios per story)
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable. Use EARS format for anything conditional —
       see `references/ears-syntax.md`. Plain `MUST` statements are fine for simple,
       unconditional requirements.
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Generate Non-Functional Requirements (if performance/security/reliability targets apply)
       Each NFR needs a real, testable target — not "should be fast"
    7. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    8. Identify Key Entities (if data involved)
    9. Fill the Error Handling table (one row per failure mode from Edge Cases)
    10. Return: SUCCESS (spec ready for the Clarification Pass)

8. Write the specification to `SPEC_FILE` using the template structure, replacing
   placeholders with concrete details derived from the feature description while
   preserving section order and headings.

### Specification Quality Validation

After writing the initial spec, validate it against quality criteria:

a. **Create Spec Quality Checklist**: Generate a checklist file at
   `docs/milestones/<M>/specs/<NNN>-<slug>/checklists/requirements.md` with these
   validation items:

   ```markdown
   # Specification Quality Checklist: [FEATURE NAME]

   **Purpose**: Validate specification completeness and quality before proceeding to planning
   **Created**: [DATE]
   **Feature**: [Link to spec.md]

   ## Content Quality

   - [ ] No implementation details (languages, frameworks, APIs)
   - [ ] Focused on user value and business needs
   - [ ] Written for non-technical stakeholders
   - [ ] All mandatory sections completed
   - [ ] Internal consistency: no sections contradict each other; requirements match the user
         scenarios they're derived from

   ## Requirement Completeness

   - [ ] No [NEEDS CLARIFICATION] markers remain
   - [ ] Requirements are testable and unambiguous
   - [ ] Conditional requirements use EARS format (When/While/Where + shall)
   - [ ] Success criteria are measurable
   - [ ] Success criteria are technology-agnostic (no implementation details)
   - [ ] All acceptance scenarios are defined (Given/When/Then)
   - [ ] Edge cases are identified with an Error Handling entry
   - [ ] Scope is clearly bounded
   - [ ] Dependencies and assumptions identified

   ## Feature Readiness

   - [ ] All functional requirements have clear acceptance criteria
   - [ ] User scenarios cover primary flows
   - [ ] Feature meets measurable outcomes defined in Success Criteria
   - [ ] No implementation details leak into specification

   ## Notes

   - Items marked incomplete require spec updates before clarification or planning
   ```

b. **Run Validation Check**: Review the spec against each checklist item:
   - For each item, determine if it passes or fails
   - Document specific issues found (quote relevant spec sections)

c. **Handle Validation Results**:

   - **If all items pass**: Mark checklist complete and report completion

   - **If items fail (excluding [NEEDS CLARIFICATION])**:
     1. List the failing items and specific issues
     2. Update the spec to address each issue
     3. Re-run validation until all items pass (max 3 iterations)
     4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

   - **If [NEEDS CLARIFICATION] markers remain**:
     1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
     2. **LIMIT CHECK**: If more than 3 markers exist, keep only the 3 most critical (by scope/security/UX impact) and make informed guesses for the rest
     3. For each clarification needed (max 3), present options to user in this format:

        ```markdown
        ## Question [N]: [Topic]

        **Context**: [Quote relevant spec section]

        **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]

        **Suggested Answers**:

        | Option | Answer | Implications |
        |--------|--------|--------------|
        | A      | [First suggested answer] | [What this means for the feature] |
        | B      | [Second suggested answer] | [What this means for the feature] |
        | C      | [Third suggested answer] | [What this means for the feature] |
        | Custom | Provide your own answer | [Explain how to provide custom input] |

        **Your choice**: _[Wait for user response]_
        ```

     4. Number questions sequentially (Q1, Q2, Q3 - max 3 total), present all together, wait for responses
     5. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
     6. Re-run validation after all clarifications are resolved

d. **Update Checklist**: After each validation iteration, update the checklist file with
   current pass/fail status

## Constraints

### MUST DO
- Use structured question tools (e.g. `AskUserQuestion`) for choices with predetermined options; open-ended only when choices cannot be predetermined
- Conduct a thorough interview/interrogation before writing the spec
- Use EARS format for conditional functional requirements
- Include non-functional requirements when performance/security/reliability targets apply
- Provide testable, Given/When/Then acceptance criteria
- Ask for clarification on ambiguous requirements rather than guessing silently

### MUST NOT DO
- Generate a spec without conducting the interview/interrogation
- Accept vague requirements ("make it fast") without pushing for a metric
- Skip security considerations or error handling
- **Produce an implementation TODO checklist or task breakdown.** That's HOW, not
  WHAT/WHY — it's `writing-plans`/`planner`'s job once this spec is approved. A spec that
  ships a task list is scope creep into planning territory, and it also means the plan
  never gets independently reviewed against the spec's actual requirements.

## Completion Report and User Approval Gate

Report completion to the user with:
- The feature directory path and spec file path
- Checklist results summary (structural quality checklist)
- Clarification Pass summary: questions asked & answered, sections touched, coverage
  summary (Resolved / Deferred / Clear / Outstanding by taxonomy category)

Then ask the user to review the written spec before proceeding:

> "Spec written to `<path>`. Please review it and let me know if you want any changes before
> we move on to [`spec-review-cpo`'s scope review / planning]."

**Wait for the user's response.** If they request changes, make them and re-run the relevant
validation (structural checklist and/or Clarification Pass). Only proceed to `spec-review-cpo`
or planning once the user approves — do not treat "spec written" as the same thing as "spec
approved."

## Done When

- [ ] Specification written to the spec file and validated against the structural quality checklist
- [ ] Functional requirements use EARS format where conditional; non-functional requirements have real targets
- [ ] Clarification Pass run (or explicitly skipped with rework-risk warning) and spec ambiguities integrated into the spec file
- [ ] Completion reported to user with feature directory, spec file path, checklist results, and clarification coverage summary
- [ ] User has explicitly approved the spec (not just been notified it was written) before handing off to `spec-review-cpo` or planning
