/**
 * doc-verify workflow — fan out one `doc-verifier` agent per doc, in parallel, against the
 * live codebase, then hand the per-doc results back untouched.
 *
 * Invoked by `plugins/dk/commands/docs/verify.md` (`/dk:docs:verify`) whenever 2 or more
 * docs need verification — the routing table in that command makes the Workflow route
 * mandatory at that point. A single doc never reaches here: the command makes a plain
 * inline `Agent` call instead, because a Workflow for one agent is pure overhead. This
 * step runs LAST, after content-qa, so every doc it is given is already believed final.
 *
 * args contract
 * -------------
 *   docs        string[]  REQUIRED  Paths to every doc this step created or touched.
 *                                   Must contain 2 or more entries — see "throws" below.
 *   outputDir   string    optional  Directory each doc-verifier writes its
 *                                   `verify-{doc}.json` result file into. Omit to let
 *                                   `doc-verifier` use its own documented default
 *                                   (see agents/doc-verifier.md — this script never
 *                                   hardcodes or repeats that default itself).
 *   agentType   string    optional  Subagent type to dispatch. Default "doc-verifier".
 *                                   See AGENT RESOLUTION below.
 *   routing     object    optional  { "doc-verifier": {model?, effort?} }, decided
 *                                   caller-side by model-route.mjs --batch and forwarded
 *                                   verbatim. An absent key (or an absent `routing`
 *                                   altogether) means "inherit", never a guessed default.
 *
 * Throws before any dispatch when `docs` is missing or has fewer than 2 entries — that is
 * the caller's signal to use the inline single-agent route instead, not a workflow failure.
 *
 * ZERO JUDGMENT LIVES HERE. Which docs need verifying (content-qa's own output), where
 * results should be written, and what to do with a failed or unverifiable claim once this
 * script returns are all decided by the caller (`/dk:docs:verify` and, above it, whatever
 * read the result files). This script only fans the dispatch out and sums mechanical
 * counts — it never reads a doc, never judges a claim, and never decides pass/fail.
 * Model/effort routing is likewise decided caller-side by `model-route.mjs` and arrives as
 * `args.routing` data — this script performs no judgment about which model or effort to use.
 *
 * AGENT RESOLUTION — UNVERIFIED, read this before running. Dispatch goes through
 * `opts.agentType` so that `agents/doc-verifier.md` stays the single source of truth for
 * claim-extraction rules, verification procedure and the on-disk JSON shape; the prompt
 * built below carries ONLY that agent's documented *inputs* (INPUTS-ONLY — see below), and
 * deliberately does not restate its procedure or output contract. How a *plugin-qualified*
 * agent type resolves in a given install is unverified from this repo. If the bare
 * "doc-verifier" type does not resolve, pass the plugin-qualified form via
 * `args.agentType: "dev-kit-core:doc-verifier"`.
 *
 * NO WORKTREE. `isolation:'worktree'` is deliberately not used, and none of the other
 * Workflow scripts in this pipeline need it either. Each doc-verifier is read-only against
 * the codebase (Read/Grep/Glob/Bash — no writes to source, no git operations) and writes
 * exactly one result file at a doc-unique path (`verify-{basename}.json`), so no two
 * dispatches ever touch the same file. There is nothing here for a worktree to isolate:
 * no member of this fan-out commits anything, concurrently or otherwise.
 *
 * PROMPT STRATEGY: INPUTS-ONLY. Each dispatch prompt states doc_path (and outputDir, when
 * given) and tells the agent to follow its own Procedure and Output contract at full
 * depth — mirroring `plan-review.workflow.mjs`. The one addition beyond a pure inputs-only
 * prompt is a request to also return the small structured summary this script's schema
 * needs (doc-verifier's own contract normally returns only a one-line confirmation string
 * to its caller); that summary is deliberately a subset of fields the agent already
 * computes, not new judgment asked of it.
 *
 * Returns: { results, unverifiedDocs, totals } — see the bottom of this file.
 */

export const meta = {
  name: "doc-verify",
  description:
    "One doc-verifier per doc, in parallel; each writes verify-{doc}.json to docs/state/tmp/. The orchestrator reads the result files after.",
  whenToUse:
    "2 or more docs -> Workflow route (mandatory). Exactly 1 doc -> plain inline Agent call; a Workflow for one agent is pure overhead.",
  phases: [{ title: "Verify fan-out", detail: "one doc-verifier per doc, in parallel" }],
};

