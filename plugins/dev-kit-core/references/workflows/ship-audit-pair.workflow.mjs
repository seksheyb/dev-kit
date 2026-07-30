/**
 * ship-audit-pair — ship Steps 4+5 as a CONCURRENT PAIR, barrier only
 * =============================================================================
 * Owns ONE thing: dispatching the two audits that `/ship` runs together after its test
 * run — Step 4 (Test Coverage Audit) and Step 5 (Plan Completion Audit) — holding the
 * barrier until both are back, and handing both results to the caller verbatim. Nothing
 * else happens here.
 *
 * Invoked by `skills/ship/SKILL.md` (the Steps 4+5 dispatch paragraph). There are exactly
 * 2 members, always, so this dispatch is always a Workflow: a 1-member dispatch would be a
 * plain inline `Agent` call, and a Workflow for one agent is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * WHY A PAIR, AND WHY NO WORKTREE
 * -----------------------------------------------------------------------------
 * Step 4 is the pair's ONLY writer: it generates coverage tests and commits them as
 * `test:` commits. Step 5 is strictly read-only — it reads the plan file,
 * `VERIFICATION.md`, and the diff, and writes nothing. The two share no files, so there
 * is exactly one writer and nothing to serialize: `isolation: 'worktree'` is deliberately
 * NOT used. A worktree would also strand Step 4's `test:` commits off the branch the rest
 * of `/ship` (Steps 6-13) operates on, which is the opposite of what this step is for.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE — AND THE JOIN RE-CHECK IS NOT THIS SCRIPT'S
 * -----------------------------------------------------------------------------
 * Every decision arrives pre-made. Both member prompts are rendered IN FULL by the
 * `ship` skill, in the orchestrator's own turn, before this script runs: the residual
 * scope left by Stage 11 / `VERIFICATION.md`, the base branch, the diff range, the plan
 * path, the coverage thresholds from CLAUDE.md, and every instruction either member
 * follows. This script passes those two strings through untouched, writes no prompt text
 * of its own, and cannot patch up anything missing from them. It picks no model and no
 * effort of its own, classifies nothing, and re-derives no status. Model/effort routing is
 * decided caller-side by `model-route.mjs` and arrives as `args.routing` data — a missing
 * `routing` (or a missing entry) means both members inherit the session's.
 *
 * Most importantly: the STALE-DIFF RE-CHECK AT THE JOIN IS NOT PERFORMED HERE and this
 * script must never attempt it. Step 5 reads the diff as it stood at dispatch, so an item
 * it judged NOT DONE *solely because a test was missing* may have been covered by a test
 * Step 4 committed while Step 5 was still running. Re-reading those items against what
 * Step 4 actually committed, and deciding whether each one flips, is caller-turn judgment
 * that requires the diff, the commits, and the skill's own honesty rules (Step 5.4:
 * conservative with DONE, generous with CHANGED, prefer UNVERIFIABLE). This script has no
 * filesystem access, cannot read a commit, and would have to invent the comparison. It
 * therefore returns both members' results VERBATIM and stops. `ship` performs the
 * re-check in its own turn before Step 6, exactly as its SKILL says.
 *
 * Likewise NOT decided here: whether to STOP on NOT DONE items (Step 5.5), how to answer
 * the coverage gate's questions (Step 4.7), and what Step 6 reviews as ship-generated
 * delta. Those are the skill's, from the returned results.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * step4Prompt  string  REQUIRED. The COMPLETE, already-rendered prompt for the Test
 *                       Coverage Audit subagent (ship Step 4, including its Step 0
 *                       residual-scope narrowing and its Step 7 coverage gate). Passed
 *                       through untouched.
 * step5Prompt  string  REQUIRED. The COMPLETE, already-rendered prompt for the Plan
 *                       Completion Audit subagent (ship Step 5, including its Step 0
 *                       `VERIFICATION.md` reuse rules and the plan path, or the
 *                       instruction to report no plan file). Passed through untouched.
 *
 * Both are required because this is a PAIR by definition: a one-member run is the inline
 * `Agent` case in the skill's routing table, not a degraded Workflow run.
 *
 * routing      object  optional. `{ 'coverage-auditor': {model?, effort?},
 *                       'plan-verifier': {model?, effort?} }` — decided caller-side by
 *                       `plugins/dk/bin/model-route.mjs --batch` and forwarded verbatim.
 *                       Each opts builder spreads its key's entry first; a missing key or
 *                       a missing `routing` arg leaves `model`/`effort` absent entirely
 *                       (inherit the session model), never defaulted.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { step4|null, step5|null, missingMembers[], membersNeedingDecision[], next_action }
 * — see the bottom of this file. Both member results are returned exactly as they came
 * back; nothing is merged, reconciled, or re-judged.
 */

