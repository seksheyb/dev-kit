/**
 * plan-review workflow — fan out one `plan-reviewer` agent per review lens over a single
 * plan file, then consolidate the per-lens results.
 *
 * Invoked by `commands/plan-review.md` whenever 2 or more lenses are selected (the
 * default run selects all 4, so the default run is always a Workflow). A single-lens run
 * never reaches here: the command makes a plain inline Agent call, because a Workflow for
 * one agent is pure overhead.
 *
 * args contract
 * -------------
 *   plan       string    REQUIRED  Path to the plan file under review
 *                                  (`PHASE/<NN>-<MM>-PLAN.md`).
 *   lenses     string[]  optional  Subset of ["eng","design","devex","goal-backward"].
 *                                  Defaults to all four. Unknown names are dropped with a
 *                                  log line. There is intentionally no `ceo`/scope lens.
 *   context    string[]  optional  Extra paths every reviewer should read (goal/roadmap
 *                                  docs, decisions/CONTEXT docs, CLAUDE.md, DESIGN.md,
 *                                  requirements, codebase directories). Passed through
 *                                  verbatim — this is `plan-reviewer`'s own optional
 *                                  `context` input.
 *   reportDir  string    optional  Directory for the per-lens report files. Omit to let
 *                                  `plan-reviewer` use its documented default,
 *                                  `PHASE/reviews/<plan>.<lens>-review.md`.
 *   agentType  string    optional  Subagent type to dispatch. Default "plan-reviewer".
 *                                  See AGENT RESOLUTION below.
 *
 * AGENT RESOLUTION — UNVERIFIED, read this before running. Dispatch goes through
 * `opts.agentType` so that `agents/plan-reviewer.md` stays the single source of truth for
 * review methodology; the prompt built below carries ONLY that agent's documented
 * *inputs*, and deliberately does not duplicate its procedure or output contract. What I
 * could not verify from this repo is how a *plugin-namespaced* agent resolves by type —
 * dev-kit is a marketplace source, not an installed plugin here, and this is the first
 * Workflow script in the corpus, so there is no precedent to copy. If the bare
 * "plan-reviewer" type does not resolve in a given install, pass the plugin-qualified
 * form: `agentType: "dev-kit-core:plan-reviewer"`.
 *
 * NO WORKTREE. `isolation:'worktree'` is deliberately not used. Each reviewer reads the
 * plan and the codebase read-only and writes exactly one report file at a lens-unique
 * path, so there is no concurrent mutation to isolate. A worktree would additionally
 * strand those report files off the main tree, buying a merge step for no benefit.
 */

export const meta = {
  name: "plan-review",
  description:
    "Fan out one plan-reviewer agent per review lens over a single plan file, then consolidate the per-lens verdicts and findings.",
  phases: [
    { title: "Lens fan-out", detail: "one plan-reviewer per selected lens, in parallel" },
    { title: "Consolidate", detail: "sum counts, worst verdict wins, sort findings by severity" },
  ],
};

// lens -> lens skill id. Read from disk, not guessed: each id below matches the `name:`
// frontmatter of plugins/dev-kit-core/skills/<id>/SKILL.md. `plan-reviewer` resolves
// `skills/plan-review-<lens>/SKILL.md` itself; this map exists so an unknown lens is
// rejected here instead of being dispatched into a missing-skill failure.
const LENS_SKILL = {
  eng: "plan-review-eng",
  design: "plan-review-design",
  devex: "plan-review-devex",
  "goal-backward": "plan-review-goal-backward",
};
const ALL_LENSES = ["eng", "design", "devex", "goal-backward"];

