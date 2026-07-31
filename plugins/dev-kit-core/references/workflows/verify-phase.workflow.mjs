/**
 * verify-phase — the phase verification wave, then converge, in ONE script with TWO phases.
 * =============================================================================
 * Owns exactly two things: (1) the read-only verification wave — verifier, plus the
 * eval-auditor and the integration-checker when the caller says those apply — and (2), after
 * that wave's barrier, the converge pass with the nyquist-auditor beside it IFF the verifier
 * came back reporting validation gaps. Nothing else: reading the reports, deciding what is
 * build work for step 8 versus sweep work, carrying eval BLOCKERs into remediation, and
 * handing ESCALATED integration items back — all of that stays in the caller's turn.
 *
 * Invoked by `plugins/dk/commands/verify/phase.md` (the `/dk:verify:phase` step) whenever the
 * wave has 2 or more members. There is exactly one 1-member shape — the milestone's FIRST
 * phase with NO AI eval contract, i.e. verifier alone — and that shape routes to a plain
 * inline `Agent` call in the command, never here; this script throws on it rather than run a
 * Workflow for one agent (see the eager validation below).
 *
 * -----------------------------------------------------------------------------
 * WHY THIS IS A SCRIPT AT ALL — the in-script conditional
 * -----------------------------------------------------------------------------
 * The nyquist-auditor dispatch depends on a value that does not exist until the verifier has
 * already returned: `validation_gaps` in VERIFICATION.md's frontmatter (verifier Step 6d, and
 * its own "Return to Orchestrator" block, which says to dispatch nyquist-auditor with exactly
 * that list). Written as prose, that condition is a thing an orchestrator has to remember to
 * re-read after a barrier, mid-turn, under context pressure. Here it is a barrier plus an
 * `if` over a returned field: the wave joins, phase 2 reads `verify.validation_gaps`, and the
 * dispatch either happens or is logged as not-dispatched with the count that decided it.
 * That conditional is the point of this conversion; the two conditions that DON'T depend on a
 * returned value (`hasEvalContract`, `isFirstPhase`) arrive pre-decided in `args`.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision arrives pre-made in `args` or is made inside a member agent/skill:
 *   - WHETHER step 6 wrote an AI eval contract for this phase, and WHETHER this is the
 *     milestone's first phase — decided by the CALLER, and passed as two booleans. This
 *     script cannot check either: the workflow runtime has no filesystem access, so it can
 *     neither stat an AI-SPEC.md nor list the milestone's phases. A file-existence
 *     precondition belongs in the owning asset's turn, and that is where it stayed.
 *   - WHICH paths each member reads or writes — each agent derives its own artifact paths
 *     from the doc-sitemap contract (verifier's `<role>`, integration-checker's `<inputs>`,
 *     eval-auditor's `<input>`, converge's "File Locations"). This script resolves, defaults
 *     and globs NOTHING; `planPath` is passed through verbatim when the caller supplies it,
 *     as the documented override it is.
 *   - WHAT counts as a gap, a BLOCKER, an UNVERIFIED finding, a COULD NOT DETERMINE
 *     dimension, a caveated pass or a justified SKIP — decided INSIDE the member that
 *     reports it. This script re-derives none of it and downgrades none of it.
 *   - WHAT to do about any of it — decided by the CALLER (`/dk:verify:phase`, then
 *     `/dk:verify:remediate`). This script returns the reports and the failure lists; it
 *     recommends nothing.
 * The only computation performed here is `validation_gaps.length > 0`, a member count, and
 * mechanical enum reads for the two failure lists. No model call is involved in any of them.
 * Model/effort routing is decided caller-side by `model-route.mjs` and arrives as
 * `args.routing` data — this script never picks a model or effort itself.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * phase           string   REQUIRED. The phase id (`<NN>`). Used in labels, logs, and every
 *                          member prompt. Never parsed for paths.
 * hasEvalContract boolean  REQUIRED, and must be a real boolean — `true` iff step 6 wrote an
 *                          AI eval contract (AI-SPEC.md) for this phase, which is a
 *                          file-existence fact only the CALLER can establish. Adds the
 *                          eval-auditor member. Omitting it is NOT the same as `false`: a
 *                          missing flag would silently drop a member from a wave whose
 *                          summary still comes back looking complete, so it throws.
 * isFirstPhase    boolean  REQUIRED, same rule. `true` on the milestone's first phase, which
 *                          SKIPS the integration-checker (cross-phase wiring needs ≥2 phases
 *                          to mean anything). `false` adds that member.
 * planPath        string   optional. The phase's PLAN.md. Passed to the converge member (its
 *                          PLAN input, the file it appends convergence tasks to) and into the
 *                          nyquist-auditor's `<required_reading>`. NOT passed to the verifier
 *                          or the integration-checker: both derive their own plan paths and
 *                          may have several plans across waves/tracks, and an explicit single
 *                          path there would narrow what they read while looking like context.
 * branch          string   optional. The branch the working tree is on. Context for the two
 *                          tree-inspecting members' reports only — no member checks out,
 *                          switches or compares branches, and this script never touches git.
 * routing         object   optional. `{ verifier: {model?, effort?}, 'eval-auditor':
 *                          {model?, effort?}, 'integration-checker': {model?, effort?},
 *                          converge: {model?, effort?}, 'nyquist-auditor': {model?,
 *                          effort?} }` — decided caller-side by
 *                          `model-route.mjs --batch` and forwarded verbatim.
 *                          Each opts builder spreads its member's key first; a missing key
 *                          or a missing `routing` arg leaves `model`/`effort` absent
 *                          entirely (inherit the session model), never defaulted.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read before running
 * -----------------------------------------------------------------------------
 * The three agent members dispatch through the `AGENT_TYPES` map below (bare names
 * "verifier", "eval-auditor", "integration-checker", "nyquist-auditor") so each agent's own
 * `.md` stays the single source of truth for its procedure and output contract; the prompts
 * built below carry ONLY each agent's documented INPUTS and never restate its steps. If a
 * bare name does not resolve in a given install, edit the corresponding `AGENT_TYPES` entry
 * to the plugin-qualified form (`"dev-kit-core:verifier"`,
 * `"dev-kit-data-ai:eval-auditor"`). There is deliberately no per-run override arg: the
 * roster is fixed by the two booleans, not by agent-type shopping. The converge member sets
 * NO `agentType` at all — it is a general subagent that invokes the `dev-kit-core:converge`
 * skill on itself, so that skill's full instructions load inside that subagent instead of in
 * the orchestrator's context (the same self-injection `plan-gate.workflow.mjs` uses for
 * `analyze`).
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used: no member commits, and the writers are
 * disjoint. Wave 1 — verifier writes PHASE/VERIFICATION.md, eval-auditor writes
 * PHASE/reviews/EVAL-REVIEW.md, integration-checker is read-only (its tools are Read, Bash,
 * Grep, Glob). Phase 2 — converge appends one `## Phase N: Convergence` section to a PLAN.md
 * and is forbidden from touching anything else, while nyquist-auditor writes test
 * files/fixtures and VERIFICATION.md's `validation_gaps` entries.
 *
 * That last pair is the one real overlap, and it is handled in the prompt, not by a worktree:
 * converge reads VERIFICATION.md as pre-confirmed evidence while nyquist may be editing that
 * file's `validation_gaps` entries. The converge prompt below tells it to take the
 * goal-level findings as evidence and to NOT consume `validation_gaps` — that list is the
 * test-coverage axis, which verifier itself documents as independent of the goal verdict and
 * which is nyquist's to own. A worktree would not help here anyway: it would strand the
 * appended tasks and the new tests off the operator's checkout.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { phase, branch, verify, evalAudit, integration, converge, nyquist, validationGapCount,
 *   nyquistDispatched, notDispatchedByCondition[], notDispatchedUnknown[], diedMembers[],
 *   blockedMembers[] }
 * — see the bottom of this file. `diedMembers` (returned nothing at all) and
 * `blockedMembers` (returned a legitimate blocked/escalated/human-needed verdict) are
 * separate lists on purpose and are never merged; `notDispatchedByCondition` is a third,
 * distinct thing — a member the CALLER's booleans or the verifier's own empty gap list ruled
 * out, which is not a coverage gap at all. `notDispatchedUnknown` is the FOURTH and exists so
 * that last sentence stays true: a member whose condition could not be evaluated (the verifier
 * died, so `validation_gaps` is unknown rather than empty) IS a coverage gap, and filing it
 * beside the genuinely-ruled-out members would let an unknown read as a decided nothing.
 */

