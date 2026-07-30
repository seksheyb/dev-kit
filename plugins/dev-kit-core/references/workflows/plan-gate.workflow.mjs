/**
 * plan-gate — the plan gate as a CONCURRENT PAIR
 * =============================================================================
 * Owns ONE thing: dispatching the two checks that must both clear before Wave 1 is allowed
 * to start, and ANDing their verdicts together. Nothing else — reading the plan, fixing
 * findings, re-running the gate, dispatching Wave 1 — happens here.
 *
 * Invoked by `plugins/dk/commands/plan/gate.md` (the `/dk:plan:gate` step). There are
 * exactly 2 members, always, so this step is always a Workflow: a 1-member gate would be a
 * plain inline `Agent` call, and a Workflow for one agent is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * WHY EXACTLY TWO MEMBERS — and why the complexity check is NOT a third
 * -----------------------------------------------------------------------------
 * `agents/gate-plan-review.md` is dispatched UNCHANGED. Its step 0 is a deterministic
 * complexity-column check (`.claude/bin/complexity-score.mjs --gate --json`, with a
 * documented manual fallback when the scorer is not installed), and its own step 4 already
 * folds that result into `complexity_ok`, `severity_counts.HIGH`, `blockers` and
 * `gate_passed`. Lifting it out into a third member here would either duplicate the check
 * (two runs, two chances to disagree about the same plan) or force a restructuring of a
 * verified never-downgrade gate agent so it stops owning its own verdict. Neither is worth
 * it. The complexity check stays inside member 1, where it already is.
 *
 * The ONLY semantic change versus the prose this script replaces: `analyze` used to run
 * "when the gate clears", sequentially. Here it runs CONCURRENTLY with the gate. That is
 * safe because `analyze` is strictly non-destructive (its SKILL says STRICTLY READ-ONLY, no
 * file writes) and its inputs — the spec, the phase PLAN.md, the constitution — are frozen
 * while the gate runs: nothing in member 1 edits them. So the two members cannot observe
 * different artifact states, and running them together only changes wall-clock time. The
 * gain is real: when the gate fails, the operator gets the analyze findings in the SAME
 * turn instead of after a fix-and-re-run round trip, so one edit pass can address both.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision arrives pre-made in `args` or is made inside a member agent:
 *   - WHICH phase, and which plan / SDD / ADR / spec / graphify / obsidian / constitution
 *     paths those checks run against — decided by the CALLER (`/dk:plan:gate`, from the
 *     phase id and the sitemap). This script never derives, defaults or resolves a path.
 *   - WHETHER the complexity columns are correct, which review engine to use, what counts
 *     as HIGH, and whether an inline `won't fix` waiver is credible — decided INSIDE
 *     `gate-plan-review` (its steps 0-4). This script does not re-derive any of it.
 *   - WHAT is a CRITICAL finding — decided INSIDE the `analyze` skill (its §5 severity
 *     heuristic: constitution MUST violations and zero-coverage requirements are CRITICAL).
 *   - WHAT to do about a failed gate — decided by the CALLER, from `next_action`.
 * The only computation this script performs is a boolean AND and a mechanical
 * `next_action` selection. Both are stated in full below and neither involves a model call.
 * Model/effort routing for both members is likewise decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script performs no judgment
 * of its own about which model or effort either member should run at.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * phase            string  REQUIRED. The phase id (`<NN>`). Labels, logs, the analyze
 *                          prompt, and the returned worklist. Never parsed for paths.
 * planPath         string  REQUIRED. The plan file under review. gate-plan-review's
 *                          `plan_path` — its only canonical plan path.
 * sddPath          string  REQUIRED. gate-plan-review's `sdd_path`.
 * adrDir           string  REQUIRED. gate-plan-review's `adr_dir`.
 * specPath         string  REQUIRED. The spec that drove the plan. gate-plan-review's
 *                          `spec_path`, AND the governing document for the analyze pass.
 * graphifyPath     string  REQUIRED. gate-plan-review's `graphify_path`. Pass the literal
 *                          string "none" when there is no graph report — that is the
 *                          agent's own documented value, so "none" is a real answer here
 *                          and omitting the arg is not.
 * obsidianPath     string  optional. gate-plan-review's optional `obsidian_path`.
 * routing          object  optional. `{ "gate-plan-review": {model?, effort?}, "analyze":
 *                          {model?, effort?} }`, decided caller-side by `model-route.mjs
 *                          --batch` and forwarded verbatim. An absent key (or an absent
 *                          `routing` altogether) means "inherit" for that member, never a
 *                          guessed default.
 * constitutionPath string  optional. Passed to the analyze member for its constitution
 *                          passes (D). Omit to let the skill use its documented default; a
 *                          missing constitution is explicitly not fatal to that skill.
 * gateAgentType    string  optional. Overrides member 1's subagent type. See AGENT
 *                          RESOLUTION.
 *
 * All five of gate-plan-review's declared inputs are REQUIRED here on purpose. That agent
 * resolves a few further paths itself when the orchestrator is silent (REQUIREMENTS.md,
 * ROADMAP.md, PHASE/CONTEXT.md, PHASE/PATTERNS.md), but the five below are not among them:
 * dropping one silently narrows what the review engine can check while the summary still
 * comes back looking complete.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read before running
 * -----------------------------------------------------------------------------
 * Member 1 dispatches by `opts.agentType: "gate-plan-review"` so that
 * `agents/gate-plan-review.md` stays the single source of truth for the gate's procedure
 * and output contract; the prompt built below carries ONLY that agent's documented INPUTS
 * and deliberately does not restate its steps. If the bare name does not resolve in a given
 * install, pass the plugin-qualified escape hatch: `gateAgentType:
 * "dev-kit-core:gate-plan-review"`. Member 2 sets no `agentType` at all — it is a general
 * subagent that loads the `dev-kit-core:analyze` skill itself.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used, and NONE of these 13 workflow scripts
 * needs it: no member commits concurrently. Here specifically, member 2 writes nothing at
 * all, and member 1's only writes are its own two review files at plan-derived paths
 * (`PHASE/reviews/<plan>.review.md` and `.review-summary.json`) that no other member
 * touches. There is no concurrent mutation to isolate, and a worktree would strand those
 * review files off the main tree — the operator would then be fixing a plan against a
 * summary that is not in their checkout.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { phase, gate_passed, gate|null, analyze|null, missingMembers[], next_action }
 * — see the bottom of this file. `gate_passed` is the caller's Wave 1 authorization and
 * nothing else; it is false whenever a member did not return.
 */