// Mirrors `plan-reviewer`'s documented "Final response" (report path, verdict,
// completeness score, findings-by-severity count, top 3 findings) and its findings-table
// columns. This is that agent's shape, not a competing one. `completeness` is a string
// because the contract allows "N/A" when a lens declares the plan out of its scope.
const LENS_RESULT_SCHEMA = {
  type: "object",
  properties: {
    reportPath: { type: "string" },
    // BLOCKED is a distinct verdict in `plan-reviewer`'s own output contract — the review
    // could not be performed at all (unresolved `PHASE`, missing lens skill file), not a
    // quality judgment. It MUST be a valid enum value here: rejecting it at the schema
    // boundary would make a lens's "I could not determine this" collapse into the generic
    // "COVERAGE GAP: agent failed or was skipped" path below, which is exactly the kind of
    // silent indeterminate-outcome loss this contract exists to prevent.
    verdict: { type: "string", enum: ["APPROVE", "APPROVE-WITH-CHANGES", "REVISE", "BLOCKED"] },
    completeness: { type: "string" },
    counts: {
      type: "object",
      properties: {
        BLOCKER: { type: "integer" },
        MAJOR: { type: "integer" },
        MINOR: { type: "integer" },
      },
      required: ["BLOCKER", "MAJOR", "MINOR"],
    },
    topFindings: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["BLOCKER", "MAJOR", "MINOR"] },
          location: { type: "string" },
          issue: { type: "string" },
          fix: { type: "string" },
        },
        required: ["severity", "location", "issue", "fix"],
      },
    },
  },
  required: ["reportPath", "verdict", "completeness", "counts", "topFindings"],
};

const plan = args.plan;
if (!plan) {
  throw new Error("plan-review workflow: `plan` arg is required (path to the plan file).");
}

const requested =
  Array.isArray(args.lenses) && args.lenses.length > 0 ? args.lenses : ALL_LENSES;
const lenses = [];
for (const lens of requested) {
  if (LENS_SKILL[lens]) lenses.push(lens);
  else log(`Dropping unknown lens "${lens}" — valid lenses: ${ALL_LENSES.join(", ")}.`);
}
if (lenses.length < 2) {
  throw new Error(
    `plan-review workflow: needs 2 or more valid lenses (got ${lenses.length}). ` +
      "A single-lens review is a plain inline Agent call, not a Workflow.",
  );
}

const contextPaths = Array.isArray(args.context) ? args.context : [];
const planName = plan.split("/").pop();

function reportPath(lens) {
  return args.reportDir
    ? `${args.reportDir.replace(/\/+$/, "")}/${planName}.${lens}-review.md`
    : null;
}

// Inputs only — `plan-reviewer.md` owns the procedure and the output contract.
function dispatchPrompt(lens) {
  const lines = [
    `Review one plan through exactly one lens. Lens skill: \`${LENS_SKILL[lens]}\`.`,
    "",
    "Inputs:",
    `- plan: ${plan}`,
    `- lens: ${lens}`,
  ];
  if (contextPaths.length > 0) lines.push(`- context: ${contextPaths.join(", ")}`);
  const report = reportPath(lens);
  if (report) lines.push(`- report: ${report}`);
  lines.push(
    "",
    "Follow your own Procedure and Output contract exactly, at full depth. Do not review " +
      "through any other lens. You are non-interactive: never wait for a user.",
  );
  return lines.join("\n");
}

phase("Lens fan-out");
log(`Reviewing ${plan} through ${lenses.length} lenses: ${lenses.join(", ")}.`);

const agentType = args.agentType || "plan-reviewer";
const raw = await parallel(
  lenses.map((lens) => () =>
    agent(dispatchPrompt(lens), {
      label: `plan-review:${lens}`,
      phase: "Lens fan-out",
      agentType,
      schema: LENS_RESULT_SCHEMA,
    }),
  ),
);

// A dropped lens is a coverage gap, never a silent one.
const reviews = [];
raw.forEach((result, i) => {
  if (result) reviews.push({ lens: lenses[i], ...result });
  else
    log(
      `COVERAGE GAP: the "${lenses[i]}" lens returned nothing (agent failed or was ` +
        "skipped). This plan has NOT been reviewed through that lens — re-run it before " +
        "trusting the consolidated result.",
    );
});
if (reviews.length === 0) {
  throw new Error("plan-review workflow: every lens failed; nothing to consolidate.");
}

phase("Consolidate");

