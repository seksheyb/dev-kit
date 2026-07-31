/**
 * cso-verify — independent parallel verification of candidate security findings.
 *
 * Invoked by `skills/cso/SKILL.md` Phase 12 ("Parallel verification") whenever that phase
 * has 2 or more candidate findings left after the hard-exclusion list and precedents have
 * already been applied. One candidate finding = one fresh-context subagent = one 1-10
 * confidence score against the FP rules. A single candidate is dispatched inline with a
 * plain `Agent` call instead — a Workflow for one agent is pure overhead, and this script
 * throws rather than accept a 1-item `findings` array.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * findings       array   REQUIRED, 2 or more entries. Each candidate finding still
 *                         standing after Phase 12's hard exclusions:
 *   finding.id         string  REQUIRED. Stable identifier, e.g. "F3" or a fingerprint.
 *                                Used to match a subagent's response back to its finding
 *                                and to key the three returned buckets.
 *   finding.title      string  REQUIRED. Echoed back in the return value only — never
 *                                sent to the verifier subagent (see PROMPT STRATEGY below).
 *   finding.file       string  REQUIRED. Sent to the verifier verbatim.
 *   finding.line       number|string  REQUIRED. Sent to the verifier verbatim.
 *   finding.category   string  REQUIRED. Echoed back only, same as title.
 *   finding.severity   string  REQUIRED. Echoed back only, same as title.
 * fpRules        string  REQUIRED. The Phase 12 false-positive-rules text, already
 *                         extracted and rendered by the skill (hard exclusions +
 *                         precedents, verbatim). This script never writes, edits, or
 *                         summarizes that text — see PROMPT STRATEGY below.
 * gateThreshold  number  REQUIRED. The mode's mechanical confidence gate — 8 for daily
 *                         mode, 2 for comprehensive mode (SKILL Phase 12). The mode ->
 *                         threshold mapping is the skill's decision; it arrives here
 *                         already made. This script never inspects a "mode" string.
 * agentType      string  optional. Named agent type override for the verifier roster.
 *                         Default: omitted (inherit the session's default agent). See
 *                         AGENT RESOLUTION below.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every judgment call a reader might look for in this file was made by the caller
 * (`skills/cso/SKILL.md` Phase 12), before this script ever runs:
 *   - WHICH findings are even candidates: Phase 12's hard-exclusion list and precedents
 *     already ran over the full findings set. `findings` here is only what survived that.
 *   - THE FP RULES THEMSELVES: `fpRules` is the skill's rendered Phase 12 text, passed
 *     through untouched. This script does not know what a "hard exclusion" or a
 *     "precedent" is — it only relays the string.
 *   - THE GATE NUMBER: `gateThreshold` (8 daily / 2 comprehensive) is the skill's
 *     mode-to-threshold mapping, arriving pre-made. This script does not know what "daily"
 *     or "comprehensive" mode means.
 *   - WHAT COUNTS AS A REAL FINDING: each verifier subagent independently scores its one
 *     finding 1-10 against the FP rules — this script never re-scores, adjusts, or
 *     second-guesses a returned score. Gating (score >= gateThreshold) is the only
 *     arithmetic this script performs on a score.
 * The Gate phase below is deliberately pure JS with no model call: `verified = score >=
 * gateThreshold`, `discarded` = the rest. There is nothing left to judge once N independent
 * scores exist — a synthesis agent here would only restate the numbers.
 *
 * -----------------------------------------------------------------------------
 * PROMPT STRATEGY 3 — the FP rules are pre-rendered skill text; the per-finding frame is
 * thin scaffolding this script builds
 * -----------------------------------------------------------------------------
 * `fpRules` is injected into every dispatch prompt verbatim — the skill owns that text,
 * this script does not paraphrase, reorder, or trim it. Everything WRAPPED around it is
 * thin scaffolding: `file:line` plus the instruction to score 1-10 independently.
 *
 * Deliberately NOT sent to the verifier: `title`, `category`, `severity`, or any other
 * characterization of what the original candidate finding claims to be. This is the
 * fresh-context requirement from SKILL Phase 12 in code: a verifier told "this is a CRITICAL
 * SQL injection, please confirm" is no longer independent — it is anchored on the original
 * scorer's framing, which is exactly the blind spot independent verification exists to
 * catch. The verifier gets only the code location and the rules, reads the code itself, and
 * scores what it independently finds there.
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used. Every verifier subagent reads exactly
 * one file:line read-only and returns a JSON score — no member writes, commits, or mutates
 * anything, and no two verifiers ever touch the same finding. There is no concurrent
 * mutation to isolate, and a worktree would only buy provisioning latency for no benefit.
 *
 * -----------------------------------------------------------------------------
 * COVERAGE GAP DISCIPLINE — the three-bucket return, and why a dropped verifier is its own
 * bucket
 * -----------------------------------------------------------------------------
 * A finding can end this run in exactly one of three states, and they must never blur:
 *   - verified:   an independent verifier scored it >= gateThreshold.
 *   - discarded:  an independent verifier scored it < gateThreshold.
 *   - unverified: its verifier subagent returned nothing at all (died, was skipped, or
 *                 failed schema validation). This is NOT the same as a low score — nobody
 *                 scored it. It goes to `unverified`, NEVER to `discarded` (that would
 *                 silently clear a finding nobody actually cleared) and NEVER to `verified`
 *                 (that would silently promote a finding nobody actually confirmed).
 * Every `unverified` entry gets a loud "COVERAGE GAP:" log line naming the finding and
 * telling the caller exactly what to do: apply the skill's own SELF-VERIFIED fallback (the
 * same-context re-read with a skeptic's eye) in its own turn, and mark that finding's
 * Status as SELF-VERIFIED, not VERIFIED, in Phase 13/14 output. This script cannot perform
 * that fallback itself — it has no model turn of its own once `agent()` returns null, and
 * doing the re-read here would share exactly the reasoning blind spot the fresh-context
 * requirement exists to avoid.
 * If EVERY verifier is dropped, this script throws: a 0%-coverage "verification" pass is
 * not a degraded result, it is no result, and returning three empty buckets would let a
 * caller mistake total dispatch failure for "we checked, nothing survived."
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read this before passing `args.agentType`
 * -----------------------------------------------------------------------------
 * The roster dispatches with `agentType` OMITTED by default — not defaulted to a named
 * type like "security-reviewer" — so every verifier inherits the session's default agent.
 * Scoring here feeds a security confidence gate; silently downgrading to a narrower or
 * cheaper agent type by default is exactly the kind of judgment call this script must not
 * make on its own. If the caller passes `args.agentType`, it is used as-is; if the bare
 * name does not resolve in a given install, pass the plugin-qualified form instead, e.g.
 * `"dev-kit-core:security-reviewer"`.
 *
 * -----------------------------------------------------------------------------
 * Returns: { gateThreshold, verified[], discarded[], unverified[] } — see the bottom of
 * this file. Every returned entry echoes its finding's id/title/file/line/category/severity
 * so the caller never has to re-join against the original `findings` array.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['finding-verifier']` (optional `{model,
 * effort}`) is spread into every verifier's opts; an absent `routing` or an absent
 * `finding-verifier` entry leaves both keys absent, which means inherit — never a guessed
 * default.
 */

