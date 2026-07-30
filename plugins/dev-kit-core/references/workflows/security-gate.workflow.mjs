/**
 * security-gate — the milestone security gate's per-phase audit fan-out.
 * =============================================================================
 * Owns ONE thing: dispatching one `security-auditor` per phase of the milestone, each
 * scoped to the threat model THAT PHASE DECLARED, and concatenating what they return into
 * the caller's merged threat-register inputs. Nothing else in the security gate lives here.
 *
 * Invoked by the pipeline's security-gate command (the `final` stage security gate, which
 * always runs) whenever the milestone has 2 or more phases. A single-phase milestone never
 * reaches here: the command makes one plain inline `security-auditor` call, because a
 * Workflow for one agent is pure overhead.
 *
 * -----------------------------------------------------------------------------
 * THE REST OF THE GATE — cso, THEN dependency-manager, BOTH OUTSIDE THIS SCRIPT
 * -----------------------------------------------------------------------------
 * This methodology used to live in the command body; it was moved here when that body was
 * compressed into a combined command. It is not optional background — it is the ordering
 * contract of the gate, and this script is only its first step.
 *
 * 1. THIS SCRIPT: one `security-auditor` per phase, all dispatched together, each scoped to
 *    the threat model its own phase declared rather than to the current change. The caller
 *    merges what they return into one threat register itself.
 *
 * 2. THEN the `cso` skill in `--diff` mode over this milestone's accumulated changes.
 *    cso runs ONLY ONCE EVERY AUDIT HAS RETURNED, AND NEVER BESIDE THEM — it needs the
 *    whole register to diff against, and the register does not exist until the last
 *    per-phase auditor has come back. Dispatching cso alongside the audits gives it a
 *    partial register, so its diff is against a register that is still being written. Open
 *    threats block the ship.
 *
 * 3. ONLY ONCE cso HAS FINISHED — never alongside it — the `dependency-manager` agent,
 *    escalating license questions to `license-engineer`. The reason is ordering, not
 *    politeness: dependency-manager REWRITES THE MANIFESTS AND LOCKFILES that cso just
 *    FINGERPRINTED. Run them together and cso's supply-chain fingerprint describes a tree
 *    that no longer exists on disk by the time it reports.
 *
 * cso and dependency-manager therefore run OUTSIDE this script, in that order, in the
 * caller's own turn after this returns. Do not move either of them into this fan-out, and
 * do not add either as a thunk beside the auditors: this script has exactly one phase, and
 * both of those steps are strictly downstream of its barrier.
 *
 * DO NOT ADD `security-reviewer` AS A PARALLEL PASS. That ban is about a redundant second
 * scanner over the same ground — `security-auditor` already loads
 * `skills/security-reviewer/SKILL.md` as its own methodology home, so a parallel
 * security-reviewer re-scans the identical files with the identical method and returns
 * findings the auditor is already returning, at double the cost, in a shape the register
 * merge then has to de-duplicate by hand. THE BAN IS NOT ABOUT THE PER-PHASE FAN-OUT. N
 * auditors running concurrently is the intended design here: they are not redundant with
 * each other, because each one is scoped to a DIFFERENT phase's declared threat model.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision arrived pre-made in `args`, and every decision downstream belongs to the
 * caller:
 *   - WHICH phases are in scope, and each phase's id / directory / threat-model path — the
 *     caller decided that when it read the milestone's phase list. This script never scans
 *     the milestone, never derives a phase list, never guesses a threat-model path.
 *   - WHETHER a returned threat register passes the gate — the caller decides. This script
 *     never says "passed" or "blocked"; it returns counts and lists.
 *   - REGISTER DEDUP — the caller's judgment, entirely. The merge below is a MECHANICAL
 *     CONCAT of the per-phase lists in dispatch order. Two phases reporting what looks like
 *     the same threat may be the same threat or two instances of one class in different
 *     code; deciding that requires reading both, which is a model's job, not a script's.
 *   - WHAT TO DO about an unaudited phase, an open threat, or a could-not-verify entry —
 *     the caller's, informed by the separately named lists this returns.
 *   - Running cso and then dependency-manager, in that order — the caller's, after this
 *     returns (see above).
 *   - Model/effort routing is decided caller-side by `model-route.mjs` and arrives as
 *     `args.routing` data — this script never picks a model or effort itself.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * milestone   string   REQUIRED. The milestone id/label being gated. Echoed into every
 *                      prompt and into the return value so the worklist is self-describing.
 * phases      array    REQUIRED. 2 or more entries; below 2 this throws (a 1-phase
 *                      milestone is an inline Agent call, not a Workflow). Each entry:
 *   phase.phaseId          string  REQUIRED. Phase id, e.g. "03-auth". Used as the label,
 *                                  as the coverage-gap identifier, and returned per phase.
 *   phase.phaseDir         string  REQUIRED. That phase's directory. The auditor's
 *                                  SECURITY.md is written under it — see NO WORKTREE below.
 *   phase.threatModelPath  string  REQUIRED. Path to the file holding THAT PHASE's declared
 *                                  threat model (the plan's `<threat_model>` register).
 *                                  Missing on any entry throws: an auditor dispatched
 *                                  without its phase's threat model falls back to a generic
 *                                  repo-wide scan, which is precisely the scoping this
 *                                  fan-out exists to prevent, and it would come back
 *                                  looking like a clean audit.
 *   phase.context          string[] optional. Extra paths this phase's auditor should read
 *                                  (SUMMARY.md, changed-file lists, compliance notes).
 *                                  Passed through verbatim.
 * agentType   string   optional. Subagent type to dispatch. Default "security-auditor".
 *                      See AGENT RESOLUTION below.
 * routing     object   optional. `{ 'security-auditor': {model?, effort?} }` — decided
 *                      caller-side by `plugins/dk/bin/model-route.mjs --batch` and
 *                      forwarded verbatim. A missing key or a missing `routing` arg leaves
 *                      `model`/`effort` absent entirely (inherit the session model), never
 *                      defaulted. This may itself be invoked as a child workflow by
 *                      `final-gate-lanes.workflow.mjs`, which forwards its own
 *                      `args.routing` down unchanged. See AGENT RESOLUTION below for why
 *                      the router's own per-agent floor for `security-auditor` still holds
 *                      regardless of what this script does with the key.
 *

 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read this before running
 * -----------------------------------------------------------------------------
 * Dispatch goes through `opts.agentType` so that `agents/security-auditor.md` stays the
 * single source of truth for audit methodology; the prompts built below carry ONLY that
 * agent's documented *inputs* and deliberately do not restate its procedure, its
 * disposition table, or its output contract. How a *plugin-namespaced* agent resolves by
 * type is install-dependent: the bare name "security-auditor" is the default here, and if
 * it does not resolve in a given install, pass the plugin-qualified form
 * `agentType: "dev-kit-core:security-auditor"`.
 *
 * MODEL/EFFORT ARE NEVER HARDCODED HERE. `security-auditor` is a never-downgrade-tier
 * agent: a cheaper model that misses a mitigation gap returns a CLOSED threat, which is a
 * false clean bill of health on a blocking gate. This script picks no model or effort of
 * its own — `args.routing['security-auditor']` (decided caller-side by `model-route.mjs`,
 * which itself honors the never-downgrade floor) is spread into the opts, and an absent
 * `routing` (or absent key) leaves `model`/`effort` absent entirely, i.e. "inherit the
 * session model" — never a value this script guesses or defaults.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used, and NONE of the 13 workflow scripts in
 * this pipeline set needs it — not one of their members commits concurrently. Here
 * specifically: every auditor treats implementation files as READ-ONLY (its own agent
 * contract forbids patching them) and writes exactly one file, its OWN phase's SECURITY.md,
 * under its OWN `phaseDir`. Distinct phase directories mean distinct output paths, so N
 * auditors running at once never touch the same file and there is nothing to isolate. A
 * worktree would additionally strand every SECURITY.md off the main tree, buying a merge
 * step for no benefit, on files the caller has to read immediately.
 *
 * -----------------------------------------------------------------------------
 * OPEN vs COULD-NOT-VERIFY — two lists, never one
 * -----------------------------------------------------------------------------
 * `security-auditor` classifies a threat as OPEN (a declared mitigation is provably absent),
 * COULD_NOT_VERIFY (the check was never actually completed — cited file missing, codebase
 * inaccessible, pattern too ambiguous), or CLOSED. This script keeps OPEN and
 * COULD_NOT_VERIFY as separate lists end to end. "Could not verify" NEVER collapses into
 * "closed": an unattempted check is unknown, and folding it into closed is how a gate
 * passes on a threat nobody ever looked at. It is kept out of "open" too, so nobody
 * remediates a phantom vulnerability.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { milestone, perPhase[], openThreats[] (flat), couldNotVerify[] (flat), unauditedPhases[] }
 * — the caller's worklist for building the one merged threat register, running cso, and then
 * dependency-manager. See the annotated return at the bottom of this file.
 *
 * -----------------------------------------------------------------------------
 * RUNTIME BOUNDS
 * -----------------------------------------------------------------------------
 * No `Date.now()`, no `Math.random()`, no filesystem or git access, no imports. `args`,
 * `agent`, `parallel`, `phase` and `log` are ambient globals; this is a top-level-await
 * module body, not an exported function.
 */

