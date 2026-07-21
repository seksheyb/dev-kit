---
name: specify
description: Create or update a feature specification from a natural language feature description — or interrogate a vague idea round-by-round until it becomes an executable spec. Use when the user says "write a spec", "specify this feature", "create a feature specification", "turn this idea into a spec", "I want to build...", or provides a feature description that needs to become a formal, testable specification before planning.
---

# Specify — Feature Description to Executable Specification

Turn what the user wants to build into a written specification that is precise enough for
someone unfamiliar with the codebase (or an AI agent) to plan and implement without
follow-up questions. The spec captures **WHAT** users need and **WHY** — never HOW to
implement it.

## File Locations

Specs live in the project's docs/requirements directory (configurable). By default use
`docs/specs/`; if the project already keeps requirements elsewhere, follow the existing
convention or ask the user once and stick to it. Each feature gets its own subdirectory
(see step 2 below). The output template is `spec-template.md` in this skill's directory.

If the project has a constitution (see the `constitution` skill; default
`docs/constitution.md`), load it for project principles and governance constraints —
the spec must not conflict with it.

## Choose an Entry Mode

- **Mode A — Direct generation**: The user gave a reasonably concrete feature
  description. Generate the spec directly (steps 1–7 below), using informed defaults and
  at most 3 targeted clarification questions.
- **Mode B — Interrogation (vague intent → executable spec)**: The request is a
  one-liner, an idea, or otherwise too vague to draft from ("make the app faster",
  "we need better onboarding"). Run the five-phase interrogation first (see
  "Mode B: Interrogation" below), then write the spec through the same steps 1–7.

When unsure, default to Mode A with clarification markers — do not over-interrogate a
description that is already specific.

## Mode A: Direct Generation

Given the feature description, do this:

1. **Generate a concise short name** (2-4 words) for the feature:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Create the spec feature directory**:
   - Scan existing directories in the specs directory and pick the next available 3-digit
     number `NNN` (or use a `YYYYMMDD-HHMMSS` timestamp prefix if the project prefers it)
   - Construct the directory name: `<prefix>-<short-name>` (e.g., `003-user-auth`)
   - Create the directory and copy `spec-template.md` (from this skill's directory) into it
     as `spec.md` — this is `SPEC_FILE`
   - Only create one feature per invocation

3. **Assigning US-xxx IDs (global allocation)**:
   - Glob every `spec.md` under the specs directory (all feature subdirectories, not just
     this one) and extract every `US-\d+` heading found.
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

6. Follow this execution flow:
    1. Parse the user's feature description
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

7. Write the specification to `SPEC_FILE` using the template structure, replacing
   placeholders with concrete details derived from the feature description while
   preserving section order and headings.

### Specification Quality Validation

After writing the initial spec, validate it against quality criteria:

a. **Create Spec Quality Checklist**: Generate a checklist file at
   `<feature-directory>/checklists/requirements.md` with these validation items:

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

   ## Requirement Completeness

   - [ ] No [NEEDS CLARIFICATION] markers remain
   - [ ] Requirements are testable and unambiguous
   - [ ] Success criteria are measurable
   - [ ] Success criteria are technology-agnostic (no implementation details)
   - [ ] All acceptance scenarios are defined
   - [ ] Edge cases are identified
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

     4. **CRITICAL - Table Formatting**: Ensure markdown tables are properly formatted:
        - Use consistent spacing with pipes aligned
        - Each cell should have spaces around content: `| Content |` not `|Content|`
        - Header separator must have at least 3 dashes: `|--------|`
     5. Number questions sequentially (Q1, Q2, Q3 - max 3 total)
     6. Present all questions together before waiting for responses
     7. Wait for user to respond with their choices for all questions (e.g., "Q1: A, Q2: Custom - [details], Q3: B")
     8. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
     9. Re-run validation after all clarifications are resolved

d. **Update Checklist**: After each validation iteration, update the checklist file with
   current pass/fail status

## Mode B: Interrogation (vague intent → executable spec)

Act as a **principal engineer who refuses to let ambiguous work into the backlog**.
Interrogate the user's request — round by round — until you could mass-produce the
solution. You are friendly but relentless. Ambiguity is a bug and you will find it. Push
back on scope creep ("That's a separate issue — let's finish this one") and premature
solutions ("Before we talk about *how*, let's lock down *what* and *why*"). Think in
failure modes: what happens when the input is empty, null, enormous, duplicated, called
by the wrong role, or called twice? Never guess — if you don't know something about the
codebase, say so and ask, or go read the code. Quantify everything: "several files" is
not acceptable — find the exact count; "improves performance" is not acceptable — state
the metric and target.

**HARD GATE:** Do NOT produce a spec after the first message. Always start with Phase 1.
Do NOT propose implementation. The user's initial request is the input to Phase 1 —
begin immediately, do not ask them to repeat themselves.

Run the phases STRICTLY in order — do not skip or combine them:

### How to Ask Questions

- **3-5 questions per round, max.** Prioritize highest-ambiguity first.
- **Number every question.** Don't bury them in paragraphs.
- **End every message with your questions.** Last thing the user reads.
- **Call out assumptions explicitly.** "I'm assuming this only affects the admin
  role — is that right?"
- **Reference specific code when you can.** Don't ask "does this touch the
  database?" — look at the code and ask "this needs a new column on `orders` —
  or is a separate table better?"
- **Verify current state before proposing changes.** Check the code, cite what
  you found with file paths. Don't assume from memory.

### Phase 1: Understand the "Why"

Ask until you can crisply answer all five:

1. **Who** is affected? (end user role, automated system, internal team, all three?
   "Just me, solo dev" is a fine answer; don't dwell on this for solo cases.)
2. **What** is the current behavior? (what IS happening — verified, not assumed)
3. **What** should the behavior be instead?
4. **Why now?** (blocking other work? costing money? correctness bug? compliance risk?)
5. **How will we know it's done?** (observable, measurable outcome — not vibes)

Do NOT proceed until all five are answered without hand-waving.

### Phase 2: Scope and Boundaries

Ask until you can answer:

1. **What is explicitly out of scope?** Lock this early — it prevents creep later.
2. **What existing systems does this touch?** Files, tables, services, endpoints.
3. **Are there ordering constraints?** Must A happen before B?
4. **What's the smallest version that delivers the value?** Always find the MVP cut.
5. **What are the failure modes and rollback options?** What breaks if shipped wrong?

Do NOT proceed until scope is locked.

### Phase 3: Technical Interrogation (HARD requirement: read code first)

**Mandatory:** Before asking ANY Phase 3 question, read at least one piece of evidence
from the codebase via search or file reads. Do NOT skip. Do NOT ask "what file should I
look at?" first — find it yourself.

Mapping the user's request to evidence:

- **Concrete file/symbol mentioned** (e.g., "the dashboard is slow", "auth.ts fails"):
  search for the symbol, read the file, cite `path:line` in your first question.
- **Project-level prompt** (e.g., "rethink our auth strategy", "we need rate limiting"):
  read the project structure — `package.json`/`go.mod`/`Cargo.toml`, the relevant
  top-level directory, any existing `docs/<topic>.md`. Cite what you found, then ask
  your Phase 3 questions against THAT evidence.

If you genuinely cannot find any related evidence (truly novel greenfield), say so
explicitly: "I searched for X, Y, Z and found nothing. Treating this as a greenfield
feature." — then proceed.

Then ask about whichever categories apply (skip ones that clearly don't):

- **Data model** — new tables, columns, migrations, indexes
- **API** — new endpoints, modified responses, backwards compatibility
- **Background processing** — new jobs, queue changes, idempotency, failure handling
- **UI** — new pages, modified components, state management
- **Infrastructure** — deployment changes, secrets, cost impact
- **Testing** — how to test at each layer, regression risk

Don't ask questions you can answer by reading the code. Read first, then ask the
questions whose answers aren't in the code.

### Phase 4: Draft Review

Present a full draft of the spec content and ask: **"Does this accurately capture what
you want? What did I get wrong?"** Iterate until the user confirms.

### Phase 5: Write the Spec

With the interrogation answers locked, write the specification through Mode A steps 1–7
(short name, feature directory, template fill, quality checklist). The interrogation
answers become the user scenarios, requirements, success criteria, out-of-scope
declarations, and assumptions — expressed in the template's user-focused,
implementation-free language.

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT embed checklists inside the spec itself — the quality checklist is a separate file.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: Use project-appropriate patterns (REST/GraphQL for web services, function calls for libraries, CLI args for tools, etc.)

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)

## Completion Report

Report completion to the user with:
- The feature directory path
- The spec file path
- Checklist results summary
- Readiness for the next phase: run the `clarify` skill to resolve remaining ambiguity,
  or proceed to planning

## Done When

- [ ] Specification written to the spec file and validated against quality checklist
- [ ] Completion reported to user with feature directory, spec file path, and checklist results
