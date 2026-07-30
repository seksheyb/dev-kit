/**
 * discovery-research — discovery WAVE 2, one fan-out.
 * =============================================================================
 * Owns ONE thing: dispatching this phase's pre-selected gray areas to one
 * `advisor-researcher` each, alongside the single `pattern-mapper`, in one parallel
 * fan-out, and handing the caller back the advisors' comparison tables plus the
 * pattern-mapper's artifact pointer.
 *
 * Invoked by `plugins/dk/commands/discover/research.md` after discovery wave 1 has run
 * (four codebase-mappers, the assumptions-analyzer, the phase-researcher). Wave 1 is what
 * leaves the gray areas open; this script never discovers them.
 *
 * ALWAYS a Workflow when there is at least one open gray area: advisors + pattern-mapper
 * is 2 or more units by construction. With ZERO open gray areas there is nothing to fan
 * out — the caller dispatches `pattern-mapper` alone as a plain inline Agent call, because
 * a Workflow for one agent is pure overhead. That branch never reaches this file, and the
 * validation below rejects it rather than quietly running a one-agent workflow.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * grayAreas        array   REQUIRED, length 1-5. One entry per gray-area decision wave 1
 *                          left open, ALREADY SELECTED AND CAPPED by the caller:
 *   grayArea.name         string  REQUIRED. Short area name ("session storage",
 *                                 "payment provider"). Used as the agent label, echoed in
 *                                 the return, and named in this area's coverage gap.
 *   grayArea.description  string  REQUIRED. What the decision actually is, in the caller's
 *                                 own words. Passed through verbatim.
 * phaseContext     string  REQUIRED. The phase description from the roadmap. Every advisor
 *                          and the pattern-mapper get the same text.
 * projectContext   string  REQUIRED. Brief project info — stack, constraints, posture.
 *                          This is what makes a recommendation "conditional on X" instead
 *                          of generic.
 * phase            string  REQUIRED. The phase identifier (`NN`, e.g. "03"). Used in labels
 *                          and passed to `pattern-mapper`, which derives its own PHASE_DIR.
 * calibrationTier  string  optional, default "standard". One of `full_maturity`,
 *                          `standard`, `minimal_decisive` — the tier CLAUDE.md's Discovery
 *                          Calibration section declares. The default is MECHANICAL, not a
 *                          judgment call: `agents/advisor-researcher.md` <calibration_tiers>
 *                          itself documents "if the caller passed no tier, or passed one
 *                          that is not one of the three, use `standard`". Defaulting here
 *                          only makes the dispatch say out loud what the agent would have
 *                          assumed anyway; it is not this script deciding output shape.
 *
 * -----------------------------------------------------------------------------
 * THE CAP IS SPLIT ON PURPOSE — 5 is enforced here, chosen upstream
 * -----------------------------------------------------------------------------
 * The script THROWS above 5 advisors. Counting a list is mechanical, so mechanical
 * enforcement belongs at the dispatch site, where it cannot be forgotten.
 *
 * WHICH 5 is never this script's call, and it never truncates to make the number fit.
 * Silently dropping the 6th gray area would return a wave that looks complete while a real
 * decision quietly went unresearched — exactly the failure the coverage-gap logging below
 * exists to prevent. So over-cap input is a hard error, and the caller's obligation is:
 *
 *   1. Keep the 5 gray areas with the highest blast radius — architecture, security,
 *      payments, auth first, then whatever a wrong call is most expensive to unwind.
 *   2. Fold the remainder into ONE combined advisor covering them together (that combined
 *      area is one of the 5), or defer them to a follow-up wave.
 *
 * Both steps are judgment about this specific phase's risk surface. They live with the
 * caller, and documenting them HERE is what lets the command body stay thin.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision this wave needs was made before the call:
 *   - which gray areas are open, and which 5 of them get an advisor — the CALLER
 *     (`commands/discover/research.md`), from wave 1's research output.
 *   - how each area is described, and what the phase/project context says — the CALLER.
 *   - the calibration tier — the project's `CLAUDE.md`, read by the CALLER; the "standard"
 *     fallback is `advisor-researcher.md`'s own documented rule, not a choice made here.
 *   - the table shape, column semantics, option count, recommendation style, rationale
 *     length, and research tooling — `agents/advisor-researcher.md`, entirely. The prompt
 *     below is INPUTS ONLY and deliberately restates none of it.
 *   - what PATTERNS.md contains and where it goes — `agents/pattern-mapper.md`.
 *   - folding the returned tables into RESEARCH.md / the plan — the CALLER, after this
 *     returns. This script writes nothing.
 *
 * -----------------------------------------------------------------------------
 * MODEL: NO hardcode — both units are scored, not pinned
 * -----------------------------------------------------------------------------
 * `advisor-researcher` used to run on an explicit `model: sonnet` override (call-site
 * constant `ADVISOR_MODEL`, per an earlier version of `references/agent-model-tiers.md`'s
 * "Operator override" section). That override is removed: every agent in this corpus,
 * `advisor-researcher` included, is scored from its dispatch descriptor's real signals —
 * see `agent-model-tiers.md`'s "Model pinning removed" sections for why a name-based
 * override was judged not to be a better signal than the descriptor's own
 * novelty/logic/ambiguity. `pattern-mapper` was already unpinned the same way (its
 * frontmatter's own `model: sonnet` was removed earlier in the same change).
 *
 * Neither unit gets a hardcoded `model` or `effort` key from this script. The only model
 * or effort that reaches either dispatch is whatever `args.routing['advisor-researcher']` /
 * `args.routing['pattern-mapper']` carries (see MODEL/EFFORT ROUTING below) — an absent
 * `routing` or an absent entry for either key leaves both keys absent, which means
 * "inherit," never a guessed default.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read before running
 * -----------------------------------------------------------------------------
 * Both units dispatch by bare `agentType` ("advisor-researcher", "pattern-mapper") so that
 * `agents/advisor-researcher.md` and `agents/pattern-mapper.md` stay the single source of
 * truth for their own methodology. How a PLUGIN-NAMESPACED agent resolves by bare type is
 * install-dependent and unverified from this repo. If a bare name does not resolve in a
 * given install, use the plugin-qualified escape hatch — `"dev-kit-core:advisor-researcher"`
 * and `"dev-kit-core:pattern-mapper"` — in the two constants below.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used, and none of the 13 pipeline workflow
 * scripts in this family needs it: no member of any of these waves commits, so there is no
 * concurrent mutation of the index or of a shared branch to isolate. This wave is the
 * clearest case of it — every advisor is pure research that writes no file at all, and
 * `pattern-mapper` is the ONLY writer in the fan-out, with exactly one output path
 * (`PATTERNS.md` in the phase directory) that nothing else in the wave touches. A worktree
 * would additionally strand that PATTERNS.md off the main tree, buying a merge step for no
 * benefit.
 *
 * -----------------------------------------------------------------------------
 * RETURNS
 * -----------------------------------------------------------------------------
 * { phase, calibrationTier, dispatchedGrayAreas, advisorTables, unresolvedGrayAreas,
 *   patterns } — see the bottom of this file. `advisorTables` is the fold-in worklist,
 * `unresolvedGrayAreas` is the still-open-decision list, and `patterns` is null when the
 * pattern-mapper did not come back at all.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `plugins/dk/bin/model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['advisor-researcher']` /
 * `args.routing?.['pattern-mapper']` (optional `{model, effort}` each) are spread into
 * their respective opts alongside the always-set keys (`agentType`/`schema`/`label`/
 * `phase`). An absent `routing` or an absent entry for either key leaves both keys absent,
 * which means inherit — never a guessed default.
 */

