/**
 * discovery-map — Discovery wave 1: the fixed 6-agent fan-out.
 *
 * Invoked by `plugins/dk/commands/discover/map.md` whenever the roster is 2 or more agents —
 * which, for this command, is ALWAYS, because the roster is fixed at exactly 6: four
 * `codebase-mapper` agents (focus tech/arch/quality/concerns), one `assumptions-analyzer`, and
 * one `phase-researcher`. There is no smaller-roster path through this command; the "Exactly 1"
 * row of its routing table exists only for the operator re-running a single dropped unit inline,
 * never for a normal run.
 *
 * -----------------------------------------------------------------------------
 * args contract
 * -----------------------------------------------------------------------------
 *   phase             string   REQUIRED. Phase number/id (e.g. "03"), used in log lines and in
 *                               the assumptions-analyzer prompt. This script does no filesystem
 *                               resolution of its own — it never derives PHASE_DIR or globs for it.
 *   calibrationTier   string   REQUIRED. One of assumptions-analyzer's/phase-researcher's tiers
 *                               ("full_maturity" | "standard" | "minimal_decisive"). The CALLER
 *                               (`commands/discover/map.md`) is the one that reads CLAUDE.md's
 *                               Discovery Calibration section and defaults a missing/blank
 *                               section to "standard" — that defaulting rule lives in the
 *                               command, not here. This script passes whatever string it is
 *                               handed straight through with zero interpretation.
 *   roadmapPath       string   REQUIRED. Path to the milestone's ROADMAP.md. Used only by the
 *                               phase-researcher dispatch (see the STRUCTURAL ISOLATION note
 *                               below) — never read from disk by this script itself.
 *   phaseDescription  string   REQUIRED. The phase's description/goal text (should already
 *                               carry its own phase number/name identifier, since the
 *                               phase-researcher prompt builder below accepts no separate
 *                               `phase` parameter — see STRUCTURAL ISOLATION).
 *   milestone         string   optional. Milestone id `<M>`, e.g. "M2". Passed to the
 *                               assumptions-analyzer only, so it can locate
 *                               `docs/milestones/<M>/ROADMAP.md` and any prior phase
 *                               `CONTEXT.md` files itself, per its own documented Process step
 *                               1-2. Omitted entirely when absent — the agent still runs, it
 *                               just has to resolve `<M>` on its own.
 *   scopePaths        string[] optional. Repo-relative path prefixes to scope exploration to —
 *                               threaded through to every codebase-mapper dispatch as that
 *                               agent's own documented `--paths` hint (the incremental-remap
 *                               path used by the post-execute codebase-drift gate). Omitted
 *                               entirely when absent, which is codebase-mapper's own default
 *                               (whole-repo scan).
 *
 * -----------------------------------------------------------------------------
 * DESIGN RATIONALE — why a fixed 6-thunk parallel(), not a data-driven roster
 * -----------------------------------------------------------------------------
 * Every other exemplar workflow in this directory takes its unit list as data (`args.lenses`,
 * `args.waves[].tracks`, ...). This one does not, on purpose: the roster is not a planning
 * decision anyone makes per run — it is always "the four mapper focuses, plus assumptions,
 * plus research", every single time this wave runs. Making it configurable would just invite a
 * caller to accidentally drop a focus area and call it discovery. So the six units are a literal
 * array of six entries below, not derived from any `args` field.
 *
 * STRUCTURAL ISOLATION (the phase-researcher / codebase-map problem). The four codebase-mapper
 * agents in THIS SAME WAVE are rewriting `docs/global/codebase/{STACK,ARCHITECTURE,...}.md` —
 * the very documents the phase-researcher would normally be free to read for context. If the
 * phase-researcher read them mid-wave, it could read a half-written map (a mapper agent still
 * mid-Write, or one that already returned while another is still exploring) and cite it as
 * ground truth. The fix is not a runtime warning telling the phase-researcher "don't read the
 * map" — model instructions are exactly the kind of thing that gets skipped under context
 * pressure. The fix is structural: `buildResearcherPrompt(roadmapPath, phaseDescription)` below
 * takes exactly those two parameters and closes over nothing else — no `scopePaths`, no
 * `milestone`, no reference to `docs/global/codebase/` — so there is no code path by which this
 * script could thread map content, or even a map *path*, into that prompt. It is structurally
 * impossible for this dispatch to leak the map, not merely instructed not to.
 *
 * `grayAreasOpen` in the phase-researcher's returned schema (below) is not cosmetic: it is the
 * exact list Discovery wave 2 (`discovery-research.workflow.mjs`, dispatched by
 * `commands/discover/research.md`) needs to fan its advisor-researchers out over, one per gray
 * area. The caller passes `research.grayAreasOpen` from this script's return straight into that
 * wave's args — this script's return shape is that handoff's input contract, not just a report.
 *
 * ZERO JUDGMENT LIVES HERE. The roster (6 fixed units), the calibration-tier default, the
 * roadmap path, and the phase description are all decided by the CALLER
 * (`commands/discover/map.md`, which reads CLAUDE.md's Discovery Calibration section). Folding
 * the assumptions and the phase-relevant map findings into the phase's CONTEXT.md is also the
 * caller's job — explicitly, per its own routing note — never this script's. This script only
 * dispatches the six fixed thunks, classifies what came back, and returns a worklist.
 *
 * ISOLATION: NONE of these 6 dispatches uses `isolation:'worktree'`. All six are read/analyze
 * agents; only the four codebase-mappers write anything at all (their own Write tool to
 * `docs/global/codebase/*.md`, one distinct document set per focus — tech/arch/quality/concerns
 * never touch the same file), and none of the six makes a git commit. There is no concurrent
 * mutation of a shared branch or shared file to isolate, so a worktree would only buy
 * provisioning latency for nothing.
 *
 * AGENT RESOLUTION — UNVERIFIED, read this before running. Dispatch goes through the
 * `AGENT_TYPES` map below (bare names: "codebase-mapper", "assumptions-analyzer",
 * "phase-researcher") so that each agent's own `.md` file stays the single source of truth for
 * its procedure and output contract; the prompts built below carry ONLY each agent's documented
 * *inputs*. If a bare name does not resolve in a given install, edit the corresponding
 * `AGENT_TYPES` entry to the plugin-qualified form, e.g. `"dev-kit-core:codebase-mapper"` — there
 * is no per-run override arg for this, because the roster and its agent types are exactly as
 * fixed as the roster count itself.
 *
 * Returns: { phase, mappers, assumptions, research, missingUnits } — see the bottom of this
 * file. `assumptions` and `research` are `null` when that unit was dropped (COVERAGE GAP logged
 * at drop time); `mappers` only ever contains units that actually returned.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `plugins/dk/bin/model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. Each dispatch's `args.routing?.[agentType]` (keyed by the
 * same bare agentType name as `AGENT_TYPES` above — `codebase-mapper`, `assumptions-analyzer`,
 * `phase-researcher`; optional `{model, effort}`) is spread into that unit's opts; an absent
 * `routing` or an absent entry for that key leaves both keys absent, which means inherit —
 * never a guessed default.
 */

