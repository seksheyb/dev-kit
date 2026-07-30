/**
 * graphify-extract — Part B semantic extraction, one subagent per chunk.
 * =============================================================================
 * Owns ONE thing: fanning the graphify skill's pre-rendered chunk prompts out in parallel
 * and reporting which chunks came back. Each subagent writes its own
 * `docs/state/graphs/.graphify_chunk_NN.json`; this script never touches that file, never
 * merges chunks, never caches, and never reads the disk at all.
 *
 * Invoked by `skills/graphify/SKILL.md` Step 3, Part B, Step B2 — and only when there are
 * 2 or more UNCACHED chunks. A 1-chunk run is a plain inline `Agent` call: a Workflow for
 * one agent is pure overhead. The Kimi bypass (`MOONSHOT_API_KEY` set, which routes
 * semantic extraction through `graphify.llm.extract_corpus_parallel(..., backend="kimi")`)
 * never reaches this script at all, and neither does the code-only fast path that skips
 * Part B entirely.
 *
 * Part A (AST extraction) is a Bash call that runs in the ORCHESTRATOR's own turn,
 * concurrently with this backgrounded run. It is deliberately not modelled here: it is not
 * an agent, it needs no isolation from these subagents (different file types, different
 * output file), and pulling it in would give this script a filesystem dependency it does
 * not otherwise have.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision was already made in the orchestrator's turn, before this call:
 *   - which files need extraction at all      -> Step B0, the semantic-cache check
 *                                                (`.graphify_uncached.txt`). Cached files
 *                                                are filtered out by the CALLER; this
 *                                                script cannot tell a cached file from an
 *                                                uncached one.
 *   - how files are split into chunks         -> Step B1 (20-25 files per chunk).
 *   - same-directory grouping                 -> Step B1 (related artifacts land together
 *                                                so cross-file edges get found).
 *   - one image per chunk                     -> Step B1 (vision needs its own context).
 *   - DEEP_MODE substitution                  -> Step 3's opening note; the `--mode deep`
 *                                                flag is baked into each prompt string
 *                                                BEFORE it arrives here.
 *   - FILE_LIST / CHUNK_NUM / TOTAL_CHUNKS    -> Step B2's template substitution.
 * The script derives, defaults and overrides none of it. `args.chunks` is that output
 * verbatim, in dispatch order.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * chunks    array    REQUIRED, length >= 2. One entry per uncached chunk:
 *   chunk.chunkNum   integer  REQUIRED. The NN in `.graphify_chunk_NN.json`. Used for the
 *                             agent label, for every log line, and as the identity in the
 *                             returned failure list. Must match the CHUNK_NUM already
 *                             substituted into `prompt`; the script cannot check that.
 *   chunk.chunkFile  string   REQUIRED. The exact path the subagent was told to write,
 *                             e.g. `docs/state/graphs/.graphify_chunk_03.json`. Echoed
 *                             back so the caller's Part C disk check is self-describing.
 *   chunk.prompt     string   REQUIRED. The fully-rendered Step B2 subagent prompt —
 *                             file list, EXTRACTED/INFERRED/AMBIGUOUS rules, per-file-type
 *                             guidance, confidence_score rubric, node-ID format, the exact
 *                             output JSON shape, and the DEEP_MODE paragraph if it applies.
 *                             Passed through untouched. The script writes no prompt text of
 *                             its own, so anything missing from your rendering is missing
 *                             from the dispatch.
 * deepMode  boolean  optional, default false. LOG LINE ONLY. Deep mode is already baked
 *                    into every prompt string; setting this flag does not turn it on and
 *                    clearing it does not turn it off. It exists so the run log says which
 *                    mode produced the graph.
 * routing   object   optional. `{ "chunk-extractor": {model?, effort?} }`, decided
 *                    caller-side by `model-route.mjs --batch` and forwarded verbatim. An
 *                    absent key (or an absent `routing` altogether) means "inherit", never
 *                    a guessed default. NOTE the key is the ROLE (`chunk-extractor`), not
 *                    the `agentType` (`general-purpose`): per model-routing.md §7 there is
 *                    one descriptor per agent ROLE, and `general-purpose` is a harness
 *                    dispatch mechanism, not a role. `skills/graphify/SKILL.md` builds its
 *                    descriptor under this same `chunk-extractor` key.
 *
 * -----------------------------------------------------------------------------
 * PROMPT STRATEGY 3 — the orchestrator pre-renders, the script never composes
 * -----------------------------------------------------------------------------
 * Step B2 of SKILL.md says "Each subagent receives this exact prompt" and then gives the
 * template verbatim — the skill file is the single source of truth for that text, and it
 * is long, precise, and revised often (the confidence-score rubric alone encodes a
 * production calibration finding). Rebuilding it in JS here would fork that source of
 * truth: the next edit to the skill would silently stop reaching dispatched subagents.
 * Same rationale as `bugfix-wave.workflow.mjs`, which passes its §2.3 prompts through for
 * exactly this reason. Contrast `plan-review.workflow.mjs`, which composes an inputs-only
 * prompt because the METHODOLOGY lives in the agent .md rather than in the caller.
 *
 * -----------------------------------------------------------------------------
 * ROSTER — general-purpose, and it is not negotiable
 * -----------------------------------------------------------------------------
 * N agents, all `agentType: "general-purpose"`, one per chunk. This is the graphify
 * skill's own hard rule (Step B2, "IMPORTANT - subagent type"), not a default this script
 * picked: `Explore` is READ-ONLY and cannot write a chunk file to disk, so an Explore
 * dispatch returns a plausible-looking summary while SILENTLY DROPPING the extraction —
 * the chunk JSON never appears, and Part C's disk check is the only thing that catches it.
 * general-purpose has the Write and Bash access the subagent needs. `agentType` is
 * therefore always set here, never omitted-to-inherit. Model/effort routing is decided
 * caller-side by `model-route.mjs` and arrives as `args.routing` data — see ARGS CONTRACT —
 * and is omitted entirely (omitted = inherit) whenever `routing` carries no
 * `chunk-extractor` entry. The routing key and the agentType are deliberately different
 * names: `chunk-extractor` is the ROLE this fan-out routes as, `general-purpose` is the
 * harness agent type that role is dispatched through.
 *
 * AGENT RESOLUTION — `general-purpose` is a built-in harness agent type, not a plugin
 * agent, so it carries no plugin namespace and there is nothing to qualify. If a future
 * variant of this script dispatches a NAMED dev-kit agent instead, the bare name is the
 * default, and the plugin-qualified `dev-kit-core:<name>` form is the escape hatch when
 * the bare name does not resolve in a given install. Do not apply that form to
 * `general-purpose`; `dev-kit-core:general-purpose` does not exist.
 *
 * -----------------------------------------------------------------------------
 * NO ISOLATION
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately NOT used — and NONE of the 13 workflow scripts
 * in this set needs it except the two that exist to run git branches concurrently. No
 * member of this roster commits anything: each subagent writes exactly one uniquely-named
 * file (`.graphify_chunk_NN.json`, NN unique per chunk by construction in Step B1), reads
 * source files read-only, and makes no git call at all. There is no concurrent mutation to
 * isolate. A worktree would be strictly harmful here: it would strand every chunk JSON in
 * a throwaway tree, so Part C's glob over `docs/state/graphs/.graphify_chunk_*.json` would
 * find nothing and the whole run would read as a total failure.
 *
 * -----------------------------------------------------------------------------
 * TOKEN-USAGE WRITEBACK IS DROPPED UNDER WORKFLOW DISPATCH
 * -----------------------------------------------------------------------------
 * The inline route has the orchestrator read each Agent tool result's `usage` field and
 * write the real counts back into the chunk JSON, which always carries placeholder zeros.
 * That is not available here, in either direction:
 *   - the orchestrator never sees per-call `usage` for agents dispatched inside a Workflow;
 *   - a subagent cannot know its own token counts, so asking it to self-report would
 *     manufacture a number, and a fabricated token count is worse than a zero because it
 *     looks authoritative in the merge output.
 * So the counts stay zero, the script says so out loud, and it returns
 * `tokenUsage: "unavailable"`. SKILL.md Part C makes its writeback step conditional on
 * exactly this.
 *
 * -----------------------------------------------------------------------------
 * DISK VERIFICATION STAYS WITH THE CALLER
 * -----------------------------------------------------------------------------
 * This script has NO filesystem access. It cannot check that
 * `.graphify_chunk_NN.json` exists, cannot parse it, cannot merge it, cannot cache it. A
 * returned agent result is a CLAIM, not proof of a written file. Step B3's per-chunk
 * file-exists check is therefore still mandatory in the orchestrator's turn after this
 * returns — it is the only thing that catches a chunk that answered confidently and wrote
 * nothing. Cache saves and the `.graphify_semantic*.json` merges are the caller's too.
 *
 * -----------------------------------------------------------------------------
 * THE MECHANICAL ABORT RULE
 * -----------------------------------------------------------------------------
 * SKILL.md Step B3: "If more than half the chunks failed or are missing, stop." That rule
 * is judgment-free arithmetic, so it lives here rather than in the caller's turn. When it
 * trips, the script RETURNS `{ aborted: true, ... }` — it does NOT throw. The chunk JSONs
 * that DID land are real files on disk and stay usable for a partial re-run, and a thrown
 * workflow gives the caller a stack trace instead of the failed-chunk list it needs to
 * decide what to re-dispatch. A throw is reserved for the one case with nothing to hand
 * back: every chunk failed.
 *
 * Returns: { dispatched, returned, failedChunks, aborted, tokenUsage } — see the bottom of
 * this file.
 */

