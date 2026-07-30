/**
 * spec-research-pair — the AI-SPEC researcher pair, plus an optional UI-checker third
 * =============================================================================
 * Owns ONE thing: dispatching `domain-researcher` and `ai-researcher` together against the
 * same AI-SPEC.md (both agents co-author it, one read-modify-write each, disjoint
 * sections), and — when the phase also has a UI chain in flight — `ui-checker` alongside
 * them as a third, unrelated member. Nothing else — creating AI-SPEC.md, confirming it
 * exists before this pair fans out, running framework-selector first or eval-planner last,
 * folding results into the spec narrative — happens here.
 *
 * Invoked by `plugins/dk/commands/spec/phase.md` (`/dk:spec:phase`) between
 * `framework-selector` (alone, first) and `eval-planner` (alone, last) in the AI chain.
 * This script covers ONLY the middle pair (+ optional UI third); framework-selector and
 * eval-planner stay single-agent inline dispatches in the command, exactly as before.
 *
 * ALWAYS a Workflow when it runs at all: domain-researcher + ai-researcher is 2 units by
 * construction, and includeUiChecker adds a 3rd. There is no 1-unit case for this script —
 * a single-agent AI-chain pair does not exist, and the UI chain's own ui-researcher ->
 * ui-checker sequence (when the AI chain is absent) is a separate, purely-sequential
 * dispatch the command still runs inline, outside this script.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision arrives pre-made in `args` or is made inside a member agent:
 *   - WHETHER AI-SPEC.md exists (framework-selector's job to have created it) — decided in
 *     the CALLER's turn, before this script is invoked. This script has no filesystem
 *     access and cannot check; the command states the existence check as an explicit
 *     pre-dispatch precondition instead.
 *   - WHETHER the phase has UI work at all (`includeUiChecker`) and, if so, what
 *     `uiSpecPath` is — decided by the CALLER from the operator's chain-selection answer.
 *   - WHAT counts as a critical failure mode, a domain rubric ingredient, a framework
 *     pitfall, or a UI-SPEC dimension verdict — decided INSIDE each dispatched agent's own
 *     documented procedure. This script never re-derives any of it.
 * The only computation this script performs is unit-count validation and a mechanical
 * coverage-gap log per dropped member. Neither involves a model call. Model/effort routing
 * is decided caller-side by `model-route.mjs` and arrives as `args.routing` data — this
 * script never picks a model or effort itself.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * specPath          string   REQUIRED. `ai_spec_path` — the AI-SPEC.md both domain-researcher
 *                            and ai-researcher read-modify-write. The caller has already
 *                            confirmed this file exists (framework-selector's output)
 *                            before invoking this script — see the precondition note above.
 * phase             string   REQUIRED. The phase id (`NN` or `NN-slug`). Used in labels and
 *                            logs; never parsed for further paths.
 * includeUiChecker  boolean  REQUIRED. Whether the UI chain is active for this phase and
 *                            `ui-checker` should run as a third, concurrent member.
 * uiSpecPath        string   REQUIRED when `includeUiChecker` is true; otherwise ignored.
 *                            `ui-checker`'s `UI-SPEC.md` input — the file the phase's
 *                            `ui-researcher` already produced. Never defaulted here: the
 *                            agent's own doc-sitemap default only applies when the caller
 *                            is silent about the whole UI chain, not when this script is
 *                            told the chain is active but given no path.
 * routing           object   optional. `{ 'domain-researcher': {model?, effort?},
 *                            'ai-researcher': {model?, effort?}, 'ui-checker': {model?,
 *                            effort?} }` — decided caller-side by
 *                            `plugins/dk/bin/model-route.mjs --batch` and forwarded
 *                            verbatim. Each opts builder spreads its key's entry before
 *                            `agentType`; a missing key or a missing `routing` arg leaves
 *                            `model`/`effort` absent entirely (inherit the session model),
 *                            never defaulted.
 *
 * -----------------------------------------------------------------------------
 * WHY DOMAIN-RESEARCHER + AI-RESEARCHER CAN SAFELY RUN CONCURRENTLY WITH UI-CHECKER
 * -----------------------------------------------------------------------------
 * All three members write to entirely disjoint files: the AI pair edits distinct sections
 * of AI-SPEC.md (domain-researcher: 1, 1b; ai-researcher: 3, 4, 4b), and ui-checker is
 * READ-ONLY against UI-SPEC.md — it modifies nothing (see `agents/ui-checker.md`'s
 * `<critical_rules>`: "No source edits... The only output is the structured return"). No
 * member's input depends on another member's output, so running all three (or two, when
 * the UI chain is off) in one fan-out changes only wall-clock time, never behavior.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is not used. domain-researcher and ai-researcher each touch only
 * their own AI-SPEC.md sections via `Edit`, never overlapping; ui-checker writes nothing.
 * There is no concurrent mutation to isolate, and a worktree would strand AI-SPEC.md's
 * edits off the tree the caller is about to hand to eval-planner.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { phase, domainResearch|null, aiResearch|null, uiCheck|null, missingUnits[], allCovered }
 * — see the bottom of this file. `allCovered` is true only when every dispatched unit
 * (2 or 3, depending on `includeUiChecker`) returned; the caller decides whether
 * eval-planner can proceed on a partial pair from `missingUnits`.
 */

