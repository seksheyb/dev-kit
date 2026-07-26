/**
 * sprint-execution — ONE wave of track dispatch
 * =============================================================================
 * Owns ONE thing: fanning a single wave's tracks out as worktree-isolated subagents and
 * returning their structured close handovers. Everything else — reading the plan,
 * reviewing it, choosing models, authoring briefs, merging branches, removing worktrees,
 * writing the state file / roadmap / ledger, running review gates — stays with the
 * orchestrator (see skills/sprint-execution/SKILL.md §1, §2, §4, §6, §7).
 *
 * ZERO JUDGMENT LIVES HERE. Every model, effort, skill-id, brief path, report path,
 * branch, track name and wave grouping arrives pre-decided in `args`. The script never
 * derives, defaults or overrides any of them. If an optional value is missing, the field
 * is simply omitted from the agent options (which means "inherit the session model" for
 * `model`) — it is never guessed.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * integrationBranch  string    REQUIRED. The source branch: what every track's branch is
 *                              cut from (`git reset --hard <integrationBranch>`) and what
 *                              the orchestrator later merges into. Usually `main` or the
 *                              sprint working branch. This is the "source branch" of
 *                              the wave dispatch branch model (see SKILL.md §3).
 * planPath           string    REQUIRED. Path to the plan file. Passed as a path only —
 *                              tracks read their brief, not the plan (SKILL §4).
 * specPath           string    optional. Path to the spec file, or null/omitted.
 * sprintLabel        string    optional. Short human label used in log lines only.
 * stagger            boolean   optional, default false. See WORKTREE PROVISIONING below.
 * wave               number    optional. Wave number for labels and logs. Defaults to 1.
 * tracks             array     REQUIRED, non-empty. One object per track in THIS wave:
 *   track.name             string  REQUIRED. Logical track label, used in labels and logs.
 *   track.branch           string  REQUIRED. The branch this track creates from
 *                                  integrationBranch and commits to, e.g.
 *                                  `sprint/w1-track-api`. Echoed back in the handover: it
 *                                  is the orchestrator's authoritative merge list.
 *   track.briefPath        string  REQUIRED. Task brief file the track reads first.
 *   track.reportPath       string  REQUIRED. File the track writes its full report to.
 *   track.model            string  optional. Omit/null => inherit session model
 *                                  (correct when the plan's map says `inherit`).
 *   track.effort           string  optional. low|medium|high|xhigh|max.
 *   track.skillId          string  optional. Domain skill the SUBAGENT loads itself.
 *   track.agentType        string  optional. Named agent type for this track.
 *   track.contextLine      string  optional. One line on where this track fits.
 *   track.priorInterfaces  string  optional. Interfaces/decisions from earlier waves
 *                                  that the brief cannot know.
 *   track.ambiguityNotes   string  optional. The orchestrator's resolution of any
 *                                  ambiguity it noticed in this track's tasks.
 *
 * -----------------------------------------------------------------------------
 * ONE WAVE PER RUN — not a preference, a correctness constraint
 * -----------------------------------------------------------------------------
 * `args` carries a single wave, never a list. SKILL §3 requires that Wave N+1 not start
 * until all Wave N subagents have returned AND their branches are merged. `parallel()` is
 * a barrier on the first half only: a wave's tracks have all RETURNED when it resolves.
 * The second half — MERGE — is orchestrator-owned (§6) and cannot happen inside this
 * script, which has no filesystem or git access of its own.
 *
 * Because every track cuts its branch from `integrationBranch`, a later wave in the SAME
 * run would branch off a commit that does not yet contain the earlier wave's merged work.
 * So Wave N+1 is a SEPARATE invocation, made only after the orchestrator has merged and
 * verified Wave N. See SKILL.md §3 (branch model) and §6 (post-wave bookkeeping).
 *
 * -----------------------------------------------------------------------------
 * THE SCRIPT NEVER MERGES
 * -----------------------------------------------------------------------------
 * No merging, no rebasing, no branch deletion, no `git worktree remove`, no state /
 * roadmap / ledger / metrics writes, no review gates, no interpreting a BLOCKED status.
 * The script reports; the orchestrator acts. Its return value is the worklist for that.
 *
 * -----------------------------------------------------------------------------
 * WORKTREE PROVISIONING — known unknown, do not read this as "solved"
 * -----------------------------------------------------------------------------
 * SKILL §3's inline route forbids batching worktree-creating Agent calls into one message
 * because simultaneous worktree creation races on `.git/config.lock`. `parallel()` with
 * `isolation:'worktree'` creates worktrees concurrently, which is the same shape.
 *
 * The workflow runtime provisions worktrees itself rather than the model hand-issuing
 * Agent calls, so the failure mode MAY not apply identically here. That is a hypothesis,
 * not a measurement — nothing in this repo has verified it either way. Treat the race as
 * possible until a run proves otherwise.
 *
 * `stagger: true` is the only mitigation available in-script and it is PARTIAL: it awaits
 * the wave's FIRST track alone, then `parallel()`s the remaining tracks. Those remaining
 * tracks still provision concurrently with each other, so a 4-track wave still creates 3
 * worktrees at once. The cost is real and large — the first track runs to completion
 * before any other track starts, so a 2-track wave becomes fully sequential. There is no
 * cheaper stagger available: the script cannot sleep, and `Date.now()` throws in this
 * runtime. Default is `false`; re-run a wave with `stagger: true` if its provisioning
 * failed. Provisioning also costs ~200-500ms and disk per agent regardless.
 *
 * -----------------------------------------------------------------------------
 * OTHER RUNTIME BOUNDS
 * -----------------------------------------------------------------------------
 * Concurrency is capped at min(16, cores-2); excess tracks queue and still complete, so
 * a wave's track list is never pre-truncated here. Hard ceilings: 4096 items per call,
 * 1000 agents per workflow lifetime.
 */