export const meta = {
  name: 'graphify-extract',
  description:
    'Dispatch pre-rendered graphify semantic-extraction chunk prompts in parallel; each subagent writes docs/state/graphs/.graphify_chunk_NN.json. Applies the mechanical >half-failed abort rule.',
  whenToUse:
    'Called by the graphify skill Step 3B when there are 2 or more uncached chunks. 1 chunk goes inline. The Kimi bypass (MOONSHOT_API_KEY set) never reaches this script. Part A (AST) runs in the orchestrator\'s own turn, concurrently with this backgrounded run.',
  phases: [
    { title: 'Semantic extraction', detail: 'one general-purpose subagent per chunk, each writing its chunk JSON' },
  ],
}

const PHASE_TITLE = 'Semantic extraction'

// The graphify skill's Step B2 subagent is a FILE WRITER: its real output is
// `.graphify_chunk_NN.json` on disk, and the nodes/edges/hyperedges arrays defined by that
// template's "Output exactly this JSON" line belong in that file, never in a return value
// (they are large, and Part C reads them from disk anyway). What comes back through the
// workflow boundary is a small receipt, so the log can say what each chunk claims to have
// produced without pulling the graph fragment through the agent transcript.
//
// `nodes` / `edges` mirror the same-named arrays in the Step B2 output contract, counted.
// `chunk` / `chunkFile` mirror the CHUNK_NUM substitution and the Step B3 success-signal
// path. `additionalProperties` is left OPEN on purpose: a subagent that also volunteers
// `hyperedges` or a note must not fail validation and cost us a chunk whose file is
// already sitting on disk.
const CHUNK_RECEIPT_SCHEMA = {
  type: 'object',
  required: ['chunk', 'chunkFile', 'filesProcessed', 'nodes', 'edges'],
  properties: {
    chunk: {
      type: 'integer',
      description: 'chunk number, verbatim from the CHUNK_NUM in the dispatched prompt',
    },
    chunkFile: {
      type: 'string',
      description:
        'the docs/state/graphs/.graphify_chunk_NN.json path actually written. A claim, not proof — Step B3 verifies it on disk.',
    },
    filesProcessed: {
      type: 'integer',
      minimum: 0,
      description: 'how many files from this chunk\'s FILE_LIST were actually read and extracted',
    },
    nodes: { type: 'integer', minimum: 0, description: 'length of the `nodes` array written to the chunk file' },
    edges: { type: 'integer', minimum: 0, description: 'length of the `edges` array written to the chunk file' },
  },
}

