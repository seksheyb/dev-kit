/**
 * legacy-explore — per-module read-only exploration fan-out over an undocumented codebase.
 *
 * Invoked by `skills/spec-miner/SKILL.md`'s "## Scaling: multi-module systems" section
 * (and, through it, by `agents/gate-reverse-engineer.md`'s legacy-recovery pass) once a
 * prior scoping pass has partitioned an undocumented system into 2 or more modules. A
 * single-module system never reaches here — the skill routes that case to a plain inline
 * `spec-miner` dispatch, because a Workflow for one agent is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * modules      array   REQUIRED, 2 or more entries. The module list comes from the
 *                       caller's scoping pass (a codebase-mapper run, a manual read of the
 *                       directory tree, or `gate-reverse-engineer`'s own initial scan) —
 *                       this script never invents, merges, or re-splits a module boundary.
 *   module.name         string    REQUIRED. Short module label, e.g. "billing-service".
 *                                 Echoed back in the return value and used as the schema's
 *                                 `module` field and the dispatch label.
 *   module.paths         string[] REQUIRED, non-empty. The files/directories THIS
 *                                 module's subagent may explore. Scope discipline — never
 *                                 letting one module's subagent wander into another's
 *                                 paths — is enforced by instruction in the dispatch
 *                                 prompt, not by any sandboxing this script performs.
 *   module.focusNotes    string   optional. Anything the scoping pass already knows about
 *                                 this module (suspected purpose, entry point, a name from
 *                                 a README) that would save the subagent rediscovery time.
 * specHints    array   optional. String hints that apply across every module (a known
 *                       framework, a monorepo-wide convention, a spec fragment already on
 *                       hand) — passed to every module's subagent verbatim, never used to
 *                       infer per-module boundaries.
 * routing      object  optional. `{ "spec-miner": {model?, effort?} }`, decided
 *                       caller-side by `model-route.mjs --batch` and forwarded verbatim.
 *                       An absent key (or an absent `routing` altogether) means "inherit",
 *                       never a guessed default.
 *
 * -----------------------------------------------------------------------------
 * WHY spec-miner IS THE PER-MODULE UNIT, NOT gate-reverse-engineer
 * -----------------------------------------------------------------------------
 * The obvious-looking alternative — one `gate-reverse-engineer` subagent per module,
 * fanned out the same way — is wrong, and not just for being heavier. `agents/
 * gate-reverse-engineer.md` declares `tools: Read, Write, Edit, Bash, Skill, Glob, Grep`
 * and its whole job is to WRITE: it drafts `docs/global/architecture/SDD.md`, generates
 * ADR files, and writes `docs/state/intel/recovered-requirements.md`. Running N of those
 * concurrently, one per module, means N subagents independently reading-then-writing the
 * SAME SDD.md — each one blind to the others' edits mid-run, because subagents in a
 * `parallel()` fan-out share no state until they return. That is a last-writer-wins race
 * on a single file, not a productive parallel pass: whichever subagent commits last
 * silently discards every other module's contribution to the shared document.
 *
 * `skills/spec-miner/SKILL.md` declares `allowed-tools: Read, Grep, Glob, Bash` — there is
 * no Write or Edit in that list, structurally. A `spec-miner`-methodology subagent cannot
 * touch SDD.md, an ADR file, or anything else, no matter how many of them run at once.
 * The worst a module's subagent can do is fail to explore or return a thin result — never
 * corrupt or clobber another module's findings. That is the exact hazard this script
 * removes by construction, not by convention: per-module parallelism is safe here only
 * because the per-module unit was changed from a writer to a reader.
 *
 * Synthesis — the Legacy SDD draft, the retrospective ADRs, the recovered-requirements
 * seed file — is therefore NOT done here. It stays a single, sequential act in the
 * caller's turn (`gate-reverse-engineer`'s own "Drafting" step), performed once, after
 * every module's read-only findings have returned. This script dispatches no writers.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * The module list and its paths are the caller's scoping-pass output, taken verbatim.
 * `specHints`, when present, is likewise handed through unmodified. This script does not
 * decide what a "module" is, does not re-group or merge modules, does not choose which
 * paths belong to which module, and does not decide when 2+ modules justifies the
 * Workflow route — that routing decision is `skills/spec-miner/SKILL.md`'s "## Scaling:
 * multi-module systems" table. The only things this script decides are mechanical: build
 * one self-contained prompt per module, dispatch them together, and sort the results that
 * come back into "explored" vs. "unexplored."
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE — none of these dispatches need isolation:'worktree'
 * -----------------------------------------------------------------------------
 * Every module dispatch runs with `allowed-tools: Read, Grep, Glob, Bash` and is
 * explicitly instructed to write no files. No member of this fan-out commits anything, to
 * any branch, ever — there is nothing for a worktree to isolate a module's subagent FROM.
 * Contrast with `sprint-execution`/`bugfix-wave`, where worktree isolation exists because
 * every track commits concurrently to its own branch; that hazard does not exist here.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION / ROSTER — agentType and model are both omitted, on purpose
 * -----------------------------------------------------------------------------
 * The Roster decision for this unit — made once, by the design of this script, not
 * per-run — is that neither `agentType` nor `model` is ever set in a dispatch's opts. Each
 * module's subagent is whatever the session's default subagent type is; the per-module
 * methodology comes from having that default subagent invoke the Skill tool for
 * `dev-kit-core:spec-miner` ITSELF (skill self-injection, the same pattern
 * `sprint-execution.workflow.mjs` uses for `track.skillId` — the orchestrator never calls
 * the Skill tool on a subagent's behalf, since that would pull the skill's full
 * instructions into the orchestrator's own context). The plugin-qualified id
 * `dev-kit-core:spec-miner` is used in the dispatch prompt rather than the bare
 * `spec-miner`, because Skill-tool resolution across a plugin boundary is UNVERIFIED in
 * this corpus — see `plan-review.workflow.mjs`'s AGENT RESOLUTION note, which raises the
 * same open question for a named `agentType`. If the plugin-qualified skill id does not
 * resolve in a given install, the bare `spec-miner` is the fallback to try. Model/effort
 * routing is decided caller-side by `model-route.mjs` and arrives as `args.routing` data,
 * keyed `spec-miner` — this script performs no judgment of its own about which model or
 * effort a module dispatch should run at.
 *
 * -----------------------------------------------------------------------------
 * COVERAGE-GAP DISCIPLINE
 * -----------------------------------------------------------------------------
 * A module whose subagent returns nothing (dead, skipped, or failed schema validation) is
 * NOT dropped silently. It is logged as `COVERAGE GAP: module "<name>" is UNEXPLORED, the
 * synthesized SDD/spec has a blind spot there.` and carried in the returned
 * `unexploredModules` list, separate from `explored` — a module that was never explored
 * must never be mistaken for one that was explored and found empty. Only when EVERY module
 * fails does this script throw, since a partial Legacy SDD with one documented gap is far
 * more useful than no findings at all.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { explored: [{ module, paths, findings }], unexploredModules: [{ module, paths }] }
 * `findings` is the module's schema-validated JSON (module, techStack, components,
 * behaviors, risks, uncertainties). The caller's turn is where these get synthesized into
 * the Legacy SDD, the retrospective ADRs, and the recovered-requirements seed file —
 * nothing in this script writes any of those.
 */

