# Maestro Flows (Mobile E2E)

Test-design guidance for [Maestro](https://maestro.mobile.dev), the YAML-driven mobile
UI testing framework. Use this reference when the automation surface is a native or
hybrid mobile app — for web UI, use `playwright-expert` instead (see below).

## When Maestro Is the Right Tool

| Surface | Framework |
|---------|-----------|
| Native iOS / Android app, or a hybrid app (React Native, Flutter) exercised through its installed shell | **Maestro** |
| Web app, PWA, or anything driven through a desktop/mobile browser | **Playwright** (`playwright-expert`) |
| A project with both a mobile app and a web/marketing site | Both — route each flow to the surface it actually runs on |

Maestro drives the app the way a user does: launch, tap, type, swipe, assert what's on
screen. It has built-in tolerance for animations, view hierarchy re-renders, and app
startup latency, which is why it's the better fit for mobile — those are exactly the
conditions that make raw Appium/Espresso/XCUITest scripts flaky. If you're routed here
from `gate-automation` (or any other caller), it's because the changed flow lives inside
the mobile app; don't try to force a web test through this path.

## Flow File Structure and Location

Flows live under `e2e/maestro/` (the convention `gate-automation` and other callers
expect). A Maestro flow is a single YAML file: a small header block identifying the app
under test, followed by an ordered list of commands executed top to bottom.

```yaml
# e2e/maestro/checkout-golden-path.yaml
appId: com.example.app
name: Checkout — golden path
tags:
  - golden
---
- launchApp:
    clearState: true
- tapOn: "Browse"
- tapOn:
    id: "product-card-0"
- tapOn: "Add to Cart"
- assertVisible: "1 item in cart"
- tapOn: "Cart"
- tapOn: "Checkout"
- inputText: "4242 4242 4242 4242"
- tapOn: "Pay"
- assertVisible: "Order confirmed"
```

Conventions worth adopting, mirroring what `e2e-testing.md` and
`automation-frameworks.md` already establish for the web side:

- **One flow, one scenario.** Don't chain unrelated user journeys into a single file —
  it fails atomically and is unreadable when it does.
- **Name files for what they verify**, not for the screen (`checkout-golden-path.yaml`,
  not `cart-screen.yaml`), so a failing-test list reads like a spec.
- **Tag flows** (`tags: [golden]`, `tags: [edge-case]`) so a CI job or local run can
  select a subset (e.g. run only `golden` on every PR, the full edge-case set nightly).
  This is the mobile equivalent of Playwright's project/grep filtering.
- **Factor shared setup into its own flow file** and pull it in as a reusable step
  (Maestro supports composing flows) rather than copy-pasting the same login/seed
  sequence into every file — the same DRY principle `page-object-model.md` applies to
  Playwright.
- **Reset state deliberately.** Start from a clean, known app state (fresh install /
  cleared storage / seeded test account) rather than depending on whatever state the
  previous flow left behind — Maestro flows must be independently runnable, same as any
  other test in this skill's constraints.

## Golden-Path vs. Critical Edge-Case Flows

`gate-automation` asks for one golden-path flow per changed primary user flow, plus a
critical edge-case flow for each meaningful failure mode. Design them as separate files,
not branches inside one file — a failure in the edge case shouldn't obscure whether the
happy path still works, and tagging only works cleanly at file granularity.

**Golden path** — the flow succeeding end to end exactly as an authenticated, properly
provisioned user would experience it. One assertion of final success state is not
enough; assert the meaningful checkpoints along the way (item added, screen transition
happened, confirmation shown) so a failure localizes to the right step.

**Critical edge cases** to design for, matching the set `gate-automation` names:

- **Auth-required-but-signed-out** — launch the flow from a logged-out state and assert
  the app redirects to sign-in / shows a gate, rather than exposing the protected
  screen. Seed the "signed out" state explicitly (`clearState: true` or an equivalent
  reset) so the test doesn't depend on leftover session state from a prior run.
- **Empty state** — drive to the screen with no data seeded and assert the empty-state
  UI (placeholder copy, call-to-action) appears instead of a blank or broken layout.
- **Network error / offline** — exercise the flow with the device/simulator's network
  disabled or the backend unreachable, and assert the app surfaces a clear error state
  rather than hanging or crashing. If the project's Maestro setup doesn't yet have a way
  to force offline (a mock/toggle in the app itself is the most reliable mechanism —
  network-layer interception on-device is far less standardized than Playwright's
  request interception), say so explicitly in the authoring report as a gap rather than
  inventing a mechanism that doesn't exist in the project.
- **Permission denied** — for flows that gate on a device permission (camera, location,
  notifications, contacts), exercise the deny path and assert the app degrades
  gracefully (explains what's unavailable, offers a path to re-grant) instead of
  crashing or silently doing nothing.

Only author the edge cases that are real for the specific flow — a settings-only screen
with no auth/network/permission dependency doesn't need all four; note the ones skipped
and why, same as any other flow considered but not authored.

## Selector / Element-Identification Strategy

Brittleness in mobile UI tests comes from the same root cause as on the web: selecting
on something that changes for reasons unrelated to the test's intent (layout position,
generated view hierarchy index, exact visible copy that a copy-edit will change).
Prioritize, in order:

1. **Stable accessibility identifiers** (the platform's accessibility ID / test ID,
   set deliberately by the app for testing — the mobile equivalent of a `data-testid`).
   These survive re-layouts, localization, and most refactors.
2. **Semantic, user-visible text** for elements where the copy itself is the contract
   (button labels, headings) and unlikely to change independent of the feature.
3. **Structural/index-based selection** (nth child, coordinate taps) only as a last
   resort, and only when the element genuinely has no stable identifier or text —
   treat it as tech debt to flag in the authoring report, not a default choice.

Avoid asserting on exact pixel coordinates, animation-timing-dependent state, or
volatile dynamic content (timestamps, random IDs) unless the test's purpose is
specifically to verify that content. Prefer built-in wait/retry behavior for elements
that appear asynchronously over compensating with fixed delays — the same "no arbitrary
timeouts" rule this skill enforces for `waitForTimeout` on the web side applies here to
any fixed-duration sleep in a mobile flow.

## Fit With This Skill's Coverage and Quality-Gate Framing

Maestro flows are this skill's E2E layer for the mobile surface — everything
`e2e-testing.md`'s priority table (P0 registration/login/core-feature,
P1 payment/settings, P2 edge cases, P3 rare scenarios) says about triage applies
unchanged; only the execution surface differs. When reporting coverage or defects for
mobile:

- Roll golden-path and edge-case Maestro flows into the same coverage/quality-gate
  reporting this skill already produces (`references/test-reports.md` templates,
  the Quality Gates section of `references/qa-methodology.md`) — don't stand up a
  parallel mobile-only reporting format.
- A missing golden-path flow for a changed primary user flow is a coverage gap exactly
  like a missing Playwright spec; record it the same way (`missing_coverage` with a
  one-line reason), not as a lesser concern because the surface is mobile.
- Flaky Maestro flows get the same treatment as flaky Playwright tests: isolate the
  cause (usually an unseeded state dependency or a missing wait for an async UI
  transition), fix the root cause, don't just add retries and move on.

## Quick Reference

| Concern | Playwright (web) | Maestro (mobile) |
|---------|-------------------|-------------------|
| Flow location | project's existing convention | `e2e/maestro/` |
| Stable selector | `getByRole` / `getByLabel` / `data-testid` | accessibility ID / test ID |
| Reusable setup | fixtures, Page Object Model | composed/shared flow files |
| Subset selection | project/grep filters | `tags:` |
| Async waiting | auto-waiting, explicit `waitFor` | built-in retry/wait on assertions |
| Anti-pattern | `waitForTimeout()` | fixed-duration sleeps |

| Flow Type | Required When |
|-----------|---------------|
| Golden path | Always, for every changed primary user flow |
| Auth-required-but-signed-out | Flow is behind auth |
| Empty state | Flow has a data-dependent view |
| Network error / offline | Flow depends on a network call |
| Permission denied | Flow gates on a device permission |