export const meta = {
  name: "verify-phase",
  description:
    "Phase verification in two phases: the read-only wave (verifier + eval-auditor when there is an AI eval contract + integration-checker when this is not the first phase), a barrier, then converge with nyquist-auditor beside it iff the verifier reported non-empty validation_gaps.",
  whenToUse:
    "Called by /dk:verify:phase when the wave has 2+ members. The one 1-member shape — first phase, no eval contract — is a plain inline verifier call in the command instead, and throws here.",
  phases: [
    {
      title: "Verify wave",
      detail: "verifier + conditional eval-auditor + conditional integration-checker, in parallel",
    },
    {
      title: "Converge",
      detail: "converge skill, plus nyquist-auditor only when verify reported validation gaps",
    },
  ],
};

const PHASE_WAVE = "Verify wave";
const PHASE_CONVERGE = "Converge";

// Bare agentType names. Edit here (see AGENT RESOLUTION above) if a bare name does not
// resolve in a given install — there is deliberately no args-level override. The converge
// member is absent from this map on purpose: it has no agentType.
const AGENT_TYPES = {
  verifier: "verifier",
  evalAuditor: "eval-auditor",
  integrationChecker: "integration-checker",
  nyquistAuditor: "nyquist-auditor",
};

// Mirrors `agents/verifier.md` <output> field for field: the VERIFICATION.md frontmatter keys
// (status, score, gaps[], deferred[], human_verification[], validation_gaps[]) and the
// "Return to Orchestrator" block's **Report:** line, which is the only place that agent names
// the written report — hence `reportPath` rather than a frontmatter key.
// `additionalProperties` is left OPEN deliberately (as everywhere below): that frontmatter
// also carries phase/verified/overrides/overrides_applied/re_verification, and a stray extra
// key must never invalidate the whole result and cost us the verdict — which would then read
// as a coverage gap it is not.
// `validation_gaps` is REQUIRED here even though the agent's frontmatter emits it only when
// non-empty: phase 2's nyquist conditional reads this exact field, and "absent" and "empty"
// must not be the same wire value when a dispatch hangs off the difference. The prompt below
// asks for an explicit empty array. Note the snake_case: these are the agent's own key names
// (gap_id, task_id, gap_type, human_verification), not a re-spelling of them.
const VERIFIER_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["status", "score", "reportPath", "validation_gaps"],
  properties: {
    status: {
      type: "string",
      enum: ["passed", "gaps_found", "human_needed"],
      description:
        "The verifier's own verdict, taken verbatim. human_needed is never a pass — it is the agent's documented third outcome, not a softened one.",
    },
    score: { type: "string", description: 'Frontmatter `score`, the "N/M must-haves verified" string.' },
    reportPath: { type: "string", description: "Path to the written VERIFICATION.md." },
    gaps: {
      type: "array",
      description: "Frontmatter `gaps` — present only when status is gaps_found. Goal gaps, build work for step 8.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["truth", "status", "reason"],
        properties: {
          truth: { type: "string", description: "The observable truth that failed." },
          status: { type: "string", description: "The gap's own status field (e.g. failed)." },
          reason: { type: "string" },
          artifacts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
              required: ["path", "issue"],
              properties: { path: { type: "string" }, issue: { type: "string" } },
            },
          },
          missing: { type: "array", items: { type: "string" }, description: "Specific things to add/fix." },
        },
      },
    },
    deferred: {
      type: "array",
      description: "Frontmatter `deferred` (Step 9b) — truths addressed in a later phase. Not gaps.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["truth", "addressed_in"],
        properties: {
          truth: { type: "string" },
          addressed_in: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
    human_verification: {
      type: "array",
      description: "Frontmatter `human_verification` — present only when status is human_needed.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["test", "expected", "why_human"],
        properties: {
          test: { type: "string" },
          expected: { type: "string" },
          why_human: { type: "string" },
        },
      },
    },
    validation_gaps: {
      type: "array",
      description:
        "Frontmatter `validation_gaps` (Step 6d): requirements lacking automated test coverage. Explicitly [] when there are none. Independent of `status` per the agent's own note — a passed phase can still have gaps here, and that still dispatches nyquist-auditor below.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["gap_id", "task_id", "requirement", "gap_type"],
        properties: {
          gap_id: { type: "string", description: 'e.g. "VG1".' },
          task_id: { type: "string" },
          requirement: {
            type: "string",
            description: "Precise enough to write a behavioral test against — nyquist-auditor's input.",
          },
          gap_type: { type: "string", enum: ["no_test_file", "test_fails", "no_automated_command"] },
        },
      },
    },
  },
};

