export const meta = {
  name: 'kickoff-duplication-audit',
  description: 'Audit KICKOFF.md against the dev-kit skills it invokes to find duplicated instruction text',
  phases: [
    { title: 'Extract', detail: '16 agents, one per KICKOFF step — verbatim transcription only, zero skill reads' },
    { title: 'Compile-Assets', detail: 'invert step-keyed extracts into one brief per asset; resolve files; rate complexity' },
    { title: 'Analyze', detail: 'one agent per asset — reads its brief + skill file + references chain' },
    { title: 'Roster-check', detail: 'regression guard on the 25 lane skills named at KICKOFF 605-612' },
    { title: 'Compile-Claims', detail: 'cross-asset dedupe, boilerplate collapse, build verify queue' },
    { title: 'Verify', detail: 'fresh adjudicator per asset, defaults to refuting' },
    { title: 'Synthesize-A', detail: 'rank patterns by KICKOFF line volume, nominate rewrite targets' },
    { title: 'Rewrite', detail: 'one agent per target block, trimmed replacement preserving every parameter' },
    { title: 'Synthesize-B', detail: 'assemble REPORT.md' },
  ],
}

// Work dir doubles as the durable record: every agent's output file lives here, and every agent
// prompt opens with a skip-if-done check against it. A rerun therefore resumes from disk rather
// than redoing finished work — delete a file to force just that unit to re-run.
const WD = '/home/ubuntu/skillsproject/dev-kit/docs/audits/kickoff-duplication-audit'
const KICKOFF = '/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md'
const PLUGINS = '/home/ubuntu/skillsproject/dev-kit/plugins'

const STEPS = [
  { n: '00', title: 'Bootstrap', start: 23, end: 127 },
  { n: '01', title: 'Requirements & product framing', start: 128, end: 196 },
  { n: '02', title: 'Architecture & tech stack', start: 197, end: 249 },
  { n: '03', title: 'Research & roadmap', start: 250, end: 293 },
  { n: '04', title: 'Design system', start: 294, end: 343 },
  { n: '05', title: 'Phase discovery', start: 344, end: 400 },
  { n: '06', title: 'Phase specs', start: 401, end: 481 },
  { n: '07', title: 'Plan the phase', start: 482, end: 563 },
  { n: '08', title: 'Build it, test-first', start: 564, end: 652 },
  { n: '09', title: 'Debug', start: 653, end: 682 },
  { n: '10', title: 'Adversarial review/fix loop', start: 683, end: 820 },
  { n: '11', title: 'Verify the goal', start: 821, end: 968 },
  { n: '12', title: 'Final review — milestone gate', start: 969, end: 1072 },
  { n: '13', title: 'Ship — open the PR', start: 1073, end: 1176 },
  { n: '14', title: 'Document', start: 1177, end: 1292 },
  { n: '15', title: 'Operate, retrospect, close', start: 1293, end: 1396 },
]

// ---------------------------------------------------------------- shared text

const SKIP_IF_DONE = (path, shape) => `
## Skip-if-done (read this first)

Before doing ANY work, check whether \`${path}\` already exists. If it exists AND parses as
${shape}, DO NOT redo the work. Read it, and return its summary immediately. Stop there.
This run may be a restart of an interrupted run; redoing completed work wastes the whole point.
If the file exists but is truncated, malformed, or missing required keys, delete it and do the
work fresh.
`

const TRAP = `
## CRITICAL TRAP — four phrases that look like assets but are NOT

A naive reading of \`the <word> skill\` / \`the <word> agent\` / \`the <word> command\` produces false
positives. These are English category nouns, not asset names. Do NOT record any of these as an
invoked asset:

| line | text | what it really is |
|---|---|---|
| 604 | "name **the lane skill** that owns its surface" | category noun — whichever domain skill fits the track |
| 611 | "a track with no matching lane just uses **the core skills**" | plain English |
| 793 | "instead of **the bare command** above" | adjective — the plain version of the command above |
| 944 | "invoking playwright-expert … **as the test-design skill**" | a role filled by playwright-expert / test-master |

Rule: a category noun or adjective in front of the word "skill"/"agent"/"command" is not an asset.
Record only names that are ACTUALLY INVOKED as a tool by the prompt (a real hyphenated asset
identifier the operator or Claude would load). Use the four rows above as worked examples of what
to reject.
`

const CLASSIFY = `
## Classification discipline — the hard part

Be strict. Most operator prompt text legitimately carries information the skill cannot know.
The default answer is "load-bearing", not "duplicated".

**NOT duplication** — classify as \`load-bearing-parameter\`:
- Output file paths, target filenames, directory conventions — these are the invocation's arguments
- Placeholders like \`<product, one line>\`, per-milestone substitutions
- Mode selection among modes the skill itself offers ("use pre-mortem mode")
- Which other artifact to feed in as context
- Ordering / parallelism across skills ("dispatch alongside X", "before step 2")
- Conditional gating the operator must judge ("only if this project has UI")
- Emphasis of something the skill makes optional — note it, but severity low

**IS duplication** — classify as \`redundant-restatement\`:
- The prompt spells out the skill's own internal methodology, phases, or checklist
- The prompt restates output format / section structure the skill's template already fixes
- The prompt re-derives the skill's own hard rules or gates when the skill already enforces them
- The prompt re-teaches domain rules the skill dedicates a section to (EARS format, ID
  allocation, taxonomy names)

**Other classes:**
- \`contradiction\` — the guide and the skill disagree about behavior
- \`stale-drift\` — the guide describes behavior the skill no longer has
- \`unenforced-gap\` — the guide asserts behavior the skill does NOT contain anywhere, so the guide
  text is load-bearing and must be KEPT. This is a finding about the SKILL failing to enforce its
  own behavior, with the guide compensating.

\`unenforced-gap\` claims are ABSENCE claims and are the easiest thing here to get wrong. Before
asserting one, go hunting: read the skill's \`references/\` chain, grep for distinctive nouns and
verbs rather than exact phrases, and remember synonyms count as coverage.

**Evidence rule (absolute):** every claim must quote the KICKOFF text AND the exact skill sentence
plus its line number. No skill quote = no finding. Never guess at file contents — read them.
`