const { chunks: rawChunks = [], deepMode = false, routing = null } = args

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (!Array.isArray(rawChunks)) {
  throw new Error(
    'graphify-extract: args.chunks must be an array of { chunkNum, chunkFile, prompt } — one entry per uncached chunk from Step B1.',
  )
}
if (rawChunks.length < 2) {
  throw new Error(
    `graphify-extract: needs 2 or more chunks (got ${rawChunks.length}). Step B2 routes a single chunk to a plain inline Agent call with subagent_type="general-purpose" — a Workflow for one agent is pure overhead. Zero chunks means every file was a cache hit (Step B0) or the corpus is code-only, and Part B should have been skipped entirely.`,
  )
}

const malformed = rawChunks
  .map((c, i) => (c && Number.isInteger(c.chunkNum) && c.chunkFile && c.prompt ? null : i))
  .filter((i) => i !== null)
if (malformed.length > 0) {
  throw new Error(
    `graphify-extract: chunk entries at index [${malformed.join(', ')}] are missing an integer chunkNum, a chunkFile, or a prompt. All three are rendered in the orchestrator's turn before this call (Step B1 splitting + Step B2 template substitution); the script composes no prompt text of its own, so a missing prompt cannot be recovered here.`,
  )
}

const chunks = rawChunks

