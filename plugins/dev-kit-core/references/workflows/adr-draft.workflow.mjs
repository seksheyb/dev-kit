/**
 * adr-draft — one drafting agent per ADR, in parallel, each writing its own disjoint
 * `docs/global/architecture/adr/NNNN-<slug>.md` file.
 *
 * Invoked by `skills/architecture-designer/SKILL.md` "Parallel ADR drafting" whenever the
 * fixed decision list implies 2 or more ADRs — the routing table in that section makes the
 * Workflow route mandatory at that point. Exactly 1 decision never reaches here: the skill
 * drafts solo with a plain inline `Agent` call instead, because a Workflow for one agent is
 * pure overhead.
 *
 * PROMPT STRATEGY: ORCHESTRATOR-PRE-RENDERED, mirroring `bugfix-wave.workflow.mjs`. The
 * skill's own turn assigns every NNNN number up front (so the output files are disjoint by
 * construction), picks the ONE decision each drafting agent owns, and renders the complete
 * drafting prompt — requirements summary, the decision, and `references/adr-template.md`
 * content or pointer — before calling `Workflow`. This script passes each `prompt` string
 * through untouched and writes no prompt text of its own: anything missing from the
 * rendered template is missing from the dispatch, and this script cannot patch it up.
 *
 * THIS SCRIPT CONTAINS ZERO JUDGMENT. Which decisions need ADRs, what number each gets,
 * and what each drafting prompt says are all decided in the skill's turn before this call;
 * `args.adrs` is that output verbatim. This script only fans the dispatch out, validates
 * shape (non-empty, 2+, unique NNNN), and reports per-ADR status back — it never reads or
 * writes an ADR file itself, and never assembles or touches SDD.md / ARCHITECTURE.md. That
 * synthesis pass stays single-writer in the skill's own turn, after this returns, because
 * two concurrent writers to one SDD is exactly the hazard this fan-out shape avoids.
 *
 * NO WORKTREE. Every drafting agent writes to its own NNNN-<slug>.md path, disjoint by
 * construction (the skill assigned the numbers up front) — no two dispatches ever touch the
 * same file, and nothing here commits to git. There is nothing for `isolation: 'worktree'`
 * to isolate.
 *
 * args contract
 * -------------
 *   adrs: [                       REQUIRED. 2 or more entries — see "throws" below.
 *     {
 *       nnnn:   string            REQUIRED. Zero-padded ADR number assigned in the skill's
 *                                 turn, e.g. "0007". Must be unique across the array; used
 *                                 both as the agent label and to detect collisions before
 *                                 any dispatch.
 *       title:  string            REQUIRED. Short decision title, e.g. "Use PostgreSQL for
 *                                 Order Storage". Log/label text only — the prompt already
 *                                 carries whatever framing the skill wants.
 *       prompt: string            REQUIRED. The fully-rendered drafting prompt — requirements
 *                                 summary, the one decision this agent owns, the ADR
 *                                 template, and the exact output path
 *                                 (docs/global/architecture/adr/NNNN-<slug>.md). Passed
 *                                 through untouched.
 *     }
 *   ]
 *
 * Throws before any dispatch when `adrs` is missing, has fewer than 2 entries, has an
 * entry missing nnnn/title/prompt, or has a duplicate nnnn — all signal a malformed
 * upstream contract, never a mid-run failure.
 *
 * Returns: { drafted, blocked, dropped, totals } — see the bottom of this file.
 *
 * MODEL/EFFORT ROUTING (Surface B). model/effort routing is decided caller-side by
 * `model-route.mjs` and arrives as `args.routing` data — this script never
 * picks a model or effort itself. `args.routing?.['adr-drafter']` (optional `{model, effort}`)
 * is spread into every drafting agent's opts before the always-set `label`/`phase`/`schema`
 * keys; an absent `routing` or an absent `adr-drafter` entry leaves both keys absent, which
 * means inherit — never a guessed default.
 */

export const meta = {
  name: "adr-draft",
  description:
    "One ADR-drafting agent per decision, in parallel; each writes its own disjoint docs/global/architecture/adr/NNNN-<slug>.md file.",
  whenToUse:
    "2 or more decisions -> Workflow route (mandatory). Exactly 1 decision -> plain inline Agent call; a Workflow for one agent is pure overhead. Synthesis (SDD.md / ARCHITECTURE.md) is never dispatched here — it stays single-writer in the skill's own turn.",
  phases: [{ title: "ADR drafting", detail: "one drafting agent per ADR, in parallel" }],
};

// The drafting agent's documented return: confirmation that its one file was written,
// plus the path so the skill's synthesis pass can reference it without re-deriving the
// slug. Kept deliberately small — the ADR content itself lives only in the file on disk.
// `outcome` (not `status`) is deliberate: the ADR document itself has its own `## Status`
// field (Proposed | Accepted | Deprecated | Superseded by ADR-XXX). This field is the
// dispatch outcome, not the ADR's Status — the two must never be confused when read back.
const ADR_DRAFT_SCHEMA = {
  type: "object",
  properties: {
    nnnn: { type: "string", description: "verbatim nnnn this dispatch was assigned" },
    path: { type: "string", description: "path the ADR file was written to, e.g. docs/global/architecture/adr/0007-use-postgresql.md" },
    outcome: { type: "string", enum: ["written", "blocked"], description: "dispatch outcome, not the ADR's own Status field: 'written' once the file exists with real content; 'blocked' if the agent could not complete drafting (e.g. missing context it needed)" },
    note: { type: "string", description: "when outcome is 'blocked', the one-line reason. Empty or omitted when outcome is 'written'." },
  },
  required: ["nnnn", "path", "outcome"],
};