const LOCATE = `
## Locating an asset on disk

Plugins live under \`${PLUGINS}/\`: dev-kit-core, dev-kit-data-ai, dev-kit-infra, dev-kit-web,
dev-kit-product, dev-kit-backend, dev-kit-mobile, dev-kit-specialized.

Layout:
- skill:   \`<plugin>/skills/<name>/SKILL.md\`   (may have a sibling \`references/\` directory)
- agent:   \`<plugin>/agents/<name>.md\`
- command: \`<plugin>/commands/<name>.md\`

Find one with e.g. \`find ${PLUGINS} -path '*<name>*' -name '*.md'\`. Do not guess a path — verify it.
`

// ------------------------------------------------------------------- schemas

const EXTRACT_SCHEMA = {
  type: 'object',
  required: ['step', 'block_count', 'assets_seen'],
  additionalProperties: false,
  properties: {
    step: { type: 'string' },
    block_count: { type: 'integer' },
    assets_seen: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string', description: 'anything ambiguous the compiler should know' },
  },
}

const ROSTER_SCHEMA = {
  type: 'object',
  required: ['assets', 'total_invocations'],
  additionalProperties: false,
  properties: {
    total_invocations: { type: 'integer' },
    assets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'kind', 'file_path', 'invocation_count', 'complexity', 'file_lines'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          kind: { type: 'string', enum: ['skill', 'agent', 'command', 'unresolved'] },
          file_path: { type: 'string', description: 'absolute path, or "" if unresolved' },
          file_lines: { type: 'integer' },
          invocation_count: { type: 'integer' },
          complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
          has_references: { type: 'boolean' },
          steps: { type: 'array', items: { type: 'string' } },
          aliases_merged: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    unresolved: { type: 'array', items: { type: 'string' }, description: 'names with no file on disk — reported as stale-drift' },
    notes: { type: 'string' },
  },
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['asset', 'claim_count', 'by_class'],
  additionalProperties: false,
  properties: {
    asset: { type: 'string' },
    claim_count: { type: 'integer' },
    by_class: {
      type: 'object',
      additionalProperties: false,
      properties: {
        redundant_restatement: { type: 'integer' },
        load_bearing_parameter: { type: 'integer' },
        contradiction: { type: 'integer' },
        stale_drift: { type: 'integer' },
        unenforced_gap: { type: 'integer' },
      },
    },
    kickoff_lines_flagged: { type: 'integer', description: 'total KICKOFF lines covered by redundant-restatement claims' },
    consistency_issue: { type: 'boolean' },
    systemic_boilerplate: { type: 'array', items: { type: 'string' }, description: 'one-line description of each systemic pattern found' },
    read_references: { type: 'boolean' },
    capped: { type: 'string', description: 'describe anything you dropped or truncated; "" if nothing' },
  },
}

const ROSTERCHECK_SCHEMA = {
  type: 'object',
  required: ['checked', 'passed', 'failures'],
  additionalProperties: false,
  properties: {
    checked: { type: 'integer' },
    passed: { type: 'integer' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'problem'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          problem: { type: 'string' },
          actual: { type: 'string' },
        },
      },
    },
  },
}

const QUEUE_SCHEMA = {
  type: 'object',
  required: ['queue', 'claims_in', 'claims_out'],
  additionalProperties: false,
  properties: {
    claims_in: { type: 'integer' },
    claims_out: { type: 'integer' },
    merged: { type: 'integer' },
    dropped_no_evidence: { type: 'integer' },
    collapsed_boilerplate: { type: 'integer' },
    queue: {
      type: 'array',
      items: {
        type: 'object',
        required: ['asset', 'claim_count', 'has_high_severity'],
        additionalProperties: false,
        properties: {
          asset: { type: 'string' },
          claim_count: { type: 'integer' },
          has_high_severity: { type: 'boolean' },
        },
      },
    },
    notes: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['asset', 'adjudicated', 'confirmed', 'refuted'],
  additionalProperties: false,
  properties: {
    asset: { type: 'string' },
    adjudicated: { type: 'integer' },
    confirmed: { type: 'integer' },
    refuted: { type: 'integer' },
    confirmed_high_severity: { type: 'integer' },
    notes: { type: 'string' },
  },
}

const PATTERNS_SCHEMA = {
  type: 'object',
  required: ['patterns', 'rewrite_targets', 'totals'],
  additionalProperties: false,
  properties: {
    totals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        confirmed_redundant: { type: 'integer' },
        confirmed_contradiction: { type: 'integer' },
        confirmed_stale_drift: { type: 'integer' },
        confirmed_unenforced_gap: { type: 'integer' },
        load_bearing: { type: 'integer' },
        kickoff_lines_redundant: { type: 'integer' },
        kickoff_lines_in_prompt_blocks: { type: 'integer' },
        false_positive_rate: { type: 'number', description: 'refuted / adjudicated' },
      },
    },
    patterns: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'kickoff_lines', 'instances'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          kickoff_lines: { type: 'integer' },
          instances: { type: 'integer' },
          assets: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    },
    rewrite_targets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'step', 'line_range', 'why'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', description: 'stable kebab-case id, used as rewrites/<id>.md' },
          step: { type: 'string' },
          line_range: { type: 'string' },
          assets: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
        },
      },
    },
  },
}