export const meta = {
  name: "security-gate",
  description:
    "Milestone security gate fan-out: one security-auditor per phase, each scoped to that phase's declared threat model, returning merged threat-register inputs.",
  whenToUse:
    "Called by the security gate for a milestone with 2 or more phases. A single-phase milestone is one inline security-auditor call instead — a Workflow for one agent is pure overhead. The cso --diff pass and then dependency-manager run in the caller's own turn AFTER this returns, in that order, never beside these audits.",
  phases: [
    {
      title: "Per-phase audit",
      detail: "one security-auditor per phase, scoped to its threat model, in parallel",
    },
  ],
};

const PHASE_TITLE = "Per-phase audit";

// Mirrors `agents/security-auditor.md`'s <structured_returns> field for field: the
// OPEN_THREATS template's `**Closed:** M/total | **Open:** K/total | **Could Not Verify:**
// J/total` counters, its Open table (Threat ID / Category / ... / Files Searched), its
// Could Not Verify table (Threat ID / ... / Blocking Reason), the accepted-risks log the
// SECURED/OPEN_THREATS templates both reference, and the `SECURITY.md: {path}` line.
// `couldNotVerifyThreats` is a SEPARATE array from `openThreats` on purpose — that agent's
// success criteria state a could-not-verify threat must never be folded into OPEN and never
// into CLOSED. `additionalProperties` is left open everywhere: a stray extra key from an
// auditor must not invalidate the whole result and cost us a phase's entire audit.
const PHASE_AUDIT_SCHEMA = {
  type: "object",
  required: ["phaseId", "securityMdPath", "threats", "openThreats", "couldNotVerifyThreats"],
  properties: {
    phaseId: {
      type: "string",
      description: "Phase id, verbatim from the dispatch prompt. Never re-derived.",
    },
    securityMdPath: {
      type: "string",
      description: "Path of the SECURITY.md this auditor wrote (the `SECURITY.md: {path}` line).",
    },
    threats: {
      type: "object",
      required: ["closed", "open", "couldNotVerify", "accepted"],
      properties: {
        closed: { type: "integer", minimum: 0, description: "Threats verified CLOSED." },
        open: {
          type: "integer",
          minimum: 0,
          description: "Threats whose declared mitigation is absent in implemented code (BLOCKER).",
        },
        couldNotVerify: {
          type: "integer",
          minimum: 0,
          description:
            "Threats where verification could not be attempted or completed. Never counted as closed, never counted as open.",
        },
        accepted: {
          type: "integer",
          minimum: 0,
          description: "Threats documented in the SECURITY.md accepted risks log.",
        },
      },
    },
    openThreats: {
      type: "array",
      description: "One entry per OPEN threat; empty array when none.",
      items: {
        type: "object",
        required: ["id", "title", "file"],
        properties: {
          id: { type: "string", description: "Threat register ID, or \"unregistered\"." },
          title: { type: "string", description: "One line on the threat." },
          file: { type: "string", description: "File (or file:line) the mitigation was expected in." },
        },
      },
    },
    couldNotVerifyThreats: {
      type: "array",
      description:
        "One entry per COULD_NOT_VERIFY threat; empty array when none. Kept apart from openThreats at every layer.",
      items: {
        type: "object",
        required: ["id", "title", "reason"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          reason: {
            type: "string",
            description:
              "The blocking reason: cited file missing / codebase inaccessible / pattern too ambiguous.",
          },
        },
      },
    },
  },
};

