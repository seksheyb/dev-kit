/**
 * bugfix-wave — full multi-wave, self-merging bug-fix run.
 *
 * Invoked by `skills/bugfix-wave/SKILL.md` Phase 2 whenever the wave plan contains 2 or
 * more tracks. One track = one subagent = one git worktree = one branch cut from the
 * source branch.
 *
 * THIS SCRIPT CONTAINS ZERO JUDGMENT. Classification (§1.2), track grouping (§1.3), wave
 * ordering (§1.4) and prompt rendering (§2.3) all happen in the orchestrator's turn before
 * the call; `args` is that output verbatim. The script only does control flow: fan out a
 * wave, wait for it, fan out the next.
 *
 * ── WHY ALL WAVES RUN HERE, unlike sprint-execution ─────────────────────────────────
 * Tracks MERGE THEMSELVES into the source branch (SKILL §2.3 merge protocol). That is what
 * makes multi-wave-in-one-run correct: by the time wave N+1's tracks run their opening
 * `git reset --hard <sourceBranch>`, wave N's fixes are already on that branch, so a
 * wave-N+1 track deferred for a file conflict sees the wave-N edit to that file.
 *
 * This is a DELIBERATE divergence from `sprint-execution`, which is orchestrator-merged and
 * one-wave-per-run. The reason they split: bugfix-wave writes no state file, roadmap or
 * ledger (its only durable artifact, fixes.json, is emitted after the FINAL wave anyway),
 * so it has nothing per-wave to defer to an orchestrator turn — and running whole rounds
 * unattended is the point, since it composes with adversarial review inside one workflow.
 *
 * ── TWO GIT PRECONDITIONS, BOTH VERIFIED ────────────────────────────────────────────
 * 1. The orchestrator MUST NOT hold `sourceBranch` checked out while this runs. Git allows
 *    one checkout per branch, so a track pushing into a checked-out branch is rejected with
 *    "branch is currently checked out" — this is git declining, not agent flakiness, and it
 *    is the actual cause of the old "subagents sometimes merge to the wrong branch" note.
 *    SKILL Phase 2 has the orchestrator `git checkout --detach` first, which frees the ref.
 * 2. Concurrent tracks race on the ref. The second pusher gets a non-fast-forward
 *    rejection, so the §2.3 protocol has each track fetch + merge + retry. Tracks that
 *    exhaust their retries leave the branch unmerged and report it; Phase 3 catches them.
 *
 * MERGE FAILURE IS THEREFORE EXPECTED, NOT EXCEPTIONAL. `branches` is returned for exactly
 * that reason: it is the Phase 3 reconciliation worklist. The script has no filesystem or
 * git access, so worktree cleanup, branch deletion, reconciling unmerged branches and
 * `fixes.json` (Phase 4) all run in the orchestrator's turn after this returns — including
 * when the workflow dies mid-run.
 *
 * ── args contract ────────────────────────────────────────────────────────────────────
 * {
 *   context: string                  optional. Short label for the run ("round 3 findings").
 *                                    Log lines only; never sent to an agent.
 *   sourceBranch: string             REQUIRED. The branch every track cuts from and merges
 *                                    back into — `main`, or the round/sprint working
 *                                    branch. Never hardcoded to `main`. The value must
 *                                    already be embedded in every rendered prompt; it is
 *                                    passed here for logging and for the return value.
 *   waves: [                         REQUIRED. Ordered; index 0 dispatches first.
 *     {
 *       wave: number                 optional. 1-based wave number; defaults to index+1.
 *                                    Only used to pick the phase label.
 *       tracks: [                    REQUIRED, non-empty.
 *         {
 *           name:   string           REQUIRED. Track name, e.g. "track-schema". Used as
 *                                    the agent label in the progress display.
 *           branch: string           REQUIRED. Full branch name the prompt tells the
 *                                    subagent to create, e.g. "bugfix/w1-track-schema".
 *                                    Echoed back for Phase 3 reconciliation.
 *           model:  "haiku" | "sonnet" | "opus"            REQUIRED (SKILL §1.2 / §1.3).
 *           effort: "low" | "medium" | "high"              REQUIRED (SKILL §1.2).
 *                   | "xhigh" | "max"
 *           prompt: string           REQUIRED. The fully-rendered SKILL §2.3 subagent
 *                                    prompt — self-contained, base-sync opener, boundaries,
 *                                    merge protocol, close handover block. Passed through
 *                                    untouched; the script writes no prompt text of its
 *                                    own, so anything missing from the rendered template is
 *                                    missing from the dispatch.
 *           agentType: string        optional. Defaults to the session default.
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Returns: { context, sourceBranch, waves[], handovers[], dropped[], branches[],
 * unmerged[] } — see the bottom of this file. `handovers` feeds Phase 4 aggregation;
 * `unmerged` and `branches` feed Phase 3.
 *
 * MODEL/EFFORT ROUTING — SURFACE C (plan-driven track). Per-track `model`/`effort` above are
 * declared by the Phase 1 classification/plan and are AUTHORITATIVE at dispatch time — there
 * is no second router call here (model-routing.md §7 Surface C). `args.routing?.['bugfix-track']`
 * (optional `{model, effort}`, itself decided caller-side by `plugins/dk/bin/model-route.mjs`)
 * is spread in only as the FALLBACK arm, before the track-declared `model`/`effort`, so a track
 * that omits either value inherits the router's computed one instead of this script guessing.
 */