export const meta = {
  name: "spec-research-pair",
  description:
    "The AI-SPEC researcher pair (domain-researcher + ai-researcher), plus ui-checker as a conditional third when the phase's UI chain is active. All members write disjoint files/sections, so they always run concurrently.",
  whenToUse:
    "Called by /dk:spec:phase, in the AI chain, after framework-selector has created AI-SPEC.md and before eval-planner runs alone. Always 2 or 3 members, so always a Workflow.",
  phases: [
    { title: "Research pair", detail: "domain-researcher + ai-researcher, and ui-checker when the UI chain is active, in parallel" },
    { title: "Aggregate", detail: "coverage-gap accounting; no synthesis, no judgment" },
  ],
};

const PHASE_RESEARCH = "Research pair";
const PHASE_AGGREGATE = "Aggregate";

// DERIVED FROM `domain-researcher.md`'s <success_criteria> and section template — NOT mirrored
// from a structured return, because that agent documents none: it ends at a checklist and a
// markdown template. So the wire instruction for these fields is stated in domainPrompt() below
// (the way devexPrompt does in final-gate-lanes), and `required` is held to the two facts the
// agent cannot finish its own job without knowing — the path it edited and the sections it
// wrote. `criticalFailureModesCount` is asked for but NOT required: an agent that follows its
// own .md and reports in prose must not have its whole run discarded as a coverage gap.
// `additionalProperties` stays open — this script never rejects a superset.
const DOMAIN_RESEARCH_SCHEMA = {
  type: "object",
  required: ["specPath", "sectionsWritten"],
  properties: {
    specPath: {
      type: "string",
      description: "The ai_spec_path actually edited (echoed back for confirmation).",
    },
    sectionsWritten: {
      type: "array",
      items: { type: "string" },
      description: "Which of Section 1 / Section 1b were written or updated, e.g. ['1', '1b'].",
    },
    criticalFailureModesCount: {
      type: "integer",
      minimum: 0,
      description: "Rows in Section 1's Critical Failure Modes table (minimum 3 per the agent's own success criteria).",
    },
    upstreamIssue: {
      type: "string",
      description: "Set only when ai_spec_path was missing and the agent had to Write the full skeleton instead of Edit-in-place.",
    },
  },
};

