# Verifier — MVP Mode UAT Framing

> Loaded by the `verifier` agent only when the phase under verification has `**Mode:** mvp` in the roadmap. Reframes UAT generation from technical checks to user-flow walk-throughs.

## Core rule

**Show expected, ask if reality matches** — same philosophy as standard verification. The MVP-mode change is WHAT gets shown:

- **Standard verification:** "The API endpoint at /users/register returns 201 with the new user's ID." → user confirms.
- **MVP verification:** "Open the registration page. Fill in 'name', 'email', 'password'. Click Submit. You should see your dashboard with your name in the header." → user confirms.

The user-flow form mirrors what a real user does: open, fill, click, see. No HTTP verbs, no JSON shapes, no error codes.

## When this framing applies

The framing fires when:
- The phase under verification has `**Mode:** mvp` in the roadmap (read the phase's roadmap entry directly — no separate query step).
- AND the phase has a user-story-formatted goal (set by the `mvp-phase` workflow): "As a [user role], I want to [capability], so that [outcome]."

If the phase has `**Mode:** mvp` but the goal is NOT in user-story format, the verifier surfaces this as a discrepancy and asks the user to run the `mvp-phase` workflow to reformat the goal — same pattern the planner agent follows under MVP mode.

## Generated UAT script structure under MVP mode

The UAT script generated under MVP mode has THREE sections, in this exact order:

### 1. User-flow walk-through (always first, always required)

Derive ordered steps from the phase's user-story goal:

1. The first step opens the entry point ("Open the app", "Navigate to /register", "Run the CLI's setup command").
2. Each subsequent step is one user action: fill, click, type, observe.
3. The final step asserts the user-visible outcome from the `[outcome]` clause of the user story.

Format each step as: "**Step N: [action]** — Expected: [what the user should see]". The user responds with one of:
- `yes` / `y` / `next` / empty → step passes
- Anything else → step is logged as an issue, and the script halts (do not proceed to step N+1 with a broken N).

If ALL user-flow steps pass, advance to section 2. If any step fails, the verdict is FAIL — do not run technical checks.

### 2. Technical checks (only if section 1 passes)

After the user flow passes, run the technical checks that would normally run in non-MVP mode:
- API endpoint schema verification (if the phase shipped APIs)
- Error state behavior (4xx, 5xx codes; invalid input handling)
- Edge cases (empty data, large data, concurrent requests if applicable)
- Cross-browser / cross-runtime checks (if applicable)

These are the same checks the standard verification process would run without MVP mode — just deferred until the user flow proves the slice actually works for a user.

### 3. Coverage check (always last, always required)

Verify that the user-story `[outcome]` clause is observably true in the codebase:
- If the outcome is "I can access my dashboard", verify a dashboard route exists and renders for an authenticated user.
- If the outcome is "I can bulk-import contacts", verify the import path produces persisted records.

Coverage is a goal-backward check: "did this phase deliver what its user story promised?" — sourced from the verifier's existing goal-backward methodology, narrowed to the user story.

## Anti-patterns to reject under MVP mode

- **Lead with technical checks.** "Step 1: GET /api/users/me returns 200." Reject. The user does not see API endpoints. Reorder so a user action comes first.
- **Schema-as-feature.** "User has a `name` field on the User model." Reject. The user does not see database fields. Express the same check as a user-visible outcome ("the user's name appears in the dashboard header").
- **Skip user flow because the test passed.** The unit test passing in CI is not evidence that the user flow works. The user-flow walk-through is mandatory under MVP mode even when all unit tests are green.

## Compatibility with standard verification

The "show expected, ask if reality matches" model is preserved. The user still types `yes` / `next` / empty to advance. The human-verification format is unchanged. Only the WHAT changes — under MVP mode, the "expected" is a user-visible outcome rather than a technical assertion.

## Output: PHASE/VERIFICATION.md changes under MVP mode

Under MVP mode, the report adds a top-level "User Flow Coverage" section that maps each step of the user story to evidence in the codebase:

```markdown
## User Flow Coverage

User story: «As a new user, I want to register and log in, so that I can access my dashboard.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Register | Form at /register accepts name/email/password | src/app/register/page.tsx:12 (form component) | ✓ |
| Submit | Persists user, redirects to /dashboard | src/api/register/route.ts:34 (db.insert + redirect) | ✓ |
| Dashboard | Header shows the signed-in user's name | src/app/dashboard/page.tsx:8 (reads session, renders name) | ✓ |
```

Standard technical-check sections (Required Artifacts, Key Link Verification, Anti-Patterns Found, etc.) follow below this table — only when User Flow Coverage is complete.
