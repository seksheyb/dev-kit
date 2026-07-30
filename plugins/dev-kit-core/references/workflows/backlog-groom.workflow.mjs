/**
 * backlog-groom workflow — fan out one read-only refinement agent per story, in parallel,
 * over a single grooming-session batch, then hand the caller a merge-ready worklist.
 *
 * Invoked by `skills/backlog-grooming/SKILL.md` Part 2 (Story Refinement) whenever a
 * grooming session has picked 2 or more candidate stories to refine in one pass (the
 * skill's own "top 5-8 per session" batch — never more than 8). A 1-story batch never
 * reaches here: the skill dispatches a single plain inline `Agent` call instead, because a
 * Workflow for one agent is pure overhead. Part 1 (Backlog Hygiene) and Part 3 (Priority
 * Review) never route through this script at all, regardless of batch size — both are
 * whole-file passes against BACKLOG.md's Now/Next/Later/Icebox/Won't Do ordering, not
 * per-story work, and stay in the main grooming session.
 *
 * args contract
 * -------------
 *   stories          array   REQUIRED. 2-8 candidate stories for this refinement batch:
 *                             [{ id, title, currentText, category }]. `id` must be stable
 *                             (a US-xxx global ID, or a durable backlog line anchor) — it
 *                             is the join key the caller uses to merge each result back
 *                             into BACKLOG.md. `currentText` is the story's current
 *                             backlog entry verbatim, or absent for a brand-new candidate;
 *                             `category` is its current Now/Next/Later/Icebox/Won't Do
 *                             bucket. Fewer than 2 stories throws — that is the inline
 *                             route, not a Workflow. More than 8 throws — that exceeds the
 *                             skill's own session batch size; split into two grooming
 *                             passes instead of one oversized fan-out.
 *   backlogPath      string  REQUIRED. Path to `docs/global/requirements/BACKLOG.md` (or
 *                             the project's override). Passed to every agent as READ-ONLY
 *                             context — whole-backlog awareness for dependency and
 *                             duplicate detection — never as a write target.
 *   estimationMethod string  optional. "story-points" | "t-shirt", or omitted to let each
 *                             agent infer the convention already in use from BACKLOG.md.
 *   contextPaths     array   optional. Extra paths every refiner should read (roadmap,
 *                             PROJECT.md, related specs, the Theme->Pillar->US-xxx map).
 *                             Passed through verbatim.
 *
 * ZERO JUDGMENT LIVES HERE. Which stories are in this batch, their current text and
 * category, the backlog path, and the estimation method all arrive pre-decided in `args`
 * — chosen during the grooming session's own Part 1/Part 2 discussion, in the caller's
 * turn. This script only does control flow: fan the batch out one story per agent, wait
 * for the barrier, and separate what came back from what did not. It performs no
 * refinement judgment itself and writes no file — not even BACKLOG.md.
 *
 * ROSTER: N agents, one per story, `agentType` omitted on every one of them. No named
 * domain agent owns "refine one backlog story" the way, say, `plan-reviewer` owns lens
 * review elsewhere in this corpus, so every refiner simply inherits the session's default
 * agent type — there is no bare-name/plugin-qualified resolution question to caveat here,
 * because no agentType is ever set. `model` is omitted for the same reason: omitted means
 * inherit, never a default this script would otherwise have to pick.
 *
 * PROMPT STRATEGY: skill self-injection. Each agent's first instruction is to invoke the
 * Skill tool with `dev-kit-core:backlog-grooming` and apply that skill's Part 2 (Story
 * Refinement) to its own ONE story — the five-step checklist (read the story, sharpen
 * acceptance criteria, surface open questions, identify dependencies, estimate) and the
 * Definition of Ready checklist stay single-sourced in the skill file; this script never
 * duplicates them into its own prompt text. The dispatch prompt otherwise carries only
 * that one story's own inputs, plus one hard line repeated verbatim in every dispatch:
 * "Do NOT edit BACKLOG.md or any other file. Return JSON only." — restated at the exact
 * point an agent would otherwise be tempted to "just fix the file directly" instead of
 * returning structured JSON.
 *
 * NO WORKTREE. `isolation:'worktree'` is deliberately not used, here or in any of this
 * pass's 13 sibling workflow scripts — no roster in any of them has a member committing
 * anything concurrently. Here specifically: every refiner is read-only against the
 * codebase and against `backlogPath` — it reads, it never edits — and returns its
 * refinement as structured JSON, not as a file write. With nothing being committed in
 * parallel, there is nothing to isolate; a worktree would only buy a merge step for zero
 * writes.
 *
 * THE SINGLE MERGE WRITE STAYS IN THE CALLER'S TURN. BACKLOG.md is one shared file — if
 * two agents both held write access to it in parallel, the second writer's save would
 * silently clobber the first's. So this script's agents never touch it: they return
 * structured per-story results, and the caller (back in the grooming session, after this
 * Workflow returns) performs the one merge write, re-sorting Now/Next/Later/Icebox/Won't
 * Do exactly as Part 2 and the skill's own "Output Format" section already require.
 *
 * Returns: { refined, droppedStories } — see the bottom of this file. The caller merges
 * `refined` into BACKLOG.md in that one write, and treats every entry in `droppedStories`
 * as still unrefined — never as sprint-ready, and never silently re-filed under its old
 * category as if nothing happened.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `plugins/dk/bin/model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['story-refiner']` (optional `{model,
 * effort}`) is spread into every refiner's opts; an absent `routing` or an absent
 * `story-refiner` entry leaves both keys absent, which means inherit — never a guessed
 * default.
 */