// DERIVED FROM `ai-researcher.md`'s <success_criteria> and section template, on exactly the same
// terms as the schema above: that agent documents no structured return either, so the fields are
// asked for in aiResearchPrompt() and `frameworkDocsFetched` stays out of `required`.
// `additionalProperties` stays open for the same reason as above.
const AI_RESEARCH_SCHEMA = {
  type: "object",
  required: ["specPath", "sectionsWritten"],
  properties: {
    specPath: {
      type: "string",
      description: "The ai_spec_path actually edited (echoed back for confirmation).",
    },
    sectionsWritten: {
      type: "array",
      items: { type: "string" },
      description: "Which of Section 3 / 4 / 4b were written or updated, e.g. ['3', '4', '4b'].",
    },
    frameworkDocsFetched: {
      type: "integer",
      minimum: 0,
      description: "Number of official-docs pages fetched (the agent's own target is 2-4).",
    },
    upstreamIssue: {
      type: "string",
      description: "Set only when ai_spec_path was missing and the agent had to Write the full skeleton instead of Edit-in-place.",
    },
  },
};

// Mirrors `ui-checker.md`'s <verdict_format> and <structured_returns> field for field: up to
// six dimension verdicts (the sixth is skippable — see `dimensions` below), an overall status,
// and the approval fields it documents for the APPROVED case. `additionalProperties` stays open
// for the Undetermined/Blocking/Recommendations prose the agent's structured return also carries.
const UI_CHECK_SCHEMA = {
  type: "object",
  required: ["status", "dimensions"],
  properties: {
    status: {
      type: "string",
      enum: ["APPROVED", "BLOCKED"],
      description: "Overall verdict per the agent's own rule: BLOCK or COULD NOT DETERMINE on any dimension forces BLOCKED.",
    },
    dimensions: {
      type: "object",
      description:
        "One verdict per named dimension. Dimension 6 (Registry Safety) is present unless the project config explicitly disables the UI safety gate — `agents/ui-checker.md`'s own skip rule, repeated verbatim in uiCheckPrompt() below — so it is deliberately NOT in `required`: a project that legitimately skips it must not fail validation and get reported as a lane that never ran.",
      required: ["1", "2", "3", "4", "5"],
      properties: {
        1: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
        2: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
        3: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
        4: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
        5: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
        6: { type: "string", enum: ["PASS", "FLAG", "BLOCK", "COULD NOT DETERMINE"] },
      },
    },
    reviewed_at: {
      type: "string",
      description: "Present only when status is APPROVED, per the agent's own <verdict_format> contract.",
    },
  },
};

// ── Eager arg validation ───────────────────────────────────────────────────────────────
// Everything below throws BEFORE the first phase()/dispatch. Note what is deliberately NOT
// validated here: whether specPath actually exists on disk. This script has no filesystem
// access (README §3) — that precondition is the caller's, stated explicitly in
// spec/phase.md before this Workflow is ever invoked.
const {
  specPath,
  phase: phaseId,
  includeUiChecker,
  uiSpecPath = null,
} = args;

if (!specPath) {
  throw new Error(
    "spec-research-pair: args.specPath is required — the ai_spec_path both domain-researcher and ai-researcher read-modify-write. framework-selector must have created it before this script is invoked; the existence check itself is the caller's precondition, not this script's.",
  );
}
if (!phaseId) {
  throw new Error("spec-research-pair: args.phase is required (the phase id).");
}
if (typeof includeUiChecker !== "boolean") {
  throw new Error(
    "spec-research-pair: args.includeUiChecker is required and must be a boolean — whether the phase's UI chain is active and ui-checker should run as a third member.",
  );
}
if (includeUiChecker && !uiSpecPath) {
  throw new Error(
    "spec-research-pair: args.uiSpecPath is required when includeUiChecker is true — ui-checker's UI-SPEC.md input. Never defaulted here.",
  );
}

// ── Member 1: domain-researcher, inputs only ───────────────────────────────────────────
// `agents/domain-researcher.md` owns the procedure (research, synthesize, write Sections
// 1/1b) and the output contract. The prompt carries only its declared inputs.
function domainPrompt() {
  return [
    `Run your full domain-research procedure for phase ${phaseId}.`,
    "",
    "Inputs:",
    `- ai_spec_path: ${specPath}`,
    `- phase_id: ${phaseId}`,
    "",
    "Follow your own execution flow exactly and at full depth. Edit only Sections 1 and 1b " +
      "of AI-SPEC.md in place, never a whole-file Write unless ai_spec_path is missing " +
      "(an upstream failure — say so explicitly if you hit it). You are non-interactive: " +
      "never wait for a user.",
    // Wire instruction, not a procedure restatement: this agent's .md documents no structured
    // return, so without this line it answers in prose and a member that did its whole job
    // fails schema validation and is reported as a coverage gap.
    "Return only the JSON matching the required schema: specPath, sectionsWritten, " +
      "criticalFailureModesCount (and upstreamIssue if ai_spec_path was missing).",
  ].join("\n");
}

