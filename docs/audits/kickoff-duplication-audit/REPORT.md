# KICKOFF.md redundancy audit — final report

**Subject:** `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md` (1,396 lines, 98 prompt blocks, 797 lines of prompt-block body)
**Assets audited:** 109 skills/agents/commands, 153 invocations across 16 steps
**Adjudicated claims:** 538 — 498 confirmed, 40 refuted
**Excluded by user instruction:** one skill, omitted everywhere including from invocation counts and pattern rosters.

Everything below is a CONFIRMED finding. Refuted claims appear only as the false-positive rate in §6.

---

## 1. Dangerous findings — where the guide actively misleads its operator

11 confirmed: 10 contradictions, 1 stale drift. Ranked by what breaks.

There are **no unresolved assets**: every asset KICKOFF invokes resolved to a file on disk (`MANIFEST.json` → `"unresolved": []`), and the lane-skill roster check passed 22/22. The guide does not invoke anything that is missing. That whole class of stale drift is clean.

### D1 — The planner is told to paste code the plan format forbids (step 7, HIGH stakes)

- **KICKOFF.md:486-488** — "Read PHASE/PATTERNS.md and cite its per-file analog and code excerpts in each task's action section"
- **Skill** — `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/writing-plans/SKILL.md:108` — `<action>[… Do NOT paste fenced code blocks here; code excerpts belong in referenced source files or an <interfaces> block.]</action>`
- **What breaks:** `agents/pattern-mapper.md:184-217` shows PATTERNS.md's "Pattern Assignments" are literally ```` ```typescript ```` fenced blocks. So "cite its code excerpts in the action section" instructs the planner to paste exactly what its own action template prohibits. The planner either violates the format or silently drops the pattern mapping — and step 5's entire output is the thing at stake. Fix direction is already written into both ends: `agents/pattern-mapper.md:72` says action sections *reference* the analog file and excerpts, and `:75` gives the form ("Copy auth pattern from `src/controllers/users.ts` lines 12-25"). Resolved in the rewrite (§3.5).

### D2 — Four lane skills are ordered test-first while their own workflows are code-first (step 8)

Three separate confirmed contradictions, same shape, same blast radius.

- **KICKOFF.md:564-570** — "## 8. Build it, test-first … execute PHASE/`<NN>`-`<MM>`-PLAN.md under the test-driven-development skill — write the failing tests first, then implement to green" (reinforced at line 889 for the convergence re-run)
- `plugins/dev-kit-backend/skills/python-pro/SKILL.md:32` — "3. **Implement** — Write Pythonic code with full type hints … 4. **Test** — Create comprehensive pytest suite"
- `plugins/dev-kit-mobile/skills/flutter-expert/SKILL.md:33` — "3. **Widgets** — Build reusable, const-optimized components; run `flutter test` after each feature"
- `plugins/dev-kit-backend/skills/django-expert/SKILL.md:35` — "6. **Test** — Django TestCase, APITestCase" (testing is step 6 of 6, after models, views, endpoints and auth)
- **What breaks:** these are named lane skills a track subagent loads *directly alongside* `test-driven-development` (KICKOFF.md:607). The implementer holds two numbered workflows that order the same two activities oppositely. Verified by grep across each skill's full `references/` chain: none contains any TDD/red-green/test-first language to reconcile with. The skill wins by being the more specific, more procedural document — so the pipeline's headline guarantee ("test-first") is unenforced in exactly the tracks that most need it.

### D3 — codebase-mapper is told the focus area is its only input; it hard-requires a second (step 5)

- **KICKOFF.md:364** — "name the focus area in each dispatch, it is the only input they take"
- `plugins/dev-kit-core/agents/codebase-mapper.md:191` — "Replace `[YYYY-MM-DD]` with the date provided in your prompt (the `Today's date:` line). NEVER guess or infer the date — always use the exact date from the prompt."
- **What breaks:** the agent forbids inferring the date and the guide never tells the operator to pass one. Repo-wide grep for `Today's date` returns codebase-mapper.md:191 as the *only* hit anywhere — there is no dispatch convention compensating. Every codebase-mapper dispatch built from this guide is missing a required input, and the agent's own rule leaves it nowhere to go.

### D4 — design-consultation steers unbound users into a skill that refuses them (step 4)

- **KICKOFF.md:310-313** — "Stop there in that case: do NOT go on to design-html, which refuses to run unbound … Only if a system was already bound, continue to design-html."
- `plugins/dev-kit-core/skills/design-consultation/SKILL.md:463` — "After shipping, suggest: \"Want to see this design system as a working page? Run design-html.\""
- **What breaks:** the skill's Phase 6 closer recommends design-html unconditionally, even though the skill branches on `claude_design_system_id` at `:436` and `:441` and therefore knows which path it took. `skills/design-html/SKILL.md:77-80` hard-refuses unbound ("Stop and tell the user to run `design-consultation` first … do not proceed unbound"). The guide is right and the skill is wrong; an operator following the skill's own closing suggestion hits a dead end. **The KICKOFF text must stay; the skill needs the gate.**

### D5 — roadmapper bans a phase template its own "Good Phase Patterns" section endorses (step 3)

- **KICKOFF.md:276-277** — "and never a Setup → Core → Features → Polish template"
- `plugins/dev-kit-core/agents/roadmapper.md:228` — under a heading titled **Good Phase Patterns**: "Phase 1: Setup (project scaffolding, CI/CD) / Phase 2: Auth / Phase 3: Core Content / Phase 4: Social / Phase 5: Polish (performance, edge cases)"
- **What breaks:** the agent's own philosophy line (`:85`) calls that sequence bad, and its foundation-exception (`:263-266`) only excuses "Phase 1: Setup". "Phase 5: Polish" unblocks nothing and fails the agent's own acceptance test at `:257`. The agent contains a worked example of the anti-pattern under an approving heading — a model reading it will reproduce it.

### D6 — code-documenter is told to infer a docstring format it is forbidden to infer (step 14)

