/**
 * review-finders — Stage A of one adversarial review round: fan the read-only finder
 * lenses out against a single frozen SHA, normalize every lens onto one severity ladder,
 * and compute the round's CONSOLIDATED stop signal.
 *
 * Invoked by `skills/code-review-protocol/SKILL.md` Part 3, Stage A, whenever the round's
 * roster holds 2 or more lenses — which round 1 always does (all five fire in round 1, by
 * design: later rounds then confirm rather than discover). The same script also serves
 * Stage D re-find, where the caller passes the NARROWED roster of lenses that are still
 * active (see LENS RETIREMENT). A Stage D re-find that narrows to a single lens does NOT
 * come here: that is a plain inline `Agent` call, because a Workflow for one agent is pure
 * overhead.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * frozenSha    string   REQUIRED. The Stage 0 pinned head commit. Every lens reviews THIS
 *                       tree and no other. Finders reading different trees produce findings
 *                       that cannot be reconciled — the same defect at a shifted line number
 *                       reads as two defects, and a defect the sweep already fixed reads as
 *                       live (SKILL Part 3, Stage 0).
 * phaseDir     string   REQUIRED. The phase directory (`PHASE/`) every lens derives its own
 *                       report path from. Passed as a path only; the script never resolves,
 *                       globs, or creates it — it has no filesystem access.
 * round        integer  REQUIRED. The round number, 1..6. Used in labels, in log lines, and
 *                       in the coverage-gap text. `code-review-gate` also needs it to run in
 *                       round mode at all (its `round` input is what selects that mode).
 * rosterIsFull boolean  REQUIRED. `true` when this round dispatched EVERY lens the phase is
 *                       eligible for; `false` when it dispatched a narrowed/active-only
 *                       roster. This is the soundness guard on exit — see THE SOUNDNESS
 *                       GUARD ON EXIT below. The caller knows the eligible set (it decides
 *                       whether `ui-auditor` applies at all); the script cannot derive it,
 *                       and must never try.
 * roster       array    REQUIRED, length >= 2. One entry per lens to dispatch:
 *   entry.lens    string  REQUIRED. One of "code-review-gate" | "qa" | "security-auditor" |
 *                         "verifier" | "ui-auditor". Any other name is rejected before
 *                         dispatch (see EAGER VALIDATION).
 *   entry.inputs  object  REQUIRED. That lens's own documented inputs, verbatim:
 *     code-review-gate  { branch, diffBase, priorRoundsGlob }
 *                       `branch` names a live git ref and cannot be derived (see
 *                       `agents/code-review-gate.md` <mode_selection>); `diffBase` and
 *                       `priorRoundsGlob` are paths/refs only.
 *     qa                { appUrl }
 *     security-auditor  { threatModelPath }
 *     verifier          { planPath, phaseGoal }
 *     ui-auditor        { uiSpecPath }   — optional; omit to let the agent fall back to the
 *                       6-pillar standards per `agents/ui-auditor.md`.
 * routing      object   optional. `{ <lens>: {model?, effort?} }` — decided caller-side by
 *                       `model-route.mjs --batch` and forwarded verbatim.
 *                       KEYED PER LENS, by the lens's own bare agentType — exactly the five
 *                       names `lens` itself takes: `code-review-gate`, `qa`,
 *                       `security-auditor`, `verifier`, `ui-auditor`. These are five
 *                       DISTINCT agent types with distinct config pins (three of them on
 *                       `agent-model-tiers.md`'s never-downgrade list), so per
 *                       `references/model-routing.md` §7 each is its own ROLE and gets its
 *                       own descriptor — not one shared `finder` entry. The caller builds
 *                       one descriptor per lens in the round's roster;
 *                       `skills/code-review-protocol/SKILL.md` Part 3 Stage A names the
 *                       same five keys. A missing key or a missing `routing` arg leaves
 *                       `model`/`effort` absent entirely for that lens (inherit the session
 *                       model), never defaulted — see MODEL below.
 *
 * -----------------------------------------------------------------------------
 * SEVERITY NORMALIZATION — one ladder across all five lenses
 * -----------------------------------------------------------------------------
 * The five lenses speak five different severity vocabularies, so a stop signal taken from
 * any one of them is blind to the other four. Every lens therefore returns, ON TOP OF its
 * own native fields (nothing native is removed):
 *
 *   severity: { P0, P1, P2, P3, P4 }   // blocking = P0..P2, advisory = P3..P4
 *   indeterminate: int                 // checks the lens could NOT complete —
 *                                      // not clean, and not a finding either
 *
 * The mapping is INSTRUCTED IN THE DISPATCH PROMPT, never applied here and never written
 * into the five agent .md files (each agent keeps owning its own native contract):
 *
 *   code-review-gate  native P0..P4 pass through unchanged; indeterminate = 0.
 *   qa                Critical->P0, High->P1, Medium->P2, Low->P3.
 *                     indeterminate = flows it could not exercise at all.
 *   ui-auditor        BLOCKER->P1, medium (WARNING)->P2, low/Minor (BELOW BAR)->P3.
 *                     indeterminate = its "Needs Human Review" items.
 *   security-auditor  each OPEN threat -> P0 when it has a demonstrated exploit path,
 *                     else P1. COULD_NOT_VERIFY -> indeterminate, NEVER severity 0:
 *                     a threat it could not check is not a threat it cleared.
 *   verifier          goal gaps do NOT map to severity at all — they are missing
 *                     functionality, routed out of the findings set as build work at
 *                     Stage B. severity is all-zero; indeterminate = 1 when status is
 *                     `human_needed`, else 0.
 *
 * That table is the `SEVERITY_MAPPING` constant below, and that constant is the ONLY copy
 * that ever reaches an agent — the prompt builder emits it verbatim. Editing it changes the
 * dispatched instruction and this documented contract together, so the two cannot drift.
 *
 * -----------------------------------------------------------------------------
 * THE CONSOLIDATED STOP — computed HERE, mechanically
 * -----------------------------------------------------------------------------
 * This is the one arithmetic the script owns, and it is arithmetic only — no judgment:
 *
 *   blockingOpen      = sum over RETURNED lenses of (P0 + P1 + P2)
 *   advisoryOpen      = sum over RETURNED lenses of (P3 + P4)
 *   indeterminateOpen = sum over RETURNED lenses of indeterminate
 *   stopLoop          = blockingOpen == 0 AND indeterminateOpen == 0
 *                       AND missingLenses is empty AND rosterIsFull === true
 *
 * Hard guards, each preventing a specific way a loop declares victory it did not earn:
 *  - A lens in `missingLenses` forces stopLoop FALSE — never null, never true. A lens that
 *    DIED is not a lens that found nothing; its coverage is simply absent from the round.
 *  - `indeterminateOpen > 0` forces stopLoop FALSE. Indeterminate is not clean: an
 *    unverifiable threat, an unreachable flow and a human-review item are all open
 *    questions, and a loop that exits on them exits on an unanswered question.
 *  - A returned lens whose `severity`/`indeterminate` is missing or non-numeric counts as
 *    ONE indeterminate check, not as zeros. A malformed roll-up must never read as clean.
 *  - `code-review-gate`'s own `stop_loop` is ADVISORY INPUT ONLY now. It is returned as
 *    `gateStopLoop` for traceability, and a disagreement with the computed value is logged
 *    loudly. The consolidated value wins, always: the gate sees only its own lens.
 *
 * -----------------------------------------------------------------------------
 * LENS RETIREMENT (dormancy) — per round, driven by the two returned lists
 * -----------------------------------------------------------------------------
 * A lens that reports zero blocking findings AND zero indeterminate checks is CLEAN, and a
 * clean lens goes DORMANT: the caller does not re-dispatch it next round. That is the point
 * — rounds shrink, and the loop stops paying five lenses to confirm a CSS fix.
 *
 * The script hands back both halves already split, so the caller re-derives nothing:
 *   cleanLenses   — went clean this round; sit the next round out.
 *   activeLenses  — must be re-dispatched: anything still blocking or indeterminate, PLUS
 *                   every lens in `missingLenses` (a lens that dropped has not been cleared
 *                   of anything).
 * The script still does not CHOOSE the next roster — roster membership stays a caller
 * decision, expressed here purely as `args.roster`. These two lists are inputs to that
 * decision, not the decision.
 *
 * -----------------------------------------------------------------------------
 * THE SOUNDNESS GUARD ON EXIT — why a narrowed all-clear is not an exit
 * -----------------------------------------------------------------------------
 * Dormancy buys speed by trading away coverage, and the trade is only safe INSIDE the loop.
 * A lens that went dormant in round 1 never saw the code rounds 2..n wrote; its silence in
 * the final round is silence about a tree it never read. So:
 *
 *   stopLoop can be true ONLY on a round where rosterIsFull === true.
 *
 * When a NARROWED round comes back all-clear, the script returns `needsConfirmingRound:
 * true` and logs that the caller must run ONE final FULL-roster round against the final SHA
 * before exiting. This is the one place the design deliberately spends a whole round: the
 * alternative is declaring victory on stale evidence, and a round is far cheaper than a
 * blocker shipped because the lens that would have caught it was asleep.
 *
 * Advisory-only endings are not the script's call either. When every stop condition holds
 * but P3/P4 findings remain, `needsOperatorDecision` is true: the caller must ASK whether to
 * sweep them or accept them. Never loop again on advisory-only; never exit silently.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision this round makes was already made by the CALLER, in its own turn, before
 * this script was invoked:
 *
 * - WHICH lenses run. Both the conditional `ui-auditor` lens ("only when the phase shipped
 *   UI", SKILL Stage A) and Stage D's narrowing to the previous round's `activeLenses` are
 *   CALLER decisions, expressed here purely as ROSTER MEMBERSHIP. The script has no "did
 *   this phase ship UI?" branch and no "should this lens wake up?" branch, and must never
 *   grow one. A lens is in `args.roster` or it is not dispatched — that is the whole rule.
 *   Likewise `rosterIsFull` is ASSERTED by the caller, not inferred from roster length: only
 *   the caller knows how many lenses this phase is eligible for.
 * - WHAT each lens reads. Branch, diff base, app URL, threat model path, plan path, phase
 *   goal, UI spec path all arrive pre-resolved in `entry.inputs` and are passed through
 *   verbatim. The script resolves no path and derives no default.
 * - WHAT the freeze is. `frozenSha` is pinned in Stage 0 by the caller.
 * - WHAT the findings MEAN. Triage (Stage B) is a barrier with NO agents in it and it stays
 *   with the orchestrator: dedupe by defect class (not by report line), classify every test
 *   failure before it becomes fix work, and route `verifier`'s `gaps_found` out of the
 *   findings set as build work. None of those three may ever enter this script — each is a
 *   judgment call whose failure mode (three tracks editing one file; a fixer weakening an
 *   assertion to make a bad test pass; a bug-fixer asked to implement a feature) is exactly
 *   what Stage B exists to prevent. This script reports and counts; the orchestrator triages.
 *
 * Counting is not triage: the roll-up sums what each lens said about ITSELF, and never
 * dedupes across lenses. One defect seen by three lenses counts three times here, which is
 * correct for a stop signal (any nonzero blocks) and wrong for a worklist — that is exactly
 * why Stage B's dedupe stays with the orchestrator.
 *
 * Model/effort routing is decided caller-side by `model-route.mjs` and arrives as
 * `args.routing` data — this script never picks a model or effort itself.
 *
 * The one thing the script does assert is mechanical, not judgment: `qa` is dispatched with
 * `report_only: true` UNCONDITIONALLY, and full mode is never emitted. That is not a policy
 * choice made here — it is a stated invariant of the owning skill. SKILL Part 3, Stage A,
 * "The write hazard": in full mode the `qa` agent bootstraps a test framework, fixes bugs,
 * and commits; that is a WRITER, and a writer inside Stage A mutates the tree the other
 * lenses are reviewing. The framework is settled once before the loop opens, and `qa` stays
 * in `report_only` every round. There is no arg to turn this off, and adding one would
 * reintroduce the hazard the invariant exists to remove.
 *
 * -----------------------------------------------------------------------------
 * NO ISOLATION — none of these 5 lenses needs `isolation: 'worktree'`
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used for ANY lens. Every finder in Stage A is
 * READ-ONLY against `frozenSha`, and each writes exactly one artifact: its own report, at
 * its own path (`code-review-gate` → `round-<n>/findings.json` + `findings.md`; `qa` →
 * its dated QA report; `security-auditor` → `SECURITY.md`; `verifier` → `VERIFICATION.md`;
 * `ui-auditor` → `UI-REVIEW.md`). No member commits, and no two members write the same
 * file, so there is no concurrent mutation to isolate — the whole point of Part 3 is that
 * finding and fixing never overlap, and only the Stage C sweep writes code. A worktree
 * would additionally strand every report off the main tree, buying a merge step and a
 * ~200-500ms + disk cost per lens for no benefit.
 *
 * -----------------------------------------------------------------------------
 * MODEL — this script picks none itself, for ALL FIVE lenses
 * -----------------------------------------------------------------------------
 * This script hardcodes no `model` key anywhere. `model`/`effort` come only from
 * `args.routing[<lens>]` (see ARGS CONTRACT), spread into that lens's opts before
 * `agentType`; a missing `routing` (or missing entry for this lens) leaves both keys absent,
 * i.e. "inherit the session model" (T0 in `references/agent-model-tiers.md` — "inherit (no
 * `model:` key). Default for everything"). Four of the five — `code-review-gate`,
 * `security-auditor`, `verifier`, `ui-auditor` — are on that document's explicit
 * **never-downgrade** list: they feed a gate that can block a phase, milestone or ship, and
 * observed cost is stated there as not sufficient reason to move any of them off T0.
 * `model-route.mjs` itself honors that never-downgrade floor (`model-routing.md` §1: "Per-
 * agent pins in config outrank signal scoring") — and because the lookup is PER LENS, each
 * of those pins is applied to the lens it actually belongs to rather than being averaged
 * into one shared entry. That is the reason for the per-lens keying: a single `finder` key
 * would force one decision across five agents whose pins genuinely differ. `qa` is not
 * named on the never-downgrade list, but it carries no `model:` key in its own frontmatter
 * either, so an absent routing entry preserves ITS declared tier too (the tiers doc's
 * precedence: explicit call param → agent frontmatter → session). This script itself never
 * adds, guesses, or overrides any of that — it only forwards data.
 *
 * `effort` follows the same path: nothing in the roster contract carries one, and this
 * script does not invent reasoning effort the caller did not ask for — only what
 * `args.routing[<lens>].effort` supplies, if anything.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read this before running
 * -----------------------------------------------------------------------------
 * Each lens dispatches with `agentType` set to the lens name itself, bare
 * (`"code-review-gate"`, `"qa"`, `"security-auditor"`, `"verifier"`, `"ui-auditor"`), so
 * that `agents/<lens>.md` stays the single source of truth for that lens's methodology and
 * output contract. The prompts built below carry ONLY each agent's documented *inputs* plus
 * the severity-normalization instruction, and deliberately do not duplicate its procedure.
 * What is NOT verified is how a plugin-namespaced agent resolves by bare type in every
 * install. If a bare name does not resolve, pass the plugin-qualified escape hatch instead:
 * `"dev-kit-core:<lens>"` (e.g. `"dev-kit-core:code-review-gate"`).
 *
 * -----------------------------------------------------------------------------
 * RETURNS — see the commented return literal at the foot of this file
 * -----------------------------------------------------------------------------
 * {
 *   round, frozenSha, rosterIsFull, lenses, missingLenses, cleanLenses, activeLenses,
 *   blockingOpen, advisoryOpen, indeterminateOpen, gateStopLoop, stopLoop,
 *   needsConfirmingRound, needsOperatorDecision
 * }
 */