// Consolidation is plain JS, not a final agent() synthesis stage, because every step of it
// is mechanical: sum the per-severity counts, take the worst verdict, sort the surfaced
// findings by severity. Cross-lens dedup is deliberately NOT attempted — the four lenses
// are disjoint by construction (architecture/tests vs. design vs. DX vs. goal coverage),
// so merging near-duplicates would destroy lens attribution rather than reduce noise. A
// model call here would only restate what the numbers already say, and the user-facing
// verdict and next step belong to the caller anyway, not to this script.
const SEVERITY_RANK = { BLOCKER: 0, MAJOR: 1, MINOR: 2 };
// BLOCKED outranks REVISE as "worst": a blocked lens means that lens's finding-quality is
// unknown, not merely bad, so it must dominate the aggregate rather than be out-ranked by
// (and disappear behind) an ordinary REVISE from another lens.
const VERDICT_RANK = { BLOCKED: -1, REVISE: 0, "APPROVE-WITH-CHANGES": 1, APPROVE: 2 };

const totals = { BLOCKER: 0, MAJOR: 0, MINOR: 0 };
for (const r of reviews) {
  totals.BLOCKER += r.counts.BLOCKER || 0;
  totals.MAJOR += r.counts.MAJOR || 0;
  totals.MINOR += r.counts.MINOR || 0;
}

// Worst verdict wins, which is the same rule `plan-reviewer` applies per lens, lifted to
// the panel: any REVISE sinks the plan, else any APPROVE-WITH-CHANGES.
const aggregateVerdict = reviews
  .map((r) => r.verdict)
  .reduce((worst, v) => (VERDICT_RANK[v] < VERDICT_RANK[worst] ? v : worst), "APPROVE");

const findings = reviews
  .flatMap((r) => r.topFindings.map((f) => ({ ...f, lens: r.lens })))
  .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

const blockedLenses = reviews.filter((r) => r.verdict === "BLOCKED").map((r) => r.lens);

const out = [
  `# Plan Review — consolidated (${reviews.length}/${lenses.length} lenses)`,
  `Plan: ${plan}`,
  `Aggregate verdict: ${aggregateVerdict}`,
  `Findings: ${totals.BLOCKER} BLOCKER / ${totals.MAJOR} MAJOR / ${totals.MINOR} MINOR`,
  ...(blockedLenses.length > 0
    ? [
        `BLOCKED lenses (dispatch defect, not reviewed): ${blockedLenses.join(", ")} — ` +
          "see each one's Verdict paragraph in its report file for the exact defect.",
      ]
    : []),
  "",
  "## Per lens",
  ...reviews.map(
    (r) =>
      `- ${r.lens}: ${r.verdict} | completeness ${r.completeness} | ` +
      `${r.counts.BLOCKER}B/${r.counts.MAJOR}Ma/${r.counts.MINOR}Mi | ${r.reportPath}`,
  ),
  "",
  "## Surfaced findings (severity order)",
  ...(findings.length > 0
    ? findings.map((f) => `- [${f.severity}][${f.lens}] ${f.location} — ${f.issue} → ${f.fix}`)
    : ["- none"]),
];
// The per-lens report files on disk are the durable artifact; this block is the roll-up.
log(out.join("\n"));

// Returned to the caller, which states the user-facing verdict and next step. `coverage`
// is here so a lens that failed cannot be mistaken for a lens that found nothing:
// requested > returned means the aggregate verdict is provisional.
return {
  plan,
  aggregateVerdict,
  totals,
  coverage: { requested: lenses.length, returned: reviews.length },
  missingLenses: lenses.filter((l) => !reviews.some((r) => r.lens === l)),
  // Distinct from `missingLenses`: a missing lens never returned; a BLOCKED lens returned
  // and reported that it could not review at all (dispatch defect). Both must read as "do
  // not trust this panel as clean" — neither may collapse into the other.
  blockedLenses,
  lenses: reviews.map((r) => ({
    lens: r.lens,
    verdict: r.verdict,
    completeness: r.completeness,
    counts: r.counts,
    reportPath: r.reportPath,
  })),
  findings,
};
