/**
 * final-gate-lanes — the milestone gate's ONE lane wave, plus the URL-consumer barrier.
 * =============================================================================
 * Owns TWO things and nothing else:
 *   1. Dispatching the milestone gate's lane wave as a single fan-out — the security half
 *      (as a CHILD workflow) beside whichever of the design / devex / compliance lanes the
 *      operator's up-front answers enabled.
 *   2. Holding accessibility-tester and penetration-tester at a barrier behind that wave,
 *      because both drive the SAME app URL that `design-reviewer` owns while it runs.
 *
 * Invoked by `plugins/dk/commands/final/gate.md` (`/dk:final:gate`) whenever the wave holds
 * 2 or more units. The security half is always one of them, so "2 or more" here means
 * "security plus at least one enabled lane". A run where every optional lane came back false
 * is a security-only run — exactly 1 unit — and it never reaches this script: it routes
 * inline through `/dev-kit-core:security-audit`'s own table, because a Workflow for one unit
 * is pure overhead. This script throws on that shape rather than run degraded.
 *
 * -----------------------------------------------------------------------------
 * WHY THE SECURITY HALF IS A CHILD WORKFLOW, NOT N AGENT THUNKS
 * -----------------------------------------------------------------------------
 * The security half is already a Workflow: `security-gate.workflow.mjs` fans one
 * `security-auditor` out per milestone phase, each scoped to THAT phase's declared threat
 * model, and returns the merged register inputs plus its own `unauditedPhases` coverage-gap
 * list. Re-implementing that fan-out as N `agent()` thunks in here would fork a blocking
 * gate into two copies that can drift — two places to fix a coverage-gap rule, two places to
 * get the OPEN vs COULD_NOT_VERIFY split right. So it is invoked as ONE thunk that calls
 * `workflow()`, sitting beside the lane thunks in the same `parallel()`.
 *
 * The nesting is exactly ONE level deep (this script -> security-gate), which is allowed.
 * Do not add a second level, and do not move the child's per-phase auditors up into this
 * fan-out: their scoping rule (one auditor per phase, per that phase's own threat model)
 * lives in the child and stays there.
 *
 * `securityGateScriptPath` must arrive RESOLVED. This script has no filesystem access and
 * cannot expand `<dev-kit-core>` into an installed plugin directory; the caller does that in
 * its own turn, exactly as it does for this script's own `scriptPath`.
 *
 * -----------------------------------------------------------------------------
 * cso AND dependency-manager ARE NOT HERE — and must not be added
 * -----------------------------------------------------------------------------
 * The gate's tail is strictly downstream of this script's last barrier and runs in the
 * CALLER's own turn, in this order, never beside anything above:
 *
 *   1. the `cso` skill in `--diff` mode over the milestone's changes — only once EVERY audit
 *      is back, because it diffs against the whole merged threat register and the register
 *      does not exist until the last auditor returns. Open threats block the ship.
 *   2. THEN `dependency-manager` (escalating license questions to `license-engineer`) — only
 *      once cso has finished, because dependency-manager REWRITES the manifests and
 *      lockfiles cso just fingerprinted.
 *
 * Both are named here so nobody re-derives the ordering, and neither is dispatched here.
 * Adding either as a thunk in the Lanes fan-out gives cso a partial register and hands
 * dependency-manager a tree cso is still reading. Merging the returned lanes into one
 * verdict, and saying which gates passed, is likewise the caller's turn.
 *
 * -----------------------------------------------------------------------------
 * ARGS CONTRACT
 * -----------------------------------------------------------------------------
 * milestone               string   REQUIRED. The milestone id being gated. Echoed into every
 *                                  prompt, every label and the return value.
 * phases                  array    REQUIRED, length >= 2. The milestone's phase list, the
 *                                  same one the security child fans out over. Each entry:
 *   phase.phaseId           string  REQUIRED. Phase id, e.g. "03-auth".
 *   phase.phaseDir          string  REQUIRED. That phase's directory.
 *   phase.threatModelPath   string  REQUIRED. Path to that phase's declared threat model.
 *                                  Held here (not only inside `securityGateArgs`) so the
 *                                  2-or-more rule and the malformed-entry check are EAGER —
 *                                  they throw before any dispatch instead of surfacing from
 *                                  inside the child after the other lanes are already
 *                                  running — and so a dead child can still be reported as a
 *                                  coverage gap BY PHASE NAME.
 * lanes                   object   REQUIRED. The four up-front operator answers, already
 *                                  decided, as STRICT booleans (a missing or truthy-ish
 *                                  value throws rather than being coerced):
 *   lanes.ui                boolean REQUIRED. Did any phase ship UI. Gates design-reviewer,
 *                                   and therefore accessibility-tester too.
 *   lanes.devex             boolean REQUIRED. Is there a developer-facing surface.
 *   lanes.compliance        boolean REQUIRED. Is regulated data or industry in scope.
 *   lanes.pentest           boolean REQUIRED. Is active exploitation authorized IN WRITING.
 * appUrlHint              string   optional. The operator's `[URL]` argument, passed to
 *                                  design-reviewer as its target. Omit it and that agent
 *                                  falls back to its own documented diff-aware auto-detect —
 *                                  which is precisely why the URL the URL-consumer lanes use
 *                                  comes back FROM design-reviewer's result and is never
 *                                  assumed to equal this hint.
 * pentestAuthorization    string   Expected when `lanes.pentest` is true, otherwise omit.
 *                                  Where the WRITTEN authorization lives (path, ticket, URL).
 *                                  A true `lanes.pentest` with no pointer does NOT throw — the
 *                                  pentest lane is simply never rostered, and is named in
 *                                  `skippedLanes` with a COVERAGE GAP line. An authorization
 *                                  nobody can produce is not one, but an optional lane's
 *                                  missing input must never abort the always-on security half.
 * securityGateScriptPath  string   REQUIRED. Resolved filesystem path to
 *                                  `security-gate.workflow.mjs` (see above).
 * securityGateArgs        object   REQUIRED. The child's args, passed VERBATIM — this script
 *                                  never edits, augments or re-derives them. Cross-checked
 *                                  eagerly against `milestone`/`phases` (same milestone, same
 *                                  phase ids in the same order) so the register that comes
 *                                  back can never describe a different phase set than the one
 *                                  this script reports over.
 * routing                 object   optional. `{ <laneName>: {model?, effort?} }`, keyed by
 *                                  `design-reviewer`, `devex-review`, `compliance-auditor`,
 *                                  `accessibility-tester`, `penetration-tester`, and
 *                                  `security-auditor` (forwarded to the security child).
 *                                  Decided caller-side by `model-route.mjs --batch` and
 *                                  forwarded verbatim. An absent key (or an absent `routing`
 *                                  altogether) means "inherit" for that lane, never a guessed
 *                                  default.
 *
 * -----------------------------------------------------------------------------
 * ZERO JUDGMENT LIVES HERE
 * -----------------------------------------------------------------------------
 * Every decision was already made in the CALLER's turn, before this script was invoked, and
 * this script performs no judgment of its own — only control flow:
 *
 * - WHICH LANES RUN. The four operator answers (UI shipped / developer-facing surface /
 *   regulated data in scope / exploitation authorized in writing) are asked and answered by
 *   the command, up front, and arrive here as four booleans. There is no "did this milestone
 *   ship UI?" branch, no "does GDPR apply?" branch, and no inference of authorization — the
 *   command's own rule is that an unanswered question still runs the first three and NEVER
 *   the fourth, because an authorization you inferred is not one. That rule is the caller's
 *   and stays there; this script only reads `lanes`.
 * - CLASSIFICATION AND SCOPE. Which regimes and jurisdictions apply is `compliance-auditor`'s
 *   own documented step 1, not an arg and not a branch here. Which pages, flows and phases
 *   design-reviewer walks is its own. Which surface devex-review discovers is its Step 0.
 * - MODEL AND EFFORT. Model/effort routing is decided caller-side by `model-route.mjs` and
 *   arrives as `args.routing` data, keyed by lane name (`design-reviewer`, `devex-review`,
 *   `compliance-auditor`, `accessibility-tester`, `penetration-tester`, and `security-auditor`
 *   for the child). Each opts builder spreads `routing?.[laneName] ?? {}` BEFORE the keys this
 *   script itself sets, so an absent key still means "inherit the session model" — never a
 *   guessed default — and this script performs no judgment of its own about which model or
 *   effort any lane should run at. All of these feed a gate that can block a ship; a cheaper
 *   model that misses a finding returns a false clean bill of health, which is exactly why the
 *   router (not this script) decides.
 * - PROMPT AUTHORING. Inputs only. `agents/design-reviewer.md`,
 *   `agents/compliance-auditor.md`, `agents/accessibility-tester.md` and
 *   `agents/penetration-tester.md` each own their procedure and their output contract, and
 *   none of it is restated below; the devex lane loads `skills/devex-review/SKILL.md` INSIDE
 *   its own subagent (self-injection), so that skill's full text never enters the
 *   orchestrator's context or this file.
 * - WHAT THE RESULTS MEAN. Merging the lanes into one verdict, deciding whether the gate
 *   passed, and running cso then dependency-manager afterwards are all the caller's.
 *
 * The two things this script DOES decide are mechanical, not judgment: the URL-consumer
 * lanes are held behind the wave (design-reviewer commits source fixes mid-run and its own
 * contract says read-only and active lenses over the same URL wait for it), and they are
 * SKIPPED when no URL came back (see below). Neither involves reading anything.
 *
 * -----------------------------------------------------------------------------
 * THE URL BARRIER — and why a missing URL is a skip, not a guess
 * -----------------------------------------------------------------------------
 * `agents/design-reviewer.md` rule 14: it owns the target URL for the duration of its run and
 * must be dispatched alone against it, because it commits source fixes mid-run — anything
 * auditing or attacking that instance concurrently is reading a moving target. So
 * `accessibility-tester` (read-only over the same URL) and `penetration-tester` (active
 * against it) run in a SECOND phase, after the wave's barrier.
 *
 * They take the URL from `design-reviewer`'s returned `targetUrl` — never from `appUrlHint`,
 * and never from a default. In diff-aware mode that agent detects the running app itself, so
 * the URL it actually audited is knowable only from its result. If design-reviewer DIED, or
 * returned no usable `targetUrl`, both consumers are SKIPPED and logged as coverage gaps in
 * their own named list. The alternative — falling back to the hint — would point an active
 * exploitation lane at an instance nobody confirmed is the one under review.
 *
 * -----------------------------------------------------------------------------
 * THREE FAILURE LISTS, NEVER ONE
 * -----------------------------------------------------------------------------
 * `deadLanes`          — dispatched and returned nothing (agent failed, was skipped, or its
 *                        output failed schema validation). Nothing is known about these.
 * `skippedLanes`       — never dispatched, because a precondition for THAT LANE failed: the app
 *                        URL design-reviewer was to release never arrived, or the pentest lane
 *                        was requested without the UI lane / without an authorization pointer.
 *                        Not a failure of the lane itself, and not coverage either. Every one of
 *                        these is a NAMED skip with a COVERAGE GAP line — never a throw, because
 *                        an OPTIONAL lane's missing input must not take the whole milestone gate
 *                        (security included) down with it.
 * `indeterminateLanes` — RETURNED, and explicitly reported checks it could not determine:
 *                        security's `couldNotVerify` threats, design-reviewer's "still
 *                        undetermined" carried-forward items, devex-review's COULD NOT
 *                        DETERMINE scorecard rows, accessibility-tester's "could not
 *                        determine" entries, penetration-tester's "Needs Verification"
 *                        findings and tests it could not run to conclusion.
 *
 * A lane that died is never merged with a lane that ran and said "I could not check this",
 * and neither is merged with a lane that ran clean. Each of the five agent contracts above
 * carries its own could-not-determine channel precisely so an unattempted check cannot read
 * as a pass; this script keeps all three states apart end to end.
 *
 * -----------------------------------------------------------------------------
 * AGENT RESOLUTION — read this before running
 * -----------------------------------------------------------------------------
 * The four agent lanes dispatch with `agentType` set to the bare agent name
 * (`"design-reviewer"`, `"compliance-auditor"`, `"accessibility-tester"`,
 * `"penetration-tester"`) so each `agents/<name>.md` stays the single source of truth for
 * that lane. The devex lane sets NO `agentType` at all — it is a general subagent that
 * invokes the `Skill` tool on itself. How a plugin-namespaced agent resolves by bare type is
 * install-dependent; a bare name that does not resolve shows up here as a `deadLanes` entry
 * with a COVERAGE GAP line, and the caller re-dispatches that one lane inline with the
 * plugin-qualified form (`dev-kit-core:<name>`).
 *
 * -----------------------------------------------------------------------------
 * NO WORKTREE
 * -----------------------------------------------------------------------------
 * `isolation: 'worktree'` is deliberately not used. Only ONE lane in this wave writes source
 * at all — `design-reviewer`'s fix loop, which commits one atomic commit per fix — and it is
 * the wave's single writer: devex-review is explicitly read-only and commits nothing,
 * compliance-auditor and accessibility-tester are read-only reporters, penetration-tester
 * does not patch, and the security child's auditors each write only their own phase's
 * SECURITY.md under their own phase dir. Single-writer means there is no concurrent git
 * mutation to isolate. Worse, a worktree would strand design-reviewer's commits and every
 * report off the main tree, and would hide the fixes from the very URL the second phase then
 * audits.
 *
 * -----------------------------------------------------------------------------
 * RUNTIME BOUNDS
 * -----------------------------------------------------------------------------
 * `label` and `phase` are set on every `agent()` call in this file, per README §3. The ONE
 * dispatch without them is the security child: `workflow()`'s first argument is the dispatch
 * descriptor `{ scriptPath }` (plus `resumeFromRunId`), and no `label`/`phase` key is documented
 * for it — the child names itself, carrying its own `meta.phases` and one label per per-phase
 * auditor. So the omission is a runtime bound, not a missed checklist item; the log lines above
 * and below the wave name the security half explicitly to cover the progress-display gap. If the
 * runtime later accepts them there, pass `label: final-gate:<milestone>:security-gate` and
 * `phase: PHASE_LANES` and delete this paragraph.
 *
 * No `Date.now()`, no `Math.random()`, no `new Date()`, no filesystem or git access, no
 * imports. `args`, `agent`, `workflow`, `parallel`, `phase` and `log` are ambient globals;
 * this is a top-level-await module body, not an exported function. Because the script cannot
 * stat a file, every file-existence precondition — does the written authorization actually
 * exist at `pentestAuthorization`, is there a design baseline to regress against — is the
 * OWNING ASSET's to establish in its own turn before it invokes this script.
 *
 * -----------------------------------------------------------------------------
 * RETURN SHAPE
 * -----------------------------------------------------------------------------
 * { milestone, lanesRequested, appUrl, security, design, devex, compliance, accessibility,
 *   pentest, deadLanes, skippedLanes, indeterminateLanes } — see the annotated return at the
 * foot of this file.
 */

