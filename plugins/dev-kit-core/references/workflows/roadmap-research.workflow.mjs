/**
 * roadmap-research workflow — four-axis ecosystem research fan-out, a research-synthesizer
 * barrier that writes and commits SUMMARY.md, then the roadmapper that splits the milestone
 * into phases.
 *
 * Invoked by `commands/roadmap/build.md` (`/dk:roadmap:build`). The axis roster is fixed at
 * 4 by `agents/project-researcher.md`'s own axis table (stack, features, architecture,
 * pitfalls), so a full run always has 2+ dispatchable units and always routes to this
 * Workflow — see the routing edit in `build.md`. A single-axis re-run (retrying one failed
 * axis after this workflow already ran once) is a plain inline `Agent` call instead: a
 * Workflow for one agent is pure overhead, same rule as `plan-review.workflow.mjs`.
 *
 * ── args contract ────────────────────────────────────────────────────────────────────
 *   milestone            string    REQUIRED. The milestone id (`<M>`, e.g. "v1"). Passed
 *                                  verbatim to every dispatch so no agent has to re-derive
 *                                  it from `docs/state/STATE.md` or a directory glob.
 *   context               string   REQUIRED. Project context plus open questions — the same
 *                                  text handed to all four researchers verbatim (project
 *                                  name/description, PROJECT.md highlights, REQUIREMENTS.md
 *                                  highlights if present, any scope hints). This script never
 *                                  edits or splits it per axis.
 *   axes                  string[] optional. Subset of ["stack","features","architecture",
 *                                  "pitfalls"]. Unknown names are dropped with a log line
 *                                  (mirrors `plan-review.workflow.mjs`'s `lenses` handling).
 *                                  Defaults to all four. Throws before any dispatch if fewer
 *                                  than 2 names survive filtering — a 0- or 1-axis run is not
 *                                  what this Workflow is for.
 *   researchDir            string   optional. Output-directory override passed through
 *                                  verbatim to the researchers and named to the synthesizer.
 *                                  Omit to let `project-researcher` / `research-synthesizer`
 *                                  use their own documented default,
 *                                  `docs/milestones/<M>/research/`.
 *   researcherAgentType    string   optional. Default "project-researcher". See AGENT
 *                                  RESOLUTION below.
 *   synthesizerAgentType   string   optional. Default "research-synthesizer". See AGENT
 *                                  RESOLUTION below.
 *   roadmapperAgentType    string   optional. Default "roadmapper". See AGENT RESOLUTION
 *                                  below.
 *   routing                object   optional. `{ 'project-researcher': {model?, effort?},
 *                                  'research-synthesizer': {model?, effort?}, roadmapper:
 *                                  {model?, effort?} }` — decided caller-side by
 *                                  `plugins/dk/bin/model-route.mjs --batch` and forwarded
 *                                  verbatim. Each opts builder spreads its key's entry
 *                                  before setting `agentType`; a missing key or a missing
 *                                  `routing` arg leaves `model`/`effort` absent entirely
 *                                  (inherit the session model), never defaulted.
 *
 * ── ZERO JUDGMENT LIVES HERE ─────────────────────────────────────────────────────────
 * Every decision that shapes the research itself — which axes matter for this milestone,
 * what "project context and open questions" actually says, whether a re-run should be a
 * single-axis inline call instead of this Workflow, and (after this returns) whether the
 * roadmap draft is approved — is made by the caller (`build.md`, ultimately the operator).
 * This script performs no research and writes no roadmap content of its own; it only
 * sequences three barriers (fan-out, then two solo dispatches) and reports what came back.
 * `axes` filtering below is a validity check against the fixed 4-name roster, not a
 * judgment call about which axes are worth researching — that call already happened before
 * this script was invoked. Model/effort routing is decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script never picks a model
 * or effort itself.
 *
 * ── NO WORKTREE ISOLATION ────────────────────────────────────────────────────────────
 * None of this workflow's dispatches — up to 4 researchers, then 1 synthesizer, then 1
 * roadmapper — use `isolation:'worktree'`. No member ever commits concurrently with
 * another: the 4 researchers each write exactly one file at a distinct axis-mapped path and
 * explicitly do NOT commit (`project-researcher.md` Step 6 — "DO NOT commit. Orchestrator
 * commits after all complete" — here that committer is the synthesizer, not this script);
 * the synthesizer runs alone, as a single dispatch, only after the fan-out barrier closes,
 * and is the one agent in this whole run that commits (`research-synthesizer.md` Step 7);
 * the roadmapper runs alone, as a single dispatch, only after the synthesizer has already
 * returned. With no two dispatches ever writing or committing at the same time, a worktree
 * per dispatch would only add ~200-500ms and disk cost with no concurrent-mutation hazard to
 * isolate against.
 *
 * ── AGENT RESOLUTION — UNVERIFIED, read this before running ─────────────────────────
 * Dispatch goes through `opts.agentType` for all three roles so that `agents/
 * project-researcher.md`, `agents/research-synthesizer.md`, and `agents/roadmapper.md` stay
 * the single source of truth for research methodology, synthesis procedure, and roadmap
 * construction respectively — the prompts built below carry ONLY each agent's documented
 * *inputs*, never a restated procedure or output contract. How a *plugin-namespaced* agent
 * resolves by bare type name is unverified from this repo (same caveat as
 * `plan-review.workflow.mjs`). If a bare name ("project-researcher", "research-synthesizer",
 * "roadmapper") does not resolve in a given install, pass the plugin-qualified form via the
 * matching override arg, e.g. `researcherAgentType: "dev-kit-core:project-researcher"`.
 *
 * ── RETURN SHAPE ──────────────────────────────────────────────────────────────────────
 * { milestone, axes: { requested, returned }, missingAxes, researchFiles, summary, roadmap }
 * — see the bottom of this file for field-by-field commentary. `missingAxes` and
 * `researchFiles` are named separately on purpose: an axis that never returned a file must
 * never be mistaken for one of the axes that did.
 */