export const meta = {
  name: "review-finders",
  description:
    "Stage A of a review round: fan out the read-only finder lenses against one frozen SHA, normalize every lens onto the P0..P4 ladder, and compute the consolidated stop signal plus the clean/active lens split. Also serves Stage D re-find with a narrowed roster. Triage (Stage B) stays with the caller.",
  whenToUse:
    "Called by the code-review-protocol skill when the round's roster holds 2 or more lenses — which round 1 always does. A Stage D re-find narrowed to a single lens is a plain inline Agent call instead, because a Workflow for one agent is pure overhead.",
  // Static literal, one entry per phase() call, titles matching exactly.
  phases: [
    { title: "Find", detail: "all rostered lenses in parallel, read-only, against the frozen SHA" },
  ],
};

const PHASE_TITLE = "Find";

// The five finder lenses named in SKILL Part 3, Stage A. This map exists so an unknown lens
// name is rejected HERE — the same way plan-review rejects an unknown lens — instead of
// being dispatched into a missing-agent failure that would come back as a coverage gap and
// be mistaken for a lens that ran and found nothing.
const LENSES = ["code-review-gate", "qa", "security-auditor", "verifier", "ui-auditor"];

// Every lens returns at least the path to the report it wrote. That path is the durable
// artifact of Stage A; the structured fields below it are the roll-up Stage B triages from.
const CORE_RESULT_PROPERTIES = {
  reportPath: { type: "string", description: "Path to the report this lens wrote." },
};