export const meta = {
  name: "cso-verify",
  description:
    "Independent parallel verification of candidate security findings: one fresh-context subagent per finding scores it 1-10 against the FP rules; the script applies the mode's mechanical confidence gate. Findings whose verifier dropped are returned unverified — the skill's SELF-VERIFIED fallback covers them.",
  whenToUse:
    "2 or more candidates -> this workflow. Exactly 1 candidate -> a plain inline Agent call, not a Workflow. Workflow unavailable entirely -> the skill's own SELF-VERIFIED same-context re-read (SKILL Phase 12), never a substitute reachable from inside this script.",
  phases: [
    { title: "Verify", detail: "one independent scorer per candidate finding, fresh context, in parallel" },
    { title: "Gate", detail: "mechanical filter: keep score >= gate, discard below" },
  ],
};

// Mirrors this script's own dispatch contract field for field — not a source agent .md,
// since the verifier roster has no dedicated agent file (it runs as the session's default
// agent, or `args.agentType` if the caller overrides it; see AGENT RESOLUTION above). The
// four fields are exactly what SKILL Phase 12's "independently score 1-10" verification
// step needs back: which finding, what score, why, and the quoted evidence that grounds it
// (mirroring Phase 13's own pre-emit verification gate, which requires a quoted line).
const VERIFIER_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: true,
  required: ["findingId", "score", "reasoning", "evidenceQuoted"],
  properties: {
    findingId: { type: "string", description: "Echoes the finding id given in the dispatch prompt." },
    score: {
      type: "integer",
      minimum: 1,
      maximum: 10,
      description:
        "Independent 1-10 confidence score against the FP rules given in the prompt. 9-10 = certain exploit path (could write a PoC); 8 = clear vulnerability pattern with known exploitation methods; below 8 = weak or noise.",
    },
    reasoning: { type: "string", description: "Why this score — including which FP rule, if any, applied." },
    evidenceQuoted: {
      type: "string",
      description: "The exact code quoted from file:line that the score is grounded in.",
    },
  },
};