export const meta = {
  name: "roadmap-research",
  description:
    "Four-axis ecosystem research fan-out, a research-synthesizer barrier that writes and commits SUMMARY.md, then the roadmapper splitting the milestone into phases.",
  whenToUse:
    "Called by /dk:roadmap:build. The axis roster is fixed at 4, so this always routes to the Workflow; inline only when re-running a single failed axis.",
  phases: [
    { title: "Axis fan-out", detail: "one project-researcher per selected axis, in parallel" },
    { title: "Synthesize", detail: "research-synthesizer reads every axis file, writes and commits SUMMARY.md" },
    { title: "Roadmap", detail: "roadmapper splits the milestone into phases from SUMMARY.md" },
  ],
};

// The fixed 4-axis roster, read from `agents/project-researcher.md`'s own Step 2 table
// (assigned_axis -> output file). This script does not decide which axes matter — it only
// validates the caller's `axes` input against this fixed roster, exactly as
// `plan-review.workflow.mjs` validates `lenses` against `LENS_SKILL`.
const AXIS_FILE = {
  stack: "STACK.md",
  features: "FEATURES.md",
  architecture: "ARCHITECTURE.md",
  pitfalls: "PITFALLS.md",
};
const ALL_AXES = ["stack", "features", "architecture", "pitfalls"];

// Condensed mirror of `project-researcher.md`'s "## RESEARCH COMPLETE" structured return:
// `axis` is that return's **Axis** field, `filePath` is the single row this dispatch owns
// under **Files Created** (exactly one file per axis, per Step 5's "one rule"), `summary`
// condenses **Key Findings** + **Roadmap Implications** into one field for the synthesizer
// prompt below. additionalProperties left open: a stray extra key from a researcher must
// not cost the whole axis.
const RESEARCHER_RESULT_SCHEMA = {
  type: "object",
  properties: {
    axis: { type: "string", enum: ALL_AXES },
    filePath: { type: "string" },
    summary: { type: "string" },
  },
  required: ["axis", "filePath", "summary"],
};

// Mirrors `research-synthesizer.md`'s "## SYNTHESIS COMPLETE" structured return:
// `summaryPath` is that return's **Output** line, `committed` reflects Step 7 ("Commit All
// Research" — researchers write but do not commit, the synthesizer commits everything) and
// the return's own "SUMMARY.md committed" confirmation line, `implicationsCount` is the
// "Suggested phases: N" count under **Roadmap Implications**.
const SYNTHESIZER_RESULT_SCHEMA = {
  type: "object",
  properties: {
    summaryPath: { type: "string" },
    committed: { type: "boolean" },
    implicationsCount: { type: "integer" },
  },
  required: ["summaryPath", "committed", "implicationsCount"],
};

// Mirrors `roadmapper.md`'s "## ROADMAP CREATED" structured return: `roadmapPath` is the
// `docs/milestones/<M>/ROADMAP.md` row under **Files written**, `phaseCount` is the
// **Phases:** N summary line, `requirementCoverage` is the **Coverage:** "X/X requirements
// mapped" string (kept as a string, not two integers, because roadmapper's own contract
// allows an honest partial-coverage report with attached Coverage Notes — collapsing it to
// numbers here would discard that nuance).
const ROADMAPPER_RESULT_SCHEMA = {
  type: "object",
  properties: {
    roadmapPath: { type: "string" },
    phaseCount: { type: "integer" },
    requirementCoverage: { type: "string" },
  },
  required: ["roadmapPath", "phaseCount", "requirementCoverage"],
};

// ── Eager arg validation — before any phase()/dispatch ────────────────────────────────