// The uniform contract EVERY lens carries on top of its own native fields. Native fields are
// kept as-is: this is an addition, never a replacement — the normalized numbers drive the
// stop signal, and the native fields are what Stage B triages from.
const NORMALIZED_PROPERTIES = {
  severity: {
    type: "object",
    description:
      "This lens's findings mapped onto the shared P0..P4 ladder per the mapping instructed in the dispatch prompt. Blocking = P0+P1+P2; advisory = P3+P4. Counts, not lists.",
    required: ["P0", "P1", "P2", "P3", "P4"],
    properties: {
      P0: { type: "integer", description: "Blocking, most severe." },
      P1: { type: "integer", description: "Blocking." },
      P2: { type: "integer", description: "Blocking." },
      P3: { type: "integer", description: "Advisory — never blocks the loop on its own." },
      P4: { type: "integer", description: "Advisory — never blocks the loop on its own." },
    },
  },
  indeterminate: {
    type: "integer",
    description:
      "Checks this lens could NOT complete — a threat it could not verify, a flow it could not exercise, an item needing human judgment. Not clean and not a finding: it holds the loop open on its own.",
  },
};

// The severity mapping table, stated once. This constant is the ONLY copy that reaches an
// agent — buildPrompt() emits it verbatim — so the header's SEVERITY NORMALIZATION section
// and the dispatched instruction cannot drift apart: there is nothing to keep in sync.
const SEVERITY_MAPPING = {
  "code-review-gate": [
    "Your native P0..P4 counts pass through UNCHANGED: `severity` is exactly your `counts`.",
    "`indeterminate` = 0.",
  ],
  qa: [
    "Critical -> P0, High -> P1, Medium -> P2, Low -> P3. Nothing maps to P4.",
    "`indeterminate` = the number of flows you could NOT exercise at all. A flow you could not run is not a flow that passed.",
  ],
  "ui-auditor": [
    "BLOCKER -> P1, medium (WARNING) -> P2, low / Minor (BELOW BAR) -> P3. Nothing maps to P0 or P4.",
    "`indeterminate` = your `## Needs Human Review` item count — the same number you report as `needsHumanReview`.",
  ],
  "security-auditor": [
    "Each OPEN threat -> P0 when you have a demonstrated exploit path for it, else P1.",
    "COULD_NOT_VERIFY -> `indeterminate`, NEVER severity 0. A threat you could not check is not a threat you cleared.",
  ],
  verifier: [
    "Goal gaps do NOT map to severity at all — they are missing functionality, routed out of the findings set as build work during triage. Return `severity` all-zero: P0..P4 = 0, however many gaps you found.",
    "`indeterminate` = 1 when your status is `human_needed`, else 0.",
  ],
};