export const meta = {
  name: "legacy-explore",
  description:
    "Per-module read-only exploration fan-out over an undocumented codebase using the spec-miner methodology; findings return via schema. Synthesis (Legacy SDD, ADRs, recovered requirements) stays in the caller's turn — this script dispatches no writers.",
  whenToUse:
    "after a scoping pass yields 2+ modules; a single-module system stays inline.",
  phases: [
    { title: "Explore", detail: "one read-only spec-miner subagent per module, in parallel" },
  ],
};

// Mirrors `skills/spec-miner/SKILL.md`'s "Output Templates" list (tech stack &
// architecture, module structure, EARS-format observed requirements, risks, uncertainties)
// and `agents/gate-reverse-engineer.md`'s citation rule under "Recovered requirements are
// seed input, not a PRD": "A requirement with no citation is a guess." `additionalProperties`
// is left open throughout — a stray extra key from a subagent must not cost the whole
// module's findings.
const MODULE_FINDINGS_SCHEMA = {
  type: "object",
  required: ["module", "techStack", "components", "behaviors", "risks", "uncertainties"],
  properties: {
    module: { type: "string", description: "module name, verbatim from the dispatch" },
    techStack: {
      type: "array",
      items: { type: "string" },
      description: "languages, frameworks, databases, key libraries observed in this module",
    },
    components: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "responsibility", "files"],
        properties: {
          name: { type: "string" },
          responsibility: { type: "string" },
          files: { type: "array", items: { type: "string" } },
        },
      },
    },
    behaviors: {
      type: "array",
      description: "observed requirements in EARS format",
      items: {
        type: "object",
        required: ["ears", "evidence"],
        properties: {
          ears: { type: "string", description: "one EARS-format requirement sentence" },
          evidence: {
            type: "string",
            description:
              "a concrete file:line (or file:line-line) citation. A requirement with no citation is a guess, not a finding.",
          },
        },
      },
    },
    risks: {
      type: "array",
      description: "technical debt or security risks observed in this module",
      items: {
        type: "object",
        required: ["description", "location"],
        properties: {
          description: { type: "string" },
          location: { type: "string", description: "concrete file.ts:12-25-style location" },
        },
      },
    },
    uncertainties: {
      type: "array",
      items: { type: "string" },
      description: "areas needing clarification that could not be resolved from code alone",
    },
  },
};

