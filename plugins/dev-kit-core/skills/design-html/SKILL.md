---
name: design-html
description: >
  Design finalization: turns an approved design (mockup image, DESIGN.md tokens, a plan, or
  a plain description) into a production-quality Claude Design deliverable. Real content, real
  responsive behavior, dark mode, accessibility, and an interactive refinement loop. Use
  when asked to "finalize this design", "turn this into HTML", "build me a page",
  "implement this design", "code the mockup", or after a design-consultation session.
---

# Design HTML: Production Design From a Design, Built in Claude Design

You generate production-quality screens where layout and text behave correctly: text reflows on
resize, containers size to their content, breakpoints are deliberate. One page per invocation.
Real content only. Delivery is always Claude Design — there is no local-file fallback.

## UX principles (apply before, during, and after every decision)

**The three laws of usability:**
1. **Don't make me think.** Every page should be self-evident. If a user stops to think
   "What do I click?" the design has failed.
2. **Clicks don't matter, thinking does.** Three mindless, unambiguous clicks beat one click
   that requires thought.
3. **Omit, then omit again.** Get rid of half the words, then half of what's left. Happy talk
   must die. Instructions must die — if they need reading, the design has failed.

**How users actually behave:** users scan, they don't read (design billboards, not
brochures); users satisfice (make the right choice the most visible choice); users muddle
through (once something works, they stick to it); users don't read instructions.

**Billboard design:** use conventions (logo top-left, nav top/left, search = magnifying
glass); visual hierarchy is everything (related things grouped, nested things contained, more
important = more prominent); make clickable things obviously clickable (no hover-only
affordances — mobile has no hover); eliminate noise by removal, not addition; clarity trumps
consistency.

**Navigation as wayfinding:** every page must answer — what site is this, what page am I on,
what are the major sections, where am I, how do I search. Trunk test: cover everything except
the navigation; you should still know the answers.

**The goodwill reservoir:** users start with a reservoir of goodwill; every friction point
depletes it. Depletes faster: hiding info users want (pricing, contact, shipping); punishing
users for not doing things your way (rigid input formatting); asking for unnecessary
information; sizzle in their way (splash screens, forced tours, interstitials); sloppy
appearance. Replenishes: make the main thing obvious; answer what users want to know
upfront; save them steps; make errors easy to recover from.

**Mobile:** same rules, higher stakes. Touch targets ≥44px. Affordances must be visible.
Prioritize ruthlessly.

---

## Step 0: Input Detection + Design System Check

Detect what design context exists, in this order:

1. **Approved mockup** — a design image (PNG/screenshot) the user approved, e.g. from a
   design-consultation variant-shotgun session. Check `.claude/design/screens.json` (a local
   index this skill maintains — see Step 5 — mapping screen name → Claude Design project id,
   since the actual deliverable lives entirely in Claude Design, not on disk) for a prior entry
   matching this screen name. If found, ask: evolve it (apply changes on top, preserving custom
   edits made live in the Claude Design editor) or start fresh from the mockup?
2. **Plan-driven** — a product/design plan or spec exists but no mockup. The plan is the
   source of truth. Ask for a screen name for the output (e.g. "landing-page", "dashboard"), then
   check `.claude/design/screens.json` the same way.
3. **Freeform** — nothing found. Ask the user to describe what they want, and for a screen name.

**Require the Claude Design MCP.** This skill only delivers via Claude Design — there is no
local-file fallback. If `mcp__claude-design__*` tools aren't available, stop here and tell the
user Claude Design is required before this skill can produce anything.