export const meta = {
  name: "discovery-research",
  description:
    "Discovery wave 2: one advisor-researcher per pre-selected gray area (max 5) plus the pattern-mapper, in one parallel fan-out. Advisor tables return via schema for the caller to fold.",
  whenToUse:
    "Called by the discovery research step when wave 1 left 1 or more gray-area decisions open — advisors plus the pattern-mapper is always 2 or more units, so that case is always a Workflow. With zero open gray areas there is nothing to fan out: dispatch the pattern-mapper alone as a plain inline Agent call instead.",
  phases: [
    {
      title: "Research fan-out",
      detail: "up to 5 advisor-researchers + the pattern-mapper, in parallel",
    },
  ],
};

const PHASE_TITLE = "Research fan-out";

// Bare names by default. See AGENT RESOLUTION in the header for the plugin-qualified
// escape hatch ("dev-kit-core:advisor-researcher" / "dev-kit-core:pattern-mapper").
const ADVISOR_AGENT_TYPE = "advisor-researcher";
const PATTERN_AGENT_TYPE = "pattern-mapper";

// The three tiers `agents/advisor-researcher.md` <calibration_tiers> defines. Listed here
// only so the log can say when the caller passed something outside the set; the agent
// applies its own documented `standard` fallback either way, and the dispatch is never
// blocked on it.
const CALIBRATION_TIERS = ["full_maturity", "standard", "minimal_decisive"];