- **KICKOFF.md:1200-1202** — "docstrings on every function and class this milestone added or changed, in this project's existing convention (Google/NumPy/Sphinx for Python, JSDoc/TSDoc for JS/TS)"
- `plugins/dev-kit-core/skills/code-documenter/SKILL.md:120` — "Ask for format preference before starting" (restated as both a MUST DO and a MUST NOT DO)
- **What breaks:** step 14 is unattended. There is no human turn for the skill to ask into, so it either stalls or violates its own MUST NOT. **The guide text cannot be dropped — the skill must be amended to permit convention-based inference.**

### D7 — phase-researcher's dispatch payload is incomplete by construction (step 5)

- **KICKOFF.md:380-382** — "Give it the phase number and name, the phase description/goal, this phase's requirement IDs, the constraints, and PHASE/RESEARCH.md as its output path."
- `plugins/dev-kit-core/agents/phase-researcher.md:591` — "`commit_docs` comes from the orchestrator's dispatch prompt, not a file (default `true` if not supplied)."
- **What breaks:** the guide presents a closed list of inputs; the agent expects a superset (`commit_docs`, `nyquist_validation`). Grep of the whole of KICKOFF.md for either name returns zero hits. The agent silently takes defaults the operator never chose — including committing docs.

### D8 — QA is promised to write a regression test per fix; it routinely will not (step 10)