export const meta = {
  name: "plan-gate",
  description:
    "The plan gate as a concurrent pair: gate-plan-review (deterministic complexity check + external-engine review, unchanged) and an analyze-skill pass (six detection passes against the spec). gate_passed aggregation is deterministic: both must clear.",
  whenToUse:
    "Called by /dk:plan:gate before Wave 1 of a phase, once the phase plan and its Parallel Execution Map exist. Always 2 members, so always a Workflow. Re-run it after fixing what it reports; Wave 1 does not start until it returns gate_passed: true.",
  phases: [
    { title: "Gate pair", detail: "gate-plan-review and the analyze six-pass check, in parallel" },
    { title: "Aggregate", detail: "deterministic AND: gate_passed requires both clear" },
  ],
};

const PHASE_PAIR = "Gate pair";
const PHASE_AGGREGATE = "Aggregate";

// Mirrors `gate-plan-review.md` step 4 (the `review-summary.json` contract) field for
// field: engine, complexity_ok, severity_counts, blockers, waived_highs, gate_passed,
// next_action — plus the summary file path that agent's step 5 returns alongside the JSON.
// `additionalProperties` is left OPEN deliberately: that agent's "On failure" branch adds a
// `complete: false` key, and a stray extra key must never invalidate the whole summary and
// cost us the gate result (which would then read as a coverage gap it is not).
const GATE_SUMMARY_SCHEMA = {
  type: "object",
  required: [
    "engine",
    "complexity_ok",
    "severity_counts",
    "blockers",
    "waived_highs",
    "gate_passed",
    "next_action",
  ],
  properties: {
    engine: {
      type: "string",
      description:
        "Which review engine was actually used, after any fallback per the engine registry (default gemini -> codex -> claude).",
    },
    complexity_ok: {
      type: "boolean",
      description:
        "Step 0's deterministic complexity-column check (or its documented manual fallback when no scorer is installed). False can never pass the gate.",
    },
    severity_counts: {
      type: "object",
      required: ["HIGH", "MEDIUM", "LOW"],
      properties: {
        HIGH: { type: "integer", minimum: 0 },
        MEDIUM: { type: "integer", minimum: 0 },
        LOW: { type: "integer", minimum: 0 },
      },
      description: "HIGH already includes the step-0 complexity blockers, per step 4.",
    },
    blockers: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      description:
        "Up to 5 verbatim HIGH lines, each tagged [complexity] (self-verified by the gate) or [engine:<name>] (relayed, not independently re-run).",
    },
    waived_highs: {
      type: "array",
      // Left as open objects on purpose: this script never reads inside a waiver. Its
      // fields (the HIGH line, the plan section, the quoted justification,
      // gate_spot_checked, accepted) are the gate's to evaluate, and the gate has already
      // folded `accepted` into `gate_passed` before this script sees either.
      items: { type: "object" },
      description:
        "One entry per HIGH carrying an inline `won't fix — <reason>`, accepted or not. Provenance for the operator; not re-judged here.",
    },
    gate_passed: {
      type: "boolean",
      description:
        "True iff complexity_ok AND severity_counts.HIGH == 0 after subtracting only accepted waivers. The gate's own verdict, never recomputed by this script.",
    },
    next_action: {
      type: "string",
      description:
        "The gate's own next action, one of its four documented strings. Used verbatim below when the gate is what failed.",
    },
    summaryPath: {
      type: "string",
      description:
        "Path to the written review-summary.json (PHASE/reviews/<plan-basename>.review-summary.json).",
    },
  },
};