// Mirrors `agents/advisor-researcher.md` <output_format> field for field: the `## {area_name}`
// heading, the 5-column table (Option | Pros | Cons | Complexity | Recommendation), and the
// single `**Rationale:**` paragraph. `tableMarkdown` carries that table VERBATIM as markdown
// rather than as parsed rows — the caller folds it straight into RESEARCH.md or a plan, and
// re-rendering rows here would be a second, drifting copy of a format that agent owns.
// `additionalProperties` is left open on purpose: a stray extra key must not invalidate a
// real table and cost this gray area its only recommendation.
const ADVISOR_RESULT_SCHEMA = {
  type: "object",
  required: ["areaName", "tableMarkdown", "rationale"],
  properties: {
    areaName: {
      type: "string",
      description:
        "The gray area researched, verbatim from the dispatch — the `{area_name}` in the agent's `## {area_name}` heading.",
    },
    tableMarkdown: {
      type: "string",
      description:
        "The 5-column comparison table verbatim as markdown, header row and separator included: Option | Pros | Cons | Complexity | Recommendation. Complexity is impact surface + risk, never a time estimate; Recommendation is conditional, never a single-winner ranking.",
    },
    rationale: {
      type: "string",
      description:
        "The single rationale paragraph grounding the recommendation in the project context. Length follows the calibration tier.",
    },
  },
};

// Mirrors `agents/pattern-mapper.md` <structured_returns>: "File Created" (`$PHASE_DIR/PATTERNS.md`)
// and "Analogs found: {matched} / {total}".
const PATTERN_RESULT_SCHEMA = {
  type: "object",
  required: ["patternsPath", "analogsFound"],
  properties: {
    patternsPath: {
      type: "string",
      description:
        "Path to the PATTERNS.md that was written. EMPTY STRING when the agent returned its documented \"Pattern Mapping Blocked — No Input\" result (CONTEXT.md and RESEARCH.md both missing or empty of file references) and correctly wrote no file. An empty string is a real, reportable answer — it must not be confused with the agent never returning at all.",
    },
    analogsFound: {
      type: "integer",
      description:
        "Number of files matched to an existing analog (the `{matched}` in \"Analogs found: {matched} / {total}\"). 0 when blocked.",
    },
  },
};

const {
  grayAreas: rawGrayAreas,
  phaseContext,
  projectContext,
  phase: phaseId,
  calibrationTier: rawTier,
} = args;

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (!Array.isArray(rawGrayAreas)) {
  throw new Error(
    "discovery-research: `grayAreas` is required and must be an array of { name, description } — one entry per open gray-area decision wave 1 left behind.",
  );
}
if (rawGrayAreas.length === 0) {
  throw new Error(
    "discovery-research: `grayAreas` is empty. With zero open gray areas this wave is the pattern-mapper alone — dispatch it as a plain inline Agent call; a Workflow for one agent is pure overhead.",
  );
}
if (rawGrayAreas.length > 5) {
  throw new Error(
    `discovery-research: ${rawGrayAreas.length} gray areas passed; the cap is 5 advisor-researchers per wave. This script will NOT pick which 5 — truncating here would hide a real unresearched decision behind a wave that looks complete. Keep the 5 with the highest blast radius (architecture/security/payments/auth first, then whatever a wrong call is most expensive to unwind), fold the remainder into ONE combined advisor covering them together, or defer them to a follow-up wave, then call again.`,
  );
}
const malformed = rawGrayAreas.filter((g) => !g || !g.name || !g.description);
if (malformed.length > 0) {
  throw new Error(
    `discovery-research: ${malformed.length} gray area(s) missing a required \`name\` or \`description\`. Every advisor needs both — the name is how its coverage gap is reported, the description is the decision itself.`,
  );
}
if (!phaseContext) {
  throw new Error(
    "discovery-research: `phaseContext` is required — the phase description from the roadmap, which every advisor and the pattern-mapper receive.",
  );
}
if (!projectContext) {
  throw new Error(
    "discovery-research: `projectContext` is required — recommendations are conditional on it, so a dispatch without it returns generic advice.",
  );
}
if (!phaseId) {
  throw new Error(
    "discovery-research: `phase` is required (the `NN` phase identifier). The pattern-mapper derives its own PHASE_DIR from it.",
  );
}