// ── Member 2: ai-researcher, inputs only ───────────────────────────────────────────────
// `agents/ai-researcher.md` owns the procedure (fetch docs, write Sections 3/4/4b) and the
// output contract. Same treatment as member 1.
function aiResearchPrompt() {
  return [
    `Run your full framework-research procedure for phase ${phaseId}.`,
    "",
    "Inputs:",
    `- ai_spec_path: ${specPath}`,
    `- phase_id: ${phaseId}`,
    "",
    "Follow your own execution flow exactly and at full depth. Edit only Sections 3, 4, and " +
      "4b of AI-SPEC.md in place, never a whole-file Write unless ai_spec_path is missing " +
      "(an upstream failure — say so explicitly if you hit it). You are non-interactive: " +
      "never wait for a user.",
    // Same wire instruction, same reason as member 1.
    "Return only the JSON matching the required schema: specPath, sectionsWritten, " +
      "frameworkDocsFetched (and upstreamIssue if ai_spec_path was missing).",
  ].join("\n");
}

// ── Member 3 (conditional): ui-checker, inputs only ────────────────────────────────────
// `agents/ui-checker.md` owns the procedure (six dimensions) and the output contract.
function uiCheckPrompt() {
  return [
    `Verify UI-SPEC.md for phase ${phaseId}.`,
    "",
    "Inputs:",
    `- ui_spec_path: ${uiSpecPath}`,
    `- phase_id: ${phaseId}`,
    "",
    "Follow your own <verification_dimensions> exactly, all six dimensions, none skipped " +
      "unless project config explicitly disables the UI safety gate. You are read-only: " +
      "modify nothing. You are non-interactive: never wait for a user.",
  ].join("\n");
}

// Opts builders. Keys that are absent are OMITTED, never defaulted — an omitted
// `model`/`effort` means "inherit the session model."
function domainOpts() {
  return {
    ...(args.routing?.["domain-researcher"] ?? {}),
    label: `spec-research-pair:${phaseId}:domain-researcher`,
    phase: PHASE_RESEARCH,
    schema: DOMAIN_RESEARCH_SCHEMA,
    agentType: "domain-researcher",
  };
}

function aiResearchOpts() {
  return {
    ...(args.routing?.["ai-researcher"] ?? {}),
    label: `spec-research-pair:${phaseId}:ai-researcher`,
    phase: PHASE_RESEARCH,
    schema: AI_RESEARCH_SCHEMA,
    agentType: "ai-researcher",
  };
}

function uiCheckOpts() {
  return {
    ...(args.routing?.["ui-checker"] ?? {}),
    label: `spec-research-pair:${phaseId}:ui-checker`,
    phase: PHASE_RESEARCH,
    schema: UI_CHECK_SCHEMA,
    agentType: "ui-checker",
  };
}

// ── Thunk layer ────────────────────────────────────────────────────────────────────────
// Thunks, not already-invoked promises: `parallel()` controls concurrency and its barrier
// semantics hold. The roster is static per run (2 units, or 3 when includeUiChecker), built
// once here, never mutated mid-fan-out.
const units = [
  { name: "domain-researcher", thunk: () => agent(domainPrompt(), domainOpts()) },
  { name: "ai-researcher", thunk: () => agent(aiResearchPrompt(), aiResearchOpts()) },
];
if (includeUiChecker) {
  units.push({ name: "ui-checker", thunk: () => agent(uiCheckPrompt(), uiCheckOpts()) });
}

