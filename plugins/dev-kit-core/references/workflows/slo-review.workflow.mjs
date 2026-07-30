/**
 * slo-review — the close:operate SLO pair, as a CONCURRENT PAIR.
 * =============================================================================
 * Owns ONE thing: dispatching the two SLO reviewers that must run together against the same
 * frozen performance-engineer report — `sre-engineer` (SLO/error-budget calibration) and
 * `monitoring-expert` (dashboards/alerting/observability calibration) — and returning both
 * results. Nothing else — running the performance-engineer pass itself, folding the two
 * reviews into a verdict, or deciding what to fix — happens here.
 *
 * Invoked by `plugins/dk/commands/close/operate.md`, AFTER the performance-engineer agent has
 * already run and returned (that step is a plain inline `Agent` call and a hard barrier — the
 * SLO pair needs its real performance data, so nothing runs beside performance-engineer, and
 * this script is never dispatched concurrently with it). The pair is fixed at exactly 2, always,
 * so this step is always a Workflow: a 1-member pair would be a plain inline `Agent` call, and a
 * Workflow for one agent is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * WHY SKILL SELF-INJECTION, NOT agentType
 * -----------------------------------------------------------------------------
 * `sre-engineer` and `monitoring-expert` are `dev-kit-infra` SKILLS, not agents with their own
 * `.md` output contract the way `gate-plan-review` or `codebase-mapper` are. Each member here is
 * a general subagent that invokes the `Skill` tool on ITSELF (`skill: dev-kit-infra:sre-engineer`
 * / `skill: dev-kit-infra:monitoring-expert`), per README §2's self-injection strategy. This
 * keeps the orchestrator's own context thin: the skill's full reference material (SLO/error
 * budget math, dashboard/alerting patterns) only ever loads inside the subagent that needs it,
 * never pasted into this script or the caller's turn.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision arrives pre-made in `args` or is made inside a member subagent:
 *   - WHAT the performance-engineer report says, and which milestone/phase it covers — decided
 *     by the CALLER (`/dk:close:operate`'s already-completed performance-engineer step). This
 *     script never reads or re-derives the report; it only passes the reference through.
 *   - WHETHER each SLO is calibrated or loose, and whether the burn rate survives the next
 *     milestone's expected load — decided INSIDE each member, per its own skill's Core Workflow
 *     (SLO/SLI review for sre-engineer, RED/USE dashboard and alerting review for
 *     monitoring-expert).
 *   - WHAT to do about a miscalibrated SLO or a dropped member — decided by the CALLER, from the
 *     returned `died` list and each member's own findings.
 *   - Model/effort routing is decided caller-side by `model-route.mjs` and arrives as
 *     `args.routing` data — this script never picks a model or effort itself.
 * This script performs no aggregation, no AND, no verdict of its own — it is a pure fan-out and
 * a coverage-gap report, unlike `plan-gate` which additionally ANDs two verdicts together. There
 * is no shared pass/fail here to compute: the two members read different data (SLO definitions
 * and error-budget policy vs. dashboards and alert rules) and write different outputs, so the
 * caller reads both reports side by side rather than a single boolean.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * perfReportRef   string  REQUIRED. Reference to the performance-engineer report this pair
 *                          reviews against — a path, a run id, or an inline summary reference,
 *                          whatever the caller's completed performance-engineer step returned.
 *                          Passed to BOTH members verbatim; this script does not read it, parse
 *                          it, or verify it exists (workflow scripts cannot stat files — that
 *                          precondition belongs to the caller's already-completed
 *                          performance-engineer turn).
 * window          string  optional. The look-back/look-forward window the review should reason
 *                          about (e.g. "last milestone" or "next milestone's expected load").
 *                          Passed to both members when present; omitted entirely otherwise, in
 *                          which case each member falls back to its own skill's default framing
 *                          (current milestone's actual traffic vs. the next milestone's
 *                          expected load, per operate.md's own framing).
 * routing         object  optional. `{ 'sre-engineer': {model?, effort?}, 'monitoring-expert':
 *                          {model?, effort?} }` — decided caller-side by
 *                          `plugins/dk/bin/model-route.mjs --batch` and forwarded verbatim.
 *                          Each opts builder spreads its key's entry first; a missing key or a
 *                          missing `routing` arg leaves `model`/`effort` absent entirely
 *                          (inherit the session model), never defaulted.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used. Both members are read/analyze passes over
 * the same frozen performance report; neither is documented to write project files as part of
 * this review, and neither commits. There is no concurrent mutation to isolate.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { perfReportRef, sre, monitoring, died[] } — see the bottom of this file. `sre` and
 * `monitoring` are each `null` when that member did not return (see `died`), never "found
 * nothing to report."
 */