const REWRITE_SCHEMA = {
  type: 'object',
  required: ['id', 'lines_before', 'lines_after'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    lines_before: { type: 'integer' },
    lines_after: { type: 'integer' },
    parameters_preserved: { type: 'array', items: { type: 'string' } },
    risk: { type: 'string' },
  },
}

const REPORT_SCHEMA = {
  type: 'object',
  required: ['report_path', 'verdict_line'],
  additionalProperties: false,
  properties: {
    report_path: { type: 'string' },
    verdict_line: { type: 'string' },
    redundant_pct: { type: 'number' },
    load_bearing_pct: { type: 'number' },
    false_positive_rate: { type: 'number' },
    dangerous_findings: { type: 'integer' },
    sections_written: { type: 'array', items: { type: 'string' } },
  },
}

// ================================================================ PHASE 1

phase('Extract')
log(`Extracting ${STEPS.length} step slices from KICKOFF.md — transcription only, zero skill reads`)

const extracts = await parallel(STEPS.map(s => () => agent(`
You are transcribing one slice of an operator guide. This is a TRANSCRIPTION job. You will NOT
evaluate anything, and you will NOT read any skill file. Reading skill files in this phase is a
protocol violation — a later phase does that, once per asset.

${SKIP_IF_DONE(`${WD}/extract/step-${s.n}.json`, 'JSON with keys step / blocks[] / where every block has verbatim_text')}

## Your slice

File: \`${KICKOFF}\`
Step ${s.n} — "${s.title}" — absolute lines ${s.start} to ${s.end}.

Read exactly that line range (e.g. \`sed -n '${s.start},${s.end}p' ${KICKOFF}\`, or Read with
offset/limit). Line numbers you record must be ABSOLUTE line numbers in the file, not offsets
into your slice.

## What KICKOFF.md is

A guide a human operator follows top to bottom. Each fenced \`\`\`text block is a prompt they paste
into Claude Code. Each block invokes a skill, agent, or command that carries its OWN full
instructions. A later phase asks which sentences in those blocks are redundant against the asset.
Your only job is to capture the raw material for that question, faithfully.

${TRAP}

## Output

Write \`${WD}/extract/step-${s.n}.json\` with this shape:

{
  "step": "${s.n}",
  "title": "${s.title}",
  "line_range": [${s.start}, ${s.end}],
  "blocks": [
    {
      "block_index": 0,
      "line_range": [<abs start of the fence>, <abs end of the fence>],
      "verbatim_text": "<the FULL text inside the fence, character for character>",
      "assets_invoked": ["<asset-name>", ...],
      "surrounding_prose": "<the guide's own prose immediately around this block: conditioning
         text like '(only if this project has UI)', 'A REVISE verdict means stop', ordering
         instructions, what the operator should do with the result>"
    }
  ]
}

Rules:
- \`verbatim_text\` is the EVIDENCE BASE for the entire audit. Copy it in FULL. No paraphrase, no
  summarising, no eliding with "...". If a block is long, it stays long. Preserve line breaks.
- \`assets_invoked\`: the real asset names this block loads. Bare names, no plugin prefix, no
  \`/\` prefix — e.g. \`context-save\`, \`gsd-planner\`, \`qa\`. An empty array is fine and correct
  for a block that invokes nothing.
- If a block invokes several assets, list them all.
- \`surrounding_prose\` is where operator-judgment context lives. Capture it generously — a later
  agent needs it to tell a load-bearing condition from a restatement.
- If the slice boundary cuts a fence in half, record what is in your range and say so in \`notes\`.

Return the summary object only. The bulk lives in the file.
`, {
  label: `extract:step-${s.n}`,
  phase: 'Extract',
  model: 'sonnet',
  effort: 'medium',
  schema: EXTRACT_SCHEMA,
})))

const okExtracts = extracts.filter(Boolean)
log(`Extract done: ${okExtracts.length}/${STEPS.length} steps, ${okExtracts.reduce((a, e) => a + (e.block_count || 0), 0)} prompt blocks`)

// ================================================================ PHASE 2 (barrier — the pivot)

phase('Compile-Assets')
log('Pivot: inverting step-keyed extracts into one brief per asset')