export const meta = {
  name: "final-gate-lanes",
  description:
    "The milestone gate's lane wave: the security gate as a child workflow beside the design, devex and compliance lanes in one fan-out, then accessibility-tester and (when authorized) penetration-tester against the URL design-reviewer releases. cso and dependency-manager stay in the caller's turn, after this returns, in that order.",
  whenToUse:
    "Called by /dk:final:gate once the four up-front operator answers are in, whenever the wave holds 2 or more units — the security half plus at least one enabled lane. A security-only run is exactly 1 unit and routes inline through /dev-kit-core:security-audit instead.",
  // Static literal, one entry per phase() call, titles matching exactly.
  phases: [
    {
      title: "Lanes",
      detail:
        "the security gate child workflow plus every enabled lane — design, devex, compliance — in one fan-out",
    },
    {
      title: "URL consumers",
      detail:
        "accessibility-tester and, when authorized, penetration-tester against the URL design-reviewer released",
    },
  ],
};

const PHASE_LANES = "Lanes";
const PHASE_URL_CONSUMERS = "URL consumers";

// The four operator answers, in the order the command asks them. Membership in this list is
// the ONLY thing that decides whether an optional lane is dispatched.
const LANE_KEYS = ["ui", "devex", "compliance", "pentest"];

// The child's documented return literal (security-gate.workflow.mjs, foot of file). Used
// below to detect a malformed child return and log it loudly — a security half that came back
// in an unreadable shape must not read as a clean security half.
const SECURITY_GATE_RETURN_KEYS = [
  "milestone",
  "perPhase",
  "openThreats",
  "couldNotVerify",
  "unauditedPhases",
];

