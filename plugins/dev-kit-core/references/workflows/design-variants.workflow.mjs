/**
 * design-variants — one subagent per competing visual direction in a Variant Shotgun run.
 *
 * Invoked by `skills/design-consultation/SKILL.md`'s "Variant Shotgun mode" whenever the
 * confirmed concept count is 2 or more. A single-variant request is not Shotgun mode at
 * all — it is an ordinary Phase 3-5 proposal, dispatched inline with a plain Agent call.
 *
 * THIS SCRIPT CONTAINS ZERO JUDGMENT. Context gathering (5 dimensions), concept naming and
 * anti-convergence checking, the operator's model-selection answer, and the full rendered
 * subagent prompt (Claude Design binding/project id, approved tokens or concept brief,
 * `.dc.html` delivery instructions, the self-gate embarrassment check, the deliverable
 * contract) all happen in the orchestrator's own turn before this call, per
 * `@references/claude-design-mcp-protocol.md` and the skill's own Variant Shotgun section.
 * `args` is that output verbatim. This script only fans the rendered prompts out in
 * parallel and reports back which variants came back and which didn't — it builds no
 * prompt text, makes no design or model choice, and does not build the comparison board.
 * The comparison-board join is the orchestrator's turn, after this script returns.
 *
 * ── OPERATOR PASSTHROUGH, NOT A PIN ──────────────────────────────────────────────────
 * `args.operatorModel` is the model the *operator* (the human, via the protocol's Step 1
 * question) chose for this invocation — every variant in the run uses the same answer, so
 * it is a single top-level arg, not a per-variant field. When present, it is passed through
 * to `agent()`'s `model` option verbatim; when absent, `model` is omitted entirely so the
 * dispatch inherits the session model, and `args.routing['variant-builder']`'s model (if any)
 * applies instead. This script itself never invents `effort` — the only `effort` that can
 * reach a dispatch is whatever `args.routing['variant-builder']` carries (see MODEL/EFFORT
 * ROUTING below).
 *
 * ── NO WORKTREE ──────────────────────────────────────────────────────────────────────
 * Every variant subagent works entirely inside the shared Claude Design MCP project (its
 * own `.dc.html` file, no shared file touched by more than one variant) — there is no git
 * checkout, branch, or local file for this fan-out to race on, so `isolation: 'worktree'`
 * would buy nothing here.
 *
 * ── args contract ────────────────────────────────────────────────────────────────────
 * {
 *   variants: [                     REQUIRED. 2..8 entries — the confirmed concept list.
 *     {
 *       name:   string              REQUIRED. Concept label, e.g. "A" or "Brutalist-Raw".
 *                                   Used as the agent label in the progress display and to
 *                                   key the returned result back to its concept.
 *       prompt: string              REQUIRED. The fully-rendered subagent prompt for this
 *                                   variant — Claude Design project id/binding, the
 *                                   concept's approved brief or tokens, `.dc.html` delivery
 *                                   steps, the verify loop, the self-gate check, and the
 *                                   exact deliverable contract (variant name, file, status,
 *                                   open_url). Passed through untouched; the script writes
 *                                   no prompt text of its own.
 *     }
 *   ],
 *   operatorModel: "sonnet" | "opus" | "fable"   optional. The operator's Step-1 model
 *                                   choice for this run, per
 *                                   claude-design-mcp-protocol.md. Applied identically to
 *                                   every variant. Omit to inherit the session model.
 * }
 *
 * Returns: { variants[], dropped[], blocked[] } — see the bottom of this file. `variants`
 * feeds the orchestrator's comparison-board build; `dropped` and `blocked` are two
 * separately-named failure lists that must never be conflated with each other or with a
 * successful variant.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['variant-builder']` (optional `{model,
 * effort}`) is spread into every variant's opts BEFORE `operatorModel`, so the operator's own
 * explicit Step-1 model choice keeps outranking the router (model-routing.md §7's precedence
 * note); an absent `routing` or an absent `variant-builder` entry leaves both keys absent,
 * which means inherit — never a guessed default.
 */

export const meta = {
  name: "design-variants",
  description:
    "Dispatches one subagent per competing Variant Shotgun concept, each writing its own .dc.html file in the shared Claude Design project, and reports back which variants came back clean, which self-reported blocked, and which returned nothing.",
  whenToUse:
    "Called by design-consultation's Variant Shotgun mode once concepts are confirmed and the count is 2 or more. A single-variant request is not Shotgun mode at all and is dispatched inline instead.",
  phases: [{ title: "Variant fan-out", detail: "one subagent per competing concept, in parallel" }],
};