// -----------------------------------------------------------------------------
// Eager arg validation — before any phase()/dispatch.
// -----------------------------------------------------------------------------
const { findings, fpRules, gateThreshold, agentType } = args;

if (!Array.isArray(findings) || findings.length < 2) {
  throw new Error(
    `cso-verify workflow: \`findings\` must be an array of 2 or more candidate findings (got ${
      Array.isArray(findings) ? findings.length : typeof findings
    }). A single candidate is a plain inline Agent call, not a Workflow.`,
  );
}

const REQUIRED_FINDING_FIELDS = ["id", "title", "file", "line", "category", "severity"];
const malformed = findings
  .map((f, i) => ({ i, f }))
  .filter(({ f }) => !f || REQUIRED_FINDING_FIELDS.some((k) => f[k] === undefined || f[k] === null || f[k] === ""));
if (malformed.length > 0) {
  throw new Error(
    `cso-verify workflow: ${malformed.length} finding(s) missing a required field (${REQUIRED_FINDING_FIELDS.join(
      ", ",
    )}) — indices: ${malformed.map((m) => m.i).join(", ")}. Fix the Phase 12 candidate list before dispatching.`,
  );
}

const ids = findings.map((f) => String(f.id));
const dupeIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupeIds.length > 0) {
  throw new Error(
    `cso-verify workflow: duplicate finding id(s) — ${[...new Set(dupeIds)].join(", ")}. Every finding.id must be unique so a verifier's response can be matched back unambiguously.`,
  );
}

if (typeof fpRules !== "string" || fpRules.trim() === "") {
  throw new Error(
    "cso-verify workflow: `fpRules` is required and must be the non-empty Phase 12 false-positive-rules text, pre-rendered by the skill.",
  );
}

if (typeof gateThreshold !== "number" || !Number.isFinite(gateThreshold)) {
  throw new Error(
    "cso-verify workflow: `gateThreshold` is required and must be a number — 8 for daily mode, 2 for comprehensive mode (the skill's mode-to-threshold mapping, made before this call).",
  );
}

