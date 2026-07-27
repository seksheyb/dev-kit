# step10-qa-tiers-and-preconditions
step 10 — QA · KICKOFF lines 763-795 · assets: qa

Source: `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md` lines 763-795 — the fenced
pre-flight block (763-780), the `/dev-kit-core:qa` fence (782-784), the prose narration
(786-791) and the italic report_only condition (793-795).

Outside the replaced range and left untouched:
- line 761, `Once the loop exits clean:` — cross-skill ordering, CONFIRMED load-bearing (qa-1).
- lines 796-798, the ```` ```text / /dev-kit-core:qa report_only / ``` ```` fence — the
  invocation the italic condition at 793-795 introduces.
- line 800, `*(only if this phase shipped UI)*` — the next step's operator-judgment condition.

Assets read (complete coverage surface — no `references/` chain exists for this asset;
`plugins/dev-kit-core/agents/references/` and `plugins/dev-kit-core/commands/references/` are
both absent):
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/qa.md` (327 lines)
- `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/commands/qa.md` (9 lines)

Verdicts applied: `verdicts/qa.json` — all 11 claims CONFIRMED. Cut the six
`redundant-restatement` claims (qa-2, -3, -5, -6, -7, -9, -10 — with qa-3 and qa-6 trimmed to
the scope the verdict itself specifies, not deleted); kept every `load-bearing-parameter` claim
(qa-1, -4, -11). The lone `contradiction` (qa-8) is dissolved rather than patched: it lived
inside the same sentence as qa-7's tier table, so cutting the table removes the false promise.

## Current (verbatim)
```text
Before QA runs, check `git status --porcelain` comes back empty and tell me if it does not.
In full mode the qa agent stops on a dirty tree, because every fix it makes needs its own
atomic commit — commit or stash first, and say which you did. Then check whether this repo
already has a test framework, because full-mode qa bootstraps one when it finds none, before
QA proper begins: it installs a framework, seeds a handful of real tests, writes
docs/global/process/TESTING.md, appends a `## Testing` section to CLAUDE.md if one is missing,
writes .github/workflows/test.yml when the repo has no CI config, and commits all of that as a
single `chore: bootstrap test framework` commit. Tell me before you let it do that. Neither the
clean-tree stop nor the bootstrap applies in report_only mode.

Then confirm browser tooling is available in this session — an in-session browser pane,
Playwright MCP, or a headless-browser CLI — because the qa agent drives a live browser and with
none available it says so and stops rather than substituting unit tests. That stop is the
correct outcome, not a failure. Unlike the two preconditions above, this one applies in
report_only mode too: report_only still runs the full browser baseline, it just does not fix
anything afterwards.
```

```text
/dev-kit-core:qa
```

Browser-driven QA against the running app: it exercises the thing like a real user and returns a
health score with before/after screenshot evidence. At the default **Standard** tier it fixes
critical, high and medium findings in source with atomic commits and a regression test per fix,
then re-verifies — low and cosmetic findings are recorded as *deferred*, not fixed (Quick fixes
only critical + high; Exhaustive fixes everything down to cosmetic). Anything unfixable from
source — a third-party widget bug, an infrastructure issue — is deferred at every tier.

*(instead of the bare command above, only if you want the defects documented and nothing
touched — report_only runs the browser baseline and the report and stops there: no fixes, no
source reading, no edits, no commits, and no test-framework bootstrap)*

## Trimmed
```text
Before full-mode QA runs, check `git status --porcelain` comes back empty and tell me if it does
not — commit or stash first, and say which you did. Then check whether this repo already has a
test framework: full-mode qa bootstraps one when it finds none, committing the framework, seed
tests, docs/global/process/TESTING.md, a CLAUDE.md `## Testing` section and
.github/workflows/test.yml as a single `chore: bootstrap test framework` commit before QA proper
begins. Tell me before you let it do that.