**Read, don't resolve, the design system binding.** This skill does not decide which design
system to use — `design-consultation` is the only skill that resolves or binds
`claude_design_system_id` (see `@references/claude-design-mcp-protocol.md`, "Resolution
ownership"). Here, just:

1. Check `DESIGN.md` for `claude_design_system_id`. **Missing (no DESIGN.md, or DESIGN.md has no
   bound system)?** Stop and tell the user to run `design-consultation` first — do not call
   `list_design_systems` yourself, do not ask which system applies, do not proceed unbound.
2. Check `DESIGN.md` for `claude_design_project_id` — that's design-consultation's own
   demo/preview project. Don't build this screen into it; this skill's screens get their own
   project(s), bound to the same `claude_design_system_id`.
3. Ask the model-selection question from the protocol once, up front — every subagent dispatch
   for this invocation (initial build and every refinement round) uses that same chosen model.

Output a context summary: **Mode** (approved-mockup | plan-driven | freeform | evolve),
**Visual reference**, **`claude_design_system_id`**, **Screen name**, **Model**.

---

## Step 1: Design Analysis → Implementation Spec

1. If an approved mockup exists: read the image and describe the visual layout, colors,
   typography, and component structure yourself. Extract exact values where possible.
2. Plan-driven: extract from the plan's prose — UI requirements, user flows, audience,
   visual feel (dark/light, dense/spacious), content structure (hero, features, pricing...),
   constraints.
3. Freeform: ask about purpose/audience, visual feel, content structure, and reference sites
   they like.
4. Read DESIGN.md tokens — they override extracted values for system-level properties.
5. Output an **Implementation spec**: colors (hex), fonts (family + weights), spacing scale,
   component list, layout type. Generate realistic content from the mockup/plan/description —
   never lorem ipsum.

---

## Step 2: Layout Strategy

Classify the design and state the layout approach before writing anything:

| Design type | Strategy |
|-------------|----------|
| Simple layout (landing, marketing) | Flexbox/grid sections, fluid type, intrinsic sizing |
| Card/grid (dashboard, listing) | CSS grid with `auto-fit`/`minmax`, self-sizing cards |
| Chat/messaging UI | `max-width` + `width: fit-content` bubbles, sticky composer |
| Content-heavy (editorial, blog) | Measure-limited columns, `float`/`shape-outside` for obstacles |
| Complex editorial | Named grid areas, container queries where supported |

If the project has a text-layout or design engine wired in (requires wiring), you may use it
for computed text layout; the default is standard modern CSS, which handles all tiers above.

The deliverable itself is always `.dc.html` (Claude Design's Design Components format, built in
Step 3) regardless of the target codebase's frontend framework — framework-native translation, if
needed, happens later at Step 5 when the finished design gets copied into the codebase.

---

## Step 3: Generate

Dispatch via the Agent tool at the model chosen in Step 0 (always dispatch — see
`@references/claude-design-mcp-protocol.md` Step 2, never run this inline regardless of which
model the parent session happens to be). Give the subagent, in one self-contained prompt:

- the Implementation Spec (Step 1) and layout strategy (Step 2)
- the `claude_design_system_id` from Step 0, and this screen's existing project id from
  `.claude/design/screens.json` if Step 0 found one — reuse it, or `create_project
  (design_system_id: <that id>)` otherwise; a screen typically gets its own project, distinct
  from design-consultation's demo project
- instruction to follow Claude Design's own workflow end to end (it's loaded automatically via
  `get_claude_design_prompt`): explore the bound system's templates/resources first
  (`list_files`/`read_file` on the design-system project, `copy_files(src_project_id: ...)` for
  anything reused — never hand-recreate what the system already ships), write the deliverable as
  `.dc.html` (call `create_support_js` first per directory), then run its own verify loop
  (render → gate → `design-verifier` → act)
- instruction to offer a live `?embed=1` preview link right after `create_project`/`get_project`
  (Claude Design's own convention — auto-refreshes on every `write_files`, distinct from the
  short-lived `serve_url` used only by verification tooling)
- report back: `project_id`, path(s) written, `open_url` (never `serve_url`), model used

The **AI slop blacklist below still applies** — Claude Design's own system prompt has its own
overlapping list (aggressive gradients, emoji, overused fonts); treat the two as reinforcing,
not redundant.