// Per-lens result schemas, one per lens, each mirroring that agent's own documented output
// contract field for field, PLUS the two normalized fields every lens now carries.
// `additionalProperties` is left OPEN on every one of them: a stray extra key from an agent
// must not fail validation and cost us an entire lens for the round — a dropped lens is a
// coverage gap, and a coverage gap is expensive.
const LENS_SCHEMAS = {
  // agents/code-review-gate.md <round_mode_mechanics> steps 7-8 + <write_findings>: the
  // canonical findings.json contract (path, counts P0..P4, stop_loop).
  "code-review-gate": {
    type: "object",
    required: ["reportPath", "findingsPath", "stopLoop", "counts", "severity", "indeterminate"],
    properties: {
      ...CORE_RESULT_PROPERTIES,
      ...NORMALIZED_PROPERTIES,
      findingsPath: {
        type: "string",
        description: "Path to the canonical findings.json — the file the other lenses merge into at Stage B.",
      },
      stopLoop: {
        type: "boolean",
        description:
          "The findings.json `stop_loop` value: true iff counts.P0 == 0 AND counts.P1 == 0 AND previously_seen_classes is empty (or all resolved). ADVISORY INPUT ONLY — this lens sees only its own findings, so the loop's actual stop signal is the consolidated value this script computes across every lens. Returned as `gateStopLoop` for traceability.",
      },
      counts: {
        type: "object",
        required: ["P0", "P1", "P2", "P3", "P4"],
        properties: {
          P0: { type: "integer" },
          P1: { type: "integer" },
          P2: { type: "integer" },
          P3: { type: "integer" },
          P4: { type: "integer" },
        },
      },
    },
  },
  // agents/qa.md Phase 10 (Report) + the Health Score Rubric: issue count and the weighted
  // score. `healthScore` is a STRING because the agent reports it as a rendered value
  // (and, in regression mode, as a "baseline → final" delta), not as a bare number.
  qa: {
    type: "object",
    required: ["reportPath", "issuesFound", "healthScore", "severity", "indeterminate"],
    properties: {
      ...CORE_RESULT_PROPERTIES,
      ...NORMALIZED_PROPERTIES,
      issuesFound: { type: "integer", description: "Total issues found. report_only mode: found, never fixed." },
      healthScore: { type: "string", description: "The weighted health score as the agent reports it." },
    },
  },
  // agents/security-auditor.md OPEN_THREATS block: the Closed / Open / Could Not Verify
  // split. `couldNotVerify` is carried separately from `openThreats` on purpose — a threat
  // the auditor could not check is NOT a threat it cleared, and collapsing the two would
  // hand Stage B a clean-looking set that is actually indeterminate. It maps to
  // `indeterminate`, never to a severity zero.
  "security-auditor": {
    type: "object",
    required: ["reportPath", "openThreats", "couldNotVerify", "severity", "indeterminate"],
    properties: {
      ...CORE_RESULT_PROPERTIES,
      ...NORMALIZED_PROPERTIES,
      openThreats: { type: "integer", description: "Threats whose declared mitigation was NOT found in code." },
      couldNotVerify: {
        type: "integer",
        description: "Threats that could not be verified at all (missing file, inaccessible codebase, ambiguous pattern). Not cleared — these are the lens's `indeterminate` count.",
      },
    },
  },
  // agents/verifier.md Step 9 decision tree + "Return to Orchestrator": the three-value
  // status and the gap count. `human_needed` is a distinct value and never a pass.
  verifier: {
    type: "object",
    required: ["reportPath", "status", "gaps", "severity", "indeterminate"],
    properties: {
      ...CORE_RESULT_PROPERTIES,
      ...NORMALIZED_PROPERTIES,
      status: { type: "string", enum: ["passed", "gaps_found", "human_needed"] },
      gaps: {
        type: "integer",
        description:
          "Gaps blocking goal achievement. These are missing FUNCTIONALITY, not defects — Stage B routes them out of the findings set and back to build work, which is why they carry no severity.",
      },
    },
  },
  // agents/ui-auditor.md <structured_returns>: the recommendation counts, including the
  // `needs_human_review` tally that its own `## Needs Human Review` section must agree with —
  // and that is also this lens's `indeterminate` count.
  "ui-auditor": {
    type: "object",
    required: ["reportPath", "findings", "needsHumanReview", "severity", "indeterminate"],
    properties: {
      ...CORE_RESULT_PROPERTIES,
      ...NORMALIZED_PROPERTIES,
      findings: { type: "integer", description: "Total findings (priority fixes + minor recommendations)." },
      needsHumanReview: {
        type: "integer",
        description: "Findings flagged needs_human_review: true — deferred to the milestone-level design review, not settled here.",
      },
    },
  },
};