// Mirrors `agents/eval-auditor.md` field for field: <step name="score_dimensions"> (the four
// statuses), <step name="audit_infrastructure"> (the five components, ok/partial/missing),
// <step name="calculate_scores"> (coverage/infra/overall + the four verdict bands) and
// <step name="write_eval_review"> (the EVAL-REVIEW.md sections). `blockers` is that agent's
// own finding classification — "an eval dimension is MISSING or a guardrail is unimplemented"
// — carried as its own array because the caller's remediation pass is defined over exactly it.
// COULD NOT DETERMINE is a first-class dimension status here, never collapsed into MISSING or
// PARTIAL, exactly as that agent's <adversarial_stance> requires.
const EVAL_AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["overallScore", "verdict", "dimensions", "blockers"],
  properties: {
    overallScore: { type: "number", description: "(coverage x 0.6) + (infra x 0.4), 0-100." },
    verdict: {
      type: "string",
      enum: ["PRODUCTION READY", "NEEDS WORK", "SIGNIFICANT GAPS", "NOT IMPLEMENTED"],
      description: "The agent's own four bands (80-100 / 60-79 / 40-59 / 0-39). Never recomputed here.",
    },
    coverageScore: { type: "number", description: "covered/total x 100; total EXCLUDES COULD NOT DETERMINE." },
    infraScore: { type: "number", description: "The 5-component infrastructure score, 0-100." },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["dimension", "status"],
        properties: {
          dimension: { type: "string" },
          status: { type: "string", enum: ["COVERED", "PARTIAL", "MISSING", "COULD NOT DETERMINE"] },
          measurement: { type: "string", description: "Code / LLM Judge / Human." },
          finding: { type: "string" },
        },
      },
    },
    infrastructure: {
      type: "object",
      additionalProperties: true,
      description: "The five audited components, each ok/partial/missing.",
      properties: {
        tooling: { type: "string" },
        dataset: { type: "string" },
        cicd: { type: "string" },
        guardrails: { type: "string" },
        tracing: { type: "string" },
      },
    },
    blockers: {
      type: "array",
      items: { type: "string" },
      description:
        "One entry per MISSING dimension or unimplemented guardrail — the agent's BLOCKER tier. Empty array when none. PARTIAL items are its WARNING tier and do NOT belong here.",
    },
    reviewPath: { type: "string", description: "Path to the written EVAL-REVIEW.md." },
  },
};

// Mirrors `agents/integration-checker.md` <output> field for field: the four summary blocks
// (Wiring / API Coverage / Auth Protection / E2E Flows, each with its own Unverified count),
// the labelled Detailed Findings, and the Requirements Integration Map table. [UNVERIFIED] is
// a first-class label, never folded into BLOCKER or WARNING — a search-method limitation is
// not a confirmed break, and that distinction is the agent's, preserved here on the wire.
const INTEGRATION_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["wiring", "apiCoverage", "authProtection", "e2eFlows", "findings"],
  properties: {
    wiring: {
      type: "object",
      additionalProperties: true,
      required: ["connected", "orphaned", "missing", "unverified"],
      properties: {
        connected: { type: "integer", minimum: 0 },
        orphaned: { type: "integer", minimum: 0 },
        missing: { type: "integer", minimum: 0 },
        unverified: { type: "integer", minimum: 0 },
      },
    },
    apiCoverage: {
      type: "object",
      additionalProperties: true,
      required: ["consumed", "orphaned", "unverified"],
      properties: {
        consumed: { type: "integer", minimum: 0 },
        orphaned: { type: "integer", minimum: 0 },
        unverified: { type: "integer", minimum: 0 },
      },
    },
    authProtection: {
      type: "object",
      additionalProperties: true,
      required: ["protected", "unprotected"],
      properties: {
        protected: { type: "integer", minimum: 0 },
        unprotected: { type: "integer", minimum: 0 },
      },
    },
    e2eFlows: {
      type: "object",
      additionalProperties: true,
      required: ["complete", "broken", "unverified"],
      properties: {
        complete: { type: "integer", minimum: 0 },
        broken: { type: "integer", minimum: 0 },
        unverified: { type: "integer", minimum: 0 },
      },
    },
    findings: {
      type: "array",
      description:
        "Every Detailed Findings entry, each carrying its explicit label and the section it came from. An unlabelled finding is an incomplete finding, per the agent.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["label", "detail"],
        properties: {
          label: { type: "string", enum: ["BLOCKER", "WARNING", "UNVERIFIED"] },
          section: {
            type: "string",
            enum: [
              "Orphaned Exports",
              "Missing Connections",
              "Broken Flows",
              "Unprotected Routes",
              "Unverified Checks",
            ],
          },
          detail: { type: "string" },
        },
      },
    },
    requirementsIntegrationMap: {
      type: "array",
      description: "The REQ-ID wiring table. WIRED / PARTIAL / UNWIRED / UNVERIFIED, per the agent.",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["requirement", "status"],
        properties: {
          requirement: { type: "string" },
          integrationPath: { type: "string" },
          status: { type: "string", enum: ["WIRED", "PARTIAL", "UNWIRED", "UNVERIFIED"] },
          issue: { type: "string" },
        },
      },
    },
    requirementsWithNoCrossPhaseWiring: {
      type: "array",
      items: { type: "string" },
      description: "REQ-IDs living in a single phase with no integration touchpoints.",
    },
  },
};