**Content requirements (regardless of what fed the tokens):**
- Fonts, palette, and spacing from the bound design system — never invented
- Semantic structure, correct heading hierarchy, `:focus-visible` states, ARIA where needed
- Responsive behavior deliberate at each breakpoint, not just "stacked on mobile"
- `prefers-color-scheme` respected for dark mode, `prefers-reduced-motion` for animation
- Real content extracted from the mockup/plan (never lorem ipsum, never "Your text here")

**Never include (AI slop blacklist):**
- Purple/blue gradients as default
- Generic 3-column feature grids
- Center-everything layouts with no visual hierarchy
- Decorative blobs, waves, or geometric patterns not in the mockup
- Stock-photo placeholder divs
- "Get Started" / "Learn More" generic CTAs not from the mockup
- Rounded-corner cards with drop shadows as the default component
- Emoji as visual elements
- Generic testimonial sections
- Cookie-cutter hero sections with left-text right-image

---

## Step 4: Verify + Refinement Loop

Verification is Claude Design's own render → gate → `design-verifier` → act loop (already run
once at the end of Step 3's dispatch) — don't layer a separate dev-kit screenshot-verification
pass on top. The refinement loop below stays under this skill's control — the user is talking to
*this* conversation, not inside the dispatched subagent — so each round re-dispatches a fresh
Agent call at the same chosen model:

```
LOOP:
  1. Share the `open_url` (and the `?embed=1` live-preview link if offered) with the user.
  2. If an approved mockup exists, show it alongside for comparison.
  3. Ask: "What needs to change? Say 'done' when satisfied."
  4. "done" / "ship it" / "looks good" → exit loop, go to Step 5.
  5. Dispatch a fresh Agent call (same model as Step 3): apply this feedback via a targeted
     `write_files` (read current content + etag first, pass `if_match`), then re-run the verify
     loop (render → gate → design-verifier → act). Never regenerate the whole file from scratch
     — the user (or a teammate) may be editing the same project live.
  6. Brief summary of what changed (2-3 lines max), plus the refreshed `open_url`.
  7. Go to LOOP.
```

Maximum 10 iterations; after 10, ask whether to continue or call it done.

---

## Step 5: Save & Next Steps

**Design token extraction:** if no `DESIGN.md` exists — this shouldn't happen given Step 0's
gate, but if it was bypassed somehow — stop and point back to `design-consultation` rather than
inventing tokens here.

**Save metadata** (as a project support file, e.g. `finalized.json` written via `write_files`):
source mockup/plan, mode, screen name, project id, `claude_design_system_id`, path(s) written,
iteration count, date, model used (Sonnet/Opus/Fable).

**Update the local screen index** — upsert this screen name → project id into
`.claude/design/screens.json` (create if missing) so a later invocation for the same screen
finds it in Step 0 instead of starting fresh unnecessarily.

**Next steps:** A) Copy the design into the codebase — run `design-handoff` first (it has no
automatic access to Claude Design's context the way this skill does, so it needs the translated
cheat sheet), then pull the final `.dc.html` content via `read_file` and adapt it to the
project's actual frontend framework against that cheat sheet; the Claude Design project stays
the collaborative source of truth, the codebase gets a framework-native translation.
B) Iterate more. C) Done — the `open_url` stays live and editable in Claude Design either way.

---

## Important Rules

- **Source-of-truth fidelity over code elegance.** When an approved mockup exists, match it.
  If that requires `width: 312px` instead of a grid class, that's correct. Cleanup happens
  later during component extraction. In plan-driven/freeform mode, the user's refinement
  feedback is the source of truth.
- **Surgical edits in the refinement loop.** Targeted `write_files` for changed content only,
  never a full rewrite that clobbers edits made live in the Claude Design editor.
- **Real content only.** Extract from the mockup, use plan content, or generate realistic
  domain content. Never placeholders.
- **One page per invocation.** For multi-page designs, run once per page.
- **Design-system templates take precedence over scaffolding from scratch.** When the bound
  system ships a template for this kind of content, `copy_files` it in and compose from its
  parts rather than writing your own from zero.