export const meta = {
  name: "sprint-execution-wave-dispatch",
  description:
    "Dispatch one wave of a sprint plan's Parallel Execution Map: one worktree-isolated subagent per track, each on its own branch, with a structured close handover. All planning, merging and bookkeeping stay with the orchestrator.",
  whenToUse:
    "Called by the sprint-execution skill for a wave with 2 or more tracks. A single-track wave goes inline as a plain Agent call. Later waves are separate runs, dispatched only after the orchestrator has merged and verified the previous wave.",
  phases: [
    { title: "Wave", detail: "this wave's tracks, each in its own worktree and branch" },
  ],
};

const PHASE_TITLE = "Wave";

// §5's close handover, field for field. `status` carries the four values §5 defines;
// interpreting them (re-dispatch, split, escalate) is the orchestrator's call, not this
// script's — the script only reports what came back.
const HANDOVER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "track",
    "branch",
    "merged",
    "tasks_completed",
    "commits",
    "summary_md",
    "tests",
    "conflicts_handed_off",
    "notes_for_orchestrator",
    "status",
  ],
  properties: {
    track: { type: "string", description: "Track name, verbatim from the dispatch." },
    branch: {
      type: "string",
      description: "The branch this track committed to, verbatim from the dispatch. The orchestrator's authoritative merge target.",
    },
    // Always false under this design. The field is retained rather than dropped so that a
    // future variant which does let tracks merge cannot silently reuse the same handover
    // shape with the opposite meaning.
    merged: {
      type: "boolean",
      description:
        "ALWAYS false. Tracks never merge, rebase onto the integration branch, or delete their branch — the orchestrator does that after this run. A true here means the track violated its prompt.",
    },
    tasks_completed: {
      type: "array",
      items: { type: "string" },
      description: "Task IDs completed, e.g. [\"T1\", \"T2\"].",
    },
    commits: {
      type: "array",
      items: { type: "string" },
      description: "Commit SHAs made on the track branch, oldest first.",
    },
    summary_md: {
      type: "string",
      enum: ["committed", "not-committed"],
      description: "Whether the track's SUMMARY.md was written AND committed before returning.",
    },
    tests: { type: "string", description: "One-line suite result." },
    conflicts_handed_off: {
      type: "string",
      description: "\"<file> — <description>\" per conflict, or \"none\". Never resolved unilaterally.",
    },
    notes_for_orchestrator: {
      type: "string",
      description: "Anything outside this track's context, or \"none\".",
    },
    status: {
      type: "string",
      enum: ["DONE", "DONE_WITH_CONCERNS", "NEEDS_CONTEXT", "BLOCKED"],
    },
  },
};

const {
  integrationBranch,
  planPath,
  specPath = null,
  sprintLabel = "sprint",
  stagger = false,
  wave = 1,
  tracks: rawTracks = [],
} = args;

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (!integrationBranch) throw new Error("args.integrationBranch is required");
if (!planPath) throw new Error("args.planPath is required");
if (Array.isArray(args.waves)) {
  throw new Error(
    "args.waves is no longer accepted: this script dispatches ONE wave per run. Pass { integrationBranch, planPath, wave, tracks } for the current wave only, merge and verify it, then invoke again for the next wave.",
  );
}
if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
  throw new Error("args.tracks must be a non-empty array of this wave's tracks");
}