// Mirrors `skills/converge/SKILL.md` field for field: §6's Convergence Findings columns (ID,
// Gap Type, Severity, Source, Target Plan, Evidence, Remaining Work), §7's two documented
// outcomes (`tasks_appended` / `converged`) and its append contract (task numbering under a
// `## Phase N: Convergence` header per plan file), and §8's handoff counts.
const CONVERGE_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["outcome", "findings", "tasksAppended"],
  properties: {
    outcome: {
      type: "string",
      enum: ["tasks_appended", "converged"],
      description:
        "`converged` means every PLAN.md was left byte-for-byte unchanged (no empty header), per the skill's own rule.",
    },
    tasksAppended: { type: "integer", minimum: 0, description: "0 exactly when outcome is `converged`." },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["id", "gapType", "severity", "source", "targetPlan"],
        properties: {
          id: { type: "string", description: 'e.g. "F1".' },
          gapType: {
            type: "string",
            enum: ["missing", "partial", "contradicts", "unrequested", "undetermined"],
          },
          severity: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
          source: { type: "string", description: "e.g. FR-008, SC-002, US1/AC2, Constitution II." },
          targetPlan: { type: "string", description: "The PLAN.md this finding's task was appended to." },
          evidence: { type: "string" },
          remainingWork: { type: "string" },
        },
      },
    },
    plansTouched: {
      type: "array",
      items: { type: "string" },
      description: "PLAN.md paths that gained a Convergence section. Empty when outcome is `converged`.",
    },
  },
};

// Mirrors `agents/nyquist-auditor.md` <step name="report"> and <structured_returns> field for
// field: the three outcome formats and the three record shapes. `skipped` is its own array
// because that agent is explicit that a justified SKIP is neither FILLED nor ESCALATED and
// must never be absorbed into either; `caveat` is nullable on a resolved gap because a
// caveated pass (WARNING tier) is not recorded identically to a clean pass.
const NYQUIST_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["outcome", "resolved", "escalated", "skipped"],
  properties: {
    outcome: {
      type: "string",
      enum: ["GAPS FILLED", "PARTIAL", "ESCALATE"],
      description:
        "GAPS FILLED only when every gap FILLED with zero skipped and zero escalated; ESCALATE only when zero resolved and none justifiably skipped; PARTIAL for every other mix.",
    },
    resolved: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["task_id", "requirement", "test_type", "automated_command", "file_path", "status"],
        properties: {
          task_id: { type: "string" },
          requirement: { type: "string" },
          test_type: { type: "string", description: "unit / integration / smoke." },
          automated_command: { type: "string" },
          file_path: { type: "string" },
          status: { type: "string" },
          caveat: {
            type: ["string", "null"],
            description: "Non-null exactly when the pass was caveated (WARNING tier); null on a clean pass.",
          },
        },
      },
    },
    escalated: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["task_id", "requirement", "reason"],
        properties: {
          task_id: { type: "string" },
          requirement: { type: "string" },
          reason: { type: "string" },
          debug_iterations: { type: "integer", minimum: 0 },
          last_error: { type: "string" },
        },
      },
    },
    skipped: {
      type: "array",
      description: 'The "could not attempt" tier. Empty array when none — never omitted to make a run look clean.',
      items: {
        type: "object",
        additionalProperties: true,
        required: ["task_id", "requirement", "justification"],
        properties: {
          task_id: { type: "string" },
          requirement: { type: "string" },
          justification: { type: "string" },
        },
      },
    },
    filesForCommit: { type: "array", items: { type: "string" }, description: "Test file paths written this run." },
  },
};

// ── Eager arg validation ───────────────────────────────────────────────────────────────
// Everything below throws BEFORE the first phase()/dispatch. A wave that runs with a member
// silently missing is worse than one that refuses to run: it returns a clean-looking set of
// reports for a check that was never performed.
const { phase: phaseId, hasEvalContract, isFirstPhase, planPath = null, branch = null } = args;