export const meta = {
  name: "discovery-map",
  description:
    "Discovery wave 1: fixed 6-agent roster — four codebase-mappers (tech/arch/quality/concerns), the assumptions-analyzer, and the phase-researcher — in one parallel fan-out. The fold stays with the caller.",
  whenToUse:
    "The roster is fixed at 6, so a normal run always goes through this Workflow. Route a single unit inline only to re-run one dropped unit after a prior run.",
  phases: [
    { title: "Discovery fan-out", detail: "4 mappers + assumptions-analyzer + phase-researcher, in parallel" },
  ],
};

const PHASE_TITLE = "Discovery fan-out";

// Bare agentType names. Edit here (see AGENT RESOLUTION above) if a bare name does not resolve
// in a given install — there is deliberately no args-level override for a fixed roster.
const AGENT_TYPES = {
  mapper: "codebase-mapper",
  assumptions: "assumptions-analyzer",
  research: "phase-researcher",
};

const FOCI = ["tech", "arch", "quality", "concerns"];

// Mirrors codebase-mapper's own "## Mapping Complete" confirmation format field-for-field
// (agents/codebase-mapper.md, <step name="return_confirmation">): **Focus:** and the
// **Documents written:** bullet list. `additionalProperties` left open so a stray extra key
// never costs the whole unit.
const MAPPER_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["focus", "documentsWritten"],
  properties: {
    focus: { type: "string", description: "Verbatim focus area, one of tech/arch/quality/concerns." },
    documentsWritten: {
      type: "array",
      items: { type: "string" },
      description: "Repo-relative paths under docs/global/codebase/ actually written this run.",
    },
  },
};

// Mirrors assumptions-analyzer's <output_format> field-for-field (agents/assumptions-analyzer.md):
// each "### [Area Name]" block's Assumption/Why this way/If wrong/Confidence bullets become one
// `assumptions[]` entry; the "## Needs External Research" list becomes `needsExternalResearch`.
// `additionalProperties` left open so a stray extra key never costs the whole unit.
const ASSUMPTIONS_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["assumptions", "needsExternalResearch"],
  properties: {
    assumptions: {
      type: "array",
      items: {
        type: "object",
        required: ["area", "assumption", "whyThisWay", "ifWrong", "confidence"],
        properties: {
          area: { type: "string" },
          assumption: { type: "string" },
          whyThisWay: { type: "string", description: "Evidence from codebase, with cited file paths." },
          ifWrong: { type: "string", description: "Concrete consequence if this assumption is wrong." },
          confidence: { type: "string", enum: ["Confident", "Likely", "Unclear"] },
        },
      },
    },
    needsExternalResearch: {
      type: "array",
      items: { type: "string" },
      description: "Topics codebase analysis alone could not settle; empty array if none.",
    },
  },
};

