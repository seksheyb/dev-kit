# step02-sdd-review-cto
step 2 — architecture review · KICKOFF lines 214-225 · assets: sdd-review-cto

Source: `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md` lines 214-225
Asset: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/sdd-review-cto/SKILL.md`
(no `references/` chain — the skill is a single file)
Verdicts: `.../kickoff-audit/verdicts/sdd-review-cto.json` (9 claims: 8 confirmed, 1 refuted;
2 of the confirmed are classed load-bearing-parameter and therefore stay)

## Current (verbatim)
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

## Trimmed
```text
Use the sdd-review-cto skill to review docs/global/architecture/SDD.md and its ADR bank under
docs/global/architecture/adr/.
```

Lines 212 (`**The architecture gate — the only architecture/technical-strategy gate in the
pipeline:**`) and 227 (`An UNSOUND verdict means stop and fix the SDD — do not proceed to step
3.`) are outside the block and are **kept unchanged** — the audit refuted claim 1 and classed
claim 8 load-bearing. See Risk for the one adjacent sentence (line 228) that the audit did
confirm redundant.

## What was cut, and which skill sentence covers it
- `for technical soundness, ADR quality (alternatives and trade-offs actually recorded),
  innovation-token spend, scalability posture, tech-debt trajectory, and evolution path`
  → sdd-review-cto/SKILL.md:6-8 "design time — before roadmapping and planning — for technical
  soundness, ADR quality, technology-selection wisdom, scalability posture, technical-debt
  trajectory, and evolution path." (verdict claim 3, CONFIRMED, high). Each dimension also has
  its own methodology section: ADR Quality Review at SKILL.md:124-140 — whose bullets
  **Alternatives** (131-132) and **Trade-offs** (133) are exactly the parenthetical gloss —
  innovation tokens at SKILL.md:75-76 and 151-152, scalability at 109-111, tech-debt trajectory
  at 120-122, evolution path at 102-103 and 92-93.
- `Classify findings BLOCKER / MAJOR / MINOR — a BLOCKER forces the REVISE verdict and a MAJOR
  forces SOUND-WITH-CHANGES, so the severity is what drives the verdict, not a separate
  judgment.` → SKILL.md:193-196 "Findings carry severity: **BLOCKER** (… — verdict REVISE),
  **MAJOR** (real ADR/technology/scalability gap, fixable in the SDD — SOUND-WITH-CHANGES),
  **MINOR** (polish, documentation, deferred)." (claim 4, CONFIRMED, high). The skill fixes both
  the three severity names and the severity→verdict mapping the prompt re-derives.
- `Then commit to a posture and append a locked **Architecture Decision Record** with a LOCK
  line to the SDD's ## CTO Review section — the same shape as step 1's CPO Review.`
  → SKILL.md:51 "Pick one posture and commit to it. Do not drift."; SKILL.md:162-164 "Write this
  as an `## CTO Review` section appended to `docs/global/architecture/SDD.md` (append-in-place,
  never overwrite existing SDD content — same pattern `spec-review-cpo` uses on the spec)"; the
  Architecture Decision Record template itself at SKILL.md:166-184, including the LOCK line at
  181-183. (claim 5, CONFIRMED, high.)
- `Defer security depth to what docs/milestones/<M>/reports/security/ already holds rather than
  running a fresh pass.` → SKILL.md:41-43 "Check `docs/milestones/<M>/reports/security/` for the
  latest report if one exists, note security *architecture* concerns as findings, and defer the
  depth to `cso`'s next scheduled run — do not re-run a threat model here." (claim 6, CONFIRMED,
  medium). Same path, same `<M>` placeholder notation, same deferral, same do-not-re-run rule —
  and the skill's version is the stronger one (it defers to `cso`'s next scheduled run and
  treats the existing report as optional, where the KICKOFF wording implies a report exists).
- `Do not review any phase plan; that is step 7's job against a different artifact.`
  → SKILL.md:44-47 "**Per-phase plan quality is `plan-review-eng`'s job (Stage 7), not this
  lens's.** … Assess the architecture, not any one plan's tasks (no plan exists yet)."
  (claim 7, CONFIRMED, medium). Verified the referent matches: KICKOFF.md:482 is
  `## 7. Plan the phase`, so "step 7" and the skill's "Stage 7" are the same position.