if (!phaseId) {
  throw new Error("verify-phase: args.phase is required (the phase id, `<NN>`).");
}
if (typeof hasEvalContract !== "boolean") {
  throw new Error(
    "verify-phase: args.hasEvalContract must be an explicit boolean — true iff step 6 wrote an AI eval contract " +
      "(AI-SPEC.md) for this phase. This script has no filesystem access and cannot check; the caller decides. " +
      "Omitting it is not the same as false: it would silently drop the eval-auditor from the wave.",
  );
}
if (typeof isFirstPhase !== "boolean") {
  throw new Error(
    "verify-phase: args.isFirstPhase must be an explicit boolean — true on the milestone's first phase, which skips " +
      "the integration-checker. This script cannot enumerate the milestone's phases; the caller decides. Omitting it " +
      "is not the same as false: it would silently drop the integration-checker from the wave.",
  );
}
if (planPath !== null && typeof planPath !== "string") {
  throw new Error("verify-phase: args.planPath, when present, must be a string path to the phase's PLAN.md.");
}
if (branch !== null && typeof branch !== "string") {
  throw new Error("verify-phase: args.branch, when present, must be a string branch name.");
}

// The routing rule, enforced: 2+ members reach this script, exactly 1 does not. The single
// 1-member shape is the milestone's first phase with no AI eval contract — verifier alone —
// and a Workflow for one agent is pure overhead, so it throws instead of running degraded.
const waveMemberCount = 1 + (hasEvalContract ? 1 : 0) + (isFirstPhase ? 0 : 1);
if (waveMemberCount < 2) {
  throw new Error(
    "verify-phase: the wave has exactly 1 member (first phase, no AI eval contract) — dispatch the verifier inline " +
      "per /dk:verify:phase's routing table instead of through a Workflow. If that is wrong, one of hasEvalContract / " +
      "isFirstPhase was passed incorrectly.",
  );
}

// ── Wave member 1: the verifier, inputs only ───────────────────────────────────────────
// `agents/verifier.md` owns the goal-backward procedure, the 4 verification levels, the
// severity contract and the VERIFICATION.md format. This prompt carries the phase id, the
// branch as context, and the one wire requirement the phase-2 conditional depends on.
function verifierPrompt() {
  const lines = [`Verify the goal and success criteria of phase ${phaseId}.`];
  if (branch) lines.push(`Branch under verification: ${branch} (context for your report — do not switch branches).`);
  lines.push(
    "",
    "This is the AUTHORITATIVE verification run for this phase. Derive your own artifact paths per your own " +
      "documented contract and follow your steps exactly and at full depth, including writing VERIFICATION.md. " +
      "DO NOT COMMIT. You are non-interactive: never wait for a user.",
    "",
    "Return the JSON matching the required schema. `validation_gaps` MUST be present and MUST be an explicit " +
      "empty array when no requirement lacks automated test coverage — a conditional dispatch downstream reads " +
      "that exact field, and an omitted list is not the same answer as an empty one. Per your own contract it is " +
      "independent of `status`: report it even when the status is `passed`.",
  );
  return lines.join("\n");
}

// ── Wave member 2 (conditional): the eval-auditor, inputs only ─────────────────────────
// `agents/eval-auditor.md` owns the scoring framework, the four dimension statuses, the
// 5-component infrastructure audit and the score arithmetic. Nothing of that is restated.
function evalAuditorPrompt() {
  return [
    `Audit the evaluation coverage of phase ${phaseId} against its AI-SPEC.md evaluation plan.`,
    "",
    "The caller has confirmed this phase has an AI eval contract. Resolve ai_spec_path, summary_paths and phase_dir " +
      "from your own documented defaults and follow your execution flow exactly, including writing EVAL-REVIEW.md.",
    "Score every planned dimension COVERED / PARTIAL / MISSING / COULD NOT DETERMINE — COULD NOT DETERMINE is its " +
      "own outcome and must never be collapsed into MISSING or PARTIAL. Return `blockers` as one entry per MISSING " +
      "dimension or unimplemented guardrail, and as an explicit empty array when there are none.",
    "DO NOT COMMIT. You are non-interactive: never wait for a user.",
  ].join("\n");
}

// ── Wave member 3 (conditional): the integration-checker, inputs only ──────────────────
// `agents/integration-checker.md` derives its paths from ids by its own explicit instruction,
// so this prompt passes the phase id and nothing path-shaped.
function integrationCheckerPrompt() {
  const lines = [
    `Run the cross-phase integration audit for the milestone up to and including phase ${phaseId} (the current, ` +
      "highest phase).",
  ];
  if (branch) lines.push(`Branch under verification: ${branch} (context for your report — do not switch branches).`);
  lines.push(
    "",
    "Derive every artifact path from ids per your own <inputs> contract and follow your verification process exactly. " +
      "Label every finding [BLOCKER], [WARNING] or [UNVERIFIED] — never fold [UNVERIFIED] into either of the others; " +
      "a search-method limitation is not a confirmed break. You are read-only, and non-interactive: never wait for a " +
      "user.",
  );
  return lines.join("\n");
}

// ── Phase-2 member: converge, via skill self-injection ─────────────────────────────────
// The subagent invokes the Skill tool ITSELF; the caller must not invoke it on the subagent's
// behalf, which would pull the whole converge SKILL into the orchestrator's context — exactly
// the weight this dispatch exists to keep out of it. Dispatched UNCONDITIONALLY: converge runs
// even when the verifier came back `passed` (that rule is the caller's, and this script's job
// is simply never to make the dispatch depend on the verdict).
function convergePrompt(verificationReportPath) {
  const lines = [
    `Your first action: invoke the Skill tool with skill: \`dev-kit-core:converge\` and follow it for phase ${phaseId}.`,
    "",
    "Inputs:",
  ];
  if (planPath) lines.push(`- PLAN: ${planPath}`);
  if (verificationReportPath) lines.push(`- VERIFICATION (fresh, written minutes ago in this same run): ${verificationReportPath}`);
  lines.push(
    "",
    "Resolve any input not listed above from the skill's own File Locations defaults.",
    "The verification report above is PRE-CONFIRMED EVIDENCE for your Step 2 — do not re-derive what it already " +
      "establishes — but still run your own full requirement-level sweep, since it only checks roadmap-level truths.",
    "Take its goal-level findings only. Do NOT consume its `validation_gaps` list: that is the test-coverage axis, " +
      "independent of the goal verdict, owned by the nyquist-auditor — which may be editing those very entries " +
      "concurrently with you right now, so treat that part of the file as unstable and out of your scope.",
    "Honor your APPEND-ONLY contract exactly: the only write is appending a `## Phase N: Convergence` section of new " +
      "<task> blocks to a PLAN.md. DO NOT COMMIT. You are non-interactive: never wait for a user.",
    "Return only the JSON matching the required schema (outcome, findings, tasksAppended, plansTouched).",
  );
  return lines.join("\n");
}