const tracks = rawTracks.filter((t) => t && t.name && t.branch && t.briefPath && t.reportPath);
const malformed = rawTracks.length - tracks.length;
if (malformed > 0) {
  log(`${malformed} track(s) dropped — missing a required name/branch/briefPath/reportPath. They were NOT dispatched; the orchestrator must fix the args and re-run them.`);
}
if (tracks.length === 0) throw new Error("no dispatchable tracks — every track was missing a required field");
if (tracks.length === 1) {
  log("Single track in this wave. The skill routes 1-track waves to an inline Agent call; running it here anyway as handed over.");
}

/**
 * Build a track's dispatch prompt. Deliberately thin (SKILL §4): paths, not pasted task
 * text. Exact values — numbers, magic strings, signatures, test cases — live only in the
 * brief file.
 *
 * Opens with the MANDATORY base-sync because the harness pins a worktree's base commit at
 * process launch, so a worktree created later in the session is otherwise stuck on a stale
 * HEAD and cannot see the plan, the brief, or prior-wave merges. The branch is then cut
 * from that synced commit, which is what makes "cut from the source branch" true in fact
 * and not just in intent.
 */
function buildPrompt(track) {
  const lines = [];

  lines.push(
    `FIRST, before anything else, run \`git reset --hard ${integrationBranch}\` in your worktree, then \`git checkout -b ${track.branch}\`, then verify your brief file \`${track.briefPath}\` is present. A fresh worktree branch has no commits of its own, so this reset is non-destructive.`,
  );
  lines.push("");
  lines.push(`You are the ${track.name} subagent for this sprint.`);
  lines.push(`Model: ${track.model || "inherit (session model)"}`);
  lines.push(`Effort level: ${track.effort || "inherit"}`);
  lines.push(`Skill: ${track.skillId || "none"}`);
  lines.push(`Branch: ${track.branch}`);
  lines.push("");

  if (track.skillId) {
    // Skill injection: the subagent loads the skill ITSELF. The orchestrator never
    // invokes the Skill tool on its behalf — that would pull the skill's full
    // instructions into the orchestrator's context, which must stay thin.
    lines.push(
      `First action after the reset and branch creation: invoke the Skill tool with skill: \`${track.skillId}\` and follow its guidance for all work in this track.`,
    );
    lines.push("");
  }

  lines.push(
    `Read \`${track.briefPath}\` first — it is your requirements, with the exact values to use verbatim.`,
  );
  lines.push(`Plan file (reference only, do not read end to end): ${planPath}`);
  if (specPath) lines.push(`Spec file: ${specPath}`);
  if (track.contextLine) lines.push(`Where this track fits: ${track.contextLine}`);
  if (track.priorInterfaces) lines.push(`Interfaces and decisions from earlier waves: ${track.priorInterfaces}`);
  if (track.ambiguityNotes) lines.push(`Ambiguity already resolved for you: ${track.ambiguityNotes}`);
  lines.push("");

  lines.push("Task contract:");
  lines.push(
    "- TDD-first. For every implementation task: write the failing test, watch it fail, implement, watch it pass, commit. Follow the test-driven-development skill.",
  );
  lines.push(`- Commit your tasks atomically as you go, on \`${track.branch}\`.`);
  lines.push(
    "- Write the full report to `" +
      track.reportPath +
      "`. Do not print it back — your return value is the close handover only.",
  );
  lines.push(
    "- Write AND commit the track SUMMARY.md before returning. The worktree is force-removed on return; uncommitted work is lost.",
  );
  lines.push(
    "- Do NOT modify the state file, the roadmap file, or any calibration/metrics file. The orchestrator owns those writes.",
  );
  lines.push(
    `- Commit, report, return. Do NOT merge your branch, do NOT rebase onto \`${integrationBranch}\`, and do NOT delete your branch. The orchestrator merges every returned branch after this run — that is what keeps another track's in-flight work out of your tests. Report conflicts outside this track's context with affected files and a description; never resolve them unilaterally.`,
  );
  lines.push("");
  lines.push(
    `Return the close handover as JSON matching the required schema (track, branch, merged, tasks_completed, commits, summary_md, tests, conflicts_handed_off, notes_for_orchestrator, status). \`branch\` is \`${track.branch}\` and \`merged\` is false.`,
  );

  return lines.join("\n");
}

