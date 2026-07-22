# Stage 8–13 Asset Audit — Findings

Working document for the execution → security-gate span of the GWD pipeline audit
(`docs/gwd-pipeline-on-devkit.md`). Every Stage 8–13 asset was read in full and every
overlap/usage claim below was grep-verified. Findings are worked through one by one;
check off each as it is resolved (fixed or explicitly declined).

Status legend: `[ ]` open · `[x]` resolved · `[-]` declined/no-change.

---

## Stage 8 — Execute

### F1. `dispatching-parallel-agents` is claimed as a foundation but nothing builds on it — [x]

The pipeline doc says sprint-execution and bugfix-wave "build on" it; grep shows neither
SKILL.md references it (only the docs do). It is not dead, though — it is the *lightweight
ad-hoc* variant (parallel investigation/fixes mid-session, no plan file, no worktree
ceremony) that neither orchestrator covers: `sprint-execution` requires a plan,
`bugfix-wave` requires a bug list + worktrees/waves.

**Proposal:** keep it standalone, but make the relationship real and honest — reword the
pipeline doc ("the lightweight ad-hoc counterpart", not "the underlying technique they
build on") and add one-line cross-references in `sprint-execution` and `bugfix-wave`
pointing at it for the no-ceremony case (and vice versa). Net-zero.

Done. Also surfaced during the "why does this need to be a separate skill" discussion:
`dispatching-parallel-agents/SKILL.md` is byte-for-byte identical to the `superpowers`
plugin's skill of the same name — the 9th skill in dev-kit's superpowers fork, missing
from `ATTRIBUTION.md`'s list of 8. Added it to that line. Also caught and fixed the same
overstated "Built directly on `dispatching-parallel-agents`" claim in `bugfix-wave`'s
catalog entry (not just the pipeline doc) — and removed an equally-unverified
`using-git-worktrees` claim on that same line (`bugfix-wave/SKILL.md` doesn't reference
it either; that's an F2-shaped gap, left for when F2 is picked up).

### F2. `sprint-execution` doesn't reference `using-git-worktrees` — [x]

Step 1.4 asks for a worktree but never names the skill — its own worktree mechanics are
subagent-side (`isolation: "worktree"`), while using-git-worktrees governs the
orchestrator's own workspace. **Proposal:** one-line cross-ref in §1.

Done, with the premise pressure-tested first: is orchestrator-level isolation even needed
given most execution happens in track-subagent worktrees? Yes, narrower than track
isolation but real — §6 merges track branches into the integration branch and writes
state/roadmap files directly from the orchestrator's own workspace, outside any track
worktree. Wired as delegation, not a new requirement: `using-git-worktrees` already
detects existing isolation and no-ops if the orchestrator is already inside one (e.g.
dispatched by a higher-level pipeline), so this doesn't force worktree creation in the
common case. User flagged residual uncertainty about whether this is worth the
indirection at all — left as-is for now, open to revisiting.

Also found while fixing this: `using-git-worktrees`'s catalog Notes claimed `bugfix-wave`
"assumes this skill's worktree conventions (`.worktrees/` ownership)" — checked, and it
doesn't; `bugfix-wave` uses a different path (`.claude/worktrees/<id>`) and never
references the skill. Corrected the catalog claim to say so explicitly rather than
silently drop it; the underlying inconsistency (should `bugfix-wave` actually adopt the
`.worktrees/` convention, or is its own path intentional?) is unreconciled — a candidate
for a future pass, not fixed here.

### F3. `guard` vs `verification-before-completion`: no overlap — [-]

Safety guardrails vs evidence-before-claims. Both correctly wired elsewhere (`guard` ←
systematic-debugging's scope lock, and it references sprint-execution's reset exception;
`verification-before-completion` ← systematic-debugging). **No change.**

### F4. `fullstack-guardian` vs `secure-code-guardian` vs lanes: complementary, already gated — [-]

The conditional table already routes FG only when a feature spans frontend+backend (else
lane skills) and SCG only for auth/input/crypto; SCG is in FG's related-skills. Real
overlap is limited to FG's security checklist being a shallow version of SCG — acceptable
layering (breadth vs depth). **No change.**

---

## Stage 9 — Debug

### F5. `debug` → `debugger` ← `systematic-debugging` pairing is exemplary — [-]

The debugger explicitly declares systematic-debugging its "methodology home" and doesn't
restate it. This is the pattern Stage 13 should copy (see F15). **No change.**

### F6. Two parallel knowledge stores with no bridge — [ ]

`debugger` archives to its own `.planning/debug/knowledge-base.md` (keyword-matched by
future debug sessions); `learn` keeps `.claude/learnings.jsonl` (general insights, which
"any workflow may append to"). Different formats, different consumers — both legitimate —
but a debug session that uncovers a durable project convention/pitfall records it only in
the debug KB, invisible to every non-debug session.

**Proposal:** one line in debugger's `archive_session`: when the root cause reveals a
durable convention/pitfall (not a one-off bug), also append a `pitfall` entry to the
learn ledger.

### F7. Stage 9 stays a standalone stage — [-]

Not single-asset (4 assets), has its own command entry point, referenced as a conditional
gate. Folding into Stage 8 would renumber Stages 10–16 for zero simplification. **Keep.**

---

## Stage 10 — Adversarial review ↔ fix

### F8. Core loop is tightly wired and healthy — [-]

`review` → `code-review-gate` ↔ `bugfix-wave`, with `code-review-protocol` and `qa`:
findings.json/fixes.json contracts match end-to-end, engine registry shared,
code-review-protocol correctly delineates ad-hoc vs pipeline review. **No change.**

### F9. `design-reviewer` vs `ui-auditor`: real overlap — sharpen the split, don't merge — [ ]

`ui-auditor` is the *contract-conformance* gate (scores build vs Stage 6's `UI-SPEC.md`,
static-grep-first, works with no browser, read-only, closes the
ui-researcher→ui-checker→ui-auditor contract loop that `ui-researcher` already names);
`design-reviewer` is the *contract-free live designer audit + fixer* (browser-required,
UX laws, AI-slop, fix loop). They currently don't mention each other and both re-check
typography/spacing/color.

**Proposal:** add explicit division-of-labor lines to both (design-reviewer reads an
existing UI-REVIEW.md instead of re-litigating conformance; ui-auditor defers
subjective/live "feel" findings and all fixing to design-reviewer) plus a doc sentence
stating the split. Keep `accessibility-tester` separate — thin, but produces
WCAG-criterion-level compliance output neither of the others is scoped for.

### F10. Plan-time vs build-time mirror pairs are intentional — add cross-refs only — [ ]

`devex-review` vs `plan-review-devex`, and `design-reviewer` vs `plan-review-design`:
verified in the skill texts ("reviewing a PLAN — not a live site" vs "Not reviewing a
plan… TESTING it"). Same lens, two times, no duplicated execution. Only gap: no
cross-references. **Proposal:** one line each way.

---

## Stage 11 — Verify the goal

### F11. `converge` is dead code in this pipeline — retarget it — [x]

It hard-requires the Spec-Kit `spec.md`/`plan.md`/`tasks.md` triad and STOPs if any is
missing. Grep-verified: **nothing in dev-kit produces `plan.md` or `tasks.md`** —
`specify` writes `spec.md`, `planner`/`writing-plans` write `PLAN.md` with embedded
`<task>` blocks. Yet `constitution` and `analyze` both cite converge as a live SDD
counterpart. The Stage 7 audit retargeted `analyze` and explicitly punted converge.

**Proposal: retarget converge the same way** — read `spec.md` + the phase's `PLAN.md`(s),
append a `## Phase N: Convergence` section of new `<task>` blocks (append-only contract
preserved), and position it explicitly against `verifier`:

- `verifier` = the **verdict** gate: goal-backward truths, 4-level artifact/wiring
  checks, structured gaps → VERIFICATION.md. Uniquely catches stubs/hollow wiring.
- `converge` = the **remediation compiler**: exhaustive requirement-level sweep
  (FR/SC/AC + constitution MUST + `unrequested` scope-creep detection — none of which
  verifier does) that turns remaining work into executable tasks. Wire it to consume
  VERIFICATION.md gaps as input evidence when present.
- `integration-checker` = **cross-phase** wiring (verifier is within-phase) — genuinely
  distinct, keep; add a doc note that it is milestone-scoped (fires meaningfully once ≥2
  phases exist).
- `nyquist-auditor` = **test-gap filler** — see F13.

Also update its catalog entry + the `analyze`/`constitution` cross-notes.

### F12. `dependency-manager` is misplaced at Stage 11 — move to the security gate — [x]

A CVE/version/license sweep is not "did we build the goal" — it is the
security/compliance gate's business, and the catalog already notes its overlap with
`security-auditor`'s dependency fieldwork. **Proposal:** move it to the security stage
(and move the lane-routing note for `license-engineer` with it). Net-zero relocation,
mirrors the Stage 4→8 `design-handoff` move.

Done alongside F14 — landed at the security gate's final number (Stage 12, post-fold).
Catalog entry moved from the Engineer role to the Security/Compliance Reviewer role to
match. `license-engineer`'s lane-routing note moved with it.

### F13. `nyquist-auditor` has a wiring hole: nothing produces its expected input — [x]

Its gap vocabulary (`no_test_file` / `test_fails` / `no_automated_command`) is
per-requirement test coverage, but verifier's gaps are goal gaps (missing/stub artifacts
→ implementation fixes, not tests). The conditional table's "verifier/converge surfaced
validation gaps" doesn't match either agent's actual output.

**Proposal:** wire it — verifier's Requirements Coverage step (Step 6) and behavioral
spot-checks flag requirements with no automated verification in a short
`validation_gaps` list in VERIFICATION.md frontmatter, which the orchestrator hands to
nyquist-auditor as `<gaps>`. Fix the conditional-table wording accordingly.

---

## Stage 12 — Automation coverage

### F14. Fold Stage 12 into Stage 11 — [x]

Near-single-asset stage (`gate-automation`; test-master/playwright-expert are invoked
helpers), and it answers the same question as Stage 11 — "is the goal actually covered?"
— at the E2E layer. This also fixes the smeared test-ownership story into one clean
ladder: plan-time coverage judgment (`plan-review-eng`, S7) → inline TDD (S8) →
test-quality findings (`code-review-gate`, S10) → requirement-level gap tests
(`nyquist-auditor`) and user-flow E2E gaps (`gate-automation`) both at the verify stage.

Renumbering cost is low: stage numbers 12–16 live almost entirely in the pipeline doc
(28 spots; catalog/plugins/companion docs have none). Result: pipeline becomes
**Stage 0–15** (13→12 security, 14→13 document, 15→14 ship, 16→15 operate; lane routing
lines for playwright/Maestro/infra/product updated).

Done — renumbered as proposed. The "catalog/plugins/companion docs have none" claim
didn't fully hold: the F15/F16 session (done between this finding being logged and being
fixed) had added several Stage-13-numbered cross-references outside the pipeline doc
(`planner.md`, `security-auditor.md`, `sdd-review-cto/SKILL.md`, `cso/SKILL.md`,
`core-build-and-ship.md`) — all caught and renumbered to Stage 12 in this pass too.

---

## Stage 13 — Security & compliance gate

### F15. `security-auditor` duplicates `security-reviewer` nearly verbatim — pair them — [x]

The agent's `<audit_methodology>` block repeats the skill's workflow, tool list
(semgrep/gitleaks/npm audit/trivy), and even the identical FIND-001 SQL-injection
example, word for word.

**Proposal:** make them a skill+agent pair on the debugger↔systematic-debugging model —
security-auditor declares security-reviewer its methodology home for the general-audit
fieldwork pass, keeps only its unique job (threat-register verification by disposition,
SECURITY.md/structured returns), and drops the duplicated methodology/report-format
text. Net-zero, removes ~40 lines of drift-prone duplication.

### F16. `cso` vs `security-auditor`: intentional, but the doc overstates the linkage — [x]

The real chain is cso (Stage 2 design-time posture, writes `.security-reports/*.json`) →
**`planner`'s per-phase `<threat_model>`** (STRIDE, verified present in planner.md) →
security-auditor verifies those dispositions. Planner never reads cso's output, so "a
threat posture the later security-auditor will verify mitigations against" (Stage 2
text) is not literally true.

