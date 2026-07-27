# step15-closeout-methodology
step 15 — milestone close-out · KICKOFF lines 1304-1315, 1354-1364 · assets: performance-engineer, incident-responder, compliance-auditor

Source: `/home/ubuntu/skillsproject/devkit-pipeline/KICKOFF.md`
Assets: `/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/performance-engineer.md`,
`/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/incident-responder.md`,
`/home/ubuntu/skillsproject/dev-kit/plugins/dev-kit-core/agents/compliance-auditor.md`
(none of the three has a `references/` chain — verified: no `agents/references/` dir exists, and
none of the three files contains a `references/` link)

## Current (verbatim)

Block A — lines 1304-1315:

```text
```text
Dispatch the performance-engineer agent over what this milestone shipped. Measure first — no
optimizing on a hunch. Establish the baseline and profile the running system, then eliminate the
single biggest bottleneck, re-measure, and iterate; the usual suspects are N+1 queries, pool
exhaustion, cache misses, synchronous blocking, and memory leaks. Write
docs/global/ops/monitoring/performance-report.md with before and after numbers — response time,
throughput, resource use — the bottlenecks found, the fixes applied, and the evidence validating
each gain, plus the alert thresholds that keep the gains from regressing. A report without
before/after numbers is not a performance pass. If the bottleneck turns out to be infra-wide or
capacity-related rather than app-level, hand the dashboard and capacity follow-through to
monitoring-expert rather than continuing to profile app code.
```
```

Block B — lines 1354-1364:

```text
```text
Use the incident-responder agent: triage, contain, preserve evidence, diagnose, recover, then
write the blameless postmortem to docs/global/ops/postmortems/. Containment never comes at the
cost of evidence integrity — preserve first, then clean up.

If this incident has regulatory exposure — a security breach, or any incident touching personal
or regulated data — hand off to the compliance-auditor agent for the framework-specific
breach-notification obligations, and do it early rather than at postmortem time. Disclosure
deadlines start running from discovery, not from the fix, so surface the applicable regime and
its clock to me while the incident is still open.
```
```

(The gating line immediately above Block B — `*(only if a production incident is underway)*` at
line 1353 — is outside the trim range and is untouched.)

## Trimmed

Block A — replaces lines 1304-1315:

```text
```text
Dispatch the performance-engineer agent over what this milestone shipped. Write
docs/global/ops/monitoring/performance-report.md. A report without before/after numbers is not a
performance pass.
```
```

Block B — replaces lines 1354-1364:

```text
```text
Use the incident-responder agent. Write the blameless postmortem to
docs/global/ops/postmortems/.

If this incident has regulatory exposure: disclosure deadlines start running from discovery, not
from the fix, so surface the applicable regime and its clock to me while the incident is still
open.
```
```

Net: 23 lines → 8 lines (blank-line-inclusive; 21 prose lines → 7).

## What was cut, and which skill sentence covers it

Block A (performance-engineer):

- "Measure first — no optimizing on a hunch."
  → performance-engineer.md:24 "Measure first — never optimize on a hunch."
  (verdict performance-engineer-1, CONFIRMED redundant-restatement, medium)

- "Establish the baseline and profile the running system, then eliminate the single biggest
  bottleneck, re-measure, and iterate"
  → performance-engineer.md:11 "2. Measure the baseline; profile the running system." +
  performance-engineer.md:24 "…establish a baseline, then optimize the single biggest bottleneck,
  re-measure, and iterate."
  (verdict performance-engineer-2, CONFIRMED redundant-restatement, medium)

- "the usual suspects are N+1 queries, pool exhaustion, cache misses, synchronous blocking, and
  memory leaks"
  → performance-engineer.md:24 "Watch for the usual patterns: N+1 queries, memory leaks, pool
  exhaustion, cache misses, synchronous blocking, inefficient algorithms, resource contention."
  (verdict performance-engineer-3, CONFIRMED redundant-restatement, low — the KICKOFF list is a
  strict 5-of-7 subset, so cutting it widens coverage rather than narrowing it)

- "with before and after numbers — response time, throughput, resource use — the bottlenecks
  found, the fixes applied, and the evidence validating each gain, plus the alert thresholds that
  keep the gains from regressing"
  → performance-engineer.md:27 "Write `docs/global/ops/monitoring/performance-report.md`:
  baseline vs. after numbers (response time, throughput, resource use), the bottlenecks found, the
  fixes applied, and validation evidence. Include capacity-planning notes and monitoring/alert
  thresholds so gains don't regress."
  (verdict performance-engineer-4, CONFIRMED redundant-restatement, high — field-for-field, same
  three metrics in the same order)

