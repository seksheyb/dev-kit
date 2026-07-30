/**
 * assumption-map — assumption-mapping's Parallel Extraction: the fixed VUBF fan-out.
 *
 * Invoked by `skills/assumption-mapping/SKILL.md` §Parallel Extraction whenever the skill
 * decides a spec is long enough to warrant dispatching all four VUBF categories at once
 * (its own stated threshold: "For a spec longer than about a page"). That threshold check,
 * and everything else about what each category's subagent should look for, is the skill's
 * judgment, made in the caller's turn, before this script is ever invoked. The single-
 * category re-run case (re-extracting just one category after a dropped unit, or a short
 * spec/single feature the skill keeps inline per its own "Keep the extraction inline for a
 * single feature or a short spec" note) never reaches this script — that is a plain inline
 * `Agent` call.
 *
 * -----------------------------------------------------------------------------
 * args contract
 * -----------------------------------------------------------------------------
 *   categories   Array<{ key: string, prompt: string }>   REQUIRED. Exactly 4 entries, one
 *                 per VUBF category, keyed "value" | "usability" | "business" | "feasibility"
 *                 — no more, no fewer, no duplicates, no unknown keys. Each `prompt` is the
 *                 COMPLETE, already-rendered extraction prompt for that category: the skill's
 *                 turn is the one that read the spec, decided what "must be true for this to
 *                 succeed" looks like for that category, and wrote the instruction asking for
 *                 an importance score, an evidence score, and the source backing each score
 *                 (SKILL.md §Assumption Extraction Process / §Parallel Extraction). This
 *                 script passes each `prompt` through to its subagent untouched — it never
 *                 restates the VUBF definitions, the scoring rubric, or the source-citation
 *                 requirement, and it never reads the spec itself.
 *
 * ZERO JUDGMENT LIVES HERE. The four category prompts, and the decision to run the fan-out
 * at all rather than staying inline, are both the skill's. This script only validates the
 * fixed 4-key roster, dispatches four thunks in parallel, classifies what came back, and
 * returns it. Scoring stays per-category in each subagent's own turn; ranking against the
 * whole set, and turning any of this into the top 3-5 priority assumptions, is explicitly
 * OUT of scope here — SKILL.md's own text is emphatic: "Never let a subagent return a
 * top-3." The prioritization grid and everything under "For Each Priority Assumption" run
 * in the skill's turn, after this script returns, once all four categories are back.
 *
 * WHY A FIXED 4-KEY ROSTER, NOT AN ARBITRARY LIST. The four VUBF categories are not a
 * per-run choice the way `bugfix-wave`'s tracks or `plan-review`'s lenses are picked per
 * invocation — they are the whole methodology (see discovery-map's DESIGN RATIONALE for the
 * same shape of argument about its fixed 6-unit roster). Accepting an arbitrary category
 * list would let a caller silently drop Feasibility or duplicate Value and still call the
 * result "an assumption map." So this script hard-validates the exact key set below instead
 * of just checking a minimum count.
 *
 * AGENT RESOLUTION. No agent `.md` in this corpus owns "extract assumptions for one VUBF
 * category" the way, say, `assumptions-analyzer` owns discovery's whole-phase assumption
 * pass — the category prompt itself is skill-rendered, self-contained instruction (see
 * README §2 "orchestrator-pre-rendered"), not a pointer to a named agent's documented
 * procedure. `agentType` is therefore omitted on every dispatch below, on purpose: every
 * extractor simply inherits the session's default agent type, exactly as `backlog-groom`'s
 * per-story refiners do for the same reason. `model` and `effort` are likewise omitted —
 * an absent value means inherit the session's, never a default this script guesses.
 *
 * ISOLATION: NONE. All four extractors are read-only passes over the same spec — none of
 * them writes a file or makes a git commit, so there is no concurrent-write race to isolate
 * against. `isolation: 'worktree'` would only add provisioning latency for zero writes
 * (README §4).
 *
 * Returns: { categories, missingCategories } — see the bottom of this file.
 * `categories` only ever contains entries that actually returned; a dropped category is
 * named in `missingCategories`, never represented as an empty/placeholder entry, because an
 * empty VUBF quadrant silently ranked as "nothing risky here" is worse than an explicit gap.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `plugins/dk/bin/model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['assumption-extractor']` (optional
 * `{model, effort}`) is spread into every extractor's opts; an absent `routing` or an absent
 * `assumption-extractor` entry leaves both keys absent, which means inherit — never a
 * guessed default.
 */

export const meta = {
  name: "assumption-map",
  description:
    "assumption-mapping's Parallel Extraction: one subagent per VUBF category (value/usability/business/feasibility), each scoring its own assumptions by importance and evidence. Ranking and the prioritization grid stay in the skill's turn after return.",
  whenToUse:
    "Called by the assumption-mapping skill's Parallel Extraction section when a spec is long enough to warrant all four VUBF categories in one message. A single re-run (one dropped category, or a short spec kept inline) is a plain inline Agent call instead.",
  phases: [
    { title: "Parallel Extraction", detail: "one subagent per VUBF category (value/usability/business/feasibility)" },
  ],
};

const PHASE_TITLE = "Parallel Extraction";

// The exact, fixed roster. Never data-driven beyond this set — see WHY A FIXED 4-KEY
// ROSTER above.
const KNOWN_KEYS = ["value", "usability", "business", "feasibility"];