const grayAreas = rawGrayAreas;
// Mechanical fallback, documented by the agent itself — never a shape decision made here.
const calibrationTier = rawTier || "standard";
if (rawTier && !CALIBRATION_TIERS.includes(rawTier)) {
  log(
    `discovery-research: calibrationTier "${rawTier}" is not one of ${CALIBRATION_TIERS.join(", ")}. Passing it through unchanged — advisor-researcher.md applies its own documented \`standard\` fallback for anything outside the set.`,
  );
}

// INPUTS ONLY. `advisor-researcher.md` owns the calibration tiers, the 5-column table, the
// column semantics and the anti-patterns; restating any of it here would create a second
// copy free to drift from the agent that actually enforces it.
function advisorPrompt(area) {
  return [
    "Research exactly ONE gray area and return one comparison table with rationale.",
    "",
    "<gray_area>",
    `Name: ${area.name}`,
    `Description: ${area.description}`,
    "</gray_area>",
    "",
    "<phase_context>",
    phaseContext,
    "</phase_context>",
    "",
    "<project_context>",
    projectContext,
    "</project_context>",
    "",
    "<calibration_tier>",
    calibrationTier,
    "</calibration_tier>",
    "",
    "Follow your own output format, rules and tool strategy exactly, at full depth. Do not research any other gray area. Write no files — the caller folds your table in. You are non-interactive: never wait for a user.",
    "",
    `Return JSON matching the required schema: \`areaName\` is "${area.name}", \`tableMarkdown\` is your 5-column table verbatim as markdown, \`rationale\` is your rationale paragraph.`,
  ].join("\n");
}

// INPUTS ONLY, same reasoning: `pattern-mapper.md` owns PHASE_DIR derivation, the analog
// search, the early-stopping rule, the PATTERNS.md structure and the refuse-on-empty-input
// precondition.
function patternPrompt() {
  return [
    `Map this phase's files-to-be-created onto their closest existing analogs and write PATTERNS.md. Phase: ${phaseId}.`,
    "",
    "<phase_context>",
    phaseContext,
    "</phase_context>",
    "",
    "<project_context>",
    projectContext,
    "</project_context>",
    "",
    "Derive PHASE_DIR, CONTEXT.md and RESEARCH.md yourself as your instructions document, and follow your own execution flow and output contract exactly, at full depth. Advisor-researchers are running alongside you in this same wave; they write nothing, so PATTERNS.md is yours alone. You are non-interactive: never wait for a user.",
    "",
    "Return JSON matching the required schema: `patternsPath` is the path to the PATTERNS.md you wrote, `analogsFound` is the number of files matched to an analog. If your no-usable-input precondition fires, do NOT write a file — return `patternsPath` as an empty string and `analogsFound` as 0.",
  ].join("\n");
}

function advisorOpts(area) {
  // No hardcoded `model` key: args.routing?.['advisor-researcher'] (if present) is free to
  // apply, since the router scores this agent from its own descriptor's signals like any
  // other — spread first, then the always-set keys. No `isolation` key exists on this
  // object at all — omitted means inherit.
  return {
    ...(args.routing?.["advisor-researcher"] ?? {}),
    label: `advisor:${area.name}`,
    phase: PHASE_TITLE,
    agentType: ADVISOR_AGENT_TYPE,
    schema: ADVISOR_RESULT_SCHEMA,
  };
}

function patternOpts() {
  // No hardcoded `model` key here either: args.routing?.['pattern-mapper'] (if present) is
  // free to apply, since neither the agent's frontmatter nor the config pins this agent
  // any more — spread first, then the always-set keys.
  return {
    ...(args.routing?.["pattern-mapper"] ?? {}),
    label: "pattern-mapper",
    phase: PHASE_TITLE,
    agentType: PATTERN_AGENT_TYPE,
    schema: PATTERN_RESULT_SCHEMA,
  };
}

