export const meta = {
  name: 'kickoff-dedup-phased-sweep',
  description: 'Phase-gated sweep: roster prep + guard-the-three, universal per-asset sweep (Q1-Q5), PRD retirement, per-step KICKOFF rewrite',
  whenToUse: 'Executing docs/audits/kickoff-duplication-audit/roadmap-shortlisted-workflow.md items 1-6 as one phase-gated run',
  phases: [
    { title: 'Phase 0: Prep', detail: 'build full asset roster; guard the three unguarded clause-1 fixes (item 6 part 1)' },
    { title: 'Phase 1: Sweep', detail: 'one shard per asset, 5-question checklist' },
    { title: 'Phase 1: Verify', detail: 'adversarial verify of every file change' },
    { title: 'Phase 1: Sitemap', detail: 'apply collected sitemap extensions' },
    { title: 'Phase 1: Guards', detail: 'fold shard guard gaps into tier-schema-guards.sh' },
    { title: 'Phase 2: PRD retirement', detail: 'one contract decision, propagated + closure check' },
    { title: 'Phase 3: Step rewrites', detail: '16 KICKOFF step prompts to the six-category contract', model: 'opus' },
    { title: 'Phase 3: Verify', detail: 'keep-verifiers + exit criterion' },
  ],
}

// ---------------------------------------------------------------------------
// Config: repos, tier rosters, model/effort classification (sonnet..opus, medium..xhigh)
// ---------------------------------------------------------------------------
const DEVKIT = '/Users/sekshey/IdeaProjects/new-ADD-SDD-Initiator/dev-kit'
const AUDIT = DEVKIT + '/docs/audits/kickoff-duplication-audit'
// args may arrive as a JSON-encoded string depending on the caller — normalize before reading.
const ARGS = typeof args === 'string' ? JSON.parse(args) : args
const PIPE = ARGS && ARGS.pipelineRepo ? ARGS.pipelineRepo : null // devkit-pipeline repo path; Phase 3 blocked without it

const Q1_CORE = ['bugfix-wave', 'verifier', 'qa', 'debugger']
const Q1_STD = ['design-reviewer', 'doc-verifier', 'integration-checker', 'market-researcher', 'project-researcher', 'retro', 'ui-auditor']
const Q2_HEAVY = ['planner', 'roadmapper', 'architecture-designer', 'doc-synthesizer']
const Q2_STD = ['pattern-mapper', 'code-review-gate', 'codebase-mapper', 'doc-classifier', 'phase-researcher', 'research-synthesizer', 'ui-researcher', 'doc-conflict-engine']
const Q3_CONFIRMED = ['python-pro', 'flutter-expert', 'django-expert', 'csharp-developer', 'dotnet-core-expert', 'fastapi-expert', 'golang-pro', 'laravel-specialist', 'nestjs-expert', 'spring-boot-engineer', 'kotlin-specialist', 'react-native-expert', 'swift-expert', 'game-developer', 'salesforce-developer', 'angular-architect', 'javascript-pro', 'react-expert', 'typescript-pro', 'vue-expert-js', 'vue-expert', 'wordpress-pro', 'cli-developer', 'mcp-developer', 'embedded-systems']
const Q3_VERIFIED_NOT_NEEDED = ['cpp-pro', 'java-architect', 'php-pro', 'postgres-pro', 'rails-expert', 'rust-engineer', 'sql-pro', 'websocket-engineer', 'nextjs-developer', 'shopify-expert', 'atlassian-mcp', 'refactoring-specialist', 'security-reviewer', 'prompt-engineer', 'sre-engineer']

// Item 6 (findings contract) rosters — measured in roadmap-shortlisted-workflow.md item 6, not assumed.
const Q5_QA_AGENTS = ['accessibility-tester', 'code-review-gate', 'debugger', 'dependency-manager', 'design-reviewer', 'doc-synthesizer', 'doc-verifier', 'domain-researcher', 'eval-auditor', 'gate-plan-review', 'health-reporter', 'incident-responder', 'integration-checker', 'nyquist-auditor', 'penetration-tester', 'phase-researcher', 'plan-reviewer', 'project-researcher', 'qa', 'security-auditor', 'ui-auditor', 'ui-checker', 'verifier']
const Q5_REVIEW_ASSETS = ['cso', 'security-reviewer', 'spec-miner', 'the-fool', 'code-review-protocol', 'plan-review-design', 'plan-review-devex', 'plan-review-eng', 'plan-review-goal-backward', 'sdd-review-cto', 'spec-review-cpo', 'devex-review', 'bugfix-wave', 'sprint-execution', 'ship', 'plan-review', 'review']
const Q5_ROSTER = [...new Set([...Q5_QA_AGENTS, ...Q5_REVIEW_ASSETS])]
const Q5_ADVERSARIAL = ['the-fool', 'plan-review-goal-backward', 'bugfix-wave', 'sprint-execution', 'ship', 'code-review-protocol', 'security-auditor', 'penetration-tester', 'eval-auditor', 'verifier', 'nyquist-auditor', 'doc-verifier', 'integration-checker', 'code-review-gate']
const Q5_AGGREGATORS = ['code-review-gate', 'gate-plan-review', 'plan-review-design', 'plan-review-devex', 'plan-review-eng', 'plan-review-goal-backward', 'plan-review', 'review']

// ROADMAP single-asset defects still open (item 4 point 5) — resolved on the same visit.
// 1.14 (graphify) deliberately excluded: personal skill outside this repo, operator chose to skip.
const EXTRA_DEFECTS = {
  'pattern-mapper': 'EXTRA DEFECT ON THIS VISIT (ROADMAP.md 1.2 — read its row first): add a non-empty-input precondition guard to this agent (it must refuse/flag an empty or missing input set rather than emitting a hollow PATTERNS.md). The consumer-rename half of 1.2 is subsumed by your Q2 consumer-agnostic rewrite — do not re-add any named consumer.',
  'roadmapper': 'EXTRA DEFECT ON THIS VISIT (ROADMAP.md 1.4 — read its row first): this agent must CREATE the milestone REQUIREMENTS.md (including the traceability section, e.g. REQ-01 -> Phase 2) when it does not exist, not merely update an existing one — derive its path from the doc-sitemap per your Q1 work. Also remove the Setup->...->Polish worked example under "Good Phase Patterns" (D5). Item 2 (PRD retirement, next phase) depends on this landing, so treat it as in-scope, not optional.',
}