export const meta = {
  name: 'bugfix-wave',
  description:
    'Dispatches pre-classified bug-fix tracks wave by wave in one run. Every track in a wave runs concurrently in its own git worktree, merges itself back into the source branch, and returns; wave N+1 does not start until every wave-N track has returned.',
  whenToUse:
    'Called by the bugfix-wave skill once Phase 1 has produced a wave/track plan with 2 or more tracks. A single-track wave plan is dispatched inline with a plain Agent call instead. Runs whole rounds unattended, so it composes with an adversarial review loop in one workflow.',
  // Static literal, as required — but wave count is data-driven. Waves 1-3 get their own
  // group; anything beyond collapses into "Wave 4+" (SKILL §1.4: 4+ waves means the
  // dependency analysis is over-sequenced, so the collapsed bucket should stay empty).
  phases: [
    { title: 'Wave 1', detail: 'tracks with no dependencies on other bugs' },
    { title: 'Wave 2', detail: 'tracks depending on wave 1 fixes or deferred for file conflicts' },
    { title: 'Wave 3', detail: 'tracks depending on wave 2' },
    { title: 'Wave 4+', detail: 'further waves, collapsed into one group' },
  ],
}

const PHASE_TITLES = ['Wave 1', 'Wave 2', 'Wave 3', 'Wave 4+']
const phaseTitleFor = (waveNumber) =>
  waveNumber >= 1 && waveNumber <= 3 ? PHASE_TITLES[waveNumber - 1] : PHASE_TITLES[3]