// NOT a field-for-field mirror of phase-researcher's own "## RESEARCH COMPLETE" structured
// return (agents/phase-researcher.md <structured_returns>) — that block is markdown prose, not
// JSON, and uses no keys named `researchPath` or `grayAreasOpen`. This schema instead names the
// two facts Discovery wave 2 actually needs out of that prose: `researchPath` corresponds to its
// "### File Created" line (`$PHASE_DIR/RESEARCH.md`), and `grayAreasOpen` corresponds to its
// "### Open Questions" list. `grayAreasOpen` is the direct input to
// `discovery-research.workflow.mjs`'s per-gray-area advisor fan-out — see DESIGN RATIONALE above.
const RESEARCH_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["researchPath", "grayAreasOpen"],
  properties: {
    researchPath: { type: "string", description: "Path to the written RESEARCH.md." },
    grayAreasOpen: {
      type: "array",
      items: { type: "string" },
      description: "Open questions from RESEARCH.md's Open Questions section — one per gray area.",
    },
  },
};

// Eager arg validation — throw with actionable messages BEFORE any phase()/dispatch.
const { phase: phaseId, calibrationTier, roadmapPath, phaseDescription, milestone, scopePaths } = args;

if (!phaseId) throw new Error("discovery-map workflow: `phase` arg is required (phase number/id, e.g. \"03\").");
if (!calibrationTier) {
  throw new Error(
    "discovery-map workflow: `calibrationTier` arg is required. The caller (commands/discover/map.md) " +
      "reads CLAUDE.md's Discovery Calibration section and defaults to \"standard\" when that section is " +
      "missing or blank — this script never guesses a default itself.",
  );
}
if (!roadmapPath) throw new Error("discovery-map workflow: `roadmapPath` arg is required (path to ROADMAP.md).");
if (!phaseDescription) {
  throw new Error("discovery-map workflow: `phaseDescription` arg is required (the phase's description/goal text).");
}
const scopePathList = Array.isArray(scopePaths) ? scopePaths : [];

// Inputs only — codebase-mapper.md owns the exploration procedure and document templates.
function buildMapperPrompt(focus) {
  const lines = [
    "You are one of four codebase-mapper agents dispatched in parallel this wave, each with a " +
      "different focus. Cover ONLY your own focus area — do not write another focus area's documents.",
    "",
    `Focus: ${focus}`,
  ];
  if (scopePathList.length > 0) lines.push(`--paths ${scopePathList.join(",")}`);
  lines.push(
    "",
    "Follow your own process and document templates exactly, at full depth. You are non-interactive: " +
      "never wait for a user.",
  );
  return lines.join("\n");
}

// Inputs only — assumptions-analyzer.md owns the analysis procedure and output contract. Passes
// through exactly what this script's own args carry (phase, phaseDescription, calibrationTier,
// and milestone when present) — no `prior_decisions` or `codebase_hints` text is synthesized
// here, since this script has neither; the agent reads prior CONTEXT.md files itself per its own
// Process step 2.
function buildAssumptionsPrompt() {
  const lines = [
    `Phase: ${phaseId}`,
    `Phase goal: ${phaseDescription}`,
    `Calibration tier: ${calibrationTier}`,
  ];
  if (milestone) lines.push(`Milestone: ${milestone}`);
  lines.push(
    "",
    "Follow your own Process and Output format exactly, at the depth your calibration tier specifies. " +
      "You are non-interactive: never wait for a user.",
  );
  return lines.join("\n");
}

// Inputs only, and DELIBERATELY only these two parameters — see STRUCTURAL ISOLATION above.
// This function closes over nothing from the outer scope (`milestone`, `scopePathList`, the
// codebase-mapper dispatches happening in the same wave) so that leaking any of it into the
// phase-researcher's prompt is not a discipline problem, it is a function-signature impossibility.
function buildResearcherPrompt(roadmapPath, phaseDescription) {
  return [
    `Roadmap: ${roadmapPath}`,
    `Phase description: ${phaseDescription}`,
    "",
    "Four codebase-mapper agents are rewriting docs/global/codebase/ in this SAME wave, in parallel " +
      "with you. Do NOT read any file under docs/global/codebase/ — it may be half-written right now. " +
      "Research this phase's domain from the roadmap and phase description above plus external " +
      "sources only.",
    "",
    "Follow your own execution flow and output contract exactly. You are non-interactive: never wait " +
      "for a user.",
  ].join("\n");
}

