# <Pillar Name>

<!--
One pillar of the story bank. Lives at docs/global/requirements/stories/<theme>/<pillar>.md.
Created and maintained by the `specify` skill. Register it in ../INDEX.md when you create it.

A pillar is a slice of user-facing capability, not a layer. "Sign-in" is a pillar; "the auth
service" is not. If you cannot finish the sentence "a user can now ___" with the pillar's name,
it is a layer and belongs inside one of the real pillars instead — the same test
@references/vertical-slice.md applies to phases, applied one level up.
-->

**Theme:** <theme>
**Phases that delivered against this pillar:** _(none yet)_

## Intent

_One paragraph: what a user can do because this pillar exists, and what they could not do before._

## Core stories

### US-xxx — <Brief title> (Priority: P1)

**As a** <role>
**I want** <capability>
**So that** <outcome>

**Acceptance criteria**

- [ ] <observable, testable condition>
- [ ] <observable, testable condition>

**Notes:** _constraints, prior art, or the reason a rejected alternative was rejected_

---

## Edge-case stories

_Stories that exist because of a failure mode, a limit, or a hostile input rather than because a
user asked for them. Kept separate so the core set stays readable — the split is presentational;
both carry real US-xxx IDs from the same global counter._

### US-xxx — <Brief title> (Priority: P3)

**As a** <role>
**I want** <capability>
**So that** <outcome>

**Acceptance criteria**

- [ ] <observable, testable condition>

---

## Out of scope

_Things a reader will reasonably expect to find here and will not, with the reason. This section
is what stops the same descoped idea being re-proposed every milestone; link the `BACKLOG.md`
entry if it was deferred rather than rejected._

- _(nothing yet)_