Not cut, despite a CONFIRMED verdict:
- The two artifact paths (`docs/global/architecture/SDD.md`, `docs/global/architecture/adr/`)
  were confirmed redundant at **low** severity by claim 2 (they are hard-coded at SKILL.md:5 and
  SKILL.md:19-20). Kept anyway: they are the "which artifact to feed in" parameter the bar
  protects, the verdict itself notes they are "the natural way to name the artifact under review
  in a standalone guide," and the paths agree exactly between guide and skill so there is no
  drift risk in keeping them.

## Parameters preserved
- **Invocation**: `Use the sdd-review-cto skill` — the skill name, unchanged.
- **Input artifact 1**: `docs/global/architecture/SDD.md` (the SDD under review).
- **Input artifact 2**: `docs/global/architecture/adr/` (the ADR bank, named as such so a
  reader knows the bank is in scope alongside the SDD).
- **Action verb**: `review` — pins the skill to its review mode rather than a design pass.
- **Gate / ordering constraint (line 227, kept verbatim, outside the block)**: `An UNSOUND
  verdict means stop and fix the SDD — do not proceed to step 3.` This is the only place the
  gate is phrased as an operator instruction and the only place the KICKOFF step binding
  (step 3 = `## 3. Research & roadmap`, KICKOFF.md:250) appears; the skill's SKILL.md:197-199
  states it passively ("the design should not proceed to roadmap") and conditions it on a
  BLOCKER finding rather than on the UNSOUND verdict. Verdict claim 8 classes it
  load-bearing-parameter.
- **Block label (line 212, kept verbatim, outside the block)**: `**The architecture gate — the
  only architecture/technical-strategy gate in the pipeline:**` — refuted (claim 1). It is not
  prompt body, it is the operator-facing heading of the code block, and its cross-step scope
  claim is something the skill cannot assert.
- **Placeholders**: none survive in the block. `<M>` disappears with the security-deferral
  sentence, which is correct — the skill carries the identical `docs/milestones/<M>/reports/
  security/` path with the same placeholder notation (SKILL.md:41), so it was never an operator
  substitution.
- **Mode selections**: none in the block. Posture (SOUNDNESS HOLD / SIMPLIFY / RE-ARCHITECT /
  DE-RISK) is chosen by the skill from its own context-dependent defaults (SKILL.md:66-69), not
  by the operator, so nothing was lost.
- **Conditionality**: none. Step 2 is unconditional (unlike step 4's "only if this project has
  UI"), and the trim introduces no condition.
- **Parallelism**: none stated in the block, none removed.

## Risk
An operator loses nothing executable. The trimmed prompt names the skill and the two artifacts;
everything else it used to say is re-asserted by the skill at load time — the review dimensions,
the BLOCKER/MAJOR/MINOR severity vocabulary and its verdict mapping, the posture commitment, the
`## CTO Review` append target, the full Architecture Decision Record template with its LOCK line,
the security deferral to `cso`, and the plan-review exclusion. Because the skill's Required
Outputs section is a literal template, the output shape is identical whether or not the prompt
describes it.

Two things a reader loses, both non-executable and both acceptable:

1. **Preview.** The prompt no longer previews what the review will cover. The block's label
   (line 212) and the gate sentence (line 227) still frame the step, and the SDD's `## CTO
   Review` section is self-describing once written.
2. **The "same shape as step 1's CPO Review" cross-reference.** This is the one judgment call
   in the trim: verdict claim 5 notes this fragment alone carries guide-only information (KICKOFF
   step numbering, which the skill does not use). I dropped it because the referent is fully
   recoverable — SKILL.md:163-164 says "same pattern `spec-review-cpo` uses on the spec," and
   KICKOFF step 1 (`## 1. Requirements & product framing`, KICKOFF.md:128) is the
   `spec-review-cpo` step — and because it drives no behavior: the CTO template is written out
   in full in the skill, so nothing depends on the operator recognizing the analogy. If a
   reviewer disagrees, restoring it costs one clause but drags the redundant output-format
   sentence back with it, since the analogy is meaningless without naming what has "the same
   shape."

One adjacent cut is available but **out of range** and not applied here: line 228, `Once this
locks, nothing downstream re-litigates the architecture.` Verdict claim 9 confirms it
(SKILL.md:181-183 emits the identical guarantee into the SDD on every run, and states it more
completely — the KICKOFF version drops the skill's explicit escape hatch "unless the user
explicitly reopens this review" and the drift-is-a-finding clause). It sits on the same line as
the load-bearing step-3 gate sentence, so cutting it means editing line 227-228 as a unit:
keep `An UNSOUND verdict means stop and fix the SDD — do not proceed to step 3.` and delete the
following sentence. Flagged for the assembler rather than done here.