const { frozenSha, phaseDir, round, rosterIsFull, roster: rawRoster } = args;

// EAGER VALIDATION — throw with actionable messages BEFORE any phase() or dispatch. A
// malformed contract must cost zero agent calls.
if (!frozenSha) {
  throw new Error(
    "review-finders: `frozenSha` is required — the Stage 0 pinned head commit every lens reviews. Without it the lenses read whatever HEAD happens to be, and findings from different trees cannot be reconciled at Stage B.",
  );
}
if (!phaseDir) {
  throw new Error("review-finders: `phaseDir` is required — the PHASE/ directory each lens derives its report path from.");
}
if (!Number.isInteger(round)) {
  throw new Error(
    `review-finders: \`round\` is required and must be an integer (got ${JSON.stringify(round)}). code-review-gate needs it to run in round mode at all.`,
  );
}
// Required and strictly boolean: a missing or truthy-ish value must not be coerced into
// "yes, full roster", because that is the assertion the loop's exit rests on.
if (typeof rosterIsFull !== "boolean") {
  throw new Error(
    `review-finders: \`rosterIsFull\` is required and must be a boolean (got ${JSON.stringify(rosterIsFull)}). It asserts whether this round dispatched EVERY lens the phase is eligible for; only the caller knows that set. stopLoop can only be true on a full-roster round, so this may never be guessed here.`,
  );
}
if (!Array.isArray(rawRoster)) {
  throw new Error("review-finders: `roster` is required and must be an array of { lens, inputs } entries.");
}
for (const entry of rawRoster) {
  if (!entry || !entry.lens) {
    throw new Error("review-finders: every roster entry needs a `lens` name. Valid lenses: " + LENSES.join(", ") + ".");
  }
  if (!LENSES.includes(entry.lens)) {
    throw new Error(
      `review-finders: unknown lens "${entry.lens}". Valid lenses: ${LENSES.join(", ")}. Roster membership is the caller's decision — a typo here would silently under-review the round.`,
    );
  }
}
const dupes = rawRoster.map((e) => e.lens).filter((l, i, a) => a.indexOf(l) !== i);
if (dupes.length > 0) {
  throw new Error(
    `review-finders: lens listed more than once in the roster: ${[...new Set(dupes)].join(", ")}. One dispatch per lens per round — two dispatches of one lens write the same report path.`,
  );
}
if (rawRoster.length < 2) {
  throw new Error(
    `review-finders: needs a roster of 2 or more lenses (got ${rawRoster.length}). Round 1 always rosters 2+; a Stage D re-find narrowed to a single lens is a plain inline Agent call, not a Workflow.`,
  );
}