function tierOf(name) {
  const q5 = Q5_ROSTER.includes(name)
  if (Q1_CORE.includes(name)) return { tier: 'q1-core', model: 'sonnet', effort: 'xhigh', fixes: true, q5 }
  if (Q1_STD.includes(name)) return { tier: 'q1-std', model: 'sonnet', effort: 'high', fixes: true, q5 }
  if (Q2_HEAVY.includes(name)) return { tier: 'q2-heavy', model: 'opus', effort: 'high', fixes: true, q5 }
  if (Q2_STD.includes(name)) return { tier: 'q2-std', model: 'sonnet', effort: 'xhigh', fixes: true, q5 }
  if (q5) return { tier: 'q5-roster', model: 'sonnet', effort: 'high', fixes: 'q3q5', q5 }
  if (Q3_CONFIRMED.includes(name)) return { tier: 'q3-insert', model: 'sonnet', effort: 'medium', fixes: 'q3-only', q5 }
  return { tier: 'detect', model: 'sonnet', effort: 'medium', fixes: 'q3-only', q5 }
}
// Escalation fix tiers for hits discovered in shards without fix rights for that axis
const ESC_TIER = { q1: { model: 'sonnet', effort: 'high' }, q2: { model: 'sonnet', effort: 'xhigh' }, q5: { model: 'sonnet', effort: 'high' } }
const STEP_TIER = (s) => s === '08' ? { model: 'opus', effort: 'xhigh' } : ['02', '07', '10'].includes(s) ? { model: 'opus', effort: 'high' } : { model: 'opus', effort: 'medium' }

const CANONICAL_Q3_LINE = 'If this project\'s constitution (`docs/global/project/constitution.md`) declares a Test-First/TDD principle, load `test-driven-development` and defer to its red-green ordering — write the failing test for each unit before implementing it, superseding this workflow\'s own Test-step position. Otherwise, follow the order below as written.'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const ROSTER_SCHEMA = {
  type: 'object', required: ['assets'],
  properties: {
    assets: {
      type: 'array', items: {
        type: 'object', required: ['name', 'kind', 'rel_path'],
        properties: {
          name: { type: 'string' }, kind: { type: 'string', enum: ['skill', 'agent', 'command'] },
          rel_path: { type: 'string' }, scope: { type: 'string' },
          in_manifest: { type: 'boolean' }, steps: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const SHARD_SCHEMA = {
  type: 'object', required: ['asset', 'changed', 'q1', 'q2', 'q3', 'q4_prd_refs', 'q5', 'sitemap_gaps', 'guard_gaps', 'kickoff_cuts', 'escalate'],
  properties: {
    asset: { type: 'string' },
    changed: { type: 'boolean' },
    edits_summary: { type: 'string' },
    q1: { type: 'object', required: ['hit', 'fixed'], properties: { hit: { type: 'boolean' }, fixed: { type: 'boolean' }, notes: { type: 'string' } } },
    q2: { type: 'object', required: ['hit', 'fixed'], properties: { hit: { type: 'boolean' }, fixed: { type: 'boolean' }, notes: { type: 'string' } } },
    q3: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['inserted', 'not-needed', 'not-applicable'] }, reason: { type: 'string' } } },
    q4_prd_refs: { type: 'array', items: { type: 'string' } },
    q5: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['fixed', 'clean', 'hit-escalated', 'not-applicable'] }, clauses: { type: 'string' }, notes: { type: 'string' } } },
    sitemap_gaps: { type: 'array', items: { type: 'object', required: ['proposed_row'], properties: { path_pattern: { type: 'string' }, proposed_row: { type: 'string' } } } },
    guard_gaps: { type: 'array', items: { type: 'object', required: ['asset', 'check'], properties: { asset: { type: 'string' }, check: { type: 'string' } } } },
    kickoff_cuts: { type: 'array', items: { type: 'object', required: ['quote', 'steps'], properties: { quote: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, claim_ref: { type: 'string' } } } },
    escalate: { type: 'object', required: ['axis'], properties: { axis: { type: ['string', 'null'], enum: ['q1', 'q2', 'q5', null] }, evidence: { type: 'string' } } },
  },
}

const VERDICT_SCHEMA = {
  type: 'object', required: ['pass', 'problems'],
  properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } },
}

const STEP_SCHEMA = {
  type: 'object', required: ['step', 'rewritten', 'summary'],
  properties: { step: { type: 'string' }, rewritten: { type: 'boolean' }, summary: { type: 'string' }, cut_count: { type: 'number' }, kept_lines: { type: 'array', items: { type: 'string' } } },
}

