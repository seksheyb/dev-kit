# Feature Specification: [FEATURE NAME]

**Feature Directory**: `docs/milestones/<M>/specs/<NNN>-<slug>/`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "[the user's original feature description]"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value. Each story is a
  vertical slice, not a horizontal layer: implementing one story end-to-end must deliver
  working, demonstrable value on its own.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently

  Each story carries a globally unique US-xxx ID (see "Assigning US-xxx IDs" in
  skills/specify/SKILL.md) — allocated by scanning every existing spec for the highest
  number in use, never renumbered or reused even if a story is later deleted or reordered.
  The optional Pillar field names the parent pillar/theme this story serves, for projects
  using a Theme→Pillar→US-xxx hierarchy; omit it for flat, single-spec projects.
-->

### US-001 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Pillar**: [optional — parent pillar/theme this story serves; omit if not using a hierarchy]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### US-002 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Pillar**: [optional — parent pillar/theme this story serves; omit if not using a hierarchy]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### US-003 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Pillar**: [optional — parent pillar/theme this story serves; omit if not using a hierarchy]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority and the next allocated US-xxx ID]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

### Error Handling

<!--
  ACTION REQUIRED: One row per failure mode identified above. What the user SEES, not
  backend/implementation behavior.
-->

| Scenario | System Response |
|---|---|
| [e.g., "network request times out"] | [e.g., "show retry option with cached data if available"] |
| [e.g., "duplicate submission"] | [e.g., "reject silently, show existing result"] |

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

Plain `MUST` statements are fine for simple, unconditional requirements. For any
requirement that branches on a trigger or state, use EARS format (see
`references/ears-syntax.md`) — it's the difference between "System MUST validate input"
(validate how? when?) and "When the form is submitted, the system shall reject input
that fails the field-level validation rules" (testable as written).

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: When [trigger], the system shall [action] — EARS form for conditional behavior

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Non-Functional Requirements *(include when performance, security, or reliability targets are part of "done")*

<!--
  ACTION REQUIRED: Only include requirements with a real, testable target. "Should be
  fast" is not a requirement — "returns results in under 1 second at 100 concurrent
  users" is. If a target genuinely isn't known yet, mark it [NEEDS CLARIFICATION] rather
  than inventing a number.
-->

- **NFR-001**: [Performance, e.g., "95% of searches return results in under 1 second"]
- **NFR-002**: [Security, e.g., "All write endpoints require an authenticated session"]
- **NFR-003**: [Reliability, e.g., "Data export survives a mid-request connection drop without corrupting the file"]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Assumption about scope boundaries, e.g., "Mobile support is out of scope for v1"]
- [Assumption about data/environment, e.g., "Existing authentication system will be reused"]
- [Dependency on existing system/service, e.g., "Requires access to the existing user profile API"]
