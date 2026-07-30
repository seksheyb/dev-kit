/**
 * e2e-split — the Sprint Automation Coverage gate run TWICE, once per automation surface,
 * then merged mechanically into one `gate_passed`.
 * =============================================================================
 * Two surface-pinned `gate-automation` dispatches — Playwright (which invokes
 * `playwright-expert` itself) and Maestro (which invokes `test-master` itself) — run in
 * parallel, each authoring and running flows on ONE surface only and writing its own
 * surface-suffixed `authoring-report.<surface>.json`. This script then ANDs the two
 * results together.
 *
 * Invoked by `commands/verify/e2e.md`.
 *
 * ── THE ROUTING CONDITION IS SURFACES, NOT TRACKS ───────────────────────────────────
 * Read this before assuming the usual rule. Everywhere else in this reference set, "2 or
 * more units → Workflow, exactly 1 → inline Agent" counts TRACKS/LENSES/BUGS. Here the
 * count is AUTOMATION SURFACES, and there is exactly one dispatched agent type on both
 * sides of the fork:
 *
 *   - A project spanning BOTH surfaces (web UI *and* mobile) routes here: two
 *     `gate-automation` runs, one pinned to each surface.
 *   - A single-surface project does NOT route here. It dispatches `gate-automation`
 *     inline, UNSCOPED — no surface pin at all — and lets the agent's own step 2 detect
 *     the one surface in play. Pinning the single surface from outside would duplicate a
 *     detection the agent already owns, and a Workflow around one agent is pure overhead.
 *
 * So `surfaces` is not a knob: it is the routing condition itself, restated as an arg so
 * this script can refuse a run that should have gone inline (see the validation below).
 *
 * ── args contract ────────────────────────────────────────────────────────────────────
 * {
 *   phaseDir: string      REQUIRED. The phase directory (`PHASE/` in the doc sitemap).
 *                         Passed to both members as their `phase_dir` input verbatim —
 *                         `gate-automation` treats an explicitly-passed value as an
 *                         override of its own derivation, so it is never re-derived here.
 *                         Trailing slashes are trimmed before the report paths are built.
 *   branch: string        REQUIRED. The phase's integration branch. This names a live git
 *                         ref, not a doc path, so it cannot be derived — the caller
 *                         supplies it and both members diff against it.
 *   surfaces: string[]    REQUIRED. Must be exactly the two values "playwright" and
 *                         "maestro" (order irrelevant). Anything else throws with a
 *                         pointer to the inline route — see above.
 *   agentType: string     optional. Subagent type for BOTH members. Default
 *                         "gate-automation". See AGENT RESOLUTION below.
 *   routing: object       optional. { "gate-automation": {model?, effort?} } — one key
 *                         shared by both surface dispatches, decided caller-side by
 *                         model-route.mjs --batch and forwarded verbatim. An absent key
 *                         (or an absent `routing` altogether) means "inherit" for both
 *                         dispatches, never a guessed default.
 * }
 *
 * ── ZERO JUDGMENT LIVES HERE ─────────────────────────────────────────────────────────
 * Every decision was already made somewhere else, and none of them is re-made here:
 *   - "Does this project span both surfaces?" — the CALLER (`commands/verify/e2e.md`)
 *     decided that when it chose this script over the inline dispatch. This script only
 *     validates that the caller's own answer is internally consistent.
 *   - "Which flows are primary? Which need a golden path, which need an edge case? Did the
 *     local run pass? Is there an on-demand E2E CI job?" — `agents/gate-automation.md`
 *     decides all of it, per surface, inside each member.
 *   - "Did the gate pass, and what does the user do next?" — the CALLER again, after this
 *     returns. This script states `gate_passed` as a mechanical AND; it never explains it.
 * The merge below is arithmetic on purpose: a boolean AND, two array concats, and a
 * pass-through of every `could_not_determine`. There is no synthesis agent, because there
 * is nothing to synthesize — the two surfaces cover disjoint flows on disjoint files, so
 * no cross-surface reconciliation is even possible, let alone needed. Model/effort routing
 * is likewise decided caller-side by `model-route.mjs` and arrives as `args.routing` data —
 * this script performs no judgment of its own about which model or effort to use.
 *
 * ── COULD-NOT-DETERMINE IS NEVER ROUNDED ─────────────────────────────────────────────
 * `gate-automation` draws a hard line between "this check ran and failed" and "this check
 * could not be run at all" (no simulator, no device, runner not installed, `gh`
 * unavailable). That distinction must survive the merge, so `local_pass` and
 * `ci_label_run` are three-valued strings here, never booleans, and a
 * `could_not_determine` propagates AS-IS into the returned `perSurface` and into
 * `indeterminate`. It is never collapsed to "false", and a merged `gate_passed: false`
 * that sits next to `indeterminate.any === true` means NOT PROVEN, not PROVEN FAILING —
 * the caller must say which.
 *
 * ── ONE SURFACE DROPPED IS A COVERAGE GAP, NOT A SINGLE-SURFACE RUN ──────────────────
 * If one member returns nothing, the merged result is `gate_passed: false` with a loud
 * COVERAGE GAP line: the gate cannot pass while a surface is unassessed. Silently
 * reporting the surviving surface's verdict as the run's verdict would turn a
 * both-surfaces project into a single-surface pass without anyone deciding to. If BOTH
 * members drop, there is nothing to merge and this throws.
 *
 * ── NO WORKTREE ──────────────────────────────────────────────────────────────────────
 * `isolation: 'worktree'` is deliberately not used — none of the 13 scripts in this
 * reference set needs it, and all for the same reason: no member commits, so there is no
 * concurrent index/HEAD mutation to isolate. Here the two members are additionally
 * DISJOINT ON DISK by construction: the Playwright member writes only under the project's
 * Playwright test dir, the Maestro member writes only under `e2e/maestro/`, and each
 * writes its own surface-suffixed report pair (`authoring-report.<surface>.{md,json}`) —
 * which is exactly what the surface suffix buys, since the agent's default is one exact
 * shared path that both members would otherwise stomp. A worktree would also strand the
 * new flow files and the reports off the main tree for no gain.
 *
 * ── AGENT RESOLUTION — UNVERIFIED ────────────────────────────────────────────────────
 * Dispatch goes through `opts.agentType` so that `agents/gate-automation.md` stays the
 * single source of truth for the gate's procedure — including invoking `playwright-expert`
 * / `test-master` itself. The prompts built below carry ONLY that agent's documented
 * INPUTS plus the surface pin and the report paths; they duplicate none of its procedure
 * or output contract. What is not verified from this repo is how a plugin-namespaced agent
 * resolves by type. If the bare "gate-automation" type does not resolve in a given
 * install, pass the plugin-qualified form: `agentType: "dev-kit-core:gate-automation"`.
 *
 * Returns: { gate_passed, perSurface, flows_added, missing_coverage, indeterminate,
 * missingSurfaces } — see the bottom of this file.
 */