const roster = rawRoster.map((entry) => ({ lens: entry.lens, inputs: entry.inputs || {} }));

/**
 * Per-lens prompt builders. INPUTS ONLY — `agents/<lens>.md` owns the procedure, the
 * methodology and the output contract, and none of it is restated here. Each builder emits
 * the frozen SHA, the phase dir, the round, and that lens's own documented inputs, nothing
 * more. An absent optional input is simply omitted rather than emitted as an empty value,
 * so the agent falls back to its own documented default.
 */
const PROMPT_INPUTS = {
  "code-review-gate": (i) => {
    const lines = [`- round: ${round}`];
    if (i.branch) lines.push(`- branch: ${i.branch}`);
    if (i.diffBase) lines.push(`- diff base: ${i.diffBase}`);
    if (i.priorRoundsGlob) lines.push(`- prior rounds: ${i.priorRoundsGlob}`);
    return lines;
  },
  qa: (i) => {
    const lines = [];
    if (i.appUrl) lines.push(`- app URL: ${i.appUrl}`);
    // UNCONDITIONAL, and there is no arg that can turn it off. See "the write hazard" in the
    // header: full mode bootstraps a framework, fixes bugs and COMMITS, which would mutate
    // the tree the other lenses are reviewing mid-round. Mechanical, not a judgment call.
    lines.push("- report_only: true");
    return lines;
  },
  "security-auditor": (i) => (i.threatModelPath ? [`- threat model: ${i.threatModelPath}`] : []),
  verifier: (i) => {
    const lines = [];
    if (i.planPath) lines.push(`- plan: ${i.planPath}`);
    if (i.phaseGoal) lines.push(`- phase goal: ${i.phaseGoal}`);
    return lines;
  },
  "ui-auditor": (i) => (i.uiSpecPath ? [`- UI spec: ${i.uiSpecPath}`] : []),
};

function buildPrompt(entry) {
  const lines = [
    `You are one finder lens in round ${round} of an adversarial review loop. Review the tree at the frozen commit ${frozenSha} and nothing else.`,
    "",
    "Inputs:",
    `- frozen SHA: ${frozenSha}`,
    `- phase dir: ${phaseDir}`,
    ...PROMPT_INPUTS[entry.lens](entry.inputs),
    "",
    // The uniform contract. The loop's stop signal is computed by summing these across every
    // lens, so a lens that omits them or folds an unfinished check into a zero silently votes
    // "clean" on work it never did.
    "Severity normalization — REQUIRED, on top of every native field your own contract already defines (return both; nothing native is dropped):",
    "- `severity`: { P0, P1, P2, P3, P4 } — integer counts on the shared ladder. Blocking = P0+P1+P2; advisory = P3+P4.",
    "- `indeterminate`: integer — checks you could NOT complete. Not clean, not a finding. Never fold an incomplete check into a zero.",
    "Your mapping onto that ladder:",
    ...SEVERITY_MAPPING[entry.lens].map((rule) => `- ${rule}`),
    "",
    "This is a READ-ONLY pass. Write only your own report at your own path — do not fix anything, do not commit, and do not modify any implementation file. Other lenses are reviewing this same tree concurrently.",
    "Follow your own procedure and output contract exactly, at full depth. You are non-interactive: never wait for a user.",
  ];
  return lines.join("\n");
}

// Opts builder. `model`/`effort` come only from `args.routing[entry.lens]`, spread first —
// the routing key is the lens's own bare agentType (`code-review-gate` | `qa` |
// `security-auditor` | `verifier` | `ui-auditor`), one descriptor per lens, because the five
// lenses are five distinct agent types with distinct config pins (see the MODEL section in
// the header and model-routing.md §7). An absent `routing` (or no entry for this lens) means
// both stay OMITTED entirely, i.e. inherit. `label`, `phase` and `schema` are always set;
// `agentType` is the lens name itself and always wins over anything routing carries under
// that key (routing never sets `agentType`).
function buildOpts(entry) {
  return {
    ...(args.routing?.[entry.lens] ?? {}),
    label: `r${round}/${entry.lens}`,
    phase: PHASE_TITLE,
    agentType: entry.lens,
    schema: LENS_SCHEMAS[entry.lens],
  };
}

phase(PHASE_TITLE);
log(
  `review-finders round ${round}: ${roster.length} lens(es) against frozen SHA ${frozenSha} — ${roster
    .map((e) => e.lens)
    .join(", ")}. rosterIsFull=${rosterIsFull}. All read-only; only the Stage C sweep writes.`,
);