const adrs = Array.isArray(args.adrs) ? args.adrs : [];

if (adrs.length < 2) {
  throw new Error(
    `adr-draft workflow: needs 2 or more ADR entries in args.adrs (got ${adrs.length}). ` +
      "A single ADR is a plain inline Agent call, not a Workflow.",
  );
}

const malformed = adrs.filter((a) => !a || !a.nnnn || !a.title || !a.prompt);
if (malformed.length > 0) {
  throw new Error(
    `adr-draft workflow: ${malformed.length} entr(y/ies) in args.adrs missing nnnn, title, or prompt — every field is assigned/rendered in the skill's turn before this call`,
  );
}

const badNnnn = adrs.filter((a) => typeof a.nnnn !== "string" || !/^\d{4}$/.test(a.nnnn));
if (badNnnn.length > 0) {
  throw new Error(
    `adr-draft workflow: ${badNnnn.length} entr(y/ies) in args.adrs have a non-string or non-zero-padded-4-digit nnnn (got ${badNnnn.map((a) => JSON.stringify(a.nnnn)).join(", ")}) — nnnn must be a string like "0007"`,
  );
}

const seen = new Set();
const duplicates = new Set();
for (const a of adrs) {
  if (seen.has(a.nnnn)) duplicates.add(a.nnnn);
  seen.add(a.nnnn);
}
if (duplicates.size > 0) {
  throw new Error(
    `adr-draft workflow: duplicate nnnn value(s) in args.adrs: ${[...duplicates].join(", ")} — NNNN numbers must be assigned uniquely in the skill's turn before dispatch`,
  );
}

phase("ADR drafting");
log(`Drafting ${adrs.length} ADR(s) in parallel: ${adrs.map((a) => `${a.nnnn}-${a.title}`).join(", ")}`);

const raw = await parallel(
  adrs.map((adrItem) => () =>
    agent(adrItem.prompt, {
      ...(args.routing?.["adr-drafter"] ?? {}),
      label: `adr:${adrItem.nnnn}`,
      phase: "ADR drafting",
      schema: ADR_DRAFT_SCHEMA,
    }),
  ),
);

// A dropped ADR is a coverage gap, never a silent success. Absence of a result must never
// be read as "this ADR got written" — the skill's synthesis pass needs to know exactly
// which ADRs it can safely reference from SDD.md / ARCHITECTURE.md.
const drafted = [];
const dropped = [];
raw.forEach((result, i) => {
  const source = adrs[i];
  if (result) {
    drafted.push({ ...result, nnnn: source.nnnn, title: source.title });
    if (result.nnnn !== source.nnnn) {
      log(
        `MISMATCH: ADR ${source.nnnn} (${source.title}) — the agent self-reported nnnn "${result.nnnn}", which was overridden with the caller-assigned "${source.nnnn}". This may mean the agent wrote its file at the wrong path; verify ${result.path || "(no path reported)"}.`,
      );
    }
  } else {
    dropped.push({ nnnn: source.nnnn, title: source.title });
    log(
      `COVERAGE GAP: ADR ${source.nnnn} (${source.title}) was NOT drafted — the agent died, was skipped, or its output failed schema validation. Its file may or may not exist on disk; do not reference it from SDD.md / ARCHITECTURE.md until re-dispatched and confirmed.`,
    );
  }
});

// Distinct from `dropped`: a unit that returned but self-reported it could not finish.
// Never conflated with a died/skipped unit — the file path here is a real (if incomplete)
// artifact to look at, not an absence.
const blocked = drafted.filter((d) => d.outcome === "blocked");
for (const b of blocked) {
  log(
    `ADR ${b.nnnn} (${b.title}) returned BLOCKED: ${b.note || "no reason given"}. Path reported: ${b.path || "(none)"}.`,
  );
}

if (drafted.length === 0) {
  throw new Error("adr-draft workflow: every drafting agent failed or was skipped; no ADRs were written.");
}

const written = drafted.filter((d) => d.outcome === "written");

log(
  `Done: ${written.length}/${adrs.length} ADR(s) written, ${blocked.length} blocked, ${dropped.length} coverage gap(s). Synthesis (SDD.md / ARCHITECTURE.md assembly, referencing these ADRs) is the skill's next turn.`,
);

return {
  // Every drafting result that came back, verbatim (nnnn, title, path, outcome, note).
  // Includes both 'written' and 'blocked' entries — filter on `outcome`, or use `blocked`
  // below, rather than assuming every entry in `drafted` is safe to reference.
  drafted,
  // Subset of `drafted` with outcome === 'blocked', named separately so a caller reading
  // this field cannot pick up an incomplete ADR by mistake.
  blocked,
  // ADRs with NO result at all (agent died, was skipped, or failed schema validation).
  // Named separately from `drafted` so a coverage gap can never merge with, or be mistaken
  // for, a returned BLOCKED outcome.
  dropped,
  totals: {
    requested: adrs.length,
    written: written.length,
    blocked: blocked.length,
    dropped: dropped.length,
  },
};