// ── Phase-2 member (conditional on a RETURNED value): the nyquist-auditor ──────────────
// Dispatched only when the verifier reported a non-empty `validation_gaps` — the one decision
// in this script that cannot be pre-made in the caller's turn, because the list does not exist
// until the wave's barrier has been crossed. The gaps are passed through VERBATIM.
function nyquistPrompt(gaps, verificationReportPath) {
  const lines = ["<gaps>", JSON.stringify(gaps, null, 2), "</gaps>", "", "<required_reading>"];
  if (planPath) lines.push(`- ${planPath}`);
  if (verificationReportPath) lines.push(`- ${verificationReportPath}`);
  lines.push(
    `- this phase's PLAN.md(s) and SUMMARY.md(s) for phase ${phaseId}, resolved by you if not listed above`,
    "</required_reading>",
    "",
    `Fill the validation gaps above for phase ${phaseId}. They came verbatim from the VERIFICATION.md that was ` +
      "written minutes ago in this same run.",
    "Implementation files are READ-ONLY: an implementation bug is an ESCALATE, never a fix. Every gap must resolve " +
      "to FILLED, ESCALATED, or an explicitly justified SKIP — return `skipped` and `escalated` as explicit arrays " +
      "(empty when none), and carry a non-null `caveat` on every caveated pass. A converge pass is appending tasks " +
      "to this phase's PLAN.md concurrently with you: do not edit any PLAN.md.",
    "DO NOT COMMIT. You are non-interactive: never wait for a user.",
  );
  return lines.join("\n");
}

// Opts builders. Keys that are absent are OMITTED, never defaulted — an omitted `model` means
// "inherit the session model", and the converge member has no `agentType` at all. `model`/
// `effort` come only from `args.routing[routingKey]`, spread first so a missing `routing` (or
// missing key) leaves both keys absent.
function agentOpts(label, phaseTitle, agentType, schema, routingKey) {
  return { ...(args.routing?.[routingKey] ?? {}), label, phase: phaseTitle, agentType, schema };
}

function convergeOpts() {
  return {
    ...(args.routing?.converge ?? {}),
    label: `verify-phase:${phaseId}:converge`,
    phase: PHASE_CONVERGE,
    schema: CONVERGE_RESULT_SCHEMA,
  };
}

// ── PHASE 1: the verify wave ───────────────────────────────────────────────────────────
// One wave, all members dispatched together, disjoint reports. The roster is fixed by the two
// booleans before the first dispatch — nothing is added or dropped mid-wave.
const waveUnits = [
  {
    key: "verify",
    label: "verifier",
    dispatch: () =>
      agent(
        verifierPrompt(),
        agentOpts(`verify-phase:${phaseId}:verifier`, PHASE_WAVE, AGENT_TYPES.verifier, VERIFIER_RESULT_SCHEMA, "verifier"),
      ),
    gap:
      "COVERAGE GAP: the verifier returned nothing (agent failed or was skipped). The phase goal is NOT verified, " +
      "no VERIFICATION.md was written this run, and the validation-gap list that decides the nyquist-auditor " +
      "dispatch is UNKNOWN — not empty. Re-run this member before treating the phase as verified.",
  },
];
// Ruled out by a condition that EVALUATED — the caller's booleans, or an empty gap list. Never
// a coverage gap.
const notDispatchedByCondition = [];
// Not dispatched because its condition could NOT be evaluated (its input died). Every entry
// here is a coverage gap and is logged as one; kept out of the list above so a caller reading
// only the structured return can never mistake an unknown for a decided nothing.
const notDispatchedUnknown = [];

if (hasEvalContract) {
  waveUnits.push({
    key: "evalAudit",
    label: "eval-auditor",
    dispatch: () =>
      agent(
        evalAuditorPrompt(),
        agentOpts(
          `verify-phase:${phaseId}:eval-auditor`,
          PHASE_WAVE,
          AGENT_TYPES.evalAuditor,
          EVAL_AUDIT_SCHEMA,
          "eval-auditor",
        ),
      ),
    gap:
      "COVERAGE GAP: the eval-auditor returned nothing (agent failed or was skipped). This phase's AI eval " +
      "coverage is NOT audited, no EVAL-REVIEW.md was written, and any eval BLOCKER that exists is unknown and " +
      "will therefore be missing from the remediation pass. Re-run this member.",
  });
} else {
  notDispatchedByCondition.push({
    member: "eval-auditor",
    reason: "hasEvalContract=false — the caller reports no AI eval contract (AI-SPEC.md) for this phase.",
  });
}