// --- Eager arg validation. Throw with actionable messages before any phase()/dispatch. ---

const modulesInput = Array.isArray(args.modules) ? args.modules : [];
if (modulesInput.length === 0) {
  throw new Error(
    "legacy-explore workflow: `args.modules` is required and must be a non-empty array — it is the caller's scoping-pass output, not something this script can infer.",
  );
}

const malformed = [];
modulesInput.forEach((m, i) => {
  const hasName = m && typeof m.name === "string" && m.name.trim().length > 0;
  const hasPaths = m && Array.isArray(m.paths) && m.paths.length > 0 && m.paths.every((p) => typeof p === "string");
  if (!hasName || !hasPaths) malformed.push({ index: i, name: m && m.name });
});
if (malformed.length > 0) {
  throw new Error(
    `legacy-explore workflow: ${malformed.length} module(s) missing a required \`name\` or a non-empty \`paths\` string array (indices/names: ${malformed
      .map((m) => `${m.index}${m.name ? `:${m.name}` : ""}`)
      .join(", ")}). Fix the scoping-pass output before dispatching.`,
  );
}

if (modulesInput.length < 2) {
  throw new Error(
    `legacy-explore workflow: needs 2 or more modules (got ${modulesInput.length}). A single-module system is a plain inline \`spec-miner\` dispatch, not a Workflow.`,
  );
}

let specHints = [];
if (args.specHints !== undefined && args.specHints !== null) {
  if (typeof args.specHints === "string") specHints = [args.specHints];
  else if (Array.isArray(args.specHints) && args.specHints.every((h) => typeof h === "string")) {
    specHints = args.specHints;
  } else {
    throw new Error(
      "legacy-explore workflow: `args.specHints`, when provided, must be a string or a string array.",
    );
  }
}

const modules = modulesInput;

const routing = args.routing ?? null;

