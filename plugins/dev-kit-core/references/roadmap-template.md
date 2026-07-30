# Roadmap Template

Template for `docs/milestones/<M>/ROADMAP.md`.

## Initial Roadmap (v1.0 Greenfield)

```markdown
# Roadmap: [Project Name]

## Overview

[One paragraph describing the journey from start to finish]

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: [Name]** - [One-line description]
- [ ] **Phase 2: [Name]** - [One-line description]
- [ ] **Phase 3: [Name]** - [One-line description]
- [ ] **Phase 4: [Name]** - [One-line description]

## Phase Details

### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-01, REQ-02, REQ-03]  <!-- brackets optional, parser handles both formats -->
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans, e.g., "3 plans" or "TBD"]

Plans:
- [ ] 01-01: [Brief description of first plan]
- [ ] 01-02: [Brief description of second plan]
- [ ] 01-03: [Brief description of third plan]

### Phase 2: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 1
**Requirements**: [REQ-04, REQ-05]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 02-01: [Brief description]
- [ ] 02-02: [Brief description]

### Phase 2.1: Critical Fix (INSERTED)
**Goal**: [Urgent work inserted between phases]
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. [What the fix achieves]
**Plans**: 1 plan

Plans:
- [ ] 02.1-01: [Description]

### Phase 3: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 2
**Requirements**: [REQ-06, REQ-07, REQ-08]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 03-01: [Brief description]
- [ ] 03-02: [Brief description]

### Phase 4: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 3
**Requirements**: [REQ-09, REQ-10]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 04-01: [Brief description]

## Progress

**Execution Order:**
Phases execute in numeric order: 2 → 2.1 → 2.2 → 3 → 3.1 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. [Name] | 0/3 | Not started | - |
| 2. [Name] | 0/2 | Not started | - |
| 3. [Name] | 0/2 | Not started | - |
| 4. [Name] | 0/1 | Not started | - |
```

<guidelines>
**Initial planning (v1.0):**
- Phase count depends on granularity setting (coarse: 3-5, standard: 5-8, fine: 8-12)
- Each phase delivers something coherent
- Phases can have 1+ plans (split if >3 tasks or multiple subsystems)
- Plans use naming: {phase}-{plan}-PLAN.md (e.g., 01-02-PLAN.md)
- No time estimates (this isn't enterprise PM)
- Progress table updated by execute workflow
- Plan count can be "TBD" initially, refined during planning

**Success criteria:**
- 2-5 observable behaviors per phase (from user's perspective)
- Cross-checked against requirements during roadmap creation
- Flow downstream to `must_haves` in plan-phase
- Verified by verify-phase after execution
- Format: "User can [action]" or "[Thing] works/exists"

**After milestones ship:**
- Each milestone keeps its own `ROADMAP.md` under `docs/milestones/<M>/` — nothing to
  collapse or merge into a prior file
- Starting a new milestone means creating a new `docs/milestones/<new-M>/ROADMAP.md`,
  scoped to that milestone's phases only
- Phase numbering restarts at 01 per milestone (paths are already namespaced by `<M>`,
  so there's no collision risk and no reason to keep counting up)
- US-xxx IDs (when the source specs use the Theme→Pillar→US-xxx hierarchy) never restart
  across milestones either — a new milestone's stories continue numbering from the
  highest US-xxx used anywhere in the project, per `skills/specify/SKILL.md`.
</guidelines>

<status_values>
- `Not started` - Haven't begun
- `In progress` - Currently working
- `Complete` - Done (add completion date)
- `Deferred` - Pushed to later (with reason)
</status_values>

## New Milestone Roadmap (After v1.0 Ships)

Each milestone owns its own `ROADMAP.md` at `docs/milestones/<M>/ROADMAP.md`. v1.0's
roadmap stays put at `docs/milestones/v1/ROADMAP.md`, untouched and unarchived. Starting
v1.1 means creating a brand-new file at `docs/milestones/v1.1/ROADMAP.md` that covers only
v1.1's phases — it does not repeat or collapse v1.0's:

```markdown
# Roadmap: [Project Name] — v1.1 [Name]

## Overview

[One paragraph: what this milestone delivers, building on the prior milestone]

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Numbering restarts at 1 for this milestone — see Notes below.

- [ ] **Phase 1: [Name]** - [One-line description]
- [ ] **Phase 2: [Name]** - [One-line description]

## Phase Details

### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: [REQ-01, REQ-02]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 01-01: [Brief description]

### Phase 2: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase 1
**Requirements**: [REQ-03, REQ-04]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
**Plans**: [Number of plans]

Plans:
- [ ] 02-01: [Brief description]
- [ ] 02-02: [Brief description]

[... remaining phases for this milestone ...]

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. [Name] | 0/1 | Not started | - |
| 2. [Name] | 0/2 | Not started | - |
```

**Notes:**
- Phase numbering restarts at 01 for each new milestone. Paths are already namespaced by
  `<M>` (`docs/milestones/<M>/phases/<NN>-<slug>/`), so there's no collision risk, and each
  milestone's roadmap reads cleanly on its own instead of accumulating dozens of phases.
- Cross-milestone history lives in the milestone directories themselves, not in this file —
  the prior milestone's phases, plans, and progress stay exactly where they were, at its own
  `docs/milestones/<prior-M>/ROADMAP.md`. Nothing gets copied forward or collapsed.
- `REQUIREMENTS.md` and `RETROSPECTIVE.md` are likewise one-per-milestone, living alongside
  `ROADMAP.md` under `docs/milestones/<M>/`.
- US-xxx IDs (when specs use the Theme→Pillar→US-xxx hierarchy) are the one thing that keeps
  climbing across milestones — see the guidelines above.
