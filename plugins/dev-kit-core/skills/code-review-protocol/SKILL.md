---
name: code-review-protocol
description: Use when requesting a code review (after completing tasks, implementing major features, or before merging) or when receiving review feedback, especially if feedback seems unclear or technically questionable - covers dispatching a reviewer subagent and responding with technical rigor instead of performative agreement
---

# Code Review Protocol

Both directions of code review: dispatching a reviewer to catch issues before they cascade, and responding to review feedback with technical rigor.

**Core principles:** Review early, review often. Verify before implementing. Technical correctness over social comfort.

**Note:** Part 1 below covers ad-hoc, in-session review requests via a `general-purpose` subagent and the local `code-reviewer.md` prompt template. For orchestrator/pipeline-gated reviews (plan-phase gates, sprint execution, the `/review` command, adversarial review rounds), the pipeline dispatches `agents/code-review-gate` instead — it selects a review engine per `@references/independent-review.md` and produces the canonical `findings.json`. Both directions of this skill (requesting and receiving) still apply regardless of which reviewer produced the feedback.

---

## Part 1: Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

### When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

### How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code reviewer subagent:**

Dispatch a `general-purpose` subagent, filling the template at [code-reviewer.md](code-reviewer.md)

**Placeholders:**
- `{DESCRIPTION}` - Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit

**3. Verify the review before acting on it:**

Everything the reviewer returns — `Issues`, `Assessment`, `Ready to merge?` — is a self-report about work you can check yourself. The template's own DON'T list names the failure mode ("Give feedback on code you didn't actually read"); these are the checks that catch it. Run all three before step 4.

- **Coverage.** `git diff --name-only $BASE_SHA..$HEAD_SHA` lists what was actually reviewable. A review whose Strengths and Issues cite none of those files did not read the diff — re-dispatch it, don't act on it. Files in the diff that the review never mentions are un-reviewed, not clean.
- **Citations.** Spot-check one file:line from the Issues list and confirm the code is there and says what the reviewer claims. A citation that does not resolve invalidates the review, not just that one issue.
- **`Ready to merge? Yes`.** A verdict, not evidence. Run the project's test/typecheck command yourself before you treat it as merge-readiness. Where the project has no such command, say so — record the verdict as un-corroborated rather than as verified.

**4. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

### Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/milestones/v1/phases/03-deployment/03-01-PLAN.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

### Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each task or at natural checkpoints
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

### Requesting Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)

---

## Part 2: Receiving Code Review

Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

### The Response Pattern

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

### Forbidden Responses

**NEVER:**
- "You're absolutely right!" (explicit instruction-file violation)
- "Great point!" / "Excellent feedback!" (performative)
- "Let me implement that now" (before verification)

**INSTEAD:**
- Restate the technical requirement
- Ask clarifying questions
- Push back with technical reasoning if wrong
- Just start working (actions > words)

### Handling Unclear Feedback

```
IF any item is unclear:
  STOP - do not implement anything yet
  ASK for clarification on unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

**Example:**
```
your human partner: "Fix 1-6"
You understand 1,2,3,6. Unclear on 4,5.

❌ WRONG: Implement 1,2,3,6 now, ask about 4,5 later
✅ RIGHT: "I understand items 1,2,3,6. Need clarification on 4 and 5 before proceeding."
```

### Source-Specific Handling

#### From your human partner
- **Trusted** - implement after understanding
- **Still ask** if scope unclear
- **No performative agreement**
- **Skip to action** or technical acknowledgment

#### From External Reviewers
```
BEFORE implementing:
  1. Check: Technically correct for THIS codebase?
  2. Check: Breaks existing functionality?
  3. Check: Reason for current implementation?
  4. Check: Works on all platforms/versions?
  5. Check: Does reviewer understand full context?

IF suggestion seems wrong:
  Push back with technical reasoning

IF can't easily verify:
  Say so: "I can't verify this without [X]. Should I [investigate/ask/proceed]?"

IF conflicts with your human partner's prior decisions:
  Stop and discuss with your human partner first