// Inputs only, plus the skill self-injection instruction — `spec-miner`'s own SKILL.md
// owns the exploration methodology and the EARS format; this prompt does not restate it.
function buildPrompt(module) {
  const lines = [
    "You are exploring exactly ONE module of a larger undocumented codebase, in parallel " +
      "with other subagents each exploring a different module. Stay inside your module — " +
      "do not read, explore, or draw conclusions about any other module; cross-module " +
      "synthesis happens once, in the caller's turn, after every module has returned.",
    "",
    `Module: ${module.name}`,
    `Paths in scope (explore only these): ${module.paths.join(", ")}`,
  ];
  if (module.focusNotes) lines.push(`Focus notes from the scoping pass: ${module.focusNotes}`);
  if (specHints.length > 0) {
    lines.push(`Shared hints for the whole system (apply only where they touch this module): ${specHints.join("; ")}`);
  }
  lines.push(
    "",
    "First action: invoke the Skill tool with skill: `dev-kit-core:spec-miner` (bare `spec-miner` " +
      "if that plugin-qualified id does not resolve), then apply its Core Workflow's Explore -> " +
      "Trace -> Document (EARS) steps to YOUR module only.",
    "",
    "Write NO files. This is read-only exploration: do not create, edit, or append to SDD.md, " +
      "any ADR file, any spec.md, or anything else. Running a writer per module would race N " +
      "concurrent subagents against the same shared document; that hazard is why this dispatch " +
      "uses spec-miner's read-only methodology instead of gate-reverse-engineer. Return your " +
      "findings ONLY as the JSON described by the schema — the caller synthesizes the Legacy " +
      "SDD, the retrospective ADRs, and the recovered-requirements seed file once, after all " +
      "modules return.",
    "",
    "Every entry in `behaviors` needs an `evidence` field that is a concrete `file:line` (or " +
      "`file:line-line`) citation into the paths above. A requirement with no citation is a " +
      "guess, not a finding — mark it as an uncertainty instead of inventing a citation.",
    "",
    "Return JSON matching the required schema: module, techStack, components, behaviors, risks, uncertainties.",
  );
  return lines.join("\n");
}

function buildOpts(module) {
  // agentType is never set — see the AGENT RESOLUTION / ROSTER header note. Omitted, not
  // defaulted: absence means "inherit the session default subagent type." model/effort are
  // decided caller-side by model-route.mjs and arrive as args.routing data, keyed
  // 'spec-miner' (the methodology this dispatch self-injects); routing?.['spec-miner'] is
  // spread first so an absent key still means "inherit," never a guessed default.
  return {
    ...(routing?.["spec-miner"] ?? {}),
    label: `legacy-explore:${module.name}`,
    phase: "Explore",
    schema: MODULE_FINDINGS_SCHEMA,
    // No isolation:'worktree' — read-only dispatch, see the header note.
  };
}

phase("Explore");
log(
  `legacy-explore: exploring ${modules.length} module(s) in parallel, read-only, writing no files: ${modules
    .map((m) => m.name)
    .join(", ")}.`,
);

// parallel() is a barrier and never rejects; a failed thunk yields null.
const raw = await parallel(modules.map((m) => () => agent(buildPrompt(m), buildOpts(m))));

const explored = [];
const unexploredModules = [];
raw.forEach((findings, i) => {
  const m = modules[i];
  if (findings) {
    explored.push({ module: m.name, paths: m.paths, findings });
  } else {
    unexploredModules.push({ module: m.name, paths: m.paths });
    log(
      `COVERAGE GAP: module "${m.name}" is UNEXPLORED, the synthesized SDD/spec has a blind spot there. Re-run this module before treating the Legacy SDD, its ADRs, or the recovered-requirements seed file as complete.`,
    );
  }
});

if (explored.length === 0) {
  throw new Error(
    "legacy-explore workflow: every module failed to return findings — nothing to synthesize. Check module paths and re-dispatch before attempting the Legacy SDD.",
  );
}

log(
  `legacy-explore: ${explored.length}/${modules.length} module(s) explored, ${unexploredModules.length} unexplored. Synthesis into the Legacy SDD, ADRs, and recovered-requirements seed file is the caller's next action.`,
);

// Returned to the caller. `explored` is the synthesis worklist; `unexploredModules` is the
// blind-spot list — separately named so an unexplored module can never be mistaken for one
// that was explored and simply came back empty.
return { explored, unexploredModules };
