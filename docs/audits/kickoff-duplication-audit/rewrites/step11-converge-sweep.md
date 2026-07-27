# step11-converge-sweep
step 11 — convergence · KICKOFF lines 867-879 · assets: converge

Source: `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md` lines 867-879
Asset: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/skills/converge/SKILL.md`
(no `references/` chain — the skill directory contains SKILL.md only, 262 lines; confirmed by
`find` over the plugin tree)
Verdicts: `.../kickoff-audit/verdicts/converge.json` — 12 claims, all 12 confirmed; 2 of them
(`converge-1`, `converge-10`) are classed `load-bearing-parameter` and therefore stay.

## Current (verbatim)
```text
Use the converge skill for phase <NN>. Assess the present-state code — no git, no diffing, no
history — against SPEC/spec.md, every PLAN file for this phase, and
docs/global/project/constitution.md, treating PHASE/VERIFICATION.md's gaps as pre-confirmed
evidence. Sweep every FR, SC, AC and constitution MUST, then append each missing / partial /
contradicts / unrequested gap as a new traceable <task> block under a "## Phase N:
Convergence" header at the END of the plan file. Never rewrite or renumber an existing task.
Constitution-violation remediation comes first. This is the exhaustive requirement-level sweep
the verifier deliberately does not attempt — the two are complementary, so do not skip it just
because verify came back passed. converge itself writes no application code — appending the
tasks is the whole of its job, and completing them is an implementation pass. Tell me how many
tasks it appended and to which plan file.
```

## Trimmed
```text
Use the converge skill for phase <NN>. Run it even when verify came back `passed` — a pass
there does not excuse skipping this step.
```

Lines 866 and 880 (the blank lines that bracket the fenced block) and the conditional block at
881-899 are **outside this block and unchanged**. In particular the downstream conditional
predicate at 881-882 — `*(only if converge appended a `## Phase N: Convergence` section, or
verify came back `gaps_found`)*` — still names the header string verbatim, so the operator's
branch condition survives the trim intact without the converge prompt restating it.

## What was cut, and which skill sentence covers it
- `Assess the present-state code — no git, no diffing, no history` → converge/SKILL.md:21-22
  "This is **not** a diff tool and does **not** track changes. It assesses the present state /
  of the code relative to the feature's artifacts — no git, no branch comparison, no history."
  (verdict claim `converge-2`, CONFIRMED, medium). Near-verbatim copy including the three-item
  negation list, and it is not a mode selection — the skill offers no diff/history mode, this is
  an unconditional bolded property.
- `against SPEC/spec.md, every PLAN file for this phase, and
  docs/global/project/constitution.md` → SKILL.md:48 SPEC default
  `docs/milestones/<M>/specs/<NNN>-<slug>/spec.md`; SKILL.md:51-53 "PLAN — the phase's `PLAN.md`
  file(s) … A phase may have several plans / across waves/tracks; load **all** of them to build
  the intent inventory."; SKILL.md:58 "**CONSTITUTION** — `docs/global/project/constitution.md`
  by default". Re-derived at SKILL.md:90-96 (Step 1 path derivation). (`converge-3`, CONFIRMED,
  low.) The KICKOFF legend (KICKOFF.md:15-16) expands `SPEC/` to
  `docs/milestones/<M>/specs/<NNN>-<slug>/`, so `SPEC/spec.md` is character-for-character the
  skill's own default, and the constitution path is identical. These are **inputs the skill
  resolves from the phase number**, not output paths the operator supplies — see Parameters
  preserved for why `<NN>` is the only real argument here.
- `treating PHASE/VERIFICATION.md's gaps as pre-confirmed evidence` → SKILL.md:126-131 "Parse the
  `gaps:` list from frontmatter … These truths already failed goal-backward verification — fold
  each into the / intent inventory as a pre-confirmed `missing`/`partial` finding sourced from /
  `source-ref: verifier: <truth>`, without re-deriving it from scratch in Step 4."; restated at
  SKILL.md:38-40 and SKILL.md:13-14. (`converge-4`, CONFIRMED, medium.) The KICKOFF borrows the
  skill's own term of art "pre-confirmed evidence" and names the skill's own default
  VERIFICATION path (SKILL.md:55-56); the behavior is unconditional whenever the file exists.
- `Sweep every FR, SC, AC and constitution MUST` → SKILL.md:31-33 "it runs an exhaustive /
  requirement-level sweep (every FR/SC/AC, every constitution MUST, plus `unrequested` /
  scope-creep detection)"; re-encoded as the intent inventory at SKILL.md:137-166.
  (`converge-5`, CONFIRMED, medium.) Same enumeration, same order, near-identical wording.