// -----------------------------------------------------------------------------
// Verify — inputs only. `finding.title`/`category`/`severity` are deliberately withheld
// from the prompt; see PROMPT STRATEGY 3 above.
// -----------------------------------------------------------------------------
function buildPrompt(finding) {
  return [
    "You are an independent security-finding verifier running with fresh context. You have " +
      "NO other context than what is given below — do not assume anything about why this " +
      "location was flagged, what category of issue it might be, or how severe it might be.",
    "",
    `Location: ${finding.file}:${finding.line}`,
    `Finding id (echo this back verbatim): ${finding.id}`,
    "",
    "False-positive rules to apply (verbatim from the audit's Phase 12 filter):",
    fpRules,
    "",
    "Read the code at this location yourself. Score 1-10 independently: 9-10 = certain " +
      "exploit path you could write a PoC for, 8 = clear vulnerability pattern with known " +
      "exploitation methods, below 8 = weak pattern match or noise. Apply the false-positive " +
      "rules above — if a hard-exclusion rule or precedent matches, score it low regardless " +
      "of how it looks at first read.",
    "",
    "Quote the exact code you are scoring in `evidenceQuoted` — if you cannot quote a " +
      "specific line, that alone caps your score at 4-5. Return JSON only, matching the " +
      "required schema: findingId, score (integer 1-10), reasoning, evidenceQuoted.",
  ].join("\n");
}

function buildOpts(finding) {
  const opts = {
    // model/effort are decided caller-side by model-route.mjs and arrive as
    // args.routing?.['finding-verifier'] — spread first so the always-set keys below win,
    // and so an absent routing entry still leaves both keys absent (inherit), never a
    // guessed default.
    ...(args.routing?.["finding-verifier"] ?? {}),
    label: `verify:${finding.id}`,
    phase: "Verify",
    schema: VERIFIER_RESULT_SCHEMA,
  };
  // Omitted, never defaulted: an absent `agentType` means inherit the session default.
  // Never silently downgrade a verifier feeding a security confidence gate.
  if (agentType) opts.agentType = agentType;
  return opts;
}

phase("Verify");
log(
  `cso-verify: ${findings.length} candidate finding(s), gate ${gateThreshold}, one independent fresh-context scorer each, in parallel.`,
);

// Thunk layer — parallel() is a barrier and never rejects; a failed thunk yields null.
const raw = await parallel(findings.map((finding) => () => agent(buildPrompt(finding), buildOpts(finding))));

phase("Gate");

const verified = [];
const discarded = [];
const unverified = [];

findings.forEach((finding, i) => {
  const result = raw[i];
  const base = {
    id: finding.id,
    title: finding.title,
    file: finding.file,
    line: finding.line,
    category: finding.category,
    severity: finding.severity,
  };

  if (!result) {
    // A dropped verifier is neither confirmed nor cleared — it must never merge with
    // either the `verified` or the `discarded` bucket.
    log(
      `COVERAGE GAP: finding ${finding.id} (${finding.file}:${finding.line}) was not ` +
        "independently scored — its verifier subagent returned nothing (died, was skipped, " +
        "or failed schema validation). It is neither confirmed nor cleared; apply the " +
        "SELF-VERIFIED fallback in your turn (re-read the code yourself with a skeptic's " +
        "eye, per SKILL Phase 12) and mark its Status as SELF-VERIFIED, not VERIFIED, in " +
        "Phase 13/14 output.",
    );
    unverified.push({ ...base, reason: "verifier subagent returned no result" });
    return;
  }

  // Mechanical gate only — no re-scoring, no adjustment, no second-guessing.
  const scored = { ...base, score: result.score, reasoning: result.reasoning, evidenceQuoted: result.evidenceQuoted };
  if (result.score >= gateThreshold) verified.push(scored);
  else discarded.push(scored);
});

if (unverified.length === findings.length) {
  throw new Error(
    `cso-verify workflow: all ${findings.length} verifier(s) failed to return a result — nothing was independently verified. Re-run this dispatch, or fall back to the skill's SELF-VERIFIED same-context re-read for every finding.`,
  );
}

log(
  `Gate ${gateThreshold}: ${verified.length} verified, ${discarded.length} discarded, ${unverified.length} unverified (coverage gap) of ${findings.length} candidate(s).`,
);

// Returned to the caller (skill Phase 12/13). `unverified` is named separately from
// `discarded` for exactly the reason argued above: a finding nobody scored must never read
// as a finding that was cleared.
return {
  gateThreshold,
  verified,
  discarded,
  unverified,
};