const roster = await agent(`
You are the PIVOT of this audit. Everything upstream is sharded by KICKOFF step; everything
downstream is sharded by ASSET. You perform the inversion.

${SKIP_IF_DONE(`${WD}/MANIFEST.json`, 'JSON containing key "phase_complete": "compile-assets" and a full "assets" roster')}

## Input

All 16 files in \`${WD}/extract/\`. Read every one.

## Job

1. **Invert.** Build an asset-keyed index: for every asset name appearing in any block's
   \`assets_invoked\`, collect EVERY invocation of it across all 16 steps.

2. **Normalize names** so one asset never splits into two roster entries. Watch for \`/gsd:foo\`
   vs \`gsd-foo\` vs \`foo\`, singular/plural, and plugin-prefixed vs bare. Record what you merged
   in \`aliases_merged\`. Conversely do NOT merge two genuinely different assets that share a
   prefix.

3. **Resolve each to a real file on disk.**
${LOCATE}
   Record the absolute path, the kind (skill/agent/command), the real line count (\`wc -l\`), and
   whether a sibling \`references/\` directory exists. An asset you genuinely cannot find on disk
   is NOT a silent gap — record it in \`unresolved\` with kind \`unresolved\`; it becomes a
   reported \`stale-drift\` finding downstream.

4. **Write one brief per asset** to \`${WD}/assets/<name>.md\`, containing:
   - a header with: name, kind, resolved absolute file path, file line count, whether it has a
     \`references/\` dir, invocation count, and the list of steps that invoke it
   - then, for EVERY invocation, in step order: the step number, the absolute line range, the
     FULL \`verbatim_text\` of the prompt block, and its \`surrounding_prose\`
   Verbatim means verbatim. Do not compress the invocation text — the analyze agent has nothing
   else to work from.

5. **Rate complexity** for each asset, which sets the downstream model tier:
   - \`high\`   — 3 or more invocations, OR its file is over 300 lines
   - \`medium\` — exactly 2 invocations, OR a mid-size file (roughly 120–300 lines)
   - \`low\`    — a single invocation of a short file

6. **Write \`${WD}/MANIFEST.json\`** containing the full roster (every field of the returned
   schema, plus each asset's \`brief_path\`), \`"phase_complete": "compile-assets"\`, and the total
   invocation count. A restart reads this to know where it stopped, and the user may inspect it
   mid-run.

## Established facts — do not fight them

There are roughly 81 real invocations across roughly 62 unique assets. Assets invoked more than
once include \`context-save\` ×6, \`context-restore\` ×6, \`learn\` ×3, \`graphify\` ×3, and
\`qa\` / \`finishing-a-development-branch\` / \`cso\` / \`constitution\` / \`compliance-auditor\` ×2 each.
If your inversion lands far from those numbers, you have a normalization bug — find it before
writing the manifest. Small deviations are fine and are yours to report in \`notes\`.

${TRAP}
If any of those four phrases made it into an extract's \`assets_invoked\`, drop it here and note it.

Return the roster. Keep the bulk in the files.
`, {
  label: 'compile-assets',
  phase: 'Compile-Assets',
  model: 'opus',
  effort: 'medium',
  schema: ROSTER_SCHEMA,
})

if (!roster || !roster.assets || !roster.assets.length) {
  log('FATAL: compile-assets returned no roster — cannot shard by asset. Stopping.')
  return { error: 'compile-assets produced no roster', extracts: okExtracts.length }
}

// graphify is excluded by explicit user instruction — filtered deterministically, never analyzed,
// never verified, never in the report.
const EXCLUDED = new Set(['graphify'])
const allAssets = roster.assets
const assets = allAssets.filter(a => !EXCLUDED.has(a.name))
const excludedCount = allAssets.length - assets.length

log(`Roster: ${allAssets.length} assets, ${roster.total_invocations} invocations` +
    ` — ${excludedCount} excluded (graphify), ${assets.length} to analyze` +
    (roster.unresolved?.length ? `, ${roster.unresolved.length} unresolved → stale-drift` : ''))

const TIER = {
  high: { model: 'opus', effort: 'high' },
  medium: { model: 'opus', effort: 'medium' },
  low: { model: 'sonnet', effort: 'high' },
}

// ================================================================ PHASES 3 + 4 (concurrent)

phase('Analyze')
log(`Analyzing ${assets.length} assets — one agent each, reads its brief + skill file + references chain`)