// Mirrors `skills/analyze/SKILL.md` §4 (the six detection passes A-F), §5 (the
// CRITICAL/HIGH/MEDIUM/LOW heuristic), §6's findings table columns (ID, Category, Severity,
// Location(s), Summary) and its Metrics block (Critical Issues Count). `additionalProperties`
// stays open so a run that also reports coverage % or unmapped tasks is not rejected.
const ANALYZE_RESULT_SCHEMA = {
  type: "object",
  required: ["criticalCount", "findings", "constitutionViolations"],
  properties: {
    criticalCount: {
      type: "integer",
      minimum: 0,
      description:
        "SKILL §6 Metrics 'Critical Issues Count' — findings at severity CRITICAL. This is the only number that gates.",
    },
    findings: {
      type: "array",
      // SKILL §4 caps the report at 50 findings with the remainder aggregated into an
      // overflow summary; the same cap applies here so the two cannot disagree.
      maxItems: 50,
      items: {
        type: "object",
        required: ["id", "category", "severity", "location", "summary"],
        properties: {
          id: { type: "string", description: "Stable ID prefixed by category initial, e.g. A1." },
          category: {
            type: "string",
            enum: [
              "Duplication",
              "Ambiguity",
              "Underspecification",
              "Constitution",
              "Coverage",
              "Inconsistency",
            ],
            description: "One of the six detection passes A-F.",
          },
          severity: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
          location: { type: "string", description: "e.g. spec.md:L120-134." },
          summary: { type: "string" },
        },
      },
    },
    constitutionViolations: {
      type: "integer",
      minimum: 0,
      description:
        "Pass D count. Reported separately because the skill makes constitution conflicts automatically CRITICAL — they are already inside criticalCount, and this field says how much of it they are.",
    },
  },
};

// ── Eager arg validation ───────────────────────────────────────────────────────────────
// Everything below throws BEFORE the first phase()/dispatch. A gate that runs against a
// half-specified contract is worse than one that refuses to run: it returns a clean-looking
// summary for checks that were never performed.
const {
  phase: phaseId,
  planPath,
  sddPath,
  adrDir,
  specPath,
  graphifyPath,
  obsidianPath = null,
  constitutionPath = null,
  gateAgentType = "gate-plan-review",
  routing = null,
} = args;

if (!phaseId) throw new Error("plan-gate: args.phase is required (the phase id, `<NN>`).");
if (!planPath) {
  throw new Error(
    "plan-gate: args.planPath is required — gate-plan-review's `plan_path`, the only canonical plan path.",
  );
}
if (!sddPath) {
  throw new Error(
    "plan-gate: args.sddPath is required — gate-plan-review's `sdd_path`. Without it the engine cannot run the SDD Alignment check.",
  );
}
if (!adrDir) {
  throw new Error(
    "plan-gate: args.adrDir is required — gate-plan-review's `adr_dir`. Without it the engine cannot run the ADR Gaps check.",
  );
}
if (!specPath) {
  throw new Error(
    "plan-gate: args.specPath is required — it is both gate-plan-review's `spec_path` and the governing document for the analyze pass.",
  );
}
if (!graphifyPath) {
  throw new Error(
    'plan-gate: args.graphifyPath is required — gate-plan-review\'s `graphify_path`. Pass the literal "none" when no graph report exists; do not omit it.',
  );
}