export const meta = {
  name: "ship-audit-pair",
  description:
    "ship Steps 4+5 as a concurrent pair: the Test Coverage Audit (the pair's only writer — generated coverage tests, `test:` commits) and the read-only Plan Completion Audit. Barrier only: both prompts are pre-rendered by the ship skill and both results come back verbatim. The join's stale-diff re-check stays in the skill's turn.",
  whenToUse:
    "Called by skills/ship/SKILL.md after Step 3's test run, once both member prompts are rendered. Always 2 members, so always a Workflow. Step 6 does not start until this returns and the skill has run its own join re-check.",
  phases: [
    {
      title: "Audit pair",
      detail: "Step 4 coverage audit (writer) and Step 5 plan-completion audit (read-only), in parallel",
    },
    { title: "Barrier", detail: "both back; results returned verbatim for the skill's join" },
  ],
};

const PHASE_PAIR = "Audit pair";
const PHASE_BARRIER = "Barrier";

// Mirrors what `skills/ship/SKILL.md` Step 4 documents this member producing: the ASCII
// coverage diagram with reused-vs-newly-audited entries (step 5), the `test:` commits it
// made (steps 4 and 6), and the step-7 coverage gate's outcome — the one place Step 4 can
// hand a question back to the operator. The contract is prose, not JSON, so this schema
// stays MINIMAL: it asserts only the fields the ship skill actually consumes downstream
// (the PR body's `## Test Coverage` section and Step 6's ship-generated-delta split).
// `additionalProperties` is left OPEN deliberately — a member that also reports percentages,
// per-path tables, or the "already audited by nyquist-auditor" short-circuit must not be
// rejected and turned into a phantom coverage gap.
const COVERAGE_AUDIT_SCHEMA = {
  type: "object",
  required: ["coverageDiagram", "coverageGate"],
  properties: {
    coverageDiagram: {
      type: "string",
      description:
        "Step 4.5's ASCII coverage diagram (code paths + user flows, TESTED/GAP per branch, overall percentage, reused-vs-newly-audited marked), or its documented substitutes: 'All new code paths have test coverage ✓', or the Step 0 short-circuit line when nyquist-auditor already covered every phase. Goes verbatim into the PR body's ## Test Coverage section.",
    },
    coverageGate: {
      type: "string",
      enum: ["pass", "ask", "skipped"],
      description:
        "Step 4.7's outcome. 'pass' = at or above target. 'ask' = between minimum and target, or below minimum — the operator must choose (generate more / ship anyway / mark intentionally uncovered / explicit override); the member never decides this itself. 'skipped' = test-only diff or undeterminable percentage.",
    },
    gateQuestion: {
      type: "string",
      description:
        "When coverageGate is 'ask': the exact question to put to the operator, with the measured and required percentages. Answered in the caller's turn, never here.",
    },
    testCommits: {
      type: "array",
      items: { type: "string" },
      description:
        "The `test: ...` commits this member actually made (Step 4.4 regression rule and Step 4.6 generated tests). This is ship's own generated delta — Step 6 reviews it in full, so it must arrive named, not inferred from the log.",
    },
    remainingGaps: {
      type: "array",
      items: { type: "string" },
      description:
        "Paths left uncovered — a generated test that still failed after one fix and was reverted (Step 4.6), or a path beyond the residual-scope caps.",
    },
  },
};

