/**
 * doc-ingest — fan out one `doc-classifier` per document, then a single `doc-synthesizer`
 * barrier that merges the classifications into intel and a conflicts report.
 *
 * Invoked by the doc-ingest half of `/dk:bootstrap:intake` (the combined command that
 * replaces `commands/bootstrap/ingest-docs.md`) whenever 2 or more documents need
 * ingestion. Exactly 1 document is NOT routed here — it goes inline: a plain `Agent` call
 * to `doc-classifier`, then a plain `Agent` call to `doc-synthesizer`, in consecutive
 * turns. A Workflow for a single classifier + a barrier of one is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * ROUTING CONTRACT — for the later unit that owns the routing edit
 * -----------------------------------------------------------------------------
 * This script carries NO routing edit of its own (see unit spec). The combined command
 * that eventually owns dispatch should carry a table shaped like:
 *
 * | **2 or more** | **Workflow script — mandatory.** `@references/workflows/doc-ingest.workflow.mjs` |
 * | Exactly 1 | Plain inline `Agent` call — a Workflow for one agent is pure overhead |
 *
 * followed by a fenced dispatch block:
 *
 * ```
 * Workflow({
 *   scriptPath: "<dev-kit-core>/references/workflows/doc-ingest.workflow.mjs",
 *   args: {
 *     docs: [                    // REQUIRED, length >= 2 — one entry per document
 *       { path: "docs/adr/0007-cache.md" },              // path REQUIRED
 *       { path: "legacy/prd.md", manifestType: "PRD" },  // manifestType optional
 *       // manifestPrecedence optional (integer; lower = higher precedence)
 *     ],
 *     outputDir: null,      // optional — classifier OUTPUT_DIR override; omit for the
 *                           // agent's own default (docs/state/intel/classifications/)
 *     intelDir: null,       // optional — synthesizer INTEL_DIR override, passed verbatim
 *     conflictsPath: null,  // optional — synthesizer CONFLICTS_PATH override, verbatim
 *     mode: null,           // optional — synthesizer MODE override ("new" | "merge")
 *     milestone: null,      // optional — synthesizer-only MILESTONE override
 *     routing: null,        // optional — { doc-classifier: {model?, effort?},
 *                           // doc-synthesizer: {model?, effort?} }, decided caller-side
 *                           // by model-route.mjs --batch and forwarded verbatim
 *   },
 * })
 * ```
 *
 * `scriptPath` needs a real filesystem path — resolve `<dev-kit-core>` to the installed
 * plugin directory, not a symbolic reference. A dead run resumes with
 * `Workflow({ scriptPath, resumeFromRunId: "<runId>" })` rather than a fresh dispatch.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 *   docs            array   REQUIRED, length >= 2. One entry per document to ingest:
 *                              path                string  REQUIRED. Absolute or
 *                                                  repo-relative path to the document.
 *                              manifestType         string  optional. Forwarded as this
 *                                                  doc's `MANIFEST_TYPE` — an upstream
 *                                                  self-report the classifier treats as
 *                                                  authoritative (skips its own heuristic
 *                                                  + content analysis).
 *                              manifestPrecedence   integer optional. Forwarded as this
 *                                                  doc's `MANIFEST_PRECEDENCE` override.
 *                            A single-document list is rejected here on purpose — 1 doc
 *                            is the inline route (see header), and dispatching a Workflow
 *                            for it would create a classifications directory and a
 *                            synthesis run for one file, both overhead.
 *   outputDir       string  optional. Overrides `OUTPUT_DIR` on every classifier dispatch
 *                            AND, when set, is also forwarded as the synthesizer's
 *                            `CLASSIFICATIONS_DIR` — the two must name the same directory
 *                            or the synthesizer reads nothing. Omit to let every
 *                            classifier fall back to its documented default
 *                            (`docs/state/intel/classifications/`), which already matches
 *                            the synthesizer's own derived default, so nothing needs to be
 *                            passed through in the common case.
 *   intelDir        string  optional. Synthesizer `INTEL_DIR` override, passed verbatim.
 *   conflictsPath   string  optional. Synthesizer `CONFLICTS_PATH` override, verbatim.
 *   mode            string  optional. Synthesizer `MODE` override (`"new" | "merge"`),
 *                            verbatim. Omit to let the synthesizer derive it from whether
 *                            its `EXISTING_CONTEXT` docs are already on disk.
 *   milestone       string  optional. Synthesizer-only `MILESTONE` override, verbatim.
 *                            Omit to let the synthesizer read the active milestone from
 *                            `docs/state/STATE.md` itself.
 *   routing         object  optional. `{ <key>: {model?, effort?} }` keyed by
 *                            `doc-classifier` and `doc-synthesizer` — decided caller-side
 *                            by `model-route.mjs --batch` and forwarded verbatim. An
 *                            absent key (or an absent `routing` altogether) means
 *                            "inherit" for that agent, never a guessed default.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision that shapes this run was made by the caller before `args` arrived:
 * which documents belong in this ingest batch, whether any of them carry a manifest
 * type/precedence override, which directory overrides (if any) apply, and whether the
 * synthesizer runs in `new` or `merge` mode against which milestone. This script does
 * not read a manifest file, does not infer document type, does not choose precedence,
 * and does not decide `new` vs `merge` — it only fans the caller's document list out to
 * `doc-classifier` and then barriers on a single `doc-synthesizer` call. The one runtime
 * decision the script DOES make — dispatching phase 2 even on partial phase-1 coverage —
 * is deliberately zero-judgment too: it is a mechanical "dispatch if anything survived",
 * not an assessment of whether the surviving coverage is good enough. That assessment is
 * the caller's, using the `unclassifiedDocs` list this script returns. Model/effort
 * routing for both agent types is likewise decided caller-side by `model-route.mjs` and
 * arrives as `args.routing` data — this script neither computes nor overrides it.
 *
 * -----------------------------------------------------------------------------
 * ISOLATION
 * -----------------------------------------------------------------------------
 * NONE of these 13 workflow scripts use `isolation:'worktree'` here, and this one is no
 * exception: no member of this run commits code, and no two members write into the same
 * file. Each `doc-classifier` only reads its one assigned source document and writes one
 * self-contained, collision-proof `{slug}-{hash}.json` (hash = first 8 hex chars of
 * SHA-256 of the full source path, per `agents/doc-classifier.md`), so N classifiers
 * writing to the same directory in parallel never collide on a filename. The single
 * `doc-synthesizer` runs alone in phase 2, after every classifier has already returned,
 * so there is nothing concurrent for it to race with either. A worktree would only strand
 * the classification JSON and the synthesized intel off the main tree, buying a merge
 * step this run has no use for.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — UNVERIFIED, read this before running
 * -----------------------------------------------------------------------------
 * Both phases dispatch by bare `agentType` ("doc-classifier", "doc-synthesizer") so that
 * `agents/doc-classifier.md` and `agents/doc-synthesizer.md` stay the single source of
 * truth for classification taxonomy, synthesis precedence rules, and both output
 * contracts — the prompts built below carry ONLY each agent's documented *inputs*
 * (FILEPATH/OUTPUT_DIR/MANIFEST_* for the classifier; CLASSIFICATIONS_DIR/INTEL_DIR/
 * CONFLICTS_PATH/MODE/MILESTONE for the synthesizer), never a restatement of their
 * procedure or output shape. How a plugin-namespaced agent type resolves in a given
 * install is not verified from this repo. If a bare type does not resolve, use the
 * plugin-qualified escape hatch: `"dev-kit-core:doc-classifier"` /
 * `"dev-kit-core:doc-synthesizer"`.
 *
 * -----------------------------------------------------------------------------
 * CONTROL FLOW
 * -----------------------------------------------------------------------------
 * A classifier that returns nothing is a COVERAGE GAP, not a clean skip: the synthesizer
 * will never see that document, so its decisions/requirements/constraints are simply
 * absent from the synthesized intel until the caller re-runs classification for it. If
 * EVERY classifier fails, the run throws — there is nothing on disk for the synthesizer
 * to consume. Otherwise phase 2 dispatches EVEN ON PARTIAL COVERAGE: this script applies
 * zero judgment about whether partial coverage is good enough to synthesize — that
 * determination belongs to the caller, using the `unclassifiedDocs` list below. If the
 * synthesizer itself returns nothing, the run throws with an explicit "re-run synthesis"
 * message: the classification JSON files it would have consumed are still sitting on
 * disk, so a re-run does not require re-classifying anything.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * {
 *   classified:        [{ path, confirmation }]  — one entry per doc a classifier
 *                                                   actually confirmed, in `docs` order.
 *   unclassifiedDocs:  [path]                     — docs whose classifier returned
 *                                                   nothing; NOT in the synthesized intel.
 *   synthesis:         { docsSynthesized, decisionsLocked, requirements, conflicts,
 *                         intelDir, reportPath, status } — the synthesizer's structured
 *                                                   return, verbatim (see SYNTHESIS_SCHEMA
 *                                                   below).
 *   status:            string                     — `synthesis.status`, echoed at the top
 *                                                   level so the caller does not have to
 *                                                   reach into `synthesis` for the one
 *                                                   field that decides its next move.
 * }
 */