```

**your human partner's rule:** "External feedback - be skeptical, but check carefully"

### YAGNI Check for "Professional" Features

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage

  IF unused: "This endpoint isn't called. Remove it (YAGNI)?"
  IF used: Then implement properly
```

**your human partner's rule:** "You and reviewer both report to me. If we don't need this feature, don't add it."

### Implementation Order

```
FOR multi-item feedback:
  1. Clarify anything unclear FIRST
  2. Then implement in this order:
     - Blocking issues (breaks, security)
     - Simple fixes (typos, imports)
     - Complex fixes (refactoring, logic)
  3. Test each fix individually
  4. Verify no regressions
```

### When To Push Back

Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack
- Legacy/compatibility reasons exist
- Conflicts with your human partner's architectural decisions

**How to push back:**
- Use technical reasoning, not defensiveness
- Ask specific questions
- Reference working tests/code
- Involve your human partner if architectural

**If you're uncomfortable pushing back out loud:** Name that tension, then tell your partner about the issue you've seen. They'll appreciate your honesty.

### Acknowledging Correct Feedback

When feedback IS correct:
```
✅ "Fixed. [Brief description of what changed]"
✅ "Good catch - [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]

❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
❌ "Thanks for [anything]"
❌ ANY gratitude expression
```

**Why no thanks:** Actions speak. Just fix it. The code itself shows you heard the feedback.

**If you catch yourself about to write "Thanks":** DELETE IT. State the fix instead.

### Gracefully Correcting Your Pushback

If you pushed back and were wrong:
```
✅ "You were right - I checked [X] and it does [Y]. Implementing now."
✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

❌ Long apology
❌ Defending why you pushed back
❌ Over-explaining
```

State the correction factually and move on.

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| Performative agreement | State requirement or just act |
| Blind implementation | Verify against codebase first |
| Batch without testing | One at a time, test each |
| Assuming reviewer is right | Check if breaks things |
| Avoiding pushback | Technical correctness > comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State limitation, ask for direction |

### Real Examples

**Performative Agreement (Bad):**
```
Reviewer: "Remove legacy code"
❌ "You're absolutely right! Let me remove that..."
```

**Technical Verification (Good):**
```
Reviewer: "Remove legacy code"
✅ "Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has wrong bundle ID - fix it or drop pre-13 support?"
```

**YAGNI (Good):**
```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
✅ "Grepped codebase - nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

**Unclear Item (Good):**
```
your human partner: "Fix items 1-6"
You understand 1,2,3,6. Unclear on 4,5.
✅ "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

### GitHub Thread Replies

When replying to inline review comments on GitHub, reply in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.

---

## Part 3: The Multi-Lens Review Round

Parts 1 and 2 assume one reviewer and one author. A phase's adversarial loop runs several
reviewers over the same branch, and what makes that safe is worth stating outright: **every
finder is read-only; only the fix sweep writes.** `code-review-gate`, the `qa` agent in
`report_only`, `ui-auditor`, `security-auditor` and `verifier` each read the tree and write their
own report at their own path. Nothing about them requires serialization.

What must never overlap is finding and fixing. So a round has four stages, not one.

### Stage 0 — Freeze

Pin the head commit and hand that same SHA to every finder. Finders reading different trees
produce findings that cannot be reconciled: the same defect at a shifted line number reads as two
defects, and a defect the sweep already fixed reads as live.

### Stage A — Find (parallel)

Pick the round's roster first — the **active lens set**, all read-only, all against the frozen SHA.
Round 1's active set is every lens the phase is eligible for, so round 1 is a full roster
(`rosterIsFull: true`); later rounds narrow to the lenses the previous round returned as
`activeLenses` (see Stage D).

- `code-review-gate` in round mode — the canonical `findings.json` the other lenses merge into
- `qa` with `report_only: true` — never full mode; see the write hazard below
- `ui-auditor` — only when the phase shipped UI
- `security-auditor` — over the phase's declared threat model
- `verifier` — on the phase goal, as early warning only