if (!isFirstPhase) {
  waveUnits.push({
    key: "integration",
    label: "integration-checker",
    dispatch: () =>
      agent(
        integrationCheckerPrompt(),
        agentOpts(
          `verify-phase:${phaseId}:integration-checker`,
          PHASE_WAVE,
          AGENT_TYPES.integrationChecker,
          INTEGRATION_RESULT_SCHEMA,
          "integration-checker",
        ),
      ),
    gap:
      "COVERAGE GAP: the integration-checker returned nothing (agent failed or was skipped). Cross-phase wiring is " +
      "NOT checked for this milestone: orphaned exports, uncalled API routes, unprotected sensitive routes and " +
      "broken E2E flows are all unknown. Re-run this member.",
  });
} else {
  notDispatchedByCondition.push({
    member: "integration-checker",
    reason: "isFirstPhase=true — cross-phase wiring needs at least two phases to mean anything.",
  });
}

phase(PHASE_WAVE);
log(
  `verify-phase ${phaseId}: dispatching ${waveUnits.length} wave member(s) in one message — ` +
    `${waveUnits.map((u) => u.label).join(", ")}` +
    (notDispatchedByCondition.length > 0
      ? ` | NOT DISPATCHED (by the caller's conditions, not a failure): ${notDispatchedByCondition
          .map((n) => `${n.member} (${n.reason})`)
          .join("; ")}`
      : ""),
);

// Thunks, never live promises: `parallel()` is the barrier and never rejects — a failed thunk
// yields null, handled as a coverage gap below rather than as an exception.
const waveResults = await parallel(waveUnits.map((u) => () => u.dispatch()));

// A member that did not return is NOT a member that found nothing.
const diedMembers = [];
const returned = {};
waveResults.forEach((result, i) => {
  const unit = waveUnits[i];
  if (result) {
    returned[unit.key] = result;
    return;
  }
  returned[unit.key] = null;
  diedMembers.push({ member: unit.label, phase: PHASE_WAVE, reason: unit.gap });
  log(unit.gap);
});

const verify = returned.verify || null;
const evalAudit = returned.evalAudit || null;
const integration = returned.integration || null;

if (verify) {
  log(
    `verifier: status=${verify.status} | score ${verify.score} | ${(verify.gaps || []).length} goal gap(s) | ` +
      `${(verify.human_verification || []).length} human-verification item(s) | ` +
      `${(verify.validation_gaps || []).length} validation gap(s) | ${verify.reportPath}`,
  );
}
if (evalAudit) {
  log(
    `eval-auditor: verdict ${evalAudit.verdict} (${evalAudit.overallScore}/100) | ` +
      `${(evalAudit.blockers || []).length} BLOCKER(s) | ` +
      `${(evalAudit.dimensions || []).filter((d) => d.status === "COULD NOT DETERMINE").length} dimension(s) ` +
      `COULD NOT DETERMINE | ${evalAudit.reviewPath || "no review path returned"}`,
  );
}
if (integration) {
  const findings = integration.findings || [];
  log(
    `integration-checker: ${findings.filter((f) => f.label === "BLOCKER").length} BLOCKER / ` +
      `${findings.filter((f) => f.label === "WARNING").length} WARNING / ` +
      `${findings.filter((f) => f.label === "UNVERIFIED").length} UNVERIFIED finding(s) | ` +
      `wiring missing ${integration.wiring.missing}, flows broken ${integration.e2eFlows.broken}, ` +
      `routes unprotected ${integration.authProtection.unprotected}.`,
  );
}

// ── PHASE 2: converge, plus the conditional nyquist dispatch ───────────────────────────
phase(PHASE_CONVERGE);

// THE conditional. It reads one returned field and nothing else. A dead verifier is not an
// empty gap list — it is an unknown one, and an unknown one does not silently become "no
// nyquist needed".
const validationGaps = verify && Array.isArray(verify.validation_gaps) ? verify.validation_gaps : [];
const validationGapCount = validationGaps.length;
const nyquistWarranted = validationGapCount > 0;
const verificationReportPath = verify ? verify.reportPath : null;

const convergeUnits = [
  {
    key: "converge",
    label: "converge",
    dispatch: () => agent(convergePrompt(verificationReportPath), convergeOpts()),
    gap:
      "COVERAGE GAP: the converge pass returned nothing (agent failed or was skipped). No convergence sweep ran, so " +
      "no `## Phase N: Convergence` tasks were appended and remaining unbuilt work is UNKNOWN — which is not the " +
      "same as `converged`. Re-run this member before closing the phase.",
  },
];

if (nyquistWarranted) {
  convergeUnits.push({
    key: "nyquist",
    label: "nyquist-auditor",
    dispatch: () =>
      agent(
        nyquistPrompt(validationGaps, verificationReportPath),
        agentOpts(
          `verify-phase:${phaseId}:nyquist-auditor`,
          PHASE_CONVERGE,
          AGENT_TYPES.nyquistAuditor,
          NYQUIST_RESULT_SCHEMA,
          "nyquist-auditor",
        ),
      ),
    gap:
      `COVERAGE GAP: the nyquist-auditor returned nothing (agent failed or was skipped). All ${validationGapCount} ` +
      "validation gap(s) the verifier reported are STILL OPEN — no behavioral test was written or run for any of " +
      "them, and none of them is filled, escalated or justifiably skipped. Re-run this member.",
  });
} else if (!verify) {
  // Not "no gaps" — no answer. Logged as a coverage gap in its own right, because the reason
  // nyquist did not run is a member that died, not a condition that evaluated false.
  log(
    "COVERAGE GAP: the nyquist-auditor was NOT dispatched because the verifier did not return, so its " +
      "`validation_gaps` list is unknown — this is NOT the same as an empty list. Re-run the verifier, then " +
      "dispatch nyquist-auditor if the fresh list is non-empty.",
  );
  notDispatchedUnknown.push({
    member: "nyquist-auditor",
    phase: PHASE_CONVERGE,
    reason:
      "COVERAGE GAP: nyquist-auditor was NOT dispatched because the verifier did not return, so its " +
      "`validation_gaps` list is UNKNOWN — not empty. No behavioral test was written or run for gaps nobody " +
      "has counted. Re-run the verifier, then dispatch nyquist-auditor if the fresh list is non-empty.",
  });
} else {
  log(
    "nyquist-auditor NOT dispatched (by condition, not a failure): the verifier reported 0 validation gaps, so " +
      "there is no test-coverage gap for it to fill.",
  );
  notDispatchedByCondition.push({
    member: "nyquist-auditor",
    reason: "the verifier reported validation_gaps: [] — nothing to fill.",
  });
}