export const meta = {
  name: "doc-ingest",
  description:
    "Fan out one doc-classifier per document, then a single doc-synthesizer barrier that merges classifications into intel and a conflicts report.",
  whenToUse:
    "Called by the doc-ingest half of /dk:bootstrap:intake when 2 or more documents need ingestion. Exactly 1 document goes inline (classify then synthesize in consecutive turns).",
  phases: [
    { title: "Classify", detail: "one doc-classifier per document, in parallel" },
    { title: "Synthesize", detail: "one doc-synthesizer barrier over the classifications directory" },
  ],
};

// Mirrors `doc-classifier`'s `<step name="return_confirmation">` verbatim: the agent
// returns exactly one line, `Classified: {filename} → {TYPE} ({confidence}){, LOCKED if
// true}`. The JSON classification file on disk (`{OUTPUT_DIR}/{slug}-{hash}.json`) is the
// real artifact — this schema exists only to pin the one-line confirmation shape so a
// malformed or chatty return fails schema validation instead of silently passing through.
const CLASSIFIER_SCHEMA = {
  type: "object",
  properties: {
    confirmation: {
      type: "string",
      description:
        "One line: 'Classified: {filename} → {TYPE} ({confidence}){, LOCKED if true}', per agents/doc-classifier.md return_confirmation.",
    },
  },
  required: ["confirmation"],
};

