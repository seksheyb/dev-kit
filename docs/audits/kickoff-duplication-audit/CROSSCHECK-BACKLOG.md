# KICKOFF.md × blueprint cross-check — open findings

Provenance: five cross-check passes of `KICKOFF.md` against
`../dev-kit/docs/gwd-pipeline-on-devkit.md` (690 lines at pass 1, 727 now), stage N ≡ step N.

**Status: pass 5 fully applied; nothing open.** Pass 5 (2026-07-27) had two halves. First, a
history-informed sweep caught the one thing pass 4 left dangling: O2's asset fix (`d396a27`) was
never re-synced into either document — `KICKOFF.md` step 6 still told the operator to hand-write
AI-SPEC.md §1/§2 and claimed `framework-selector` "writes no file", and the blueprint's stage 6
still said §1b-only. Fixed at `5735b09` (guide) and `5d84d1e` (blueprint, chain order aligned to
the guide's FS → AR → DR → EP per the O4 precedent). Second, a **fresh-eyes verification wave** —
four parallel verifiers partitioned by step range (0–3 / 4–7 / 8–11 / 12–15+globals), explicitly
barred from this backlog and git history, asset files as tiebreaker — confirmed the two documents
in sync on substance across all 16 stages and filed 11 residual findings (1 HIGH, 2 MEDIUM,
8 LOW), all applied same-day at `b27708d` (guide) and `4a97887` (blueprint); see
[Closed](#closed). **New invariants after pass 5:** `KICKOFF.md` 1394 lines / **98** paste
blocks / **198** fences (the 12a split added one block); blueprint 727 lines. Step-heading
conditionality (4/6/9 only) and `templates/SITEMAP.md` byte-identity unchanged.

**Status before pass 5: pass 4 fully applied; nothing open.** Passes 1–4 are applied and closed — see
[Closed](#closed). The pass-4 wave closed O1, O4 and O5, resolved O2's residual, and confirmed and
extended R2, all human-approved and committed (`devkit-pipeline` main head `5c49069`; `dev-kit`
main carrying `ca68472` `974ad14` `1f03a9f` `88a4713` `6b9b42c` in order). The one LOW the wave
filed (P4-1) was subsequently fixed at `ade736f`, leaving [Open](#open) empty apart from the
standing "Noted, not a defect" provenance item. Two pass-3 findings turned out wrong as prescribed — **L14** (corrected below) and **U7's
ordering half**, reversed by O4 — and pass 4 also produced one **phantom finding**, recorded below
as a lesson.

**What pass 3 confirmed is now correct** — do not re-audit these unless something changes:
no asset-name errors anywhere; step-level conditionality matches the blueprint exactly (steps 4, 6,
9 marked, the other 13 unmarked); all six cross-cutting assets fire where the blueprint says, with
context-save/`/clear`/context-restore perfectly paired across 6 boundaries including the skip path
and the loop back-edge; all three structural branches present; all four milestone-2+ mode changes
inside ```text blocks; `templates/SITEMAP.md` byte-identical to `dev-kit/docs/SITEMAP.md`; no
project-bound file references initiator-only material; 87 of 92 distinct core asset names appear in
the guide and the 5 absent are reachable via their commands.

**The shape of what's left.** Almost every pass-3 finding is the same defect class: the guide names
the **right asset at the right step** but hands it the **wrong inputs, the wrong order, or an output
contract the asset does not honor**. Pass 1–2 verified nouns; pass 3 verified contracts; pass 4
verified prescriptions — and reversed two of them (O1 retargeted rather than any of its three
listed ways out; O4 changed the blueprint, not the guide). That lens stack is the method now.

---

## Ground rules

Carried forward from passes 1–2, all still binding:

- Everything the operator must do goes *inside* a ```text block — prose above or below it never
  reaches the agent. Conditionals use `*(only if …)*` on their own line above the block.
- Fan-out steps say "Dispatch in one message," and only when the concurrent work genuinely does not
  collide.
- Do not reintroduce `PIPELINE.md`, mode tables, `config.json`, persisted step position, per-step
  contract files, `/devkit:` commands, `docs/devkit/`, or tests.
- Verify every asset noun against the filesystem, and read the asset's own file when a finding
  describes what it *does* — the blueprint has been wrong about its own assets more than once.

Added by pass 3:

- **Verify each dispatch block against the asset's own input contract** — its `<input>` block, its
  "Orchestrator provides:" line, or its "Inputs you receive from the orchestrator" section. A block
  that names the right agent but omits a required input produces a silently degraded run, which is
  worse than a crash. This is the single largest category below (M6, M7, M8, M12, M13, M17).
- **In a fan-out, check read-dependencies, not just write-collisions.** H1 exists because step 5's
  block reasons only about which files each agent *writes*.
- **Check that an asset's output has a consumer.** H2 and H4 are both artifacts produced with
  nothing downstream that reads or executes them.

---

## Open

Pass 4's O1–O5 are all closed, and P4-1 — the one LOW the wave filed — was fixed at `ade736f`.
See [Closed](#closed) for each resolution with its sha. Nothing is open.

### Noted, not a defect

`templates/SITEMAP.provenance` pins sha `7d12e66` while `dev-kit/docs/SITEMAP.md` last changed at
`361ae6c`. Contents remain byte-identical — track F re-confirmed the `diff` is empty after its
blueprint edits — so this is a snapshot sha rather than a file sha. Worth a comment line in the
file if file provenance was the intent.

---

## Correction to a pass-3 finding

**L14's stated fix was wrong as written, and was applied and then reverted mid-wave.**

L14 observed that three `dev-kit` assets read named sections out of a project's `CLAUDE.md` that
`templates/CLAUDE.md.template` never ships, and noted "all three degrade gracefully." That
observation is true of the sections being **absent**. The prescribed fix — "add stub headings with
a one-line `_(auto-detected if empty)_`" — does not follow from it, because several of these assets
branch on **section presence**, not on body content. An empty heading flips them out of their
fallback path and hands them nothing:

- `agents/health-reporter.md:12` — "if present, use those exact commands **and skip
  auto-detection**." An empty `## Health Stack` disables auto-detection and yields zero commands.
- `skills/land-and-deploy/SKILL.md:46` — "If CLAUDE.md has **no** `## Deploy Configuration`
  section, run this wizard." An empty stub silently cancels the first-run wizard — the same wizard
  M16 adds to step 13 in this very wave. Two findings in one wave would have cancelled each other.
- `agents/qa.md:139` — "if `CLAUDE.md` exists and **lacks** a `## Testing` section, append one";
  `skills/plan-review-eng/SKILL.md:121` — "authoritative if present." An empty stub blocks `qa`'s
  real append and out-trumps repo detection.

Track E shipped the stubs as stated, the orchestrator caught the regression on review, and track E
re-cut them as a single HTML comment that names each section in prose (`A Deploy Configuration
section`, not `## Deploy Configuration`) so no heading-match can fire. Three stubs survive as live
headings because their consumers are genuinely content-keyed or self-correcting:
`**Requirement Scope:**` (`agents/gate-automation.md:26-31` confirms against the repo and trusts
repo evidence on conflict), `## Test Coverage` (`skills/ship/SKILL.md` keys on the Minimum/Target
values), and `## Review Tier Default` (no asset reads it; operator-facing only).

**The lens this adds for pass 4:** pass 3 verified that a finding's *evidence* matched the asset.
It did not verify that the finding's *prescription* followed from that evidence. L14's evidence was
correct and its fix was still a regression. Check both.

---

## A phantom pass-4 finding — the Read-envelope artifact

Pass 4 filed and then dismissed one finding whose *evidence* was a tool artifact, not the file. The
reported `framework-selector.md:243` tag mismatch (stray `</output>`, unclosed `<success_criteria>`)
**does not exist** — the file is 242 lines and well-formed. The phantom line was the Read tool's own
result envelope (`</output>`) rendered as an extra numbered line at the end of any file read.
**Lesson for future passes:** a tag-balance finding anchored at exactly EOF+1 of a Read is suspect;
verify with `grep`/`od` against the file on disk before filing. This is the companion to the L14
lesson — L14 was correct evidence with a wrong prescription; this was wrong evidence outright,
manufactured by the reading instrument.

---

## Running the next pass

Pass 4 ran exactly as predicted here: no wave, everything inline. O1 and O4 were decisions backed
by asset-file research (both reversed the direction the handoff leaned); O5, R1 and R2 were applied
directly, and P4-1 was closed immediately after (`ade736f`). The next pass, if any, starts from a
clean slate — nothing is open.

**What pass 3's wave learned, for whenever a wave is next warranted:**

- **Partition by disjoint line range, not by file,** when nearly every finding edits one document.
  Six tracks, zero merge conflicts, merged in range order so drift accumulated predictably.
- **Disjoint ranges are not semantic independence.** Track E's `## Deploy Configuration` stub would
  have silently cancelled the wizard track D was documenting in the same wave. Nothing in the
  partition could have caught that; only reviewing the merged result did.
- **Verify the prescription, not just the evidence.** L14's quotes were all accurate and its fix was
  still a regression. Ask what an asset branches *on* — presence or content — before adding
  anything it reads.
- **Check the asset's input contract, not its name.** 13 of the 22 swept findings were dispatch
  blocks that named the right asset and starved it. This remains the dominant defect class.
- **Give each track the shared facts verbatim** where two tracks touch one fact in two repos
  (M2/U4, H1/U7, L1/M8). Tracks cannot talk to each other; the orchestrator has to pre-reconcile.

**Verify the way passes 3–4 did.** Read the asset's own file before touching any block that
describes what it does, and check the input contract against the dispatch block. Do not trust this
backlog's line numbers after the first edit lands; re-anchor by content.

## Closed

**Pass 5 (`devkit-pipeline` `5735b09` `b27708d`; `dev-kit` `5d84d1e` `4a97887`).** The O2 resync
(above) plus the fresh-eyes wave's 11 findings, all applied:
- **HIGH (guide, 12a):** the guide collapsed the blueprint's two independent functional
  predicates into one *(UI **or** dev-facing)* marker over a single block dispatching all three
  auditors — a CLI-only milestone would have run `design-reviewer`+`accessibility-tester`
  against no rendered surface, and `accessibility-tester` has no browser-stop to save it. Split
  into two separately-marked blocks (UI → design-reviewer + accessibility-tester; dev-facing →
  devex-review), taking the block count 97 → 98.
- **MEDIUM (guide, step 0):** the legacy block offered "or rewrite" as a migration-strategy ADR
  choice; `legacy-modernizer/SKILL.md:117` prohibits big-bang rewrites under MUST NOT. Menu now
  reads strangler fig or branch by abstraction, prohibition named.
- **MEDIUM (blueprint):** `PROJECT.md` had zero mentions despite `roadmapper` listing it as a
  required input and `market-researcher` reading it — added to stage 0's outputs (glance row +
  item 1) and stage 3's roadmapper inputs.
- **8 LOW:** guide — escalation example's lens-naming suppresses the all-four default (noted, with
  the design/devex-when-applicable rule); "silently skips" overstated `document-release`'s
  skip-with-a-message (`SKILL.md:334`). Blueprint — row 1 Out missing
  `SPEC/checklists/requirements.md`; `spec-review-cpo` gate row contradicted the stage-1 prose
  (now Always); row 3 Out missing `REQUIREMENTS.md` (roadmapper creates it); stage-6's
  rag-architect/prompt-engineer/ml-pipeline sentence now says Stage-8-routed; glance row 8 +
  stage-8 item 7 now name the per-phase `design-html` invocation stage 4 already described;
  `integration-checker` got its missing S11 gate row (skip on first phase); S13 platform list
  gained Heroku/Railway per `land-and-deploy/SKILL.md:50`.
**Delta verification (same day, closing the loop the L14 lesson demands):** because the wave's
fixes landed *after* the verifiers read the documents, a fifth, delta-scoped verifier re-audited
every changed region of all four pass-5 commits — asset ground truth, regression-in-context
(old-vs-new block contents line by line), cross-doc sync, mechanical invariants — with no
backlog access. Verdict **CLEAN, zero defects**; four nits, three applied (devex-review
"only reads" → runs-but-never-commits; the skeleton's "each heading carries an attribution"
overclaim — §2's heading carries none; the step-13 wizard's platform list gained
`railway.toml`/`.vercel` to match `land-and-deploy/SKILL.md:50`), the fourth (Always-row column
style) noted and skipped.
Method notes for pass 6: the fresh-eyes wave (no backlog access, asset-file tiebreaker,
quote-per-side required) surfaced real findings all four history-informed passes missed, at the
cost of re-reporting nothing — every deliberate divergence (eval-auditor early in step 11,
land-and-deploy at end of step 14, single-mode `/review` labeling) was correctly recognized from
the documents' own stated rationale. Every load-bearing quote was re-verified on disk by the
orchestrator before any fix was applied (the Read-envelope lesson); none were phantoms.

**Pass 4 (`devkit-pipeline` `5c49069`; `dev-kit` `ca68472` `974ad14` `1f03a9f` `88a4713` `6b9b42c`
`ade736f`, in order).** All five handoff tasks done inline, no wave, plus P4-1 closed immediately
after; every change human-approved and committed.
`KICKOFF.md` went 1365 → 1372 lines, blocks stayed at 97, fences at 196; all standing checks re-run
green (conditional markers still only on steps 4/6/9; `templates/SITEMAP.md` diff still empty). The
blueprint went 711 → 714. Two decisions reversed the direction the handoff leaned (O1, O4) — both
on evidence read out of the asset files themselves.

**O1 (`974ad14`, `roadmapper.md`) — retargeted, not deleted and not narrowed.** The research that
decided it: (1) the input is a content-branch — one scalar, `granularity`, tuning the 3-5/5-8/8-12
phase-count band that `:224` already subordinates to the work — so no L14 presence-branch hazard;
(2) **nothing in `dev-kit` writes `docs/state/config.json`** — 3 readers, 0 writers, no config
command has ever existed — so the input was unsatisfiable regardless of the guide; (3) the
prohibited `config.json` was the *pipeline-owned* position/mode file (`devkit-pipeline` `d1b3895`
schema: `pipeline`/`position`/`entry_path`/`flags`, zero key overlap with `granularity`; killed in
`ab5deff`), but the path collision was deliberate (the step0 spec: "config.json already exists in
that contract, so position goes there"), so narrowing the prohibition re-opens that door;
(4) decisively, sibling `planner.md:399-407` carries the *identical* Granularity Calibration table
with no file source at all — orchestrator-supplied. `roadmapper` was the odd one out via unpruned
GSD `.planning/config.json` inheritance dangling since the initial import `ca27c7f`. Fix, 4
anchors: `:471` → "granularity (optional; coarse|standard|fine — assume standard if not supplied)";
`:216` reads from the dispatch prompt with a `standard` default; `:16` drops ", config.json" from
the state-dir sentence; the `:427`/`:580` placeholder leaks "[from config]"/"{from config}" fixed.
`grep 'config.json' roadmapper.md` now returns 0. Zero runtime behavior change — the file never
existed in any run. `KICKOFF.md` needed no edit: M6's silent omission of the input is now correct
rather than merely consistent.

**O4 (`ca68472`, blueprint only) — the guide's order won; the blueprint changed.** Decisive
evidence from the asset: `advisor-researcher.md` has no `Write` tool and states "this agent reads
and writes no files itself … the returned table is folded by the caller into artifacts such as
…/RESEARCH.md" — and `phase-researcher` is what creates `RESEARCH.md`, so the causal arrow runs
opposite to U7's listing: the tables have nowhere to land until `RESEARCH.md` exists. Swapped at
all three blueprint sites (stage-table row 5, the stage-5 bullet list, the asset-inventory
appendix), plus a three-line rationale note on the `advisor-researcher` bullet mirroring
`pattern-mapper`'s "Runs last" note. `pattern-mapper` stays last everywhere — U7's substantive half
untouched. `KICKOFF.md` unchanged.

**O5 (`5c49069`, `KICKOFF.md` step 10).** The `qa` browser caveat folded into the *existing*
pre-dispatch ```text block — same precondition class as the clean-tree and bootstrap checks already
there, so no new block and the count stays 97. Verified against `agents/qa.md`, which corroborated
everything and added one nuance now stated in the guide: `qa.md:58`/`:143` exempt `report_only`
from the clean-tree stop and the bootstrap, but the browser check at `qa.md:102` sits in Setup,
which `report_only` *does* run — so that precondition applies in `report_only` mode too. The prose
lead-in "Add `report_only` when you want…" became an `*(instead of the bare command above, only
if …)*` marker line per house convention. Step 10 now matches step 12a's shape.

**O2's residual (R1, `1f03a9f`) — resolved as not-a-defect; the skeleton stays in
`framework-selector.md`.** The drift surface is 2 files, not 4: only `framework-selector` and
`domain-researcher` emit literal `##` headings (byte-consistent today); `ai-researcher` and
`eval-planner` name sections in prose against pre-existing placeholders and cannot drift the
numbering; `eval-auditor` reads by topic. All 7 existing template assets have exactly *one*
authoring agent, PLAN/RESEARCH/PATTERNS/REVIEW have no template, and AI-SPEC is the suite's only
multi-author doc. The decisive blocker: `references/` paths resolve within the owning plugin, and
`domain-researcher` lives in core while the other three live in data-ai — a template would need
duplication into both plugins (manufacturing the R2 defect class) and would add a required read to
the chain's *first* agent (missing reference = no AI-SPEC at all, silent and unrecoverable; heading
drift = a visible duplicate section plus `eval-planner:42`'s explicit missing-section handling,
loud and recoverable). Mitigation applied: a `> Note:` blockquote in `domain-researcher.md` above
`write_section_1` naming `framework-selector`'s `<write_section_2>` as skeleton owner and requiring
verbatim heading match, explicitly covering `write_section_1b` too.

**R2 (`88a4713`, `references/` duplicates) — confirmed and extended.** `diff`/`md5sum`: both
reported pairs byte-identical, *and* the sweep found a third unfiled pair,
`references/ai/frameworks.md`. The core copy had **zero readers in its own plugin** — both readers
(`framework-selector:22`, `ai-researcher:45`) are data-ai — so it was deleted (`git rm`). The other
two pairs **stay**: each has live readers in its own plugin (`domain-researcher:45` in core reads
`evals.md`; ~20 core assets + 2 data-ai agents read `doc-sitemap.md`), and the plugins are
independently installable (`marketplace.json` flat peers, no dependency fields in any
`plugin.json`), so cross-plugin paths are impossible — the duplication is *required*, not
accidental. `doc-sitemap.md`'s existing sync header pointed at a nonexistent repo-root
`references/` path; corrected on both copies to name `plugins/dev-kit-core/references/doc-sitemap.md`
as source of truth, and `evals.md` gained the same header naming
`plugins/dev-kit-data-ai/references/ai/evals.md`. Both pairs verified byte-identical after the
edit. Release check, no new asset needed:
`find plugins/*/references -type f -exec md5sum {} \; | sort | uniq -Dw32`.

**P4-1 (`ade736f`, `phase-researcher.md`) — retargeted, same shape as O1.**
`agents/phase-researcher.md:505,591,593` read `workflow.nyquist_validation` and `commit_docs` from
`docs/state/config.json` — the same unpruned GSD `.planning/config.json` inheritance `974ad14`
removed from `roadmapper`, though absence-safe here by construction with documented defaults.
Filed as a LOW by the wave, then fixed on request: all three reads now source from the
orchestrator's dispatch prompt, defaults preserved verbatim (`commit_docs` `true`,
`nyquist_validation` enabled), so behavior is unchanged — the reads could never have resolved.
The precedent was again in-house: `planner.md:836` already sources the identical config-style
values (`commit_docs` included) from the dispatch prompt with project defaults when silent.
**No asset now reads `docs/state/config.json`**; the only remaining mentions in `plugins/` are the
two doc-sitemap migration-table rows, a legitimate `.planning/` → `docs/state/` mapping mirroring
`docs/SITEMAP.md:172`, deliberately untouched.

**Side findings (`6b9b42c`).** Stale pre-rename filenames fixed: `framework-selector.md:121`
"ai-frameworks.md" → `references/ai/frameworks.md`; `eval-planner.md:48,:61` "ai-evals.md" →
`references/ai/evals.md`; `docs/catalog/data-ai.md:130` phantom `references/gsd/` path →
`references/ai/frameworks.md`. And the step0-design spec
(`docs/superpowers/specs/2026-07-26-devkit-pipeline-step0-design.md`) — superseded by `ab5deff`
the day it was approved, and the only doc in either repo asserting `config.json` carries
position/mode — now labelled "**Status:** Superseded" with a banner blockquote under the title.

**O2 (`d396a27`) · `SPEC/AI-SPEC.md` §1 and §2 had no authoring asset.**
Filed by track B as B-N5 while applying H2. `domain-researcher` writes §1b, `ai-researcher` §3–4b,
`eval-planner` §5–7. Nothing wrote §1 (critical failure modes) or §2 (framework); `eval-planner`
only *reads and confirms* §1 (`agents/eval-planner.md:41`). H2 described the hole as "§2–§4b"; the
true hole was §1 and §2, and `ai-researcher` already covered §3–4b all along.
**Resolved in `dev-kit`:** §2 (framework) → `framework-selector`, which already produced exactly
that payload and discarded it after returning to the orchestrator; it runs first, so it now creates
`AI-SPEC.md` with the full §1–§7 skeleton and per-section author attributions. §1 (critical failure
modes) → `domain-researcher`, which already researches domain failure modes and runs before
`eval-planner` reads them — persistence of existing capability, not new capability. `eval-planner`
was rejected as §1's author because it *confirms* §1, and an agent confirming its own output is the
hole this finding named. `framework-selector` also needed `Write` added to its frontmatter `tools:`.
The residual — no canonical AI-SPEC template asset — is resolved as not-a-defect at `1f03a9f`; see
the O2-residual entry above.

**O3 · The `dev-kit` merge.** `pass3/track-f` carries U1–U8 + A1 + F-N2 in two commits
(`990893c` blueprint, `bcfa67e` `cso/SKILL.md`). Merged to `dev-kit` main and pushed after review,
together with the O2 fix (`d396a27`). `crosscheck/pass3` likewise merged to `devkit-pipeline` main
and pushed at `3810406`.

**Pass 3 (`b75c942`..`984e454`).** All 49 filed findings applied, none skipped, across six
parallel tracks partitioned by disjoint line ranges of `KICKOFF.md` rather than by file. Merged in
range order A → B → C → D so line drift accumulated predictably; every merge was conflict-free.
`KICKOFF.md` went 977 → 1365 lines, 82 → 97 paste blocks. The blueprint went 690 → 711 lines.

| Track | Range | Findings | Swept | Merge |
|---|---|---|---|---|
| A | steps 0–3 | M1 M2 M3 M5 M6, L1–L4 | A-N1…A-N4 | `c7da78a` (ff) |
| B | steps 4–7 | H1 H2, M4 M7 M8 M9, L5 L6 L15 | B-N1…B-N5 | `884f488` |
| C | steps 8–11 | H3 H4, M7(:447) M10–M13, L7 L8 L9 L14(:671) L17 | C-N1…C-N4 | `8ecaad5` |
| D | steps 12–15 | M14–M19, L10–L13 | D-N1…D-N5 | `984e454` |
| E | `templates/` | L14(template half) L16 | E-N1…E-N4 | `eb568f1` |
| F | `dev-kit` | U1–U8, A1 | F-N2 | **unmerged** — see O3 |

Two findings were routed against their listed track because the *fix location* differed from the
first anchor line: **M4** (anchors `:74`/`:82`, but its entire fix is a new block at the top of
step 5) went to B, and **M7's `:447` half** went to C alongside L7. Both were applied.

**The 22 structural-sweep findings.** The mandate to treat each finding as a defect class rather
than a line paid for itself — the sweep found 22 more instances, most of the same
missing-input class pass 3 identified as the dominant one:

- **A-N1** `doc-synthesizer` dispatched with none of its four required inputs · **A-N2** an
  operator action parked in prose · **A-N3** `market-researcher` given no focus or project context ·
  **A-N4** the four `project-researcher` agents dispatched with no context, each defaulting to
  write `STACK`/`FEATURES`/`PITFALLS` every run (`:540-543`) — four parallel agents overwriting
  each other, the same read/write-collision blindness as H1, found by sweep rather than by filing.
- **B-N1/B-N2** step 5's fan-out and research blocks passed no inputs at all · **B-N3** the UI block
  passed only `DESIGN.md` · **B-N4** `PHASE/UI-SPEC.md` and `SPEC/AI-SPEC.md` are M9's class too —
  `grep -c` returns 0 in `planner.md`, so step 6's specs never reached step 7's planner ·
  **B-N5** → promoted to O2.
- **C-N1** `code-review-gate`'s round-mode dispatch omitted `branch` · **C-N2** `/dev-kit-core:review`
  parked in a prose parenthetical · **C-N3** `eval-auditor`'s BLOCKER verdict had no consumer ·
  **C-N4** `nyquist-auditor`'s ESCALATED items had no consumer — both the H4 class.
- **D-N1** `penetration-tester` given none of its rules-of-engagement inputs · **D-N2**
  `compliance-auditor` given only the regime · **D-N3** the manual-path merge parked in prose,
  dropping `land-and-deploy`'s post-merge deploy poll that step 15's SLO review assumes ran ·
  **D-N4** a design-score delta against a baseline that does not exist on milestone 1 · **D-N5**
  `accessibility-tester` given no WCAG conformance target.
- **E-N1/E-N2/E-N3** three more `CLAUDE.md` sections in L14's class · **E-N4** → the L14 correction
  above. **F-N2** the Specialized lane appendix claimed Stage 0/8 where no stage section places it.

**Verified at merge.** Every asset noun in `KICKOFF.md` resolves on disk with the kind the guide
gives it (`agents/*.md` vs `skills/*/SKILL.md` vs `commands/*.md`) — full sweep, zero misses; L7's
two were the only kind errors and are fixed. All 196 fences balance into 98 pairs. Step-level
conditionality is untouched: steps 4, 6 and 9 marked, the other thirteen unmarked. `templates/
SITEMAP.md` remains byte-identical to `dev-kit/docs/SITEMAP.md`. Track F independently checked all
33 `docs/`-family paths in the blueprint against SITEMAP and found U6 the only stale one, so the
path-drift class is closed upstream as well.

**Passes 1–2 (`8e20ec7`, `c8e5656`, `3c5a428`, `43caf00`).** All HIGH findings, then the remaining
22 MEDIUM and 18 LOW — M5–M14, M17–M28, L1–L18 — plus two upstream `dev-kit` fixes, applied across
two step-partitioned agents and merged. Nothing was skipped. `KICKOFF.md` went 694 → 977 lines,
69 → 83 paste blocks. Every asset noun was verified against the filesystem in those passes and **no
name errors remain** — pass 3 re-confirmed this independently.

Highlights worth not re-deriving: the `PHASE/RESEARCH.md` reconciliation rule (M6); the UI chain
reading `DESIGN.md` with `ui-checker` BLOCKing on drift (M8); the debug knowledge base and `learn`
ledger kept deliberately separate (M13); `planner` consulting the step 0 security baseline (M26);
`ui-auditor`'s actual contract (L1); `sprint-execution`'s mechanical merge verification (L4). The
two upstream fixes: line 264's Claude Design prompt path corrected to
`docs/state/tmp/claude-design-system-prompt.md`, and lines 265-266's "proceeds without blocking"
corrected — true of `design-consultation`'s own run, false downstream, since `design-html` **stops**
when unbound.

**Known and accepted** (pass 1 sweep M29, re-confirmed in pass 3): blueprint `:397`/`:632` make the
`review` command stage 10's entry point, but `commands/review.md:8` dispatches `code-review-gate` in
**single** mode with engine `claude`. The round-mode loop `KICKOFF.md` drives directly is the correct
behavior; a reader reconciling the two may run single mode as round 1. Not a change. Track C's
C-N2 now labels the `/dev-kit-core:review` block as single mode so it is not mistaken for round 1.
