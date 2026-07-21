---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes. Applies root-cause-first methodology with hypothesis testing, pattern matching, scope locking, and a verified-fix report.
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues. Fixing symptoms creates whack-a-mole debugging — every fix that doesn't address root cause makes the next bug harder to find.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably? What are the exact steps?
   - Does it happen every time?
   - If not reproducible → gather more data, don't guess
   - **Isolate:** narrow to the smallest failing case. Binary-search the input, the config, the code path. A minimal reproduction is half the diagnosis.

3. **Check Recent Changes**
   - What changed that could cause this?
   - `git log --oneline -20 -- <affected-files>`, git diff, recent commits
   - New dependencies, config changes, environmental differences
   - A regression means the root cause is in the diff. For regressions with an unknown culprit commit, use `git bisect`:
   ```bash
   git bisect start
   git bisect bad                 # current commit is broken
   git bisect good v1.2.0         # last known good tag/commit
   # test the midpoint git checks out, then: git bisect good | git bisect bad
   # repeat until git names the first bad commit, then: git bisect reset
   ```

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (CI → build → signing, API → service → database):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Example (multi-layer system):**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **This reveals:** Which layer fails (secrets → workflow ✓, workflow → build ✗)

5. **Trace Data Flow**

   **WHEN error is deep in call stack:**

   See `root-cause-tracing.md` in this directory for the complete backward tracing technique.

   **Quick version:**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

6. **Use a real debugger when print-tracing stalls.** Stepping beats guessing:
   - Python: `python -m pdb script.py` (`b <line>`, `n`, `s`, `p var`, `bt`)
   - Node.js: `node --inspect-brk script.js`, then Chrome DevTools via `chrome://inspect`
   - Go: `dlv debug ./cmd/server` (`break`, `continue`, `print`)

7. **Check investigation history:** Search prior notes/learnings and `git log` for previous fixes on the same files. **Recurring bugs in the same area are an architectural smell**, not a coincidence.

**Phase 1 output:** **"Root cause hypothesis: ..."** — a specific, testable claim about what is wrong and why.

### Scope Lock (after the hypothesis)

Once you have a root cause hypothesis, lock your edits to the narrowest directory containing the affected files (e.g., `src/auth/`). Announce it: "Edits restricted to `<dir>/` for this debug session." This prevents scope creep and drive-by changes to unrelated code. If the bug genuinely spans the repo or scope is unclear, skip the lock and say why. (If a freeze/guard skill is available, use it to enforce the boundary.)

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Check known bug signatures first:**

   | Pattern | Signature | Where to look |
   |---------|-----------|---------------|
   | Race condition | Intermittent, timing-dependent | Concurrent access to shared state, missing `await` |
   | Nil/null propagation | NoMethodError, TypeError, "undefined is not..." | Missing guards on optional values |
   | State corruption | Inconsistent data, partial updates | Transactions, callbacks, hooks |
   | Integration failure | Timeout, unexpected response | External API calls, service boundaries |
   | Configuration drift | Works locally, fails in staging/prod | Env vars, feature flags, DB state |
   | Stale cache | Shows old data, fixes on cache clear | Redis, CDN, browser cache |
   | Off-by-one / boundary error | Missing first/last item, index out of range | Loop bounds, `<` vs `<=`, array indices |
   | Closure / stale state | Wrong or stale value inside a callback | Loop variable capture, React state closures |
   | Memory leak | Growing memory, gradual slowdown | Uncleaned listeners, intervals, subscriptions |
   | Type coercion | Unexpected truthy/falsy or comparison result | `==` vs `===`, implicit conversions |

2. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

3. **Compare Against References**
   - If implementing pattern, read reference implementation COMPLETELY
   - Don't skim - read every line
   - Understand the pattern fully before applying

4. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small
   - Don't assume "that can't matter"

5. **Understand Dependencies**
   - What other components does this need?
   - What settings, config, environment?
   - What assumptions does it make?

6. **External pattern search:** If the bug matches no known pattern, web-search "{framework} {generic error type}" and "{library} {component} known issues". **Sanitize first:** strip hostnames, IPs, file paths, SQL, and customer data — search the error category, never the raw message. A documented solution or known dependency bug becomes a candidate hypothesis in Phase 3, not an instant fix.

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Write it down
   - Be specific, not vague