- "If the bottleneck turns out to be infra-wide or capacity-related rather than app-level, hand
  the dashboard and capacity follow-through to monitoring-expert rather than continuing to profile
  app code."
  → performance-engineer.md:27 "If the bottleneck is infra-wide or capacity-related rather than
  app-code-level, hand dashboard/capacity follow-through to `monitoring-expert` (infra lane)
  instead of continuing app-level profiling."
  (verdict performance-engineer-6, CONFIRMED redundant-restatement, high — same trigger, same
  target, same payload, same stop rule. The verdict explicitly tested and rejected the
  "cross-skill handoff is orchestration, therefore load-bearing" defence: the condition is only
  evaluable by the agent mid-run, so it is not an operator dispatch decision.)

Block B (incident-responder / compliance-auditor):

- "triage, contain, preserve evidence, diagnose, recover, then write the blameless postmortem"
  (methodology sequence only — the destination path is KEPT, see Parameters preserved)
  → incident-responder.md:10-13 "1. Establish the incident type… 2. Triage and classify severity…
  3. Contain, investigate, and recover — documenting throughout. 4. Run root-cause analysis and
  produce a blameless postmortem with tracked action items."
  (verdict incident-responder-1, CONFIRMED redundant-restatement, medium)

- "Containment never comes at the cost of evidence integrity — preserve first, then clean up."
  → incident-responder.md:18 "Contain without destroying forensic state." + incident-responder.md:7
  "Optimize for low MTTD/MTTA/MTTR without sacrificing evidence integrity."
  (verdict incident-responder-2, CONFIRMED redundant-restatement, medium)

- "— a security breach, or any incident touching personal or regulated data — hand off to the
  compliance-auditor agent for the framework-specific breach-notification obligations, and do it
  early rather than at postmortem time."
  → incident-responder.md:24 "For incidents with regulatory exposure (breach notification, data
  incidents), track disclosure deadlines and loop in legal/compliance early — see the
  compliance-auditor agent for framework-specific obligations." Reciprocally hardwired at
  compliance-auditor.md:25 "For an active incident, defer containment and forensics to the
  incident-responder agent; this agent covers the regulatory fallout — breach-notification
  deadlines, regulator reporting, control gaps exposed."
  (verdict incident-responder-3, CONFIRMED redundant-restatement, medium. The routing is
  self-contained in both directions, so the operator does not have to state it. The bare
  conditional "If this incident has regulatory exposure:" is retained as the anchor for the KEPT
  sentence — see Parameters preserved.)

### Explicitly NOT cut (refuted, or KEEP verdicts)

- "A report without before/after numbers is not a performance pass." — verdict
  performance-engineer-4 states in terms that this adjacent sentence "is outside this claim's quote
  and was not adjudicated here." Nothing CONFIRMED it, so it stays.
- `docs/global/ops/monitoring/performance-report.md` — verdict performance-engineer-5, CONFIRMED
  **load-bearing-parameter**. Explicit KEEP: the operator needs the concrete path visible to honor
  the non-overlap instruction at KICKOFF:1301-1302.
- "Disclosure deadlines start running from discovery, not from the fix, so surface the applicable
  regime and its clock to me while the incident is still open." — verdict incident-responder-4
  (load-bearing-parameter) and verdict compliance-auditor-3 (unenforced-gap, medium). Both confirm
  the discovery-anchored clock appears nowhere in either skill; incident-responder.md:24 says only
  "track disclosure deadlines" without naming the trigger event, and compliance-auditor.md:17
  lists "breach-notification deadlines" as a topic, never as a discovery-anchored clock.
  Preserved verbatim.

## Parameters preserved

1. **Agent identity, Block A** — `performance-engineer`, dispatched (not invoked as a skill).
2. **Scope argument, Block A** — "over what this milestone shipped". This is the operator's
   scoping of an otherwise unbounded profiling pass; the skill cannot supply it.
3. **Output path, Block A** — `docs/global/ops/monitoring/performance-report.md`, verbatim.
   Required by verdict performance-engineer-5 for the non-overlap coordination at lines 1301-1302.