Then confirm browser tooling is available in this session. With none the qa agent stops — that
stop is the correct outcome, not a failure. Unlike the two preconditions above, this one applies
in report_only mode too: report_only still runs the full browser baseline, it just does not fix
anything afterwards.
```

```text
/dev-kit-core:qa
```

Browser-driven QA against the running app: it exercises the thing like a real user and returns a
health score with before/after screenshot evidence.

*(instead of the bare command above, only if you want the defects documented and nothing
touched)*

33 lines → 23 (the pre-flight fence 18 → 13, the prose narration 6 → 2, the italic condition
3 → 2; the `/dev-kit-core:qa` fence unchanged).

## What was cut, and which skill sentence covers it
- "In full mode the qa agent stops on a dirty tree, because every fix it makes needs its own
  atomic commit" (qa-2, medium) → agents/qa.md:52 "**Check for clean working tree (full mode
  only):**", :55 `git status --porcelain`, :58 "If dirty, **STOP** and ask the user/orchestrator:
  commit the changes, stash them, or abort — each bug fix needs its own atomic commit on a clean
  tree." Reinforced by Rule 12 at :326 "**Clean working tree required (full mode).**" The
  verdict's one genuine delta is *timing* — pre-flight instead of mid-run, which saves a wasted
  unattended dispatch — so the check itself, the exact command, and "say which you did" are
  retained; only the skill's own justification and stop-behavior restatement are dropped.
- "it installs a framework, seeds a handful of real tests, writes docs/global/process/TESTING.md,
  appends a `## Testing` section to CLAUDE.md if one is missing, writes .github/workflows/test.yml
  when the repo has no CI config, and commits all of that as a single …" (qa-3, medium) →
  agents/qa.md Phase 1b steps 5-10 in the same order: :136 install and configure, :137 "Seed 3-5
  real tests", :139 "write or update `docs/global/process/TESTING.md` … and, if `CLAUDE.md` exists
  and lacks a `## Testing` section, append one", :140 `.github/workflows/test.yml`, :141
  `git commit -m "chore: bootstrap test framework ({framework})"`. Per the verdict this is
  **trimmed to a one-line side-effect summary, not deleted** — the operator cannot read
  agents/qa.md, so the retained approval gate "Tell me before you let it do that" is
  uninformative without knowing what "that" writes. The summary also drops the guide's inaccurate
  CI condition ("when the repo has no CI config"); :140 actually fires when `.github/` exists OR
  no CI config is found anywhere, and skips for non-GitHub providers.
- "Neither the clean-tree stop nor the bootstrap applies in report_only mode." (qa-5, low) →
  agents/qa.md:58 "(Skip this check entirely in report_only mode — no commits will be made.)" and
  :143 "Skip this entire phase in `report_only` mode". The sentence is gone, but the mode scoping
  it carried is folded into the two retained clauses as the words "full-mode", so the retained
  text stays accurate for a report_only operator instead of over-instructing them.
- "— an in-session browser pane, Playwright MCP, or a headless-browser CLI — because the qa agent
  drives a live browser and … rather than substituting unit tests" (qa-6, medium) →
  agents/qa.md:10 "Use whatever browser automation is available in the session — an in-session
  Browser pane …, Playwright MCP, or a headless-browser CLI. … If no browser tooling is available,
  say so and stop — do not substitute unit tests for browser QA."; also :102 "Verify browser
  tooling is available" and Rule 11 at :325. The verdict scopes the cut to 774-776 and explicitly
  keeps 776-779, so "that stop is the correct outcome, not a failure" and the report_only
  disambiguation survive; a four-word antecedent ("With none the qa agent stops") is retained
  only so "that stop" has a referent.
- "At the default **Standard** tier it fixes critical, high and medium findings in source with
  atomic commits and a regression test per fix, then re-verifies — low and cosmetic findings are
  recorded as *deferred*, not fixed (Quick fixes only critical + high; Exhaustive fixes everything
  down to cosmetic)." (qa-7, high) → agents/qa.md:45-48 "**Tiers determine which issues get fixed
  (full mode only):** / - **Quick:** Fix critical + high severity only / - **Standard:** + medium
  severity (default) / - **Exhaustive:** + low/cosmetic severity", restated as Phase 7 triage at
  :218-221. Not mode selection: the invocation is the bare `/dev-kit-core:qa`, and commands/qa.md:5
  parses `$ARGUMENTS` only for a `report_only` flag — the command exposes **no tier argument at
  all**, so naming Quick and Exhaustive selects nothing an operator can act on. Cutting this
  sentence also removes the CONFIRMED contradiction (qa-8): "a regression test per fix" is
  unqualified, while Phase 8e.5 at :251 skips it when the fix is not "verified", is purely
  visual/CSS, or no test framework exists, and :262 also skips on >2 min exploration or a
  still-failing test. The guide's own summary manufactured that promise; deleting it is the fix.
- "Anything unfixable from source — a third-party widget bug, an infrastructure issue — is
  deferred at every tier." (qa-9, medium) → agents/qa.md:223 "Mark issues unfixable from source
  (third-party widget bugs, infrastructure issues) as \"deferred\" regardless of tier." Near
  verbatim, parenthetical examples included; the agent applies it to itself unconditionally.
- "— report_only runs the browser baseline and the report and stops there: no fixes, no source
  reading, no edits, no commits, and no test-framework bootstrap" (qa-10, medium) →
  agents/qa.md:12 "run ONLY the QA baseline (Phases 1-6 + report). Never fix bugs, never read
  source code, never edit files, never commit."; bootstrap exclusion at :143; reinforced at :197
  and Rule 13 at :327 and Rule 5 at :319. All five enumerated consequences map item-for-item; the
  operator-facing choice is carried entirely by the retained clause before the dash.

