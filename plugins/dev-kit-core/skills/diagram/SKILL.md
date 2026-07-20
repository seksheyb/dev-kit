---
name: diagram
description: English in, editable diagram out. Authors mermaid from a plain-English request, renders it to SVG/PNG, and keeps the .mmd source as the editable single source of truth (plus an optional .excalidraw scene for flowcharts). Use when asked to "draw a diagram", "diagram this", "make a flowchart", "visualize the architecture", or turn mermaid into an image.
---

# /diagram — English in, editable diagram out

Every run emits an **artifact set**, never a dead pixel dump:

| Artifact | What it's for |
|---|---|
| `<slug>.mmd` | the mermaid source — the LLM-friendly, editable interchange format |
| `<slug>.svg` + `<slug>.png` | crisp vector for docs + raster for chat/issues/READMEs |
| `<slug>.excalidraw` | optional editable scene (flowcharts only) — open at excalidraw.com, move a box, keep working |

## Step 1 — Author the diagram

Write mermaid for the user's request. Rules:

- **Flowcharts (`graph LR`/`graph TD`) are the sweet spot.** Prefer `graph LR` for pipelines/flows, `graph TD` for hierarchies.
- Sequence, state, gantt, and other mermaid types render to SVG/PNG fine, but excalidraw conversion only supports flowcharts — for other types skip the `.excalidraw` artifact and tell the user: "sequence diagrams render but aren't excalidraw-editable (converter limitation — flowcharts are)."
- Keep node labels short; put detail in edge labels. 5-15 nodes is the readable range. If the ask needs more, split into multiple diagrams and say why.

Decide the output directory: `./diagrams/` when the cwd is a git repo (artifacts the user can commit), else a temp directory. Derive `<slug>` from the diagram's subject (kebab-case, ≤40 chars).

Write the mermaid source to `<outdir>/<slug>.mmd` first — the source is the single source of truth for every later edit.

## Step 2 — Render SVG + PNG

Use whichever renderer is available, in this order:

1. **mermaid-cli (`mmdc`)** — the standard offline renderer:
   ```bash
   npx -y @mermaid-js/mermaid-cli -i <outdir>/<slug>.mmd -o <outdir>/<slug>.svg
   npx -y @mermaid-js/mermaid-cli -i <outdir>/<slug>.mmd -o <outdir>/<slug>.png --scale 3
   ```
   (`--scale 3` gives a print-quality raster of a ~6.5in placement.)
2. **A rendering surface that supports mermaid natively** (e.g. an artifact/preview pane that renders ` ```mermaid ` fences) — deliver the fence there and still keep the `.mmd` on disk.
3. Neither available → show the mermaid source in a fenced block so the user can paste it into mermaid.live, and say exactly what to install (`npm i -g @mermaid-js/mermaid-cli`). Do not pretend a render happened.

If the mermaid render returns a parse error, show it, fix the mermaid, and retry — never hand the user a broken source file.

**Excalidraw scene (optional, flowcharts only):** producing `<slug>.excalidraw` requires the mermaid-to-excalidraw converter (requires wiring: `@excalidraw/mermaid-to-excalidraw` in a small node script or a browser page). If it isn't wired, skip the artifact and mention that flowcharts can be made excalidraw-editable if the user wants it set up.

## Step 3 — Show and deliver

1. Read the PNG with the Read tool so the user sees the diagram inline.
2. List the artifact paths.
3. If an `.excalidraw` was produced, one-line editability note: "opens at excalidraw.com (File → Open) — edit there and I can re-render."
4. **Iteration loop:** when the user wants changes, edit the `.mmd` source and re-run Step 2. Never edit the SVG/PNG directly — they are derived artifacts.

## Rules

- **Never ship without rendering** (or, if rendering is impossible, without saying so and surfacing the install command). A `.mmd` file alone is not a diagram.
- For diagrams destined for a markdown doc or PDF pipeline that renders ` ```mermaid ` fences natively, embed the mermaid source rather than the PNG — it stays diffable and editable.

## Completion status

- DONE — source + SVG/PNG delivered and shown (plus `.excalidraw` or its limitation note).
- BLOCKED — no renderer available; install/setup command surfaced.