export const meta = {
  name: "backlog-groom",
  description:
    "Per-story parallel refinement. Agents are read-only and return structured per-story results; the single BACKLOG.md merge write stays in the caller's turn — BACKLOG.md is one shared file and concurrent writers would corrupt it.",
  whenToUse:
    "Called by the backlog-grooming skill's Part 2 (Story Refinement) for a batch of 2-8 candidate stories. A 1-story batch is a plain inline Agent call instead. Part 1 (Backlog Hygiene) and Part 3 (Priority Review) are whole-file passes and never route through this script — they stay in the main grooming session.",
  phases: [
    {
      title: "Refine",
      detail: "one read-only refinement agent per story, in parallel; results return via schema",
    },
  ],
};

// Mirrors `backlog-grooming` SKILL.md's own vocabulary field-for-field: Part 2's five
// refinement outputs (title, acceptance criteria, open questions, dependencies, estimate),
// the "Story Readiness Checklist (Definition of Ready)" collapsed into one readiness
// verdict, and the exact five-bucket taxonomy from "## Backlog Categories". "Won't Do"
// becomes the enum literal "WontDo" because a JSON Schema enum value cannot cleanly carry
// the apostrophe/space pair — the caller re-expands it to the skill's literal "Won't Do"
// heading when it performs the BACKLOG.md merge write.
const REFINEMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "storyId",
    "refinedTitle",
    "acceptanceCriteria",
    "estimate",
    "dependencies",
    "openQuestions",
    "readiness",
    "recommendedCategory",
  ],
  properties: {
    storyId: {
      type: "string",
      description: "echoed verbatim from args.stories[i].id — the merge join key back into BACKLOG.md",
    },
    refinedTitle: { type: "string" },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    estimate: {
      type: "string",
      description:
        'e.g. "5" under story-points or "M" under t-shirt sizing — matches args.estimationMethod when given, otherwise whatever convention the agent found already in use in BACKLOG.md',
    },
    dependencies: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    readiness: {
      type: "string",
      enum: ["ready", "needs-work"],
      description: "verdict from the Definition of Ready checklist",
    },
    recommendedCategory: {
      type: "string",
      enum: ["Now", "Next", "Later", "Icebox", "WontDo"],
      description: 'may differ from args.stories[i].category — "WontDo" maps to the skill\'s "Won\'t Do" bucket',
    },
  },
};

const stories = Array.isArray(args.stories) ? args.stories : [];
const backlogPath = args.backlogPath;
const estimationMethod = args.estimationMethod || null;
const contextPaths = Array.isArray(args.contextPaths) ? args.contextPaths : [];

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (!backlogPath) {
  throw new Error(
    "backlog-groom workflow: `backlogPath` arg is required — read-only context every refiner needs for dependency/duplicate awareness.",
  );
}
if (stories.length < 2) {
  throw new Error(
    `backlog-groom workflow: needs 2 or more stories (got ${stories.length}). A single story is a plain inline Agent call, not a Workflow.`,
  );
}
if (stories.length > 8) {
  throw new Error(
    `backlog-groom workflow: got ${stories.length} stories, over the skill's own session batch size of 8 ("top 5-8 per session"). Split into two grooming passes instead of one oversized fan-out.`,
  );
}
const malformed = stories.filter((s) => !s || !s.id || !s.title);
if (malformed.length > 0) {
  throw new Error(
    `backlog-groom workflow: ${malformed.length} of ${stories.length} stories is missing a required id/title — every story must be fully decided in the caller's turn before dispatch.`,
  );
}