const KEEP_SCHEMA = {
  type: 'object', required: ['pass', 'refuted_keeps'],
  properties: { pass: { type: 'boolean' }, refuted_keeps: { type: 'array', items: { type: 'string' } }, problems: { type: 'array', items: { type: 'string' } } },
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function shardPrompt(a, t) {
  const confirmedNote =
    t.tier === 'q1-core' || t.tier === 'q1-std' ? 'This asset is CONFIRMED to have a Q1 (path-axis) defect — fix it in this visit.'
    : t.tier === 'q2-heavy' || t.tier === 'q2-std' ? 'This asset is CONFIRMED to have a Q2 (named-consumer) defect — fix it in this visit.'
    : t.tier === 'q3-insert' ? 'This asset is CONFIRMED to need the Q3 constitution line — insert it in this visit.'
    : Q3_VERIFIED_NOT_NEEDED.includes(a.name) ? 'Q3 was already verified NOT needed for this asset (its test step runs existing suites / is not an authoring conflict) — re-confirm briefly, do not insert unless you find clear new evidence.'
    : t.tier === 'q5-roster' ? 'No Q1/Q2/Q3 axis is pre-confirmed for this asset, but it IS on the item-6 findings-contract roster — Q5 is the primary reason for this visit.'
    : 'No axis is pre-confirmed for this asset — this is a detection visit.'
  const q5Note = t.q5
    ? 'Q5 SCOPE: this asset IS on the item-6 findings-contract roster — apply Q5 in full.'
      + (Q5_ADVERSARIAL.includes(a.name) ? ' It is in the ADVERSARIAL class: check clause c3 hardest — an adversarial pass has THREE honest outcomes (refuted, survived-the-attempt, could-not-attempt); all three must be representable. A refutation that never ran must never read as "survived".' : '')
      + (Q5_AGGREGATORS.includes(a.name) ? ' It AGGREGATES other reviewers\' findings: check clause c4 hardest — per merged finding, the output must record WHICH reviewer claimed it and whether this asset re-verified it, so a confident wrong finding and an independently confirmed one stay distinguishable.' : '')
    : 'Q5 SCOPE: this asset is NOT on the item-6 roster — apply Q5 as cheap detection only (the measured roster is a floor, not a ceiling): if the asset declares no verdict/severity/confidence vocabulary at all, report q5 status "not-applicable" and move on.'
  const fixRules = t.fixes === true
    ? 'You MAY edit this asset\'s file(s) to apply Q1/Q2/Q3/Q5 fixes yourself.'
    : t.fixes === 'q3q5'
      ? 'You may apply Q3 and Q5 fixes yourself. If you find a Q1 or Q2 hit, do NOT fix it — report it via `escalate` (axis q1/q2) with concrete evidence (quote the offending lines).'
      : 'You may ONLY apply the Q3 insert yourself. If you find a Q1, Q2, or Q5 hit, do NOT fix it — report it via `escalate` (axis q1/q2/q5) with concrete evidence (quote the offending lines).'
  return [
    'You are one shard of a repo-wide per-asset sweep of the dev-kit repo at ' + DEVKIT + '. Work only on your assigned asset. Do NOT run git commit.',
    '',
    'ASSET: ' + a.name + ' (' + a.kind + ') at ' + DEVKIT + '/' + a.rel_path + (a.kind === 'skill' ? ' — also check sibling files in its skill directory (references/, scripts/).' : ''),
    'Audit context for this asset (read if present): ' + AUDIT + '/assets/' + a.name + '.md (brief), ' + AUDIT + '/findings/' + a.name + '.json and ' + AUDIT + '/verdicts/' + a.name + '.json (compiled KICKOFF claims).',
    confirmedNote,
    q5Note,
    fixRules,
    EXTRA_DEFECTS[a.name] ? '\n' + EXTRA_DEFECTS[a.name] + '\n' : '',
    'Read the asset fully, then answer ALL FIVE questions:',
    '',
    'Q1 — PATH AXIS: Does the asset require its caller to supply file paths (phrases like "caller specifies", "orchestrator supplies", "provided in your prompt")? FIX: derive default paths from the plugin\'s `references/doc-sitemap.md` plus ids (`<M>` milestone, `<NN>` phase, `<branch>`, round `n`); accept an explicitly-passed path ONLY as an override. Model to copy: `plugins/dev-kit-core/skills/converge` derives SPEC/PLAN/VERIFICATION/CONSTITUTION paths from `<NN>` alone. If the sitemap has no row for a path the asset needs (e.g. `PHASE/reviews/round-<n>/`), do NOT edit the sitemap — emit the missing row via `sitemap_gaps` and write the asset\'s derivation as if the row exists.',
    '',
    'Q2 — CONSUMER AXIS: Does the asset name a specific downstream skill/agent as the consumer of its output (e.g. a `<downstream_consumer>` block, "the planner will read this")? FIX: rewrite as a consumer-agnostic output-format contract — KEEP the format/quality bar (e.g. "cite concrete `file.ts:12-25` patterns, not abstract prose" and any section-by-section output shape), DROP the named-consumer table/identity. Nothing in the asset should point at a specific reader afterward. Beware the known regex trap: `the [a-z0-9-]+ (skill|agent|command)` over-matches prose — judge each mention in context; a mention of another asset as an INPUT source or invocation target is fine, only naming who CONSUMES its output is the defect.',
    '',
    'Q3 — CONSTITUTION AXIS (only for `scope: implementation` lane skills; otherwise report status "not-applicable"): Does the skill\'s own `## Core Workflow` numbered list AUTHOR tests at a position that conflicts with a Test-First/TDD ordering (a terminal/late "Test" step, zero TDD/red-green language)? Running an existing suite or a lint pass is NOT a conflict. FIX: insert exactly this line as a standalone paragraph directly AFTER the `## Core Workflow` numbered list and BEFORE the next section (do not renumber any steps):',
    '',
    '> ' + CANONICAL_Q3_LINE,
    '',
    'Q4 — PRD NORM: Does the asset reference or presuppose `docs/global/requirements/PRD.md` (or a global PRD concept)? Do NOT fix — list each reference (file:line + short quote) in `q4_prd_refs`. Empty array if none.',
    '',
    'Q5 — FINDINGS CONTRACT (item 6 in ' + AUDIT + '/roadmap-shortlisted-workflow.md — read that item if any clause is unclear): Does the asset declare a verdict, severity, or confidence vocabulary (BLOCKER/WARNING, PASS/FLAG/BLOCK, VERIFIED/TENTATIVE, pass-fail verdicts, confidence tiers)? If no: q5 status "not-applicable". If yes, check ALL FOUR clauses:',
    '  c1 — every declared tier has a FIELD TO LAND IN: an enum value, schema field, or template slot in the asset\'s OWN output format;',
    '  c2 — the tier reaches the EVIDENCE/detailed-findings section, not only the summary rollup;',
    '  c3 — "COULD NOT DETERMINE" is representable: an indeterminate outcome must not vanish or silently collapse into a determinate one;',
    '  c4 — an UPSTREAM SELF-REPORT is a floor, not a ceiling: any other asset\'s flag this asset consumes must be re-checked, or at minimum carried with provenance (who claimed it, was it re-verified).',
    'FIX (minimal only): add the missing enum value or template slot and wire the instruction that populates it — do NOT restructure the output format wholesale, and do NOT unify or rename vocabularies across assets (BLOCKER/WARNING vs PASS/FLAG/BLOCK etc. are all fine as-is). An asset already satisfying all four clauses is "clean" — record that and leave it alone; that is the correct outcome, not a gap. For EACH Q5 fix you apply, emit one `guard_gaps` entry: {asset, check} describing the regression assertion a guard script should make so the fix cannot silently revert.',
    '',
    'ALSO EMIT (all may be empty):',
    '- `sitemap_gaps`: doc-sitemap rows your Q1 fix needs that neither `plugins/dev-kit-core/references/doc-sitemap.md` nor `plugins/dev-kit-data-ai/references/doc-sitemap.md` has.',
    '- `guard_gaps`: one entry per Q5 fix applied (see Q5 above).',
    '- `kickoff_cuts`: KICKOFF.md lines/claims your fixes make cuttable. Use the compiled claims in findings/verdicts for this asset' + (a.steps && a.steps.length ? ' (this asset is invoked by KICKOFF step(s) ' + a.steps.join(', ') + ')' : '') + '. Quote the claim text and tag which step(s) it belongs to.',
    '',
    'Return the structured result. `changed` = true only if you actually edited a file.',
  ].join('\n')
}

function verifyPrompt(a, shard) {
  return [
    'Adversarial verification of a sweep fix in the dev-kit repo at ' + DEVKIT + '. Try to REFUTE the fix; default to failing it if uncertain. Read the asset file(s) at ' + DEVKIT + '/' + a.rel_path + ' as they are NOW. Do not edit anything.',
    '',
    'The shard reported: ' + JSON.stringify({ q1: shard.q1, q2: shard.q2, q3: shard.q3, q5: shard.q5, edits: shard.edits_summary }),
    'Sitemap rows the shard declared as pending extensions (treat derivations against these as acceptable): ' + JSON.stringify(shard.sitemap_gaps),
    '',
    'Check, as applicable to what was changed:',
    '1. Q1: default paths are genuinely DERIVED from the plugin doc-sitemap + ids; explicit path only as override; derivations match existing sitemap rows or the declared pending rows; no caller-must-supply phrasing survives.',
    '2. Q2: no named downstream consumer of the asset\'s output survives anywhere in the file; the format/quality bar and output shape were NOT lost — compare against git diff (`git -C ' + DEVKIT + ' diff -- <file>`), and fail if durable guidance was deleted rather than made consumer-agnostic.',
    '3. Q3: the canonical constitution line is present VERBATIM, positioned after the `## Core Workflow` numbered list, before the next section, with no renumbering; or was correctly judged not-needed/not-applicable.',
    '4. Q5: every tier the asset declares now has a field/enum value/template slot in its OWN output; the tier reaches the evidence section, not just the rollup; an indeterminate "could not determine" outcome is representable (for adversarial assets: refuted / survived / could-not-attempt all expressible); consumed upstream flags are re-checked or provenance-tagged. The edit was MINIMAL — fail if the output format was restructured wholesale or a vocabulary was renamed/unified without a defect behind it. If the shard claimed a Q5 fix, it must also have emitted a matching `guard_gaps` entry (it reported: ' + JSON.stringify(shard.guard_gaps || []) + ').',
    '5. Nothing unrelated in the file was damaged (check the diff for collateral edits).',
    'Return pass=true only if every applicable check holds; list concrete problems otherwise.',
  ].join('\n')
    + (a.name === 'verifier' ? '\n\nNOTE (operator re-fix): an earlier verify failed this asset for named-consumer (nyquist-auditor) framings of its own output — at the 6d heading, the test_fails classify line, the gap-record line, the decision-tree note, the VERIFICATION.md template requirement placeholder and Validation Gaps comment, and the completion checklist. The operator has rewritten each consumer-agnostically; the only remaining `nyquist-auditor` mention should be the Return-to-Orchestrator dispatch instruction, a legitimate invocation target. Judge the file as it stands NOW.' : '')
    + (a.name === 'plan-review-goal-backward' ? '\n\nNOTE (operator review): an earlier verify failed this asset SOLELY because the shard\'s guard_gaps JSON misdescribed the VERIFICATION PASSED template\'s section order (it said Suggestions sits between Skipped Dimensions and the closing line). The file itself and the substantive guard that actually landed — scripts/checks/tier-schema-guards.sh Check 13 — agree with each other: Suggestions (info) sits AHEAD of Skipped Dimensions in VERIFICATION PASSED, and Warnings -> Suggestions -> Skipped Dimensions in ISSUES FOUND; the script exits 0. Treat the prose wording of the shard\'s guard_gaps self-report as a typo, not a file defect: judge the file and Check 13 as they stand.' : '')
    + (a.name === 'doc-classifier' ? '\n\nNOTE (operator re-fix): an earlier verify failed this asset because the literal provenance sentence "Type supplied by manifest; not independently re-verified against content signals." appeared only in heuristic_classification while the write_output field-rules bullet merely paraphrased it. The operator has since placed the literal sentence in BOTH locations (grep -c now returns 2) and hardened scripts/checks/tier-schema-guards.sh Check 27 to assert the two-location count; the script exits 0. Judge the file and Check 27 as they stand NOW.' : '')
}

function stepPrompt(step, cuts, staleDraft) {
  return [
    'Rewrite ONE step prompt of KICKOFF.md in the devkit-pipeline repo at ' + PIPE + '. Dev-kit repo (assets, audit data) is at ' + DEVKIT + '. Do NOT run git commit. Work ONLY on step ' + step + '.',
    '',
    'Contract: read the six-category end-state contract and Milestone 5 instructions in ' + AUDIT + '/ROADMAP.md first. Every prompt block you write must pass the six-category test. Cut methodology-reteach, output-contract restatement, invocation boilerplate, and path strings — assets now derive their own paths from the doc-sitemap and own their own output contracts (the sweep already landed).',
    '',
    'Cut candidates for this step, emitted by the per-asset sweep (act-on-as-read; verify each against the live KICKOFF text before cutting):',
    JSON.stringify(cuts, null, 1),
    '',
    staleDraft
      ? 'PRIOR ART: ' + AUDIT + '/rewrites/' + staleDraft + ' drafted a rewrite for (part of) this step, but it is STALE — its cut list is still good input, its replacement text is NOT (it may contain path strings and premises that the sweep invalidated, e.g. step07\'s claim that the planner does not load PATTERNS.md is now false). Re-derive the replacement text from the post-sweep assets; do not ship the draft\'s text.'
      : (step === '11' || step === '15')
        ? 'PRIOR ART: ' + AUDIT + '/rewrites/ contains a clean draft for this step (step11-converge-sweep.md / step15-closeout-methodology.md) — no paths, no stale premises. Use it as the base and reconcile with the cut candidates above.'
        : 'No prior draft exists for this step.',
    '',
    'Rules: (a) C4 lesson — where one asset is invoked N times across steps, the per-site TIMING sentence differs and STAYS; only the description collapses to the invocation line. (b) C6 — keep/add one-word disambiguations (e.g. step 8 names guard\'s mode explicitly). (c) Cut any hardcoded TDD/test-first mandate ("write the failing tests first...") — lane skills now self-check the constitution; the step just names the appropriate lane skill. (d) Verify every KEEP against ' + AUDIT + '/verdicts/ and ' + AUDIT + '/findings/ — refutations concentrate in the keep direction. (e) One step only; do not touch other steps\' text.',
    '',
    'Return step id, whether you rewrote it, a summary of cuts/keeps, and the list of lines you deliberately KEPT that the cut candidates targeted (kept_lines).',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Phase 0 — Prep: guard-the-three (item 6 part 1, not gated on the sweep) + roster
// ---------------------------------------------------------------------------
phase('Phase 0: Prep')
log('Phase 0: guarding the three unguarded fixes + building the full asset roster')
const guardSeedP = agent([
  'Item 6 part 1 of ' + AUDIT + '/roadmap-shortlisted-workflow.md (read that item first): guard the three unguarded clause-1 fixes in the dev-kit repo at ' + DEVKIT + '. Do NOT run git commit.',
  'The fixes are already landed (see ROADMAP.md item 1.15\'s notes) in agents `doc-verifier` (UNVERIFIABLE representable against a formerly PASS/FAIL-only schema), `nyquist-auditor` (caveated pass representable, not just bare status green), and `integration-checker` (WARNING handled, not only WIRED/BROKEN) — but nothing stops a revert.',
  'Create `scripts/checks/tier-schema-guards.sh` following the conventions of the existing scripts in scripts/checks/ (read `ui-audit-severity-guards.sh` as the model; note `worktree-merge-safety-guards.sh` is unrelated in-flight work — do not touch it). One check per asset asserting the fixed tier-schema state.',
  'Verify BOTH directions per the repo convention: each check must pass against the current file AND demonstrably fail when the fix is reverted (test the fail direction against a scratch copy in /tmp or the scratchpad, never by editing the repo file). Run the script; it must exit 0.',
  'Return pass=true only if the script exists, covers all three assets, and exits 0; list problems otherwise.',
].join('\n'), { label: 'guard-the-three', phase: 'Phase 0: Prep', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'high' }).catch(() => null)

const rosterRes = await agent([
  'Build the complete asset roster of the dev-kit repo at ' + DEVKIT + '. Enumerate:',
  '1. Skills: every plugins/*/skills/*/SKILL.md (asset name = skill directory name). Read each SKILL.md frontmatter and record its `scope:` value if present (e.g. implementation, review, design).',
  '2. Agents: every plugins/*/agents/*.md (name = filename without .md).',
  '3. Commands: every plugins/*/commands/*.md (name = filename without .md).',
  'Then join against ' + AUDIT + '/MANIFEST.json `assets` array BY NAME (its file_path values are stale absolute paths from another machine — ignore them): set in_manifest=true and copy the `steps` array for matches; in_manifest=false, steps=[] otherwise.',
  'rel_path must be relative to the repo root (e.g. plugins/dev-kit-core/skills/converge/SKILL.md). Exclude anything under .claude/ or docs/. Return every asset — do not truncate.',
].join('\n'), { label: 'roster-build', phase: 'Phase 0: Prep', schema: ROSTER_SCHEMA, model: 'sonnet', effort: 'medium' })

// GATE 0
if (!rosterRes || !rosterRes.assets || rosterRes.assets.length < 150) {
  return { status: 'RED', failed_phase: 'Phase 0', reason: 'Roster build failed or implausibly small', roster_size: rosterRes ? (rosterRes.assets || []).length : 0 }
}
const roster = rosterRes.assets
log('Phase 0 GREEN: roster has ' + roster.length + ' assets (' + roster.filter(a => a.in_manifest).length + ' in MANIFEST); guard-the-three running in background. ' + (PIPE ? 'Pipeline repo: ' + PIPE : 'Pipeline repo NOT provided — Phase 3 will be reported BLOCKED.'))

// ---------------------------------------------------------------------------
// Phase 1 — Sweep: one shard per asset, then verify changes, then sitemap + guards
// ---------------------------------------------------------------------------
const shardResults = await pipeline(
  roster,
  (a) => {
    const t = tierOf(a.name)
    return agent(shardPrompt(a, t), { label: 'sweep:' + a.name, phase: 'Phase 1: Sweep', schema: SHARD_SCHEMA, model: t.model, effort: t.effort })
  },
  // Escalation: a shard found a Q1/Q2/Q5 hit it lacked fix rights for
  async (shard, a) => {
    if (!shard) return null
    if (shard.escalate && shard.escalate.axis) {
      const axis = shard.escalate.axis
      const et = ESC_TIER[axis]
      const t = { tier: axis + '-escalated', model: et.model, effort: et.effort, fixes: axis === 'q5' ? 'q3q5' : true, q5: axis === 'q5' ? true : tierOf(a.name).q5 }
      const fixed = await agent(
        shardPrompt(a, t) + '\n\nESCALATION CONTEXT — a detection shard already confirmed a ' + axis.toUpperCase() + ' hit with this evidence; fix it now:\n' + shard.escalate.evidence,
        { label: 'fix:' + a.name, phase: 'Phase 1: Sweep', schema: SHARD_SCHEMA, model: et.model, effort: et.effort })
      if (fixed) return { ...fixed, q4_prd_refs: [...new Set([...(shard.q4_prd_refs || []), ...(fixed.q4_prd_refs || [])])], guard_gaps: [...(shard.guard_gaps || []), ...(fixed.guard_gaps || [])] }
      return shard
    }
    return shard
  },
  // Verify every shard that changed files; one re-fix cycle on failure
  async (shard, a) => {
    if (!shard) return null
    if (!shard.changed) return { ...shard, verified: true }
    let verdict = await agent(verifyPrompt(a, shard), { label: 'verify:' + a.name, phase: 'Phase 1: Verify', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'medium' })
    if (verdict && verdict.pass) return { ...shard, verified: true }
    const t = tierOf(a.name)
    const ft = t.fixes === true ? t : { model: 'sonnet', effort: 'high' }
    const refixed = await agent(
      shardPrompt(a, { ...t, fixes: true }) + '\n\nRE-FIX PASS — a verifier failed the previous attempt with these problems; the file already contains that attempt. Repair it:\n' + JSON.stringify(verdict ? verdict.problems : ['verifier did not return']),
      { label: 'refix:' + a.name, phase: 'Phase 1: Sweep', schema: SHARD_SCHEMA, model: ft.model, effort: ft.effort })
    const merged = refixed || shard
    verdict = await agent(verifyPrompt(a, merged), { label: 'reverify:' + a.name, phase: 'Phase 1: Verify', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'medium' })
    return { ...merged, verified: !!(verdict && verdict.pass), verify_problems: verdict ? verdict.problems : ['verifier did not return'] }
  }
)

// BARRIER + GATE 1 (needs ALL shard results: reds, gap dedup, inventories)
const shards = shardResults.filter(Boolean)
const missing = roster.length - shards.length
const reds = shards.filter(s => s.changed && !s.verified)
const gaps = [...new Map(shards.flatMap(s => s.sitemap_gaps || []).map(g => [g.proposed_row, g])).values()]
const guardGaps = shards.flatMap(s => s.guard_gaps || [])
const prdInventory = shards.filter(s => (s.q4_prd_refs || []).length).map(s => ({ asset: s.asset, refs: s.q4_prd_refs }))
const cutCandidates = shards.flatMap(s => (s.kickoff_cuts || []).map(c => ({ ...c, asset: s.asset })))

let sitemapOk = true
if (gaps.length) {
  const sm = await agent([
    'Extend the doc-sitemap contract in the dev-kit repo at ' + DEVKIT + '. The per-asset sweep emitted sitemap rows that assets now derive paths against but the sitemap does not yet document. Apply each as a proper row/entry in BOTH copies, keeping them consistent: plugins/dev-kit-core/references/doc-sitemap.md and plugins/dev-kit-data-ai/references/doc-sitemap.md. Deduplicate/merge overlapping proposals; follow each file\'s existing table format and tier structure. Do NOT delete or reword existing rows (PRD.md retirement is a later phase — leave its row alone). Do not commit.',
    'Proposed rows:', JSON.stringify(gaps, null, 1),
    'Return pass=true with an empty problems list if both copies now cover every proposal; otherwise pass=false with problems.',
  ].join('\n'), { label: 'sitemap-extend', phase: 'Phase 1: Sitemap', schema: VERDICT_SCHEMA, model: 'opus', effort: 'medium' })
  sitemapOk = !!(sm && sm.pass)
}

// Guards: fold shard-emitted gaps into tier-schema-guards.sh (and repair the seed if it failed)
const guardSeed = await guardSeedP
let guardsOk = !!(guardSeed && guardSeed.pass)
if (guardGaps.length || !guardsOk) {
  const g = await agent([
    'Extend/repair the findings-contract guard script in the dev-kit repo at ' + DEVKIT + '. Do NOT run git commit.',
    'Target: `scripts/checks/tier-schema-guards.sh` (a Phase 0 agent should have created it covering doc-verifier, nyquist-auditor, integration-checker' + (guardsOk ? '' : ' — but it reported problems: ' + JSON.stringify(guardSeed ? guardSeed.problems : ['agent did not return']) + '; create/repair it first') + '). Follow the conventions of the existing scripts/checks/*.sh (model: ui-audit-severity-guards.sh).',
    'Fold in one check per entry below — each describes a Q5 fix the per-asset sweep just applied; the check must assert the fixed state so it cannot silently revert. Deduplicate overlapping entries.',
    JSON.stringify(guardGaps, null, 1),
    'Verify both directions per the repo convention (pass on current file, fail on a reverted scratch copy — never edit repo files to test). Run the script; it must exit 0.',
    'Return pass=true only if the script covers the three seed assets plus every entry above and exits 0.',
  ].join('\n'), { label: 'guards-extend', phase: 'Phase 1: Guards', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'high' })
  guardsOk = !!(g && g.pass)
}

if (reds.length || missing > 0 || !sitemapOk || !guardsOk) {
  return {
    status: 'RED', failed_phase: 'Phase 1',
    unverified_fixes: reds.map(r => ({ asset: r.asset, problems: r.verify_problems })),
    shards_missing: missing, sitemap_extended: sitemapOk, guards_ok: guardsOk,
    note: 'Phase 2/3 not started. Fix the reds (or resume with resumeFromRunId after adjusting) — completed shards are cached.',
    prd_inventory: prdInventory, cut_candidates_count: cutCandidates.length,
  }
}
log('Phase 1 GREEN: ' + shards.length + ' shards; ' + shards.filter(s => s.changed).length + ' assets changed & verified; ' + gaps.length + ' sitemap rows added; ' + guardGaps.length + ' guard checks folded in; PRD refs in ' + prdInventory.length + ' assets; ' + cutCandidates.length + ' KICKOFF cut candidates.')

// ---------------------------------------------------------------------------
// Phase 2 — PRD retirement: one decision propagated, then closure check
// ---------------------------------------------------------------------------
const prop = await agent([
  'Execute the PRD-retirement contract change in the dev-kit repo at ' + DEVKIT + ' (shortlist item 2 in ' + AUDIT + '/roadmap-shortlisted-workflow.md — read it first). One coherent decision, propagated everywhere. Do not commit.',
  '1. Retire `docs/global/requirements/PRD.md` from the sitemap contract entirely — delete its row from BOTH plugins/dev-kit-core/references/doc-sitemap.md AND plugins/dev-kit-data-ai/references/doc-sitemap.md, and from any migration map. Do not relocate it; `docs/global/project/PROJECT.md` already owns "what is this product, why, for whom" at the global tier.',
  '2. `specify` (plugins/*/skills/specify/SKILL.md) stops presupposing a pre-existing PRD.md: for milestone 1 it consumes the operator\'s raw input directly — the same shape it already uses for milestone 2+ via `docs/global/requirements/BACKLOG.md` Now/Next items.',
  '3. Do NOT create any replacement milestone-PRD file; SPEC/spec.md plus the milestone REQUIREMENTS.md rollup already fill that role (the sweep just landed ROADMAP 1.4: roadmapper now CREATES REQUIREMENTS.md).',
  '4. `docs/global/requirements/` keeps BACKLOG.md and TODOS.md untouched.',
  '5. Update the exception paths — `gate-reverse-engineer` and `doc-synthesizer` (and `doc-classifier` if it routes to them): a recovered/ingested "PRD" is written as milestone 1 seed input folded into specify\'s intake, NOT persisted as docs/global/requirements/PRD.md.',
  '6. Update docs/gwd-pipeline-on-devkit.md Stage 0/1 so milestone 1 is no longer a PRD special case.',
  '7. Close every reference in this inventory (from the sweep): ' + JSON.stringify(prdInventory),
  'Return pass=true only when every touchpoint and every inventory reference is resolved; list unresolved ones as problems.',
].join('\n'), { label: 'prd-retirement', phase: 'Phase 2: PRD retirement', schema: VERDICT_SCHEMA, model: 'opus', effort: 'high' })

const closure = await agent([
  'Closure check for the PRD retirement in the dev-kit repo at ' + DEVKIT + '. Search the whole repo (grep -rn "PRD" — plugins/, docs/, scripts/; EXCLUDE docs/audits/ and .claude/) and verify: no asset, sitemap, or pipeline doc still references docs/global/requirements/PRD.md or presupposes a global PRD as a live input. Historical mentions inside docs/audits/ are fine. Judge each hit in context (the word "PRD" describing operator-supplied raw input is fine; a path or required-input contract is not). An earlier closure pass flagged docs/superpowers/specs/2026-07-26-devkit-pipeline-step0-design.md (lines ~190 and ~280); both spots have since been rewritten to the retired-PRD framing — re-judge that file fresh along with everything else. Do not edit. Return pass/problems with file:line for each problem.',
].join('\n'), { label: 'prd-closure', phase: 'Phase 2: PRD retirement', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'medium' })

// GATE 2
if (!prop || !prop.pass || !closure || !closure.pass) {
  return {
    status: 'RED', failed_phase: 'Phase 2',
    propagation: prop ? { pass: prop.pass, problems: prop.problems } : 'agent did not return',
    closure: closure ? { pass: closure.pass, problems: closure.problems } : 'agent did not return',
    note: 'Phase 3 not started. Resume with resumeFromRunId after resolving.',
    cut_candidates_count: cutCandidates.length,
  }
}
log('Phase 2 GREEN: PRD retired from contract; closure check clean.')

// ---------------------------------------------------------------------------
// Phase 3 — Per-step KICKOFF rewrite (requires devkit-pipeline repo)
// ---------------------------------------------------------------------------
if (!PIPE) {
  return {
    status: 'GREEN through Phase 2 — Phase 3 BLOCKED',
    blocked_reason: 'devkit-pipeline repo path not provided (args.pipelineRepo). Re-run with the same script + resumeFromRunId + args.pipelineRepo set; Phases 0-2 will replay from cache.',
    phase1: { assets_swept: shards.length, changed: shards.filter(s => s.changed).length, sitemap_rows_added: gaps.length, guard_checks_added: guardGaps.length },
    phase2: 'PRD retired, closure clean',
    cut_candidates_by_step: cutCandidates.reduce((m, c) => { (c.steps || ['unknown']).forEach(s => { (m[s] = m[s] || []).push({ asset: c.asset, quote: c.quote }) }); return m }, {}),
  }
}

const STEPS = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15']
const cutsByStep = {}
for (const c of cutCandidates) for (const s of (c.steps && c.steps.length ? c.steps : ['unknown'])) (cutsByStep[s] = cutsByStep[s] || []).push({ asset: c.asset, quote: c.quote, claim_ref: c.claim_ref })
const STALE_DRAFTS = { '02': 'step02-sdd-review-cto.md', '07': 'step07-planner-handoff.md', '10': 'step10-bugfix-wave-merge-loop.md (also step10-qa-tiers-and-preconditions.md, step10-ui-auditor-scoring.md)' }

const stepResults = await pipeline(
  STEPS,
  (s) => {
    const t = STEP_TIER(s)
    return agent(stepPrompt(s, cutsByStep[s] || [], STALE_DRAFTS[s]), { label: 'step:' + s, phase: 'Phase 3: Step rewrites', schema: STEP_SCHEMA, model: t.model, effort: t.effort })
  },
  async (res, s) => {
    if (!res) return null
    let keep = await agent([
      'Keep-verification for KICKOFF.md step ' + s + ' in ' + PIPE + ' (dev-kit + audit data at ' + DEVKIT + ', ' + AUDIT + '). REPORT §6: refutations concentrate in the KEEP direction — adversarially audit what the rewrite KEPT, not what it cut. For each kept line the cut candidates targeted (' + JSON.stringify((res.kept_lines || [])) + ') and any other surviving prose in step ' + s + ': is it methodology-reteach, output-contract restatement, invocation boilerplate, or a path string an asset now derives itself? Check against ' + AUDIT + '/verdicts/ and findings/. Per-site timing sentences are legitimate keeps (C4). Do not edit. Return pass/refuted_keeps.',
    ].join('\n'), { label: 'keep-verify:' + s, phase: 'Phase 3: Verify', schema: KEEP_SCHEMA, model: 'sonnet', effort: 'high' })
    if (keep && keep.pass) return { ...res, verified: true }
    const t = STEP_TIER(s)
    const redo = await agent(
      stepPrompt(s, cutsByStep[s] || [], STALE_DRAFTS[s]) + '\n\nRE-PASS — a keep-verifier refuted these keeps in your previous rewrite (the file contains that attempt); cut or justify each:\n' + JSON.stringify(keep ? keep.refuted_keeps : ['verifier did not return']),
      { label: 'restep:' + s, phase: 'Phase 3: Step rewrites', schema: STEP_SCHEMA, model: t.model, effort: t.effort })
    const merged = redo || res
    keep = await agent('Re-run the keep-verification for KICKOFF.md step ' + s + ' in ' + PIPE + ' after a re-pass. Same rules as before: adversarially audit surviving prose against the six-category contract and ' + AUDIT + '/verdicts/. Return pass/refuted_keeps.'
      + (s === '04' ? ' NOTE (operator re-fix): the stale re-bind paste block has been rewritten by the operator to match design-consultation\'s current closer — the operator now re-runs design-consultation with the returned uuid to bind it (letting its own Phase 5/6 writes complete DESIGN.md) and only then invokes design-html; no hand-editing of DESIGN.md remains. Judge the file as it stands NOW.' : '')
      + (s === '09' ? ' NOTE (operator re-fix): the debugger methodology-reteach sentence (root-cause-first / falsifiable hypothesis / 3-strike / persistent debug file) has been cut by the operator; the step now carries only the invocation block, the as-needed timing, and the close-out knowledge-store paste block. Judge the file as it stands NOW.' : '')
      + (s === '00' ? ' NOTE (operator re-fix): the redundant "in MODE new" parameter has been cut from the doc-ingest block — doc-synthesizer\'s Derived-default rule now derives MODE itself, and on this first-touch path it always resolves to new. Judge the file as it stands NOW.' : '')
      + (s === '06' ? ' NOTE (operator re-fix): the earlier refutation held that domain-researcher still required orchestrator-supplied concrete paths. The operator has since given plugins/dev-kit-core/agents/domain-researcher.md full sitemap-based path self-derivation matching ai-researcher/eval-planner (ids in, derived defaults, explicit path only as override) — the thin ids-only invocation in KICKOFF step 6 is now sufficient. Judge both files as they stand NOW.' : '')
      + (s === '07' ? ' NOTE (operator re-fix): the stale "Set the standing default as a ## Plan Review Lenses section in CLAUDE.md" sentence has been cut — commands/plan-review.md (commit 0198f60) reads CLAUDE.md itself and self-documents the convention, so KICKOFF no longer restates it. Judge the file as it stands NOW.' : ''), { label: 'rekeep:' + s, phase: 'Phase 3: Verify', schema: KEEP_SCHEMA, model: 'sonnet', effort: 'high' })
    return { ...merged, verified: !!(keep && keep.pass), refuted: keep ? keep.refuted_keeps : [] }
  }
)

// BARRIER + whole-file thin collapse + final exit criterion (needs the whole rewritten file)
const stepsDone = stepResults.filter(Boolean)
const stepReds = stepsDone.filter(r => !r.verified)

// The per-step rewrites cut candidates but left the guide far over the Milestone 5 bar —
// a prior exit check measured 878 lines (bar <=400) and itemized the residue. One aggressive
// whole-file pass before re-checking.
const collapse = await agent([
  'Execute the Milestone 5 thin rewrite of KICKOFF.md in the devkit-pipeline repo at ' + PIPE + ' as ONE whole-file pass. Contract: the six-category "What this file may contain" preamble at the top of KICKOFF.md itself (added by a prior exit check — KEEP it, do not duplicate it) and ' + AUDIT + '/ROADMAP.md Milestone 5. Dev-kit repo (assets, audit data) is at ' + DEVKIT + '. Do NOT run git commit.',
  'A prior exit check failed the file at 878 lines and itemized the residue. Resolve ALL of it:',
  '- DELETE the "**Paths**" preamble block (the PHASE/ and SPEC/ shorthand expansions) — assets derive every path from the sitemap contract plus ids; prompt blocks pass ids only. Rewrite any block that leans on the shorthands accordingly (a bare "against SPEC/spec.md" as scope-narrowing citation is exempt per category 6).',
  '- COLLAPSE every prompt block over ~5 lines to invocation + ids + mode + operator-judgment + ordering + scope-narrowing only. Known offenders from the failing check (line numbers may have shifted): the 16-line lane-skill roster with agent-vs-skill explainer (~388) — reduce to enabling the lanes the SDD names; the 22-line code-review-gate round-loop restatement (~440) — the gate asset owns its loop, stop_loop semantics, and round cap; the 14-line infra-lane sequencing recipe (~661); the 10-line hand-rolled archive/git-tag procedure (~840); plus the blocks near ~367, ~524, ~544, ~588, ~729, ~751, ~770.',
  '- REMOVE surviving path strings inside prompt blocks (~181 SDD path + .claude/settings.json, ~861 "Freeze docs/milestones/<M>/", ~863 STATE.md position pointer, ~867 and ~875 BACKLOG.md) — name the asset, mode, and ids instead.',
  '- KEEP: the six-category preamble; the Three-parts / Invocation intro; per-site TIMING sentences where one asset is invoked at multiple steps (C4); one-word mode disambiguations (C6); operator-judgment gates; cross-step ordering, parallelism, and session boundaries (context-save -> /clear -> context-restore); scope narrowing; conditional predicates.',
  '- Verify every KEEP against ' + AUDIT + '/verdicts/ and ' + AUDIT + '/findings/ — refutations concentrate in the keep direction.',
  'Exit bar: `wc -l` <= 400 and every prompt block passes the six-category test. Return pass=true only if both hold; list problems otherwise.',
].join('\n'), { label: 'thin-collapse', phase: 'Phase 3: Step rewrites', schema: VERDICT_SCHEMA, model: 'opus', effort: 'xhigh' })

const exit = await agent([
  'Final exit-criterion check for the KICKOFF rewrite in ' + PIPE + '. Contract source: ' + AUDIT + '/ROADMAP.md Milestone 5. Verify: (1) KICKOFF.md is <=400 lines (`wc -l`); (2) every prompt block passes the six-category test; (3) the six-category contract itself sits at the top of KICKOFF as a short "what this file may contain" preamble — if the preamble is missing, ADD it (this is the one edit you may make); (4) no hardcoded TDD/test-first mandate survives; (5) no path string survives that an asset now derives itself. Return pass/problems.',
  'NOTE: a whole-file thin-collapse pass has run since the previous exit check — re-measure and re-scan everything fresh. The "What this file may contain" preamble should already exist; do not add a second copy.',
].join('\n'), { label: 'exit-criterion', phase: 'Phase 3: Verify', schema: VERDICT_SCHEMA, model: 'opus', effort: 'medium' })

// GATE 3
if (stepReds.length || stepsDone.length < STEPS.length || !exit || !exit.pass) {
  return {
    status: 'RED', failed_phase: 'Phase 3',
    unverified_steps: stepReds.map(r => ({ step: r.step, refuted: r.refuted })),
    steps_missing: STEPS.length - stepsDone.length,
    thin_collapse: collapse ? { pass: collapse.pass, problems: collapse.problems } : 'agent did not return',
    exit_criterion: exit ? { pass: exit.pass, problems: exit.problems } : 'agent did not return',
  }
}

return {
  status: 'GREEN — all phases complete',
  phase0: { roster: roster.length, guard_the_three: guardSeed && guardSeed.pass ? 'seeded in Phase 0' : 'repaired in Phase 1 guards stage' },
  phase1: { swept: shards.length, changed_and_verified: shards.filter(s => s.changed).length, sitemap_rows_added: gaps.length, guard_checks_added: guardGaps.length, cut_candidates: cutCandidates.length },
  phase2: 'PRD retired from contract; closure check clean',
  phase3: { steps_rewritten: stepsDone.length, exit_criterion: 'pass' },
  note: 'Nothing was committed. Review diffs in both repos (git status / git diff), then commit per-step in devkit-pipeline and in logical chunks in dev-kit. ROADMAP 1.14 (graphify) was deliberately skipped — personal skill outside the repo.',
}