export const meta = {
  name: "e2e-split",
  description:
    "Two surface-pinned gate-automation runs — Playwright (via playwright-expert) and Maestro (via test-master) — with a mechanical merge of the two authoring reports into one gate_passed. Only for projects spanning both surfaces.",
  whenToUse:
    "THE ROUTING CONDITION IS SURFACES, NOT TRACKS. A project spanning BOTH automation surfaces (web UI and mobile) routes here — one gate-automation dispatch per surface, each pinned to its own surface and its own report file. A single-surface project does NOT: it dispatches gate-automation inline and UNSCOPED, letting the agent detect its one surface itself. This is the one place this repo's 2+-units rule reads differently — the count is surfaces, not units of work.",
  phases: [
    { title: "Surface split", detail: "gate-automation twice, one surface each, in parallel" },
    {
      title: "Merge",
      detail:
        "mechanical AND of gate_passed; concat flows and gaps; indeterminate never collapses to fail",
    },
  ],
};

const PHASE_SPLIT = "Surface split";
const PHASE_MERGE = "Merge";

// The two surfaces `gate-automation` step 2 can detect, and the only accepted `surfaces`
// values. Canonical order is display order only; the args check is order-insensitive.
const SURFACES = ["playwright", "maestro"];
const SURFACE_LABEL = { playwright: "Playwright", maestro: "Maestro" };
// The skill each surface's member invokes ITSELF (agents/gate-automation.md step 5). Named
// here for the log line and the prompt's surface pin only — this script never invokes them.
const SURFACE_SKILL = { playwright: "playwright-expert", maestro: "test-master" };
// What each member is forbidden to touch, so the pin can be stated as an exclusion too.
const OTHER_SURFACE = { playwright: "maestro", maestro: "playwright" };