// Mirrors `skills/ship/SKILL.md` Step 5: the five status values from step 3, the three
// verifiability classes from step 2, the 50-item cap from step 1, the
// '(reused from VERIFICATION.md)' tag from step 0, and the 'No plan file detected.' branch.
// Minimal on purpose — the skill's contract is a prose checklist, so only the fields the
// join and the PR body consume are asserted. `additionalProperties` stays open.
const PLAN_COMPLETION_SCHEMA = {
  type: "object",
  required: ["planFound", "items"],
  properties: {
    planFound: {
      type: "boolean",
      description:
        "False when no plan file was detected — the member's documented skip branch ('No plan file detected.'), which is a real answer, not a failure to return.",
    },
    planPath: {
      type: "string",
      description: "The plan file audited, when one was found.",
    },
    items: {
      type: "array",
      // Step 5.1 caps extraction at 50 actionable items; the same cap applies here so the
      // two cannot disagree. Empty when planFound is false.
      maxItems: 50,
      items: {
        type: "object",
        required: ["item", "status"],
        properties: {
          item: { type: "string", description: "The actionable plan item, as written." },
          status: {
            type: "string",
            enum: ["DONE", "PARTIAL", "NOT DONE", "CHANGED", "UNVERIFIABLE"],
            description: "Step 5.3's five classifications, verbatim. Never collapsed or re-judged here.",
          },
          verifiability: {
            type: "string",
            enum: ["DIFF-VERIFIABLE", "CROSS-REPO", "EXTERNAL-STATE"],
            description: "Step 5.2's classification.",
          },
          evidence: {
            type: "string",
            description:
              "Cited files for DONE, the difference for CHANGED, the specific manual check for UNVERIFIABLE, the reason for NOT DONE/PARTIAL.",
          },
          missingTestOnly: {
            type: "boolean",
            description:
              "True when this item was judged NOT DONE/PARTIAL SOLELY because a test was missing. This is the flag the ship skill's join re-check reads against Step 4's `test:` commits — the re-check itself happens in the skill's turn, not in this script.",
          },
          reusedFromVerification: {
            type: "boolean",
            description:
              "Step 5.0's '(reused from VERIFICATION.md)' tag — status taken on trust from verifier/converge rather than verified by this member.",
          },
        },
      },
    },
    completionChecklist: {
      type: "string",
      description:
        "The rendered completion checklist for the PR body's ## Plan Completion section (Step 5.5).",
    },
  },
};

// ── Eager arg validation ───────────────────────────────────────────────────────────────
// Everything below throws BEFORE the first phase()/dispatch. Half a pair is not a degraded
// run of this script — it is the inline Agent case in the skill's routing table, and
// letting it through here would return a Step 6 hand-off that looks complete while one of
// the two audits was never dispatched at all.
const { step4Prompt, step5Prompt } = args;

if (typeof step4Prompt !== "string" || step4Prompt.trim() === "") {
  throw new Error(
    "ship-audit-pair: args.step4Prompt is required — the COMPLETE pre-rendered Test Coverage Audit prompt. This script writes no prompt text of its own and cannot reconstruct it.",
  );
}
if (typeof step5Prompt !== "string" || step5Prompt.trim() === "") {
  throw new Error(
    "ship-audit-pair: args.step5Prompt is required — the COMPLETE pre-rendered Plan Completion Audit prompt. This script writes no prompt text of its own and cannot reconstruct it.",
  );
}

// Opts builders. Keys that are absent are OMITTED, never defaulted: no `agentType` — both
// members are general subagents driven entirely by the prompt the ship skill rendered for
// them. `model`/`effort` come only from `args.routing`'s matching key, spread first so an
// absent `routing` (or absent key) leaves both keys absent (inherit the session's).
function coverageOpts() {
  return {
    ...(args.routing?.["coverage-auditor"] ?? {}),
    label: "ship-audit-pair:step4-coverage",
    phase: PHASE_PAIR,
    schema: COVERAGE_AUDIT_SCHEMA,
  };
}

function planOpts() {
  return {
    ...(args.routing?.["plan-verifier"] ?? {}),
    label: "ship-audit-pair:step5-plan-completion",
    phase: PHASE_PAIR,
    schema: PLAN_COMPLETION_SCHEMA,
  };
}

phase(PHASE_PAIR);
log(
  "ship-audit-pair: dispatching 2 members concurrently — Step 4 Test Coverage Audit (the pair's only writer: generated coverage tests, `test:` commits) and Step 5 Plan Completion Audit (read-only over the plan file, VERIFICATION.md and the diff). Both prompts were rendered by the ship skill and are passed through untouched.",
);

// Thunks, never live promises: `parallel()` is the barrier and never rejects — a failed
// thunk yields null, which is handled as a coverage gap below, not as an exception.
const [step4, step5] = await parallel([
  () => agent(step4Prompt, coverageOpts()),
  () => agent(step5Prompt, planOpts()),
]);

phase(PHASE_BARRIER);

// ── Coverage gaps ──────────────────────────────────────────────────────────────────────
// A member that did not return is NOT a member that found nothing. Each drop is named,
// loudly, with what it means for the caller.
const missingMembers = [];
if (!step4) {
  const reason =
    "COVERAGE GAP: Step 4 Test Coverage Audit did not return — coverage was NOT audited";
  missingMembers.push({ member: "step4-coverage", reason });
  log(
    `${reason}. NOT covered: residual-scope narrowing against VERIFICATION.md, changed-codepath tracing, ` +
      "user-flow and error-state mapping, the mandatory regression rule, generated coverage tests, and the " +
      "Step 7 coverage gate. No coverage diagram exists for the PR body, and any `test:` commits it may have " +
      "made before dying are unreported — check the log before Step 6 treats the delta as reviewed. " +
      "Re-dispatch this member.",
  );
}
if (!step5) {
  const reason =
    "COVERAGE GAP: Step 5 Plan Completion Audit did not return — plan completion was NOT audited";
  missingMembers.push({ member: "step5-plan-completion", reason });
  log(
    `${reason}. NOT covered: extraction and classification of the plan's actionable items, the ` +
      "VERIFICATION.md reuse pass, and the NOT DONE stop condition. This is NOT the same as " +
      "'no plan file detected', which is a returned result. Re-dispatch this member.",
  );
}