// ── Eager validation: throw BEFORE any phase() or dispatch ───────────────────────────
const { milestone, phases: rawPhases, agentType = "security-auditor" } = args;

if (!milestone) {
  throw new Error(
    "security-gate workflow: `milestone` arg is required — the milestone id being gated. It is echoed into every auditor prompt and into the returned worklist.",
  );
}
if (!Array.isArray(rawPhases)) {
  throw new Error(
    "security-gate workflow: `phases` arg is required and must be an array of { phaseId, phaseDir, threatModelPath }.",
  );
}
if (rawPhases.length < 2) {
  throw new Error(
    `security-gate workflow: needs 2 or more phases (got ${rawPhases.length}). A single-phase milestone is one plain inline security-auditor call, not a Workflow.`,
  );
}

// A phase missing its threat model is NOT droppable and NOT dispatchable. Dropping it would
// silently shrink the gate's coverage; dispatching it would hand the auditor no register,
// which its own contract turns into a generic repo-wide fallback scan — the exact opposite
// of the per-phase scoping this fan-out exists for, returned in the shape of a clean audit.
const malformed = rawPhases
  .map((p, i) => {
    if (!p || !p.phaseId) return `phases[${i}]: missing phaseId`;
    if (!p.phaseDir) return `phases[${i}] (${p.phaseId}): missing phaseDir`;
    if (!p.threatModelPath) return `phases[${i}] (${p.phaseId}): missing threatModelPath`;
    return null;
  })
  .filter(Boolean);