// Inputs plus the skill self-injection instruction only — `backlog-grooming` SKILL.md
// Part 2 owns the refinement checklist and the Definition of Ready criteria; nothing here
// restates them.
function dispatchPrompt(story) {
  const lines = [
    "Invoke the Skill tool with skill: `dev-kit-core:backlog-grooming` and apply that " +
      "skill's Part 2 (Story Refinement) to the ONE story below. Do not touch any other " +
      "story, and do not perform Part 1 (Backlog Hygiene) or Part 3 (Priority Review) — " +
      "those stay with the caller.",
    "",
    "Story to refine:",
    `- id: ${story.id}`,
    `- title: ${story.title}`,
    `- current category: ${story.category || "unknown"}`,
    "- current backlog entry:",
    story.currentText || "(no existing entry text — this is a new candidate story)",
    "",
    `Backlog file (read-only context, for dependency/duplicate awareness — do not edit): ${backlogPath}`,
  ];
  if (estimationMethod) lines.push(`Estimation method: ${estimationMethod}`);
  if (contextPaths.length > 0) lines.push(`Additional context: ${contextPaths.join(", ")}`);
  lines.push(
    "",
    "Apply Part 2's five steps (read the story, sharpen acceptance criteria, surface open " +
      "questions, identify dependencies, estimate) and the Definition of Ready checklist to " +
      "decide readiness. Recommend the Now/Next/Later/Icebox/Won't Do bucket this story now " +
      "belongs in — it may differ from its current category.",
    "",
    "Do NOT edit BACKLOG.md or any other file. Return JSON only.",
  );
  return lines.join("\n");
}

function buildOpts(story) {
  // agentType is omitted, on purpose — see the ROSTER note above: no named agent owns
  // per-story refinement. model/effort are decided caller-side by model-route.mjs and
  // arrive as args.routing?.['story-refiner'] — spread before the always-set keys so an
  // absent routing entry still means inherit, never a default this script picks.
  return {
    ...(args.routing?.["story-refiner"] ?? {}),
    label: `refine:${story.id}`,
    phase: "Refine",
    schema: REFINEMENT_SCHEMA,
  };
}

phase("Refine");
log(
  `Refining ${stories.length} stories in parallel against ${backlogPath}: ${stories.map((s) => s.id).join(", ")}`,
);

// `parallel()` is a barrier and never rejects; a failed thunk yields null.
const raw = await parallel(stories.map((story) => () => agent(dispatchPrompt(story), buildOpts(story))));

const refined = [];
const droppedStories = [];
raw.forEach((result, i) => {
  const story = stories[i];
  if (result) {
    refined.push(result);
  } else {
    // A dropped story is NOT a clean story. Silence here would read as full coverage and
    // risk the caller re-filing it under its old category as if nothing happened.
    droppedStories.push({ id: story.id, title: story.title });
    log(
      `COVERAGE GAP: story ${story.id} was NOT refined (agent failed, was skipped, or its ` +
        "output failed schema validation). It stays unrefined, do not mark it sprint-ready " +
        "— leave its existing BACKLOG.md entry untouched and re-run it in a follow-up batch " +
        "before trusting this batch as complete.",
    );
  }
});

if (refined.length === 0) {
  throw new Error("backlog-groom workflow: every story in this batch failed to refine; nothing to merge.");
}

log(
  `Done: ${refined.length}/${stories.length} stories refined, ${droppedStories.length} dropped. The caller performs the one BACKLOG.md merge write next.`,
);

// Returned to the caller, which performs the single merge write into BACKLOG.md.
return {
  // One entry per REFINEMENT_SCHEMA result — the caller's merge worklist.
  refined,
  // Named separately, never merged into `refined`: a dropped story must never be mistaken
  // for a refined one with nothing to say. It simply is not represented in `refined` at
  // all, and its existing BACKLOG.md entry must be left exactly as it was.
  droppedStories,
};