// agentType is SET, not inherited — Explore silently drops chunk files (see header).
// model/effort are decided caller-side by model-route.mjs and arrive as args.routing data,
// keyed by the ROLE name 'chunk-extractor' (NOT by the agentType 'general-purpose' — one
// descriptor per role, per model-routing.md §7); routing?.['chunk-extractor'] is spread
// first so an absent key still means "inherit the session default" rather than "pick
// something".
function buildOpts(chunk) {
  return {
    ...(routing?.['chunk-extractor'] ?? {}),
    label: `chunk-${chunk.chunkNum}`,
    phase: PHASE_TITLE,
    agentType: 'general-purpose',
    schema: CHUNK_RECEIPT_SCHEMA,
  }
}

phase(PHASE_TITLE)
log(
  `graphify-extract: ${chunks.length} uncached chunk(s), deep mode ${deepMode ? 'ON' : 'off'} (already baked into the prompts). One general-purpose subagent per chunk — Explore would be read-only and would silently drop every chunk file. Part A (AST) runs concurrently in the orchestrator's turn.`,
)
log(
  `token counts unavailable under Workflow dispatch — chunk JSONs keep placeholder zeros. Per-call usage is not visible to the orchestrator inside a Workflow, and a subagent cannot know its own token counts, so no writeback is attempted and none should be faked in Part C.`,
)

// Thunks, never live promises: `parallel()` is the barrier AND the concurrency governor,
// and it never rejects — a failed thunk yields null. Every chunk goes in one call because
// chunks are independent by construction (Step B1 partitions the uncached file list; no
// chunk reads another chunk's output).
const results = await parallel(chunks.map((c) => () => agent(c.prompt, buildOpts(c))))