// Mirrors `doc-synthesizer`'s `<step name="return_confirmation">` block field for field:
// docs-by-type count, decisions locked, requirements extracted, the three conflict-bucket
// counts (blockers/variants/auto-resolved), and the pointers to INTEL_DIR and
// CONFLICTS_PATH. `status` mirrors the agent's own three literal STATUS lines
// (BLOCKED / AWAITING USER / READY), spelled as enum tokens.
const SYNTHESIZER_SCHEMA = {
  type: "object",
  properties: {
    docsSynthesized: { type: "integer", description: "Docs synthesized: {N}, per doc-synthesizer's return_confirmation." },
    decisionsLocked: { type: "integer", description: "Decisions locked: {N}." },
    requirements: { type: "integer", description: "Requirements: {N}." },
    conflicts: {
      type: "object",
      properties: {
        blockers: { type: "integer" },
        variants: { type: "integer" },
        autoResolved: { type: "integer" },
      },
      required: ["blockers", "variants", "autoResolved"],
    },
    intelDir: { type: "string", description: "Intel: {INTEL_DIR}/" },
    reportPath: { type: "string", description: "Report: {CONFLICTS_PATH}" },
    status: {
      type: "string",
      enum: ["BLOCKED", "AWAITING_USER", "READY"],
      description:
        "BLOCKED when blockers > 0, AWAITING_USER when variants > 0 (and no blockers), READY otherwise — per doc-synthesizer's own STATUS line.",
    },
  },
  required: [
    "docsSynthesized",
    "decisionsLocked",
    "requirements",
    "conflicts",
    "intelDir",
    "reportPath",
    "status",
  ],
};