## Parameters preserved
- **Ordering (cross-skill):** step 10 QA runs after the review/fix loop exits clean — line 761
  `Once the loop exits clean:` sits outside the replaced range and is untouched (qa-1).
- **Pre-flight timing:** the clean-tree check still happens *before* dispatch, not mid-run —
  this is the sole genuine delta over the skill's own Setup gate.
- **The exact command:** `git status --porcelain`, unchanged.
- **The expected result and the report-back:** "comes back empty and tell me if it does not";
  remediation options narrowed to commit-or-stash plus "say which you did".
- **Mode scoping of both preconditions:** "full-mode" retained on the tree check and on the
  bootstrap, so a report_only operator is not sent to do checks the skill skips.
- **The human approval gate:** "Tell me before you let it do that." retained verbatim — the skill
  deliberately has no such gate (:122 "this agent runs unattended, so don't stop to ask"), so this
  is an operator-inserted stop, not a restatement (qa-4).
- **Bootstrap side-effect referents** kept so that gate is actionable: the framework install,
  seeded tests, `docs/global/process/TESTING.md`, the CLAUDE.md `## Testing` section,
  `.github/workflows/test.yml`, and the `chore: bootstrap test framework` commit message.
- **The bootstrap's position in the run:** "before QA proper begins".
- **The browser-tooling precondition** as a distinct pre-flight check the operator performs.
- **The stop-is-correct framing:** "that stop is the correct outcome, not a failure" — human
  framing absent from the skill, kept verbatim.
- **The report_only applicability disambiguation:** "Unlike the two preconditions above, this one
  applies in report_only mode too: report_only still runs the full browser baseline, it just does
  not fix anything afterwards." Kept verbatim; "two preconditions" is still arithmetically correct
  after the trim (clean tree, bootstrap approval).
- **Both invocations verbatim:** `/dev-kit-core:qa` (782-784, inside the range, unchanged) and
  `/dev-kit-core:qa report_only` (796-798, outside the range, untouched).
- **The report_only mode-selection condition:** "instead of the bare command above, only if you
  want the defects documented and nothing touched" — the alternative-not-additional framing and
  the operator judgement it gates (qa-11).
- **What the step returns:** "a health score with before/after screenshot evidence" — never
  adjudicated as redundant, so it stays.
- **Block structure:** same three-part shape in the same order — pre-flight fence, command fence,
  italic condition introducing the report_only fence — so line 796 onward still reads correctly.
- **Downstream:** line 800 `*(only if this phase shipped UI)*` untouched.

No output path, target filename, placeholder, or artifact-feed parameter is supplied by this
block in the first place: KICKOFF never sets the qa agent's target URL, tier, output dir, scope,
or auth, and the agent defaults them itself (agents/qa.md:33-43, plus :50 auto-entry into
diff-aware mode on a feature branch). Nothing of that kind existed to lose.

## Risk
Small and bounded, in three places.

1. **Tier taxonomy.** An operator who reads the trimmed guide no longer learns that low and
   cosmetic findings come back *deferred* rather than fixed, and could read a deferred low-severity
   issue as a miss. Acceptable: the tier is not selectable from this command (commands/qa.md:5
   parses only `report_only`), so the knowledge cannot change any decision the operator makes here,
   and the QA report itself labels every deferred issue and its status (agents/qa.md:285-287). The
   trade is strictly favourable — the same four lines were also the source of the CONFIRMED
   contradiction about a regression test per fix, so an operator loses a taxonomy they cannot act
   on and stops being told something the agent will routinely not do.
2. **Bootstrap detail.** The one-line summary is thinner than the original enumeration — an
   operator approving the bootstrap sees the artifacts and the commit message but no longer the
   per-file conditions ("if one is missing", the CI condition). Acceptable, and net-positive: the
   dropped CI condition was factually wrong, and the retained list is enough to answer the only
   question the gate asks, namely "do I want files written to my repo before QA starts".
3. **Browser-tooling options.** The trimmed text says "confirm browser tooling is available"
   without listing what counts. An operator unsure whether their setup qualifies has one fewer
   cue. Acceptable: the agent enumerates the same three options at :10 and checks for them itself
   at Phase 1 (:102), and the retained sentence preserves the only thing the operator actually
   needs from this precondition — that a stop here is correct rather than a failure to route
   around.

Nothing here is a case where the trim is unsafe. The one thing I deliberately did **not** cut
despite a CONFIRMED redundant verdict is the pre-flight `git status --porcelain` check (qa-2):
the verdict itself identifies the timing delta as genuine, and deleting it would hand the
operator an unattended dispatch that stops mid-run — a real regression in operator experience,
even though the end state is identical.