// Mirrors SKILL.md's §Parallel Extraction contract field for field: "each returning its
// assumptions with an importance score, an evidence score, and the source backing each
// score." `importance`/`evidence` reuse the Prioritization Grid's own H/M/L vocabulary
// (SKILL.md's "Score each: Importance (H/M/L) x Evidence (H/M/L)"). `additionalProperties`
// left open so a stray extra key never costs the whole category's extraction.
const ASSUMPTION_SCHEMA = {
  type: "object",
  required: ["assumption", "importance", "evidence", "source"],
  properties: {
    assumption: { type: "string", description: "The assumption stated clearly." },
    importance: { type: "string", enum: ["H", "M", "L"], description: "Importance to the idea succeeding." },
    evidence: { type: "string", enum: ["H", "M", "L"], description: "Evidence we have right now." },
    source: { type: "string", description: "What backs this score — a cited section, prior data, or 'none' if asserted." },
  },
};

const CATEGORY_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["assumptions"],
  properties: {
    assumptions: {
      type: "array",
      items: ASSUMPTION_SCHEMA,
      description: "Every assumption this category's subagent extracted, each independently scored. Never a top-3 — SKILL.md is explicit that ranking is a barrier across all four categories, not a per-category call.",
    },
  },
};

// Eager arg validation — throw with actionable messages BEFORE any phase()/dispatch.
const categories = Array.isArray(args.categories) ? args.categories : null;

if (!categories) {
  throw new Error("assumption-map workflow: `categories` arg is required — an array of exactly 4 { key, prompt } entries, one per VUBF category.");
}
if (categories.length !== KNOWN_KEYS.length) {
  throw new Error(
    `assumption-map workflow: \`categories\` must have exactly ${KNOWN_KEYS.length} entries (got ${categories.length}). ` +
      "The VUBF roster is fixed — value, usability, business, feasibility — never a partial or extended set.",
  );
}
const malformed = categories.filter((c) => !c || typeof c.key !== "string" || typeof c.prompt !== "string" || !c.prompt);
if (malformed.length > 0) {
  throw new Error(
    `assumption-map workflow: ${malformed.length} of ${categories.length} categories is missing a string \`key\` or a non-empty \`prompt\` — every category's prompt must already be fully rendered by the skill before dispatch.`,
  );
}
const seenKeys = new Set();
const unknownKeys = [];
const duplicateKeys = [];
for (const c of categories) {
  if (!KNOWN_KEYS.includes(c.key)) unknownKeys.push(c.key);
  else if (seenKeys.has(c.key)) duplicateKeys.push(c.key);
  else seenKeys.add(c.key);
}
if (unknownKeys.length > 0) {
  throw new Error(
    `assumption-map workflow: unknown category key(s) [${unknownKeys.join(", ")}] — the only valid keys are ${KNOWN_KEYS.join(", ")}.`,
  );
}
if (duplicateKeys.length > 0) {
  throw new Error(`assumption-map workflow: duplicate category key(s) [${duplicateKeys.join(", ")}] — each VUBF category may appear exactly once.`);
}
const missingKeys = KNOWN_KEYS.filter((k) => !seenKeys.has(k));
if (missingKeys.length > 0) {
  throw new Error(`assumption-map workflow: missing category key(s) [${missingKeys.join(", ")}] — all four VUBF categories are required.`);
}

function buildOpts(key) {
  // agentType is omitted, on purpose — see AGENT RESOLUTION above: no named agent owns
  // per-category extraction. model/effort are decided caller-side by model-route.mjs and
  // arrive as args.routing?.['assumption-extractor'] — spread before the always-set keys so
  // an absent routing entry still means inherit, never a default this script picks.
  return {
    ...(args.routing?.["assumption-extractor"] ?? {}),
    label: `extract:${key}`,
    phase: PHASE_TITLE,
    schema: CATEGORY_RESULT_SCHEMA,
  };
}

phase(PHASE_TITLE);
log(`assumption-map: dispatching all 4 fixed VUBF categories in parallel: ${categories.map((c) => c.key).join(", ")}`);

// Thunks, not already-invoked promises — parallel() controls concurrency and its barrier
// semantics hold. parallel() never rejects; a failed/skipped thunk yields null.
const raw = await parallel(categories.map((c) => () => agent(c.prompt, buildOpts(c.key))));

const results = [];
const missingCategories = [];

raw.forEach((result, i) => {
  const key = categories[i].key;
  if (result) {
    results.push({ category: key, assumptions: result.assumptions });
    return;
  }
  missingCategories.push(key);
  // A dropped category is a coverage gap, never a silent one — an empty VUBF quadrant would
  // otherwise read as "nothing risky here" instead of "not extracted."
  log(
    `COVERAGE GAP: the "${key}" VUBF category returned nothing (agent failed, was skipped, or its output failed schema validation). This category has ZERO assumptions in this run — the prioritization grid and ranking that follow are PROVISIONAL until this category is re-run inline (a single-category re-run is the exactly-1-unit case, dispatched as a plain Agent call, never another Workflow run).`,
  );
});

if (missingCategories.length === KNOWN_KEYS.length) {
  throw new Error("assumption-map workflow: all 4 VUBF categories failed or were skipped — nothing to rank. Re-run the whole fan-out.");
}

log(
  `assumption-map: ${results.length}/${KNOWN_KEYS.length} categories returned ` +
    `(${results.reduce((n, r) => n + (Array.isArray(r.assumptions) ? r.assumptions.length : 0), 0)} assumption(s) total). ` +
    "Ranking against the prioritization grid, and selecting the top 3-5 to test, stays in the caller's turn — this script never ranks across categories.",
);

// Returned to the caller (assumption-mapping SKILL.md's Parallel Extraction section), which
// runs the prioritization grid across every category's assumptions once all are back.
return {
  // One entry per category that actually returned: { category, assumptions }. A dropped
  // category is named in `missingCategories`, never represented here as an empty entry.
  categories: results,
  // Every category key that returned nothing this run — the caller's re-dispatch worklist.
  missingCategories,
};