// Mirrors `agents/gate-automation.md` steps 9-10 (`flows_added`, `missing_coverage` with a
// one-line `reason` per item, `local_pass` / `ci_label_run` / `gate_passed`) plus the
// could-not-determine rule its step 6, step 7 and step 9 all restate. `local_pass` and
// `ci_label_run` are string enums, NOT booleans, precisely because that agent forbids
// writing a bare `false` for a check it could not run. `surface` and `reportJsonPath` are
// echoed back by the member so a mis-pinned or mis-filed dispatch is visible in the result
// rather than inferred from dispatch order. `additionalProperties` is left open: a stray
// extra key must not invalidate a whole surface and cost us half the gate.
const SURFACE_REPORT_SCHEMA = {
  type: "object",
  required: [
    "surface",
    "reportJsonPath",
    "flows_added",
    "missing_coverage",
    "local_pass",
    "ci_label_run",
    "gate_passed",
    "indeterminate_reasons",
  ],
  properties: {
    surface: {
      type: "string",
      enum: SURFACES,
      description: "The surface this dispatch was pinned to, echoed verbatim.",
    },
    reportJsonPath: {
      type: "string",
      description:
        "The surface-suffixed JSON report actually written, verbatim from the dispatch.",
    },
    flows_added: {
      type: "array",
      items: { type: "string" },
      description: "Every flow file written this run, on this surface only.",
    },
    missing_coverage: {
      type: "array",
      description:
        "Primary user flows changed this phase that did not get a flow on this surface, one line of `reason` each.",
      items: {
        type: "object",
        required: ["flow", "reason"],
        properties: {
          flow: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    local_pass: {
      type: "string",
      enum: ["true", "false", "could_not_determine"],
      description:
        'Three-valued, never boolean. "could_not_determine" = the flows could not be executed at all (no simulator/device, runner not installed). That is NOT "false" and must never be reported as one.',
    },
    ci_label_run: {
      type: "string",
      enum: ["true", "false", "could_not_determine"],
      description:
        'Three-valued, never boolean. "false" = no on-demand E2E workflow exists, or no green labelled run. "could_not_determine" = the check itself could not be completed (gh unavailable/unauthenticated, no network, API error).',
    },
    gate_passed: {
      type: "boolean",
      description: "This surface's own verdict, per the agent's SCHEMAS rules.",
    },
    indeterminate_reasons: {
      type: "array",
      items: { type: "string" },
      description:
        'One line per check that could not be run at all, with the reason. Empty array when nothing was indeterminate. This is what keeps a "could not determine" legible after the merge.',
    },
  },
};

// ── Eager validation: throw before any phase()/dispatch, with the fix in the message ──
const phaseDirRaw = args.phaseDir;
const branch = args.branch;
const requestedSurfaces = args.surfaces;

if (!phaseDirRaw || typeof phaseDirRaw !== "string") {
  throw new Error(
    "e2e-split workflow: `phaseDir` is required — the phase directory (the sitemap's PHASE/). Both members receive it as their `phase_dir` input verbatim, and the two surface-suffixed report paths are built from it.",
  );
}
if (!branch || typeof branch !== "string") {
  throw new Error(
    "e2e-split workflow: `branch` is required — the phase's integration branch. It names a live git ref, not a doc path, so it cannot be derived; both members diff `main...<branch>` against it.",
  );
}
if (!Array.isArray(requestedSurfaces) || requestedSurfaces.length !== 2) {
  throw new Error(
    `e2e-split workflow: \`surfaces\` must be exactly ["playwright","maestro"] (got ${JSON.stringify(requestedSurfaces)}). This script exists ONLY for a project that spans both automation surfaces. A single-surface project does not belong here: dispatch \`gate-automation\` inline and UNSCOPED — no surface pin — and let its own surface detection run.`,
  );
}
{
  const seen = requestedSurfaces.map((s) => (typeof s === "string" ? s.toLowerCase() : s));
  const ok = SURFACES.every((s) => seen.filter((x) => x === s).length === 1);
  if (!ok) {
    throw new Error(
      `e2e-split workflow: \`surfaces\` must be exactly ["playwright","maestro"], one of each, in any order (got ${JSON.stringify(requestedSurfaces)}). Two of the same surface is not a split, and an unknown surface has no gate-automation route. For one surface, dispatch \`gate-automation\` inline and UNSCOPED instead of calling this script.`,
    );
  }
}

const phaseDir = phaseDirRaw.replace(/\/+$/, "");
const agentType = args.agentType || "gate-automation";
const routing = args.routing ?? null;

const reportJsonPath = (surface) =>
  `${phaseDir}/reports/automation/authoring-report.${surface}.json`;
const reportMdPath = (surface) => `${phaseDir}/reports/automation/authoring-report.${surface}.md`;

// Inputs only — `agents/gate-automation.md` owns the procedure and the output contract,
// including invoking `playwright-expert` / `test-master` itself. What is added here and
// nowhere else: the surface pin (this dispatch is HALF the gate) and the surface-suffixed
// report paths that keep the two halves off each other's files.
function dispatchPrompt(surface) {
  return [
    `Run the Sprint Automation Coverage gate for ONE automation surface. This project spans both surfaces, so this dispatch is half of the gate; the other half runs concurrently on ${SURFACE_LABEL[OTHER_SURFACE[surface]]} and the caller merges the two reports.`,
    "",
    `Automation surface for this dispatch: ${SURFACE_LABEL[surface]} ONLY — do not author or run ${SURFACE_LABEL[OTHER_SURFACE[surface]]} flows.`,
    `Your surface-detection step is already settled for you: treat ${SURFACE_LABEL[surface]} as the surface in play and skip the other. Use the \`${SURFACE_SKILL[surface]}\` skill for test design, as your own procedure specifies for this surface.`,
    "",
    "Inputs:",
    `- phase_dir: ${phaseDir}`,
    `- branch: ${branch}`,
    `- surface: ${surface}`,
    "",
    "Output paths for this dispatch — use these EXACT paths instead of your default unsuffixed ones, because the other surface's dispatch writes the same directory concurrently:",
    `- report (prose): ${reportMdPath(surface)}`,
    `- report (json): ${reportJsonPath(surface)}`,
    "",
    `Scope boundary: every flow file you author or run must belong to the ${SURFACE_LABEL[surface]} surface. Do not touch the other surface's test directory, and do not commit — the caller owns the branch.`,
    "",
    `Follow your own procedure and output contract exactly, at full depth, scoped to this one surface. Keep your rule that a check which could not be run at all is reported as "could_not_determine" with its reason, never as a bare false. Return the JSON summary only, with \`surface\` set to "${surface}" and \`reportJsonPath\` set to the json path above. You are non-interactive: never wait for a user.`,
  ].join("\n");
}

// Spreads args.routing["gate-automation"] first so any model/effort the caller-side
// router decided wins; omits them entirely when routing carries nothing for this key —
// absent still means inherit the session model, and this gate must never be silently
// downgraded — it authors and runs real test code.
function buildOpts(surface) {
  return {
    ...(routing?.["gate-automation"] ?? {}),
    label: `e2e:${surface}`,
    phase: PHASE_SPLIT,
    agentType,
    schema: SURFACE_REPORT_SCHEMA,
  };
}

phase(PHASE_SPLIT);
log(
  `e2e-split: two surface-pinned ${agentType} runs over ${phaseDir} on ${branch} — ${SURFACES.map(
    (s) => `${SURFACE_LABEL[s]} (${SURFACE_SKILL[s]} → ${reportJsonPath(s)})`,
  ).join(", ")}. Disjoint on disk; neither member commits.`,
);

// Thunks, never live promises. `parallel()` is the barrier and never rejects — a failed
// thunk yields null, which the merge below treats as an unassessed surface, not a pass.
const raw = await parallel(SURFACES.map((s) => () => agent(dispatchPrompt(s), buildOpts(s))));

phase(PHASE_MERGE);

const results = [];
const missingSurfaces = [];
raw.forEach((result, i) => {
  const surface = SURFACES[i];
  if (result) {
    results.push({ ...result, surface });
    if (result.surface && result.surface !== surface) {
      log(
        `Surface mismatch: the ${surface} dispatch returned surface "${result.surface}". Dispatch order is authoritative here, but inspect ${reportJsonPath(surface)} before trusting its contents — a mis-pinned member may have authored on the wrong surface.`,
      );
    }
  } else {
    missingSurfaces.push(surface);
    log(
      `COVERAGE GAP: surface ${surface} has NO coverage report — the ${SURFACE_LABEL[surface]} member returned nothing (agent failed, was skipped, or its output failed schema validation). No ${SURFACE_LABEL[surface]} flow was assessed this phase, and the gate cannot pass with an unassessed surface. Merged gate_passed is forced to false. Re-run this surface (inline \`${agentType}\`, pinned to ${surface}, report at ${reportJsonPath(surface)}) before treating the gate as decided — and never report this run as a clean single-surface pass.`,
    );
  }
});

if (results.length === 0) {
  throw new Error(
    "e2e-split workflow: both surface members failed; there is no coverage report to merge. Nothing about this phase's E2E coverage is known — re-run the gate.",
  );
}

// ── The merge. Mechanical, judgment-free, and deliberately in the script. ─────────────
// AND of gate_passed; concat of the two flow/gap lists; every could_not_determine passed
// through untouched. A missing surface forces false (see the COVERAGE GAP log above).
const gate_passed =
  missingSurfaces.length === 0 && results.every((r) => r.gate_passed === true);

const flows_added = results.flatMap((r) =>
  (Array.isArray(r.flows_added) ? r.flows_added : []).map((f) => ({ surface: r.surface, flow: f })),
);
const missing_coverage = results.flatMap((r) =>
  (Array.isArray(r.missing_coverage) ? r.missing_coverage : []).map((m) => ({
    surface: r.surface,
    flow: m.flow,
    reason: m.reason,
  })),
);

const indeterminate = {
  // True when ANY check on ANY surface could not be run at all. Read together with
  // gate_passed: false + any === true means NOT PROVEN, not proven failing.
  any: false,
  // Surfaces whose local run could not be executed at all — distinct from a run that failed.
  local_pass: results.filter((r) => r.local_pass === "could_not_determine").map((r) => r.surface),
  // Surfaces whose CI check could not be completed — distinct from "no E2E workflow exists".
  ci_label_run: results
    .filter((r) => r.ci_label_run === "could_not_determine")
    .map((r) => r.surface),
  // Every reason line, verbatim, tagged with the surface that produced it.
  reasons: results.flatMap((r) =>
    (Array.isArray(r.indeterminate_reasons) ? r.indeterminate_reasons : []).map((reason) => ({
      surface: r.surface,
      reason,
    })),
  ),
};
indeterminate.any =
  indeterminate.local_pass.length > 0 ||
  indeterminate.ci_label_run.length > 0 ||
  indeterminate.reasons.length > 0;

if (indeterminate.any) {
  log(
    `Indeterminate checks carried through unchanged (NOT rounded to a fail): local run ${
      indeterminate.local_pass.join(", ") || "none"
    }; CI check ${indeterminate.ci_label_run.join(", ") || "none"}. ${
      indeterminate.reasons.map((r) => `[${r.surface}] ${r.reason}`).join(" | ") || ""
    }`,
  );
}

log(
  [
    `Merged: gate_passed ${gate_passed} across ${results.length}/${SURFACES.length} surfaces.`,
    ...results.map(
      (r) =>
        `- ${r.surface}: gate_passed ${r.gate_passed} | local_pass ${r.local_pass} | ci_label_run ${r.ci_label_run} | ${
          (r.flows_added || []).length
        } flow(s) added | ${(r.missing_coverage || []).length} gap(s) | ${r.reportJsonPath}`,
    ),
    ...missingSurfaces.map((s) => `- ${s}: NO REPORT — unassessed surface (see COVERAGE GAP above)`),
  ].join("\n"),
);

// Returned to the caller, which states the user-facing verdict and the next step.
return {
  // Mechanical AND of both surfaces, forced false if either surface is unassessed. False
  // next to `indeterminate.any === true` means NOT PROVEN — the caller must not report it
  // as a proven failure.
  gate_passed,
  // Each surface's own result, unmodified, including its three-valued local_pass /
  // ci_label_run and its own report path. The per-surface report files on disk are the
  // durable artifact; this is the roll-up.
  perSurface: results.map((r) => ({
    surface: r.surface,
    reportJsonPath: r.reportJsonPath,
    gate_passed: r.gate_passed,
    local_pass: r.local_pass,
    ci_label_run: r.ci_label_run,
    flows_added: r.flows_added || [],
    missing_coverage: r.missing_coverage || [],
    indeterminate_reasons: r.indeterminate_reasons || [],
  })),
  // Flat across both surfaces, each entry tagged with the surface that produced it.
  flows_added,
  // Flat across both surfaces. A gap is a flow that WAS assessed and deliberately not
  // covered, with a reason — never the same thing as a surface that was not assessed.
  missing_coverage,
  // Checks that could not be run at all, propagated as-is. Named separately from
  // `missing_coverage` and from `missingSurfaces` on purpose: "could not determine",
  // "assessed and uncovered", and "never assessed" are three different states and none of
  // them may collapse into another.
  indeterminate,
  // Surfaces whose member returned nothing. Non-empty means this run is NOT a valid
  // both-surfaces gate, whatever the other surface reported — re-run these before the gate
  // counts as decided.
  missingSurfaces,
};
