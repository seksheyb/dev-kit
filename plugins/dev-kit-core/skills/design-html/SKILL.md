---
name: design-html
description: >
  Design finalization: turns an approved design (mockup image, DESIGN.md tokens, a plan, or
  a plain description) into production-quality, self-contained HTML/CSS. Real content, real
  responsive behavior, dark mode, accessibility, and an interactive refinement loop. Use
  when asked to "finalize this design", "turn this into HTML", "build me a page",
  "implement this design", "code the mockup", or after a design-consultation session.
---

# Design HTML: Production HTML/CSS From a Design

You generate production-quality HTML where layout and text behave correctly: text reflows on
resize, containers size to their content, breakpoints are deliberate. One page per
invocation. Real content only.

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

## Step 0: Input Detection

Detect what design context exists, in this order:

1. **Approved mockup** — a design image (PNG/screenshot) the user approved, e.g. from a
   design-consultation variant-shotgun session. If a prior finalized HTML also exists, ask:
   evolve it (apply changes on top, preserving custom edits) or start fresh from the mockup?
2. **Plan-driven** — a product/design plan or spec exists but no mockup. The plan is the
   source of truth. Ask for a screen name for the output (e.g. "landing-page", "dashboard").
3. **Freeform** — nothing found. Ask the user to describe what they want, or point them to
   design-consultation first if they'd rather establish a system before building.

Always also check for `DESIGN.md` in the repo root — its tokens take priority for
system-level values (fonts, brand colors, spacing scale). If it contains a
`<!-- claude_design_project_id: ... -->` comment, this project has an existing claude-design
MCP workspace — reuse it in Step 3.5 rather than only serving a local preview.

Output a context summary: **Mode** (approved-mockup | plan-driven | freeform | evolve),
**Visual reference**, **Design tokens** (DESIGN.md or none), **Screen name**.

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

Classify the design and state the layout approach before writing code:

| Design type | Strategy |
|-------------|----------|
| Simple layout (landing, marketing) | Flexbox/grid sections, fluid type, intrinsic sizing |
| Card/grid (dashboard, listing) | CSS grid with `auto-fit`/`minmax`, self-sizing cards |
| Chat/messaging UI | `max-width` + `width: fit-content` bubbles, sticky composer |
| Content-heavy (editorial, blog) | Measure-limited columns, `float`/`shape-outside` for obstacles |
| Complex editorial | Named grid areas, container queries where supported |

If the project has a text-layout or design engine wired in (requires wiring), you may use it
for computed text layout; the default is standard modern CSS, which handles all tiers above.

### Framework detection

```bash
[ -f package.json ] && grep -o '"react"\|"svelte"\|"vue"\|"@angular/core"\|"solid-js"\|"preact"' package.json | head -1 || echo "NONE"
```

If a framework is detected, ask: A) Vanilla HTML — self-contained preview file (recommended
for first pass), or B) framework-native component (then ask TypeScript or JavaScript). If no
framework: default to vanilla HTML, no question needed.

---

## Step 3: Generate the HTML

Write a single file (Write tool). Save to a sensible location — e.g.
`design/<screen-name>/finalized.html` in the repo, or where the user asks. Framework output
saves as `finalized.[tsx|svelte|vue]` and adds any needed dependency via the project's
package manager.

**Always include (vanilla HTML):**
- CSS custom properties for all design tokens (from DESIGN.md / Step 1 extraction)
- Fonts via `<link>` tags + `document.fonts.ready` gate before any layout measurement
- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- Responsive behavior with breakpoint adjustments at 375px, 768px, 1024px, 1440px
- ARIA attributes, correct heading hierarchy, `:focus-visible` states
- `prefers-color-scheme` media query for dark mode
- `prefers-reduced-motion` respected for all animation
- Real content extracted from the mockup/plan (never lorem ipsum, never "Your text here")
- Self-contained: inline CSS/JS, no build step required to open the file

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

## Step 3.5: Live Preview

Start a simple HTTP server for live preview:

```bash
cd <output-dir> && python3 -m http.server 0 --bind 127.0.0.1 &
```

Report the URL (or fall back to `open <path>/finalized.html` if python3 is unavailable).
Tell the user: "Live preview running — after each edit, refresh the browser to see changes."
Kill the server when the refinement loop ends.

**If a `claude_design_project_id` was found in Step 0** and `mcp__claude-design__*` tools are
available: also `write_files` the finalized HTML into that same project (never `create_project`
here — this skill only ever writes into a project design-consultation already created) and
`render_preview` for a shareable link, offered alongside the local preview rather than
replacing it.

---

## Step 4: Verify + Refinement Loop

**Verification:** if browser tooling is available (requires wiring), screenshot the page at
375px, 768px, and 1440px and inspect for text overflow, layout collapse, and responsive
breakage; fix before presenting. Otherwise note that automated viewport verification was
skipped and rely on the user's browser.

**Refinement loop:**

```
LOOP:
  1. Point the user at the preview URL/file.
  2. If an approved mockup exists, show it alongside for comparison.
  3. Ask: "What needs to change? Say 'done' when satisfied."
  4. "done" / "ship it" / "looks good" → exit loop, go to Step 5.
  5. Apply feedback with targeted Edit-tool changes on the HTML file
     (do NOT regenerate the whole file — surgical edits only; the user may
     have made manual edits that must be preserved).
  6. Brief summary of what changed (2-3 lines max).
  7. Re-verify if screenshots are available. Go to LOOP.
```

Maximum 10 iterations; after 10, ask whether to continue or call it done.

---

## Step 5: Save & Next Steps

**Design token extraction:** if no `DESIGN.md` exists, offer to create one from the generated
HTML — extract CSS custom properties (colors, spacing, font sizes), font families/weights,
palette roles, spacing scale, border radii, shadows. If accepted, write `DESIGN.md` to the
repo root so future design work is style-consistent automatically.

**Save metadata** (`finalized.json` next to the HTML): source mockup/plan, mode, html file,
layout strategy, framework, iteration count, date, screen name.

**Next steps:** A) Copy the HTML/component into the codebase. B) Iterate more. C) Done —
use as reference.

---

## Important Rules

- **Source-of-truth fidelity over code elegance.** When an approved mockup exists, match it.
  If that requires `width: 312px` instead of a grid class, that's correct. Cleanup happens
  later during component extraction. In plan-driven/freeform mode, the user's refinement
  feedback is the source of truth.
- **Surgical edits in the refinement loop.** Edit tool for targeted changes, never a full
  rewrite that clobbers the user's manual edits.
- **Real content only.** Extract from the mockup, use plan content, or generate realistic
  domain content. Never placeholders.
- **One page per invocation.** For multi-page designs, run once per page.
- **Self-contained output.** The vanilla HTML file must open and look right with zero build
  steps and zero network dependencies beyond fonts.
