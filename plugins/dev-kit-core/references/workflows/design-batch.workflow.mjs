/**
 * design-batch — initial-build fan-out for design-html's Batch Mode.
 *
 * Invoked by `skills/design-html/SKILL.md` ("Batch Mode (initial builds only)") whenever
 * the user asks for 2 or more pages in one request. One page = one Step-3 page-builder
 * subagent = one Claude Design project/file it writes.
 *
 * THIS SCRIPT CONTAINS ZERO JUDGMENT. Step 0 (design system check, model choice), Step 1
 * (per-page Implementation Spec), and Step 2 (layout strategy) all happen in the
 * orchestrator's turn before this call; each `args.pages[]` entry's `prompt` is that
 * output, fully rendered, verbatim — the script never authors or patches prompt text. The
 * script only fans the pre-rendered prompts out in parallel and collects what comes back.
 *
 * ── WHO TOUCHES screens.json ─────────────────────────────────────────────────────────
 * `.claude/design/screens.json` is the one shared mutable file every design-html
 * invocation upserts, and it has exactly one writer per run: the orchestrating skill,
 * serially, after this script returns — never a dispatched subagent, and never this
 * script (it has no filesystem access at all; see the authoring-checklist ban below).
 * Every page-builder subagent is told, in its rendered prompt, to skip that upsert. The
 * skill performs every upsert for the whole batch in one pass over the returned
 * `results[]`, after the join.
 *
 * ── args contract ────────────────────────────────────────────────────────────────────
 * {
 *   pages: [                          REQUIRED, minimum 2 entries (design-html's own
 *                                     routing rule sends exactly 1 page inline instead).
 *     {
 *       name:   string                REQUIRED. Screen name, e.g. "landing-page" — used
 *                                     as the agent label and echoed back for the
 *                                     screens.json upsert.
 *       prompt: string                REQUIRED. The fully-rendered Step-3 subagent prompt
 *                                     for this page — Implementation Spec, layout
 *                                     strategy, claude_design_system_id, existing project
 *                                     id if evolving, Claude Design workflow instructions,
 *                                     the AI-slop blacklist, and the report-back
 *                                     instruction (project_id, path(s), open_url, model
 *                                     used). Passed through untouched.
 *       agentType: string             optional. Defaults to the session default.
 *     }
 *   ]
 *   operatorModel: string             optional. THE ONE SANCTIONED MODEL-SHAPED CODE PATH
 *                                     in this script: the model the operator chose at
 *                                     design-html Step 0, forwarded verbatim to every
 *                                     page's dispatch so the whole batch renders under one
 *                                     chosen model, per SKILL Step 0 ("every subagent
 *                                     dispatch for this invocation ... uses that same
 *                                     chosen model"). This is an operator's own explicit
 *                                     choice being passed through, not a value this script
 *                                     invents, defaults, or upgrades/downgrades — when
 *                                     absent, `model` is omitted entirely so the session
 *                                     default applies. This script itself never invents an
 *                                     `effort` value — the only `effort` that can reach a
 *                                     dispatch is whatever `args.routing['page-builder']`
 *                                     carries (see MODEL/EFFORT ROUTING below).
 * }
 *
 * Returns: { results[], dropped[] } — see the bottom of this file.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['page-builder']` (optional `{model,
 * effort}`) is spread into every page's opts BEFORE `operatorModel`, so the operator's own
 * explicit Step-0 model choice keeps outranking the router (model-routing.md §7's
 * precedence note); an absent `routing` or an absent `page-builder` entry leaves both keys
 * absent, which means inherit — never a guessed default.
 */

export const meta = {
  name: 'design-batch',
  description:
    'Dispatches one Step-3 page-builder subagent per page for design-html Batch Mode initial builds, all bound to the same design system and (optionally) the same operator-chosen model. Every page writes its own file; no subagent touches screens.json.',
  whenToUse:
    'Called by the design-html skill Batch Mode when the user asks for 2 or more pages in one request. A single-page request is dispatched inline with a plain Agent call instead.',
  phases: [{ title: 'Batch build', detail: 'one page-builder per page, all in parallel' }],
}