// Mirrors the "Close handover (required)" block in SKILL §2.3 field for field, and is the
// exact input Phase 4.1 aggregates into fixes.json. `merged: yes | no` in the prose block
// is `merged: boolean` here. `additionalProperties` is deliberately left open: a stray
// extra key from an agent must not invalidate the whole handover and cost us the track.
const CLOSE_HANDOVER_SCHEMA = {
  type: 'object',
  required: ['track', 'branch', 'merged', 'classes_fixed', 'unresolved', 'conflicts_handed_off'],
  properties: {
    track: { type: 'string', description: 'track name, verbatim from the prompt' },
    branch: { type: 'string', description: 'branch the work was committed to' },
    merged: {
      type: 'boolean',
      description:
        'true only if `git push . HEAD:<sourceBranch>` actually succeeded. A track that hit "branch is currently checked out", exhausted its retries, or aborted on another track\'s file reports false — that is an expected outcome, not a failure to hide.',
    },
    merge_note: {
      type: 'string',
      description: 'when merged is false, the one-line reason (rejection text or abort cause). Empty or omitted when merged is true.',
    },
    classes_fixed: {
      type: 'array',
      description: 'one entry per bug (Mode 1) or defect class (Mode 2) actually fixed',
      items: {
        type: 'object',
        required: ['class', 'instances_touched', 'files', 'regression_guard'],
        properties: {
          class: { type: 'string', description: 'verbatim class name from findings.json, or the bug ID + summary in Mode 1' },
          instances_touched: { type: 'integer', minimum: 0, description: 'number of instances of the class fixed' },
          files: { type: 'array', items: { type: 'string' }, description: 'every file modified for this class' },
          regression_guard: { type: 'string', description: 'file + rule/test name + one line. A mechanical guard — pure documentation does not count (SKILL §1.5).' },
        },
      },
    },
    unresolved: {
      type: 'array',
      description: 'classes that could not be fixed structurally; empty array if none',
      items: {
        type: 'object',
        required: ['class', 'rationale'],
        properties: {
          class: { type: 'string' },
          rationale: { type: 'string', description: 'one line on why it could not be fixed' },
        },
      },
    },
    conflicts_handed_off: {
      type: 'array',
      description: "conflicts in files this track does not own, left for the orchestrator; empty array if none",
      items: {
        type: 'object',
        required: ['file', 'description'],
        properties: {
          file: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
}

const context = typeof args.context === 'string' ? args.context : ''
const sourceBranch = args.sourceBranch
const waves = Array.isArray(args.waves) ? args.waves : []

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (!sourceBranch) {
  throw new Error(
    'args.sourceBranch is required — the branch tracks cut from and merge back into. Never hardcode `main`; pass the round/sprint working branch when that is the base.',
  )
}
if (waves.length === 0) throw new Error('args.waves must be a non-empty array — check the Phase 1 output')

const waveReports = []
const allHandovers = []
const allDropped = []
const allBranches = []

log(`bugfix-wave${context ? ` [${context}]` : ''}: ${waves.length} wave(s), source branch ${sourceBranch}. Tracks self-merge; the orchestrator must NOT be holding ${sourceBranch} checked out (SKILL Phase 2 detaches it first).`)

// Waves are a hard barrier, not a preference. A wave-N+1 track either depends on a
// wave-N fix or was pushed later precisely because it would have collided on a file with
// a wave-N track — starting it early reintroduces the conflict the partition removed.
// `parallel()` resolves only when every thunk has settled, so the loop boundary IS the
// gate. Never flatten these into one parallel() call.
for (let i = 0; i < waves.length; i++) {
  const waveEntry = waves[i] || {}
  const waveNumber = typeof waveEntry.wave === 'number' ? waveEntry.wave : i + 1
  const title = phaseTitleFor(waveNumber)
  const tracks = Array.isArray(waveEntry.tracks) ? waveEntry.tracks : []

  phase(title)

  if (tracks.length === 0) {
    log(`Wave ${waveNumber}: no tracks — skipped.`)
    waveReports.push({ wave: waveNumber, phase: title, dispatched: 0, tracks: [], dropped: [] })
    continue
  }

  const malformed = tracks.filter((t) => !t || !t.name || !t.branch || !t.prompt)
  if (malformed.length > 0) {
    throw new Error(
      `Wave ${waveNumber}: ${malformed.length} track(s) missing a required name, branch, or prompt — every field is rendered in the orchestrator's turn before this call`,
    )
  }

  log(`Wave ${waveNumber}: dispatching ${tracks.length} track(s) — ${tracks.map((t) => t.name).join(', ')}`)
  for (const track of tracks) allBranches.push({ wave: waveNumber, track: track.name, branch: track.branch })

  // Surface C fallback arm only — the track-declared model/effort (from Phase 1's
  // classification/plan) are authoritative and win whenever present. The routing entry is
  // spread FIRST, and the track-declared keys are assigned CONDITIONALLY on top: assigning
  // them unconditionally would write `model: undefined` over a routed value for exactly the
  // tracks the fallback exists to serve (a track whose upstream finding declared nothing),
  // which is the opposite of what the header promises. Same conditional rule for `agentType`
  // — omitted, never defaulted; an absent `model` means inherit the session model.
  const buildOpts = (track) => {
    const opts = {
      ...(args.routing?.['bugfix-track'] ?? {}),
      label: track.name,
      phase: title,
      isolation: 'worktree',
      schema: CLOSE_HANDOVER_SCHEMA,
    }
    if (track.model) opts.model = track.model
    if (track.effort) opts.effort = track.effort
    if (track.agentType) opts.agentType = track.agentType
    return opts
  }

  // isolation: 'worktree' because every track commits to its own branch concurrently.
  // Costs ~200-500ms + disk per track; it is the whole point here, not an optimization.
  const raw = await parallel(
    tracks.map((track) => () => agent(track.prompt, buildOpts(track)))
  )

  const kept = raw
    .map((handover, j) =>
      handover ? { track: tracks[j].name, branch: tracks[j].branch, wave: waveNumber, handover } : null
    )
    .filter(Boolean)

  const dropped = raw
    .map((handover, j) =>
      handover ? null : { track: tracks[j].name, branch: tracks[j].branch, wave: waveNumber }
    )
    .filter(Boolean)

  // A dropped track is NOT a clean track. Silence here would read as full coverage.
  for (const d of dropped) {
    log(
      `Wave ${waveNumber}: track ${d.track} returned no handover (agent failed, was skipped, or its output failed schema validation). Branch ${d.branch} and its worktree may still exist with real commits, merged or not — inspect and reconcile in Phase 3, and treat its bugs as UNFIXED.`
    )
  }

  // Unmerged tracks are expected under a self-merge design: the ref races, and a track that
  // loses every retry correctly gives up rather than forcing. Surfacing them per wave
  // matters more than at the end, because wave N+1 cuts from a source branch that is now
  // missing this track's fixes — a wave-N+1 track deferred for a file conflict with THIS
  // track will not see its edit.
  const unmergedThisWave = kept.filter((k) => k.handover.merged !== true)
  for (const u of unmergedThisWave) {
    log(
      `Wave ${waveNumber}: track ${u.track} did NOT merge (${u.handover.merge_note || 'no reason given'}). Branch ${u.branch} holds real commits that are NOT on ${sourceBranch}. Later waves will not see them.`
    )
  }
  if (unmergedThisWave.length > 0 && i < waves.length - 1) {
    log(
      `Wave ${waveNumber}: ${unmergedThisWave.length} unmerged branch(es) before wave ${waveNumber + 1} dispatches. If a later track was deferred for a file conflict with one of these, its fix will be built on a stale version of that file — check this first in Phase 3.`
    )
  }

  for (const k of kept) allHandovers.push(k)
  for (const d of dropped) allDropped.push(d)

  waveReports.push({
    wave: waveNumber,
    phase: title,
    dispatched: tracks.length,
    tracks: kept,
    dropped,
    unmerged: unmergedThisWave.map((u) => ({ track: u.track, branch: u.branch, reason: u.handover.merge_note || '' })),
  })

  log(
    `Wave ${waveNumber}: ${kept.length}/${tracks.length} tracks returned a handover, ${kept.length - unmergedThisWave.length} merged into ${sourceBranch}.`
  )
}

const unmerged = allHandovers
  .filter((h) => h.handover.merged !== true)
  .map((h) => ({ wave: h.wave, track: h.track, branch: h.branch, reason: h.handover.merge_note || '' }))

const classCount = allHandovers.reduce(
  (n, k) => n + (Array.isArray(k.handover.classes_fixed) ? k.handover.classes_fixed.length : 0),
  0
)
const unresolvedCount = allHandovers.reduce(
  (n, k) => n + (Array.isArray(k.handover.unresolved) ? k.handover.unresolved.length : 0),
  0
)
log(
  `Done: ${allHandovers.length} track handover(s) across ${waveReports.length} wave(s), ${allDropped.length} dropped, ${unmerged.length} unmerged, ${classCount} class(es) fixed, ${unresolvedCount} unresolved. Phase 3 (reconcile unmerged branches, remove worktrees, delete branches) and Phase 4 (fixes.json) are the orchestrator's next actions — and the orchestrator still holds a detached HEAD until it re-checks-out ${sourceBranch}.`
)

return {
  context,
  // Echoed so the Phase 3 worklist is self-describing and never has to be re-derived.
  sourceBranch,
  waves: waveReports,
  // Flat, Phase-4-ready list of every close handover that came back.
  handovers: allHandovers,
  // Tracks with no handover. Their bugs are unfixed until proven otherwise, and their
  // branches may hold merged OR unmerged commits — Phase 3 must look, not assume.
  dropped: allDropped,
  // Tracks that returned but did not land on the source branch. Expected, not exceptional:
  // the ref races. This is the Phase 3 merge worklist.
  unmerged,
  // Every branch dispatched, in wave order — the Phase 3 reconciliation + worktree cleanup
  // worklist. Dropped and merged tracks are in here too, on purpose.
  branches: allBranches,
}