log(
  `verify-phase ${phaseId}: dispatching ${convergeUnits.length} member(s) — ${convergeUnits
    .map((u) => u.label)
    .join(", ")}. Converge runs regardless of the verify verdict; nyquist-auditor ran only because the verifier ` +
    `reported ${validationGapCount} validation gap(s).`,
);

const convergeResults = await parallel(convergeUnits.map((u) => () => u.dispatch()));

convergeResults.forEach((result, i) => {
  const unit = convergeUnits[i];
  if (result) {
    returned[unit.key] = result;
    return;
  }
  returned[unit.key] = null;
  diedMembers.push({ member: unit.label, phase: PHASE_CONVERGE, reason: unit.gap });
  log(unit.gap);
});

const converge = returned.converge || null;
const nyquist = returned.nyquist || null;

if (converge) {
  log(
    `converge: outcome ${converge.outcome} | ${converge.tasksAppended} task(s) appended across ` +
      `${(converge.plansTouched || []).length} plan file(s) | ${(converge.findings || []).length} finding(s).`,
  );
}
if (nyquist) {
  log(
    `nyquist-auditor: outcome ${nyquist.outcome} | ${(nyquist.resolved || []).length} filled ` +
      `(${(nyquist.resolved || []).filter((r) => r.caveat).length} caveated) | ` +
      `${(nyquist.escalated || []).length} escalated | ${(nyquist.skipped || []).length} skipped.`,
  );
}

// ── The two failure lists, kept apart ──────────────────────────────────────────────────
// `diedMembers` above: no return value at all. `blockedMembers` below: a member that ran fine
// and returned a legitimate blocked/escalated/needs-a-human verdict. Merging the two would let
// a dead agent read as a finding, or a real finding read as an infrastructure failure. Each
// entry below is a mechanical read of a documented enum/array — no judgment, no re-derivation.
const blockedMembers = [];
if (verify && verify.status === "human_needed") {
  blockedMembers.push({
    member: "verifier",
    signal: "status: human_needed",
    detail: `${(verify.human_verification || []).length} item(s) need a human — human_needed is never a pass.`,
  });
}
if (evalAudit && (evalAudit.blockers || []).length > 0) {
  blockedMembers.push({
    member: "eval-auditor",
    signal: "BLOCKER",
    detail: `${evalAudit.blockers.length} eval BLOCKER(s) — carrying each into the remediation pass is the caller's job.`,
  });
}
if (integration && (integration.findings || []).some((f) => f.label === "BLOCKER")) {
  blockedMembers.push({
    member: "integration-checker",
    signal: "BLOCKER",
    detail: `${integration.findings.filter((f) => f.label === "BLOCKER").length} [BLOCKER] finding(s) — handing each back is the caller's job.`,
  });
}
if (nyquist && (nyquist.escalated || []).length > 0) {
  blockedMembers.push({
    member: "nyquist-auditor",
    signal: "ESCALATE",
    detail: `${nyquist.escalated.length} escalated gap(s) (outcome ${nyquist.outcome}) — implementation bugs, not test bugs.`,
  });
}

if (!verify && !evalAudit && !integration && !converge && !nyquist) {
  throw new Error(
    `verify-phase: every dispatched member failed for phase ${phaseId} — no verdict, no reports, no convergence ` +
      "sweep. Nothing was checked; re-run before treating this phase as verified.",
  );
}

log(
  `verify-phase ${phaseId}: ${diedMembers.length} member(s) died, ${blockedMembers.length} returned a blocking ` +
    `verdict, ${notDispatchedByCondition.length} were not dispatched by condition, ${notDispatchedUnknown.length} ` +
    "were not dispatched because their condition could not be evaluated (a coverage gap). Deciding what is build work for " +
    "the remediation pass, and what to do with each BLOCKER and ESCALATED item, is the caller's job.",
);

return {
  // Echoed so the worklist is self-describing without re-reading the dispatch args.
  phase: phaseId,
  branch,
  // Each member's result, VERBATIM. null means the member did not run or did not return (see
  // diedMembers / notDispatchedByCondition) — never "it found nothing".
  verify,
  evalAudit,
  integration,
  converge,
  nyquist,
  // What decided the conditional, exposed so the caller can see the branch that was taken
  // rather than infer it from `nyquist` being null.
  validationGapCount,
  nyquistDispatched: nyquistWarranted,
  // Members ruled out by the caller's booleans or by an empty gap list — a condition that
  // EVALUATED. NOT failures, and deliberately a different list from all three below.
  notDispatchedByCondition,
  // Members not dispatched because their condition could not be evaluated at all: the input
  // that decides it died. Each of these IS a coverage gap and was logged as one — never merged
  // into the list above, where nothing is a failure.
  notDispatchedUnknown,
  // Returned nothing at all. Each was logged as a COVERAGE GAP at drop time.
  diedMembers,
  // Ran, returned, and reported a blocking verdict (human_needed / BLOCKER / ESCALATE). Never
  // merged with diedMembers: a dead member and a member that reported problems are different
  // facts with different fixes.
  blockedMembers,
};