// Thunks, never live promises. `parallel()` is the barrier and never rejects; a failed thunk
// yields null. There is exactly one parallel() call because Stage A is one fan-out: the
// lenses are independent, so nothing here is sequenced.
const raw = await parallel(roster.map((entry) => () => agent(buildPrompt(entry), buildOpts(entry))));

const returned = [];
const missingLenses = [];
raw.forEach((result, i) => {
  const lens = roster[i].lens;
  if (result) {
    returned.push({ lens, ...result });
  } else {
    missingLenses.push(lens);
    // A dropped lens is NEVER a clean lens. Silence here would read as full coverage.
    log(
      `COVERAGE GAP: the "${lens}" lens did NOT review round ${round}, this round's triage set is missing that lens, and it stays in activeLenses. stopLoop is forced false for this round.`,
    );
  }
});

if (returned.length === 0) {
  throw new Error(
    `review-finders: every lens failed in round ${round} — nothing was reviewed at ${frozenSha}. Do not proceed to Stage B triage; re-dispatch the round.`,
  );
}

// Read one lens's normalized roll-up. A count that is absent or not a non-negative integer is
// NOT read as zero: it is counted as one indeterminate check, so a malformed roll-up holds the
// loop open instead of voting "clean" on a lens whose numbers nobody can read.
function normalize(result) {
  const count = (value) => (Number.isInteger(value) && value >= 0 ? value : null);
  const severity = result.severity || {};
  const ladder = ["P0", "P1", "P2", "P3", "P4"].map((key) => count(severity[key]));
  const indeterminate = count(result.indeterminate);
  const malformed = ladder.some((value) => value === null) || indeterminate === null;
  const [p0, p1, p2, p3, p4] = ladder.map((value) => value ?? 0);
  return {
    blocking: p0 + p1 + p2,
    advisory: p3 + p4,
    // A malformed roll-up costs exactly one indeterminate check — enough to hold the loop
    // open, without inventing a finding count nobody reported.
    indeterminate: (indeterminate ?? 0) + (malformed ? 1 : 0),
    malformed,
  };
}

let blockingOpen = 0;
let advisoryOpen = 0;
let indeterminateOpen = 0;
const cleanLenses = [];
const activeLenses = [];

returned.forEach((result) => {
  const rollup = normalize(result);
  if (rollup.malformed) {
    log(
      `MALFORMED ROLL-UP: "${result.lens}" returned a severity/indeterminate roll-up that is missing or non-numeric. Counted as indeterminate, never as clean — this lens stays active and stopLoop is forced false.`,
    );
  }
  blockingOpen += rollup.blocking;
  advisoryOpen += rollup.advisory;
  indeterminateOpen += rollup.indeterminate;
  // Dormancy rule: zero blocking AND zero indeterminate is clean. Advisory-only findings do
  // NOT keep a lens awake — they are settled by the operator at the end, not by another round.
  if (rollup.blocking === 0 && rollup.indeterminate === 0) {
    cleanLenses.push(result.lens);
  } else {
    activeLenses.push(result.lens);
  }
});

// A lens that DROPPED has been cleared of nothing, so it must be re-dispatched. Appended
// rather than merged: the two lists are disjoint by construction (a lens either returned or
// it did not), so this cannot duplicate an entry.
missingLenses.forEach((lens) => activeLenses.push(lens));

returned.forEach((r) => {
  const native =
    r.lens === "code-review-gate"
      ? `gate stop_loop ${r.stopLoop} | P0 ${r.counts?.P0} P1 ${r.counts?.P1} P2 ${r.counts?.P2} P3 ${r.counts?.P3} P4 ${r.counts?.P4} | findings.json ${r.findingsPath}`
      : r.lens === "qa"
        ? `${r.issuesFound} issue(s) | health ${r.healthScore}`
        : r.lens === "security-auditor"
          ? `${r.openThreats} open threat(s), ${r.couldNotVerify} could-not-verify`
          : r.lens === "verifier"
            ? `${r.status} | ${r.gaps} gap(s)`
            : `${r.findings} finding(s), ${r.needsHumanReview} need human review`;
  const rollup = normalize(r);
  log(
    `${r.lens}: ${native} | normalized blocking ${rollup.blocking}, advisory ${rollup.advisory}, indeterminate ${rollup.indeterminate} | report ${r.reportPath}`,
  );
});

// -----------------------------------------------------------------------------
// THE CONSOLIDATED STOP. Arithmetic only — every term above was reported by a lens.
// -----------------------------------------------------------------------------
// GUARD: a missing lens forces false. A lens that died is not a lens that found nothing.
// GUARD: indeterminateOpen > 0 forces false. Indeterminate is not clean.
// GUARD: rosterIsFull false forces false. A narrowed round's silence covers only the lenses
//        that ran; the dormant ones never read the code the later sweeps wrote.
const allClear = blockingOpen === 0 && indeterminateOpen === 0 && missingLenses.length === 0;
const stopLoop = allClear && rosterIsFull === true;

// A narrowed round that came back clean has EARNED an exit but cannot take one. The caller
// owes the loop one final full-roster round against the final SHA.
const needsConfirmingRound = allClear && rosterIsFull !== true;