if (malformed.length > 0) {
  throw new Error(
    `security-gate workflow: ${malformed.length} phase entr(ies) are incomplete — ${malformed.join("; ")}. ` +
      "Every phase needs phaseId, phaseDir and threatModelPath: an auditor without its phase's declared threat model falls back to an unscoped scan and returns looking clean.",
  );
}

const phases = rawPhases;

// Mechanical path composition, not a decision: the auditor's own canonical location is
// PHASE/reviews/SECURITY.md, and passing it explicitly makes each output path visibly
// distinct per phase (see NO WORKTREE above).
function securityMdFor(p) {
  return `${p.phaseDir.replace(/\/+$/, "")}/reviews/SECURITY.md`;
}

// INPUTS ONLY — `agents/security-auditor.md` owns the method, the disposition table, the
// report template and the structured returns. None of that is restated here.
function buildPrompt(p) {
  const lines = [
    `Security-audit exactly one phase of milestone ${milestone}: phase ${p.phaseId}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    `- phaseId: ${p.phaseId}`,
    `- phase directory: ${p.phaseDir}`,
    `- threat model (THIS PHASE's declared register): ${p.threatModelPath}`,
    `- SECURITY.md to write (overrides your derived default): ${securityMdFor(p)}`,
  ];
  if (Array.isArray(p.context) && p.context.length > 0) {
    lines.push(`- context: ${p.context.join(", ")}`);
  }
  lines.push(
    "",
    // The whole point of the fan-out, stated to the agent so it cannot drift into a
    // change-scoped audit and quietly leave the phase's own register unverified.
    `Scope: audit against the threat model that phase ${p.phaseId} DECLARED — not against the current change, not against the milestone as a whole, and not against another phase's register. Verify every threat in ${p.threatModelPath} by its declared disposition.`,
    "",
    "Follow your own Procedure, report format and structured returns exactly, at full depth. " +
      "Keep OPEN and COULD_NOT_VERIFY strictly separate: a threat you could not actually verify is neither closed nor open — record it with its blocking reason. " +
      "Write only your own SECURITY.md; implementation files are read-only. " +
      "You are non-interactive: never wait for a user.",
    "",
    `Return JSON matching the required schema. \`phaseId\` is \`${p.phaseId}\` verbatim.`,
  );
  return lines.join("\n");
}

// Model/effort keys are OMITTED entirely, never set: omitted means inherit, and
// security-auditor is never-downgrade tier (see AGENT RESOLUTION above). agentType is
// always present because it has a documented default.
function buildOpts(p) {
  const opts = {
    ...(args.routing?.["security-auditor"] ?? {}),
    label: `security:${p.phaseId}`,
    phase: PHASE_TITLE,
    schema: PHASE_AUDIT_SCHEMA,
  };
  if (agentType) opts.agentType = agentType;
  return opts;
}

phase(PHASE_TITLE);
log(
  `security-gate [${milestone}]: dispatching ${phases.length} security-auditor(s), one per phase — ${phases
    .map((p) => p.phaseId)
    .join(", ")}. Each is scoped to its own phase's declared threat model. cso (--diff) runs AFTER this returns, then dependency-manager after cso.`,
);

// Thunks, never live promises. `parallel()` is the barrier and never rejects; a failed
// thunk yields null. That barrier is what makes "once every audit has returned" true for
// the caller's cso step.
const raw = await parallel(phases.map((p) => () => agent(buildPrompt(p), buildOpts(p))));

const audits = [];
const unauditedPhases = [];
raw.forEach((result, i) => {
  const p = phases[i];
  if (result) {
    audits.push({ phase: p, result });
    return;
  }
  // A dropped auditor is NOT a clean phase. Silence here would read as full coverage on a
  // blocking gate — the single most expensive way this script can fail.
  unauditedPhases.push({
    phaseId: p.phaseId,
    phaseDir: p.phaseDir,
    threatModelPath: p.threatModelPath,
    reason: "no result returned (agent failed, was skipped, or its output failed schema validation)",
  });
  log(
    `COVERAGE GAP: phase ${p.phaseId} was NOT audited — the security-auditor returned nothing (agent failed, was skipped, or its output failed schema validation). ` +
      `No threat in ${p.threatModelPath} has been verified, and ${securityMdFor(p)} may be absent or partial. ` +
      "The gate CANNOT PASS while a phase is unaudited: this phase's threats are neither closed nor open, they are unknown. " +
      `Re-run the audit for ${p.phaseId} BEFORE merging the register, and before running cso — cso diffs against the whole register and a missing phase makes that diff wrong too.`,
  );
});

if (audits.length === 0) {
  throw new Error(
    `security-gate workflow: every one of the ${phases.length} per-phase audits failed; there is no threat-register input to merge and nothing for cso to diff against.`,
  );
}

// MECHANICAL CONCAT ONLY. Per-phase lists are flattened in dispatch order with their phase
// stamped on, and that is all. No dedup, no cross-phase correlation, no severity re-ranking:
// deciding that phase 02's "missing rate limit on /login" and phase 05's are one register
// entry or two requires reading both audits, which is the caller's judgment (see ZERO
// JUDGMENT above), and collapsing them here would destroy the phase attribution the caller
// needs to route the fix.
const perPhase = audits.map(({ phase: p, result }) => ({
  phaseId: p.phaseId,
  phaseDir: p.phaseDir,
  threatModelPath: p.threatModelPath,
  securityMdPath: result.securityMdPath,
  threats: result.threats,
}));

const openThreats = audits.flatMap(({ phase: p, result }) =>
  (result.openThreats || []).map((t) => ({ phaseId: p.phaseId, ...t })),
);
const couldNotVerify = audits.flatMap(({ phase: p, result }) =>
  (result.couldNotVerifyThreats || []).map((t) => ({ phaseId: p.phaseId, ...t })),
);

for (const r of perPhase) {
  log(
    `${r.phaseId}: closed ${r.threats.closed} / open ${r.threats.open} / could-not-verify ${r.threats.couldNotVerify} / accepted ${r.threats.accepted} | ${r.securityMdPath}`,
  );
}
log(
  `Audit barrier reached: ${audits.length}/${phases.length} phases audited, ${unauditedPhases.length} unaudited, ` +
    `${openThreats.length} open threat(s), ${couldNotVerify.length} could-not-verify threat(s). ` +
    "Merging these into one threat register (with any dedup) is the caller's next action, then the cso skill in --diff mode over this milestone's accumulated changes — once every audit has returned, never beside them — and only once cso has finished, dependency-manager (escalating license questions to license-engineer).",
);

// The caller's worklist. Echoes enough input to be self-describing, and keeps every failure
// mode in its own named list: a phase that DIED (unauditedPhases) must never merge with a
// threat an auditor reported it COULD NOT VERIFY (couldNotVerify), which in turn must never
// merge with a threat it verified as OPEN.
return {
  // Echoed so the register and the downstream cso/dependency-manager steps never have to
  // re-derive which milestone this gate ran over.
  milestone,
  // Per-phase roll-up, one entry per audit that came back: paths + the four counters. The
  // SECURITY.md files on disk are the durable artifact; this is the index into them.
  perPhase,
  // Flat, register-ready list of every OPEN threat across phases, phase-stamped, in dispatch
  // order. Concatenated only — NOT deduped. These are the BLOCKERs.
  openThreats,
  // Flat list of every COULD_NOT_VERIFY threat, phase-stamped. Deliberately a SEPARATE field
  // from openThreats: these checks were never completed, so they are unknown, not confirmed
  // vulnerabilities — and they are emphatically not closed. A nonempty list here means the
  // register is incomplete even if openThreats is empty.
  couldNotVerify,
  // Phases whose auditor returned nothing at all. Distinct from both lists above: nothing
  // about these phases is known, not even a could-not-verify reason. The gate cannot pass
  // while this is nonempty; re-run these audits before merging the register.
  unauditedPhases,
};