phase(PHASE_TITLE);
log(
  `discovery-research phase ${phaseId}: ${grayAreas.length} advisor-researcher(s) at tier ${calibrationTier} — ${grayAreas
    .map((g) => g.name)
    .join(", ")} — plus the pattern-mapper, all in one fan-out. Advisors write nothing; the pattern-mapper is the only writer.`,
);

// Thunks, never live promises. `parallel()` is the barrier for the whole wave and never
// rejects — a failed thunk yields null, which the coverage-gap pass below converts into a
// loud, named gap. The pattern-mapper rides in the SAME call because it is independent of
// every advisor: it reads wave 1's artifacts and the codebase, not their tables.
const results = await parallel([
  ...grayAreas.map((area) => () => agent(advisorPrompt(area), advisorOpts(area))),
  () => agent(patternPrompt(), patternOpts()),
]);

const advisorResults = results.slice(0, grayAreas.length);
const patternResult = results[grayAreas.length] || null;

// A dropped advisor is a decision that is STILL OPEN, never a silent absence.
const advisorTables = [];
const unresolvedGrayAreas = [];
advisorResults.forEach((result, i) => {
  const area = grayAreas[i];
  if (result) {
    advisorTables.push({
      name: area.name,
      description: area.description,
      areaName: result.areaName,
      tableMarkdown: result.tableMarkdown,
      rationale: result.rationale,
    });
  } else {
    unresolvedGrayAreas.push({
      name: area.name,
      description: area.description,
      reason: "advisor-researcher returned nothing (agent failed, was skipped, or its output failed schema validation)",
    });
    log(
      `COVERAGE GAP: gray area "${area.name}" got no recommendation — its advisor-researcher returned nothing. That decision is STILL OPEN. Do not fold this wave in as if the area were researched: re-dispatch this one advisor, or record the decision as unresolved before planning depends on it.`,
    );
  }
});

if (!patternResult) {
  log(
    `COVERAGE GAP: the pattern-mapper returned nothing for phase ${phaseId}. No PATTERNS.md was produced, so NOTHING in this phase has been mapped to an existing analog and planning has no analog excerpts to reference. Re-dispatch it before authoring plan actions — this is its own gap, separate from any gray area's.`,
  );
} else if (!patternResult.patternsPath) {
  // Distinct from the gap above: the agent RAN and reported it could not map anything,
  // which is its documented refuse-on-empty-input outcome, not a dispatch failure.
  log(
    `Pattern mapping BLOCKED for phase ${phaseId}: the pattern-mapper ran and correctly wrote no PATTERNS.md because CONTEXT.md and RESEARCH.md yielded no files to map. This is a missing-upstream-input problem, not a failed agent — fix the input and re-dispatch it.`,
  );
} else {
  log(
    `pattern-mapper: ${patternResult.patternsPath} — ${patternResult.analogsFound} file(s) matched to an analog.`,
  );
}

// Everything failed: there is no wave to report on at all.
if (advisorTables.length === 0 && !patternResult) {
  throw new Error(
    `discovery-research: every unit failed — ${grayAreas.length} advisor-researcher(s) and the pattern-mapper all returned nothing. No gray area was researched and no PATTERNS.md exists; nothing was produced for this wave.`,
  );
}

log(
  `Research fan-out complete: ${advisorTables.length}/${grayAreas.length} advisor table(s) returned, ${unresolvedGrayAreas.length} gray area(s) still open, pattern-mapper ${patternResult ? "returned" : "MISSING"}. Folding the tables into the phase's research/plan artifacts is the caller's next action — this script writes nothing.`,
);

return {
  // Echoed so the caller's worklist is self-describing without re-deriving the dispatch.
  phase: phaseId,
  calibrationTier,
  dispatchedGrayAreas: grayAreas.map((g) => g.name),
  // The fold-in worklist: one entry per advisor that came back, each carrying its 5-column
  // table verbatim as markdown plus its rationale, ready to paste into RESEARCH.md or a plan.
  advisorTables,
  // Named separately and never merged with `advisorTables`: these gray areas have NO
  // recommendation because their advisor died. Each is an open decision the caller must
  // re-dispatch or explicitly record as unresolved — not an area that returned "no clear
  // winner", which would have come back as a table.
  unresolvedGrayAreas,
  // null means the pattern-mapper never returned (see its coverage gap above). An object
  // with an empty `patternsPath` is the different, non-fatal case: it ran and correctly
  // refused on empty upstream input. Both are "no PATTERNS.md", for opposite reasons.
  patterns: patternResult,
};