- **KICKOFF.md:787-788** — "it fixes critical, high and medium findings in source with atomic commits and a regression test per fix, then re-verifies"
- `plugins/dev-kit-core/agents/qa.md:251` — "Skip if: not \"verified\", OR purely visual/CSS with no JS behavior, OR no test framework exists."
- **What breaks:** Phase 8e.5 skips the regression test for visual/CSS findings (one of the agent's own scoring categories at `:205`), reverted/best-effort fixes, projects with no framework, and any test costing over two minutes. The guide states an unqualified promise; an operator reading a missing test as a defect will chase a non-bug. Removed in the rewrite (§3.4).

### D9 — STALE DRIFT: `verify` bare-mode is described as grading the working diff. It does not. (step 11)

- **KICKOFF.md:823-825** — "Bare, this command defaults to \"the current change's stated goal\" and grades the working diff"
- `plugins/dev-kit-core/commands/verify.md:5` — "Parse `$ARGUMENTS` as the goal, plan, or acceptance criteria to verify against (default: the current change's stated goal)."
- **What breaks:** "grades the working diff" describes a mechanism that exists nowhere in the chain. The verifier is phase-directory-oriented end to end: canonical PHASE dir at `agents/verifier.md:16`, PLAN/SUMMARY/roadmap loaded at `:84`, Step 0 keyed off `PHASE_DIR/VERIFICATION.md` at `:67`. The operator instruction that follows (pass the goal explicitly) is still correct, but the stated reason for it is fiction — the exact shape of drift that survives edits because the conclusion still looks right.

---

## 2. Duplication patterns, ranked by KICKOFF line volume

236 confirmed redundant-restatement claims cover **481 KICKOFF lines** — 437 inside prompt blocks, 44 outside. Pattern line counts overlap slightly where claim ranges intersect; 481 is the deduplicated union.

| # | Pattern | KICKOFF lines | Instances | Assets | Steps |
|---|---|---|---|---|---|
| 1 | **methodology-reteach** | **243** | 110 | 47 | all 16 |
| 2 | **output-contract-restatement** | **88** | 35 | 29 | 15 |
| 3 | **invocation-boilerplate** | **82** | 27 | 26 | 13 |
| 4 | **upstream-input-restatement** | **61** | 26 | 20 | 10 |
| 5 | **ownership-boundary-restatement** | **54** | 19 | 14 | 9 |
| 6 | **mechanical-git-recipe** | **25** | 11 | 5 | 4 |
| 7 | **severity-verdict-taxonomy** | **13** | 8 | 6 | 5 |

**1. methodology-reteach — 243 lines, 110 instances, 47 assets.** Half the total. The prompt block re-teaches the skill its own internal procedure: performance-engineer is told to measure before optimizing, incident-responder is told to triage-contain-preserve-diagnose-recover, sprint-execution is told to write failing tests first, bugfix-wave is told what its own structural-fix mandate means, qa is told how its own Standard/Quick/Exhaustive tiers behave, ui-auditor is told its own capture-precedence ladder. In every confirmed instance the skill carries a whole section on the rule and the operator adds no parameter the skill could not derive. Severity mix: 17 high / 62 medium / 31 low.

**2. output-contract-restatement — 88 lines, 35 instances, 29 assets.** The block restates the skill's own output template, field list, or verdict vocabulary: advisor-researcher's 5-column options table, ui-auditor's 1-4 per-pillar score, eval-auditor's COVERED/PARTIAL/MISSING, nyquist-auditor's FILLED/ESCALATED/justified-SKIP, gate-plan-review's `gate_passed`/`next_action` JSON, land-and-deploy's eight Deploy Configuration fields, doc-verifier's one-line-confirmation contract. The skill's Output section is authoritative and already says it — and where the guide's copy diverges, the guide's copy is the wrong one.

**3. invocation-boilerplate — 82 lines, 27 instances, 26 assets.** The sentence form "Use the `<X>` skill to `<X's own one-line purpose>`, writing to `<X's own default output path>`." It carries the skill name (which the invocation line already carries) plus a paraphrase of the frontmatter description plus a hardcoded canonical path. Nothing survives removal except the invocation. Mostly low severity individually; third by volume purely because it is everywhere.

**4. upstream-input-restatement — 61 lines, 26 instances, 20 assets.** Naming the upstream artifacts the skill should read, and telling it not to re-derive earlier steps, in cases where the skill's own context loader already reads exactly those files. **This pattern has a load-bearing twin** — when the loader provably omits the file (planner vs PATTERNS.md/UI-SPEC/AI-SPEC), the identical sentence is an unenforced-gap finding and must be kept. Do not trim this pattern by pattern-match; check the loader each time.

**5. ownership-boundary-restatement — 54 lines, 19 instances, 14 assets.** Negative-scope fencing the skill already states about itself: "this is step 7's job, not yours", "converge writes no application code", "eval-planner does not author §1", "the four researchers never commit", "implementation files are read-only to it". Densest in step 6, where five AI-SPEC authors each get a paragraph re-declaring section ownership their own agent files already declare.

**6. mechanical-git-recipe — 25 lines, 11 instances, 5 assets.** Literal git verification and worktree-cleanup recipes pasted into the guide — `git log <branch>..<track-branch> --oneline` must come back empty, `git status --porcelain` must be empty, re-attach with `git checkout <branch>`, only then remove worktrees — where the skill scripts the identical commands in its own merge/cleanup phase. Concentrated almost entirely in step 10's bugfix-wave loop.

**7. severity-verdict-taxonomy — 13 lines, 8 instances, 6 assets.** Restating a skill's severity ladder and its gating consequence: BLOCKER/MAJOR/MINOR forcing REVISE, "a MISSING dimension is a BLOCKER", "a BLOCKED verdict halts planning", "a conflict with a constitution MUST is CRITICAL". Smallest by volume, most uniform: every instance is a verbatim echo of the skill's own classification table.

---
## 3. The 5 hardest cuts

Drawn from `rewrites/`. Seven were drafted; these five are the ones where load-bearing text is interleaved with the restatement line by line.

### 3.1 — step 10, bugfix-wave merge loop (KICKOFF 685-753) — 67 inner lines → 41

The single biggest prompt block in the guide and the biggest recoverable cut: 40 of 67 lines covered by 22 confirmed redundant claims.

**Current** (excerpt — the two densest passages):

```text
3. Otherwise hand that findings.json to the bugfix-wave skill, naming <branch> as the source
   branch. It groups the findings into conflict-free tracks, runs them in parallel worktrees,
   and each track merges itself back into <branch>. Its structural-fix mandate is required for
   every findings.json entry, so hold it to that: name the underlying class of defect rather
   than the line that got flagged, find and fix every instance of that class in one atomic
   verified commit, and leave a regression guard behind — a test, a lint rule, a type-level
   constraint, or a CI check. Prose in a doc is not a guard. A point fix that touches only the
   flagged location is why the next round re-flags the same class. …
3b. … In this order:
   - For every track branch, `git log <branch>..<track-branch> --oneline` must come back empty.
     Merge whatever did not land, resolving conflicts centrally …
   - Re-attach the repo: `git checkout <branch>`. bugfix-wave runs `git checkout --detach` in
     the main working tree before dispatching …
   - Only then remove the agent worktrees and delete the track branches.
```

**Trimmed:**

```text
3. Otherwise hand that findings.json to the bugfix-wave skill, naming <branch> as the source
   branch, and give it an explicit output path for the fixes.json summary its Phase 4 must
   emit: PHASE/reviews/round-<n>/fixes.json — the same round directory code-review-gate just
   wrote findings.json into. That path is required and it is not a free choice: round n+1's
   code-review-gate globs PHASE/reviews/round-*/fixes.json to decide whether a
   previously_seen_class has since been resolved.
3b. Reconcile this round before you open the next one. bugfix-wave's merge-and-clean-up phase
   is yours to drive, and it belongs here inside the loop, not after it — round n+1's review
   diffs <branch>, so a track that did not land is invisible to it … Drive its Phase 3 to the
   end, steps 3.1-1 through 3.1-7 in the skill's order, before you open round n+1.
```

**Parameters preserved (21 enumerated; the load-bearing core):** `<NN>` and the "as a workflow" dispatch mode · `Source branch: <branch>` (bugfix-wave `SKILL.md:42-44` "Never hardcoded to `main`") · `Max 6 rounds` / `n = 1..6` · **the cross-session worktree pre-flight, verbatim** (confirmed unenforced-gap, see §4) · code-review-protocol mode "receiving side" and scope "the whole loop" · code-review-gate "round mode" against `PHASE/` · all three round-mode inputs by name and value (`phase_dir`, `round = n`, `branch = <branch>`) · the `(engine codex)` override · "computes stop_loop and next_action itself — read those, never re-derive them" · the engine-fallback disclosure duty · all loop control flow including "hard cap reached — escalate" and "Never open a 7th round" · the `PHASE/reviews/round-<n>/fixes.json` path and the round-n+1 glob · **"the merge belongs here inside the loop, not after it"** · the post-loop invariant and report contents · the closing learn-skill hand-off.

**Risk:** three losses, none a parameter. (1) A human skimming KICKOFF must open `bugfix-wave/SKILL.md` §1.5 and §3.1 to see the structural-fix mandate and the git commands; the *executing* model does not, since the skill enforces all of it three ways (prose, the rendered subagent prompt at `:404-420`, the Phase 4.2 validation gate at `:528-532`). (2) One non-duplicated consequence clause is gone — "skip this and every remaining round runs on a detached HEAD" — the cross-round framing of a per-invocation rule the skill states at `:337-338` and `:465`. This is the cheapest insurance to add back: one clause on the 3b line. (3) The literal `findings.{md,json}` path is now implied; recoverable from `code-review-gate.md:461` and from the retained `fixes.json` path, which fixes the directory. **Riskiest single edit:** replacing three explicit git bullets with a numbered pointer into Phase 3.1. Restoring bullet 2 (re-attach) alone recovers most of the safety at 4 lines.

### 3.2 — step 10, ui-auditor scoring (KICKOFF 801-817) — 15 inner lines → 3

Every one of the 15 inner lines is covered by confirmed redundant-restatement (10 claims) against only 2 load-bearing parameters.

**Current:**

```text
Use the ui-auditor agent for a 6-pillar visual audit of what this phase shipped. Score this
phase's diff against its own PHASE/UI-SPEC.md when one exists, and against the abstract
6-pillar standards when it does not — write the result to PHASE/reviews/UI-REVIEW.md with a
1-4 score per pillar and at least one specific finding justifying each score, classified
BLOCKER or WARNING. This pass is cheap and static-grep-first and never blocks on a browser, but
get the capture precedence right: check first whether browser automation is available in this
session (Playwright MCP, an in-session browser pane, or equivalent) and use it if it is —
desktop 1440x900 and mobile 375x812, plus a targeted shot per component UI-SPEC.md names. The
CLI screenshot route is the fallback … Do not average scores upward to soften the findings, and
do not stop at three issues if more exist. Keep it scoped to contract conformance on this diff
— subjective "does it feel right" judgment, cross-page consistency, and any actual fixing
belong to design-reviewer at step 12, which reads this file as its per-phase baseline.
```

**Trimmed:**

```text
Use the ui-auditor agent for a 6-pillar visual audit of what this phase shipped — write the
result to PHASE/reviews/UI-REVIEW.md. design-reviewer at step 12 reads that file as its
per-phase baseline.
```

**Parameters preserved:** asset selection (`ui-auditor`) · the operator-judgment condition `*(only if this phase shipped UI)*` on line 800, **outside the range and untouched** — the skill has no self-abort path for a phase with no frontend (`ui-auditor.md:10` presupposes one was submitted) · the output path `PHASE/reviews/UI-REVIEW.md`, which the skill explicitly delegates to the caller at `:23` ("use whatever paths the dispatch prompt provides") · scope target "what this phase shipped" · the cross-step handoff to design-reviewer **at step 12** — the skill knows its cadence but names no pipeline step number anywhere · block placement and fence.

**Risk:** two bounded losses. (1) **Anti-softening pressure.** The KICKOFF's "do not stop at three issues" was counter-pressure against the skill's *own* template, which pushes toward three ("## Top 3 Priority Fixes" at `:327`, "### Top 3 Fixes" at `:426`, `:20`, a checkbox at `:451`) even though `:36` forbids it. Cutting is correct — the operator should not be patching a skill defect from the guide — but must be **paired with tightening ui-auditor's template**. Without that pairing, expect mild regression toward three-item reports. *This is the one item not to ship blind.* (2) `needs_human_review: true` is only wired into the browser branch (`:117`); the KICKOFF sentence implicitly generalised it. Same remedy: fix the skill. Everything else lost is verbatim duplication, constants the guide copied **incompletely** (it omits the skill's tablet 768x1024 capture at `:142`), or outright wrong ("static-grep-first" — the execution flow captures screenshots at Step 3, `:375`, *before* the pillar greps at Step 5, `:385`).