Every lens returns, on top of its own native fields, a normalized `severity: {P0..P4}` plus an
`indeterminate` count — checks it could not complete. The workflow's dispatch prompt carries the
per-lens mapping (the agent files are untouched), and the script sums the result into the round's
consolidated verdict. Blocking is P0-P2; P3/P4 are advisory; `indeterminate` is neither — a threat
nobody could verify and a flow nobody could exercise are open questions, not clean results.

Then dispatch by roster size:

| Lenses in the roster | How to dispatch |
|---|---|
| **2 or more** | **Workflow script — mandatory.** `@references/workflows/review-finders.workflow.mjs` |
| Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |

**Model routing (mandatory, before dispatch).** Per references/model-routing.md § The routing step: build one descriptor per agent role — the round's active lens set (`code-review-gate`, `qa`, `security-auditor`, `verifier`, `ui-auditor` when rostered) — surface "workflow", profile `review`, signals declared per that doc's profile tables; write them keyed by role to a temp JSON; run `node plugins/dk/bin/model-route.mjs --caller code-review-protocol --batch <file>`; forward the output verbatim as `args.routing` on the Workflow call. "inherit" is a router decision — never skip the step to get it.

Round 1 always rosters every eligible lens, so round 1 is always the Workflow:

```
Workflow({
  scriptPath: "<dev-kit-core>/references/workflows/review-finders.workflow.mjs",
  args: {
    frozenSha: "<Stage 0 SHA>",        // required
    phaseDir: "PHASE/",                // required
    round: 1,                          // required, integer 1..6
    rosterIsFull: true,                // required boolean — TRUE only when this round dispatches
                                       // every lens the phase is eligible for. Round 1 always does.
    roster: [                          // required, 2+ entries; membership is YOUR decision
      { lens: "code-review-gate", inputs: { branch: "<integration branch>", diffBase: "<base ref>", priorRoundsGlob: "PHASE/reviews/round-*/findings.json" } },
      { lens: "qa",               inputs: { appUrl: "<url>" } },              // report_only is forced on; there is no full-mode option
      { lens: "security-auditor", inputs: { threatModelPath: "<path>" } },
      { lens: "verifier",         inputs: { planPath: "<path>", phaseGoal: "<goal>" } },
      { lens: "ui-auditor",       inputs: { uiSpecPath: "<path>" } }          // include ONLY when the phase shipped UI; uiSpecPath itself optional
    ]
  }
})
```

`scriptPath` takes a real filesystem path, not an `@references/…` citation — resolve `<dev-kit-core>` to the
installed plugin directory before calling. A run that dies mid-flight resumes with
`Workflow({ scriptPath, resumeFromRunId: "<runId>" })`. The script returns the consolidated verdict —
`stopLoop`, `needsConfirmingRound`, `needsOperatorDecision`, the `blockingOpen` / `advisoryOpen` /
`indeterminateOpen` totals — alongside `lenses`, `missingLenses`, and the `cleanLenses` / `activeLenses`
split. A lens in `missingLenses` did not review this round at all, so it is a coverage gap, never a lens that
found nothing; it forces `stopLoop` false and stays in `activeLenses`. `gateStopLoop` is `code-review-gate`'s
own `stop_loop`, kept for traceability only — when it disagrees with `stopLoop` the script logs it and the
consolidated value wins, because the gate sees only its own lens. Triage stays yours: the script counts, and
runs no Stage B logic.

**The write hazard.** In full mode the `qa` agent bootstraps a test framework, fixes bugs, and
commits. That is a writer, and a writer inside Stage A mutates the tree the other four are
reviewing. Settle the framework once *before* the loop opens, then keep `qa` in `report_only`
every round. A round that still needs a framework bootstrapped is a round that started too early.

### Stage B — Triage (barrier, no agents)

Merge the lens reports into one findings set yourself. Three rules, each of which fails in a
specific and recognizable way when skipped:

**Dedupe by defect class, not by report line.** One defect surfaces from several lenses at once —
an unvalidated input is a `code-review-gate` P1, a failing QA case, and a `security-auditor` open
threat, all at once. Merged undeduped it becomes three tracks editing one file in three
worktrees, and the sweep ends in a conflict no fixer can resolve. Match on file, line span, and
claim; keep the highest severity; record every lens that raised it. `code-review-gate` already
groups by class with `files` and `lead_file` — normalize the other lenses into that shape rather
than inventing a second one.

**Classify every test failure before it becomes fix work.** A failing test is not yet a finding.
It is an implementation bug, a bad test, or a stale fixture, and only the first is a defect in the
code. Hand an unclassified failure to a fixer and the cheapest way to make it pass is to weaken
the assertion — which is exactly what you will get back.

**Route goal gaps out of the set.** `verifier`'s `gaps_found` is missing *functionality*, not a
defect. It is build work and goes back to the build step with a plan behind it. A goal gap sitting
in `findings.json` asks a bug-fixer to implement a feature, which it will attempt, badly.

### Stage C — Sweep (parallel)

One `bugfix-wave` over the whole merged set, tracks partitioned by file ownership. One sweep, not
one per lens: tracks must be cut from the deduped set, because that is the only view that knows
two lenses named the same file.

### Stage D — Re-find (parallel, narrowed by dormancy)

Re-dispatch the previous round's `activeLenses` — the lenses that came back with blocking work,
indeterminate checks, or no result at all. A lens that reported zero blocking and zero indeterminate
is **dormant**: it sits out the next round, and stays out until the confirming round. Dormancy is
recomputed every round from that round's returns, so a lens that wakes for one round and comes back
clean goes dormant again. Re-running every lens to confirm a CSS fix spends a full round to learn
nothing, which is the whole reason rounds shrink.

`code-review-gate` is no longer a special always-run case for the stop signal — the consolidated
value across all lenses replaces that. Keep it in the active set whenever there is *any* blocking
work, though: it owns the canonical `findings.json` the other lenses merge into, so a sweep with no
gate round leaves that file stale.

Re-find reuses the same `review-finders.workflow.mjs` with the narrowed roster, this round's number,
and **`rosterIsFull: false`** — the narrowing is expressed purely as roster membership, so drop to a
plain inline `Agent` call when it narrows to one lens.

### How the loop exits

The exit is a computed verdict, not a reading of any single lens:

1. **`blockingOpen > 0`** (any P0/P1/P2 from any lens) — triage, sweep, open round n+1.
2. **A narrowed round comes back clean** (`needsConfirmingRound: true`) — do not exit. Run one final
   **full-roster** round against the final SHA, `rosterIsFull: true`. A lens that went dormant in
   round 1 is clean about a tree the later sweeps have since rewritten; its silence is not evidence.
   This round is deliberately spent to avoid declaring victory on stale evidence.
3. **Exit only on a full-roster round with `blockingOpen: 0` and `indeterminateOpen: 0`** and no
   lens in `missingLenses`. `indeterminate` is not clean — a could-not-verify threat, an unreachable
   flow or a needs-human-review item each hold the loop open exactly as a blocker does.
4. **`needsOperatorDecision: true`** — that final round is clean of blocking and indeterminate work
   but still carries P3/P4. **STOP AND ASK** whether to sweep them or accept them. Never open
   another round on advisory-only findings, and never exit silently past them.

The cap is unchanged: never a 7th round. A loop still blocking at round 6 escalates.

### Why the rounds themselves stay serial

Fixes change the diff, so round n+1 necessarily reviews a tree round n never saw. That is the one
real serialization here, and the cap of 6 rounds stays. What changes is the distribution: with
every lens firing in round 1, later rounds confirm rather than discover, and the cap stops being a
ceiling anyone actually reaches.

---

## The Bottom Line

**Requesting:** Review early, review often. A fresh reviewer with crafted context catches what you can't.

**Receiving:** External feedback = suggestions to evaluate, not orders to follow. Verify. Question. Then implement. No performative agreement. Technical rigor always.

**Rounds:** Finders are read-only and run together; only the sweep writes. Dedupe before you cut tracks.