// ── Member 1: the gate agent, inputs only ──────────────────────────────────────────────
// `agents/gate-plan-review.md` owns the procedure (steps 0-5), the engine selection, the
// severity contract and the output contract. This prompt carries its declared inputs and
// nothing else — restating its steps here would create a second, drifting copy of a gate
// whose whole value is that it never downgrades a finding.
function gatePrompt() {
  const lines = [
    `Run the Sprint Plan Review gate for phase ${phaseId}.`,
    "",
    "Inputs:",
    `- plan_path: ${planPath}`,
    `- sdd_path: ${sddPath}`,
    `- adr_dir: ${adrDir}`,
    `- spec_path: ${specPath}`,
    `- graphify_path: ${graphifyPath}`,
  ];
  if (obsidianPath) lines.push(`- obsidian_path: ${obsidianPath}`);
  lines.push(
    "",
    "Follow your own steps 0-5 exactly and at full depth, including the deterministic " +
      "complexity check that runs first and the inputs you resolve yourself when the " +
      "orchestrator is silent. Return only the JSON summary and its path — no review prose, " +
      "no plan content. You are non-interactive: never wait for a user.",
  );
  return lines.join("\n");
}

// ── Member 2: the analyze pass, skill self-injection ───────────────────────────────────
// The subagent invokes the Skill tool ITSELF. The caller must not invoke it on the
// subagent's behalf: that would pull the whole analyze SKILL into the orchestrator's
// context, which is exactly the weight this dispatch exists to keep out of it.
function analyzePrompt() {
  const lines = [
    `Your first action: invoke the Skill tool with skill: \`dev-kit-core:analyze\` and follow it for phase ${phaseId}.`,
    "",
    "Inputs:",
    `- SPEC (the governing document): ${specPath}`,
    `- PLAN: ${planPath}`,
  ];
  if (constitutionPath) lines.push(`- CONSTITUTION: ${constitutionPath}`);
  lines.push(
    "",
    `\`${specPath}\` IS the governing document for this analysis. Do NOT fall back to the ` +
      "roadmap or the requirements doc, and do not resolve a different spec from the plan's " +
      "frontmatter — the governing document was chosen by the caller and is fixed.",
    "Run all six detection passes (duplication, ambiguity, underspecification, constitution " +
      "alignment, coverage gaps, inconsistency) and assign severities by the skill's own " +
      "heuristic.",
    "STRICTLY NON-DESTRUCTIVE: modify no files, write no report file, and do not offer or " +
      "apply remediation edits. You are non-interactive: never wait for a user, and never ask " +
      "the skill's step-8 remediation question — return instead.",
    "Return only the JSON matching the required schema (criticalCount, findings, " +
      "constitutionViolations).",
  );
  return lines.join("\n");
}

// Opts builders. Keys that are absent are OMITTED, never defaulted — an omitted `model`
// means "inherit the session model", and member 2 has no `agentType` at all.
function gateOpts() {
  const opts = {
    ...(routing?.["gate-plan-review"] ?? {}),
    label: `plan-gate:${phaseId}:gate-review`,
    phase: PHASE_PAIR,
    schema: GATE_SUMMARY_SCHEMA,
  };
  // `model`/`effort` come from routing?.["gate-plan-review"] when the caller-side router
  // supplied them, else stay absent (inherit) — this script does not second-guess the
  // gate agent's cost profile itself. `agentType` is the one key that must be set — it is
  // what makes agents/gate-plan-review.md the source of truth for this member.
  opts.agentType = gateAgentType;
  return opts;
}

function analyzeOpts() {
  return {
    ...(routing?.analyze ?? {}),
    label: `plan-gate:${phaseId}:analyze`,
    phase: PHASE_PAIR,
    schema: ANALYZE_RESULT_SCHEMA,
  };
}

phase(PHASE_PAIR);
log(
  `plan-gate phase ${phaseId}: dispatching 2 members concurrently — gate-plan-review (agentType ${gateAgentType}) over ${planPath}, and the analyze six-pass check against ${specPath} as the governing document.`,
);

// Thunks, never live promises: `parallel()` is the barrier and never rejects — a failed
// thunk yields null, which is handled as a coverage gap below, not as an exception.
const [gate, analyze] = await parallel([
  () => agent(gatePrompt(), gateOpts()),
  () => agent(analyzePrompt(), analyzeOpts()),
]);

phase(PHASE_AGGREGATE);