// ---------------------------------------------------------------------------
// Eager arg validation — before any phase()/dispatch.
// ---------------------------------------------------------------------------
const {
  docs: rawDocs,
  outputDir = null,
  intelDir = null,
  conflictsPath = null,
  mode = null,
  milestone = null,
  routing = null,
} = args;

if (!Array.isArray(rawDocs) || rawDocs.length < 2) {
  throw new Error(
    `doc-ingest workflow: args.docs must be an array of 2 or more documents (got ${
      Array.isArray(rawDocs) ? rawDocs.length : typeof rawDocs
    }). Exactly 1 document is the inline route — classify then synthesize as plain Agent calls instead of dispatching this Workflow.`,
  );
}
const missingPath = rawDocs.filter((d) => !d || typeof d.path !== "string" || d.path.length === 0);
if (missingPath.length > 0) {
  throw new Error(
    `doc-ingest workflow: ${missingPath.length} entr(y/ies) in args.docs is missing a required \`path\` string.`,
  );
}
const docs = rawDocs;

phase("Classify");
log(
  `doc-ingest: classifying ${docs.length} document(s) in parallel${
    outputDir ? ` into ${outputDir}` : " into each classifier's default OUTPUT_DIR"
  }.`,
);

// Inputs only — `doc-classifier.md` owns the taxonomy, the heuristic/content analysis
// process, and the JSON output contract. The prompt carries just this doc's FILEPATH and
// any explicit overrides.
function classifierPrompt(doc) {
  const lines = [
    "Classify one document. Follow your own Procedure and Output contract exactly.",
    "",
    `FILEPATH: ${doc.path}`,
  ];
  if (outputDir) lines.push(`OUTPUT_DIR: ${outputDir}`);
  if (doc.manifestType) lines.push(`MANIFEST_TYPE: ${doc.manifestType}`);
  if (doc.manifestPrecedence != null) lines.push(`MANIFEST_PRECEDENCE: ${doc.manifestPrecedence}`);
  lines.push("", "Return only the one-line confirmation. Do not print JSON or document contents.");
  return lines.join("\n");
}

function classifierOpts(doc, i) {
  // model/effort/agentType are omitted whenever absent — omitted means "inherit", and for
  // doc-classifier that inherited value is haiku, per its own frontmatter. This script
  // never overrides it.
  return {
    ...(routing?.["doc-classifier"] ?? {}),
    label: `classify:${doc.path.split("/").pop()}`,
    phase: "Classify",
    agentType: "doc-classifier",
    schema: CLASSIFIER_SCHEMA,
  };
}

// Thunk layer — never live promises. parallel() is a barrier and never rejects; a failed
// thunk yields null.
const rawClassifications = await parallel(
  docs.map((doc, i) => () => agent(classifierPrompt(doc), classifierOpts(doc, i))),
);

const classified = [];
const unclassifiedDocs = [];
rawClassifications.forEach((result, i) => {
  const doc = docs[i];
  if (result) {
    classified.push({ path: doc.path, confirmation: result.confirmation });
  } else {
    unclassifiedDocs.push(doc.path);
    log(
      `COVERAGE GAP: classifier for "${doc.path}" returned nothing (agent failed, was skipped, or its output failed schema validation). The synthesizer will never see this document — its decisions/requirements/constraints are ABSENT from the synthesized intel until this document is re-classified and synthesis is re-run.`,
    );
  }
});