- `then append each missing / partial / contradicts / unrequested gap as a new traceable <task>
  block under a "## Phase N: Convergence" header at the END of the plan file` →
  SKILL.md:16-18 "**append each piece of remaining work as a new, traceable `<task>` / block**
  under a `## Phase N: Convergence` header at the bottom of the plan file so that an /
  implementation pass can complete it."; the four-name gap taxonomy at SKILL.md:155-162; the
  append contract and literal task template at SKILL.md:203-246. (`converge-6`, CONFIRMED,
  high — the strongest duplication in the block: Goal sentence, the word "traceable", the
  literal header string, end-of-file placement, and the taxonomy, all reproduced.)
- `Never rewrite or renumber an existing task.` → SKILL.md:244 "4. Never reuse or renumber
  existing task numbers or `## Phase N` headers."; also SKILL.md:70-71 "rewrite, renumber,
  reorder, or delete any existing `<task>` block (including tasks from a / prior Convergence
  section)" under the bolded **APPEND-ONLY, NEVER REWRITE** constraint at SKILL.md:65.
  (`converge-7`, CONFIRMED, medium.) The skill states it twice as a hard MUST NOT; the KICKOFF
  adds no exception or scope.
- `Constitution-violation remediation comes first.` → SKILL.md:243 "Constitution-violation tasks
  MUST be emitted first and described as `CRITICAL`."; severity rule at SKILL.md:176.
  (`converge-8`, CONFIRMED, medium.) Ordering *within converge's own output* is the skill's
  methodology. Note the deliberate contrast the verdict draws: the same idea at KICKOFF.md:888-889
  ("keep the constitution-violation remediation tasks first, in the order converge wrote them")
  **is** load-bearing, because there it targets `sprint-execution`, a different skill — and that
  line is outside this block and untouched.
- `This is the exhaustive requirement-level sweep the verifier deliberately does not attempt —
  the two are complementary,` → SKILL.md:29-44, a section titled "Relationship to Other
  Verify-Stage Assets" whose whole purpose is this comparison, specifically SKILL.md:38-40
  "`converge` treats a phase's / `VERIFICATION.md` (when present) as pre-confirmed evidence …
  but still runs / its own full sweep, since verifier only checks roadmap-level truths, not
  every FR/SC/AC." (`converge-9`, CONFIRMED, low.) Descriptive rationale only; its imperative
  other half is kept — see below.
- `converge itself writes no application code — appending the tasks is the whole of its job, and
  completing them is an implementation pass.` → SKILL.md:72-73 "modify, create, or delete any
  application code — completing the appended tasks is the job / of the implementation pass
  (`sprint-execution`)."; restated in the Step 8 handoff at SKILL.md:257-259. (`converge-11`,
  CONFIRMED, medium.) Same prohibition, same rationale, near-identical clause structure — and
  the skill's version is the stronger one, since it names `sprint-execution` as the handoff
  target where the KICKOFF says only "an implementation pass".
- `Tell me how many tasks it appended and to which plan file.` → SKILL.md:256-257 "On
  `tasks_appended`: state how many tasks were appended, under which `## Phase N: / Convergence`
  header(s), and in which `PLAN.md` file(s)". (`converge-12`, CONFIRMED, low.) The KICKOFF asks
  for a strict subset of what the skill already mandates — it drops the header-name element the
  skill also reports. See Risk.

Kept, from a CONFIRMED-redundant sentence:
- `so do not skip it just because verify came back passed` — the imperative half of the sentence
  whose descriptive half (`converge-9`) was cut. Verdict `converge-10` classes this
  **load-bearing-parameter**: SKILL.md:18-19 states the skill's only precondition ("This should
  run only after implementation has run on the current `PLAN.md`"), and `grep` for "passed"
  returns no hit anywhere in the 262-line file. A skill can never instruct that it be invoked —
  it only runs once dispatched — so the pipeline-level rule that a passing `verify` does not
  excuse skipping converge exists nowhere but here. Reworded, not dropped: `Run it even when
  verify came back `passed` — a pass there does not excuse skipping this step.`

## Parameters preserved
- **Invocation**: `Use the converge skill` — skill name unchanged, and phrased in the
  "Use the `<name>` skill" form KICKOFF.md:11-12 defines for skills (converge is a skill, not a
  `/dev-kit-core:` command and not an agent dispatch).
- **Placeholder `<NN>`**: `for phase <NN>` survives verbatim. This is the block's single real
  argument and the reason every cut path above is safe — verdict `converge-1` confirms
  SKILL.md:87 otherwise falls back to "the most recently modified phase directory, or by
  asking." Supplying `<NN>` removes the guess/ask branch, and Step 1 (SKILL.md:88-96) derives
  SPEC, PLAN, VERIFICATION, and CONSTITUTION from it. `<NN>` is the same placeholder the rest of
  step 11 uses (KICKOFF.md:828, 886), so the operator substitutes one value across the step.