4. **Acceptance bar, Block A** — "A report without before/after numbers is not a performance
   pass." Unadjudicated, therefore retained.
5. **Ordering / non-overlap constraint** — untouched. Lines 1299-1302 ("Run them in this order;
   both write under `docs/global/ops/monitoring/`, so do not overlap them") sit outside the trim
   range and are unmodified; the trimmed Block A still names the file that constraint governs.
6. **Sibling block untouched** — the sre-engineer / monitoring-expert block at 1317-1326 is
   outside the trim range and unchanged, so the "in this order" pairing still has both halves.
7. **Agent identity, Block B** — `incident-responder`.
8. **Output path, Block B** — `docs/global/ops/postmortems/`, verbatim. See Risk for why this was
   kept against verdict incident-responder-1's classification.
9. **Operator-judgment gate, Block B (outer)** — `*(only if a production incident is underway)*`
   at line 1353 is outside the trim range and untouched.
10. **Operator-judgment gate, Block B (inner)** — "If this incident has regulatory exposure:"
    retained as a conditional. The *enumeration* of what counts as exposure was cut (skill-owned,
    verdict incident-responder-3); the conditional itself survives so the kept sentence is gated,
    not unconditional.
11. **The unenforced-gap clause** — discovery-anchored disclosure clock + "surface … to me while
    the incident is still open", verbatim, including the first-person reporting-to-operator
    direction.
12. **Downstream dependency, Block B** — the gated block at 1366-1371 ("only if the postmortem
    named a failure mode nobody had rehearsed") still resolves: the postmortem artifact and its
    location are both still named in the trimmed Block B.
13. **Fenced-block structure** — both replacements remain single ```text prompt fences at the same
    positions, so the surrounding prose, gating italics, and step numbering need no edits.

## Risk

**One deliberate deviation from the verdicts, flagged for the reviewer.** Verdict
incident-responder-1 classified the *whole* sentence at 1355-1356 as redundant, including the
destination `docs/global/ops/postmortems/`, on the reasoning that the path is hardcoded at
incident-responder.md:3, :27 and :30 and so is not caller-supplied. I cut the methodology sequence
but **kept the path**. Two reasons: (a) the stated bar treats output paths as parameters that
survive a trim regardless, and warns that cutting one is worse than not trimming at all; (b) the
next gated block at KICKOFF:1366-1371 tells the operator to work from "the postmortem", and that
block names no path of its own — so with the path gone, the guide would send the operator hunting.
Keeping one path fragment costs one line and forfeits none of the 8 confirmed claims' substance.
If a reviewer prefers strict verdict adherence, deleting "Write the blameless postmortem to
docs/global/ops/postmortems/." is a safe one-sentence follow-up; nothing else depends on it.

**What an operator actually loses, and why it is acceptable:**

- *Visibility into method.* An operator skimming KICKOFF no longer sees the measure→baseline→
  profile→fix→re-measure loop or the six incident phases spelled out. They cannot audit at a glance
  that the agent will do those things. Acceptable: every one of those steps is a numbered
  `## When invoked` item or a `## Method` sentence in the agent file, i.e. mandatory behaviour the
  agent performs on every run whether or not the prompt says so. The recital changed no behaviour.
- *The monitoring-expert escape hatch is no longer visible in the guide.* Highest-value-looking
  loss, and the one I checked hardest. It is a mid-run conditional the agent evaluates after
  profiling, not a dispatch decision the operator makes up front, and performance-engineer.md:27
  encodes the identical gate with the identical target. Deleting the KICKOFF copy removes a drift
  hazard (two copies of one rule) without removing the rule.
- *The compliance-auditor handoff is no longer named in the guide.* compliance-auditor is still a
  step-15 asset, but it is now reached only via incident-responder.md:24's own pointer. This is
  the sharpest edge of the trim. Mitigated by it being hardwired in *both* directions
  (compliance-auditor.md:25 points back), and by the retained regulatory-exposure conditional
  keeping the operator's attention on the regulatory dimension at exactly the moment it matters.
- *Narrowed suspect list.* Cutting the five-item list means the agent works from its own
  seven-item list. Strictly a widening.

**No loss of parameters.** No output path, filename, placeholder, mode, artifact hand-off,
ordering constraint, or operator-judgment gate was removed. The `<M>`-style placeholders,
`/dev-kit-core:retro <Nd>` argument, and every other gated block in step 15 are outside the trim
range and untouched.