// Every stop condition holds, but P3/P4 remain. Not the script's call and not another round's:
// the operator decides sweep-or-accept. Never loop again on advisory-only, never exit silently.
const needsOperatorDecision = stopLoop && advisoryOpen > 0;

const gate = returned.find((r) => r.lens === "code-review-gate");
const gateStopLoop = gate ? gate.stopLoop : null;

// code-review-gate's own stop_loop is advisory input now. Log the disagreement loudly: it is
// almost always the gate seeing only its own lens while another lens still has work open.
if (gate && gateStopLoop !== stopLoop) {
  log(
    `STOP-SIGNAL DISAGREEMENT in round ${round}: code-review-gate says stop_loop ${gateStopLoop}, the consolidated signal across all ${returned.length} returned lens(es) says ${stopLoop}. The CONSOLIDATED value wins — the gate sees only its own findings. Consolidated inputs: blocking ${blockingOpen}, indeterminate ${indeterminateOpen}, missing ${missingLenses.length}, rosterIsFull ${rosterIsFull}.`,
  );
}
if (!gate) {
  log(
    `code-review-gate produced no result in round ${round}, so gateStopLoop is null. That no longer decides anything on its own — but it IS a missing lens, which forces the consolidated stopLoop to false.`,
  );
}

log(
  `Round ${round} consolidated: blocking ${blockingOpen} | advisory ${advisoryOpen} | indeterminate ${indeterminateOpen} | missing ${missingLenses.length} | rosterIsFull ${rosterIsFull} => stopLoop ${stopLoop}.`,
);
log(
  `Lens retirement: clean (dormant next round) — ${cleanLenses.length > 0 ? cleanLenses.join(", ") : "none"}; active (re-dispatch) — ${activeLenses.length > 0 ? activeLenses.join(", ") : "none"}.`,
);
if (needsConfirmingRound) {
  log(
    `CONFIRMING ROUND REQUIRED: round ${round} came back all-clear on a NARROWED roster, so it cannot close the loop. Every lens that went dormant earlier is clean only about a tree the later sweeps have since rewritten. Run ONE final round with the FULL roster (rosterIsFull: true) against the final SHA before exiting.`,
  );
}
if (needsOperatorDecision) {
  log(
    `OPERATOR DECISION REQUIRED: full-roster round ${round} is clean of blocking and indeterminate work, but ${advisoryOpen} advisory (P3/P4) finding(s) remain. ASK whether to sweep them or accept them. Do not open another round on advisory-only work, and do not exit silently.`,
  );
}
log(
  `Round ${round} Stage A barrier reached: ${returned.length}/${roster.length} lens(es) returned. Stage B (triage) is the orchestrator's next action and runs with NO agents: dedupe by defect class, classify every test failure, route verifier gaps out to build work — then cut Stage C tracks from the deduped set.`,
);

// The caller's worklist. Enough input is echoed that the worklist is self-describing without
// re-deriving anything, and the failure list is named separately from the results so a lens
// that DIED can never merge with a lens that ran and reported.
return {
  // Echoed: which round these findings belong to.
  round,
  // Echoed: the tree every returned finding is against. A finding is only meaningful paired
  // with the SHA it was found at.
  frozenSha,
  // Echoed: the caller's assertion that this round dispatched every eligible lens. It is the
  // precondition on stopLoop, so it is returned alongside the verdict it gates.
  rosterIsFull,
  // One entry per lens that RETURNED, tagged with its lens. Each is that lens's own
  // self-report — un-cross-checked here, because cross-checking is Stage B's job.
  lenses: returned,
  // One entry per lens that DROPPED. Named separately and never folded into `lenses`: this
  // round's triage set is missing that lens's coverage entirely, which is a different state
  // from a lens that ran and found nothing. Non-empty forces stopLoop false.
  missingLenses,
  // Lenses with zero blocking and zero indeterminate this round: they go DORMANT and are not
  // re-dispatched next round. Handed back split so the caller re-derives nothing.
  cleanLenses,
  // Lenses that must be re-dispatched next round: still blocking, still indeterminate, or
  // dropped entirely. The caller builds the next roster from this list.
  activeLenses,
  // Sum across returned lenses of P0+P1+P2. Not deduped across lenses — correct for a stop
  // signal (any nonzero blocks), which is why the worklist still comes from Stage B's dedupe.
  blockingOpen,
  // Sum across returned lenses of P3+P4. Never blocks the loop; drives needsOperatorDecision.
  advisoryOpen,
  // Sum across returned lenses of indeterminate — checks nobody could complete. Holds the
  // loop open exactly as blocking work does.
  indeterminateOpen,
  // code-review-gate's own stop_loop, kept for traceability only. ADVISORY: when it disagrees
  // with `stopLoop` the disagreement is logged and the consolidated value wins. `null` when
  // that lens dropped or was not rostered.
  gateStopLoop,
  // THE loop's stop signal, consolidated across every lens. True only when nothing is
  // blocking, nothing is indeterminate, no lens dropped, AND the roster was full.
  stopLoop,
  // True when a NARROWED round came back all-clear: the caller must run one final full-roster
  // round against the final SHA before exiting. Not an exit, and not a failure either.
  needsConfirmingRound,
  // True when the round would close but P3/P4 advisory findings remain: stop and ASK the
  // operator to sweep or accept. Never another round on advisory-only, never a silent exit.
  needsOperatorDecision,
};