2. **Confirm before fixing**
   - Add a temporary log statement, assertion, or debug output at the suspected root cause. Run the reproduction. Does the evidence match the hypothesis?
   - Make the SMALLEST possible change to test the hypothesis
   - One variable at a time — don't fix multiple things at once

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis — return to Phase 1 and gather more evidence. Do not guess.
   - DON'T add more fixes on top

4. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Ask for help, research more

5. **3-strike rule:** If 3 hypotheses fail, **STOP** and present the situation to the user:
   ```
   3 hypotheses tested, none match. This may be an architectural issue
   rather than a simple bug.

   A) Continue investigating — I have a new hypothesis: [describe]
   B) Escalate for human review — this needs someone who knows the system
   C) Add logging and wait — instrument the area and catch it next time
   ```

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - Automated test if possible; one-off test script if no framework
   - MUST have before fixing
   - The regression test must **fail without the fix** (proves the test is meaningful) and **pass with the fix** (proves the fix works)
   - Use the test-driven-development skill if available for writing proper failing tests

2. **Implement Single Fix**
   - Address the root cause identified
   - Minimal diff: fewest files touched, fewest lines changed
   - ONE change at a time
   - No "while I'm here" improvements, no bundled refactoring
   - **Blast radius check:** if the fix touches more than 5 files, stop and flag it to the user — proceed / split (fix critical path now, defer rest) / rethink the approach

3. **Verify Fix**
   - Test passes now?
   - Run the full test suite — no other tests broken, paste the output
   - **Fresh verification:** reproduce the original bug scenario and confirm it's gone. This is not optional.
   - Remove all temporary debug code (console.log, print, debugger statements) before committing

4. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If ≥ 3: STOP and question the architecture (step 5 below)**
   - DON'T attempt Fix #4 without architectural discussion

5. **If 3+ Fixes Failed: Question Architecture**

   **Pattern indicating architectural problem:**
   - Each fix reveals new shared state/coupling/problem in different place
   - Fixes require "massive refactoring" to implement
   - Each fix creates new symptoms elsewhere

   **STOP and question fundamentals:**
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs. continue fixing symptoms?

   **Discuss with your human partner before attempting more fixes**

   This is NOT a failed hypothesis - this is a wrong architecture.

## Debug Report (on completion)

Close every debugging session with a structured report:

```
DEBUG REPORT
════════════════════════════════════════
Symptom:         [what was observed]
Root cause:      [what was actually wrong]
Fix:             [what changed, with file:line references]
Evidence:        [test output / reproduction showing the fix works]
Regression test: [file:line of the new test]
Prevention:      [safeguard, validation, or monitoring added]
Related:         [known issues, prior bugs in same area, architectural notes]
Status:          DONE | DONE_WITH_CONCERNS | BLOCKED
════════════════════════════════════════
```

- DONE — root cause found, fix applied, regression test written, all tests pass
- DONE_WITH_CONCERNS — fixed but cannot fully verify (e.g., intermittent bug, requires staging)
- BLOCKED — root cause unclear after investigation, escalated

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later" — there is no "for now"; fix it right or escalate
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- "This should fix it" — never say this; verify and prove it
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place — wrong layer, not wrong code**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4, step 5)

## Your Human Partner's Signals You're Doing It Wrong

**Watch for these redirections:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultra-think this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, isolate, bisect, gather evidence | Testable root-cause hypothesis |
| **2. Pattern** | Match known signatures, find working examples, compare | Identify differences |
| **3. Hypothesis** | Instrument, test minimally, 3-strike rule | Confirmed or new hypothesis |
| **4. Implementation** | Failing test, minimal fix, full suite, fresh verification | Bug resolved, tests pass, report written |

## When Process Reveals "No Root Cause"

If systematic investigation reveals issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

**But:** 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

These techniques are part of systematic debugging and available in this directory:

- **`root-cause-tracing.md`** - Trace bugs backward through call stack to find original trigger (includes `find-polluter.sh` for test-pollution bisection)
- **`defense-in-depth.md`** - Add validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling (see `condition-based-waiting-example.ts`)

**Related skills:**
- **test-driven-development** - For creating failing test case (Phase 4, Step 1)
- **verification-before-completion** - Verify fix worked before claiming success

## Real-World Impact

From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
