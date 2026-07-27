# Asset-defect re-verification — 2026-07-27

Second, independent adversarial pass over every asset defect the audit (REPORT.md §1 skill-side
+ §4b) put on the roadmap. Eight parallel read-only agents, each instructed to REFUTE its
claims against the current files, quoting current line evidence. This file is the verdict of
record; where it disagrees with REPORT.md, this file wins.

**Outcome: 22 confirmed · 5 weakened · 1 refuted.** The fix list survives re-verification
almost intact; corrections below are folded into ROADMAP.md.

## Verdicts

| Defect (REPORT ref) | Verdict | What changed vs the audit |
|---|---|---|
| planner never loads PATTERNS/UI-SPEC/AI-SPEC (§4b-H1) | CONFIRMED | 0 hits across planner.md + 13 planning references + writing-plans. Loader at `planner.md:973-979`; second closed read-list at `:834`. |
| pattern-mapper false consumer claim (§4b-H2) | CONFIRMED, corrected | PATTERNS.md **does** have one real consumer: `plan-review-goal-backward/SKILL.md:44,:106`. Defect is a *mis-named* consumer, not a phantom artifact. Fix wording: point `:67` at the real consumer (and at planner once H1 ships). |
| pattern-mapper no empty-input guard (§4b-M) | CONFIRMED, aggravated | `:49`/`:57` admit inputs may be absent; write at `:151` unconditional — invents PATTERNS.md from nothing. |
| Parallel Execution Map format undefined (§3.5) | CONFIRMED | Owned at `planner.md:36-37`, absent from its own template `:414-497`; consumers (`gate-plan-review.md:34,:52`, `sprint-execution:39,:118`) score columns no file defines. |
| project-researcher parallel overwrite (§4b-H3) | CONFIRMED | `:536-541` three "Always" files, no axis assignment. Siblings (`market-researcher:3`, `advisor-researcher:16`) have the mechanism — copy it. |
| roadmapper never creates REQUIREMENTS.md (§4b-H4) | CONFIRMED, aggravated | All 10 mentions read/update-only; **`doc-synthesizer.md:19,:190` explicitly delegates creation to roadmapper** — the gap is pipeline-wide, no creator exists anywhere in plugins/. |
| roadmapper endorses Setup→Polish (D5) | CONFIRMED | `:226-234` under "Good Phase Patterns", no qualifier; contradicts `:85`, fails own gate `:257`. Secondary instance in the return template `:434-444`. |
| finishing-a-development-branch PR option (§4b-H5) | CONFIRMED, aggravated | Zero `gh` in the file; promised at `:74`,`:86`, body `:121-126` is push-only. Reachable unattended via `sprint-execution:198`. Working PR code exists in `ship:176` to crib. |
| devex-review no gate semantics (§4b-H6) | CONFIRMED | No threshold/verdict anywhere; sibling `plan-review-devex:240` has the exact vocabulary to copy. |
| devex-review may commit (§4b-M) | CONFIRMED, softer | `:208` "fix the biggest bottleneck" is imperative, but `:239-242` leans advisory. Fix is one line, model: `retro.md:39` "Read-only — this reports, it does not change code." |
| ship never forbids merge/deploy (§4b-M) | CONFIRMED fact, WEAKENED severity | The boundary exists but only in `land-and-deploy:10,:22`; ship never names it. Fix shrinks to one cross-link sentence in ship. |
| lane skills code-first vs TDD (D2) | CONFIRMED ×3 | python-pro `:32-33`, flutter-expert `:33-35`, django-expert `:32-35`; zero TDD language in any references chain. Aggravation: `sprint-execution:131-132` co-loads lane skill + TDD mandate into the same subagent — contradiction is internal to dev-kit, not just KICKOFF. |
| code-documenter must-ask (D6) | CONFIRMED | `:120` MUST DO / `:129` MUST NOT DO; no unattended branch anywhere. |
| codebase-mapper date input (D3) | CONFIRMED | `Today's date` convention exists nowhere but `:191`; 15 placeholders depend on it. Agent has Bash (`:5`) but `:191` forbids self-derivation — cheapest fix: allow `date` fallback. |
| design-consultation → design-html (D4) | CONFIRMED | `:463` unconditional suggestion straight after the two branch blocks `:436`/`:441`; design-html `:77-80` bounces unbound users back. |
| design-reviewer baseline bootstrap (§4b-M) | WEAKENED, gap real | "Unconditional" wrong — load is regression-mode-only (`:88`, mode parsed `:35`). Real shape is worse: **only regression mode writes the baseline** (`:210`), so the first regression run can never find one. Fix: treat-first-run-as-baseline branch. |
| ui-auditor Top-3 bias + needs_human_review (D8-adj/§3.2 pairing) | CONFIRMED, partially mitigated | Three-slot templates `:327`,`:426`,`:451` persist against `:36`; detailed findings unbounded, so bias is confined to the priority-fix section. `needs_human_review` exists only at `:117` and has **no consumer anywhere** — orphaned flag. |
| diagram no re-sync duty (§4b-M) | CONFIRMED | `:56` embed-instead-of framing; `:50` iteration loop re-renders SVG/PNG only, embedded fences never named as derived artifacts. |
| architecture-designer diagram pairing (§4b-M) | CONFIRMED, path fix | It is `skills/architecture-designer/SKILL.md` (not agents/). Inline fence only (`:82-92`); zero links between it and the diagram skill in either direction. |
| rag-architect re-opens stack (§4b-M) | CONFIRMED | One deference-shaped grep hit in 3,858 lines, and it's unrelated; `:191` makes DB selection a required deliverable. No AI-SPEC producer references it. |
| bugfix-wave preflight + misdiagnosis (§4b-M) | CONFIRMED, aggravated | No pre-dispatch git-state inspection (detach `:288` touches main tree only); `:559-562` prescribes a fix that cannot clear the leftover-worktree case. **New uncovered failure mode:** leftover same-name branch makes the subagent's `git checkout -b {branch}` (`:363-364`) fail outright, no edge case covers it. |
| qa skip-conditions real (D8 skill side) | CONFIRMED | `:251` verbatim + 2-min cap `:262` + upstream skip `:121`; unattended at `:122`. Guide-side promise was the wrong end — rewrite already handles it. |
| verify is phase-dir-oriented (D9 skill side) | CONFIRMED | Zero diff-grading mechanism in verify.md (9 lines) or verifier.md. Guide's "grades the working diff" stays fiction; rewrite handles it. |
| constitution no elicitation (§4b-M) | CONFIRMED, strengthened | Passive consumption only (`:37-40`); TODO-instead-of-ask edge cases `:90-93`. The step-0 pipeline design doc *assumes* a "principle interview" the skill doesn't implement. |
| brainstorming premise mode-locked (§4b-M) | CONFIRMED | Premise Challenge lives wholly inside YC mode (`:116`→`:215`); standard checklist `:32-43` has no premise item; downstream spec-review-cpo pass is conditional (`:102-103`). |
| plan-review default hardcoded (§4b-M) | CONFIRMED | `commands:5` + `workflow.mjs:64,:108-109` hardcoded array, no config read; per-lens self-exit gates blunt cost but aren't config. |
| sprint-execution done-claim evidence (§4b-M) | WEAKENED | Real mechanisms exist: `Tests:` handover field `:157`, TDD contract `:132`, no-handover-≠-done `:178`. Residual defect: `Tests:`/`Status: DONE` are self-reports with no orchestrator verification duty — the file imposes that duty only on `Merged` (`:180`,`:212`). Fix narrows to extending that duty. |
| **learn no autonomous append (§4b-M)** | **REFUTED** | `learn/SKILL.md:26` authorizes any workflow to append unattended; schema `:17`, non-user confidence bands `:21-22`; concretely implemented by `debugger.md:276-278,:421`. The cited `:95` governs only the `/learn add` command branch. **Drop from the fix list.** |
| sre-engineer SLO calibration (§4b-M) | WEAKENED | `SKILL.md:21` "Confirm SLO targets reflect user expectations before proceeding" is a blocking, bidirectional gate — claim's "nothing anywhere" is false. Survives only as: reference checklist `:216-221` is one-sided and no too-loose detector (unused-error-budget) exists. Downgrade to nice-to-have. |
| compliance-auditor disclosure clocks (§4b-M) | CONFIRMED | Topic label only (`:17`,`:24`); no discovery-start rule, no interim regime artifact; no rule anywhere in plugins/ names the trigger event. |
| incident-responder same absence (§4b-M) | WEAKENED | `:24` does mandate deadline tracking + early legal loop-in. Missing: discovery-start clause, and it sits in Recovery, not First response. Fix narrows to moving/adding one clause. |
| chaos-engineer generic seeding (§4b-M) | CONFIRMED | Surprise-scenario library `game-days.md:294ff` + architecture-derived analysis `SKILL.md:28`; zero incident-derived seeding rules. |
| test-master no Maestro (§4b-M) | CONFIRMED, strengthened | `grep -rni maestro` = 0 hits across skill + 10 references; yet `gate-automation.md:42` explicitly routes Maestro flow authoring to this skill, and all three mobile lane skills point at it. Load-bearing gap. |

## Corrections applied to ROADMAP.md

1. **M2: `learn` item removed** (refuted).
2. **M2: `sre-engineer` downgraded** to optional (one-sided checklist row only).
3. **M2: `incident-responder` narrowed** to a discovery-start clause in First response; compliance-auditor keeps the full fix.
4. **M2: `design-reviewer` reworded** — bootstrap branch: if no baseline exists, run full audit and write this run as the baseline.
5. **M2: `sprint-execution` narrowed** — extend the `Merged`-style verification duty to the `Tests:`/`Status:` handover fields.
6. **M1: `pattern-mapper` consumer fix reworded** — name `plan-review-goal-backward` (and planner, once its loader ingests PATTERNS.md).
7. **M2: `ship` fix shrunk** to a one-line cross-link to `land-and-deploy`.
8. **M1: `architecture-designer` path corrected** to `skills/`.
9. **M2: `bugfix-wave` fix expanded** — preflight must also cover leftover same-name track branches (`git checkout -b` failure), not just worktrees.
