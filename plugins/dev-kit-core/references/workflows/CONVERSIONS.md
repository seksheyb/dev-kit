# Pending workflow conversions (2026-07-30 audit)

Inline fan-outs that violate this directory's own routing rule (README §1: 2+ units →
Workflow mandatory). Found by the corpus-wide swarm audit run after the `824fef6` script
pass — six of these were *created after* that pass by `4f63383` and `106f4ba`, three
predate it inside skill bodies, one (`ship`) was under-reported by the audit itself.

**Model/effort policy for these conversions:** scripts pin **nothing** — every opts builder
omits `model` and `effort` entirely (inherit session), per README §3, and that is what landed
in all nine. The column below records what each script actually does, not a recommendation:
"omit model and effort (inherit session)" means the file contains no `model:` and no `effort:`
key anywhere. The ONE exception is rows 6 and 7, where `args.operatorModel` — the model the
human picked in the owning skill's own Step 1 — is forwarded onto each dispatch when present.
That is an operator choice passed through from the caller's turn, not a pin, and it is the only
sanctioned model-shaped code path in the corpus. ~~Do not add any other one, and do not
"restore" an effort pin here: none was ever set.~~ **SUPERSEDED — see the 2026-07-30 note
below.**

**2026-07-30 — superseded by the model router.** The sentence struck above no longer holds.
The abstract model router (`references/model-routing.md`) now delivers `model`/`effort` as
DATA, via `args.routing = { role: {model?, effort?} }`, decided caller-side by
`plugins/dk/bin/model-route.mjs --batch` before the `Workflow` call (`model-routing.md` §7,
Surface B). Every script in this table still pins **nothing** itself — the routing value is
spread into each opts builder, and an absent `routing` (or absent role key) still leaves
`model`/`effort` absent, i.e. "inherit," exactly as before. Two things stay unchanged and
still outrank `args.routing`: the `operatorModel` passthrough in rows 6–7 (`design-batch`,
`design-variants`) keeps precedence — an operator's own explicit choice always wins over the
router's computed value (`model-routing.md` §7's precedence note) — and any dispatch site
that already hardcodes a model (e.g. `discovery-research.workflow.mjs`'s `advisor-researcher`
sonnet override) keeps that precedence too; routing fills only what those two leave absent.
The "stored recommendations" paragraph below is now realized, not merely stored: rows 1–3's
effort-**high** values are pinned as `effortFloor` entries in `complexity.config.json`'s
`agents` block (so those three scripts' gate-adjacent judgment can't be scored below high
regardless of what a lazily-written descriptor's signals would otherwise compute); rows 4–9's
effort-**medium** values are realized as call-site descriptor declarations (the caller states
`signals` per dispatch, the router bands them, `medium` is what a bounded, spec-in-hand
descriptor lands on — not a pin). Model stays `inherit` (T0) everywhere regardless, as
before.

| # | Conversion | Owning asset today (dispatch site) | Fans out over | Suggested script | Prompt strategy (README §2) | Isolation | Model/effort as landed | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | `final:gate` lane wave | `plugins/dk/commands/final/gate.md` (security half already via `security-gate.workflow.mjs`; UI/devex/compliance lanes inline beside it) | security-audit route + design-reviewer + devex-review + compliance-auditor (conditional roster, fixed by the four up-front operator answers) | `final-gate-lanes.workflow.mjs` | inputs-only (agents own their contracts); devex via skill self-injection | none — all lanes read-only in-tree (cross-check: do NOT worktree design-reviewer) | omit model and effort (inherit session) | **Landed** — `final-gate-lanes.workflow.mjs`; `plugins/dk/commands/final/gate.md` updated |
| 2 | `verify:phase` waves 1+2 | `plugins/dk/commands/verify/phase.md` (inline "ONE wave, one message", then converge ∥ nyquist) | verifier + eval-auditor (cond) + integration-checker (cond); internal barrier; then converge + nyquist-auditor (cond) | `verify-phase.workflow.mjs` (one script, two phases) | inputs-only; converge via skill self-injection (mirror `plan-gate.workflow.mjs`) | none — read-only / disjoint writers | omit model and effort (inherit session) | **Landed** — `verify-phase.workflow.mjs`; `plugins/dk/commands/verify/phase.md` and `verify/remediate.md` updated |
| 3 | `spec:phase` researcher pair | `plugins/dk/commands/spec/phase.md` ("dispatch domain-researcher and ai-researcher together in one message"; ui-checker beside when UI chain active) | domain-researcher + ai-researcher (+ ui-checker as conditional third) | `spec-research-pair.workflow.mjs` | inputs-only | none | omit model and effort (inherit session) | **Landed** — `spec-research-pair.workflow.mjs`; `plugins/dk/commands/spec/phase.md` updated |
| 4 | assumption-mapping VUBF fan-out | `skills/assumption-mapping/SKILL.md` §Parallel Extraction (one subagent per V/U/B/F category, single message) | 4 fixed categories, synthesis barrier before ranking | `assumption-map.workflow.mjs` | orchestrator-pre-rendered (skill owns the category prompts) | none — read-only extraction | omit model and effort (inherit session) | **Landed** — `assumption-map.workflow.mjs`; `skills/assumption-mapping/SKILL.md` updated |
| 5 | architecture-designer ADR drafting | `skills/architecture-designer/SKILL.md` "Parallel ADR drafting" (≥2 decisions, NNNN pre-assigned, synthesis stays single-writer) | one drafting agent per ADR | `adr-draft.workflow.mjs` | orchestrator-pre-rendered (skill assigns NNNN + decision context) | none — disjoint ADR files, synthesis in caller's turn | omit model and effort (inherit session) — cross-check overruled a sonnet suggestion | **Landed** — `adr-draft.workflow.mjs`; `skills/architecture-designer/SKILL.md` updated |
| 6 | design-html Batch Mode | `skills/design-html/SKILL.md` Batch Mode (N initial page builds, one message; refinement loop explicitly excluded — stays serial and human) | one page-builder per screen, orchestrator keeps the screens.json upsert | `design-batch.workflow.mjs` | orchestrator-pre-rendered (per-page Implementation Spec) | none — one shared file has one writer, in the caller's turn | omit effort; omit model EXCEPT the `args.operatorModel` passthrough — the operator's own Step-0 choice, forwarded onto each page dispatch when present, absent otherwise (inherit session) | **Landed** — `design-batch.workflow.mjs`; `skills/design-html/SKILL.md` updated |
| 7 | design-consultation Variant Shotgun | `skills/design-consultation/SKILL.md` Variant Shotgun mode (one subagent per competing variant, default 3, max 8) | N variants → independent `.dc.html` files, comparison-board join | `design-variants.workflow.mjs` | orchestrator-pre-rendered | none | omit effort; omit model EXCEPT the `args.operatorModel` passthrough — the operator's own Step-1 choice, forwarded onto each variant dispatch when present, absent otherwise (inherit session) | **Landed** — `design-variants.workflow.mjs`; `skills/design-consultation/SKILL.md` updated |
| 8 | `close:operate` SLO pair | `plugins/dk/commands/close/operate.md` ("dispatch sre-engineer and monitoring-expert together in one message") | fixed pair, after the performance-engineer barrier | `slo-review.workflow.mjs` | skill self-injection (both are dev-kit-infra skills) | none — read different data, write different outputs | omit model and effort (inherit session) — cross-check overruled a sonnet suggestion | **Landed** — `slo-review.workflow.mjs`; `plugins/dk/commands/close/operate.md` updated |
| 9 | ship Step 4+5 pair | `skills/ship/SKILL.md:71` ("Steps 4 and 5 dispatch together as two subagents in one message") | coverage-test writer + read-only plan-verifier, join before Step 6 | `ship-audit-pair.workflow.mjs` | orchestrator-pre-rendered | none — Step 4 is the pair's only writer | omit model and effort (inherit session). Weakest candidate: the join's stale-diff re-check (NOT-DONE items vs Step 4's commits) is caller-turn judgment — keep that judgment in the skill, script carries only the barrier | **Landed** — `ship-audit-pair.workflow.mjs`; `skills/ship/SKILL.md` updated |

**Stored recommendations for a future pinning decision (operator-held, deliberately NOT
applied):** if effort control is ever turned on for these scripts, the audit's stored values
were — rows 1–3 (`final-gate-lanes`, `verify-phase`, `spec-research-pair`): effort **high**
(gate-adjacent judgment); rows 4–9 (`assumption-map`, `adr-draft`, `design-batch`,
`design-variants`, `slo-review`, `ship-audit-pair`): effort **medium** (bounded,
spec-in-hand work). Model stays inherit (T0) everywhere regardless; rows 6–7 keep the
operator passthrough. These values would be passed from the caller's turn (per-call
`agent(…, {effort})` opts decided at the dispatch site), never written into the scripts.

Not a conversion: `verify:remediate`'s re-verify (`plugins/dk/commands/verify/remediate.md`)
stays **sequential** — `/dev-kit-core:verify` first, then the eval-auditor re-audit only if that
pass landed a BLOCKER. One unit at each dispatch point, so each is a plain inline `Agent` call
and §1 is satisfied without a script and without a carve-out. Do not re-phrase it as a
concurrent pair: 2 units in one message would make the Workflow route mandatory.

Every new script must satisfy the README §3 authoring checklist (static `meta.phases`,
ZERO-JUDGMENT header, module-scope schemas mirroring the agents' contracts, eager
validation, thunk layer, opts builder that **omits** absent model/effort, label+phase on
every call, COVERAGE GAP logging, separately-named failure lists, no
Date.now/Math.random/fs/import), and its owning asset gains the standard 2+/exactly-1
routing table. Update the §5 script index and the §4 isolation list when landing.