**Proposal:** one-line wiring in planner's security step ("consult the latest cso
posture report / SDD threat section, if present, when assigning dispositions") + correct
the Stage 2/13 doc wording to describe the actual chain. `penetration-tester` and
`compliance-auditor` are thin, distinct, properly gated — no change to them.

**Resolution went further than proposed.** Follow-up review found the deeper problem: `cso`'s
15 phases (stack detection, git-history secrets, dependency manifests, CI/CD configs, STRIDE
against detected components) all assume an existing checkout, but Stage 2 is the *first*
artifact of a greenfield milestone — there's no code yet for `cso` to find anything in. A
one-line wiring fix alone would have pointed `planner` at a report that's usually empty.
Instead `cso` was relocated: Stage 0 (full audit, gated on the entry path already having code
— Legacy or Continuing-milestone, never a first-milestone Greenfield entry) and Stage 13
(`--diff` mode, per phase — always has code by construction since Stage 13 runs after that
phase's own Execute stage). `planner`'s one-liner and the doc-wording fix both still landed,
now pointed at the corrected chain.

---

## Bookkeeping

### F17. Catalog README counts are stale + one dangling reference — [ ]

- README claims **97 items — 52 skills**; disk has **49 skills / 37 agents / 8 commands
  = 94** (catalog entry counts: 45 + 49 = 94, so only the README summary line and
  per-role Items column are wrong, plus the internally inconsistent "minus the 51 core
  skills" line in Part 2).
- One stale `feature-forge` reference survives in `core-discovery-and-design.md:59`
  (backlog-grooming notes).

Both predate this batch; fix in this batch's commits.

---

## Proposed edit list (worked one by one)

1. **F11** — retarget `converge` to spec.md + embedded-task PLAN.md; consume
   VERIFICATION.md gaps; catalog + `analyze`/`constitution` notes.
2. **F13** — `verifier` emits `validation_gaps` for nyquist; conditional-table fix.
3. **F15 + F16** — security-auditor methodology home = security-reviewer, dedupe;
   planner one-liner; Stage 2/13 doc wording.
4. **F14** — fold Stage 12 into Stage 11; renumber 13–16 → 12–15 throughout the
   pipeline doc.
5. **F12** — move `dependency-manager` (+ `license-engineer` lane note) to the security
   stage.
6. **F1, F2, F6, F9, F10** — cross-reference wiring: dispatching-parallel-agents ↔
   sprint-execution/bugfix-wave, sprint-execution → using-git-worktrees, design-reviewer
   ↔ ui-auditor, devex-review ↔ plan-review-devex, design-reviewer ↔ plan-review-design,
   debugger → learn.
7. **F17** — coverage appendix + catalog consistency for all of the above; fix README
   counts + stale feature-forge ref.

No asset removals — the 94-core count is preserved; everything is retargeting, wiring,
and stage reorganization.