const milestone = args.milestone;
if (!milestone) {
  throw new Error("roadmap-research workflow: `milestone` arg is required (the milestone id, e.g. \"v1\").");
}

const context = args.context;
if (!context || typeof context !== "string") {
  throw new Error(
    "roadmap-research workflow: `context` arg is required — project context plus open questions, sent verbatim to every researcher.",
  );
}

const requestedAxes = Array.isArray(args.axes) && args.axes.length > 0 ? args.axes : ALL_AXES;
const axes = [];
for (const axis of requestedAxes) {
  if (AXIS_FILE[axis]) axes.push(axis);
  else log(`Dropping unknown axis "${axis}" — valid axes: ${ALL_AXES.join(", ")}.`);
}
if (axes.length < 2) {
  throw new Error(
    `roadmap-research workflow: needs 2 or more valid axes (got ${axes.length}). A single-axis re-run is a plain inline Agent call, not this Workflow.`,
  );
}

const researchDir = typeof args.researchDir === "string" ? args.researchDir : null;

// ── Phase 1: Axis fan-out ──────────────────────────────────────────────────────────────

// Inputs only — `project-researcher.md` owns the procedure, source-priority order, and
// output template for its assigned axis.
function researcherPrompt(axis) {
  const lines = [
    `Research one ecosystem axis for milestone ${milestone}. You are one of ${axes.length} researchers ` +
      "dispatched in parallel this run, each covering a different axis — do not investigate or write outside " +
      "your own axis; a sibling researcher owns each of the others.",
    "",
    "Inputs:",
    "- research_mode: ecosystem",
    `- assigned_axis: ${axis}`,
    `- milestone: ${milestone}`,
    `- context: ${context}`,
  ];
  if (researchDir) lines.push(`- output directory override: ${researchDir}`);
  lines.push(
    "",
    `Write exactly one file — ${AXIS_FILE[axis]}, the file your axis maps to per your own Step 2 — following ` +
      "your own Procedure and output template at full depth. Do NOT commit: the research-synthesizer commits " +
      "every research file together once all axes have returned. You are non-interactive: never wait for a user.",
    "",
    "Return exactly: axis (this dispatch's assigned_axis), filePath (the one file you wrote), and summary " +
      "(condensed from your own Key Findings and Roadmap Implications).",
  );
  return lines.join("\n");
}

phase("Axis fan-out");
log(`Researching ${axes.length} axes for milestone ${milestone}: ${axes.join(", ")}.`);

const researcherAgentType = args.researcherAgentType || "project-researcher";
const rawResearch = await parallel(
  axes.map((axis) => () =>
    agent(researcherPrompt(axis), {
      ...(args.routing?.["project-researcher"] ?? {}),
      label: `roadmap-research:${axis}`,
      phase: "Axis fan-out",
      agentType: researcherAgentType,
      schema: RESEARCHER_RESULT_SCHEMA,
    }),
  ),
);

// A dropped axis is a coverage gap, never a silent one — SUMMARY.md will synthesize from
// whatever axes actually landed, and that must be visible to the caller before it trusts
// the roadmap that follows.
const researchFiles = [];
const missingAxes = [];
rawResearch.forEach((result, i) => {
  if (result) {
    researchFiles.push(result);
  } else {
    missingAxes.push(axes[i]);
    log(
      `COVERAGE GAP: axis "${axes[i]}" returned nothing (agent failed, was skipped, or its output failed schema ` +
        `validation). ${AXIS_FILE[axes[i]]} is missing or stale. SUMMARY.md will synthesize from an incomplete ` +
        "axis set — re-run this one axis and re-synthesize before trusting the roadmap that follows.",
    );
  }
});
if (researchFiles.length === 0) {
  throw new Error(
    `roadmap-research workflow: every axis failed (${axes.join(", ")}); nothing for the synthesizer to read. Re-run before dispatching further.`,
  );
}

// ── Phase 2: Synthesize ────────────────────────────────────────────────────────────────

phase("Synthesize");
log(`Synthesizing ${researchFiles.length}/${axes.length} axis file(s) into SUMMARY.md.`);