### 3.3 — step 11, converge sweep (KICKOFF 867-879) — 11 inner lines → 2

The densest restatement-per-line block in the guide after the UI audit: 10 of 11 lines redundant across 10 claims, against 2 load-bearing parameters.

**Current:**

```text
Use the converge skill for phase <NN>. Assess the present-state code — no git, no diffing, no
history — against SPEC/spec.md, every PLAN file for this phase, and
docs/global/project/constitution.md, treating PHASE/VERIFICATION.md's gaps as pre-confirmed
evidence. Sweep every FR, SC, AC and constitution MUST, then append each missing / partial /
contradicts / unrequested gap as a new traceable <task> block under a "## Phase N:
Convergence" header at the END of the plan file. Never rewrite or renumber an existing task.
Constitution-violation remediation comes first. This is the exhaustive requirement-level sweep
the verifier deliberately does not attempt … converge itself writes no application code …
Tell me how many tasks it appended and to which plan file.
```

**Trimmed:**

```text
Use the converge skill for phase <NN>. Run it even when verify came back `passed` — a pass
there does not excuse skipping this step.
```

**Parameters preserved:** the invocation in KICKOFF's own "Use the `<name>` skill" form · **`<NN>`, the block's single real argument** — `SKILL.md:87` otherwise falls back to "the most recently modified phase directory, or by asking", and Step 1 (`:88-96`) derives SPEC, PLAN, VERIFICATION and CONSTITUTION from it · the operator-judgment condition "run it even when verify came back `passed`" · unconditionality of the block (no `*(only if …)*` prefix added) · position between the `human_needed` block (858-865) and the remediation block (881-899) · downstream wiring — KICKOFF:885-887 names the `## Phase N: Convergence` section independently, so the next block does not depend on this one repeating it · no output path exists to lose (converge appends to the phase's own PLAN files, `SKILL.md:65-67`, `:207-214`) · mode selection resolves to the default either way.

**Risk:** nothing executable is lost; every cut sentence is re-asserted by the skill, most twice. Three reader-level losses. The judgment call is **the report-back ask** ("Tell me how many tasks it appended and to which plan file"): the verdict confirmed it redundant against `SKILL.md:256-257`, which mandates a strict superset. But the operator's *next* block (KICKOFF:881-882) branches on whether converge appended a section — so if a future edit weakened converge's Step 8 handoff, that branch would lose its input with nothing local to catch it. A drift risk against a future skill, not a defect today. Restoring the one sentence is the cheapest revert in the block. Note also the **deliberate divergence from §3.5's treatment of paths**: here the four input paths were cut because converge derives all of them from `<NN>`, and the KICKOFF forms expand to the skill defaults character-for-character while still carrying unresolved `<M>` / `<NNN>-<slug>` placeholders the operator never fills.

### 3.4 — step 10, qa tiers and preconditions (KICKOFF 763-795) — 33 lines → 23

The rare case where the restatement is also **wrong** (finding D8).

**Current** (the prose narration, 786-795):

```text
Browser-driven QA against the running app: it exercises the thing like a real user and returns a
health score with before/after screenshot evidence. At the default **Standard** tier it fixes
critical, high and medium findings in source with atomic commits and a regression test per fix,
then re-verifies — low and cosmetic findings are recorded as *deferred*, not fixed (Quick fixes
only critical + high; Exhaustive fixes everything down to cosmetic). Anything unfixable from
source — a third-party widget bug, an infrastructure issue — is deferred at every tier.
```

**Trimmed:**

```text
Browser-driven QA against the running app: it exercises the thing like a real user and returns a
health score with before/after screenshot evidence.
```

The pre-flight fence (763-780) compresses 18 → 13 the same way: the framework-bootstrap enumeration collapses to a one-line summary, the browser-tooling option list drops (the agent enumerates the same three at `:10` and checks for them at Phase 1, `:102`), the tier taxonomy goes entirely.

**Parameters preserved:** cross-skill ordering — line 761 `Once the loop exits clean:` is outside the range · **pre-flight timing** (the clean-tree check happens *before* dispatch, the sole genuine delta over the skill's own Setup gate) · the exact command `git status --porcelain` · the expected result and report-back · **mode scoping "full-mode" on both preconditions**, so a report_only operator is not sent to run checks the skill skips · **the human approval gate "Tell me before you let it do that." verbatim** — the skill deliberately has none (`agents/qa.md:122` "this agent runs unattended, so don't stop to ask") · the bootstrap side-effect referents that make the gate actionable (`docs/global/process/TESTING.md`, the CLAUDE.md `## Testing` section, `.github/workflows/test.yml`, the `chore: bootstrap test framework` commit) · "that stop is the correct outcome, not a failure" · the report_only applicability disambiguation, verbatim · both invocations verbatim · the report_only mode-selection condition. KICKOFF never sets the qa agent's URL, tier, output dir, scope or auth in the first place — there was no parameter of that kind to lose.

**Risk:** small, three places. (1) **Tier taxonomy** — the operator no longer learns that low/cosmetic findings come back *deferred*. Acceptable and net-positive: the tier is not selectable from this command (`commands/qa.md:5` parses only `report_only`), so the knowledge cannot change any decision made here, the report labels every deferred issue (`agents/qa.md:285-287`), and the same four lines were the source of the confirmed contradiction. (2) **Bootstrap detail** — the per-file conditions are gone; the dropped CI condition was factually wrong anyway. (3) **Browser-tooling options** aren't listed. Deliberately **not** cut despite a confirmed redundant verdict: the pre-flight `git status --porcelain` check itself — deleting it hands the operator an unattended dispatch that stops mid-run.

### 3.5 — step 7, planner handoff (KICKOFF 484-497) — 12 lines → 8

Low line count, highest stakes in the audit: one confirmed contradiction plus the two highest-severity unenforced-gaps in the run, interleaved.

**Current:**

```text
Use the writing-plans skill and the planner agent to produce PHASE/<NN>-<MM>-PLAN.md with
waves and tracks. Keep the vertical-slice mandate. Read PHASE/PATTERNS.md and cite its per-file
analog and code excerpts in each task's action section — the planner does not load it
automatically, so unless you pass it here step 5's pattern mapping never reaches the plan. Same
for step 6's specs: read PHASE/UI-SPEC.md and SPEC/AI-SPEC.md when that step produced them and
make the plan's tasks implement those contracts, because the planner does not load either one on
its own. Its <threat_model> step should consult docs/milestones/<M>/reports/security/ (step 0's
baseline) before assigning threat dispositions rather than re-deriving them from zero, and it
should query docs/state/graphs/graph.json for dependency context the same way step 5 did, rather
than re-reading the tree. Declare complexity signals (files — complete, including files the track
creates — plus novelty/logic/ambiguity/tests) plus model and effort on every track. Use the
diagram skill for the wave/track dependency graph.
```

**Trimmed:**

```text
Use the planner agent to produce PHASE/<NN>-<MM>-PLAN.md. Keep the vertical-slice mandate.
Read PHASE/PATTERNS.md and have each task's <action> reference the per-file analog and the
excerpt's line range — reference it, do not paste the fenced blocks, which <action> forbids.
The planner does not load PATTERNS.md automatically, so unless you pass it here step 5's
pattern mapping never reaches the plan. Same for step 6's specs: read PHASE/UI-SPEC.md and
SPEC/AI-SPEC.md when that step produced them and make the plan's tasks implement those
contracts, because the planner does not load either one on its own. Use the diagram skill for
the wave/track dependency graph.
```

**Parameters preserved:** dispatch target `planner` (writing-plans is auto-pulled by it) · output path `PHASE/<NN>-<MM>-PLAN.md` with both placeholders unresolved · input artifacts `PHASE/PATTERNS.md`, `PHASE/UI-SPEC.md`, `SPEC/AI-SPEC.md` — note the **different** `SPEC/` prefix on the third, preserved verbatim, not normalised · the operator-judgment condition "when that step produced them" · placement of the analog citation in *each task's* `<action>` (target unchanged, citation form corrected from paste to pointer) · the consumption obligation "make the plan's tasks implement those contracts" · **both HIGH-severity gap warnings verbatim** · "Keep the vertical-slice mandate." · the `diagram` skill wiring · ordering via the retained "step 5"/"step 6's specs" references · everything from line 498 down (the plan-review block, lens vocabulary, tier guidance) untouched.

**Risk:** low, two residues. (1) "with waves and tracks" is gone from the opening sentence — `agents/planner.md:35` declares wave/track decomposition as the agent's own wrapping and `assign_waves` (`:1011-1030`) is unconditional, and the block's last sentence still says "wave/track dependency graph". (2) **The complexity-signals sentence is gone, and this one has a real edge.** The planner's chain covers per-*task* signals (`skills/writing-plans/SKILL.md:116`, `:120`, mandatory) and derives per-*track* model/effort by aggregation (`references/complexity-signals.md:57-60`), but no file in dev-kit-core defines the format of the `## Parallel Execution Map` where those per-track values render: the planner claims ownership at `agents/planner.md:36-37` yet its own PLAN.md template (`:415-494`) omits it, while `gate-plan-review` (`:34`, `:52`) scores its Model/Effort columns. That is a **template gap in the planner**, and the deleted sentence never fixed it — it declared *what* to emit, never *where*. File it against `agents/planner.md`; do not restore the sentence as a patch.

---
## 4. What must NOT be trimmed

228 confirmed load-bearing claims — 45% of the prompt-block text. Then 23 confirmed `unenforced-gap` findings, which are a different thing entirely.

### 4a. Load-bearing categories

**Output paths and artifact arguments the skill delegates to the caller.** Not "paths in general" — paths the skill *says* it takes from the dispatch prompt. `agents/market-researcher.md:92`: "Write to `docs/milestones/<M>/research/MARKET.md` … orchestrator supplies the concrete path" — the skill deliberately does not know the `<M>` substitution. `agents/ui-auditor.md:23`: "use whatever paths the dispatch prompt provides". `skills/bugfix-wave/SKILL.md:536-538`: "The caller specifies the output path" — which is why `PHASE/reviews/round-<n>/fixes.json` is a real argument and not boilerplate.

**Placeholders the operator substitutes.** `<NN>`, `<MM>`, `<M>`, `<branch>`. `converge/SKILL.md:87` otherwise falls back to "the most recently modified phase directory, or by asking" — one placeholder removes a guess/ask branch and drives four derived paths. `bugfix-wave/SKILL.md:42-44` refuses to infer the source branch at all: "Never hardcoded to `main`".

**Mode selection among modes the skill genuinely offers.** brainstorming's three modes (`SKILL.md:20-28` table) — only the caller knows at invocation time whether this is pre-code validation or a scoped feature. code-review-gate's round-mode vs single-mode (`agents/code-review-gate.md:21`). code-review-protocol's receiving side. plan-review's lens subset — `commands/plan-review.md:5` fixes the vocabulary but takes no position on which combination a given phase's risk profile warrants.

**Ordering, sequencing and parallelism across skills.** No skill file can see the pipeline. "These five are safe concurrently because they write different files AND read nothing each other produces" (KICKOFF:368) is a five-agent fan-out safety argument no single agent asserts. `kubernetes-specialist` at position 3 of 5, strictly after devops-engineer and terraform-engineer (KICKOFF:1110). "record it with the learn skill **before starting the next wave**" — `learn/SKILL.md:26` grants that a workflow may append but says nothing about timing. **The single most valuable ordering statement in the guide** is bugfix-wave's "the merge belongs here inside the loop, not after it": the skill's "once, after the whole run" is scoped to waves inside one invocation and cannot see the outer round loop.

**Operator-judgment gates.** `*(only if this phase shipped UI)*` · `*(only if a production incident is underway)*` · `*(only if verify reported validation gaps — and only after integration-checker has returned)*` · `*(only if the postmortem named a failure mode nobody had rehearsed)*` · qa's "Tell me before you let it do that", an operator-inserted human stop in a skill that explicitly runs unattended (`agents/qa.md:122`).

**Session-boundary placement.** The six `context-save` → `/clear` → `context-restore` triads at KICKOFF 118/240/284/334/554/955. The skills' descriptions are user-intent triggers with no concept of pipeline stage; *which* six of sixteen steps are session boundaries is pure operator knowledge. (Note: the *trailing glosses* on those same lines — "what is done, what got decided, and what is next", "to reload the last checkpoint" — are confirmed redundant. Keep the placement, cut the gloss.)

**Scope narrowing the skill cannot know.** `code-documenter/SKILL.md:122` documents the whole public surface; KICKOFF narrows to this milestone's delta. `the-fool` takes its subject from conversation context and has no input-file concept at all, so "against SPEC/spec.md" at KICKOFF:190 is its single indispensable argument — strip it and the skill has nothing to work on.

### 4b. Confirmed `unenforced-gap` findings — 23 of them. **These are SKILL DEFECTS.**

Every one of these is a place where the guide is doing a skill's job for it. They must be kept in KICKOFF *today* — and each is a bug report against the named skill. Fix the skill, then the guide line becomes trimmable. Trimming first breaks the pipeline.

**HIGH severity — fix these first.**

| Skill | KICKOFF | What the skill fails to enforce |
|---|---|---|
| **`agents/planner.md`** | 486-489, 488-491 | Its phase-context loader (`:977`) reads only CONTEXT.md, RESEARCH.md, DISCOVERY.md. `grep -rn "PATTERNS\|UI-SPEC\|AI-SPEC"` across planner.md, its whole `references/planning/` chain and `skills/writing-plans/` returns **zero** read instructions. Three upstream artifacts silently never reach the plan. **The loader must ingest PATTERNS.md, UI-SPEC.md and AI-SPEC.md.** |
| **`agents/pattern-mapper.md`** | 394-395 | Same defect from the producer side: `:67` says "Your PATTERNS.md is consumed by `planner`", which is false — planner.md is not among the four files repo-wide that mention PATTERNS.md. |
| **`agents/project-researcher.md`** | 258-260 | `:537` has every parallel researcher writing STACK.md, FEATURES.md and PITFALLS.md "Always". There is no per-axis file assignment anywhere in the agent or in `dev-kit-core/references/`. **Four parallel dispatches overwrite each other.** The agent needs an assigned-file input. |
| **`agents/roadmapper.md`** | 273-274 | `:316` and `:543` both *update* `docs/milestones/<M>/REQUIREMENTS.md` and both presuppose it exists. 44 REQUIREMENTS hits across 729 lines, none creating the file. **roadmapper must create it, traceability section included.** |
| **`skills/finishing-a-development-branch/SKILL.md`** | 1155-1158 | Option 2 is titled "Push and Create PR" and its body is `git push -u origin <feature-branch>` and nothing else (`:121`). There is no `gh` command anywhere in the file. **The option does not do what its name says** — it must actually run `gh pr create`, or be renamed. |
| **`skills/devex-review/SKILL.md`** | 1018-1019 | KICKOFF treats the scorecard as a ship-blocking gate. The skill has a 1-10 rubric (`:74-86`) and no pass/fail threshold, no verdict, no blocking semantics anywhere. **Define the threshold and emit a verdict.** |

**MEDIUM — real gaps, lower blast radius.**

- **`skills/constitution/SKILL.md`** (KICKOFF 39-43) — the guide says "interview me"; the skill has no elicitation pass. Only hits are a passive "if conversation supplies a value, use it" (`:38`) and one date field's "ask or mark TODO" (`:40`). On a greenfield repo there is nothing to infer from.
- **`skills/brainstorming/SKILL.md`** (132-133) — the mandatory Premise Challenge exists only inside the YC Office-Hours diagnostic mode (all `premise` hits: 30, 118, 172, 186, 188, 189, 201, 209). The Standard design flow — KICKOFF's default branch — never gates on it.
- **`skills/diagram/SKILL.md`** (205-209) — the skill contemplates embedding mermaid *instead of* a PNG (`:56`) but never an embedded copy coexisting with a `.mmd`/`.svg` source, and has no re-sync duty. Step 14's drift check never opens `.mmd`/`.svg`, so nothing downstream catches a stale source.
- **`agents/pattern-mapper.md`** (393-394) — no precondition guard at all. `<success_criteria>` requires files "classified" but never requires the list to be non-empty; dispatched early it invents a PATTERNS.md.
- **`commands/plan-review.md`** (528) — `:5` hardcodes "Default to all 4 lenses" with no project-config lookup. No `CLAUDE.md`-sourced default tier exists anywhere in the chain.
- **`skills/sprint-execution/SKILL.md`** (570-571) — no evidence standard on a done-claim. `:180` is merge-specific. The verification-before-completion contract is entirely operator-supplied.
- **`skills/learn/SKILL.md`** (579-581) — the only append path is gated behind "Gather from the user" (`:95`), i.e. a human turn. There is **no autonomous append path**, so a workflow cannot record a learning unattended.
- **`skills/rag-architect/SKILL.md`** (616-620) — `:20` and `:168` push the *opposite* way ("Select database…", "Evaluate multiple embedding models before committing"). Zero deference to an upstream AI-SPEC decision across SKILL.md + 5 references (3,858 lines). The skill will re-open a settled stack inside a build track.
- **`skills/bugfix-wave/SKILL.md`** (747-748) — no cross-session worktree preflight. Worse, the Edge Case at `:559-560` **misdiagnoses** this exact failure as a skipped `--detach`. Add the preflight and fix the edge case.
- **`agents/design-reviewer.md`** (990-991) — `:88` loads the previous baseline unconditionally with no first-milestone branch. Needs a bootstrap path.
- **`skills/devex-review/SKILL.md`** (1015-1016) — no read-only/no-commit restraint anywhere; `:239` leans advisory but Step 9 says "measure baseline → fix". The skill may commit during what the guide bills as a non-destructive pass.
- **`skills/ship/SKILL.md`** (1171-1172) — states where it ends but never forbids merging or deploying, sitting next to `:172`'s "You are NOT done" and `:8`'s "run straight through". An over-eager agent can over-read it.
- **`skills/sre-engineer/`** (1323-1324) — the SLO Review Checklist (`references/slo-sli-management.md:216-221`) gates against targets that are too *strict*; nothing tests for a target that is too *loose*. Needs a calibration test.
- **`agents/compliance-auditor.md`** (1361-1363) — nowhere states that disclosure clocks start at *discovery*, nor that the regime must be surfaced as an early interim artifact rather than folded into the final audit report. `:17` names "breach-notification deadlines" as a topic only. `agents/incident-responder.md` has the same absence across its 30 lines.
- **`skills/chaos-engineer/`** (1369-1370) — experiment selection is seeded from its own generic scenario catalogue (`references/game-days.md:294ff`); no rule says start from a real prior incident's failure path.
- **`skills/test-master/`** (941-944) — KICKOFF assigns it as the test-design skill "for Maestro". `grep -rni maestro` across SKILL.md and all 10 references returns **zero hits**; the only native-mobile content is a one-line table row `| Appium, Detox | Mobile |` (`references/automation-frameworks.md:293`). The skill has no Maestro methodology at all.
- **`agents/architecture-designer.md`** — no concept of a `.mmd`/`.svg` pair or a diagram skill; reclassified to load-bearing at verification, but the same underlying hole as the `diagram` gap above.

---

## 5. Consistency findings — one asset, N invocations, different descriptions

**Regression guard: PASS.** `roster-check.json` — 22 checked, 22 passed, 0 failures. Every lane skill named at KICKOFF 605-612 resolves to a `SKILL.md` in the plugin its lane implies (backend→dev-kit-backend, web→dev-kit-web, mobile→dev-kit-mobile, AI→dev-kit-data-ai, infra→dev-kit-infra, specialized→dev-kit-specialized). **Correction to the audit brief:** the task described 25 lane skills in that range; only **22 distinct names** actually appear. Nothing is missing — the count in the brief was wrong, not the roster.

**19 assets are invoked more than once.** Two lead: `context-restore` (6× — steps 1, 3, 4, 5, 8, 12) and `context-save` (6× — steps 0, 2, 3, 4, 7, 11). Then `learn`, `monitoring-expert`, `plan-review` at 3×, and fourteen at 2×.

**C1 — Cross-step contradiction: `flutter-expert`, steps 8 and 11.** KICKOFF:564 and KICKOFF:889 both bind the same lane skill to test-first execution; `plugins/dev-kit-mobile/skills/flutter-expert/SKILL.md:33` is code-then-test. The contradiction is *reinforced* by the second invocation rather than corrected — the convergence re-run repeats the same test-first framing, so both descriptions of the asset agree with each other and both disagree with the asset. (Same shape for `python-pro` and `django-expert`, single-invocation.) See D2.

**C2 — `plan-review` is described three ways in one step.** KICKOFF:504-505 ("Named with no lenses it runs all four … and fans them out in parallel"), :524 ("Naming lenses suppresses the all-four default"), and :525-526 ("or just use the bare no-lens form above to run all four") all re-derive one fact stated once at `commands/plan-review.md:5`. Three descriptions, no disagreement, no added parameter — but the *tier guidance* interleaved with them (:509-510, :516-518, :524-526) is confirmed load-bearing and must survive the collapse.

**C3 — `context-save` / `context-restore`: identical boilerplate ×6, split verdict.** The same sentence appears verbatim at six sites each. The **placement** is load-bearing at all six (each sits immediately before a bare `/clear`, and no skill knows which pipeline steps are session boundaries). The **trailing gloss** is redundant at all six: "what is done, what got decided, and what is next" restates `context-save/SKILL.md:32-37` and its own frontmatter; "to reload the last checkpoint" restates the no-argument default `context-restore/SKILL.md:12` defines three separate times. Consistent across all invocations — consistently carrying ~12 lines of dead text.

**C4 — `learn` described at three different granularities.** KICKOFF:579-581 (step 8, "a build quirk, a library misuse, an ordering constraint"), :750-752 (step 10, "a convention or a recurring pitfall that generalizes past this phase's findings"), :956-957 (step 11, "also record it … before the checkpoint"). The *calibration test* is redundant at all three (`skills/learn/SKILL.md:26`, `:28` already gate on genuine-discovery). The *timing* differs meaningfully at each site and is load-bearing at each — "before starting the next wave", "before moving on", "before the checkpoint" — and the skill has no cross-skill sequencing concept.

**C5 — `design-html`'s unbound gate is re-explained three times in step 4** (KICKOFF:311-312, :328-329, :330). All three restate `skills/design-html/SKILL.md:77-80`. The flow-control command itself is the guide's; the justification is the skill's, three times over. Consistent, and consistently the wrong document to state it in.

**C6 — `guard`: a near-miss worth recording as a non-finding.** Step 8 (KICKOFF:630-631) invokes guard bare, which `skills/guard/SKILL.md:14` maps to **Both** protections; step 13 (:1082-1084) explicitly says do *not* set an edit-scope freeze. That reads as a live contradiction and was raised as one — **refuted**, because step 8's guard runs inside a per-track subagent in its own worktree and `SKILL.md:91` ends protections with the session, so no state reaches step 13. Recorded here because it will look like a bug to the next reader too; step 8 naming safety mode explicitly would cost one word and end the ambiguity permanently.

No other confirmed finding shows one asset described *incompatibly* across steps. Repetition is the norm; divergence is rare.

---
## 6. Verdict

**The split: 55% redundant, 45% load-bearing.**

Of 797 lines of KICKOFF prompt-block body, 437 are covered by confirmed redundant-restatement — **54.8%**. The remaining ~45% is confirmed load-bearing: paths the skills delegate, placeholders, mode selections, cross-skill ordering, operator-judgment gates, session boundaries, and 23 gap-compensations that only look like guide text because the skills are broken. A further 44 redundant lines sit outside prompt blocks, bringing the deduplicated redundant union to 481 of 1,396 total file lines.

**False-positive rate: 7.4% (40 refuted ÷ 538 adjudicated).**

That is low, and it means the surviving findings should be weighted heavily. The finders were not loose. Read the number as a confidence signal on this audit: fewer than one claim in thirteen died at verification. But read the *shape* of it too — the refutations were concentrated in the **load-bearing** direction. 31 of the 40 refuted claims were load-bearing assertions the verifier knocked down; only 4 were redundancy claims. In plain terms: when this audit says "this is duplication" it was right 236 times out of 240 attempts; when it says "keep this" it was right 228 out of 259. **The trim list is more trustworthy than the keep list.** Verify a "keep" before you rely on it; you can act on a "cut" as read. Three of the 40 refutations were contradiction claims — including the `guard` cross-step scare (C6) — so the dangerous-findings list in §1 is the most heavily filtered section of this report and should be treated as solid.

**Is KICKOFF.md bloated with restatement, or is it mostly carrying its weight?**

**It is bloated. Just over half the prompt-block text is the guide telling skills what they already say about themselves.** The dominant failure is a single habit repeated 110 times across 47 assets: re-teaching methodology. 243 lines — 30% of all prompt-block content — narrate procedures the skill executes unconditionally regardless of what the prompt says. That text changes no behavior. Worse, it drifts: the guide's copy of ui-auditor's viewport list silently omits tablet 768x1024, calls the audit "static-grep-first" when the execution flow captures screenshots first, and promises a regression test per QA fix that the agent skips in its most common cases. Every restated line is a second place for a fact to rot, and three of them already have.

**But the other 45% is not padding, and cutting by pattern-match would wreck the pipeline.** The guide is the only document in the system that can see the pipeline: nothing else knows that the bugfix-wave merge belongs inside the round loop, that five agents can fan out safely because they write disjoint files, that six specific steps are session boundaries, or that a `passed` verify does not excuse skipping convergence. And 23 of its most valuable sentences exist only because a skill is defective — the planner that never loads the three artifacts steps 5 and 6 produce, the four researchers that overwrite each other's files, the "Create PR" option that does not create a PR.

**Act on it in this order.** (1) Fix the 6 high-severity skill defects in §4b — they are live bugs today, independent of any trimming. (2) Ship the two zero-risk cuts: step 2's sdd-review-cto block (10 of 10 inner lines redundant, zero load-bearing parameters — the cleanest total deletion in the file) and step 11's converge block. (3) Ship the ui-auditor cut **only after** tightening that skill's "Top 3" template. (4) Take the step 10 bugfix-wave loop last and deliberately — it is the largest single win at ~26 lines but its load-bearing parameters are interleaved line by line. Across the seven drafted rewrites the recoverable total is roughly 100 lines out of 190, without losing one parameter.

---

## Coverage and limits

Full coverage. Nothing was capped, truncated, or silently dropped.

- **Extraction:** 605 raw claims from 118 findings files → 539 merged claims (38 merged, 47 collapsed as systemic boilerplate carrying >1 KICKOFF location). **0 dropped for missing evidence.** 538 of the 539 reached adjudication.
- **Deliberate non-merge:** 17 collisions where a redundant-restatement claim and a load-bearing claim landed on the same KICKOFF sentence were kept separate on purpose — they are competing findings the verifier had to see individually.
- **One scoped exclusion, recorded not dropped:** the `code-review-protocol` finder deliberately left KICKOFF 701-753 to its rightful owners (code-review-gate, bugfix-wave, learn) to avoid double-counting. That range **was** audited, under those assets.
- **Eight assets carry zero-claim queue files** (api-designer, fastapi-expert, fullstack-guardian, mcp-developer, prompt-engineer, react-native-expert, refactoring-specialist, swift-expert) because every raw claim was absorbed as a duplicate into another asset's queue. Their queue files name where their claims were verified; none went unexamined.
- **36 of 109 audited assets produced zero confirmed redundant lines** — roughly a third of the guide's invocations are already clean.
- **Rewrites:** 7 of the 7 nominated targets were drafted. §3 presents the 5 hardest; the two not shown (step 2 sdd-review-cto, step 15 close-out methodology) are complete in `rewrites/` and are referenced above.
- **One skill is excluded from this audit by user instruction.** It is omitted from every count, roster, pattern and quote in this report, including incidental mentions inside other assets' evidence text.