// ONE drop is not fatal: the member that DID return is a real, actionable result, and
// throwing it away would cost a whole audit the operator could already be acting on.
// BOTH dropped means neither audit ran — nothing to hand Step 6 — so that throws.
if (!step4 && !step5) {
  throw new Error(
    "ship-audit-pair: both members failed — no coverage audit and no plan-completion audit. Nothing was checked; re-run before Step 6.",
  );
}

// ── Returned-but-blocked, named separately from died ───────────────────────────────────
// A member that came back asking the operator a question is a SUCCESSFUL run with a
// documented outcome; it never merges into missingMembers. What to answer is the ship
// skill's decision (Step 4.7's gate options, Step 5.5's finish/defer/drop), not this
// script's.
const membersNeedingDecision = [];
if (step4 && step4.coverageGate === "ask") {
  membersNeedingDecision.push({
    member: "step4-coverage",
    reason: "coverage gate returned 'ask' — the operator must choose per ship Step 4.7",
    question: step4.gateQuestion || "coverage below target; see the coverage diagram",
  });
}
if (step5 && step5.planFound) {
  // Step 5.5 only stops on NOT DONE. PARTIAL items whose `missingTestOnly` flag is set may
  // still flip to DONE once the caller's join re-check compares them against Step 4's
  // `test:` commits — that re-check has not happened yet when this list is built, so those
  // items are excluded here rather than handed to the skill as an already-final stop
  // condition.
  const notDone = (step5.items || []).filter((i) => i && i.status === "NOT DONE");
  if (notDone.length > 0) {
    membersNeedingDecision.push({
      member: "step5-plan-completion",
      reason: `${notDone.length} plan item(s) NOT DONE — ship Step 5.5 stops and asks (finish now / defer explicitly / drop)`,
      items: notDone.map((i) => i.item),
    });
  }
}

// Mechanical selection, first match wins. No model call, no re-derivation. Every branch
// hands the decision back to the ship skill's turn.
let next_action;
if (!step4) next_action = "re-dispatch the Step 4 coverage audit: it did not return";
else if (!step5) next_action = "re-dispatch the Step 5 plan-completion audit: it did not return";
else next_action = "run the join re-check in the ship skill's turn, then Step 6";

if (step4) {
  log(
    `Step 4 coverage audit: gate=${step4.coverageGate} | ${(step4.testCommits || []).length} \`test:\` commit(s) | ` +
      `${(step4.remainingGaps || []).length} remaining gap(s).`,
  );
}
if (step5) {
  const items = step5.items || [];
  const staleCandidates = items.filter((i) => i && i.missingTestOnly === true).length;
  log(
    `Step 5 plan completion: planFound=${step5.planFound} | ${items.length} item(s) | ` +
      `${staleCandidates} item(s) flagged NOT DONE/PARTIAL solely for a missing test.`,
  );
}
log(
  `ship-audit-pair barrier reached (${missingMembers.length} member(s) missing, ${membersNeedingDecision.length} awaiting an operator decision). next_action: ${next_action}. ` +
    "REMINDER FOR THE CALLER: this script did NOT re-check Step 5's missing-test items against Step 4's " +
    "`test:` commits. Step 5 read the diff as it stood at dispatch. That re-check is the ship skill's own " +
    "turn, before Step 6.",
);

return {
  // Member 1's result, VERBATIM — the coverage diagram, the gate outcome, and the `test:`
  // commits Step 6 must review as ship-generated delta. null means it did not return at
  // all (see missingMembers), never "it found nothing".
  step4: step4 || null,
  // Member 2's result, VERBATIM — including `missingTestOnly` on each item, which is the
  // input to the caller's join re-check. null means it did not return; `planFound: false`
  // is a returned result and a different fact entirely.
  step5: step5 || null,
  // Members that died. Named separately from members that returned asking a question: a
  // dead audit and an audit reporting a problem must never merge into one bucket.
  missingMembers,
  // Members that RETURNED and are blocked on an operator decision. The ship skill answers
  // these in its own turn; nothing here decides them.
  membersNeedingDecision,
  // Mechanically selected above. The join re-check it points at is the caller's, not this
  // script's.
  next_action,
};