- **Operator-judgment condition**: `Run it even when verify came back `passed`` — the gating
  decision the operator makes at this point in the step, preserved as an explicit imperative.
  This is the only conditional statement in the block and it is kept. It reads directly against
  the three verdicts described at KICKOFF.md:850-856 (`passed` / `gaps_found` / `human_needed`),
  which sit above the block and are untouched.
- **Unconditionality of the block itself**: the block carries no `*(only if …)*` prefix (unlike
  KICKOFF.md:836, 858, 881, 901) and the trim adds none — converge still runs on every pass of
  step 11.
- **Ordering / position in the step**: unchanged. The block stays between the `human_needed`
  block (858-865) and the remediation block (881-899), so converge still runs after `verify` and
  before the sprint-execution re-run. No parallelism was stated in the block and none was
  removed.
- **Downstream wiring**: the trimmed prompt still produces everything the next block consumes.
  KICKOFF.md:885-887 names `the `## Phase N: Convergence` section converge appended at the end of
  PHASE/<NN>-<MM>-PLAN.md` on its own, and KICKOFF.md:888-889 re-states the constitution-first
  ordering as an instruction to `sprint-execution` — neither depends on this block repeating
  them.
- **Output path / target filename**: none is an operator choice here. converge writes only by
  appending to the phase's own `PLAN.md` file(s) (SKILL.md:65-67, 207-214), which it locates from
  `<NN>`; there is no output path for the operator to supply, and the input paths cut above are
  the skill's own defaults, character-for-character.
- **Mode selection**: none. The one mode pair the skill exposes — all-plans (default) vs. a
  single plan file when "the user points at one plan file directly" (SKILL.md:53-54) — resolves
  to the default when no plan file is named, which is exactly what the trimmed prompt does. The
  cut phrase `every PLAN file for this phase` selected that same default, so behavior is
  identical.

## Risk
An operator loses nothing executable. Every cut sentence is re-asserted by the skill at load
time, most of them twice: the present-state/no-git framing (SKILL.md:21-22), the four input
paths (46-61 and again 90-96), the VERIFICATION.md pre-confirmed-evidence handling (13-14, 38-40,
124-131), the FR/SC/AC/constitution-MUST sweep (31-33, 137-166), the append target, header
string, taxonomy and task template (16-18, 155-162, 203-246), the never-rewrite/renumber rule
(70-71, 244), constitution-first ordering (243), the no-application-code prohibition (72-73,
257-259), and the count-and-file handoff report (256-257). Because SKILL.md Step 7 contains the
literal `<task>` template, the appended output is byte-identical in shape whether or not the
prompt describes it.

Three things a reader loses, all non-executable, and one judgment call:

1. **Preview.** The prompt no longer previews the sweep or the output shape. The step's own prose
   at KICKOFF.md:832-834 and 850-856 still frames what happens at this point, and the appended
   `## Phase N: Convergence` section is self-describing once written.
2. **The verifier-vs-converge rationale** (`converge-9`). The operator no longer reads *why* a
   `passed` verify does not excuse skipping converge, only *that* it does not. Acceptable: the
   instruction is what drives behavior, and the skill states the complementarity itself
   (SKILL.md:36-44) if anyone asks the model to explain it.
3. **The report-back ask** (`converge-12`) — this is the judgment call. The nomination note
   listed it as one of two things converge "cannot know on its own," but the verdict pass
   refuted that and confirmed it CONFIRMED-redundant against SKILL.md:256-257, which mandates a
   strict superset of it (count + header name + plan file) on the `tasks_appended` branch. I cut
   it on the verdict. The residual exposure is narrow and worth naming: the operator's *next*
   block (KICKOFF.md:881-882) branches on whether converge appended a section, so if a future
   edit to converge weakened its Step 8 handoff, this KICKOFF branch would lose its input with
   nothing local to catch it. That is a drift risk against a future skill, not a defect today,
   and it is the same class of coupling the trim removes everywhere else. If a reviewer prefers
   belt-and-braces on the one line that feeds an operator branch, restoring `Tell me how many
   tasks it appended and to which plan file.` costs one sentence and re-introduces no other
   redundancy — it is the cheapest revert in this block.

Same-block cut I did **not** make, and why: the four input paths (`converge-3`) are the closest
call against the "which artifact to feed in" bar, and I did cut them — unlike the sibling
`step02-sdd-review-cto` rewrite, which kept its artifact paths. The cases differ. In step 2 the
artifact is the *subject* of the invocation and the operator picks it. Here converge derives all
four paths from `<NN>` in its own Step 1, the KICKOFF's forms expand (via the shorthand legend at
KICKOFF.md:15-16) to the skill's defaults character-for-character, and every one still contains
unresolved `<M>` / `<NNN>-<slug>` placeholders the operator does not fill in — so they convey
strictly less than `<NN>` already does. Keeping them would only create two places for the default
paths to drift apart.