const [findings, rosterCheck] = await parallel([

  // ---- Phase 3: one agent per asset
  () => parallel(assets.map(a => () => {
    const tier = TIER[a.complexity] || TIER.medium
    return agent(`
You own exactly ONE asset in this audit: **${a.name}**. You are the only agent reading it in this
phase, and you see ALL of its invocations at once. That is deliberate — it is what lets you judge
consistency and boilerplate, which a per-step agent structurally cannot.

${SKIP_IF_DONE(`${WD}/findings/${a.name}.json`, 'JSON with keys asset / claims[] where every claim carries both a kickoff_quote and a skill_quote')}

## Your asset

- name: \`${a.name}\`
- kind: ${a.kind}
- file: \`${a.file_path || '(UNRESOLVED — no file found on disk)'}\` (${a.file_lines} lines)
- invoked ${a.invocation_count}× in KICKOFF, at steps: ${(a.steps || []).join(', ')}
- brief with every invocation verbatim: \`${WD}/assets/${a.name}.md\`

## Reading protocol — follow it exactly

1. Read your brief \`${WD}/assets/${a.name}.md\` first. It holds every KICKOFF invocation of this
   asset, verbatim, with surrounding prose.
2. Read the asset file itself, in full.
3. **Read its \`references/\` chain.** If the skill's directory has a \`references/\` subdirectory,
   or the file links out to other files, read those too. Skipping the references chain is the
   single biggest cause of wrong findings in this audit: methodology the guide "duplicates" very
   often lives one file deeper, and a gap you "find" is very often covered there.
${a.file_path ? '' : `
   NOTE: this asset was NOT resolved to a file on disk. Search for it yourself before concluding
   anything (${LOCATE.trim()}). If it genuinely does not exist, that is a single
   \`stale-drift\` finding — the guide invokes something that is not there — and you are done.
`}
${CLASSIFY}

## Because you see all ${a.invocation_count} invocations at once, also judge:

- **Consistency** — do the invocations describe this asset the same way? A guide that tells the
  operator one thing at step 3 and something incompatible at step 11 is a finding even when
  neither instance is redundant on its own.
- **Boilerplate** — the same sentence pasted across several steps is ONE systemic finding with N
  locations, not N separate findings. Emit it once, list every location, and say so.

## Output

Write \`${WD}/findings/${a.name}.json\`:

{
  "asset": "${a.name}",
  "asset_file": "<absolute path you actually read>",
  "references_read": ["<paths>"],
  "claims": [
    {
      "local_id": "${a.name}-1",
      "class": "redundant-restatement | load-bearing-parameter | contradiction | stale-drift | unenforced-gap",
      "severity": "high | medium | low",
      "step": "<NN>",
      "kickoff_line_range": [<abs start>, <abs end>],
      "kickoff_quote": "<the exact KICKOFF sentence(s) at issue>",
      "skill_quote": "<the exact sentence from the asset file that covers it>",
      "skill_file": "<absolute path>",
      "skill_line": <line number>,
      "reasoning": "<why this class, in two or three sentences>",
      "systemic": <true if this same text appears at multiple locations>,
      "other_locations": [[<abs start>, <abs end>], ...]
    }
  ],
  "consistency": "<empty string, or a description of how the invocations disagree>",
  "capped": "<empty string, or what you dropped and why>"
}

Hard rules:
- Every claim needs BOTH a \`kickoff_quote\` and a \`skill_quote\` with a real line number. A claim
  with no skill quote must not be written — drop it. For \`unenforced-gap\`, the \`skill_quote\` is
  instead your evidence of the search you ran: the closest sentence you found plus the greps you
  tried. Absence claims demand MORE work than presence claims, not less.
- Never guess file contents. Read them.
- Do not truncate silently. If you cap the claim list, say so in \`capped\`.
- Report load-bearing findings too — the audit needs the denominator, not just the hits.

Return the summary object only.
`, {
      label: `analyze:${a.name}`,
      phase: 'Analyze',
      model: tier.model,
      effort: tier.effort,
      schema: FINDINGS_SCHEMA,
    })
  })),

  // ---- Phase 4: roster regression guard
  () => agent(`
${SKIP_IF_DONE(`${WD}/roster-check.json`, 'JSON with keys checked / passed / failures[]')}

KICKOFF.md lines 605–612 name 25 lane skills inline, and line 615 onward asserts that every name
in that list is a **skill** (as opposed to an agent). This is a regression guard: all 25 pass as
of 2026-07-27, so a failure here means the guide has drifted from the plugins since then.

1. Read \`${KICKOFF}\` lines 598–620 and extract the 25 names exactly as written.
2. For each name verify three things:
   a. it still exists somewhere under \`${PLUGINS}/\`
   b. it lives under a \`skills/\` directory (i.e. it really is a skill, not an agent or command)
   c. it sits in the plugin the guide's grouping implies — the guide groups them as backend /
      web / mobile / AI / infra / specialized, which maps to dev-kit-backend, dev-kit-web,
      dev-kit-mobile, dev-kit-data-ai, dev-kit-infra, dev-kit-specialized
${LOCATE}
3. Write \`${WD}/roster-check.json\` with the full per-name result, and return the summary. For any
   failure, record what the guide claims and what is actually on disk.

Verify against the filesystem. Do not answer from the guide's own text.
`, {
    label: 'roster-check',
    phase: 'Roster-check',
    model: 'sonnet',
    effort: 'low',
    schema: ROSTERCHECK_SCHEMA,
  }),
])

const okFindings = (findings || []).filter(Boolean)
const totalClaims = okFindings.reduce((a, f) => a + (f.claim_count || 0), 0)
const noRefs = okFindings.filter(f => f.read_references === false).length
log(`Analyze done: ${okFindings.length}/${assets.length} assets, ${totalClaims} raw claims` +
    (noRefs ? ` (${noRefs} reported reading no references chain)` : ''))
log(`Roster-check: ${rosterCheck ? `${rosterCheck.passed}/${rosterCheck.checked} pass, ${rosterCheck.failures?.length || 0} failures` : 'FAILED TO RUN'}`)

const capped = okFindings.filter(f => f.capped)
if (capped.length) log(`NOTE — ${capped.length} analyzers reported capping output: ${capped.map(f => f.asset).join(', ')}`)

