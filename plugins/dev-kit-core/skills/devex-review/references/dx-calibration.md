# DX Calibration Reference

Read only the section for the current audit step. Gold standards, anti-patterns,
and stats used to calibrate scores against real-world DX bars.

## Step 1: Getting Started

**Gold standards:**
- **Stripe**: 7 lines of code to charge a card. Docs pre-fill the developer's own
  test API keys when logged in. An in-docs shell runs CLI calls inside the docs page.
  No local install needed.
- **Vercel**: `git push` = live site on a global CDN with HTTPS. Every PR gets a
  preview URL. One CLI command deploys.
- **Clerk**: `<SignIn />`, `<SignUp />`, `<UserButton />` — three components,
  working auth with email, social, and MFA out of the box.
- **Supabase**: create a Postgres table, get an auto-generated REST API + Realtime
  + self-documenting docs instantly.
- **Firebase**: `onSnapshot()` — three lines for real-time sync across clients
  with offline persistence built in.
- **Twilio**: a virtual phone number in the console lets you send/receive SMS
  without buying a number or a credit card. Result: a measured 62% improvement
  in activation.

**Anti-patterns:**
- Email verification required before any value is shown (breaks flow).
- Credit card required before a sandbox/trial.
- "Choose your own adventure" onboarding with multiple paths — decision fatigue;
  one golden path wins.
- API keys hidden in settings instead of pre-filled into code examples.
- Static code examples with no language switching.
- Docs on a separate site from the dashboard (forces context switching).

## Step 2: API/CLI/SDK Design

**Gold standards:**
- **Prefixed IDs** (Stripe-style): `ch_` for charges, `cus_` for customers —
  self-documenting, impossible to pass the wrong ID type.
- **Expandable objects**: default returns ID strings; an `expand[]` param
  returns full nested objects, several levels deep, only when needed.
- **Idempotency keys**: an `Idempotency-Key` header makes retries on mutating
  calls safe — no "did I double-charge?" anxiety.
- **API versioning pinned at first call**: an account is pinned to the version
  active the day it started; callers can still test newer versions per-request
  via a version header.
- **Auto-detecting CLI output**: human-readable in a terminal, tab-delimited
  when piped — one binary serves both humans and scripts.
- **Progressive disclosure** (SwiftUI-style): `Button("Save") { save() }` for
  the simple case, full customization available via the same API surface.
- **Attribute-driven UI** (htmx-style): declarative markup replaces hand-written
  JS, tiny runtime, zero build step.
- **Copy-in components** (shadcn/ui-style): source is copied into the caller's
  project — no dependency, no version conflicts, full ownership.

**Anti-patterns:**
- Chatty API: 5 calls required for one user-visible action.
- Inconsistent naming: `/users` (plural) vs `/user/123` (singular) vs
  `/create-order` (verb in the URL) in the same surface.
- Implicit failure: `200 OK` with the actual error nested in the response body.
- God endpoint: dozens of parameter combinations, each with different behavior.
- Documentation-required API: several pages of docs needed before the first
  successful call — too much ceremony.

## Step 3: Error Messages & Debugging

**Three tiers of error quality** — use these to grade every error found:

**Tier 1 — conversational compiler (Elm-style):**
```
-- TYPE MISMATCH ---- src/Main.elm
I cannot do addition with String values like this one:
42|   "hello" + 1
     ^^^^^^^
Hint: To put strings together, use the (++) operator instead.
```
First person, complete sentences, exact location, a suggested fix, further reading.

**Tier 2 — annotated source (Rust-style):**
```
error[E0308]: mismatched types
 --> src/main.rs:4:20
help: consider borrowing here
  |
4 |     let name: &str = &get_name();
  |                       +
```
An error code links to a fuller explainer; primary + secondary labels; a help
section shows the exact edit to make.

**Tier 3 — structured with doc_url (Stripe API-style):**
```json
{"error":{"type":"invalid_request_error","code":"resource_missing","message":"No such customer: 'cus_nonexistent'","param":"customer","doc_url":"https://stripe.com/docs/error-codes/resource-missing"}}
```
Five fields, zero ambiguity: type, code, message, the offending param, and a
doc link.