function buildOpts(track) {
  const opts = {
    label: `w${wave}/${track.name}`,
    phase: PHASE_TITLE,
    isolation: "worktree",
    schema: HANDOVER_SCHEMA,
  };
  // Omitted, never defaulted: an absent `model` means inherit the session model.
  if (track.model) opts.model = track.model;
  if (track.effort) opts.effort = track.effort;
  if (track.agentType) opts.agentType = track.agentType;
  return opts;
}

phase(PHASE_TITLE);
log(
  `sprint-execution [${sprintLabel}] wave ${wave} — ${tracks.length} track(s) from ${integrationBranch}, stagger=${stagger}: ${tracks.map((t) => t.name).join(", ")}`,
);

let results;
if (stagger && tracks.length > 1) {
  // PARTIAL mitigation only (see header): the first track runs alone to completion,
  // then the rest still provision concurrently with each other.
  log(`Stagger on — ${tracks[0].name} runs alone first, then the remaining ${tracks.length - 1}.`);
  const first = await agent(buildPrompt(tracks[0]), buildOpts(tracks[0]));
  const rest = await parallel(
    tracks.slice(1).map((t) => () => agent(buildPrompt(t), buildOpts(t))),
  );
  results = [first, ...rest];
} else {
  // `parallel()` never rejects; a failed thunk yields null. It is also the return barrier.
  results = await parallel(tracks.map((t) => () => agent(buildPrompt(t), buildOpts(t))));
}

tracks.forEach((t, i) => {
  if (!results[i]) {
    log(
      `${t.name}: NO HANDOVER RETURNED (agent died or was skipped). This is NOT a completed track — re-dispatch it BEFORE merging the wave. Branch ${t.branch} and its worktree may still exist with real commits; the report at ${t.reportPath} may be absent or partial.`,
    );
  }
});

const returned = results.filter(Boolean);
returned.forEach((r) => {
  log(
    `${r.track}: ${r.status} | branch ${r.branch} | tasks ${(r.tasks_completed || []).join(",") || "none"} | commits ${(r.commits || []).length} | SUMMARY.md ${r.summary_md} | tests ${r.tests} | conflicts ${r.conflicts_handed_off}`,
  );
  if (r.merged === true) {
    log(`${r.track} reported merged: true. Tracks must not merge — inspect ${r.branch} and ${integrationBranch} before trusting either.`);
  }
});

log(
  `Wave ${wave} barrier reached: ${returned.length}/${tracks.length} tracks returned. NOT MERGED — merging every branch into ${integrationBranch}, verifying \`git log ${integrationBranch}..<branch>\` is empty, removing worktrees, deleting branches, updating the state file / roadmap / ledger, and running review gates are the orchestrator's next actions (SKILL §6, §7). Wave ${wave + 1} is a separate run, after all of that.`,
);

// Returned to the orchestrator, which owns §6 (merge, verify, clean up, state, roadmap,
// ledger, metrics) and §7 (review gates). `merged: false` is stated, not implied: nothing
// in this script merges anything, and treating a returned wave as a merged wave is the
// failure this seam invites.
return {
  sprintLabel,
  integrationBranch,
  wave,
  merged: false,
  dispatched: tracks.map((t) => t.name),
  handovers: returned,
  // Every branch dispatched, including tracks that died — the merge and cleanup worklist.
  // A dead track's branch can still hold real commits, so it is never omitted here.
  branches: tracks.map((t) => ({ track: t.name, branch: t.branch })),
  // Named separately so a track that DIED is never mistaken for a track that returned
  // clean. Each needs a re-dispatch (SKILL §5) before the wave counts as done.
  tracksNeedingRedispatch: tracks
    .filter((t, i) => !results[i])
    .map((t) => ({ track: t.name, branch: t.branch, reason: "no handover returned" })),
  // Statuses the orchestrator must act on before advancing (SKILL §5).
  tracksNeedingAction: returned
    .filter((r) => r.status !== "DONE")
    .map((r) => ({ track: r.track, status: r.status, notes: r.notes_for_orchestrator })),
  conflicts: returned
    .filter((r) => r.conflicts_handed_off && r.conflicts_handed_off !== "none")
    .map((r) => ({ track: r.track, conflicts: r.conflicts_handed_off })),
};