// Mirrors doc-verifier's own confirmation to its caller (agents/doc-verifier.md
// <output_format>), reshaped into the small structured object this script needs instead of
// the one-line text string that contract normally returns. `claimsChecked` is
// `claims_passed + claims_failed + claims_unverifiable` — SKIP is deliberately excluded,
// exactly as that section defines it. `failures`, `unverifiable` and `skipped` here are the
// *counts* (`claims_failed`, `claims_unverifiable`, `claims_skipped`), not the detail
// arrays — the detail lives only in the result JSON file at `resultPath`, which is this
// script's pointer back to it, not a copy of it.
const VERIFY_RESULT_SCHEMA = {
  type: "object",
  properties: {
    docPath: { type: "string", description: "verbatim doc_path this dispatch verified" },
    resultPath: { type: "string", description: "path the result JSON was written to" },
    claimsChecked: { type: "integer", description: "claims_passed + claims_failed + claims_unverifiable" },
    failures: { type: "integer", description: "claims_failed" },
    unverifiable: { type: "integer", description: "claims_unverifiable" },
    skipped: { type: "integer", description: "claims_skipped" },
  },
  required: ["docPath", "resultPath", "claimsChecked", "failures", "unverifiable", "skipped"],
};

const docs = Array.isArray(args.docs) ? args.docs : [];
if (docs.length < 2) {
  throw new Error(
    `doc-verify workflow: needs 2 or more doc paths in args.docs (got ${docs.length}). ` +
      "A single doc is a plain inline Agent call, not a Workflow.",
  );
}

const outputDir = typeof args.outputDir === "string" ? args.outputDir : null;
const agentType = args.agentType || "doc-verifier";
const routing = args.routing ?? null;

// Inputs only — `doc-verifier.md` owns claim extraction, verification and the output
// contract. The one addition here is the structured-summary ask (see PROMPT STRATEGY
// above): it does not change what the agent computes, only what it echoes back to us.
function dispatchPrompt(docPath) {
  const lines = [
    "Verify one documentation file's factual claims against the live codebase.",
    "",
    "Inputs:",
    `- doc_path: ${docPath}`,
  ];
  if (outputDir) lines.push(`- output directory: ${outputDir}`);
  lines.push(
    "",
    "Follow your own Procedure and Output contract exactly, at full depth: extract claims " +
      "by category, verify each against the filesystem, write the result JSON file. You are " +
      "non-interactive: never wait for a user.",
    "",
    "In addition to the confirmation your own contract defines, also return your final " +
      "answer as JSON matching the required schema: docPath (verbatim doc_path above), " +
      "resultPath (the exact path you wrote the result JSON to), claimsChecked " +
      "(claims_passed + claims_failed + claims_unverifiable, SKIP excluded), failures " +
      "(claims_failed), unverifiable (claims_unverifiable), skipped (claims_skipped).",
  );
  return lines.join("\n");
}

phase("Verify fan-out");
log(`Verifying ${docs.length} doc(s) in parallel: ${docs.join(", ")}`);

const raw = await parallel(
  docs.map((docPath) => () =>
    agent(dispatchPrompt(docPath), {
      ...(routing?.["doc-verifier"] ?? {}),
      label: `doc-verify:${docPath.split("/").pop()}`,
      phase: "Verify fan-out",
      agentType,
      schema: VERIFY_RESULT_SCHEMA,
    }),
  ),
);

// A dropped doc is a coverage gap, never a silent pass. Absence of a result file must never
// be read as "this doc was fine".
const results = [];
const unverifiedDocs = [];
raw.forEach((result, i) => {
  if (result) {
    results.push(result);
  } else {
    unverifiedDocs.push(docs[i]);
    log(
      `COVERAGE GAP: ${docs[i]} was NOT verified — absence of a result file is not a pass. ` +
        "Re-dispatch this doc before trusting this run as clean.",
    );
  }
});

if (results.length === 0) {
  throw new Error("doc-verify workflow: every doc-verifier failed or was skipped; nothing was verified.");
}

// Mechanical sums only — no judgment about what a failure or an unverifiable claim MEANS.
// That reading belongs to whoever consumes `results`/`unverifiedDocs` next (per
// `verify.md`: read the result files and give one report).
const totals = results.reduce(
  (acc, r) => {
    acc.claimsChecked += r.claimsChecked || 0;
    acc.failures += r.failures || 0;
    acc.unverifiable += r.unverifiable || 0;
    acc.skipped += r.skipped || 0;
    return acc;
  },
  { claimsChecked: 0, failures: 0, unverifiable: 0, skipped: 0 },
);

log(
  `Done: ${results.length}/${docs.length} doc(s) verified, ${unverifiedDocs.length} coverage gap(s). ` +
    `Totals — claimsChecked ${totals.claimsChecked}, failures ${totals.failures}, ` +
    `unverifiable ${totals.unverifiable}, skipped ${totals.skipped}.`,
);

return {
  // Every doc-verifier result that came back, verbatim (docPath, resultPath, and the four
  // mechanical counts). The result JSON files on disk remain the durable, detailed
  // artifact — this is the pointer list back to them.
  results,
  // Docs with NO result at all (agent died, was skipped, or failed schema validation).
  // Named separately from `results` so a coverage gap can never merge with, or be mistaken
  // for, a doc that was actually verified.
  unverifiedDocs,
  // Mechanical sums across `results` only — never includes anything from `unverifiedDocs`,
  // since those docs were never checked at all.
  totals,
};