// ================================================================ PHASE 5 (barrier — cross-asset dedupe)

phase('Compile-Claims')
log('Cross-asset dedupe: merging claims that different agents raised against the same sentence')

const queue = await agent(`
You are the cross-asset deduplication step. You are a barrier for a specific reason: one KICKOFF
prompt block often invokes two assets, so two independent analyze agents may have flagged the
very same sentence. Nothing can be deduped until every asset has reported — and every asset now has.

${SKIP_IF_DONE(`${WD}/MANIFEST.json`, 'JSON containing "phase_complete": "compile-claims" and a "queue" array')}
(If MANIFEST.json exists but its \`phase_complete\` is still \`compile-assets\`, this phase has NOT
run — do the work, then update it.)

## Input

Every file in \`${WD}/findings/\`. Read them all. ${okFindings.length} assets reported,
${totalClaims} raw claims.

## Job

1. **Merge duplicates across assets.** Two claims are the same claim when their KICKOFF line
   ranges overlap AND their quotes are near-identical. Merge them into one, keeping every
   contributing asset in \`raised_by\` and keeping the STRONGEST evidence — the most specific skill
   quote, and the highest severity asserted. Do not average severities down.

2. **Collapse systemic boilerplate.** Where the same sentence was pasted across steps, there is
   one claim with N locations, not N claims. Collapse within an asset and across assets.

3. **Drop any claim lacking an asset quote.** No skill quote, no finding — no exceptions. Count
   what you dropped.

4. **Assign stable \`claim_id\`s** of the form \`<asset>-<n>\`, stable across restarts (sort
   deterministically by asset then KICKOFF start line before numbering).

5. **Write a verify queue per asset** to \`${WD}/assets/<name>.queue.json\`, containing the full
   merged claims for that asset — every field the analyzer recorded, plus \`claim_id\` and
   \`raised_by\`. The verifier for that asset reads only this file plus the asset itself.

6. **Update \`${WD}/MANIFEST.json\`**: set \`"phase_complete": "compile-claims"\`, add the queue
   summary (asset → claim count, whether any claim is high severity), and keep the existing roster.

Never truncate silently. If you cap anything, record the count and the reason in \`notes\` — a
silent cap reads downstream as "we looked at everything", which would be a lie.

\`graphify\` is excluded from this audit by user instruction. If any claim mentions it as its
subject asset, drop it and do not carry it forward.

Return the queue summary.
`, {
  label: 'compile-claims',
  phase: 'Compile-Claims',
  model: 'opus',
  effort: 'medium',
  schema: QUEUE_SCHEMA,
})

if (!queue || !queue.queue || !queue.queue.length) {
  log('FATAL: compile-claims produced no verify queue. Stopping before verification.')
  return { error: 'no verify queue', roster: assets.length, rawClaims: totalClaims }
}

const vQueue = queue.queue.filter(q => q.claim_count > 0 && !EXCLUDED.has(q.asset))
log(`Dedupe: ${queue.claims_in} in → ${queue.claims_out} out (${queue.merged || 0} merged, ` +
    `${queue.collapsed_boilerplate || 0} boilerplate collapsed, ${queue.dropped_no_evidence || 0} dropped for no evidence). ` +
    `${vQueue.length} assets to verify.`)

// ================================================================ PHASE 6

phase('Verify')
log(`Verifying ${vQueue.length} asset queues — fresh adjudicator each, defaulting to refute`)

const verdicts = await parallel(vQueue.map(q => () => agent(`
You are a FRESH adjudicator for the asset **${q.asset}**. You did not write these claims. Someone
else did, and your job is to try to knock them down. One-agent-per-asset must not become
self-review, which is exactly why you are a different agent.

${SKIP_IF_DONE(`${WD}/verdicts/${q.asset}.json`, 'JSON with keys asset / verdicts[] where each verdict has a claim_id and a confirmed boolean')}

## Input

- claims to adjudicate: \`${WD}/assets/${q.asset}.queue.json\` (${q.claim_count} claims)
- the KICKOFF invocations, verbatim: \`${WD}/assets/${q.asset}.md\`
- the asset itself, and its \`references/\` chain — read them yourself, from disk. Do NOT trust the
  quotes in the queue file. Verifying that the quoted sentence actually exists, at the line
  claimed, saying what it is claimed to say, is part of your job.
- source of truth for the guide text: \`${KICKOFF}\`

## Stance

**Default to refuting.** The failure mode this phase exists to catch is lazy agreement — a
plausible-sounding claim waved through. If you are uncertain, the claim is REFUTED. A confirmed
claim must be one you could defend line-by-line to someone hostile.

Refute a claim when any of these hold:
- the quoted skill sentence does not exist, or does not say what the claim says it says
- the KICKOFF text carries a parameter, path, placeholder, condition, ordering constraint, or
  mode selection the skill cannot know — that is load-bearing, not duplication
- the "duplicated" methodology is only in the guide and NOT actually in the skill (the claim is
  backwards)
- the overlap is incidental phrasing rather than the skill's actual methodology, gate, or template

${CLASSIFY}

## Special handling: \`unenforced-gap\` claims

These are ABSENCE claims — "the skill does not contain this anywhere" — and they are the easiest
thing in this audit to get wrong. **Invert your effort here and go hunting.** Read the entire
\`references/\` chain. Grep for distinctive nouns and verbs, not exact phrases. Synonyms and
paraphrases count as coverage. Confirm the gap only after you have genuinely failed to find it.
A confirmed gap means the guide text is LOAD-BEARING and must be KEPT, and it is a finding about
the skill failing to enforce its own behavior.

## Output

Write \`${WD}/verdicts/${q.asset}.json\`:

{
  "asset": "${q.asset}",
  "verdicts": [
    {
      "claim_id": "<from the queue file>",
      "confirmed": true|false,
      "final_class": "<the class YOU judge correct — may differ from the claim's>",
      "final_severity": "high | medium | low",
      "evidence": "<the skill sentence you verified yourself, with its real line number>",
      "reasoning": "<why it survives, or precisely how it fails>"
    }
  ]
}

Adjudicate every claim in the queue. Return the summary.
`, {
  label: `verify:${q.asset}`,
  phase: 'Verify',
  // opus wherever a high-severity claim is at stake; effort stays high regardless, because the
  // failure mode here is lazy agreement, not weak reasoning.
  model: q.has_high_severity ? 'opus' : 'sonnet',
  effort: 'high',
  schema: VERDICT_SCHEMA,
})))