phase(PHASE_RESEARCH);
log(
  `spec-research-pair phase ${phaseId}: dispatching ${units.length} member(s) concurrently — ` +
    `domain-researcher + ai-researcher against ${specPath}` +
    (includeUiChecker ? `, plus ui-checker against ${uiSpecPath}.` : "."),
);

const results = await parallel(units.map((u) => u.thunk));

phase(PHASE_AGGREGATE);

// ── Coverage gaps ──────────────────────────────────────────────────────────────────────
// A member that did not return is NOT a member that found nothing. Log every drop loudly,
// by name, with what it means for the caller.
const missingUnits = [];
const [domainResearch, aiResearch, uiCheck = null] = results;

if (!domainResearch) {
  const reason =
    "COVERAGE GAP: domain-researcher did not return — Sections 1 and 1b of AI-SPEC.md are NOT covered";
  missingUnits.push({ unit: "domain-researcher", reason });
  log(
    `${reason} for phase ${phaseId}: no critical failure modes, no domain context, no rubric ` +
      "ingredients. eval-planner cannot build rubrics against ground it doesn't have. Re-dispatch " +
      "this member before eval-planner runs.",
  );
}
if (!aiResearch) {
  const reason =
    "COVERAGE GAP: ai-researcher did not return — Sections 3, 4, and 4b of AI-SPEC.md are NOT covered";
  missingUnits.push({ unit: "ai-researcher", reason });
  log(
    `${reason} for phase ${phaseId}: no framework quick reference, no implementation guidance, ` +
      "no AI systems best practices. Re-dispatch this member before eval-planner runs.",
  );
}
if (includeUiChecker && !uiCheck) {
  const reason = "COVERAGE GAP: ui-checker did not return — UI-SPEC.md was NOT verified";
  missingUnits.push({ unit: "ui-checker", reason });
  log(
    `${reason} for phase ${phaseId}: none of the six dimensions were checked; ` +
      `${uiSpecPath} has no verdict at all — not APPROVED, not BLOCKED, simply unverified. ` +
      "The UI chain must not be treated as cleared. Re-dispatch this member.",
  );
}

if (!domainResearch && !aiResearch && (!includeUiChecker || !uiCheck)) {
  throw new Error(
    `spec-research-pair: every dispatched member failed for phase ${phaseId} — AI-SPEC.md has no new domain or framework research` +
      (includeUiChecker ? ", and UI-SPEC.md has no verdict" : "") +
      ". Nothing to hand to eval-planner; re-run before proceeding.",
  );
}

const allCovered = missingUnits.length === 0;

if (domainResearch) {
  log(
    `domain-researcher: sections ${JSON.stringify(domainResearch.sectionsWritten || [])} written, ` +
      `${domainResearch.criticalFailureModesCount ?? "an unreported number of"} critical failure mode(s).`,
  );
}
if (aiResearch) {
  log(
    `ai-researcher: sections ${JSON.stringify(aiResearch.sectionsWritten || [])} written, ` +
      `${aiResearch.frameworkDocsFetched ?? "an unreported number of"} doc page(s) fetched.`,
  );
}
if (includeUiChecker && uiCheck) {
  log(`ui-checker: status ${uiCheck.status}, dimensions ${JSON.stringify(uiCheck.dimensions)}.`);
}
log(
  `spec-research-pair phase ${phaseId}: ${units.length - missingUnits.length}/${units.length} member(s) returned. allCovered=${allCovered}.`,
);

return {
  // Echoed so the worklist is self-describing without re-reading the dispatch args.
  phase: phaseId,
  // Verbatim member returns; null means it did not return at all (see missingUnits),
  // never "it found nothing".
  domainResearch: domainResearch || null,
  aiResearch: aiResearch || null,
  // null both when the UI chain was off (not dispatched) and when it was on but the member
  // dropped — the caller distinguishes the two via includeUiChecker (its own arg) plus
  // missingUnits, never by inspecting this field alone.
  uiCheck: uiCheck || null,
  // Named separately per README §3: every dropped unit named here, never silently absent.
  missingUnits,
  // True only when every dispatched unit (2 or 3) returned.
  allCovered,
};