function buildOpts(label, agentType, schema) {
  // model/effort are decided caller-side by model-route.mjs and arrive as
  // args.routing?.[agentType] — spread first so the always-set keys below win, and so an
  // absent routing entry still means inherit, never a default this script picks.
  return {
    ...(args.routing?.[agentType] ?? {}),
    label,
    phase: PHASE_TITLE,
    agentType,
    schema,
  };
}

// The fixed 6-unit roster. Never data-driven (see DESIGN RATIONALE above) — this literal array
// IS the roster.
const units = [
  ...FOCI.map((focus) => ({
    kind: "mapper",
    label: `mapper:${focus}`,
    focus,
    dispatch: () => agent(buildMapperPrompt(focus), buildOpts(`mapper:${focus}`, AGENT_TYPES.mapper, MAPPER_SCHEMA)),
  })),
  {
    kind: "assumptions",
    label: "assumptions-analyzer",
    dispatch: () =>
      agent(buildAssumptionsPrompt(), buildOpts("assumptions-analyzer", AGENT_TYPES.assumptions, ASSUMPTIONS_SCHEMA)),
  },
  {
    kind: "research",
    label: "phase-researcher",
    dispatch: () =>
      agent(
        buildResearcherPrompt(roadmapPath, phaseDescription),
        buildOpts("phase-researcher", AGENT_TYPES.research, RESEARCH_SCHEMA),
      ),
  },
];

phase(PHASE_TITLE);
log(
  `discovery-map: phase ${phaseId}, calibration ${calibrationTier} — dispatching all 6 fixed units: ` +
    units.map((u) => u.label).join(", "),
);

// parallel() is a barrier and never rejects; a failed/skipped thunk yields null.
const raw = await parallel(units.map((u) => () => u.dispatch()));

const mappers = [];
const missingUnits = [];
let assumptions = null;
let research = null;

raw.forEach((result, i) => {
  const unit = units[i];
  if (result) {
    if (unit.kind === "mapper") mappers.push({ focus: unit.focus, ...result });
    else if (unit.kind === "assumptions") assumptions = result;
    else if (unit.kind === "research") research = result;
    return;
  }

  missingUnits.push(unit.label);
  // A dropped unit is a coverage gap, never a silent one — and the fold that follows this wave
  // is provisional until it is covered.
  if (unit.kind === "mapper") {
    log(
      `COVERAGE GAP: the "${unit.focus}" codebase-mapper lens returned nothing (agent failed or was ` +
        `skipped). docs/global/codebase/ is missing or stale for that lens — the fold that follows this ` +
        "wave is PROVISIONAL until this lens is re-run.",
    );
  } else if (unit.kind === "assumptions") {
    log(
      "COVERAGE GAP: the assumptions-analyzer lens returned nothing (agent failed or was skipped). " +
        "This phase has NO structured assumptions from this wave — the fold that follows is PROVISIONAL " +
        "until this lens is re-run.",
    );
  } else {
    log(
      "COVERAGE GAP: the phase-researcher lens returned nothing (agent failed or was skipped). " +
        "RESEARCH.md was not written and grayAreasOpen is unknown — Discovery wave 2 has nothing to fan " +
        "out over until this lens is re-run. The fold that follows this wave is PROVISIONAL.",
    );
  }
});

if (missingUnits.length === units.length) {
  throw new Error(
    "discovery-map workflow: all 6 units failed or were skipped — nothing to fold. Re-run the whole wave.",
  );
}

log(
  `discovery-map: ${units.length - missingUnits.length}/${units.length} units returned ` +
    `(${mappers.length} mapper(s), assumptions ${assumptions ? "ok" : "MISSING"}, research ${research ? "ok" : "MISSING"}). ` +
    "Folding the assumptions and phase-relevant map findings into the phase's CONTEXT.md is the caller's job, not this script's.",
);

// Returned to the caller (commands/discover/map.md), which folds the assumptions and the
// phase-relevant map findings into the phase's CONTEXT.md itself — this script never does that
// fold. `research.grayAreasOpen`, when present, is Discovery wave 2's direct input.
return {
  phase: phaseId,
  // Only units that actually returned; a dropped focus is named in `missingUnits`, never
  // represented here as an empty/placeholder entry.
  mappers,
  // null means dropped (see the COVERAGE GAP log above), never "assumptions: none found".
  assumptions,
  // null means dropped; `research.grayAreasOpen` feeds discovery-research's args directly.
  research,
  // Every unit label that returned nothing this run — the caller's re-dispatch worklist.
  missingUnits,
};