if (classified.length === 0) {
  throw new Error(
    "doc-ingest workflow: every classifier failed; nothing exists on disk for the synthesizer to consume.",
  );
}

log(
  `Classify: ${classified.length}/${docs.length} document(s) classified${
    unclassifiedDocs.length > 0 ? `, ${unclassifiedDocs.length} coverage gap(s) — see above` : ""
  }.`,
);

phase("Synthesize");
// Dispatched EVEN ON PARTIAL COVERAGE — zero judgment lives here. Whatever fraction of
// `docs` was actually classified is what gets synthesized; the caller decides, using
// `unclassifiedDocs` below, whether that fraction is trustworthy enough or whether the
// gaps must be re-classified and this phase re-run before anything downstream reads the
// intel.
log(
  `Synthesizing ${classified.length} classification(s)${
    unclassifiedDocs.length > 0
      ? ` (partial coverage — ${unclassifiedDocs.length} document(s) missing, dispatching anyway per contract)`
      : " (full coverage)"
  }.`,
);

// Inputs only — `doc-synthesizer.md` owns precedence rules, cycle detection, conflict
// bucketing, and both the intel and conflicts-report output contracts. The prompt carries
// just the caller's explicit overrides; every omitted field is derived by the agent
// itself from `references/doc-sitemap.md` + the active milestone/phase ids.
function synthesizerPrompt() {
  const lines = [
    "Synthesize the classified documents in this ingest batch. Follow your own Procedure and Output contract exactly.",
    "",
  ];
  // outputDir, when set, named the classifiers' OUTPUT_DIR — it must also be the
  // synthesizer's CLASSIFICATIONS_DIR, or the synthesizer reads an empty/default
  // directory instead of the one this run actually populated.
  if (outputDir) lines.push(`CLASSIFICATIONS_DIR: ${outputDir}`);
  if (intelDir) lines.push(`INTEL_DIR: ${intelDir}`);
  if (conflictsPath) lines.push(`CONFLICTS_PATH: ${conflictsPath}`);
  if (mode) lines.push(`MODE: ${mode}`);
  if (milestone) lines.push(`MILESTONE: ${milestone}`);
  lines.push(
    "",
    "Return only the structured Synthesis Complete summary. Do not dump intel contents — the files on disk are the deliverable.",
  );
  return lines.join("\n");
}

const synthesisOpts = {
  ...(routing?.["doc-synthesizer"] ?? {}),
  label: "synthesize",
  phase: "Synthesize",
  agentType: "doc-synthesizer",
  schema: SYNTHESIZER_SCHEMA,
};

const synthesis = await agent(synthesizerPrompt(), synthesisOpts);

if (!synthesis) {
  throw new Error(
    "doc-ingest workflow: doc-synthesizer returned nothing (agent failed, was skipped, or its output failed schema validation). The classification JSON files already written to disk are unaffected — re-run synthesis; there is no need to re-classify anything.",
  );
}

log(
  `Synthesize: status ${synthesis.status} — ${synthesis.docsSynthesized} doc(s), ${synthesis.decisionsLocked} decision(s) locked, ${synthesis.requirements} requirement(s), conflicts ${synthesis.conflicts.blockers}B/${synthesis.conflicts.variants}V/${synthesis.conflicts.autoResolved}I. Intel: ${synthesis.intelDir} Report: ${synthesis.reportPath}`,
);

return {
  // One entry per document a classifier actually confirmed, in `docs` order.
  classified,
  // Docs whose classifier returned nothing — NOT reflected in `synthesis` below. The
  // caller's re-run worklist.
  unclassifiedDocs,
  // The synthesizer's structured return, verbatim — see SYNTHESIZER_SCHEMA above.
  synthesis,
  // Echoed at the top level so the caller does not have to reach into `synthesis` for the
  // one field (BLOCKED / AWAITING_USER / READY) that decides its next move.
  status: synthesis.status,
};