export const meta = {
  name: "slo-review",
  description:
    "The close:operate SLO pair as a concurrent fan-out: sre-engineer and monitoring-expert, both self-injecting their dev-kit-infra skill, reviewing this milestone's SLOs against the performance-engineer report. No aggregation — both results are returned as-is.",
  whenToUse:
    "Called by /dk:close:operate immediately after performance-engineer returns, never concurrently with it. Always 2 members, so always a Workflow. Re-run for a single dropped member via a plain inline Agent call instead.",
  phases: [{ title: "SLO pair", detail: "sre-engineer and monitoring-expert, in parallel, both self-injecting their skill" }],
};

const PHASE_PAIR = "SLO pair";

// Shared shape for both members: neither dev-kit-infra/skills/sre-engineer/SKILL.md nor
// dev-kit-infra/skills/monitoring-expert/SKILL.md documents a JSON output contract (both are
// generic implementation skills, output-format: code, no <output_format>/structured_returns
// block to mirror field-for-field the way gate-plan-review or codebase-mapper do). This schema
// instead names the two facts operate.md's own prose asks for verbatim — "whether the burn rate
// survives the next milestone's expected load, and whether each SLO is calibrated or merely
// loose" — plus a free-form findings/recommendations pair so neither skill's fuller review is
// truncated. `additionalProperties` left open so a stray extra key never costs the whole unit.
const SLO_REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["sloCalibration", "burnRateAssessment", "findings"],
  properties: {
    sloCalibration: {
      type: "array",
      items: {
        type: "object",
        required: ["slo", "calibrated", "rationale"],
        properties: {
          slo: { type: "string", description: "The SLO/SLI under review, verbatim from the SLO set." },
          calibrated: {
            type: "string",
            enum: ["calibrated", "too_loose", "too_tight", "unknown"],
            description: "operate.md's own framing: calibrated vs. merely loose (or, tighter than reality supports).",
          },
          rationale: { type: "string", description: "Evidence from the performance-engineer report backing the call." },
        },
      },
      description: "One entry per SLO reviewed.",
    },
    burnRateAssessment: {
      type: "string",
      description:
        "Whether the error-budget burn rate survives the next milestone's expected load, per operate.md's framing. Free text: this is a judgment call, not a boolean the caller re-derives.",
    },
    findings: {
      type: "array",
      items: { type: "string" },
      description: "Free-form findings beyond the SLO table (e.g. missing dashboards, alert gaps, toil).",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "Concrete follow-ups, if any. Empty array if none.",
    },
  },
};

// ── Eager arg validation ───────────────────────────────────────────────────────────────
const { perfReportRef, window = null } = args;

if (!perfReportRef) {
  throw new Error(
    "slo-review: args.perfReportRef is required — the performance-engineer report reference both " +
      "members review against. The caller's performance-engineer step must complete and return a " +
      "reference before this pair is dispatched; this script cannot read or verify a report itself.",
  );
}

// ── Prompt builders — skill self-injection ─────────────────────────────────────────────
// Each subagent invokes the Skill tool ITSELF. The caller must not pre-load the skill on the
// subagent's behalf: that would pull the full skill reference material into the orchestrator's
// own context, which is exactly the weight self-injection exists to keep out of it.
function sreEngineerPrompt() {
  const lines = [
    "Your first action: invoke the Skill tool with skill: `dev-kit-infra:sre-engineer` and follow " +
      "it to review this milestone's SLOs.",
    "",
    "Inputs:",
    `- Performance report: ${perfReportRef}`,
  ];
  if (window) lines.push(`- Window: ${window}`);
  lines.push(
    "",
    "Step 13 set these SLOs against expected traffic; the performance report above is the first " +
      "real data against it. Say whether each SLO is calibrated or merely loose, and whether the " +
      "error-budget burn rate survives the next milestone's expected load.",
    "You are non-interactive: never wait for a user. Return only the JSON matching the required " +
      "schema (sloCalibration, burnRateAssessment, findings, recommendations) — no prose outside it.",
  );
  return lines.join("\n");
}