// ── Coverage gaps ──────────────────────────────────────────────────────────────────────
// A member that did not return is NOT a member that found nothing. Either drop forces
// gate_passed: false, because the gate cannot pass on a check that did not run.
const missingMembers = [];
if (!gate) {
  const reason =
    "COVERAGE GAP: gate-plan-review did not return — the gate CANNOT pass on a check that did not run";
  missingMembers.push({ member: "gate-plan-review", reason });
  log(
    `${reason}. NOT covered for phase ${phaseId}: the deterministic complexity-column check, ` +
      "SDD alignment, ADR gaps, scope coverage, structural soundness, vertical-slice " +
      "compliance and signal honesty. No review summary was written. Re-dispatch this member " +
      `(try gateAgentType: "dev-kit-core:${gateAgentType.split(":").pop()}" if the bare agent ` +
      "type failed to resolve) before Wave 1.",
  );
}
if (!analyze) {
  const reason =
    "COVERAGE GAP: analyze did not return — the gate CANNOT pass on a check that did not run";
  missingMembers.push({ member: "analyze", reason });
  log(
    `${reason}. NOT covered for phase ${phaseId}: duplication, ambiguity, underspecification, ` +
      "constitution alignment, coverage gaps and inconsistency between the spec and the plan. " +
      "Re-dispatch this member before Wave 1.",
  );
}

// ONE drop is not fatal: the member that DID return is a real, actionable worklist, and
// throwing it away would cost the operator a whole round of fixes they could already be
// making. BOTH dropped means there is no worklist and no verdict at all — nothing to
// return that a caller could act on, so that throws.
if (!gate && !analyze) {
  throw new Error(
    `plan-gate: both members failed for phase ${phaseId} — no gate verdict and no analyze findings. Nothing was checked; re-run before Wave 1.`,
  );
}

// ── The aggregation, in full ───────────────────────────────────────────────────────────
// Pure JS, no model call, no re-derivation. `gate.gate_passed` is the gate agent's own
// verdict (complexity_ok AND zero unwaived HIGHs) and is taken verbatim; `criticalCount`
// is the analyze skill's own CRITICAL total. AND, because either check failing means the
// plan is not ready — and a missing member is null here, so it fails the AND too.
const gateClear = gate ? gate.gate_passed === true : false;
const analyzeClear = analyze ? analyze.criticalCount === 0 : false;
const gate_passed = gateClear && analyzeClear;

// Mechanical selection, first match wins. The gate's own next_action is preferred when the
// gate is what failed, because it distinguishes the four repair paths that only that agent
// can tell apart (scripted scorer vs manual fallback vs engine HIGHs vs engine failure).
let next_action;
if (!gate) next_action = "re-run the plan gate: gate-plan-review did not return";
else if (!gateClear) next_action = gate.next_action;
else if (!analyze) next_action = "re-run the analyze pass: it did not return";
else if (!analyzeClear) next_action = "fix CRITICAL analyze findings";
else next_action = "dispatch Wave 1";

if (gate) {
  log(
    `gate-plan-review: gate_passed=${gate.gate_passed} | engine ${gate.engine} | complexity_ok=${gate.complexity_ok} | ` +
      `HIGH ${gate.severity_counts.HIGH}/MED ${gate.severity_counts.MEDIUM}/LOW ${gate.severity_counts.LOW} | ` +
      `${(gate.blockers || []).length} blocker(s) | ${(gate.waived_highs || []).length} waived HIGH(s) | ${gate.summaryPath || "no summary path returned"}`,
  );
}
if (analyze) {
  log(
    `analyze: ${analyze.criticalCount} CRITICAL (${analyze.constitutionViolations} of them constitution violations) across ${(analyze.findings || []).length} finding(s).`,
  );
}
log(
  `plan-gate phase ${phaseId}: gate_passed=${gate_passed} (${missingMembers.length} member(s) missing). next_action: ${next_action}. ` +
    "Wave 1 does not start until this returns gate_passed: true.",
);

return {
  // Echoed so the worklist is self-describing without re-reading the dispatch args.
  phase: phaseId,
  // The caller's Wave 1 authorization, and the ONLY field that authorizes it. False
  // whenever either member failed to clear OR failed to return.
  gate_passed,
  // Member 1's full summary, verbatim — blockers and waived_highs are the operator's fix
  // list. null means it did not return at all (see missingMembers), never "it found nothing".
  gate: gate || null,
  // Member 2's findings, verbatim. null means it did not return; a returned member with
  // criticalCount 0 is a clean analyze pass, which is a different fact entirely.
  analyze: analyze || null,
  // Named separately from a member that returned a failing verdict: a dead member and a
  // member that reported problems must never merge into one bucket. Empty when both ran.
  missingMembers,
  // Mechanically selected above; the caller states it to the user and acts on it.
  next_action,
};