const okVerdicts = verdicts.filter(Boolean)
const adjudicated = okVerdicts.reduce((a, v) => a + (v.adjudicated || 0), 0)
const confirmed = okVerdicts.reduce((a, v) => a + (v.confirmed || 0), 0)
const refuted = okVerdicts.reduce((a, v) => a + (v.refuted || 0), 0)
log(`Verify done: ${adjudicated} adjudicated → ${confirmed} confirmed, ${refuted} refuted ` +
    `(false-positive rate ${adjudicated ? Math.round(100 * refuted / adjudicated) : 0}%)`)

// ================================================================ PHASE 7

phase('Synthesize-A')

const patterns = await agent(`
Synthesis pass A. Turn ${confirmed} confirmed claims into ranked patterns, and nominate the
rewrite targets.

${SKIP_IF_DONE(`${WD}/patterns.json`, 'JSON with keys patterns[] / rewrite_targets[] / totals')}

## Input

- \`${WD}/verdicts/\` — every verdict file (authoritative: only \`confirmed: true\` counts)
- \`${WD}/assets/*.queue.json\` — the full claim text behind each verdict
- \`${WD}/roster-check.json\` — the lane-skill regression guard
- \`${WD}/MANIFEST.json\` — roster and queue
- \`${KICKOFF}\` — for measuring line volume

## Job

1. **Group confirmed claims into patterns** — recurring shapes, not individual claims. Examples of
   the shape of a pattern: "prompt blocks restate the skill's own output template", "prompt blocks
   re-teach a domain rule the skill has a whole section on", "context-save/restore invocations
   paste the same three sentences six times".

2. **Rank patterns by KICKOFF line volume** — how many lines of the guide the pattern actually
   accounts for. Volume, not claim count, is the ranking key: one pattern touching 90 lines
   outranks five patterns touching 4 lines each.

3. **Compute totals**: confirmed counts per class; load-bearing count; total KICKOFF lines inside
   prompt blocks; total lines covered by confirmed \`redundant-restatement\`; and the
   false-positive rate (refuted ÷ adjudicated) as a confidence signal on the whole audit.

4. **Nominate about 6 rewrite targets** — the specific prompt blocks where a trim would recover
   the most lines, or where a confirmed contradiction or stale-drift makes the current text
   actively wrong. Give each a stable kebab-case \`id\` (it becomes \`rewrites/<id>.md\`), the step,
   the absolute line range, and why. Prefer the hardest, highest-volume cuts — this list becomes
   the "5 hardest cuts" section of the report.

5. Write \`${WD}/patterns.json\` with everything above, including the full claim detail per pattern
   so the final report writer needs no further lookups.

\`graphify\` is excluded by user instruction — it must not appear anywhere in your output.

Return the summary.
`, {
  label: 'synthesize-patterns',
  phase: 'Synthesize-A',
  model: 'opus',
  effort: 'high',
  schema: PATTERNS_SCHEMA,
})

const targets = (patterns?.rewrite_targets || []).filter(t => t && t.id)
log(`Patterns: ${patterns?.patterns?.length || 0} ranked, ${targets.length} rewrite targets nominated`)

// ================================================================ PHASE 8

phase('Rewrite')

