# sdd-review-cto

- **kind**: skill
- **file**: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/sdd-review-cto/SKILL.md`
- **file_lines**: 199
- **has_references**: no
- **complexity**: medium
- **invocation_count**: 1
- **invoked by steps**: 02

---

## Invocation 1 — step 02 (Architecture & tech stack), block 1, lines 214-225

### verbatim_text

```text
Use the sdd-review-cto skill to review docs/global/architecture/SDD.md and its ADR bank under
docs/global/architecture/adr/ for technical soundness, ADR quality (alternatives and trade-offs
actually recorded), innovation-token spend, scalability posture, tech-debt trajectory, and
evolution path. Classify findings BLOCKER / MAJOR / MINOR — a BLOCKER forces the REVISE verdict
and a MAJOR forces SOUND-WITH-CHANGES, so the severity is what drives the verdict, not a
separate judgment. Then commit to a posture and append a locked **Architecture Decision
Record** with a LOCK line to the SDD's ## CTO Review section — the same shape as step 1's CPO
Review. Defer security depth to what
docs/milestones/<M>/reports/security/ already holds rather than running a fresh pass. Do not
review any phase plan; that is step 7's job against a different artifact.
```

### surrounding_prose

Preceded (line 212) by the bold framing: '**The architecture gate — the only architecture/technical-strategy gate in the pipeline:**'. Followed (lines 227-228) by: 'An UNSOUND verdict means stop and fix the SDD — do not proceed to step 3. Once this locks, nothing downstream re-litigates the architecture.' This establishes a hard stop-and-fix gate condition on the UNSOUND verdict, and states finality (no downstream re-litigation) once locked. Then a new bold instruction (line 230) begins the next block: '**Now enable your lanes.** The SDD says which stack you are on; turn on only those plugins:'

---