function monitoringExpertPrompt() {
  const lines = [
    "Your first action: invoke the Skill tool with skill: `dev-kit-infra:monitoring-expert` and " +
      "follow it to review this milestone's SLOs from the observability side (dashboards, alert " +
      "rules, RED/USE coverage).",
    "",
    "Inputs:",
    `- Performance report: ${perfReportRef}`,
  ];
  if (window) lines.push(`- Window: ${window}`);
  lines.push(
    "",
    "Step 13 set these SLOs against expected traffic; the performance report above is the first " +
      "real data against it. Say whether each SLO is calibrated or merely loose, and whether the " +
      "error-budget burn rate survives the next milestone's expected load.",
    "You are non-interactive: never wait for a user. Return only the JSON matching the required " +
      "schema (sloCalibration, burnRateAssessment, findings, recommendations) — no prose outside it.",
  );
  return lines.join("\n");
}

// Opts builders. Keys that are absent are OMITTED, never defaulted. `model`/`effort` come only
// from `args.routing`'s matching key, spread first so an absent `routing` (or absent key) leaves
// both keys absent (inherit the session's). Neither sets `agentType`: both are general subagents
// that self-inject their own skill (see WHY SKILL SELF-INJECTION).
function sreEngineerOpts() {
  return {
    ...(args.routing?.["sre-engineer"] ?? {}),
    label: "slo-review:sre-engineer",
    phase: PHASE_PAIR,
    schema: SLO_REVIEW_SCHEMA,
  };
}

function monitoringExpertOpts() {
  return {
    ...(args.routing?.["monitoring-expert"] ?? {}),
    label: "slo-review:monitoring-expert",
    phase: PHASE_PAIR,
    schema: SLO_REVIEW_SCHEMA,
  };
}

phase(PHASE_PAIR);
log(
  `slo-review: dispatching 2 members concurrently against ${perfReportRef} — sre-engineer and ` +
    "monitoring-expert, both self-injecting their dev-kit-infra skill.",
);

// Thunks, never live promises: `parallel()` is the barrier and never rejects — a failed thunk
// yields null, which is handled as a coverage gap below, not as an exception.
const [sre, monitoring] = await parallel([
  () => agent(sreEngineerPrompt(), sreEngineerOpts()),
  () => agent(monitoringExpertPrompt(), monitoringExpertOpts()),
]);

// ── Coverage gaps / died list ───────────────────────────────────────────────────────────
// A member that did not return is NOT a member that found nothing — it is a check that never
// ran. `died` is named separately from any in-band "could not determine" a member might return
// inside its own JSON, per README §3's separately-named-failure-lists rule.
const died = [];
if (!sre) {
  died.push("sre-engineer");
  log(
    "COVERAGE GAP: sre-engineer did not return — SLO/error-budget calibration and burn-rate-vs-" +
      "next-milestone assessment are NOT covered this run. Re-dispatch it inline before closing " +
      "this operate step.",
  );
}
if (!monitoring) {
  died.push("monitoring-expert");
  log(
    "COVERAGE GAP: monitoring-expert did not return — dashboard/alerting/observability " +
      "calibration for these SLOs is NOT covered this run. Re-dispatch it inline before closing " +
      "this operate step.",
  );
}

if (sre) {
  log(
    `sre-engineer: ${Array.isArray(sre.sloCalibration) ? sre.sloCalibration.length : "?"} SLO(s) assessed. Burn rate: ${sre.burnRateAssessment}`,
  );
}
if (monitoring) {
  log(
    `monitoring-expert: ${Array.isArray(monitoring.sloCalibration) ? monitoring.sloCalibration.length : "?"} SLO(s) assessed. Burn rate: ${monitoring.burnRateAssessment}`,
  );
}
log(`slo-review: ${2 - died.length}/2 member(s) returned. died: [${died.join(", ") || "none"}].`);

return {
  // Echoed so the worklist is self-describing without re-reading the dispatch args.
  perfReportRef,
  // Each member's full result, verbatim. null means it did not return at all (see `died`),
  // never "it found nothing to flag."
  sre: sre || null,
  monitoring: monitoring || null,
  // Named separately per README §3: a died member is never conflated with a member that
  // returned a legitimate finding. Empty when both ran.
  died,
};