const rewrites = targets.length ? await parallel(targets.map(t => () => agent(`
Write the trimmed replacement for one KICKOFF prompt block.

${SKIP_IF_DONE(`${WD}/rewrites/${t.id}.md`, 'markdown containing both a CURRENT and a TRIMMED block')}

## Target

- id: \`${t.id}\`
- step ${t.step}, KICKOFF lines ${t.line_range}
- assets invoked: ${(t.assets || []).join(', ') || '(see the block)'}
- nominated because: ${t.why}

## Job

1. Read the block as it stands: \`${KICKOFF}\` at lines ${t.line_range}.
2. Read every asset it invokes, and their \`references/\` chains, so you know exactly what the
   skill already carries.
3. Read the confirmed verdicts for those assets in \`${WD}/verdicts/\` — cut only what was
   CONFIRMED redundant. A refuted claim is text that stays.
4. Write the trimmed replacement.

## The bar

**Preserve every parameter.** Output paths, target filenames, placeholders, mode selections,
which artifact to feed in, ordering and parallelism constraints, and operator-judgment conditions
("only if this project has UI") ALL survive the trim. Cutting one of these silently breaks the
guide for its operator, and would be worse than leaving the block untouched. Enumerate every
parameter you preserved, so a reviewer can check.

Cut only what the invoked asset already mandates and would do anyway.

## Output

Write \`${WD}/rewrites/${t.id}.md\`:

# ${t.id}
step ${t.step} · KICKOFF lines ${t.line_range} · assets: ...

## Current (verbatim)
\`\`\`text
...
\`\`\`

## Trimmed
\`\`\`text
...
\`\`\`

## What was cut, and which skill sentence covers it
- <cut text> → <asset>:<line> "<sentence>"

## Parameters preserved
- ...

## Risk
<what an operator loses, if anything, and why it is acceptable — or say plainly if it is not>

Return the summary.
`, {
  label: `rewrite:${t.id}`,
  phase: 'Rewrite',
  model: 'opus',
  effort: 'high',
  schema: REWRITE_SCHEMA,
}))) : []

const okRewrites = rewrites.filter(Boolean)
log(`Rewrites: ${okRewrites.length}/${targets.length} drafted`)

// ================================================================ PHASE 9

phase('Synthesize-B')

const report = await agent(`
Assemble the final deliverable: \`${WD}/REPORT.md\`.

This is a rewrite of the report even if one exists — do NOT skip this phase on a restart, because
upstream files may have changed. (If \`${WD}/REPORT.md\` exists, overwrite it.)

## Input — read all of it

- \`${WD}/patterns.json\` — ranked patterns and totals
- \`${WD}/verdicts/\` — all verdicts (only \`confirmed: true\` may be reported as a finding)
- \`${WD}/assets/*.queue.json\` — full claim text and quotes
- \`${WD}/rewrites/\` — ${okRewrites.length} drafted trims
- \`${WD}/roster-check.json\` — lane-skill regression guard
- \`${WD}/MANIFEST.json\` — roster, invocation counts, anything unresolved

## Required structure

1. **Dangerous findings first.** Confirmed contradictions and stale drift, before anything else.
   These are the findings where the guide actively misleads its operator. Include unresolved
   assets — a guide invoking something that is not on disk is stale drift. Each entry: the
   KICKOFF quote, the skill quote with file and line, and what breaks.
2. **Duplication patterns, ranked by KICKOFF line volume** — the biggest by line count first, not
   the most numerous. Give the line count and the instance count for each.
3. **The 5 hardest cuts** — current vs trimmed text side by side, drawn from \`${WD}/rewrites/\`,
   with the parameters-preserved list and the risk note for each.
4. **What must NOT be trimmed.** The load-bearing categories with examples, and the confirmed
   \`unenforced-gap\` findings — framed as SKILL DEFECTS, not guide bloat: the skill fails to
   enforce something and the guide is compensating. Name the skill and what it should enforce.
5. **Consistency findings** — where the N invocations of one asset describe it differently across
   steps. Include the roster-check result here (pass = regression guard held).
6. **A blunt verdict.** No hedging. Give the rough redundant vs load-bearing percentage split of
   KICKOFF prompt-block text, and state the false-positive rate (refuted ÷ adjudicated) as a
   confidence signal on the audit itself — a high refute rate means the finders were loose and
   the reader should weight the surviving findings accordingly, and say so explicitly. End with a
   direct answer to the question that started this: is KICKOFF.md bloated with restatement, or is
   it mostly carrying its weight?

## Rules

- Report only CONFIRMED findings. Refuted claims exist in this report only as the false-positive
  rate.
- Every finding keeps its evidence — KICKOFF quote plus skill quote with file and line. A reader
  must be able to check any claim without re-running the audit.
- \`graphify\` is excluded by user instruction. It must not appear in the report.
- If any phase capped or dropped work, say so in a short "coverage and limits" note at the end.
  Silent truncation would read as full coverage.
- Write for someone who will act on it. Be concrete and be blunt.

Return the summary.
`, {
  label: 'write-report',
  phase: 'Synthesize-B',
  model: 'opus',
  effort: 'medium',
  schema: REPORT_SCHEMA,
})

return {
  report: report?.report_path || `${WD}/REPORT.md`,
  verdict: report?.verdict_line,
  counts: {
    steps_extracted: okExtracts.length,
    assets_total: allAssets.length,
    assets_excluded: excludedCount,
    assets_analyzed: okFindings.length,
    invocations: roster.total_invocations,
    unresolved_assets: roster.unresolved?.length || 0,
    raw_claims: totalClaims,
    claims_after_dedupe: queue.claims_out,
    dropped_no_evidence: queue.dropped_no_evidence || 0,
    adjudicated,
    confirmed,
    refuted,
    false_positive_rate: adjudicated ? +(refuted / adjudicated).toFixed(3) : null,
    patterns: patterns?.patterns?.length || 0,
    rewrites: okRewrites.length,
  },
  roster_check: rosterCheck,
  redundant_pct: report?.redundant_pct,
  load_bearing_pct: report?.load_bearing_pct,
  dangerous_findings: report?.dangerous_findings,
}