// Mirrors design-html SKILL.md Step 3's "report back" contract field for field:
// `project_id`, path(s) written, `open_url` (never `serve_url`), and `model used`.
const PAGE_RESULT_SCHEMA = {
  type: 'object',
  required: ['project_id', 'paths', 'open_url', 'model_used'],
  properties: {
    project_id: { type: 'string', description: 'the Claude Design project id this page was written into' },
    paths: {
      type: 'array',
      items: { type: 'string' },
      description: 'every path written for this page (the .dc.html deliverable and any support files)',
    },
    open_url: {
      type: 'string',
      description:
        'the durable Claude Design open URL for this page — never a short-lived serve_url; SKILL Step 4 treats a serve_url here as the subagent having ignored instructions',
    },
    model_used: { type: 'string', description: 'the model the subagent actually ran under, for the always-dispatch policing check in SKILL Step 4' },
  },
}

const pages = Array.isArray(args.pages) ? args.pages : []
const operatorModel = typeof args.operatorModel === 'string' && args.operatorModel.length > 0 ? args.operatorModel : undefined

// Eager validation — throws before any dispatch, never partway through the fan-out.
if (pages.length < 2) {
  throw new Error(
    'args.pages must contain 2 or more entries — design-html routes exactly 1 page to a plain inline Agent call instead of this script (README §1).',
  )
}
const malformed = pages.filter((p) => !p || typeof p.name !== 'string' || !p.name || typeof p.prompt !== 'string' || !p.prompt)
if (malformed.length > 0) {
  throw new Error(
    `${malformed.length} page(s) missing a required name or prompt — every page's Implementation Spec and prompt are rendered in the orchestrator's turn (design-html Steps 0-3) before this call.`,
  )
}

log(
  `design-batch: ${pages.length} page(s) — ${pages.map((p) => p.name).join(', ')}. ${operatorModel ? `Operator-chosen model: ${operatorModel} (forwarded to every page).` : 'No operatorModel passed — every page inherits the session model.'} screens.json is not touched by this script or any dispatched subagent; the skill upserts it for the whole batch after this run returns.`,
)

const opts = (page) => {
  const built = {
    // model/effort routing, spread first so the operator passthrough below still wins —
    // see MODEL/EFFORT ROUTING in the header.
    ...(args.routing?.['page-builder'] ?? {}),
    label: page.name,
    phase: 'Batch build',
    schema: PAGE_RESULT_SCHEMA,
  }
  if (page.agentType) built.agentType = page.agentType
  // OPERATOR PASSTHROUGH — the one sanctioned model-shaped code path in this script, and it
  // outranks args.routing per model-routing.md §7. Set only when the operator's Step-0
  // choice was forwarded; otherwise the routing-supplied (or absent) model applies.
  if (operatorModel) built.model = operatorModel
  return built
}

phase('Batch build')
const raw = await parallel(pages.map((page) => () => agent(page.prompt, opts(page))))

const results = raw
  .map((r, i) => (r ? { name: pages[i].name, ...r } : null))
  .filter(Boolean)

const dropped = raw
  .map((r, i) => (r ? null : { name: pages[i].name }))
  .filter(Boolean)

// A dropped page is NOT a built page. Silence here would read as full batch coverage.
for (const d of dropped) {
  log(
    `COVERAGE GAP: page "${d.name}" returned no usable result — it may have been built but failed to report, or it may not have been built at all. It will NOT be upserted into screens.json, and it is not safe to hand to the user as done. Verify with list_files before re-dispatching (inline or in a smaller batch).`,
  )
}

log(
  `Done: ${results.length}/${pages.length} page(s) built, ${dropped.length} dropped. Next: the skill upserts .claude/design/screens.json for every entry in results[], then runs Step 4's refinement loop one page at a time (explicitly serial and human — never parallelised).`,
)

return {
  // One entry per page that returned a valid result — project_id, paths, open_url,
  // model_used, plus the page name for the screens.json upsert key.
  results,
  // Pages with no usable result at all. Distinct from a page that returned a BLOCKED-style
  // status inside its own prose (this contract has no such status field to conflate with —
  // a page either reports the full contract or it is dropped).
  dropped,
}