**The formula:** what happened + why + how to fix it + where to learn more +
the actual values that caused it.

**Anti-pattern:** burying the most actionable line ("Did you mean...?") at the
BOTTOM of a long error chain instead of at the top.

## Step 4: Documentation

**Gold standards:**
- Three-column docs layout (nav / content / live code), API keys injected into
  examples when the reader is logged in, a language switcher that persists
  across every page, hover-to-highlight between prose and code, an in-browser
  shell for live API calls. "Docs as product" — features don't ship until docs
  are finalized.
- Reported industry data point: roughly half of developers say they've been
  blocked by missing documentation at some point (Postman State of the API,
  2023 wave).
- Companies with best-in-class docs report meaningfully higher adoption —
  treat "docs ship with the feature or the feature doesn't ship" as the target
  bar, not an aspiration.

## Step 5: Upgrade Path

**Gold standards:**
- **Automated codemods**: a single upgrade command runs the framework upgrade
  plus every relevant codemod in one step (Next.js's `@next/codemod upgrade`
  pattern).
- Every release from a given major onward ships its own codemod (AG Grid's
  practice from v31+).
- **Version pinning per account/caller**: breaking changes never surprise an
  existing integration because each caller is pinned to the API version active
  when they started.
- **Small composable transforms**: prefer a pipeline of small, testable
  migration steps over one monolithic codemod (Martin Fowler's pipeline
  pattern for automated refactoring).
- Reported research finding: a large share of breaking changes in public
  package registries go undocumented (Ochoa et al., 2021, on Maven Central) —
  treat "every breaking change has a documented migration note" as non-negotiable.

## Step 6: Developer Environment

**Gold standards:**
- Runtime/tooling speed compounds: a package manager or runtime that is an
  order of magnitude faster than incumbents (Bun vs npm/Node as the reference
  point) turns "speed" into a DX feature by itself, not just an optimization.
- Developers report dozens of interruptions per day, each costing on the order
  of 20-30 minutes to recover focus from — protecting flow state (fast
  builds, fast tests, no flaky CI) is a DX investment with a real productivity
  payoff.
- AI-assisted coding tools have been measured cutting PR cycle time by several
  multiples — fast feedback loops compound across a team, not just an
  individual.

## Step 7: Community & Ecosystem

- Developers commonly need many touchpoints with a tool before adopting it —
  awareness and community presence compound over a long window, not a single
  launch.
- Teams with strong developer experience are reported to ship several times
  faster than teams without it — community and ecosystem health are leading
  indicators, not vanity metrics.

## Step 8: DX Measurement

**Three frameworks for measuring DX, use at least one explicitly:**
1. **SPACE** (Microsoft Research): Satisfaction, Performance, Activity,
   Communication, Efficiency — measure at least 3 of the 5 dimensions, not
   just raw activity counts.
2. **DevEx** (feedback loops / cognitive load / flow state): combine
   perceptual survey data with workflow telemetry; neither alone is enough.
3. **Cognition / Affect / Conation**: the psychological "trilogy of mind" —
   does the developer understand it, feel good about it, and stay motivated
   to keep using it?

## AI Agent Skill DX Checklist

Use when reviewing an AI agent skill, MCP server, or other agent-facing tool
(directly relevant when the product under review IS a Claude Code skill/plugin):

- **Trigger design**: does the skill's description trigger on the phrases a
  real user actually says, not just the phrases a designer would pick?
- **Self-documentation**: does the skill state its own inputs, outputs, and
  scope clearly enough that an agent invoking it needs no other context?
- **Graceful degradation**: does it degrade sanely when optional tooling
  (browser automation, external CLIs) is absent, rather than failing hard?
- **Self-contained instruction blocks**: can each section be read and acted on
  without requiring the agent to have another file open?
- **Actionable error paths**: does a failure path tell the agent what to do
  next, not just what failed?