// Inputs only — `research-synthesizer.md` owns the read/synthesize/write/commit procedure
// and SUMMARY.md's template.
function synthesizerPrompt() {
  const lines = [
    `Synthesize this run's ecosystem research into SUMMARY.md for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    "- research files written this run:",
    ...researchFiles.map((r) => `  - ${r.axis}: ${r.filePath}`),
  ];
  if (researchDir) lines.push(`- research directory override: ${researchDir}`);
  if (missingAxes.length > 0) {
    lines.push(
      `- COVERAGE GAP: these axes did NOT return a file this run and are absent from your inputs: ` +
        `${missingAxes.join(", ")}. Synthesize from the axes you have and say so explicitly under Gaps to ` +
        "Address — do not present this as a complete four-axis synthesis.",
    );
  }
  lines.push(
    "",
    "Follow your own Procedure and output template at full depth, including committing every research file " +
      "listed above (your Step 7 — the researchers wrote but did not commit). You are non-interactive: never " +
      "wait for a user.",
    "",
    "Return exactly: summaryPath (where you wrote SUMMARY.md), committed (true only if your Step 7 commit " +
      "actually succeeded), implicationsCount (the number of suggested phases under Roadmap Implications).",
  );
  return lines.join("\n");
}

const synthesizerAgentType = args.synthesizerAgentType || "research-synthesizer";
const summary = await agent(synthesizerPrompt(), {
  ...(args.routing?.["research-synthesizer"] ?? {}),
  label: "roadmap-research:synthesize",
  phase: "Synthesize",
  agentType: synthesizerAgentType,
  schema: SYNTHESIZER_RESULT_SCHEMA,
});
if (!summary) {
  throw new Error(
    "roadmap-research workflow: the research-synthesizer returned nothing (agent failed, was skipped, or its " +
      `output failed schema validation). Partial state left on disk: ${researchFiles.length} research file(s) ` +
      `written but NOT committed (${researchFiles.map((r) => r.filePath).join(", ")}), and SUMMARY.md is absent ` +
      "or unwritten. Re-run the synthesizer before dispatching the roadmapper — do not proceed with an unsynthesized research set.",
  );
}

// ── Phase 3: Roadmap ───────────────────────────────────────────────────────────────────

phase("Roadmap");
log(`Splitting milestone ${milestone} into phases from ${summary.summaryPath}.`);

// Inputs only — `roadmapper.md` owns Path Derivation, phase identification, goal-backward
// success criteria, coverage validation, and ROADMAP.md/STATE.md/REQUIREMENTS.md.
function roadmapperPrompt() {
  return [
    `Split milestone ${milestone} into phases.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    `- research summary: ${summary.summaryPath}`,
    "",
    "Follow your own Procedure and output format at full depth — Path Derivation, phase identification, " +
      "goal-backward success criteria, 100% requirement coverage, the Vertical-Slice Gate, and writing " +
      "ROADMAP.md / STATE.md / REQUIREMENTS.md. You are non-interactive: return the roadmap draft; operator " +
      "approval happens in the caller's turn, not yours.",
    "",
    "Return exactly: roadmapPath (where you wrote ROADMAP.md), phaseCount (number of phases), " +
      "requirementCoverage (your \"X/X requirements mapped\" coverage string).",
  ].join("\n");
}

const roadmapperAgentType = args.roadmapperAgentType || "roadmapper";
const roadmap = await agent(roadmapperPrompt(), {
  ...(args.routing?.roadmapper ?? {}),
  label: "roadmap-research:roadmap",
  phase: "Roadmap",
  agentType: roadmapperAgentType,
  schema: ROADMAPPER_RESULT_SCHEMA,
});
if (!roadmap) {
  throw new Error(
    "roadmap-research workflow: the roadmapper returned nothing (agent failed, was skipped, or its output " +
      `failed schema validation). Partial state left on disk: ${researchFiles.length} research file(s) at ` +
      `${researchFiles.map((r) => r.filePath).join(", ")}, SUMMARY.md ` +
      `${summary.committed ? "committed" : "written but NOT committed"} at ${summary.summaryPath}, and no ` +
      `ROADMAP.md. Re-run the roadmapper before treating milestone ${milestone} as roadmapped.`,
  );
}

log(
  `Done: ${researchFiles.length}/${axes.length} axes researched, SUMMARY.md ` +
    `${summary.committed ? "committed" : "NOT committed"} at ${summary.summaryPath}, ROADMAP.md at ` +
    `${roadmap.roadmapPath} with ${roadmap.phaseCount} phase(s), coverage ${roadmap.requirementCoverage}. ` +
    "Operator approval of the roadmap draft is the caller's next action.",
);

// Returned to the caller (`build.md`), which states the roadmap draft to the operator and
// owns the approval step. `axes.requested` vs `axes.returned` plus `missingAxes` let the
// caller tell a full four-axis synthesis from a partial one without re-deriving it from
// `researchFiles.length` — a failed axis must never be mistaken for one that succeeded.
return {
  milestone,
  axes: { requested: axes.length, returned: researchFiles.length },
  // Axes that never returned a file this run — distinct from `researchFiles`, whose
  // entries are exactly the axes that DID.
  missingAxes,
  // One entry per axis that returned: { axis, filePath, summary }.
  researchFiles,
  // { summaryPath, committed, implicationsCount } from the research-synthesizer.
  summary,
  // { roadmapPath, phaseCount, requirementCoverage } from the roadmapper.
  roadmap,
};