// ─────────────────────────────────────────────────────────────────────────────────────────
// MODULE-SCOPE SCHEMAS — each mirrors its agent's / skill's own documented output contract
// field for field. `additionalProperties` is left OPEN on every one of them: a stray extra
// key must never invalidate a whole lane and cost the gate an entire audit, which would then
// read as a coverage gap it is not.
// ─────────────────────────────────────────────────────────────────────────────────────────

// agents/design-reviewer.md: the Phase 6 regression baseline JSON (url, designScore,
// aiSlopScore, categoryGrades, findings[{id,title,impact,category}]), the Phase 6/10 report
// path `{output_dir}/{date}-{domain}.md`, the Phase 10 summary (fixes applied —
// verified/best-effort/reverted — and deferred, per the Phase 8e classification), and the
// Phase 6 "Carried-Forward Human-Review Items" section with its TWO required subsections.
// `targetUrl` is required because this script's second phase consumes it and nothing else:
// in diff-aware mode the agent detects the running app itself, so only its result knows which
// instance was actually audited.
const DESIGN_REVIEW_SCHEMA = {
  type: "object",
  required: ["reportPath", "targetUrl", "designScore", "aiSlopScore", "findings", "fixes", "carriedForward"],
  properties: {
    reportPath: {
      type: "string",
      description: "The report written at {output_dir}/{date}-{domain}.md (Phase 6, updated in Phase 10).",
    },
    targetUrl: {
      type: "string",
      description:
        "The exact URL this audit ran against — the baseline JSON's `url`. The accessibility and penetration lanes dispatch against THIS value and no other; never the caller's hint, never a default.",
    },
    designScore: { type: "string", description: "Design Score A-F: the weighted average of all 10 categories." },
    aiSlopScore: { type: "string", description: "AI Slop Score A-F: the standalone grade." },
    categoryGrades: {
      type: "object",
      description: "Per-category letter grades, as written into the regression baseline JSON.",
    },
    findings: {
      type: "array",
      description: "One entry per finding, matching the baseline JSON's `findings` shape.",
      items: {
        type: "object",
        required: ["id", "title", "impact", "category"],
        properties: {
          id: { type: "string", description: "e.g. FINDING-001." },
          title: { type: "string" },
          impact: {
            type: "string",
            enum: ["high", "medium", "polish"],
            description: "Phase 7 triage impact. Never a severity vocabulary from another lane.",
          },
          category: { type: "string", description: "One of the 10 audit checklist categories." },
        },
      },
    },
    fixes: {
      type: "object",
      required: ["verified", "bestEffort", "reverted", "deferred"],
      description:
        "The Phase 10 summary of the Phase 8 fix loop, using the Phase 8e classification verbatim. `deferred` is Phase 7's unfixable-from-source set plus anything reverted out.",
      properties: {
        verified: { type: "integer", minimum: 0 },
        bestEffort: { type: "integer", minimum: 0, description: "Fixed, but could not be fully verified." },
        reverted: { type: "integer", minimum: 0, description: "Regressed and reverted; deferred instead." },
        deferred: { type: "integer", minimum: 0 },
      },
    },
    carriedForward: {
      type: "object",
      required: ["flaggedByUiAuditor", "addedByThisPass"],
      description:
        "The Carried-Forward Human-Review Items section, kept as its two required subsections. They stay SEPARATE so an upstream ui-auditor under-flagging miss remains visible instead of being absorbed into one clean-looking list.",
      properties: {
        flaggedByUiAuditor: {
          type: "object",
          required: ["confirmed", "acceptable", "stillUndetermined"],
          properties: {
            confirmed: { type: "integer", minimum: 0, description: "Became normal findings." },
            acceptable: { type: "integer", minimum: 0, description: "Read fine live, with the reason." },
            stillUndetermined: {
              type: "integer",
              minimum: 0,
              description:
                "A live look still cannot settle it — a business or brand call for a human stakeholder. Never forced into confirmed or acceptable; this is the lane's could-not-determine channel.",
            },
          },
        },
        addedByThisPass: {
          type: "object",
          required: ["confirmed", "acceptable", "stillUndetermined"],
          description:
            "Items this pass's own re-check surfaced that ui-auditor never flagged. Zero across all three is the explicit 're-check found no under-flagged candidates' answer, not silence.",
          properties: {
            confirmed: { type: "integer", minimum: 0 },
            acceptable: { type: "integer", minimum: 0 },
            stillUndetermined: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    baselinePath: {
      type: "string",
      description:
        "docs/state/baselines/design-baseline.json, written on every regression run — whether this run bootstrapped the baseline or refreshed it after a comparison. Optional: absent when the run was not in regression mode.",
    },
  },
};

// skills/devex-review/SKILL.md: the DX Scorecard's nine dimension rows plus TTHW and Overall
// DX, and the Gate Verdict block (completeness score, BLOCKER/MAJOR/MINOR severity mapping,
// the APPROVE / APPROVE-WITH-CHANGES / REVISE verdict, and the gate threshold). A row whose
// Method is COULD NOT DETERMINE OMITS `score` — its scorecard cell is `N/A`. That is the
// skill's own rule and the reason `score` is not in `required`: a dimension with neither live
// access nor an artifact must never collapse into a scored 0 ("Not addressed").
const DEVEX_SCHEMA = {
  type: "object",
  required: ["dimensions", "overallScore", "verdict", "gatePassed", "findings"],
  properties: {
    dimensions: {
      type: "array",
      description: "One entry per scorecard row, in the scorecard's own order.",
      items: {
        type: "object",
        required: ["dimension", "evidence", "method"],
        properties: {
          dimension: {
            type: "string",
            enum: [
              "Getting Started",
              "API/CLI/SDK",
              "Error Messages",
              "Documentation",
              "Upgrade Path",
              "Dev Environment",
              "Community",
              "DX Measurement",
              "Inner Loop / Workflow",
            ],
          },
          score: {
            type: "integer",
            minimum: 0,
            maximum: 10,
            description:
              "0-10 on the skill's calibration rubric. OMITTED entirely when method is COULD NOT DETERMINE (scorecard cell `N/A`) — never sent as 0.",
          },
          evidence: { type: "string", description: "The evidence source for this score. Guesses are not acceptable." },
          method: {
            type: "string",
            enum: ["TESTED", "PARTIAL", "INFERRED", "COULD NOT DETERMINE"],
          },
        },
      },
    },
    tthwMinutes: {
      type: "number",
      minimum: 0,
      description: "Measured Time to Hello World in minutes. Omitted when it could not be measured at all.",
    },
    tthwTier: {
      type: "string",
      description:
        "The TTHW benchmark tier for the measured time — champion / competitive / needs work / red flag. Deliberately NOT an enum: the skill's benchmark table title-cases these and its Step 1 output template asks for them lowercase, and a casing mismatch on an optional field must not null the whole lane. Red flag (>10 min) is a BLOCKER condition.",
    },
    overallScore: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description:
        "The scorecard's Overall DX score — the Gate Verdict's completeness score. `number`, not `integer`: it is a roll-up average of the nine dimension scores, so 7.5 is a legitimate value.",
    },
    verdict: { type: "string", enum: ["APPROVE", "APPROVE-WITH-CHANGES", "REVISE"] },
    gatePassed: {
      type: "boolean",
      description:
        "The skill's own gate threshold: APPROVE or APPROVE-WITH-CHANGES passes; REVISE fails and must not ship until every BLOCKER is resolved and devex-review is re-run. Taken verbatim, never recomputed here.",
    },
    findings: {
      type: "array",
      description: "The Next Steps fixes, ordered by (adoption impact / effort), each tagged with its severity.",
      items: {
        type: "object",
        required: ["severity", "summary"],
        properties: {
          severity: { type: "string", enum: ["BLOCKER", "MAJOR", "MINOR"] },
          summary: { type: "string" },
        },
      },
    },
    magicalMoment: {
      type: "string",
      description: "The single magical-moment opportunity, if one emerged. Optional.",
    },
  },
};

// agents/compliance-auditor.md: its step 1 (name explicitly WHICH regimes apply and WHICH
// jurisdictions the users and the data sit in), its Method (gap scoring across
// implementation/documentation/process/technology/training, plus a per-gap risk assessment
// ending in residual risk), and its Output (control-coverage percentage, critical findings, a
// prioritized remediation roadmap, and the separately-written Interim Disclosure Assessment
// for a suspected reportable incident). Note: this lane's tool list is Read/Grep/Glob, so the
// audit report normally comes back inline rather than as a file — `reportPath` is optional for
// exactly that reason. This is the one lane whose contract defines no could-not-determine
// channel, so it never contributes to indeterminateLanes.
const COMPLIANCE_SCHEMA = {
  type: "object",
  required: ["regimes", "jurisdictions", "controlCoveragePct", "criticalFindings", "gaps"],
  properties: {
    regimes: {
      type: "array",
      items: { type: "string" },
      description:
        "The regimes this audit landed on (GDPR, CCPA/CPRA, HIPAA/HITECH, PCI DSS, SOC 2, ISO 27001/27701, NIST CSF, FedRAMP). Determined by the agent, never passed in.",
    },
    jurisdictions: {
      type: "array",
      items: { type: "string" },
      description:
        "Where the users and the data sit — a regime is in scope because of that, not because of where the company is.",
    },
    controlCoveragePct: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Control-coverage percentage, as its Output requires it to state.",
    },
    criticalFindings: { type: "integer", minimum: 0 },
    gaps: {
      type: "array",
      description: "One entry per scored gap, with its risk assessment.",
      items: {
        type: "object",
        required: ["id", "control", "gapType", "residualRisk", "remediation"],
        properties: {
          id: { type: "string" },
          control: { type: "string", description: "The control (and framework mapping where it clarifies coverage)." },
          gapType: {
            type: "string",
            enum: ["implementation", "documentation", "process", "technology", "training"],
          },
          residualRisk: { type: "string", description: "Residual risk after the per-gap threat/likelihood/impact assessment." },
          remediation: { type: "string", description: "Its place in the prioritized remediation roadmap." },
        },
      },
    },
    interimDisclosurePath: {
      type: "string",
      description:
        "docs/global/compliance/disclosures/<date>-<slug>-interim.md — present ONLY for a suspected reportable incident, where the interim assessment must not wait on the full audit. Its deadlines are measured from DISCOVERY.",
    },
    reportPath: {
      type: "string",
      description: "Path to the audit report, when one was written. Optional: this agent is read-only (Read/Grep/Glob).",
    },
  },
};

// agents/accessibility-tester.md Output: violations ordered by severity, each with its WCAG
// criterion, severity, affected location and a specific fix; the conformance level achieved;
// residual limitations; and — as its OWN entries, never omitted and never folded into a pass —
// every criterion that could not be verified. That last list is this lane's
// could-not-determine channel. No reportPath: its tools are Read/Grep/Glob/Bash, so the
// findings report comes back inline.
const ACCESSIBILITY_SCHEMA = {
  type: "object",
  required: ["targetUrl", "conformanceTarget", "conformanceAchieved", "violations", "couldNotDetermine"],
  properties: {
    targetUrl: {
      type: "string",
      description: "Echoed verbatim from the dispatch prompt — the URL design-reviewer released. Never re-derived.",
    },
    conformanceTarget: { type: "string", description: "The compliance target tested against; default WCAG 2.1 AA." },
    conformanceAchieved: { type: "string", description: "The conformance level actually achieved." },
    violations: {
      type: "array",
      description: "Findings ordered by severity, critical blockers first.",
      items: {
        type: "object",
        required: ["criterion", "severity", "location", "fix"],
        properties: {
          criterion: { type: "string", description: "The WCAG success criterion." },
          severity: { type: "string", enum: ["critical", "serious", "moderate", "minor"] },
          location: { type: "string" },
          fix: { type: "string", description: "A specific fix, not a restatement of the criterion." },
        },
      },
    },
    couldNotDetermine: {
      type: "array",
      description:
        "One entry per criterion that could not be verified (e.g. assistive-tech coverage unavailable in this session). Its own list by contract: not omitted, and never folded silently into a pass.",
      items: {
        type: "object",
        required: ["criterion", "reason"],
        properties: {
          criterion: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    residualLimitations: {
      type: "string",
      description: "Residual limitations of this pass, including assistive-tech coverage gaps.",
    },
  },
};

// agents/penetration-tester.md: its hard authorization gate (confirmed scope and rules of
// engagement before any active test), and its Output — technical findings with proof-of-concept
// and file:line/endpoint refs, severity with likelihood + impact, and each finding's
// Confirmation status, which is NEVER collapsed into "Confirmed" and never dropped. Tests that
// could not be run to conclusion within scope (blocked, out of window, target unreachable) are
// a distinct outcome from "not vulnerable" and are carried in their own list. Together those two
// are this lane's could-not-determine channel. No reportPath: its tools are Read/Grep/Glob/Bash.
const PENTEST_SCHEMA = {
  type: "object",
  required: ["targetUrl", "authorizationRef", "scopeConfirmed", "findings", "testsNotCompleted"],
  properties: {
    targetUrl: {
      type: "string",
      description: "Echoed verbatim from the dispatch prompt — the sole authorized target for this run.",
    },
    authorizationRef: {
      type: "string",
      description: "Where the written authorization relied on for this run lives, echoed back for the record.",
    },
    scopeConfirmed: {
      type: "boolean",
      description:
        "Whether scope and rules of engagement were confirmed before any active test. False means no active testing was performed — a hard stop, not a clean result.",
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "severity", "likelihood", "impact", "location", "confirmation", "remediation"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          likelihood: { type: "string" },
          impact: { type: "string" },
          location: { type: "string", description: "file:line or endpoint." },
          confirmation: {
            type: "string",
            enum: ["Confirmed", "Needs Verification"],
            description:
              "Confirmed = validated via safe proof-of-concept. Needs Verification = exploitability or impact could not be conclusively established within scope. Never collapsed into Confirmed.",
          },
          proofOfConcept: { type: "string", description: "Evidence and reproduction steps for a Confirmed finding." },
          remediation: { type: "string" },
        },
      },
    },
    testsNotCompleted: {
      type: "array",
      description:
        "Tests that could not be run to conclusion within scope. A distinct outcome from 'not vulnerable': no severity is guessed for these and none is dropped.",
      items: {
        type: "object",
        required: ["area", "reason"],
        properties: {
          area: { type: "string" },
          reason: { type: "string", description: "blocked / out of window / target unreachable / out of scope." },
        },
      },
    },
    complianceMapping: { type: "string", description: "Compliance mapping, per the report template. Optional." },
    retestGuidance: { type: "string", description: "Retest guidance. Optional." },
  },
};

// ─────────────────────────────────────────────────────────────────────────────────────────
// EAGER VALIDATION — every check below throws BEFORE the first phase() or dispatch. A gate
// that runs against a half-specified contract is worse than one that refuses to run: it comes
// back looking complete for lanes that were never dispatched.
// ─────────────────────────────────────────────────────────────────────────────────────────
const {
  milestone,
  phases: rawPhases,
  lanes: rawLanes,
  appUrlHint = null,
  pentestAuthorization = null,
  securityGateScriptPath,
  securityGateArgs,
  routing = null,
} = args;

if (!milestone) {
  throw new Error(
    "final-gate-lanes: `milestone` is required — the milestone id being gated. It is echoed into every lane prompt, every label and the returned worklist.",
  );
}
if (typeof securityGateScriptPath !== "string" || securityGateScriptPath.length === 0) {
  throw new Error(
    "final-gate-lanes: `securityGateScriptPath` is required and must be the RESOLVED filesystem path to security-gate.workflow.mjs. This script has no filesystem access and cannot expand `<dev-kit-core>` itself — resolve it in the caller's turn, exactly as you resolved this script's own scriptPath.",
  );
}
if (!securityGateArgs || typeof securityGateArgs !== "object" || Array.isArray(securityGateArgs)) {
  throw new Error(
    "final-gate-lanes: `securityGateArgs` is required and must be the child workflow's args object ({ milestone, phases[, agentType] }). It is passed through VERBATIM — this script never edits, augments or re-derives it.",
  );
}
if (!Array.isArray(rawPhases)) {
  throw new Error(
    "final-gate-lanes: `phases` is required and must be an array of { phaseId, phaseDir, threatModelPath } — the milestone's phase list, the same one the security child fans out over.",
  );
}
if (rawPhases.length < 2) {
  throw new Error(
    `final-gate-lanes: needs 2 or more phases (got ${rawPhases.length}). A SINGLE-PHASE milestone routes the whole gate inline, however many lanes it enabled: one security-auditor per /dev-kit-core:security-audit's own routing table, then the enabled lanes, then the URL consumers behind design-reviewer. This is not a lane-count rule — it is the security child's, which throws below 2 phases as well, and this script's security half is that child. Checking it HERE keeps the failure eager, before any lane is dispatched.`,
  );
}
rawPhases.forEach((p, i) => {
  if (!p || !p.phaseId) {
    throw new Error(`final-gate-lanes: phases[${i}] is missing \`phaseId\`. Every phase entry needs one — it names the phase in labels and in coverage-gap lines.`);
  }
  if (!p.phaseDir) {
    throw new Error(`final-gate-lanes: phase "${p.phaseId}" is missing \`phaseDir\`.`);
  }
  if (!p.threatModelPath) {
    throw new Error(
      `final-gate-lanes: phase "${p.phaseId}" is missing \`threatModelPath\`. An auditor dispatched without its phase's declared threat model falls back to a generic repo-wide scan — exactly the scoping the per-phase fan-out exists to prevent — and it comes back looking like a clean audit.`,
    );
  }
});

// Cross-check the child's args against this script's own view of the milestone. A register
// that came back describing a DIFFERENT phase set than the one reported here would be
// mis-attributed by the caller, and the mis-attribution would be invisible.
if (securityGateArgs.milestone !== milestone) {
  throw new Error(
    `final-gate-lanes: \`securityGateArgs.milestone\` (${JSON.stringify(securityGateArgs.milestone)}) does not match \`milestone\` (${JSON.stringify(milestone)}). The child would gate a different milestone than this script reports over.`,
  );
}
if (!Array.isArray(securityGateArgs.phases) || securityGateArgs.phases.length !== rawPhases.length) {
  throw new Error(
    `final-gate-lanes: \`securityGateArgs.phases\` must be an array of the same length as \`phases\` (${rawPhases.length}). The two describe the same milestone and must not disagree about how many phases it shipped.`,
  );
}
const phaseIdMismatch = rawPhases.findIndex(
  (p, i) => !securityGateArgs.phases[i] || securityGateArgs.phases[i].phaseId !== p.phaseId,
);
if (phaseIdMismatch !== -1) {
  throw new Error(
    `final-gate-lanes: \`securityGateArgs.phases[${phaseIdMismatch}].phaseId\` does not match \`phases[${phaseIdMismatch}].phaseId\` ("${rawPhases[phaseIdMismatch].phaseId}"). Same milestone, same phase ids, same order — otherwise the returned register cannot be attributed to the phases this script names in its coverage gaps.`,
  );
}

// Strict booleans, never coerced: these four ARE the operator's answers, and a truthy-ish
// value silently enabling (or a missing value silently disabling) a milestone gate lane is the
// single most expensive way this contract can be misread.
if (!rawLanes || typeof rawLanes !== "object" || Array.isArray(rawLanes)) {
  throw new Error(
    `final-gate-lanes: \`lanes\` is required and must be an object with strict booleans for ${LANE_KEYS.join(", ")} — the four up-front operator answers, already given.`,
  );
}
for (const key of LANE_KEYS) {
  if (typeof rawLanes[key] !== "boolean") {
    throw new Error(
      `final-gate-lanes: \`lanes.${key}\` is required and must be a boolean (got ${JSON.stringify(rawLanes[key])}). The four answers are the caller's; this script never infers one, and an unanswered question is not a false.`,
    );
  }
}

const lanes = {
  ui: rawLanes.ui,
  devex: rawLanes.devex,
  compliance: rawLanes.compliance,
  pentest: rawLanes.pentest,
};
const enabledLanes = LANE_KEYS.filter((key) => lanes[key]);

if (enabledLanes.length === 0) {
  throw new Error(
    "final-gate-lanes: every optional lane is false, so this wave is the security half alone — exactly 1 unit. Route it inline through /dev-kit-core:security-audit's own table instead; a Workflow wrapping one unit is pure overhead.",
  );
}
// The pentest lane's two preconditions, evaluated up front but NEVER thrown on. It is an
// OPTIONAL lane; the security half in this same wave is unconditional and gate-blocking, so
// aborting the whole script over a missing pentest input would trade one lane for the entire
// milestone gate — zero security audit, zero devex, zero compliance, zero design review. Each
// failure below becomes a named `skippedLanes` entry plus a COVERAGE GAP line in phase 2,
// exactly like the missing-app-URL case this script already handles that way.
const pentestAuthorized = typeof pentestAuthorization === "string" && pentestAuthorization.length > 0;
const pentestSkipReasons = [];
if (lanes.pentest && !lanes.ui) {
  pentestSkipReasons.push("no UI lane, so no design-reviewer and no released app URL");
}
if (lanes.pentest && !pentestAuthorized) {
  pentestSkipReasons.push("no written-authorization pointer supplied");
}
// True only when the operator authorized exploitation AND both preconditions hold. Everything
// downstream reads THIS, never `lanes.pentest` alone.
const pentestRostered = lanes.pentest && pentestSkipReasons.length === 0;
if (appUrlHint !== null && typeof appUrlHint !== "string") {
  throw new Error(
    `final-gate-lanes: \`appUrlHint\` must be a string when present (got ${JSON.stringify(appUrlHint)}). Omit it entirely to let design-reviewer use its own diff-aware auto-detect.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PROMPTS — inputs only for the four agent lanes (each agents/<name>.md owns its procedure
// and output contract, and none of it is restated), skill self-injection for devex.
// ─────────────────────────────────────────────────────────────────────────────────────────

function designPrompt() {
  const lines = [
    `Run the milestone-level design review for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    "- mode: full, with regression comparison",
  ];
  if (appUrlHint) {
    lines.push(`- target URL: ${appUrlHint}`);
  } else {
    lines.push(
      "- target URL: not supplied — use your own diff-aware detection to find the running app.",
    );
  }
  lines.push(
    "",
    // Not a restatement of procedure: this is the barrier contract. The two lanes that drive
    // this same instance are held until this agent returns, and they dispatch against the URL
    // it reports here — so the URL has to come back explicitly, whether it was passed in or
    // detected.
    "Return the exact URL you audited as `targetUrl`. The accessibility and penetration lanes are held at a barrier behind you and will be dispatched against that URL and no other; if it comes back empty they are skipped entirely and this milestone gate loses both.",
    "You own that URL for the duration of your run — nothing else in this wave drives or attacks it.",
    "Follow your own phases exactly and at full depth. You are non-interactive: never wait for a user.",
  );
  return lines.join("\n");
}

// Skill self-injection: the subagent invokes the Skill tool ITSELF. The caller must not invoke
// it on the subagent's behalf — that would pull the whole devex-review SKILL into the
// orchestrator's context, which is exactly the weight this dispatch keeps out of it.
function devexPrompt() {
  return [
    `Your first action: invoke the Skill tool with skill: \`dev-kit-core:devex-review\` and follow it for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    "",
    // Mechanical, from agents/design-reviewer.md rule 14 — not a judgment call made here.
    "Run your Step 0 target discovery over the DEVELOPER-FACING surface (README, CLAUDE.md, package manifest, CLI, docs site). A design review is running concurrently against the app URL and is committing source fixes as it goes, so do not drive that instance — anything reading it right now is reading a moving target.",
    "STRICTLY READ-ONLY, as your own skill requires: change no source, config, docs or dependencies, and commit nothing.",
    "You are non-interactive: never wait for a user. Where Step 0 would ask for a missing URL, mark the affected dimensions COULD NOT DETERMINE with `N/A` scores instead of asking or guessing.",
    "Return only the JSON matching the required schema.",
  ].join("\n");
}

function compliancePrompt() {
  return [
    `Run the compliance audit for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    "",
    // Deliberately no regime list: naming which regimes apply and which jurisdictions the
    // users and the data sit in is this agent's own step 1, and passing a guessed list would
    // replace that determination with the caller's assumption.
    "Establish scope yourself: name explicitly which regimes apply and which jurisdictions the users and the data sit in, and pair yourself with the matching deep-dive skill for the regimes you land on.",
    "Read-only: recommend controls, modify nothing.",
    "Follow your own method and output contract exactly and at full depth. You are non-interactive: never wait for a user.",
  ].join("\n");
}

function accessibilityPrompt(appUrl) {
  return [
    `Run the milestone-level accessibility audit for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    `- target URL: ${appUrl}`,
    "",
    "The design review that owned this URL has finished and released it; audit this URL and echo it back as `targetUrl`.",
    "Report and recommend only — do not fix code.",
    "Follow your own method and output contract exactly and at full depth. You are non-interactive: never wait for a user.",
  ].join("\n");
}

function pentestPrompt(appUrl) {
  return [
    `Run the authorized penetration test for milestone ${milestone}.`,
    "",
    "Inputs:",
    `- milestone: ${milestone}`,
    `- authorized target: ${appUrl} — this target only; nothing else is in scope for this run.`,
    `- written authorization: ${pentestAuthorization}`,
    "",
    "The design review that owned this URL has finished and released it; echo the target back as `targetUrl` and the authorization location as `authorizationRef`.",
    "Apply your own authorization gate first, against the authorization at that location, and confirm scope and rules of engagement before any active test.",
    "Follow your own method and output contract exactly and at full depth. You are non-interactive: never wait for a user.",
  ].join("\n");
}

// Opts builders. Each spreads `routing?.[laneName] ?? {}` FIRST so the caller-side router's
// model/effort decision wins; when routing carries no entry for a lane, `model`/`effort` stay
// OMITTED entirely — omitted means inherit the session model (see ZERO JUDGMENT above), never
// a guessed default. `label`, `phase` and `schema` are always set; `agentType` is set for the
// four agent lanes and deliberately absent for devex, which is a general subagent that loads
// its own skill.
function agentOpts(laneName, agentType, phaseTitle, schema) {
  return {
    ...(routing?.[laneName] ?? {}),
    label: `final-gate:${milestone}:${laneName}`,
    phase: phaseTitle,
    agentType,
    schema,
  };
}

function devexOpts() {
  return {
    ...(routing?.["devex-review"] ?? {}),
    label: `final-gate:${milestone}:devex-review`,
    phase: PHASE_LANES,
    schema: DEVEX_SCHEMA,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHASE 1 — the lane wave. ONE fan-out: the security child workflow beside every enabled lane.
// ─────────────────────────────────────────────────────────────────────────────────────────
phase(PHASE_LANES);

const waveLanes = [];

// Security is unconditional and always first: it gates the milestone, and the whole tail of
// the gate (cso, then dependency-manager, in the caller's turn) depends on its register.
waveLanes.push({
  name: "security-gate",
  // ONE thunk that runs the whole child fan-out. `securityGateArgs` goes through verbatim,
  // with exactly one addition: this run's own `routing` (keyed by lane name, including the
  // child's own `security-auditor` key) is forwarded to the child workflow's args, guarded
  // with `?? {}` so a caller with no routing data at all still passes an empty object
  // rather than `undefined`. The child script (security-gate.workflow.mjs) looks up its own
  // `security-auditor` key inside whatever `routing` object it receives, same as any other
  // Surface B script — nothing is rekeyed or re-derived here.
  run: () => workflow({ scriptPath: securityGateScriptPath }, { ...securityGateArgs, routing: routing ?? {} }),
  // The child carries its own meta.phases, its own per-auditor labels and its own
  // coverage-gap logging; nothing about it is re-stated or re-derived here. No `label`/`phase`
  // is passed alongside `scriptPath` — see RUNTIME BOUNDS in the header for why.
});
if (lanes.ui) {
  waveLanes.push({
    name: "design-reviewer",
    run: () => agent(designPrompt(), agentOpts("design-reviewer", "design-reviewer", PHASE_LANES, DESIGN_REVIEW_SCHEMA)),
  });
}
if (lanes.devex) {
  waveLanes.push({ name: "devex-review", run: () => agent(devexPrompt(), devexOpts()) });
}
if (lanes.compliance) {
  waveLanes.push({
    name: "compliance-auditor",
    run: () =>
      agent(compliancePrompt(), agentOpts("compliance-auditor", "compliance-auditor", PHASE_LANES, COMPLIANCE_SCHEMA)),
  });
}

log(
  `final-gate-lanes ${milestone}: dispatching ${waveLanes.length} unit(s) in ONE wave — ${waveLanes
    .map((l) => l.name)
    .join(", ")}. Operator answers: ui=${lanes.ui}, devex=${lanes.devex}, compliance=${lanes.compliance}, pentest=${lanes.pentest}. ` +
    `The security half runs as a child workflow (${securityGateScriptPath}) over ${rawPhases.length} phase(s): ${rawPhases.map((p) => p.phaseId).join(", ")}.`,
);
if (lanes.ui) {
  log(
    `URL-consumer lanes are held behind this wave: design-reviewer owns the app URL while it runs (it commits source fixes mid-run), so accessibility-tester${pentestRostered ? " and penetration-tester" : ""} dispatch only after it returns, against the targetUrl it reports.`,
  );
}

// Thunks, never live promises: `parallel()` is the barrier and never rejects — a failed thunk
// yields null, handled below as a coverage gap rather than as an exception.
const waveResults = await parallel(waveLanes.map((lane) => () => lane.run()));

// Failure lists, kept apart from each other end to end.
const deadLanes = [];
const skippedLanes = [];
const indeterminateLanes = [];

const byLane = {};
waveResults.forEach((result, i) => {
  byLane[waveLanes[i].name] = result || null;
});

const security = byLane["security-gate"] || null;
const design = byLane["design-reviewer"] || null;
const devex = byLane["devex-review"] || null;
const compliance = byLane["compliance-auditor"] || null;

// ── Coverage gaps for the wave ──────────────────────────────────────────────────────────
if (!security) {
  deadLanes.push({
    lane: "security-gate",
    reason: "the child workflow returned nothing (it threw, was skipped, or died mid-fan-out)",
  });
  log(
    `COVERAGE GAP: the security half did NOT run — the child workflow at ${securityGateScriptPath} returned nothing. ` +
      `NOT audited: ${rawPhases.map((p) => `${p.phaseId} (${p.threatModelPath})`).join(", ")}. ` +
      "There is no threat register for this milestone, so the gate CANNOT PASS and cso has nothing to diff against — its --diff pass must not be run on an empty register. Re-run the security half before doing anything else. A dead run resumes via resumeFromRunId.",
  );
} else {
  const missingKeys = SECURITY_GATE_RETURN_KEYS.filter((key) => !(key in security));
  if (missingKeys.length > 0) {
    log(
      `MALFORMED CHILD RETURN: the security child came back without ${missingKeys.join(", ")}. Treat its register as incomplete rather than clean — a security half nobody can read is not a security half that found nothing.`,
    );
  }
  const unaudited = Array.isArray(security.unauditedPhases) ? security.unauditedPhases : [];
  if (unaudited.length > 0) {
    // Relayed, not re-derived: the child already logged these per phase. Repeated here so a
    // reader of THIS run's log sees that the wave's security coverage is partial.
    log(
      `COVERAGE GAP (relayed from the security child): ${unaudited.length} phase(s) went unaudited — ${unaudited
        .map((u) => u.phaseId)
        .join(", ")}. Their threats are neither closed nor open, they are unknown, and the gate cannot pass while that is true.`,
    );
  }
  const couldNotVerify = Array.isArray(security.couldNotVerify) ? security.couldNotVerify : [];
  if (couldNotVerify.length > 0) {
    indeterminateLanes.push({
      lane: "security-gate",
      reason: "threats the auditors could not verify — never closed, never open",
      count: couldNotVerify.length,
    });
  }
  log(
    `security-gate: ${(security.perPhase || []).length}/${rawPhases.length} phase(s) audited | ${(security.openThreats || []).length} open threat(s) | ${couldNotVerify.length} could-not-verify | ${unaudited.length} unaudited.`,
  );
}

if (lanes.ui && !design) {
  deadLanes.push({ lane: "design-reviewer", reason: "no result returned (agent failed, was skipped, or its output failed schema validation)" });
  log(
    "COVERAGE GAP: design-reviewer returned nothing. NOT covered for this milestone: the cross-page consistency pass, AI-slop detection, interaction feel, the design and AI-slop scores, the fix loop, and every carried-forward `## Needs Human Review` item the per-phase ui-auditor runs deferred to this pass. It also released no app URL, so the URL-consumer lanes below are skipped. Re-dispatch this lane (try the plugin-qualified type `dev-kit-core:design-reviewer` if the bare name failed to resolve).",
  );
} else if (design) {
  const cf = design.carriedForward || {};
  const flagged = cf.flaggedByUiAuditor || {};
  const added = cf.addedByThisPass || {};
  const undetermined = (flagged.stillUndetermined || 0) + (added.stillUndetermined || 0);
  if (undetermined > 0) {
    indeterminateLanes.push({
      lane: "design-reviewer",
      reason: "carried-forward human-review items a live look still could not settle — a human stakeholder call",
      count: undetermined,
    });
  }
  log(
    `design-reviewer: design ${design.designScore} / AI-slop ${design.aiSlopScore} | ${(design.findings || []).length} finding(s) | fixes verified ${design.fixes?.verified} best-effort ${design.fixes?.bestEffort} reverted ${design.fixes?.reverted} deferred ${design.fixes?.deferred} | ${undetermined} still-undetermined carried-forward item(s) | ${design.reportPath} | targetUrl ${design.targetUrl}`,
  );
}

if (lanes.devex && !devex) {
  deadLanes.push({ lane: "devex-review", reason: "no result returned (agent failed, was skipped, or its output failed schema validation)" });
  log(
    "COVERAGE GAP: the devex-review lane returned nothing. NOT covered: Time-to-Hello-World, the getting-started walkthrough, API/CLI/SDK ergonomics, error-message quality, the docs and upgrade-path audits and the inner-loop pass — and there is no DX gate verdict, so the gate cannot claim the developer-facing surface passed. Re-dispatch this lane.",
  );
} else if (devex) {
  const dims = Array.isArray(devex.dimensions) ? devex.dimensions : [];
  const undeterminable = dims.filter((d) => d && d.method === "COULD NOT DETERMINE");
  if (undeterminable.length > 0) {
    indeterminateLanes.push({
      lane: "devex-review",
      reason: "scorecard dimensions with neither live access nor an artifact — scored N/A, never 0",
      count: undeterminable.length,
    });
  }
  log(
    `devex-review: ${devex.verdict} (gatePassed ${devex.gatePassed}) | overall ${devex.overallScore}/10 | TTHW ${devex.tthwMinutes ?? "not measured"} min (${devex.tthwTier ?? "no tier"}) | ${(devex.findings || []).length} finding(s) | ${undeterminable.length} dimension(s) COULD NOT DETERMINE.`,
  );
}

if (lanes.compliance && !compliance) {
  deadLanes.push({ lane: "compliance-auditor", reason: "no result returned (agent failed, was skipped, or its output failed schema validation)" });
  log(
    "COVERAGE GAP: compliance-auditor returned nothing. NOT covered: which regimes and jurisdictions actually apply, the data-lifecycle trace, control coverage, the gap scoring and risk assessment, and the remediation roadmap. No control-coverage percentage exists for this milestone, so no compliance claim can be made. Re-dispatch this lane.",
  );
} else if (compliance) {
  log(
    `compliance-auditor: regimes ${(compliance.regimes || []).join(", ") || "none named"} | jurisdictions ${(compliance.jurisdictions || []).join(", ") || "none named"} | control coverage ${compliance.controlCoveragePct}% | ${compliance.criticalFindings} critical finding(s) | ${(compliance.gaps || []).length} gap(s)${compliance.interimDisclosurePath ? ` | interim disclosure ${compliance.interimDisclosurePath}` : ""}.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHASE 2 — the URL consumers, behind the barrier. Both take design-reviewer's `targetUrl`
// and nothing else; no fallback to `appUrlHint`, no default.
// ─────────────────────────────────────────────────────────────────────────────────────────
phase(PHASE_URL_CONSUMERS);

const returnedUrl = design && typeof design.targetUrl === "string" ? design.targetUrl.trim() : "";
const appUrl = returnedUrl.length > 0 ? returnedUrl : null;

let accessibility = null;
let pentest = null;

// The pentest lane's own preconditions, settled before dispatch (see the eager block above).
// Named here as a skip rather than thrown on: the operator DID authorize exploitation, so this
// is a real coverage gap in this gate — and it is one gap, not a reason to lose the wave.
if (pentestSkipReasons.length > 0) {
  const reason = pentestSkipReasons.join("; ");
  skippedLanes.push({ lane: "penetration-tester", reason });
  log(
    `COVERAGE GAP: penetration-tester was NOT dispatched — ${reason}. NOT covered: recon, the OWASP Top 10 pass, API authn/authz and business-logic testing, and exploit validation — no vulnerability was confirmed AND none was ruled out. The operator answered that active exploitation IS authorized, so this is a gap in this milestone gate, not a lane that was out of scope. Every other lane in this run is unaffected: dispatch penetration-tester inline, in your own turn, against the surface the written authorization actually names.`,
  );
}

if (!lanes.ui) {
  // Not a gap for accessibility: the operator answered "no UI shipped", so it was never
  // rostered. (A pentest lane requested without UI is already named above.)
  log(
    "URL consumers: accessibility-tester not rostered. The operator answered that no phase shipped UI, so there is no design review and no app URL for it to audit.",
  );
} else if (!appUrl) {
  // The one runtime precondition this script cannot check up front. Skipped, never guessed.
  const reason = design
    ? "design-reviewer returned no usable `targetUrl`"
    : "design-reviewer died and released no app URL";
  skippedLanes.push({ lane: "accessibility-tester", reason });
  log(
    `COVERAGE GAP: accessibility-tester was NOT dispatched — ${reason}. NOT covered for this milestone: WCAG conformance, the keyboard-only pass, screen-reader announcement order, contrast and focus indicators, ARIA and form labelling, and the cognitive/mobile checks. This lane will not be pointed at the caller's URL hint instead: the hint is what design-reviewer was ASKED to audit, not what it confirms it audited. Re-run the design lane, then dispatch accessibility-tester inline against the URL it reports.`,
  );
  if (pentestRostered) {
    skippedLanes.push({ lane: "penetration-tester", reason });
    log(
      `COVERAGE GAP: penetration-tester was NOT dispatched — ${reason}. NOT covered: recon, the OWASP Top 10 pass, API authn/authz and business-logic testing, and exploit validation. Authorization was given (${pentestAuthorization}) and is untouched by this skip. An active exploitation run is emphatically not pointed at a guessed instance: re-run the design lane, then dispatch penetration-tester inline against the URL it reports.`,
    );
  }
} else {
  const consumers = [
    {
      name: "accessibility-tester",
      run: () =>
        agent(
          accessibilityPrompt(appUrl),
          agentOpts("accessibility-tester", "accessibility-tester", PHASE_URL_CONSUMERS, ACCESSIBILITY_SCHEMA),
        ),
    },
  ];
  if (pentestRostered) {
    consumers.push({
      name: "penetration-tester",
      run: () =>
        agent(
          pentestPrompt(appUrl),
          agentOpts("penetration-tester", "penetration-tester", PHASE_URL_CONSUMERS, PENTEST_SCHEMA),
        ),
    });
  }

  log(
    `URL consumers: design-reviewer released ${appUrl}. Dispatching ${consumers.length} lane(s) against it — ${consumers.map((c) => c.name).join(", ")}.`,
  );

  // Thunks again, for the same reason: parallel() owns the concurrency and the barrier.
  const consumerResults = await parallel(consumers.map((c) => () => c.run()));

  consumerResults.forEach((result, i) => {
    const name = consumers[i].name;
    if (name === "accessibility-tester") accessibility = result || null;
    if (name === "penetration-tester") pentest = result || null;
    if (!result) {
      deadLanes.push({
        lane: name,
        reason: "no result returned (agent failed, was skipped, or its output failed schema validation)",
      });
      log(
        name === "accessibility-tester"
          ? `COVERAGE GAP: accessibility-tester returned nothing for ${appUrl}. NOT covered: WCAG conformance, keyboard operability, screen-reader support, contrast, ARIA, forms and the cognitive/mobile checks. Re-dispatch it inline against ${appUrl} (try \`dev-kit-core:accessibility-tester\` if the bare agent type failed to resolve).`
          : `COVERAGE GAP: penetration-tester returned nothing for ${appUrl}. NOT covered: recon, the OWASP Top 10 pass, API and infrastructure testing, and exploit validation — no vulnerability was confirmed AND none was ruled out. The written authorization at ${pentestAuthorization} is unaffected. Re-dispatch it inline against ${appUrl}.`,
      );
    }
  });

  if (accessibility) {
    const cnd = Array.isArray(accessibility.couldNotDetermine) ? accessibility.couldNotDetermine : [];
    if (cnd.length > 0) {
      indeterminateLanes.push({
        lane: "accessibility-tester",
        reason: "WCAG criteria that could not be verified in this session — not violations, and not passes either",
        count: cnd.length,
      });
    }
    log(
      `accessibility-tester: ${(accessibility.violations || []).length} violation(s) against ${accessibility.conformanceTarget} | achieved ${accessibility.conformanceAchieved} | ${cnd.length} criterion/criteria could not be determined.`,
    );
  }
  if (pentest) {
    const findings = Array.isArray(pentest.findings) ? pentest.findings : [];
    const needsVerification = findings.filter((f) => f && f.confirmation === "Needs Verification");
    const notCompleted = Array.isArray(pentest.testsNotCompleted) ? pentest.testsNotCompleted : [];
    if (needsVerification.length + notCompleted.length > 0) {
      indeterminateLanes.push({
        lane: "penetration-tester",
        reason:
          "findings whose exploitability could not be conclusively established, plus tests that could not be run to conclusion within scope",
        count: needsVerification.length + notCompleted.length,
      });
    }
    if (pentest.scopeConfirmed === false) {
      log(
        "PENTEST SCOPE NOT CONFIRMED: penetration-tester reports it did not confirm scope and rules of engagement, so no active testing was performed. That is a hard stop, not a clean result — nothing was ruled out.",
      );
    }
    log(
      `penetration-tester: ${findings.length} finding(s) (${findings.filter((f) => f && f.confirmation === "Confirmed").length} confirmed, ${needsVerification.length} needs-verification) | ${notCompleted.length} test(s) not completed | scopeConfirmed ${pentest.scopeConfirmed} | authorization ${pentest.authorizationRef}.`,
    );
  }
}

// ── Barrier summary ─────────────────────────────────────────────────────────────────────
log(
  `final-gate-lanes ${milestone} barrier reached: ${deadLanes.length} dead lane(s), ${skippedLanes.length} skipped lane(s), ${indeterminateLanes.length} lane(s) with checks they could not determine. ` +
    "Merging these into one verdict is the caller's next action, and so is the tail: the cso skill in --diff mode over this milestone's changes — ONLY once every audit is back and NEVER beside them — and then, only once cso has finished, dependency-manager (escalating license questions to license-engineer). Say which gates passed and name every lane that did not run.",
);

// The caller's worklist. Each lane is returned verbatim under its own key, and the three
// failure states stay in three separately named lists: a lane that DIED is never merged with
// a lane that was SKIPPED for a missing precondition, and neither is merged with a lane that
// RAN and reported checks it could not determine.
return {
  // Echoed so the worklist is self-describing without re-reading the dispatch args.
  milestone,
  // The four operator answers as dispatched, plus the always-on security half. This is what
  // "which lanes were in scope" means for this run — read it before reading any absence below.
  lanesRequested: { security: true, ...lanes },
  // The URL design-reviewer released, or null. Null means the URL-consumer lanes were skipped
  // (or never rostered); it is never the caller's `appUrlHint` fallback.
  appUrl,
  // The security child's return, verbatim: { milestone, perPhase, openThreats, couldNotVerify,
  // unauditedPhases }. Its own lists are NOT flattened into this script's — the register merge
  // and any dedup are the caller's judgment, exactly as that child documents.
  security,
  // One key per lane, each that agent's own self-report, verbatim and un-cross-checked.
  // null means the lane did not return, or was not rostered — the lists below say which.
  design,
  devex,
  compliance,
  accessibility,
  pentest,
  // Dispatched, returned nothing. Nothing at all is known about these lanes. Non-empty means
  // the milestone gate has holes in it, and the caller must name each one.
  deadLanes,
  // Never dispatched: a runtime precondition failed (design-reviewer released no app URL).
  // Distinct from dead — the lane itself did not fail, its input never arrived.
  skippedLanes,
  // Returned, and explicitly reported checks it could NOT determine. Distinct from both lists
  // above and from a clean lane: an unattempted check is unknown, not a pass.
  indeterminateLanes,
};