const returned = []
const failedChunks = []
results.forEach((result, i) => {
  const c = chunks[i]
  if (result) {
    returned.push({
      chunk: c.chunkNum,
      chunkFile: c.chunkFile,
      filesProcessed: result.filesProcessed,
      nodes: result.nodes,
      edges: result.edges,
    })
    log(
      `chunk ${c.chunkNum}: claims ${result.filesProcessed} file(s) → ${result.nodes} node(s), ${result.edges} edge(s) in ${result.chunkFile}. Unverified — Step B3 must confirm the file exists on disk.`,
    )
  } else {
    failedChunks.push(c.chunkNum)
    log(
      `COVERAGE GAP: chunk ${c.chunkNum} returned nothing (agent failed, was skipped, or its receipt failed schema validation). ${c.chunkFile} is probably absent or partial, so EVERY FILE IN THAT CHUNK IS MISSING FROM THE GRAPH — those files are not in the merge, not in the cache, and nothing downstream will notice their absence. Re-dispatch this chunk before trusting the graph, and do not save the run to cache as if it were complete.`,
    )
  }
})

// Nothing landed at all: there are no artifacts to hand back and no partial worklist worth
// returning, so this is the one case that throws.
if (returned.length === 0) {
  throw new Error(
    `graphify-extract: all ${chunks.length} chunk(s) failed — no semantic extraction happened at all. Nothing was written to docs/state/graphs/. Do NOT merge or cache. Check that subagent dispatch is working at all before re-running; if chunks come back but their files do not, the dispatch was read-only (Explore) rather than general-purpose.`,
  )
}

// SKILL.md Step B3's rule, arithmetic only: strictly MORE than half failed. An exact half
// (2 of 4) does not trip it. No judgment is applied on top — the caller decides what to do
// with a partial run that did not trip the rule.
const aborted = failedChunks.length > chunks.length / 2

if (aborted) {
  log(
    `ABORT: ${failedChunks.length} of ${chunks.length} chunks failed — more than half. Per Step B3 this run is NOT usable: DO NOT merge the chunk files into .graphify_semantic_new.json, DO NOT save anything to the semantic cache (a cached bad chunk poisons every later run), and DO NOT let the graph be presented as complete. Re-run semantic extraction and confirm every dispatch uses subagent_type="general-purpose" — a read-only Explore dispatch produces exactly this pattern. Failed chunks: ${failedChunks.join(', ')}. The ${returned.length} chunk file(s) that did land are still on disk and are still valid, so a re-run may re-dispatch only the failed chunks rather than all ${chunks.length}.`,
  )
} else {
  log(
    `Semantic extraction barrier reached: ${returned.length}/${chunks.length} chunk(s) returned a receipt${failedChunks.length > 0 ? `, ${failedChunks.length} failed (${failedChunks.join(', ')})` : ''}. NOT VERIFIED and NOT MERGED — Step B3's per-chunk disk check, the cache save, and the .graphify_semantic.json merge are all the orchestrator's next actions. This script has no filesystem access.`,
  )
}

// The caller's Part C worklist. Every field echoes enough input to be self-describing so
// Step B3 never has to re-derive which chunk was which.
return {
  // How many subagents were actually dispatched (== chunks.length; nothing is pre-filtered
  // here, malformed input throws above rather than being silently dropped).
  dispatched: chunks.length,
  // One entry per chunk that came back, with its echoed chunkNum/chunkFile plus the counts
  // it CLAIMS to have written. Claims, not verified facts — the disk check is Part C's.
  returned,
  // Chunk numbers that returned nothing, named separately and by number so a dead chunk is
  // never mistaken for a chunk that ran and found little. Their files are absent from the
  // graph until re-dispatched.
  failedChunks,
  // True when strictly more than half the chunks failed (Step B3's mechanical rule). The
  // run returned rather than threw so the surviving chunk files stay usable, but an
  // aborted run must NOT be merged or cached.
  aborted,
  // Always the literal "unavailable" — not 0, not an estimate. Per-call usage is invisible
  // inside a Workflow and a subagent cannot self-report its own counts, so Part C must skip
  // the token writeback and let the chunk JSONs keep their placeholder zeros.
  tokenUsage: 'unavailable',
}