// Mirrors the deliverable contract the orchestrator's rendered prompt asks each variant
// subagent to return (claude-design-mcp-protocol.md Step 2's "deliverable(s) expected
// back", plus a status field so a self-gate failure is distinguishable from a clean run).
// `status: "blocked"` is a legitimate outcome the agent itself reports — e.g. it could not
// clear the embarrassment self-gate after retries, or Claude Design's own verify loop
// (render -> gate -> design-verifier -> act) never converged — not the same thing as the
// agent dying or returning malformed output, which shows up in `dropped` below instead.
const VARIANT_RESULT_SCHEMA = {
  type: "object",
  required: ["variant", "file", "status"],
  properties: {
    variant: { type: "string", description: "concept name/label, verbatim from the prompt" },
    file: { type: "string", description: "the .dc.html file this variant wrote in the shared project" },
    status: {
      type: "string",
      enum: ["ok", "blocked"],
      description:
        "\"ok\" only if the variant cleared its self-gate and Claude Design's verify loop. \"blocked\" is a real, reportable outcome, not a failure to hide.",
    },
    open_url: {
      type: "string",
      description: "Claude Design open_url for this variant (never serve_url). Present when status is \"ok\".",
    },
    blocked_reason: {
      type: "string",
      description: "one-line reason when status is \"blocked\". Empty or omitted when status is \"ok\".",
    },
    notes: {
      type: "string",
      description: "optional one-line note for the comparison board (e.g. a deliberate departure from the concept brief).",
    },
  },
};

const variants = Array.isArray(args.variants) ? args.variants : [];

// Fail loudly and early rather than dispatching agents against a malformed contract.
if (variants.length < 2 || variants.length > 8) {
  throw new Error(
    `design-variants workflow: needs 2..8 variants (got ${variants.length}). A single-variant ` +
      "request is not Shotgun mode — dispatch it inline instead. Above 8, split concepts across " +
      "separate runs.",
  );
}
const malformed = variants.filter(
  (v) => !v || typeof v.name !== "string" || !v.name || typeof v.prompt !== "string" || !v.prompt
);
if (malformed.length > 0) {
  throw new Error(
    `design-variants workflow: ${malformed.length} variant(s) missing a required name or prompt — ` +
      "every field is rendered in the orchestrator's turn before this call.",
  );
}

phase("Variant fan-out");
log(
  `design-variants: dispatching ${variants.length} variant(s) — ${variants.map((v) => v.name).join(", ")}.` +
    (args.operatorModel ? ` Model: ${args.operatorModel} (operator choice).` : " Model: session default (inherited).")
);

const raw = await parallel(
  variants.map((v) => () => {
    const opts = {
      // model/effort routing, spread first so the operator passthrough below still wins —
      // see MODEL/EFFORT ROUTING in the header.
      ...(args.routing?.["variant-builder"] ?? {}),
      label: v.name,
      phase: "Variant fan-out",
      schema: VARIANT_RESULT_SCHEMA,
    };
    // Operator passthrough — never a pin, never defaulted by this script — and it outranks
    // args.routing per model-routing.md §7.
    if (args.operatorModel) opts.model = args.operatorModel;
    return agent(v.prompt, opts);
  })
);

const kept = [];
const dropped = [];
const blocked = [];

raw.forEach((result, i) => {
  const name = variants[i].name;
  if (!result) {
    dropped.push({ variant: name });
    log(
      `COVERAGE GAP: variant "${name}" returned nothing (agent failed, was skipped, or its output ` +
        "failed schema validation). This concept is NOT in the comparison board unless re-dispatched."
    );
    return;
  }
  if (result.status === "blocked") {
    blocked.push({ variant: name, file: result.file, reason: result.blocked_reason || "no reason given" });
    log(
      `Variant "${name}" self-reported BLOCKED (${result.blocked_reason || "no reason given"}). ` +
        "It has a file on disk but did not clear its self-gate or verify loop — treat it as " +
        "not-yet-presentable, not as a clean option for the comparison board."
    );
    return;
  }
  kept.push(result);
});

// Throw only when NOTHING came back at all — every returned variant, including a blocked
// one, is a real result the orchestrator can act on (re-dispatch it, or present the run
// with that concept plainly missing). A blocked-but-returned run is not the same failure
// as an all-dead fan-out.
if (dropped.length === variants.length) {
  throw new Error(
    "design-variants workflow: every variant returned nothing — no file, no self-report, nothing to " +
      "hand to the comparison-board build. Check the dropped logs above."
  );
}

if (kept.length === 0) {
  log(
    `design-variants: every returned variant self-reported BLOCKED (${blocked.length} blocked, ${dropped.length} dropped ` +
      `of ${variants.length}). No clean variant for the comparison board — re-dispatch the blocked ones before ` +
      "presenting, or present the run with those concepts plainly missing."
  );
} else {
  log(
    `Done: ${kept.length}/${variants.length} variant(s) clean, ${blocked.length} blocked, ${dropped.length} dropped. ` +
      "Comparison-board build is the orchestrator's next action."
  );
}

return {
  // Clean variants only — exactly what the orchestrator's comparison-board build should
  // embed. Each entry carries `variant`, `file`, `open_url`, and any `notes`.
  variants: kept,
  // Concepts whose agent returned nothing at all. Never conflated with `blocked` below —
  // a dropped concept has no file and no self-report; a blocked one does.
  dropped,
  // Concepts whose agent ran to completion and self-reported it could not clear its own
  // quality gate. Real output may exist on disk; it is deliberately excluded from
  // `variants` above.
  blocked,
};
